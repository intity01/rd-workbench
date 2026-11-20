//! Connects the workspace's import queue to the supervised document worker.
//! Owned by the app; `pump` and `poll` run once per frame.

use crate::{storage, worker};
use eframe::egui;
use rdw_core::Workspace;
use rdw_core::ipc::{Event, ExtractMode, Supervisor};
use rdw_core::model::{ProcStatus, SourceId};
use std::collections::{HashMap, HashSet, VecDeque};
use std::path::PathBuf;

const LOG_LINES: usize = 200;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WorkerStatus {
    /// Not started yet (it starts with the first import).
    Off,
    Starting,
    Ready(Vec<String>),
    Restarting(String),
    /// Stopped for good until the user restarts it.
    Down(String),
}

#[derive(Debug)]
pub struct Extraction {
    sup: Option<Supervisor>,
    pub status: WorkerStatus,
    pub mode: ExtractMode,
    /// Latest progress per running import.
    pub progress: HashMap<SourceId, (u8, String)>,
    /// Why an import failed (kept for this session).
    pub errors: HashMap<SourceId, String>,
    pub log: VecDeque<String>,
    sent: HashSet<SourceId>,
    cancelling: HashSet<SourceId>,
}

impl Default for Extraction {
    fn default() -> Self {
        Self {
            sup: None,
            status: WorkerStatus::Off,
            mode: ExtractMode::Fast,
            progress: HashMap::new(),
            errors: HashMap::new(),
            log: VecDeque::new(),
            sent: HashSet::new(),
            cancelling: HashSet::new(),
        }
    }
}

fn out_dir() -> PathBuf {
    storage::data_dir().unwrap_or_else(std::env::temp_dir).join("extracted")
}

impl Extraction {
    /// Sends newly queued imports to the worker, starting it if needed.
    pub fn pump(&mut self, ws: &Workspace, ctx: &egui::Context) {
        let new: Vec<_> = ws.queued_imports().into_iter().filter(|(id, _)| !self.sent.contains(id)).collect();
        if new.is_empty() || matches!(self.status, WorkerStatus::Down(_)) {
            return;
        }
        if self.sup.is_none() {
            match worker::spec() {
                Ok(spec) => {
                    let ctx = ctx.clone();
                    self.sup = Some(Supervisor::start(spec, move || ctx.request_repaint()));
                    self.status = WorkerStatus::Starting;
                }
                Err(e) => {
                    self.status = WorkerStatus::Down(e);
                    return;
                }
            }
        }
        let Some(sup) = &self.sup else { return };
        let dir = out_dir();
        for (id, path) in new {
            let out = dir.join(format!("{}.md", id.as_str()));
            sup.extract(id.as_str(), path, out.to_string_lossy(), self.mode);
            self.errors.remove(&id);
            self.sent.insert(id);
        }
    }

    /// Applies worker events to the workspace.
    pub fn poll(&mut self, ws: &mut Workspace) {
        let Some(sup) = &self.sup else { return };
        for event in sup.poll() {
            match event {
                Event::Ready { capabilities, .. } => self.status = WorkerStatus::Ready(capabilities),
                Event::Progress { task_id, percent, message } => {
                    let id = SourceId::new(task_id);
                    ws.set_import_status(&id, ProcStatus::Running);
                    self.progress.insert(id, (percent, message));
                }
                Event::Done { task_id, markdown_path, pages } => {
                    let id = SourceId::new(task_id);
                    ws.finish_import(&id, markdown_path, pages);
                    self.settle(&id);
                }
                Event::Failed { task_id, error } => {
                    let id = SourceId::new(task_id);
                    let cancelled = self.cancelling.contains(&id);
                    ws.set_import_status(
                        &id,
                        if cancelled { ProcStatus::Cancelled } else { ProcStatus::Failed },
                    );
                    self.settle(&id);
                    if !cancelled {
                        self.errors.insert(id, error);
                    }
                }
                Event::Log { level, message } => self.push_log(format!("[{level}] {message}")),
                Event::Exited { reason, restarting } => {
                    self.push_log(format!("[exit] {reason}"));
                    self.status = if restarting {
                        WorkerStatus::Restarting(reason)
                    } else {
                        WorkerStatus::Down(reason)
                    };
                }
            }
        }
    }

    fn settle(&mut self, id: &SourceId) {
        self.progress.remove(id);
        self.sent.remove(id);
        self.cancelling.remove(id);
    }

    fn push_log(&mut self, line: String) {
        if self.log.len() == LOG_LINES {
            self.log.pop_front();
        }
        self.log.push_back(line);
    }

    /// True while the worker holds this import (queued or running).
    pub fn is_active(&self, id: &SourceId) -> bool {
        self.sent.contains(id)
    }

    pub fn cancel(&mut self, id: &SourceId) {
        if let Some(sup) = &self.sup
            && self.sent.contains(id)
        {
            self.cancelling.insert(id.clone());
            sup.cancel(id.as_str());
        }
    }

    /// Stops the worker and re-queues what it held; the next pump starts a fresh one.
    pub fn restart(&mut self, ws: &mut Workspace) {
        self.sup = None; // dropping the supervisor shuts the worker down
        for id in self.sent.drain() {
            ws.set_import_status(&id, ProcStatus::Queued);
        }
        self.cancelling.clear();
        self.progress.clear();
        self.status = WorkerStatus::Off;
    }
}

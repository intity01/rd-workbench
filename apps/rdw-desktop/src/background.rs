//! Runs blocking network work on worker threads and hands results back to the
//! UI thread, which drains them once per frame. The UI never blocks on I/O.

use eframe::egui;
use rdw_core::model::{ProjectId, SourceId};
use rdw_core::providers::citation::WorkRecord;
use std::sync::mpsc::{Receiver, Sender, channel};

/// What a finished job reports.
#[derive(Debug)]
pub enum Outcome {
    /// Assistant reply (or error text) for the chat pane.
    Chat(Result<String, String>),
    /// DOI lookup: `source` is set when re-checking an existing source,
    /// otherwise a new source is created in `project`.
    Doi { doi: String, source: Option<SourceId>, project: ProjectId, result: Result<WorkRecord, String> },
}

#[derive(Debug)]
pub struct Jobs {
    tx: Sender<Outcome>,
    rx: Receiver<Outcome>,
    pub running: usize,
}

impl Default for Jobs {
    fn default() -> Self {
        let (tx, rx) = channel();
        Self { tx, rx, running: 0 }
    }
}

impl Jobs {
    /// Runs `work` on a new thread; repaints the UI when it finishes.
    pub fn spawn(&mut self, ctx: &egui::Context, work: impl FnOnce() -> Outcome + Send + 'static) {
        let tx = self.tx.clone();
        let ctx = ctx.clone();
        self.running += 1;
        std::thread::spawn(move || {
            // The receiver only disappears when the app is closing.
            let _ = tx.send(work());
            ctx.request_repaint();
        });
    }

    /// Finished results since the last call.
    pub fn drain(&mut self) -> Vec<Outcome> {
        let done: Vec<_> = self.rx.try_iter().collect();
        self.running = self.running.saturating_sub(done.len());
        done
    }
}

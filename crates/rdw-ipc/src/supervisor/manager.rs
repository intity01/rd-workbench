//! The supervisor's single-threaded state machine. See the module docs in
//! `supervisor/mod.rs` for the policy it implements.

use super::process::{self, Running};
use super::{Command, Event, WorkerSpec};
use crate::{ExtractMode, PROTOCOL_VERSION, Request, Response};
use std::collections::VecDeque;
use std::sync::mpsc::{Receiver, RecvTimeoutError, Sender};
use std::time::{Duration, Instant};

const MAX_BACKOFF: Duration = Duration::from_secs(10);
const SHUTDOWN_GRACE: Duration = Duration::from_secs(2);
const IDLE_WAIT: Duration = Duration::from_secs(3600);

#[derive(Debug)]
pub(crate) enum Input {
    Cmd(Command),
    Line(u64, Response),
    Stderr(u64, String),
    Eof(u64),
}

#[derive(Debug)]
struct Task {
    id: String,
    path: String,
    mode: ExtractMode,
}

struct Manager {
    spec: WorkerSpec,
    inbox: Sender<Input>,
    out: Sender<Event>,
    notify: Box<dyn Fn() + Send>,
    worker: Option<Running>,
    generation: u64,
    ready: bool,
    handshake_deadline: Option<Instant>,
    restart_at: Option<Instant>,
    failures: u32,
    gave_up: bool,
    queue: VecDeque<Task>,
    /// Running task and the last time the worker said anything about it.
    current: Option<(Task, Instant)>,
}

pub(crate) fn run(
    spec: WorkerSpec,
    rx: Receiver<Input>,
    inbox: Sender<Input>,
    out: Sender<Event>,
    notify: Box<dyn Fn() + Send>,
) {
    let mut m = Manager {
        spec,
        inbox,
        out,
        notify,
        worker: None,
        generation: 0,
        ready: false,
        handshake_deadline: None,
        restart_at: Some(Instant::now()),
        failures: 0,
        gave_up: false,
        queue: VecDeque::new(),
        current: None,
    };
    loop {
        m.pump();
        let wait = m.next_deadline().map_or(IDLE_WAIT, |d| d.saturating_duration_since(Instant::now()));
        match rx.recv_timeout(wait) {
            Ok(Input::Cmd(Command::Shutdown)) | Err(RecvTimeoutError::Disconnected) => break,
            Ok(Input::Cmd(Command::Extract { task_id, path, mode })) if m.gave_up => {
                let _ = (path, mode);
                m.fail(task_id, "worker unavailable");
            }
            Ok(Input::Cmd(Command::Extract { task_id, path, mode })) => {
                m.queue.push_back(Task { id: task_id, path, mode });
            }
            Ok(Input::Cmd(Command::Cancel(id))) => m.cancel(&id),
            Ok(Input::Line(g, msg)) if g == m.generation => m.on_response(msg),
            Ok(Input::Stderr(g, line)) if g == m.generation => {
                m.emit(Event::Log { level: "stderr".into(), message: line });
            }
            Ok(Input::Eof(g)) if g == m.generation => m.crash("worker exited".into()),
            Ok(_) | Err(RecvTimeoutError::Timeout) => {}
        }
        m.check_deadlines();
    }
    m.stop();
}

impl Manager {
    fn emit(&self, e: Event) {
        if self.out.send(e).is_ok() {
            (self.notify)();
        }
    }

    fn fail(&self, task_id: String, error: impl Into<String>) {
        self.emit(Event::Failed { task_id, error: error.into() });
    }

    fn next_deadline(&self) -> Option<Instant> {
        let idle = self.current.as_ref().map(|(_, t)| *t + self.spec.idle_timeout);
        let restart = self.restart_at.filter(|_| !self.gave_up);
        [self.handshake_deadline, idle, restart].into_iter().flatten().min()
    }

    /// Launches the worker when due, and hands it the next task when idle.
    fn pump(&mut self) {
        if self.worker.is_none() && self.restart_at.is_some_and(|t| t <= Instant::now()) && !self.gave_up {
            self.restart_at = None;
            self.generation += 1;
            match process::spawn(&self.spec, self.generation, &self.inbox) {
                Ok(w) => {
                    self.worker = Some(w);
                    self.handshake_deadline = Some(Instant::now() + self.spec.handshake_timeout);
                }
                Err(e) => self.crash(format!("could not start {}: {e}", self.spec.program.display())),
            }
        }
        if !self.ready || self.current.is_some() {
            return;
        }
        let Some(task) = self.queue.pop_front() else { return };
        let req = Request::Extract { task_id: task.id.clone(), path: task.path.clone(), mode: task.mode };
        let sent = self.worker.as_mut().map(|w| w.send(&req));
        self.current = Some((task, Instant::now()));
        if !matches!(sent, Some(Ok(()))) {
            self.crash("could not write to worker".into());
        }
    }

    fn on_response(&mut self, msg: Response) {
        match msg {
            Response::Ready { protocol, worker, capabilities } => {
                if protocol != PROTOCOL_VERSION {
                    self.give_up(format!("protocol mismatch: core {PROTOCOL_VERSION}, {worker} {protocol}"));
                    return;
                }
                self.ready = true;
                self.handshake_deadline = None;
                self.emit(Event::Ready { worker, capabilities });
            }
            Response::Progress { task_id, percent, message } => {
                if let Some((_, seen)) = self.current.as_mut().filter(|(t, _)| t.id == task_id) {
                    *seen = Instant::now();
                }
                self.emit(Event::Progress { task_id, percent, message });
            }
            Response::Done { task_id, markdown_path, pages } => {
                self.finish(&task_id);
                self.failures = 0;
                self.emit(Event::Done { task_id, markdown_path, pages });
            }
            Response::Failed { task_id, error } => {
                self.finish(&task_id);
                self.emit(Event::Failed { task_id, error });
            }
            Response::Log { level, message } => self.emit(Event::Log { level, message }),
        }
    }

    fn finish(&mut self, task_id: &str) {
        if self.current.as_ref().is_some_and(|(t, _)| t.id == task_id) {
            self.current = None;
        }
    }

    fn check_deadlines(&mut self) {
        let now = Instant::now();
        if self.handshake_deadline.is_some_and(|d| d <= now) {
            self.crash("no handshake from worker".into());
        } else if let Some((task, _)) =
            self.current.take_if(|(_, seen)| *seen + self.spec.idle_timeout <= now)
        {
            let secs = self.spec.idle_timeout.as_secs_f32();
            self.fail(task.id, format!("timed out after {secs:.1} s without progress"));
            self.crash("task timed out".into());
        }
    }

    fn cancel(&mut self, id: &str) {
        if let Some(pos) = self.queue.iter().position(|t| t.id == id) {
            let task = self.queue.remove(pos).expect("position is in range");
            self.fail(task.id, "cancelled");
        } else if let Some((task, _)) = self.current.take_if(|(t, _)| t.id == id) {
            // Workers run one task at a time: restart to interrupt it.
            self.discard_worker();
            self.restart_at = Some(Instant::now());
            self.fail(task.id, "cancelled");
        }
    }

    fn discard_worker(&mut self) {
        if let Some(w) = self.worker.take() {
            w.kill();
        }
        self.ready = false;
        self.handshake_deadline = None;
        self.generation += 1;
    }

    /// Unexpected stop: fail the running task, then restart with backoff.
    fn crash(&mut self, reason: String) {
        self.discard_worker();
        if let Some((task, _)) = self.current.take() {
            self.fail(task.id, format!("worker crashed: {reason}"));
        }
        self.failures += 1;
        if self.failures > self.spec.max_restarts {
            self.give_up(format!("{reason} (gave up after {} restarts)", self.spec.max_restarts));
            return;
        }
        let exp = self.failures.saturating_sub(1).min(16);
        let delay = self.spec.backoff.saturating_mul(1 << exp).min(MAX_BACKOFF);
        self.restart_at = Some(Instant::now() + delay);
        self.emit(Event::Exited { reason, restarting: true });
    }

    fn give_up(&mut self, reason: String) {
        self.discard_worker();
        self.gave_up = true;
        self.restart_at = None;
        for task in std::mem::take(&mut self.queue) {
            self.fail(task.id, "worker unavailable");
        }
        self.emit(Event::Exited { reason, restarting: false });
    }

    fn stop(&mut self) {
        if let Some(w) = self.worker.take() {
            w.shutdown(SHUTDOWN_GRACE);
        }
    }
}

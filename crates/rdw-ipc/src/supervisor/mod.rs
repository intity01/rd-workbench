//! Worker supervision: spawn a worker process, check the `hello`/`ready`
//! handshake, run one task at a time, and recover on its behalf.
//!
//! * **Crash** (exit, broken pipe, bad handshake): the running task fails, the
//!   worker restarts with exponential backoff, queued tasks wait for it.
//! * **Timeout**: a task that reports nothing for `idle_timeout` fails and the
//!   worker is restarted (a stuck extraction cannot be interrupted otherwise).
//! * **Cancel**: a queued task is dropped; the running task is stopped by
//!   restarting the worker, since workers process one task at a time.
//! * **Give up**: after `max_restarts` consecutive failures, or on a protocol
//!   version mismatch, the worker stays down and queued tasks fail.
//!
//! All of this runs on one manager thread; callers talk to it through channels
//! and never block.

mod manager;
mod process;

use crate::ExtractMode;
use std::path::PathBuf;
use std::sync::mpsc::{Receiver, Sender, channel};
use std::thread::JoinHandle;
use std::time::Duration;

/// How to launch a worker and how patient to be with it.
#[derive(Debug, Clone)]
pub struct WorkerSpec {
    pub program: PathBuf,
    pub args: Vec<String>,
    pub env: Vec<(String, String)>,
    /// Time allowed between launch and the `ready` reply.
    pub handshake_timeout: Duration,
    /// A running task fails if the worker says nothing about it for this long.
    pub idle_timeout: Duration,
    /// Consecutive failed launches / crashes before giving up.
    pub max_restarts: u32,
    /// First restart delay; doubles per consecutive failure, capped at 10 s.
    pub backoff: Duration,
}

impl WorkerSpec {
    pub fn new(program: impl Into<PathBuf>) -> Self {
        Self {
            program: program.into(),
            args: Vec::new(),
            env: Vec::new(),
            handshake_timeout: Duration::from_secs(15),
            idle_timeout: Duration::from_secs(120),
            max_restarts: 5,
            backoff: Duration::from_millis(250),
        }
    }

    #[must_use]
    pub fn arg(mut self, arg: impl Into<String>) -> Self {
        self.args.push(arg.into());
        self
    }

    #[must_use]
    pub fn env(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.env.push((key.into(), value.into()));
        self
    }
}

/// Everything the supervisor reports, in order.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Event {
    Ready {
        worker: String,
        capabilities: Vec<String>,
    },
    Progress {
        task_id: String,
        percent: u8,
        message: String,
    },
    Done {
        task_id: String,
        markdown_path: String,
        pages: u32,
    },
    Failed {
        task_id: String,
        error: String,
    },
    /// Worker log line, or a line it wrote to stderr (`level` = "stderr").
    Log {
        level: String,
        message: String,
    },
    /// The worker stopped unexpectedly. `restarting` is false once it gave up.
    Exited {
        reason: String,
        restarting: bool,
    },
}

#[derive(Debug)]
pub(crate) enum Command {
    Extract { task_id: String, path: String, out_path: String, mode: ExtractMode },
    Cancel(String),
    Shutdown,
}

/// Handle to a supervised worker. Dropping it shuts the worker down.
pub struct Supervisor {
    tx: Sender<manager::Input>,
    events: Receiver<Event>,
    thread: Option<JoinHandle<()>>,
}

impl std::fmt::Debug for Supervisor {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Supervisor").finish_non_exhaustive()
    }
}

impl Supervisor {
    /// Starts the manager thread and launches the worker. `notify` is called
    /// after each event is queued (e.g. to request a UI repaint).
    pub fn start(spec: WorkerSpec, notify: impl Fn() + Send + 'static) -> Self {
        let (tx, rx) = channel();
        let (out, events) = channel();
        let inbox = tx.clone();
        let thread = std::thread::Builder::new()
            .name("rdw-worker-supervisor".into())
            .spawn(move || manager::run(spec, rx, inbox, out, Box::new(notify)))
            .expect("spawning a thread only fails when the OS is out of resources");
        Self { tx, events, thread: Some(thread) }
    }

    /// Queues a document for extraction to Markdown at `out_path`.
    pub fn extract(
        &self,
        task_id: impl Into<String>,
        path: impl Into<String>,
        out_path: impl Into<String>,
        mode: ExtractMode,
    ) {
        let (task_id, path, out_path) = (task_id.into(), path.into(), out_path.into());
        self.command(Command::Extract { task_id, path, out_path, mode });
    }

    /// Cancels a queued or running task; a `Failed` event confirms it.
    pub fn cancel(&self, task_id: impl Into<String>) {
        self.command(Command::Cancel(task_id.into()));
    }

    /// Events since the last call, without blocking.
    pub fn poll(&self) -> Vec<Event> {
        self.events.try_iter().collect()
    }

    /// Waits up to `timeout` for the next event.
    pub fn next_event(&self, timeout: Duration) -> Option<Event> {
        self.events.recv_timeout(timeout).ok()
    }

    fn command(&self, cmd: Command) {
        // The manager only stops after `Shutdown`, which needs `&mut self`.
        let _ = self.tx.send(manager::Input::Cmd(cmd));
    }
}

impl Drop for Supervisor {
    fn drop(&mut self) {
        let _ = self.tx.send(manager::Input::Cmd(Command::Shutdown));
        if let Some(t) = self.thread.take() {
            let _ = t.join();
        }
    }
}

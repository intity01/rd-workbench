//! One worker process: spawn it, pump its stdout / stderr into the manager's
//! inbox, write requests to its stdin, and stop it.

use super::WorkerSpec;
use super::manager::Input;
use crate::codec::{self, CodecError};
use crate::{PROTOCOL_VERSION, Request, Response};
use std::io::{BufRead, BufReader};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::mpsc::Sender;
use std::time::{Duration, Instant};

#[derive(Debug)]
pub(super) struct Running {
    child: Child,
    stdin: ChildStdin,
}

/// Launches the worker and sends `hello`. `generation` tags every line it
/// produces, so output from a replaced process is ignored.
pub(super) fn spawn(spec: &WorkerSpec, generation: u64, inbox: &Sender<Input>) -> std::io::Result<Running> {
    let mut cmd = Command::new(&spec.program);
    cmd.args(&spec.args)
        .envs(spec.env.iter().map(|(k, v)| (k, v)))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(windows)]
    {
        // CREATE_NO_WINDOW: the GUI build has no console; don't flash one.
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000);
    }
    let mut child = cmd.spawn()?;
    let (Some(stdin), Some(stdout), Some(stderr)) =
        (child.stdin.take(), child.stdout.take(), child.stderr.take())
    else {
        let _ = child.kill();
        return Err(std::io::Error::other("worker pipes were not created"));
    };

    let tx = inbox.clone();
    std::thread::spawn(move || {
        let mut reader = BufReader::new(stdout);
        loop {
            match codec::recv::<_, Response>(&mut reader) {
                Ok(Some(msg)) => {
                    if tx.send(Input::Line(generation, msg)).is_err() {
                        return;
                    }
                }
                Err(CodecError::Json(e)) => {
                    let _ = tx.send(Input::Stderr(generation, format!("unreadable message: {e}")));
                }
                Ok(None) | Err(CodecError::Io(_)) => {
                    let _ = tx.send(Input::Eof(generation));
                    return;
                }
            }
        }
    });

    let tx = inbox.clone();
    std::thread::spawn(move || {
        for line in BufReader::new(stderr).lines() {
            let Ok(line) = line else { return };
            if tx.send(Input::Stderr(generation, line)).is_err() {
                return;
            }
        }
    });

    let mut running = Running { child, stdin };
    running.send(&Request::Hello { protocol: PROTOCOL_VERSION }).map_err(std::io::Error::other)?;
    Ok(running)
}

impl Running {
    pub(super) fn send(&mut self, req: &Request) -> Result<(), CodecError> {
        codec::send(&mut self.stdin, req)
    }

    /// Stops the process immediately.
    pub(super) fn kill(mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }

    /// Asks the worker to exit, then kills it if it is still running after `grace`.
    pub(super) fn shutdown(mut self, grace: Duration) {
        let _ = self.send(&Request::Shutdown);
        let deadline = Instant::now() + grace;
        while Instant::now() < deadline {
            if matches!(self.child.try_wait(), Ok(Some(_))) {
                return;
            }
            std::thread::sleep(Duration::from_millis(20));
        }
        self.kill();
    }
}

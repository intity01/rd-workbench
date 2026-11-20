//! A worker that misbehaves on request, for supervisor tests.
//!
//! `RDW_FAKE_MODE`: `normal` | `crash` | `crash-once` | `hang` | `bad-protocol` | `silent`.
//! `crash-once` crashes on the first extract only, remembering it via the file
//! named by `RDW_FAKE_MARKER`.

use rdw_ipc::codec::{recv, send};
use rdw_ipc::{PROTOCOL_VERSION, Request, Response};
use std::io::{BufReader, stdin, stdout};
use std::path::PathBuf;
use std::time::Duration;

fn main() {
    let mode = std::env::var("RDW_FAKE_MODE").unwrap_or_else(|_| "normal".into());
    let mut input = BufReader::new(stdin());
    let mut out = stdout();
    while let Ok(Some(req)) = recv::<_, Request>(&mut input) {
        let reply = match req {
            Request::Hello { .. } if mode == "silent" => continue,
            Request::Hello { .. } => Response::Ready {
                protocol: if mode == "bad-protocol" { PROTOCOL_VERSION + 1 } else { PROTOCOL_VERSION },
                worker: "fake".into(),
                capabilities: vec!["text".into()],
            },
            Request::Extract { task_id, out_path, .. } => {
                match mode.as_str() {
                    "crash" => std::process::exit(3),
                    "crash-once" => {
                        let marker = PathBuf::from(std::env::var("RDW_FAKE_MARKER").expect("marker path"));
                        if !marker.exists() {
                            std::fs::write(&marker, b"crashed").expect("write marker");
                            std::process::exit(3);
                        }
                    }
                    "hang" => loop {
                        std::thread::sleep(Duration::from_secs(60));
                    },
                    _ => {}
                }
                let progress =
                    Response::Progress { task_id: task_id.clone(), percent: 50, message: "half".into() };
                if send(&mut out, &progress).is_err() {
                    return;
                }
                Response::Done { task_id, markdown_path: out_path, pages: 1 }
            }
            Request::Cancel { .. } => continue,
            Request::Shutdown => return,
        };
        if send(&mut out, &reply).is_err() {
            return;
        }
    }
}

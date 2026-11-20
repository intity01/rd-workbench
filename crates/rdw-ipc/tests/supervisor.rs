//! Supervisor behaviour against a scriptable fake worker, plus one run of the
//! real Python worker when a suitable interpreter is installed.

use rdw_ipc::{Event, ExtractMode, Supervisor, WorkerSpec};
use std::path::PathBuf;
use std::time::{Duration, Instant};

const WAIT: Duration = Duration::from_secs(20);

fn fake(mode: &str) -> WorkerSpec {
    let mut spec = WorkerSpec::new(env!("CARGO_BIN_EXE_rdw-fake-worker")).env("RDW_FAKE_MODE", mode);
    spec.backoff = Duration::from_millis(50);
    spec
}

/// Waits for the first event matching `want`, failing with everything seen.
fn until(sup: &Supervisor, want: impl Fn(&Event) -> bool) -> Event {
    let deadline = Instant::now() + WAIT;
    let mut seen = Vec::new();
    while let Some(e) = sup.next_event(deadline.saturating_duration_since(Instant::now())) {
        if want(&e) {
            return e;
        }
        seen.push(e);
    }
    panic!("expected event not seen; got {seen:#?}");
}

fn is_ready(e: &Event) -> bool {
    matches!(e, Event::Ready { .. })
}

fn failed_with(id: &'static str, text: &'static str) -> impl Fn(&Event) -> bool {
    move |e| matches!(e, Event::Failed { task_id, error } if task_id == id && error.contains(text))
}

fn done(id: &'static str) -> impl Fn(&Event) -> bool {
    move |e| matches!(e, Event::Done { task_id, .. } if task_id == id)
}

#[test]
fn handshake_then_tasks_complete_in_order() {
    let sup = Supervisor::start(fake("normal"), || {});
    let Event::Ready { worker, capabilities } = until(&sup, is_ready) else { unreachable!() };
    assert_eq!((worker.as_str(), capabilities), ("fake", vec!["text".to_owned()]));
    sup.extract("A", "a.txt", "a.md", ExtractMode::Fast);
    sup.extract("B", "b.txt", "b.md", ExtractMode::Fast);
    let first = until(&sup, |e| matches!(e, Event::Done { .. }));
    assert_eq!(first, Event::Done { task_id: "A".into(), markdown_path: "a.md".into(), pages: 1 });
    until(&sup, done("B"));
}

#[test]
fn crash_fails_running_task_then_restarts_for_the_next() {
    let marker = std::env::temp_dir().join(format!("rdw-crash-once-{}", std::process::id()));
    let _ = std::fs::remove_file(&marker);
    let spec = fake("crash-once").env("RDW_FAKE_MARKER", marker.to_string_lossy());
    let sup = Supervisor::start(spec, || {});
    sup.extract("A", "a.txt", "a.md", ExtractMode::Fast);
    sup.extract("B", "b.txt", "b.md", ExtractMode::Fast);
    until(&sup, failed_with("A", "worker crashed"));
    until(&sup, |e| matches!(e, Event::Exited { restarting: true, .. }));
    until(&sup, done("B"));
    let _ = std::fs::remove_file(&marker);
}

#[test]
fn silent_task_times_out() {
    let mut spec = fake("hang");
    spec.idle_timeout = Duration::from_millis(300);
    let sup = Supervisor::start(spec, || {});
    sup.extract("A", "a.txt", "a.md", ExtractMode::Fast);
    until(&sup, failed_with("A", "timed out"));
    until(&sup, is_ready); // restarted and usable again
}

#[test]
fn cancel_running_and_queued_tasks() {
    let sup = Supervisor::start(fake("hang"), || {});
    until(&sup, is_ready);
    sup.extract("A", "a.txt", "a.md", ExtractMode::Fast);
    sup.extract("B", "b.txt", "b.md", ExtractMode::Fast);
    sup.cancel("B");
    until(&sup, failed_with("B", "cancelled"));
    sup.cancel("A");
    until(&sup, failed_with("A", "cancelled"));
    until(&sup, is_ready);
}

#[test]
fn protocol_mismatch_gives_up_and_rejects_new_work() {
    let sup = Supervisor::start(fake("bad-protocol"), || {});
    let e = until(&sup, |e| matches!(e, Event::Exited { .. }));
    assert!(matches!(e, Event::Exited { ref reason, restarting: false } if reason.contains("protocol")));
    sup.extract("A", "a.txt", "a.md", ExtractMode::Fast);
    until(&sup, failed_with("A", "unavailable"));
}

#[test]
fn missing_handshake_counts_as_crash_until_giving_up() {
    let mut spec = fake("silent");
    spec.handshake_timeout = Duration::from_millis(200);
    spec.max_restarts = 1;
    let sup = Supervisor::start(spec, || {});
    until(&sup, |e| matches!(e, Event::Exited { restarting: true, .. }));
    let e = until(&sup, |e| matches!(e, Event::Exited { restarting: false, .. }));
    assert!(matches!(e, Event::Exited { ref reason, .. } if reason.contains("handshake")));
}

#[test]
fn missing_program_gives_up() {
    let mut spec = WorkerSpec::new("rdw-no-such-worker-binary");
    spec.max_restarts = 0;
    let sup = Supervisor::start(spec, || {});
    let e = until(&sup, |e| matches!(e, Event::Exited { .. }));
    assert!(
        matches!(e, Event::Exited { ref reason, restarting: false } if reason.contains("could not start"))
    );
}

/// A Python ≥ 3.11 on PATH, if any.
fn python() -> Option<&'static str> {
    ["python3", "python"].into_iter().find(|p| {
        std::process::Command::new(p)
            .args(["-c", "import sys; sys.exit(sys.version_info < (3, 11))"])
            .output()
            .is_ok_and(|o| o.status.success())
    })
}

#[test]
fn real_python_worker_extracts_text() {
    let Some(py) = python() else {
        eprintln!("skipped: no Python 3.11+ on PATH");
        return;
    };
    let workers = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../workers/python");
    let doc = std::env::temp_dir().join(format!("rdw-ipc-test-{}.md", std::process::id()));
    std::fs::write(&doc, "# ทดสอบ\n\nhello").unwrap();
    let spec = WorkerSpec::new(py).arg("-m").arg("rdw_worker").env("PYTHONPATH", workers.to_string_lossy());
    let sup = Supervisor::start(spec, || {});
    until(&sup, is_ready);
    let out = doc.with_extension("out.md");
    sup.extract("P", doc.to_string_lossy(), out.to_string_lossy(), ExtractMode::Fast);
    let Event::Done { markdown_path, .. } = until(&sup, done("P")) else { unreachable!() };
    assert_eq!(std::fs::read_to_string(&markdown_path).unwrap(), "# ทดสอบ\n\nhello");
    let _ = std::fs::remove_file(&doc);
    let _ = std::fs::remove_file(&markdown_path);
}

//! Finds the Python document worker.
//!
//! * `RDW_PYTHON` — interpreter to use (default `python` on Windows, `python3` elsewhere).
//! * `RDW_WORKER_DIR` — folder containing the `rdw_worker` package. Otherwise the
//!   app looks for `workers/python` next to the executable and in its parent
//!   folders, which covers both a source checkout (`target/debug/rdw`) and an
//!   install that ships the folder beside the binary.

use rdw_core::ipc::WorkerSpec;
use std::path::{Path, PathBuf};

const PACKAGE_MARKER: &str = "rdw_worker/__main__.py";

fn default_python() -> &'static str {
    if cfg!(windows) { "python" } else { "python3" }
}

fn find_worker_dir() -> Option<PathBuf> {
    if let Some(dir) = std::env::var_os("RDW_WORKER_DIR") {
        return Some(PathBuf::from(dir));
    }
    let exe = std::env::current_exe().ok()?;
    exe.ancestors().map(|a| a.join("workers").join("python")).find(|c| c.join(PACKAGE_MARKER).is_file())
}

/// PYTHONPATH with `dir` first, keeping whatever the user already had.
fn python_path(dir: &Path) -> String {
    let existing = std::env::var_os("PYTHONPATH");
    let paths = std::iter::once(dir.to_path_buf()).chain(existing.iter().flat_map(std::env::split_paths));
    std::env::join_paths(paths).map_or_else(|_| dir.display().to_string(), |p| p.to_string_lossy().into())
}

/// How to launch the worker, or why it cannot be found.
pub fn spec() -> Result<WorkerSpec, String> {
    let dir = find_worker_dir()
        .filter(|d| d.join(PACKAGE_MARKER).is_file())
        .ok_or("worker files not found: set RDW_WORKER_DIR to the folder that contains rdw_worker")?;
    let python = std::env::var("RDW_PYTHON").unwrap_or_else(|_| default_python().to_owned());
    Ok(WorkerSpec::new(python)
        .arg("-m")
        .arg("rdw_worker")
        .env("PYTHONPATH", python_path(&dir))
        .env("PYTHONUTF8", "1"))
}

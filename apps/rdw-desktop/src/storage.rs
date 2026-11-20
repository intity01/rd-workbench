//! Where the app keeps its data on disk.

use directories::ProjectDirs;
use rdw_core::store::SqliteStore;
use std::path::PathBuf;

/// `%APPDATA%\rd-workbench\data` on Windows, `~/.local/share/rd-workbench` on Linux,
/// `~/Library/Application Support/rd-workbench` on macOS.
pub fn data_dir() -> Option<PathBuf> {
    ProjectDirs::from("", "", "rd-workbench").map(|d| d.data_dir().to_path_buf())
}

/// Opens the database file, falling back to an in-memory store (with a status
/// message) so the app still starts when the disk is unavailable.
pub fn open_store() -> (SqliteStore, Option<String>) {
    let attempt = data_dir()
        .ok_or_else(|| "no data directory".to_owned())
        .and_then(|dir| std::fs::create_dir_all(&dir).map(|()| dir).map_err(|e| e.to_string()))
        .and_then(|dir| SqliteStore::open(dir.join("workbench.db")).map_err(|e| e.to_string()));
    match attempt {
        Ok(store) => (store, None),
        Err(e) => (
            SqliteStore::open_in_memory().expect("in-memory SQLite always opens"),
            Some(format!("Storage unavailable ({e}); changes will not be saved")),
        ),
    }
}

//! Persistence boundary.
//!
//! Everything above this crate talks to [`Store`]. Two backends:
//! [`MemoryStore`] for tests and [`SqliteStore`] (WAL mode) for the app.
//!
//! Entities are stored as JSON documents keyed by id, plus the columns needed
//! for lookups (`project_id`). That keeps migrations cheap while the model is
//! still moving; hot paths (full-text, vectors) get dedicated indexes later.

mod memory;
mod sqlite;

pub use memory::MemoryStore;
pub use sqlite::SqliteStore;

use rdw_model::{Edge, GNode, Project, ProjectId, Source, SourceId};

#[derive(Debug, thiserror::Error)]
pub enum StoreError {
    #[error("sqlite: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("encoding: {0}")]
    Json(#[from] serde_json::Error),
}

pub type Result<T> = std::result::Result<T, StoreError>;

/// One project's graph topology.
pub type GraphSnapshot = (Vec<GNode>, Vec<Edge>);

pub trait Store {
    fn load_projects(&self) -> Result<Vec<Project>>;
    fn save_project(&mut self, project: &Project) -> Result<()>;
    /// Deletes a project together with its sources and graph.
    fn delete_project(&mut self, id: &ProjectId) -> Result<()>;

    fn load_sources(&self) -> Result<Vec<Source>>;
    fn save_source(&mut self, source: &Source) -> Result<()>;
    fn delete_source(&mut self, id: &SourceId) -> Result<()>;

    /// Replaces the stored topology of one project.
    fn save_graph(&mut self, project: &ProjectId, nodes: &[GNode], edges: &[Edge]) -> Result<()>;
    fn load_graph(&self, project: &ProjectId) -> Result<GraphSnapshot>;

    /// Small key/value area for settings and lookup caches (namespaced keys, e.g. `doi:10.1/x`).
    fn kv_get(&self, key: &str) -> Result<Option<String>>;
    fn kv_put(&mut self, key: &str, value: &str) -> Result<()>;
}

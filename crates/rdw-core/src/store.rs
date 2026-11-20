//! Persistence boundary.
//!
//! Phase 1 adds a SQLite (WAL) implementation that stores graph snapshots and
//! entities; Tantivy and a vector index sit next to it. The UI and services only
//! ever see this trait.

use rdw_model::{Edge, GNode, Project, ProjectId};
use std::collections::HashMap;

#[derive(Debug, thiserror::Error)]
pub enum StoreError {
    #[error("storage backend: {0}")]
    Backend(String),
}

pub trait Store {
    fn save_project(&mut self, project: &Project) -> Result<(), StoreError>;
    fn load_projects(&self) -> Result<Vec<Project>, StoreError>;
    /// Persists the whole topology of one project as a snapshot.
    fn save_graph(&mut self, project: &ProjectId, nodes: &[GNode], edges: &[Edge]) -> Result<(), StoreError>;
    fn load_graph(&self, project: &ProjectId) -> Result<(Vec<GNode>, Vec<Edge>), StoreError>;
}

/// Volatile store for tests and the first UI iterations.
#[derive(Debug, Default)]
pub struct MemoryStore {
    projects: HashMap<ProjectId, Project>,
    graphs: HashMap<ProjectId, (Vec<GNode>, Vec<Edge>)>,
}

impl Store for MemoryStore {
    fn save_project(&mut self, project: &Project) -> Result<(), StoreError> {
        self.projects.insert(project.id.clone(), project.clone());
        Ok(())
    }

    fn load_projects(&self) -> Result<Vec<Project>, StoreError> {
        let mut v: Vec<_> = self.projects.values().cloned().collect();
        v.sort_by(|a, b| a.id.cmp(&b.id));
        Ok(v)
    }

    fn save_graph(&mut self, project: &ProjectId, nodes: &[GNode], edges: &[Edge]) -> Result<(), StoreError> {
        self.graphs.insert(project.clone(), (nodes.to_vec(), edges.to_vec()));
        Ok(())
    }

    fn load_graph(&self, project: &ProjectId) -> Result<(Vec<GNode>, Vec<Edge>), StoreError> {
        Ok(self.graphs.get(project).cloned().unwrap_or_default())
    }
}

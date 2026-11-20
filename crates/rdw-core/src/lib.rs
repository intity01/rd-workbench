//! Core orchestrator.
//!
//! Owns the [`Workspace`] (everything the UI renders) and exposes intent-level
//! operations. The UI never mutates entities directly; it calls methods here.
//! Persistence goes through the [`store::Store`] trait (SQLite in the app).

mod nodes;
mod persist;
mod projects;
pub mod search;
mod seed;
pub mod sources;
pub use rdw_store as store;
mod workspace;

pub use rdw_graph as graph;
pub use rdw_ipc as ipc;
pub use rdw_model as model;
pub use rdw_providers as providers;
pub use workspace::{Workspace, WorkspaceError};

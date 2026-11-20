//! Domain entities shared by every layer.
//!
//! Ported 1:1 from `prototype/web/src/app/data/types.ts`. This crate has no I/O
//! and no UI dependencies: it is the vocabulary the rest of the workspace speaks.

mod graph;
mod ids;
mod project;
mod source;
mod task;

pub use graph::{Edge, GNode, NodeType, Rel};
pub use ids::{EdgeId, NodeId, ProjectId, SourceId, TaskId};
pub use project::{Language, Project, ProjectMode, ProjectStatus};
pub use source::{CheckState, Citation, Note, ProcStatus, Source, SourceType, VerifyState};
pub use task::{Task, TaskKind};

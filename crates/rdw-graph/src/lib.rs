//! In-memory knowledge graph.
//!
//! The topology of the open project lives in RAM as adjacency lists so that
//! multi-hop traversal stays in the micro-second range. Persistence (SQLite
//! snapshots) is a separate concern handled by `rdw-core`; this crate never
//! touches the disk.

mod graph;
mod history;

pub use graph::{Graph, GraphError};
pub use history::History;

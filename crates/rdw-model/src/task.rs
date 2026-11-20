use crate::{ProcStatus, ProjectId, SourceId, TaskId};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TaskKind {
    /// Document extraction handled by a worker process.
    Extract,
    /// Any other background job (indexing, verification, export…).
    Job,
}

/// A unit of background work shown on the Tasks screen.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Task {
    pub id: TaskId,
    pub name: String,
    pub worker: String,
    pub kind: TaskKind,
    pub status: ProcStatus,
    /// Completion, 0–100.
    pub progress: u8,
    pub project_id: Option<ProjectId>,
    pub source_id: Option<SourceId>,
    pub logs: Vec<String>,
    pub error: Option<String>,
}

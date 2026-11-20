use crate::{EdgeId, NodeId, ProjectId, SourceId};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NodeType {
    Claim,
    Evidence,
    Counter,
    Question,
    Decision,
    Topic,
    Concept,
    Document,
}

/// Relation carried by an [`Edge`].
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Rel {
    Supports,
    Contradicts,
    DependsOn,
    Refines,
    LeadsTo,
}

/// A node on the knowledge map.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct GNode {
    pub id: NodeId,
    pub kind: NodeType,
    pub label: String,
    pub desc: String,
    /// Canvas position, in logical points.
    pub x: f32,
    pub y: f32,
    pub project_id: ProjectId,
    pub source_id: Option<SourceId>,
    pub page: Option<u32>,
}

/// A directed relation `from → to`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Edge {
    pub id: EdgeId,
    pub from: NodeId,
    pub to: NodeId,
    pub rel: Rel,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rel_serialises_like_the_prototype() {
        assert_eq!(serde_json::to_string(&Rel::DependsOn).unwrap(), "\"depends_on\"");
        assert_eq!(serde_json::to_string(&NodeType::Claim).unwrap(), "\"claim\"");
    }
}

use crate::ProjectId;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProjectStatus {
    Active,
    Planning,
    Draft,
    Paused,
    Completed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Language {
    Thai,
    English,
    Mixed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProjectMode {
    LocalFirst,
    CloudAssisted,
}

/// A research project: the root that owns sources, notes and graph nodes.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Project {
    pub id: ProjectId,
    pub name: String,
    pub description: String,
    pub category: String,
    pub status: ProjectStatus,
    /// Completion, 0–100.
    pub progress: u8,
    /// ISO-8601 date of the last change.
    pub updated: String,
    pub question: String,
    pub objectives: String,
    pub hypotheses: String,
    pub scope: String,
    pub exclusions: String,
    pub output: String,
    pub tags: Vec<String>,
    pub icon: String,
    pub language: Language,
    pub mode: ProjectMode,
    pub citation_sources: Vec<String>,
}

impl Project {
    /// A new, empty project with sensible defaults.
    pub fn new(id: ProjectId, name: impl Into<String>) -> Self {
        Self {
            id,
            name: name.into(),
            description: String::new(),
            category: String::new(),
            status: ProjectStatus::Draft,
            progress: 0,
            updated: String::new(),
            question: String::new(),
            objectives: String::new(),
            hypotheses: String::new(),
            scope: String::new(),
            exclusions: String::new(),
            output: String::new(),
            tags: Vec::new(),
            icon: "cpu".into(),
            language: Language::Mixed,
            mode: ProjectMode::LocalFirst,
            citation_sources: vec!["OpenAlex".into(), "Crossref".into()],
        }
    }
}

impl ProjectStatus {
    pub const ALL: [ProjectStatus; 5] =
        [Self::Active, Self::Planning, Self::Draft, Self::Paused, Self::Completed];
}

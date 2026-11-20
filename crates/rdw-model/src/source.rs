use crate::{ProjectId, SourceId};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SourceType {
    Pdf,
    Markdown,
    Url,
    BibTex,
    Document,
    /// A report produced by an external deep-research product and imported by the user.
    ResearchReport,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProcStatus {
    Queued,
    Running,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum VerifyState {
    Matched,
    NeedsReview,
    Mismatch,
    NotChecked,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CheckState {
    Found,
    Matched,
    NeedsReview,
    Mismatch,
    NotChecked,
}

/// An imported document (paper, web page, report…).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Source {
    pub id: SourceId,
    pub project_id: ProjectId,
    pub title: String,
    pub kind: SourceType,
    pub status: ProcStatus,
    pub verify: VerifyState,
    pub authors: String,
    pub year: Option<u16>,
    pub doi: Option<String>,
    pub url: Option<String>,
    pub pages: u32,
    pub abstract_text: String,
    /// Original file on disk, for imported documents.
    #[serde(default)]
    pub file_path: Option<String>,
    /// Extracted Markdown, inside the app's data folder.
    #[serde(default)]
    pub text_path: Option<String>,
}

/// A free-form note, optionally anchored to a page of a source.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub project_id: ProjectId,
    pub title: String,
    pub body: String,
    pub source_id: Option<SourceId>,
    pub page: Option<u32>,
    pub tags: Vec<String>,
}

/// A quoted passage that backs a claim.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Citation {
    pub id: String,
    pub source_id: SourceId,
    pub page: u32,
    pub quote: String,
}

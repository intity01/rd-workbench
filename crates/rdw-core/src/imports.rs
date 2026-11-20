//! Import intents: a file becomes a queued source, the worker's progress moves
//! it through `Running` to `Completed` / `Failed` / `Cancelled`.

use crate::{Workspace, WorkspaceError};
use rdw_model::{ProcStatus, ProjectId, Source, SourceId, SourceType, VerifyState};
use std::path::Path;

/// Source type for a file; `report` marks an exported deep-research report.
pub fn kind_for_path(path: &Path, report: bool) -> SourceType {
    if report {
        return SourceType::ResearchReport;
    }
    let ext = path.extension().and_then(|e| e.to_str()).unwrap_or_default().to_ascii_lowercase();
    match ext.as_str() {
        "pdf" => SourceType::Pdf,
        "md" | "markdown" | "txt" => SourceType::Markdown,
        "bib" => SourceType::BibTex,
        _ => SourceType::Document,
    }
}

impl Workspace {
    /// Adds `path` to `project` as a queued source titled after the file name.
    pub fn queue_import(
        &mut self,
        project: &ProjectId,
        path: &Path,
        report: bool,
    ) -> Result<SourceId, WorkspaceError> {
        if self.project(project).is_none() {
            return Err(WorkspaceError::MissingProject(project.clone()));
        }
        let title =
            path.file_stem().map_or_else(|| path.display().to_string(), |s| s.to_string_lossy().into());
        let id = SourceId::new(self.fresh_id("S"));
        self.sources.push(Source {
            id: id.clone(),
            project_id: project.clone(),
            title,
            kind: kind_for_path(path, report),
            status: ProcStatus::Queued,
            verify: VerifyState::NotChecked,
            authors: String::new(),
            year: None,
            doi: None,
            url: None,
            pages: 0,
            abstract_text: String::new(),
            file_path: Some(path.display().to_string()),
            text_path: None,
        });
        self.dirty = true;
        Ok(id)
    }

    fn source_mut(&mut self, id: &SourceId) -> Option<&mut Source> {
        let s = self.sources.iter_mut().find(|s| &s.id == id)?;
        self.dirty = true;
        Some(s)
    }

    pub fn set_import_status(&mut self, id: &SourceId, status: ProcStatus) -> Option<()> {
        self.source_mut(id)?.status = status;
        Some(())
    }

    /// Records a finished extraction.
    pub fn finish_import(&mut self, id: &SourceId, text_path: String, pages: u32) -> Option<()> {
        let s = self.source_mut(id)?;
        s.status = ProcStatus::Completed;
        s.text_path = Some(text_path);
        s.pages = pages;
        Some(())
    }

    /// Puts a failed or cancelled import back in the queue.
    pub fn retry_import(&mut self, id: &SourceId) -> Option<()> {
        let s = self.source_mut(id)?;
        if !matches!(s.status, ProcStatus::Failed | ProcStatus::Cancelled) || s.file_path.is_none() {
            return None;
        }
        s.status = ProcStatus::Queued;
        Some(())
    }

    /// Imports waiting for the worker: (source, original file).
    pub fn queued_imports(&self) -> Vec<(SourceId, String)> {
        let queued = self.sources.iter().filter(|s| s.status == ProcStatus::Queued);
        queued.filter_map(|s| Some((s.id.clone(), s.file_path.clone()?))).collect()
    }

    /// Removes a source; returns it so the caller can delete its extracted text.
    pub fn remove_source(&mut self, id: &SourceId) -> Option<Source> {
        let pos = self.sources.iter().position(|s| &s.id == id)?;
        let removed = self.sources.remove(pos);
        self.deleted_sources.push(removed.id.clone());
        self.dirty = true;
        Some(removed)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rdw_store::{MemoryStore, Store};

    fn ws() -> (Workspace, ProjectId) {
        let mut ws = Workspace::empty();
        let p = ws.create_project("Imports");
        (ws, p)
    }

    #[test]
    fn kinds_follow_extension_unless_report() {
        assert_eq!(kind_for_path(Path::new("a.PDF"), false), SourceType::Pdf);
        assert_eq!(kind_for_path(Path::new("n.md"), false), SourceType::Markdown);
        assert_eq!(kind_for_path(Path::new("x.docx"), false), SourceType::Document);
        assert_eq!(kind_for_path(Path::new("r.pdf"), true), SourceType::ResearchReport);
    }

    #[test]
    fn import_lifecycle_and_retry() {
        let (mut ws, p) = ws();
        let id = ws.queue_import(&p, Path::new("/docs/Paper One.pdf"), false).unwrap();
        let s = ws.sources.iter().find(|s| s.id == id).unwrap();
        assert_eq!((s.title.as_str(), s.status), ("Paper One", ProcStatus::Queued));
        assert_eq!(ws.queued_imports().len(), 1);

        ws.set_import_status(&id, ProcStatus::Running);
        assert!(ws.queued_imports().is_empty());
        assert!(ws.retry_import(&id).is_none(), "only failed or cancelled imports retry");
        ws.set_import_status(&id, ProcStatus::Failed);
        ws.retry_import(&id).unwrap();
        ws.finish_import(&id, "x.md".into(), 7);
        let s = ws.sources.iter().find(|s| s.id == id).unwrap();
        assert_eq!((s.status, s.pages, s.text_path.as_deref()), (ProcStatus::Completed, 7, Some("x.md")));
    }

    #[test]
    fn unknown_project_is_rejected() {
        let (mut ws, _) = ws();
        assert!(ws.queue_import(&ProjectId::new("P-none"), Path::new("a.pdf"), false).is_err());
    }

    #[test]
    fn interrupted_import_requeues_and_removal_persists() {
        let mut store = MemoryStore::default();
        store.kv_put("meta:seeded", "1").unwrap();
        let (mut ws, p) = ws();
        let a = ws.queue_import(&p, Path::new("a.pdf"), false).unwrap();
        let b = ws.queue_import(&p, Path::new("b.pdf"), false).unwrap();
        ws.set_import_status(&a, ProcStatus::Running);
        ws.save(&mut store).unwrap();
        ws.remove_source(&b).unwrap();
        ws.save(&mut store).unwrap();

        let reopened = Workspace::open(&mut store).unwrap();
        assert_eq!(reopened.queued_imports(), vec![(a, "a.pdf".to_owned())]);
    }
}

//! Source intents and citation verification helpers (cache + title comparison).

use crate::search::tokenize;
use crate::{Workspace, WorkspaceError};
use rdw_model::{ProcStatus, ProjectId, Source, SourceId, SourceType, VerifyState};
use rdw_providers::citation::{WorkRecord, normalize_doi};
use rdw_store::Store;
use std::collections::HashSet;

impl Workspace {
    /// Adds a source built from looked-up metadata; marked as verified.
    pub fn add_source_from_record(
        &mut self,
        project: &ProjectId,
        rec: &WorkRecord,
    ) -> Result<SourceId, WorkspaceError> {
        if self.project(project).is_none() {
            return Err(WorkspaceError::MissingProject(project.clone()));
        }
        let id = SourceId::new(self.fresh_id("S"));
        self.sources.push(Source {
            id: id.clone(),
            project_id: project.clone(),
            title: rec.title.clone(),
            kind: SourceType::Document,
            status: ProcStatus::Completed,
            verify: VerifyState::Matched,
            authors: rec.authors.join(", "),
            year: rec.year,
            doi: rec.doi.clone(),
            url: rec.doi.as_ref().map(|d| format!("https://doi.org/{d}")),
            pages: 0,
            abstract_text: String::new(),
            file_path: None,
            text_path: None,
        });
        self.dirty = true;
        Ok(id)
    }

    /// Sets or clears a source's DOI (normalised) and resets its verification.
    pub fn set_source_doi(&mut self, id: &SourceId, raw: &str) -> Option<()> {
        let s = self.sources.iter_mut().find(|s| &s.id == id)?;
        s.doi = normalize_doi(raw);
        s.verify = VerifyState::NotChecked;
        self.dirty = true;
        Some(())
    }

    /// Records the outcome of a citation check.
    pub fn set_verify(&mut self, id: &SourceId, state: VerifyState) -> Option<()> {
        let s = self.sources.iter_mut().find(|s| &s.id == id)?;
        s.verify = state;
        self.dirty = true;
        Some(())
    }
}

const CACHE_PREFIX: &str = "doi:";

/// Cached metadata for a DOI, if this machine has looked it up before.
pub fn cached_work(store: &dyn Store, doi: &str) -> Option<WorkRecord> {
    let raw = store.kv_get(&format!("{CACHE_PREFIX}{doi}")).ok()??;
    serde_json::from_str(&raw).ok()
}

pub fn remember_work(store: &mut dyn Store, rec: &WorkRecord) {
    if let (Some(doi), Ok(json)) = (&rec.doi, serde_json::to_string(rec)) {
        // A failed cache write only costs a repeat lookup later.
        let _ = store.kv_put(&format!("{CACHE_PREFIX}{doi}"), &json);
    }
}

/// Compares the title we hold with the registry's title by word overlap.
/// ≥ 0.8 Jaccard → Matched, ≥ 0.4 → Needs Review, otherwise Mismatch.
pub fn compare_titles(ours: &str, theirs: &str) -> VerifyState {
    let a: HashSet<String> = tokenize(ours).into_iter().collect();
    let b: HashSet<String> = tokenize(theirs).into_iter().collect();
    if a.is_empty() || b.is_empty() {
        return VerifyState::NeedsReview;
    }
    #[allow(clippy::cast_precision_loss)]
    let score = a.intersection(&b).count() as f32 / a.union(&b).count() as f32;
    match score {
        s if s >= 0.8 => VerifyState::Matched,
        s if s >= 0.4 => VerifyState::NeedsReview,
        _ => VerifyState::Mismatch,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rdw_providers::citation::CitationSource;
    use rdw_store::MemoryStore;

    fn rec() -> WorkRecord {
        WorkRecord {
            source: CitationSource::OpenAlex,
            doi: Some("10.1/x".into()),
            title: "Process isolation for desktop tools".into(),
            year: Some(2024),
            authors: vec!["A".into()],
        }
    }

    #[test]
    fn title_comparison_bands() {
        assert_eq!(compare_titles("Process isolation for desktop tools", &rec().title), VerifyState::Matched);
        assert_eq!(
            compare_titles("Process isolation for desktop apps", &rec().title),
            VerifyState::NeedsReview
        );
        assert_eq!(compare_titles("Protein folding", &rec().title), VerifyState::Mismatch);
    }

    #[test]
    fn cache_round_trip_and_add_source() {
        let mut store = MemoryStore::default();
        assert!(cached_work(&store, "10.1/x").is_none());
        remember_work(&mut store, &rec());
        assert_eq!(cached_work(&store, "10.1/x").unwrap().title, rec().title);

        let mut ws = Workspace::with_seed();
        let id = ws.add_source_from_record(&"P-001".into(), &rec()).unwrap();
        ws.set_source_doi(&id, "https://doi.org/10.1/Y").unwrap();
        let s = ws.sources.iter().find(|s| s.id == id).unwrap();
        assert_eq!((s.doi.as_deref(), s.verify), (Some("10.1/y"), VerifyState::NotChecked));
    }
}

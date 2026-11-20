//! Project intents: create, update, delete (with cascade).

use crate::{Workspace, WorkspaceError};
use rdw_graph::Graph;
use rdw_model::{Project, ProjectId};

impl Workspace {
    /// Creates an empty project and returns its id.
    pub fn create_project(&mut self, name: &str) -> ProjectId {
        let id = ProjectId::new(self.fresh_id("P"));
        let mut project = Project::new(id.clone(), name.trim());
        project.updated = today();
        self.projects.push(project);
        self.dirty = true;
        id
    }

    /// Replaces a project's editable fields (matched by id).
    pub fn update_project(&mut self, mut project: Project) -> Result<(), WorkspaceError> {
        let slot = self
            .projects
            .iter_mut()
            .find(|p| p.id == project.id)
            .ok_or_else(|| WorkspaceError::MissingProject(project.id.clone()))?;
        project.updated = today();
        *slot = project;
        self.dirty = true;
        Ok(())
    }

    /// Deletes a project, its sources and its graph nodes. Not undoable: the
    /// UI must confirm first. Graph undo history is reset.
    pub fn delete_project(&mut self, id: &ProjectId) -> Result<(), WorkspaceError> {
        let before = self.projects.len();
        self.projects.retain(|p| &p.id != id);
        if self.projects.len() == before {
            return Err(WorkspaceError::MissingProject(id.clone()));
        }
        self.sources.retain(|s| &s.project_id != id);
        self.tasks.retain(|t| t.project_id.as_ref() != Some(id));

        let mut graph: Graph = self.graph().clone();
        let doomed: Vec<_> = graph.nodes().filter(|n| &n.project_id == id).map(|n| n.id.clone()).collect();
        for n in &doomed {
            graph.remove_node(n);
        }
        self.set_graph(graph);
        self.deleted_projects.push(id.clone());
        self.dirty = true;
        Ok(())
    }
}

/// Current UTC date as `YYYY-MM-DD` (no chrono dependency).
pub(crate) fn today() -> String {
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or_default();
    let days = i64::try_from(secs / 86_400).unwrap_or_default();
    // Civil-from-days (Howard Hinnant).
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = yoe + era * 400 + i64::from(m <= 2);
    format!("{y:04}-{m:02}-{d:02}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_update_delete_cascades() {
        let mut ws = Workspace::with_seed();
        let id = ws.create_project("  New study ");
        let mut p = ws.project(&id).unwrap().clone();
        assert_eq!(p.name, "New study");
        p.question = "Why?".into();
        ws.update_project(p).unwrap();
        assert_eq!(ws.project(&id).unwrap().question, "Why?");

        let seeded = ProjectId::from("P-001");
        let nodes_before = ws.graph().node_count();
        ws.delete_project(&seeded).unwrap();
        assert!(ws.project(&seeded).is_none());
        assert!(ws.graph().node_count() < nodes_before);
        assert!(ws.sources_of(&seeded).next().is_none());
        assert!(ws.delete_project(&seeded).is_err());
    }

    #[test]
    fn today_looks_like_a_date() {
        let t = today();
        assert_eq!(t.len(), 10);
        assert!(t.starts_with("20"));
    }
}

use crate::{GraphSnapshot, Result, Store};
use rdw_model::{Edge, GNode, Project, ProjectId, Source, SourceId};
use std::collections::{BTreeMap, HashMap};

/// Volatile store for tests.
#[derive(Debug, Default)]
pub struct MemoryStore {
    projects: BTreeMap<ProjectId, Project>,
    sources: BTreeMap<SourceId, Source>,
    graphs: HashMap<ProjectId, GraphSnapshot>,
    kv: HashMap<String, String>,
}

impl Store for MemoryStore {
    fn load_projects(&self) -> Result<Vec<Project>> {
        Ok(self.projects.values().cloned().collect())
    }

    fn save_project(&mut self, project: &Project) -> Result<()> {
        self.projects.insert(project.id.clone(), project.clone());
        Ok(())
    }

    fn delete_project(&mut self, id: &ProjectId) -> Result<()> {
        self.projects.remove(id);
        self.sources.retain(|_, s| &s.project_id != id);
        self.graphs.remove(id);
        Ok(())
    }

    fn load_sources(&self) -> Result<Vec<Source>> {
        Ok(self.sources.values().cloned().collect())
    }

    fn save_source(&mut self, source: &Source) -> Result<()> {
        self.sources.insert(source.id.clone(), source.clone());
        Ok(())
    }

    fn delete_source(&mut self, id: &SourceId) -> Result<()> {
        self.sources.remove(id);
        Ok(())
    }

    fn save_graph(&mut self, project: &ProjectId, nodes: &[GNode], edges: &[Edge]) -> Result<()> {
        self.graphs.insert(project.clone(), (nodes.to_vec(), edges.to_vec()));
        Ok(())
    }

    fn load_graph(&self, project: &ProjectId) -> Result<GraphSnapshot> {
        Ok(self.graphs.get(project).cloned().unwrap_or_default())
    }

    fn kv_get(&self, key: &str) -> Result<Option<String>> {
        Ok(self.kv.get(key).cloned())
    }

    fn kv_put(&mut self, key: &str, value: &str) -> Result<()> {
        self.kv.insert(key.to_owned(), value.to_owned());
        Ok(())
    }
}

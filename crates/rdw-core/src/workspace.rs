use rdw_graph::{Graph, GraphError, History};
use rdw_model::{Edge, EdgeId, GNode, NodeId, Project, ProjectId, Source, SourceId, Task};

const HISTORY_LIMIT: usize = 50;

#[derive(Debug, thiserror::Error)]
pub enum WorkspaceError {
    #[error(transparent)]
    Graph(#[from] GraphError),
    #[error("project {0} not found")]
    MissingProject(ProjectId),
    #[error(transparent)]
    Store(#[from] rdw_store::StoreError),
}

/// All state the UI renders, owned by the core.
#[derive(Debug)]
pub struct Workspace {
    pub projects: Vec<Project>,
    pub sources: Vec<Source>,
    pub tasks: Vec<Task>,
    graph: Graph,
    history: History<Graph>,
    pub(crate) next_id: u64,
    /// Set by every mutation; cleared by [`Workspace::save`].
    pub(crate) dirty: bool,
    pub(crate) deleted_projects: Vec<ProjectId>,
    pub(crate) deleted_sources: Vec<SourceId>,
}

impl Default for Workspace {
    fn default() -> Self {
        Self::empty()
    }
}

impl Workspace {
    pub fn empty() -> Self {
        Self {
            projects: Vec::new(),
            sources: Vec::new(),
            tasks: Vec::new(),
            graph: Graph::new(),
            history: History::new(HISTORY_LIMIT),
            next_id: 1,
            dirty: false,
            deleted_projects: Vec::new(),
            deleted_sources: Vec::new(),
        }
    }

    /// Fictional sample data mirroring the web prototype.
    pub fn with_seed() -> Self {
        crate::seed::build()
    }

    /// Replaces the graph and drops undo history (used on load and cascade deletes).
    pub(crate) fn set_graph(&mut self, graph: Graph) {
        self.graph = graph;
        self.history = History::new(HISTORY_LIMIT);
    }

    pub fn graph(&self) -> &Graph {
        &self.graph
    }

    pub fn project(&self, id: &ProjectId) -> Option<&Project> {
        self.projects.iter().find(|p| &p.id == id)
    }

    pub fn sources_of<'a>(&'a self, id: &'a ProjectId) -> impl Iterator<Item = &'a Source> + 'a {
        self.sources.iter().filter(move |s| &s.project_id == id)
    }

    pub fn is_dirty(&self) -> bool {
        self.dirty
    }

    pub(crate) fn fresh_id(&mut self, prefix: &str) -> String {
        let id = format!("{prefix}-{:04}", self.next_id);
        self.next_id += 1;
        id
    }

    /// Applies `change` to a copy of the graph; on success records undo history.
    pub(crate) fn mutate_graph<T>(
        &mut self,
        change: impl FnOnce(&mut Graph) -> Result<T, GraphError>,
    ) -> Result<T, WorkspaceError> {
        let mut next = self.graph.clone();
        let out = change(&mut next)?;
        let before = std::mem::replace(&mut self.graph, next);
        self.history.commit(before);
        self.dirty = true;
        Ok(out)
    }

    pub fn add_node(&mut self, mut node: GNode) -> Result<NodeId, WorkspaceError> {
        if self.project(&node.project_id).is_none() {
            return Err(WorkspaceError::MissingProject(node.project_id));
        }
        node.id = NodeId::new(self.fresh_id("K"));
        let id = node.id.clone();
        self.mutate_graph(|g| {
            g.upsert_node(node);
            Ok(())
        })?;
        Ok(id)
    }

    pub fn connect(&mut self, mut edge: Edge) -> Result<EdgeId, WorkspaceError> {
        edge.id = EdgeId::new(self.fresh_id("E"));
        let id = edge.id.clone();
        self.mutate_graph(|g| g.insert_edge(edge))?;
        Ok(id)
    }

    pub fn delete_node(&mut self, id: &NodeId) -> Result<(), WorkspaceError> {
        self.mutate_graph(|g| {
            g.remove_node(id).map(|_| ()).ok_or_else(|| GraphError::MissingNode(id.clone()))
        })
    }

    pub fn undo(&mut self) -> bool {
        let current = self.graph.clone();
        match self.history.undo(current) {
            Some(prev) => {
                self.graph = prev;
                self.dirty = true;
                true
            }
            None => false,
        }
    }

    pub fn redo(&mut self) -> bool {
        let current = self.graph.clone();
        match self.history.redo(current) {
            Some(next) => {
                self.graph = next;
                self.dirty = true;
                true
            }
            None => false,
        }
    }

    pub fn can_undo(&self) -> bool {
        self.history.can_undo()
    }

    pub fn can_redo(&self) -> bool {
        self.history.can_redo()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn delete_then_undo_restores_node() {
        let mut ws = Workspace::with_seed();
        let id = ws.graph().nodes().next().unwrap().id.clone();
        let before = ws.graph().node_count();
        ws.delete_node(&id).unwrap();
        assert_eq!(ws.graph().node_count(), before - 1);
        assert!(ws.undo());
        assert_eq!(ws.graph().node_count(), before);
        assert!(ws.redo());
        assert_eq!(ws.graph().node_count(), before - 1);
    }

    #[test]
    fn failed_mutation_leaves_no_history() {
        let mut ws = Workspace::with_seed();
        assert!(ws.delete_node(&"nope".into()).is_err());
        assert!(!ws.can_undo());
    }
}

//! Node edits used by the knowledge-map canvas.

use crate::{Workspace, WorkspaceError};
use rdw_graph::GraphError;
use rdw_model::NodeId;

impl Workspace {
    /// Moves a node (one undo step). Call once when a drag ends, not every frame.
    pub fn move_node(&mut self, id: &NodeId, x: f32, y: f32) -> Result<(), WorkspaceError> {
        self.edit_node(id, |n| {
            n.x = x;
            n.y = y;
        })
    }

    /// Changes a node's label and description (one undo step).
    pub fn rename_node(&mut self, id: &NodeId, label: &str, desc: &str) -> Result<(), WorkspaceError> {
        self.edit_node(id, |n| {
            n.label = label.trim().to_owned();
            n.desc = desc.to_owned();
        })
    }

    /// Removes one edge (one undo step).
    pub fn disconnect(&mut self, id: &rdw_model::EdgeId) -> Result<(), WorkspaceError> {
        self.mutate_graph(|g| {
            g.remove_edge(id).map(|_| ()).ok_or_else(|| GraphError::MissingNode(NodeId::new(id.as_str())))
        })
    }

    fn edit_node(
        &mut self,
        id: &NodeId,
        edit: impl FnOnce(&mut rdw_model::GNode),
    ) -> Result<(), WorkspaceError> {
        self.mutate_graph(|g| {
            let mut node = g.node(id).cloned().ok_or_else(|| GraphError::MissingNode(id.clone()))?;
            edit(&mut node);
            g.upsert_node(node);
            Ok(())
        })
    }
}

#[cfg(test)]
mod tests {
    use crate::Workspace;

    #[test]
    fn move_is_undoable() {
        let mut ws = Workspace::with_seed();
        let id = ws.graph().nodes().next().unwrap().id.clone();
        let x0 = ws.graph().node(&id).unwrap().x;
        ws.move_node(&id, x0 + 50.0, 0.0).unwrap();
        assert_eq!(ws.graph().node(&id).unwrap().x, x0 + 50.0);
        ws.undo();
        assert_eq!(ws.graph().node(&id).unwrap().x, x0);
        assert!(ws.move_node(&"missing".into(), 0.0, 0.0).is_err());
    }
}

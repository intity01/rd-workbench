use rdw_model::{Edge, EdgeId, GNode, NodeId};
use std::collections::{HashMap, HashSet, VecDeque};

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum GraphError {
    #[error("node {0} does not exist")]
    MissingNode(NodeId),
    #[error("edge {0} already exists")]
    DuplicateEdge(EdgeId),
    #[error("edge {from} -> {to} would create a cycle")]
    Cycle { from: NodeId, to: NodeId },
}

/// Nodes plus forward/backward adjacency lists.
#[derive(Debug, Clone, Default)]
pub struct Graph {
    nodes: HashMap<NodeId, GNode>,
    edges: HashMap<EdgeId, Edge>,
    out: HashMap<NodeId, Vec<EdgeId>>,
    inc: HashMap<NodeId, Vec<EdgeId>>,
}

impl Graph {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn from_parts(nodes: Vec<GNode>, edges: Vec<Edge>) -> Result<Self, GraphError> {
        let mut g = Self::new();
        for n in nodes {
            g.upsert_node(n);
        }
        for e in edges {
            g.insert_edge(e)?;
        }
        Ok(g)
    }

    pub fn node(&self, id: &NodeId) -> Option<&GNode> {
        self.nodes.get(id)
    }

    pub fn nodes(&self) -> impl Iterator<Item = &GNode> {
        self.nodes.values()
    }

    pub fn edges(&self) -> impl Iterator<Item = &Edge> {
        self.edges.values()
    }

    pub fn node_count(&self) -> usize {
        self.nodes.len()
    }

    pub fn edge_count(&self) -> usize {
        self.edges.len()
    }

    /// Inserts or replaces a node, keeping its edges.
    pub fn upsert_node(&mut self, node: GNode) {
        self.nodes.insert(node.id.clone(), node);
    }

    /// Removes a node and every edge attached to it.
    pub fn remove_node(&mut self, id: &NodeId) -> Option<GNode> {
        let node = self.nodes.remove(id)?;
        let attached: Vec<EdgeId> =
            self.out.remove(id).into_iter().chain(self.inc.remove(id)).flatten().collect();
        for e in attached {
            self.remove_edge(&e);
        }
        Some(node)
    }

    /// Inserts an edge without checking for cycles (knowledge maps may loop).
    pub fn insert_edge(&mut self, edge: Edge) -> Result<(), GraphError> {
        for end in [&edge.from, &edge.to] {
            if !self.nodes.contains_key(end) {
                return Err(GraphError::MissingNode(end.clone()));
            }
        }
        if self.edges.contains_key(&edge.id) {
            return Err(GraphError::DuplicateEdge(edge.id));
        }
        self.out.entry(edge.from.clone()).or_default().push(edge.id.clone());
        self.inc.entry(edge.to.clone()).or_default().push(edge.id.clone());
        self.edges.insert(edge.id.clone(), edge);
        Ok(())
    }

    /// Inserts an edge only if the graph stays acyclic (for reasoning DAGs).
    pub fn insert_edge_acyclic(&mut self, edge: Edge) -> Result<(), GraphError> {
        if edge.from == edge.to || self.reaches(&edge.to, &edge.from) {
            return Err(GraphError::Cycle { from: edge.from, to: edge.to });
        }
        self.insert_edge(edge)
    }

    pub fn remove_edge(&mut self, id: &EdgeId) -> Option<Edge> {
        let edge = self.edges.remove(id)?;
        if let Some(v) = self.out.get_mut(&edge.from) {
            v.retain(|e| e != id);
        }
        if let Some(v) = self.inc.get_mut(&edge.to) {
            v.retain(|e| e != id);
        }
        Some(edge)
    }

    /// Direct successors of `id`.
    pub fn successors(&self, id: &NodeId) -> impl Iterator<Item = &NodeId> {
        self.out.get(id).into_iter().flatten().filter_map(|e| self.edges.get(e).map(|e| &e.to))
    }

    /// Direct predecessors of `id`.
    pub fn predecessors(&self, id: &NodeId) -> impl Iterator<Item = &NodeId> {
        self.inc.get(id).into_iter().flatten().filter_map(|e| self.edges.get(e).map(|e| &e.from))
    }

    /// Breadth-first walk of everything reachable from `start`, up to `max_depth` hops.
    /// Returns `(node, depth)` pairs, excluding `start` itself.
    pub fn descendants(&self, start: &NodeId, max_depth: usize) -> Vec<(NodeId, usize)> {
        let mut seen = HashSet::from([start.clone()]);
        let mut queue = VecDeque::from([(start.clone(), 0usize)]);
        let mut found = Vec::new();
        while let Some((id, depth)) = queue.pop_front() {
            if depth == max_depth {
                continue;
            }
            for next in self.successors(&id) {
                if seen.insert(next.clone()) {
                    found.push((next.clone(), depth + 1));
                    queue.push_back((next.clone(), depth + 1));
                }
            }
        }
        found
    }

    /// True when `to` is reachable from `from`.
    pub fn reaches(&self, from: &NodeId, to: &NodeId) -> bool {
        from == to || self.descendants(from, usize::MAX).iter().any(|(n, _)| n == to)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rdw_model::{NodeType, Rel};

    fn node(id: &str) -> GNode {
        GNode {
            id: id.into(),
            kind: NodeType::Claim,
            label: id.to_owned(),
            desc: String::new(),
            x: 0.0,
            y: 0.0,
            project_id: "P-001".into(),
            source_id: None,
            page: None,
        }
    }

    fn edge(id: &str, from: &str, to: &str) -> Edge {
        Edge { id: id.into(), from: from.into(), to: to.into(), rel: Rel::Supports }
    }

    fn chain() -> Graph {
        let nodes = ["a", "b", "c", "d"].map(node).to_vec();
        let edges = vec![edge("e1", "a", "b"), edge("e2", "b", "c"), edge("e3", "c", "d")];
        Graph::from_parts(nodes, edges).unwrap()
    }

    #[test]
    fn descendants_respect_depth() {
        let g = chain();
        let d: Vec<_> = g.descendants(&"a".into(), 2).into_iter().map(|(n, _)| n.0).collect();
        assert_eq!(d, ["b", "c"]);
    }

    #[test]
    fn acyclic_insert_rejects_back_edge() {
        let mut g = chain();
        let err = g.insert_edge_acyclic(edge("e4", "d", "a")).unwrap_err();
        assert!(matches!(err, GraphError::Cycle { .. }));
        assert!(g.insert_edge(edge("e4", "d", "a")).is_ok(), "plain insert allows loops");
    }

    #[test]
    fn removing_a_node_cascades_edges() {
        let mut g = chain();
        g.remove_node(&"b".into());
        assert_eq!(g.edge_count(), 1);
        assert!(!g.reaches(&"a".into(), &"d".into()));
    }

    #[test]
    fn missing_endpoint_is_an_error() {
        let mut g = chain();
        let err = g.insert_edge(edge("x", "a", "zzz")).unwrap_err();
        assert_eq!(err, GraphError::MissingNode("zzz".into()));
    }
}

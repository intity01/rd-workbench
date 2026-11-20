//! Loading and saving a [`Workspace`] through any [`Store`].

use crate::{Workspace, WorkspaceError};
use rdw_graph::Graph;
use rdw_model::ProcStatus;
use rdw_store::Store;
use std::collections::HashSet;

const SEEDED_KEY: &str = "meta:seeded";

impl Workspace {
    /// Loads everything from `store`. On the very first run seeds the fictional
    /// sample data once (deleting every project later does not bring it back).
    pub fn open(store: &mut dyn Store) -> Result<Self, WorkspaceError> {
        if store.kv_get(SEEDED_KEY)?.is_none() {
            store.kv_put(SEEDED_KEY, "1")?;
            if store.load_projects()?.is_empty() {
                let mut ws = Self::with_seed();
                ws.dirty = true;
                ws.save(store)?;
                return Ok(ws);
            }
        }
        let projects = store.load_projects()?;
        let mut ws = Self::empty();
        ws.sources = store.load_sources()?;
        // An extraction interrupted by quitting the app runs again.
        for s in ws.sources.iter_mut().filter(|s| s.status == ProcStatus::Running) {
            s.status = ProcStatus::Queued;
        }

        let mut graph = Graph::new();
        let mut edges = Vec::new();
        for p in &projects {
            let (n, e) = store.load_graph(&p.id)?;
            n.into_iter().for_each(|node| graph.upsert_node(node));
            edges.extend(e);
        }
        // Skip edges whose endpoints vanished instead of failing the whole load.
        edges.into_iter().for_each(|e| drop(graph.insert_edge(e)));
        ws.projects = projects;
        ws.set_graph(graph);
        ws.next_id = ws.max_numeric_id() + 1;
        Ok(ws)
    }

    /// Writes all changes since the last save. Cheap no-op when nothing changed.
    pub fn save(&mut self, store: &mut dyn Store) -> Result<(), WorkspaceError> {
        if !self.dirty {
            return Ok(());
        }
        for id in self.deleted_projects.drain(..) {
            store.delete_project(&id)?;
        }
        for id in self.deleted_sources.drain(..) {
            store.delete_source(&id)?;
        }
        for p in &self.projects {
            store.save_project(p)?;
            let nodes: Vec<_> = self.graph().nodes().filter(|n| n.project_id == p.id).cloned().collect();
            let ids: HashSet<_> = nodes.iter().map(|n| &n.id).collect();
            let edges: Vec<_> = self.graph().edges().filter(|e| ids.contains(&e.from)).cloned().collect();
            store.save_graph(&p.id, &nodes, &edges)?;
        }
        for s in &self.sources {
            store.save_source(s)?;
        }
        self.dirty = false;
        Ok(())
    }

    /// Largest trailing number in any id, so fresh ids never collide after reload.
    fn max_numeric_id(&self) -> u64 {
        let trailing = |s: &str| -> u64 {
            let digits: String = s.chars().rev().take_while(char::is_ascii_digit).collect();
            digits.chars().rev().collect::<String>().parse().unwrap_or(0)
        };
        let ids = self.projects.iter().map(|p| trailing(p.id.as_str()));
        let nodes = self.graph().nodes().map(|n| trailing(n.id.as_str()));
        let edges = self.graph().edges().map(|e| trailing(e.id.as_str()));
        let sources = self.sources.iter().map(|s| trailing(s.id.as_str()));
        ids.chain(nodes).chain(edges).chain(sources).max().unwrap_or(0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rdw_store::SqliteStore;

    #[test]
    fn seed_save_reload_round_trip() {
        let mut store = SqliteStore::open_in_memory().unwrap();
        let mut ws = Workspace::open(&mut store).unwrap();
        assert!(!ws.is_dirty());
        let (nodes, edges) = (ws.graph().node_count(), ws.graph().edge_count());

        let id = ws.create_project("Reloaded");
        ws.delete_project(&"P-003".into()).unwrap();
        ws.save(&mut store).unwrap();

        let again = Workspace::open(&mut store).unwrap();
        assert_eq!(again.graph().node_count(), nodes);
        assert_eq!(again.graph().edge_count(), edges);
        assert!(again.project(&id).is_some());
        assert!(again.project(&"P-003".into()).is_none());
        assert!(again.next_id > 1);
    }
}

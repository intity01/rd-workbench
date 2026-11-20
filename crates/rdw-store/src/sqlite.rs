use crate::{GraphSnapshot, Result, Store};
use rdw_model::{Edge, GNode, Project, ProjectId, Source, SourceId};
use rusqlite::{Connection, OptionalExtension, params};
use serde::{Serialize, de::DeserializeOwned};
use std::path::Path;

/// Bumped when the schema changes; each step in [`MIGRATIONS`] runs once.
const MIGRATIONS: &[&str] = &[r"
    CREATE TABLE projects (id TEXT PRIMARY KEY, doc TEXT NOT NULL);
    CREATE TABLE sources  (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, doc TEXT NOT NULL);
    CREATE INDEX sources_project ON sources(project_id);
    CREATE TABLE graphs   (project_id TEXT PRIMARY KEY, nodes TEXT NOT NULL, edges TEXT NOT NULL,
                           saved_at INTEGER NOT NULL DEFAULT (unixepoch()));
    CREATE TABLE kv       (key TEXT PRIMARY KEY, value TEXT NOT NULL);
"];

/// SQLite in WAL mode: readers never block the single writer, crash-safe.
#[derive(Debug)]
pub struct SqliteStore {
    conn: Connection,
}

fn decode<T: DeserializeOwned>(json: &str) -> Result<T> {
    Ok(serde_json::from_str(json)?)
}

fn encode<T: Serialize>(value: &T) -> Result<String> {
    Ok(serde_json::to_string(value)?)
}

impl SqliteStore {
    pub fn open(path: impl AsRef<Path>) -> Result<Self> {
        Self::init(Connection::open(path)?)
    }

    pub fn open_in_memory() -> Result<Self> {
        Self::init(Connection::open_in_memory()?)
    }

    fn init(conn: Connection) -> Result<Self> {
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "synchronous", "NORMAL")?;
        conn.pragma_update(None, "foreign_keys", "ON")?;
        let version: i64 = conn.pragma_query_value(None, "user_version", |r| r.get(0))?;
        for (i, sql) in MIGRATIONS.iter().enumerate().skip(usize::try_from(version).unwrap_or(0)) {
            conn.execute_batch(&format!("BEGIN; {sql} PRAGMA user_version = {}; COMMIT;", i + 1))?;
        }
        Ok(Self { conn })
    }

    fn docs<T: DeserializeOwned>(&self, sql: &str) -> Result<Vec<T>> {
        let mut stmt = self.conn.prepare(sql)?;
        let rows = stmt.query_map([], |r| r.get::<_, String>(0))?;
        rows.map(|r| decode(&r?)).collect()
    }
}

impl Store for SqliteStore {
    fn load_projects(&self) -> Result<Vec<Project>> {
        self.docs("SELECT doc FROM projects ORDER BY id")
    }

    fn save_project(&mut self, project: &Project) -> Result<()> {
        self.conn.execute(
            "INSERT INTO projects (id, doc) VALUES (?1, ?2)
             ON CONFLICT(id) DO UPDATE SET doc = excluded.doc",
            params![project.id.as_str(), encode(project)?],
        )?;
        Ok(())
    }

    fn delete_project(&mut self, id: &ProjectId) -> Result<()> {
        let tx = self.conn.transaction()?;
        for table in ["sources", "graphs"] {
            tx.execute(&format!("DELETE FROM {table} WHERE project_id = ?1"), [id.as_str()])?;
        }
        tx.execute("DELETE FROM projects WHERE id = ?1", [id.as_str()])?;
        tx.commit()?;
        Ok(())
    }

    fn load_sources(&self) -> Result<Vec<Source>> {
        self.docs("SELECT doc FROM sources ORDER BY id")
    }

    fn save_source(&mut self, source: &Source) -> Result<()> {
        self.conn.execute(
            "INSERT INTO sources (id, project_id, doc) VALUES (?1, ?2, ?3)
             ON CONFLICT(id) DO UPDATE SET project_id = excluded.project_id, doc = excluded.doc",
            params![source.id.as_str(), source.project_id.as_str(), encode(source)?],
        )?;
        Ok(())
    }

    fn delete_source(&mut self, id: &SourceId) -> Result<()> {
        self.conn.execute("DELETE FROM sources WHERE id = ?1", [id.as_str()])?;
        Ok(())
    }

    fn save_graph(&mut self, project: &ProjectId, nodes: &[GNode], edges: &[Edge]) -> Result<()> {
        self.conn.execute(
            "INSERT INTO graphs (project_id, nodes, edges) VALUES (?1, ?2, ?3)
             ON CONFLICT(project_id) DO UPDATE
             SET nodes = excluded.nodes, edges = excluded.edges, saved_at = unixepoch()",
            params![project.as_str(), encode(&nodes)?, encode(&edges)?],
        )?;
        Ok(())
    }

    fn load_graph(&self, project: &ProjectId) -> Result<GraphSnapshot> {
        let row: Option<(String, String)> = self
            .conn
            .query_row("SELECT nodes, edges FROM graphs WHERE project_id = ?1", [project.as_str()], |r| {
                Ok((r.get(0)?, r.get(1)?))
            })
            .optional()?;
        match row {
            Some((n, e)) => Ok((decode(&n)?, decode(&e)?)),
            None => Ok(Default::default()),
        }
    }

    fn kv_get(&self, key: &str) -> Result<Option<String>> {
        Ok(self.conn.query_row("SELECT value FROM kv WHERE key = ?1", [key], |r| r.get(0)).optional()?)
    }

    fn kv_put(&mut self, key: &str, value: &str) -> Result<()> {
        self.conn.execute(
            "INSERT INTO kv (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![key, value],
        )?;
        Ok(())
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
            label: id.into(),
            desc: String::new(),
            x: 1.0,
            y: 2.0,
            project_id: "P-1".into(),
            source_id: None,
            page: None,
        }
    }

    #[test]
    fn graph_and_kv_round_trip_and_migrations_are_idempotent() {
        let dir = std::env::temp_dir().join(format!("rdw-store-test-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("t.db");
        {
            let mut s = SqliteStore::open(&path).unwrap();
            let edges = [Edge { id: "e".into(), from: "a".into(), to: "b".into(), rel: Rel::Supports }];
            s.save_graph(&"P-1".into(), &[node("a"), node("b")], &edges).unwrap();
            s.kv_put("doi:10.1/x", "{}").unwrap();
        }
        let s = SqliteStore::open(&path).unwrap(); // re-open: migrations must not re-run
        let (nodes, edges) = s.load_graph(&"P-1".into()).unwrap();
        assert_eq!((nodes.len(), edges.len()), (2, 1));
        assert_eq!(s.kv_get("doi:10.1/x").unwrap().as_deref(), Some("{}"));
        assert!(s.load_graph(&"none".into()).unwrap().0.is_empty());
        drop(s);
        let _ = std::fs::remove_dir_all(dir);
    }
}

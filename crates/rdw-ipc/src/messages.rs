use serde::{Deserialize, Serialize};

/// Bumped on any breaking change; checked during the `hello` handshake.
pub const PROTOCOL_VERSION: u32 = 2;

/// How hard the document worker should try.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExtractMode {
    /// Text layer only, CPU, fastest. For prose documents.
    Fast,
    /// Layout + OCR where needed. For ordinary scanned pages.
    Balanced,
    /// GPU / vision model for equations, complex tables, scans.
    Accurate,
}

/// Core → worker.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Request {
    Hello {
        protocol: u32,
    },
    /// Extract `path` to Markdown at `out_path` (chosen by the core, inside its data folder).
    Extract {
        task_id: String,
        path: String,
        out_path: String,
        mode: ExtractMode,
    },
    Cancel {
        task_id: String,
    },
    Shutdown,
}

/// Worker → core.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Response {
    Ready { protocol: u32, worker: String, capabilities: Vec<String> },
    Progress { task_id: String, percent: u8, message: String },
    Done { task_id: String, markdown_path: String, pages: u32 },
    Failed { task_id: String, error: String },
    Log { level: String, message: String },
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wire_format_is_tagged_snake_case() {
        let r = Request::Extract {
            task_id: "T1".into(),
            path: "a.pdf".into(),
            out_path: "T1.md".into(),
            mode: ExtractMode::Fast,
        };
        let json = serde_json::to_string(&r).unwrap();
        assert_eq!(
            json,
            r#"{"type":"extract","task_id":"T1","path":"a.pdf","out_path":"T1.md","mode":"fast"}"#
        );
    }
}

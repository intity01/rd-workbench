//! Fictional sample data (no real citations, DOIs or benchmarks), trimmed from
//! `prototype/web/src/app/data/*`.

use crate::Workspace;
use rdw_graph::Graph;
use rdw_model::*;

fn project(id: &str, name: &str, category: &str, status: ProjectStatus, progress: u8) -> Project {
    Project {
        id: id.into(),
        name: name.into(),
        description: String::new(),
        category: category.into(),
        status,
        progress,
        updated: "2026-11-20".into(),
        question: String::new(),
        objectives: String::new(),
        hypotheses: String::new(),
        scope: String::new(),
        exclusions: String::new(),
        output: String::new(),
        tags: Vec::new(),
        icon: "cpu".into(),
        language: Language::Mixed,
        mode: ProjectMode::LocalFirst,
        citation_sources: vec!["OpenAlex".into(), "Crossref".into()],
    }
}

fn node(id: &str, kind: NodeType, label: &str, x: f32, y: f32) -> GNode {
    GNode {
        id: id.into(),
        kind,
        label: label.into(),
        desc: String::new(),
        x,
        y,
        project_id: "P-001".into(),
        source_id: None,
        page: None,
    }
}

fn edge(id: &str, from: &str, to: &str, rel: Rel) -> Edge {
    Edge { id: id.into(), from: from.into(), to: to.into(), rel }
}

pub(crate) fn build() -> Workspace {
    let mut p1 =
        project("P-001", "Personal AI Research Workstation", "AI / Systems", ProjectStatus::Active, 68);
    p1.description = "Architecture study for a local-first research desktop: native UI, \
                      document workers, and an evidence graph."
        .into();
    p1.question = "How can a native desktop workstation process research documents locally \
                   while staying responsive?"
        .into();
    p1.scope = "Single-user desktop, local documents, optional cloud models.".into();
    p1.exclusions = "Team collaboration, billing, mobile clients.".into();
    p1.tags = vec!["rust".into(), "local-ai".into(), "architecture".into()];

    let mut p2 = project("P-002", "AI Audio Analysis & Alignment", "Audio / ML", ProjectStatus::Planning, 20);
    p2.icon = "audio".into();
    let mut p3 = project("P-003", "Embedded Sensor Dashboard", "IoT / Hardware", ProjectStatus::Draft, 5);
    p3.icon = "network".into();

    let sources = vec![Source {
        id: "S-001".into(),
        project_id: "P-001".into(),
        title: "Process isolation for interactive desktop tools (fictional)".into(),
        kind: SourceType::Pdf,
        status: ProcStatus::Completed,
        verify: VerifyState::NotChecked,
        authors: "A. Example, B. Sample".into(),
        year: Some(2025),
        doi: None,
        url: None,
        pages: 12,
        abstract_text: "Fictional abstract used for UI development.".into(),
    }];

    let nodes = vec![
        node("K-q1", NodeType::Question, "Keep UI responsive under heavy extraction?", 0.0, 0.0),
        node("K-c1", NodeType::Claim, "Out-of-process workers isolate stalls", 240.0, -80.0),
        node("K-e1", NodeType::Evidence, "Worker crash leaves UI alive", 480.0, -80.0),
        node("K-x1", NodeType::Counter, "IPC adds latency per call", 240.0, 80.0),
        node(
            "K-d1",
            NodeType::Decision,
            "Control plane over pipes, bulk data via shared memory",
            480.0,
            80.0,
        ),
    ];
    let edges = vec![
        edge("E-1", "K-q1", "K-c1", Rel::LeadsTo),
        edge("E-2", "K-e1", "K-c1", Rel::Supports),
        edge("E-3", "K-x1", "K-c1", Rel::Contradicts),
        edge("E-4", "K-c1", "K-d1", Rel::LeadsTo),
        edge("E-5", "K-x1", "K-d1", Rel::Refines),
    ];

    let mut ws = Workspace::empty();
    ws.projects = vec![p1, p2, p3];
    ws.sources = sources;
    ws.set_graph(Graph::from_parts(nodes, edges).expect("seed graph is consistent"));
    ws
}

# Architecture

R&D Workbench is a **personal R&D microkernel**: a small Rust core that owns state and policy,
a native UI that renders it, and replaceable out-of-process workers and (later) sandboxed plugins
that do the heavy or domain-specific work.

```text
┌────────────────────────── rdw (one native process) ──────────────────────────┐
│  apps/rdw-desktop  egui screens ── intents ──▶  crates/rdw-core              │
│                                                  ├─ Workspace (state)        │
│                                                  ├─ rdw-graph (DAG in RAM)   │
│                                                  ├─ Store (SQLite, Phase 1)  │
│                                                  ├─ search (Tantivy, Ph. 2)  │
│                                                  └─ rdw-providers            │
└──────────────┬──────────────────────────────┬────────────────────────────────┘
   control plane (rdw-ipc, JSON lines)         │ HTTPS (official APIs only)
   stdio → named pipes / UDS                   ▼
┌──────────────▼─────────────┐        OpenAI · Anthropic · Google · local runtime
│ workers/python (docs)      │        OpenAlex · Crossref · Semantic Scholar
│ future: vision/audio/IoT   │◀── data plane (Phase 4): zero-copy shared memory
└────────────────────────────┘
```

## Principles

1. **No webview, ever.** UI is egui on wgpu/glow. Rich output (equations, PDF) is rendered natively
   (Typst, a Rust PDF renderer) — never through an embedded browser. Opening a URL launches the
   user's *system* browser as a separate application.
2. **One-way dependencies.** `rdw-model` → `rdw-graph` → `rdw-providers` / `rdw-ipc` → `rdw-store` → `rdw-core` →
   `rdw-desktop`. Lower crates never import higher ones; `rdw-model` has no I/O.
3. **The core owns state.** Screens read `&Workspace` and call intent methods (`add_node`,
   `delete_node`, `undo`). No screen mutates entities directly. This is what makes the UI layer
   replaceable (egui today; Slint or another toolkit later if needed).
4. **Isolation by process, not by thread, for untrusted or heavy work.** A crashed or stuck worker
   cannot take the window down.
5. **Small files.** ≤ 250 lines per source file (`cargo xtask check-size`). Split by responsibility.
6. **Measure before optimising.** Numbers quoted in planning documents (IPC latency, DB speeds,
   extraction throughput) are hypotheses to benchmark on our own hardware, not facts.

## Crates

| Crate | Responsibility | Must not depend on |
| ----- | -------------- | ------------------ |
| `rdw-model` | Entities and enums, serde only | anything with I/O |
| `rdw-graph` | Adjacency-list graph, BFS traversal, cycle checks, undo `History<T>` | disk, UI |
| `rdw-providers` | `LlmClient` / `CitationLookup` traits, `Router`, `TokenBucket`, handoff | UI |
| `rdw-ipc` | `Request` / `Response` protocol + framing codec | core, UI |
| `rdw-store` | `Store` trait, `SqliteStore` (WAL), `MemoryStore` | core, UI |
| `rdw-core` | `Workspace`, intents, persistence, seed data, search | UI toolkit |
| `rdw-desktop` | Window, theme, fonts, one module per screen | — |
| `xtask` | Repo chores | — |

## Data and storage

- **Graph topology in RAM.** The open project's nodes and edges are adjacency lists in
  `rdw-graph`, so multi-hop traversal is a BFS over hash maps rather than recursive SQL.
- **SQLite (WAL) for persistence** (Phase 1): entities and graph snapshots, behind `store::Store`.
- **Full-text:** Tantivy (Phase 2) with a Thai-aware tokenizer (ICU4X word segmentation).
- **Vectors:** start in SQLite (sqlite-vec) and move to LanceDB only if the corpus outgrows it
  (Phase 3). The `Store` trait (in `rdw-store`) keeps this swap local.

## Worker protocol (control plane)

`crates/rdw-ipc` defines `Request` (`hello`, `extract`, `cancel`, `shutdown`) and `Response`
(`ready`, `progress`, `done`, `failed`, `log`) as internally tagged, snake_case JSON, one message per
line. The Python mirror is `workers/python/rdw_worker/protocol.py`; bump `PROTOCOL_VERSION` in both.

Transport today is the worker's stdin/stdout (portable, zero dependencies). Named pipes (Windows) /
Unix domain sockets can replace it behind the same codec. Large binary payloads (tensors, frames,
audio) will use a separate shared-memory data plane in Phase 4; they never travel as JSON.

## Document extraction tiers

| Input | Path |
| ----- | ---- |
| Text, Markdown, source code | Read directly (Rust in Phase 2; the Python worker handles it today) |
| Prose PDF with a text layer | Worker `fast` mode — CPU, no OCR |
| Scans, ordinary layouts | Worker `balanced` — layout + OCR where needed |
| Equations, complex tables | Worker `accurate` — GPU vision model |

Check every model's weight licence before shipping it as a default.

## Text, Thai and rich rendering

egui's built-in fonts have no Thai glyphs; `apps/rdw-desktop/src/fonts.rs` appends a system Thai font
as a fallback. Correct Thai line breaking needs dictionary-based segmentation (ICU4X
`LineSegmenter`) and complex shaping (cosmic-text / HarfRust) — planned for Phase 2. Equations and
export use Typst as a library (Phase 3).

## AI access

See [AI_PROVIDERS.md](AI_PROVIDERS.md). In short: official API keys for in-app calls, a browser
handoff for subscription deep-research products, and (later) an MCP server so desktop AI apps can
query the local research database.

## Decision records

Architecture decisions live in [`docs/adr`](adr). Add one for every decision that is expensive to
reverse.

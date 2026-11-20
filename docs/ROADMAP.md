# Roadmap

Ordered by value delivered per effort. Each phase ends with something usable every day.
Track work as GitHub issues labelled `phase-1` … `phase-5`.

## Phase 0 — Foundation ✅

- [x] Cargo workspace with one-way crate dependencies
- [x] Domain model ported from the web prototype (`rdw-model`)
- [x] In-RAM graph with traversal, cycle check and undo history (`rdw-graph`)
- [x] Native egui shell: Home, Projects, Research handoff, Library, Knowledge map, Tasks
- [x] Worker protocol (`rdw-ipc`) + Python worker skeleton
- [x] CI: fmt, clippy `-D warnings`, tests on Windows / Linux / macOS, 250-line file budget

## Phase 1 — Usable core

- [x] `SqliteStore` (WAL): projects, sources, graph snapshots, key-value cache; autosave
- [ ] Persist notes and tasks (still in memory only)
- [x] Projects: create / edit / delete (port `features/projects`)
- [x] OS credential store for API keys; Settings → Providers screen
- [x] `LlmClient` for OpenAI, Anthropic, Google and OpenAI-compatible local endpoints
- [x] Assistant pane wired to `Router` (Standard tier; Bulk is the fallback)
- [x] OpenAlex DOI lookup + persistent cache + per-source `TokenBucket`; Crossref fallback
- [x] Knowledge map: pan / zoom, drag nodes, connect, orthogonal edges

## Phase 2 — Documents and Thai

- [x] Spawn and supervise the Python worker (restart on crash, cancel, timeouts)
- [x] Imports screen + queue (file picker, drop on window, cancel, retry); reports import as `ResearchReport` sources
- [ ] Pull references out of imported reports into Verify
- [x] `fast` tier: PDF text layer (pypdf, page markers), DOCX (standard library)
- [ ] `balanced` / `accurate` tiers (OCR, vision model) for scans, equations, tables
- [ ] Tantivy index; Thai word segmentation for indexing
- [ ] Thai line breaking and shaping in the UI (ICU4X segmenter + cosmic-text)
- [ ] Named pipes (Windows) / Unix domain sockets transport behind `rdw-ipc::codec`
- [ ] Port Imports, Reader and Help, then delete `prototype/web` (see `docs/MIGRATION.md`)

## Phase 3 — Writing studio

- [ ] Typst as a library: render equations in-app, export nodes and projects to PDF
- [ ] Native PDF viewer for source documents (evaluate a pure-Rust renderer)
- [ ] Embeddings + vector search (sqlite-vec first; LanceDB if the corpus outgrows it)

## Phase 4 — Fast data plane

- [ ] Benchmark control-plane vs shared-memory transport on Windows and Linux
- [ ] Zero-copy shared-memory channel for vision / audio / sensor workers, fixed-layout payloads
- [ ] Record-and-replay of worker streams for debugging

## Phase 5 — Plugins

- [ ] Wasmtime + WASI component model host with fuel / memory limits
- [ ] WIT interface for tools (input → output + optional graph nodes)
- [ ] MCP server (`rmcp`) exposing the research database to desktop AI clients

## Non-goals

Web UI of any kind, multi-user accounts, SSO, billing, cloud sync, mobile clients, and any automation of vendors' web apps.

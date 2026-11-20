# Changelog

All notable changes are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- Worker protocol v2: `extract` carries `out_path`; the core decides where extracted text is written.

### Added

- Imports screen: pick or drop PDF / DOCX / Markdown / text files, queue with progress, cancel, retry, remove, open extracted text.
- Worker extraction: DOCX via the standard library, PDF text layer via optional `pypdf`, Markdown written to the app's data folder.
- Phase 2: `rdw_ipc::Supervisor` runs a worker process with handshake, one-at-a-time queue, crash restart with backoff, cancel and idle timeouts.
- Phase 1: `rdw-store` crate with `SqliteStore` (WAL, JSON documents, migrations) and autosave.
- Projects create / edit / delete with cascade; Knowledge map pan, zoom, drag, connect, orthogonal edges.
- Settings screen: API keys in the OS credential store, per-tier model routing.
- LLM clients for Anthropic, OpenAI, Gemini and OpenAI-compatible local runtimes; Research → Assistant pane.
- Verify screen: DOI lookup via OpenAlex with Crossref fallback, per-source rate limits, local cache.
- Cargo workspace: `rdw-model`, `rdw-graph`, `rdw-providers`, `rdw-ipc`, `rdw-core`, `rdw-desktop`, `xtask`.
- Native egui shell with Home, Projects, Research (deep-research handoff), Library, Knowledge map, Tasks.
- In-RAM knowledge graph with BFS traversal, cycle detection and undo/redo.
- Token-bucket rate limiter, citation-source policies, DOI normalisation, model router.
- Worker protocol (newline-delimited JSON) and a Python document-worker skeleton.
- Thai font fallback from system fonts.
- CI on Windows, Linux and macOS; 250-line file budget (`cargo xtask check-size`).

### Changed

- The React web build moved to `prototype/web` and is now the UX reference only.

<div align="center">

# R&D Workbench

**A local-first, fully native research workstation — Rust core, egui UI, no webview.**

[![CI](https://github.com/intity01/rd-workbench/actions/workflows/ci.yml/badge.svg)](https://github.com/intity01/rd-workbench/actions/workflows/ci.yml)
[![License: MIT OR Apache-2.0](https://img.shields.io/badge/license-MIT%20OR%20Apache--2.0-blue.svg)](#license)
[![Rust 1.85+](https://img.shields.io/badge/rust-1.85%2B-orange.svg)](rust-toolchain.toml)
![Status: pre-alpha](https://img.shields.io/badge/status-pre--alpha-lightgrey.svg)

[Architecture](docs/ARCHITECTURE.md) · [Roadmap](docs/ROADMAP.md) · [AI providers](docs/AI_PROVIDERS.md) · [Contributing](CONTRIBUTING.md)

</div>

---

R&D Workbench turns papers, notes and AI deep-research reports into an **evidence graph** you can
reason over: claims, evidence, counter-arguments and decisions, each linked to the page it came from.
It runs on your own PC, keeps your data local, and treats cloud models as optional helpers.

> **ภาษาไทย:** โปรแกรมวิจัยเชิงลึกแบบ Native (Rust + egui ไม่มี WebView) ทำงานแบบ Local-first
> รวมเอกสาร โน้ต และรายงาน Deep Research จาก ChatGPT / Claude / Gemini มาเป็นกราฟหลักฐานที่ตรวจสอบอ้างอิงได้
> รองรับภาษาไทยตั้งแต่ต้น — ดูแผนงานที่ [docs/ROADMAP.md](docs/ROADMAP.md)

## Why native

- **No webview, no Electron.** The UI is an egui window drawn on the GPU. Small binary, fast start,
  no browser engine in the process.
- **Process isolation.** Heavy document extraction runs in separate worker processes (Python today),
  so a stuck PDF never freezes the UI.
- **Local-first.** Projects, the knowledge graph and indexes live on disk on your machine.
- **Deep research without breaking terms of service.** The app hands a research brief to *your own*
  ChatGPT, Claude or Gemini account in your system browser and imports the finished report — it
  never logs in for you or scrapes a session. See [docs/AI_PROVIDERS.md](docs/AI_PROVIDERS.md).

## Status

Pre-alpha. The workspace builds and runs a first native shell (Home, Projects, Research handoff,
Library search, Knowledge map with undo/redo). The complete UX exists as a web prototype in
[`prototype/web`](prototype/web) and is being ported screen by screen — see
[docs/MIGRATION.md](docs/MIGRATION.md).

## Quick start

Requirements: Rust 1.85+ (stable). On Windows, the MSVC build tools. Python 3.11+ only for the worker.

```sh
git clone https://github.com/intity01/rd-workbench.git
cd rd-workbench
cargo run --release          # launches the desktop app (binary: rdw)
cargo test --workspace       # unit tests
cargo xtask check-size       # enforce the 250-line file budget
```

Python worker (optional for now):

```sh
cd workers/python
python -m rdw_worker < requests.jsonl   # speaks the rdw-ipc protocol on stdio
```

## Repository layout

```text
apps/rdw-desktop     Native egui application (binary `rdw`) — screens, theme, fonts
crates/rdw-core      Orchestrator: Workspace state, undo history, search, storage trait
crates/rdw-graph     In-RAM knowledge graph / reasoning DAG with fast traversal
crates/rdw-model     Domain entities (Project, Source, GNode, Edge, Task…) — no I/O
crates/rdw-providers Model routing, citation lookup policies, rate limiter, deep-research handoff
crates/rdw-ipc       Core ⇄ worker protocol (newline-delimited JSON)
workers/python       Document extraction worker (Marker tiers in Phase 2)
tools/xtask          Repo chores (`cargo xtask check-size`)
prototype/web        React UX prototype — the reference design for every screen
docs/                Architecture, roadmap, ADRs, provider policy, migration guide
```

Dependencies flow one way: `model → graph → providers/ipc → core → app`.
The UI never mutates domain state directly; it calls `rdw-core`.

## Roadmap at a glance

| Phase | Theme | Highlights |
| ----- | ----- | ---------- |
| 1 | Usable core | SQLite (WAL) snapshots, API-key model routing, OpenAlex DOI check + cache |
| 2 | Documents & Thai | Python worker over pipes, Marker tiers, Tantivy, ICU4X Thai line breaking |
| 3 | Writing studio | Typst export (PDF), vector index (sqlite-vec → LanceDB) |
| 4 | Fast data plane | Zero-copy shared memory for vision / audio / IoT workers |
| 5 | Plugins | Wasmtime component-model sandbox for user and AI-written tools |

Details and checklists: [docs/ROADMAP.md](docs/ROADMAP.md).

## Contributing

Contributions are welcome — please read [CONTRIBUTING.md](CONTRIBUTING.md) first. Every source file
stays at or below **250 lines**; CI enforces it together with `rustfmt` and `clippy -D warnings`.

## License

Licensed under either of [Apache License, Version 2.0](LICENSE-APACHE) or [MIT license](LICENSE-MIT)
at your option. Unless you explicitly state otherwise, any contribution intentionally submitted for
inclusion in this work shall be dual licensed as above, without any additional terms or conditions.

ChatGPT, Claude and Gemini are trademarks of their respective owners. This project is not affiliated
with or endorsed by OpenAI, Anthropic or Google.

# Agent guide — R&D Workbench

Native, local-first research workstation. Rust workspace; egui UI; **no webview, ever**.

## Commands

```sh
cargo run                                   # desktop app (binary `rdw`)
cargo test --workspace
cargo fmt --all
cargo clippy --workspace --all-targets -- -D warnings
cargo xtask check-size                      # ≤ 250 lines per .rs/.py/.ts/.tsx file
```

## Layout

- `crates/rdw-model` entities only (serde, no I/O)
- `crates/rdw-graph` in-RAM graph + `History<T>`
- `crates/rdw-providers` LLM router, citation policies, `TokenBucket`, deep-research handoff
- `crates/rdw-ipc` worker protocol and `Supervisor` (tests use `tests/support/fake_worker.rs`); Python mirror in `workers/python/rdw_worker/protocol.py`
- `crates/rdw-store` `Store` trait, `SqliteStore` (WAL), `MemoryStore`
- `crates/rdw-core` `Workspace` (state + intents), persistence, search, DOI cache
- `apps/rdw-desktop` window, theme, fonts, `screens/<name>.rs`
- `prototype/web` React UX reference (see its own `AGENTS.md`); not shipped

## Rules

1. Dependencies flow `model → graph → providers/ipc → store → core → app`. Never upward.
2. Screens read `&Workspace` and call intent methods; they never mutate entities directly.
3. Keep every source file ≤ 250 lines. Split by responsibility (a screen becomes a folder).
4. New logic in `crates/*` ships with unit tests.
5. Never automate vendor web apps (ChatGPT/Claude/Gemini sites), never handle session cookies.
   Use official APIs or the handoff flow. Read `docs/AI_PROVIDERS.md`.
6. Protocol changes update both Rust and Python sides and `PROTOCOL_VERSION` when breaking.
7. Expensive-to-reverse decisions get an ADR in `docs/adr/`.

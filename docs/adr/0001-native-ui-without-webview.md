# ADR 0001 — Native UI with egui, no webview

- Status: accepted
- Date: 2026-11-20

## Context

The first UX was built as a React web prototype. The product goal is a single-user desktop tool that
starts fast, stays responsive under heavy local processing, and does not ship a browser engine.
Candidates: egui/eframe, iced, Slint, GPUI, native platform toolkits, Tauri/Electron (webview).

## Decision

- No webview of any kind (rules out Electron, Tauri, embedded browsers).
- UI toolkit: **egui / eframe** — immediate mode, permissive licence (MIT/Apache-2.0), mature on
  Windows, the fastest path from prototype to working tool.
- All domain state lives in `rdw-core`; screens only render and dispatch intents, so the toolkit can
  be replaced (for example Slint for embedded screens) without touching the core.

## Consequences

- Long-document typography and Thai line breaking need extra work (ICU4X, cosmic-text) — Phase 2.
- Equations and PDF must be rendered natively (Typst, a Rust PDF renderer) — Phase 3.
- Links open in the user's system browser, which is a separate application, not part of our process.

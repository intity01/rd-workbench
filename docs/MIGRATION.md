# Porting the web prototype to native

`prototype/web` is a React + Tailwind build of the full UX, written so each folder maps onto a Rust
module. It is the **reference design**, not shipping code. Run it with `pnpm install && pnpm dev`
inside `prototype/web`.

## Layer mapping

| Prototype (`prototype/web/src/app/…`) | Native target |
| ------------------------------------- | ------------- |
| `data/types.ts` | `crates/rdw-model` |
| `data/*.ts` (seed) | `crates/rdw-core/src/seed.rs` (trimmed) |
| `lib/search.ts` | `crates/rdw-core/src/search.rs` → Tantivy |
| `lib/assistant.ts` (mock) | `crates/rdw-providers/src/llm.rs` |
| `state/useGraphSlice.ts` | `crates/rdw-graph` + `Workspace::{add_node, delete_node, undo, redo}` |
| `state/useLibrarySlice.ts`, `useOpsSlice.ts` | `Workspace` services (Phase 1) |
| `state/useProcessingSim.ts` | real worker supervision via `rdw-ipc` (Phase 2) |
| `ui/*` | `apps/rdw-desktop/src/screens/mod.rs` helpers (`card`, `title`) → `widgets/` |
| `shell/*` | `apps/rdw-desktop/src/app.rs` (top bar, nav, shortcuts) |
| `features/<screen>/` | `apps/rdw-desktop/src/screens/<screen>.rs` (split into a folder when > 250 lines) |
| `index.css` tokens | `apps/rdw-desktop/src/theme.rs` |

## Screen status

| Screen | Prototype | Native |
| ------ | --------- | ------ |
| Home | `features/home` | first cut |
| Projects | `features/projects` | list, create, edit, delete |
| Research | `features/research` | assistant + handoff; reader pane to do |
| Imports | `features/imports` | to do |
| Verify | `features/verify` | DOI lookup and title check |
| Library | `features/library` | search (naive) |
| Knowledge map | `features/map` | pan, zoom, drag, connect, edit, undo |
| Tasks | `features/tasks` | empty state |
| Settings | `features/settings` | API keys + routing |
| Help | `features/help` | to do |

## Porting checklist (per screen)

1. Read the prototype folder; list the intents it triggers on the store.
2. Add any missing intent to `rdw-core` **with a unit test** before touching UI.
3. Write the screen as `screens/<name>.rs` (or a folder with `mod.rs` + parts).
4. Reuse `card` / `title` / theme tokens; add a widget to a shared module when used twice.
5. `cargo xtask check-size && cargo clippy --workspace --all-targets -- -D warnings`.
6. Update the table above.

## Retiring the prototype

R&D Workbench is a personal, desktop-only program; nothing web-based ships or stays long-term.
Once **Imports**, **Reader** and **Help** are ported, delete `prototype/web` in one commit and
remove the "Prototype" column above along with the `prototype_path()` pointers in
`apps/rdw-desktop/src/screen.rs`.

# R&D Workbench — prototype architecture

This web build is a **UX prototype** for a native Rust desktop app (egui/eframe, no webview).
The folder structure mirrors the planned native crates so each module can be ported on its own.

## Layers (imports only flow downward)

| Layer    | Folder      | Responsibility                                            | Native target (planned)              |
| -------- | ----------- | --------------------------------------------------------- | ------------------------------------ |
| Data     | `data/`     | Entity types and fictional seed data. No React.           | `core::model` structs + SQLite seed  |
| Lib      | `lib/`      | Pure functions: search index, mock assistant, formatting. | `core::search` (Tantivy), `ai::mock` |
| State    | `state/`    | Slices = services. One composition point.                 | `app::services::*`                   |
| UI kit   | `ui/`       | Stateless primitives (Button, Tag, Switch, Modal…).       | `ui::widgets`                        |
| Shell    | `shell/`    | Window frame, sidebar, top bar, global overlays.          | `ui::shell`                          |
| Features | `features/` | One folder per screen; page file + small parts.           | `ui::screens::*`                     |

Rules:

- `data` and `lib` never import React, `state`, `ui`, or `features`.
- `ui` never imports `state` (pure props in, events out). Easiest layer to port to egui widgets.
- A feature may import another feature's exported component only from that feature's folder (e.g. `projects/ProjectCard`).
- Cross-slice actions live in `state/useWorkflows.ts`, never inside a slice.
- Every file stays at or below **250 lines** (`pnpm check:size`). Split by responsibility, not by line count.

## State slices

| Slice                 | Owns                                                   |
| --------------------- | ------------------------------------------------------ |
| `settings.ts`         | Preferences + applying theme/scale/language            |
| `useUiSlice.ts`       | Toasts, confirm dialog, palette, activity, notices     |
| `useLibrarySlice.ts`  | Projects, sources, notes, highlights, assistant thread |
| `useGraphSlice.ts`    | Nodes, edges, undo/redo snapshots                      |
| `useOpsSlice.ts`      | Tasks, citation verification                           |
| `useWorkflows.ts`     | Cascading deletes, import → job creation               |
| `useProcessingSim.ts` | Deterministic worker-pipeline simulation (1 s tick)    |

## Visual system

- Surfaces are solid and separated by tone (`app` → `surface` → `surface-2` → `raised`). Hairlines (`line`) only where they carry structure: table rows, section dividers.
- No outlined or tinted-outline chips. Tags are solid (`Tag`); status uses a filled glyph plus plain text (`StatusTag`, `VerifyTag`) so meaning never relies on colour alone.
- One accent: `signal` (lime), always as a fill with `on-signal` text. `signal-ink` is its readable text/focus colour per theme.
- Primary action = inverted solid (`bg-fg text-app`). Buttons are pills; icon buttons are circles.
- Graph: colour appears only in node icon tiles and type dots; connectors are neutral and orthogonal, emphasised when attached to the selection; only "contradicts" carries a hue.

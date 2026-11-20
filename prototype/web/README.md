# Web UX prototype

React 19 + Vite + Tailwind v4 build of the full R&D Workbench UX, originally made in Figma Make.
It is the **reference design** for the native app — not shipped, not a runtime dependency.
Every folder under `src/app` maps onto a Rust module; see [`docs/MIGRATION.md`](../../docs/MIGRATION.md)
and [`src/app/ARCHITECTURE.md`](src/app/ARCHITECTURE.md).

```sh
pnpm install
pnpm dev          # Vite dev server; the URL is printed on start
pnpm typecheck
pnpm check:size   # ≤ 250 lines per file
```

All data is fictional seed data. `.figma/` holds Figma Make tooling so the folder can be re-imported.

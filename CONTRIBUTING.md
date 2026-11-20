# Contributing to R&D Workbench

Thanks for helping! This is a young project; issues and small focused PRs are the best way in.

## Ground rules

- **No webview.** UI is native egui. PRs that add Electron, Tauri, `wry`, or any embedded browser
  will be closed. See [ADR 0001](docs/adr/0001-native-ui-without-webview.md).
- **No automation of vendor web apps.** Provider integrations use official APIs or an explicit user
  action. Read [docs/AI_PROVIDERS.md](docs/AI_PROVIDERS.md) before touching `rdw-providers`.
- **≤ 250 lines per source file** (`.rs`, `.py`, `.ts`, `.tsx`). Split by responsibility.
- **One-way dependencies:** `model → graph → providers/ipc → core → app`. The UI calls `rdw-core`
  intents; it never mutates entities directly.
- **Tests with logic.** New behaviour in `crates/*` comes with unit tests.

## Development setup

```sh
rustup show            # installs the toolchain pinned in rust-toolchain.toml
cargo run              # run the desktop app
cargo test --workspace
```

Before pushing, run exactly what CI runs:

```sh
cargo fmt --all --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
cargo xtask check-size
```

Python worker:

```sh
cd workers/python
python -m pip install -e ".[dev]"
python -m pytest -q && ruff check .
```

## Commits and pull requests

- Branch from `main`: `feat/…`, `fix/…`, `docs/…`, `refactor/…`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat(graph): add shortest-path query`.
- Keep PRs focused; describe *why*, link the issue, and tick the PR template checklist.
- Changes to the `rdw-ipc` protocol must update `workers/python/rdw_worker/protocol.py` and bump
  `PROTOCOL_VERSION` when breaking.
- Decisions that are expensive to reverse get an ADR in `docs/adr/`.

## Porting a screen from the prototype

Follow the checklist in [docs/MIGRATION.md](docs/MIGRATION.md).

## Licensing

By contributing you agree that your work is dual-licensed under MIT OR Apache-2.0, like the rest of
the project. Only add dependencies with compatible licences (MIT, Apache-2.0, BSD, Zlib, MPL-2.0);
discuss anything copyleft in an issue first.

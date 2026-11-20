## What and why

<!-- What does this change, and why? Link the issue: Closes #… -->

## How it was tested

<!-- Commands run, screens checked, OS. -->

## Checklist

- [ ] `cargo fmt --all --check` and `cargo clippy --workspace --all-targets -- -D warnings` pass
- [ ] `cargo test --workspace` passes; new logic has tests
- [ ] `cargo xtask check-size` passes (≤ 250 lines per file)
- [ ] No webview, no automation of vendor web apps, no credentials in code or logs
- [ ] Protocol changes mirrored in `workers/python` (and `PROTOCOL_VERSION` bumped if breaking)
- [ ] Docs / `CHANGELOG.md` / `docs/MIGRATION.md` updated where relevant

# Changelog

All notable changes are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Cargo workspace: `rdw-model`, `rdw-graph`, `rdw-providers`, `rdw-ipc`, `rdw-core`, `rdw-desktop`, `xtask`.
- Native egui shell with Home, Projects, Research (deep-research handoff), Library, Knowledge map, Tasks.
- In-RAM knowledge graph with BFS traversal, cycle detection and undo/redo.
- Token-bucket rate limiter, citation-source policies, DOI normalisation, model router.
- Worker protocol (newline-delimited JSON) and a Python document-worker skeleton.
- Thai font fallback from system fonts.
- CI on Windows, Linux and macOS; 250-line file budget (`cargo xtask check-size`).

### Changed

- The React web build moved to `prototype/web` and is now the UX reference only.

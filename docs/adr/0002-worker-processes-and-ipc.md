# ADR 0002 — Out-of-process workers with a two-plane IPC

- Status: accepted
- Date: 2026-11-20

## Context

The best document-extraction and ML tooling is in Python. Running it in-process would risk the UI
(GIL stalls, crashes, memory spikes). Different payloads have very different sizes: commands and
progress are tiny; images, tensors and audio are large and frequent.

## Decision

- Workers are separate processes supervised by `rdw-core`.
- **Control plane:** newline-delimited JSON (`rdw-ipc`), versioned by `PROTOCOL_VERSION`. Transport is
  stdio now; named pipes / Unix domain sockets later, behind the same codec.
- **Data plane (Phase 4):** zero-copy shared memory for large fixed-layout payloads, adopted only
  after benchmarking on the target OSes.
- Network RPC frameworks (gRPC) are not used for local IPC.

## Consequences

- Any language can implement a worker with its standard library.
- Model-backed latency (seconds) dominates; micro-second IPC differences matter only on the data plane.
- Protocol changes must update Rust and Python mirrors together; tests on both sides pin the format.

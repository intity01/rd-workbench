//! Worker protocol (control plane).
//!
//! Messages are newline-delimited JSON (one object per line) so any language can
//! speak it with its standard library. The transport is the worker's stdin/stdout
//! today; named pipes (Windows) / Unix domain sockets slot in behind the same
//! [`codec`] later. Bulk payloads (tensors, frames, audio) will use a separate
//! zero-copy shared-memory data plane — they never travel through this protocol.
//!
//! The Python mirror of these types lives in `workers/python/rdw_worker/protocol.py`.

pub mod codec;
mod messages;
pub mod supervisor;

pub use messages::{ExtractMode, PROTOCOL_VERSION, Request, Response};
pub use supervisor::{Event, Supervisor, WorkerSpec};

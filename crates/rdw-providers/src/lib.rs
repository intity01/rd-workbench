//! External services, behind traits.
//!
//! * [`llm`] — official API access to model vendors plus a cost-aware router.
//! * [`citation`] — scholarly metadata lookups (OpenAlex, Crossref, …) and their limits.
//! * [`rate_limit`] — a deterministic token bucket shared by every outbound client.
//! * [`handoff`] — ToS-safe bridge to vendors' *web* deep-research products:
//!   the app never logs in on the user's behalf; it opens the user's own browser
//!   and imports the exported report afterwards. See `docs/AI_PROVIDERS.md`.
//!
//! * [`clients`] / [`lookups`] — blocking HTTP implementations. Call them from a
//!   background thread, never from the UI thread.

pub mod citation;
pub mod clients;
pub mod handoff;
pub mod http;
pub mod llm;
pub mod lookups;
pub mod rate_limit;

pub use rate_limit::TokenBucket;

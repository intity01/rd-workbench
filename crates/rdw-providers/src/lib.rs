//! External services, behind traits.
//!
//! * [`llm`] — official API access to model vendors plus a cost-aware router.
//! * [`citation`] — scholarly metadata lookups (OpenAlex, Crossref, …) and their limits.
//! * [`rate_limit`] — a deterministic token bucket shared by every outbound client.
//! * [`handoff`] — ToS-safe bridge to vendors' *web* deep-research products:
//!   the app never logs in on the user's behalf; it opens the user's own browser
//!   and imports the exported report afterwards. See `docs/AI_PROVIDERS.md`.
//!
//! No HTTP client is linked yet: concrete clients land in Phase 1 behind these traits.

pub mod citation;
pub mod handoff;
pub mod llm;
pub mod rate_limit;

pub use rate_limit::TokenBucket;

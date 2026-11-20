//! Scholarly metadata sources used by the citation checker.
//!
//! Lookup order: local cache → OpenAlex → Crossref → Semantic Scholar.
//! Limits below are *conservative defaults*; providers change their policies,
//! so they are configurable and must be re-checked against each provider's docs.

use crate::TokenBucket;
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum CitationSource {
    OpenAlex,
    Crossref,
    SemanticScholar,
    ArXiv,
    PubMed,
}

/// How politely we may call a source.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Policy {
    pub requests: u32,
    pub per: Duration,
    pub burst: u32,
    /// Whether a (free) API key is expected for reasonable quotas.
    pub wants_key: bool,
}

impl CitationSource {
    /// Order in which sources are tried for a DOI / title lookup.
    pub const LOOKUP_ORDER: [CitationSource; 3] = [Self::OpenAlex, Self::Crossref, Self::SemanticScholar];

    pub fn default_policy(self) -> Policy {
        let sec = Duration::from_secs(1);
        match self {
            Self::OpenAlex => Policy { requests: 10, per: sec, burst: 10, wants_key: true },
            Self::Crossref => Policy { requests: 1, per: sec, burst: 1, wants_key: false },
            Self::SemanticScholar => Policy { requests: 1, per: sec, burst: 1, wants_key: true },
            Self::ArXiv => Policy { requests: 1, per: Duration::from_secs(3), burst: 1, wants_key: false },
            Self::PubMed => Policy { requests: 3, per: sec, burst: 3, wants_key: false },
        }
    }

    pub fn limiter(self, now: Instant) -> TokenBucket {
        let p = self.default_policy();
        TokenBucket::new(p.requests, p.per, p.burst, now)
    }
}

/// Normalised metadata returned by any source.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WorkRecord {
    pub source: CitationSource,
    pub doi: Option<String>,
    pub title: String,
    pub year: Option<u16>,
    pub authors: Vec<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum LookupError {
    #[error("rate limited, retry after {0:?}")]
    RateLimited(Duration),
    #[error("not found")]
    NotFound,
    #[error("transport: {0}")]
    Transport(String),
}

/// Implemented by each concrete HTTP client (Phase 1).
pub trait CitationLookup: Send + Sync {
    fn source(&self) -> CitationSource;
    fn by_doi(&self, doi: &str) -> Result<WorkRecord, LookupError>;
}

/// Lower-cases and strips URL prefixes so `https://doi.org/10.1/X` == `10.1/x`.
pub fn normalize_doi(raw: &str) -> Option<String> {
    let s = raw.trim().to_ascii_lowercase();
    let s = ["https://doi.org/", "http://doi.org/", "https://dx.doi.org/", "doi:"]
        .iter()
        .find_map(|p| s.strip_prefix(p))
        .unwrap_or(&s)
        .trim();
    (s.starts_with("10.") && s.contains('/')).then(|| s.to_owned())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn doi_normalisation() {
        assert_eq!(normalize_doi("https://doi.org/10.1234/ABC").as_deref(), Some("10.1234/abc"));
        assert_eq!(normalize_doi(" doi:10.5/x ").as_deref(), Some("10.5/x"));
        assert_eq!(normalize_doi("not-a-doi"), None);
    }
}

//! Concrete DOI lookups and a rate-limited resolver that tries them in order.

use crate::citation::{CitationLookup, CitationSource, LookupError, WorkRecord};
use crate::http::{HttpError, get_json};
use crate::rate_limit::TokenBucket;
use serde_json::Value;
use std::sync::Mutex;
use std::time::Instant;

impl From<HttpError> for LookupError {
    fn from(e: HttpError) -> Self {
        match e {
            HttpError::Status { status: 404, .. } => LookupError::NotFound,
            HttpError::Status { status: 429, retry_after, .. } => {
                LookupError::RateLimited(retry_after.unwrap_or(std::time::Duration::from_secs(5)))
            }
            other => LookupError::Transport(other.to_string()),
        }
    }
}

fn year(v: Option<&Value>) -> Option<u16> {
    v.and_then(Value::as_u64).and_then(|y| u16::try_from(y).ok())
}

/// OpenAlex single-work lookup by DOI. An API key is optional but raises limits.
#[derive(Debug, Default)]
pub struct OpenAlex {
    pub api_key: Option<String>,
}

pub(crate) fn parse_openalex(v: &Value, doi: &str) -> WorkRecord {
    let authors = v
        .get("authorships")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(|a| a.pointer("/author/display_name").and_then(Value::as_str).map(str::to_owned))
        .collect();
    WorkRecord {
        source: CitationSource::OpenAlex,
        doi: Some(doi.to_owned()),
        title: v.get("display_name").or_else(|| v.get("title")).and_then(Value::as_str).unwrap_or("").into(),
        year: year(v.get("publication_year")),
        authors,
    }
}

impl CitationLookup for OpenAlex {
    fn source(&self) -> CitationSource {
        CitationSource::OpenAlex
    }

    fn by_doi(&self, doi: &str) -> Result<WorkRecord, LookupError> {
        let mut url = format!("https://api.openalex.org/works/doi:{doi}");
        if let Some(k) = self.api_key.as_deref().filter(|k| !k.is_empty()) {
            url += &format!("?api_key={k}");
        }
        Ok(parse_openalex(&get_json(&url, &[])?, doi))
    }
}

/// Crossref `/works/{doi}` — the fallback when OpenAlex has no record.
#[derive(Debug, Default)]
pub struct Crossref;

pub(crate) fn parse_crossref(v: &Value, doi: &str) -> WorkRecord {
    let m = v.get("message").unwrap_or(&Value::Null);
    let authors = m
        .get("author")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|a| {
            let part = |k: &str| a.get(k).and_then(Value::as_str).unwrap_or("");
            format!("{} {}", part("given"), part("family")).trim().to_owned()
        })
        .filter(|s| !s.is_empty())
        .collect();
    WorkRecord {
        source: CitationSource::Crossref,
        doi: Some(doi.to_owned()),
        title: m.pointer("/title/0").and_then(Value::as_str).unwrap_or("").into(),
        year: year(m.pointer("/issued/date-parts/0/0")),
        authors,
    }
}

impl CitationLookup for Crossref {
    fn source(&self) -> CitationSource {
        CitationSource::Crossref
    }

    fn by_doi(&self, doi: &str) -> Result<WorkRecord, LookupError> {
        Ok(parse_crossref(&get_json(&format!("https://api.crossref.org/works/{doi}"), &[])?, doi))
    }
}

/// Tries each lookup in order, waiting on that source's own token bucket first.
/// Shareable across threads; the cache lives in the caller's store.
#[derive(Debug)]
pub struct Resolver {
    chain: Vec<(Box<dyn CitationLookupDebug>, Mutex<TokenBucket>)>,
}

/// Object-safe helper so the resolver can derive `Debug`.
pub trait CitationLookupDebug: CitationLookup + std::fmt::Debug {}
impl<T: CitationLookup + std::fmt::Debug> CitationLookupDebug for T {}

impl Resolver {
    pub fn new(openalex_key: Option<String>) -> Self {
        let now = Instant::now();
        let chain: Vec<(Box<dyn CitationLookupDebug>, Mutex<TokenBucket>)> = vec![
            (Box::new(OpenAlex { api_key: openalex_key }), Mutex::new(CitationSource::OpenAlex.limiter(now))),
            (Box::new(Crossref), Mutex::new(CitationSource::Crossref.limiter(now))),
        ];
        Self { chain }
    }

    /// Blocking: may sleep to respect rate limits. Returns the first hit.
    pub fn resolve(&self, doi: &str) -> Result<WorkRecord, LookupError> {
        let mut last = LookupError::NotFound;
        for (lookup, bucket) in &self.chain {
            loop {
                let wait = bucket.lock().map(|mut b| b.wait_time(Instant::now())).unwrap_or_default();
                if wait.is_zero() {
                    break;
                }
                std::thread::sleep(wait);
            }
            if let Ok(mut b) = bucket.lock() {
                b.try_acquire(Instant::now());
            }
            match lookup.by_doi(doi) {
                Ok(rec) if !rec.title.is_empty() => return Ok(rec),
                Ok(_) => last = LookupError::NotFound,
                Err(e) => last = e,
            }
        }
        Err(last)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn parses_openalex_and_crossref_shapes() {
        let oa = json!({"display_name":"A study","publication_year":2024,
            "authorships":[{"author":{"display_name":"Ann Lee"}}]});
        let r = parse_openalex(&oa, "10.1/x");
        assert_eq!((r.title.as_str(), r.year, r.authors.len()), ("A study", Some(2024), 1));

        let cr = json!({"message":{"title":["Paper"],"issued":{"date-parts":[[2019,5]]},
            "author":[{"given":"Bo","family":"Chen"}]}});
        let r = parse_crossref(&cr, "10.1/y");
        assert_eq!((r.title.as_str(), r.year, r.authors[0].as_str()), ("Paper", Some(2019), "Bo Chen"));
    }
}

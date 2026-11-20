//! Shared blocking HTTP helpers. Call these from a background thread, never the UI thread.

use serde_json::Value;
use std::sync::OnceLock;
use std::time::Duration;

pub const USER_AGENT: &str = concat!("rd-workbench/", env!("CARGO_PKG_VERSION"));

/// Failure of one HTTP call, with the provider's own error message when it sent one.
#[derive(Debug, thiserror::Error)]
pub enum HttpError {
    #[error("HTTP {status}: {message}")]
    Status { status: u16, message: String, retry_after: Option<Duration> },
    #[error("network: {0}")]
    Transport(String),
    #[error("unexpected response: {0}")]
    Decode(String),
}

fn agent() -> &'static ureq::Agent {
    static AGENT: OnceLock<ureq::Agent> = OnceLock::new();
    AGENT.get_or_init(|| {
        ureq::Agent::config_builder()
            .http_status_as_error(false)
            .timeout_global(Some(Duration::from_secs(600)))
            .user_agent(USER_AGENT)
            .build()
            .into()
    })
}

/// Pulls a human-readable message out of the common error envelopes
/// (`{"error":{"message":..}}`, `{"error":"..."}`, `{"message":..}`).
fn error_message(body: &str) -> String {
    let v: Value = serde_json::from_str(body).unwrap_or(Value::Null);
    let msg = v
        .pointer("/error/message")
        .or_else(|| v.get("error").filter(|e| e.is_string()))
        .or_else(|| v.get("message"))
        .and_then(Value::as_str);
    match msg {
        Some(m) => m.to_owned(),
        None => body.chars().take(300).collect(),
    }
}

fn finish(result: Result<ureq::http::Response<ureq::Body>, ureq::Error>) -> Result<Value, HttpError> {
    let mut resp = result.map_err(|e| HttpError::Transport(e.to_string()))?;
    let status = resp.status().as_u16();
    let retry_after = resp
        .headers()
        .get("retry-after")
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.trim().parse::<u64>().ok())
        .map(Duration::from_secs);
    let body = resp.body_mut().read_to_string().map_err(|e| HttpError::Transport(e.to_string()))?;
    if !(200..300).contains(&status) {
        return Err(HttpError::Status { status, message: error_message(&body), retry_after });
    }
    serde_json::from_str(&body).map_err(|e| HttpError::Decode(e.to_string()))
}

pub fn post_json(url: &str, headers: &[(&str, &str)], body: &Value) -> Result<Value, HttpError> {
    let mut req = agent().post(url);
    for (k, v) in headers {
        req = req.header(*k, *v);
    }
    finish(req.send_json(body))
}

pub fn get_json(url: &str, headers: &[(&str, &str)]) -> Result<Value, HttpError> {
    let mut req = agent().get(url);
    for (k, v) in headers {
        req = req.header(*k, *v);
    }
    finish(req.call())
}

#[cfg(test)]
mod tests {
    use super::error_message;

    #[test]
    fn extracts_messages_from_common_envelopes() {
        assert_eq!(error_message(r#"{"type":"error","error":{"type":"x","message":"bad key"}}"#), "bad key");
        assert_eq!(error_message(r#"{"error":"nope"}"#), "nope");
        assert_eq!(error_message("plain text"), "plain text");
    }
}

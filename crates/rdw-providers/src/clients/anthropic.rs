//! Anthropic Messages API (raw HTTP; there is no official Rust SDK).

use super::split_system;
use crate::http::post_json;
use crate::llm::{ChatRequest, LlmClient, LlmError, Role, Tier, Vendor};
use serde_json::{Value, json};

const URL: &str = "https://api.anthropic.com/v1/messages";
const API_VERSION: &str = "2026-10-21";
/// Lets the API retry a safety-classifier refusal on another model automatically.
const FALLBACK_BETA: &str = "server-side-fallback-2026-07-01";

#[derive(Debug)]
pub struct Anthropic {
    key: String,
}

impl Anthropic {
    pub fn new(key: impl Into<String>) -> Self {
        Self { key: key.into() }
    }
}

/// Thinking effort per tier: cheap for bulk work, deeper for decisions.
fn effort(tier: Tier) -> &'static str {
    match tier {
        Tier::Bulk => "low",
        Tier::Standard => "medium",
        Tier::Flagship | Tier::DeepResearch => "high",
    }
}

pub(crate) fn body(model: &str, req: &ChatRequest) -> Value {
    let (system, turns) = split_system(req);
    let messages: Vec<Value> = turns
        .iter()
        .map(|m| json!({"role": if m.role == Role::Assistant { "assistant" } else { "user" }, "content": m.text}))
        .collect();
    let mut body = json!({
        "model": model,
        "max_tokens": 16000,
        "messages": messages,
        "output_config": {"effort": effort(req.tier)},
        "fallbacks": "default",
    });
    if !system.is_empty() {
        body["system"] = json!(system);
    }
    body
}

/// Concatenates the `text` blocks; thinking blocks carry no user-facing text.
pub(crate) fn parse(v: &Value) -> Result<String, LlmError> {
    if v.get("stop_reason").and_then(Value::as_str) == Some("refusal") {
        let why = v.pointer("/stop_details/explanation").and_then(Value::as_str).unwrap_or("no details");
        return Err(LlmError::Provider(format!("request declined: {why}")));
    }
    let text: String = v
        .get("content")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter(|b| b.get("type").and_then(Value::as_str) == Some("text"))
        .filter_map(|b| b.get("text").and_then(Value::as_str))
        .collect::<Vec<_>>()
        .join("");
    if text.is_empty() { Err(LlmError::Provider("empty response".into())) } else { Ok(text) }
}

impl LlmClient for Anthropic {
    fn vendor(&self) -> Vendor {
        Vendor::Anthropic
    }

    fn complete(&self, model: &str, req: &ChatRequest) -> Result<String, LlmError> {
        let headers = [
            ("x-api-key", self.key.as_str()),
            ("anthropic-version", API_VERSION),
            ("anthropic-beta", FALLBACK_BETA),
            ("content-type", "application/json"),
        ];
        let v = post_json(URL, &headers, &body(model, req)).map_err(LlmError::from)?;
        parse(&v)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::llm::ChatMessage;

    #[test]
    fn builds_body_and_parses_text_blocks() {
        let req = ChatRequest {
            tier: Tier::Bulk,
            messages: vec![
                ChatMessage { role: Role::System, text: "be brief".into() },
                ChatMessage { role: Role::User, text: "hi".into() },
            ],
        };
        let b = body("claude-haiku-5-5", &req);
        assert_eq!(b["system"], "be brief");
        assert_eq!(b["messages"][0]["role"], "user");
        assert_eq!(b["output_config"]["effort"], "low");
        assert!(b.get("temperature").is_none());

        let resp = json!({"stop_reason":"end_turn","content":[
            {"type":"thinking","thinking":""},{"type":"text","text":"Hello"}]});
        assert_eq!(parse(&resp).unwrap(), "Hello");
        assert!(parse(&json!({"stop_reason":"refusal","content":[]})).is_err());
    }
}

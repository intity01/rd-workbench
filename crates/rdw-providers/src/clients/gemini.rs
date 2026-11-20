//! Google Gemini API (`generateContent`). Uses a Gemini API key from Google AI Studio;
//! a Google AI Pro/Ultra subscription does not include API access.

use super::split_system;
use crate::http::post_json;
use crate::llm::{ChatRequest, LlmClient, LlmError, Role, Vendor};
use serde_json::{Value, json};

const BASE: &str = "https://generativelanguage.googleapis.com/v1beta/models";

#[derive(Debug)]
pub struct Gemini {
    key: String,
}

impl Gemini {
    pub fn new(key: impl Into<String>) -> Self {
        Self { key: key.into() }
    }
}

pub(crate) fn body(req: &ChatRequest) -> Value {
    let (system, turns) = split_system(req);
    let contents: Vec<Value> = turns
        .iter()
        .map(|m| {
            let role = if m.role == Role::Assistant { "model" } else { "user" };
            json!({"role": role, "parts": [{"text": m.text}]})
        })
        .collect();
    let mut body = json!({"contents": contents});
    if !system.is_empty() {
        body["systemInstruction"] = json!({"parts": [{"text": system}]});
    }
    body
}

pub(crate) fn parse(v: &Value) -> Result<String, LlmError> {
    let text: String = v
        .pointer("/candidates/0/content/parts")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(|p| p.get("text").and_then(Value::as_str))
        .collect::<Vec<_>>()
        .join("");
    if text.is_empty() {
        let reason =
            v.pointer("/promptFeedback/blockReason").and_then(Value::as_str).unwrap_or("empty response");
        Err(LlmError::Provider(reason.to_owned()))
    } else {
        Ok(text)
    }
}

impl LlmClient for Gemini {
    fn vendor(&self) -> Vendor {
        Vendor::Google
    }

    fn complete(&self, model: &str, req: &ChatRequest) -> Result<String, LlmError> {
        let url = format!("{BASE}/{model}:generateContent");
        let headers = [("x-goog-api-key", self.key.as_str()), ("content-type", "application/json")];
        let v = post_json(&url, &headers, &body(req)).map_err(LlmError::from)?;
        parse(&v)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn joins_parts_and_reports_blocks() {
        let v = json!({"candidates":[{"content":{"parts":[{"text":"a"},{"text":"b"}]}}]});
        assert_eq!(parse(&v).unwrap(), "ab");
        let blocked = json!({"promptFeedback":{"blockReason":"SAFETY"}});
        assert!(parse(&blocked).unwrap_err().to_string().contains("SAFETY"));
    }
}

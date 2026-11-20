//! OpenAI Chat Completions, also used for any OpenAI-compatible local runtime
//! (Ollama, llama.cpp server, LM Studio) by changing the base URL.

use crate::http::post_json;
use crate::llm::{ChatRequest, LlmClient, LlmError, Role, Vendor};
use serde_json::{Value, json};

pub const OPENAI_BASE: &str = "https://api.openai.com/v1";
pub const LOCAL_BASE: &str = "http://localhost:11434/v1";

#[derive(Debug)]
pub struct OpenAiCompatible {
    vendor: Vendor,
    base: String,
    key: Option<String>,
}

impl OpenAiCompatible {
    pub fn openai(key: impl Into<String>) -> Self {
        Self { vendor: Vendor::OpenAi, base: OPENAI_BASE.into(), key: Some(key.into()) }
    }

    /// Local runtimes usually need no key.
    pub fn local(base: impl Into<String>, key: Option<String>) -> Self {
        Self { vendor: Vendor::Local, base: base.into().trim_end_matches('/').to_owned(), key }
    }
}

pub(crate) fn body(model: &str, req: &ChatRequest) -> Value {
    let messages: Vec<Value> = req
        .messages
        .iter()
        .map(|m| {
            let role = match m.role {
                Role::System => "system",
                Role::User => "user",
                Role::Assistant => "assistant",
            };
            json!({"role": role, "content": m.text})
        })
        .collect();
    json!({"model": model, "messages": messages})
}

pub(crate) fn parse(v: &Value) -> Result<String, LlmError> {
    v.pointer("/choices/0/message/content")
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty())
        .map(str::to_owned)
        .ok_or_else(|| LlmError::Provider("empty response".into()))
}

impl LlmClient for OpenAiCompatible {
    fn vendor(&self) -> Vendor {
        self.vendor
    }

    fn complete(&self, model: &str, req: &ChatRequest) -> Result<String, LlmError> {
        let auth = self.key.as_ref().map(|k| format!("Bearer {k}"));
        let mut headers = vec![("content-type", "application/json")];
        if let Some(a) = &auth {
            headers.push(("authorization", a.as_str()));
        }
        let url = format!("{}/chat/completions", self.base);
        let v = post_json(&url, &headers, &body(model, req)).map_err(LlmError::from)?;
        parse(&v)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_first_choice() {
        let v = json!({"choices":[{"message":{"role":"assistant","content":"ok"}}]});
        assert_eq!(parse(&v).unwrap(), "ok");
        assert!(parse(&json!({"choices":[]})).is_err());
        assert_eq!(OpenAiCompatible::local("http://x/v1/", None).base, "http://x/v1");
    }
}

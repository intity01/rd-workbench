//! Concrete [`LlmClient`]s. All are blocking; run them off the UI thread.

mod anthropic;
mod gemini;
mod openai;

pub use anthropic::Anthropic;
pub use gemini::Gemini;
pub use openai::{LOCAL_BASE, OPENAI_BASE, OpenAiCompatible};

use crate::http::HttpError;
use crate::llm::{ChatMessage, ChatRequest, LlmClient, LlmError, Role, Vendor};

impl From<HttpError> for LlmError {
    fn from(e: HttpError) -> Self {
        match e {
            HttpError::Status { status: 401 | 403, message, .. } => {
                LlmError::Provider(format!("authentication failed: {message}"))
            }
            other => LlmError::Provider(other.to_string()),
        }
    }
}

/// Splits system messages (joined) from the conversation turns.
pub(crate) fn split_system(req: &ChatRequest) -> (String, Vec<&ChatMessage>) {
    let system = req
        .messages
        .iter()
        .filter(|m| m.role == Role::System)
        .map(|m| m.text.as_str())
        .collect::<Vec<_>>()
        .join("\n\n");
    let turns = req.messages.iter().filter(|m| m.role != Role::System).collect();
    (system, turns)
}

/// Credentials and endpoints needed to build a client for any vendor.
#[derive(Debug, Clone, Default)]
pub struct Credentials {
    pub openai: Option<String>,
    pub anthropic: Option<String>,
    pub google: Option<String>,
    pub local_base: Option<String>,
    pub local_key: Option<String>,
}

/// Builds the client for `vendor`, or explains which key is missing.
pub fn client_for(vendor: Vendor, creds: &Credentials) -> Result<Box<dyn LlmClient>, LlmError> {
    let missing = || LlmError::MissingKey(vendor);
    Ok(match vendor {
        Vendor::OpenAi => Box::new(OpenAiCompatible::openai(creds.openai.clone().ok_or_else(missing)?)),
        Vendor::Anthropic => Box::new(Anthropic::new(creds.anthropic.clone().ok_or_else(missing)?)),
        Vendor::Google => Box::new(Gemini::new(creds.google.clone().ok_or_else(missing)?)),
        Vendor::Local => Box::new(OpenAiCompatible::local(
            creds.local_base.clone().unwrap_or_else(|| LOCAL_BASE.into()),
            creds.local_key.clone(),
        )),
    })
}

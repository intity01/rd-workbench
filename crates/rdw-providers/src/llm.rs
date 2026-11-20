//! Official API access to model vendors and a cost-aware router.
//!
//! Only API keys issued by the vendor's developer platform are used here —
//! never consumer-subscription session tokens or cookies.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Vendor {
    OpenAi,
    Anthropic,
    Google,
    /// Any OpenAI-compatible endpoint, e.g. a local runtime such as Ollama or llama.cpp.
    Local,
}

/// How demanding a step is. The router maps tiers to concrete models.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
pub enum Tier {
    /// Bulk background work: summarise, classify, reformat.
    Bulk,
    /// Normal interactive assistant turns.
    Standard,
    /// Decision / argument nodes in the reasoning DAG.
    Flagship,
    /// Multi-step agentic research via a vendor's official deep-research API.
    DeepResearch,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ModelRef {
    pub vendor: Vendor,
    /// Model id exactly as the vendor's API expects it. Configured by the user.
    pub model: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum Role {
    System,
    User,
    Assistant,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: Role,
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ChatRequest {
    pub tier: Tier,
    pub messages: Vec<ChatMessage>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ChatResponse {
    pub model: ModelRef,
    pub text: String,
}

#[derive(Debug, thiserror::Error)]
pub enum LlmError {
    #[error("no model configured for tier {0:?}")]
    NoRoute(Tier),
    #[error("missing API key for {0:?}")]
    MissingKey(Vendor),
    #[error("provider error: {0}")]
    Provider(String),
}

/// Implemented by each vendor client (Phase 1).
pub trait LlmClient: Send + Sync {
    fn vendor(&self) -> Vendor;
    fn complete(&self, model: &str, req: &ChatRequest) -> Result<String, LlmError>;
}

/// Maps a [`Tier`] to a model. Falls back to the nearest *cheaper* tier.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Router {
    routes: Vec<(Tier, ModelRef)>,
}

impl Tier {
    pub const ALL: [Tier; 4] = [Self::Bulk, Self::Standard, Self::Flagship, Self::DeepResearch];
}

impl Vendor {
    pub const ALL: [Vendor; 4] = [Self::OpenAi, Self::Anthropic, Self::Google, Self::Local];

    pub fn label(self) -> &'static str {
        match self {
            Self::OpenAi => "OpenAI",
            Self::Anthropic => "Anthropic",
            Self::Google => "Google Gemini",
            Self::Local => "Local (OpenAI-compatible)",
        }
    }
}

impl Router {
    /// Starting configuration; every entry is editable in Settings.
    pub fn with_defaults() -> Self {
        let claude = |m: &str| ModelRef { vendor: Vendor::Anthropic, model: m.into() };
        let mut r = Self::default();
        r.set(Tier::Bulk, claude("claude-haiku-5-5"));
        r.set(Tier::Standard, claude("claude-opus-5-5"));
        r
    }

    pub fn set(&mut self, tier: Tier, model: ModelRef) {
        self.routes.retain(|(t, _)| *t != tier);
        self.routes.push((tier, model));
    }

    pub fn clear(&mut self, tier: Tier) {
        self.routes.retain(|(t, _)| *t != tier);
    }

    /// The model configured for exactly this tier, if any.
    pub fn get(&self, tier: Tier) -> Option<&ModelRef> {
        self.routes.iter().find(|(t, _)| *t == tier).map(|(_, m)| m)
    }

    pub fn resolve(&self, tier: Tier) -> Result<&ModelRef, LlmError> {
        self.routes
            .iter()
            .filter(|(t, m)| *t <= tier && !m.model.trim().is_empty())
            .max_by_key(|(t, _)| *t)
            .map(|(_, m)| m)
            .ok_or(LlmError::NoRoute(tier))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn router_falls_back_to_cheaper_tier() {
        let mut r = Router::default();
        r.set(Tier::Bulk, ModelRef { vendor: Vendor::Local, model: "small".into() });
        r.set(Tier::Flagship, ModelRef { vendor: Vendor::Anthropic, model: "big".into() });
        assert_eq!(r.resolve(Tier::Standard).unwrap().model, "small");
        assert_eq!(r.resolve(Tier::DeepResearch).unwrap().model, "big");
        assert!(Router::default().resolve(Tier::Bulk).is_err());
    }
}

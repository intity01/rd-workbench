//! "Handoff" to vendors' web deep-research products.
//!
//! The consumer products (ChatGPT deep research, Claude Research, Gemini Deep
//! Research) are only offered through the vendors' own apps. Automating them —
//! scraping, replaying session cookies, embedding the site in a webview — breaks
//! their terms. Handoff keeps the user in control instead:
//!
//! 1. the app builds a research brief from the project (question, scope, sources),
//! 2. copies it to the clipboard and opens the vendor's site in the user's *system* browser,
//! 3. the user runs the research there, signed in with their own account,
//! 4. the user exports the report (Markdown/PDF/DOCX) and the app imports it as a
//!    `SourceType::ResearchReport` source, then verifies its citations.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum WebResearch {
    ChatGpt,
    Claude,
    Gemini,
}

impl WebResearch {
    pub const ALL: [WebResearch; 3] = [Self::ChatGpt, Self::Claude, Self::Gemini];

    pub fn product_name(self) -> &'static str {
        match self {
            Self::ChatGpt => "ChatGPT deep research",
            Self::Claude => "Claude Research",
            Self::Gemini => "Gemini Deep Research",
        }
    }

    /// Landing page opened in the system browser. No query parameters, no tokens.
    pub fn url(self) -> &'static str {
        match self {
            Self::ChatGpt => "https://chatgpt.com/",
            Self::Claude => "https://claude.ai/new",
            Self::Gemini => "https://gemini.google.com/app",
        }
    }

    /// Short instruction shown next to the button.
    pub fn how_to(self) -> &'static str {
        match self {
            Self::ChatGpt => "Paste the brief, pick “Deep research” in the composer, then export the report.",
            Self::Claude => "Paste the brief, turn on Research, then copy or download the report.",
            Self::Gemini => "Paste the brief, choose Deep Research, then export to Docs or copy the report.",
        }
    }
}

/// Inputs for a research brief, taken from the project.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Brief<'a> {
    pub question: &'a str,
    pub scope: &'a str,
    pub exclusions: &'a str,
    pub known_sources: Vec<&'a str>,
}

impl Brief<'_> {
    /// Renders the prompt. Asks for DOIs so the import step can verify citations.
    pub fn render(&self) -> String {
        let mut out = format!("Research question: {}\n", self.question.trim());
        if !self.scope.trim().is_empty() {
            out += &format!("Scope: {}\n", self.scope.trim());
        }
        if !self.exclusions.trim().is_empty() {
            out += &format!("Out of scope: {}\n", self.exclusions.trim());
        }
        if !self.known_sources.is_empty() {
            out += "Already reviewed (do not repeat):\n";
            for s in &self.known_sources {
                out += &format!("- {s}\n");
            }
        }
        out += "\nOutput format: Markdown with headings, a findings section, open questions, \
                and a reference list where every entry has a DOI or a stable URL.\n";
        out
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn brief_mentions_everything_given() {
        let b = Brief { question: "Q?", scope: "local", exclusions: "", known_sources: vec!["Paper A"] };
        let text = b.render();
        assert!(text.contains("Q?") && text.contains("local") && text.contains("- Paper A"));
        assert!(!text.contains("Out of scope"));
    }

    #[test]
    fn urls_carry_no_parameters() {
        assert!(WebResearch::ALL.iter().all(|w| !w.url().contains('?')));
    }
}

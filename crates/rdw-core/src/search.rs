//! Naive in-memory search, ported from `prototype/web/src/app/lib/search.ts`.
//! Replaced by Tantivy (BM25 + Thai-aware tokenizer) in Phase 2.

use crate::Workspace;

const STOP: [&str; 11] = ["the", "and", "for", "with", "from", "that", "this", "what", "how", "are", "into"];

/// Thai vowel and tone marks are combining marks, not alphanumerics; keep the whole block.
fn is_thai(c: char) -> bool {
    ('\u{0E00}'..='\u{0E7F}').contains(&c)
}

/// Lower-cases and splits on anything that is not a letter, digit or `-`.
/// Thai has no spaces between words, so Thai runs stay whole until ICU segmentation lands.
pub fn tokenize(q: &str) -> Vec<String> {
    q.to_lowercase()
        .split(|c: char| !(c.is_alphanumeric() || c == '-' || is_thai(c)))
        .filter(|t| t.chars().count() > 1 && !STOP.contains(t))
        .map(str::to_owned)
        .collect()
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HitKind {
    Project,
    Source,
    Node,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Hit {
    pub kind: HitKind,
    pub id: String,
    pub title: String,
    pub score: usize,
}

fn score(tokens: &[String], text: &str) -> usize {
    let text = text.to_lowercase();
    tokens.iter().filter(|t| text.contains(t.as_str())).count()
}

/// Every token must match (AND semantics); results sorted by score, then title.
pub fn search(ws: &Workspace, query: &str) -> Vec<Hit> {
    let tokens = tokenize(query);
    if tokens.is_empty() {
        return Vec::new();
    }
    let projects = ws.projects.iter().map(|p| {
        (
            HitKind::Project,
            p.id.to_string(),
            p.name.clone(),
            format!("{} {} {}", p.name, p.description, p.tags.join(" ")),
        )
    });
    let sources = ws.sources.iter().map(|s| {
        (
            HitKind::Source,
            s.id.to_string(),
            s.title.clone(),
            format!("{} {} {}", s.title, s.authors, s.abstract_text),
        )
    });
    let nodes = ws
        .graph()
        .nodes()
        .map(|n| (HitKind::Node, n.id.to_string(), n.label.clone(), format!("{} {}", n.label, n.desc)));
    let mut hits: Vec<Hit> = projects
        .chain(sources)
        .chain(nodes)
        .filter_map(|(kind, id, title, text)| {
            let s = score(&tokens, &text);
            (s == tokens.len()).then_some(Hit { kind, id, title, score: s })
        })
        .collect();
    hits.sort_by(|a, b| b.score.cmp(&a.score).then_with(|| a.title.cmp(&b.title)));
    hits
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tokenize_drops_stop_words_and_keeps_thai() {
        assert_eq!(tokenize("The worker และ งานวิจัย"), ["worker", "และ", "งานวิจัย"]);
    }

    #[test]
    fn search_finds_seeded_entities() {
        let ws = Workspace::with_seed();
        let hits = search(&ws, "workers");
        assert!(hits.iter().any(|h| h.kind == HitKind::Node));
        assert!(search(&ws, "zzzz-no-match").is_empty());
    }
}

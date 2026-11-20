# AI providers and deep research — the compliant way

This project is open source, so whatever it does, every user does. It must not depend on anything
that breaks a vendor's terms of service.

## What is *not* allowed (and what we will not build)

| Approach | Why not |
| -------- | ------- |
| Logging in to chatgpt.com / claude.ai / gemini.google.com on the user's behalf | Consumer terms forbid automated access to the web apps |
| Reading or replaying the user's browser cookies or session tokens | Same, plus it is credential handling we never want in an open-source app |
| Embedding the vendor site in a webview and scripting it | Same — and this project has no webview by design |
| Re-using a consumer-plan OAuth token in a third-party app, rotating several accounts to dodge limits | Account-suspension risk under consumer terms |

A consumer subscription (ChatGPT Plus/Pro, Claude Pro/Max, Google AI Pro/Ultra) is a licence to use
**the vendor's own apps**. It is generally *not* API access. Vendors do change plans — some bundle
API credits with higher tiers — so check the current pricing page before assuming either way.

## The three compliant integrations

### 1. Deep Research Handoff (works with your subscription) — implemented

Called *handoff*: the app prepares the work, you run it in the vendor's product, the app takes the
result back.

1. The Research screen builds a **brief** from the project (question, scope, exclusions, sources
   already reviewed) and asks for Markdown output with a DOI or stable URL per reference.
2. One click copies the brief to the clipboard and opens the vendor's site in your **system
   browser**. You are signed in there with your own account; the app never sees credentials.
3. You run *ChatGPT deep research*, *Claude Research* or *Gemini Deep Research* and export the report.
4. You import the file. It becomes a `ResearchReport` source; its references are checked against
   OpenAlex / Crossref and its claims can be pulled into the knowledge graph. *(Import: Phase 2.)*

Code: `crates/rdw-providers/src/handoff.rs`, `apps/rdw-desktop/src/screens/research.rs`.
The URLs carry no query parameters and no tokens.

### 2. Bring Your Own Key (official APIs) — Phase 1

For anything the app runs by itself (summaries, extraction checks, argument nodes), it uses the
vendor's **developer API** with a key the user creates in the vendor's console and pays for per use.

- `LlmClient` trait per vendor, `Router` maps a `Tier` (Bulk → Standard → Flagship → DeepResearch) to a
  model and falls back to the nearest cheaper tier. Cheap or local models take bulk work.
- Deep research **through the API** is possible where the vendor offers it (for example OpenAI's
  deep-research models in the Responses API and Google's Deep Research agent in the Gemini API) or
  can be built as an agent loop with web-search tools (for example Claude with its web search tool).
  Model names and availability change; they are user configuration, not hard-coded.
- Keys are stored in the OS credential store (Windows Credential Manager / macOS Keychain / Secret
  Service), never in project files or logs.
- Any OpenAI-compatible local runtime (Ollama, llama.cpp, LM Studio) is the `Local` vendor.

### 3. MCP server (AI apps query *your* data) — later phase

Instead of the app reaching into ChatGPT/Claude/Gemini, those apps reach into the app: R&D Workbench
exposes a **Model Context Protocol** server (official Rust SDK `rmcp`) with read-mostly tools such as
`search_library`, `get_node`, `list_claims`, `export_brief`. Desktop AI clients that support local MCP
servers can then use your research database inside your normal subscription — sanctioned by the
vendors because the user connects it themselves. Some clients only accept remote (HTTPS) MCP servers;
that needs a separate, opt-in design.

## Citation metadata services

Defaults in `crates/rdw-providers/src/citation.rs` are deliberately conservative and configurable.
Every source gets its own `TokenBucket`, lookups go through a persistent local cache first, and the
order is OpenAlex → Crossref → Semantic Scholar. Google Scholar has no API and disallows bots; it is
not used. Re-check each provider's current limits and key requirements before raising the defaults.

## Checklist for contributors adding a provider

- [ ] Uses an official, documented API or an explicit user action — never a scraped web session.
- [ ] Credentials come from the OS credential store and are never logged.
- [ ] Has its own rate limiter and handles `429` / `Retry-After`.
- [ ] Model ids and limits are configuration, not constants.
- [ ] Docs link to the provider's terms and pricing pages.

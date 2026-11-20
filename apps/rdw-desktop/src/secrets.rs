//! API keys live in the OS credential store (Windows Credential Manager,
//! macOS Keychain, Secret Service on Linux) — never in the database or logs.

const SERVICE: &str = "rd-workbench";

/// Every secret the app knows about: (account name, label shown in Settings).
pub const SLOTS: &[(&str, &str)] = &[
    ("anthropic", "Anthropic API key"),
    ("openai", "OpenAI API key"),
    ("google", "Gemini API key"),
    ("local", "Local runtime key (optional)"),
    ("openalex", "OpenAlex API key (optional)"),
];

fn entry(name: &str) -> Result<keyring::Entry, String> {
    keyring::Entry::new(SERVICE, name).map_err(|e| e.to_string())
}

/// Returns `None` when the secret is not set or the store is unavailable.
pub fn get(name: &str) -> Option<String> {
    entry(name).ok()?.get_password().ok().filter(|s| !s.is_empty())
}

pub fn set(name: &str, value: &str) -> Result<(), String> {
    entry(name)?.set_password(value.trim()).map_err(|e| e.to_string())
}

pub fn delete(name: &str) -> Result<(), String> {
    match entry(name)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

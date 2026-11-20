# Security policy

## Supported versions

The project is pre-alpha; only the latest `main` receives fixes.

## Reporting a vulnerability

Please **do not** open a public issue. Use
[GitHub private vulnerability reporting](https://github.com/intity01/rd-workbench/security/advisories/new).
Expect an acknowledgement within 7 days.

## Scope we care about most

- Handling of API keys and other credentials (must stay in the OS credential store, never logged).
- Worker processes and future plugins: sandbox escapes, path traversal in imported files.
- Parsing of untrusted documents (PDF, DOCX, Markdown) and worker protocol messages.

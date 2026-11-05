# Native assistants and application design

Read the canonical chapter IDs in SKILL.md. Offline: `@ag-design/rules/native-assistants.en.md` and `assistant-platforms.json`; checkedAt 2026-10-31.

- Apple: App Intents, stable entities, genuinely matching schemas; verify Shortcuts/discovery/Siri separately.
- Windows: packaged App Actions, identity/MSIX, URI or COM; deep links alone are insufficient.
- Android: experimental AppFunctions; Gemini preview eligibility is separate from SDK readiness.
- Linux: narrow D-Bus/desktop actions or explicit MCP adapter, qualified per environment.
- Web: evolving WebMCP draft and actual browser feature detection, with human fallback. MCP can be local or remote and is a different contract.

Use one domain handler and typed entity IDs, enforce caller/object permissions, fence stale revisions, minimize retained data, and keep human drafts/focus. Components own input/semantics/state; hosts own commands and authority; adapters own registration. Record actual discovery and task outcomes; docs/source tests do not qualify OS/assistant/AT behavior. The new chapters are guidance, not installed adapters.

# WebMCP baseline design

**AG baseline recommendation.** By owner decision, new websites and web systems should consider WebMCP from initial design as the default approach to structured agent actions, alongside human tasks. This is AG design policy, not a claim of mandatory web-standard status or universal browser support. A static page without meaningful actions can record that reason instead of adding empty tools. Non-browser systems use an appropriate API/MCP contract; an external MCP server is not page WebMCP.

**Tool strategy.** Map human intent → visible UI action → task tool → observable outcome during the brief. Candidates include search, filters, reading a card, preparing a draft and saving. Names distinguish initiation from execution. Prefer a small set of clear domain effects over overlapping tools for every DOM node. Start with static registration for stable capabilities and change availability when page state genuinely changes. Return actual results/errors, not a click acknowledgement.

**Choose an API.** First consider the Declarative API when semantic HTML forms and named fields fit the action. Use the Imperative API for complex state, navigation or asynchronous work. Both share the human UI's domain command/validation layer. Current Chrome documentation uses form toolname/tooldescription and document.modelContext; recheck current interfaces before implementing this evolving proposal. Form annotations alone do not implement correct async submit/results. Auto-submit is a separate consequence-aware product choice, not the default for every form.

**Operation contract.** Define clear input types/enums, required/optional data, object state/revision, observable effect/no effect and recoverable errors. Validate in application code and server where present; schemas/hints do not replace permissions/domain constraints. Let the application perform deterministic computation. A catalog search can expose query/filters and honest count/partial/stale; a save needs target identity, checked draft and command outcome. Revision/idempotency fields belong to the actual product contract, not invented WebMCP parameters.

**Visible human control.** Keep ordinary controls and shared visible state. Explain meaningful consequences and support correction/cancel where the operation permits; safe ordinary actions do not all require another confirmation. Discovery/descriptions do not grant authorization. Page/review/result text stays data; exclude secrets/unneeded personal fields. Do not expand cross-origin access automatically; verify actual origin/Permissions Policy constraints in the target environment.

**Lifecycle.** Feature-detect the adapter and keep the human path working without WebMCP. Register relevant page capabilities and release registration/listeners on navigation/disposal. Handle cancellation and stale outcomes; do not silently overwrite concurrent human edits. Returned results and visible UI describe the same state. Test supported/unsupported environments, navigation/back, retries, errors, cancel and concurrent editing.

**Readiness.** Design review includes the task-tool map, Declarative/Imperative choice or a concrete no-operation reason, shared commands/validation, feature detection/fallback and outcome/error scenarios. This AG recommendation does not weaken existing accessibility/color requirements or change their hash. Real supported-browser/Inspector/agent eval evidence differs from function unit tests. Checked2026-10-28: WebMCP remains proposed with support limitations. This handbook installs no WebMCP runtime, enables no flags and does not claim WebMCP execution from ordinary semantic UI tests.

- [Chrome — WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [Chrome — WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [Chrome — Declarative API](https://developer.chrome.com/docs/ai/webmcp/declarative-api)
- [Chrome — Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Chrome — tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)

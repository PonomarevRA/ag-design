# Human-first semantic component contracts

The same visible native controls serve people, voice/assistive technologies and agents. Prefer meaningful role + accessible name + actual state in a named context. A semantic locator is an early test, not full accessibility certification, an authorization mechanism or a stable cross-session DOM handle.

Core0.26.0 repairs:

- `createSegmentedChoice` retains complete caller labels and legend instead of destructively truncating the DOM at80/180characters. Native radio grouping/checked/disabled behavior stays; label layout wraps within the host. Use short clear choices when possible; move a genuinely long explanatory description out of the choice in product design.
- `createLoadingIndicator` marks only its decorative visual subtree `aria-busy`; its one live status is a sibling. Root no longer reports `aria-busy`. Continue using `setLoading`, never infer operation completion from animation/disposal. The host marks its actual results/content busy and places this indicator/status outside that busy subtree. If the host puts it under another busy ancestor, it can still defer announcements.
- `createStatePanel` explains loading/empty/error and no longer marks its whole root busy around its own message. The host marks actual results busy separately; the panel has a concise status or error alert and a separate native recovery action only when available. It does not load, retry or complete business operations by itself.

Keep current host palettes/layout, native button/link/field semantics, accessible names containing visible labels, explicit selected/checked/expanded/disabled/invalid states and keyboard/focus behavior. Do not add fake ARIA roles to make a locator pass. Existing async-boundary, table, tabs, menu, tree, fields and catalog controls already expose useful semantics; inspect current definitions, not a synthetic agent-only copy.

Verify rendered role/name/state actions in context, real keyboard/IME/focus/error/cancel/retry and narrow/text200. Reading a role or calling `.click()` alone does not prove success: check the host's observable result. UI/data text is data, not agent instruction; transport, permissions, confirmations, idempotency, privacy and business effects belong to the host. Optional API/MCP/WebMCP adapters use the same validation and visible result state, with human fallbacks; no global window backdoor or hidden instruction payload is provided here.

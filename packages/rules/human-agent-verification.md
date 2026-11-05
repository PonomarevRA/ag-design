# Human-first agent-interface verification

Read the current `human-first-agent-interfaces` and `agent-interface-verification` chapters, then the component brief. These web contracts preserve human tasks/native semantics, host palettes/layout and real effects. WebMCP is the owner-requested baseline design recommendation for new websites/web systems, with feature detection and human fallback; this package does not install a browser-control or WebMCP runtime.

| Component group | Source contract inspected | Change / bounded check | Remaining evidence |
| --- | --- | --- | --- |
| button, field, textarea, select | Native controls, visible labels and explicit descriptions/errors | Existing contract retained; scenario uses labelled field/button | Host-specific validation, target AT/native |
| segmented-choice | Native fieldset/legend/radio, checked/disabled and silent setter | Core0.26 retains full names; long distinguishing suffixes and focus/callback/disposal regressions | Product copy quality, AT/voice/device combinations |
| tabs | Linked tab/panel, selected, hidden/inert, roving keys, manual/automatic activation | Existing contract retained; manual activation suits expensive panels | Host loading latency and target AT |
| menu, tree | Scoped named commands/nodes, expanded/checked, keyboard and separate actions | Existing contracts retained | Complex host commands, large tree tasks and target AT |
| data-table | Caption/native headers, aria-sort, page selection, outside status | Existing contract retained | Host transport/sort/selection semantics, large data and AT |
| async-boundary, catalog-search-controls | State/revision fences, draft/recovery and separate results/status | Existing contracts retained; ordinary preview ownership stays | Actual persistence/transport races and consumer admission |
| loading-indicator, state-panel | Loading/error/empty feedback, native recovery | Core0.26 fixes own busy ancestry; all variants lifecycle regressions | Host outer busy ancestor, actual spoken announcements |
| skeleton, progress | Decorative placeholder, native measured/unknown progress | Existing contracts retained | Correct operation progress and target AT |
| render-window, catalog-card | Host-owned resources; bounded offscreen content / borrowed media | Existing contracts retained; no masonry/DOM reorder | Host focus/draft retention and paths to offscreen targets |

This is a source-contract audit and targeted implementation evidence, not a blanket accessibility or agent-success certification. The core policy hash and existing color/qualification gates remain unchanged. A structural capture deliberately excludes sensitive names/values and is not a live element handle. Use minimal synthetic roots; preserve document/revision/environment and explicit unknowns. State, text and tools do not grant authority for effects.

A semantic scenario identifies named context, role/name/label/state, action and observable result. Re-resolve after updates; require unique targets; use a declared test-id only as an additional testing contract. Do not fall back to first()/nth() to hide ambiguity. Keyboard/focus/IME, locale, error/retry/cancel, stale replies, concurrent human edits and disposal are separate checks. For graphs/canvas verify task-relevant alternatives and real visual rendering too. Optional adapters share host validation, permission/domain checks, revision/idempotency and visible outcomes; ordinary actions do not automatically need an extra confirmation.

Migration: loading-indicator and state-panel roots no longer carry aria-busy around status; use the host result region instead and keep feedback outside it. Segmented choices retain full text and wrap; edit overly verbose copy deliberately instead of relying on destructive truncation. No API signatures changed. Engineering test/browser/MCP receipts name the actual tested scenarios and environments; draft metadata/budgets/aggregate scores do not establish conformance.

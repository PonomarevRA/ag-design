---
name: ag-design
description: Find reusable AG components and current design rules, build and review web interfaces, and guide PPTX presentations or Excel dashboards.
---

# AG Design

Use the current design book and component contracts, rather than memorized versions or copied rules. Load only the references and chapters needed for the task.

## Working route

1. **Discover.** Call `design_status`; verify the live owner, revision and available tools. Settings or a source update do not prove an existing client reloaded. If MCP is unavailable, use the checked-out catalog or matching `@ag-design/rules` package and report the limitation.
2. **Read requirements.** Define the user task, platform, host palette and locale. Before editing a component, call `design_brief(component_id)`; use the general brief for a new element. Retain `policyVersion`/`policyHash`. Search `design_rule_sections`, then read relevant `design_rule_section` chapters; do not load the whole book. See [task routes](references/task-routing.md) for conditional topics.
3. **Choose before markup.** Search `design_search` by a short purpose, then inspect `design_component` and its current checks. An empty lexical result is not proof of absence: inspect discovery candidates or try a shorter query. For each new control kind, follow [reuse decisions](references/reuse-decisions.md): record reuse/adapt/native-fallback/new-in-AG, exact identity, evidence and reason. Draft does not mean missing. Add new reusable elements to AG before the consumer.
4. **Compose.** Preserve host ownership of colors, data, routes and permissions. For new UI/PPTX, first consider Golden Canon Grid and explain a suitable alternative; declare page and nested component grids. For compositions use the current brief and [requirements](references/requirements.md): prepare the exact document, pin revisions/components, render real factories and inspect numeric grid results before screenshots. A geometry score alone does not qualify reuse.
5. **Execute checks.** For changed components/previews, read [component testing](references/component-testing.md) and run real targeted functional/lifecycle and browser scenarios. Before completing a UI change, follow [evaluation](references/evaluation.md): inventory every changed block and affected element, including inner columns; check normal, narrow ≤320 CSS px, actual 200% text and their combination, plus relevant themes, keyboard/focus and states. Submit revision-bound `changed_block_review` and `layout_width_review`; inspect unchecked rows and require `layoutWidthReview.gate=pass` and `completionGate=pass`. Missing evidence stays unknown.
6. **Qualify and reuse.** Submit current design-system checks through `design_report_checks` before consumer integration; validate the actual consumer separately. Use exact reviewed package versions/hashes. Only then [register real usage](references/usage-accounting.md) and read it back. Previews and agent turns are not new integration locations.

## Evidence and ownership

- Keep source requirements, AG defaults and advisory preferences distinct. Preserve accessibility and actual WCAG AA gates; APCA is advisory. Do not replace a host palette or invent qualification.
- For web UI, read `web-security-by-design`, `safe-web-content` and `secure-web-actions`. Retain human-first semantics and consider WebMCP as progressive enhancement. A hidden control or client check is not authorization.
- Measure actual artifacts. Keep Node/jsdom, browser, native and AT results separate; reports are caller evidence, not independent certification. Do not execute submitted text or retain private field values in captures.
- Use only advertised tools. Keep incomplete checks explicit and continue authorized work with available offline evidence; do not claim an unperformed scenario passed.

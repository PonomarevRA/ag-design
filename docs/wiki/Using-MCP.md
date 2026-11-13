# Agents and MCP

[Русский](Using-MCP-ru.md) · [Home](Home.md)

1. Discover the actual tools and read `design_status`. A cached client list does not prove a running owner reloaded.
2. Call `design_brief` before component work. Retain its current policy version/hash.
3. Search by purpose with `design_search`, then inspect actual candidates with `design_component`. No exact hit does not prove no reusable basis exists.
4. Find a chapter through `design_rule_sections` and read it with `design_rule_section`. Use `design_recommendations` for task/stage/platform advice. Example: search `Atomic Design`, then read `atomic-design-composition`.
5. Reuse existing factories and declared variants. Preserve native semantics and the host palette. Put reusable shared elements in the design system before consumer integration.
6. Render actual states and contexts, submit current evidence and inspect unknown/unchecked cases. Geometry does not execute or attest keyboard/AT scenarios.

For sandbox work use the freshly advertised composition operations, exact document/revision/pins and idempotency keys. Do not turn descriptive recipe JSON into invented API arguments. MCP schemas stay stable while detail is fetched on demand.

The installer can add the skill; client MCP registration remains an explicit merge of the generated snippet. Existing client servers/settings are preserved. Reconnect after installation or contract changes.

## Applying AG rules in Figma

Find “Figma” through `design_rule_sections`, then read `design_rule_section(section_id="figma-design-workflow", locale="en", audience="user")`. For stage advice use `design_recommendations(query="Figma", stage="layout")`. The chapter maps current AG rules to frames, components, variables and handoff. It is also available in the design book.

## Private project catalogs

Before building UI, call `design_project_components(project_id="demo-project")` to look for reusable project components. After implementation, use `design_save_project_component` to record the purpose, locations, states and optional shared AG component IDs. Example:

```json
{
  "project_id": "demo-project",
  "component_id": "project-settings-form",
  "title": "Project settings",
  "purpose": "Edit the name and visibility of a project",
  "locations": ["settings/project"],
  "states": ["default", "saving", "error"]
}
```

Add `component_id` to the catalog call for the full record. Use its `revision` as `expected_revision` when editing or calling `design_remove_project_component`. Omit it when creating a record.

Records live in the AG Design runtime SQLite database. The default user data directory is outside the checkout. Shared search, repository publication and usage counts read separate sources. `project_id` provides logical scoping. Clients with access to the same local MCP can address any project catalog. Component code and files stay in the project.

## Application updates

At the end of a task that used ag-design, optionally call `design_claim_update_reminder` once. When it returns a new version, append a short note with the release link and user-facing changes. Empty responses and errors leave the task result intact. A new reminder can be claimed after three days. Use `design_update_status` to read the cache without claiming a reminder.

# Decide component reuse before UI implementation

AG policy,2026-10-31. Applies to products, labs and prototypes. Standard HTML can be correct; an addressed choice and consistent geometry remain required. One broad search or recommendation is not a component decision.

1. Inventory distinct new control kinds in the affected scenario. Group identical repeats; record variants with different requirements separately.
2. Search each purpose and inspect the exact candidate. For forms consider actual select/createSelect, dropdown-select, input/textarea and field containers. Confirm IDs/exports from the current catalog/package. A mixed top3 query returning a table does not prove no select exists; refine by one purpose.
3. Read the contract, platform/exports and exact-version checks. Distinguish missing code, unavailable host/export, unsuitable contract, implemented but missing/stale qualification, and admitted applicable reuse. Draft/readyForConsumer=false is not “absent” or “broken”; old PASS cannot transfer.
4. Before markup, record one bounded row per control kind in the existing task/report: `role/location | exact ID/export/version or addressed no-match | contract/readiness evidence | reuse/adapt/native-fallback/new-in-ag and specific reason | actual checks/unknown/next step`. Update after validation. Do not create a document per button.

Prefer a suitable admitted AG component over a duplicate. Adapt public options/composition/tokens while the host owns data/routes/events. If code fits but qualification is absent, identify missing checks and either qualify/repair in AG within scope or use a permitted native fallback with an explicit limitation. Never invent PASS, enlarge scope silently or treat all drafts as unavailable implementations. For an unsuitable contract name the unmet requirement. Put new reusable behavior in AG before product duplication. If MCP is unavailable, inspect pinned offline artifacts and mark freshness unknown; transport failure is not proof of absence.

## Native fallback obligations

Native HTML, including the native element inside an AG factory, retains platform semantics. Explain the choice of factory separately from styling. A fallback still checks semantic palette/themes, density/targets, label/control/hint tracks, grid and leading/trailing padding. Reserve a separate indicator slot: native select text padding does not position its system arrow. Core0.36.1 offers local shared select-indicator.css for closed single-selects; inspect applicability and do not apply it blindly to multi/size listboxes or third-party controls.

Verify long labels/values, narrow containers, enlarged text, RTL/high contrast, focus and disabled/invalid/required states. Preserve IDs, values, events, reset and drafts; cosmetic changes must not rebuild forms. Prefer verified shared styling/tokens and improve missing common geometry in AG. CSS/token adoption alone does not claim factory qualification or authorize usage-count increments. No external assets or duplicated business logic.

At review, every new distinct control kind has a choice/reason and checks; local/native paths cannot waive geometry/accessibility. “The library did not fit”, “faster to write HTML”, “only a research demo” or a broad empty search is insufficient. Unverified checks stay unknown with an owner/next step. Missing decisions or unresolved basic visual defects cannot be reported as completed UI review.

This is a required agent workflow/manual review rule, not an implemented server-side code-generation blocker, automatic qualification or a guarantee that every model follows it. Existing admission and independent-review gates remain unchanged.

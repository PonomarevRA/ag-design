# Requirements, variants and Apple shape relationships

Read `design_brief` before implementation. The brief contains the policy hash, applicable rules, source provenance, measurement units and supported implementation choices. For new metadata use the general brief plus purpose-specific chapters. A draft variant becomes reusable only after design-system qualification; a listed alternative alone has no qualification.

- Use compact/comfortable/touch density according to input and content; keep labels, focus and error recovery in every variant.
- Keep familiar secondary local actions eligible for icon-only; main/ambiguous actions retain visible text.
- Native Apple controls use their platform APIs. Web `resolveCornerRadius` implements uniform inset/circular-arc geometry only: clamp(max(0,parentRadius-inset),child dimensions). Asymmetric insets or continuous corners need separate review. Concentric nesting does not mandate identical sibling radii. Choose fixed, capsule or concentric-with-fallback by role and context.
- Preserve semantic host colors. Custom profiles support light/dark and explicit increased-contrast alternatives; do not silently claim a missing appearance as checked. Actual text/background contrast remains a separate WCAG gate; APCA ranking cannot waive it.

V2 evaluation accepts summary observations and detailed requirement observations. Omitted rules remain unknown. Quantitative passes require a finite value in the declared unit; an over-limit value becomes fail even if the caller wrote pass. Recommendations can lower score; mandatory failure blocks readiness. N/A needs a specific reason and does not authorize overriding applicable WCAG requirements.

`design_report_checks` includes `designReview:{policyVersion,policyHash,observations}` from the current brief. A stale policy or missing/failed review cannot qualify a pass. Latest failures revoke earlier admission. Evidence is caller-reported; actual tests, browser/AT versions and scope remain necessary. Existing historical reports are retained, never silently promoted.

Offline sources: `@ag-design/rules/design-requirements.json`, `interface-rubric.json` and the matching authored sections. The policy bundled with the service controls admission; optional user-authored prose cannot override it. A changed policy hash invalidates older pass evidence. New MCP tools require a reconnect/new client before live availability can be claimed.

## Runtime UI-map evidence

When the actual owner advertises `import_ui_snapshot`, `ui_map`, `ui_node`,
`evaluate_ui_map` and `compare_ui_maps`, use the following bounded cycle:

1. Read `design_brief`, retain its policy hash and select a suitable implemented variant.
2. Render one explicit local root. Use the portable offline export `import { captureUiSnapshot } from '@ag-design/rules/ui-map-capture'` and call it with that Element root. Capture structural data by default; never retain field values,
   passwords, original private IDs, URLs or customer text. Approved text is for synthetic fixtures.
3. Import the snapshot and create the first map with `snapshot_id` and `offset=0`.
4. Use the returned immutable `graph_id` for every later page and collection. A graph404 or
   identity/policy409 expires the selected result; discard old pages and explicitly create a new
   first map. Do not silently rebuild or combine generations.
5. Evaluate supported observations through the current requirements. One observation per rule
   aggregates all targets. Declared physical alignment and uniform circular-inset residuals are
   measurable; grouping remains advisory. Color, AT, optics, keyboard and scenario evidence not
   supported by this adapter stays unknown and requires separate checks.
6. Repair, render and capture again. Comparison takes two **graph IDs**, not snapshot IDs.
   Changed/unknown environment, coverage, policy or method prevents improvement claims.
   Unverified imported host keys are heuristic, never authenticated stable identity.

The HTTP adapters use only fixed same-origin POST paths: `/api/v1/ui-snapshots` (direct snapshot,
4 MiB), `/api/v1/ui-map`, `/api/v1/ui-node`, `/api/v1/ui-map-evaluation`,
`/api/v1/ui-map-comparison` (64 KiB each). Results are bounded and caller-reported. These
operations never fetch a submitted URL, execute captured text, register qualification, or certify
accessibility. Old installed services and existing MCP connections may not expose these tools;
verify fresh discovery rather than assuming that source changes updated them.

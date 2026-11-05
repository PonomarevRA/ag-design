# Offline UI snapshot adapter

Import `captureUiSnapshot` from `@ag-design/rules/ui-map-capture`. The subpath is the exact bounded adapter used by the local UI-map application; importing it performs no capture, network access or DOM mutation.

```js
import { captureUiSnapshot } from '@ag-design/rules/ui-map-capture';
const snapshot = await captureUiSnapshot(explicitLocalRoot, {
  signal: controller.signal,
  source: { artifactId: 'screen-local', scenarioId: 'edit', stateId: 'draft' }
});
// Pass this ordinary JSON through the advertised import_ui_snapshot tool.
```

The host supplies an explicit local rendered root. Structural privacy is the default: original DOM IDs, field values and full HTML are excluded; labels are redacted while safe presence/source metadata remains. Approved text requires a deliberate host decision. Capture is caller-reported browser geometry, not AT verification or an atomic screenshot. Unsupported scope and mutation produce explicit coverage; cancellation never publishes an obsolete result.

Ceilings are 5000 nodes, 20000 relations, 4 MiB normalized JSON, depth128 and a maximum1000ms capture deadline. Choose lower supported budgets if needed; do not invent complete coverage for virtualized/offscreen content. CSS-pixel AABBs are not painted ink, target hit areas or observed keyboard order.

Use current design_brief policy/hash, select a variant, render, capture, inspect ui_map/ui_node and evaluate_ui_map, then repair and compare only comparable immutable graph IDs. Geometry evidence does not turn unknown optical, AT, color or reflow checks into passes. No service URL, remote script, screenshot fetch or business action is accepted by this adapter.

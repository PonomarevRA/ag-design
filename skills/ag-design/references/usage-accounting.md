# Registered component use

After real reuse, record the exact component, package version, consumer and logical integration location. The counter measures **distinct registered integration locations**, not page views, renders, package downloads, agent turns or runtime calls. Never register synthetic previews, load fixtures, research or a component merely considered for use. A larger count is not evidence of quality, accessibility or admission.

1. Discover the running version and exact component ID with `design_status`, `design_component` and `design_usage`. Library components use their returned ID, not a guessed local or versioned alias. Use `design_usage_summary` when freshly advertised to read counts; otherwise report that the summary operation is unavailable.
2. Complete actual design-system and consumer checks for the exact definition/artifact/version. Preserve unknowns. If required qualification is missing, report the integration as pending in the project's existing integration record; do not manufacture passing evidence or bypass `consumer_check_required` to increase a count.
3. Identify one stable logical location (for example a module and named view). Repeated component instances produced by that one integration count once. Different independently implemented locations get separate records. Keep a stable consumer ID across chats and agents. Do not change capitalization, spelling or path aliases to manufacture another use.
4. Read existing records before writing. Reuse an existing exact record. For a new verified version, retain historical evidence and use a deterministic new record ID based on the same consumer/component/location plus the version. Do not use timestamps, random IDs, agent IDs or task IDs to make retries unique. Aggregation deduplicates the same integration across versions and record IDs.
5. Call `design_register_usage` with the advertised fields only: `id`, `componentId`, `consumerId`, `consumerName`, `version`, `location`, `note`. There is no mutable `count` field and no arbitrary increment operation. Use a short factual rationale. Do not upload credentials, private user data or transcripts. This write is a local metadata fact, not permission to publish consumer names.
6. Read back with `design_usage(component_id, consumer_id)`, following bounded pages until the record is found. On an ambiguous write failure, inspect existing state before retrying the identical payload/ID. `library_conflict` means fields differ: compare them rather than deleting history or inventing another use. Confirm summary counts if available; a version upgrade at the same location should leave the count unchanged.

Example after genuine qualification:

```json
{
  "id": "demo-panel-button-main-v1",
  "componentId": "button",
  "consumerId": "demo-panel",
  "consumerName": "Demo panel",
  "version": "<exact inspected package version>",
  "location": "src/main-panel.js:primary-action",
  "note": "Native DOM action, consumer checks recorded for the exact artifact."
}
```

The catalogue can display raw counts or a relative 0–5 score. Its whole-catalogue population is kept stable while filtering/searching. Ten discrete anchors P1/P5/P10/P30/P45/P65/P80/P90/P99/P100 divide the score into nine equal intervals; interpolation is linear in the source values within each interval. Clamp outliers, keep equal values equal, skip duplicate intervals, and return zero when all anchors coincide. Empty/unavailable data is unknown, not zero. The numeric badge preserves the exact source number in its accessible name/title. These are registered facts supplied by callers, not verified runtime analytics.

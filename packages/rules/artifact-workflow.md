# Agent workflow for presentations, workbooks and data narratives

Use the compact English design-book entry first. Search by the actual format/question; read the full English user edition when detail is required. Primary source cards are in artifact-research.json; artifact-profiles.json is an authored AG selection aid, not a research-derived maturity score.

1. Define audience, decision, source/period/grain/units/baseline/denominator, reading mode, refresh, locale, required editability and target application/version. Separate facts from assumptions; use clearly synthetic data if examples are needed.
2. Select `artifact-format-selection`, then the relevant `presentation-storytelling`/`pptx-production` or `excel-dashboard-levels`/`excel-dashboard-production` sections. Add `data-explanation`, `persuasive-copy` and `artifact-validation` as applicable. Do not fetch the entire book by default.
3. Route to the available format-specific presentation or spreadsheet skill/producer, following the skill router. Inspect actual capabilities before promising charts, formula recalculation, PivotCharts, slicers, accessibility metadata or native editability. Do not construct a web mockup and relabel it PPTX/XLSX.
4. Build from typed source values. Keep calculations auditable, claims warranted and uncertainty legible. Use generated images for appropriate illustration, never exact chart values/labels. Keep source assets/rights and private embedded data under control; do not upload to external services without authorization.
5. Use the least complex adequate dashboard tier: L0 table, L1 overview, L2 monitoring, L3 analysis or L4 scenario. More charts/interactivity is not inherently better. For decks adapt the story to live versus read-alone consumption; avoid universal6×6 or mandatory slide-count laws.
6. Verify independent layers: data/calculation; explanation/evidence/action; render/accessibility; edit/refresh/portability. Reopen the saved file, render actual pages/sheets and test the intended modification. State unknown target-native/AT/formula-engine results explicitly.
7. Deliver editable originals, useful previews, metric/source notes, update instructions and known limits. Do not claim conversion, comprehension or Office compatibility from static tests alone. Component qualification still applies when integrating actual AG UI components; web DOM criteria do not automatically qualify slides or spreadsheets.

Keep English agent instructions distinct from localized user prose. UI/labels/number formats follow the declared locale; user data and raw precision remain unchanged. English-only products are valid; RU/EN is the supplied default set.


## Golden Canon Grid and presentation composition

For new UI and PPTX compositions, **first consider Golden Canon Grid** as the preferred layout basis. Read `golden-canon-grid` and `golden-canon-validation`; preserve required host/brand layouts, accessibility, readable content and truthful evidence, and document a concrete reason for alternatives. This is owner-requested AG policy, not a universal aesthetic law. Use the declared `ag-diagonal-core-v1` profile, not a phi grid or an assumed BONT V3 template. Preselect meaningful box anchors and tolerance before inspecting hits.

For presentations also read `presentation-layout-recipes`: produce a storyboard with audience question, purpose/title, evidence/source, caveat, visual form, grid anchors and notes. Compare visual alternatives for complex slides; distinguish takeaway/chart titles, direct labels, annotations and sources. Topic titles remain suitable for setup/process slides. Keep live and read-alone needs explicit.

The sandbox's Golden Canon panel overlays actual iframe coordinates; outer preview zoom does not change residuals. It reports one selected anchor's nearest point and dx/dy/distance under a shorter-side tolerance (AG default0.8%). Empty or unsupported evidence remains unknown. Use the local PPTX upload to download an editable diagnostic copy and JSON: groups, rotated/flipped or inherited geometry, master/layout, optical ink, native PowerPoint and AT remain separate unknowns. Grid matching cannot waive data, comprehension, accessibility or saved-file editing checks.

For local generated decks, run `python3 tools/check-pptx-grid.py input.pptx --report report.json --diagnostic review.pptx` from the ag-design source checkout. Outputs must be new files. The offline checker imports only trusted shipped code and never fetches external links; no running service is required. Use `design_golden_canon` / `check_golden_canon` when advertised for declarative agent checks.

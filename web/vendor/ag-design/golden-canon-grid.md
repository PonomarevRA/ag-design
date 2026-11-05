# Golden Canon Grid

`ag-diagonal-core-v1` is a reduced AG diagonal-intersection profile. It is not a phi grid or a copied BONT V3 asset. Read the design-book chapters `golden-canon-grid`, `golden-canon-validation` and `presentation-layout-recipes`.

Use `createGoldenCanonGrid({document,width,height,anchors,tolerance,showDiagonals})` inside an explicitly sized carrier. Include the package stylesheet. The SVG is pointer-transparent and aria-hidden; the host owns a visible text equivalent of `report.results`. `update()` validates before changing the existing root, and `dispose()` is idempotent. No animation loops, observers or external resources are installed.

`checkGoldenCanon({width,height,anchors,tolerance})` returns IDs, actual and nearest target points, dx/dy, distances and hit/miss. Coordinates use one unit consistently. Tolerance defaults to0.008 of the shorter side and accepts0..0.05. Up to200 unique predeclared anchor IDs are supported. Empty anchors return unknown. Do not tune anchor selection or tolerance after inspecting results merely to produce a hit.

`provisional:true` keeps live preview markers neutral until current eligible measurements exist. Geometry does not establish text baseline, optical balance, readability, accessibility or audience understanding. Draft lifecycle is not consumer qualification.

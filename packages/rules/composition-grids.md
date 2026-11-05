# Composition grids and icon drafts

Choose the purpose first. Golden Canon remains the preferred creative starting point; use a different local grid when the component has a different job. Page and nested component grids can coexist, with independent local coordinates or explicitly inherited axes. Never force operational forms or readable text into decorative focal points.

| Profile | Best use | Wiki |
| --- | --- | --- |
| `golden-canon` | Golden Canon Grid | `grid-golden-canon` |
| `columns` | Responsive columns | `grid-columns` |
| `modular` | Modular / Bento | `grid-modular` |
| `baseline` | Typography baseline | `grid-baseline` |
| `spacing` | Spacing lattice | `grid-spacing` |
| `thirds` | Rule of thirds | `grid-thirds` |
| `manuscript` | Single-column manuscript | `grid-manuscript` |
| `edge-balance` | Edge balance | `grid-edge-balance` |
| `lead-room` | Look / lead room | `grid-lead-room` |
| `center-perspective` | Central perspective | `grid-center-perspective` |
| `phi-grid` | Phi grid | `grid-phi-grid` |
| `golden-triangle` | Golden triangle | `grid-golden-triangle` |
| `diagonal-flow` | Diagonal flow | `grid-diagonal-flow` |
| `icon-keylines` | Icon keylines | `grid-icon-keylines` |

## Framing decisions

Use `edge-balance` for an off-centre subject with deliberate negative space, `lead-room` for a declared gaze/movement direction, `center-perspective` for converging leading lines, `phi-grid` for a tighter golden-ratio division, `golden-triangle` for a diagonal and physical perpendiculars, and `diagonal-flow` for directional composition. Use `thirds` for a simple photographic placement and `golden-canon` for the existing diagonal-based template. These are composition choices; grid membership alone cannot establish aesthetics, gaze, salience, balance or recognition. AG numeric defaults are adaptations rather than universal camera/art rules.

Use `columns` for aligned controls and results, `modular` for repeated two-dimensional units, `baseline` only with measured text-baseline provenance, `spacing` for rhythm, and `manuscript` for a readable main text area. Keep existing catalogue masonry; these profiles do not replace it.

## Agent icon pipeline

1. Read `design_layout_grids` and the current `grid-<type>` + `grid-icon-generation` chapters through MCP. Select UI versus illustrative purpose explicitly.
2. Use `design_icon_draft` / `createGridIconDraft` for one of four original starter glyphs: play, focus, image, compass. System icons use24-unit keylines or spacing; expressive64-unit marks may use framing grids. Single glyphs reject columns/modular/baseline/manuscript.
3. Inspect returned primitives, visible stroke bounds, live-area status and numeric grid report before any screenshot recognition. SVG uses currentColor; retain existing color/contrast requirements.
4. Check16/20/24/32/64px previews and meaningful host accessible names (or host decorative semantics). Optical balance, legibility and recognition remain unknown until actual review. Do not claim arbitrary text-to-icon generation or an external artist standard.

`design_icon_draft` is pure and bounded: no arbitrary input SVG, remote resources, file paths or persistence. Label is escaped literal text, max80 UTF-16 units; stroke1–3. UI margins and controls stay host owned. The wiki constructor supports profile, frame, side/reflection, declared point, purpose/symbol/stroke, local SVG download and concise numeric checks.

Primary sources and qualification dates live with each shipped profile and bilingual chapter: Smithsonian video handbook, Nikon School leading lines, Fujifilm negative space, CBSE photography module, practitioner Martin Evening crop overlays, IBM iconography, and legacy Material icon keylines. Full per-profile use/avoid guidance is in `layout-grids.json`.

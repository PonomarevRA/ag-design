# Palette candidates and interactive builder

Import `generatePalette` from the root or `@ag-design/components/palette-model`. It is a pure offline function. Import `createPaletteBuilder` from the root or `/palette-builder`, with `styles.css`, for an interactive authoring sandbox. Neither applies tokens or mutates a host profile.

```js
const candidates = generatePalette({
  baseColor: '#176f56', space: 'oklch',
  background: '#ffffff', foreground: '#202126',
  fontSize: 16, fontWeight: 400, role: 'body',
});
// Seven schemes, actual-context checks, ordered pair matrices and a separate tonal scale.
const builder = createPaletteBuilder({document, i18n, baseColor: candidates.baseColor});
container.append(builder.element);
console.log(builder.result); // detached JSON copy of the last valid result
builder.update({baseColor: '#4f46e5'});
builder.dispose(); // idempotent listener/locale cleanup; no timers/polling
```

The service equivalent is stateless POST `/api/v1/palette` with the same camelCase data. The agent tool is `design_palette(base_color,background,foreground,color_space,harmonies,font_size,font_weight,role)`. Read the current `color` and `color-palettes` agent chapters first. Existing `design_contrast` and `design_color_scheme` remain authoritative for selected actual text pairs.

All colors are opaque sRGB `#RRGGBB`; no CSS expressions, alpha, remote images, paths or executable content. One to seven unique supported harmony IDs are allowed: monochromatic, analogous, complementary, split-complementary, triadic, tetradic and square. Omitted harmonies selects all. Each scheme preserves the exact base color channels; monochromatic has five colors, others two to four. The constructor reports unique counts and neutral degeneracy; a gray base does not invent a meaningful complementary hue. Neutral classification at OKLCH chroma<0.0001 is an AG heuristic.

OKLCH and HSL are different hue wheels; neither is RYB pigment mixing. Offsets are declared AG defaults, not universal quality rules or a promise to match Adobe algorithms. The separate `tonalScaleColorSpace:'oklch'` applies even for an HSL harmony. Tonal lightness steps0.1–0.9 are not HCT tones. Out-of-gamut OKLCH colors reduce chroma with bounded binary search at fixed L/h, not CSS LocalMINDE. `gamutMapped` and mapped chroma expose this change. Checks use the emitted quantized HEX.

Each swatch checks three actual text pairs: color on supplied surface; supplied existing text on color; suggested black/white ink on color. Ink selection considers the existing AA gate before APCA70/WCAG30 rank. AA and signed APCA remain separate. `fontGuidance` explains Barlow reference/sentinel999(prohibited),777(non-text),666(spot-only),5xx/4xx(restricted); these are not literal font-size recommendations. The numeric nontext3:1 check covers only the selected adjacent surface. Pair matrices use row foreground/column background; WCAG ratios are symmetric, signed APCA is ordered. Never require every decorative color pair to pass as text or label a whole palette WCAG-certified.

Builder inputs remain editable during invalid drafts. The last valid result stays visible with `data-stale=true` and a localized status; `.result` means that last valid result. Invalid public `update` is atomic. Locale switches retain controls, input focus/selection, chosen pair and drafts. An explicit `i18n` context supports single-locale hosts and owned text; caller content translation stays with the host. Disposal removes handlers/subscription; the host owns DOM removal and the i18n context lifetime. JSON export is a readonly selectable field, with no clipboard/network permission or profile write.

Keep existing host tokens, status semantics, light/dark/increased-contrast appearances and interaction states. A new hue must not automatically replace success/warning/error/focus. A wheel does not prove aesthetic quality or CVD distinctness. Use labels/shapes for meaning. Actual opacity, images, backgrounds, fonts, native/AT, projector/CMYK print and whole-interface WCAG remain separate checks. The component remains draft until qualified in its actual consumer.

Primary sources reviewed2026-10-28: [Adobe Color](https://color.adobe.com/create/color-wheel), [Oklab by Björn Ottosson](https://bottosson.github.io/posts/oklab/), [CSS Color4](https://www.w3.org/TR/css-color-4/), [Android color roles](https://developer.android.com/design/ui/mobile/guides/styles/color), [text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), [APCA font guidance](https://github.com/Myndex/SAPC-APCA/blob/master/documentation/minimum_compliance.md). Equations are independently implemented from the published Oklab transforms; existing APCA/ColorParsley attribution and licenses remain bundled.


## Linked color-wheel handles

`createPaletteBuilder` lets users drag any numbered hue handle. Base hue is the requested handle angle minus that color's harmony offset; the other colors retain their offsets (square: 0/90/180/270 degrees). Anchor lightness/chroma or saturation at gesture start. Keep the shared sRGB mapping and separate AA/APCA checks; candidates do not apply a host theme.

Keep wheel/handle DOM identity, single primary-pointer capture and focus. Coalesce moves to one animation frame and flush the final release coordinate. Escape, pointercancel, capture loss or window blur restores the starting color. Harmony changes, external updates and disposal end old gestures/queued work. Limit touch-action to colored ring/handle targets, preserving scrolling in the centre and elsewhere.

Each handle is a named hue slider: arrows1degree, Shift/arrows or Page10degrees, Home/End. Retain a mathematical keyboard anchor across repeated keys; repeatedly converting quantized HEX can stall near-neutral hues or desaturate them. Skip intermediate HEX values that quantize to undefined neutral hue until a representable hue returns, retaining handles/focus. Explicitly entered neutral base colors have no hue handles; the HEX/native color picker remains available.

Agent recommendation: reuse linked handles when the user wants to preserve harmony, rather than moving colors independently. Test every handle, HSL/OKLCH, hue wrap, cancellation, external updates, locale and disposal; run current root/column normal/narrow/200% width checks. Real touch/assistive-technology scenarios remain separate qualification; ARIA roles and numeric contrast do not prove them.

Direct ring selection uses the painted sector color as the base in the selected HSL/OKLCH space; linked handles still rotate their existing lightness/chroma. A ring sweep retains its initial coordinate projection to avoid layout-induced click drift. Centre/exterior and stale drafts are ignored. Cancel/Escape restores the original base, including a neutral base and its native control focus. HEX/native picker remains the keyboard alternative for full base-color selection.

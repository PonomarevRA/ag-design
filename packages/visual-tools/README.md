# @ag-design/visual-tools

Offline, framework-independent visual primitives. Import the package and `styles.css` from its local tarball. No dependencies, CDN imports, fonts, remote images, telemetry, worker downloads, event feeds, URLs or broker calls. Inputs are literal text and supplied arrays. Callbacks are local; host applications own persistence and all services.

Every element inherits the nine semantic AG profile tokens. SVG uses CSS variables; canvas resolves tokens from its current ancestors and repaints after profile/theme changes. Both themes are supported. Example datasets are synthetic.

- `createContentRail({items:[{id,label,target}],scrollRoot})`: explicit local elements, active scroll marker, click/touch, arrows/Home/End, focus and reduced motion. Supply sections in document order. Does not discover remote content or change history. Dispose cancels the scheduled measurement.
- `createChart({label,type,labels,series,renderer})`: line/area, grouped/stacked/horizontal bars, pie/donut, scatter/bubble, radar. Missing values remain gaps. Bubble size maps by area. The selected real mark/sector has an outline/halo, with pointer/touch and arrow/Home/End navigation. Compact previous/next arrows, category counter, replay button, readout and data table accompany graphics. `select(index)` and `replay()` are public; no point is invented for a null gap. At most 120 categories and six series. Cartesian domain includes zero by default; fixed domain may intentionally clip data. Bars require zero in the domain. No statistics/regression, financial calculations, smoothing, dual axes or live data polling. Particle mode is a bounded dense canvas field (default8000, hard ceiling16000), with SVG fallback. SVG entrance lasts700ms; particles spring-settle within2s and optionally drift while visible. Animation respects reduced motion. Replay is explicit; particle updates morph from displayed positions. It is not a dependency on Chartist or particleCharts.
- `formatDuration(value,{style,maxUnits,locale})`: short, long, compact and clock; negative values, zero and integer BigInt. Numbers truncate sub-millisecond precision. A day means 24 elapsed hours; no approximate calendar months/years. BigInt is exact in milliseconds.
- `formatDateTime(value,{timeZone,locale})`: Date, epoch milliseconds or ISO instant with explicit offset. UTC is the default. `createTimeDisplay` renders semantic `time`; no running clock/timer or network timezone lookup.
- `createPlanner({date,view,resources,events})`: month, week, day, agenda and resource timeline. UTC calendar arithmetic, Monday-first, exclusive interval ends, local previous/next/view changes. At most 20 resources and 240 events. Overlaps are kept in separate grid columns/rows. Optional inline edit form reports local date/resource changes; no automatic conflict scheduling, recurring rules, external calendar feeds, geographical maps, pointer event resizing or recurrence engine. General drag-and-drop is provided by `@ag-design/components` for host composition. `today` is supplied explicitly. Events up to 366 days; a consumer chooses a different scheduler for larger ranges.

Each controller validates complete updates before replacing the DOM and exposes `dispose()`. Do not mutate supplied arrays while mounted; submit a new state with `update`. Destroy a controller before removing its host. This is an independently authored implementation informed by user references; no third-party implementation code or private account data is redistributed.

### Particle field (1.2.0)

`renderer: "particles"` uses local deterministic dust inside the actual regions:
bar rectangles, line edges, area/radar fills, pie/donut sectors and bubble disks.
Defaults: 8000 fine targets, bounded by `particleCount: 12000` (hard supported
range100–16000), `particleDensity: 1` (.25–3), `particleSize: .7` (.3–2 logical px),
`particleBloom: .65` (0–1), `particleJitter: .75` (0–3). Empty/singleton shapes
can use fewer targets. `particleJitter: 0` stops rendering after the spring settles.

Particles condense with staggered spring motion and morph from the displayed
previous positions on update. The 2-second settling deadline is bounded;
idle drift paints at most30fps. `paused: true`, hidden documents,
IntersectionObserver offscreen state, reduced motion and disposal cancel RAFs.
A palette change repaints cached semantic colors. Canvas backing/glow buffers
are released on dispose. SVG/data-table fallback remains available.

`showTooltip: false` disables the literal hover/keyboard tooltip. Touch/click,
arrow/Home/End keys and native controls select the same real category; data
values, missing observations and domains are independent of particle motion.
The sample supports area, bar, line, donut, radar and bubble with editable
field settings, pause/resume and supplied-data updates.

The implementation is AG source; the public [ParticleCharts reference](https://github.com/bwilliford/particleCharts)
was studied for region sampling, spring/damping, stagger, idle drift and separate
bloom passes. No upstream package, CDN, font or network resource is loaded.
Rendered Canvas timing must be measured in a browser; Node/jsdom load results
cover lifecycle/fallback only, not GPU/native retained memory.


### Cached interior shimmer (1.2.1)

The settled interior keeps moving and shimmering on an8-second periodic cycle;
the outline moves less. `particleCache: true` (default) bakes one phase per
visible frame after settling, then blends adjacent phases at30fps. Entrance and
data morph remain live. `particleFrames` accepts integers10–20; default12.
Each cached640×300RGBA canvas represents768000raw bytes: default9.216MB,
maximum15.36MB, excluding browser/GPU copies, main canvas and other state.
This trades bounded raster storage for much less per-frame JS/drawing work;
it is not a claim that total retained memory decreased.

Palette/data changes invalidate all phases. Pause, reduced motion, document
hidden, offscreen and disposal zero cached backing stores. Reentry rebuilds
lazily. Set `particleCache:false` for a memory-sensitive live renderer; both
modes use the same interior motion/shimmer formula and no remote assets.


### Adaptive cache and strip comparison (1.3.0; supersedes previous defaults)

Default `particleCacheMode:"strips"` stores two small atlases and refreshes one
of15horizontal bands per paint. Each band blends old/new state over500ms using
the common flow clock. Maximum default atlas320×150:384000raw raster bytes for
both atlases. A280px-wide chart uses280×131×8=293440bytes. Captions, data, axes,
SVG selection and hit geometry stay full-resolution and are never split.

`particleCacheMode:"frames"` keeps complete adaptive phases instead: default6,
`particleFrames`4–20. The hard raw ceiling `particleCacheBudget` defaults1MiB
(integer256KiB..4MiB); resolution is fitted to CSS width, aspect and byte budget.
Resize invalidates only if fitted cache dimensions change. Neither mode adds a
layout read per frame. Both release buffers offscreen/hidden/paused/disposed and
can be bypassed with `particleCache:false` for live fine grains.

Strip updates trade a little more JS work and possible temporal differences at
band boundaries for less storage; subtle slow flow limits those differences.
This is not lossless visual parity with full-resolution live grains. The local
browser benchmark compares actual CPU callbacks and raw backing sizes. PNG/WebP
compression was measured separately; decoded images still need raster storage.
No encoded-frame streaming/PNG decoder is used by the runtime.


## ASCII charts (1.4.0)

`createChart({renderer: "ascii", type: "area", ...data})` draws actual monospace glyphs on Canvas, on the same validated geometry and spring field as particle charts. This is a decorative display: glyph quantization and slight sway are not a substitute for exact axis/table values. SVG axes/selection, literal tooltip and native data table remain available. No remote code, font or assets are loaded.

`type: "composed"` accepts series with `type: "bar" | "line" | "area"`; all share one numeric scale, grouped arrangement only. It also works with SVG and particles. Different units require separate charts. Null breaks and signed bar baselines are preserved.

ASCII options: `asciiCharset` classic (default `. : + * # @`), binary, or Unicode braille; `asciiFontSize`6–14 logical px (10); `asciiMaxCells`128–4000 (2400); `asciiSpeed`0–2 (.6); `asciiGlow`0–1 (.25). A single small glyph atlas replaces full-frame caches. It uses semantic colours and a system monospace font. Speed0 settles then stops; pause/hidden/offscreen/reduced-motion/dispose cancel RAF. Offscreen/dispose zero the owned atlas. No claim about total browser/GPU retained memory.

Optional demo-site links are omitted from public component detail views. Standards remain linked. Required upstream licence/attribution files remain in their packages; hiding a link does not change licensing obligations.


## Message navigation rail (1.5.0)

`createConversationRail({items, scrollRoot, onSelect, onBookmarkChange})` renders compact message ticks, scroll-synchronized current location, and a nonmodal preview on hover/focus. Each item supplies a local `target`, stable `id`, literal `label`, optional `context`/`preview` and initial `bookmarked`. No links/media/network are loaded. Titles/context/body render at most160/240/1200code points. At most120items, one card and one160ms exit-grace timer per instance.

`onCurrentChange({id,label,index,total})` optionally observes the initial and changed current location, including content scrolling. It is separate from user activation through `onSelect`; observer exceptions are reported through the document's normal event error handling without breaking navigation. Compact idle glyphs are equal; hover/focus expands local neighbours. Content scrolling centres the current marker unless its marker/preview owns focus. Manual scrolling of the marker list never snaps back or changes the current content item. The catalogue composes an explicit current/total readout and local list-browsing controls; those controls do not activate a card.

Pointer click navigates. Touch tap opens the card; its title navigates. Arrows/Home/End navigate while keeping rail focus; Tab enters card actions and Escape dismisses with focus restoration. Bookmark toggles only local state and reports `{id,bookmarked}`; the host owns persistence. `setBookmarked(id, boolean)` restores state without emitting a callback. `showPreview(index)`/`hidePreview()` support explicit touch/discovery controls. The ordinary `createContentRail` remains text navigation; `{compact:true}` selects the same compact variant.

Native manual popover provides the top layer; fallback is a fixed body portal with copied semantic tokens. Positions clamp to the current window/iframe. The preview cannot escape its iframe; a host overlay outside a preview iframe remains host-owned. Dispose closes/removes the card and releases the close timer, document subscriptions, palette observers and pending scroll frame. No whole-page polling runs. The catalogue has a separate “Навигация по сообщениям” example with an initially visible preview.


ASCII selection uses actual characters for every chart family, following the current charset and real mark perimeter. Pie/donut keep solid two-tone separators between sectors; their selected glyph fill grows4.5% and moves4logical pixels along the bisector. It becomes brighter without changing values, fractions or hit-test geometry. Reduced motion and pause retain a static selected state. Selection adds at most192glyphs per mark in one SVG text node, no animation loop or full-frame cache. Very small slices remain resolution-limited; exact values stay in the readout and table.

## Analytical charts and panels (1.6.0, draft)

`createAnalyticChart({document, data:{x,series}, options})` uses Canvas2D for numerical or epoch-millisecond X. X must be finite, strictly increasing, 1..1,000,000 observations; 1..6 series have unique IDs, labels and aligned finite/null values. The controller owns a copied numeric snapshot. Percent values are already percentages; bytes use IEC units. Nulls remain missing, zero and negative values remain values. `options.time:true` labels UTC.

Data, range, size and settings update independently through `setData`, `setRange`, `setSize`, `setOptions`; they preserve the plot, Canvas, legend focus and exact selection. Bursts share one pending paint. `appendData(snapshot,{maxPoints,follow})` validates new observations and copies a bounded rolling window; this is O(retained observations), not a zero-copy ring buffer. Large snapshots should be batched or reduced upstream when exact raw retention is unnecessary.

Only the visible X slice plus its edge neighbours is reduced into first/min/max/last pixel buckets. A bucket containing nulls breaks connections conservatively; `connectNulls:true` explicitly joins them. Raw lookup and paginated tables use the original observations. `stats.rawBytes` counts numeric buffers only; it excludes objects, temporary copies, Canvas, browser and GPU memory. `stats.canvasBytes` estimates the owned RGBA backing only. Hover moves a separate DOM cursor without repainting data. Panning, zoom buttons, keyboard and explicit `createChartSync()` groups operate locally. The caller owns persistence and group lifetime.

Offscreen/hidden charts cancel pending paints and release display/Canvas buffers; raw data remains available. Data updates still validate/copy input while projection waits until visible. There is no idle animation loop. `autoResize:false` makes size caller-owned; `pixelRatio:1` permits reproducible comparisons. Defaults clamp DPR to2. Dispose disconnects observers, listeners and group subscriptions. For long catalogues use the host's `render-window` to dispose entire previews rather than retaining all raw snapshots.

```js
const chart = createAnalyticChart({
  document,
  data: {x:[0,1,2], series:[{id:'latency',label:'Latency',values:[12,null,9]}]},
  options: {defaults:{unit:'ms'}, overrides:{latency:{fill:.15}}}
});
const inspector = createChartSettings({document, chart,
  series:[{id:'latency',label:'Latency'}]});
// Dispose the inspector and chart when the host removes the view.
```

`createChartSettings` uses native grouped controls and a property search. Exact-ID overrides contain only edited fields and show inherited defaults. Units, decimals, semantic colours, visibility, axis, line width, linear/step interpolation, fill and gap policy are configurable. Independent left/right bounds, thresholds, all/selected/hidden readouts and UTC are supported. Axis labels use the first visible series' unit on that axis; assign different units to separate axes. This is a bounded local editor, without Grafana's query engine, regex overrides, plugins, logarithmic analytical axes or timezone selection. Call `refresh()` after programmatic changes; recreate the inspector if series identities change.

Three independent panel factories accept `options.renderer:'svg'|'ascii'`:

- `createStat({data:{value,sparkline?}})` displays the explicitly supplied statistic, not an implicit last-value reduction. One sparkline series has at most4096 observations.
- `createHeatmap({data:{xEdges,yEdges,values}})` displays supplied histogram buckets. Edges determine real cell widths; counts are nonnegative or null. At most128×64 buckets and4096 total cells; linear/log density is a presentation option, not a rebucketing operation.
- `createStateTimeline({data:{lanes}})` displays ordered, nonoverlapping `{start,end,state,color?}` intervals in at most64 lanes/4096 intervals. Real duration determines width; absent/null states remain gaps. `mergeAdjacent` merges only contiguous intervals with equal state and colour within a lane; the exact table retains every original interval. Coordinates use the caller's numeric time unit.

Panels have `setData`, `setOptions`, `setSize`, selection and disposal. ASCII changes marks only: at most4096 data glyphs plus81 selection glyphs. Axis labels, statistic text and exact values remain readable ordinary text. Subpixel cells/glyphs are resolution-limited; enlarge the panel or use the table. Semantic CSS tokens support inherited themes and local overrides; no fonts, code or data are downloaded. ASCII shimmer pauses offscreen, hidden or with reduced motion. The analytical SVG fallback keeps reduced lines and gaps when Canvas is absent; it does not reproduce Canvas axes, fills or stepped interpolation. Use the exact readout/table in that degraded environment.

Reproduce data-operation timings with `node --expose-gc tools/benchmark-analytic-model.mjs /tmp/analytic-model.json`. The browser comparison is prepared at `tools/analytic-browser.html`, using offline pinned uPlot1.6.32 only as a benchmark tool. It is not a production dependency. It measures synchronous JS/Canvas submission, not GPU completion or retained memory. Browser qualification, palette/layout inspection, 200% text and assistive-technology checks remain pending; Node/DOM tests do not establish those passes.


### Radial ASCII contrast and flow (1.6.4)

Before selection, pie/donut use a solid profile-derived outline with a thin
surface-coloured underlay. The two tones are at least9:1 apart, ensuring that
at least one contrasts3:1 with any adjoining opaque colour (the two-tone
boundary technique in WCAG G209). Low-contrast or unsupported local colour
overrides use black/white tones. This preserves category hues rather than
claiming every adjacent category colour independently reaches3:1. Exact
values remain in the accessible readout/table. APCA signedLc and WCAG2
ratios for composited glyph pairs are audited in the internal tests;
APCA is advisory here, not a non-text compliance certificate. Thin-line
raster readability at a host's size/DPR still needs browser qualification.

While moving, radial cells flow slowly toward the centre. At the default
10px grid their centres extend up to3.5logical pixels outside and8pixels
inside the original annulus; opacity fades at the wrap. Directions and
bands are computed once per cell. The original data, sector angles and hit
regions are unchanged. Selection keeps its character contour and growth.
The existing pause, speed, reduced-motion, hidden/offscreen and disposal
controls stop this motion without adding a scheduler or full-frame cache.
The single glyph atlas is rebuilt for local theme/profile changes.


`createFeedRail({document, items, boundsElement, scrollRoot, header, label, onSelect, onCurrentChange})` composes the same compact content rail for up to10000 supplied local item shells. It returns `{element, activeId, dispose}`. Mount `element` in a leading20px column (24px for coarse pointer); the fixed dock is24px/44px and expands64px over content without widening that column; the host owns the adjacent feed layout and content. `boundsElement` is an explicit local Element; when omitted the mounted parent supplies bounds. `scrollRoot` is the actual scrolling content element, while `header` optionally excludes visible chrome. The dock intersects these bounds with its current window/iframe; it does not escape an iframe.

Only120 markers are mounted per range. The current/total readout and passive observer always describe the full item set, even while another range is focused or manually browsed. Browsing ranges or the marker list never activates content. External scrolling may follow the current range once navigation is no longer focused/browsed. Item IDs, targets and literal labels/context/preview are a constructor snapshot; dispose and recreate for a different set. Empty input produces an empty, disposable gutter. Owned global tracking, observers, callbacks, range subscriptions, preview portals and frames are released by `dispose()`; no idle polling or external requests are used.

For composed hosts `createContentRail({trackScroll:false})` disables automatic scrolling/resize subscriptions. Its passive `setCurrent(index|null, {reveal:true})` marks a local item or clears a range whose current item is elsewhere without navigation. Set `reveal:false` to preserve an explicitly browsed list or host-level focus. Existing default tracking and user-activation callbacks remain unchanged. Include the package `styles.css`, which imports the local semantic-token `feed-rail.css`.

The auxiliary position readout retains the full current/total text through wrapping (including10000/10000); it uses at least12px text instead of ellipsis. Own scoped `[hidden]` CSS keeps the dock absent when its bounds have insufficient space, without requiring a product's global stylesheet. Shared preview placement uses available side space, then a bounded vertical region; it hides when no non-overlapping region exists. DOM/CSSOM tests model these contracts; actual browser/AT/200% raster qualification remains separate.


### Compact feed dock (2.0.2)

The host reserves20px (24px with coarse-pointer catalog/sample layouts). The fixed dock uses24px mouse targets and44px coarse targets, expanding to64px on hover, focus or an open preview's aria-expanded marker. Counts remain programmatically readable while visually compact; expansion restores them. Width changes do not change the host's reserved column. CSS :has tracks the existing preview state, including the body-portal fallback; no extra polling/listeners or ownership is added. Keep the dock outside a clipping host and preserve its preview/focus path.

Feed markers fade by absolute distance from the whole-feed current item, across bounded120-item ranges: max(0.6,1-distance*0.035). Current, hovered and focus-visible ticks remain fully opaque. The floor is60%, with text-ink tokens so base-profile sampled surface/surfaceAlt contrasts stay above3:1; qualify actual host composites separately. Ordinary content/conversation rails keep their existing defaults. Expanded geometry uses the existing fixed visible-feed bounds and no flow re-layout; the coarse targets can extend into host side padding/gap. Check narrow/text200/touch/RTL and disposal in the actual host.


### Compact temporal axes
`createChart` accepts `axisDates: number[] | false` (epoch milliseconds per category; false disables strict ISO detection). Labels remain categorical and are not converted into unequal time spacing. Use `createAnalyticChart({data:{x,series}, options:{time:true}})` for a numeric UTC time axis. Axes adapt precision/density, showing month/year initially and at retained period transitions. Tables, tooltips and keyboard readouts keep complete source dates; null gaps and observations remain intact.

Both packages export `formatTimeAxisTicks(values,{locale,timeZone,unit})` and `layoutAxisTicks({values,labels,positions,left,right,measure,gap})`; returned `index,x,anchor,start,end,lines,fullLabel` support numerical checks without screenshots. Supply real text metrics; default estimation is not browser proof. Analytical charts expose `getAxisTicks()` for last-paint geometry; it is empty before paint/when display resources were released. SVG text is measured and its extra axis band reserved for enlarged text. Test actual narrow/200%text, month/year boundaries, leap day, zoom/resize and disposal.

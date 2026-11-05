# @ag-design/components

Framework-free native DOM controls. Geometry is shared; the host maps semantic colour tokens.

```js
import { createButton, bindNavigation } from '@ag-design/components';
import '@ag-design/components/tokens.css';
import '@ag-design/components/styles.css';
const action = createButton({label:'Сохранить', variant:'primary', onClick:save});
```

Extend controls with composition, normal event listeners and CSS variables. Do not fork the package for business behavior. Text arguments never accept HTML. Call the returned disposer when replacing navigation. The sidebar controller owns collapse only; the host owns selection, routing and native-toolbar synchronization. Stable field and dialog IDs are the caller's responsibility. No framework, fonts, fetch, timers or observers are installed on import.

Local installation: `npm install --ignore-scripts ./vendor/npm/ag-design-components-0.1.0.tgz`. `@ag-design/rules` ships the design book. A source integration manifest and a matching catalog usage entry make upgrades discoverable. Consumer artifacts contain their assets and need no running ag-design service.

### Compact window toolbar

`createWindowToolbar` uses quiet borderless controls and a separator between history/panel controls and the contextual title. Set action `icon` to `refresh` or `plus` for fixed line SVGs; `back`, `forward`, `panel-left`, and `panel-right` are also supported. Icons inherit the current semantic text colour. Icon actions default to icon-only with `aria-label` and a hover title; `iconOnly: false` preserves a visible caption. Actions without an icon keep their label. Other icon strings are literal text, never HTML. Focus outlines and disabled history remain visible; native OS controls and command capabilities belong to the host.


Icon buttons use a square target and a centred 24-unit SVG grid for reviewed window,
arrow, close and dot symbols. Existing glyph aliases (×, −, ↗, ↙, ↑, ↓, ●) keep
working; other supplied strings remain literal text. No HTML is parsed. Activity
chat controls keep circular hover targets and change the expand icon and accessible
name to the restore action while expanded.


`createPopup` keeps a compact titlebar outside `.ag-popup__body`, the only scroll
container. The supplied content node is moved into that named, keyboard-focusable
region without cloning it. The native dialog still owns modality, Escape and focus
return. Use the same two-child structure for custom detail dialogs; never put the
titlebar inside the scrolling body. Closed dialogs retain native hidden behavior.


## Shared controls 0.5.1

`createInlineHelp({label,text,icon:'info',placement:'auto'})` uses a fixed SVG i and a viewport-bounded note. A native button provides click, Enter/Space and touch activation. Escape and outside pointer/focus close it; disposal removes top-layer/fallback portals and listeners. No hover-only explanation or external content.

`createSkeleton({variant,rows,columns,animated,label})` composes text/card/list/table/profile placeholders. `createSkeletonShape` provides line, heading, circle, square and divider. Shapes are decorative, with one loading status; the host owns busy semantics on the actual data region. `setLoading(false)` hides the placeholder. Reduced-motion disables shimmer.

`createMotion(element,{duration,distance,iterations})` owns only its transient WAAPI animation. Nine named presets, at most 2 seconds/64px/three iterations, explicit cancellation, reduced motion and disposal. Existing transforms survive. No infinite ambient animation.

`createDragDrop({lanes,mode,onChange,canDrop})`: native handles, local move/copy/swap, empty lanes, copy-only shelves, nested board ownership, cloned callback snapshots and transactional input validation. Space/Enter picks up; arrows/Home/End select slots; Enter commits; Escape cancels. Pointer capture supports mouse/touch; pointercancel/blur/disposal cancel. Only handles suppress touch scrolling. Pointer movement near an owned list edge scrolls that list; no cross-board transfer or automatic persistence. At most 12 lanes and 300 items. Call `dispose()` before host removal. On callback errors, the already committed local change remains and a status explains the callback failure.

All new controls inherit AG semantic CSS tokens. They contain no network requests, CDN imports, remote images/fonts, telemetry or original-site adapters. Host callbacks and supplied data remain the application's responsibility. Physical touch devices and screen readers require consumer validation.


0.5.2 adds a theme-aware lifted pointer card, dimmed source, insertion placeholder and permitted/rejected drop styling. These are presentational nodes only; model changes still occur only on commit. Cancel, capture loss, update and disposal remove them. `canDrop` is a pure predicate: it is evaluated for feedback before commit as well as during commit.

Auxiliary toolbar actions and inline help use `variant: 'quiet'`: no permanent border or tile, with visible hover, expanded/pressed and keyboard focus states. Keep explicit primary/danger emphasis and field boundaries where they convey purpose. Board controls share one theme surface so user-chosen canvas colours do not reduce icon legibility; disclosure panels retain their own boundaries.

## ASCII backdrop and live text

Text is rasterized into a local 5×7 bitmap alphabet and painted with ASCII cells. Latin, Russian Cyrillic (including Ё), digits and common punctuation are supported; unknown glyphs become a question mark. The original text remains available through the controller. Text and the procedural field share a viewport grid bounded by `maxCells`; a two-pass contour distance keeps the background at least `textGap` cells (2–6, default3) away from every letter stroke. The surrounding symbols turn along the contour. `textWeight` accepts `auto`, `thin`, `regular` or `bold`: auto keeps thick strokes on coarse grids and scales the bitmap on larger grids; bold expands strokes horizontally. `textRoughness` (0–1, default0.3) roughens only the surrounding background boundary; it never adds fringe to or narrows the letters. A slow ink shimmer and small wave/sway run for both shimmer/wave effects; `none` disables them. Only visible cells are generated; streaming retains at most 4096 Unicode code points. No font is fetched.

`createAsciiBackground({pattern:'flow', autoplay:true})` creates an absolute, decorative `aria-hidden` layer. Put it in a positioned host and keep meaningful headings, links and controls above it. The component has no pointer/focus targets and never announces the stream. Keep a readable surface behind foreground text and a visible native pause control calling `pause()`/`play()`; `playbackRequested` is user intent, `state` reports actual playback (including reduced-motion/offscreen/hidden/still/error).

- `setPattern('flow'|'rain'|'noise')` chooses a bounded deterministic procedural field. Flow is AG value noise, inspired by the ASCIIGround demo, not exact Perlin parity.
- `setSource(imageOrVideoOrCanvas)` reads already-ready pixels. Loading and playback of supplied media remain host-owned. Call `update({})` after changing a still canvas or a supplied image. Sources are letterboxed in character proportions. A tainted/unsupported canvas enters `error` without retry/network fallback.
- `await setFile(file)` accepts local PNG/JPEG/WebP (up to32MiB) and MP4/WebM (up to128MiB), decoded dimensions up to8192px. This path owns and revokes its blob URL, decoder and video playback. Attach `.catch()` for unsupported codecs, cancellation and decoding errors. A replacement/disposal aborts an in-flight file. Nothing is uploaded. URL strings, webcam, audio, GIF frame extraction and codecs/encoders loaded from the internet are absent.
- `update({animation:'none'|'wave'|'scan'|'reveal'})` changes media animation. Wave shifts at most2columns; scan highlights real rows; reveal builds and holds the complete image before looping. Video samples the current frame without pre-extracting the whole clip. One converter/cache set belongs to one instance and is disposed with it.
- `setText('...')`, `appendText(chunk)` and `clearText()` implement a bounded4096-code-point text tail. Appended text is literal; no markup executes. Frequent chunks share the existing frame clock. `textEffect:'shimmer'|'wave'|'none'` selects semantic-palette shimmer and optional gentle wave. Data transport belongs to the host; there is no WebSocket/EventSource/polling.
- Font10–28px, density0.5–2, speed0.1–2, fps4–24 and maxCells128–6000 are validated atomically. Rendering is capped; huge hosts use larger glyphs. Reduced motion displays a complete still image/static text and stops the clock. Hidden/offscreen content stops owned video and drawing; detached fallback does not poll. `dispose()` cancels frames, observers, local decoding and lookup caches.

The locally bundled conversion subset is from **asciify-engine4.32.0**, MIT ©2026ayangabryl; see `ASCIIFY-LICENSE.md` and `docs/engineering/ascii-upstream.json`. It includes only frame conversion, not the upstream studio, URL loaders, GIF decoder, web fonts or renderer effects. `tools/vendor-asciify.mjs` reproduces the subset from the exact extracted npm package and rejects a changed upstream core hash. Standard builds use the committed local subset and need no npm/network access.

```js
const bg = createAsciiBackground({ textEffect: 'shimmer' });
hero.append(bg.element);
bg.setText('Новости · ');
for await (const chunk of hostOwnedTextStream) bg.appendText(chunk);
// The host also wires a visible pause button and calls bg.dispose() on unmount.
```


### Атмосферные графики

`createAmbientChart` — самостоятельная SVG-композиция по визуальному референсу [it-company.pro](https://it-company.pro/): сетка, свечение, раскрытие графика и печать буквального кода. Сайт, его исходники, изображения и шрифты компонентом не загружаются.

```js
const visual = createAmbientChart({kind:'bars', title:'Системы в движении'});
const measured = createAmbientChart({mode:'data', kind:'area', title:'Нагрузка',
  labels:['Пн','Вт','Ср','Чт'], values:[18,null,-8,45], unit:'запросов'});
measured.update({values:[20,null,-5,52]});
visual.pause(); visual.play(); visual.replay();
visual.dispose(); measured.dispose();
```

Декоративный режим явно помечен и может содержать условные значения. В режиме `data` нужны явные labels/values: один ряд1–96 точек, конечные числа |value|≤1e12, `null` — пропуск. Шкала линейная и включает ноль; отрицательные значения сохраняются; линия/область не соединяют разрывы. Исходные значения доступны в таблице. Смена decorative→data требует явных labels и values; условные значения не становятся измерениями автоматически. Код и декоративная метка в data скрыты. Реальные метки остаются на фиксированных координатах, а движение завершается после раскрытия.

`select(index)` и `onSelect({index,label,value})` относятся к реальным данным; выбор доступен стрелками/Home/End и кнопками. `update()` проверяет весь следующий набор до замены. Начальная публикация и update не вызывают onSelect. Пользовательская пауза сохраняется при обновлении оформления; explicit animated меняет намерение. Один clock ограничен24fps и прекращает кадры при паузе, reduced-motion, скрытой вкладке, offscreen и dispose. SVG масштабируется без изменения данных; подписи реагируют на ширину через ResizeObserver. Все цвета — семантические AG токены; нет сетевых API/таймеров запросов. Для многосерийной аналитики используйте createChart из visual-tools.


`textEdgeRoughness` (0–1, default0) independently adds a sparse fringe to the letters. `textRoughness` affects only the background boundary. The clearance includes one extra cell of movement reserve, so the slight text sway does not consume the requested gap. Automatic weight keeps coarse-grid letters dense.

## Waiting indicators

`createLoadingIndicator({variant:'spinner'|'dots'|'progress'|'skeleton',label,animated:true})` shows an indeterminate wait with a single accessible status. It never fabricates a completion percentage. `pause()`, `play()`, `setLoading(boolean)` and `dispose()` manage presentation; the host owns loading/completion and a visible pause action. Four variants are shown together in the catalogue and individually editable in the sandbox. CSS motion stops for pause, offscreen/hidden content and reduced motion. Shapes are local and inherit semantic profiles. These are an original AG adaptation of the four common patterns in CSSScript's “03 · Worth the wait” demo; no remote code/assets are used.


### Render window

`createRenderWindow({render, initialState, root, rootMargin:'160px', estimatedHeight:240, unmountDelay:200, label, onError})` owns a synchronous factory returning `{element, dispose, snapshot?}`. The factory receives the last explicit snapshot; keep it bounded and free of DOM references. The host retains authoritative data and routes. The returned `element` is a lightweight placeholder until intersecting the root. Once outside, it captures state and measured height, then disposes the subtree. Focus, pointer interaction and `setPinned(true)` retain it. `refresh()` retries factory errors; `dispose()` releases subscriptions, deadlines, saved state and DOM.

There is one IntersectionObserver and visibility listener per document/root/margin group, no polling or RAF in the wrapper. Missing IntersectionObserver uses eager mounting for functional fallback. The host must dispose removed windows; arbitrary external DOM removal alone cannot release host callbacks. Closed tabs/hidden pages evict unfocused content after the same delay. A component snapshot failure retains its live tree to protect data. The wrapper cannot reclaim external stores, enforce a third-party cleanup contract or guarantee immediate garbage collection. Unmounted text is absent from browser Find/accessibility traversal; placeholders remain keyboard reachable and mount on focus. Use eager content for essential document text, SEO, accessibility reading order or print output.

The catalogue/editor adapter restores ordinary fields by stable labels/names. Interacted complex samples remain pinned unless their factory supplies explicit snapshot/restore, protecting media, chart and animation state. This intentionally trades memory for unsaved interaction safety; changing page or deleting a tile still disposes them. The adapter retains ordinary form/disclosure values; passwords/files, more than256 fields or values above4096 characters prevent eviction rather than truncate input. Arbitrary widget state needs its own factory snapshot/restore. This is subtree lifecycle management, not row-data pagination.


Atmospheric charts share the same gradient, soft glow and opacity in decorative/data modes. Real data keeps its exact scale, null gaps and table; only decorative marks may breathe. Add `panelText` (≤1200 literal characters) and `panelTitle` (≤100) for an accessible context mini-window in either mode; `showPanel:false` hides it. Context is shown immediately and scrolls when long. Legacy `code` remains decorative-only and is never executed. Empty data context omits the window.

## Locally owned colour profiles

Preset names describe their primary colour: green, purple, cyan, blue and teal.
Profile IDs in existing local installations remain stable for compatibility.
Published presets use colour IDs and contain no consumer-project mapping.

The host can override semantic tokens on one component scope without changing
the shared preset or other instances. Keep a complete light/dark profile in local
application configuration, then apply a copied preset:

```js
const localProfile = {
  ...baseProfile,
  light: {...baseProfile.light, accent: '#1b6475', onAccent: '#ffffff'},
  dark: {...baseProfile.dark, accent: '#8bd9df', onAccent: '#10282b'},
};
const restore = applyColorProfile(container, localProfile, 'light');
// A later teardown restores the previous inline semantic values.
restore();
```

`applyColorProfile` validates the complete token set before applying any value.
Direct scoped CSS `--ag-*` overrides are also supported. Changed palettes require
their own contrast checks. Local configuration and observed usage are excluded
from the public distribution.

## Agent conversation

`createAgentConversation` renders a transport-free session/message/block model.
Supply a version1 `applySnapshot`, then contiguous `applyUpdates` with stable IDs,
revisions and complete message upserts or checked text deltas. Data, cursors,
authorization, queue execution and durable idempotency belong to the host.

Text is literal. The Markdown subset supports bold, inline/fenced code and
paragraphs; it does not interpret HTML, links or media. Windows, text and receipts
are bounded. History errors retain the current transcript; gaps request a new
snapshot and never replay a command. See the exported TypeScript contract for
limits and callback shapes.

An optional composer requires `capabilities:["send"]` and `onSend`. Persist a
host-owned command key before dispatch; the UI requestId is not durable storage.
Return `{status:"accepted"|"rejected"|"unknown"}`. Unknown blocks another send
until the host calls `resolveSend` with the matching requestId. Actions on typed
blocks are capability-gated intents, never local process or file operations.

`createAgentActivityChat({view:"conversation"})` enables the same renderer for
legacy request/response observations. The default activity renderer, append API,
markers and explicit `setView("activity")` fallback remain available.


### Skeleton shimmer and contrast

Skeleton shapes and their moving highlights are decorative (`aria-hidden`); the component keeps a separate literal loading status. If the visible layout does not otherwise explain loading, the host must supply a visible loading label. Text uses its actual font/background for WCAG2 and APCA checks; the shimmer must not carry essential meaning.

The default moving overlay has strength0.24 (previously0.4) and a1.8s cycle. `--ag-skeleton-shimmer-opacity` may reduce the strength; CSS clamps it to0..0.24. The ordinary shape blends `surfaceAlt → border`, the waiting indicator `border → text`. Evaluate the **composited peak**, not the unblended token. Tests keep the current standard/increased light/dark profile set below2:1 peak/base ratio and|APCA Lc|24. These are authored AG comfort guardrails, not WCAG/APCA non-text conformance thresholds. Custom palettes/animation overrides require their own checks.

WCAG1.4.11 exempts purely decorative graphics. WCAG2.3.1 still applies to animation; the default cycle is below one traversal per second, without abrupt full-field on/off changes. `prefers-reduced-motion` removes shimmer; `animated:false` disables it, and loading indicators keep explicit pause/offscreen/hidden suspension. Hosts showing nonessential animation beside other content must expose a stop/pause mechanism as required by WCAG2.2.2. Reduced motion alone is not a substitute for that requirement.

References: [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast), [flashes](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html), [pause/stop/hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide), [APCA primary documentation](https://github.com/Myndex/SAPC-APCA). APCA is not WCAG2; this component is not independently certified for full-page accessibility.

## Числовая метка и нормализация

`createNumericBadge` показывает исходное число (`mode:"value"`) или нормализованную оценку (`mode:"score"`). Число остаётся точным в `aria-label` и `title`; цвет дополняет подпись и не означает качество. `update` сначала проверяет полное новое состояние, `dispose` удаляет только собственный узел. Нет таймеров, запросов или наблюдателей. Подключите обычные `tokens.css` и `styles.css`, переопределяйте семантические токены локально.

```js
import { createNumericScale, createNumericBadge } from '@ag-design/components';
const scale = createNumericScale({ values: [0, 1, 2, 3, 5, 8, 13, 21, 34, 55], maximum: 5 });
const badge = createNumericBadge({ document, value: 13, label: 'Использований', mode: 'score', scale });
// Когда известны только границы: createNumericScale({min:0,max:100,maximum:5}).
// Без данных/границ: исходное число нейтрально, score неизвестен («—»).
```

Шкала берёт дискретные процентили P1, P5, P10, P30, P45, P65, P80, P90, P99, P100 (`ceil(p*N)-1` в отсортированном массиве). Девять интервалов получают равные доли выходного диапазона. Для интервала i: `maximum*(i+(value-low)/(high-low))/9`; внутри интервала интерполяция линейная, вне границ значение score прижимается. Исходный value не меняется. Повторяющиеся пороги пропускаются через последний подходящий нижний порог, одинаковые числа получают одинаковую оценку. Полностью равная популяция →0; пустая →unknown. При заданной паре min/max применяется обычная линейная шкала. До10000конечных значений, несовместимые режимы/неконечные числа отклоняются. Используйте одну популяцию для всей коллекции, а не пересчитывайте её при поиске.

Цветовая интенсивность вычисляется из неокруглённой доли0–1 и смешивает `--ag-accent` с `--ag-border`/`--ag-muted` только для обводки и точки. Текст и поверхность сохраняют `--ag-text`/`--ag-surface`. Никакой автоматической WCAG/APCA-сертификации по значению счётчика не производится; фактические пары цветов проверяются в среде приложения.


## Management interface controls (core0.12.0)

Six new factories share semantic AG colours, explicit ownership and synchronous `dispose()`: `createSelect`, `createTabs`, `createMenu`, `createDataTable`, `createTree`, `createSettingsPanel`. Their source and functional tests are included. Catalog lifecycle remains **draft** until current detailed requirements and target-host evidence are supplied; these examples do not assert WCAG/AT conformance.

- Select uses the browser's native `select`, optgroups, labels and required/disabled state. `setValue`, `setDisabled` and `setError` are silent; a searchable combobox is outside this contract.
- Tabs separate keyboard focus from activation. Default activation is manual; declare `preserve`, `destroy` or `offscreen` per panel. Offscreen retains a real iframe layout while removing inactive content from interaction. Sensitive settings categories default to destruction.
- Menus reserve consistent check/icon, label, shortcut and submenu slots. Groups have separators; disabled actions stay discoverable and cannot execute. Handled arrows never reach a parent canvas. Shortcut strings are display text; the host owns command bindings.
- DataTable uses native table/caption/header semantics, bounded pages and row selection. The host owns sorting, data loading and pagination. `onSort` receives a descriptor or `null` on reset; respond with `setRows` and `setSort`. This is a table, with no spreadsheet/grid or virtualization claim.
- Tree uses stable IDs/parents, distinct focus/selection/expansion and reserved action slots. Up to1000 nodes and depth32; invalid cycles/orphans are rejected. Local computed direction controls horizontal keys. The host owns visibility/lock effects.
- SettingsPanel composes vertical tabs, section headings, label/control/description rows and a footer. Header/footer retain position and the body scrolls; narrow containers stack label and control. Use the existing `createPopup` for an optional native dialog and attach that dialog under its owning sample/root so explicit-root UI-map capture includes it.

Import every factory from `@ag-design/components` and import `@ag-design/components/styles.css`. The declaration file describes exact option/controller types. See [management control contracts and examples](management-controls.md). Source research lives in the repository under docs/engineering/openpencil-components/.

## Pinterest / masonry-layout

Use `createMasonryLayout` for a new container or `bindMasonryLayout` for an existing grid. Both preserve DOM order and natural card heights, track resize and direct child mutations, and expose `update`, `refresh`, `dispose`. [Contract and examples](masonry-layout.md). Geometry is independent of the local color profile.

## Searchable dropdown

`createDropdownSelect` adds a local single-choice combobox beside native `createSelect`. It supports filtering, groups, disabled options, native form submission/reset, viewport placement and explicit disposal. See [dropdown contracts](dropdown-select.md). Import packaged styles and use semantic color overrides in the host scope.

## Data Grid

`createDataGrid` adds local search, structured filters, sorting, validated edits,
stable row selection and column settings. Use `mode: "virtual"` for fixed-height
rows with a bounded window of rows and columns, or `mode: "paged"` for wrapping
and details. `createGridArrayDataSource` owns a validated local snapshot;
`dataSource.getWindow(request, {signal})` lets the host provide only the requested
projection. The component performs no network requests. See `data-grid.md` for
the public contract, resource limits and evidence boundaries. The simpler
`createDataTable` remains available independently.


Code and Markdown: `createCodeViewer`, `createMarkdownViewer`, `createMarkdownEditor`. Import `styles.css`; dispose owned controllers. The editor preview uses the same MarkdownViewer factory. Local engines and language modes are included; no CDN/service is required. File loading, dirty replacement, local downloads and host save callbacks have explicit contracts. See the corresponding component documents and `TEXT-ENGINE-LICENSES.md`/`TEXT-ENGINE-MANIFEST.json`.


## Language switcher (core0.20)
`createLanguageSwitcher({i18n,variant:"compact",onChange:()=>savePreferences()})` exposes a globe, visible caption and native select with autonyms. `variant:"inline"` exposes language buttons with aria-pressed. Names receive lang/dir; one enabled locale is static. `names` overrides missing/custom regional names literally. The context owns enabled locales; the host owns persistence, translations and page navigation. Dispose unsubscribes without disposing the shared context. Import `@ag-design/components/language-switcher` and core styles/tokens offline.

## Factory ownership and diagnostics

`createRenderWindow` accepts a synchronous factory returning a fresh detached element from the same document and an owned disposer. Connected, foreign-document, ancestor or previously retired elements do not transfer ownership and are never disposed as abandoned candidates. Disposal during factory execution is final; snapshot/disposal callbacks may reenter the controller without reviving a retired result or clearing a newly mounted subtree. Failed snapshots retain live user data.

`onError` is diagnostic for render-window and async-boundary. Synchronous throws and rejected diagnostic thenables are contained; lifecycle state and operation results remain authoritative. Disposers stay synchronous; this change does not introduce asynchronous teardown or infer real backend load capacity.


### Conversational result cards

`createConversationCard({title, summary, status, message, actions})` composes existing buttons and literal content. Supply localized text and at most two callbacks (one primary). A callback expresses intent; update accepted display data explicitly. Loading disables actions while retaining content. Native disabled focus behavior applies; callers own focus recovery and request lifecycle. Dispose removes owned listeners and DOM.

`inspect()` returns redacted facts. `inspectConversationSurface({context:'chatgpt',mode:'inline',actionCount:2,primaryActionCount:1,nestedScroll:false,deepNavigation:false,duplicateComposer:false})` checks declared scalar observations. Missing facts stay unknown; context:'web' is not-applicable. It does not capture DOM, implement MCP Apps or certify actual host/AT/security. See the OpenAI chapters in the current design book.


### Keyed widget lists
`createWidgetList` accepts a bounded AG snapshot, localized disclosure/empty labels and one host `onAction` callback. It is not a ChatKit JSON renderer. Stable keys retain visible controls. `update` accepts only newer complete display revisions; those revisions do not grant server authority. `setPending` explicitly chooses none/self/container and a supplied message; updates never silently complete a pending operation. `inspect` omits prose/IDs; dispose releases owned handlers/DOM. The host owns effects, network, authorization, idempotency and recovery. See the current ChatKit chapters and `@ag-design/rules/chatkit-patterns.json`.


### Compact conversation composer
`createAgentConversation` keeps its standard textarea by default. Opt into `composerAppearance:"compact"`; supply a visible `composerLabel` when the recipient needs clarification. `composerActions:[{id,label}]` is limited to four literal declarations and needs `onComposerAction({sessionId,actionId})` plus matching capabilities. No draft/file/voice data is collected. The host owns authorization, effects and permissions. Up to eight unsettled tools are locally bounded; unknown outgoing sends block tools until reconciled. `composerState()` exposes redacted counts/availability only. CSS `field-sizing:content` is progressive enhancement; manual resize remains available. Enter still inserts a newline. See chat-composer-patterns and agent-work-presentation.


### Conversation presentations
`createAgentConversation({presentation:"document"|"messenger"|"work-log"})` keeps the same bounded message model and typed blocks. Document is default. `setPresentation(value)` changes layout in place and preserves keyed nodes, focus/selection, disclosures, draft, outgoing receipts and follow/read anchor; invalid active values throw, disposed calls return false. `presentationState()` exposes redacted view/count facts only. Use document for longer explanations, messenger for short recipient exchanges and work-log for observable operations. No view adds transport, delivery or server authority. The authored `/chat-comparison.html` host shows identical synthetic scenario snapshots, narrow stacking and explicit local sends. Read `chat-presentation-selection` before choosing.

### Text limits and reading blocks

`createField` and `createTextarea` accept `maxLength`, display remaining/native UTF-16 limit below the control, and return the same label with `sync()` and `dispose()` methods. Call sync after programmatic value changes and dispose on unmount. `createTextBlock({label,text,copyable:true})` provides literal output, local Ctrl/Cmd+A, quick-repeat page selection and an optional quiet copy icon below. See `textarea.md` and `text-block.md`.


### Compact chart dates
`createAmbientChart({mode:"data",labels,values,axisDates})` accepts one epoch-ms date per category; complete ISO dates/offset-bearing instants are detected when metadata is absent. Use `axisDates:false` for ISO-shaped category IDs. The axis shows initial month/year and later period changes, retaining exact labels/dates in selection and the table. `formatTimeAxisTicks` and `layoutAxisTicks` expose the same independently authored policy for agents; UTC by default. Calendar formatting never changes data coordinates. See the `data` design-book chapter.

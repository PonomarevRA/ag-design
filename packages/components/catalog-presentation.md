# Catalog cards and search controls

These independent public factories do not choose or mutate the host's grid, masonry, DOM order, routing, index or data. Include `styles.css`; both root and explicit subpath imports have TypeScript declarations. Read `catalog-item-presentation` and `catalog-discovery` through MCP first. Existing AG Pinterest/masonry, navigation rail and render-window ownership remain in place.

## Card

```js
const preview = mountOwnedPreview();
const card = createCatalogCard({
  document, i18n, title: 'Object tree', summary: 'Choose nested objects.',
  media: preview.element, // detached borrowed same-document DOM
  facts: [{label:'Version',value:'1.0'}, {label:'Platform',value:'Web'}],
  note: 'Draft; inspect current qualification.',
  onOpen: () => openDetails(),
  primaryAction: {label:'Try', onAction: () => openSandbox()},
});
container.append(card.element);
card.update({summary:'A clearer purpose'}); // preserves media and native input state
card.dispose();
preview.dispose(); // host owns borrowed media/resources and DOM removal
```

Title, summary, facts, badges, note and priceText are bounded literal text. A title may have `href` OR `onOpen`; actions have `href` OR `onAction` and explicit variants. Links stay native (HTTP(S), relative URLs under a valid base, fragments); no whole-card click or nested button. Disabled is supported only for callback buttons. `headingLevel`2–6 (default3) belongs to the host's document structure. Appearance framed/plain changes the local surface, not layout. `parts` exposes named presentation nodes for host adaptation; only media is a borrowed slot. Do not insert interactive nodes into the heading/button or factory-owned fact/action children.

Optional `priceText` is already formatted by the host, including variant/unit/conditions. Omitted price is not zero/free. A rating needs actual value/max/count; count0 has no numeric score and displays a localized no-reviews label; absent rating is omitted. Usage counts are never ratings. No stock/discount/trust claim is synthesized or verified. For products use decisive attributes and evidence; components may use package/version/platform/qualification instead. Synthetic examples are labelled.

Metadata update validates fully before mutating DOM. Unknown fields, sparse invalid collections, invalid rating/action/URL or media updates are rejected. Media must be detached with no parent when borrowed initially; it is not recreated or disposed by metadata updates/card.dispose. The host owns preview subscriptions/timers/async-boundary/render-window resources. `state` returns a detached serializable metadata snapshot without callbacks/media; it is not qualification evidence. dispose is idempotent and removes own click/locale handlers; host removes the DOM. Callback failures go to optional onError, never raw error UI; late errors after disposal are ignored.

## Search/filter controls

```js
const controls = createCatalogSearchControls({
  document, i18n, label: 'Find an item', mode: 'submit',
  facets: [{id:'platform',label:'Platform',options:[{value:'web',label:'Web'}]}],
  onChange(request) {
    // Host owns cancellation, network, filtering semantics and result DOM.
    void loadResults(request).then(result => {
      if (!controls.report({revision:request.revision,status:'ready',total:result.total})) return;
      renderResults(result);
    }, () => controls.report({revision:request.revision,status:'error'}));
  },
});
```

The result receipt must be accepted BEFORE replacing result DOM. Unknown total stays null, not zero. `report` accepts idle/loading/ready/error and optional total; ready requires a real integer total0–1e9. Only the current nonnegative revision is applied. Old callbacks/requests cannot mutate status via retired receipts; the host must also fence actual result DOM. Generated callback rejections use generic error status; successful callback completion alone does not establish a result count. No actual transport/query interpretation is included.

`mode:'submit'` separates draft and applied query/filter/sort until native Enter/Search. `instant` emits changed input/refinement immediately; debounce remains host-owned. IME drafts do not emit; composition completion is not double-submitted. Facets/sort schemas are fixed at creation: up to8 facets,64 choices/facet,20 sorts. Native select or checkbox fieldset matches single/multiple selection. Only configured values are accepted; explicit AND/OR/domain matching belongs to the host. Query max512 UTF-16 characters by default; set the exposed native input.maxLength to a lower host limit if required (AG uses256).

Committed query/filter chips are visible, removable and stable across status/locale changes. Removing a chip applies immediately without committing unrelated batch drafts. Clear query preserves other draft/applied choices. Reset clears query/facets and restores the first sort option. It never changes host palettes or usage. `update(partialValue)` is a silent external restore, resets draft/applied together and retires old receipts; the host reruns or reports its restored result. `state` exposes revision/draft/applied/dirty and status/total/staleness, never card data or raw errors. Caller labels are not automatically translated; owned controls/statuses use explicit i18n. dispose removes own handlers/subscription and suppresses late callbacks; no polling/timers/history writes are created.

The host owns URLs/back/scroll/selection/paging, results aria-busy and context disclosure. The controls own one concise polite status outside results; never set the whole card grid aria-live. Retain old cards only with explicit stale feedback, and distinguish empty inventory, no matches and failure. Do not add unsupported autocomplete/semantic/compatibility claims. New controls do not replace AG's existing lexical index/MCP engine.

## Evidence boundaries

Natural-height cards compose inside an existing masonry/grid/list. Main catalogue adoption retains the same min-column-width290 binder, row-span algorithm, DOM order, wide board and rail/windowed previews. Layout, live consumer scenarios, actual fonts/contrast, narrow/text2x, keyboard/AT/native, search relevance and user studies must be verified separately. No sales/conversion/full-WCAG/performance claim follows from component tests. Current marketplace media rules are platform/category-specific, not a new AG aspect-ratio/height mandate.


## Shared form-row tracks

`adjacentFields` optionally borrows up to four same-document native labels. Each label has exactly a caption span and one single-line input/select; the host owns values, listeners, validation and filter semantics. The labels move only after validation. They join the query and buttons on shared label/control grid tracks; feedback stays below. They are not added to query chips or reset/state automatically: the host must coordinate reset/report itself, as the catalog does. Dispose removes only component listeners and leaves borrowed DOM mounted for host removal/reuse. Dynamic facet schemas remain unsupported.

The row stacks within a narrow component container; long labels expand the shared label track. Search/select/actions use compatible40CSSpx comfortable control sizing; this is AG policy. Read `form-row-layout` and inspect rectangles through `@ag-design/rules/form-row`; a numeric pass never qualifies labels, feedback, AT or a host application.

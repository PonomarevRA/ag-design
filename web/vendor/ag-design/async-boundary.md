# Async component boundary

`createAsyncBoundary` owns the transition from a Promise to a detached component. Use it for asynchronously loaded cards, data panels, previews and lazy imports. A synchronous component needs no boundary. Import from `@ag-design/components` or `@ag-design/components/async-boundary`; include `styles.css`.

```js
const boundary = createAsyncBoundary({
  document,
  label: 'Report',
  key: reportId,
  async load({ signal, key }) {
    const response = await fetch(`/reports/${encodeURIComponent(key)}`, { signal });
    if (!response.ok) throw new Error('Report unavailable');
    const data = await response.json();
    signal.throwIfAborted();
    // mountReport must return a detached same-document {element, dispose}.
    // If partial construction can fail, its factory must clean those resources.
    return mountReport(data);
  },
});
container.append(boundary.element);
await boundary.run({ key: nextReportId });
console.log(boundary.state); // inspect structured state before screenshots
boundary.dispose();
```

`autoStart` defaults to true. `run({key?,load?})` supersedes pending work and resolves its own immutable `{outcome,key,requestId,errorKind}`. Outcomes: ready, empty, error, cancelled, superseded, disposed. Errors are diagnostic only through `onError(error,kind)`; UI uses generic localized messages. `null` means empty. Invalid run options throw before changing a live operation. `run` after disposal resolves disposed. Never reuse a released component.

`state` is an immutable snapshot with status (idle/loading/ready/empty/error/cancelled/disposed), key, requestId, hasContent, refreshing, stale and errorKind (load/contract/timeout/null). It contains no raw exception, response or user content. `cancel()` is quiet and preserves previous same-key content. `dispose()` is idempotent and clears timers, listeners, locale subscription and owned content.

`keepPrevious:true` retains the existing subtree during a refresh with the SAME key, including selection and focus. An unsuccessful refresh visibly identifies old content. Another object/user/tenant requires another key, immediately clearing old content. A successful replacement removes old DOM and moves focus to the named region if necessary. Hosts must protect dirty forms before starting a refresh. Loader output must be a detached same-document element with `dispose`; connected/foreign/ancestor nodes are rejected without moving or disposing host DOM.

`loadingDelayMs:150`, `timeoutMs:15000`, `minHeight:96` are configurable AG defaults, not source requirements or performance promises. Timeout0 disables the deadline; visual delay0 shows immediately. Browser scheduling can delay timers. Busy state is immediate on the content subtree. The polite status is outside it. No status-triggered focus movement; no fake percentages, automatic retry or animation. Native retry and cancel buttons preserve their DOM across locale changes. Use explicit `i18n` or the configured document context; caller labels/content remain caller-owned.

Every run has a new AbortController and generation fence. Abort alone cannot stop arbitrary JavaScript promises or computation. Pass signal into the real transport and clean partial construction on abort/failure. Before the loader returns, it owns resources; after a valid return, the boundary owns them. A valid late result is disposed once. A loader which ignores abort can keep its own captured resources alive until it settles; the boundary cannot guarantee process memory reclamation for uncooperative work. It still settles the run outcome and removes its own timers.

```js
createRenderWindow({
  document,
  label: 'Report preview',
  render() {
    return createAsyncBoundary({ document, label: 'Report', key: reportId, load });
  },
});
```

The render-window factory stays synchronous. Eviction calls boundary.dispose, aborting pending work; re-entry starts fresh. Host data/cache/bounded snapshot and restore stay separate from DOM ownership. Do not add another window around an already windowed catalogue. Essential text, print, SEO and browser Find need eager content or a tested alternative. Shared caches, authorization, transport, SSR and mutations remain host responsibilities. Retry must be explicit and safe/idempotent; do not use automatic replay for payments, writes or other side effects.

Agent route: `design_search(query="async-boundary")` → `design_component(component_id="async-boundary")` → `design_rule_section(section_id="async-components")`. Read the full RU/EN chapter for conditions and checks. The component remains draft: synthetic tests and browser samples do not qualify native/assistive technology behavior or production performance.

Primary sources reviewed2026-10-28:

- [MDN AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal): cooperative abort and single-use signals.
- [React useEffect](https://react.dev/reference/react/useEffect): cleanup fences out-of-order responses. This AG API does not implement React Suspense.
- [TanStack query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation): the loader must consume the signal; query cache semantics remain host-owned.
- [TanStack background fetching](https://tanstack.com/query/latest/docs/framework/react/guides/background-fetching-indicators): initial load and background refresh are distinct.
- [W3C status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html): programmatic feedback without moving focus. Reading the guidance is not conformance certification.

# Scoped UI event bus and request router

Core0.27.0 provides headless `createEventBus` and `createRequestRouter`. No framework dependency, network call, URL navigation, wallet, persistence or global singleton is installed. These are per-app/view/session coordination services. For two tightly related controls a callback is often simpler; where a host already uses TanStack Query or another mature data layer, keep that layer and adapt its API rather than creating a second cache.

## Ownership

- Host owns routes/handlers, authentication/authorization, full cache identity, session scope, payload/result byte budgets, immutability, validation, transaction/idempotency and transport cancellation.
- Router owns finite admission, query-only sharing/cache freshness, each caller's deadline/signal and invalidation fences.
- Bus owns short local notifications, finite tier queues, event TTL and subscriptions. Events are not a database, source of truth, authoritative command, durable broker or security boundary.
- `async-boundary` owns loading/error/retry and DOM/Promise generations; `render-window` owns visible mounted resources. Pass router results into boundary, and publish a small invalidation notification after an observed successful host operation. Do not persist each pointermove to a backend.

## Event bus

```js
const bus = createEventBus();
const owner = new AbortController();
const stop = bus.subscribe('selection.changed', ({ payload }) => {
  showSelection(payload.id); // short synchronous work, no hidden API fan-out
}, { signal: owner.signal });
const receipt = bus.publish('selection.changed', { id: 'item-A' }, {
  priority: 'user-blocking', ttlMs: 1000, coalesceKey: 'selection'
});
if (!receipt.accepted) showOverload();
owner.abort(); // or stop(); both detach this subscription
bus.dispose();
```

Three independent FIFO tier capacities default to1024 each: user-blocking, user-visible, background. Weighted round-robin8:4:1 is an AG default, not a standard or optimal workload ratio. It prevents strict-priority starvation while all tiers remain admitted. The cursor persists between slices: high-priority work need not be the very next event, and executing JavaScript is never preempted. Overflow explicitly rejects the newest publication (`accepted:false, reason:'capacity'`); no silent command drop, auto retry or eviction of other tiers. Expired events are removed when draining, not by a timer for each entry. A full queue can reject before its next drain, even if some retained entries have expired.

TTL defaults5000ms (1..86400000). `coalesceKey` opt-in replaces a pending value with the same tier/topic/key, refreshes its timestamp/TTL and retains its queue position. Use only for latest-state hints such as hover/selection/gesture position; never merge payments, undo steps, counters or other every-event commands. O(1) linked queues avoid shifting or tombstone accumulation. Payload references are retained until drain/replacement/dispose; envelopes are shallow frozen, payloads are not cloned/deep-frozen. Bound bytes and treat values as immutable.

Default scheduling uses one cancellable macrotask at a time, max256events and4ms cooperative budget per flush. A single long handler can exceed that budget. Subscribers are short synchronous notifications: do not start unbounded async work from every event. Rejected subscriber promises are observed for diagnostics but not awaited or admission-controlled; use the router for asynchronous jobs. Exceptions do not stop other subscribers. After disposal, no delivery/diagnostic callback is made. A custom `schedule(callback)` MUST defer, return a cancellation function and invoke each callback at most once. For animation use `autoFlush:false` and the host's one `requestAnimationFrame` loop to `flush()`; do not use both loops accidentally. rAF may pause in hidden documents; TTL/disposal must not depend on its cadence.

`subscribe` returns idempotent unsubscribe and accepts AbortSignal. Global subscription cap defaults1024. New listeners do not join the in-progress event, removed listeners are skipped, nested flush cannot recurse. `dispose` cancels pending scheduling and releases maps, payload queues and abort listeners. There is no replay/history. `stats` is an immutable counter snapshot with pending counts per tier, subscription count, expired/coalesced/rejected/errors and disposed; it contains no payloads.

## Request router

```js
// Dispose/recreate on logout, user/tenant change or privilege/session epoch change.
const router = createRequestRouter({ scopeKey: 'opaque-session-epoch', maxConcurrent: 6 });
const unregister = router.register('catalog.read', (input, { signal }) =>
  hostApi.readCatalog(input, { signal }), {
  kind: 'query',
  key: input => JSON.stringify([input.category, input.page, input.locale, input.revision]),
  cacheTtlMs: 1000,
  validate: input => typeof input.category === 'string'
});
const controller = new AbortController();
const data = await router.request('catalog.read', input, {
  signal: controller.signal, timeoutMs: 5000, priority: 'user-visible'
});
router.invalidate('catalog.read'); // cancels/fences pending and active old reads
unregister();
router.dispose();
```

Registered names map to trusted handlers, not dynamic URLs or arbitrary code. Registration returns unregister. Only `kind:'query'` permits a required explicit key function and optional TTL. Key includes every input affecting data/permissions/revision, and the router instance belongs to one session/tenant boundary; scope is a caller declaration, not authenticated authority. Never place tokens/private values in a key or diagnostic snapshot. Equal name/scope/key requests share one underlying operation. A joined urgent waiter promotes a still-queued read to the higher tier, preserving FIFO at that tier's tail; it cannot preempt active work and weighted fairness still applies.

Defaults:6physical active slots,128queued operations,512total waiting consumers,128routes and128cache entries. Handler start is deferred to a Promise turn after admission. Queue/consumer/route exhaustion returns an explicit `AppRuntimeError('overloaded')`; handle recovery and do not retry-loop. Each caller has its own finite1..86400000ms deadline (default5000) and signal. Cancelling one waiter leaves others intact; losing the last removes queued work or signals an active operation. Physical active count is released only after the handler actually settles. Ignored abort can exhaust all bounded slots; `abandonedActive` exposes this availability problem. Deadlines reject callers promptly, not forcibly terminate JS/network/server effects. Cancel is not rollback.

Cache default TTL0 is disabled. A declared query freshness window starts at successful completion; finite LRU entry capacity and lazy expiration bound retention count, not result bytes. Same immutable reference may be shared by cache and multiple consumers. Cache hits settle immediately; later cancellation/invalidation cannot revoke an already delivered value. Errors, cancelled/stale completions and commands are not cached. Different router instances never share data. Invalidation clears that route's cache, advances revision, rejects/cancels old waiters and prevents a late result from refilling cache or deleting a newer join. It also interrupts other joined consumers: choose owner-level invalidation deliberately, not per-widget unmount. Unregister removes the route before abort callbacks can reenter it. Dispose rejects consumers and releases local queues/cache/registry; uncooperative active transports may retain their bounded inputs until actual settlement.

Commands use `kind:'command'` with no key/cache. Every accepted request runs separately; there is no automatic replay, retry, polling, batch transport, priority preemption, rate limiting, SWR, HTTP caching, durable queue or distributed exactly-once guarantee. Mutation sequencing/revision/idempotency and authorization remain host/server concerns. After a confirmed mutation, owner invalidates applicable queries; a timer/client state does not prove server success.

Stable local error codes include disposed, route-not-found, duplicate-route, invalid-input, overloaded, aborted, timeout, stale and handler-failed. Host errors remain Promise rejections; do not show raw backend errors or secrets to users. Visible statuses, focus/recovery and localizable copy are application responsibilities. Promise rejection is always observed by integrations. Counter snapshots expose active/pending/per-tier/waiter/cache/route counts, started/completed/failed/cacheHits/joined/promoted/rejected/aborted/timedOut/abandonedActive without input/result data.

## Hot gestures, games and scale

Keep local input state, keyboard/touch semantics and immediate feedback local. Coalesce replaceable pointer samples, update rendering at most once per frame, and send only settled intent at a separately bounded cadence. INP does not measure continuous gesture/game smoothness by itself: also inspect frame gaps and long tasks on target devices. Heavy simulation/parsing belongs in a Worker with explicit transferable/message schema and cancellation; BroadcastChannel is optional same-origin cross-context transport, not this bus or a trusted origin boundary. Multiplayer authority, reconciliation, netcode, physics and deterministic game ticks are outside this component's contract. Do not promise60/120FPS or backend savings from merely installing the package.

Compare matched workloads: number of requests/physical calls, dedup/cache ratios, rejected/expired/cancelled counts, active/pending high-water, p50/p95 event/request/paint delay, frame gaps and retained resources after disposal. Different query identities/permissions must not dedup. Record environment, data sizes, callback cost and bounds. Synthetic adapter-call savings demonstrate request sharing only, not production QPS, memory capacity, real network traffic or user-perceived speed. No user store is a load fixture.

## Primary sources

- [DOM EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget)
- [Scheduler.postTask](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/postTask) — limited availability; no mandatory dependency here
- [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- [BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)
- [TanStack Query defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [TanStack query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [TanStack cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)
- [web.dev INP](https://web.dev/articles/inp)
- [MDN Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)

AG contracts/defaults and scope decisions are authored interpretations, not requirements claimed from these sources. Existing security/color/accessibility/WebMCP baselines remain in force.

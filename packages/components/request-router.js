import {
  checkSignal,
  PRIORITIES,
  createTierQueue,
  integer,
  identity,
  priority,
  AppRuntimeError,
} from "./runtime-queue.js";
export { AppRuntimeError } from "./runtime-queue.js";

/** One session-owned registry for queries/commands. Handlers own transport and server authorization; this module never fetches or navigates. */
export function createRequestRouter({
  scopeKey,
  maxConcurrent = 6,
  maxPending = 128,
  maxWaiters = 512,
  maxRoutes = 128,
  maxCacheEntries = 128,
  now = () => performance.now(),
} = {}) {
  identity(scopeKey, "scopeKey");
  integer(maxConcurrent, "maxConcurrent", 1, 1024);
  integer(maxPending, "maxPending", 1, 65536);
  integer(maxWaiters, "maxWaiters", 1, 65536);
  integer(maxRoutes, "maxRoutes", 1, 1024);
  integer(maxCacheEntries, "maxCacheEntries", 0, 65536);
  if (typeof now !== "function") throw new TypeError("now");
  const routes = new Map(),
    queue = createTierQueue(),
    cache = new Map(),
    joining = new Map(),
    entries = new Set();
  const counts = {
    started: 0,
    completed: 0,
    failed: 0,
    cacheHits: 0,
    joined: 0,
    promoted: 0,
    rejected: 0,
    aborted: 0,
    timedOut: 0,
  };
  let disposed = false,
    active = 0,
    waiters = 0,
    pumping = false,
    cacheSerial = 0;
  /** Settle each consumer independently and detach its deadline/signal before invoking promise continuations. */
  function settle(waiter, error, value) {
    if (!waiter.live) return;
    waiter.live = false;
    waiter.entry.waiters.delete(waiter);
    waiters--;
    clearTimeout(waiter.timer);
    waiter.signal?.removeEventListener("abort", waiter.abort);
    if (error) waiter.reject(error);
    else waiter.resolve(value);
  }
  /** Forget join identity only if it still names this generation; newer replacement requests are untouched. */
  function unjoin(entry) {
    if (entry.joinId !== null && joining.get(entry.joinId) === entry)
      joining.delete(entry.joinId);
  }
  /** Fence and signal an obsolete operation; an ignored abort retains its physical concurrency slot until it actually settles. */
  function cancelEntry(entry, error) {
    if (entry.cancelled) return;
    entry.cancelled = true;
    unjoin(entry);
    if (entry.node) {
      queue.remove(entry.node);
      entry.node = null;
      entries.delete(entry);
    }
    for (const waiter of [...entry.waiters]) settle(waiter, error);
    entry.controller.abort(error);
  }
  /** A caller's abort/deadline does not cancel other callers; last-consumer loss cancels queued/active work. */
  function cancelWaiter(waiter, code) {
    if (!waiter.live) return;
    if (code === "timeout") counts.timedOut++;
    else counts.aborted++;
    settle(waiter, new AppRuntimeError(code));
    if (!waiter.entry.waiters.size)
      cancelEntry(waiter.entry, new AppRuntimeError(code));
    pump();
  }
  /** Read only current unexpired cached values. LRU capacity bounds entries, while hosts bound result bytes. */
  function cached(id) {
    const item = cache.get(id);
    if (!item) return null;
    if (now() >= item.expiresAt) {
      cache.delete(id);
      return null;
    }
    cache.delete(id);
    cache.set(id, item);
    return item;
  }
  /** Admit immutable-by-convention query results only while current; errors and abandoned requests never refill cache. */
  function remember(entry, value) {
    if (entry.joinId === null || !entry.route.cacheTtlMs || !maxCacheEntries)
      return;
    cache.set(entry.joinId, {
      value,
      expiresAt: now() + entry.route.cacheTtlMs,
      route: entry.route,
    });
    while (cache.size > maxCacheEntries)
      cache.delete(cache.keys().next().value);
  }
  /** Complete transport exactly once, even when handlers ignore AbortSignal; physical slots are released only here. */
  function complete(entry, error, value) {
    active--;
    entries.delete(entry);
    unjoin(entry);
    if (!entry.cancelled) {
      const current =
        !disposed &&
        routes.get(entry.name) === entry.route &&
        entry.revision === entry.route.revision;
      if (!current) error = new AppRuntimeError("stale");
      if (error) counts.failed++;
      else {
        counts.completed++;
        remember(entry, value);
      }
      for (const waiter of [...entry.waiters]) settle(waiter, error, value);
    }
    pump();
  }
  /** Fill available slots by fair tier order. Promise boundaries prevent handler reentrancy before admission is complete. */
  function pump() {
    if (disposed || pumping) return;
    pumping = true;
    try {
      while (active < maxConcurrent && queue.size()) {
        const entry = queue.next();
        entry.node = null;
        if (entry.cancelled || !entry.waiters.size) {
          entries.delete(entry);
          continue;
        }
        entry.active = true;
        active++;
        counts.started++;
        Promise.resolve()
          .then(() => {
            if (entry.cancelled) throw new AppRuntimeError("aborted");
            return entry.route.handler(entry.input, {
              signal: entry.controller.signal,
              route: entry.name,
              scopeKey,
            });
          })
          .then(
            (value) => complete(entry, null, value),
            (error) =>
              complete(
                entry,
                error instanceof Error
                  ? error
                  : new AppRuntimeError("handler-failed"),
              ),
          );
      }
    } finally {
      pumping = false;
    }
  }
  /** Register explicit operation semantics; only queries declare complete identity keys and optional finite freshness. */
  function register(
    name,
    handler,
    { kind, key, cacheTtlMs = 0, validate } = {},
  ) {
    identity(name, "route");
    if (disposed) throw new AppRuntimeError("disposed");
    if (routes.has(name)) throw new AppRuntimeError("duplicate-route");
    if (routes.size >= maxRoutes) throw new AppRuntimeError("overloaded");
    if (
      typeof handler !== "function" ||
      !["query", "command"].includes(kind) ||
      (validate !== undefined && typeof validate !== "function")
    )
      throw new TypeError("route contract");
    integer(cacheTtlMs, "cacheTtlMs", 0, 86400000);
    if (
      (kind === "query" && typeof key !== "function") ||
      (kind === "command" && (key !== undefined || cacheTtlMs !== 0))
    )
      throw new TypeError("query-only key/cache");
    const route = {
      handler,
      kind,
      key,
      cacheTtlMs,
      validate,
      revision: 0,
      serial: ++cacheSerial,
    };
    routes.set(name, route);
    return () => {
      if (routes.get(name) !== route) return;
      routes.delete(name);
      invalidateRoute(route);
    };
  }
  /** Resolve a named operation with per-waiter cancellation; cached/joined results never cross this router's explicit session scope. */
  function request(
    name,
    input,
    { priority: tier = "user-visible", timeoutMs = 5000, signal } = {},
  ) {
    try {
      checkSignal(signal);
      identity(name, "route");
      priority(tier);
      integer(timeoutMs, "timeoutMs", 1, 86400000);
      if (disposed) throw new AppRuntimeError("disposed");
      if (signal?.aborted) throw new AppRuntimeError("aborted");
      if (waiters >= maxWaiters) {
        counts.rejected++;
        throw new AppRuntimeError("overloaded");
      }
      const route = routes.get(name);
      if (!route) throw new AppRuntimeError("route-not-found");
      if (route.validate && route.validate(input) !== true)
        throw new AppRuntimeError("invalid-input");
      const key =
        route.kind === "query" ? identity(route.key(input), "query key") : null;
      if (disposed || routes.get(name) !== route)
        throw new AppRuntimeError("stale");
      // Trusted schema/key callbacks can synchronously admit another caller or abort this signal.
      if (signal?.aborted) throw new AppRuntimeError("aborted");
      if (waiters >= maxWaiters) {
        counts.rejected++;
        throw new AppRuntimeError("overloaded");
      }
      const joinId =
        key === null ? null : JSON.stringify([route.serial, scopeKey, key]);
      const hit = joinId === null ? null : cached(joinId);
      if (hit) {
        counts.cacheHits++;
        return Promise.resolve(hit.value);
      }
      let entry = joinId === null ? null : joining.get(joinId);
      // Invalidation advances revision before aborting old entries; abort callbacks must not join those still retiring.
      if (entry && (entry.cancelled || entry.revision !== route.revision))
        entry = null;
      if (entry) {
        counts.joined++;
        // Urgent callers may promote an already queued shared read, never preempt physical work.
        if (
          entry.node &&
          PRIORITIES.indexOf(tier) < PRIORITIES.indexOf(entry.priority)
        ) {
          queue.remove(entry.node);
          entry.priority = tier;
          entry.node = queue.push(entry, tier);
          counts.promoted++;
        }
      } else {
        // A full physical slot stays occupied even when its last consumer has timed out.
        if (queue.size() >= maxPending && active >= maxConcurrent) {
          counts.rejected++;
          throw new AppRuntimeError("overloaded");
        }
        entry = {
          name,
          route,
          revision: route.revision,
          priority: tier,
          input,
          joinId,
          controller: new AbortController(),
          waiters: new Set(),
          node: null,
          active: false,
          cancelled: false,
        };
        entry.node = queue.push(entry, tier);
        entries.add(entry);
        if (joinId !== null) joining.set(joinId, entry);
      }
      return new Promise((resolve, reject) => {
        const waiter = {
          entry,
          resolve,
          reject,
          signal,
          timer: null,
          abort: null,
          live: true,
        };
        waiter.abort = () => cancelWaiter(waiter, "aborted");
        entry.waiters.add(waiter);
        waiters++;
        waiter.timer = setTimeout(
          () => cancelWaiter(waiter, "timeout"),
          timeoutMs,
        );
        signal?.addEventListener("abort", waiter.abort, { once: true });
        // Real AbortSignal is stable, but this second check also fences an already-aborted signal at admission.
        if (signal?.aborted) waiter.abort();
        else pump();
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }
  /** Invalidate a route's cached values and all old requests; this is a local fence, never server rollback. */
  function invalidate(name) {
    identity(name, "route");
    const route = routes.get(name);
    if (!route) return;
    invalidateRoute(route);
  }
  /** Fence before abort callbacks can reenter; unregistered routes are already absent from the registry. */
  function invalidateRoute(route) {
    route.revision++;
    for (const [id, item] of cache) if (item.route === route) cache.delete(id);
    for (const entry of [...entries])
      if (entry.route === route)
        cancelEntry(entry, new AppRuntimeError("stale"));
    pump();
  }
  /** Dispose session resources; consumers reject immediately while uncooperative physical handlers may still occupy bounded slots. */
  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const entry of [...entries])
      cancelEntry(entry, new AppRuntimeError("disposed"));
    queue.clear();
    cache.clear();
    joining.clear();
    routes.clear();
  }
  return {
    register,
    request,
    invalidate,
    dispose,
    get stats() {
      let abandonedActive = 0;
      for (const entry of entries)
        if (entry.active && entry.cancelled) abandonedActive++;
      const result = {
        ...counts,
        active,
        pending: queue.size(),
        waiters,
        cacheEntries: cache.size,
        routes: routes.size,
        abandonedActive,
        disposed,
      };
      for (const tier of PRIORITIES) result[tier] = queue.size(tier);
      return Object.freeze(result);
    },
  };
}

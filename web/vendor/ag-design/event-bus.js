import {
  checkSignal,
  createTierQueue,
  PRIORITIES,
  integer,
  identity,
  priority,
} from "./runtime-queue.js";

/** Scoped bounded pub/sub for short UI notifications. Payloads stay in memory by reference; callers own byte budgets and immutability. */
export function createEventBus({
  capacityPerTier = 1024,
  maxSubscriptions = 1024,
  maxEventsPerFlush = 256,
  timeBudgetMs = 4,
  defaultTtlMs = 5000,
  autoFlush = true,
  now = () => performance.now(),
  schedule = (callback) => {
    const timer = setTimeout(callback, 0);
    return () => clearTimeout(timer);
  },
  onError = () => {},
} = {}) {
  integer(capacityPerTier, "capacityPerTier", 1, 65536);
  integer(maxSubscriptions, "maxSubscriptions", 1, 65536);
  integer(maxEventsPerFlush, "maxEventsPerFlush", 1, 65536);
  integer(timeBudgetMs, "timeBudgetMs", 1, 1000);
  integer(defaultTtlMs, "defaultTtlMs", 1, 86400000);
  if (
    typeof autoFlush !== "boolean" ||
    [now, schedule, onError].some((v) => typeof v !== "function")
  )
    throw new TypeError("event bus options");
  const pending = createTierQueue(),
    topics = new Map(),
    coalesced = new Map();
  const counts = {
    published: 0,
    delivered: 0,
    coalesced: 0,
    expired: 0,
    rejected: 0,
    errors: 0,
  };
  let disposed = false,
    flushing = false,
    subscriptionCount = 0,
    cancelScheduled = null;
  /** Diagnostic code cannot break delivery, including rejected async diagnostic callbacks. */
  function report(error) {
    if (disposed) return;
    counts.errors++;
    try {
      Promise.resolve(onError(error)).catch(() => {});
    } catch {}
  }
  /** One owned macrotask at a time yields between bounded slices. Custom schedulers must defer and return cancellation. */
  function arm() {
    if (
      disposed ||
      !autoFlush ||
      flushing ||
      cancelScheduled ||
      !pending.size()
    )
      return;
    cancelScheduled = schedule(() => {
      cancelScheduled = null;
      flush();
    });
  }
  /** Remove coalescing identity before handlers run so reentrant publications create a fresh event. */
  function forget(event) {
    if (event.coalesceId !== undefined) coalesced.delete(event.coalesceId);
    event.node = null;
  }
  /** Subscribe until explicit unsubscribe, signal abort or bus disposal; newly added handlers do not join the current dispatch. */
  function subscribe(topic, handler, { signal } = {}) {
    checkSignal(signal);
    identity(topic, "topic");
    if (typeof handler !== "function") throw new TypeError("handler");
    if (disposed || signal?.aborted) return () => {};
    if (subscriptionCount >= maxSubscriptions)
      throw new RangeError("maxSubscriptions");
    let live = true;
    const record = { handler, stop };
    let set = topics.get(topic);
    if (!set) {
      set = new Set();
      topics.set(topic, set);
    }
    set.add(record);
    subscriptionCount++;
    function stop() {
      if (!live) return;
      live = false;
      set.delete(record);
      subscriptionCount--;
      if (!set.size) topics.delete(topic);
      signal?.removeEventListener("abort", stop);
    }
    signal?.addEventListener("abort", stop, { once: true });
    return stop;
  }
  /** Admit or explicitly reject; coalescing is opt-in for replaceable state, never implicit for commands. */
  function publish(
    topic,
    payload,
    { priority: tier = "user-visible", ttlMs = defaultTtlMs, coalesceKey } = {},
  ) {
    identity(topic, "topic");
    priority(tier);
    integer(ttlMs, "ttlMs", 1, 86400000);
    if (coalesceKey !== undefined) identity(coalesceKey, "coalesceKey");
    if (disposed) return { accepted: false, reason: "disposed" };
    const stamp = now(),
      id =
        coalesceKey === undefined
          ? undefined
          : JSON.stringify([tier, topic, coalesceKey]);
    const old = id === undefined ? null : coalesced.get(id);
    if (old) {
      old.payload = payload;
      old.createdAt = stamp;
      old.expiresAt = stamp + ttlMs;
      counts.published++;
      counts.coalesced++;
      return { accepted: true, coalesced: true };
    }
    if (pending.size(tier) >= capacityPerTier) {
      counts.rejected++;
      return { accepted: false, reason: "capacity" };
    }
    const event = {
      topic,
      payload,
      priority: tier,
      createdAt: stamp,
      expiresAt: stamp + ttlMs,
      coalesceId: id,
      node: null,
    };
    event.node = pending.push(event, tier);
    if (id !== undefined) coalesced.set(id, event);
    counts.published++;
    arm();
    return { accepted: true, coalesced: false };
  }
  /** Deliver one cooperative slice; handler exceptions and rejected promises are isolated, never awaited as backpressure. */
  function flush() {
    if (disposed || flushing) return 0;
    cancelScheduled?.();
    cancelScheduled = null;
    flushing = true;
    const start = now();
    let handled = 0;
    try {
      while (
        !disposed &&
        pending.size() &&
        handled < maxEventsPerFlush &&
        (handled === 0 || now() - start < timeBudgetMs)
      ) {
        const event = pending.next();
        forget(event);
        handled++;
        if (now() >= event.expiresAt) {
          counts.expired++;
          continue;
        }
        const envelope = Object.freeze({
          topic: event.topic,
          payload: event.payload,
          priority: event.priority,
          createdAt: event.createdAt,
          expiresAt: event.expiresAt,
        });
        const handlers = Array.from(topics.get(event.topic) ?? []);
        for (const record of handlers) {
          if (disposed) break;
          if (!topics.get(event.topic)?.has(record)) continue;
          try {
            const result = record.handler(envelope);
            if (result && typeof result.then === "function")
              Promise.resolve(result).catch(report);
          } catch (error) {
            report(error);
          }
        }
        counts.delivered++;
      }
    } finally {
      flushing = false;
      arm();
    }
    return handled;
  }
  /** Retire the scope deterministically; no queued payloads, timers, topic maps or abort listeners survive. */
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelScheduled?.();
    cancelScheduled = null;
    for (const set of topics.values())
      for (const record of [...set]) record.stop();
    topics.clear();
    pending.clear();
    coalesced.clear();
  }
  return {
    publish,
    subscribe,
    flush,
    dispose,
    get stats() {
      const result = {
        ...counts,
        pending: pending.size(),
        subscriptions: subscriptionCount,
        disposed,
      };
      for (const tier of PRIORITIES) result[tier] = pending.size(tier);
      return Object.freeze(result);
    },
  };
}

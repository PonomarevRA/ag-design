export const PRIORITIES = Object.freeze([
  "user-blocking",
  "user-visible",
  "background",
]);
const order = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2];

/** Validate configuration before any timer/listener allocation; limits are AG defaults, not browser guarantees. */
export function integer(value, name, min, max) {
  if (!Number.isInteger(value) || value < min || value > max)
    throw new RangeError(name);
  return value;
}
/** Keep operation/topic/key names bounded without interpreting them as URLs or code. */
export function identity(value, name = "identity") {
  if (typeof value !== "string" || !value.trim() || value.length > 512)
    throw new TypeError(name);
  return value;
}
export function priority(value = "user-visible") {
  if (!PRIORITIES.includes(value)) throw new TypeError("priority");
  return value;
}
/** Intrusive FIFO supports O(1) removal on cancellation, with no sparse/tombstone array growth. */
function queue() {
  let head = null,
    tail = null,
    size = 0;
  return {
    get size() {
      return size;
    },
    push(value) {
      const node = { value, prev: tail, next: null, owner: this };
      if (tail) tail.next = node;
      else head = node;
      tail = node;
      size++;
      return node;
    },
    remove(node) {
      if (node?.owner !== this) return;
      if (node.prev) node.prev.next = node.next;
      else head = node.next;
      if (node.next) node.next.prev = node.prev;
      else tail = node.prev;
      node.owner = null;
      node.next = null;
      node.prev = null;
      size--;
      return node.value;
    },
    shift() {
      return head ? this.remove(head) : undefined;
    },
    clear() {
      while (head) this.remove(head);
    },
  };
}
/** Weighted round-robin8:4:1 retains FIFO within tiers and prevents an endlessly busy high tier starving background. */
export function createTierQueue() {
  const queues = PRIORITIES.map(() => queue());
  let cursor = 0;
  return {
    push(value, tier) {
      return queues[PRIORITIES.indexOf(priority(tier))].push(value);
    },
    remove(node) {
      return node?.owner?.remove(node);
    },
    next() {
      for (let i = 0; i < order.length; i++) {
        const q = queues[order[cursor]];
        cursor = (cursor + 1) % order.length;
        if (q.size) return q.shift();
      }
    },
    size(tier) {
      return tier
        ? queues[PRIORITIES.indexOf(priority(tier))].size
        : queues.reduce((n, q) => n + q.size, 0);
    },
    clear() {
      for (const q of queues) q.clear();
    },
  };
}
/** Domain error codes are stable; applications own localized recovery messages and do not expose private backend errors. */
export class AppRuntimeError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
    this.name =
      code === "aborted"
        ? "AbortError"
        : code === "timeout"
          ? "TimeoutError"
          : "AppRuntimeError";
  }
}

/** Reject malformed cancellation objects before allocating queued work or listeners. Native AbortSignal from another realm is supported. */
export function checkSignal(signal) {
  if (
    signal !== undefined &&
    (typeof signal?.aborted !== "boolean" ||
      typeof signal.addEventListener !== "function" ||
      typeof signal.removeEventListener !== "function")
  )
    throw new TypeError("AbortSignal");
}

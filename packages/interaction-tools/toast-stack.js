import { literal, node, callback } from "./runtime.js";
let sequence = 0;

/** A bounded local notification surface; the host performs actions and owns any business-level undo. */
export function createToastStack({
  document = globalThis.document,
  label = "Уведомления",
  onDismiss,
} = {}) {
  literal(label, "label", 180);
  callback(onDismiss, "onDismiss");
  const element = node(document, "section", "ag-it ag-it-toasts");
  element.setAttribute("aria-label", label);
  element.tabIndex = -1;
  const view = document.defaultView,
    records = new Map();
  let disposed = false;
  const now = () => view.performance.now();
  /** Pause subtracts elapsed monotonic time once; hover, focus and hidden reasons may overlap. */
  function pause(record) {
    if (record.timer !== null) {
      view.clearTimeout(record.timer);
      record.timer = null;
      record.remaining = Math.max(
        0,
        record.remaining - (now() - record.started),
      );
    }
  }
  /** Arm at most one timer; late callbacks check record identity so reused IDs cannot expire a newer toast. */
  function resume(record) {
    if (
      disposed ||
      records.get(record.id) !== record ||
      !record.duration ||
      record.hovered ||
      record.item.contains(document.activeElement) ||
      document.hidden ||
      record.timer !== null
    )
      return;
    record.started = now();
    record.timer = view.setTimeout(() => {
      record.timer = null;
      if (records.get(record.id) === record) dismiss(record.id, "timeout");
    }, record.remaining);
  }
  /** Release before notifying the host, preventing double actions or re-entrant stale dismissal. */
  function dismiss(id, reason = "programmatic") {
    const record = records.get(id);
    if (!record) return false;
    const focused = record.item.contains(document.activeElement);
    pause(record);
    records.delete(id);
    record.abort.abort();
    record.item.remove();
    if (focused && !disposed)
      (record.origin?.isConnected ? record.origin : element).focus?.({
        preventScroll: true,
      });
    onDismiss?.({ id, reason });
    return true;
  }
  /** Suspend owned lifetimes while the document is hidden; visible records resume their remaining duration. */
  function visibility() {
    for (const record of records.values())
      document.hidden ? pause(record) : resume(record);
  }
  document.addEventListener("visibilitychange", visibility);
  return {
    element,
    get size() {
      return records.size;
    },
    dismiss,
    /** Validate one literal record and callbacks before allocating listeners/timers; a full surface returns null unchanged. */
    push({
      id = "toast-" + ++sequence,
      message,
      actionLabel,
      onAction,
      duration = 5000,
    } = {}) {
      if (disposed) return null;
      literal(id, "id", 80);
      literal(message, "message", 500);
      callback(onAction, "onAction");
      if (actionLabel !== undefined) literal(actionLabel, "actionLabel", 80);
      if ((actionLabel === undefined) !== (onAction === undefined))
        throw new TypeError("Supply actionLabel and onAction together");
      if (
        !Number.isInteger(duration) ||
        (duration !== 0 && (duration < 2000 || duration > 30000))
      )
        throw new RangeError("Duration is 0 or 2000–30000ms");
      if (records.has(id)) throw new TypeError("Unique toast ID required");
      if (records.size >= 5) return null;
      const item = node(document, "div", "ag-it-toast"),
        messageElement = node(
          document,
          "span",
          "ag-it-toast__message",
          message,
        ),
        close = node(document, "button", "ag-it-icon");
      messageElement.setAttribute("role", "status");
      messageElement.setAttribute("aria-live", "polite");
      close.type = "button";
      close.setAttribute("aria-label", "Закрыть уведомление");
      close.title = "Закрыть уведомление";
      close.textContent = "×";
      const abort = new view.AbortController(),
        record = {
          id,
          item,
          abort,
          origin: document.activeElement,
          duration,
          remaining: duration,
          started: 0,
          timer: null,
          hovered: false,
        };
      item.append(messageElement);
      if (actionLabel !== undefined) {
        const action = node(document, "button", "ag-it-action", actionLabel);
        action.type = "button";
        action.addEventListener(
          "click",
          () => {
            if (dismiss(id, "action")) onAction();
          },
          { signal: abort.signal },
        );
        item.append(action);
      }
      item.append(close);
      records.set(id, record);
      element.append(item);
      const options = { signal: abort.signal };
      close.addEventListener("click", () => dismiss(id, "close"), options);
      item.addEventListener(
        "keydown",
        (event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            dismiss(id, "close");
          }
        },
        options,
      );
      item.addEventListener(
        "pointerenter",
        () => {
          record.hovered = true;
          pause(record);
        },
        options,
      );
      item.addEventListener(
        "pointerleave",
        () => {
          record.hovered = false;
          resume(record);
        },
        options,
      );
      item.addEventListener("focusin", () => pause(record), options);
      item.addEventListener(
        "focusout",
        () => view.queueMicrotask(() => resume(record)),
        options,
      );
      resume(record);
      return id;
    },
    clear() {
      for (const id of [...records.keys()]) dismiss(id, "clear");
    },
    /** Disposal cancels effects without executing notification or business callbacks. */
    dispose() {
      if (disposed) return;
      disposed = true;
      document.removeEventListener("visibilitychange", visibility);
      for (const record of records.values()) {
        pause(record);
        record.abort.abort();
      }
      records.clear();
      element.remove();
    },
  };
}

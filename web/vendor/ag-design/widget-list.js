import { createButton } from "./primitives.js";
import {
  normalizeWidgetList,
  normalizeWidgetPending,
} from "./widget-list-model.js";

let serial = 0;

/**
 * Create a bounded keyed result list from AG data, inspired by ChatKit ListView.
 * This is not a ChatKit JSON renderer or transport. Host owns data, effects and localized strings.
 * update requires a strictly newer display revision; pending scope is explicit and survives compatible updates.
 */
export function createWidgetList({
  document = globalThis.document,
  title,
  revision = 0,
  items = [],
  limit = 5,
  showMoreLabel,
  emptyMessage,
  onAction = () => {},
  onError = () => {},
} = {}) {
  if (
    !document?.createElement ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 20 ||
    typeof showMoreLabel !== "string" ||
    !showMoreLabel.trim() ||
    showMoreLabel.length > 256 ||
    typeof emptyMessage !== "string" ||
    !emptyMessage.trim() ||
    emptyMessage.length > 1024 ||
    typeof onAction !== "function" ||
    typeof onError !== "function"
  )
    throw new TypeError("Invalid widget list options");
  let current = normalizeWidgetList({ title, revision, items }),
    disposed = false,
    visible = limit;
  let pending = { scope: "none", itemId: null, message: "" };
  const rows = new Map(),
    prefix = `ag-widget-list-${++serial}`;
  const element = document.createElement("section"),
    heading = document.createElement("h3"),
    content = document.createElement("div"),
    list = document.createElement("ul"),
    empty = document.createElement("p"),
    status = document.createElement("p");
  element.className = "ag-widget-list";
  heading.id = prefix;
  heading.tabIndex = -1;
  element.setAttribute("aria-labelledby", prefix);
  content.className = "ag-widget-list__content";
  list.className = "ag-widget-list__items";
  status.className = "ag-widget-list__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");
  empty.textContent = emptyMessage;
  const more = createButton({
    document,
    label: showMoreLabel,
    variant: "quiet",
  });
  content.append(list, empty, more);
  // Announcements are siblings of the busy content, never descendants of its own busy region.
  element.append(heading, content, status);

  /** Diagnostic failure cannot convert an attempted action into accepted data or break cleanup. */
  function report(error) {
    if (disposed) return;
    try {
      Promise.resolve(onError(error)).catch(() => {});
    } catch {
      /* The host diagnostic channel does not own presentation state. */
    }
  }

  /** Create one owned row; its handler resolves the current keyed data at activation time. */
  function createRow(id) {
    const element = document.createElement("li"),
      body = document.createElement("div"),
      title = document.createElement("strong"),
      description = document.createElement("p"),
      meta = document.createElement("p");
    const button = createButton({ document, label: "—", variant: "secondary" });
    const actionLabel = document.createTextNode("");
    button.replaceChildren(actionLabel);
    element.className = "ag-widget-list__item";
    body.className = "ag-widget-list__text";
    title.id = `${prefix}-row-${id}`;
    description.className = "ag-widget-list__description";
    meta.className = "ag-widget-list__meta";
    body.append(title, description, meta);
    element.append(body, button);
    /** Emit a typed intent with actual current identity/revision; no form values or arbitrary payload are collected. */
    function activate() {
      if (
        disposed ||
        pending.scope === "container" ||
        (pending.scope === "self" && pending.itemId === id)
      )
        return;
      const item = current.items.find((item) => item.id === id);
      if (!item?.action) return;
      try {
        Promise.resolve(
          onAction({
            itemId: id,
            revision: current.revision,
            actionId: item.action.id,
            type: item.action.type,
          }),
        ).catch(report);
      } catch (error) {
        report(error);
      }
    }
    button.addEventListener("click", activate);
    return {
      element,
      body,
      title,
      description,
      meta,
      button,
      actionLabel,
      activate,
    };
  }

  /** Reconcile only visible keyed rows and retain controls; restore owned focus if reordering/removal displaced it. */
  function paint() {
    const focused = document.activeElement,
      ownedFocus = element.contains(focused),
      keep = new Set();
    heading.textContent = current.title;
    const shown = Math.min(visible, current.items.length);
    for (let index = 0; index < shown; index++) {
      const item = current.items[index];
      keep.add(item.id);
      let row = rows.get(item.id);
      if (!row) {
        row = createRow(item.id);
        rows.set(item.id, row);
      }
      row.title.textContent = item.title;
      row.description.textContent = item.description;
      row.description.hidden = !item.description;
      row.meta.textContent = item.meta;
      row.meta.hidden = !item.meta;
      row.button.hidden = !item.action;
      if (item.action) {
        row.actionLabel.data = item.action.label;
        row.button.setAttribute("aria-describedby", row.title.id);
      }
      const busy =
        pending.scope === "container" ||
        (pending.scope === "self" && pending.itemId === item.id);
      row.button.disabled = busy;
      row.body.setAttribute("aria-busy", String(busy));
      if (list.children[index] !== row.element)
        list.insertBefore(row.element, list.children[index] ?? null);
    }
    for (const [id, row] of rows) {
      if (keep.has(id)) continue;
      row.button.removeEventListener("click", row.activate);
      row.element.remove();
      rows.delete(id);
    }
    content.setAttribute("aria-busy", String(pending.scope === "container"));
    more.hidden = shown >= current.items.length;
    more.disabled = pending.scope === "container";
    empty.hidden = current.items.length !== 0 || pending.scope !== "none";
    status.textContent = pending.message;
    status.hidden = !pending.message;
    const usable =
      element.contains(focused) && !focused.hidden && !focused.disabled;
    if (ownedFocus && (!usable || document.activeElement !== focused)) {
      (usable ? focused : heading).focus({ preventScroll: true });
    }
  }

  /** Reveal the next bounded batch without an inner scrollbar, request or fabricated total. */
  function reveal() {
    if (disposed || pending.scope === "container") return;
    const wasFocused = document.activeElement === more;
    visible = Math.min(100, visible + limit);
    paint();
    if (wasFocused && more.hidden) heading.focus({ preventScroll: true });
  }
  more.addEventListener("click", reveal);

  /** Validate a complete newer snapshot atomically; stale responses cannot overwrite current list data. */
  function update(snapshot) {
    if (disposed) return false;
    const next = normalizeWidgetList(snapshot);
    if (next.revision <= current.revision) return false;
    current = next;
    if (
      pending.scope === "self" &&
      !current.items.some((item) => item.id === pending.itemId)
    )
      pending = { scope: "none", itemId: null, message: "" };
    paint();
    return true;
  }

  /** Set a visual loading/recovery message; none never makes a claimed server result authoritative. */
  function setPending(value) {
    if (disposed) return false;
    pending = normalizeWidgetPending(value, current);
    paint();
    return true;
  }

  /** Return bounded redacted structure only; no titles, descriptions, messages, IDs or action data. */
  function inspect() {
    return {
      schema: "ag-design/widget-list-v1",
      revision: current.revision,
      total: current.items.length,
      visible: disposed ? 0 : Math.min(visible, current.items.length),
      mounted: rows.size,
      pendingScope: pending.scope,
      disposed,
      transport: "host-owned",
    };
  }

  /** Detach owned listeners and DOM; retained buttons and late callback failures become inert. */
  function dispose() {
    if (disposed) return;
    disposed = true;
    more.removeEventListener("click", reveal);
    for (const row of rows.values()) {
      row.button.removeEventListener("click", row.activate);
      row.button.disabled = true;
    }
    rows.clear();
    more.disabled = true;
    element.remove();
  }
  paint();
  return { element, update, setPending, inspect, dispose };
}

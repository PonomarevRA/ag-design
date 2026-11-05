import { literal, node, callback } from "./runtime.js";

/** Validate and copy at most fifty choices before touching rendered state. */
function choices(items) {
  if (!Array.isArray(items) || items.length > 50)
    throw new RangeError("At most 50 filters");
  const ids = new Set(),
    result = [];
  for (const item of items) {
    literal(item?.id, "id", 80);
    literal(item.label, "label", 140);
    if (ids.has(item.id)) throw new TypeError("Unique filter IDs required");
    if (item.disabled !== undefined && typeof item.disabled !== "boolean")
      throw new TypeError("Boolean disabled required");
    if (
      item.count !== undefined &&
      (!Number.isInteger(item.count) || item.count < 0 || item.count > 1e9)
    )
      throw new RangeError("Bounded integer count required");
    ids.add(item.id);
    result.push({
      id: item.id,
      label: item.label,
      count: item.count,
      disabled: !!item.disabled,
    });
  }
  return result;
}

/** A scrollable single-choice filter group. Pressed buttons request host filtering; they do not claim ownership of tab panels. */
export function createFilterChips({
  document = globalThis.document,
  items = [],
  selectedId,
  label = "Фильтры",
  onChange,
} = {}) {
  literal(label, "label", 180);
  callback(onChange, "onChange");
  const element = node(document, "div", "ag-it ag-it-chips");
  element.setAttribute("role", "group");
  element.setAttribute("aria-label", label);
  let state = [],
    selected = null,
    disposed = false;
  const preference = document.defaultView.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  );
  /** Reflect state without recreating buttons during keyboard selection. */
  function mark(id) {
    selected = id;
    for (const b of element.children) {
      b.setAttribute("aria-pressed", String(b.dataset.id === id));
      b.tabIndex = b.dataset.id === id ? 0 : -1;
    }
  }
  /** Validate the successor first, preserve a focused key, and keep programmatic updates silent. */
  function update(next = {}) {
    if (disposed) return false;
    const checked = choices(next.items ?? state);
    const enabled = checked.filter((item) => !item.disabled);
    let id = next.selectedId === undefined ? selected : next.selectedId;
    if (
      next.selectedId !== undefined &&
      id !== null &&
      !enabled.some((item) => item.id === id)
    )
      throw new TypeError("Select an enabled filter");
    if (!enabled.some((item) => item.id === id)) id = enabled[0]?.id ?? null;
    const focus = element.contains(document.activeElement)
      ? document.activeElement.dataset.id
      : null;
    const buttons = [];
    for (const item of checked) {
      const b = node(document, "button", "ag-it-chip");
      b.type = "button";
      b.dataset.id = item.id;
      b.disabled = item.disabled;
      b.append(node(document, "span", "", item.label));
      if (item.count !== undefined)
        b.append(
          node(document, "span", "ag-it-chip__count", String(item.count)),
        );
      buttons.push(b);
    }
    state = checked;
    element.replaceChildren(...buttons);
    mark(id);
    if (focus)
      (
        [...element.children].find(
          (b) => b.dataset.id === focus && !b.disabled,
        ) ?? [...element.children].find((b) => b.dataset.id === selected)
      )?.focus();
    return true;
  }
  /** A user selection reports once and scrolls only its own button into view. */
  function choose(b) {
    if (!b || b.disabled || selected === b.dataset.id) return;
    mark(b.dataset.id);
    b.scrollIntoView?.({
      block: "nearest",
      inline: "nearest",
      behavior: preference?.matches ? "auto" : "smooth",
    });
    onChange?.({ id: selected });
  }
  const click = (event) => choose(event.target.closest("button"));
  /** Keep horizontal keyboard navigation within enabled choices and follow the native writing direction. */
  const key = (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    const enabled = [...element.children].filter((c) => !c.disabled),
      index = enabled.indexOf(b);
    let next = index;
    const rtl =
      document.defaultView.getComputedStyle(element).direction === "rtl";
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = enabled.length - 1;
    else if (event.key === "ArrowRight")
      next = (index + (rtl ? -1 : 1) + enabled.length) % enabled.length;
    else if (event.key === "ArrowLeft")
      next = (index + (rtl ? 1 : -1) + enabled.length) % enabled.length;
    else return;
    event.preventDefault();
    enabled[next]?.focus();
    choose(enabled[next]);
  };
  update({ items, selectedId });
  element.addEventListener("click", click);
  element.addEventListener("keydown", key);
  return {
    element,
    update,
    get selectedId() {
      return selected;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      element.removeEventListener("click", click);
      element.removeEventListener("keydown", key);
      element.remove();
    },
  };
}

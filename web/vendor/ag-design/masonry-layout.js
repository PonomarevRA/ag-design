const bindings = new WeakSet();
const defaults = Object.freeze({
  minColumnWidth: 280,
  columns: "auto",
  gap: 16,
  rowHeight: 4,
});

/** Validate geometry before changing DOM; dimensions are finite CSS pixels. */
function geometry(patch, previous = defaults) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch))
    throw new TypeError("Masonry options must be an object");
  const next = { ...previous };
  for (const key of Object.keys(patch)) {
    if (!Object.hasOwn(defaults, key))
      throw new TypeError(`Unknown masonry option: ${key}`);
    next[key] = patch[key];
  }
  for (const key of ["minColumnWidth", "gap", "rowHeight"]) {
    const value = next[key];
    if (
      !Number.isFinite(value) ||
      value < (key === "gap" ? 0 : 1) ||
      value > 10000
    )
      throw new RangeError(`Invalid masonry ${key}`);
  }
  if (
    next.columns !== "auto" &&
    (!Number.isInteger(next.columns) || next.columns < 1 || next.columns > 24)
  )
    throw new RangeError(
      "Masonry columns must be auto or an integer from 1 to 24",
    );
  return next;
}

/** Keep pre-binding values and restore only properties still owned by this binding. */
function ownStyles(element) {
  const values = new Map();
  return {
    set(name, value) {
      if (!values.has(name))
        values.set(name, {
          value: element.style.getPropertyValue(name),
          priority: element.style.getPropertyPriority(name),
          owned: null,
        });
      const entry = values.get(name);
      if (
        element.style.getPropertyValue(name) !== value ||
        element.style.getPropertyPriority(name)
      )
        element.style.setProperty(name, value);
      entry.owned = element.style.getPropertyValue(name);
    },
    restore() {
      for (const [name, entry] of values) {
        if (
          element.style.getPropertyValue(name) !== entry.owned ||
          element.style.getPropertyPriority(name)
        )
          continue;
        if (entry.value)
          element.style.setProperty(name, entry.value, entry.priority);
        else element.style.removeProperty(name);
      }
      values.clear();
    },
  };
}

/**
 * Bind natural-height direct children to a row-span CSS grid without moving DOM or focus.
 * Call refresh after host changes when ResizeObserver/MutationObserver are unavailable.
 * Host owns card content, margins, wide-column spans, loading and render-window lifecycles.
 * dispose restores owned styles but never removes the container or its children.
 */
export function bindMasonryLayout(element, options = {}) {
  const settings = geometry(options);
  const view = element?.ownerDocument?.defaultView;
  if (
    element?.nodeType !== 1 ||
    !element?.style ||
    !view?.requestAnimationFrame
  )
    throw new TypeError(
      "Masonry requires an HTMLElement in a browser document",
    );
  if (bindings.has(element))
    throw new Error("Masonry container is already bound");
  bindings.add(element);
  let current = settings,
    frame = 0,
    disposed = false,
    width = -1;
  const rootStyles = ownStyles(element),
    cards = new Map();
  const hadClass = element.classList.contains("ag-masonry-layout");
  element.classList.add("ag-masonry-layout");

  /** Collapse resize, image and mutation events into one frame, with no idle loop. */
  function refresh() {
    if (!disposed && !frame) frame = view.requestAnimationFrame(measure);
  }

  /** Observe new direct children and release removed cards during reconciliation. */
  function reconcile() {
    for (const [card, styles] of cards) {
      if (card.parentElement === element) continue;
      resize?.unobserve(card);
      styles.restore();
      cards.delete(card);
    }
    for (const card of element.children) {
      if (cards.has(card) || !card.style) continue;
      const styles = ownStyles(card);
      styles.set("align-self", "start");
      cards.set(card, styles);
      // Spans use border-box height, so padding/border-only changes also invalidate it.
      resize?.observe(card, { box: "border-box" });
    }
  }

  /** Read all natural heights before writing spans to avoid per-card layout thrashing. */
  function measure() {
    frame = 0;
    if (disposed) return;
    reconcile();
    if (!element.isConnected || element.getBoundingClientRect().width === 0)
      return;
    const measurements = [];
    for (const [card, styles] of cards) {
      const height = card.getBoundingClientRect().height;
      const span = Math.max(
        1,
        Math.ceil((height + current.gap) / (current.rowHeight + current.gap)),
      );
      measurements.push({ styles, span });
    }
    for (const { styles, span } of measurements)
      styles.set("grid-row-end", `span ${span}`);
  }

  /** Apply a validated patch without rebuilding cards or losing focus and preview state. */
  function update(patch = {}) {
    if (disposed) return;
    current = geometry(patch, current);
    const columns =
      current.columns === "auto"
        ? `repeat(auto-fill, minmax(min(${current.minColumnWidth}px, 100%), 1fr))`
        : `repeat(${current.columns}, minmax(0, 1fr))`;
    rootStyles.set("display", "grid");
    rootStyles.set("grid-template-columns", columns);
    rootStyles.set("grid-auto-rows", `${current.rowHeight}px`);
    rootStyles.set("grid-auto-flow", "row");
    rootStyles.set("row-gap", `${current.gap}px`);
    rootStyles.set("column-gap", `${current.gap}px`);
    rootStyles.set("align-items", "start");
    refresh();
  }

  // Grid height follows spans: responding to height alone would feed back into layout.
  const resize = view.ResizeObserver
    ? new view.ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target !== element) {
            refresh();
            continue;
          }
          if (entry.contentRect.width !== width) {
            width = entry.contentRect.width;
            refresh();
          }
        }
      })
    : null;
  const mutations = view.MutationObserver
    ? new view.MutationObserver(refresh)
    : null;
  resize?.observe(element);
  mutations?.observe(element, { childList: true });
  element.addEventListener("load", refresh, true);
  view.addEventListener("resize", refresh);
  update(settings);

  /** Stop all work and restore owned styles; repeated disposal is safe. */
  function dispose() {
    if (disposed) return;
    disposed = true;
    resize?.disconnect();
    mutations?.disconnect();
    view.cancelAnimationFrame(frame);
    frame = 0;
    element.removeEventListener("load", refresh, true);
    view.removeEventListener("resize", refresh);
    for (const styles of cards.values()) styles.restore();
    cards.clear();
    rootStyles.restore();
    if (!hadClass) element.classList.remove("ag-masonry-layout");
    bindings.delete(element);
  }
  return { element, refresh, update, dispose };
}

/** Create a grid from caller-owned Elements; native append/remove drive live changes. */
export function createMasonryLayout({
  document = globalThis.document,
  items = [],
  ...options
} = {}) {
  geometry(options);
  if (!document?.defaultView?.requestAnimationFrame)
    throw new TypeError("Masonry requires a browser document");
  if (!Array.isArray(items) || new Set(items).size !== items.length)
    throw new TypeError("Masonry items must be distinct Elements");
  for (const item of items) {
    if (item?.nodeType !== 1 || !item.style || item.ownerDocument !== document)
      throw new TypeError(
        "Masonry items must be Elements from the supplied document",
      );
  }
  const element = document.createElement("div");
  for (const item of items) element.append(item);
  const layout = bindMasonryLayout(element, options);
  return {
    ...layout,
    dispose() {
      layout.dispose();
      element.remove();
    },
  };
}

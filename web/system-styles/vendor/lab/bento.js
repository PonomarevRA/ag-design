// packages/components/bento-grid.js
var defaults = {
  columns: 4,
  minColumnWidth: 200,
  gap: 16,
  rowMinHeight: 140,
  alignItems: "stretch"
};
function settings(options, previous = defaults) {
  const value = { ...previous };
  for (const key of Object.keys(options)) {
    if (!["label", "items", ...Object.keys(defaults)].includes(key))
      throw new TypeError("Unknown Bento option: " + key);
    value[key] = options[key];
  }
  if (typeof value.label !== "string" || !value.label.trim() || value.label.length > 200)
    throw new TypeError("A nonempty Bento label is required");
  if (!["start", "stretch"].includes(value.alignItems))
    throw new TypeError("Bento alignItems must be start or stretch");
  for (const [key, min, max] of [
    ["columns", 1, 12],
    ["minColumnWidth", 80, 1600],
    ["gap", 0, 64],
    ["rowMinHeight", 0, 800]
  ])
    if (!Number.isFinite(value[key]) || value[key] < min || value[key] > max || key === "columns" && !Number.isInteger(value[key]))
      throw new RangeError("Invalid Bento " + key);
  return value;
}
function items(value, document, root) {
  if (!Array.isArray(value) || value.length > 64)
    throw new RangeError("Use at most64 Bento items");
  const ids = /* @__PURE__ */ new Set(), nodes = /* @__PURE__ */ new Set(), result = [];
  for (const item of value) {
    if (!item || typeof item.id !== "string" || !item.id || item.id.length > 80 || ids.has(item.id))
      throw new TypeError("Unique nonempty Bento IDs required");
    const content = item.content;
    if (content?.nodeType !== 1 || content.namespaceURI !== "http://www.w3.org/1999/xhtml" || content.ownerDocument !== document || nodes.has(content) || content === root || content.contains(root))
      throw new TypeError("Unique same-document HTML content required");
    const owner = content.parentElement?.closest(".ag-bento-grid");
    if (owner && owner !== root)
      throw new TypeError("Content belongs to another Bento grid");
    for (const other of nodes)
      if (other.contains(content) || content.contains(other))
        throw new TypeError("Bento items cannot contain one another");
    const colSpan = item.colSpan ?? 1, rowSpan = item.rowSpan ?? 1;
    if (!Number.isInteger(colSpan) || colSpan < 1 || colSpan > 12 || !Number.isInteger(rowSpan) || rowSpan < 1 || rowSpan > 6)
      throw new RangeError("Bento spans: columns1..12, rows1..6");
    ids.add(item.id);
    nodes.add(content);
    result.push({ id: item.id, content, colSpan, rowSpan });
  }
  return result;
}
function createBentoGrid({
  document = globalThis.document,
  ...options
} = {}) {
  const element = document.createElement("section");
  element.className = "ag-bento-grid";
  let state = settings(options), entries = items(state.items ?? [], document, element);
  state.items = entries;
  let disposed = false, columns = 1, observedWidth = 0;
  const wrappers = /* @__PURE__ */ new Map(), view = document.defaultView;
  function resize(width = element.getBoundingClientRect().width) {
    if (disposed) return;
    observedWidth = width;
    const next = Math.max(
      1,
      Math.min(
        state.columns,
        Math.floor((width + state.gap) / (state.minColumnWidth + state.gap))
      )
    );
    columns = next;
    element.style.setProperty("--ag-bento-columns", String(columns));
    element.style.setProperty("--ag-bento-gap", state.gap + "px");
    element.style.setProperty("--ag-bento-row-min", state.rowMinHeight + "px");
    element.style.gridAutoRows = columns === 1 ? "auto" : "";
    element.style.alignItems = state.alignItems;
    for (const item of entries) {
      const wrapper = wrappers.get(item.id);
      wrapper.style.gridColumn = "span " + Math.min(columns, item.colSpan);
      wrapper.style.gridRow = "span " + (columns === 1 ? 1 : item.rowSpan);
    }
  }
  function publish() {
    const focus = element.contains(document.activeElement) ? document.activeElement : null;
    const retained = /* @__PURE__ */ new Set();
    let cursor = element.firstElementChild;
    for (const item of entries) {
      retained.add(item.id);
      let wrapper = wrappers.get(item.id);
      if (!wrapper) {
        wrapper = document.createElement("div");
        wrapper.className = "ag-bento-grid__item";
        wrapper.dataset.bentoId = item.id;
        wrappers.set(item.id, wrapper);
      }
      if (wrapper.firstElementChild !== item.content)
        wrapper.replaceChildren(item.content);
      if (wrapper !== cursor) element.insertBefore(wrapper, cursor);
      cursor = wrapper.nextElementSibling;
    }
    for (const [id, wrapper] of wrappers)
      if (!retained.has(id)) {
        wrapper.remove();
        wrappers.delete(id);
      }
    element.setAttribute("aria-label", state.label);
    resize();
    if (focus?.isConnected && element.contains(focus) && document.activeElement !== focus)
      focus.focus({ preventScroll: true });
  }
  function update(patch = {}) {
    if (disposed) return false;
    const candidate = settings(patch, state);
    const nextEntries = items(candidate.items ?? [], document, element);
    candidate.items = nextEntries;
    state = candidate;
    entries = nextEntries;
    publish();
    return true;
  }
  publish();
  const observer = view.ResizeObserver ? new view.ResizeObserver((changes) => {
    for (const change of changes)
      if (change.target === element && Math.abs(change.contentRect.width - observedWidth) > 0.5)
        resize(change.contentRect.width);
  }) : null;
  observer?.observe(element);
  const refresh = () => resize();
  if (!observer) view.addEventListener("resize", refresh);
  return {
    element,
    update,
    refresh,
    /** Read local numeric bounds on demand, without recording card text or form values. */
    getLayout() {
      const box = element.getBoundingClientRect();
      return {
        disposed,
        columns,
        width: box.width,
        gap: state.gap,
        alignItems: state.alignItems,
        stale: Math.abs(box.width - observedWidth) > 1,
        items: entries.map((item) => {
          const rect = wrappers.get(item.id)?.getBoundingClientRect();
          return {
            id: item.id,
            colSpan: Math.min(columns, item.colSpan),
            rowSpan: columns === 1 ? 1 : item.rowSpan,
            x: rect ? rect.left - box.left : 0,
            y: rect ? rect.top - box.top : 0,
            width: rect?.width ?? 0,
            height: rect?.height ?? 0
          };
        })
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      observer?.disconnect();
      if (!observer) view.removeEventListener("resize", refresh);
      wrappers.clear();
      entries = [];
      state.items = [];
      element.remove();
    }
  };
}

// web/system-styles/demo-page-lifecycle.js
function disposeOnPageExit(window, dispose) {
  function release(event) {
    if (event.persisted) return;
    window.removeEventListener("pagehide", release);
    dispose();
  }
  window.addEventListener("pagehide", release);
  return () => window.removeEventListener("pagehide", release);
}

// web/system-styles/example-bento.js
var mounted = /* @__PURE__ */ new WeakMap();
var recipes = {
  "saas-clarity": {
    host: ".analytics-grid",
    label: "\u041E\u0442\u0447\u0451\u0442\u044B \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0430",
    columns: 3,
    minColumnWidth: 260,
    modules: [
      [".growth-panel", "growth", 2],
      [".segment-panel", "segments", 1],
      [".funnel-panel", "activation", 1],
      [".market-panel", "markets", 2],
      [".cohort-panel", "cohorts", 2],
      [".adoption-panel", "adoption", 1]
    ]
  },
  "learning-air": {
    host: ".learning-middle",
    label: "\u041A\u0443\u0440\u0441\u044B \u0438 \u0443\u0447\u0435\u0431\u043D\u0430\u044F \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C",
    alignItems: "start",
    columns: 2,
    minColumnWidth: 300,
    modules: [
      [".courses-panel", "courses", 2],
      [".heatmap-panel", "activity", 1],
      [".community-section", "community", 1]
    ]
  }
};
function mountExampleBento({
  document: doc = globalThis.document
} = {}) {
  const recipe = recipes[doc.documentElement.dataset.style];
  if (!recipe) return null;
  const host = doc.querySelector(recipe.host);
  if (!host) return null;
  if (mounted.has(host)) return mounted.get(host);
  const entries = recipe.modules.map(([selector, id, colSpan]) => {
    const content = doc.querySelector(selector);
    if (!content || content.parentElement !== host && content.previousElementSibling !== host)
      throw new TypeError(
        "Bento example module is absent or outside its authored overview: " + id
      );
    return { id, content, colSpan };
  });
  const original = entries.map(({ content }) => ({
    content,
    parent: content.parentNode,
    next: content.nextSibling
  }));
  const grid = createBentoGrid({
    document: doc,
    label: recipe.label,
    items: entries,
    columns: recipe.columns,
    minColumnWidth: recipe.minColumnWidth,
    gap: 24,
    rowMinHeight: 0,
    alignItems: recipe.alignItems ?? "stretch"
  });
  grid.element.classList.add("example-bento");
  host.classList.add("example-bento-host");
  host.append(grid.element);
  let disposed = false;
  const controller = {
    element: grid.element,
    getLayout: grid.getLayout,
    refresh: grid.refresh,
    /** Restore host-owned modules before releasing this layout; nested charts keep their own lifetime. */
    dispose() {
      if (disposed) return;
      disposed = true;
      detachExit();
      for (let i = original.length - 1; i >= 0; i--) {
        const { content, parent, next } = original[i];
        parent.insertBefore(content, next?.parentNode === parent ? next : null);
      }
      grid.dispose();
      host.classList.remove("example-bento-host");
      mounted.delete(host);
    }
  };
  const detachExit = disposeOnPageExit(doc.defaultView, controller.dispose);
  mounted.set(host, controller);
  return controller;
}
export {
  mountExampleBento
};

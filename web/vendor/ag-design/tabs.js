let sequence = 0;
const policies = new Set(["preserve", "destroy", "offscreen"]);

/** Host-owned tab panels with explicit retention: preserve drafts, destroy sensitive content, or retain canvas geometry offscreen. */
export function createTabs({
  document = globalThis.document,
  label,
  tabs,
  value,
  orientation = "horizontal",
  activation = "manual",
  onChange,
} = {}) {
  if (
    typeof label !== "string" ||
    !label.trim() ||
    label.length > 180 ||
    !Array.isArray(tabs) ||
    tabs.length < 1 ||
    tabs.length > 40 ||
    !["horizontal", "vertical"].includes(orientation) ||
    !["manual", "automatic"].includes(activation) ||
    (onChange !== undefined && typeof onChange !== "function")
  )
    throw new TypeError("A labelled bounded tabs contract is required");
  const records = new Map();
  for (const tab of tabs) {
    if (
      !tab ||
      typeof tab.id !== "string" ||
      !/^[A-Za-z0-9_.:-]{1,80}$/.test(tab.id) ||
      records.has(tab.id) ||
      typeof tab.label !== "string" ||
      !tab.label.trim() ||
      tab.label.length > 180 ||
      (tab.disabled !== undefined && typeof tab.disabled !== "boolean") ||
      typeof tab.mount !== "function" ||
      !policies.has(tab.lifecycle ?? "preserve")
    )
      throw new TypeError(
        "Tabs need distinct IDs, labels, lifecycle and mount functions",
      );
    records.set(tab.id, {
      ...tab,
      lifecycle: tab.lifecycle ?? "preserve",
      mounted: null,
    });
  }
  let current =
      value === undefined ? tabs.find((tab) => !tab.disabled)?.id : value,
    disposed = false;
  if (!records.has(current) || records.get(current).disabled)
    throw new TypeError("Choose an enabled initial tab");
  const element = document.createElement("section"),
    tablist = document.createElement("div"),
    panels = document.createElement("div");
  element.className = "ag-tabs";
  element.dataset.orientation = orientation;
  tablist.className = "ag-tabs__list";
  tablist.setAttribute("role", "tablist");
  tablist.setAttribute("aria-label", label);
  tablist.setAttribute("aria-orientation", orientation);
  panels.className = "ag-tabs__panels";
  const prefix = `ag-tabs-${++sequence}`;
  for (const [id, record] of records) {
    const button = document.createElement("button"),
      panel = document.createElement("section");
    button.type = "button";
    button.id = `${prefix}-tab-${id}`;
    button.className = "ag-tabs__tab";
    button.textContent = record.label;
    button.dataset.tabId = id;
    button.disabled = !!record.disabled;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", `${prefix}-panel-${id}`);
    panel.id = `${prefix}-panel-${id}`;
    panel.className = "ag-tabs__panel";
    panel.tabIndex = 0;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", button.id);
    record.button = button;
    record.panel = panel;
    tablist.append(button);
    panels.append(panel);
  }
  element.append(tablist, panels);
  /** Mount before leaving the previous panel, so a rejected or throwing host factory does not discard its draft. */
  function ensureMounted(record) {
    if (record.mounted) return;
    const result = record.mount();
    const node = result?.nodeType === 1 ? result : result?.element;
    if (
      !node ||
      node.nodeType !== 1 ||
      node.ownerDocument !== document ||
      node.parentNode ||
      (result?.dispose !== undefined && typeof result.dispose !== "function")
    )
      throw new TypeError(
        "Tab mount must return one unparented same-document element",
      );
    record.mounted = {
      element: node,
      dispose: result?.nodeType === 1 ? null : result.dispose,
    };
    record.panel.append(node);
  }
  /** Hide inactive content without changing the lifecycle chosen by its owner. */
  function synchronize() {
    for (const [id, record] of records) {
      const active = id === current;
      record.button.tabIndex = active ? 0 : -1;
      record.button.setAttribute("aria-selected", String(active));
      record.panel.classList.toggle(
        "ag-tabs__panel--offscreen",
        !active && record.lifecycle === "offscreen",
      );
      record.panel.hidden = !active && record.lifecycle !== "offscreen";
      record.panel.setAttribute("aria-hidden", String(!active));
      record.panel.inert = !active;
      if (active) record.panel.removeAttribute("inert");
      else record.panel.setAttribute("inert", "");
      record.panel.tabIndex = active ? 0 : -1;
    }
  }
  /** Change the selected panel silently by default; keyboard/user activation opts into the host callback. */
  function setValue(next, { focus = false, emit = false } = {}) {
    if (disposed) return;
    const record = records.get(next);
    if (
      !record ||
      record.disabled ||
      typeof focus !== "boolean" ||
      typeof emit !== "boolean"
    )
      throw new TypeError("Choose an enabled known tab");
    if (next !== current) {
      ensureMounted(record);
      const previous = records.get(current);
      const moveFocus =
        focus || previous.panel.contains(document.activeElement);
      current = next;
      synchronize();
      if (previous.lifecycle === "destroy" && previous.mounted) {
        const old = previous.mounted;
        previous.mounted = null;
        previous.panel.replaceChildren();
        old.dispose?.();
      }
      if (moveFocus) record.button.focus();
      if (emit) onChange?.(next);
    } else if (focus) record.button.focus();
  }
  function clicked(event) {
    const button = event.target.closest?.("[data-tab-id]");
    if (button && tablist.contains(button))
      setValue(button.dataset.tabId, { emit: true });
  }
  /** Roving arrows skip disabled tabs; horizontal widgets leave vertical scrolling keys to the browser. */
  function keydown(event) {
    const button = event.target.closest?.("[data-tab-id]");
    if (
      !button ||
      !tablist.contains(button) ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const enabled = [...records.values()].filter((record) => !record.disabled),
      index = enabled.findIndex((record) => record.button === button);
    const direction = document.defaultView.getComputedStyle(tablist).direction;
    const rtl =
      direction === "rtl" ||
      (direction !== "ltr" && tablist.closest("[dir]")?.dir === "rtl");
    let offset = 0,
      target;
    if (orientation === "horizontal") {
      if (event.key === "ArrowRight") offset = rtl ? -1 : 1;
      if (event.key === "ArrowLeft") offset = rtl ? 1 : -1;
    } else {
      if (event.key === "ArrowDown") offset = 1;
      if (event.key === "ArrowUp") offset = -1;
    }
    if (offset)
      target = enabled[(index + offset + enabled.length) % enabled.length];
    if (event.key === "Home") target = enabled[0];
    if (event.key === "End") target = enabled.at(-1);
    if (target) {
      event.preventDefault();
      event.stopPropagation();
      target.button.focus();
      if (activation === "automatic") setValue(target.id, { emit: true });
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      setValue(button.dataset.tabId, { emit: true });
    }
  }
  ensureMounted(records.get(current));
  synchronize();
  tablist.addEventListener("click", clicked);
  tablist.addEventListener("keydown", keydown);
  return {
    element,
    tablist,
    setValue,
    get value() {
      return current;
    },
    getPanel(id) {
      return records.get(id)?.panel ?? null;
    },
    /** Disabling the current tab selects another enabled panel, without emitting a user action. */
    setDisabled(id, disabled) {
      if (disposed) return;
      const record = records.get(id);
      if (!record || typeof disabled !== "boolean")
        throw new TypeError("Known tab and boolean disabled required");
      if (disabled && id === current) {
        const next = [...records.values()].find(
          (other) => other.id !== id && !other.disabled,
        );
        if (!next) throw new TypeError("At least one enabled tab must remain");
        const moveFocus =
          record.button === document.activeElement ||
          record.panel.contains(document.activeElement);
        setValue(next.id, { focus: moveFocus });
      }
      record.disabled = disabled;
      record.button.disabled = disabled;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      tablist.removeEventListener("click", clicked);
      tablist.removeEventListener("keydown", keydown);
      const errors = [];
      for (const record of records.values()) {
        const mounted = record.mounted;
        record.mounted = null;
        record.panel.replaceChildren();
        try {
          mounted?.dispose?.();
        } catch (error) {
          errors.push(error);
        }
      }
      records.clear();
      onChange = undefined;
      if (errors.length)
        throw new AggregateError(
          errors,
          "Tab content cleanup failed after all panels were released",
        );
    },
  };
}

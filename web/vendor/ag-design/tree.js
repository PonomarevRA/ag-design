let sequence = 0;
const MAX_NODES = 1000,
  MAX_DEPTH = 32;
const identifier = (value) =>
  typeof value === "string" && /^[A-Za-z0-9_.:-]{1,80}$/.test(value);

/** Validate a flat parent contract atomically, including every disconnected cycle and bounded action. */
function treeValue(nodes) {
  if (!Array.isArray(nodes) || nodes.length > MAX_NODES)
    throw new TypeError("At most 1000 tree nodes are supported");
  const byId = new Map(),
    children = new Map([[null, []]]);
  for (const source of nodes) {
    if (
      !source ||
      !identifier(source.id) ||
      byId.has(source.id) ||
      typeof source.label !== "string" ||
      !source.label.trim() ||
      source.label.length > 512 ||
      (source.disabled !== undefined && typeof source.disabled !== "boolean") ||
      (source.icon !== undefined &&
        (typeof source.icon !== "string" || source.icon.length > 20))
    )
      throw new TypeError("Nodes require unique IDs and bounded labels");
    const parentId = source.parentId ?? null;
    if (parentId !== null && !identifier(parentId))
      throw new TypeError("Parent IDs must be known opaque IDs");
    const actions = source.actions ?? [];
    if (!Array.isArray(actions) || actions.length > 4)
      throw new TypeError("At most four row actions are supported");
    const actionIds = new Set();
    for (const action of actions) {
      if (
        !action ||
        !identifier(action.id) ||
        actionIds.has(action.id) ||
        typeof action.label !== "string" ||
        !action.label.trim() ||
        action.label.length > 180 ||
        (action.icon !== undefined &&
          (typeof action.icon !== "string" || action.icon.length > 20)) ||
        (action.disabled !== undefined &&
          typeof action.disabled !== "boolean") ||
        (action.pressed !== undefined && typeof action.pressed !== "boolean") ||
        (action.onAction !== undefined && typeof action.onAction !== "function")
      )
        throw new TypeError(
          "Actions require unique IDs, labels and optional callbacks",
        );
      actionIds.add(action.id);
    }
    byId.set(source.id, {
      id: source.id,
      parentId,
      label: source.label,
      icon: source.icon || "",
      disabled: source.disabled === true,
      actions: actions.map((action) => ({ ...action })),
    });
    children.set(source.id, []);
  }
  for (const node of byId.values()) {
    if (node.parentId !== null && !byId.has(node.parentId))
      throw new TypeError("Tree parent is missing");
    children.get(node.parentId).push(node.id);
    const seen = new Set([node.id]);
    let parent = node.parentId,
      depth = 1;
    while (parent !== null) {
      if (seen.has(parent) || depth++ >= MAX_DEPTH)
        throw new TypeError("Tree cycles and depth above 32 are unsupported");
      seen.add(parent);
      parent = byId.get(parent)?.parentId ?? null;
    }
  }
  return { byId, children };
}

/** Single-select tree with explicit parentage and opt-in compact geometry.
 * Arrows move focus, Enter/Space select, and row actions never change selection; density changes presentation only.
 */
export function createTree({
  document = globalThis.document,
  label,
  density = "comfortable",
  nodes = [],
  selectedId = null,
  expandedIds = [],
  onSelect,
  onExpand,
} = {}) {
  if (typeof label !== "string" || !label.trim() || label.length > 180)
    throw new TypeError("Tree label is required");
  if (!["comfortable", "compact"].includes(density))
    throw new TypeError("Tree density must be comfortable or compact");
  for (const callback of [onSelect, onExpand])
    if (callback !== undefined && typeof callback !== "function")
      throw new TypeError("Callbacks must be functions");
  let model = treeValue(nodes),
    selected = null,
    expanded = new Set(),
    focused = null,
    disposed = false,
    prefix = "",
    prefixTimer = null;
  const abort = new document.defaultView.AbortController(),
    listeners = { signal: abort.signal };
  const element = document.createElement("ul");
  element.className = "ag-tree";
  element.dataset.agTreeDensity = density;
  element.setAttribute("role", "tree");
  element.setAttribute("aria-label", label);
  const instance = ++sequence;
  let items = new Map(),
    groups = new Map(),
    disclosures = new Map(),
    buttons = new Map();

  /** Walk declared children only; geometry and proximity never invent tree ancestry. */
  function visibleIds() {
    const result = [];
    function visit(parent) {
      for (const id of model.children.get(parent) || []) {
        if (!model.byId.get(id).disabled) result.push(id);
        if (expanded.has(id)) visit(id);
      }
    }
    visit(null);
    return result;
  }
  /** Choose a visible ancestor after a collapse, without selecting it or reopening a branch. */
  function visibleFocus(id, visible = visibleIds()) {
    let candidate = id;
    while (candidate && !visible.includes(candidate))
      candidate = model.byId.get(candidate)?.parentId;
    return candidate || visible[0] || null;
  }
  function validateSelection(id) {
    if (id !== null && (!model.byId.has(id) || model.byId.get(id).disabled))
      throw new TypeError("Select an enabled known node or null");
    return id;
  }
  function validateExpanded(ids) {
    if (!Array.isArray(ids) || ids.length > MAX_NODES)
      throw new TypeError("Expanded IDs must be a bounded list");
    const result = new Set();
    for (const id of ids) {
      if (
        !model.byId.has(id) ||
        !model.children.get(id).length ||
        result.has(id)
      )
        throw new TypeError("Expand distinct known parent nodes");
      result.add(id);
    }
    return result;
  }
  /** Update only attributes and visibility so focus and host row controls remain stable. */
  function update() {
    const visible = visibleIds();
    focused = visibleFocus(focused || selected, visible);
    for (const [id, item] of items) {
      const node = model.byId.get(id),
        hasChildren = model.children.get(id).length > 0;
      item.tabIndex = id === focused ? 0 : -1;
      item.setAttribute("aria-selected", String(id === selected));
      if (hasChildren)
        item.setAttribute("aria-expanded", String(expanded.has(id)));
      else item.removeAttribute("aria-expanded");
      if (groups.has(id)) groups.get(id).hidden = !expanded.has(id);
      if (disclosures.has(id)) {
        const button = disclosures.get(id);
        button.textContent = expanded.has(id) ? "⌄" : "›";
        button.setAttribute(
          "aria-label",
          `${expanded.has(id) ? "Свернуть" : "Развернуть"}: ${node.label}`,
        );
        button.setAttribute("aria-expanded", String(expanded.has(id)));
      }
      for (const button of buttons.get(id)?.values() || [])
        button.tabIndex =
          id === selected || item.contains(document.activeElement) ? 0 : -1;
    }
    element.tabIndex = visible.length ? -1 : 0;
  }
  function focus(id) {
    if (!id) return;
    focused = visibleFocus(id);
    update();
    items.get(focused)?.focus();
  }
  /** Construct semantic groups and independently named native actions; labels never include the action names. */
  function build() {
    const fragment = document.createDocumentFragment(),
      nextItems = new Map(),
      nextGroups = new Map(),
      nextDisclosures = new Map(),
      nextButtons = new Map();
    let serial = 0;
    function visit(parent, target, depth) {
      const children = model.children.get(parent) || [];
      for (let index = 0; index < children.length; index++) {
        const id = children[index],
          node = model.byId.get(id),
          item = document.createElement("li"),
          row = document.createElement("div"),
          title = document.createElement("span");
        item.setAttribute("role", "treeitem");
        item.dataset.treeNode = id;
        // Ellipsis is visual only; tooltip and linked DOM text retain the full literal name.
        item.title = node.label;
        item.setAttribute("aria-level", String(depth));
        item.setAttribute("aria-posinset", String(index + 1));
        item.setAttribute("aria-setsize", String(children.length));
        if (node.disabled) item.setAttribute("aria-disabled", "true");
        row.className = "ag-tree__row";
        title.className = "ag-tree__label";
        title.textContent = node.label;
        title.id = `ag-tree-${instance}-label-${++serial}`;
        item.setAttribute("aria-labelledby", title.id);
        if (model.children.get(id).length) {
          const disclosure = document.createElement("button");
          disclosure.type = "button";
          disclosure.className = "ag-tree__disclosure";
          disclosure.tabIndex = -1;
          disclosure.disabled = node.disabled;
          disclosure.dataset.treeDisclosure = id;
          row.append(disclosure);
          nextDisclosures.set(id, disclosure);
        } else {
          const spacer = document.createElement("span");
          spacer.className = "ag-tree__spacer";
          spacer.setAttribute("aria-hidden", "true");
          row.append(spacer);
        }
        const icon = document.createElement("span");
        icon.className = "ag-tree__icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = node.icon;
        row.append(icon, title);
        item.append(row);
        nextItems.set(id, item);
        const actionMap = new Map();
        {
          const actions = document.createElement("span");
          actions.className = "ag-tree__actions";
          for (const action of node.actions) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "ag-tree__action";
            button.dataset.treeAction = action.id;
            button.dataset.treeActionNode = id;
            button.setAttribute("aria-label", `${action.label}: ${node.label}`);
            button.title = action.label;
            button.textContent = action.icon || action.label;
            button.disabled =
              node.disabled || action.disabled === true || !action.onAction;
            if (action.pressed !== undefined)
              button.setAttribute("aria-pressed", String(action.pressed));
            actions.append(button);
            actionMap.set(action.id, button);
          }
          row.append(actions);
        }
        nextButtons.set(id, actionMap);
        if (model.children.get(id).length) {
          const group = document.createElement("ul");
          group.setAttribute("role", "group");
          group.id = `ag-tree-${instance}-group-${serial}`;
          nextGroups.set(id, group);
          nextDisclosures.get(id).setAttribute("aria-controls", group.id);
          visit(id, group, depth + 1);
          item.append(group);
        }
        target.append(item);
      }
    }
    const slots = Math.max(
      0,
      ...[...model.byId.values()].map((node) => node.actions.length),
    );
    element.style.setProperty("--ag-tree-action-slots", String(slots));
    visit(null, fragment, 1);
    element.replaceChildren(fragment);
    items = nextItems;
    groups = nextGroups;
    disclosures = nextDisclosures;
    buttons = nextButtons;
    update();
  }
  function select(id, emit = false) {
    const next = validateSelection(id),
      changed = next !== selected;
    selected = next;
    if (!element.contains(document.activeElement))
      focused = visibleFocus(selected);
    update();
    if (changed && emit) onSelect?.(selected);
  }
  function toggle(id) {
    const node = model.byId.get(id);
    if (!node || node.disabled || !model.children.get(id).length) return;
    if (expanded.has(id)) expanded.delete(id);
    else expanded.add(id);
    const hadFocus = element.contains(document.activeElement);
    update();
    if (hadFocus) items.get(focused)?.focus();
    onExpand?.([...expanded]);
  }
  /** Native row action buttons keep their activation keys; navigation handled by the tree never bubbles to a host canvas. */
  function keydown(event) {
    if (
      disposed ||
      event.target.closest(
        "button,input,textarea,select,a[href],[contenteditable=true]",
      )
    )
      return;
    const item = event.target.closest("[role=treeitem]"),
      id = item?.dataset.treeNode;
    if (!id || model.byId.get(id)?.disabled) return;
    const visible = visibleIds(),
      index = visible.indexOf(id);
    const direction = document.defaultView.getComputedStyle(element).direction;
    const rtl =
      direction === "rtl" ||
      (direction !== "ltr" && element.closest("[dir]")?.dir === "rtl");
    const openKey = rtl ? "ArrowLeft" : "ArrowRight",
      closeKey = rtl ? "ArrowRight" : "ArrowLeft";
    let handled = true;
    if (event.key === "ArrowDown")
      focus(visible[Math.min(visible.length - 1, index + 1)]);
    else if (event.key === "ArrowUp") focus(visible[Math.max(0, index - 1)]);
    else if (event.key === "Home") focus(visible[0]);
    else if (event.key === "End") focus(visible.at(-1));
    else if (event.key === openKey) {
      if (model.children.get(id).length && !expanded.has(id)) toggle(id);
      else if (expanded.has(id))
        focus(
          model.children
            .get(id)
            .find((child) => !model.byId.get(child).disabled),
        );
    } else if (event.key === closeKey) {
      if (expanded.has(id)) toggle(id);
      else focus(model.byId.get(id).parentId);
    } else if (event.key === "Enter" || event.key === " ") select(id, true);
    else if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      /[\p{L}\p{N}]/u.test(event.key)
    ) {
      clearTimeout(prefixTimer);
      prefix += event.key.toLocaleLowerCase();
      if ([...prefix].every((character) => character === prefix[0]))
        prefix = prefix[0];
      const ordered = [
        ...visible.slice(index + 1),
        ...visible.slice(0, index + 1),
      ];
      const match = ordered.find((candidate) =>
        model.byId.get(candidate).label.toLocaleLowerCase().startsWith(prefix),
      );
      if (match) focus(match);
      prefixTimer = setTimeout(() => {
        prefix = "";
      }, 700);
    } else handled = false;
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
  element.addEventListener("keydown", keydown, listeners);
  element.addEventListener(
    "focusin",
    (event) => {
      const id = event.target.closest("[data-tree-node]")?.dataset.treeNode;
      if (id && !model.byId.get(id)?.disabled) {
        focused = id;
        update();
      }
    },
    listeners,
  );
  element.addEventListener(
    "click",
    (event) => {
      if (disposed) return;
      const actionButton = event.target.closest("[data-tree-action]");
      if (actionButton && element.contains(actionButton)) {
        const node = model.byId.get(actionButton.dataset.treeActionNode),
          action = node?.actions.find(
            (value) => value.id === actionButton.dataset.treeAction,
          );
        if (action && !actionButton.disabled)
          action.onAction?.({ nodeId: node.id, actionId: action.id });
        return;
      }
      const disclosure = event.target.closest("[data-tree-disclosure]");
      if (disclosure && element.contains(disclosure)) {
        focus(disclosure.dataset.treeDisclosure);
        toggle(disclosure.dataset.treeDisclosure);
        return;
      }
      const id = event.target.closest("[data-tree-node]")?.dataset.treeNode;
      if (id && !model.byId.get(id)?.disabled) {
        focus(id);
        select(id, true);
      }
    },
    listeners,
  );
  /** Validate a complete replacement before mutation, then restore an existing node/action focus target. */
  function setNodes(value) {
    if (disposed) return;
    const next = treeValue(value),
      active = document.activeElement,
      activeItem = element.contains(active)
        ? active.closest("[data-tree-node]")?.dataset.treeNode
        : null;
    const activeAction = activeItem ? active.dataset.treeAction : null,
      lineage = [];
    let previous = activeItem || focused;
    while (previous) {
      lineage.push(previous);
      previous = model.byId.get(previous)?.parentId;
    }
    model = next;
    if (
      selected &&
      (!model.byId.has(selected) || model.byId.get(selected).disabled)
    )
      selected = null;
    expanded = new Set(
      [...expanded].filter((id) => model.children.get(id)?.length),
    );
    focused = visibleFocus(
      lineage.find(
        (id) => model.byId.has(id) && !model.byId.get(id).disabled,
      ) || selected,
    );
    build();
    if (activeItem || active === element) {
      const action = activeAction && buttons.get(focused)?.get(activeAction);
      (action && !action.disabled
        ? action
        : items.get(focused) || element
      ).focus();
    }
  }
  /** Apply host expansion silently; collapsing a focused descendant recovers its visible ancestor. */
  function setExpanded(ids) {
    if (disposed) return;
    const next = validateExpanded(ids),
      hadFocus = element.contains(document.activeElement);
    expanded = next;
    update();
    if (
      hadFocus &&
      !visibleIds().includes(
        document.activeElement.closest("[data-tree-node]")?.dataset.treeNode,
      )
    )
      (items.get(focused) || element).focus();
  }
  selected = validateSelection(selectedId);
  expanded = validateExpanded(expandedIds);
  focused = visibleFocus(selected);
  build();
  return {
    element,
    setNodes,
    setExpanded,
    setSelection: (id) => {
      if (!disposed) select(id);
    },
    get selectedId() {
      return selected;
    },
    get expandedIds() {
      return [...expanded];
    },
    dispose() {
      if (!disposed) {
        disposed = true;
        abort.abort();
        clearTimeout(prefixTimer);
        model.byId.clear();
        model.children.clear();
        items.clear();
        groups.clear();
        disclosures.clear();
        buttons.clear();
        element.replaceChildren();
        onSelect = undefined;
        onExpand = undefined;
      }
    },
  };
}

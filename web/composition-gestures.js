import { createLayoutDropPreview } from "./vendor/ag-design/layout-drop-preview.js";
import { applyCompositionLayout } from "./composition-renderer.js";

const EDGES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** Resize only the dragged axes; preserve automatic sizing on the other axis. */
export function gestureLayout(node, rect, edge, dx, dy, snap = 8) {
  const step = (value) => (snap ? Math.round(value / snap) * snap : value);
  const layout = node.layout;
  const next = {
    x: layout.x,
    y: layout.y,
  };
  if (!edge)
    return {
      x: clamp(step(layout.x + dx), -10000, 10000),
      y: clamp(step(layout.y + dy), -10000, 10000),
    };
  if (edge.includes("e") || edge.includes("w")) {
    next.width = clamp(
      step(rect.width + (edge.includes("w") ? -dx : dx)),
      Math.min(layout.maxWidth ?? 10000, Math.max(24, layout.minWidth || 0)),
      layout.maxWidth ?? 10000,
    );
    if (edge.includes("w")) next.x = layout.x + rect.width - next.width;
  }
  if (edge.includes("s") || edge.includes("n")) {
    next.height = clamp(
      step(rect.height + (edge.includes("n") ? -dy : dy)),
      Math.min(layout.maxHeight ?? 10000, Math.max(24, layout.minHeight || 0)),
      layout.maxHeight ?? 10000,
    );
    if (edge.includes("n")) next.y = layout.y + rect.height - next.height;
  }
  return next;
}

/** Resolve a physical insertion slot while keeping declared sibling order and RTL flow explicit. */
export function flowBeforeId(
  siblings,
  elements,
  mode,
  point,
  direction = "ltr",
  anchors,
) {
  for (const sibling of siblings) {
    const rect =
      anchors?.get(sibling.id) ??
      elements.get(sibling.id).getBoundingClientRect();
    const beforeX =
      direction === "rtl"
        ? point.x > rect.x + rect.width / 2
        : point.x < rect.x + rect.width / 2;
    if (mode === "row" && beforeX) return sibling.id;
    if (mode === "column" && point.y < rect.y + rect.height / 2)
      return sibling.id;
    if (
      mode === "grid" &&
      (point.y < rect.y || (point.y <= rect.y + rect.height && beforeX))
    )
      return sibling.id;
  }
  return null;
}

/**
 * Edit actual iframe wrappers in document CSS pixels. The outer camera is already
 * removed by browser event coordinates. One completed gesture emits one command;
 * cancellation restores paint without touching durable state or component values.
 */
export function bindCompositionGestures({
  root,
  model,
  elements,
  onSelect,
  onCommit,
  onUndo = () => {},
  onActivity = () => {},
}) {
  const view = root.ownerDocument.defaultView;
  const abort = new view.AbortController();
  const signal = abort.signal;
  const nodes = new Map(model.nodes.map((node) => [node.id, node]));
  let selectedId = null,
    enabled = true,
    blocked = false,
    gesture = null,
    chrome = null;

  /** Remove only editor-owned paint and restore the original renderer layout. */
  function cancel() {
    if (!gesture) return;
    const old = gesture;
    gesture = null;
    old.preview?.clear();
    applyCompositionLayout(old.element, old.node, old.parent);
    old.element.style.transform = old.transform;
    old.element.removeAttribute("data-composition-moving");
    try {
      root.releasePointerCapture?.(old.pointerId);
    } catch {
      /* Capture may already be lost. */
    }
    onActivity(false);
  }

  /** Chrome is absolute paint inside its owner; it cannot change flex/grid size or semantic content. */
  function paint() {
    chrome?.remove();
    chrome = null;
    for (const [id, element] of elements)
      element.toggleAttribute(
        "data-composition-edit-selected",
        enabled && id === selectedId,
      );
    const element = elements.get(selectedId);
    if (!enabled || blocked || !element) return;
    chrome = root.ownerDocument.createElement("div");
    chrome.className = "composition-edit-chrome";
    chrome.dataset.compositionEditorChrome = "true";
    chrome.setAttribute("aria-hidden", "true");
    const move = root.ownerDocument.createElement("span");
    move.dataset.compositionHandle = "move";
    move.className = "composition-move-handle";
    move.textContent = "⠿";
    move.title = "Переместить · стрелки, Shift — размер";
    chrome.append(move);
    for (const edge of EDGES) {
      const handle = root.ownerDocument.createElement("span");
      handle.dataset.compositionHandle = edge;
      handle.className = "composition-resize-handle";
      chrome.append(handle);
    }
    element.append(chrome);
  }

  /** Parent flow stays semantic: dragging in a row/column/grid changes sibling order only. */
  function move(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    event.preventDefault();
    const g = gesture;
    const dx = event.clientX + view.scrollX - g.x,
      dy = event.clientY + view.scrollY - g.y;
    if (Math.hypot(dx, dy) < 3 && !g.changed) return;
    g.changed = true;
    if (g.flow && !g.edge) {
      if (!g.preview) {
        g.preview = createLayoutDropPreview({
          items: g.peers.map((item) => elements.get(item.id)),
          source: g.element,
        });
      }
      g.beforeId = flowBeforeId(
        g.siblings,
        elements,
        g.parent.layout.mode,
        { x: event.clientX + view.scrollX, y: event.clientY + view.scrollY },
        model.viewport?.direction || "ltr",
        g.anchors,
      );
      g.preview.move(elements.get(g.beforeId) ?? null, dx, dy);
    } else {
      g.next = gestureLayout(
        g.node,
        g.rect,
        g.edge,
        dx,
        dy,
        event.altKey ? 0 : 8,
      );
      if (g.flow) {
        delete g.next.x;
        delete g.next.y;
      }
      applyCompositionLayout(
        g.element,
        { ...g.node, layout: { ...g.node.layout, ...g.next } },
        g.parent,
      );
    }
    g.element.dataset.compositionMoving = "true";
  }

  /** Capture on the stable root, so scrolling and crossing native child controls cannot lose the gesture. */
  function start(event) {
    if (!enabled || blocked || gesture || event.button !== 0) return;
    const wrapper = event.target.closest("[data-composition-node]");
    if (!wrapper || !root.contains(wrapper)) return;
    const node = nodes.get(wrapper.dataset.compositionNode);
    if (!node) return;
    event.preventDefault();
    event.stopPropagation();
    root.focus({ preventScroll: true });
    const handle = event.target.closest("[data-composition-handle]")?.dataset
      .compositionHandle;
    selectedId = node.id;
    onSelect(node.id);
    paint();
    const parent = nodes.get(node.parentId),
      flow = parent && parent.layout.mode !== "free";
    const peers = model.nodes.filter((item) => item.parentId === node.parentId);
    const siblings = peers.filter((item) => item.id !== node.id);
    const edge = handle && handle !== "move" ? handle : null;
    const anchors = new Map();
    if (flow && !edge) {
      // Snap against the original slots. Measuring animated siblings here would
      // move the hit targets and make a stationary pointer flip between slots.
      for (const sibling of siblings) {
        const { x, y, width, height } = elements
          .get(sibling.id)
          .getBoundingClientRect();
        anchors.set(sibling.id, {
          x: x + view.scrollX,
          y: y + view.scrollY,
          width,
          height,
        });
      }
    }
    gesture = {
      node,
      parent,
      flow,
      element: wrapper,
      rect: wrapper.getBoundingClientRect(),
      edge,
      pointerId: event.pointerId,
      x: event.clientX + view.scrollX,
      y: event.clientY + view.scrollY,
      transform: wrapper.style.transform,
      changed: false,
      next: null,
      beforeId: null,
      peers,
      siblings,
      anchors,
    };
    root.setPointerCapture?.(event.pointerId);
    onActivity(true);
  }

  /** Restore transient paint before asking the owning CAS/history bus to publish a command. */
  function finish(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const g = gesture;
    let operations = [];
    if (g.changed) {
      if (g.flow && !g.edge) {
        const nextId = g.peers[g.peers.indexOf(g.node) + 1]?.id || null;
        if (nextId !== g.beforeId)
          operations = [{ op: "reorder", id: g.node.id, beforeId: g.beforeId }];
      } else if (g.next)
        operations = [
          { op: "update", id: g.node.id, changes: { layout: g.next } },
        ];
    }
    cancel();
    if (operations.length) onCommit(operations);
  }

  /** Keyboard movement stays local to the editor; native fields work normally in preview mode. */
  function key(event) {
    if (event.key === "Escape") {
      cancel();
      return;
    }
    if (
      enabled &&
      !blocked &&
      !gesture &&
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "z" &&
      !event.shiftKey
    ) {
      if (event.target.closest("input,select,textarea,[contenteditable=true]"))
        return;
      event.preventDefault();
      onUndo();
      return;
    }
    if (
      !enabled ||
      blocked ||
      gesture ||
      !selectedId ||
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    )
      return;
    if (event.target.closest("input,select,textarea,[contenteditable=true]"))
      return;
    const node = nodes.get(selectedId),
      parent = nodes.get(node.parentId);
    if (parent && parent.layout.mode !== "free" && !event.shiftKey) {
      const siblings = model.nodes.filter(
        (item) => item.parentId === node.parentId,
      );
      const position = siblings.indexOf(node);
      const rtl = model.viewport?.direction === "rtl";
      const forward =
        event.key === "ArrowDown" ||
        event.key === (rtl ? "ArrowLeft" : "ArrowRight");
      const target = position + (forward ? 1 : -1);
      event.preventDefault();
      if (target >= 0 && target < siblings.length)
        onCommit([
          {
            op: "reorder",
            id: node.id,
            beforeId:
              siblings[forward ? position + 2 : position - 1]?.id || null,
          },
        ]);
      return;
    }
    event.preventDefault();
    const dx =
      event.key === "ArrowLeft" ? -8 : event.key === "ArrowRight" ? 8 : 0;
    const dy = event.key === "ArrowUp" ? -8 : event.key === "ArrowDown" ? 8 : 0;
    const layout = gestureLayout(
      node,
      elements.get(selectedId).getBoundingClientRect(),
      event.shiftKey ? "se" : null,
      dx,
      dy,
    );
    if (parent && parent.layout.mode !== "free") {
      delete layout.x;
      delete layout.y;
    }
    onCommit([{ op: "update", id: selectedId, changes: { layout } }]);
  }
  const originalTabindex = root.getAttribute("tabindex");
  root.tabIndex = 0;
  root.addEventListener("pointerdown", start, { capture: true, signal });
  root.addEventListener("pointermove", move, { signal });
  root.addEventListener("pointerup", finish, { signal });
  root.addEventListener("pointercancel", cancel, { signal });
  root.addEventListener("lostpointercapture", cancel, { signal });
  root.addEventListener("keydown", key, { signal });
  root.addEventListener(
    "click",
    (event) => {
      if (enabled) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    { capture: true, signal },
  );
  view.addEventListener("blur", cancel, { signal });
  return {
    get active() {
      return gesture !== null;
    },
    setState(state) {
      if (
        state.enabled !== enabled ||
        state.blocked !== blocked ||
        state.selectedId !== selectedId
      )
        cancel();
      enabled = state.enabled === true;
      blocked = state.blocked === true;
      selectedId = nodes.has(state.selectedId) ? state.selectedId : null;
      root.dataset.compositionEditing = String(enabled);
      paint();
    },
    /** Temporarily omit editor-owned chrome from a structural product snapshot. */
    detachChrome() {
      const held = chrome,
        parent = held?.parentElement;
      held?.remove();
      return () => {
        if (
          held &&
          chrome === held &&
          parent?.isConnected &&
          enabled &&
          !blocked &&
          !held.isConnected
        )
          parent.append(held);
      };
    },
    dispose() {
      cancel();
      abort.abort();
      chrome?.remove();
      for (const element of elements.values())
        element.removeAttribute("data-composition-edit-selected");
      delete root.dataset.compositionEditing;
      if (originalTabindex === null) root.removeAttribute("tabindex");
      else root.setAttribute("tabindex", originalTabindex);
    },
  };
}

import { COLS, ROW, intersects, resizeRect } from "./sandbox-model.js";

/** Pointer gestures preview locally and commit once; Escape, pointer cancellation and disposal roll back. */
export function bindSandboxGestures({
  root,
  canvas,
  viewport,
  separator,
  getItem,
  getItems,
  select,
  commit,
  widthChanged,
  onNotice,
}) {
  const view = root.ownerDocument.defaultView;
  const abort = new view.AbortController();
  const options = { signal: abort.signal };
  let gesture = null;
  /** Restore temporary styles first, then publish a single validated gesture command. */
  function finish(commitChange = false) {
    if (!gesture) return;
    const current = gesture;
    gesture = null;
    root.classList.remove("is-dragging");
    if (current.kind === "viewport") {
      viewport.style.width = `${commitChange ? current.width : current.before}px`;
      separator.setAttribute(
        "aria-valuenow",
        String(commitChange ? current.width : current.before),
      );
      if (commitChange) widthChanged(current.width);
    } else {
      current.tile.classList.remove("is-moving");
      current.placeholder.remove();
      place(current.tile, current.before);
      if (commitChange) {
        try {
          commit(current.id, current.next);
        } catch (error) {
          onNotice(error.message);
        }
      }
    }
  }
  /** Project document grid coordinates without persisting CSS or temporary pointer offsets. */
  function place(tile, item) {
    tile.style.gridColumn = `${item.x + 1} / span ${item.w}`;
    tile.style.gridRow = `${item.y + 1} / span ${item.h}`;
  }
  /** Movement is measured in document coordinates; horizontal scrolling does not change grid units. */
  function move(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    event.preventDefault();
    const current = gesture;
    if (current.kind === "viewport") {
      current.width = Math.round(
        Math.max(
          320,
          Math.min(1600, current.before + event.clientX - current.startX),
        ),
      );
      viewport.style.width = `${current.width}px`;
      separator.setAttribute("aria-valuenow", String(current.width));
      return;
    }
    const dx = Math.round((event.clientX - current.startX) / current.unit);
    const dy = Math.round((event.clientY - current.startY) / (ROW + 8));
    const next = { ...current.before };
    if (current.kind === "resize") {
      Object.assign(next, resizeRect(current.before, current.edge, dx, dy));
    } else {
      next.x = Math.max(0, Math.min(COLS - next.w, next.x + dx));
      next.y = Math.max(0, Math.min(300, next.y + dy));
    }
    current.next = { x: next.x, y: next.y, w: next.w, h: next.h };
    place(current.tile, next);
    place(current.placeholder, next);
    current.placeholder.dataset.blocked = String(
      current.others.some((item) => intersects(item, next)),
    );
  }
  /** Only explicit handles capture pointers; embedded component controls keep their native gestures. */
  function start(event) {
    if (event.button !== 0 || gesture) return;
    const handle = event.target.closest("[data-gesture]");
    if (!handle || root.dataset.preview === "true") return;
    const kind = handle.dataset.gesture;
    if (kind === "viewport") {
      const before = Math.round(viewport.getBoundingClientRect().width);
      gesture = {
        kind,
        before,
        width: before,
        startX: event.clientX,
        pointerId: event.pointerId,
      };
    } else {
      const tile = handle.closest("[data-item]"),
        id = tile.dataset.item;
      select(id);
      const before = getItem(id);
      const placeholder = root.ownerDocument.createElement("div");
      placeholder.className = "sandbox-placeholder";
      placeholder.setAttribute("aria-hidden", "true");
      canvas.append(placeholder);
      place(placeholder, before);
      tile.classList.add("is-moving");
      gesture = {
        kind,
        id,
        tile,
        placeholder,
        before,
        next: { x: before.x, y: before.y, w: before.w, h: before.h },
        edge: handle.dataset.edge || "se",
        others: getItems().filter((item) => item.id !== id),
        unit: (canvas.clientWidth - 48 + 8) / COLS,
        startX: event.clientX,
        startY: event.clientY,
        pointerId: event.pointerId,
      };
    }
    root.classList.add("is-dragging");
    handle.focus();
    handle.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }
  /** Arrow steps share pointer bounds; Escape cancels an active drag without entering history. */
  function key(event) {
    if (event.key === "Escape") {
      finish(false);
      return;
    }
    const handle = event.target.closest("[data-gesture]");
    if (!handle || root.dataset.preview === "true") return;
    const arrows = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (handle === separator) {
      let width = Math.round(viewport.getBoundingClientRect().width);
      if (event.key === "Home") width = 320;
      else if (event.key === "End") width = 1600;
      else if (arrows[event.key])
        width += arrows[event.key][0] * (event.shiftKey ? 64 : 16);
      else return;
      event.preventDefault();
      widthChanged(Math.max(320, Math.min(1600, width)));
      return;
    }
    const delta = arrows[event.key];
    if (!delta) return;
    event.preventDefault();
    const id = handle.closest("[data-item]").dataset.item,
      item = getItem(id);
    select(id);
    const patch =
      handle.dataset.gesture === "resize"
        ? resizeRect(item, handle.dataset.edge || "se", delta[0], delta[1])
        : {
            x: Math.max(0, Math.min(COLS - item.w, item.x + delta[0])),
            y: Math.max(0, Math.min(300, item.y + delta[1])),
          };
    try {
      commit(id, patch);
      onNotice("Положение или размер обновлены");
    } catch (error) {
      onNotice(error.message);
    }
  }
  root.addEventListener("pointerdown", start, options);
  view.addEventListener("pointermove", move, { ...options, passive: false });
  view.addEventListener(
    "pointerup",
    (event) => {
      if (gesture?.pointerId === event.pointerId) finish(true);
    },
    options,
  );
  view.addEventListener("pointercancel", () => finish(false), options);
  view.addEventListener("blur", () => finish(false), options);
  root.addEventListener("keydown", key, options);
  return () => {
    finish(false);
    abort.abort();
  };
}

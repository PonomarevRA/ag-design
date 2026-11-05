import { dragLanes, dragItem, dragCandidate } from "./drag-model.js";
import { dragVisual } from "./drag-visual.js";
let sequence = 0;
/** A local board with explicit drag handles, pointer capture and a complete keyboard alternative; persistence belongs to the host. */
export function createDragDrop({
  document = globalThis.document,
  lanes,
  mode = "move",
  onChange,
  canDrop,
} = {}) {
  if (!["move", "copy", "swap"].includes(mode))
    throw new TypeError("Unknown transfer mode");
  let state = dragLanes(lanes),
    disposed = false,
    grab = null,
    serial = 0;
  const view = document.defaultView,
    element = document.createElement("section");
  element.className = "ag-dnd";
  const instructions = document.createElement("p");
  instructions.className = "ag-dnd__instructions";
  instructions.id = "ag-dnd-help-" + ++sequence;
  instructions.textContent =
    "Пробел — взять; стрелки — выбрать место; Enter — перенести; Escape — отменить.";
  const board = document.createElement("div");
  board.className = "ag-dnd__lanes";
  const status = document.createElement("p");
  status.className = "ag-dnd__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  element.append(instructions, board, status);
  const visual = dragVisual({ document, element });
  /** Rebuild only board-owned text controls; stable identities restore focus after a committed transfer. */
  function render(focusId) {
    board.replaceChildren();
    for (const lane of state) {
      const column = document.createElement("section");
      column.className = "ag-dnd__lane";
      column.dataset.lane = lane.id;
      const heading = document.createElement("h3");
      heading.textContent = lane.label;
      column.append(heading);
      const list = document.createElement("ul");
      list.className = "ag-dnd__list";
      list.setAttribute("aria-label", lane.label);
      column.append(list);
      for (const item of lane.items) {
        const row = document.createElement("li");
        row.className = "ag-dnd__item";
        row.dataset.item = item.id;
        const handle = document.createElement("button");
        handle.type = "button";
        handle.className = "ag-dnd__handle";
        handle.textContent = "⠿";
        handle.dataset.item = item.id;
        handle.disabled = item.disabled;
        handle.setAttribute("aria-label", "Перенести: " + item.label);
        handle.setAttribute("aria-describedby", instructions.id);
        const text = document.createElement("span"),
          label = document.createElement("strong"),
          description = document.createElement("small");
        label.textContent = item.label;
        description.textContent = item.description;
        text.append(label, description);
        row.append(handle, text);
        list.append(row);
      }
      board.append(column);
    }
    if (focusId)
      for (const handle of board.querySelectorAll("button"))
        if (handle.dataset.item === focusId) handle.focus();
  }
  /** Release capture and every pending marker without changing the model; cancellation is reversible. */
  function cancel(message = "Перенос отменён", focus = false) {
    visual.clear();
    const previous = grab;
    grab = null;
    element.classList.remove("ag-dnd--dragging");
    for (const marker of board.querySelectorAll(
      "[data-drop],[data-grabbed],[data-drop-allowed]",
    )) {
      if (marker.closest(".ag-dnd") !== element) continue;
      marker.removeAttribute("data-drop");
      marker.removeAttribute("data-grabbed");
      marker.removeAttribute("data-drop-allowed");
    }
    if (previous?.pointerId !== undefined) {
      try {
        previous.handle.releasePointerCapture?.(previous.pointerId);
      } catch {
        /* Capture may already have been lost. */
      }
    }
    if (previous) {
      status.textContent = message;
      if (focus) previous.handle.focus();
    }
  }
  /** Apply a validated transaction and notify with cloned snapshots; consumer mutation cannot rewrite the live board. */
  function move({ itemId, toLane, index, mode: requested = mode }) {
    if (disposed) return false;
    let copyId;
    do {
      copyId = "ag-copy-" + sequence + "-" + ++serial;
    } while (dragItem(state, copyId));
    const result = dragCandidate(
      state,
      { itemId, toLane, index, mode: requested, copyId },
      canDrop,
    );
    if (!result) return false;
    cancel("", false);
    state = result.lanes;
    render(
      requested === "copy" || result.action.mode === "copy" ? copyId : itemId,
    );
    status.textContent =
      "Перенесено в «" + state.find((lane) => lane.id === toLane).label + "»";
    try {
      onChange?.(dragLanes(state), { ...result.action });
    } catch {
      status.textContent =
        "Данные изменены; обработчик приложения завершился с ошибкой.";
    }
    return true;
  }
  /** Keep target indexes bounded, including an empty destination and the slot after its last card. */
  function mark(lane, index) {
    if (!grab) return;
    grab.lane = lane;
    grab.index = Math.max(0, Math.min(index, state[lane].items.length));
    for (const marker of board.querySelectorAll(
      "[data-drop],[data-drop-allowed]",
    )) {
      if (marker.closest(".ag-dnd") !== element) continue;
      marker.removeAttribute("data-drop");
      marker.removeAttribute("data-drop-allowed");
    }
    const column = board.children[lane];
    column.dataset.drop = String(grab.index);
    const from = dragItem(state, grab.itemId);
    let allowed = Boolean(from);
    const transferMode = from && state[from.lane].copyOnly ? "copy" : mode;
    if (
      transferMode === "swap" &&
      (!state[lane].items[grab.index] || state[lane].items[grab.index].disabled)
    )
      allowed = false;
    if (allowed && canDrop) {
      try {
        allowed = Boolean(
          canDrop(
            {
              itemId: grab.itemId,
              fromLane: state[from.lane].id,
              toLane: state[lane].id,
              index: grab.index,
              mode: transferMode,
            },
            { ...from.item },
          ),
        );
      } catch {
        allowed = false;
      }
    }
    column.dataset.dropAllowed = String(allowed);
    grab.valid = allowed;
    visual.mark(column.querySelector(".ag-dnd__list"), grab.index, allowed);
    status.textContent =
      (allowed ? "" : "Недоступно: ") +
      "«" +
      state[lane].label +
      "», место " +
      (grab.index + 1);
  }
  /** Clear only this board's destination styling when a pointer leaves its owned drop area. */
  function clearTargets() {
    for (const marker of board.querySelectorAll(
      "[data-drop],[data-drop-allowed]",
    )) {
      if (marker.closest(".ag-dnd") !== element) continue;
      marker.removeAttribute("data-drop");
      marker.removeAttribute("data-drop-allowed");
    }
  }
  /** Resolve only this controller's handles so nested boards cannot start a second drag. */
  function handleFor(event) {
    const handle = event.target.closest?.(".ag-dnd__handle");
    return handle?.closest(".ag-dnd") === element ? handle : null;
  }
  /** Record the source identity and initial pointer location without moving data; keyboard pickup becomes active immediately. */
  function begin(handle, pointerId, x, y) {
    const from = dragItem(state, handle.dataset.item);
    if (!from || from.item.disabled) return;
    cancel("");
    grab = {
      itemId: from.item.id,
      lane: from.lane,
      index: from.index,
      handle,
      pointerId,
      x,
      y,
      active: pointerId === undefined,
    };
    if (grab.active) {
      handle.dataset.grabbed = "true";
      element.classList.add("ag-dnd--dragging");
      visual.start(handle.closest(".ag-dnd__item"));
      mark(from.lane, from.index);
    }
  }
  /** Space/Enter start and commit; arrows select slots and lanes while Escape leaves all data unchanged. */
  function key(event) {
    const handle = handleFor(event);
    if (!handle) return;
    if (!grab) {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        begin(handle);
      }
      return;
    }
    if (grab.pointerId !== undefined) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      cancel(undefined, true);
      return;
    }
    if ([" ", "Enter"].includes(event.key)) {
      event.preventDefault();
      const target = grab;
      try {
        if (
          !move({
            itemId: target.itemId,
            toLane: state[target.lane].id,
            index: target.index,
          })
        )
          cancel("Перенос недоступен", true);
      } catch {
        cancel("Перенос отклонён", true);
      }
      return;
    }
    if (
      ![
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    let lane = grab.lane,
      index = grab.index;
    switch (event.key) {
      case "ArrowLeft":
        lane--;
        break;
      case "ArrowRight":
        lane++;
        break;
      case "ArrowUp":
        index--;
        break;
      case "ArrowDown":
        index++;
        break;
      case "Home":
        index = 0;
        break;
      case "End":
        index = state[lane].items.length;
        break;
    }
    mark(Math.max(0, Math.min(state.length - 1, lane)), index);
  }
  /** Pointer capture keeps touch and mouse transfers local; only the handle disables touch scrolling. */
  function down(event) {
    const handle = handleFor(event);
    if (
      !handle ||
      handle.disabled ||
      event.button !== 0 ||
      event.isPrimary === false
    )
      return;
    begin(handle, event.pointerId, event.clientX, event.clientY);
    try {
      handle.setPointerCapture?.(event.pointerId);
    } catch {
      /* Synthetic input and older engines may not expose capture. */
    }
  }
  /** Activate after six pixels, resolve an owned lane and mark its nearest insertion slot; edge scrolling stays inside that list. */
  function pointer(event) {
    if (!grab || grab.pointerId !== event.pointerId) return;
    if (
      !grab.active &&
      Math.hypot(event.clientX - grab.x, event.clientY - grab.y) < 6
    )
      return;
    if (!grab.active)
      visual.start(grab.handle.closest(".ag-dnd__item"), {
        x: grab.x,
        y: grab.y,
        pointer: true,
      });
    grab.active = true;
    visual.move(event.clientX, event.clientY);
    event.preventDefault();
    element.classList.add("ag-dnd--dragging");
    grab.handle.dataset.grabbed = "true";
    const hit = document.elementFromPoint?.(event.clientX, event.clientY);
    if (hit?.closest(".ag-dnd") !== element) {
      grab.valid = false;
      visual.invalid();
      clearTargets();
      return;
    }
    const column = hit.closest(".ag-dnd__lane");
    if (!column) {
      grab.valid = false;
      visual.invalid();
      clearTargets();
      return;
    }
    const lane = state.findIndex((lane) => lane.id === column.dataset.lane);
    if (lane < 0) return;
    const list = column.querySelector(".ag-dnd__list"),
      rows = [...list.children].filter((row) =>
        row.classList.contains("ag-dnd__item"),
      );
    const slot = list.querySelector(".ag-dnd__placeholder");
    const slotRect = slot?.getBoundingClientRect();
    if (
      slotRect &&
      event.clientY >= slotRect.top &&
      event.clientY <= slotRect.bottom
    ) {
      mark(lane, grab.index);
      return;
    }
    let index = rows.length;
    for (let i = 0; i < rows.length; i++) {
      const rect = rows[i].getBoundingClientRect();
      if (event.clientY < rect.top + rect.height / 2) {
        index = i;
        break;
      }
    }
    const rect = list.getBoundingClientRect();
    if (event.clientY < rect.top + 28) list.scrollTop -= 18;
    else if (event.clientY > rect.bottom - 28) list.scrollTop += 18;
    mark(lane, index);
  }
  /** Commit only a captured, activated gesture over a valid owned destination; every other release cancels. */
  function up(event) {
    if (!grab || grab.pointerId !== event.pointerId) return;
    const target = grab;
    if (!target.active || !target.valid) {
      cancel("", false);
      return;
    }
    try {
      if (
        !move({
          itemId: target.itemId,
          toLane: state[target.lane].id,
          index: target.index,
        })
      )
        cancel("Перенос недоступен");
    } catch {
      cancel("Перенос отклонён");
    }
  }
  /** Losing pointer capture or receiving pointercancel abandons this gesture without mutating its source data. */
  function lost(event) {
    if (grab?.pointerId === event.pointerId) cancel();
  }
  /** Escape also cancels a captured pointer gesture when focus has moved outside its handle. */
  function escapePointer(event) {
    if (grab?.pointerId === undefined || event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    cancel(undefined, true);
  }
  /** Window focus loss cancels a pending drag so returning to the app cannot accidentally commit it. */
  const blur = () => cancel();
  document.addEventListener("keydown", escapePointer);
  element.addEventListener("keydown", key);
  element.addEventListener("pointerdown", down);
  element.addEventListener("pointermove", pointer);
  element.addEventListener("pointerup", up);
  element.addEventListener("pointercancel", lost);
  element.addEventListener("lostpointercapture", lost);
  view?.addEventListener("blur", blur);
  render();
  const controller = {
    element,
    move,
    get lanes() {
      return dragLanes(state);
    },
    update(next) {
      if (disposed) return false;
      const candidate = dragLanes(next);
      cancel();
      state = candidate;
      render();
      return true;
    },
    cancel,
    dispose() {
      if (disposed) return;
      cancel("");
      disposed = true;
      document.removeEventListener("keydown", escapePointer);
      element.removeEventListener("keydown", key);
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", pointer);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", lost);
      element.removeEventListener("lostpointercapture", lost);
      view?.removeEventListener("blur", blur);
      element.remove();
    },
  };
  return controller;
}

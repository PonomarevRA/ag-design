/** Drag the selected sample from the editor toolbar to the real preview viewport. */
export function bindCompositionInsertGesture({
  button,
  frame,
  stage,
  canStart,
  onDrop,
  signal,
}) {
  const document = button.ownerDocument;
  const view = document.defaultView;
  const marker = document.createElement("div");
  marker.className = "composition-insert-marker";
  marker.setAttribute("aria-hidden", "true");
  let gesture = null;
  let suppressClick = false;

  /** The preview may be scaled and clipped by the workspace; reject everything outside its visible surface. */
  function position(event) {
    if (document.elementFromPoint(event.clientX, event.clientY) !== frame)
      return null;
    const rect = frame.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const scale = rect.width / frame.offsetWidth;
    const localX = (event.clientX - rect.left) / scale;
    const localY = (event.clientY - rect.top) / scale;
    const scrollX = frame.contentWindow.scrollX;
    const scrollY = frame.contentWindow.scrollY;
    const x = Math.max(
      0,
      Math.min(frame.offsetWidth - 240, Math.round((localX + scrollX) / 8) * 8),
    );
    const y = Math.max(
      0,
      Math.min(10000, Math.round((localY + scrollY) / 8) * 8),
    );
    marker.style.left = `${(x - scrollX) * scale}px`;
    marker.style.top = `${(y - scrollY) * scale}px`;
    return { x, y };
  }

  /** Remove the marker and release capture before handing control back to the editor. */
  function clear() {
    if (!gesture) return;
    const { pointerId } = gesture;
    gesture = null;
    marker.remove();
    if (button.hasPointerCapture?.(pointerId))
      button.releasePointerCapture(pointerId);
  }

  button.addEventListener(
    "pointerdown",
    (event) => {
      if (gesture || event.button !== 0) return;
      suppressClick = false;
      const context = canStart();
      if (!context) return;
      gesture = {
        context,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
      button.setPointerCapture?.(event.pointerId);
    },
    { signal },
  );
  button.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerId !== gesture?.pointerId) return;
      if (
        !suppressClick &&
        Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 6
      )
        return;
      suppressClick = true;
      if (position(event)) stage.append(marker);
      else marker.remove();
    },
    { signal },
  );
  button.addEventListener(
    "pointerup",
    (event) => {
      if (event.pointerId !== gesture?.pointerId) return;
      const drop = suppressClick ? position(event) : null;
      const { context } = gesture;
      clear();
      if (drop) onDrop(context, drop);
    },
    { signal },
  );
  button.addEventListener(
    "click",
    (event) => {
      if (!suppressClick || !event.detail) return;
      suppressClick = false;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    { capture: true, signal },
  );
  for (const type of ["pointercancel", "lostpointercapture"])
    button.addEventListener(
      type,
      (event) => {
        if (event.pointerId === gesture?.pointerId) clear();
      },
      { signal },
    );
  view.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape" || !gesture) return;
      suppressClick = true;
      clear();
    },
    { signal },
  );
  view.addEventListener("blur", clear, { signal });
  signal.addEventListener("abort", clear, { once: true });
}

/**
 * Preview the insertion of a mounted flex/grid item. Pass direct, relatively
 * positioned siblings in document order. The host owns pointer capture, the
 * commit and keyboard alternatives. Temporary order and paint are reversible.
 */
export function createLayoutDropPreview({ items, source }) {
  const document = source.ownerDocument;
  const view = document.defaultView;
  const siblings = items.filter((item) => item !== source);
  const orders = items.map((item) => item.style.order);
  const transform = source.style.transform;
  const origin = documentRect(source, view);
  const slot = document.createElement("div");
  slot.className = "ag-layout-drop-slot";
  slot.setAttribute("aria-hidden", "true");
  source.append(slot);
  const animations = new Map();
  let destination = origin;
  let index = items.indexOf(source);
  let active = true;

  /** Reflow only on slot changes; pointer updates within a slot only move the lifted item. */
  function move(before, dx, dy) {
    if (!active) return;
    const nextIndex =
      before === null ? siblings.length : siblings.indexOf(before);
    if (nextIndex < 0) return;
    if (nextIndex !== index) {
      const next = siblings.slice();
      next.splice(nextIndex, 0, source);
      reflow(next);
      index = nextIndex;
    }
    const x = origin.x - destination.x + dx;
    const y = origin.y - destination.y + dy;
    source.style.transform = `translate(${x}px, ${y}px)`;
    slot.style.transform = `translate(${-x}px, ${-y}px)`;
  }

  /** Measure old paint and new layout separately so interrupted animations continue from the visible position. */
  function reflow(next) {
    const animate = view.matchMedia?.(
      "(prefers-reduced-motion: no-preference)",
    ).matches;
    const previous = new Map();
    if (animate) {
      for (const item of items)
        if (item !== source && item.animate)
          previous.set(item, documentRect(item, view));
    }
    for (const animation of animations.values()) animation.cancel();
    animations.clear();
    source.style.transform = "";
    for (const [position, item] of next.entries())
      item.style.order = String(position);
    destination = documentRect(source, view);
    const positions = [...previous].map(([item, from]) => [
      item,
      from,
      documentRect(item, view),
    ]);
    for (const [item, from, to] of positions) {
      const x = from.x - to.x,
        y = from.y - to.y;
      if (!x && !y) continue;
      animations.set(
        item,
        item.animate(
          [{ translate: `${x}px ${y}px` }, { translate: "0px 0px" }],
          { duration: 180, easing: "cubic-bezier(.2,.75,.3,1)" },
        ),
      );
    }
  }

  /** Restore exactly the captured inline order and transform. Safe after commit, cancellation or disposal. */
  function clear() {
    if (!active) return;
    active = false;
    for (const animation of animations.values()) animation.cancel();
    animations.clear();
    for (const [position, item] of items.entries())
      item.style.order = orders[position];
    source.style.transform = transform;
    slot.remove();
  }
  return { move, clear };
}

/** Window scroll changes client coordinates without changing document layout. */
function documentRect(item, view) {
  const { x, y } = item.getBoundingClientRect();
  return { x: x + view.scrollX, y: y + view.scrollY };
}

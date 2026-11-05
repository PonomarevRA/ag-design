/** Intersect supplied feed bounds, content viewport and optional header using viewport CSS pixels. */
export function feedRailBounds({ viewportHeight, bounds, content, headerBottom = 0 }) {
  const top = Math.max(8, bounds.top + 8, content.top + 8, headerBottom + 8);
  const bottom = Math.min(viewportHeight - 8, bounds.bottom - 8, content.bottom - 8);
  const height = Math.max(0, bottom - top);
  return { center: top + height / 2, height };
}

/** Resolve lazy host bounds after mounting; no product selector or document-wide content lookup is used. */
export function bindFeedRailPosition({ document, gutter, dock, boundsElement, scrollRoot = null, header = null, chrome = [], heightProperty = "--ag-feed-rail-height" }) {
  const view = document.defaultView;
  let frame = 0, disposed = false;
  const observed = new Set();
  const observer = view.ResizeObserver ? new view.ResizeObserver(schedule) : null;
  const resolveBounds = () => typeof boundsElement === "function" ? boundsElement() : boundsElement || gutter.parentElement;
  /** Restore hidden layout before reading controls, then fit the dock inside the actual visible feed. */
  function measure() {
    frame = 0;
    if (disposed || !gutter.isConnected) return;
    const bounds = resolveBounds();
    if (!bounds) return;
    for (const target of [bounds, scrollRoot, header, ...chrome]) {
      if (target && !observed.has(target)) { observer?.observe(target); observed.add(target); }
    }
    const visible = feedRailBounds({ viewportHeight: view.innerHeight, bounds: bounds.getBoundingClientRect(),
      content: scrollRoot?.getBoundingClientRect() || { top: 0, bottom: view.innerHeight },
      headerBottom: header?.getBoundingClientRect().bottom || 0 });
    if (visible.height < 24) { dock.hidden = true; return; }
    dock.hidden = false;
    let chromeHeight = Math.max(0, chrome.length - 1) * 8;
    for (const control of chrome) if (!control.hidden) chromeHeight += control.getBoundingClientRect().height;
    dock.hidden = visible.height < chromeHeight + 24;
    dock.style.top = `${visible.center}px`;
    dock.style.setProperty(heightProperty, `${Math.max(0, visible.height - chromeHeight)}px`);
  }
  /** Ignore navigation's own scroll and coalesce external changes into one cancellable frame. */
  function schedule(event) {
    if (event?.target?.nodeType && gutter.contains(event.target)) return;
    if (!disposed && !frame) frame = view.requestAnimationFrame(measure);
  }
  document.addEventListener("scroll", schedule, { capture: true, passive: true });
  view.addEventListener("scroll", schedule, { passive: true });
  view.addEventListener("resize", schedule);
  schedule();
  return () => {
    disposed = true;
    if (frame) view.cancelAnimationFrame(frame);
    observer?.disconnect(); observed.clear();
    document.removeEventListener("scroll", schedule, true);
    view.removeEventListener("scroll", schedule);
    view.removeEventListener("resize", schedule);
  };
}

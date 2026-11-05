/** Follow the whole item set, independently of the bounded range currently displayed by navigation. */
export function bindFeedRailTracker({ document, element, items, scrollRoot = null, boundsElement, header = null, onCurrent }) {
  const view = document.defaultView;
  let frame = 0, disposed = false;
  const observed = new Set();
  const observer = view.ResizeObserver ? new view.ResizeObserver(schedule) : null;
  /** Select the closest preceding section without assuming masonry DOM coordinates are monotonic. */
  function measure() {
    frame = 0;
    if (disposed || !element.isConnected) return;
    const bounds = boundsElement || element.parentElement;
    for (const target of [bounds, scrollRoot, header]) {
      if (target && !observed.has(target)) { observer?.observe(target); observed.add(target); }
    }
    const line = Math.max(0, scrollRoot?.getBoundingClientRect().top || 0, header?.getBoundingClientRect().bottom || 0) + 40;
    let index = 0, nearest = -Infinity;
    for (let i = 0; i < items.length; i++) {
      const top = items[i].target.getBoundingClientRect().top;
      if (top <= line && top > nearest) { index = i; nearest = top; }
    }
    onCurrent(index);
  }
  /** Native content scrolling may be nested; navigation's own list never feeds this tracker. */
  function schedule(event) {
    if (event?.target?.nodeType && element.contains(event.target)) return;
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

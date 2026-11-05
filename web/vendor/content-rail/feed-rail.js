import { createContentRail } from "./content-rail.js";
import { identities } from "./runtime.js";
import { createFeedRailProgress } from "./feed-rail-progress.js";
import { bindFeedRailPosition } from "./feed-rail-position.js";
import { bindFeedRailTracker } from "./feed-rail-tracker.js";

const RANGE_SIZE = 120;

/** Compose bounded navigation for up to10000 local item shells; the host owns data, layout and target content. */
export function createFeedRail({
  document = globalThis.document,
  items: supplied,
  scrollRoot = null,
  boundsElement = null,
  header = null,
  label = "Навигация по ленте",
  onSelect,
  onCurrentChange,
} = {}) {
  identities(supplied, 10000);
  if (typeof label !== "string" || !label.trim())
    throw new TypeError("A navigation label is required");
  for (const callback of [onSelect, onCurrentChange])
    if (callback !== undefined && typeof callback !== "function")
      throw new TypeError("Optional callbacks must be functions");
  for (const target of [scrollRoot, boundsElement, header])
    if (target && (target.ownerDocument !== document || target.nodeType !== 1))
      throw new TypeError("Local host elements required");
  for (const item of supplied) {
    if (item.bookmarked !== undefined && typeof item.bookmarked !== "boolean")
      throw new TypeError("Boolean bookmarked required");
    if (item.target?.ownerDocument !== document || item.target.nodeType !== 1)
      throw new TypeError("Local item targets required");
    for (const key of ["preview", "context"])
      if (item[key] !== undefined && typeof item[key] !== "string")
        throw new TypeError("Literal preview/context required");
  }
  const items = supplied.map((item) => ({ ...item }));
  const element = document.createElement("div");
  element.className = "ag-vt ag-vt-feed-rail";
  element.setAttribute("aria-label", label);
  if (!items.length)
    return {
      element,
      activeId: null,
      dispose() {
        element.remove();
      },
    };
  const view = document.defaultView,
    removers = [];
  const progress = createFeedRailProgress({ document, items });
  const range = document.createElement("select");
  range.className = "ag-vt-feed-rail__range";
  range.setAttribute("aria-label", "Диапазон элементов для перехода");
  range.hidden = items.length <= RANGE_SIZE;
  for (let start = 0; start < items.length; start += RANGE_SIZE) {
    const option = document.createElement("option");
    option.value = String(start);
    option.textContent = `${start + 1}–${Math.min(start + RANGE_SIZE, items.length)}`;
    range.append(option);
  }
  const dock = document.createElement("div"),
    before = document.createElement("div"),
    after = document.createElement("div"),
    mount = document.createElement("div");
  dock.className = "ag-vt-feed-rail__dock";
  dock.hidden = true;
  before.className = after.className = "ag-vt-feed-rail__controls";
  before.append(range, progress.up);
  after.append(progress.output, progress.down);
  dock.append(before, mount, after);
  element.append(dock);
  let rail = null,
    active = 0,
    start = 0,
    disposed = false,
    browsing = false,
    emphasisKey = "";

  /** Own every callback/event subscription, including the passive observer whose errors must not abort navigation. */
  function listen(target, type, fn, options) {
    target.addEventListener(type, fn, options);
    removers.push(() => target.removeEventListener(type, fn, options));
  }
  if (onCurrentChange)
    listen(element, "ag-feed-current-change", (event) =>
      onCurrentChange(event.detail),
    );
  /** A fallback preview may live outside the gutter; its controls still count as this navigation's focus. */
  function ownsFocus() {
    const previewId = rail?.element
      .querySelector(".ag-vt-rail__item")
      ?.getAttribute("aria-controls");
    return (
      element.contains(document.activeElement) ||
      Boolean(
        previewId &&
        document.getElementById(previewId)?.contains(document.activeElement),
      )
    );
  }
  /** Fade only the bounded range by whole-feed distance; current/hover/focus remain distinct and far markers never disappear. */
  function emphasize() {
    const nextKey = `${start}:${active}`;
    if (emphasisKey === nextKey) return;
    emphasisKey = nextKey;
    const markers = rail.element.querySelectorAll(".ag-vt-rail__item");
    for (let index = 0; index < markers.length; index++) {
      const distance = Math.abs(start + index - active);
      const opacity = Math.max(0.6, 1 - distance * 0.035);
      markers[index].style.setProperty(
        "--ag-feed-marker-opacity",
        opacity.toFixed(3),
      );
    }
  }
  /** Range browsing does not choose a content item and never publishes a fake current location. */
  function renderRange(nextStart) {
    progress.disconnect();
    rail?.dispose();
    start = nextStart;
    range.value = String(start);
    rail = createContentRail({
      document,
      items: items.slice(start, start + RANGE_SIZE),
      compact: true,
      trackScroll: false,
      label,
      onSelect(item) {
        browsing = false;
        const index = items.findIndex((value) => value.id === item.id);
        publishCurrent(index, false);
        onSelect?.(item);
      },
    });
    const preview = rail.element.querySelector(".ag-vt-rail-card");
    preview.setAttribute("aria-label", "Предпросмотр элемента");
    preview.querySelector(".ag-vt-rail-card__bookmark").hidden = true;
    mount.replaceChildren(rail.element);
    progress.connect(rail.element);
    emphasisKey = "";
    emphasize();
    rail.setCurrent(
      active >= start && active < start + RANGE_SIZE ? active - start : null,
      { reveal: !browsing && !ownsFocus() },
    );
  }
  /** Keep global position authoritative while a focused or manually browsed range remains undisturbed. */
  function publishCurrent(index, allowRange = true) {
    if (disposed) return;
    const changed = element.dataset.activeId !== items[index].id;
    active = index;
    element.dataset.activeId = items[index].id;
    const wantedStart = Math.floor(index / RANGE_SIZE) * RANGE_SIZE;
    if (allowRange && wantedStart !== start && !browsing && !ownsFocus())
      renderRange(wantedStart);
    else
      rail?.setCurrent(
        index >= start && index < start + RANGE_SIZE ? index - start : null,
        { reveal: !browsing && !ownsFocus() },
      );
    progress.setCurrent(items[index]);
    emphasize();
    if (changed && onCurrentChange)
      element.dispatchEvent(
        new view.CustomEvent("ag-feed-current-change", {
          detail: {
            id: items[index].id,
            label: items[index].label,
            index,
            total: items.length,
          },
        }),
      );
  }
  listen(progress.up, "click", () => {
    browsing = true;
  });
  listen(progress.down, "click", () => {
    browsing = true;
  });
  listen(range, "change", () => {
    browsing = true;
    renderRange(Number(range.value));
  });
  listen(element, "pointerenter", () => {
    browsing = true;
  });
  listen(element, "pointerleave", () => {
    if (!ownsFocus()) browsing = false;
  });
  listen(
    element,
    "wheel",
    () => {
      browsing = true;
    },
    { passive: true },
  );
  listen(
    element,
    "touchstart",
    () => {
      browsing = true;
    },
    { passive: true },
  );
  listen(document, "pointerdown", (event) => {
    if (!element.contains(event.target) && !ownsFocus()) browsing = false;
  });
  listen(document, "focusin", () => {
    if (!ownsFocus()) browsing = false;
  });
  renderRange(0);
  publishCurrent(0);
  const stopTracking = bindFeedRailTracker({
    document,
    element,
    items,
    scrollRoot,
    boundsElement,
    header,
    onCurrent: publishCurrent,
  });
  const stopPosition = bindFeedRailPosition({
    document,
    gutter: element,
    dock,
    boundsElement,
    scrollRoot,
    header,
    chrome: [before, after],
  });
  return {
    element,
    get activeId() {
      return items[active].id;
    },
    /** Release every range, global tracker, observer, portal and scheduled frame before removal. */
    dispose() {
      if (disposed) return;
      disposed = true;
      stopTracking();
      stopPosition();
      progress.dispose();
      rail?.dispose();
      for (const remove of removers) remove();
      rail = null;
      element.remove();
    },
  };
}

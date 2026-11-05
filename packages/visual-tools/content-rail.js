import { railPreview } from "./rail-preview.js";
import { node, identities } from "./runtime.js";

/** Navigate an explicit local set of sections with pointer/touch buttons, keyboard arrows and a scroll-synchronized active marker. */
export function createContentRail({
  document = globalThis.document,
  items,
  scrollRoot = null,
  label = "Оглавление",
  onSelect,
  onCurrentChange,
  trackScroll = true,
  compact = false,
  onBookmarkChange,
} = {}) {
  identities(items, 120);
  if (typeof compact !== "boolean" || typeof trackScroll !== "boolean")
    throw new TypeError("Boolean compact and optional callbacks required");
  for (const callback of [onSelect, onCurrentChange, onBookmarkChange])
    if (callback !== undefined && typeof callback !== "function")
      throw new TypeError("Boolean compact and optional callbacks required");
  for (const item of items) {
    for (const key of ["preview", "context"])
      if (item[key] !== undefined && typeof item[key] !== "string")
        throw new TypeError("Preview/context must be literal text");
    if (item.bookmarked !== undefined && typeof item.bookmarked !== "boolean")
      throw new TypeError("Boolean bookmarked required");
  }
  if (!items.length) throw new RangeError("At least one section required");
  const view = document.defaultView;
  for (const item of items)
    if (
      !item.target ||
      item.target.ownerDocument !== document ||
      item.target.nodeType !== 1
    )
      throw new TypeError(
        "Local section elements with scrollIntoView required",
      );
  if (scrollRoot && scrollRoot.ownerDocument !== document)
    throw new TypeError("Scroll root must belong to this document");
  const element = node(document, "nav", "ag-vt ag-vt-rail");
  element.setAttribute("aria-label", label);
  element.classList.toggle("ag-vt-rail--compact", Boolean(compact));
  const list = node(document, "ol"),
    readout = node(document, "output", "ag-vt-rail__preview");
  let active = 0,
    disposed = false,
    frame = 0,
    preview;
  const buttons = [],
    listeners = [],
    focusedTargets = new Map(),
    preference = view?.matchMedia?.("(prefers-reduced-motion: reduce)");
  if (onCurrentChange) {
    // EventTarget reports observer failures without interrupting construction or the user's navigation action.
    const notify = (event) => onCurrentChange(event.detail);
    element.addEventListener("ag-rail-current-change", notify);
    listeners.push(() => element.removeEventListener("ag-rail-current-change", notify));
  }
  /** Update aria-current without stealing focus when the user scrolls with another input method. */
  function mark(index, { reveal = true } = {}) {
    const changed = element.dataset.activeId !== items[index]?.id;
    active = index;
    if (index === null) delete element.dataset.activeId;
    else element.dataset.activeId = items[index].id;
    buttons.forEach((control, i) => {
      if (compact) control.tabIndex = i === active || (active === null && i === 0) ? 0 : -1;
      if (i === active) control.setAttribute("aria-current", "location");
      else control.removeAttribute("aria-current");
    });
    readout.textContent = items[index]?.label || "";
    const focused = document.activeElement;
    const previewId = buttons[0].getAttribute("aria-controls");
    const ownsFocus = element.contains(focused) || (previewId && document.getElementById(previewId)?.contains(focused));
    if (reveal && index !== null && compact && list.clientHeight > 0 && !ownsFocus) {
      // Scroll only the marker list. Calling scrollIntoView here could move the user's page or keyboard focus.
      const box = list.getBoundingClientRect();
      const marker = buttons[index].getBoundingClientRect();
      const delta = (marker.top + marker.bottom - box.top - box.bottom) / 2;
      list.scrollTop = Math.max(0, Math.min(list.scrollHeight - list.clientHeight, list.scrollTop + delta));
    }
    if (index !== null && changed && onCurrentChange) element.dispatchEvent(new view.CustomEvent("ag-rail-current-change", {
      detail: { id: items[index].id, label: items[index].label, index, total: items.length },
    }));
  }
  /** Scroll and focus the selected target; temporary tabindex is removed after blur and no original attributes are overwritten. */
  function select(index, { focusTarget = true } = {}) {
    if (
      disposed ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= items.length
    )
      return;
    mark(index);
    const target = items[index].target;
    target.scrollIntoView?.({
      behavior: preference?.matches ? "instant" : "smooth",
      block: "start",
    });
    if (focusTarget) {
      if (!target.hasAttribute("tabindex") && !focusedTargets.has(target)) {
        target.setAttribute("tabindex", "-1");
        const restore = () => {
          target.removeEventListener("blur", restore);
          if (target.getAttribute("tabindex") === "-1")
            target.removeAttribute("tabindex");
          focusedTargets.delete(target);
        };
        focusedTargets.set(target, restore);
        target.addEventListener("blur", restore, { once: true });
      }
      target.focus({ preventScroll: true });
    }
    onSelect?.({ id: items[index].id, label: items[index].label });
  }
  items.forEach((item, index) => {
    const row = node(document, "li"),
      control = node(document, "button", "ag-vt-rail__item");
    control.type = "button";
    const caption = node(
      document,
      "span",
      compact ? "ag-vt-rail__sr" : "",
      item.label,
    );
    control.append(caption);
    if (compact) {
      const tick = node(document, "span", "ag-vt-rail__tick");
      tick.setAttribute("aria-hidden", "true");
      control.append(tick);
    } else control.title = item.label;
    control.dataset.key = item.id;
    const id = item.target.id;
    if (id) control.setAttribute("aria-controls", id);
    const click = (event) => {
      if (compact && event.pointerType === "touch") {
        preview?.show(index);
        return;
      }
      preview?.hide();
      select(index);
    };
    const key = (event) => {
      let next = index;
      if (event.key === "ArrowDown" || event.key === "ArrowRight")
        next = Math.min(items.length - 1, index + 1);
      else if (event.key === "ArrowUp" || event.key === "ArrowLeft")
        next = Math.max(0, index - 1);
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = items.length - 1;
      else return;
      event.preventDefault();
      buttons[next].focus();
      select(next, { focusTarget: false });
    };
    control.addEventListener("click", click);
    control.addEventListener("keydown", key);
    listeners.push(() => {
      control.removeEventListener("click", click);
      control.removeEventListener("keydown", key);
    });
    buttons.push(control);
    row.append(control);
    list.append(row);
  });
  element.append(list, readout);
  if (compact) {
    readout.classList.add("ag-vt-rail__sr");
    preview = railPreview(
      document,
      element,
      items,
      buttons,
      select,
      onBookmarkChange,
    );
    const listScroll = () => preview.hide();
    list.addEventListener("scroll", listScroll);
    listeners.push(() => list.removeEventListener("scroll", listScroll));
  }
  mark(0);
  /** Sample the nearest visible section once per frame; avoid an unbounded animation or polling loop. */
  function measure() {
    frame = 0;
    if (disposed) return;
    const top = scrollRoot ? scrollRoot.getBoundingClientRect().top : 0;
    let index = 0;
    let nearest = -Infinity;
    for (let i = 0; i < items.length; i++) {
      const position = items[i].target.getBoundingClientRect().top;
      // Masonry columns do not guarantee monotonically increasing DOM coordinates.
      if (position <= top + 40 && position > nearest) {
        index = i;
        nearest = position;
      }
    }
    mark(index);
    preview?.position();
  }
  function scroll(event) {
    // Scrubbing this marker list is independent of scrolling the content it describes.
    if (event?.target?.nodeType && element.contains(event.target)) return;
    if (frame || disposed) return;
    if (view?.requestAnimationFrame)
      frame = view.requestAnimationFrame(measure);
    else measure();
  }
  const source = scrollRoot || view;
  if (trackScroll) source?.addEventListener("scroll", scroll, { passive: true });
  // Native shells may scroll a nested main element instead of window; scroll does not bubble.
  if (trackScroll) document.addEventListener("scroll", scroll, { capture: true, passive: true });
  if (trackScroll) view?.addEventListener("resize", scroll);
  return {
    element,
    select,
    /** Set a passive marker without navigation; null clears a range whose current item is elsewhere. */
    setCurrent(index, { reveal = true } = {}) {
      if (disposed || (index !== null && (!Number.isInteger(index) || index < 0 || index >= items.length))) return false;
      if (typeof reveal !== "boolean") return false;
      mark(index, { reveal });
      return true;
    },
    showPreview: (index) => preview?.show(index) ?? false,
    hidePreview: () => preview?.hide(),
    setBookmarked: (id, value) => preview?.setBookmarked(id, value) ?? false,
    get activeId() {
      return items[active]?.id ?? null;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (frame) view.cancelAnimationFrame(frame);
      preview?.dispose();
      source?.removeEventListener("scroll", scroll);
      document.removeEventListener("scroll", scroll, true);
      view?.removeEventListener("resize", scroll);
      for (const restore of focusedTargets.values()) restore();
      for (const remove of listeners) remove();
      element.remove();
    },
  };
}

/** Create a message tick rail with an interactive preview; the host owns section content and bookmark persistence. */
export function createConversationRail(options = {}) {
  return createContentRail({ ...options, compact: true });
}

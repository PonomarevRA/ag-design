import { node } from "./runtime.js";
let sequence = 0;
/** Own one literal nonmodal preview and one close timer; native popover escapes clipping, with a fixed-position portal fallback. */
export function railPreview(
  document,
  owner,
  items,
  buttons,
  navigate,
  onBookmarkChange,
) {
  const view = document.defaultView,
    card = node(document, "div", "ag-vt ag-vt-rail-card");
  const title = node(document, "button", "ag-vt-rail-card__title"),
    context = node(document, "p", "ag-vt-rail-card__context"),
    body = node(document, "p", "ag-vt-rail-card__body"),
    bookmark = node(document, "button", "ag-vt-rail-card__bookmark");
  const saved = new Set(
      items.filter((item) => item.bookmarked).map((item) => item.id),
    ),
    listeners = [];
  const id = "ag-rail-preview-" + ++sequence;
  card.id = id;
  card.hidden = true;
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-label", "Предпросмотр сообщения");
  title.type = bookmark.type = "button";
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(icon.namespaceURI, "path");
  path.setAttribute("d", "M7 3h10a2 2 0 0 1 2 2v16l-7-4-7 4V5a2 2 0 0 1 2-2Z");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1.6");
  icon.append(path);
  bookmark.append(icon);
  const header = node(document, "div", "ag-vt-rail-card__header");
  header.append(title, bookmark);
  card.append(header, context, body);
  owner.append(card);
  const native = typeof card.showPopover === "function";
  if (native) card.setAttribute("popover", "manual");
  let current = -1,
    timer = 0,
    disposed = false,
    restoring = false,
    observer;
  /** Register subscriptions that are always removed with this preview. */
  function listen(target, name, fn) {
    target.addEventListener(name, fn);
    listeners.push(() => target.removeEventListener(name, fn));
  }
  function cancelClose() {
    if (timer) view.clearTimeout(timer);
    timer = 0;
  }
  /** Synchronize only semantic tokens; a fallback portal must retain a profile set directly on the rail. */
  function palette() {
    if (current < 0) return;
    const style = view.getComputedStyle(owner);
    for (const token of [
      "surface",
      "surface-alt",
      "text",
      "muted",
      "border",
      "accent",
      "font",
    ]) {
      const value = style.getPropertyValue("--ag-" + token);
      if (value) card.style.setProperty("--ag-" + token, value);
    }
    card.style.fontFamily = style.fontFamily;
  }
  /** Fit beside the trigger using actual available space; vertical or hidden fallback never covers the originating marker. */
  function position() {
    if (current < 0 || disposed) return false;
    const rect = buttons[current].getBoundingClientRect();
    const width = view.innerWidth || 640, height = view.innerHeight || 480;
    const margin = 8, gap = 8, minimumWidth = 120, minimumHeight = 64;
    const right = width - margin - rect.right - gap, left = rect.left - margin - gap;
    let side = right >= minimumWidth ? "right" : left >= minimumWidth ? "left" : null;
    let availableHeight = height - margin * 2;
    if (!side) {
      const above = rect.top - margin - gap, below = height - margin - rect.bottom - gap;
      side = below >= above ? "below" : "above";
      availableHeight = Math.max(above, below);
    }
    if (width - margin * 2 < minimumWidth || availableHeight < minimumHeight) {
      hide({ restoreFocus: card.contains(document.activeElement) });
      return false;
    }
    const availableWidth = side === "right" ? right : side === "left" ? left : width - margin * 2;
    card.style.width = Math.min(360, availableWidth) + "px";
    card.style.maxHeight = availableHeight + "px";
    const measured = card.getBoundingClientRect();
    const boxWidth = measured.width || Number.parseFloat(card.style.width);
    const boxHeight = measured.height;
    if (boxWidth > availableWidth + 0.5 || boxHeight > availableHeight + 0.5) {
      // Host minimum-size overrides must not turn a bounded fallback into an overlapping popup.
      hide({ restoreFocus: card.contains(document.activeElement) });
      return false;
    }
    let x = rect.right + gap, y = rect.top - 12;
    if (side === "left") x = rect.left - gap - boxWidth;
    if (side === "below" || side === "above") {
      x = (rect.left + rect.right - boxWidth) / 2;
      y = side === "below" ? rect.bottom + gap : rect.top - gap - boxHeight;
    }
    card.style.left = Math.max(margin, Math.min(x, width - boxWidth - margin)) + "px";
    card.style.top = Math.max(margin, Math.min(y, height - boxHeight - margin)) + "px";
    return true;
  }
  /** Reflect an existing bookmark without mutating host data or sending a callback for a programmatic restore. */
  function setBookmarked(itemId, value) {
    if (disposed || typeof value !== "boolean") return false;
    const index = items.findIndex((item) => item.id === itemId);
    if (index < 0) return false;
    if (value) saved.add(itemId);
    else saved.delete(itemId);
    buttons[index].dataset.bookmarked = String(value);
    if (index === current) {
      bookmark.setAttribute("aria-pressed", String(value));
      bookmark.setAttribute(
        "aria-label",
        value ? "Убрать закладку" : "Добавить закладку",
      );
      bookmark.title = bookmark.getAttribute("aria-label");
    }
    return true;
  }
  /** Hide without moving focus on hover/outside click; Escape from the card explicitly restores its trigger. */
  function hide({ restoreFocus = false } = {}) {
    cancelClose();
    if (current < 0) return;
    const anchor = buttons[current];
    current = -1;
    anchor.setAttribute("aria-expanded", "false");
    if (native) card.hidePopover();
    card.hidden = true;
    if (restoreFocus) {
      restoring = true;
      anchor.focus();
      restoring = false;
    }
  }
  /** Fill bounded plain text, then show without stealing focus; preview content never becomes HTML or a remote resource. */
  function show(index) {
    if (
      disposed ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= items.length ||
      !buttons[index].isConnected
    )
      return false;
    cancelClose();
    if (current >= 0) buttons[current].setAttribute("aria-expanded", "false");
    current = index;
    const item = items[index];
    title.textContent = Array.from(item.label).slice(0, 160).join("");
    title.setAttribute("aria-label", "Перейти: " + title.textContent);
    context.textContent = Array.from(item.context || "")
      .slice(0, 240)
      .join("");
    context.hidden = !context.textContent;
    body.textContent = Array.from(item.preview || "")
      .slice(0, 1200)
      .join("");
    body.hidden = !body.textContent;
    setBookmarked(item.id, saved.has(item.id));
    buttons[index].setAttribute("aria-expanded", "true");
    if (!native && card.parentElement !== document.body)
      document.body.append(card);
    card.hidden = false;
    palette();
    if (native && !card.matches(":popover-open")) card.showPopover();
    return position();
  }
  /** A short exit grace lets the pointer cross the gap from its tick to the interactive card. */
  function deferClose() {
    cancelClose();
    timer = view.setTimeout(() => {
      timer = 0;
      if (
        !card.contains(document.activeElement) &&
        document.activeElement !== buttons[current]
      )
        hide();
    }, 160);
  }
  listen(title, "click", () => {
    const index = current;
    hide();
    if (index >= 0) navigate(index);
  });
  listen(bookmark, "click", () => {
    if (current < 0) return;
    const item = items[current],
      value = !saved.has(item.id);
    setBookmarked(item.id, value);
    onBookmarkChange?.({ id: item.id, bookmarked: value });
  });
  listen(card, "pointerenter", cancelClose);
  listen(card, "pointerleave", deferClose);
  listen(card, "keydown", (event) => {
    if (event.key === "Tab" && event.shiftKey && event.target === title) {
      event.preventDefault();
      buttons[current]?.focus();
    }
  });
  for (const [index, button] of buttons.entries()) {
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-controls", id);
    button.setAttribute("aria-expanded", "false");
    setBookmarked(items[index].id, saved.has(items[index].id));
    listen(button, "pointerenter", () => show(index));
    listen(button, "pointerleave", deferClose);
    listen(button, "focus", () => {
      if (!restoring) show(index);
    });
    listen(button, "keydown", (event) => {
      if (event.key === "Tab" && !event.shiftKey && current === index) {
        event.preventDefault();
        title.focus();
      }
    });
  }
  listen(document, "pointerdown", (event) => {
    if (!owner.contains(event.target) && !card.contains(event.target)) hide();
  });
  listen(document, "focusin", (event) => {
    if (!owner.contains(event.target) && !card.contains(event.target)) hide();
  });
  listen(document, "keydown", (event) => {
    if (event.key === "Escape" && current >= 0) {
      event.preventDefault();
      event.stopPropagation();
      hide({ restoreFocus: card.contains(document.activeElement) });
    }
  });
  if (view.MutationObserver) {
    observer = new view.MutationObserver(palette);
    for (let parent = owner; parent; parent = parent.parentElement)
      observer.observe(parent, {
        attributes: true,
        attributeFilter: ["style", "class", "data-theme", "data-palette"],
      });
  }
  return {
    show,
    hide,
    position,
    setBookmarked,
    dispose() {
      if (disposed) return;
      hide();
      disposed = true;
      observer?.disconnect();
      for (const remove of listeners) remove();
      card.remove();
      saved.clear();
    },
  };
}

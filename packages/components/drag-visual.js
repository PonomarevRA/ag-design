/** Own a literal pointer ghost and insertion placeholder; no data or interactive source nodes are cloned. */
export function dragVisual({ document, element }) {
  const view = document.defaultView;
  let ghost = null,
    placeholder = null,
    source = null,
    offset = { x: 0, y: 0 },
    height = 52;
  /** Remove all transient DOM and restore source visibility on drop, cancellation, update and disposal. */
  function clear() {
    ghost?.remove();
    placeholder?.remove();
    source?.removeAttribute("data-drag-source");
    ghost = placeholder = source = null;
  }
  /** Lift one owned row. A top-layer ghost preserves profile inheritance and escapes scroll clipping where supported. */
  function start(row, { x, y, pointer = false } = {}) {
    clear();
    source = row;
    source.dataset.dragSource = "true";
    const rect = row.getBoundingClientRect();
    height = Math.max(44, rect.height || 52);
    offset = { x: (x ?? rect.left) - rect.left, y: (y ?? rect.top) - rect.top };
    placeholder = document.createElement("li");
    placeholder.className = "ag-dnd__placeholder";
    placeholder.setAttribute("aria-hidden", "true");
    placeholder.style.minHeight = Math.min(180, height) + "px";
    placeholder.textContent = "Место вставки";
    if (!pointer) return;
    ghost = document.createElement("div");
    ghost.className = "ag-dnd__ghost";
    ghost.setAttribute("aria-hidden", "true");
    ghost.setAttribute("role", "presentation");
    const label = document.createElement("strong"),
      description = document.createElement("small");
    label.textContent = row.querySelector("strong")?.textContent || "";
    description.textContent = row.querySelector("small")?.textContent || "";
    ghost.append(label, description);
    ghost.style.width =
      Math.min(
        rect.width || 240,
        Math.max(100, (view?.innerWidth || 1024) - 24),
      ) + "px";
    element.append(ghost);
    if (typeof ghost.showPopover === "function") {
      ghost.setAttribute("popover", "manual");
      ghost.showPopover();
    } else {
      const style = view?.getComputedStyle(element);
      for (const name of [
        "text",
        "muted",
        "surface",
        "surface-alt",
        "border",
        "accent",
        "danger",
        "font",
      ]) {
        const value = style?.getPropertyValue("--ag-" + name);
        if (value) ghost.style.setProperty("--ag-" + name, value);
      }
      document.body.append(ghost);
    }
    move(x ?? rect.left, y ?? rect.top);
  }
  /** Keep the lifted card attached to the pointer; its non-interactive layer never obscures hit testing. */
  function move(x, y) {
    if (!ghost) return;
    const width = ghost.getBoundingClientRect().width || 240;
    ghost.style.left =
      Math.max(
        6,
        Math.min(x - offset.x, (view?.innerWidth || 1024) - width - 6),
      ) + "px";
    ghost.style.top =
      Math.max(
        6,
        Math.min(
          y - offset.y,
          (view?.innerHeight || 768) - Math.min(height, 180) - 6,
        ),
      ) + "px";
  }
  /** Place a visible slot before the model's insertion index; source rows remain in place until the transaction commits. */
  function mark(list, index, allowed = true) {
    if (!placeholder) return;
    placeholder.dataset.allowed = String(allowed);
    const rows = [...list.children].filter((row) =>
      row.classList.contains("ag-dnd__item"),
    );
    list.insertBefore(placeholder, rows[index] || null);
    if (ghost) ghost.dataset.allowed = String(allowed);
  }
  /** Crossing another board or an unowned area removes the insertion slot and clearly rejects the floating card. */
  function invalid() {
    placeholder?.remove();
    if (ghost) ghost.dataset.allowed = "false";
  }
  return { start, move, mark, invalid, clear };
}

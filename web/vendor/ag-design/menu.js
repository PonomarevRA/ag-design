import { applyControlGeometry } from "./geometry.js";
let sequence = 0;

/** Validate the whole replacement before closing an open menu; IDs are unique across at most two submenu levels. */
function menuItems(items) {
  const ids = new Set();
  let count = 0;
  function visit(rows, depth) {
    if (!Array.isArray(rows) || rows.length < 1 || depth > 2)
      throw new TypeError("A nonempty bounded menu is required");
    const result = [];
    for (const row of rows) {
      if (
        ++count > 200 ||
        !row ||
        typeof row.id !== "string" ||
        !/^[A-Za-z0-9_.:-]{1,80}$/.test(row.id) ||
        ids.has(row.id) ||
        typeof row.label !== "string" ||
        !row.label.trim() ||
        row.label.length > 180 ||
        (row.disabled !== undefined && typeof row.disabled !== "boolean") ||
        (row.checked !== undefined && typeof row.checked !== "boolean") ||
        (row.shortcut !== undefined &&
          (typeof row.shortcut !== "string" || row.shortcut.length > 80)) ||
        (row.group !== undefined &&
          (typeof row.group !== "string" ||
            !row.group.trim() ||
            row.group.length > 80)) ||
        (row.onSelect !== undefined && typeof row.onSelect !== "function") ||
        (row.children && row.checked !== undefined)
      ) {
        throw new TypeError(
          "Menu items need distinct bounded IDs, labels and valid states",
        );
      }
      ids.add(row.id);
      result.push({
        ...row,
        children:
          row.children === undefined ? null : visit(row.children, depth + 1),
      });
    }
    return result;
  }
  return visit(items, 0);
}

/** Command menu with literal labels and display-only shortcuts; the host owns actions and checked state. */
export function createMenu({
  document = globalThis.document,
  label,
  items,
  onAction,
  density = "compact",
} = {}) {
  if (
    typeof label !== "string" ||
    !label.trim() ||
    label.length > 180 ||
    (onAction !== undefined && typeof onAction !== "function")
  )
    throw new TypeError("A labelled command menu is required");
  let data = menuItems(items),
    disposed = false,
    opened = false,
    typeahead = "",
    typeTimer = null;
  const view = document.defaultView,
    prefix = `ag-menu-${++sequence}`;
  const element = document.createElement("span"),
    trigger = document.createElement("button");
  element.className = "ag-menu";
  trigger.className = "ag-menu__trigger";
  trigger.type = "button";
  trigger.id = `${prefix}-trigger`;
  trigger.textContent = label;
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");
  const restoreGeometry = applyControlGeometry(trigger, { density });
  element.append(trigger);
  let menus = [],
    records = new Map(),
    rootMenu;
  const rtl = () => {
    const direction = view.getComputedStyle(element).direction;
    return (
      direction === "rtl" ||
      (direction !== "ltr" && element.closest("[dir]")?.dir === "rtl")
    );
  };

  /** Build trusted DOM only, preserving input order and adding visual/semantic separators at group boundaries. */
  function build(rows, depth, parentItem = null) {
    const panel = document.createElement("div");
    panel.className = "ag-menu__popup";
    panel.id = `${prefix}-popup-${menus.length}`;
    panel.setAttribute("role", "menu");
    panel.setAttribute("aria-labelledby", parentItem?.button.id || trigger.id);
    panel.hidden = true;
    const menu = { panel, depth, parentItem, items: [] };
    menus.push(menu);
    let previousGroup;
    for (const item of rows) {
      if (menu.items.length && item.group !== previousGroup) {
        const separator = document.createElement("div");
        separator.className = "ag-menu__separator";
        separator.setAttribute("role", "separator");
        panel.append(separator);
      }
      previousGroup = item.group;
      const button = document.createElement("button"),
        content = document.createElement("span"),
        mark = document.createElement("span");
      button.type = "button";
      button.id = `${prefix}-item-${item.id}`;
      button.className = "ag-menu__item";
      button.dataset.menuItem = item.id;
      button.tabIndex = -1;
      button.setAttribute("aria-disabled", String(!!item.disabled));
      button.setAttribute(
        "role",
        item.checked === undefined ? "menuitem" : "menuitemcheckbox",
      );
      button.setAttribute("aria-label", item.label);
      if (item.checked !== undefined)
        button.setAttribute("aria-checked", String(item.checked));
      mark.className = "ag-menu__mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = item.checked ? "✓" : "";
      content.className = "ag-menu__label";
      content.textContent = item.label;
      button.append(mark, content);
      {
        const shortcut = document.createElement("span");
        shortcut.className = "ag-menu__shortcut";
        shortcut.textContent = item.shortcut || "";
        shortcut.setAttribute("aria-hidden", "true");
        button.append(shortcut);
      }
      const record = { data: item, button, menu, submenu: null };
      menu.items.push(record);
      records.set(item.id, record);
      panel.append(button);
      const arrow = document.createElement("span");
      arrow.className = "ag-menu__arrow";
      arrow.textContent = item.children ? "›" : "";
      arrow.setAttribute("aria-hidden", "true");
      button.append(arrow);
      if (item.children) {
        button.setAttribute("aria-haspopup", "menu");
        button.setAttribute("aria-expanded", "false");
        record.submenu = build(item.children, depth + 1, record);
        button.setAttribute("aria-controls", record.submenu.panel.id);
        panel.append(record.submenu.panel);
      }
    }
    return menu;
  }
  function render() {
    menus = [];
    records = new Map();
    rootMenu = build(data, 0);
    element.append(rootMenu.panel);
    trigger.setAttribute("aria-controls", rootMenu.panel.id);
  }
  render();
  /** Fit a fixed popup inside this browsing context; submenu placement follows direction and flips at a viewport edge. */
  function place(menu) {
    const anchor = (menu.parentItem?.button || trigger).getBoundingClientRect(),
      box = menu.panel.getBoundingClientRect();
    const width = Math.min(box.width || 240, Math.max(1, view.innerWidth - 16));
    const height = Math.min(
      box.height || menu.items.length * 36 + 12,
      Math.max(1, view.innerHeight - 16),
    );
    let left = rtl() ? anchor.right - width : anchor.left,
      top = anchor.bottom + 4;
    if (menu.parentItem) {
      left = rtl() ? anchor.left - width - 2 : anchor.right + 2;
      top = anchor.top;
      if (left < 8) left = anchor.right + 2;
      if (left + width > view.innerWidth - 8) left = anchor.left - width - 2;
    } else if (
      top + height > view.innerHeight - 8 &&
      anchor.top > view.innerHeight - anchor.bottom
    )
      top = anchor.top - height - 4;
    left = Math.max(8, Math.min(left, view.innerWidth - width - 8));
    top = Math.max(8, Math.min(top, view.innerHeight - height - 8));
    menu.panel.style.left = `${left}px`;
    menu.panel.style.top = `${top}px`;
    menu.panel.style.maxWidth = `${Math.max(1, view.innerWidth - 16)}px`;
    menu.panel.style.maxHeight = `${Math.max(1, view.innerHeight - 16)}px`;
  }
  function closeDeeper(depth) {
    for (const menu of menus)
      if (menu.depth > depth) {
        menu.panel.hidden = true;
        menu.parentItem.button.setAttribute("aria-expanded", "false");
      }
  }
  // Unavailable commands remain discoverable by arrow navigation, but can never be activated.
  function focusableItems(menu) {
    return menu.items;
  }
  function focusItem(record) {
    if (record) {
      closeDeeper(record.menu.depth);
      record.button.focus();
    }
  }
  /** Open only the addressed branch; finishing popup state precedes any host callback. */
  function openSubmenu(record, focus = true) {
    if (!record.submenu || record.data.disabled) return;
    closeDeeper(record.menu.depth);
    record.submenu.panel.hidden = false;
    record.button.setAttribute("aria-expanded", "true");
    place(record.submenu);
    if (focus) focusableItems(record.submenu)[0]?.button.focus();
  }
  function clearTypeahead() {
    typeahead = "";
    view.clearTimeout(typeTimer);
    typeTimer = null;
  }
  function open({ focus = "first" } = {}) {
    if (disposed) return;
    if (!["first", "last"].includes(focus))
      throw new TypeError("Choose first or last menu focus");
    opened = true;
    closeDeeper(0);
    rootMenu.panel.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    place(rootMenu);
    const choices = focusableItems(rootMenu);
    (focus === "last" ? choices.at(-1) : choices[0])?.button.focus();
  }
  function close({ restoreFocus = false } = {}) {
    if (!opened) return;
    opened = false;
    for (const menu of menus) menu.panel.hidden = true;
    for (const record of records.values())
      if (record.submenu) record.button.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-expanded", "false");
    clearTypeahead();
    if (restoreFocus && !disposed && trigger.isConnected) trigger.focus();
  }
  function activate(record) {
    if (!record || record.data.disabled || disposed) return;
    if (record.submenu) {
      openSubmenu(record);
      return;
    }
    const item = record.data;
    close({ restoreFocus: true });
    item.onSelect?.(item.id);
    onAction?.(item.id);
  }
  function clicked(event) {
    if (event.target === trigger) {
      opened ? close({ restoreFocus: true }) : open();
      return;
    }
    const button = event.target.closest?.("[data-menu-item]");
    if (button && element.contains(button))
      activate(records.get(button.dataset.menuItem));
  }
  function hovered(event) {
    if (!opened) return;
    const button = event.target.closest?.("[data-menu-item]"),
      record = button && records.get(button.dataset.menuItem);
    if (!record) return;
    if (record.data.disabled) {
      closeDeeper(record.menu.depth);
      return;
    }
    if (record.submenu) openSubmenu(record, false);
    else closeDeeper(record.menu.depth);
  }
  /** Consume menu navigation so the same key cannot move a host canvas or trigger another command. */
  function keydown(event) {
    if (disposed || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target === trigger) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        open({ focus: event.key === "ArrowUp" ? "last" : "first" });
      } else if (event.key === "Escape" && opened) {
        event.preventDefault();
        event.stopPropagation();
        close({ restoreFocus: true });
      }
      return;
    }
    const button = event.target.closest?.("[data-menu-item]"),
      record = button && records.get(button.dataset.menuItem);
    if (!opened || !record) return;
    const choices = focusableItems(record.menu),
      index = choices.indexOf(record);
    let consumed = true;
    if (event.key === "ArrowDown")
      focusItem(choices[(index + 1) % choices.length]);
    else if (event.key === "ArrowUp")
      focusItem(choices[(index - 1 + choices.length) % choices.length]);
    else if (event.key === "Home") focusItem(choices[0]);
    else if (event.key === "End") focusItem(choices.at(-1));
    else if (event.key === "Enter" || event.key === " ") activate(record);
    else if (event.key === (rtl() ? "ArrowLeft" : "ArrowRight")) {
      if (record.submenu) openSubmenu(record);
    } else if (
      event.key === (rtl() ? "ArrowRight" : "ArrowLeft") ||
      event.key === "Escape"
    ) {
      if (record.menu.parentItem) {
        const parent = record.menu.parentItem;
        closeDeeper(parent.menu.depth);
        parent.button.focus();
      } else if (event.key === "Escape") close({ restoreFocus: true });
    } else if (event.key === "Tab") {
      event.stopPropagation();
      close({ restoreFocus: true });
      return;
    } else if (event.key.length === 1 && /\S/u.test(event.key)) {
      typeahead += event.key.toLocaleLowerCase();
      view.clearTimeout(typeTimer);
      typeTimer = view.setTimeout(clearTypeahead, 700);
      const query = [...typeahead].every((letter) => letter === typeahead[0])
        ? typeahead[0]
        : typeahead;
      for (let offset = 1; offset <= choices.length; offset++) {
        const next = choices[(index + offset) % choices.length];
        if (next.data.label.toLocaleLowerCase().startsWith(query)) {
          focusItem(next);
          break;
        }
      }
    } else consumed = false;
    if (consumed) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
  function outside(event) {
    if (opened && !element.contains(event.target)) close();
  }
  function reposition() {
    if (opened) for (const menu of menus) if (!menu.panel.hidden) place(menu);
  }
  function blurred() {
    close();
  }
  element.addEventListener("click", clicked);
  element.addEventListener("keydown", keydown);
  element.addEventListener("pointerover", hovered);
  document.addEventListener("pointerdown", outside, true);
  document.addEventListener("focusin", outside);
  view.addEventListener("resize", reposition);
  view.addEventListener("scroll", reposition, true);
  view.addEventListener("blur", blurred);
  return {
    element,
    trigger,
    open,
    close,
    get isOpen() {
      return opened;
    },
    /** Replace controlled items atomically; focused old content is closed before being detached. */
    setItems(next) {
      if (disposed) return;
      const normalized = menuItems(next);
      close({ restoreFocus: true });
      rootMenu.panel.remove();
      data = normalized;
      render();
    },
    dispose() {
      if (disposed) return;
      close();
      disposed = true;
      clearTypeahead();
      restoreGeometry();
      element.removeEventListener("click", clicked);
      element.removeEventListener("keydown", keydown);
      element.removeEventListener("pointerover", hovered);
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("focusin", outside);
      view.removeEventListener("resize", reposition);
      view.removeEventListener("scroll", reposition, true);
      view.removeEventListener("blur", blurred);
      rootMenu.panel.remove();
      records.clear();
      menus = [];
      data = [];
      rootMenu = null;
      onAction = undefined;
    },
  };
}

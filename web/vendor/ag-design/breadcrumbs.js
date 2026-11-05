import { createButton } from "./primitives.js";

/** Show 1–8 real hierarchy positions, with a non-link current page and explicit parent URLs or callbacks. */
export function createBreadcrumbs({
  document = globalThis.document,
  label = "Путь раздела",
  items,
} = {}) {
  if (
    typeof label !== "string" ||
    !label.trim() ||
    !Array.isArray(items) ||
    !items.length ||
    items.length > 8
  )
    throw new TypeError(
      "A navigation label and 1–8 hierarchy items are required",
    );
  const prepared = [];
  for (const [index, item] of items.entries()) {
    if (!item || typeof item.label !== "string" || !item.label.trim())
      throw new TypeError("Breadcrumb labels are required");
    const current = index === items.length - 1;
    if (current && (item.href || item.onSelect))
      throw new TypeError("The current page must not navigate");
    if (!current && Boolean(item.href) === Boolean(item.onSelect))
      throw new TypeError("Parent items require one URL or callback");
    if (item.onSelect && typeof item.onSelect !== "function")
      throw new TypeError("onSelect must be a function");
    let href;
    if (item.href) {
      if (typeof item.href !== "string" || item.href.length > 2048)
        throw new TypeError("Bounded web URL required");
      const url = new URL(item.href, document.baseURI);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw new TypeError("Only web URLs without credentials are allowed");
      href = url.href;
    }
    prepared.push({
      ...item,
      href,
      current,
      label:
        item.label.length > 180 ? item.label.slice(0, 179) + "…" : item.label,
    });
  }
  const element = document.createElement("nav"),
    list = document.createElement("ol"),
    listeners = [];
  element.className = "ag-breadcrumbs";
  element.setAttribute("aria-label", label.slice(0, 180));
  let disposed = false;
  for (const [index, item] of prepared.entries()) {
    const row = document.createElement("li");
    if (index) {
      const divider = document.createElement("span");
      divider.className = "ag-breadcrumbs__divider";
      divider.setAttribute("aria-hidden", "true");
      divider.textContent = "/";
      row.append(divider);
    }
    let target;
    if (item.current) {
      target = document.createElement("span");
      target.textContent = item.label;
      target.setAttribute("aria-current", "page");
    } else if (item.href) {
      target = document.createElement("a");
      target.href = item.href;
      target.textContent = item.label;
    } else {
      target = createButton({ document, label: item.label, variant: "quiet" });
      const click = () => {
        if (!disposed) item.onSelect();
      };
      target.addEventListener("click", click);
      listeners.push([target, click]);
    }
    row.append(target);
    list.append(row);
  }
  element.append(list);
  /** Callback navigation is product-owned; disposal releases callbacks without changing the current hierarchy. */
  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const [target, click] of listeners)
      target.removeEventListener("click", click);
    listeners.length = 0;
  }
  return { element, dispose };
}

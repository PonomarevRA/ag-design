import { feedRailBounds, bindFeedRailPosition } from "./vendor/content-rail/feed-rail-position.js";
/** Retain the original host-facing geometry contract while the package owns the calculation. */
export function catalogRailBounds({ catalogue, ...options }) {
  return feedRailBounds({ ...options, bounds: catalogue });
}
/** Map existing catalogue host elements to the generic, selector-free position controller. */
export function bindCatalogRailPosition({ document, gutter, dock, range, chrome = [range] }) {
  return bindFeedRailPosition({ document, gutter, dock, chrome, heightProperty: "--catalog-rail-height",
    boundsElement: () => gutter.closest(".catalog-layout"), scrollRoot: gutter.closest("main"),
    header: document.querySelector(".titlebar") });
}

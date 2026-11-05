import { bindMasonryLayout } from "./vendor/ag-design/masonry-layout.js";

/** Catalogue uses public layout; render-window retains preview ownership. */
export function bindMasonry(grid) {
  return bindMasonryLayout(grid, { minColumnWidth: 290 }).dispose;
}

/** Fixed geometry keeps both DOM and provider work independent of logical dataset size. */
export const GRID_SCROLL_CAP = 5000000;
export const GRID_OVERSCAN_ROWS = 3;
export const GRID_OVERSCAN_COLUMNS = 1;
export function gridDimensions(viewport, height) {
  return { width: Math.max(160, viewport.clientWidth || 800), height: Math.max(80, viewport.clientHeight || height) };
}
/** Hidden/reordered/frozen columns form an ordered projection of the original schema. */
export function gridColumnLayout(columns, order, hidden, widths, availableWidth, responsive, frozenStart, protectedIds = []) {
  const sourceIndex = new Map(columns.map((column, index) => [column.id, index]));
  let visible = [];
  for (const id of order) {
    const column = columns[sourceIndex.get(id)];
    if (!hidden.get(id)) visible.push({ column, sourceIndex: sourceIndex.get(id), width: widths.get(id) });
  }
  const responsiveHidden = [];
  if (responsive && visible.length > 1) {
    let total = visible.reduce((sum, entry) => sum + entry.width, 0);
    const candidates = visible.filter((entry, index) => index >= frozenStart && entry.column.responsivePriority > 0 && !protectedIds.includes(entry.column.id));
    candidates.sort((a, b) => b.column.responsivePriority - a.column.responsivePriority);
    for (const candidate of candidates) {
      if (total <= availableWidth || visible.length < 2) break;
      visible = visible.filter(entry => entry !== candidate);
      responsiveHidden.push(candidate.column.id);
      total -= candidate.width;
    }
  }
  let left = 0;
  for (let index = 0; index < visible.length; index++) {
    const entry = visible[index];
    entry.left = left;
    entry.visibleIndex = index;
    // Narrow layouts progressively release frozen columns, leaving room to reach others.
    entry.frozen = index < frozenStart && left + entry.width <= Math.max(0, availableWidth - 64);
    left += entry.width;
  }
  return { entries: visible, totalWidth: left, responsiveHidden };
}
export function gridHeaderDepth(layout) {
  let depth = 1;
  for (const entry of layout.entries) depth = Math.max(depth, entry.column.group.length + 1);
  return depth;
}
/** Map browser's bounded scroll surface onto exact logical row positions. */
export function gridRowGeometry(rowCount, viewportHeight, headerHeight, rowHeight, scrollTop) {
  const visibleCount = Math.max(1, Math.ceil((viewportHeight - headerHeight) / rowHeight));
  const maximumRow = Math.max(0, rowCount - visibleCount);
  const surfaceHeight = Math.max(viewportHeight, Math.min(GRID_SCROLL_CAP, rowCount * rowHeight + headerHeight));
  const scrollMaximum = Math.max(0, surfaceHeight - viewportHeight);
  const logicalPosition = scrollMaximum ? Math.max(0, Math.min(maximumRow, scrollTop / scrollMaximum * maximumRow)) : 0;
  return { surfaceHeight, scrollMaximum, maximumRow, visibleCount, logicalPosition };
}
/** At most 128 rows/columns, additionally limited to 16,384 requested scalar cells. */
export function gridWindow({ mode, query, layout, rowCount, viewportWidth, viewportHeight, headerHeight, rowHeight, scrollTop, scrollLeft, utilityWidth, rowHeaderWidth = 0, revision }) {
  const geometry = gridRowGeometry(rowCount, viewportHeight, headerHeight, rowHeight, scrollTop);
  let y0 = mode === 'paged' ? Math.min(rowCount, query.page * query.pageSize) : Math.max(0, Math.floor(geometry.logicalPosition) - GRID_OVERSCAN_ROWS);
  let y1 = mode === 'paged' ? Math.min(rowCount, y0 + query.pageSize) : Math.min(rowCount, y0 + Math.min(128, geometry.visibleCount + 2 * GRID_OVERSCAN_ROWS));
  if (rowCount === 0) { y0 = 0; y1 = 0; }
  const entries = [];
  const left = Math.max(0, scrollLeft - utilityWidth - rowHeaderWidth);
  const right = scrollLeft + viewportWidth;
  let first = layout.entries.findIndex(entry => entry.left + entry.width >= left);
  if (first < 0) first = Math.max(0, layout.entries.length - 1);
  first = Math.max(0, first - GRID_OVERSCAN_COLUMNS);
  for (let index = 0; index < layout.entries.length; index++) {
    const entry = layout.entries[index];
    if (entry.frozen || mode === 'paged' || (index >= first && entry.left <= right + entry.width)) entries.push(entry);
    if (entries.length === 128) break;
  }
  if (entries.length * (y1 - y0) > 16384) y1 = y0 + Math.floor(16384 / Math.max(1, entries.length));
  const indices = entries.map(entry => entry.sourceIndex);
  return { request: Object.freeze({ x0: indices.length ? Math.min(...indices) : 0, x1: indices.length ? Math.max(...indices) + 1 : 0,
    y0, y1, columnIds: Object.freeze(entries.map(entry => entry.column.id)), columnIndices: Object.freeze(indices), query, revision }), entries, geometry };
}

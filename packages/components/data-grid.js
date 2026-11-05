import { GRID_LIMITS, gridText, gridInteger, gridScalar, validateColumns, validateQuery, validateSelection, validateWindow, freezeRow, selectedRow } from './data-grid-model.js';
import { createGridArrayDataSource, readDataGridTable } from './data-grid-source.js';
import { gridDimensions, gridColumnLayout, gridHeaderDepth, gridRowGeometry, gridWindow } from './data-grid-window.js';
import { createGridRenderer, gridElement, gridFormat, mountGridContent } from './data-grid-render.js';
import { createGridControls } from './data-grid-controls.js';
export { createGridArrayDataSource, readDataGridTable };
// A provider may ignore abort forever. These handlers retain only the detached token;
// releasing owner prevents stale host promises from retaining the grid/controller.
function deliverGridResult(token, value) { token.owner?.success(token, value); }
function deliverGridFailure(token, error) { token.owner?.failure(token, error); }
/** Offline grid: one identity model, one current viewport request, and bounded DOM in virtual mode. */
export function createDataGrid(options = {}) {
  options = { ...options }; // Own this shallow configuration; disposal never mutates the caller's object.
  const document = options.document ?? globalThis.document;
  if (!document?.createElement) throw new TypeError('document required');
  const window = document.defaultView;
  for (const key of ['onQueryChange', 'onSelectionChange', 'onEdit', 'onAction', 'onColumnChange', 'onRowDetailsChange', 'rowDetails']) if (options[key] !== undefined && typeof options[key] !== 'function') throw new TypeError(key);
  if (options.density !== undefined && !['compact', 'comfortable', 'touch'].includes(options.density)) throw new TypeError('density');
  if (options.loading !== undefined && !['eager', 'lazy'].includes(options.loading)) throw new TypeError('loading');
  if (options.persistence && (typeof options.persistence.save !== 'function' || (options.persistence.load !== undefined && typeof options.persistence.load !== 'function'))) throw new TypeError('persistence');
  for (const key of ['searchDelay', 'filterDelay']) if (options[key] !== undefined) gridInteger(options[key], 0, 5000, key);
  if (options.pageSizes !== undefined) { if (!Array.isArray(options.pageSizes) || !options.pageSizes.length || options.pageSizes.length > 20) throw new TypeError('pageSizes'); for (const value of options.pageSizes) gridInteger(value, 1, 500, 'pageSize'); }
  if (options.labels !== undefined) { if (!options.labels || typeof options.labels !== 'object' || Object.keys(options.labels).length > 64) throw new TypeError('labels'); for (const value of Object.values(options.labels)) gridText(value, 'label', 512); }
  const label = gridText(options.label, 'label', 512);
  if (!label) throw new TypeError('label required');
  const mode = options.mode ?? 'virtual';
  if (!['virtual', 'paged'].includes(mode)) throw new TypeError('mode');
  const minimumRowHeight = gridInteger(options.rowHeight ?? (options.density === 'touch' ? 48 : options.density === 'comfortable' ? 40 : 36), 24, 160, 'rowHeight');
  let rowHeight = Math.max(minimumRowHeight, options.density === 'touch' ? 48 : 0);
  const height = gridInteger(options.height ?? 360, 120, 2000, 'height');
  const defaultWidth = gridInteger(options.columnWidth ?? 120, 32, 2000, 'columnWidth');
  let columns = validateColumns(options.columns, defaultWidth);
  validateHeaderSpace(columns);
  if (options.rows !== undefined && options.dataSource !== undefined) throw new TypeError('choose rows or dataSource');
  let localSource = options.dataSource ? null : createGridArrayDataSource({ columns, rows: options.rows ?? [] });
  let source = options.dataSource ?? localSource;
  if (!source || typeof source.getWindow !== 'function') throw new TypeError('dataSource.getWindow required');
  let total = gridInteger(options.rowCount ?? localSource?.rowCount ?? 25, 0, GRID_LIMITS.logicalRows, 'rowCount');
  let query = validateQuery({ pageSize: options.pageSize ?? 25, ...options.initialQuery }, columns);
  validatePageBudget(columns, query);
  let initialQuery = query;
  let viewGeneration = 0;
  let revision = 1, status = 'loading', disposed = false, cache = null, current = null, pending = null;
  let currentPromise = Promise.resolve(), scheduled = null, scheduledPromise = null, scheduledResolve = null;
  let requestCount = 0, requestedCells = 0, abandonedRequests = 0;
  let widths = new Map(columns.map(column => [column.id, column.width]));
  let hidden = new Map(columns.map(column => [column.id, column.hidden]));
  let order = columns.map(column => column.id);
  let autoWidthEligible = new Set(options.columns.filter(column => column.width === undefined).map(column => column.id));
  const autoSizedColumns = new Set();
  let frozenStart = gridInteger(options.frozenStart ?? 0, 0, Math.min(32, columns.length), 'frozenStart');
  let selection = validateSelection(options.initialSelection ?? { mode: 'explicit', ids: [] }, revision);
  let editor = null, editSequence = 0, details = null, detailsCleanups = [];
  let resizeCleanup = null, observer = null, intersection = null;
  let rowHeaderDepth = 0, currentHeaderDepth = 1;
  let activeLogical = null;
  let actions = validateActions(options.actions ?? []), bulkActions = validateActions(options.bulkActions ?? []);
  if (!localSource && columns.some(column => column.editable) && typeof options.onEdit !== 'function') throw new TypeError('remote editing requires onEdit');
  if (options.singleSelect && (selection.mode !== 'explicit' || selection.ids.length > 1)) throw new TypeError('single selection');
  const identityRequired = Boolean(options.selectable || options.onEdit || options.rowDetails || actions.length || columns.some(column => column.editable));
  const element = gridElement(document, 'section', `ag-data-grid ag-data-grid--${mode}`);
  element.dataset.density = options.density ?? 'compact'; element.setAttribute('aria-label', label);
  const title = gridElement(document, 'h3', 'ag-data-grid__title', label);
  const statusElement = gridElement(document, 'div', 'ag-data-grid__status'); statusElement.setAttribute('role', 'status'); statusElement.setAttribute('aria-live', 'polite');
  const viewport = gridElement(document, 'div', 'ag-data-grid__viewport'); viewport.style.height = options.autoheight && mode === 'paged' ? 'auto' : `${height}px`; viewport.style.maxHeight = `${height}px`; viewport.tabIndex = 0; viewport.setAttribute('aria-label', `${label}: область данных`);
  const editorPanel = gridElement(document, 'div', 'ag-data-grid__editor'); editorPanel.hidden = true;
  const detailsPanel = gridElement(document, 'div', 'ag-data-grid__details'); detailsPanel.hidden = true;
  const actionsPanel = gridElement(document, 'div', 'ag-data-grid__actions-panel'); actionsPanel.hidden = true;
  const confirmPanel = gridElement(document, 'div', 'ag-data-grid__confirmation'); confirmPanel.hidden = true;
  element.append(title);
  const safe = callback => (...args) => { try { const result = callback(...args); result?.catch?.(error => showError(error.message)); } catch (error) { showError(error.message); } };
  const controls = createGridControls({ document, root: element, options: { ...options, mode }, callbacks: {
    query: safe(setQuery), refresh: safe(refresh), reset: safe(resetView), error: showError,
    filter: safe((id, value) => { const filters = { ...query.filters }; if (value) filters[id] = value; else delete filters[id]; return setQuery({ page: 0, filters }); }),
    page: safe(page => setQuery({ page })), visibility: safe(setColumnVisibility), width: safe(setColumnWidth), reorder: safe(reorderColumn), freeze: safe(setFrozenStart), autosize: safe(autosizeColumn),
    selectVisible: safe(() => { const ids = current?.result.rowIds.filter((id, index) => !current.rows[index].disabled) ?? []; setSelection({ mode: 'explicit', ids }); }),
    selectAll: safe(() => setSelection({ mode: 'all-matching', except: [], queryRevision: revision })), clearSelection: safe(clearSelection), action: safe(runAction)
  } });
  element.append(statusElement, viewport, controls.pager, editorPanel, detailsPanel, actionsPanel, confirmPanel);
  const renderer = createGridRenderer({ document, viewport, mode, label, rowHeight, locale: options.locale,
    onSort: safe(sortColumn), onSelect: safe(toggleSelection), onEdit: safe(editCell), onDetails: safe(showDetails), onAction: safe(runAction), onActions: safe(showActions),
    onNavigate: safe(navigateCell), onHeaderKey, onResize: safe(startResize), onReorder: safe((id, target) => reorderColumn(id, order.indexOf(target))) });
  const resizeListener = () => schedule();
  viewport.addEventListener('scroll', resizeListener, { passive: true });
  if (window?.ResizeObserver) { observer = new window.ResizeObserver(resizeListener); observer.observe(viewport); }
  else window?.addEventListener('resize', resizeListener);
  delete options.rows; delete options.columns; delete options.dataSource;
  updateControls();
  const initialViewState = getViewState();
  if (options.persistence?.load) {
    const expected = revision, expectedView = viewGeneration;
    Promise.resolve().then(() => options.persistence.load()).then(state => {
      if (!disposed && revision === expected && viewGeneration === expectedView && state !== undefined && state !== null) return restoreViewState(state);
    }).catch(() => { /* A corrupt/unavailable preference store must not prevent loading data. */ });
  }
  if (options.loading === 'lazy' && window?.IntersectionObserver) {
    intersection = new window.IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { intersection.disconnect(); intersection = null; draw(); } }); intersection.observe(element);
  } else queueMicrotask(() => { if (!disposed) draw(); });

  /** Copy bounded action definitions; business effects stay in explicit host callbacks. */
  function validateActions(value) {
    if (!Array.isArray(value) || value.length > 32) throw new TypeError('actions');
    const ids = new Set();
    return Object.freeze(value.map(action => {
      const id = gridText(action?.id, 'action.id', 256);
      if (!id || ids.has(id)) throw new TypeError('unique action id'); ids.add(id);
      if (action.confirm !== undefined) gridText(action.confirm, 'confirmation');
      if (action.disabled !== undefined && typeof action.disabled !== 'boolean' && typeof action.disabled !== 'function') throw new TypeError('action.disabled');
      return Object.freeze({ ...action, id, label: gridText(action.label, 'action.label', 512) });
    }));
  }
  /** Reject paged layouts that cannot honor the complete page within the DOM/cell budget. */
  function validateHeaderSpace(schema, providerDepth = 1) { const depth = Math.max(providerDepth, ...schema.map(column => column.group.length + 1)); if (mode === 'virtual' && height < rowHeight * (depth + 1)) throw new RangeError('height must fit grouped headers and at least one data row'); }
  function validatePageBudget(schema, value) { if (mode === 'paged' && (schema.length > 128 || schema.length * value.pageSize > GRID_LIMITS.windowCells)) throw new RangeError('paged mode: at most128columns and16384cells perpage'); }
  function ensureNoDraft() { if (editor) throw new Error('Сохраните или отмените редактирование перед изменением представления'); }
  function showError(message) { if (!disposed) { statusElement.textContent = String(message); statusElement.dataset.error = 'true'; } }
  /** Publish one recoverable loading/data/error status without replacing the grid shell. */
  function setStatus(value, message = '') {
    status = value; statusElement.dataset.error = value === 'error' ? 'true' : 'false';
    viewport.setAttribute('aria-busy', String(value === 'loading'));
    statusElement.replaceChildren(document.createTextNode(message || (value === 'loading' ? 'Загрузка…' : value === 'empty' ? 'Нет данных' : '')));
    if (value === 'error') {
      const retry = gridElement(document, 'button', 'ag-data-grid__button', 'Повторить'); retry.type = 'button'; retry.addEventListener('click', () => draw(), { once: true }); statusElement.append(retry);
    }
  }
  function updateControls() { if (!disposed) controls.update({ columns, viewState: getViewState(), query, selection, total }); }
  function utilityWidth() { return options.selectable || options.rowDetails || actions.length || options.responsive ? 160 : 0; }
  /** Browser RTL offsets are negative; all renderer/window calculations use positive inline coordinates. */
  function isRTL() {
    const direction = window?.getComputedStyle(viewport).direction || window?.getComputedStyle(element).direction || element.closest('[dir]')?.getAttribute('dir') || document.documentElement.dir;
    return direction === 'rtl';
  }
  /** Derive the current projected viewport from known geometry and view preferences. */
  function calculate() {
    const dimensions = gridDimensions(viewport, height);
    // One typography read per draw, never per cell. Explicit rowHeight is a minimum.
    const typography = window?.getComputedStyle(viewport);
    const fontSize = Number.parseFloat(typography?.fontSize) || 16;
    const lineHeight = Number.parseFloat(typography?.lineHeight) || fontSize * 1.2;
    rowHeight = Math.max(minimumRowHeight, options.density === 'touch' ? 48 : 0, Math.ceil(lineHeight + 14));
    const protectedIds = [...query.sort.map(item => item.columnId), ...Object.keys(query.filters)];
    const rowHeaderWidth = rowHeaderDepth * 100;
    const stickyUtility = utilityWidth() <= dimensions.width - 64;
    const stickyRowHeaders = utilityWidth() + rowHeaderWidth <= dimensions.width - 64;
    const stickyAuxWidth = (stickyUtility ? utilityWidth() : 0) + (stickyRowHeaders ? rowHeaderWidth : 0);
    const layout = gridColumnLayout(columns, order, hidden, widths, dimensions.width - stickyAuxWidth, Boolean(options.responsive), frozenStart, protectedIds);
    const headerDepth = Math.max(gridHeaderDepth(layout), currentHeaderDepth);
    if (mode === 'virtual') {
      const readableHeight = Math.max(height, rowHeight * (headerDepth + 1));
      if (readableHeight > 10000) throw new RangeError('typography exceeds the supported virtual viewport; use paged mode');
      viewport.style.height = `${readableHeight}px`; viewport.style.maxHeight = `${readableHeight}px`;
      dimensions.height = Math.max(dimensions.height, readableHeight);
    }
    const horizontalMaximum = Math.max(0, layout.totalWidth + utilityWidth() + rowHeaderWidth - dimensions.width);
    const scrollLeft = Math.min(horizontalMaximum, Math.max(0, isRTL() ? -viewport.scrollLeft : viewport.scrollLeft));
    const state = gridWindow({ mode, query, layout, rowCount: total, viewportWidth: dimensions.width, viewportHeight: dimensions.height, headerHeight: headerDepth * rowHeight,
      rowHeight, scrollTop: viewport.scrollTop, scrollLeft, utilityWidth: utilityWidth(), rowHeaderWidth, revision });
    return { ...state, layout, headerDepth, rowHeaderDepth, rowHeaderWidth, stickyUtility, stickyRowHeaders, stickyAuxWidth, utilityWidth: utilityWidth(), viewportWidth: dimensions.width, viewportHeight: dimensions.height, rowHeight, scrollTop: viewport.scrollTop, scrollLeft };
  }
  function requestKey(request) { return JSON.stringify([request.revision, request.y0, request.y1, request.columnIndices]); }
  /** Releasing an obsolete request resolves its public waiter even if a host ignores AbortSignal. */
  function abandonRequest() {
    if (!pending) return;
    const previous = pending; pending = null; previous.controller.abort(); previous.owner = null; previous.resolve(); previous.state = null; previous.controller = null; previous.key = null; previous.resolve = null; abandonedRequests++;
  }
  /** Resolve and cancel the one pending draw frame during replacement or disposal. */
  function cancelSchedule() {
    if (scheduled !== null) { if (window?.cancelAnimationFrame) window.cancelAnimationFrame(scheduled); else clearTimeout(scheduled); scheduled = null; }
    scheduledResolve?.(); scheduledResolve = null; scheduledPromise = null;
  }
  /** Revision invalidation drops the only cache and never waits for old providers. */
  function invalidate(matchingChanged = true) {
    if (matchingChanged) revision++;
    abandonRequest();
    cache = null; current = null; currentHeaderDepth = 1; rowHeaderDepth = 0;
    if (matchingChanged && selection.mode === 'all-matching') selection = validateSelection({ mode: 'explicit', ids: [] }, revision);
    closeDetails(); closeActions(); dismissConfirmation();
  }
  /** Build immutable projected remote contexts without expanding unloaded schema fields. */
  function makeRows(result, request) {
    if (result.rows) return result.rows;
    const rows = [];
    for (let index = 0; index < result.rowIds.length; index++) {
      const cells = Object.create(null);
      for (let column = 0; column < request.columnIds.length; column++) cells[request.columnIds[column]] = result.data[column][index];
      rows.push(freezeRow({ id: result.rowIds[index], cells }, request.columnIndices.map(index => columns[index])));
    }
    return rows;
  }
  /** Pass a validated window to the sole DOM owner and refresh only bound controls. */
  function paint(state, result) {
    if (disposed) return;
    const rows = makeRows(result, state.request);
    current = { ...state, result, rows };
    renderer.render({ ...current, columns, query, isCurrent: () => !disposed && revision === state.request.revision && current?.request === state.request, sortable: options.sortable !== false, resizable: options.resizable !== false, reorder: options.reorder !== false,
      selectable: Boolean(options.selectable), singleSelect: Boolean(options.singleSelect), actions, collapseActions: Boolean(options.collapseActions),
      hasDetails: Boolean(options.rowDetails || options.responsive || columns.some(column => hidden.get(column.id))), selected: id => selectedRow(selection, id) });
    updateControls();
  }
  /** Latest-request-wins with bounded retained result and explicit scalar validation. */
  function draw() {
    if (disposed) return Promise.resolve();
    cancelSchedule();
    const state = calculate(), key = requestKey(state.request);
    if (cache?.key === key) { try { paint(state, cache.result); } catch (error) { cache = null; setStatus('error', error?.message || 'Ошибка отображения'); } return Promise.resolve(); }
    if (pending?.key === key) return currentPromise;
    abandonRequest(); setStatus('loading');
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    const controller = new (window?.AbortController ?? AbortController)();
    const token = { owner: { success: settleResult, failure: settleFailure }, controller, resolve, key, state, revision };
    pending = token; currentPromise = promise;
    requestCount++; requestedCells += (state.request.y1 - state.request.y0) * state.request.columnIndices.length;
    let response;
    try {
      response = options.initialResult && requestCount === 1 ? options.initialResult : source.getWindow(state.request, { signal: controller.signal });
      if (requestCount === 1) delete options.initialResult;
    } catch (error) { settleFailure(token, error); return promise; }
    Promise.resolve(response).then(deliverGridResult.bind(null, token), deliverGridFailure.bind(null, token));
    return promise;
  }
  /** Accept only the current validated result; changed dimensions may request a corrected window. */
  function settleResult(token, value) {
    if (!token.owner || disposed || pending !== token || revision !== token.revision) return;
    try {
      const result = validateWindow(value, token.state.request, columns, identityRequired);
      if (options.autosize) for (let offset = 0; offset < token.state.request.columnIndices.length; offset++) {
        const column = columns[token.state.request.columnIndices[offset]];
        if (!autoWidthEligible.has(column.id) || autoSizedColumns.has(column.id)) continue;
        let characters = Math.min(200, column.label.length);
        for (const value of result.data[offset]) characters = Math.max(characters, Math.min(200, gridFormat(value, column, options.locale).length));
        widths.set(column.id, Math.max(column.minWidth, Math.min(column.maxWidth, Math.ceil(characters * 8.5 + 36))));
        autoSizedColumns.add(column.id);
      }
      total = result.num_rows;
      currentHeaderDepth = Math.max(1, ...(result.column_headers?.map(path => path.length) ?? [1]));
      // Provider groups may require a taller readable viewport; calculate() reserves a data row.
      rowHeaderDepth = Math.max(0, ...(result.row_headers?.map(path => path.length) ?? [0]));
      const lastPage = Math.max(0, Math.ceil(total / query.pageSize) - 1);
      if (mode === 'paged' && query.page > lastPage) query = validateQuery({ page: lastPage }, columns, query);
      const updated = calculate();
      if (requestKey(updated.request) !== token.key) {
        pending = null; token.owner = null; cache = null;
        draw().then(token.resolve);
        return;
      }
      cache = { key: token.key, result };
      paint(updated, result); if (disposed || pending !== token || revision !== token.revision) return; pending = null; token.owner = null; setStatus(total ? 'ready' : 'empty'); token.resolve();
    } catch (error) { settleFailure(token, error); }
  }
  /** Settle the current waiter with a visible retry state; stale failures are ignored. */
  function settleFailure(token, error) {
    if (!token.owner || disposed || pending !== token || revision !== token.revision) return;
    pending = null; token.owner = null; cache = null;
    setStatus('error', error?.message || 'Не удалось загрузить данные'); token.resolve();
  }
  /** Scroll/resize events coalesce into one owned frame; there is no idle animation loop. */
  function schedule() {
    if (disposed) return Promise.resolve();
    if (scheduledPromise) return scheduledPromise;
    scheduledPromise = new Promise(resolve => { scheduledResolve = resolve; });
    const promise = scheduledPromise;
    const callback = () => { const done = scheduledResolve; scheduled = null; scheduledPromise = null; scheduledResolve = null; try { Promise.resolve(draw()).then(done, error => { showError(error.message); done?.(); }); } catch (error) { showError(error.message); done?.(); } };
    scheduled = window?.requestAnimationFrame ? window.requestAnimationFrame(callback) : setTimeout(callback, 0);
    return promise;
  }
  function refresh() { if (disposed) return Promise.resolve(); cache = null; abandonRequest(); return draw(); }
  /** Wait for latest owned work, following query/frame replacement rather than stale providers. */
  async function whenIdle() {
    while (!disposed) {
      const latest = scheduledPromise ?? currentPromise;
      await latest;
      if (!scheduledPromise && !pending) return;
    }
  }
  /** Apply a validated immutable query; pages retain matching selection while changed predicates invalidate it. */
  function setQuery(value) {
    if (disposed) return Promise.resolve(); ensureNoDraft();
    const next = validateQuery(value, columns, query); validatePageBudget(columns, next);
    if (JSON.stringify(next) === JSON.stringify(query)) return draw();
    const matchingChanged = JSON.stringify([next.search, next.sort, next.filters]) !== JSON.stringify([query.search, query.sort, query.filters]);
    query = next; viewGeneration++; invalidate(matchingChanged); viewport.scrollTop = 0;
    try { options.onQueryChange?.(query); } catch (error) { showError(error.message); } if (disposed) return Promise.resolve();
    updateControls(); savePreferences(); return draw();
  }
  /** Cycle one header sort through ascending, descending and unsorted. */
  function sortColumn(id) {
    const column = columns.find(column => column.id === id);
    if (options.sortable === false || column?.sortable === false) return;
    const previous = query.sort[0];
    const sort = previous?.columnId !== id ? [{ columnId: id, direction: 'ascending' }] : previous.direction === 'ascending' ? [{ columnId: id, direction: 'descending' }] : [];
    return setQuery({ page: 0, sort });
  }
  /** Atomically replace resident rows and retain only existing explicitly selected identities. */
  function setRows(rows) {
    if (disposed) return Promise.resolve(); ensureNoDraft();
    if (!localSource) throw new TypeError('setRows is available only for the resident array provider');
    localSource.setRows(rows); total = localSource.rowCount; invalidate();
    selection = validateSelection({ mode: 'explicit', ids: selection.mode === 'explicit' ? selection.ids.filter(id => localSource.getRow(id)) : [] }, revision);
    return draw();
  }
  /** Validate the replacement schema before dropping query/schema-dependent state. */
  function setColumns(value) {
    if (disposed) return Promise.resolve(); ensureNoDraft();
    const next = validateColumns(value, defaultWidth); validatePageBudget(next, query); validateHeaderSpace(next);
    if (!localSource && next.some(column => column.editable) && typeof options.onEdit !== 'function') throw new TypeError('remote editing requires onEdit');
    if (localSource) localSource.setColumns(next);
    autoWidthEligible = new Set(value.filter(column => column.width === undefined).map(column => column.id)); autoSizedColumns.clear();
    columns = next; order = next.map(column => column.id); widths = new Map(next.map(column => [column.id, column.width])); hidden = new Map(next.map(column => [column.id, column.hidden]));
    frozenStart = Math.min(frozenStart, next.length);
    query = validateQuery({ sort: [], filters: {}, page: 0 }, next, query);
    invalidate(); updateControls(); savePreferences(); return draw();
  }
  /** Validate bounded identity selection and repaint without fetching or changing the query. */
  function setSelection(value) {
    if (disposed) return;
    if (!options.selectable) throw new TypeError('selection is disabled');
    const next = validateSelection(value, revision);
    if (options.singleSelect && (next.mode !== 'explicit' || next.ids.length > 1)) throw new TypeError('single selection');
    selection = next;
    if (current) paint(calculate(), current.result);
    updateControls(); options.onSelectionChange?.(selection);
  }
  function clearSelection() { if (!disposed && options.selectable) setSelection({ mode: 'explicit', ids: [] }); }
  /** Toggle a stable row identity or an all-matching exclusion without enumerating other rows. */
  function toggleSelection(id, checked) {
    const row = findRow(id); if (!row || row.disabled) return;
    if (options.singleSelect) { setSelection({ mode: 'explicit', ids: checked ? [id] : [] }); return; }
    const key = selection.mode === 'explicit' ? 'ids' : 'except'; const ids = new Set(selection[key]);
    if (checked === (key === 'ids')) ids.add(id); else ids.delete(id);
    setSelection(selection.mode === 'explicit' ? { mode: 'explicit', ids: [...ids] } : { mode: 'all-matching', except: [...ids], queryRevision: revision });
  }
  function findRow(id) { return localSource?.getRow(id) ?? current?.rows.find(row => row.id === id) ?? null; }
  /** Invalidate the projected window after a view mutation while retaining matching-query identity. */
  function viewChange(matchingChanged = false) { viewGeneration++; invalidate(matchingChanged); updateControls(); try { options.onColumnChange?.(getViewState()); } catch (error) { showError(error.message); } if (!disposed) savePreferences(); return draw(); }
  /** Keep at least one visible schema field; hidden values remain available in local details. */
  function setColumnVisibility(id, visible) {
    if (disposed) return Promise.resolve(); ensureNoDraft(); requireColumn(id);
    if (typeof visible !== 'boolean') throw new TypeError('visible');
    if (!visible && order.filter(id => !hidden.get(id)).length === 1 && !hidden.get(id)) throw new Error('Оставьте хотя бы одну колонку');
    hidden.set(id, !visible); return viewChange();
  }
  function requireColumn(id) { const column = columns.find(column => column.id === id); if (!column) throw new TypeError('unknown column'); return column; }
  /** Apply an integer width within the column-specific bounds before redrawing. */
  function setColumnWidth(id, value) {
    if (disposed) return Promise.resolve(); ensureNoDraft(); const column = requireColumn(id);
    widths.set(id, gridInteger(value, column.minWidth, column.maxWidth, 'width')); return viewChange();
  }
  /** Move a declared identity in visual order without changing provider source indices. */
  function reorderColumn(id, to) {
    if (disposed) return Promise.resolve(); ensureNoDraft(); requireColumn(id); gridInteger(to, 0, columns.length - 1, 'column position');
    const next = order.filter(value => value !== id); next.splice(to, 0, id); order = next; return viewChange();
  }
  /** Bound the requested frozen prefix; layout may release columns on narrow viewports. */
  function setFrozenStart(value) {
    if (disposed) return Promise.resolve(); ensureNoDraft(); frozenStart = gridInteger(value, 0, Math.min(32, columns.length), 'frozenStart'); return viewChange();
  }
  /** Autosize measures current scalar samples only; remote rows are never enumerated. */
  function autosizeColumn(id) {
    if (disposed) return Promise.resolve(); ensureNoDraft(); const column = requireColumn(id);
    let characters = Math.min(200, column.label.length);
    const offset = current?.request.columnIds.indexOf(id) ?? -1;
    if (offset >= 0) for (const value of current.result.data[offset]) characters = Math.max(characters, Math.min(200, gridFormat(value, column, options.locale).length));
    return setColumnWidth(id, Math.max(column.minWidth, Math.min(column.maxWidth, Math.ceil(characters * 8.5 + 36))));
  }
  /** Provide keyboard alternatives for column resize/reorder with logical RTL directions. */
  function onHeaderKey(event, id) {
    if (event.isComposing || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return false;
    const direction = (event.key === 'ArrowRight' ? 1 : -1) * (isRTL() ? -1 : 1);
    if (event.altKey && options.reorder !== false) { event.preventDefault(); safe(reorderColumn)(id, Math.max(0, Math.min(order.length - 1, order.indexOf(id) + direction))); return true; }
    if (event.shiftKey && options.resizable !== false) { event.preventDefault(); const column = requireColumn(id); safe(setColumnWidth)(id, Math.max(column.minWidth, Math.min(column.maxWidth, widths.get(id) + direction * 16))); return true; }
    return false;
  }
  /** Pointer resize owns document listeners only until end/cancel/dispose. */
  function startResize(id, event) {
    if (!event) return autosizeColumn(id);
    if (disposed || options.resizable === false || event.button !== 0) return;
    ensureNoDraft(); resizeCleanup?.(); event.preventDefault();
    const column = requireColumn(id), start = event.clientX, initial = widths.get(id), direction = isRTL() ? -1 : 1;
    const move = event => {
      if (disposed) return;
      widths.set(id, Math.max(column.minWidth, Math.min(column.maxWidth, Math.round(initial + direction * (event.clientX - start)))));
      cache = null; schedule();
    };
    const finish = () => { resizeCleanup?.(); resizeCleanup = null; if (!disposed) { try { options.onColumnChange?.(getViewState()); } catch (error) { showError(error.message); } viewGeneration++; savePreferences(); } };
    resizeCleanup = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', finish); document.removeEventListener('pointercancel', finish); };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', finish); document.addEventListener('pointercancel', finish);
  }
  /** Map exact logical coordinates to bounded browser scroll geometry and wait for that window. */
  function scrollTo({ row, column } = {}) {
    if (disposed) return Promise.resolve();
    if (row !== undefined) gridInteger(row, 0, Math.max(0, total - 1), 'row');
    if (column !== undefined) gridInteger(column, 0, columns.length - 1, 'column');
    if (row !== undefined && mode === 'paged') {
      ensureNoDraft(); const page = Math.floor(row / query.pageSize);
      if (page !== query.page) { query = validateQuery({ page }, columns, query); invalidate(false); }
    } else if (row !== undefined) {
      const geometry = calculate().geometry;
      viewport.scrollTop = geometry.maximumRow ? Math.min(row, geometry.maximumRow) / geometry.maximumRow * geometry.scrollMaximum : 0;
    }
    if (column !== undefined) {
      const state = calculate(), entry = state.layout.entries.find(entry => entry.sourceIndex === column);
      if (entry) { const maximum = Math.max(0, state.layout.totalWidth + state.utilityWidth + state.rowHeaderWidth - state.viewportWidth); const logical = Math.max(0, Math.min(maximum, entry.left + state.utilityWidth + state.rowHeaderWidth - state.stickyAuxWidth)); viewport.scrollLeft = isRTL() ? -logical : logical; }
    }
    return draw();
  }
  /** Move logical cell focus, loading another projected window only when needed. */
  async function navigateCell(event, rowIndex, columnId) {
    const visible = calculate().layout.entries;
    let index = visible.findIndex(entry => entry.column.id === columnId), row = rowIndex;
    const rtl = isRTL();
    if (event.key === 'ArrowRight') index += rtl ? -1 : 1;
    if (event.key === 'ArrowLeft') index += rtl ? 1 : -1;
    if (event.key === 'ArrowUp') row--;
    if (event.key === 'ArrowDown') row++;
    if (event.key === 'PageUp') row -= Math.max(1, Math.floor(height / rowHeight) - currentHeaderDepth);
    if (event.key === 'PageDown') row += Math.max(1, Math.floor(height / rowHeight) - currentHeaderDepth);
    if (event.key === 'Home') { index = 0; if (event.ctrlKey) row = 0; }
    if (event.key === 'End') { index = visible.length - 1; if (event.ctrlKey) row = total - 1; }
    row = Math.max(0, Math.min(Math.max(0, total - 1), row)); index = Math.max(0, Math.min(visible.length - 1, index));
    activeLogical = { row, columnId: visible[index].column.id };
    await scrollTo({ row, column: visible[index].sourceIndex });
    if (disposed || activeLogical?.row !== row) return;
    const offset = row - (current?.request.y0 ?? 0), id = current?.result.rowIds[offset];
    if (id) renderer.focus(id, visible[index].column.id);
  }
  /** Editor identity is independent of recycled slots. Offscreen drafts remain in this explicit panel. */
  function editCell(rowId, columnId) {
    if (disposed) return; ensureNoDraft();
    const row = findRow(rowId), column = requireColumn(columnId);
    if (!row || row.disabled || !column.editable) throw new TypeError('cell is not editable');
    const input = document.createElement('input'); input.type = column.editableType ?? (column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'); input.maxLength = GRID_LIMITS.text; input.value = String(row.cells[columnId] ?? '');
    const labelElement = gridElement(document, 'label', '', `${row.label ?? row.id} · ${column.label}`); labelElement.append(input);
    const error = gridElement(document, 'span', 'ag-data-grid__edit-error'); error.setAttribute('role', 'alert');
    const save = gridElement(document, 'button', 'ag-data-grid__button', 'Сохранить'); save.type = 'button';
    const cancel = gridElement(document, 'button', 'ag-data-grid__button', 'Отмена'); cancel.type = 'button';
    editor = { token: ++editSequence, row, column, input, error, save, previous: row.cells[columnId], controller: null, revision, saving: false };
    save.addEventListener('click', () => commitEdit()); cancel.addEventListener('click', cancelEdit);
    input.addEventListener('keydown', event => { if (event.isComposing) return; if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancelEdit(); } if (event.key === 'Enter') { event.preventDefault(); commitEdit(); } });
    editorPanel.replaceChildren(labelElement, error, save, cancel); editorPanel.hidden = false; input.focus();
  }
  /** Validate and save a stable draft; cancellation and stale completion cannot mutate another editor. */
  async function commitEdit(explicitValue) {
    const draft = editor;
    if (disposed || !draft || draft.saving) return false;
    let value = explicitValue;
    try {
      if (value !== undefined) { gridScalar(value); draft.input.value = value === null ? '' : String(value); }
      if (value === undefined) {
        value = draft.input.value;
        if (draft.column.type === 'number') { if (!value.trim()) value = null; else { value = Number(value); if (!Number.isFinite(value)) throw new Error('Введите конечное число'); } }
        if (draft.column.type === 'boolean') { if (!['true', 'false'].includes(value)) throw new Error('Введите true или false'); value = value === 'true'; }
      }
      gridScalar(value);
      if (!draft.input.checkValidity()) throw new Error(draft.input.validationMessage || 'Проверьте значение');
      const context = Object.freeze({ value: draft.previous, rowId: draft.row.id, columnId: draft.column.id, rowIndex: current && current.result.rowIds.includes(draft.row.id) ? current.request.y0 + current.result.rowIds.indexOf(draft.row.id) : -1, columnIndex: columns.indexOf(draft.column), row: draft.row });
      const validation = draft.column.validate?.(value, context);
      if (validation === false || typeof validation === 'string') throw new Error(typeof validation === 'string' ? validation : 'Значение не прошло проверку');
      draft.saving = true; draft.save.disabled = true; draft.input.disabled = true; draft.error.textContent = '';
      const controller = new (window?.AbortController ?? AbortController)(); draft.controller = controller;
      const canceled = new Promise(resolve => { draft.cancelResolve = () => resolve(false); });
      const saveResult = options.onEdit?.(Object.freeze({ rowId: draft.row.id, columnId: draft.column.id, previous: draft.previous, value, queryRevision: draft.revision }), { signal: controller.signal });
      const result = await Promise.race([Promise.resolve(saveResult), canceled]);
      if (disposed || editor !== draft || draft.token !== editSequence || revision !== draft.revision || controller.signal.aborted) return false;
      if (result === false || typeof result === 'string') throw new Error(typeof result === 'string' ? result : 'Не удалось сохранить');
      if (localSource) localSource.updateCell(draft.row.id, draft.column.id, value);
      const identity = { rowId: draft.row.id, columnId: draft.column.id };
      closeEditor(false); invalidate(); await draw();
      if (!disposed) renderer.focus(identity.rowId, identity.columnId);
      return true;
    } catch (error) {
      if (!disposed && editor === draft) { draft.saving = false; draft.save.disabled = false; draft.input.disabled = false; draft.error.textContent = error?.message || 'Не удалось сохранить'; draft.input.setAttribute('aria-invalid', 'true'); draft.input.focus(); }
      return false;
    }
  }
  /** Abort the owned save and settle its cancellation race before retiring editor DOM. */
  function closeEditor(restoreFocus) {
    if (!editor) return;
    const previous = editor; editor = null; editSequence++; previous.controller?.abort(); previous.cancelResolve?.(); editorPanel.replaceChildren(); editorPanel.hidden = true;
    if (restoreFocus && !disposed) renderer.focus(previous.row.id, previous.column.id);
  }
  function cancelEdit() { closeEditor(true); }
  function closeDetails() { for (const cleanup of detailsCleanups.splice(0)) { try { cleanup(); } catch { /* Release all renderer resources. */ } } details = null; detailsPanel.replaceChildren(); detailsPanel.hidden = true; }
  /** Expose hidden/local full values and optional detached host content outside the scroll clip. */
  function showDetails(rowId, expanded) {
    if (disposed) return;
    const row = findRow(rowId); if (!row) throw new TypeError('unknown loaded row');
    const open = expanded ?? details !== rowId;
    closeDetails();
    if (open) {
      details = rowId; detailsPanel.hidden = false;
      detailsPanel.append(gridElement(document, 'h4', '', row.label ?? row.id));
      const list = document.createElement('dl');
      for (const column of columns) { list.append(gridElement(document, 'dt', '', column.label), gridElement(document, 'dd', '', gridFormat(row.cells[column.id], column, options.locale))); }
      detailsPanel.append(list);
      if (options.rowDetails) { const custom = document.createElement('div'); mountGridContent(custom, options.rowDetails(row), detailsCleanups); detailsPanel.append(custom); }
      const close = gridElement(document, 'button', 'ag-data-grid__button', 'Закрыть подробности'); close.type = 'button'; close.addEventListener('click', closeDetails); detailsPanel.append(close);
    }
    options.onRowDetailsChange?.(Object.freeze({ rowId, expanded: open }));
  }
  function closeActions() { actionsPanel.replaceChildren(); actionsPanel.hidden = true; }
  /** A contextual panel outside the scroll clip keeps every action reachable at any row height. */
  function showActions(rowId) {
    const row = findRow(rowId); if (!row || disposed) return;
    closeActions(); actionsPanel.hidden = false;
    actionsPanel.append(gridElement(document, 'strong', '', `Действия: ${row.label ?? rowId}`));
    for (const action of actions) {
      if (row.actions && !row.actions.includes(action.id)) continue;
      const button = gridElement(document, 'button', 'ag-data-grid__button', action.label); button.type = 'button'; button.dataset.actionId = action.id;
      button.disabled = row.disabled || (typeof action.disabled === 'function' ? Boolean(action.disabled(row)) : Boolean(action.disabled));
      button.addEventListener('click', safe(() => runAction(action.id, rowId))); actionsPanel.append(button);
    }
    const close = gridElement(document, 'button', 'ag-data-grid__button', 'Закрыть действия'); close.type = 'button'; close.addEventListener('click', closeActions); actionsPanel.append(close);
    actionsPanel.querySelector('button:not(:disabled)')?.focus();
  }
  function dismissConfirmation() { confirmPanel.replaceChildren(); confirmPanel.hidden = true; }
  /** Enforce restrictions/confirmation before invoking an explicit readonly host action snapshot. */
  function runAction(id, rowId) {
    if (disposed) return;
    const row = rowId === null ? null : findRow(rowId);
    const action = (rowId === null ? bulkActions : actions).find(action => action.id === id);
    if (!action || (rowId !== null && (!row || row.disabled || (row.actions && !row.actions.includes(id)))) || (typeof action.disabled === 'function' ? action.disabled(row) : action.disabled)) return;
    if (rowId === null && selection.mode === 'explicit' && !selection.ids.length) return;
    const expected = revision;
    const invoke = async () => {
      if (disposed || expected !== revision) return;
      dismissConfirmation(); closeActions();
      try { await options.onAction?.(Object.freeze({ actionId: action.id, row, selection })); } catch (error) { if (!disposed && expected === revision) showError(error.message); }
    };
    if (!action.confirm) return invoke();
    dismissConfirmation(); confirmPanel.hidden = false;
    const confirm = gridElement(document, 'button', 'ag-data-grid__button', 'Подтвердить'); confirm.type = 'button'; confirm.addEventListener('click', invoke, { once: true });
    const cancel = gridElement(document, 'button', 'ag-data-grid__button', 'Отмена'); cancel.type = 'button'; cancel.addEventListener('click', dismissConfirmation, { once: true });
    confirmPanel.append(gridElement(document, 'span', '', action.confirm), confirm, cancel); confirm.focus();
  }
  function getViewState() { return Object.freeze({ version: 1, columnIds: Object.freeze([...order]), columns: Object.freeze(columns.map(column => Object.freeze({ id: column.id, width: widths.get(column.id), hidden: hidden.get(column.id) }))), frozenStart, pageSize: query.pageSize, sort: query.sort }); }
  /** Restore preferences atomically; unrecognized schema/data keys are rejected rather than persisted. */
  function restoreViewState(value) {
    if (disposed) return Promise.resolve(false); ensureNoDraft();
    try {
      if (!value || typeof value !== 'object' || Object.keys(value).some(key => !['version', 'columnIds', 'columns', 'frozenStart', 'pageSize', 'sort'].includes(key)) || value.version !== 1) return Promise.resolve(false);
      if (!Array.isArray(value.columnIds) || value.columnIds.length !== columns.length || new Set(value.columnIds).size !== columns.length || !value.columnIds.every(id => columns.some(column => column.id === id))) return Promise.resolve(false);
      if (!Array.isArray(value.columns) || value.columns.length !== columns.length || new Set(value.columns.map(column => column.id)).size !== columns.length) return Promise.resolve(false);
      const nextHidden = new Map(), nextWidths = new Map();
      for (const item of value.columns) { const column = requireColumn(item.id); if (typeof item.hidden !== 'boolean' || Object.keys(item).some(key => !['id', 'width', 'hidden'].includes(key))) return Promise.resolve(false); nextHidden.set(item.id, item.hidden); nextWidths.set(item.id, gridInteger(item.width, column.minWidth, column.maxWidth, 'width')); }
      if ([...nextHidden.values()].every(Boolean)) return Promise.resolve(false);
      const frozen = gridInteger(value.frozenStart, 0, Math.min(32, columns.length), 'frozenStart');
      const nextQuery = validateQuery({ pageSize: value.pageSize, sort: value.sort, page: 0 }, columns, query); validatePageBudget(columns, nextQuery);
      const matchingChanged = JSON.stringify(query.sort) !== JSON.stringify(nextQuery.sort);
      order = [...value.columnIds]; widths = nextWidths; hidden = nextHidden; frozenStart = frozen; query = nextQuery;
      return viewChange(matchingChanged).then(() => true);
    } catch { return Promise.resolve(false); }
  }
  /** Persist only the public safe preference snapshot; storage failure never corrupts data state. */
  function savePreferences() {
    if (disposed || !options.persistence) return;
    try { Promise.resolve(options.persistence.save(getViewState())).catch(() => {}); } catch { /* Preference storage failure is not a data failure. */ }
  }
  /** Restore initial query/preferences without retaining a draft or stale viewport. */
  function resetView() {
    if (disposed) return Promise.resolve(); ensureNoDraft();
    query = initialQuery; invalidate();
    return restoreViewState({ ...initialViewState, pageSize: initialQuery.pageSize, sort: initialQuery.sort }).then(() => undefined);
  }
  /** Dispose closes every owned listener, observer, frame, renderer and request; host I/O obeys its signal. */
  function dispose() {
    if (disposed) return;
    disposed = true; status = 'disposed'; cancelSchedule(); abandonRequest(); resizeCleanup?.(); resizeCleanup = null; observer?.disconnect(); intersection?.disconnect();
    viewport.removeEventListener('scroll', resizeListener); window?.removeEventListener('resize', resizeListener);
    closeEditor(false); closeDetails(); closeActions(); dismissConfirmation(); controls.dispose(); renderer.dispose(); cache = null; current = null; selection = validateSelection({ mode: 'explicit', ids: [] }, revision);
    statusElement.textContent = ''; viewport.removeAttribute('aria-busy');
    localSource?.setRows([]); localSource = null; source = null;
    columns = []; order = []; frozenStart = 0; widths.clear(); hidden.clear(); autoWidthEligible.clear(); autoSizedColumns.clear();
    actions = []; bulkActions = []; initialQuery = null; activeLogical = null;
    query = Object.freeze({ page: 0, pageSize: 25, search: '', sort: Object.freeze([]), filters: Object.freeze({}) });
    options = {};
  }
  return {
    element, viewport,
    /** Repaint the existing validated window with locale-specific formatters; the edit panel and query are retained. */
    refreshLocaleContent(context){if(disposed)return;options.locale=context.locale;const changed=renderer.setLocale(context.locale,{yes:context.t("common.yes"),no:context.t("common.no")});if(changed&&current)paint(current,current.result);},
    get query() { return query; }, get selection() { return selection; },
    get diagnostics() { return Object.freeze({ queryRevision: revision, status, window: current ? Object.freeze({ x0: current.request.x0, x1: current.request.x1, y0: current.request.y0, y1: current.request.y1 }) : null,
      residentRowCount: localSource?.rowCount ?? 0, renderedRows: current?.result.rowIds.length ?? 0, renderedColumns: current?.request.columnIndices.length ?? 0, renderedCells: renderer.renderedCells, requestCount, requestedCells, pendingOwned: pending ? 1 : 0, cacheEntries: cache ? 1 : 0, abandonedRequests }); },
    refresh, whenIdle, scrollTo, setRows, setColumns, setQuery, setSelection, clearSelection, setColumnVisibility, setColumnWidth, reorderColumn, setFrozenStart, autosizeColumn,
    showDetails, editCell, commitEdit, cancelEdit, getViewState, restoreViewState, resetView, dispose
  };
}

/** Scalar formatting and the only owner of grid cells; custom renderers are explicit host hooks. */
export function gridElement(document, tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
export function gridFormat(value, column, locale) {
  if (value === null) return '—';
  const format = column.format ?? column.type;
  try {
    if (format === 'number' && typeof value === 'number') return new Intl.NumberFormat(locale, column.formatOptions).format(value);
    if ((format === 'date' || format === 'datetime') && value !== '') {
      const date = new Date(value);
      if (Number.isFinite(date.getTime())) return new Intl.DateTimeFormat(locale, column.formatOptions ?? (format === 'datetime' ? { dateStyle: 'short', timeStyle: 'short' } : {})).format(date);
    }
    if (format === 'boolean') return value ? booleanLabels.yes : booleanLabels.no;
  } catch { /* Invalid host Intl options fall back to the exact scalar. */ }
  return String(value);
}
/** Only detached DOM belongs to the host renderer. No HTML string is interpreted. */
export function mountGridContent(target, content, cleanups) {
  if (content === null || typeof content === 'string' || typeof content === 'number' || typeof content === 'boolean') { target.textContent = content === null ? '—' : String(content); return; }
  const element = content?.element ?? content;
  if (!element || element.nodeType !== 1 || element.ownerDocument !== target.ownerDocument || element.isConnected || element.parentNode) throw new TypeError('renderer must return detached local DOM');
  target.replaceChildren(element);
  if (typeof content?.dispose === 'function') cleanups.push(content.dispose);
}
/** Rows and cells are reused by visible slot. Identity attributes are replaced before focus can move. */
export function createGridRenderer({ document, viewport, mode, label, rowHeight, locale, onSort, onSelect, onEdit, onDetails, onAction, onActions, onNavigate, onHeaderKey, onResize, onReorder }) {
  const virtual = mode === 'virtual';
  const surface = gridElement(document, 'div', 'ag-data-grid__surface');
  const grid = gridElement(document, virtual ? 'div' : 'table', 'ag-data-grid__table');
  grid.setAttribute('role', 'grid');
  grid.setAttribute('aria-label', label);
  const head = gridElement(document, virtual ? 'div' : 'thead', 'ag-data-grid__head');
  const body = gridElement(document, virtual ? 'div' : 'tbody', 'ag-data-grid__body');
  if (virtual) { head.setAttribute('role', 'rowgroup'); body.setAttribute('role', 'rowgroup'); }
  grid.append(head, body);
  surface.append(grid);
  viewport.append(surface);
  let cleanups = [], rowSlots = [], headerSignature = '';
  let active = null, alive = true;
  let formatterColumns = null;
  let booleanLabels={yes:"Да",no:"Нет"};
  const formatters = new Map();
  /** A per-renderer formatter map is bounded by the schema and released on disposal. */
  function formatted(value, column) {
    if (value === null) return '—';
    const formatter = formatters.get(column.id);
    if (formatter) { try { return formatter.format(column.type === 'date' || column.type === 'datetime' || column.format === 'date' || column.format === 'datetime' ? new Date(value) : value); } catch {} }
    if ((column.format ?? column.type) === 'boolean') return value ? booleanLabels.yes : booleanLabels.no;
    return String(value);
  }
  function cleanupContent() { for (const cleanup of cleanups.splice(0)) { try { cleanup(); } catch { /* One renderer cannot prevent other cleanups. */ } } }
  /** Position a projected cell using logical inline geometry and the active frozen band. */
  function position(element, entry, state) {
    if (!virtual) { element.style.width = `${entry.width}px`; element.style.minWidth = `${entry.width}px`; }
    else { element.style.width = `${entry.width}px`; element.style.insetInlineStart = `${(entry.frozen ? state.stickyAuxWidth + state.scrollLeft : state.utilityWidth + state.rowHeaderWidth) + entry.left}px`; }
    element.classList.toggle('is-frozen', entry.frozen);
    if (!virtual && entry.frozen) { element.style.position = 'sticky'; element.style.insetInlineStart = `${state.stickyAuxWidth + entry.left}px`; }
  }
  /** Reuse the header schema until its paths, projection or preferences change. */
  function renderHeader(state) {
    const signature = JSON.stringify([state.entries.map(entry => [entry.column.id, entry.column.label, entry.column.group, entry.width, entry.frozen]), state.query.sort, state.utilityWidth, state.rowHeaderDepth, state.rowHeight, state.stickyUtility, state.stickyRowHeaders, state.result.column_headers]);
    if (virtual) {
      for (const cell of head.querySelectorAll('.ag-data-grid__utility')) cell.style.insetInlineStart = `${state.stickyUtility ? state.scrollLeft : 0}px`;
      for (const cell of head.querySelectorAll('[data-header-level]')) cell.style.insetInlineStart = `${state.utilityWidth + Number(cell.dataset.headerLevel) * 100 + (state.stickyRowHeaders ? state.scrollLeft : 0)}px`;
    }
    if (signature === headerSignature) {
      if (virtual) for (const cell of head.querySelectorAll('[data-column-id]')) {
        const entry = state.entries.find(entry => entry.column.id === cell.dataset.columnId);
        if (entry) position(cell, entry, state);
      }
      return;
    }
    const focusedHeader = head.contains(document.activeElement) ? document.activeElement.closest('[data-sort-id]')?.dataset.sortId : null;
    headerSignature = signature;
    head.replaceChildren();
    const paths = state.entries.map((entry, index) => state.result.column_headers?.[index] ?? [...entry.column.group, entry.column.label]);
    const depth = state.headerDepth;
    for (let level = 0; level < depth; level++) {
      const row = gridElement(document, virtual ? 'div' : 'tr', 'ag-data-grid__header-row');
      if (virtual) { row.setAttribute('role', 'row'); row.style.top = `${level * rowHeight}px`; row.style.height = `${rowHeight}px`; }
      if (state.utilityWidth) {
        const utility = gridElement(document, virtual ? 'div' : 'th', 'ag-data-grid__utility');
        if (virtual) { utility.setAttribute('role', 'columnheader'); utility.style.insetInlineStart = `${state.stickyUtility ? state.scrollLeft : 0}px`; }
        if (!virtual && !state.stickyUtility) utility.style.position = 'static';
        utility.textContent = level === depth - 1 ? 'Строка' : ''; row.append(utility);
      }
      for (let levelIndex = 0; levelIndex < state.rowHeaderDepth; levelIndex++) {
        const header = gridElement(document, virtual ? 'div' : 'th', 'ag-data-grid__header-cell ag-data-grid__row-header');
        header.textContent = level === depth - 1 ? `Группа ${levelIndex + 1}` : '';
        header.setAttribute('role', 'columnheader'); header.dataset.headerLevel = String(levelIndex);
        if (virtual) { header.style.width = '100px'; header.style.insetInlineStart = `${state.utilityWidth + levelIndex * 100 + (state.stickyRowHeaders ? state.scrollLeft : 0)}px`; }
        if (!virtual && state.stickyRowHeaders) { header.style.position = 'sticky'; header.style.insetInlineStart = `${state.utilityWidth + levelIndex * 100}px`; }
        row.append(header);
      }
      for (let index = 0; index < state.entries.length; index++) {
        const entry = state.entries[index];
        const path = paths[index];
        const text = level === depth - 1 ? path[path.length - 1] : path.slice(0, -1)[level] ?? '';
        const cell = gridElement(document, virtual ? 'div' : 'th', 'ag-data-grid__header-cell');
        cell.dataset.columnId = entry.column.id;
        if (virtual) { cell.setAttribute('role', 'columnheader'); cell.setAttribute('aria-colindex', String(entry.visibleIndex + state.rowHeaderDepth + (state.utilityWidth ? 1 : 0) + 1)); }
        else cell.scope = 'col';
        position(cell, entry, state);
        if (level === depth - 1) {
          const button = gridElement(document, 'button', 'ag-data-grid__sort', text);
          button.type = 'button'; button.dataset.sortId = entry.column.id;
          button.disabled = !state.sortable || entry.column.sortable === false;
          button.title = `${text}: сортировка; Alt+стрелки — порядок, Shift+стрелки — ширина`;
          cell.append(button);
          const sort = state.query.sort[0];
          cell.setAttribute('aria-sort', sort?.columnId === entry.column.id ? sort.direction : 'none');
          if (state.resizable) {
            const handle = gridElement(document, 'span', 'ag-data-grid__resize');
            handle.dataset.resizeId = entry.column.id; handle.setAttribute('aria-hidden', 'true'); cell.append(handle);
          }
          if (state.reorder) { button.draggable = true; button.dataset.dragId = entry.column.id; }
        } else {
          cell.textContent = text;
          // A group spans consecutive columns only; repeated nonadjacent paths stay distinct.
          let span = 1;
          while (index + span < paths.length && state.entries[index + span].visibleIndex === entry.visibleIndex + span && state.entries[index + span].frozen === entry.frozen && paths[index + span].slice(0, level + 1).join('\u0000') === path.slice(0, level + 1).join('\u0000')) span++;
          let width = entry.width;
          for (let offset = 1; offset < span; offset++) width += state.entries[index + offset].width;
          cell.style.width = `${width}px`;
          if (virtual) cell.setAttribute('aria-colspan', String(span)); else cell.colSpan = span;
          index += span - 1;
        }
        row.append(cell);
      }
      head.append(row);
    }
    if (focusedHeader) for (const button of head.querySelectorAll('[data-sort-id]')) if (button.dataset.sortId === focusedHeader) { button.focus({ preventScroll: true }); break; }
  }
  /** Recycle visible slots while preserving logical cell and built-in control focus. */
  function render(state) {
    if (!alive) return;
    rowHeight = state.rowHeight;
    const focused = document.activeElement;
    const focusedCell = focused?.closest?.('.ag-data-grid__cell[data-column-id]');
    const focusIdentity = focusedCell && body.contains(focusedCell) ? { rowId: focusedCell.closest('[data-row-id]').dataset.rowId, columnId: focusedCell.dataset.columnId } : null;
    const bodyHadFocus = body.contains(focused);
    let controlIdentity = null;
    if (bodyHadFocus && !focusIdentity) for (const attribute of ['data-select-id', 'data-details-id', 'data-actions-row-id', 'data-action-id']) {
      if (focused.hasAttribute(attribute)) { controlIdentity = { attribute, value: focused.getAttribute(attribute), rowId: focused.closest('[data-row-id]')?.dataset.rowId }; break; }
    }
    cleanupContent();
    if (formatterColumns !== state.columns) {
      formatters.clear(); formatterColumns = state.columns;
      for (const column of state.columns) {
        const format = column.format ?? column.type;
        try {
          if (format === 'number') formatters.set(column.id, new Intl.NumberFormat(locale, column.formatOptions));
          if (format === 'date' || format === 'datetime') formatters.set(column.id, new Intl.DateTimeFormat(locale, column.formatOptions ?? (format === 'datetime' ? { dateStyle: 'short', timeStyle: 'short' } : {})));
        } catch { /* Invalid formatting falls back to a scalar string. */ }
      }
    }
    const headerHeight = state.headerDepth * rowHeight;
    grid.setAttribute('aria-rowcount', String(state.result.num_rows + state.headerDepth));
    grid.setAttribute('aria-colcount', String(state.layout.entries.length + state.rowHeaderDepth + (state.utilityWidth ? 1 : 0)));
    grid.style.width = `${Math.max(state.viewportWidth, state.layout.totalWidth + state.utilityWidth + state.rowHeaderWidth)}px`;
    if (virtual) {
      surface.style.height = `${state.geometry.surfaceHeight}px`;
      surface.style.width = grid.style.width;
      head.style.transform = `translateY(${state.scrollTop}px)`;
      head.style.height = `${headerHeight}px`;
    }
    renderHeader(state);
    const length = state.result.rowIds.length;
    while (rowSlots.length > length) rowSlots.pop().element.remove();
    for (let index = 0; index < length; index++) {
      if (!alive || !state.isCurrent()) return;
      let slot = rowSlots[index];
      if (!slot) {
        const element = gridElement(document, virtual ? 'div' : 'tr', 'ag-data-grid__row');
        if (virtual) element.setAttribute('role', 'row');
        slot = { element, cells: [] }; rowSlots.push(slot); body.append(element);
      }
      const rowId = state.result.rowIds[index], rowIndex = state.request.y0 + index;
      const row = state.rows[index];
      slot.element.dataset.rowId = rowId;
      slot.element.setAttribute('aria-rowindex', String(rowIndex + state.headerDepth + 1));
      slot.element.setAttribute('aria-selected', String(state.selected(rowId)));
      if (virtual) {
        slot.element.style.height = `${rowHeight}px`;
        slot.element.style.top = `${headerHeight + state.scrollTop + (rowIndex - state.geometry.logicalPosition) * rowHeight}px`;
      }
      const descriptors = [];
      if (state.utilityWidth) descriptors.push({ kind: 'utility' });
      for (let level = 0; level < state.rowHeaderDepth; level++) descriptors.push({ kind: 'rowHeader', level });
      for (let column = 0; column < state.entries.length; column++) descriptors.push({ kind: 'data', entry: state.entries[column], offset: column });
      while (slot.cells.length > descriptors.length) slot.cells.pop().remove();
      for (let cellIndex = 0; cellIndex < descriptors.length; cellIndex++) {
        const descriptor = descriptors[cellIndex];
        if (!alive || !state.isCurrent()) return;
        let cell = slot.cells[cellIndex];
        if (!cell) { cell = gridElement(document, virtual ? 'div' : 'td', ''); slot.cells.push(cell); slot.element.append(cell); }
        cell.replaceChildren(); cell.removeAttribute('data-editable'); cell.removeAttribute('title'); cell.removeAttribute('data-column-id'); cell.removeAttribute('data-column-index');
        cell.removeAttribute('data-row-index'); cell.removeAttribute('aria-readonly'); cell.removeAttribute('aria-label'); cell.removeAttribute('aria-rowspan');
        cell.hidden = false; cell.removeAttribute('rowspan');
        cell.className = 'ag-data-grid__cell'; cell.style.cssText = ''; cell.tabIndex = -1;
        cell.setAttribute('role', descriptor.kind === 'rowHeader' ? 'rowheader' : 'gridcell');
        cell.setAttribute('aria-colindex', String(cellIndex + 1));
        if (descriptor.kind === 'utility') {
          cell.classList.add('ag-data-grid__utility');
          if (virtual) cell.style.insetInlineStart = `${state.stickyUtility ? state.scrollLeft : 0}px`;
          else if (!state.stickyUtility) cell.style.position = 'static';
          if (state.selectable) {
            const checkbox = document.createElement('input'); checkbox.type = state.singleSelect ? 'radio' : 'checkbox';
            checkbox.checked = state.selected(rowId); checkbox.disabled = row.disabled;
            checkbox.dataset.selectId = rowId; checkbox.setAttribute('aria-label', `Выбрать: ${row.label ?? rowId}`); cell.append(checkbox);
          }
          if (state.hasDetails) { const button = gridElement(document, 'button', 'ag-data-grid__icon', '⋯'); button.type = 'button'; button.dataset.detailsId = rowId; button.setAttribute('aria-label', `Подробности: ${row.label ?? rowId}`); cell.append(button); }
          if (state.actions.length) {
            if (state.collapseActions || virtual || state.actions.length > 1) {
              const button = gridElement(document, 'button', 'ag-data-grid__icon', '⋮'); button.type = 'button'; button.dataset.actionsRowId = rowId;
              button.setAttribute('aria-label', `Действия: ${row.label ?? rowId}`); cell.append(button);
            } else for (const action of state.actions) {
              if (row.actions && !row.actions.includes(action.id)) continue;
              const button = gridElement(document, 'button', 'ag-data-grid__action', action.label); button.type = 'button'; button.dataset.actionId = action.id; button.dataset.actionRowId = rowId;
              button.disabled = row.disabled || (typeof action.disabled === 'function' ? Boolean(action.disabled(row)) : Boolean(action.disabled)); cell.append(button);
            }
          }
        } else if (descriptor.kind === 'rowHeader') {
          const text = state.result.row_headers?.[index]?.[descriptor.level] ?? '';
          cell.textContent = text; cell.classList.add('ag-data-grid__row-header');
          const prefix = state.result.row_headers[index].slice(0, descriptor.level + 1).join('\u0000');
          const previousPrefix = index ? state.result.row_headers[index - 1].slice(0, descriptor.level + 1).join('\u0000') : null;
          if (previousPrefix === prefix) cell.hidden = true;
          else {
            let span = 1;
            while (index + span < length && state.result.row_headers[index + span].slice(0, descriptor.level + 1).join('\u0000') === prefix) span++;
            if (virtual) { cell.setAttribute('aria-rowspan', String(span)); cell.style.height = `${span * rowHeight}px`; }
            else { cell.rowSpan = span; cell.setAttribute('aria-rowspan', String(span)); }
          }
          if (virtual) { cell.style.insetInlineStart = `${state.utilityWidth + descriptor.level * 100 + (state.stickyRowHeaders ? state.scrollLeft : 0)}px`; cell.style.width = '100px'; }
          else if (state.stickyRowHeaders) { cell.style.position = 'sticky'; cell.style.insetInlineStart = `${state.utilityWidth + descriptor.level * 100}px`; }
        } else {
          const { entry, offset } = descriptor, column = entry.column, value = state.result.data[offset][index];
          position(cell, entry, state); cell.style.textAlign = column.align ?? 'start';
          cell.dataset.columnId = column.id; cell.dataset.columnIndex = String(entry.sourceIndex); cell.dataset.rowIndex = String(rowIndex);
          cell.setAttribute('aria-colindex', String(entry.visibleIndex + state.rowHeaderDepth + (state.utilityWidth ? 1 : 0) + 1));
          const displayText = formatted(value, column); cell.title = displayText;
          if (column.wrap && !virtual) cell.classList.add('is-wrapped');
          if (column.editable) { cell.dataset.editable = 'true'; cell.setAttribute('aria-readonly', 'false'); } else { delete cell.dataset.editable; cell.setAttribute('aria-readonly', 'true'); }
          if (column.renderCell) mountGridContent(cell, column.renderCell(Object.freeze({ value, rowId, columnId: column.id, rowIndex, columnIndex: entry.sourceIndex, row })), cleanups);
          else cell.textContent = displayText;
          if (active?.rowId === rowId && active.columnId === column.id) cell.tabIndex = 0;
        }
      }
    }
    if (!alive || !state.isCurrent()) return;
    if (bodyHadFocus) {
      let target = null;
      if (focusIdentity) for (const cell of body.querySelectorAll('.ag-data-grid__cell[data-column-id]')) if (cell.dataset.columnId === focusIdentity.columnId && cell.closest('[data-row-id]').dataset.rowId === focusIdentity.rowId) { target = cell; break; }
      if (controlIdentity) for (const control of body.querySelectorAll(`[${controlIdentity.attribute}]`)) if (control.getAttribute(controlIdentity.attribute) === controlIdentity.value && control.closest('[data-row-id]')?.dataset.rowId === controlIdentity.rowId) { target = control; break; }
      if (target) target.focus({ preventScroll: true }); else viewport.focus({ preventScroll: true });
    }
    if (!body.querySelector('.ag-data-grid__cell[tabindex="0"]')) {
      const first = body.querySelector('.ag-data-grid__cell[data-column-id]');
      if (first) { first.tabIndex = 0; active = { rowId: first.closest('[data-row-id]').dataset.rowId, columnId: first.dataset.columnId }; }
    }
  }
  /** Dispatch only built-in controls owned by this grid. */
  function click(event) {
    const target = event.target.closest('button,input');
    if (!target || !grid.contains(target)) return;
    if (target.dataset.sortId) onSort(target.dataset.sortId);
    if (target.dataset.selectId) onSelect(target.dataset.selectId, target.checked);
    if (target.dataset.detailsId) onDetails(target.dataset.detailsId);
    if (target.dataset.actionsRowId) onActions(target.dataset.actionsRowId);
    if (target.dataset.actionId) onAction(target.dataset.actionId, target.dataset.actionRowId);
  }
  /** Keep navigation/commit keys local without hijacking native child controls or IME. */
  function keydown(event) {
    const header = event.target.closest('[data-sort-id]');
    if (header && onHeaderKey(event, header.dataset.sortId)) return;
    const cell = event.target.closest('.ag-data-grid__cell[data-column-id]');
    if (!cell || event.target !== cell || event.isComposing) return;
    const rowId = cell.closest('[data-row-id]').dataset.rowId;
    if ((event.key === 'Enter' || event.key === 'F2') && cell.dataset.editable) { event.preventDefault(); onEdit(rowId, cell.dataset.columnId); return; }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
      event.preventDefault(); onNavigate(event, Number(cell.dataset.rowIndex), cell.dataset.columnId);
    }
  }
  /** Maintain a single roving data-cell tab stop by stable identity. */
  function focusin(event) {
    const cell = event.target.closest('.ag-data-grid__cell[data-column-id]');
    if (!cell) return;
    for (const previous of body.querySelectorAll('[tabindex="0"]')) previous.tabIndex = -1;
    cell.tabIndex = 0; active = { rowId: cell.closest('[data-row-id]').dataset.rowId, columnId: cell.dataset.columnId };
  }
  /** Offer pointer edit and sample-width reset on explicit targets. */
  function dblclick(event) {
    const handle = event.target.closest('[data-resize-id]');
    if (handle) { onResize(handle.dataset.resizeId, null); return; }
    const cell = event.target.closest('.ag-data-grid__cell[data-editable]');
    if (cell) onEdit(cell.closest('[data-row-id]').dataset.rowId, cell.dataset.columnId);
  }
  function pointerdown(event) { const handle = event.target.closest('[data-resize-id]'); if (handle) onResize(handle.dataset.resizeId, event); }
  let dragged = null;
  function dragstart(event) { const header = event.target.closest('[data-drag-id]'); if (header) { dragged = header.dataset.dragId; event.dataTransfer?.setData('text/plain', dragged); } }
  function dragover(event) { if (dragged && event.target.closest('[data-column-id]')) event.preventDefault(); }
  function drop(event) { const header = event.target.closest('[data-column-id]'); if (header && dragged) { event.preventDefault(); onReorder(dragged, header.dataset.columnId); } dragged = null; }
  const listeners = { click, keydown, focusin, dblclick, pointerdown, dragstart, dragover, drop, dragend: () => { dragged = null; } };
  for (const [type, listener] of Object.entries(listeners)) grid.addEventListener(type, listener);
  return {
    render,
    /** Invalidate bounded formatter caches; projection and row identities stay unchanged. */
    setLocale(next,labels){if(next===locale&&labels.yes===booleanLabels.yes&&labels.no===booleanLabels.no)return false;locale=next;booleanLabels=labels;formatterColumns=null;return true;},
    focus(rowId, columnId) {
      for (const cell of body.querySelectorAll('.ag-data-grid__cell[data-column-id]')) if (cell.dataset.columnId === columnId && cell.closest('[data-row-id]').dataset.rowId === rowId) { cell.tabIndex = 0; cell.focus({ preventScroll: true }); return true; }
      return false;
    },
    get renderedCells() { return body.querySelectorAll('.ag-data-grid__cell[data-column-id]').length; },
    dispose() { alive = false; cleanupContent(); body.replaceChildren(); rowSlots = []; formatters.clear(); formatterColumns = null; for (const [type, listener] of Object.entries(listeners)) grid.removeEventListener(type, listener); surface.remove(); }
  };
}

/** Validation and immutable snapshots shared by the grid and its local provider. */
export const GRID_LIMITS = Object.freeze({ columns: 1000, rows: 100000, cells: 1000000, text: 4096, selection: 10000, windowCells: 16384, logicalRows: 1000000000 });
export const FILTER_OPERATORS = Object.freeze(['eq', 'neq', 'contains', 'notContains', 'startsWith', 'notStartsWith', 'endsWith', 'notEndsWith', 'lt', 'lte', 'gt', 'gte', 'between', 'in', 'empty', 'notEmpty']);
export function gridText(value, name = 'text', limit = GRID_LIMITS.text) {
  if (typeof value !== 'string' || value.length > limit) throw new TypeError(`${name}: expected a bounded string`);
  return value;
}
export function gridInteger(value, min, max, name) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new RangeError(`${name}: ${min}–${max}`);
  return value;
}
export function gridScalar(value) {
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return gridText(value, 'cell');
}
export function freezeRow(row, columns) {
  if (!row || typeof row !== 'object') throw new TypeError('row');
  const id = gridText(row.id, 'row.id', 256);
  if (!id || !row.cells || typeof row.cells !== 'object') throw new TypeError('row identity/cells');
  const cells = Object.create(null);
  for (const column of columns) cells[column.id] = gridScalar(row.cells[column.id] ?? null);
  const result = { id, cells: Object.freeze(cells), disabled: Boolean(row.disabled) };
  if (row.label !== undefined) result.label = gridText(row.label, 'row.label');
  if (row.actions !== undefined) {
    if (!Array.isArray(row.actions) || row.actions.length > 64) throw new TypeError('row.actions');
    result.actions = Object.freeze(row.actions.map(id => gridText(id, 'action.id', 256)));
  }
  return Object.freeze(result);
}
/** Copy schemas atomically, so host mutations cannot alter a pending request. */
export function validateColumns(columns, defaultWidth = 120) {
  if (!Array.isArray(columns) || !columns.length || columns.length > GRID_LIMITS.columns) throw new RangeError('columns: 1–1000');
  const ids = new Set();
  const result = [];
  for (const column of columns) {
    const id = gridText(column?.id, 'column.id', 256);
    if (!id || ids.has(id)) throw new TypeError('column ids must be unique');
    ids.add(id);
    const minWidth = gridInteger(column.minWidth ?? 48, 32, 2000, 'minWidth');
    const maxWidth = gridInteger(column.maxWidth ?? 2000, minWidth, 2000, 'maxWidth');
    const width = gridInteger(column.width ?? Math.max(minWidth, Math.min(maxWidth, defaultWidth)), minWidth, maxWidth, 'width');
    const group = column.group ?? [];
    if (!Array.isArray(group) || group.length > 4) throw new TypeError('column.group');
    const copy = { ...column, id, label: gridText(column.label, 'column.label'), width, minWidth, maxWidth,
      hidden: Boolean(column.hidden), group: Object.freeze(group.map(v => gridText(v, 'group', 256))) };
    if (copy.type && !['text', 'number', 'boolean', 'date', 'datetime'].includes(copy.type)) throw new TypeError('column.type');
    if (copy.align && !['start', 'center', 'end'].includes(copy.align)) throw new TypeError('column.align');
    for (const key of ['renderCell', 'validate']) if (copy[key] !== undefined && typeof copy[key] !== 'function') throw new TypeError(key);
    if (copy.filter) {
      const filter = { ...copy.filter };
      if (!['text', 'number', 'date', 'boolean', 'select'].includes(filter.type)) throw new TypeError('filter.type');
      if (filter.options) {
        if (!Array.isArray(filter.options) || filter.options.length > 500) throw new RangeError('filter.options');
        filter.options = Object.freeze(filter.options.map(item => Object.freeze({ value: gridScalar(item.value), label: gridText(item.label) })));
      }
      copy.filter = Object.freeze(filter);
    }
    if (copy.formatOptions) copy.formatOptions = Object.freeze({ ...copy.formatOptions });
    result.push(Object.freeze(copy));
  }
  if (result.every(column => column.hidden)) throw new TypeError('at least one visible column is required');
  return Object.freeze(result);
}
export function validateRows(rows, columns) {
  if (!Array.isArray(rows) || rows.length > GRID_LIMITS.rows || rows.length * columns.length > GRID_LIMITS.cells) throw new RangeError('local rows/cells budget');
  const ids = new Set();
  const result = [];
  for (const row of rows) {
    const copy = freezeRow(row, columns);
    if (ids.has(copy.id)) throw new TypeError('duplicate row.id');
    ids.add(copy.id);
    result.push(copy);
  }
  return Object.freeze(result);
}
/** Validate the whole query before replacing any visible state. Only the first sort is applied locally. */
export function validateQuery(input, columns, previous = { page: 0, pageSize: 25, search: '', sort: [], filters: {} }) {
  if (!input || typeof input !== 'object') throw new TypeError('query');
  const query = { ...previous, ...input };
  gridInteger(query.page, 0, GRID_LIMITS.logicalRows, 'page');
  gridInteger(query.pageSize, 1, 500, 'pageSize');
  gridText(query.search, 'search', 1024);
  const ids = new Set(columns.map(column => column.id));
  if (!Array.isArray(query.sort) || query.sort.length > 1) throw new TypeError('one sort at a time');
  const sort = [];
  for (const item of query.sort) {
    if (!item || !ids.has(item.columnId) || !['ascending', 'descending'].includes(item.direction)) throw new TypeError('sort');
    sort.push(Object.freeze({ columnId: item.columnId, direction: item.direction }));
  }
  if (!query.filters || typeof query.filters !== 'object' || Array.isArray(query.filters) || Object.keys(query.filters).length > columns.length) throw new TypeError('filters');
  const filters = Object.create(null);
  for (const [id, filter] of Object.entries(query.filters)) {
    if (!ids.has(id) || !filter || !FILTER_OPERATORS.includes(filter.operator)) throw new TypeError('filter');
    let value = filter.value;
    if (Array.isArray(value)) {
      if (value.length > 500) throw new RangeError('filter values');
      value = Object.freeze(value.map(gridScalar));
    } else if (value !== undefined) value = gridScalar(value);
    if (filter.operator === 'between' && (!Array.isArray(value) || value.length !== 2)) throw new TypeError('between requires two values');
    if (filter.operator === 'in' && !Array.isArray(value)) throw new TypeError('in requires values');
    filters[id] = Object.freeze({ operator: filter.operator, value });
  }
  return Object.freeze({ page: query.page, pageSize: query.pageSize, search: query.search, sort: Object.freeze(sort), filters: Object.freeze(filters) });
}
export function validateSelection(value, revision) {
  if (!value || !['explicit', 'all-matching'].includes(value.mode)) throw new TypeError('selection');
  const key = value.mode === 'explicit' ? 'ids' : 'except';
  if (!Array.isArray(value[key]) || value[key].length > GRID_LIMITS.selection) throw new RangeError('selection budget');
  const ids = new Set();
  for (const id of value[key]) ids.add(gridText(id, 'selection.id', 256));
  if (value.mode === 'all-matching' && value.queryRevision !== revision) throw new TypeError('selection queryRevision');
  return Object.freeze(value.mode === 'explicit' ? { mode: value.mode, ids: Object.freeze([...ids]) } : { mode: value.mode, except: Object.freeze([...ids]), queryRevision: revision });
}
export function selectedRow(selection, id) { return selection.mode === 'explicit' ? selection.ids.includes(id) : !selection.except.includes(id); }
/** Provider shape and budgets are checked before any DOM or cache mutation. */
export function validateWindow(result, request, columns, identityRequired) {
  if (!result || typeof result !== 'object') throw new TypeError('window result');
  const count = gridInteger(result.num_rows, 0, GRID_LIMITS.logicalRows, 'num_rows');
  gridInteger(result.num_columns, columns.length, columns.length, 'num_columns');
  const length = Math.max(0, Math.min(request.y1, count) - request.y0);
  if (request.columnIndices.length * length > GRID_LIMITS.windowCells) throw new RangeError('window cell budget');
  if (!Array.isArray(result.data) || result.data.length !== request.columnIndices.length) throw new TypeError('column-major data projection');
  const data = [];
  let bytes = 0;
  for (const values of result.data) {
    if (!Array.isArray(values) || values.length !== length) throw new TypeError('window column length');
    const copy = [];
    for (const value of values) {
      const scalar = gridScalar(value);
      bytes += typeof scalar === 'string' ? scalar.length * 2 : 8;
      if (bytes > 4 * 1024 * 1024) throw new RangeError('window byte budget');
      copy.push(scalar);
    }
    data.push(Object.freeze(copy));
  }
  let rowIds;
  if (result.rowIds !== undefined) {
    if (!Array.isArray(result.rowIds) || result.rowIds.length !== length) throw new TypeError('rowIds');
    rowIds = result.rowIds.map(id => gridText(id, 'rowId', 256));
    if (rowIds.some(id => !id) || new Set(rowIds).size !== length) throw new TypeError('unique rowIds required');
  } else {
    if (identityRequired && length) throw new TypeError('stable rowIds required for selection/edit/actions');
    rowIds = Array.from({ length }, (_, index) => `index:${request.revision}:${request.y0 + index}`);
  }
  for (const id of rowIds) { bytes += id.length * 2; if (bytes > 4 * 1024 * 1024) throw new RangeError('window byte budget'); }
  const readHeaders = (value, expected, label) => {
    if (value === undefined) return undefined;
    if (!Array.isArray(value) || value.length !== expected) throw new TypeError(label);
    return Object.freeze(value.map(path => {
      if (!Array.isArray(path) || path.length > 4) throw new TypeError(label);
      return Object.freeze(path.map(v => { const text = gridText(v, label, 256); bytes += text.length * 2; if (bytes > 4 * 1024 * 1024) throw new RangeError('window byte budget'); return text; }));
    }));
  };
  if (result.rows !== undefined) {
    if (!Array.isArray(result.rows) || result.rows.length !== length) throw new TypeError('window rows');
    for (const row of result.rows) {
      const id = gridText(row?.id, 'row.id', 256); bytes += id.length * 2;
      if (row.label !== undefined) bytes += gridText(row.label, 'row.label').length * 2;
      if (row.actions !== undefined) {
        if (!Array.isArray(row.actions) || row.actions.length > 64) throw new TypeError('row.actions');
        for (const action of row.actions) bytes += gridText(action, 'row.action', 256).length * 2;
      }
      if (bytes > 4 * 1024 * 1024) throw new RangeError('window byte budget');
      for (const column of columns) {
      const value = gridScalar(row?.cells?.[column.id] ?? null);
      bytes += typeof value === 'string' ? value.length * 2 : 8;
      if (bytes > 4 * 1024 * 1024) throw new RangeError('window byte budget');
      }
    }
  }
  const rows = result.rows === undefined ? undefined : validateRows(result.rows, columns);
  if (rows && (rows.length !== length || rows.some((row, index) => row.id !== rowIds[index]))) throw new TypeError('rows identity mismatch');
  if (result.revision !== undefined && result.revision !== request.revision) throw new TypeError('window revision mismatch');
  return Object.freeze({ num_rows: count, num_columns: columns.length, data: Object.freeze(data), rowIds: Object.freeze(rowIds), rows,
    row_headers: readHeaders(result.row_headers, length, 'row_headers'), column_headers: readHeaders(result.column_headers, data.length, 'column_headers') });
}

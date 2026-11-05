import { validateColumns, validateRows, validateQuery, gridScalar, GRID_LIMITS, gridInteger, gridText } from './data-grid-model.js';
/** Accent/case folding matches local text search without modifying source values. */
export function foldGridText(value) { return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
/** Ordered comparisons exclude boolean/null/blank from numeric coercion. */
function numeric(value) { return value !== null && value !== '' && typeof value !== 'boolean' && Number.isFinite(Number(value)); }
const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
function compareValues(left, right, asNumber = numeric(left) && numeric(right)) {
  if (asNumber) return Number(left) - Number(right);
  return collator.compare(String(left ?? ''), String(right));
}
function booleanValue(value) {
  if (typeof value === 'boolean') return value;
  const text = String(value ?? '').trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(text)) return true;
  if (['false', '0', 'no', 'off'].includes(text)) return false;
  return null;
}
/** Compile query operands once, rather than folding constant values for every cell. */
export function compileGridFilter(filter) {
  const operator = filter.operator, value = filter.value;
  if (operator === 'empty') return cell => cell === null || cell === '';
  if (operator === 'notEmpty') return cell => cell !== null && cell !== '';
  if (value === null || value === undefined || value === '' || (operator === 'in' && !value.length)) return () => true;
  const target = foldGridText(value);
  if (operator === 'eq' || operator === 'neq') return cell => {
    const normalized = typeof value === 'boolean' ? booleanValue(cell) : null;
    const equal = typeof value === 'boolean' ? (normalized === null ? String(cell) === String(value) : normalized === value) : foldGridText(cell) === target;
    return operator === 'eq' ? equal : !equal;
  };
  if (operator === 'in') {
    const options = value.map(item => ({ text: foldGridText(item), boolean: booleanValue(item) }));
    return cell => {
      const normalized = booleanValue(cell), text = foldGridText(cell);
      for (const option of options) if (normalized !== null && option.boolean !== null ? normalized === option.boolean : text === option.text) return true;
      return false;
    };
  }
  if (operator === 'between') return cell => {
    const asNumber = numeric(cell) && numeric(value[0]) && numeric(value[1]);
    return compareValues(cell, value[0], asNumber) >= 0 && compareValues(cell, value[1], asNumber) <= 0;
  };
  if (['lt', 'lte', 'gt', 'gte'].includes(operator)) return cell => {
    const comparison = compareValues(cell, value);
    if (operator === 'lt') return comparison < 0;
    if (operator === 'lte') return comparison <= 0;
    if (operator === 'gt') return comparison > 0;
    return comparison >= 0;
  };
  return cell => {
    const text = foldGridText(cell);
    if (operator === 'contains') return text.includes(target);
    if (operator === 'notContains') return !text.includes(target);
    if (operator === 'startsWith') return text.startsWith(target);
    if (operator === 'notStartsWith') return !text.startsWith(target);
    if (operator === 'endsWith') return text.endsWith(target);
    return !text.endsWith(target);
  };
}
export function matchesGridFilter(value, filter) { return compileGridFilter(filter)(value); }
/** Resident arrays are bounded. Query indices are rebuilt only when data/query changes, never per scroll. */
export function createGridArrayDataSource({ columns: initialColumns, rows: initialRows }) {
  let columns = validateColumns(initialColumns);
  let rows = validateRows(initialRows, columns);
  let byId = new Map(rows.map(row => [row.id, row]));
  let indices = null, queryKey = null;
  const invalidate = () => { indices = null; queryKey = null; };
  function project(query) {
    const key = JSON.stringify({ search: query.search, sort: query.sort, filters: query.filters });
    if (indices && key === queryKey) return indices;
    const search = foldGridText(query.search);
    const filters = Object.entries(query.filters).map(([id, filter]) => [id, compileGridFilter(filter)]);
    const next = [];
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      let matches = !search;
      if (search) for (const column of columns) if (foldGridText(row.cells[column.id]).includes(search)) { matches = true; break; }
      if (!matches) continue;
      for (const [id, predicate] of filters) if (!predicate(row.cells[id])) { matches = false; break; }
      if (matches) next.push(index);
    }
    const sort = query.sort[0];
    if (sort) {
      // Capture each source key once; comparison no longer performs repeated dictionary lookups.
      const keys = new Array(rows.length), numbers = new Array(rows.length), texts = new Array(rows.length);
      for (const index of next) {
        const value = rows[index].cells[sort.columnId];
        keys[index] = value;
        numbers[index] = numeric(value) ? Number(value) : NaN;
        texts[index] = String(value ?? '');
      }
      const direction = sort.direction === 'descending' ? -1 : 1;
      next.sort((a, b) => {
        const left = keys[a], right = keys[b];
        const leftEmpty = left === null || left === '', rightEmpty = right === null || right === '';
        if (leftEmpty || rightEmpty) return leftEmpty === rightEmpty ? a - b : leftEmpty ? 1 : -1;
        const difference = Number.isFinite(numbers[a]) && Number.isFinite(numbers[b]) ? numbers[a] - numbers[b] : collator.compare(texts[a], texts[b]);
        return direction * difference || a - b;
      });
    }
    indices = next;
    queryKey = key;
    return indices;
  }
  return {
    get rowCount() { return rows.length; },
    getRow(id) { return byId.get(id) ?? null; },
    setRows(value) {
      const next = validateRows(value, columns);
      rows = next;
      byId = new Map(rows.map(row => [row.id, row]));
      invalidate();
    },
    setColumns(value) { const next = validateColumns(value); const nextRows = validateRows(rows, next); columns = next; rows = nextRows; byId = new Map(rows.map(row => [row.id, row])); invalidate(); },
    /** Replace one confirmed local value while preserving every other stable row identity. */
    updateCell(rowId, columnId, value) {
      gridScalar(value);
      const row = byId.get(rowId);
      if (!row) throw new TypeError('unknown row');
      const replacement = Object.freeze({ ...row, cells: Object.freeze({ ...row.cells, [columnId]: value }) });
      rows = Object.freeze(rows.map(item => item.id === rowId ? replacement : item));
      byId.set(rowId, replacement);
      invalidate();
    },
    getWindow(request, { signal }) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      gridInteger(request.y0, 0, GRID_LIMITS.logicalRows, 'y0');
      gridInteger(request.y1, request.y0, GRID_LIMITS.logicalRows, 'y1');
      if (!Array.isArray(request.columnIndices) || request.columnIndices.length > 128 || request.columnIndices.length * (request.y1 - request.y0) > GRID_LIMITS.windowCells) throw new RangeError('window cell budget');
      for (const index of request.columnIndices) gridInteger(index, 0, columns.length - 1, 'column index');
      const query = validateQuery(request.query, columns);
      const projected = project(query);
      const slice = projected.slice(request.y0, request.y1);
      const selected = slice.map(index => rows[index]);
      const data = [];
      for (const index of request.columnIndices) {
        if (!columns[index]) throw new TypeError('unknown column index');
        data.push(selected.map(row => row.cells[columns[index].id]));
      }
      return { num_rows: projected.length, num_columns: columns.length, data, rowIds: selected.map(row => row.id), rows: selected, revision: request.revision };
    }
  };
}
/** Declarative input is a read-only scalar snapshot: markup, handlers and arbitrary attributes are ignored. */
export function readDataGridTable(table) {
  if (!table || table.tagName !== 'TABLE') throw new TypeError('HTMLTableElement required');
  const nativeHeaders = table.tHead?.rows?.[0]?.cells;
  if (nativeHeaders?.length > GRID_LIMITS.columns) throw new RangeError('columns:1–1000');
  const headers = Array.from(nativeHeaders ?? []);
  if (!headers.length) throw new TypeError('table requires a header');
  const columns = headers.map((cell, index) => ({ id: cell.getAttribute('data-column-id') || `column-${index}`, label: cell.textContent ?? '', type: ['number', 'boolean', 'date', 'datetime'].includes(cell.dataset.type) ? cell.dataset.type : 'text' }));
  const rows = [];
  for (const body of table.tBodies) for (const row of body.rows) {
    if (rows.length >= GRID_LIMITS.rows || (rows.length + 1) * columns.length > GRID_LIMITS.cells) throw new RangeError('local rows/cells budget');
    const cells = Object.create(null);
    columns.forEach((column, index) => {
      const cell = row.cells[index];
      const text = cell?.getAttribute('data-value') ?? cell?.textContent ?? '';
      let value = text;
      if (column.type === 'number' && text.trim() && Number.isFinite(Number(text))) value = Number(text);
      if (column.type === 'boolean' && ['true', 'false'].includes(text)) value = text === 'true';
      cells[column.id] = value;
    });
    rows.push({ id: row.getAttribute('data-row-id') || `row-${rows.length}`, cells });
  }
  return { label: gridText(table.caption?.textContent || table.getAttribute('aria-label') || 'Таблица', 'label', 512), columns: validateColumns(columns), rows: validateRows(rows, columns) };
}

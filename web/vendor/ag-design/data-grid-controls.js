import { FILTER_OPERATORS } from './data-grid-model.js';
import { gridElement } from './data-grid-render.js';
const operatorLabels = ['Равно', 'Не равно', 'Содержит', 'Не содержит', 'Начинается', 'Не начинается', 'Заканчивается', 'Не заканчивается', 'Меньше', 'Не больше', 'Больше', 'Не меньше', 'Между', 'В списке', 'Пусто', 'Не пусто'];
/** Structured controls expose the same query operations to keyboard and pointer users. */
export function createGridControls({ document, root, options, callbacks }) {
  options = { ...options };
  const listeners = [], timers = new Map();
  const labels = options.labels ?? {};
  const text = (key, fallback) => labels[key] ?? fallback;
  const toolbar = gridElement(document, 'div', 'ag-data-grid__toolbar'); toolbar.setAttribute('role', 'group'); toolbar.setAttribute('aria-label', text('controls', 'Управление таблицей'));
  function listen(element, type, callback) { element.addEventListener(type, callback); listeners.push(() => element.removeEventListener(type, callback)); }
  function button(parent, caption, callback) { const element = gridElement(document, 'button', 'ag-data-grid__button', caption); element.type = 'button'; listen(element, 'click', callback); parent.append(element); return element; }
  function field(parent, caption, element) { const label = gridElement(document, 'label', 'ag-data-grid__field'); label.append(gridElement(document, 'span', '', caption), element); parent.append(label); return element; }
  function input(type = 'text') { const element = document.createElement('input'); element.type = type; return element; }
  function select(items) { const element = document.createElement('select'); for (const [value, label] of items) { const option = document.createElement('option'); option.value = value; option.textContent = label; element.append(option); } return element; }
  /** Own at most one timer per input channel and cancel it on disposal. */
  function debounce(key, delay, callback) { clearTimeout(timers.get(key)); timers.set(key, setTimeout(() => { timers.delete(key); callback(); }, delay)); }
  let search = null, composingSearch = false;
  if (options.searchable !== false) {
    search = field(toolbar, text('search', 'Поиск'), input('search')); search.maxLength = 1024; search.placeholder = text('searchPlaceholder', 'Найти в таблице');
    listen(search, 'compositionstart', () => { composingSearch = true; clearTimeout(timers.get('search')); });
    listen(search, 'compositionend', () => { composingSearch = false; debounce('search', options.searchDelay ?? 180, () => callbacks.query({ search: search.value, page: 0 })); });
    listen(search, 'input', event => { if (!composingSearch && !event.isComposing) debounce('search', options.searchDelay ?? 180, () => callbacks.query({ search: search.value, page: 0 })); });
    listen(search, 'keydown', event => { if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); clearTimeout(timers.get('search')); callbacks.query({ search: search.value, page: 0 }); } });
  }
  button(toolbar, text('refresh', 'Обновить'), callbacks.refresh);
  button(toolbar, text('reset', 'Сбросить'), callbacks.reset);
  let filterColumn, operator, filterValue, filterSecond, filterOptions;
  if (options.filterable !== false) {
    const panel = document.createElement('details'); panel.className = 'ag-data-grid__panel'; panel.append(gridElement(document, 'summary', '', text('filters', 'Фильтр')));
    filterColumn = field(panel, 'Колонка', select([]));
    operator = field(panel, 'Условие', select(FILTER_OPERATORS.map((value, index) => [value, operatorLabels[index]])));
    filterValue = field(panel, 'Значение', input()); filterValue.maxLength = 4096;
    filterSecond = field(panel, 'До', input()); filterSecond.maxLength = 4096;
    filterOptions = field(panel, 'Варианты', select([])); filterOptions.multiple = true; filterOptions.size = 4;
    listen(filterColumn, 'change', () => renderFilter()); listen(operator, 'change', () => renderFilter(false));
    const apply = button(panel, text('applyFilter', 'Применить'), () => {
      const column = columns.find(item => item.id === filterColumn.value);
      if (!column) return;
      const choices = column.filter?.options ?? ((column.filter?.type ?? column.type) === 'boolean' ? [{ value: true, label: 'Да' }, { value: false, label: 'Нет' }] : []);
      const parse = value => {
        if (column.filter?.type === 'number' || column.type === 'number') { if (value === '') return ''; const number = Number(value); if (!Number.isFinite(number)) throw new TypeError('Введите число'); return number; }
        if (column.filter?.type === 'boolean' || column.type === 'boolean') return value === '' ? '' : value === 'true';
        return value;
      };
      try {
        let value = parse(filterValue.value);
        if (operator.value === 'between') value = [value, parse(filterSecond.value)];
        if (choices.length && ['eq', 'neq'].includes(operator.value)) value = choices[Number(filterOptions.value)]?.value ?? '';
        if (operator.value === 'in') value = choices.length ? Array.from(filterOptions.selectedOptions, item => choices[Number(item.value)].value) : filterValue.value.split(',').map(item => parse(item.trim()));
        callbacks.filter(column.id, { operator: operator.value, value });
      } catch (error) { callbacks.error(error.message); }
    });
    if (options.filterDelay !== undefined) for (const element of [filterValue, filterSecond, filterOptions]) listen(element, element.tagName === 'SELECT' ? 'change' : 'input', event => { if (!event.isComposing) debounce('filter', options.filterDelay, () => apply.click()); });
    button(panel, 'Очистить фильтр', () => callbacks.filter(filterColumn.value, null));
    toolbar.append(panel);
  }
  const settings = document.createElement('details'); settings.className = 'ag-data-grid__panel'; settings.append(gridElement(document, 'summary', '', text('columns', 'Колонки')));
  const columnSelect = field(settings, 'Колонка', select([]));
  const visible = field(settings, 'Показывать', input('checkbox'));
  const width = field(settings, 'Ширина, px', input('number')); width.min = '32'; width.max = '2000';
  const position = field(settings, 'Позиция', input('number')); position.min = '1';
  const frozen = field(settings, 'Закреплено слева', input('number')); frozen.min = '0';
  listen(columnSelect, 'change', () => renderSettings());
  listen(visible, 'change', () => callbacks.visibility(columnSelect.value, visible.checked));
  listen(width, 'change', () => callbacks.width(columnSelect.value, Number(width.value)));
  listen(position, 'change', () => callbacks.reorder(columnSelect.value, Number(position.value) - 1));
  listen(frozen, 'change', () => callbacks.freeze(Number(frozen.value)));
  button(settings, 'Подобрать ширину', () => callbacks.autosize(columnSelect.value));
  toolbar.append(settings);
  let selectionLabel = null, allButton = null;
  if (options.selectable) {
    selectionLabel = gridElement(document, 'span', 'ag-data-grid__selection-label'); toolbar.append(selectionLabel);
    if (!options.singleSelect) {
      button(toolbar, 'Выбрать видимые', callbacks.selectVisible);
      allButton = button(toolbar, 'Выбрать все найденные', callbacks.selectAll);
    }
    button(toolbar, 'Снять выбор', callbacks.clearSelection);
    for (const action of options.bulkActions ?? []) button(toolbar, action.label, () => callbacks.action(action.id, null));
  }
  const pager = gridElement(document, 'div', 'ag-data-grid__pager'); pager.setAttribute('role', 'group'); pager.setAttribute('aria-label', text('pagination', 'Страницы'));
  const first = button(pager, '«', () => callbacks.page(0)); first.setAttribute('aria-label', 'Первая страница');
  const previous = button(pager, '‹', () => callbacks.page(currentQuery.page - 1)); previous.setAttribute('aria-label', 'Предыдущая страница');
  const pageInput = field(pager, 'Страница', input('number')); pageInput.min = '1';
  listen(pageInput, 'change', () => callbacks.page(Number(pageInput.value) - 1));
  const pageLabel = gridElement(document, 'span', ''); pager.append(pageLabel);
  const next = button(pager, '›', () => callbacks.page(currentQuery.page + 1)); next.setAttribute('aria-label', 'Следующая страница');
  const last = button(pager, '»', () => callbacks.page(pageCount - 1)); last.setAttribute('aria-label', 'Последняя страница');
  const sizes = options.pageSizes ?? [10, 25, 50, 100];
  const pageSize = field(pager, 'Строк на странице', select(sizes.map(value => [String(value), String(value)])));
  listen(pageSize, 'change', () => callbacks.query({ page: 0, pageSize: Number(pageSize.value) }));
  root.append(toolbar);
  let columns = [], viewState, currentQuery = { page: 0 }, pageCount = 1, boundColumns = null, filterKey = null;
  /** Replace schema choices only at explicit schema/filter changes, retaining a valid selection. */
  function replaceOptions(element, entries) {
    const selected = element.value; element.replaceChildren();
    for (const [value, label] of entries) { const option = document.createElement('option'); option.value = value; option.textContent = label; element.append(option); }
    if (entries.some(entry => entry[0] === selected)) element.value = selected;
  }
  /** Show a typed structured operand editor without resetting unapplied values on scroll. */
  function renderFilter(readQuery = true) {
    if (!filterColumn) return;
    const column = columns.find(item => item.id === filterColumn.value);
    if (!column) return;
    if (readQuery) {
      const filter = currentQuery.filters?.[column.id]; operator.value = filter?.operator ?? (column.filter?.multiple ? 'in' : ['select', 'boolean', 'number', 'date'].includes(column.filter?.type ?? column.type) ? 'eq' : 'contains');
      filterValue.value = Array.isArray(filter?.value) ? String(filter.value[0] ?? '') : String(filter?.value ?? '');
      filterSecond.value = Array.isArray(filter?.value) ? String(filter.value[1] ?? '') : '';
    }
    const type = column.filter?.type ?? column.type;
    const choices = column.filter?.options ?? (type === 'boolean' ? [{ value: true, label: 'Да' }, { value: false, label: 'Нет' }] : []);
    const choosing = choices.length > 0 && ['eq', 'neq', 'in'].includes(operator.value);
    filterValue.type = type === 'number' ? 'number' : type === 'date' ? 'date' : 'text';
    filterValue.placeholder = column.filter?.placeholder ?? (type === 'boolean' ? 'true / false' : '');
    filterSecond.type = filterValue.type;
    filterValue.parentElement.hidden = ['empty', 'notEmpty'].includes(operator.value) || choosing;
    filterSecond.parentElement.hidden = operator.value !== 'between';
    filterOptions.parentElement.hidden = !choosing;
    filterOptions.multiple = operator.value === 'in'; filterOptions.size = filterOptions.multiple ? Math.min(4, choices.length) : 1;
    replaceOptions(filterOptions, choices.map((item, index) => [String(index), item.label]));
    const selected = currentQuery.filters?.[column.id]?.value;
    if (readQuery) for (const option of filterOptions.options) option.selected = Array.isArray(selected) ? selected.includes(choices[Number(option.value)].value) : selected === choices[Number(option.value)].value;
  }
  /** Sync column preferences while preserving text in the active numeric editor. */
  function renderSettings() {
    const column = columns.find(item => item.id === columnSelect.value);
    const state = viewState?.columns.find(item => item.id === columnSelect.value);
    if (!state) return;
    visible.checked = !state.hidden; if (document.activeElement !== width) width.value = String(state.width); width.min = String(column.minWidth); width.max = String(column.maxWidth);
    if (document.activeElement !== position) position.value = String(viewState.columnIds.indexOf(column.id) + 1); position.max = String(columns.length);
    if (document.activeElement !== frozen) frozen.value = String(viewState.frozenStart); frozen.max = String(columns.length);
    width.disabled = options.resizable === false; position.disabled = options.reorder === false;
  }
  return {
    toolbar, pager,
    update(state) {
      columns = state.columns; viewState = state.viewState; currentQuery = state.query;
      if (search && document.activeElement !== search) search.value = state.query.search;
      const schemaChanged = boundColumns !== columns;
      if (schemaChanged) {
        boundColumns = columns;
        const entries = columns.map(column => [column.id, column.label]);
        replaceOptions(columnSelect, entries);
        if (filterColumn) replaceOptions(filterColumn, entries);
      }
      renderSettings();
      const nextFilterKey = JSON.stringify(state.query.filters);
      if (schemaChanged || nextFilterKey !== filterKey) { filterKey = nextFilterKey; renderFilter(); }
      pageCount = Math.max(1, Math.ceil(state.total / state.query.pageSize)); pageInput.value = String(state.query.page + 1); pageInput.max = String(pageCount);
      pageLabel.textContent = `из ${pageCount} · ${state.total} строк`;
      if (!Array.from(pageSize.options).some(option => option.value === String(state.query.pageSize))) { const option = document.createElement('option'); option.value = String(state.query.pageSize); option.textContent = option.value; pageSize.append(option); }
      pageSize.value = String(state.query.pageSize);
      first.disabled = previous.disabled = state.query.page <= 0; next.disabled = last.disabled = state.query.page >= pageCount - 1;
      pager.hidden = options.mode !== 'paged';
      if (selectionLabel) selectionLabel.textContent = state.selection.mode === 'explicit' ? `Выбрано: ${state.selection.ids.length}` : `Все найденные, исключено: ${state.selection.except.length}`;
      if (allButton) allButton.disabled = !state.total;
    },
    dispose() { for (const remove of listeners) remove(); listeners.length = 0; for (const timer of timers.values()) clearTimeout(timer); timers.clear(); columns = []; boundColumns = null; viewState = null; currentQuery = null; callbacks = {}; options = {}; toolbar.remove(); pager.remove(); }
  };
}

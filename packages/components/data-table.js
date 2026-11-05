let sequence = 0;
const ROW_LIMIT = 1000,
  COLUMN_LIMIT = 32;
const identifier = (value) =>
  typeof value === "string" && /^[A-Za-z0-9_.:-]{1,80}$/.test(value);

/** Require bounded literal text; field contents and callback exceptions never become HTML. */
function text(value, maximum = 180) {
  if (typeof value !== "string" || !value.trim() || value.length > maximum)
    throw new TypeError("Bounded non-empty text required");
  return value;
}

/** Validate all rows before replacing the current body; table data stays scalar and host-owned. */
function rowsValue(rows, columns) {
  if (!Array.isArray(rows) || rows.length > ROW_LIMIT)
    throw new TypeError("At most 1000 rows are supported");
  const ids = new Set(),
    result = [];
  for (const row of rows) {
    if (
      !row ||
      !identifier(row.id) ||
      ids.has(row.id) ||
      typeof row.cells !== "object" ||
      !row.cells ||
      Array.isArray(row.cells) ||
      (row.disabled !== undefined && typeof row.disabled !== "boolean") ||
      (row.label !== undefined &&
        (typeof row.label !== "string" ||
          !row.label.trim() ||
          row.label.length > 180))
    )
      throw new TypeError("Rows require unique IDs and scalar cells");
    ids.add(row.id);
    const cells = {};
    for (const column of columns) {
      const value = row.cells[column.id] ?? null;
      if (
        !(
          value === null ||
          typeof value === "boolean" ||
          (typeof value === "string" && value.length <= 4096) ||
          (typeof value === "number" && Number.isFinite(value))
        )
      )
        throw new TypeError("Cells must be finite scalar values");
      cells[column.id] = value;
    }
    result.push({
      id: row.id,
      cells,
      label: row.label,
      disabled: row.disabled === true,
    });
  }
  return result;
}

/** Display bounded native tabular data. Sort/page callbacks request host actions; rows are never implicitly sorted or fetched. */
export function createDataTable({
  document = globalThis.document,
  caption,
  columns,
  rows = [],
  sort = null,
  selectedIds = [],
  selectable = false,
  status = "ready",
  message = "",
  page = null,
  onSort,
  onSelectionChange,
  onPageChange,
} = {}) {
  text(caption);
  if (
    !Array.isArray(columns) ||
    !columns.length ||
    columns.length > COLUMN_LIMIT ||
    typeof selectable !== "boolean"
  )
    throw new TypeError("A table requires 1–32 columns and boolean selection");
  for (const callback of [onSort, onSelectionChange, onPageChange])
    if (callback !== undefined && typeof callback !== "function")
      throw new TypeError("Callbacks must be functions");
  const columnIds = new Set();
  const definitions = columns.map((column) => {
    if (
      !column ||
      !identifier(column.id) ||
      columnIds.has(column.id) ||
      (column.sortable !== undefined && typeof column.sortable !== "boolean") ||
      (column.render !== undefined && typeof column.render !== "function")
    )
      throw new TypeError("Columns require unique IDs and optional callbacks");
    columnIds.add(column.id);
    text(column.label);
    if (
      column.align !== undefined &&
      !["start", "center", "end"].includes(column.align)
    )
      throw new TypeError("Unsupported cell alignment");
    return { ...column };
  });
  const abort = new document.defaultView.AbortController(),
    listeners = { signal: abort.signal };
  const element = document.createElement("section"),
    scroll = document.createElement("div"),
    table = document.createElement("table");
  element.className = "ag-data-table";
  scroll.className = "ag-data-table__scroll";
  scroll.tabIndex = 0;
  scroll.setAttribute("role", "region");
  const captionNode = document.createElement("caption");
  captionNode.id = `ag-data-table-${++sequence}`;
  captionNode.textContent = caption;
  scroll.setAttribute("aria-labelledby", captionNode.id);
  const head = document.createElement("thead"),
    headerRow = document.createElement("tr"),
    body = document.createElement("tbody");
  const headers = new Map(),
    headerButtons = new Map(),
    sortMarks = new Map();
  const announcement = document.createElement("p");
  announcement.className = "ag-data-table__status";
  announcement.setAttribute("role", "status");
  const pager = document.createElement("nav");
  pager.className = "ag-data-table__pager";
  pager.setAttribute("aria-label", "Страницы таблицы");
  const previous = document.createElement("button"),
    next = document.createElement("button"),
    pageText = document.createElement("span");
  for (const button of [previous, next]) {
    button.type = "button";
    button.className = "ag-button ag-button--quiet";
  }
  previous.textContent = "Предыдущая";
  next.textContent = "Следующая";
  pager.append(previous, pageText, next);
  let currentRows = rowsValue(rows, definitions),
    currentSort = null,
    selected = new Set(),
    currentStatus = "ready",
    currentMessage = "",
    currentPage = null,
    disposed = false;
  let bodyRows = new Map(),
    rowBoxes = new Map();
  let allBox = null;
  if (selectable) {
    const th = document.createElement("th");
    th.scope = "col";
    allBox = document.createElement("input");
    allBox.type = "checkbox";
    allBox.setAttribute("aria-label", "Выбрать все доступные строки страницы");
    const target = document.createElement("label");
    target.className = "ag-data-table__selection-target";
    target.append(allBox);
    th.append(target);
    headerRow.append(th);
  }
  for (const column of definitions) {
    const th = document.createElement("th");
    th.scope = "col";
    th.dataset.columnId = column.id;
    th.style.textAlign = column.align || "start";
    headers.set(column.id, th);
    if (column.sortable) {
      const button = document.createElement("button"),
        label = document.createElement("span"),
        mark = document.createElement("span");
      button.type = "button";
      button.className = "ag-data-table__sort";
      button.disabled = !onSort;
      button.setAttribute("aria-label", `Сортировать: ${column.label}`);
      label.textContent = column.label;
      mark.setAttribute("aria-hidden", "true");
      button.append(label, mark);
      th.append(button);
      sortMarks.set(column.id, mark);
      headerButtons.set(column.id, button);
      button.addEventListener(
        "click",
        () => {
          if (disposed || button.disabled) return;
          const direction =
            currentSort?.columnId !== column.id
              ? "ascending"
              : currentSort.direction === "ascending"
                ? "descending"
                : null;
          onSort?.(direction ? { columnId: column.id, direction } : null);
        },
        listeners,
      );
    } else th.textContent = column.label;
    headerRow.append(th);
  }
  head.append(headerRow);
  table.append(captionNode, head, body);
  scroll.append(table);
  element.append(scroll, announcement, pager);

  /** Selection setters are silent; native checkbox actions update immediately and notify the host with a fresh array. */
  function selectionValue(ids, candidateRows = currentRows) {
    if (!Array.isArray(ids) || ids.length > ROW_LIMIT)
      throw new TypeError("Selection must be a bounded ID list");
    const eligible = new Set(
        candidateRows.filter((row) => !row.disabled).map((row) => row.id),
      ),
      result = new Set();
    for (const id of ids) {
      if (!selectable || !eligible.has(id) || result.has(id))
        throw new TypeError("Select distinct enabled rows on this page");
      result.add(id);
    }
    return result;
  }
  /** Keep native mixed-checkbox state correct without replacing a focused input. */
  function updateSelection() {
    for (const [id, checkbox] of rowBoxes) checkbox.checked = selected.has(id);
    if (allBox) {
      const enabled = currentRows.filter((row) => !row.disabled),
        count = enabled.filter((row) => selected.has(row.id)).length;
      allBox.checked = enabled.length > 0 && count === enabled.length;
      allBox.indeterminate = count > 0 && count < enabled.length;
      allBox.disabled = enabled.length === 0 || currentStatus !== "ready";
    }
  }
  /** Allow trusted host renderers to supply fresh local elements, while ordinary values always use textContent. */
  function cellContent(cell, value) {
    if (value?.nodeType === 1) {
      if (value.ownerDocument !== document || value.parentNode)
        throw new TypeError(
          "Cell renderers must return a detached local element",
        );
      cell.append(value);
    } else {
      if (
        !(
          value == null ||
          typeof value === "boolean" ||
          (typeof value === "string" && value.length <= 4096) ||
          (typeof value === "number" && Number.isFinite(value))
        )
      )
        throw new TypeError(
          "Cell renderers return a scalar or detached local element",
        );
      cell.textContent = value == null ? "—" : String(value);
    }
  }
  /** Construct a replacement body before committing it, so malformed input cannot erase the old table. */
  function buildBody(candidateRows, candidateStatus) {
    const fragment = document.createDocumentFragment(),
      rowsMap = new Map(),
      boxes = new Map();
    if (candidateStatus !== "ready" || !candidateRows.length) {
      const row = document.createElement("tr"),
        cell = document.createElement("td");
      cell.colSpan = definitions.length + Number(selectable);
      cell.className = "ag-data-table__empty";
      cell.textContent =
        candidateStatus === "loading"
          ? "Загрузка данных…"
          : candidateStatus === "error"
            ? "Не удалось загрузить данные"
            : "Нет данных";
      row.append(cell);
      fragment.append(row);
    } else
      for (const row of candidateRows) {
        const tr = document.createElement("tr");
        tr.dataset.rowId = row.id;
        if (selectable) {
          const td = document.createElement("td"),
            checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.disabled = row.disabled;
          const firstValue = row.cells[definitions[0].id],
            rowLabel =
              row.label ||
              (typeof firstValue === "string" && firstValue.trim()
                ? firstValue.slice(0, 180)
                : row.id);
          checkbox.setAttribute("aria-label", `Выбрать строку: ${rowLabel}`);
          checkbox.dataset.rowSelect = row.id;
          boxes.set(row.id, checkbox);
          const target = document.createElement("label");
          target.className = "ag-data-table__selection-target";
          target.append(checkbox);
          td.append(target);
          tr.append(td);
        }
        for (const column of definitions) {
          const td = document.createElement("td");
          td.dataset.columnId = column.id;
          td.dataset.align = column.align || "start";
          td.style.textAlign = column.align || "start";
          cellContent(
            td,
            column.render ? column.render(row) : row.cells[column.id],
          );
          tr.append(td);
        }
        rowsMap.set(row.id, tr);
        fragment.append(tr);
      }
    return { fragment, rowsMap, boxes };
  }
  /** Preserve body focus by stable row/column identity; header controls are never remounted by data updates. */
  function commitBody(candidateRows, candidateStatus) {
    const active = document.activeElement,
      focusedRow = body.contains(active)
        ? active.closest("[data-row-id]")?.dataset.rowId
        : null;
    const focusedColumn = focusedRow
      ? active.closest("[data-column-id]")?.dataset.columnId
      : null;
    const replacement = buildBody(candidateRows, candidateStatus);
    body.replaceChildren(replacement.fragment);
    bodyRows = replacement.rowsMap;
    rowBoxes = replacement.boxes;
    if (focusedRow) {
      const row = bodyRows.get(focusedRow);
      const cell =
        focusedColumn &&
        [...(row?.cells || [])].find(
          (item) => item.dataset.columnId === focusedColumn,
        );
      const target = focusedColumn
        ? cell?.querySelector("button,input,select,textarea,a[href],[tabindex]")
        : rowBoxes.get(focusedRow);
      (target || scroll).focus();
    }
  }
  /** Report state separately from rows and prevent actions against loading or failed page contents. */
  function updateStatus() {
    const effective =
      currentStatus === "ready" && !currentRows.length
        ? "empty"
        : currentStatus;
    element.dataset.state = effective;
    table.setAttribute("aria-busy", String(currentStatus === "loading"));
    announcement.setAttribute(
      "role",
      currentStatus === "error" ? "alert" : "status",
    );
    announcement.textContent =
      currentMessage ||
      (effective === "loading"
        ? "Загрузка данных…"
        : effective === "error"
          ? "Ошибка загрузки. Повторите через приложение."
          : effective === "empty"
            ? "Нет данных"
            : `${currentRows.length} строк на странице`);
    for (const button of headerButtons.values())
      button.disabled = !onSort || currentStatus !== "ready";
    updateSelection();
    updatePager();
  }
  /** Replace one page atomically, prune removed selections and recover focus by row/column identity. */
  function setRows(nextRows) {
    if (disposed) return;
    const candidate = rowsValue(nextRows, definitions),
      eligible = new Set(
        candidate.filter((row) => !row.disabled).map((row) => row.id),
      );
    commitBody(candidate, currentStatus);
    currentRows = candidate;
    selected = new Set([...selected].filter((id) => eligible.has(id)));
    updateStatus();
  }
  function setSelection(ids) {
    if (!disposed) {
      selected = selectionValue(ids);
      updateSelection();
    }
  }
  /** Reflect a host-applied sort without reordering data or recreating a focused header button. */
  function setSort(value) {
    if (disposed) return;
    if (
      value !== null &&
      (!value ||
        !definitions.some(
          (column) => column.id === value.columnId && column.sortable,
        ) ||
        !["ascending", "descending"].includes(value.direction))
    )
      throw new TypeError(
        "Sort requires a sortable column and known direction",
      );
    currentSort = value ? { ...value } : null;
    for (const [id, th] of headers) {
      if (value?.columnId === id) th.setAttribute("aria-sort", value.direction);
      else th.removeAttribute("aria-sort");
    }
    for (const [id, mark] of sortMarks)
      mark.textContent =
        value?.columnId === id
          ? value.direction === "ascending"
            ? " ↑"
            : " ↓"
          : " ↕";
  }
  /** Show an explicit data state; loading/error/empty never display stale ready rows as current. */
  function setStatus(value, note = "") {
    if (disposed) return;
    if (
      !["ready", "loading", "empty", "error"].includes(value) ||
      typeof note !== "string" ||
      note.length > 2048
    )
      throw new TypeError("Known status and bounded message required");
    commitBody(currentRows, value);
    currentStatus = value;
    currentMessage = note;
    updateStatus();
  }
  function updatePager() {
    pager.hidden = currentPage === null;
    pageText.textContent = currentPage
      ? `${currentPage.index + 1} / ${currentPage.count}`
      : "";
    previous.disabled =
      !currentPage ||
      !onPageChange ||
      currentPage.index === 0 ||
      currentStatus !== "ready";
    next.disabled =
      !currentPage ||
      !onPageChange ||
      currentPage.index + 1 >= currentPage.count ||
      currentStatus !== "ready";
  }
  /** Reflect a zero-based host page; no fetch or page transition is performed by the component. */
  function setPage(value) {
    if (disposed) return;
    if (
      value !== null &&
      (!value ||
        !Number.isInteger(value.index) ||
        !Number.isInteger(value.count) ||
        value.count < 1 ||
        value.count > 1000000 ||
        value.index < 0 ||
        value.index >= value.count)
    )
      throw new TypeError("Page index must be inside a bounded positive count");
    currentPage = value ? { ...value } : null;
    updatePager();
  }
  body.addEventListener(
    "change",
    (event) => {
      const checkbox = event.target,
        id = checkbox.dataset?.rowSelect;
      if (
        disposed ||
        currentStatus !== "ready" ||
        rowBoxes.get(id) !== checkbox ||
        checkbox.disabled
      )
        return;
      if (checkbox.checked) selected.add(id);
      else selected.delete(id);
      updateSelection();
      onSelectionChange?.([...selected]);
    },
    listeners,
  );
  allBox?.addEventListener(
    "change",
    () => {
      if (disposed || allBox.disabled) return;
      selected = allBox.checked
        ? new Set(
            currentRows.filter((row) => !row.disabled).map((row) => row.id),
          )
        : new Set();
      updateSelection();
      onSelectionChange?.([...selected]);
    },
    listeners,
  );
  previous.addEventListener(
    "click",
    () => {
      if (!disposed && !previous.disabled)
        onPageChange?.(currentPage.index - 1);
    },
    listeners,
  );
  next.addEventListener(
    "click",
    () => {
      if (!disposed && !next.disabled) onPageChange?.(currentPage.index + 1);
    },
    listeners,
  );
  setSort(sort);
  selected = selectionValue(selectedIds);
  setPage(page);
  setStatus(status, message);
  return {
    element,
    table,
    setRows,
    setSort,
    setSelection,
    setStatus,
    setPage,
    get selectedIds() {
      return [...selected];
    },
    get sort() {
      return currentSort ? { ...currentSort } : null;
    },
    dispose() {
      if (!disposed) {
        disposed = true;
        abort.abort();
        currentRows = [];
        selected.clear();
        bodyRows.clear();
        rowBoxes.clear();
        body.replaceChildren();
        onSort = undefined;
        onSelectionChange = undefined;
        onPageChange = undefined;
      }
    },
  };
}

import {
  createDataGrid,
  createGridArrayDataSource,
} from "./vendor/ag-design/index.js";

const teams = ["Дизайн", "Разработка", "Исследования", "Поддержка"];
const stages = ["Новая", "В работе", "Проверка", "Готово"];

/** Generate bounded synthetic rows once; scrolling never creates a full second dataset. */
export function dataGridSampleRows(count = 800) {
  if (!Number.isInteger(count) || count < 0 || count > 20000)
    throw new TypeError("Пример поддерживает от 0 до 20000 строк");
  const rows = [];
  for (let index = 0; index < count; index++) {
    const name = `Задача ${index + 1}`;
    rows.push({
      id: `item-${index + 1}`,
      label: `Запись ${index + 1}`,
      cells: {
        name,
        team: teams[index % teams.length],
        stage: stages[index % stages.length],
        budget: 2500 + ((index * 7919) % 90000),
        progress: (index * 13) % 101,
        updated: `2026-10-${String(1 + (index % 25)).padStart(2, "0")}`,
      },
    });
  }
  return rows;
}

/** Show the actual shared grid with local scalar data and a recoverable edit validation example. */
export function buildDataGridSample(
  props = {},
  document = globalThis.document,
) {
  const count = props.rowCount ?? 800;
  const element = document.createElement("section");
  element.className = "data-grid-sample";
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  const columns = [
    {
      id: "name",
      label: "Название",
      width: 190,
      type: "text",
      editable: true,
      group: ["Задача"],
      validate: (value) =>
        String(value).trim().length >= 3 || "Введите не менее 3 символов",
    },
    {
      id: "team",
      label: "Команда",
      width: 160,
      group: ["Задача"],
      filter: {
        type: "select",
        options: teams.map((value) => ({ value, label: value })),
      },
    },
    {
      id: "stage",
      label: "Состояние",
      width: 140,
      group: ["Задача"],
      filter: {
        type: "select",
        options: stages.map((value) => ({ value, label: value })),
      },
    },
    {
      id: "budget",
      label: "Бюджет, ₽",
      width: 140,
      type: "number",
      align: "end",
      group: ["Показатели"],
      editable: true,
    },
    {
      id: "progress",
      label: "Готовность, %",
      width: 145,
      type: "number",
      align: "end",
      group: ["Показатели"],
    },
    {
      id: "updated",
      label: "Обновлено",
      width: 140,
      type: "date",
      group: ["Показатели"],
    },
  ];
  let disposed = false;
  let rows = dataGridSampleRows(count);
  const arraySource =
    props.mode === "async"
      ? createGridArrayDataSource({ columns, rows })
      : null;
  /** The demonstration delay belongs to the host adapter and respects grid cancellation. */
  async function getWindow(request, { signal }) {
    await new Promise((resolve, reject) => {
      const abort = () => {
        document.defaultView.clearTimeout(timer);
        reject(new document.defaultView.DOMException("Отменено", "AbortError"));
      };
      const timer = document.defaultView.setTimeout(() => {
        signal.removeEventListener("abort", abort);
        resolve();
      }, 180);
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) abort();
    });
    return arraySource.getWindow(request, { signal });
  }
  const grid = createDataGrid({
    document,
    label: props.label ?? "Рабочие задачи",
    columns,
    ...(arraySource
      ? { dataSource: { getWindow }, rowCount: count }
      : { rows }),
    mode: props.mode === "async" ? "virtual" : (props.mode ?? "virtual"),
    height: props.height ?? 320,
    rowHeight: 36,
    pageSize: 20,
    selectable: props.selectable !== "false",
    initialQuery: { search: props.search ?? "" },
    actions: [{ id: "details", label: "Подробнее" }],
    bulkActions: [{ id: "review", label: "Передать на проверку" }],
    rowDetails(row) {
      const detail = document.createElement("p");
      detail.textContent = `${row.cells.name} · ${row.cells.team}. Изменения этого примера хранятся только в памяти.`;
      return detail;
    },
    onSelectionChange() {
      if (!disposed) status.textContent = "Выбор строк обновлён";
    },
    onEdit(edit) {
      if (arraySource) {
        const updated = [];
        for (const row of rows) {
          updated.push(
            row.id === edit.rowId
              ? { ...row, cells: { ...row.cells, [edit.columnId]: edit.value } }
              : row,
          );
        }
        rows = updated;
        arraySource.setRows(rows);
      }
      if (!disposed)
        status.textContent = "Изменение сохранено в локальном примере";
    },
    onAction({ actionId, row }) {
      if (disposed) return;
      if (actionId === "details" && row) grid.showDetails(row.id, true);
      else
        status.textContent =
          "Действие для выбранных строк получено приложением";
    },
  });
  element.append(grid.element, status);
  return {
    element,
    grid,
    interact: () =>
      grid.setQuery({ search: grid.query.search ? "" : "Задача 12" }),
    dispose() {
      if (disposed) return;
      disposed = true;
      grid.dispose();
      rows = [];
      arraySource?.setRows([]);
      element.remove();
    },
  };
}

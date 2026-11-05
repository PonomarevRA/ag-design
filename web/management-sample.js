import {
  createSelect,
  createTabs,
  createMenu,
  createDataTable,
  createTree,
  createSettingsPanel,
  createButton,
  createPopup,
} from "./vendor/ag-design/index.js";

export const managementIds = new Set([
  "select",
  "tabs",
  "menu",
  "data-table",
  "tree",
  "settings-panel",
]);

/** Parse only bounded scalar JSON fixture data. Source, HTML strings and URLs are never interpreted. */
function arrayData(value, fallback) {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || value.length > 4096)
    throw new TypeError("Данные примера должны быть JSON до4096символов");
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.length > 100)
    throw new TypeError("Нужен массив до100строк");
  return parsed;
}

/** Author real management controls using local synthetic data and host-owned sorting/settings callbacks. */
export function createManagementSample(
  id,
  props = {},
  document = globalThis.document,
) {
  const root = document.createElement("div");
  root.className = "management-sample";
  root.setAttribute("data-ag-width", "fill");
  const note = document.createElement("p");
  note.className = "muted";
  note.setAttribute("role", "status");
  const label = props.label || props.caption || "Пример управления";
  let control,
    dialog = null,
    disposed = false;

  const text = (value) => {
    if (!disposed) note.textContent = value;
  };
  if (id === "select") {
    control = createSelect({
      document,
      label,
      value: props.value || "active",
      disabled: props.disabled === "true",
      hint: props.hint || "Выберите состояние",
      options: arrayData(props.options, [
        { value: "new", label: "Новая", group: "Работа" },
        { value: "active", label: "В работе", group: "Работа" },
        { value: "done", label: "Завершена", group: "Завершение" },
        { value: "locked", label: "Недоступна", disabled: true },
      ]),
      onChange: (value) => text(`Выбрано: ${value}`),
    });
  } else if (id === "tabs") {
    const labels = (props.labels || "Данные;История;Проверка")
      .split(";")
      .map((x) => x.trim())
      .filter(Boolean);
    control = createTabs({
      document,
      label,
      value: "tab-0",
      orientation: props.orientation || "horizontal",
      tabs: labels.map((title, index) => ({
        id: `tab-${index}`,
        label: title,
        lifecycle: "preserve",
        mount: () => {
          const panel = document.createElement("section"),
            field = document.createElement("input"),
            caption = document.createElement("label");
          caption.textContent = "Черновик: " + title;
          field.setAttribute("aria-label", "Черновик: " + title);
          caption.append(field);
          panel.append(caption);
          return panel;
        },
      })),
      onChange: (value) => text(`Открыта вкладка: ${value}`),
    });
  } else if (id === "menu") {
    control = createMenu({
      document,
      label,
      items: arrayData(props.items, [
        { id: "open", label: "Открыть", shortcut: "⌘O", group: "Файл" },
        { id: "save", label: "Сохранить", shortcut: "⌘S", group: "Файл" },
        {
          id: "disabled",
          label: "Недоступная команда",
          disabled: true,
          group: "Файл",
        },
        {
          id: "view",
          label: "Представление",
          group: "Настройки",
          children: [
            { id: "geometry", label: "Геометрия", checked: true },
            { id: "semantic", label: "Иерархия" },
          ],
        },
      ]),
      onAction: (value) => text(`Команда: ${value}`),
    });
  } else if (id === "data-table") {
    let rows = arrayData(props.rows, [
      {
        id: "one",
        cells: { name: "Контроллер", state: "Работает", value: 42 },
      },
      { id: "two", cells: { name: "Датчик", state: "Проверка", value: 17 } },
      { id: "three", cells: { name: "Шлюз", state: "Ожидание", value: 8 } },
    ]);
    const originalRows = [...rows];
    control = createDataTable({
      document,
      caption: label,
      columns: [
        { id: "name", label: "Объект", sortable: true },
        { id: "state", label: "Состояние", sortable: true },
        { id: "value", label: "Значение", align: "end", sortable: true },
      ],
      rows,
      selectable: props.selectable !== "false",
      status: props.state || "ready",
      onSelectionChange: (ids) => text(`Выбрано: ${ids.length}`),
      onSort: (sort) => {
        if (!sort) {
          rows = [...originalRows];
          control.setSort(null);
          control.setRows(rows);
          text("Сортировка сброшена");
          return;
        }
        const direction = sort.direction === "descending" ? -1 : 1;
        rows = [...rows].sort((a, b) => {
          const x = a.cells[sort.columnId],
            y = b.cells[sort.columnId];
          return (
            direction *
            (typeof x === "number" && typeof y === "number"
              ? x - y
              : String(x).localeCompare(String(y), "ru"))
          );
        });
        control.setSort(sort);
        control.setRows(rows);
        text(`Сортировка: ${sort.columnId} ${sort.direction}`);
      },
    });
  } else if (id === "tree") {
    const nodes = arrayData(props.nodes, [
      { id: "system", label: "Система", parentId: null },
      { id: "node-a", label: "Контроллер", parentId: "system" },
      { id: "node-b", label: "Датчики", parentId: "system" },
      { id: "sensor", label: "Датчик температуры", parentId: "node-b" },
    ]);
    for (const node of nodes)
      node.actions = [
        {
          id: "visible",
          label: `Показать/скрыть ${node.label}`,
          icon: "◉",
          pressed: true,
          onAction: () => {
            node.actions[0].pressed = !node.actions[0].pressed;
            control.setNodes(nodes);
            text(`Видимость: ${node.id}`);
          },
        },
      ];
    control = createTree({
      document,
      label,
      nodes,
      selectedId: props.selectedId || "node-a",
      expandedIds: [
        ...new Set(
          nodes.map((node) => node.parentId).filter((id) => id != null),
        ),
      ],
      onSelect: (value) => text(`Выбран объект: ${value}`),
    });
  } else if (id === "settings-panel") {
    const footer = createButton({
      document,
      label: "Готово",
      variant: "primary",
      onClick: () =>
        disposed
          ? undefined
          : dialog
            ? dialog.close()
            : text("Локальные настройки применены в примере"),
    });
    const selectRow = () => {
      const select = createSelect({
        document,
        label: "Тема",
        options: [
          { value: "system", label: "Как в системе" },
          { value: "light", label: "Светлая" },
          { value: "dark", label: "Тёмная" },
        ],
        value: "system",
      });
      return select;
    };
    control = createSettingsPanel({
      document,
      title: props.label || "Настройки",
      description:
        "Локальный пример: настройки приложения и системы не меняются.",
      value: "general",
      footer,
      categories: [
        {
          id: "general",
          label: "Основные",
          groups: [
            {
              id: "appearance",
              title: "Внешний вид",
              rows: [
                {
                  id: "theme",
                  label: "Тема",
                  description: "Палитру выбирает приложение",
                  mount: selectRow,
                },
                {
                  id: "name",
                  label: "Имя",
                  mount: () => {
                    const input = document.createElement("input");
                    input.setAttribute("aria-label", "Имя в примере");
                    return input;
                  },
                },
              ],
            },
          ],
        },
        {
          id: "appearance",
          label: "Панель инструментов",
          groups: [
            {
              id: "motion",
              title: "Поведение",
              rows: [
                {
                  id: "animation",
                  label: "Анимации",
                  mount: () => {
                    const box = document.createElement("input");
                    box.type = "checkbox";
                    box.checked = true;
                    box.setAttribute(
                      "aria-label",
                      "Разрешить анимации в примере",
                    );
                    return box;
                  },
                },
              ],
            },
          ],
        },
        {
          id: "private",
          label: "Доступ",
          sensitive: true,
          groups: [
            {
              id: "connection",
              title: "Тестовое соединение",
              description: "Поле очищается при уходе из категории",
              rows: [
                {
                  id: "token",
                  label: "Тестовый ключ",
                  mount: () => {
                    const input = document.createElement("input");
                    input.type = "password";
                    input.setAttribute(
                      "aria-label",
                      "Тестовый ключ без подключения",
                    );
                    return input;
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    if (props.presentation === "dialog") {
      dialog = createPopup({
        document,
        id: `management-settings-${++serial}`,
        title: props.label || "Настройки",
        content: control.element,
      });
      root.append(
        createButton({
          document,
          label: "Открыть настройки",
          onClick: () => {
            if (disposed) return;
            if (!dialog.isConnected) root.append(dialog);
            dialog.showModal();
          },
        }),
      );
    }
  } else throw new TypeError("Unknown management sample");
  if (!dialog) root.append(control.element);
  root.append(note);
  return {
    element: root,
    interact() {
      if (id === "tabs") control.setValue("tab-1");
      else if (id === "menu") control.open({ focus: "first" });
      else if (id === "settings-panel") control.setValue("appearance");
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      control.dispose();
      if (dialog) {
        if (dialog.open) dialog.close();
        dialog.remove();
      }
    },
  };
}
let serial = 0;

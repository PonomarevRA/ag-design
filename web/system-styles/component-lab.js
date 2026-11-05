import {
  getLocaleRuntime,
  createLocaleSettings,
} from "../locale-preferences.js";
import { localizeComponent } from "../../packages/components/i18n-component.js";
import {
  createButton,
  createField,
  createSelect,
  createTabs,
  createDataTable,
  createProgress,
  createStatus,
  createGitHistory,
  createTaskHistory,
} from "../../packages/components/index.js";
import { compactDemoEditorToolbar } from "./demo-editor-toolbar.js";
import { historyDemoData, styleDemoLinks } from "./component-lab-data.js";
let sequence = 0;

/** Compose real AG controls in each host's token scope. Demo mutations belong only to this local mount. */
export function mountComponentLab(host) {
  const doc = host.ownerDocument,
    win = doc.defaultView,
    data = historyDemoData(),
    owned = [];
  let disposed = false,
    actionCount = 0;
  const abort = new win.AbortController();
  /** Use literal text for descriptions and data; style IDs come only from the reviewed page map. */
  function node(tag, text, className) {
    const el = doc.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  const localeRuntime = getLocaleRuntime(doc),
    i18n = localeRuntime.context;
  host.classList.add("ag-style-lab");
  const style = doc.documentElement.dataset.style;
  const header = node("header", undefined, "lab-heading"),
    intro = node("div");
  intro.append(
    node("p", "AG DESIGN / В РАБОТЕ", "lab-eyebrow"),
    node("h2", "Один набор. Девять характеров."),
    node(
      "p",
      "Компоненты библиотеки в рабочем сценарии: история изменений, задачи, данные и редактор.",
    ),
  );
  const marker = node("span", "Живые компоненты", "lab-marker");
  header.append(intro, marker);
  const navigation = node("nav", undefined, "lab-styles");
  navigation.setAttribute("aria-label", "Сравнить оформление компонентов");
  for (const [id, title, url] of styleDemoLinks) {
    const a = node("a", title);
    a.href = url + "#ag-components";
    if (id === style) a.setAttribute("aria-current", "page");
    navigation.append(a);
  }
  const status = node(
    "p",
    "Синтетические данные · изменения действуют до перезагрузки страницы.",
    "lab-status",
  );
  status.setAttribute("role", "status");
  const tokens = node("div", undefined, "lab-tokens");
  tokens.hidden = true;
  const tokenButton = createButton({
    document: doc,
    i18n,
    label: "Показать токены",
    variant: "quiet",
    onClick: () => {
      tokens.hidden = !tokens.hidden;
      tokenButton.setAttribute("aria-expanded", String(!tokens.hidden));
      if (tokens.hidden) return;
      tokens.replaceChildren();
      const computed = win.getComputedStyle(host);
      for (const name of [
        "--ag-accent",
        "--ag-surface",
        "--ag-text",
        "--ag-radius-control",
        "--ag-radius-panel",
        "--ag-control-height",
        "--ag-text-size",
      ]) {
        const value = computed.getPropertyValue(name).trim();
        const item = node("div");
        item.append(node("code", name), node("strong", value));
        tokens.append(item);
      }
    },
  });
  tokenButton.setAttribute("aria-expanded", "false");
  tokenButton.setAttribute("aria-controls", `lab-tokens-${++sequence}`);
  tokens.id = tokenButton.getAttribute("aria-controls");
  const tabViews = new Map();
  /** Keep a reusable renderer handle available for refresh after its hidden panel becomes visible. */
  function gitView() {
    const view = createGitHistory({ document: doc, commits: data.commits });
    tabViews.set("git", view);
    return view;
  }
  /** Apply an explicit task action to the demo snapshot, then give the renderer a fresh validated copy. */
  function taskView() {
    const view = createTaskHistory({
      document: doc,
      i18n,
      ...data,
      onAction: ({ taskId }) => {
        if (data.events.length >= 240) {
          status.textContent =
            "Лимит примера достигнут. Перезагрузите страницу для нового сеанса.";
          return;
        }
        const task = data.tasks.find((t) => t.id === taskId),
          states = ["Запланировано", "В работе", "На проверке", "Завершено"];
        task.status = states[(states.indexOf(task.status) + 1) % states.length];
        const id = `local-${++actionCount}`;
        data.events.unshift({
          id,
          taskId,
          title: "Статус изменён: " + task.status,
          author: "Вы",
          date: "Сейчас · локальный пример",
        });
        view.setData(data);
        view.select(id);
        status.textContent = `${taskId}: ${task.status}. Обновлено только в этом примере.`;
      },
    });
    tabViews.set("tasks", view);
    return view;
  }
  /** The same AG table owns selection; the demo host explicitly sorts the local rows. */
  function tableView() {
    const element = node("section", undefined, "lab-table"),
      selected = node(
        "p",
        "Выберите строки для группового действия.",
        "lab-status",
      );
    const rows = data.tasks.map((t) => ({
      id: t.id,
      cells: {
        id: t.id,
        title: t.title,
        status: t.status,
        owner: t.id === "DS-25" ? "Анна К." : "Марк С.",
      },
    }));
    let table;
    table = createDataTable({
      document: doc,
      i18n,
      caption: "План выпуска · локальная таблица",
      columns: [
        { id: "id", label: "Задача", sortable: true },
        { id: "title", label: "Название", sortable: true },
        { id: "status", label: "Статус" },
        { id: "owner", label: "Ответственный" },
      ],
      rows,
      selectable: true,
      onSelectionChange: (ids) => {
        selected.textContent = `Выбрано задач: ${ids.length}`;
      },
      onSort: (sort) => {
        const sorted = sort
          ? [...rows].sort(
              (a, b) =>
                String(a.cells[sort.columnId]).localeCompare(
                  String(b.cells[sort.columnId]),
                  "ru",
                ) * (sort.direction === "descending" ? -1 : 1),
            )
          : [...rows];
        table.setRows(sorted);
        table.setSort(sort);
      },
    });
    element.append(table.element, selected);
    return { element, dispose: table.dispose };
  }
  /** A small native form demonstrates validation, select, buttons, status and measured progress together. */
  function settingsView() {
    const element = node("form", undefined, "lab-form"),
      section = node("div", undefined, "lab-form-fields");
    section.dataset.agFormRow = "auto";
    section.classList.add("ag-form-tracks");
    const field = createField({
      document: doc,
      i18n,
      id: `lab-project-${++sequence}`,
      label: "Название проекта",
      placeholder: "Например, новая редакция",
      required: true,
      hint: "Изменение сохранится в текущем демо-сеансе.",
    });
    field.dataset.agFormField = "";
    field
      .querySelector(".ag-field__label")
      .classList.add("ag-form-track__label");
    field.querySelector("input").classList.add("ag-form-track__control");
    const fieldFeedback = node("div", undefined, "ag-form-track__feedback");
    fieldFeedback.append(
      ...field.querySelectorAll(".ag-field__hint,.ag-field__error"),
    );
    field.append(fieldFeedback);
    field.querySelector("input").value = "Редизайн рабочего пространства";
    const select = createSelect({
      document: doc,
      i18n,
      label: "Видимость",
      options: [
        { value: "team", label: "Только команда" },
        { value: "workspace", label: "Всё пространство" },
      ],
      value: "team",
    });
    select.element.dataset.agFormField = "";
    select.element.querySelector("label").classList.add("ag-form-track__label");
    select.select.classList.add("ag-form-track__control");
    const selectFeedback = node("div", undefined, "ag-form-track__feedback");
    selectFeedback.append(
      ...select.element.querySelectorAll(".ag-select__hint,.ag-select__error"),
    );
    select.element.append(selectFeedback);
    const progress = createProgress({
      document: doc,
      i18n,
      label: "Готовность выпуска",
      value: 2,
      max: 3,
      description: "Два из трёх этапов проверены в синтетическом плане.",
    });
    const save = createButton({
      document: doc,
      i18n,
      label: "Сохранить настройки",
      variant: "primary",
    });
    save.type = "submit";
    const feedback = node("p", "Есть несохранённые изменения", "lab-status");
    feedback.setAttribute("role", "status");
    const projectInput = field.querySelector("input");
    /** Edits invalidate the local saved indicator without implying a network operation. */
    function markUnsaved() {
      feedback.textContent = "Есть несохранённые изменения";
    }
    projectInput.addEventListener("input", markUnsaved, {
      signal: abort.signal,
    });
    select.select.addEventListener("change", markUnsaved, {
      signal: abort.signal,
    });
    element.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        if (!element.reportValidity()) return;
        feedback.textContent = `«${field.querySelector("input").value}» · сохранено локально`;
        status.textContent = "Настройки обновлены только в текущем примере.";
      },
      { signal: abort.signal },
    );
    section.append(field, select.element);
    element.append(
      section,
      createStatus({
        document: doc,
        i18n,
        label: "Локальный проект",
        tone: "success",
      }),
      progress.element,
      save,
      feedback,
    );
    return {
      element,
      dispose: () => {
        select.dispose();
        progress.dispose();
      },
    };
  }
  /** Load the exact local editor bundle only when requested; disposal fences a late import. */
  function markdownView() {
    const element = node("section", undefined, "lab-editor"),
      loading = node("p", "Загрузка редактора…");
    element.append(loading);
    let current = null,
      editorToolbar = null,
      closed = false;
    import("./vendor/cms/editor.js")
      .then(({ createMarkdownEditor }) => {
        if (closed || disposed) return;
        current = createMarkdownEditor({
          document: doc,
          i18n,
          label: "Заметка к выпуску",
          markdown:
            "# Пространство для вашей идеи\n\nКомпоненты получают оформление из токенов выбранного стиля.\n\n## Перед выпуском\n\n- Проверить контраст\n- Пройти сценарий с клавиатуры\n- Сверить данные и подписи\n\n**Хороший интерфейс помогает действовать.**",
          mode:
            doc.documentElement.dataset.example === "fitness" ||
            win.innerWidth <= 760
              ? "edit"
              : "split",
          height: 340,
        });
        element.replaceChildren(current.element);
        editorToolbar = compactDemoEditorToolbar(current, doc);
      })
      .catch(() => {
        if (!closed && !disposed)
          loading.textContent =
            "Редактор недоступен. Перезагрузите страницу для повторной загрузки.";
      });
    return {
      element,
      dispose: () => {
        closed = true;
        editorToolbar?.dispose();
        current?.dispose();
      },
    };
  }
  /** Keep the selected chip visible without a scrollbar or changing tab semantics. */
  function revealSelectedTab() {
    const selected = host.querySelector('[role="tab"][aria-selected="true"]');
    if (selected?.getClientRects().length)
      selected.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }
  const tabs = createTabs({
    document: doc,
    i18n,
    label: "Компоненты в системе",
    value: "git",
    activation: "automatic",
    tabs: [
      {
        id: "language",
        label: "Язык и регион",
        mount: () =>
          createLocaleSettings({
            document: doc,
            runtime: localeRuntime,
            compact: true,
          }),
      },
      { id: "git", label: "История Git", mount: gitView },
      { id: "tasks", label: "Задачи", mount: taskView },
      { id: "table", label: "Таблица", mount: tableView, lifecycle: "destroy" },
      { id: "settings", label: "Форма", mount: settingsView },
      { id: "markdown", label: "Редактор", mount: markdownView },
    ],
    onChange: (id) => {
      tabViews.get(id)?.refresh();
      revealSelectedTab();
    },
  });
  tabs.tablist.addEventListener("focusin", revealSelectedTab, {
    signal: abort.signal,
  });
  owned.push(tabs);
  const localeShell = localizeComponent(
    { element: host, dispose() {} },
    "style-lab-shell",
    { i18n },
  );
  owned.push(localeShell);
  const footer = node("div", undefined, "lab-footer");
  footer.append(status, tokenButton);
  host.append(header, navigation, tabs.element, footer, tokens);
  localeShell.refreshLocale();
  /** Release controls through their public lifecycles; no global theme or data is changed. */
  function dispose() {
    if (disposed) return;
    disposed = true;
    abort.abort();
    for (const view of owned) view.dispose();
    host.replaceChildren();
  }
  return { element: host, dispose };
}

if (typeof document !== "undefined") {
  const mounted = [];
  for (const host of document.querySelectorAll("[data-ag-component-lab]"))
    mounted.push(mountComponentLab(host));
  globalThis.addEventListener("pagehide", (event) => {
    if (!event.persisted) for (const view of mounted) view.dispose();
  });
}

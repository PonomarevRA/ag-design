import { buildGridIconWorkshop } from "./grid-icon-workshop.js";
import { buildAppRuntimeSample } from "./app-runtime-sample.js";
import { buildAsyncBoundarySample } from "./async-boundary-sample.js";
import { buildLayoutGridSample } from "./layout-grid-sample.js";
import { buildGoldenCanonSample } from "./golden-canon-sample.js";
import { buildLanguageSwitcherSample } from "./language-switcher-sample.js";
import { buildHistorySample } from "./history-sample.js";
import {
  buildCodeMarkdownSample,
  codeMarkdownIds,
  sampleCode,
  sampleMarkdown,
} from "./code-markdown-sample.js";
import { buildDataGridSample } from "./data-grid-sample.js";
import { buildDropdownSelectSample } from "./dropdown-select-sample.js";
import { createManagementSample, managementIds } from "./management-sample.js";
import { h } from "./dom.js";
import { buildSample, preview } from "./previews.js";
import {
  createButton,
  createNumericBadge,
  createNumericScale,
  createField,
  createTextarea,
  createTextBlock,
  createPaletteBuilder,
  createStatus,
  createNotice,
  createEmptyState,
  createProgress,
  createSkeleton,
  createInlineHelp,
  createSectionStack,
  createStatePanel,
  createAsciiBackground,
  createLoadingIndicator,
  createAmbientChart,
} from "./vendor/ag-design/index.js";

const text = (key, label, value) => ({ key, label, value, type: "text" });
const select = (key, label, value, options, labels) => ({
  key,
  label,
  value,
  type: "select",
  options,
  labels,
});
const number = (key, label, value, min, max) => ({
  key,
  label,
  value,
  type: "number",
  min,
  max,
  step: ["speed", "textRoughness", "textEdgeRoughness"].includes(key) ? 0.1 : 1,
});
const tone = () =>
  select("tone", "Тон", "accent", ["neutral", "accent", "success", "danger"]);
const fields = {
  "palette-builder": [
    text("baseColor", "Базовый HEX", "#176f56"),
    text("background", "Фон HEX", "#ffffff"),
    text("foreground", "Текст HEX", "#202126"),
    select("space", "Круг", "oklch", ["oklch", "hsl"]),
  ],
  "grid-icon-draft": [
    select("symbol", "Символ", "focus", ["play", "focus", "image", "compass"]),
    select("purpose", "Назначение", "ui", ["ui", "illustrative"]),
  ],
  "event-bus": [number("burstSize", "Событий в потоке", 2000, 1, 20000)],
  "request-router": [number("delayMs", "Задержка адаптера, мс", 80, 0, 10000)],
  "async-boundary": [
    select("mode", "Сценарий", "success", [
      "success",
      "empty",
      "error",
      "timeout",
    ]),
    number("delayMs", "Задержка, мс", 900, 0, 10000),
  ],
  "language-switcher": [
    select("variant", "Вариант", "auto", ["auto", "compact", "inline"]),
    select("appearance", "Оформление", "quiet", ["quiet", "outlined"]),
    select("placement", "Размещение", "all", [
      "all",
      "header",
      "content",
      "navigation-footer",
    ]),
  ],
  "git-history": [text("label", "Название", "История Git")],
  "task-history": [text("label", "Название", "История задач")],
  "code-viewer": [
    {
      ...text("label", "Название", "Исходный код"),
      maxlength: 256,
      nonempty: true,
    },
    { ...text("code", "Исходный код", sampleCode), multiline: true },
    select("language", "Язык", "typescript", [
      "text",
      "javascript",
      "typescript",
      "jsx",
      "tsx",
      "json",
      "python",
      "html",
      "css",
      "sql",
      "markdown",
      "csharp",
      "shell",
      "yaml",
    ]),
    select("wrap", "Перенос строк", "false", ["false", "true"], {
      false: "Нет",
      true: "Да",
    }),
    select("lineNumbers", "Номера строк", "true", ["true", "false"], {
      true: "Да",
      false: "Нет",
    }),
    number("height", "Высота области, px", 300, 120, 1000),
  ],
  "markdown-viewer": [
    {
      ...text("label", "Название", "Документ Markdown"),
      maxlength: 240,
      nonempty: true,
    },
    { ...text("markdown", "Markdown", sampleMarkdown), multiline: true },
    select("mode", "Представление", "rendered", ["rendered", "source"], {
      rendered: "Документ",
      source: "Исходник",
    }),
    number("height", "Высота области, px", 300, 120, 1000),
  ],
  "markdown-editor": [
    {
      ...text("label", "Название", "Редактор Markdown"),
      maxlength: 200,
      nonempty: true,
    },
    { ...text("markdown", "Markdown", sampleMarkdown), multiline: true },
    select("mode", "Представление", "split", ["edit", "split", "preview"], {
      edit: "Редактирование",
      split: "Рядом",
      preview: "Просмотр",
    }),
    number("height", "Высота области, px", 360, 120, 1000),
  ],
  "data-grid": [
    text("label", "Название таблицы", "Рабочие задачи"),
    select("mode", "Отрисовка", "virtual", ["virtual", "paged", "async"], {
      virtual: "Виртуальная",
      paged: "Постраничная",
      async: "Асинхронный источник",
    }),
    number("rowCount", "Строк в локальном примере", 800, 0, 20000),
    number("height", "Высота области, px", 320, 180, 720),
    text("search", "Начальный поиск", ""),
    select("selectable", "Выбор строк", "true", ["true", "false"], {
      true: "Включён",
      false: "Выключен",
    }),
  ],
  "dropdown-select": [
    text("label", "Подпись", "Команда"),
    text(
      "options",
      "Варианты JSON",
      '[{"value":"design","label":"Дизайн","group":"Команды"},{"value":"engineering","label":"Разработка","group":"Команды"},{"value":"archive","label":"Архив","disabled":true}]',
    ),
    text("value", "Выбранное значение", "design"),
    text("placeholder", "Пустое значение", "Выберите команду"),
    text("hint", "Подсказка", "Найдите команду по названию"),
    text("error", "Ошибка", ""),
    select("searchable", "Поиск", "true", ["true", "false"], {
      true: "Включён",
      false: "Выключен",
    }),
    select("disabled", "Доступность", "false", ["false", "true"], {
      false: "Доступен",
      true: "Недоступен",
    }),
    select("required", "Обязательный выбор", "false", ["false", "true"], {
      false: "Нет",
      true: "Да",
    }),
  ],
  "loading-indicator": [
    select(
      "variant",
      "Вид индикатора",
      "spinner",
      ["spinner", "dots", "progress", "skeleton"],
      {
        spinner: "Кольцо",
        dots: "Точки",
        progress: "Полоса",
        skeleton: "Скелетон",
      },
    ),
    text("label", "Описание ожидания", "Загрузка"),
  ],
  "ambient-chart": [
    text("title", "Заголовок", "Системы в движении"),
    text("caption", "Подпись", "Оформление в палитре вашего сайта"),
    select("mode", "Режим", "decorative", ["decorative", "data"], {
      decorative: "Декоративный",
      data: "Переданные данные",
    }),
    select("kind", "Вид графика", "bars", ["bars", "line", "area"], {
      bars: "Столбцы",
      line: "Линия",
      area: "Область",
    }),
    text("labels", "Подписи через точку с запятой", "Пн;Вт;Ср;Чт;Пт;Сб;Вс"),
    text(
      "values",
      "Числа через точку с запятой; null — пропуск",
      "18;32;null;-8;45;63;52",
    ),
    text(
      "code",
      "Декоративный код",
      "const signal = observe(stream)\n\nrender(signal)",
    ),
    select("showPanel", "Мини-окно", "true", ["true", "false"], {
      true: "Показать",
      false: "Скрыть",
    }),
    {
      ...text("panelTitle", "Заголовок мини-окна", "Контекст"),
      maxlength: 100,
    },
    { ...text("panelText", "Текст мини-окна", ""), maxlength: 1200 },
    text("metric", "Декоративная метка", "SIGNAL / 01"),
    text("unit", "Единицы измерения", ""),
  ],
  "layout-grid-overlay": [
    select("gridType", "Профиль сетки", "golden-canon", [
      "golden-canon",
      "columns",
      "modular",
      "baseline",
      "spacing",
      "thirds",
      "manuscript",
    ]),
  ],
  button: [
    text("label", "Текст кнопки", "Начать"),
    select("variant", "Вариант", "primary", [
      "primary",
      "secondary",
      "quiet",
      "danger",
    ]),
  ],
  field: [
    text("label", "Название поля", "Ваше имя"),
    text("placeholder", "Подсказка в поле", "Введите имя"),
    text("hint", "Пояснение", "Как к вам обращаться"),
    text("value", "Значение", ""),
    number("maxLength", "Лимит (-1 — без ограничения)", -1, -1, 100000),
  ],
  textarea: [
    text("label", "Подпись", "Комментарий"),
    text("hint", "Пояснение", "Поясните важные детали"),
    { ...text("value", "Текст", ""), multiline: true },
    number("rows", "Строки", 3, 1, 20),
    number("maxLength", "Лимит (-1 — без ограничения)", -1, -1, 100000),
  ],
  "text-block": [
    text("label", "Название", "Текстовый блок"),
    { ...text("text", "Текст", "Результат работы"), multiline: true },
    select("copyable", "Копирование", "true", ["true", "false"], {
      true: "Да",
      false: "Нет",
    }),
  ],
  "numeric-badge": [
    text("label", "Подпись", "Использований"),
    number("value", "Исходное число", 13, 0, 1000000000),
    select("mode", "Отображение", "value", ["value", "score"], {
      value: "Количество",
      score: "Шкала0–5",
    }),
    select(
      "scaleKind",
      "Алгоритм",
      "percentile",
      ["percentile", "linear", "none"],
      {
        percentile: "Процентили",
        linear: "Минимум/максимум",
        none: "Без шкалы",
      },
    ),
    text("population", "Значения через ;", "0;1;2;3;5;8;13;21;34;55"),
    number("min", "Минимум", 0, -1000000000, 1000000000),
    number("max", "Максимум", 100, -1000000000, 1000000000),
  ],
  status: [text("label", "Текст статуса", "Готово"), tone()],
  notice: [
    text("text", "Текст уведомления", "Все изменения сохранены"),
    tone(),
  ],
  "empty-state": [
    text("title", "Заголовок", "Начните с первого элемента"),
    text("description", "Описание", "Добавьте компоненты на экран"),
  ],
  progress: [
    text("label", "Название", "Подготовка"),
    number("value", "Прогресс, %", 65, 0, 100),
    text("description", "Описание", "Обрабатываем данные"),
  ],
  skeleton: [
    select("variant", "Вид", "card", [
      "text",
      "card",
      "list",
      "table",
      "profile",
    ]),
    number("rows", "Строки", 3, 1, 12),
  ],
  "inline-help": [
    text("label", "Подпись", "Сохранять историю"),
    text(
      "text",
      "Текст подсказки",
      "История хранится локально на этом устройстве.",
    ),
  ],
  "section-stack": [
    text("title", "Заголовок", "Следующие шаги"),
    text("description", "Описание", "Всё необходимое в одном месте"),
    text("text", "Содержимое", "Подготовьте материалы и начните работу."),
  ],
  "state-panel": [
    text("title", "Заголовок", "Здесь пока пусто"),
    text("description", "Описание", "Добавьте первый элемент"),
    select("state", "Состояние", "empty", ["empty", "loading", "error"]),
  ],
  "ascii-background": [
    text("text", "Текст потока", "Идеи превращаются в интерфейсы · "),
    select("textEffect", "Эффект текста", "shimmer", [
      "shimmer",
      "wave",
      "none",
    ]),
    select(
      "textWeight",
      "Толщина букв",
      "auto",
      ["auto", "thin", "regular", "bold"],
      {
        auto: "Автоматически",
        thin: "Тонкие",
        regular: "Обычные",
        bold: "Плотные",
      },
    ),
    number("textGap", "Зазор вокруг букв, ячеек", 3, 2, 6),
    number("textRoughness", "Неровность края фона", 0.3, 0, 1),
    number("textEdgeRoughness", "Неровность букв", 0, 0, 1),
    number("speed", "Скорость", 0.6, 0.1, 2),
  ],
};

/** Give management enum fields the same array/value schema as every existing editor control. */
const managementChoice = (key, label, value, labels) =>
  select(key, label, value, Object.keys(labels), labels);
Object.assign(fields, {
  select: [
    text("label", "Подпись", "Состояние задачи"),
    text(
      "options",
      "Варианты JSON",
      '[{"value":"new","label":"Новая"},{"value":"active","label":"В работе"}]',
    ),
    text("value", "Выбранное значение", "active"),
    text("hint", "Подсказка", "Выберите состояние"),
    managementChoice("disabled", "Доступность", "false", {
      false: "Доступен",
      true: "Недоступен",
    }),
  ],
  tabs: [
    text("label", "Название группы", "Разделы объекта"),
    text("labels", "Подписи через ;", "Данные;История;Проверка"),
    managementChoice("orientation", "Ориентация", "horizontal", {
      horizontal: "Горизонтально",
      vertical: "Вертикально",
    }),
  ],
  menu: [
    text("label", "Кнопка меню", "Действия"),
    text(
      "items",
      "Команды JSON",
      '[{"id":"open","label":"Открыть","shortcut":"⌘O"},{"id":"save","label":"Сохранить"}]',
    ),
  ],
  "data-table": [
    text("caption", "Название таблицы", "Устройства"),
    text(
      "rows",
      "Строки JSON",
      '[{"id":"one","cells":{"name":"Контроллер","state":"Работает","value":42}}]',
    ),
    managementChoice("selectable", "Выбор строк", "true", {
      true: "Включён",
      false: "Выключен",
    }),
    managementChoice("state", "Состояние", "ready", {
      ready: "Данные",
      loading: "Загрузка",
      empty: "Пусто",
      error: "Ошибка",
    }),
  ],
  tree: [
    text("label", "Название дерева", "Объекты системы"),
    text(
      "nodes",
      "Узлы JSON",
      '[{"id":"system","label":"Система","parentId":null},{"id":"node-a","label":"Контроллер","parentId":"system"}]',
    ),
    text("selectedId", "Выбранный узел", "node-a"),
  ],
  "settings-panel": [
    text("label", "Название", "Настройки"),
    managementChoice("presentation", "Представление", "panel", {
      panel: "Панель",
      dialog: "Диалог",
    }),
  ],
});

/** Expose command presentation and dwell timing without executable overrides. */
for (const id of ["code-viewer", "markdown-viewer", "markdown-editor"]) {
  fields[id].push(
    select("toolbarMode", "Панель команд", "compact", ["compact", "labeled"], {
      compact: "Иконки",
      labeled: "Подписи",
    }),
    number("tooltipDelayMs", "Задержка подсказки, мс", 250, 0, 5000),
  );
}
fields["inline-help"].push(
  number("hoverDelayMs", "Задержка наведения, мс", 250, 0, 5000),
);

/** Public editor schema; unsupported library fixtures stay isolated. */
export function componentFields(id) {
  return fields[id] || [];
}
export function defaultProps(id) {
  const result = {};
  for (const field of componentFields(id)) result[field.key] = field.value;
  return result;
}

/** Recheck stored parameter values against the current factory schema; stale or unknown values cannot execute. */
export function checkedProps(id, props) {
  const result = defaultProps(id);
  for (const field of componentFields(id)) {
    const value = props[field.key];
    if (field.type === "text" && typeof value === "string")
      result[field.key] = value.slice(0, field.maxlength || 4096);
    if (field.type === "select" && field.options.includes(value))
      result[field.key] = value;
    if (
      field.type === "number" &&
      Number.isFinite(value) &&
      value >= field.min &&
      value <= field.max &&
      (field.step !== 1 || Number.isInteger(value))
    )
      result[field.key] = value;
  }
  return result;
}

/** Mount actual shared factories. Only component-level options are editable; no HTML, URLs or source evaluation. */
export function mountSandboxComponent(item, definition, palette, profile) {
  if (item.component === "layout-grid-overlay")
    return buildLayoutGridSample(item.props);
  if (item.component === "golden-canon-grid")
    return buildGoldenCanonSample(item.props);
  if (item.component === "language-switcher")
    return buildLanguageSwitcherSample(item.props);
  if (definition.libraryId)
    return preview(item.component, palette, profile, definition);
  const props = checkedProps(item.component, item.props);
  if (["git-history", "task-history"].includes(item.component))
    return buildHistorySample(item.component, props);
  if (codeMarkdownIds.has(item.component))
    return buildCodeMarkdownSample(item.component, props);
  if (item.component === "data-grid") return buildDataGridSample(props);
  if (item.component === "dropdown-select")
    return buildDropdownSelectSample(props);
  if (managementIds.has(item.component))
    return createManagementSample(item.component, props);
  let sample;
  switch (item.component) {
    case "ambient-chart": {
      const labels = props.labels.split(";").map((value) => value.trim());
      const values = props.values.split(";").map((value) => {
        const text = value.trim();
        if (text === "null") return null;
        if (!text)
          throw new TypeError("Пустое значение: используйте null для пропуска");
        return Number(text);
      });
      sample = createAmbientChart({
        ...props,
        labels,
        values,
        showPanel: props.showPanel === "true",
      });
      break;
    }
    case "button":
      sample = createButton(props);
      break;
    case "field":
      sample = createField({
        ...props,
        maxLength: props.maxLength < 0 ? undefined : props.maxLength,
        id: `sandbox-field-${item.id}`,
      });
      break;
    case "grid-icon-draft":
      sample = buildGridIconWorkshop({
        ...props,
        locale: document.documentElement.lang || "ru",
      });
      break;
    case "event-bus":
    case "request-router":
      sample = buildAppRuntimeSample({
        ...props,
        mode: item.component === "event-bus" ? "bus" : "router",
      });
      break;
    case "async-boundary":
      sample = buildAsyncBoundarySample(props);
      break;
    case "palette-builder":
      sample = createPaletteBuilder({ ...props, document });
      break;
    case "textarea":
      sample = createTextarea({
        ...props,
        maxLength: props.maxLength < 0 ? undefined : props.maxLength,
        id: `sandbox-textarea-${item.id}`,
      });
      break;
    case "text-block":
      sample = createTextBlock({
        ...props,
        document,
        copyable: props.copyable === "true",
      });
      break;
    case "numeric-badge": {
      let scale;
      if (props.scaleKind === "linear")
        scale = createNumericScale({ min: props.min, max: props.max });
      else if (props.scaleKind === "none") scale = createNumericScale();
      else {
        const values = [];
        if (props.population.trim())
          for (const token of props.population.split(";")) {
            if (!token.trim())
              throw new TypeError(
                "Укажите число вместо пустого значения популяции",
              );
            values.push(Number(token.trim()));
          }
        scale = createNumericScale({ values });
      }
      sample = createNumericBadge({
        value: props.value,
        label: props.label,
        mode: props.mode,
        scale,
      });
      break;
    }
    case "status":
      sample = createStatus(props);
      break;
    case "notice":
      sample = createNotice(props);
      break;
    case "empty-state":
      sample = createEmptyState(props);
      break;
    case "progress":
      sample = createProgress(props);
      break;
    case "skeleton":
      sample = createSkeleton(props);
      break;
    case "inline-help":
      sample = createInlineHelp(props);
      break;
    case "section-stack":
      sample = createSectionStack({
        ...props,
        items: [h("p", {}, props.text)],
      });
      break;
    case "state-panel":
      sample = createStatePanel(props);
      break;
    case "loading-indicator":
      return createLoadingIndicator(props);
    case "ascii-background": {
      const { text, ...options } = props;
      const background = createAsciiBackground(options);
      const element = h(
        "div",
        { className: "sandbox-ascii" },
        background.element,
      );
      background.setText(text);
      let paused = false;
      const pause = createButton({
        label: "Пауза фона",
        variant: "quiet",
        onClick: () => {
          paused = !paused;
          if (paused) background.pause();
          else background.play();
          pause.setAttribute("aria-pressed", String(paused));
        },
      });
      pause.setAttribute("aria-pressed", "false");
      pause.classList.add("sandbox-ascii-pause");
      element.append(pause);
      return { element, dispose: background.dispose };
    }
    default:
      return buildSample(item.component);
  }
  return sample.element
    ? sample
    : { element: sample, dispose: () => sample.dispose?.() };
}

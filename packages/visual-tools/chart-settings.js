import { node } from "./runtime.js";
import { analyticTokens } from "./analytic-options.js";

/** Grouped native settings editor: exact-ID overrides inherit defaults; one change writes only its own property and preserves focus. */
export function createChartSettings({
  document = globalThis.document,
  chart,
  series = [],
} = {}) {
  if (!chart?.setOptions || !chart?.options)
    throw new TypeError("A configurable chart controller required");
  const element = node(document, "section", "ag-vt ag-chart-settings"),
    heading = node(document, "h3", "", "Настройки"),
    search = node(document, "input"),
    error = node(document, "p", "ag-chart-settings__error"),
    target = node(document, "select"),
    groups = [],
    listeners = [],
    fields = [],
    axisFields = [];
  search.type = "search";
  search.placeholder = "Найти настройку";
  search.setAttribute("aria-label", "Найти настройку графика");
  error.setAttribute("role", "alert");
  error.hidden = true;
  element.append(heading, search);
  let disposed = false;
  function listen(control, type, fn) {
    control.addEventListener(type, fn);
    listeners.push(() => control.removeEventListener(type, fn));
  }
  /** Reflect a failed validation alongside controls; the chart retains its prior configuration. */
  function apply(change) {
    try {
      chart.setOptions(change);
      error.hidden = true;
      refresh();
    } catch (cause) {
      error.textContent = cause.message;
      error.hidden = false;
    }
  }
  function group(title) {
    const section = node(document, "details", "ag-chart-settings__group");
    section.open = true;
    section.append(node(document, "summary", "", title));
    element.append(section);
    groups.push(section);
    return section;
  }
  /** A control's metadata records its scope; overrides contain only explicit user changes rather than resolved defaults. */
  function field(
    host,
    label,
    key,
    choices,
    { scope = "field", type = "select", min, max } = {},
  ) {
    const row = node(document, "label", "ag-chart-settings__field"),
      caption = node(document, "span", "", label),
      badge = node(document, "small", "ag-chart-settings__inherit");
    let input;
    if (type === "select") {
      input = node(document, "select");
      for (const [value, text] of choices) {
        const o = node(document, "option", "", text);
        o.value = value;
        input.append(o);
      }
    } else {
      input = node(document, "input");
      input.type = type;
      if (min !== undefined) input.min = String(min);
      if (max !== undefined) input.max = String(max);
      if (type === "number") input.step = "any";
    }
    input.setAttribute("aria-label", label);
    row.append(caption, input, badge);
    host.append(row);
    const descriptor = { input, key, scope, badge, row, label };
    fields.push(descriptor);
    listen(input, "change", () => {
      let value = input.type === "checkbox" ? input.checked : input.value;
      if (input.type === "number")
        value = input.value === "" ? undefined : Number(input.value);
      if (scope === "panel" || scope === "global") {
        apply({ [key]: value });
        return;
      }
      const current = chart.options;
      if (!target.value) apply({ defaults: { [key]: value } });
      else {
        const overrides = { ...current.overrides },
          old = { ...overrides[target.value] };
        if (value === undefined) delete old[key];
        else old[key] = value;
        overrides[target.value] = old;
        apply({ overrides });
      }
    });
    return descriptor;
  }
  const appearance = group("Оформление и значения");
  if (chart.kind) {
    field(
      appearance,
      "Отображение",
      "renderer",
      [
        ["svg", "Обычное"],
        ["ascii", "ASCII"],
      ],
      { scope: "panel" },
    );
    field(
      appearance,
      "Единица",
      "unit",
      [
        ["number", "Число"],
        ["percent", "Проценты"],
        ["bytes", "Байты"],
        ["ms", "Миллисекунды"],
        ["s", "Секунды"],
      ],
      { scope: "panel" },
    );
    field(appearance, "Знаков после запятой", "decimals", [], {
      scope: "panel",
      type: "number",
      min: 0,
      max: 6,
    });
    field(
      appearance,
      "Цвет",
      "color",
      analyticTokens.map((t) => [t, tokenName(t)]),
      { scope: "panel" },
    );
    if (chart.kind === "heatmap")
      field(
        appearance,
        "Шкала плотности",
        "scale",
        [
          ["linear", "Линейная"],
          ["log", "Логарифмическая"],
        ],
        { scope: "panel" },
      );
    if (chart.kind === "state-timeline") {
      field(appearance, "Подписи состояний", "showLabels", [], {
        scope: "panel",
        type: "checkbox",
      });
      field(appearance, "Объединять соседние состояния", "mergeAdjacent", [], {
        scope: "panel",
        type: "checkbox",
      });
    }
  } else {
    const targetLabel = node(document, "label", "ag-chart-settings__target");
    targetLabel.append(node(document, "span", "", "Применить к"));
    target.setAttribute("aria-label", "Ряд для настройки");
    const all = node(document, "option", "", "Все ряды · по умолчанию");
    all.value = "";
    target.append(all);
    for (const item of series) {
      const option = node(document, "option", "", item.label);
      option.value = item.id;
      target.append(option);
    }
    targetLabel.append(target);
    appearance.append(targetLabel);
    listen(target, "change", refresh);
    field(appearance, "Единица", "unit", [
      ["number", "Число"],
      ["percent", "Проценты"],
      ["bytes", "Байты"],
      ["ms", "Миллисекунды"],
      ["s", "Секунды"],
    ]);
    field(appearance, "Знаков после запятой", "decimals", [], {
      type: "number",
      min: 0,
      max: 6,
    });
    field(appearance, "Цвет", "color", [
      ["auto", "Автоматически"],
      ...analyticTokens.map((t) => [t, tokenName(t)]),
    ]);
    field(appearance, "Ось", "axis", [
      ["left", "Слева"],
      ["right", "Справа"],
    ]);
    const lines = group("Линии и пропуски");
    field(lines, "Ряд виден", "visible", [], { type: "checkbox" });
    field(lines, "Интерполяция", "interpolation", [
      ["linear", "Линейная"],
      ["step", "Ступени"],
    ]);
    field(lines, "Толщина линии", "lineWidth", [], {
      type: "number",
      min: 0.5,
      max: 6,
    });
    field(lines, "Заливка", "fill", [], { type: "number", min: 0, max: 1 });
    field(lines, "Соединять пропуски", "connectNulls", [], {
      type: "checkbox",
    });
    const reset = node(
      document,
      "button",
      "ag-vt-button",
      "Убрать переопределения ряда",
    );
    reset.type = "button";
    lines.append(reset);
    listen(reset, "click", () => {
      if (!target.value) return;
      const overrides = { ...chart.options.overrides };
      delete overrides[target.value];
      apply({ overrides });
    });
    const axes = group("Диапазоны осей");
    for (const side of ["left", "right"])
      for (const bound of ["min", "max"]) {
        const row = node(document, "label", "ag-chart-settings__field"),
          input = node(document, "input"),
          label = `${side === "left" ? "Левая" : "Правая"} ось · ${bound === "min" ? "минимум" : "максимум"}`;
        input.type = "number";
        input.step = "any";
        input.setAttribute("aria-label", label);
        input.placeholder = "Авто";
        row.append(node(document, "span", "", label), input);
        axes.append(row);
        axisFields.push({ input, side, bound });
        listen(input, "change", () => {
          const options = chart.options,
            limits = { ...options.axes[side] };
          if (input.value === "") delete limits[bound];
          else limits[bound] = Number(input.value);
          apply({ axes: { ...options.axes, [side]: limits } });
        });
      }
    const interaction = group("Подсказки и время");
    field(
      interaction,
      "Подсказка",
      "tooltip",
      [
        ["all", "Все ряды"],
        ["selected", "Выбранный ряд"],
        ["hidden", "Скрыть"],
      ],
      { scope: "global" },
    );
    field(interaction, "Временная ось · UTC", "time", [], {
      scope: "global",
      type: "checkbox",
    });
  }
  const thresholds = group("Пороги"),
    thresholdList = node(document, "div"),
    add = node(document, "button", "ag-vt-button", "Добавить порог");
  add.type = "button";
  thresholds.append(thresholdList, add);
  listen(add, "click", () => {
    const options = chart.options;
    apply({
      thresholds: [
        ...options.thresholds,
        { value: 0, color: "danger", ...(!chart.kind ? { axis: "left" } : {}) },
      ],
    });
  });
  element.append(error);
  /** Rebuild only threshold rows; main form controls and the selected override keep their native focus. */
  function refreshThresholds() {
    const focused = thresholdList.contains(document.activeElement)
      ? document.activeElement.getAttribute("aria-label")
      : null;
    thresholdList.replaceChildren();
    const options = chart.options;
    options.thresholds.forEach((threshold, index) => {
      const row = node(document, "div", "ag-chart-settings__threshold"),
        input = node(document, "input"),
        color = node(document, "select"),
        remove = node(document, "button", "ag-vt-button", "Удалить");
      input.type = "number";
      input.step = "any";
      input.value = String(threshold.value);
      input.setAttribute("aria-label", `Значение порога ${index + 1}`);
      color.setAttribute("aria-label", `Цвет порога ${index + 1}`);
      for (const token of analyticTokens) {
        const option = node(document, "option", "", tokenName(token));
        option.value = token;
        color.append(option);
      }
      color.value = threshold.color;
      remove.type = "button";
      remove.setAttribute("aria-label", `Удалить порог ${index + 1}`);
      const change = () => {
        const values = chart.options.thresholds;
        values[index] = {
          ...values[index],
          value: Number(input.value),
          color: color.value,
        };
        apply({ thresholds: values });
      };
      input.addEventListener("change", change);
      color.addEventListener("change", change);
      remove.addEventListener("click", () =>
        apply({
          thresholds: chart.options.thresholds.filter((_, i) => i !== index),
        }),
      );
      row.append(input, color, remove);
      thresholdList.append(row);
    });
    if (focused)
      for (const control of thresholdList.querySelectorAll("[aria-label]"))
        if (control.getAttribute("aria-label") === focused) {
          control.focus();
          break;
        }
  }
  /** Resolve inherited values visibly without turning them into stored overrides. */
  function refresh() {
    const options = chart.options;
    for (const item of axisFields)
      item.input.value = String(options.axes[item.side][item.bound] ?? "");
    for (const item of fields) {
      let value = options[item.key],
        inherited = false;
      if (item.scope === "field") {
        value = options.defaults[item.key];
        if (target.value) {
          inherited = !Object.hasOwn(
            options.overrides[target.value] || {},
            item.key,
          );
          value = options.overrides[target.value]?.[item.key] ?? value;
        }
      }
      if (item.input.type === "checkbox") item.input.checked = Boolean(value);
      else item.input.value = String(value ?? "");
      item.badge.textContent =
        item.scope === "field" && target.value
          ? inherited
            ? "Общее"
            : "Переопределено"
          : "";
    }
    refreshThresholds();
  }
  listen(search, "input", () => {
    const query = search.value.trim().toLocaleLowerCase("ru-RU");
    for (const section of groups) {
      section.hidden =
        query &&
        !section.textContent.toLocaleLowerCase("ru-RU").includes(query);
      if (query && !section.hidden) section.open = true;
    }
  });
  refresh();
  return {
    element,
    refresh,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const remove of listeners) remove();
      thresholdList.replaceChildren();
      element.remove();
    },
  };
}
/** Human labels describe semantic roles rather than binding controls to one service palette. */
function tokenName(token) {
  return {
    accent: "Акцент",
    success: "Успех",
    danger: "Внимание",
    text: "Основной текст",
    muted: "Приглушённый",
    border: "Граница",
  }[token];
}

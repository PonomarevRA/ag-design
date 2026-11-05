import { createChart } from "./chart.js";
import { node } from "./runtime.js";

/** Tune a decorative character chart from synthetic local data; host services never enter this example. */
export function createAsciiChartSample(document) {
  const host = node(document, "section", "ag-vt ag-vt-particle-demo");
  const controls = node(document, "div", "ag-vt-particle-demo__controls");
  const listeners = [],
    settings = {
      asciiCharset: "classic",
      asciiFontSize: 10,
      asciiSpeed: 0.6,
      asciiGlow: 0.25,
    };
  let alternate = false,
    paused = false,
    chart;
  /** Keep sample handlers owned so catalogue windowing can dispose a complete subtree. */
  function listen(target, name, callback) {
    target.addEventListener(name, callback);
    listeners.push(() => target.removeEventListener(name, callback));
  }
  /** Create one labelled select whose values are fixed local enum members. */
  function select(label, choices, changed) {
    const input = node(document, "select");
    input.setAttribute("aria-label", label);
    for (const [value, text] of choices) {
      const option = node(document, "option", "", text);
      option.value = value;
      input.append(option);
    }
    listen(input, "change", changed);
    controls.append(input);
    return input;
  }
  const type = select(
    "Тип ASCII-графика",
    [
      ["area", "Области"],
      ["composed", "Столбцы + линия"],
      ["line", "Линии"],
      ["bar", "Столбцы"],
      ["pie", "Круг"],
      ["donut", "Кольцо"],
      ["scatter", "Точки"],
      ["bubble", "Пузырьки"],
      ["radar", "Радар"],
    ],
    () => chart.update(dataset()),
  );
  const charset = select(
    "Символы графика",
    [
      ["classic", "ASCII .:+*#@"],
      ["binary", "Двоичный 01"],
      ["braille", "Брайль"],
    ],
    () => {
      settings.asciiCharset = charset.value;
      chart.update(settings);
    },
  );
  for (const [key, title, min, max, step] of [
    ["asciiFontSize", "Размер символа", 6, 14, 1],
    ["asciiSpeed", "Перелив", 0, 2, 0.1],
    ["asciiGlow", "Свечение", 0, 1, 0.05],
  ]) {
    const label = node(document, "label", "", title),
      input = node(document, "input");
    input.type = "range";
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = settings[key];
    input.setAttribute("aria-label", title);
    label.append(input);
    controls.append(label);
    listen(input, "change", () => {
      settings[key] = Number(input.value);
      chart.update(settings);
    });
  }
  const pause = node(document, "button", "", "Пауза"),
    update = node(document, "button", "", "Обновить данные");
  pause.type = update.type = "button";
  pause.setAttribute("aria-pressed", "false");
  controls.append(pause, update);
  host.append(
    controls,
    node(
      document,
      "p",
      "ag-vt-muted",
      "Декоративная визуализация · точные значения в подсказке и таблице",
    ),
  );
  /** Share one numeric scale across mixed series; donut explicitly accepts a single nonnegative series. */
  function dataset() {
    const values = alternate
      ? [34, 52, 28, 63, 42, 76]
      : [20, 40, 35, 55, 48, 70];
    const series = [
      { id: "current", label: "Текущий период", type: "bar", values },
      {
        id: "previous",
        label: "Прошлый период",
        type: "line",
        values: values.map((x) => x * 0.7),
      },
    ];
    let shownSeries = series;
    if (["pie", "donut"].includes(type.value)) shownSeries = [series[0]];
    else if (["scatter", "bubble"].includes(type.value)) {
      shownSeries = [];
      for (const item of series) {
        const points = [];
        for (const [index, y] of item.values.entries())
          points.push({ x: index + 1, y, size: y / 10 });
        shownSeries.push({ ...item, values: points });
      }
    }
    return {
      label: "Характер данных",
      type: type.value,
      labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
      series: shownSeries,
    };
  }

  chart = createChart({
    document,
    renderer: "ascii",
    animated: true,
    ...dataset(),
    ...settings,
  });
  host.append(chart.element);
  listen(pause, "click", () => {
    paused = !paused;
    chart.update({ paused });
    pause.textContent = paused ? "Продолжить" : "Пауза";
    pause.setAttribute("aria-pressed", String(paused));
  });
  /** Switch between two explicit datasets, keeping geometry and literal values inspectable. */
  function changeData() {
    alternate = !alternate;
    chart.update(dataset());
  }
  listen(update, "click", changeData);
  return {
    element: host,
    interact: changeData,
    dispose() {
      for (const remove of listeners) remove();
      chart.dispose();
      host.remove();
    },
  };
}

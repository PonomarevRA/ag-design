import { createChart } from "./chart.js";
import { node } from "./runtime.js";
/** Offline tuning sample with two real supplied series; each type uses its own valid data shape. */
export function createParticleSample(document) {
  const host = node(document, "section", "ag-vt ag-vt-particle-demo"),
    controls = node(document, "div", "ag-vt-particle-demo__controls"),
    listeners = [];
  const type = node(document, "select");
  type.setAttribute("aria-label", "Тип графика частиц");
  for (const [value, text] of [
    ["area", "Область"],
    ["bar", "Столбцы"],
    ["line", "Линия"],
    ["donut", "Кольцо"],
    ["radar", "Радар"],
    ["bubble", "Пузыри"],
  ]) {
    const option = node(document, "option", "", text);
    option.value = value;
    type.append(option);
  }
  controls.append(type);
  const settings = {
    particleDensity: 1,
    particleSize: 0.7,
    particleBloom: 0.65,
    particleJitter: 0.75,
  };
  /** Register a removable handler because samples can be unmounted by render-window. */
  function listen(target, name, handler) {
    target.addEventListener(name, handler);
    listeners.push(() => target.removeEventListener(name, handler));
  }
  for (const [key, title, min, max, step] of [
    ["particleDensity", "Плотность", 0.25, 2, 0.25],
    ["particleBloom", "Свечение", 0, 1, 0.05],
    ["particleJitter", "Движение", 0, 3, 0.25],
  ]) {
    const label = node(document, "label", "", title),
      input = node(document, "input");
    input.type = "range";
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = settings[key];
    input.setAttribute("aria-label", title + " частиц");
    label.append(input);
    controls.append(label);
    listen(input, "change", () => {
      settings[key] = Number(input.value);
      chart.update(settings);
    });
  }
  const cacheLabel = node(document, "label", "", "Кэш заливки"),
    cacheInput = node(document, "input");
  cacheInput.type = "checkbox";
  cacheInput.checked = true;
  cacheInput.setAttribute("aria-label", "Кэш заливки");
  cacheLabel.append(cacheInput);
  controls.append(cacheLabel);
  listen(cacheInput, "change", () =>
    chart.update({ particleCache: cacheInput.checked }),
  );
  const cacheMode = node(document, "select");
  cacheMode.setAttribute("aria-label", "Способ кэширования");
  for (const [value, title] of [
    ["strips", "15полос"],
    ["frames", "Кадры"],
  ]) {
    const option = node(document, "option", "", title);
    option.value = value;
    cacheMode.append(option);
  }
  controls.append(cacheMode);
  listen(cacheMode, "change", () =>
    chart.update({ particleCacheMode: cacheMode.value }),
  );
  const pause = node(document, "button", "", "Пауза"),
    update = node(document, "button", "", "Обновить данные");
  pause.type = update.type = "button";
  controls.append(pause, update);
  host.append(controls);
  let paused = false,
    alternate = false;
  /** Use exact nonnegative radial data and explicit x/y/size for bubbles; no service calls or hidden random data. */
  function dataset() {
    const radial = ["donut", "radar"].includes(type.value),
      bubbles = type.value === "bubble";
    let values = alternate
      ? [35, 52, 43, 68, 55, 81]
      : [20, 40, 35, 55, 48, 70];
    if (bubbles)
      values = values.map((y, i) => ({ x: i * 12 + 5, y, size: i + 2 }));
    const second = values.map((value, i) =>
      bubbles
        ? { x: value.x + 3, y: value.y * 0.7, size: i + 1 }
        : value * 0.65,
    );
    return {
      type: type.value,
      label: "Демонстрационные данные",
      labels:
        type.value === "donut"
          ? ["Прямые", "Поиск", "Соцсети", "Партнёры", "Почта", "Другое"]
          : radial
            ? [
                "Скорость",
                "Мощность",
                "Запас",
                "Стоимость",
                "Комфорт",
                "Надёжность",
              ]
            : ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
      series:
        type.value === "donut"
          ? [{ id: "main", label: "Каналы", values }]
          : [
              { id: "main", label: "Текущий период", values },
              { id: "previous", label: "Прошлый период", values: second },
            ],
    };
  }
  const chart = createChart({
    document,
    ...dataset(),
    ...settings,
    renderer: "particles",
    animated: true,
  });
  host.append(chart.element);
  listen(type, "change", () => chart.update(dataset()));
  listen(pause, "click", () => {
    paused = !paused;
    chart.update({ paused });
    pause.textContent = paused ? "Продолжить" : "Пауза";
    pause.setAttribute("aria-pressed", String(paused));
  });
  listen(update, "click", () => {
    alternate = !alternate;
    chart.update(dataset());
  });
  return {
    element: host,
    interact: () => {
      alternate = !alternate;
      chart.update(dataset());
    },
    dispose() {
      for (const remove of listeners) remove();
      chart.dispose();
      host.remove();
    },
  };
}

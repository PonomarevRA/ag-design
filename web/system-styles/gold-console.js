import { mountStyleChoice } from "./vendor/lab/choices.js";
import { disposeOnPageExit } from "./demo-page-lifecycle.js";
import { createDemoState } from "./demo-state.js";
import { mountDemoSystem } from "./demo-shell.js?v=demo-systems-5";
import { createStyleChart } from "./style-chart.js";
import { createGoldState, sceneValues, streamSnapshot } from "./gold-model.js";

const style = document.documentElement.dataset.style;
const store = createDemoState({
  window,
  style,
  scope: "console",
  initial: {
    ...createGoldState(),
    period: "hour",
    day: 26,
    events: [{ time: "09:05:00", message: "Базовая сцена загружена" }],
  },
  validate: (value) =>
    value.values.length === 4 &&
    value.values.every(
      (item) => Number.isInteger(item) && item >= 0 && item <= 100,
    ) &&
    Number.isInteger(value.selected) &&
    value.selected >= 0 &&
    value.selected < 4 &&
    ["hour", "day"].includes(value.period) &&
    Number.isInteger(value.day) &&
    value.day > 0 &&
    value.day < 32 &&
    value.events.length <= 12,
});
const state = store.state;
const technical = document.documentElement.dataset.style === "amber-circuit";
const labels = technical
  ? ["Основной", "Вспомогательный", "Стабилизация", "Резервный"]
  : ["Освещение", "Звук", "Климат", "Медиа"];
const sceneLabels = {
  base: "Базовая",
  depth: "Глубина",
  pulse: "Импульс",
  scan: "Сканирование",
};
const byId = (id) => document.getElementById(id);
const storageKey = `ag-design-demo-${technical ? "amber-circuit" : "graphite-gold"}-v1`;
let channelChoice = null;
let chart = null,
  period = state.period;

/** Create literal UI text; channel labels and event descriptions never become HTML. */
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

/** Keep the native range, tactile dial, channel list and graph statistics on one local snapshot. */
function render() {
  state.period = period;
  store.save();
  const value = state.values[state.selected];
  byId("dial-value").textContent = `${value}%`;
  byId("dial-label").textContent = labels[state.selected];
  byId("dial-range").value = value;
  byId("dial-range").setAttribute(
    "aria-label",
    `${labels[state.selected]}, интенсивность`,
  );
  byId("gold-dial").style.setProperty("--dial", `${value * 2.7}deg`);
  byId("gold-dial").setAttribute(
    "aria-label",
    `${labels[state.selected]}: ${value}%`,
  );
  for (const input of document.querySelectorAll("[data-channel-range]")) {
    const index = Number(input.dataset.channelRange);
    input.value = state.values[index];
    byId(`channel-value-${index}`).textContent = `${state.values[index]}%`;
  }
  for (const button of document.querySelectorAll("button[data-channel]"))
    button.setAttribute(
      "aria-pressed",
      String(Number(button.dataset.channel) === state.selected),
    );
  for (const button of document.querySelectorAll("[data-scene]"))
    button.setAttribute(
      "aria-pressed",
      button.dataset.scene === state.scene ? "true" : "false",
    );
  channelChoice?.setValue(String(state.selected));
  const snapshot = streamSnapshot(state, period);
  const options = {
    label: "Уровень выбранного канала",
    type: "area",
    labels: snapshot.labels,
    series: [{ id: "level", label: "Уровень, %", values: snapshot.values }],
    min: 0,
    max: 100,
  };
  if (chart) chart.update(options);
  else chart = createStyleChart(byId("gold-chart"), options);
  const number = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
  if (byId("stream-current")) {
    byId("stream-current").textContent = `${number.format(snapshot.current)}%`;
    byId("stream-mean").textContent = `${number.format(snapshot.mean)}%`;
    byId("stream-range").textContent = `${snapshot.min}% / ${snapshot.max}%`;
  }
}

/** Append a bounded local event after an actual user action; synthetic timestamps do not represent a live service. */
function addEvent(message) {
  const body = byId("gold-events");
  const time = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
  state.events.unshift({ time, message });
  state.events.length = Math.min(12, state.events.length);
  store.save();
  const row = element("tr");
  row.append(
    element("td", time),
    element("td", "Локально"),
    element("td", message),
  );
  body.prepend(row);
  while (body.children.length > 12) body.lastElementChild.remove();
  byId("gold-announcement").textContent = message;
  byId("apply-status").textContent = message;
}

/** Mount the four editable channels as labeled native ranges; moving a channel selects the matching dial. */
function mountChannels() {
  const host = byId("channel-list");
  if (!host) return;
  for (const [index, label] of labels.entries()) {
    const row = element("label", undefined, "channel-row");
    const name = element("span", label);
    const value = element("output", `${state.values[index]}%`);
    value.id = `channel-value-${index}`;
    const input = element("input");
    input.type = "range";
    input.min = "0";
    input.max = "100";
    input.value = state.values[index];
    input.dataset.channelRange = String(index);
    input.setAttribute("aria-label", label);
    input.addEventListener("input", () => {
      state.selected = index;
      state.values[index] = Number(input.value);
      state.scene = "custom";
      render();
    });
    row.append(name, input, value);
    host.append(row);
  }
}

/** A small literal calendar is a scene context picker, never an imitation of the operating system. */
function mountCalendar() {
  const calendar = byId("gold-calendar");
  if (!calendar) return;
  for (const label of ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"])
    calendar.append(element("span", label, "calendar-weekday"));
  // October 2026 starts on Thursday in this Monday-first calendar.
  for (let offset = 0; offset < 3; offset++) {
    const blank = element("span");
    blank.setAttribute("aria-hidden", "true");
    calendar.append(blank);
  }
  for (let day = 1; day <= 31; day++) {
    const button = element("button", String(day));
    button.type = "button";
    button.setAttribute("aria-label", `${day} октября`);
    button.setAttribute("aria-pressed", String(day === state.day));
    button.addEventListener("click", () => {
      for (const other of calendar.querySelectorAll("button"))
        other.setAttribute("aria-pressed", String(other === button));
      state.day = day;
      store.save();
      byId("calendar-date").textContent = `${day} октября`;
    });
    calendar.append(button);
  }
}

/** Bind stable native actions and release chart-owned canvas/observers when this example leaves the page. */
function mount() {
  mountChannels();
  mountCalendar();
  const body = byId("gold-events");
  body.replaceChildren();
  for (const event of state.events) {
    const row = element("tr");
    row.append(
      element("td", event.time),
      element("td", "Локально"),
      element("td", event.message),
    );
    body.append(row);
  }
  if (byId("calendar-date"))
    byId("calendar-date").textContent = `${state.day} октября`;
  if (byId("stream-period")) byId("stream-period").value = period;
  const channelHost = document.querySelector(".channel-tabs");
  if (channelHost) {
    channelChoice = mountStyleChoice({
      document,
      host: channelHost,
      attribute: "data-channel",
      value: String(state.selected),
      onChange: (value) => {
        state.selected = Number(value);
        render();
      },
    });
  }
  for (const button of document.querySelectorAll("button[data-channel]"))
    button.addEventListener("click", () => {
      state.selected = Number(button.dataset.channel);
      render();
    });
  for (const button of document.querySelectorAll("[data-scene]"))
    button.addEventListener("click", () => {
      state.scene = button.dataset.scene;
      state.values = sceneValues(state.scene);
      render();
      byId("apply-status").textContent =
        `Подготовлена сцена «${sceneLabels[state.scene]}»`;
    });
  byId("dial-range").addEventListener("input", (event) => {
    state.values[state.selected] = Number(event.target.value);
    state.scene = "custom";
    render();
  });
  byId("apply-scene").addEventListener("click", () =>
    addEvent(
      `Применено в примере: ${labels[state.selected]}, ${state.values[state.selected]}%`,
    ),
  );
  byId("reset-scene").addEventListener("click", () => {
    state.values = sceneValues("base");
    state.scene = "base";
    state.selected = 0;
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    render();
    addEvent("Восстановлена базовая сцена");
  });
  byId("save-scene").addEventListener("click", () => {
    try {
      if (!store.save()) throw new Error("Storage unavailable");
      addEvent("Демо-настройки сохранены в этом браузере");
    } catch {
      addEvent("Хранилище недоступно; текущие значения остаются на экране");
    }
  });
  byId("stream-period")?.addEventListener("change", (event) => {
    period = event.target.value;
    render();
  });
  render();
  disposeOnPageExit(window, () => {
    channelChoice?.dispose();
    chart?.dispose();
  });
}
mount();
mountDemoSystem({
  document,
  getNewRecord: () =>
    Object.fromEntries(
      state.values.map((value, index) => [`level${index}`, value]),
    ),
  onApply: (record) => {
    state.values = [record.level0, record.level1, record.level2, record.level3];
    state.scene = "custom";
    render();
    addEvent(`Применена локальная сцена: ${record.name}`);
    window.location.hash = "demo-work";
  },
});

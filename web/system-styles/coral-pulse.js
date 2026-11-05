import { mountStyleChoice } from "./vendor/lab/choices.js";
import { disposeOnPageExit } from "./demo-page-lifecycle.js";
import { createDemoState } from "./demo-state.js";
import { mountDemoSystem } from "./demo-shell.js?v=demo-systems-5";
import { createStyleChart } from "./style-chart.js";
const chartControllers = new Map();
let periodChoice = null;
import {
  activities,
  periodSnapshot,
  daySnapshot,
} from "./coral-pulse-model.js";

const store = createDemoState({
  window,
  style: "coral-pulse",
  scope: "fitness",
  initial: { activity: "cardio", period: "day", day: 6 },
  validate: (value) =>
    activities().some((item) => item.id === value.activity) &&
    ["day", "week", "month"].includes(value.period) &&
    Number.isInteger(value.day) &&
    value.day >= 0 &&
    value.day < 7,
});

/** Build trusted SVG geometry only; real labels and equivalent data remain selectable text. */
function svgNode(tag, attributes = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attributes))
    node.setAttribute(key, String(value));
  return node;
}

/** Plot an area curve from the selected activity's actual synthetic bins, never a generated bitmap. */
function renderOverview(record) {
  store.state.activity = record.id;
  store.save();
  const options = {
    label: "Минуты по интервалам",
    type: "area",
    labels: record.values.map((_, index) => `${8 + index * 2}:00`),
    series: [{ id: "minutes", label: "Минуты", values: record.values }],
  };
  const existing = chartControllers.get("overview");
  if (existing) existing.update(options);
  else
    chartControllers.set(
      "overview",
      createStyleChart(document.getElementById("overview-chart"), options),
    );
  let minutes = 0;
  for (const value of record.values) minutes += value;
  document.getElementById("activity-name").textContent = record.name;
  document.getElementById("activity-minutes").textContent = `${minutes} мин`;
  document.getElementById("activity-days").textContent =
    `${record.days} ${record.days >= 5 ? "дней" : "дня"}`;
  document.getElementById("overview-data").textContent =
    `${record.name}. Минуты по интервалам: ${record.values.join(", ")}. Всего ${minutes} минут.`;
}

/** Mount one stable button per activity; selecting a chart preserves the activated control and focus. */
function mountActivities() {
  const grid = document.getElementById("activity-grid");
  for (const [index, record] of activities().entries()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "activity-button";
    button.setAttribute(
      "aria-pressed",
      String(record.id === store.state.activity),
    );
    const orbit = document.createElement("span");
    orbit.className = "activity-orbit";
    orbit.setAttribute("aria-hidden", "true");
    const icon = svgNode("svg", { viewBox: "0 0 24 24" });
    icon.append(svgNode("path", { d: record.path }));
    const value = document.createElement("small");
    value.textContent = `${record.percent}%`;
    orbit.append(icon, value);
    button.append(orbit, document.createTextNode(record.name));
    button.addEventListener("click", () => {
      for (const other of grid.querySelectorAll("button"))
        other.setAttribute("aria-pressed", String(other === button));
      renderOverview(record);
      document.getElementById("announce").textContent =
        `Выбрана активность: ${record.name}`;
    });
    grid.append(button);
  }
  renderOverview(activities().find((item) => item.id === store.state.activity));
}

/** Synchronize one period's numeric ring, bars and equivalent prose without changing control geometry. */
function renderPeriod(period) {
  store.state.period = period;
  store.save();
  const snapshot = periodSnapshot(period);
  const number = new Intl.NumberFormat("ru-RU");
  document.getElementById("steps-value").textContent = number.format(
    snapshot.steps,
  );
  document.getElementById("steps-goal").textContent =
    `из ${number.format(snapshot.goal)} шагов`;
  document
    .getElementById("steps-ring")
    .setAttribute("aria-valuenow", snapshot.percent);
  document
    .getElementById("steps-ring")
    .setAttribute(
      "aria-valuetext",
      `${snapshot.steps} из ${snapshot.goal} шагов`,
    );
  document
    .getElementById("steps-arc")
    .setAttribute("stroke-dashoffset", 522 * (1 - snapshot.percent / 100));
  document.getElementById("walk-value").textContent = `${snapshot.walk} мин`;
  document.getElementById("run-value").textContent = `${snapshot.run} мин`;
  document.getElementById("period-label").textContent = snapshot.label;
  const options = {
    label: "Активность по интервалам",
    type: "bar",
    labels: snapshot.values.map((_, index) => String(index + 1)),
    series: [{ id: "activity", label: "Активность", values: snapshot.values }],
  };
  const existing = chartControllers.get("bars");
  if (existing) existing.update(options);
  else
    chartControllers.set(
      "bars",
      createStyleChart(document.getElementById("bars"), options),
    );
  document.getElementById("period-data").textContent =
    `${snapshot.label}: ${snapshot.steps} шагов из ${snapshot.goal}. Прогулка ${snapshot.walk} мин, тренировка ${snapshot.run} мин. Условная активность по интервалам: ${snapshot.values.join(", ")}.`;
}

/** Update a selected day's exact minute split, keeping over-goal totals visible beside a capped arc. */
function renderDay(index) {
  store.state.day = index;
  store.save();
  const snapshot = daySnapshot(index);
  const names = [
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
    "Воскресенье",
  ];
  document.getElementById("selected-date").textContent =
    `${names[index]}, ${19 + index} октября`;
  document.getElementById("minute-value").textContent = snapshot.minutes;
  document
    .getElementById("minute-arc")
    .setAttribute("stroke-dashoffset", 315 * (1 - snapshot.percent / 100));
  document
    .getElementById("minute-gauge")
    .setAttribute("aria-valuenow", Math.min(60, snapshot.minutes));
  document
    .getElementById("minute-gauge")
    .setAttribute("aria-valuetext", `${snapshot.minutes} из 60 минут`);
  const list = document.getElementById("contributions");
  list.replaceChildren();
  for (const item of snapshot.contributions) {
    const row = document.createElement("div");
    row.className = "contribution";
    const label = document.createElement("div");
    label.className = "contribution-label";
    const name = document.createElement("span");
    name.textContent = item.name;
    const minutes = document.createElement("span");
    minutes.textContent = `${item.minutes} мин`;
    label.append(name, minutes);
    const progress = document.createElement("progress");
    progress.max = snapshot.minutes;
    progress.value = item.minutes;
    progress.setAttribute("aria-label", `${item.name}: ${item.minutes} минут`);
    row.append(label, progress);
    list.append(row);
  }
  document.getElementById("progress-data").textContent =
    `Всего ${snapshot.minutes} минут. ${snapshot.contributions.map((item) => `${item.name}: ${item.minutes}`).join("; ")}.`;
}

/** Bind local view controls once; every interaction stays inside this disposable synthetic example. */
function mount() {
  mountActivities();
  renderPeriod(store.state.period);
  renderDay(store.state.day);
  periodChoice = mountStyleChoice({
    document,
    host: document.querySelector(".periods"),
    attribute: "data-period",
    value: store.state.period,
    onChange: (value) => {
      renderPeriod(value);
      document.getElementById("announce").textContent = `Период: ${periodSnapshot(value).label}`;
    },
  });
  for (const item of document.querySelectorAll("[data-day]"))
    item.setAttribute(
      "aria-pressed",
      String(Number(item.dataset.day) === store.state.day),
    );
  for (const button of document.querySelectorAll("[data-day]"))
    button.addEventListener("click", () => {
      for (const other of document.querySelectorAll("[data-day]"))
        other.setAttribute("aria-pressed", String(other === button));
      renderDay(Number(button.dataset.day));
      document.getElementById("announce").textContent =
        document.getElementById("selected-date").textContent;
    });
}
disposeOnPageExit(window, () => {
  for (const chart of chartControllers.values()) chart.dispose();
  chartControllers.clear();
  periodChoice?.dispose();
});
mount();
mountDemoSystem({ document });

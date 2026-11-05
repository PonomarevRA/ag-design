import { mountExampleBento } from "./vendor/lab/bento.js";
import { mountStyleChoice } from "./vendor/lab/choices.js";
import { disposeOnPageExit } from "./demo-page-lifecycle.js";
import { createDemoState } from "./demo-state.js";
import { mountDemoSystem } from "./demo-shell.js?v=demo-systems-5";
import { bindDashboardNavigation } from "./dashboard-common.js";
import { analyticsSnapshot, growthSeries } from "./dashboard-model.js";
import { el, mountDashboardChart, number, usd } from "./dashboard-common.js";
const byId = (id) => document.getElementById(id);
const store = createDemoState({
  window,
  style: "saas-clarity",
  scope: "analytics",
  initial: { period: "oct", grouping: "month" },
  validate: (value) =>
    ["sep", "oct"].includes(value.period) &&
    ["month", "quarter"].includes(value.grouping),
});
byId("analytics-period").value = store.state.period;
let grouping = store.state.grouping,
  growth = null,
  donut = null;
const plans = ["Enterprise", "Pro", "Team", "Starter"];
/** Render exact label/value/proportion triples using native progress and a stable denominator. */
function bars(host, labels, values, denominator, formatter) {
  host.replaceChildren();
  for (let index = 0; index < labels.length; index++) {
    const row = el("div", undefined, "rank-row");
    const line = el("div", undefined, "rank-line");
    line.append(
      el("span", labels[index]),
      el("strong", formatter(values[index])),
    );
    const progress = el("progress");
    progress.max = denominator;
    progress.value = values[index];
    progress.setAttribute("aria-label", labels[index]);
    row.append(line, progress);
    host.append(row);
  }
}
/** Use one period snapshot for KPIs, both charts, segment legend, funnel and market allocation. */
function render() {
  Object.assign(store.state, {
    period: byId("analytics-period").value,
    grouping,
  });
  store.save();
  const snapshot = analyticsSnapshot(byId("analytics-period").value);
  byId("mrr-value").textContent = usd.format(snapshot.mrr);
  byId("churn-value").textContent = `${snapshot.churn.toFixed(2)}%`;
  byId("arpu-value").textContent =
    `$${(snapshot.mrr / snapshot.active.at(-1)).toFixed(2)}`;
  byId("workspaces-value").textContent = number.format(snapshot.active.at(-1));
  byId("period-label").textContent =
    snapshot.period === "sep" ? "Сентябрь 2026" : "Октябрь 2026";
  const series = growthSeries(snapshot, grouping);
  const options = {
    label: "Активные пространства и платные подписки",
    type: "area",
    labels: series.labels,
    series: [
      { id: "active", label: "Активные", values: series.active },
      { id: "paid", label: "Платные", values: series.paid },
    ],
    min: 0,
    max: 6000,
  };
  if (growth) growth.update(options);
  else growth = mountDashboardChart(byId("growth-chart"), options);
  const segments = {
    label: "MRR по тарифам, USD",
    type: "donut",
    labels: plans,
    series: [{ id: "mrr", label: "MRR, USD", values: snapshot.amounts }],
  };
  if (donut) donut.update(segments);
  else donut = mountDashboardChart(byId("segments-chart"), segments);
  const legend = byId("plan-legend");
  legend.replaceChildren();
  for (let index = 0; index < plans.length; index++) {
    const row = el("div", undefined, "legend-row");
    const name = el("span", plans[index]);
    name.dataset.color = String(index);
    row.append(
      name,
      el("strong", usd.format(snapshot.amounts[index])),
      el("span", `${snapshot.shares[index]}%`),
    );
    legend.append(row);
  }
  const funnel = byId("funnel");
  funnel.replaceChildren();
  const stages = [
    "Регистрация",
    "Настройка пространства",
    "Приглашение команды",
    "Первая интеграция",
    "Платный тариф",
  ];
  for (let index = 0; index < stages.length; index++) {
    const row = el("div", undefined, "funnel-row"),
      line = el("div", undefined, "rank-line");
    line.append(
      el("span", `${index + 1}. ${stages[index]}`),
      el("strong", number.format(snapshot.funnel[index])),
    );
    const percent = (snapshot.funnel[index] / snapshot.signups) * 100;
    const track = el("div", undefined, "funnel-track"),
      fill = el("span", `${percent.toFixed(index ? 1 : 0)}%`);
    fill.style.width = `${percent}%`;
    track.append(fill);
    row.append(line, track);
    funnel.append(row);
  }
  byId("conversion").textContent =
    `Регистрация → оплата: ${((snapshot.funnel.at(-1) / snapshot.signups) * 100).toFixed(1)}%`;
  const marketAmounts = snapshot.markets.map((value) =>
    Math.floor((snapshot.mrr * value) / 100),
  );
  marketAmounts[4] += snapshot.mrr - marketAmounts.reduce((a, b) => a + b, 0);
  bars(
    byId("market-bars"),
    ["США", "Германия", "Великобритания", "Канада", "Другие"],
    marketAmounts,
    snapshot.mrr,
    (value) => usd.format(value),
  );
  let note = "Значения на конец каждого месяца. Синтетические данные.";
  if (grouping === "quarter") {
    note = series.labels.at(-1).endsWith("*")
      ? "* Q4 — неполный квартал. Значения на конец периода."
      : "Значения на конец каждого квартала. Синтетические данные.";
  }
  byId("grouping-note").textContent = note;
}
/** A small cohort table retains unavailable observations explicitly instead of filling them with zero. */
function mountCohorts() {
  const body = byId("cohort-body");
  const rows = [
    ["Июнь", 14200, 100, 102, 106, 110, 115],
    ["Июль", 16500, 100, 104, 108, 112, null],
    ["Август", 18900, 100, 101, 105, null, null],
    ["Сентябрь", 20100, 100, 103, null, null, null],
  ];
  for (const values of rows) {
    const row = el("tr");
    const heading = el("th", values[0]);
    heading.scope = "row";
    row.append(heading, el("td", usd.format(values[1])));
    for (const value of values.slice(2)) {
      const cell = el("td", value === null ? "—" : `${value}%`);
      if (value !== null)
        cell.dataset.level =
          value >= 110 ? "high" : value > 100 ? "mid" : "base";
      else cell.setAttribute("aria-label", "Нет данных");
      row.append(cell);
    }
    body.append(row);
  }
}
mountCohorts();
bars(
  byId("adoption"),
  ["API Sync", "Свои отчёты", "Автоматизация"],
  [88, 64, 42],
  100,
  (value) => `${value}%`,
);
byId("analytics-period").addEventListener("change", render);
const groupingChoice = mountStyleChoice({
  document,
  host: document.querySelector(".segmented"),
  attribute: "data-grouping",
  value: grouping,
  onChange: (value) => {
    grouping = value;
    render();
  },
});

render();
disposeOnPageExit(window, () => {
  groupingChoice.dispose();
  growth?.dispose();
  donut?.dispose();
});

bindDashboardNavigation();
mountExampleBento({ document });
mountDemoSystem({
  document,
  getNewRecord: () => ({ period: byId("analytics-period").value }),
  onApply: (record) => {
    byId("analytics-period").value = record.period;
    render();
    window.location.hash = "demo-work";
  },
});

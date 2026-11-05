import { createAnalyticChart } from "./analytic-chart.js";
import {
  createStat,
  createHeatmap,
  createStateTimeline,
} from "./analytic-panels.js";
import { createChartSettings } from "./chart-settings.js";
import { analyticFixture } from "./analytic-data-fixtures.js";
import { node } from "./runtime.js";

/** Actual public factories and one optional grouped inspector, with no network or external account data. */
export function createAnalyticSample(id, document) {
  const ascii = id.endsWith("-ascii");
  if (ascii) id = id.slice(0, -6);
  let chart;
  const series = [
    { id: "s0", label: "Текущий период" },
    { id: "s1", label: "Сравнение 1" },
  ];
  if (id === "analytic-chart" || id === "chart-settings")
    chart = createAnalyticChart({
      document,
      data: analyticFixture(),
      options: { label: "Измерения во времени", time: true },
    });
  else if (id === "stat-sparkline")
    chart = createStat({
      document,
      data: { value: 72.4, sparkline: analyticFixture(80, 1) },
      options: {
        label: "Использование ресурсов",
        unit: "percent",
        thresholds: [{ value: 85, color: "danger" }],
      },
      height: 150,
    });
  else if (id === "heatmap") {
    const values = [];
    for (let row = 0; row < 6; row++) {
      const line = [];
      for (let col = 0; col < 12; col++)
        line.push(
          row === 2 && col === 4
            ? null
            : Math.round((Math.sin(col * 0.5 + row * 0.8) + 1) * 30),
        );
      values.push(line);
    }
    chart = createHeatmap({
      document,
      data: {
        xEdges: Array.from({ length: 13 }, (_, i) => i * 5),
        yEdges: [0, 10, 20, 30, 40, 50, 60],
        values,
      },
      options: {
        label: "Распределение задержек",
        thresholds: [{ value: 50, color: "danger" }],
      },
    });
  } else if (id === "state-timeline")
    chart = createStateTimeline({
      document,
      data: {
        lanes: [
          {
            id: "api",
            label: "API",
            intervals: [
              { start: 0, end: 20, state: "Работает", color: "success" },
              { start: 20, end: 27, state: "Задержка", color: "danger" },
              { start: 27, end: 60, state: "Работает", color: "success" },
            ],
          },
          {
            id: "worker",
            label: "Обработчик",
            intervals: [
              { start: 0, end: 15, state: "Работает", color: "success" },
              { start: 15, end: 25, state: null },
              { start: 25, end: 60, state: "Работает", color: "success" },
            ],
          },
        ],
      },
      options: { label: "Состояния сервисов" },
    });
  else throw new TypeError("Unknown analytical sample");
  if (ascii) chart.setOptions({ renderer: "ascii" });
  const element = node(document, "div", "ag-analytic-demo"),
    settings = node(document, "details");
  settings.append(node(document, "summary", "", "Настроить график"));
  settings.open = id === "chart-settings";
  const inspector = createChartSettings({
    document,
    chart,
    series: chart.kind ? [] : series,
  });
  settings.append(inspector.element);
  element.append(chart.element, settings);
  return {
    element,
    interact: () => chart.select(1),
    dispose() {
      inspector.dispose();
      chart.dispose();
      element.remove();
    },
  };
}

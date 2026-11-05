import { createFeedRailSample } from "./feed-rail-sample.js";
import { createAnalyticSample } from "./analytic-sample.js";
import { createConversationRailSample } from "./conversation-rail-sample.js";
import { createAsciiChartSample } from "./ascii-chart-sample.js";
import { createParticleSample } from "./particle-sample.js";
import {
  createChart,
  createContentRail,
  createTimeDisplay,
  createPlanner,
} from "./index.js";
import { node } from "./runtime.js";
/** Synthetic examples exercise the public offline factories; no account data or reference-site code is embedded. */
export function createSample(id, document) {
  if (id === "feed-rail") return createFeedRailSample(document);
  if (
    [
      "analytic-chart",
      "stat-sparkline",
      "heatmap",
      "state-timeline",
      "chart-settings",
      "stat-sparkline-ascii",
      "heatmap-ascii",
      "state-timeline-ascii",
    ].includes(id)
  )
    return createAnalyticSample(id, document);
  if (id === "conversation-rail") return createConversationRailSample(document);
  if (id === "ascii-chart") return createAsciiChartSample(document);
  if (id === "particle-chart") return createParticleSample(document);
  if (id === "content-rail") {
    const host = node(document, "div", "ag-vt-rail-demo"),
      body = node(document, "div", "ag-vt-rail-demo__body"),
      items = ["Обзор", "Показатели", "Выводы"].map((label, index) => {
        const target = node(document, "section");
        target.id = "demo-section-" + index;
        target.append(
          node(document, "h3", "", label),
          node(
            document,
            "p",
            "",
            "Демонстрационный раздел. Прокрутите или выберите пункт слева.",
          ),
        );
        body.append(target);
        return { id: String(index), label, target };
      });
    const rail = createContentRail({ document, items, scrollRoot: body });
    host.append(rail.element, body);
    return {
      element: host,
      interact: () => rail.select(1),
      dispose() {
        rail.dispose();
        host.remove();
      },
    };
  }
  if (id === "time-display") {
    const display = createTimeDisplay({
      document,
      value: 95500,
      label: "Длительность операции",
    });
    return { ...display, interact: () => display.update({ style: "clock" }) };
  }
  if (id === "planner") {
    const planner = createPlanner({
      document,
      date: "2026-10-23",
      today: "2026-10-23",
      view: "timeline",
      editable: true,
      resources: [
        { id: "design", label: "Дизайн" },
        { id: "review", label: "Проверка" },
      ],
      events: [
        {
          id: "draft",
          label: "Макет компонентов",
          start: "2026-10-20T09:00:00Z",
          end: "2026-10-22T17:00:00Z",
          resourceId: "design",
        },
        {
          id: "test",
          label: "Проверка примеров",
          start: "2026-10-22T10:00:00Z",
          end: "2026-10-23T13:00:00Z",
          resourceId: "review",
        },
      ],
    });
    return { ...planner, interact: () => planner.update({ view: "agenda" }) };
  }
  const modes = {
    "chart-line": "line",
    "chart-area": "area",
    "chart-bar": "bar",
    "chart-radial": "donut",
    "chart-scatter": "bubble",
    "chart-radar": "radar",
    "particle-chart": "area",
  };
  const type = modes[id];
  if (!type) throw new RangeError("Unknown visual-tools example");
  const labels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
    values =
      type === "bubble"
        ? labels.map((_, i) => ({
            x: i * 7 + 5,
            y: [20, 40, 35, 55, 48, 70][i],
            size: i + 1,
          }))
        : [20, 40, null, 55, 48, 70];
  if (type === "radar" || type === "donut") values[2] = 35;
  const chart = createChart({
    document,
    type,
    label: "Демонстрационные данные",
    labels,
    series: [{ id: "main", label: "Переданный ряд", values }],
    renderer: id === "particle-chart" ? "particles" : "svg",
    animated: true,
  });
  return {
    ...chart,
    interact: () => chart.update({ label: "Обновлённый пример" }),
  };
}

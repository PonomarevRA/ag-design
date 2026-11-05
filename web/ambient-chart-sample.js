import {
  createAmbientChart,
  createTextarea,
} from "./vendor/ag-design/index.js";
import { h } from "./dom.js";
let sampleSequence = 0;
export const ambientFixture = {
  labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  values: [18, 32, null, -8, 45, 63, 52],
};

/** Offer explicit decorative/real-data switches; the real example is synthetic and labelled as such by its title. */
export function buildAmbientChartSample() {
  const chart = createAmbientChart({
    title: "Системы в движении",
    caption: "Сетка, свет и ритм в вашей палитре",
    metric: "SIGNAL / 01",
  });
  const mode = h(
    "select",
    { "aria-label": "Режим атмосферного графика" },
    h("option", { value: "decorative" }, "Декоративный"),
    h("option", { value: "data" }, "Реальные значения"),
  );
  const kind = h(
    "select",
    { "aria-label": "Вид атмосферного графика" },
    h("option", { value: "bars" }, "Столбцы"),
    h("option", { value: "line" }, "Линия"),
    h("option", { value: "area" }, "Область"),
  );
  const showPanel = h("input", {
    type: "checkbox",
    "aria-label": "Показывать мини-окно",
  });
  showPanel.checked = true;
  const textField = createTextarea({
    id: `ambient-panel-text-${++sampleSequence}`,
    label: "Текст мини-окна",
    rows: 3,
    maxLength: 1200,
    hint: "Оставьте пустым, чтобы использовать пример",
    placeholder: "Добавьте пояснение к графику",
  });
  const panelText = textField.querySelector("textarea");
  /** Apply one validated sample state; plain context is never interpreted as code or markup. */
  const change = () =>
    chart.update({
      mode: mode.value,
      kind: kind.value,
      ...ambientFixture,
      showPanel: showPanel.checked,
      panelTitle:
        mode.value === "data" || panelText.value
          ? "Контекст"
          : "SIGNAL / LOCAL",
      panelText:
        panelText.value ||
        (mode.value === "data"
          ? "Нагрузка по дням\nСр — нет измерения. Чт — отрицательное значение.\nИсточник и пояснение задаёт приложение."
          : ""),
      title:
        mode.value === "data"
          ? "Пример данных · измерения по дням"
          : "Системы в движении",
    });
  mode.addEventListener("change", change);
  kind.addEventListener("change", change);
  showPanel.addEventListener("change", change);
  panelText.addEventListener("input", change);
  const element = h(
    "div",
    { className: "ambient-chart-sample" },
    h(
      "div",
      { className: "ambient-chart-sample__options" },
      mode,
      kind,
      h("label", {}, showPanel, "Мини-окно"),
    ),
    textField,
    chart.element,
  );
  return {
    element,
    interact: () => {
      chart.select(1);
      chart.replay();
    },
    dispose() {
      textField.dispose();
      mode.removeEventListener("change", change);
      kind.removeEventListener("change", change);
      showPanel.removeEventListener("change", change);
      panelText.removeEventListener("input", change);
      chart.dispose();
    },
  };
}

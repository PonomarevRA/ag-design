import { axisPointLabel } from "./chart-axis.js";
import { axisDateValues } from "./chart-axis.js";
import { bindSvgAxisLabels } from "./chart-axis-svg.js";

/** Create literal HTML/SVG nodes. Input strings are never parsed as markup, code or URLs. */
export function node(document, tag, attributes = {}, text, svg = false) {
  const element = svg
    ? document.createElementNS("http://www.w3.org/2000/svg", tag)
    : document.createElement(tag);
  for (const [key, value] of Object.entries(attributes))
    element.setAttribute(key, String(value));
  if (text !== undefined) element.textContent = String(text);
  return element;
}
/** Draw only supplied coordinates; glow/reveal never changes the data scale or bridges missing values. */
export function drawPlot(document, state, scene, id) {
  const svg = node(
    document,
    "svg",
    {
      viewBox: axisDateValues(state.labels, state.axisDates)
        ? "0 0 960 416"
        : "0 0 960 360",
      class: "ag-ambient-chart__svg",
      "aria-hidden": "true",
    },
    undefined,
    true,
  );
  const defs = node(document, "defs", {}, undefined, true);
  const gradient = node(
    document,
    "linearGradient",
    { id: id + "-fill", x1: 0, y1: 0, x2: 0, y2: 1 },
    undefined,
    true,
  );
  gradient.append(
    node(
      document,
      "stop",
      { offset: 0, "stop-color": "var(--ag-accent)", "stop-opacity": ".78" },
      undefined,
      true,
    ),
    node(
      document,
      "stop",
      { offset: 1, "stop-color": "var(--ag-accent)", "stop-opacity": ".08" },
      undefined,
      true,
    ),
  );
  const clip = node(
      document,
      "clipPath",
      { id: id + "-clip" },
      undefined,
      true,
    ),
    reveal = node(
      document,
      "rect",
      { x: 50, y: 0, width: 0, height: 360 },
      undefined,
      true,
    );
  clip.append(reveal);
  defs.append(gradient, clip);
  svg.append(defs);
  if (state.mode === "data" && scene.hasValues) {
    for (let index = 0; index <= 4; index++) {
      const y = 28 + index * 70,
        value = scene.high - ((scene.high - scene.low) * index) / 4;
      svg.append(
        node(
          document,
          "line",
          { x1: 64, y1: y, x2: 912, y2: y, class: "ag-ambient-chart__axis" },
          undefined,
          true,
        ),
        node(
          document,
          "text",
          {
            x: 0,
            y: y + 5,
            "text-anchor": "start",
            class: "ag-ambient-chart__tick",
          },
          Math.abs(value) >= 10000 || (value !== 0 && Math.abs(value) < 0.001)
            ? value.toExponential(1).replace(".0e", "e").replace("e+", "e")
            : Number(value.toPrecision(3)),
          true,
        ),
      );
    }
  }
  const marks = node(
    document,
    "g",
    { "clip-path": `url(#${id}-clip)`, class: "ag-ambient-chart__marks" },
    undefined,
    true,
  );
  const fill = `url(#${id}-fill)`;
  if (state.kind === "bars") {
    for (const point of scene.points) {
      if (point.value === null) continue;
      const h = Math.abs(scene.zero - point.y),
        w = Math.min(92, scene.step * 0.72);
      marks.append(
        node(
          document,
          "rect",
          {
            x: point.x - w / 2,
            y: Math.min(point.y, scene.zero),
            width: w,
            height: h,
            rx: 4,
            fill,
            "data-index": point.index,
            class: "ag-ambient-chart__mark",
          },
          undefined,
          true,
        ),
      );
      if (h === 0)
        marks.append(
          node(
            document,
            "line",
            {
              x1: point.x - w / 2,
              y1: point.y,
              x2: point.x + w / 2,
              y2: point.y,
              stroke: "var(--ag-accent)",
              "data-index": point.index,
            },
            undefined,
            true,
          ),
        );
    }
  } else {
    for (const segment of scene.segments) {
      const line = segment
        .map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`)
        .join(" ");
      if (state.kind === "area")
        marks.append(
          node(
            document,
            "path",
            {
              d: `${line} L${segment.at(-1).x},${scene.zero} L${segment[0].x},${scene.zero} Z`,
              fill,
            },
            undefined,
            true,
          ),
        );
      marks.append(
        node(
          document,
          "path",
          {
            d: line,
            fill: "none",
            stroke: "var(--ag-accent)",
            "stroke-width": 3,
            "stroke-linejoin": "round",
          },
          undefined,
          true,
        ),
      );
      for (const point of segment)
        marks.append(
          node(
            document,
            "circle",
            {
              cx: point.x,
              cy: point.y,
              r: 4,
              fill: "var(--ag-accent)",
              "data-index": point.index,
              class: "ag-ambient-chart__mark",
            },
            undefined,
            true,
          ),
        );
    }
  }
  svg.append(marks);
  if (state.mode === "data") {
    for (const point of scene.points)
      svg.append(
        node(
          document,
          "text",
          {
            x: point.x,
            y: 342,
            "text-anchor": "middle",
            class: "ag-ambient-chart__tick ag-ambient-chart__label",
            "data-label": point.index,
            "data-axis-index": point.index,
            "data-axis-x": point.x,
          },
          point.label,
          true,
        ),
      );
  }
  return { svg, reveal, marks };
}
/** Exact table is always available in data mode; null means missing, not zero. */
export function dataTable(document, state) {
  const details = node(document, "details", {
      class: "ag-ambient-chart__data",
    }),
    summary = node(document, "summary", {}, "Данные графика");
  const table = node(document, "table"),
    head = node(document, "thead"),
    row = node(document, "tr");
  row.append(
    node(document, "th", { scope: "col" }, "Период"),
    node(
      document,
      "th",
      { scope: "col" },
      state.unit ? `Значение, ${state.unit}` : "Значение",
    ),
  );
  head.append(row);
  const body = node(document, "tbody");
  state.values.forEach((value, index) => {
    const row = node(document, "tr");
    row.append(
      node(
        document,
        "th",
        { scope: "row" },
        axisPointLabel(state.labels, index, state.axisDates),
      ),
      node(document, "td", {}, value === null ? "Нет данных" : String(value)),
    );
    body.append(row);
  });
  table.append(node(document, "caption", {}, state.title), head, body);
  details.append(summary, table);
  return details;
}

/** Build presentation nodes without listeners or clocks; the controller owns publication and disposal. */
export function ambientView(document, state, scene, id) {
  const heading = node(document, "div", {
      class: "ag-ambient-chart__heading",
    }),
    title = node(document, "h3", {}, state.title),
    tag = node(
      document,
      "span",
      { class: "ag-ambient-chart__tag" },
      state.mode === "data"
        ? "Переданные данные"
        : "Декоративная графика · условные данные",
    );
  heading.append(title, tag);
  const stage = node(document, "div", { class: "ag-ambient-chart__stage" }),
    caption = node(
      document,
      "p",
      { class: "ag-ambient-chart__caption" },
      state.caption,
    );
  const kicker = node(
    document,
    "span",
    { class: "ag-ambient-chart__kicker" },
    state.mode === "data" ? "DATA / " + state.values.length : "CORE / 01",
  );
  stage.append(kicker);
  let code;
  const hasPanelText =
    state.panelText || (state.mode === "decorative" && state.code);
  if (state.showPanel && hasPanelText) {
    const panel = node(document, "div", {
      class: "ag-ambient-chart__code",
    });
    // Decorative code is only atmosphere; explicit context text stays in the accessibility tree.
    if (!state.panelText) panel.setAttribute("aria-hidden", "true");
    else {
      panel.setAttribute("role", "note");
      panel.setAttribute("aria-label", state.panelTitle || "Контекст графика");
    }
    panel.append(
      node(
        document,
        "span",
        { class: "ag-ambient-chart__code-label" },
        state.panelTitle,
      ),
    );
    code = node(document, "pre");
    if (state.panelText) code.tabIndex = 0;
    panel.append(code);
    stage.append(panel);
  }
  const plot = drawPlot(document, state, scene, id);
  stage.append(plot.svg);
  if (!scene.hasValues)
    stage.append(
      node(
        document,
        "p",
        { class: "ag-ambient-chart__empty" },
        "Нет измерений",
      ),
    );
  if (state.mode === "decorative")
    stage.append(
      node(
        document,
        "span",
        { class: "ag-ambient-chart__metric" },
        state.metric,
      ),
    );
  return { heading, stage, caption, code, plot };
}

/** Keep SVG text readable at narrow widths without changing mark coordinates or the underlying scale. */
export function bindAmbientTypography(svg, labels, axisDates) {
  const view = svg.ownerDocument.defaultView;
  function resize() {
    const width = svg.getBoundingClientRect().width || 960;
    const font = Math.max(14, Math.min(44, (11 * 960) / width));
    for (const label of svg.querySelectorAll(".ag-ambient-chart__tick"))
      label.style.fontSize = font + "px";
  }
  const observer = view.ResizeObserver ? new view.ResizeObserver(resize) : null;
  observer?.observe(svg);
  resize();
  const axisCleanup = bindSvgAxisLabels(svg, labels, axisDates, {
    left: 64,
    right: 912,
    width: 960,
    minFont: 11,
  });
  return () => {
    observer?.disconnect();
    axisCleanup();
  };
}

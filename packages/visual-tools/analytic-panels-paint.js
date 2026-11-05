import { reduceSeries } from "./analytic-model.js";
const NS = "http://www.w3.org/2000/svg";
/** Set literal SVG attributes; all text remains inert and all colors are semantic tokens. */
function svgNode(document, tag, attrs = {}, text) {
  const e = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs))
    e.setAttribute(key, String(value));
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Sample a finite glyph field and a character selection frame, with a shared4177-glyph per-panel ceiling (4096 data +81 selection). */
function glyphRect(document, svg, rect, token, density, budget, index) {
  const chars = ".:*#@",
    step = 9;
  const allowed = Math.max(
    1,
    Math.floor(budget.remaining / Math.max(1, budget.regions)),
  );
  budget.regions = Math.max(0, budget.regions - 1);
  const count = Math.min(
    budget.remaining,
    allowed,
    Math.max(1, Math.floor(rect.w / step) * Math.floor(rect.h / step)),
  );
  if (!count) return;
  const columns = Math.max(1, Math.floor(rect.w / step)),
    x = [],
    y = [];
  const font = Math.max(0.1, Math.min(10, rect.w * 0.9, rect.h * 0.9));
  let text = "";
  for (let i = 0; i < count; i++) {
    x.push(rect.x + Math.min(4, rect.w * 0.1) + (i % columns) * step);
    y.push(rect.y + Math.min(9, rect.h * 0.9) + Math.floor(i / columns) * step);
    text += chars[Math.max(0, Math.min(4, Math.round(density * 4)))];
  }
  budget.remaining -= count;
  svg.append(
    svgNode(
      document,
      "text",
      {
        x: x.join(" "),
        y: y.join(" "),
        fill: `var(--ag-${token})`,
        "font-family": "monospace",
        "font-size": font,
        "data-panel-mark": index,
        "pointer-events": "none",
      },
      text,
    ),
  );
}

/** Build exact layout regions shared by pointer hit testing, regular marks and ASCII marks. */
export function panelGeometry(kind, data, cells, width, height) {
  const left = kind === "state-timeline" ? Math.min(112, width * 0.25) : 38,
    right = width - 12,
    top = 12,
    bottom = height - 28;
  const regions = [];
  if (kind === "heatmap")
    for (const cell of cells) {
      regions.push({
        cell,
        x:
          left +
          ((cell.start - data.x[0]) / (data.x.at(-1) - data.x[0])) *
            (right - left),
        y:
          bottom -
          ((cell.high - data.y[0]) / (data.y.at(-1) - data.y[0])) *
            (bottom - top),
        w:
          ((cell.end - cell.start) / (data.x.at(-1) - data.x[0])) *
          (right - left),
        h:
          ((cell.high - cell.low) / (data.y.at(-1) - data.y[0])) *
          (bottom - top),
      });
    }
  if (kind === "state-timeline")
    for (const cell of cells) {
      const rowHeight = (bottom - top) / data.lanes.length;
      regions.push({
        cell,
        x:
          left +
          ((cell.start - data.min) / (data.max - data.min || 1)) *
            (right - left),
        y: top + cell.row * rowHeight + 3,
        w:
          ((cell.end - cell.start) / (data.max - data.min || 1)) *
          (right - left),
        h: Math.max(1, rowHeight - 6),
      });
    }
  return { left, right, top, bottom, regions };
}

/** Render data marks only; plain axis/readout text remains available for exact analytical reading in either appearance. */
export function paintPanel(
  document,
  kind,
  data,
  options,
  cells,
  width,
  height,
  selected,
) {
  const svg = svgNode(document, "svg", {
      viewBox: `0 0 ${width} ${height}`,
      "aria-hidden": "true",
    }),
    budget = { remaining: 4096, regions: 1 };
  const geometry = panelGeometry(kind, data, cells, width, height),
    { left, right, top, bottom } = geometry;
  budget.regions = geometry.regions.length;
  if (kind === "stat" && data.spark) {
    const series = data.spark.series[0],
      range = [data.spark.x[0], data.spark.x.at(-1)],
      display = reduceSeries(data.spark, series, range, right - left),
      span = display.max - display.min || 1,
      sx = (x) =>
        left + ((x - range[0]) / (range[1] - range[0] || 1)) * (right - left),
      sy = (y) => bottom - ((y - display.min) / span) * (bottom - top);
    let d = "";
    for (const p of display.points) {
      const x = sx(p.x),
        y = sy(p.y);
      d += (!d || p.move ? "M" : "L") + x + "," + y + " ";
      if (options.renderer === "ascii" && budget.remaining > 0) {
        svg.append(
          svgNode(
            document,
            "text",
            {
              x,
              y,
              fill: `var(--ag-${options.color})`,
              "font-family": "monospace",
              "font-size": 11,
              "data-panel-mark": p.index,
            },
            p.index === selected ? "@" : "*",
          ),
        );
        budget.remaining--;
      }
    }
    if (options.renderer === "svg")
      svg.append(
        svgNode(document, "path", {
          d,
          fill: "none",
          stroke: `var(--ag-${options.color})`,
          "stroke-width": 1.8,
        }),
      );
    const point = display.points.find((p) => p.index === selected);
    if (point && options.renderer === "svg")
      svg.append(
        svgNode(document, "circle", {
          cx: sx(point.x),
          cy: sy(point.y),
          r: 3,
          fill: "var(--ag-text)",
        }),
      );
  }
  for (const rect of geometry.regions) {
    const { cell } = rect;
    let color = cell.color || options.color,
      density = 1;
    if (kind === "heatmap") {
      density =
        cell.value === null
          ? 0
          : options.scale === "log"
            ? Math.log1p(cell.value) / Math.log1p(data.maximum || 1)
            : cell.value / (data.maximum || 1);
      for (const threshold of options.thresholds)
        if (cell.value !== null && cell.value >= threshold.value)
          color = threshold.color;
    }
    const missing =
      kind === "heatmap" ? cell.value === null : cell.state === null;
    if (options.renderer === "svg")
      svg.append(
        svgNode(document, "rect", {
          x: rect.x + 1,
          y: rect.y + 1,
          width: Math.max(0, rect.w - 2),
          height: Math.max(0, rect.h - 2),
          fill: missing ? "none" : `var(--ag-${color})`,
          opacity: missing
            ? 1
            : kind === "state-timeline"
              ? 0.24
              : 0.12 + 0.88 * density,
          stroke: "var(--ag-border)",
          "stroke-width": 0.5,
          "stroke-dasharray": missing ? "2 2" : "none",
          "data-cell": cell.index,
        }),
      );
    else {
      if (!missing)
        glyphRect(document, svg, rect, color, density, budget, cell.index);
      svg.append(
        svgNode(document, "rect", {
          x: rect.x,
          y: rect.y,
          width: rect.w,
          height: rect.h,
          fill: "transparent",
          "data-cell": cell.index,
        }),
      );
    }
    if (
      kind === "state-timeline" &&
      options.showLabels &&
      rect.w > 55 &&
      rect.h > 20
    )
      svg.append(
        svgNode(
          document,
          "text",
          {
            x: rect.x + 6,
            y: rect.y + rect.h / 2 + 4,
            fill: "var(--ag-text)",
            "font-size": 11,
            "pointer-events": "none",
          },
          cell.state ?? "Нет данных",
        ),
      );
    if (cell.index === selected) {
      if (options.renderer === "svg")
        svg.append(
          svgNode(document, "rect", {
            x: rect.x + 1,
            y: rect.y + 1,
            width: Math.max(0, rect.w - 2),
            height: Math.max(0, rect.h - 2),
            fill: "none",
            stroke: "var(--ag-text)",
            "stroke-width": 1,
            "pointer-events": "none",
          }),
        );
      else {
        const x = [],
          y = [];
        let text = "";
        for (
          let i = 0;
          i <= Math.min(80, Math.ceil(((rect.w + rect.h) * 2) / 8));
          i++
        ) {
          const pos = i * 8,
            perimeter = 2 * (rect.w + rect.h),
            p = pos % perimeter;
          let px, py;
          if (p < rect.w) {
            px = p;
            py = 0;
          } else if (p < rect.w + rect.h) {
            px = rect.w;
            py = p - rect.w;
          } else if (p < 2 * rect.w + rect.h) {
            px = 2 * rect.w + rect.h - p;
            py = rect.h;
          } else {
            px = 0;
            py = perimeter - p;
          }
          x.push(rect.x + px);
          y.push(rect.y + py);
          text += "#";
        }
        svg.append(
          svgNode(
            document,
            "text",
            {
              x: x.join(" "),
              y: y.join(" "),
              fill: "var(--ag-text)",
              "font-family": "monospace",
              "font-size": 9,
              "pointer-events": "none",
              "data-ascii-selection": "true",
            },
            text,
          ),
        );
      }
    }
  }
  if (kind === "state-timeline" && (bottom - top) / data.lanes.length >= 14)
    for (let row = 0; row < data.lanes.length; row++) {
      svg.append(
        svgNode(
          document,
          "text",
          {
            x: 2,
            y: top + ((row + 0.5) * (bottom - top)) / data.lanes.length + 4,
            fill: "var(--ag-muted)",
            "font-size": 11,
          },
          data.lanes[row].label,
        ),
      );
    }
  if (kind === "heatmap")
    for (let i = 0; i < data.y.length; i++) {
      const y =
        bottom -
        ((data.y[i] - data.y[0]) / (data.y.at(-1) - data.y[0])) *
          (bottom - top);
      svg.append(
        svgNode(
          document,
          "text",
          {
            x: left - 5,
            y: y + 4,
            fill: "var(--ag-muted)",
            "font-size": 10,
            "text-anchor": "end",
          },
          data.y[i],
        ),
      );
    }
  if (kind !== "stat") {
    const min = kind === "heatmap" ? data.x[0] : data.min,
      max = kind === "heatmap" ? data.x.at(-1) : data.max;
    for (let i = 0; i <= 4; i++)
      svg.append(
        svgNode(
          document,
          "text",
          {
            x: left + ((right - left) * i) / 4,
            y: height - 8,
            fill: "var(--ag-muted)",
            "font-size": 10,
            "text-anchor": i === 0 ? "start" : i === 4 ? "end" : "middle",
          },
          Number((min + ((max - min) * i) / 4).toPrecision(5)),
        ),
      );
  }
  return { svg, geometry, glyphs: 4096 - budget.remaining };
}

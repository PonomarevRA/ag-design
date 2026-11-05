import { analyticData } from "./analytic-model.js";
import { analyticTokens } from "./analytic-options.js";
const finite = (value) => typeof value === "number" && Number.isFinite(value);

/** Validate ordered numeric bucket edges, preserving original interval boundaries without normalization. */
function edges(values, max) {
  if (!Array.isArray(values) || values.length < 2 || values.length > max + 1)
    throw new RangeError("Invalid bucket edges");
  for (let i = 0; i < values.length; i++)
    if (!finite(values[i]) || (i && values[i] <= values[i - 1]))
      throw new TypeError("Strictly increasing finite edges required");
  if (!Number.isFinite(values.at(-1) - values[0]))
    throw new RangeError("Finite edge span required");
  return [...values];
}

/** Three independent panel contracts: explicit statistic, supplied histogram buckets, or nonoverlapping state intervals. */
export function panelData(kind, data) {
  if (!data || typeof data !== "object")
    throw new TypeError("Panel data required");
  if (kind === "stat") {
    if (data.value !== null && !finite(data.value))
      throw new TypeError("Explicit finite statistic or null required");
    if (data.sparkline?.x?.length > 4096)
      throw new RangeError("Stat sparkline limit4096");
    const spark = data.sparkline ? analyticData(data.sparkline) : null;
    if (spark && spark.series.length !== 1)
      throw new TypeError("Stat sparkline takes one series");
    return { value: data.value, spark };
  }
  if (kind === "heatmap") {
    const x = edges(data.xEdges, 128),
      y = edges(data.yEdges, 64);
    if (
      (x.length - 1) * (y.length - 1) > 4096 ||
      !Array.isArray(data.values) ||
      data.values.length !== y.length - 1
    )
      throw new RangeError("At most4096 aligned cells");
    const values = [],
      cells = [];
    let maximum = 0;
    for (let row = 0; row < y.length - 1; row++) {
      const source = data.values[row];
      if (!Array.isArray(source) || source.length !== x.length - 1)
        throw new TypeError("Heatmap rows must match X buckets");
      const copy = [];
      for (let column = 0; column < x.length - 1; column++) {
        const value = source[column];
        if (value !== null && (!finite(value) || value < 0))
          throw new TypeError("Histogram counts are nonnegative or null");
        copy.push(value);
        if (value !== null) maximum = Math.max(maximum, value);
        cells.push({
          index: cells.length,
          row,
          column,
          start: x[column],
          end: x[column + 1],
          low: y[row],
          high: y[row + 1],
          value,
        });
      }
      values.push(copy);
    }
    return { x, y, values, cells, maximum };
  }
  if (kind !== "state-timeline") throw new TypeError("Unknown panel kind");
  if (
    !Array.isArray(data.lanes) ||
    !data.lanes.length ||
    data.lanes.length > 64
  )
    throw new RangeError("1..64 lanes required");
  const lanes = [],
    ids = new Set();
  let count = 0,
    min = Infinity,
    max = -Infinity;
  for (const lane of data.lanes) {
    if (
      typeof lane.id !== "string" ||
      !lane.id ||
      lane.id.length > 80 ||
      ids.has(lane.id) ||
      typeof lane.label !== "string" ||
      !lane.label.trim() ||
      lane.label.length > 160 ||
      !Array.isArray(lane.intervals)
    )
      throw new TypeError("Unique lane IDs and labels required");
    ids.add(lane.id);
    const intervals = [];
    let previous = -Infinity;
    for (const item of lane.intervals) {
      if (
        !finite(item.start) ||
        !finite(item.end) ||
        item.end <= item.start ||
        item.start < previous ||
        (item.state !== null &&
          (typeof item.state !== "string" ||
            !item.state ||
            item.state.length > 80)) ||
        (item.color !== undefined && !analyticTokens.includes(item.color))
      )
        throw new TypeError(
          "Ordered nonoverlapping intervals and literal states required",
        );
      intervals.push({ ...item });
      previous = item.end;
      min = Math.min(min, item.start);
      max = Math.max(max, item.end);
      if (++count > 4096) throw new RangeError("At most4096 intervals");
    }
    lanes.push({ id: lane.id, label: lane.label, intervals });
  }
  if (count && !Number.isFinite(max - min))
    throw new RangeError("Finite timeline span required");
  return {
    lanes,
    min: Number.isFinite(min) ? min : 0,
    max: Number.isFinite(max) ? max : 1,
  };
}

/** Validate the shared panel settings vocabulary. Invalid options never replace a live panel. */
export function panelOptions(kind, value = {}) {
  const result = {
    renderer: "svg",
    label: {
      stat: "Показатель",
      heatmap: "Тепловая карта",
      "state-timeline": "Шкала состояний",
    }[kind],
    unit: "number",
    decimals: 2,
    color: "accent",
    showLabels: true,
    scale: "linear",
    mergeAdjacent: false,
    thresholds: [],
    ...value,
  };
  for (const key of Object.keys(value))
    if (
      ![
        "renderer",
        "label",
        "unit",
        "decimals",
        "color",
        "showLabels",
        "scale",
        "mergeAdjacent",
        "thresholds",
      ].includes(key)
    )
      throw new TypeError("Unknown panel setting:" + key);
  if (
    !["svg", "ascii"].includes(result.renderer) ||
    typeof result.label !== "string" ||
    !result.label.trim() ||
    result.label.length > 160 ||
    !["number", "percent", "bytes", "ms", "s"].includes(result.unit) ||
    !Number.isInteger(result.decimals) ||
    result.decimals < 0 ||
    result.decimals > 6 ||
    !analyticTokens.includes(result.color) ||
    typeof result.showLabels !== "boolean" ||
    typeof result.mergeAdjacent !== "boolean" ||
    !["linear", "log"].includes(result.scale)
  )
    throw new TypeError("Invalid panel options");
  if (!Array.isArray(result.thresholds) || result.thresholds.length > 16)
    throw new TypeError("At most16thresholds");
  result.thresholds = result.thresholds
    .map((t) => {
      if (!finite(t.value) || !analyticTokens.includes(t.color))
        throw new TypeError("Invalid threshold");
      return { value: t.value, color: t.color };
    })
    .sort((a, b) => a.value - b.value);
  return result;
}

/** Build exact selectable regions, optionally merging only contiguous equal-state intervals within the same lane. */
export function panelCells(kind, data, options) {
  if (kind === "heatmap") return data.cells;
  if (kind === "stat")
    return data.spark
      ? Array.from(data.spark.x, (x, index) => ({
          index,
          x,
          value: Number.isNaN(data.spark.series[0].values[index])
            ? null
            : data.spark.series[0].values[index],
        }))
      : [];
  const cells = [];
  for (let row = 0; row < data.lanes.length; row++)
    for (const item of data.lanes[row].intervals) {
      const previous = cells.at(-1);
      if (
        options.mergeAdjacent &&
        previous?.row === row &&
        previous.state === item.state &&
        previous.color === item.color &&
        previous.end === item.start
      ) {
        previous.end = item.end;
        continue;
      }
      cells.push({
        ...item,
        row,
        index: cells.length,
        label: data.lanes[row].label,
      });
    }
  return cells;
}

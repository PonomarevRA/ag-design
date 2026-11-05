import { axisDateValues } from "./chart-axis.js";
const modes = new Set(["decorative", "data"]);
const kinds = new Set(["bars", "line", "area"]);
const fields = new Set([
  "mode",
  "kind",
  "title",
  "caption",
  "code",
  "showPanel",
  "panelTitle",
  "panelText",
  "metric",
  "unit",
  "labels",
  "axisDates",
  "values",
  "animated",
  "onSelect",
]);
const sample = [72, 84, 56, 68, 92, 76, 61, 87, 74, 94, 83, 98];

/** Normalize a complete state before changing DOM. Numbers remain literal; only decorative mode supplies invented values. */
export function ambientOptions(input = {}) {
  for (const key of Object.keys(input))
    if (!fields.has(key))
      throw new TypeError("Unknown ambient chart option: " + key);
  const value = {
    mode: "decorative",
    kind: "bars",
    title: "Сигнал в движении",
    caption: "Инженерия в каждом импульсе",
    code: "const signal = observe(stream)\n\nif (signal.ready) {\n  render(signal)\n}",
    showPanel: true,
    panelTitle: "SIGNAL / LOCAL",
    panelText: "",
    metric: "CORE / 01",
    unit: "",
    animated: true,
    ...input,
  };
  if (
    !modes.has(value.mode) ||
    !kinds.has(value.kind) ||
    typeof value.animated !== "boolean" ||
    typeof value.showPanel !== "boolean"
  )
    throw new TypeError("Unknown mode, kind, animation or panel flag");
  for (const [key, max] of [
    ["title", 180],
    ["caption", 300],
    ["code", 1200],
    ["panelTitle", 100],
    ["panelText", 1200],
    ["metric", 100],
    ["unit", 24],
  ]) {
    if (typeof value[key] !== "string" || value[key].length > max)
      throw new TypeError("Invalid chart text: " + key);
  }
  if (!value.title.trim()) throw new TypeError("Chart title is required");
  if (value.onSelect !== undefined && typeof value.onSelect !== "function")
    throw new TypeError("onSelect must be a function");
  if (value.mode === "data" && (!input.labels || !input.values))
    throw new TypeError("Real data requires explicit labels and values");
  const values = value.values ?? sample;
  const labels = value.labels ?? values.map((_, i) => String(i + 1));
  if (
    !Array.isArray(values) ||
    values.length < 1 ||
    values.length > 96 ||
    !Array.isArray(labels) ||
    labels.length !== values.length
  )
    throw new RangeError("Use1–96 matching labels/values");
  for (const entry of values)
    if (entry !== null && (!Number.isFinite(entry) || Math.abs(entry) > 1e12))
      throw new TypeError("Use finite values within ±1e12 or null for missing");
  for (const entry of labels)
    if (typeof entry !== "string" || !entry.trim() || entry.length > 100)
      throw new TypeError("Labels must contain1–100 characters");
  axisDateValues(labels, value.axisDates);
  return { ...value, values: [...values], labels: [...labels] };
}

/** Map signed values to a zero-based linear scale. Null remains a gap; empty data has no pretend observation. */
export function ambientScene(options) {
  const present = options.values.filter((value) => value !== null);
  const low = Math.min(0, ...present),
    high = Math.max(0, ...present);
  const range = high - low || 1;
  const top = 28,
    height = 280,
    left = 64,
    width = 848;
  const y = (value) => top + height - ((value - low) / range) * height;
  const step = width / options.values.length;
  const points = options.values.map((value, index) => ({
    index,
    value,
    label: options.labels[index],
    x: left + (index + 0.5) * step,
    y: value === null ? null : y(value),
  }));
  const segments = [];
  let current = [];
  for (const point of points) {
    if (point.value === null) {
      if (current.length) segments.push(current);
      current = [];
    } else current.push(point);
  }
  if (current.length) segments.push(current);
  return {
    points,
    segments,
    low,
    high: high === low ? low + 1 : high,
    zero: y(0),
    step,
    hasValues: present.length > 0,
  };
}

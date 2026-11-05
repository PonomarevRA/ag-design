const numberFormats = new Map();
export const analyticTokens = [
  "accent",
  "success",
  "danger",
  "text",
  "muted",
  "border",
];
const defaults = {
  unit: "number",
  decimals: 2,
  axis: "left",
  color: "auto",
  visible: true,
  fill: 0.08,
  lineWidth: 1.5,
  interpolation: "linear",
  connectNulls: false,
};

/** Validate the small explicit field-override vocabulary before changing a live chart. Colors remain semantic tokens. */
function fields(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TypeError("Field options required");
  for (const key of Object.keys(value))
    if (!(key in defaults)) throw new TypeError("Unknown field option: " + key);
  if (
    value.unit !== undefined &&
    !["number", "percent", "bytes", "ms", "s"].includes(value.unit)
  )
    throw new TypeError("Unsupported unit");
  if (
    value.decimals !== undefined &&
    (!Number.isInteger(value.decimals) ||
      value.decimals < 0 ||
      value.decimals > 6)
  )
    throw new RangeError("Decimals0..6");
  if (value.axis !== undefined && !["left", "right"].includes(value.axis))
    throw new TypeError("Unknown axis");
  if (
    value.color !== undefined &&
    !["auto", ...analyticTokens].includes(value.color)
  )
    throw new TypeError("Semantic color required");
  for (const key of ["visible", "connectNulls"])
    if (value[key] !== undefined && typeof value[key] !== "boolean")
      throw new TypeError("Boolean " + key + " required");
  for (const [key, low, high] of [
    ["fill", 0, 1],
    ["lineWidth", 0.5, 6],
  ])
    if (
      value[key] !== undefined &&
      (!Number.isFinite(value[key]) || value[key] < low || value[key] > high)
    )
      throw new RangeError("Invalid " + key);
  if (
    value.interpolation !== undefined &&
    !["linear", "step"].includes(value.interpolation)
  )
    throw new TypeError("Unknown interpolation");
  return { ...value };
}

/** Resolve defaults and exact series-id overrides; unsupported options are rejected instead of being silently ignored. */
export function analyticOptions(value = {}) {
  const allowed = [
    "defaults",
    "overrides",
    "axes",
    "thresholds",
    "tooltip",
    "time",
    "label",
  ];
  for (const key of Object.keys(value))
    if (!allowed.includes(key))
      throw new TypeError("Unknown chart option: " + key);
  const result = {
    defaults: { ...defaults, ...fields(value.defaults || {}) },
    overrides: {},
    axes: { left: {}, right: {} },
    thresholds: [],
    tooltip: value.tooltip ?? "all",
    time: value.time ?? false,
    label: value.label ?? "Аналитический график",
  };
  if (
    !["all", "selected", "hidden"].includes(result.tooltip) ||
    typeof result.time !== "boolean" ||
    typeof result.label !== "string" ||
    !result.label.trim() ||
    result.label.length > 160
  )
    throw new TypeError("Invalid tooltip/time/label");
  const overrides = value.overrides || {};
  if (
    !overrides ||
    typeof overrides !== "object" ||
    Array.isArray(overrides) ||
    Object.keys(overrides).length > 6
  )
    throw new TypeError("At most six overrides");
  for (const [id, settings] of Object.entries(overrides)) {
    if (
      !id ||
      id.length > 80 ||
      ["__proto__", "constructor", "prototype"].includes(id)
    )
      throw new TypeError("Invalid override identity");
    Object.defineProperty(result.overrides, id, {
      value: fields(settings),
      enumerable: true,
    });
  }
  if (
    value.axes &&
    Object.keys(value.axes).some((key) => !["left", "right"].includes(key))
  )
    throw new TypeError("Unknown axis identity");
  for (const axis of ["left", "right"]) {
    const limits = value.axes?.[axis] || {};
    if (Object.keys(limits).some((k) => !["min", "max"].includes(k)))
      throw new TypeError("Unknown axis option");
    for (const key of ["min", "max"])
      if (limits[key] !== undefined && !Number.isFinite(limits[key]))
        throw new TypeError("Finite axis bounds required");
    if (
      limits.min !== undefined &&
      limits.max !== undefined &&
      (limits.min >= limits.max || !Number.isFinite(limits.max - limits.min))
    )
      throw new RangeError("Axis min must precede max");
    result.axes[axis] = { ...limits };
  }
  if (
    !Array.isArray(value.thresholds ?? []) ||
    (value.thresholds?.length || 0) > 16
  )
    throw new TypeError("At most16thresholds");
  for (const threshold of value.thresholds || []) {
    if (
      !Number.isFinite(threshold.value) ||
      !analyticTokens.includes(threshold.color) ||
      !["left", "right"].includes(threshold.axis || "left")
    )
      throw new TypeError("Invalid threshold");
    result.thresholds.push({
      value: threshold.value,
      color: threshold.color,
      axis: threshold.axis || "left",
    });
  }
  return result;
}

/** Resolve an individual series without mutating stored defaults or raw values. */
export function seriesOptions(options, id, index = 0) {
  const field = { ...options.defaults, ...options.overrides[id] };
  if (field.color === "auto")
    field.color = analyticTokens[index % analyticTokens.length];
  return field;
}

/** Format an exact raw value. Percent values are already percentage units, never multiplied by100. */
export function analyticValue(value, options = defaults) {
  if (value === null || Number.isNaN(value)) return "Нет данных";
  let amount = value,
    suffix = "";
  if (options.unit === "bytes") {
    const units = ["Б", "КиБ", "МиБ", "ГиБ", "ТиБ"];
    let index = 0;
    while (Math.abs(amount) >= 1024 && index < units.length - 1) {
      amount /= 1024;
      index++;
    }
    suffix = " " + units[index];
  } else suffix = { percent: " %", ms: " мс", s: " с" }[options.unit] || "";
  const decimals = options.decimals ?? 2;
  if (!numberFormats.has(decimals))
    numberFormats.set(
      decimals,
      new Intl.NumberFormat("ru-RU", { maximumFractionDigits: decimals }),
    );
  return numberFormats.get(decimals).format(amount) + suffix;
}

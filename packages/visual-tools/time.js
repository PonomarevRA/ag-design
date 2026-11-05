import { node, surface } from "./runtime.js";
const units = [
  ["day", 86400000n, "д"],
  ["hour", 3600000n, "ч"],
  ["minute", 60000n, "мин"],
  ["second", 1000n, "с"],
  ["millisecond", 1n, "мс"],
];
/** Format elapsed milliseconds exactly for integer BigInt and bounded finite numbers; days are fixed 24-hour durations, never calendar months. */
export function formatDuration(
  milliseconds,
  { style = "short", maxUnits = 3, locale = "ru-RU" } = {},
) {
  if (
    !["short", "clock", "long", "compact"].includes(style) ||
    !Number.isInteger(maxUnits) ||
    maxUnits < 1 ||
    maxUnits > 5
  )
    throw new TypeError("Unknown duration format");
  if (
    typeof milliseconds !== "bigint" &&
    (typeof milliseconds !== "number" ||
      !Number.isFinite(milliseconds) ||
      Math.abs(milliseconds) > Number.MAX_SAFE_INTEGER)
  )
    throw new RangeError("Use safe finite milliseconds or BigInt");
  const raw =
      typeof milliseconds === "bigint"
        ? milliseconds
        : BigInt(Math.trunc(milliseconds)),
    negative = raw < 0n;
  let rest = negative ? -raw : raw;
  const sign = negative ? "−" : "";
  if (style === "clock") {
    const hours = rest / 3600000n,
      minutes = (rest / 60000n) % 60n,
      seconds = (rest / 1000n) % 60n,
      ms = rest % 1000n;
    return (
      sign +
      hours +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds).padStart(2, "0") +
      (ms ? "." + String(ms).padStart(3, "0") : "")
    );
  }
  const result = [];
  const formatter =
    style === "long"
      ? new Intl.NumberFormat(locale, {
          style: "unit",
          unit: "second",
          unitDisplay: "long",
        })
      : null;
  for (const [unit, size, label] of units) {
    const count = rest / size;
    rest %= size;
    if (!count) continue;
    let text;
    if (formatter) {
      const format = new Intl.NumberFormat(locale, {
        style: "unit",
        unit,
        unitDisplay: "long",
        maximumFractionDigits: 0,
      });
      text = format.format(count);
    } else text = new Intl.NumberFormat(locale).format(count) + " " + label;
    result.push(text);
    if (result.length >= (style === "compact" ? 1 : maxUnits)) break;
  }
  return sign + (result.join(" ") || "0 мс");
}
/** Parse only unambiguous instants; zone-less dates and date-only strings are rejected instead of depending on the machine timezone. */
export function instant(value) {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) throw new TypeError("Invalid date");
    return new Date(value.getTime());
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return date;
  }
  if (
    typeof value === "string" &&
    /^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(?:Z|[+-]\d\d:\d\d)$/.test(
      value,
    )
  ) {
    const date = new Date(value);
    const civil = new Date(value.slice(0, 10) + "T00:00:00Z");
    if (
      Number.isFinite(date.getTime()) &&
      Number.isFinite(civil.getTime()) &&
      civil.toISOString().slice(0, 10) === value.slice(0, 10) &&
      Number(value.slice(11, 13)) < 24 &&
      Number(value.slice(14, 16)) < 60 &&
      (!value.slice(16).startsWith(":") || Number(value.slice(17, 19)) < 60)
    )
      return date;
  }
  throw new TypeError(
    "Use a Date, epoch milliseconds or ISO instant with timezone",
  );
}
/** Format date/time through local Intl data; no clock, timers or timezone service is contacted. */
export function formatDateTime(
  value,
  {
    locale = "ru-RU",
    timeZone = "UTC",
    dateStyle = "medium",
    timeStyle = "short",
  } = {},
) {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    dateStyle,
    timeStyle,
  }).format(instant(value));
}
/** One supplied value is displayed as a semantic time element; the host owns ticking and relative-time refresh. */
export function createTimeDisplay({
  document = globalThis.document,
  ...initial
} = {}) {
  return surface(
    document,
    "ag-vt-time",
    { kind: "duration", label: "Продолжительность", value: 0, ...initial },
    (state) => {
      if (
        !["duration", "datetime"].includes(state.kind) ||
        typeof state.label !== "string"
      )
        throw new TypeError("Unknown time kind");
      if (state.kind === "duration") formatDuration(state.value, state);
      else formatDateTime(state.value, state);
    },
    (state) => {
      const time = node(
        document,
        "time",
        "",
        state.kind === "duration"
          ? formatDuration(state.value, state)
          : formatDateTime(state.value, state),
      );
      if (state.kind === "datetime")
        time.dateTime = instant(state.value).toISOString();
      else {
        const value =
          typeof state.value === "bigint"
            ? state.value
            : BigInt(Math.trunc(state.value));
        if (value >= 0n)
          time.dateTime =
            "PT" +
            value / 1000n +
            (value % 1000n
              ? "." + String(value % 1000n).padStart(3, "0")
              : "") +
            "S";
      }
      return [node(document, "span", "ag-vt-muted", state.label), time];
    },
  );
}

/** Fresh synthetic controls shared by the premium and technical reference layouts. */
export function createGoldState() {
  return { values: [72, 48, 66, 12], selected: 0, scene: "base" };
}

/** Fixed scene presets change only local control values; the example has no device transport. */
export function sceneValues(id) {
  const presets = {
    base: [72, 48, 66, 12],
    depth: [54, 32, 62, 18],
    pulse: [88, 67, 77, 26],
    scan: [35, 84, 46, 51],
  };
  return [...(presets[id] || presets.base)];
}

/** Accept only a bounded local settings snapshot; storage text is never interpreted as markup or code. */
export function readSavedValues(raw) {
  try {
    const values = JSON.parse(raw);
    if (
      Array.isArray(values) &&
      values.length === 4 &&
      values.every((v) => Number.isInteger(v) && v >= 0 && v <= 100)
    )
      return [...values];
  } catch {
    /* A malformed/private store falls back to the visible default scene. */
  }
  return null;
}

/** Derive exact chart statistics from the same synthetic values rendered as particles, SVG and table. */
export function streamSnapshot(state, period = "hour") {
  const seed = [
    12,
    28,
    42,
    27,
    48,
    66,
    38,
    52,
    72,
    46,
    58,
    33,
    62,
    78,
    54,
    83,
    96,
    67,
    74,
    51,
    68,
    84,
    90,
    state.values[state.selected],
  ];
  const values =
    period === "day"
      ? seed.filter((_, index) => index % 4 === 0 || index === 23)
      : seed;
  const labels =
    period === "day"
      ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
      : values.map(
          (_, index) =>
            `${13 + Math.floor((30 + index * 3) / 60)}:${String((30 + index * 3) % 60).padStart(2, "0")}`,
        );
  let sum = 0;
  for (const value of values) sum += value;
  return {
    labels,
    values,
    current: values.at(-1),
    mean: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

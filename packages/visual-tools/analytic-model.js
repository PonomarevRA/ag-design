const MAX_POINTS = 1_000_000;
const numeric = (value) => typeof value === "number" && Number.isFinite(value);

/** Copy aligned raw observations once; strictly increasing numeric X avoids ambiguous duplicate-time lookup. Nulls remain NaN internally. */
export function analyticData(data) {
  if (
    !data ||
    !data.x ||
    !Array.isArray(data.series) ||
    !data.series.length ||
    data.series.length > 6
  )
    throw new TypeError("Aligned x and one to six series required");
  const n = data.x.length;
  if (!Number.isInteger(n) || n < 1 || n > MAX_POINTS)
    throw new RangeError("1..1000000 observations required");
  const x = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    if (!numeric(data.x[i]) || (i && data.x[i] <= x[i - 1]))
      throw new TypeError("X must be finite and strictly increasing");
    x[i] = data.x[i];
  }
  if (!Number.isFinite(x.at(-1) - x[0]))
    throw new RangeError("Finite X span required");
  const ids = new Set(),
    series = [];
  for (const source of data.series) {
    if (
      !source ||
      typeof source.id !== "string" ||
      !source.id ||
      source.id.length > 80 ||
      ids.has(source.id) ||
      typeof source.label !== "string" ||
      !source.label.trim() ||
      source.label.length > 160 ||
      source.values?.length !== n
    )
      throw new TypeError(
        "Unique series IDs, labels and aligned values required",
      );
    ids.add(source.id);
    const values = new Float64Array(n);
    let min = Infinity,
      max = -Infinity;
    for (let i = 0; i < n; i++) {
      const value = source.values[i];
      if (value !== null && !numeric(value))
        throw new TypeError("Values must be finite numbers or null");
      values[i] = value === null ? NaN : value;
      if (value !== null) {
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    }
    if (min !== Infinity && !Number.isFinite(max - min))
      throw new RangeError("Finite value span required");
    series.push({ id: source.id, label: source.label, values });
  }
  return { x, series, bytes: x.byteLength + n * 8 * series.length };
}

/** First index at or above X; all hit testing uses raw data rather than reduced marks. */
export function lowerBound(x, value) {
  let low = 0,
    high = x.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (x[middle] < value) low = middle + 1;
    else high = middle;
  }
  return low;
}

/** Locate the nearest actual observation, clamped at the ends; ties prefer the earlier observation. */
export function nearestIndex(x, value) {
  const right = lowerBound(x, value);
  if (!right) return 0;
  if (right === x.length) return x.length - 1;
  return value - x[right - 1] <= x[right] - value ? right - 1 : right;
}

/** Validate a numeric viewport without silently changing its boundaries or inventing data. */
export function analyticRange(raw, value) {
  const range = value || [raw.x[0], raw.x[raw.x.length - 1]];
  if (
    !Array.isArray(range) ||
    range.length !== 2 ||
    !range.every(numeric) ||
    range[0] > range[1]
  )
    throw new TypeError("Ordered finite range required");
  if (!Number.isFinite(range[1] - range[0]))
    throw new RangeError("Finite viewport span required");
  return [...range];
}

/** Reduce visible X buckets to first/min/max/last original points. A mixed null bucket breaks all connections conservatively. */
export function reduceSeries(raw, series, range, width, connectNulls = false) {
  const start = Math.max(0, lowerBound(raw.x, range[0]) - 1);
  const end = Math.min(raw.x.length, lowerBound(raw.x, range[1]) + 1);
  const buckets = Math.max(1, Math.min(4096, Math.floor(width)));
  const span = range[1] - range[0] || 1;
  const points = [];
  let cursor = start,
    previousGap = true,
    min = Infinity,
    max = -Infinity;
  while (cursor < end) {
    const bucket = Math.max(
      0,
      Math.min(
        buckets - 1,
        Math.floor(((raw.x[cursor] - range[0]) / span) * buckets),
      ),
    );
    let first = -1,
      last = -1,
      lo = -1,
      hi = -1,
      gap = false;
    while (cursor < end) {
      const next = Math.max(
        0,
        Math.min(
          buckets - 1,
          Math.floor(((raw.x[cursor] - range[0]) / span) * buckets),
        ),
      );
      if (next !== bucket) break;
      const value = series.values[cursor];
      if (Number.isNaN(value)) gap = true;
      else {
        if (first < 0) first = lo = hi = cursor;
        last = cursor;
        if (value < series.values[lo]) lo = cursor;
        if (value > series.values[hi]) hi = cursor;
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
      cursor++;
    }
    const indices = [...new Set([first, lo, hi, last])]
      .filter((i) => i >= 0)
      .sort((a, b) => a - b);
    for (let j = 0; j < indices.length; j++) {
      const index = indices[j];
      points.push({
        index,
        x: raw.x[index],
        y: series.values[index],
        move: !connectNulls && (previousGap || gap || (j === 0 && first < 0)),
      });
      previousGap = false;
    }
    if (!connectNulls && gap) previousGap = true;
  }
  return {
    points,
    min,
    max,
    scanned: end - start,
    conservativeGaps: !connectNulls,
  };
}

/** Append by stable series identity, keeping an explicit bounded rolling buffer and transactional validation. */
export function appendAnalytic(raw, addition, maxPoints = MAX_POINTS) {
  if (!Number.isInteger(maxPoints) || maxPoints < 1 || maxPoints > MAX_POINTS)
    throw new RangeError("Invalid rolling limit");
  const next = analyticData(addition);
  if (next.x[0] <= raw.x.at(-1) || next.series.length !== raw.series.length)
    throw new TypeError("Append must follow X and retain series identity");
  const total = Math.min(maxPoints, raw.x.length + next.x.length),
    skip = raw.x.length + next.x.length - total;
  const x = new Float64Array(total),
    series = [];
  for (let i = 0; i < total; i++) {
    const source = i + skip;
    x[i] =
      source < raw.x.length ? raw.x[source] : next.x[source - raw.x.length];
  }
  for (const old of raw.series) {
    const incoming = next.series.find((s) => s.id === old.id);
    if (!incoming) throw new TypeError("Append series IDs must match");
    const values = new Float64Array(total);
    for (let i = 0; i < total; i++) {
      const source = i + skip;
      values[i] =
        source < raw.x.length
          ? old.values[source]
          : incoming.values[source - raw.x.length];
    }
    series.push({ id: old.id, label: old.label, values });
  }
  return { x, series, bytes: total * 8 * (series.length + 1) };
}

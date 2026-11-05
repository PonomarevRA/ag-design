const PERCENTILES = Object.freeze([1, 5, 10, 30, 45, 65, 80, 90, 99, 100]);
const MAX_VALUES = 10000;

/** Reject coercion and non-finite values before a scale can publish misleading scores. */
function finite(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new TypeError(`${name} must be a finite number`);
  return value;
}

/** Copy bounded numeric input so later caller mutations cannot change an existing scale. */
function numericValues(values, name, maximum) {
  if (!Array.isArray(values) || values.length > maximum)
    throw new TypeError(`${name} must be an array with at most ${maximum} numbers`);
  const copy = [];
  for (const value of values) copy.push(finite(value, name));
  return copy;
}

/** Calculate a unit position without overflowing when an interval crosses the finite number range. */
function fraction(value, low, high) {
  if (value <= low) return 0;
  if (value >= high) return 1;
  const distance = high - low;
  if (Number.isFinite(distance)) return (value - low) / distance;
  return (value / 2 - low / 2) / (high / 2 - low / 2);
}

/** Build an immutable offline scale: ten discrete percentile anchors, an explicit range, or unknown.
 * Percentile intervals receive equal score width; ties choose the last matching lower anchor.
 * Empty data has no score. A collapsed range has no ranking information and returns zero.
 */
export function createNumericScale(options = {}) {
  if (!options || typeof options !== "object" || Array.isArray(options))
    throw new TypeError("Scale options must be an object");
  const { values, boundaries, min, max, maximum = 5 } = options;
  finite(maximum, "maximum");
  if (maximum <= 0) throw new RangeError("maximum must be positive");
  const hasData = values !== undefined || boundaries !== undefined;
  const hasRange = min !== undefined || max !== undefined;
  if ((values !== undefined && boundaries !== undefined) || (hasData && hasRange))
    throw new TypeError("Choose values, boundaries, or a min/max pair");
  let method = "none", anchors = [];
  let low = null, high = null;
  if (hasData) {
    if (boundaries !== undefined) {
      anchors = numericValues(boundaries, "boundaries", PERCENTILES.length);
      if (anchors.length !== PERCENTILES.length)
        throw new RangeError("boundaries must contain the ten percentile anchors");
      for (let index = 1; index < anchors.length; index++) {
        if (anchors[index] < anchors[index - 1])
          throw new RangeError("boundaries must be nondecreasing");
      }
    } else {
      const ordered = numericValues(values, "values", MAX_VALUES);
      ordered.sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
      if (ordered.length) {
        // Integer percentage multiplication avoids floating rounding moving an exact rank up one row.
        for (const percentile of PERCENTILES)
          anchors.push(ordered[Math.max(0, Math.ceil(percentile * ordered.length / 100) - 1)]);
      }
    }
    if (anchors.length) {
      method = "percentile";
      low = anchors[0]; high = anchors[anchors.length - 1];
    }
  } else if (hasRange) {
    low = finite(min, "min"); high = finite(max, "max");
    if (high < low) throw new RangeError("max must be at least min");
    method = "linear";
  }
  const frozenAnchors = Object.freeze(anchors);

  /** Evaluate one exact value; clamping affects the score only, never the original number. */
  function evaluate(value) {
    finite(value, "value");
    if (method === "none") return Object.freeze({ value, score: null, ratio: null });
    let ratio = 0;
    if (high !== low) {
      if (method === "linear" || value <= low || value >= high) {
        ratio = fraction(value, low, high);
      } else {
        let lower = 0;
        // Moving past ties avoids dividing by zero and keeps equal values at equal scores.
        while (lower + 1 < frozenAnchors.length && value >= frozenAnchors[lower + 1]) lower++;
        const local = fraction(value, frozenAnchors[lower], frozenAnchors[lower + 1]);
        ratio = (lower + local) / (frozenAnchors.length - 1);
      }
    }
    return Object.freeze({ value, score: maximum * ratio, ratio });
  }
  return Object.freeze({ method, min: low, max: high, maximum, boundaries: frozenAnchors, evaluate });
}

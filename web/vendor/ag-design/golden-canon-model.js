/**
 * Reduced AG diagonal construction. Fractions are projections of diagonal intersections,
 * not phi divisions or an imported BONT template. Keep parity with catalog/golden-canon-grid.json.
 */
export const GOLDEN_CANON_PROFILE = "ag-diagonal-core-v1";
export const GOLDEN_CANON_FRACTIONS = Object.freeze([
  0,
  1 / 5,
  1 / 4,
  1 / 3,
  2 / 5,
  1 / 2,
  3 / 5,
  2 / 3,
  3 / 4,
  4 / 5,
  1,
]);
const MAX_ANCHORS = 200;

/** Validate carrier dimensions in one physical coordinate system (CSS px, pt or EMU). */
export function goldenCanonGeometry(width, height) {
  for (const value of [width, height]) {
    if (!Number.isFinite(value) || value <= 0 || value > 1e10)
      throw new TypeError(
        "Grid dimensions must be positive finite values <= 1e10",
      );
  }
  const points = [];
  for (let row = 1; row < GOLDEN_CANON_FRACTIONS.length - 1; row++) {
    for (let column = 1; column < GOLDEN_CANON_FRACTIONS.length - 1; column++) {
      points.push({
        id: `x${column}-y${row}`,
        x: GOLDEN_CANON_FRACTIONS[column] * width,
        y: GOLDEN_CANON_FRACTIONS[row] * height,
      });
    }
  }
  return {
    profile: GOLDEN_CANON_PROFILE,
    width,
    height,
    points,
    vertical: GOLDEN_CANON_FRACTIONS.map((value) => value * width),
    horizontal: GOLDEN_CANON_FRACTIONS.map((value) => value * height),
  };
}

/**
 * Measure predeclared anchor points against the nearest interior intersection.
 * tolerance is a fraction of the shorter carrier side; the result retains original units.
 * An empty anchor set stays unknown. No geometry is moved and no quality score is inferred.
 */
export function checkGoldenCanon({
  width,
  height,
  anchors = [],
  tolerance = 0.008,
} = {}) {
  const grid = goldenCanonGeometry(width, height);
  if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > 0.05)
    throw new TypeError(
      "Tolerance must be between 0 and 0.05 of the shorter side",
    );
  if (!Array.isArray(anchors) || anchors.length > MAX_ANCHORS)
    throw new TypeError("At most 200 explicit anchors are supported");
  const ids = new Set(),
    results = [],
    threshold = Math.min(width, height) * tolerance;
  for (const anchor of anchors) {
    if (
      !anchor ||
      typeof anchor.id !== "string" ||
      !anchor.id ||
      anchor.id.length > 180 ||
      ids.has(anchor.id)
    )
      throw new TypeError(
        "Anchor IDs must be unique nonempty strings <= 180 characters",
      );
    ids.add(anchor.id);
    if (
      !Number.isFinite(anchor.x) ||
      !Number.isFinite(anchor.y) ||
      Math.abs(anchor.x) > 1e10 ||
      Math.abs(anchor.y) > 1e10
    )
      throw new TypeError("Anchors need finite carrier-local x/y coordinates");
    let nearest = null,
      distance = Infinity;
    for (const point of grid.points) {
      const candidate = Math.hypot(anchor.x - point.x, anchor.y - point.y);
      if (candidate < distance) {
        nearest = point;
        distance = candidate;
      }
    }
    const inside =
      anchor.x >= 0 && anchor.y >= 0 && anchor.x <= width && anchor.y <= height;
    results.push({
      id: anchor.id,
      x: anchor.x,
      y: anchor.y,
      target: nearest.id,
      targetX: nearest.x,
      targetY: nearest.y,
      dx: anchor.x - nearest.x,
      dy: anchor.y - nearest.y,
      distance,
      normalizedDistance: distance / Math.min(width, height),
      status: inside && distance <= threshold + 1e-9 ? "hit" : "miss",
    });
  }
  return {
    profile: grid.profile,
    width,
    height,
    tolerance,
    threshold,
    results,
    coverage: {
      measured: results.length,
      hit: results.filter((item) => item.status === "hit").length,
    },
    status: results.length ? "measured" : "unknown",
    trust: "geometric-only",
  };
}

/** Resolve one explicit bounding-box anchor; text baselines and optical ink are not measured. */
export function goldenCanonRectAnchor(rect, anchor = "top-left") {
  for (const key of ["x", "y", "width", "height"])
    if (!Number.isFinite(rect?.[key]))
      throw new TypeError("Finite rectangle required");
  if (rect.width < 0 || rect.height < 0)
    throw new TypeError("Negative rectangle size");
  const offsets = {
    "top-left": [0, 0],
    "top-right": [1, 0],
    "bottom-left": [0, 1],
    "bottom-right": [1, 1],
    center: [0.5, 0.5],
  };
  if (!Object.hasOwn(offsets, anchor))
    throw new TypeError("Unknown rectangle anchor");
  const [x, y] = offsets[anchor];
  return { x: rect.x + rect.width * x, y: rect.y + rect.height * y };
}

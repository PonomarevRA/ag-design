/**
 * Authored geometric templates for framing; named techniques do not prescribe these numeric defaults or guarantee aesthetic quality.
 */
export const COMPOSITION_GRID_FIELDS = Object.freeze({
  "edge-balance": ["type", "edge", "insetRatio", "focusRatio"],
  "lead-room": ["type", "edge", "eyeLevel"],
  "center-perspective": ["type", "vanishX", "vanishY"],
  "phi-grid": ["type"],
  "golden-triangle": ["type", "flipX", "flipY"],
  "diagonal-flow": ["type", "flipX", "flipY"],
  "icon-keylines": ["type"],
});
export const COMPOSITION_GRID_TYPES = Object.freeze(
  Object.keys(COMPOSITION_GRID_FIELDS),
);

/**
 * Supply local normalized positions, never device-specific camera rules.
 * @param {string} type Supported composition profile ID.
 * @returns {object} Fresh normalized AG defaults; other types return an empty object.
 */
export function compositionDefaults(type) {
  if (type === "edge-balance")
    return { edge: "left", insetRatio: 0.18, focusRatio: 0.4 };
  if (type === "lead-room") return { edge: "left", eyeLevel: 1 / 3 };
  if (type === "center-perspective") return { vanishX: 0.5, vanishY: 0.45 };
  if (["golden-triangle", "diagonal-flow"].includes(type))
    return { flipX: false, flipY: false };
  return {};
}
/**
 * Project onto a finite segment so rectangular frames preserve physical perpendicular geometry.
 * @param {number} x Local horizontal coordinate.
 * @param {number} y Local vertical coordinate in the same unit.
 * @param {object} line Finite x1/y1/x2/y2 segment.
 * @returns {object} Closest closed-segment point; degenerate segments return the first endpoint.
 */
export function segmentTarget(x, y, line) {
  const dx = line.x2 - line.x1,
    dy = line.y2 - line.y1,
    denominator = dx * dx + dy * dy;
  const t = denominator
    ? Math.max(
        0,
        Math.min(1, ((x - line.x1) * dx + (y - line.y1) * dy) / denominator),
      )
    : 0;
  return { x: line.x1 + t * dx, y: line.y1 + t * dy };
}
/**
 * Construct bounded local points/segments/zones; square icon keylines never stretch to fill a rectangular carrier.
 * @param {number} width Validated positive carrier width.
 * @param {number} height Validated positive height in the same unit.
 * @param {object} config Strict settings with resolved defaults.
 * @returns {object} Detached bounded local axes, points, segments, regions and optional circles.
 */
export function compositionGeometry(width, height, config) {
  let x = [],
    y = [],
    points = [],
    diagonals = [],
    regions = [],
    circles = [];
  const point = (id, px, py) => ({ id, x: px, y: py });
  if (config.type === "edge-balance") {
    const side = config.edge,
      vertical = ["top", "bottom"].includes(side),
      reverse = ["right", "bottom"].includes(side);
    const axis = reverse ? 1 - config.insetRatio : config.insetRatio;
    const px = vertical ? config.focusRatio : axis,
      py = vertical ? axis : config.focusRatio;
    const bx = vertical ? 0.5 : reverse ? 0.3 : 0.7,
      by = vertical ? (reverse ? 0.3 : 0.7) : 0.5;
    x = [px * width];
    y = [py * height];
    points = [
      point("subject", x[0], y[0]),
      point("counterweight", bx * width, by * height),
    ];
    const start = reverse ? 0.05 : 0.4;
    regions = [
      {
        id: "negative-space",
        x: (vertical ? 0.05 : start) * width,
        y: (vertical ? start : 0.05) * height,
        width: (vertical ? 0.9 : 0.55) * width,
        height: (vertical ? 0.55 : 0.9) * height,
      },
    ];
  } else if (config.type === "lead-room") {
    const subject = config.edge === "left" ? 1 / 3 : 2 / 3,
      look = 1 - subject;
    x = [subject * width, look * width];
    y = [config.eyeLevel * height];
    points = [point("subject", x[0], y[0]), point("look-target", x[1], y[0])];
    regions = [
      {
        id: "look-room",
        x: (config.edge === "left" ? 0.45 : 0.05) * width,
        y: 0.1 * height,
        width: 0.5 * width,
        height: 0.8 * height,
      },
    ];
  } else if (config.type === "center-perspective") {
    const px = config.vanishX * width,
      py = config.vanishY * height;
    x = [px];
    y = [py];
    points = [point("vanishing", px, py)];
    for (const [a, b] of [
      [0, 0],
      [width, 0],
      [width, height],
      [0, height],
      [width / 2, 0],
      [width, height / 2],
      [width / 2, height],
      [0, height / 2],
    ])
      diagonals.push({ x1: a, y1: b, x2: px, y2: py });
  } else if (config.type === "phi-grid") {
    const f = (3 - Math.sqrt(5)) / 2;
    x = [f * width, (1 - f) * width];
    y = [f * height, (1 - f) * height];
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 2; col++)
        points.push(point(`phi-${col}-${row}`, x[col], y[row]));
  } else if (["golden-triangle", "diagonal-flow"].includes(config.type)) {
    const main = { x1: 0, y1: 0, x2: width, y2: height };
    diagonals = [main];
    if (config.type === "golden-triangle") {
      for (const [index, a, b] of [
        [0, width, 0],
        [1, 0, height],
      ]) {
        const foot = segmentTarget(a, b, main);
        diagonals.push({ x1: a, y1: b, x2: foot.x, y2: foot.y });
        points.push(point("foot-" + index, foot.x, foot.y));
      }
    } else {
      diagonals.push({ x1: width, y1: 0, x2: 0, y2: height });
      points = [
        point("center", width / 2, height / 2),
        point("flow-start", width / 3, height / 3),
        point("flow-end", (width * 2) / 3, (height * 2) / 3),
      ];
    }
    if (config.flipX) {
      points = points.map((p) => ({ ...p, x: width - p.x }));
      diagonals = diagonals.map((d) => ({
        ...d,
        x1: width - d.x1,
        x2: width - d.x2,
      }));
    }
    if (config.flipY) {
      points = points.map((p) => ({ ...p, y: height - p.y }));
      diagonals = diagonals.map((d) => ({
        ...d,
        y1: height - d.y1,
        y2: height - d.y2,
      }));
    }
  } else if (config.type === "icon-keylines") {
    const size = Math.min(width, height),
      step = size / 24,
      left = (width - size) / 2,
      top = (height - size) / 2;
    x = [2, 3, 4, 12, 20, 21, 22].map((v) => left + v * step);
    y = [2, 3, 4, 12, 20, 21, 22].map((v) => top + v * step);
    points = [
      point("center", width / 2, height / 2),
      point("square-tl", left + 3 * step, top + 3 * step),
      point("square-br", left + 21 * step, top + 21 * step),
    ];
    circles = [
      { id: "circle-keyline", cx: width / 2, cy: height / 2, r: 10 * step },
    ];
    for (const [id, a, b, w, h] of [
      ["live", 2, 2, 20, 20],
      ["square", 3, 3, 18, 18],
      ["portrait", 4, 2, 16, 20],
      ["landscape", 2, 4, 20, 16],
    ])
      regions.push({
        id,
        x: left + a * step,
        y: top + b * step,
        width: w * step,
        height: h * step,
      });
  }
  return {
    x,
    y,
    points,
    diagonals,
    regions,
    ...(circles.length ? { circles } : {}),
  };
}
/**
 * Measure explicit guide anchors against actual finite segments/circles, not a fabricated axis intersection.
 * @param {object} shape Validated geometry with finite segments and optional circles.
 * @param {object} anchor Declared local x/y in the same unit.
 * @returns {object|null} Nearest guide point/distance; equal distances keep the first guide.
 */
export function nearestCompositionGuide(shape, anchor) {
  let best = null;
  function consider(id, x, y) {
    const distance = Math.hypot(anchor.x - x, anchor.y - y);
    if (!best || distance < best.distance) best = { id, x, y, distance };
  }
  for (let i = 0; i < shape.diagonals.length; i++) {
    const p = segmentTarget(anchor.x, anchor.y, shape.diagonals[i]);
    consider("segment-" + i, p.x, p.y);
  }
  for (const circle of shape.circles ?? []) {
    const dx = anchor.x - circle.cx,
      dy = anchor.y - circle.cy,
      d = Math.hypot(dx, dy);
    consider(
      circle.id,
      circle.cx + (d ? dx / d : 1) * circle.r,
      circle.cy + (d ? dy / d : 0) * circle.r,
    );
  }
  return best;
}

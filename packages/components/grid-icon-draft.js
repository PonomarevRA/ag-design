import { layoutGridGeometry, checkLayoutGrid } from "./layout-grid-model.js";
export const GRID_ICON_SYMBOLS = Object.freeze([
  "play",
  "focus",
  "image",
  "compass",
]);
const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Original fixed primitives are data, never arbitrary SVG paths/scripts supplied by a caller.
 * @param {string} symbol Validated starter ID.
 * @returns {Array<object>} Fresh original fixed primitive data.
 */
function drawing(symbol) {
  if (symbol === "play")
    return [
      {
        kind: "polygon",
        points: [
          [8, 5],
          [8, 19],
          [20, 12],
        ],
        fill: true,
      },
    ];
  if (symbol === "focus")
    return [
      [
        [4, 9],
        [4, 4],
        [9, 4],
      ],
      [
        [15, 4],
        [20, 4],
        [20, 9],
      ],
      [
        [20, 15],
        [20, 20],
        [15, 20],
      ],
      [
        [9, 20],
        [4, 20],
        [4, 15],
      ],
    ].map((points) => ({ kind: "polyline", points }));
  if (symbol === "image")
    return [
      { kind: "rect", x: 3, y: 3, width: 18, height: 18 },
      { kind: "circle", cx: 8, cy: 8, r: 2 },
      {
        kind: "polyline",
        points: [
          [5, 18],
          [10, 12],
          [14, 16],
          [18, 10],
          [20, 18],
        ],
      },
    ];
  return [
    { kind: "circle", cx: 12, cy: 12, r: 9 },
    {
      kind: "polygon",
      points: [
        [8, 16],
        [10, 10],
        [16, 8],
        [14, 14],
      ],
    },
  ];
}
/**
 * Calculate conservative visible stroke bounds; outlines, not merely path centres, must stay inside the carrier.
 * @param {Array<object>} primitives Generated geometric primitives.
 * @param {number} strokeWidth Finite stroke width in viewBox units.
 * @returns {object} Conservative visible rectangle including round cap/join extents.
 */
function bounds(primitives, strokeWidth) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  // Path centres alone omit cap/join extents; expand every primitive by half the stroke.
  for (const p of primitives) {
    let left, top, right, bottom;
    if (p.kind === "circle") {
      left = p.cx - p.r;
      right = p.cx + p.r;
      top = p.cy - p.r;
      bottom = p.cy + p.r;
    } else if (p.kind === "rect") {
      left = p.x;
      right = p.x + p.width;
      top = p.y;
      bottom = p.y + p.height;
    } else {
      left = Math.min(...p.points.map((v) => v[0]));
      right = Math.max(...p.points.map((v) => v[0]));
      top = Math.min(...p.points.map((v) => v[1]));
      bottom = Math.max(...p.points.map((v) => v[1]));
    }
    minX = Math.min(minX, left - strokeWidth / 2);
    minY = Math.min(minY, top - strokeWidth / 2);
    maxX = Math.max(maxX, right + strokeWidth / 2);
    maxY = Math.max(maxY, bottom + strokeWidth / 2);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
/**
 * Escape literal accessible text without accepting markup or external resource references.
 * @param {string} value Validated literal accessible title.
 * @returns {string} XML-escaped title text, never supplied markup.
 */
function escape(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
/**
 * Serialize one finite generated coordinate with bounded decimal precision.
 * @param {number} value Finite coordinate in viewBox units.
 * @returns {string} Decimal text with at most six fractional places.
 */
function fmt(value) {
  return String(Number(value.toFixed(6)));
}

/**
 * Generate a bounded starter glyph plus construction evidence; this is not unrestricted text-to-icon generation or aesthetic qualification.
 * @param {object} [options] Bounded original glyph recipe; omitted values select focus/UI/keylines.
 * @param {string} [options.symbol="focus"] play, focus, image or compass.
 * @param {string} [options.purpose="ui"] UI24 or illustrative64 viewBox units.
 * @param {object} [options.grid] Strict keyline/spacing or appropriate framing profile.
 * @param {string} [options.label] Nonblank literal title, max80 UTF-16 units; defaults to symbol.
 * @param {number} [options.strokeWidth=1.5] Initial stroke width from1 through3.
 * @returns {object} Detached primitives, safe SVG, visible bounds and numeric report.
 * @throws {TypeError} Invalid symbol, purpose, title, strict grid settings or incompatible grid purpose.
 * @throws {RangeError} Invalid stroke width or no safe live area.
 * @example
 * const draft = createGridIconDraft({ symbol: "focus", grid: { type: "icon-keylines" } });
 * // Inspect draft.visibleBounds/report; host still owns naming, color and optical review.
 */
export function createGridIconDraft({
  symbol = "focus",
  purpose = "ui",
  grid,
  label = symbol,
  strokeWidth = 1.5,
} = {}) {
  if (
    !GRID_ICON_SYMBOLS.includes(symbol) ||
    !["ui", "illustrative"].includes(purpose)
  )
    throw new TypeError("icon symbol/purpose");
  if (
    typeof label !== "string" ||
    !label.trim() ||
    label.length > 80 ||
    /[\u0000-\u001f\u007f-\u009f\ud800-\udfff\ufffe\uffff]/u.test(label)
  )
    throw new TypeError("icon label");
  if (
    typeof strokeWidth !== "number" ||
    !Number.isFinite(strokeWidth) ||
    strokeWidth < 1 ||
    strokeWidth > 3
  )
    throw new RangeError("icon strokeWidth");
  const requested = grid ?? { type: "icon-keylines" };
  const spec =
    requested.type === "spacing" && requested.step === undefined
      ? { ...requested, step: 2 }
      : requested;
  if (purpose === "ui" && !["icon-keylines", "spacing"].includes(spec.type))
    throw new TypeError(
      "UI icons require icon-keylines or spacing; other grids are illustrative framing",
    );
  if (
    purpose === "illustrative" &&
    ![
      "icon-keylines",
      "spacing",
      "golden-canon",
      "thirds",
      "edge-balance",
      "lead-room",
      "center-perspective",
      "phi-grid",
      "golden-triangle",
      "diagonal-flow",
    ].includes(spec.type)
  )
    throw new TypeError(
      "Single icon drafts require keylines, spacing or a framing profile; reading/track grids belong to the surrounding layout",
    );
  const size = purpose === "ui" ? 24 : 64,
    geometry = layoutGridGeometry({ width: size, height: size, grid: spec });
  let focal = geometry.points.find((p) =>
    ["subject", "vanishing", "center"].includes(p.id),
  );
  if (!focal && geometry.points.length) {
    let best = Infinity;
    for (const p of geometry.points) {
      const distance = Math.hypot(p.x - size / 2, p.y - size / 2);
      if (distance < best) {
        best = distance;
        focal = p;
      }
    }
  }
  if (!focal) focal = { id: "carrier-center", x: size / 2, y: size / 2 };
  const canonical = drawing(symbol),
    canonicalBounds = bounds(canonical, strokeWidth),
    padding = 2;
  const radius = Math.max(
    12 - canonicalBounds.x,
    canonicalBounds.x + canonicalBounds.width - 12,
    12 - canonicalBounds.y,
    canonicalBounds.y + canonicalBounds.height - 12,
  );
  const available = Math.min(
    focal.x - padding,
    focal.y - padding,
    size - padding - focal.x,
    size - padding - focal.y,
  );
  if (available <= 0)
    throw new RangeError("icon focal point leaves no safe live area");
  // Shrink around the declared focal point until the visible stroke fits; retain family scale caps.
  const scale = Math.min(purpose === "ui" ? 1 : 1.6, available / radius);
  /**
   * Place one canonical horizontal coordinate around the chosen focal point.
   * @param {number} x Canonical glyph coordinate in24-unit construction space.
   * @returns {number} Scaled local horizontal coordinate.
   */
  function tx(x) {
    return focal.x + (x - 12) * scale;
  }
  /**
   * Place one canonical vertical coordinate around the chosen focal point.
   * @param {number} y Canonical glyph coordinate in24-unit construction space.
   * @returns {number} Scaled local vertical coordinate.
   */
  function ty(y) {
    return focal.y + (y - 12) * scale;
  }
  const primitives = [];
  for (const p of canonical) {
    let value;
    if (p.kind === "circle")
      value = { ...p, cx: tx(p.cx), cy: ty(p.cy), r: p.r * scale };
    else if (p.kind === "rect")
      value = {
        ...p,
        x: tx(p.x),
        y: ty(p.y),
        width: p.width * scale,
        height: p.height * scale,
      };
    else value = { ...p, points: p.points.map(([x, y]) => [tx(x), ty(y)]) };
    primitives.push(value);
  }
  const stroke = strokeWidth * scale,
    visible = bounds(primitives, stroke),
    anchors = [
      { id: "construction-focus", ownerId: "icon", x: focal.x, y: focal.y },
    ];
  const report = checkLayoutGrid({
    width: size,
    height: size,
    grid: spec,
    anchors,
  });
  const elements = primitives.map((p) => {
    const common = ` fill="${p.fill ? "currentColor" : "none"}"`;
    if (p.kind === "circle")
      return `<circle cx="${fmt(p.cx)}" cy="${fmt(p.cy)}" r="${fmt(p.r)}"${common}/>`;
    if (p.kind === "rect")
      return `<rect x="${fmt(p.x)}" y="${fmt(p.y)}" width="${fmt(p.width)}" height="${fmt(p.height)}"${common}/>`;
    return `<${p.kind} points="${p.points.map((p) => p.map(fmt).join(",")).join(" ")}"${common}/>`;
  });
  const svg = `<svg xmlns="${SVG_NS}" viewBox="0 0 ${size} ${size}" role="img" stroke="currentColor" stroke-width="${fmt(stroke)}" stroke-linecap="round" stroke-linejoin="round"><title>${escape(label)}</title>${elements.join("")}</svg>`;
  const result = {
    schemaVersion: "ag-design/grid-icon-draft-v1",
    symbol,
    purpose,
    label,
    viewBox: { x: 0, y: 0, width: size, height: size },
    strokeWidth: stroke,
    primitives,
    svg,
    visibleBounds: visible,
    padding,
    withinLiveArea:
      visible.x >= padding - 1e-9 &&
      visible.y >= padding - 1e-9 &&
      visible.x + visible.width <= size - padding + 1e-9 &&
      visible.y + visible.height <= size - padding + 1e-9,
    report,
    constraints: {
      colors: "currentColor; host semantic palette",
      immutability: "detached draft data",
      alignment: "construction evidence only",
      opticalReview: "unknown",
      semanticRecognition: "unknown",
      accessibility: "host-owned name/control/contrast",
    },
    warnings: [
      "A grid hit is not proof of legibility, recognition or professional composition.",
      "Review actual16/20/24/32px rendering and optical balance; preserve host icon family and labels.",
    ],
  };
  return result;
}

import {
  COMPOSITION_GRID_TYPES,
  COMPOSITION_GRID_FIELDS,
  compositionDefaults,
  compositionGeometry,
  nearestCompositionGuide,
} from "./composition-grid-profiles.js";
import { goldenCanonGeometry } from "./golden-canon-model.js";

export const LAYOUT_GRID_VERSION = "ag-design/layout-grid-v1";
export const LAYOUT_GRID_TYPES = Object.freeze([
  "golden-canon",
  "columns",
  "modular",
  "baseline",
  "spacing",
  "thirds",
  "manuscript",
  ...COMPOSITION_GRID_TYPES,
]);
const SCALE = { "css-px": 1, pt: 0.75, emu: 9525 };
const KINDS = ["point", "x-line", "y-line", "baseline", "guide"];

/** Reject malformed configuration before generating any geometry or replacing a live overlay. */
function fail(message) {
  throw new TypeError("Invalid layout grid: " + message);
}

/** Accept finite bounded real coordinates; JavaScript booleans are never numeric evidence. */
function number(value, name, minimum = -1e10, maximum = 1e10) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  )
    fail(name);
  return value;
}

/** Keep stable object identities bounded and unambiguous within their declared carrier. */
function identity(value, name) {
  if (typeof value !== "string" || value.length < 1 || value.length > 180)
    fail(name);
  return value;
}

/** Validate literal records and fail closed on misspelled or unsupported options. */
function fields(value, allowed, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(name);
  for (const key of Object.keys(value))
    if (!allowed.includes(key)) fail(name + "." + key);
}

/** Validate an explicit carrier rectangle in its immediate parent's coordinate system. */
function rectangle(value) {
  fields(value, ["x", "y", "width", "height"], "rect");
  return {
    x: number(value.x, "rect.x"),
    y: number(value.y, "rect.y"),
    width: number(value.width, "rect.width", 0.000001),
    height: number(value.height, "rect.height", 0.000001),
  };
}

/** Resolve authored defaults in one declared unit; responsive track counts use the local carrier width. */
function specification(width, height, unit, grid) {
  if (typeof unit !== "string" || !Object.hasOwn(SCALE, unit)) fail("unit");
  const scale = SCALE[unit];
  fields(
    grid,
    [
      "type",
      "columns",
      "rows",
      "margin",
      "gutter",
      "step",
      "offset",
      "edge",
      "insetRatio",
      "focusRatio",
      "eyeLevel",
      "vanishX",
      "vanishY",
      "flipX",
      "flipY",
    ],
    "grid",
  );
  if (!LAYOUT_GRID_TYPES.includes(grid.type)) fail("type");
  const responsive = width / scale < 480 ? 4 : width / scale < 960 ? 8 : 12;
  const defaults = { type: grid.type, ...compositionDefaults(grid.type) };
  if (["columns", "modular", "manuscript"].includes(grid.type))
    defaults.margin = Math.min(16 * scale, Math.min(width, height) / 8);
  if (["columns", "modular"].includes(grid.type)) {
    defaults.columns = grid.type === "modular" ? 4 : responsive;
    defaults.gutter = 16 * scale;
  }
  if (grid.type === "modular") defaults.rows = 4;
  if (["baseline", "spacing"].includes(grid.type)) {
    defaults.step = (grid.type === "baseline" ? 24 : 8) * scale;
    defaults.offset = 0;
  }
  const allowed = {
    "golden-canon": ["type"],
    thirds: ["type"],
    manuscript: ["type", "margin"],
    columns: ["type", "columns", "margin", "gutter"],
    modular: ["type", "columns", "rows", "margin", "gutter"],
    baseline: ["type", "step", "offset"],
    spacing: ["type", "step", "offset"],
    ...COMPOSITION_GRID_FIELDS,
  }[grid.type];
  for (const key of Object.keys(grid))
    if (!allowed.includes(key)) fail("unsupported option " + key);
  const result = { ...defaults, ...grid };
  if (
    "edge" in result &&
    !(
      result.type === "lead-room"
        ? ["left", "right"]
        : ["left", "right", "top", "bottom"]
    ).includes(result.edge)
  )
    fail("edge");
  for (const key of ["flipX", "flipY"])
    if (key in result && typeof result[key] !== "boolean") fail(key);
  for (const [key, min, max] of [
    ["insetRatio", 0.05, 0.4],
    ["focusRatio", 0.1, 0.9],
    ["eyeLevel", 0.1, 0.6],
    ["vanishX", 0.1, 0.9],
    ["vanishY", 0.1, 0.9],
  ])
    if (key in result) number(result[key], key, min, max);

  for (const key of ["columns", "rows"])
    if (key in result) {
      number(result[key], key, 1, 24);
      if (!Number.isInteger(result[key])) fail(key);
    }
  for (const key of ["margin", "gutter", "offset"])
    if (key in result) number(result[key], key, 0);
  if ("step" in result) number(result.step, "step", 0.000001);
  if ("margin" in result && result.margin * 2 >= Math.min(width, height))
    fail("margin leaves no content");
  return result;
}

/** Produce both edges of every equal track; gutters stay empty and are never counted as track interiors. */
function tracks(length, count, margin, gutter) {
  const extent = (length - margin * 2 - gutter * (count - 1)) / count;
  if (extent <= 0) fail("tracks do not fit");
  const values = [];
  for (let i = 0; i < count; i++) {
    values.push(margin + i * (extent + gutter));
    values.push(margin + i * (extent + gutter) + extent);
  }
  return [...new Set(values)].sort((a, b) => a - b);
}

/** Generate bounded repeated guides without allocating an unbounded Cartesian point lattice. */
function repeated(length, step, offset) {
  if (offset > length) fail("offset");
  const count = Math.floor((length - offset) / step + 1e-10) + 1;
  if (count > 257) fail("axis line budget");
  const values = [];
  for (let i = 0; i < count; i++) values.push(offset + i * step);
  return values;
}

/** Return local guide geometry. Regular intersections remain derivable from axes, not thousands of objects. */
export function layoutGridGeometry({
  width,
  height,
  unit = "css-px",
  grid = { type: "golden-canon" },
}) {
  number(width, "width", 0.000001);
  number(height, "height", 0.000001);
  const config = specification(width, height, unit, grid);
  let x = [],
    y = [],
    points = [],
    diagonals = [],
    regions = [],
    circles = [];
  if (config.type === "golden-canon") {
    const golden = goldenCanonGeometry(width, height);
    x = golden.vertical;
    y = golden.horizontal;
    points = golden.points.map((p) => ({ ...p }));
    for (const [left, top, w, h] of [
      [0, 0, width, height],
      [0, 0, width / 2, height],
      [width / 2, 0, width / 2, height],
      [0, 0, width, height / 2],
      [0, height / 2, width, height / 2],
    ]) {
      diagonals.push(
        { x1: left, y1: top, x2: left + w, y2: top + h },
        { x1: left + w, y1: top, x2: left, y2: top + h },
      );
    }
  } else if (config.type === "thirds") {
    x = [width / 3, (width * 2) / 3];
    y = [height / 3, (height * 2) / 3];
    for (let row = 0; row < 2; row++)
      for (let column = 0; column < 2; column++)
        points.push({ id: "x" + column + "-y" + row, x: x[column], y: y[row] });
  } else if (config.type === "columns" || config.type === "modular") {
    x = tracks(width, config.columns, config.margin, config.gutter);
    if (config.type === "modular")
      y = tracks(height, config.rows, config.margin, config.gutter);
  } else if (config.type === "manuscript") {
    x = [config.margin, width - config.margin];
    y = [config.margin, height - config.margin];
    regions = [
      {
        id: "content",
        x: x[0],
        y: y[0],
        width: x[1] - x[0],
        height: y[1] - y[0],
      },
    ];
  } else if (COMPOSITION_GRID_TYPES.includes(config.type)) {
    const authored = compositionGeometry(width, height, config);
    ({ x, y, points, diagonals, regions } = authored);
    circles = authored.circles ?? [];
  } else {
    y = repeated(height, config.step, config.offset);
    if (config.type === "spacing")
      x = repeated(width, config.step, config.offset);
  }
  if (x.length + y.length > 512) fail("scope line budget");
  const result = {
    schemaVersion: LAYOUT_GRID_VERSION,
    profile:
      config.type === "golden-canon"
        ? "ag-diagonal-core-v1"
        : "ag-" + config.type + "-v1",
    width,
    height,
    unit,
    config,
    x,
    y,
    points,
    diagonals,
    regions,
    ...(circles.length ? { circles } : {}),
    defaultKind:
      config.type === "columns"
        ? "x-line"
        : config.type === "baseline"
          ? "baseline"
          : "point",
  };
  return result;
}

/** Return the nearest ordinate deterministically, preserving lower-index ties across JS and Python. */
function nearest(values, value) {
  let best = null;
  for (let i = 0; i < values.length; i++) {
    const distance = Math.abs(value - values[i]);
    if (!best || distance < best.distance)
      best = { index: i, value: values[i], distance };
  }
  return best;
}

/** Measure declared points/lines only; a box edge cannot masquerade as a measured text baseline. */
function checkGeometry(geometry, anchors, tolerance) {
  if (!Array.isArray(anchors) || anchors.length > 256) fail("anchors");
  number(tolerance, "tolerance", 0, 0.05);
  const ids = new Set(),
    results = [],
    threshold = Math.min(geometry.width, geometry.height) * tolerance;
  for (const anchor of anchors) {
    fields(
      anchor,
      ["id", "ownerId", "x", "y", "kind", "unknownReason", "baselineSource"],
      "anchor",
    );
    const id = identity(anchor.id, "anchor.id"),
      kind = anchor.kind === undefined ? geometry.defaultKind : anchor.kind;
    if (ids.has(id) || !KINDS.includes(kind)) fail("anchor identity/kind");
    ids.add(id);
    if (anchor.x !== undefined) number(anchor.x, "anchor.x");
    if (anchor.y !== undefined) number(anchor.y, "anchor.y");
    if (anchor.unknownReason !== undefined)
      identity(anchor.unknownReason, "unknownReason");
    if (anchor.ownerId !== undefined) identity(anchor.ownerId, "ownerId");
    const owner =
      anchor.ownerId === undefined ? {} : { ownerId: anchor.ownerId };
    if (
      anchor.baselineSource !== undefined &&
      !["renderer-baseline", "native-text-engine"].includes(
        anchor.baselineSource,
      )
    )
      fail("baselineSource");
    const missing =
      (kind === "x-line" && anchor.x === undefined) ||
      (kind !== "x-line" && anchor.y === undefined) ||
      (["point", "guide"].includes(kind) && anchor.x === undefined);
    let reason =
      anchor.unknownReason || (missing ? "measurement-unavailable" : null);
    if (kind === "baseline" && geometry.config.type !== "baseline")
      reason = "baseline-grid-required";
    if (kind === "baseline" && !anchor.baselineSource)
      reason = "baseline-provenance-required";
    if (reason) {
      results.push({
        id,
        kind,
        ...owner,
        x: anchor.x ?? null,
        y: anchor.y ?? null,
        status: "unknown",
        reason,
      });
      continue;
    }
    let target = null;
    if (kind === "guide") {
      target = nearestCompositionGuide(geometry, anchor);
    } else if (kind === "point") {
      if (geometry.points.length) {
        for (const point of geometry.points) {
          const distance = Math.hypot(anchor.x - point.x, anchor.y - point.y);
          if (!target || distance < target.distance)
            target = { id: point.id, x: point.x, y: point.y, distance };
        }
      } else {
        const nx = nearest(geometry.x, anchor.x),
          ny = nearest(geometry.y, anchor.y);
        if (nx && ny)
          target = {
            id: "x" + nx.index + "-y" + ny.index,
            x: nx.value,
            y: ny.value,
            distance: Math.hypot(anchor.x - nx.value, anchor.y - ny.value),
          };
      }
    } else {
      const horizontal = kind !== "x-line",
        values = horizontal ? geometry.y : geometry.x,
        value = horizontal ? anchor.y : anchor.x;
      const n = nearest(values, value);
      if (n)
        target = {
          id: (horizontal ? "y" : "x") + n.index,
          x: horizontal ? (anchor.x ?? null) : n.value,
          y: horizontal ? n.value : (anchor.y ?? null),
          distance: n.distance,
        };
    }
    if (!target) {
      results.push({
        id,
        kind,
        ...owner,
        x: anchor.x ?? null,
        y: anchor.y ?? null,
        status: "unknown",
        reason: "no-compatible-target",
      });
      continue;
    }
    const x = anchor.x ?? null,
      y = anchor.y ?? null;
    const inside =
      (x === null || (x >= 0 && x <= geometry.width)) &&
      (y === null || (y >= 0 && y <= geometry.height));
    const dx = x === null || target.x === null ? null : x - target.x,
      dy = y === null || target.y === null ? null : y - target.y;
    results.push({
      id,
      kind,
      ...owner,
      x,
      y,
      target: target.id,
      targetX: target.x,
      targetY: target.y,
      dx,
      dy,
      distance: target.distance,
      normalizedDistance:
        target.distance / Math.min(geometry.width, geometry.height),
      status: inside && target.distance <= threshold + 1e-9 ? "hit" : "miss",
      ...(kind === "baseline" ? { baselineSource: anchor.baselineSource } : {}),
    });
  }
  const coverage = {
    measured: 0,
    hit: 0,
    miss: 0,
    unknown: 0,
    total: results.length,
  };
  for (const result of results) {
    coverage[result.status]++;
    if (result.status !== "unknown") coverage.measured++;
  }
  return {
    schemaVersion: LAYOUT_GRID_VERSION,
    geometry,
    unit: geometry.unit,
    tolerance,
    threshold,
    results,
    coverage,
    status: coverage.measured ? "measured" : "unknown",
    trust: "caller-reported-geometric-only",
  };
}

/** Pure single-carrier evaluation with no DOM, image recognition, network or persistent side effects. */
export function checkLayoutGrid({ anchors = [], tolerance = 0.008, ...input }) {
  return checkGeometry(layoutGridGeometry(input), anchors, tolerance);
}

/** Resolve explicit local origins and optional inherited guides; scopes may use different grid types. */
export function checkLayoutGridTree({
  unit = "css-px",
  tolerance = 0.008,
  scopes,
}) {
  if (typeof unit !== "string" || !Object.hasOwn(SCALE, unit)) fail("unit");
  number(tolerance, "tolerance", 0, 0.05);
  if (!Array.isArray(scopes) || scopes.length > 32) fail("scope budget");
  const resolved = new Map(),
    reports = [];
  let anchorsTotal = 0,
    linesTotal = 0;
  for (const scope of scopes) {
    fields(
      scope,
      ["id", "parentId", "rect", "grid", "anchors", "inheritAxes"],
      "scope",
    );
    const id = identity(scope.id, "scope.id"),
      rect = rectangle(scope.rect),
      parentId = scope.parentId ?? null;
    if (resolved.has(id)) fail("duplicate scope");
    const parent = parentId === null ? null : resolved.get(parentId);
    if (parentId !== null && !parent) fail("parent must precede child");
    if (
      scope.inheritAxes !== undefined &&
      (!parent || !["x", "y", "both"].includes(scope.inheritAxes))
    )
      fail("inheritAxes");
    const geometry = layoutGridGeometry({
      width: rect.width,
      height: rect.height,
      grid: scope.grid,
      unit,
    });
    geometry.axisSources = {
      x: { scopeId: id, profile: geometry.profile },
      y: { scopeId: id, profile: geometry.profile },
    };
    if (scope.inheritAxes) {
      for (const axis of ["x", "y"])
        if (scope.inheritAxes === axis || scope.inheritAxes === "both") {
          const shift = rect[axis],
            extent = axis === "x" ? rect.width : rect.height;
          geometry[axis] = parent.geometry[axis]
            .map((value) => value - shift)
            .filter((value) => value >= 0 && value <= extent);
          geometry.axisSources[axis] = { ...parent.geometry.axisSources[axis] };
        }
      geometry.points = [];
      geometry.diagonals = [];
      geometry.regions = [];
      delete geometry.circles;
      geometry.localProfile = geometry.profile;
      geometry.profile = "ag-inherited-guides-v1";
      geometry.inheritance = {
        scopeId: parentId,
        axes: scope.inheritAxes,
        method: "guide-projection-not-css-track-sizing",
      };
    }
    const anchors = scope.anchors ?? [];
    if (!Array.isArray(anchors)) fail("anchors");
    anchorsTotal += anchors.length;
    linesTotal += geometry.x.length + geometry.y.length;
    if (geometry.x.length + geometry.y.length > 512) fail("scope line budget");
    if (anchorsTotal > 256 || linesTotal > 2048) fail("tree geometry budget");
    const origin = {
      x: rect.x + (parent?.origin.x || 0),
      y: rect.y + (parent?.origin.y || 0),
    };
    const report = {
      id,
      parentId,
      rect,
      origin,
      ...checkGeometry(geometry, anchors, tolerance),
    };
    reports.push(report);
    resolved.set(id, report);
  }
  const result = {
    schemaVersion: "ag-design/layout-grid-tree-v1",
    unit,
    tolerance,
    scopes: reports,
    trust: "caller-reported-geometric-only",
  };
  return result;
}

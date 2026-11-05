import { checkLayoutGrid } from "./layout-grid-model.js";
const NS = "http://www.w3.org/2000/svg";
const UNIT_SCALE = { "css-px": 1, pt: 0.75, emu: 9525 };

/** Create fixed SVG primitives only; labels/IDs never become markup, selectors or executable text. */
function primitive(document, name, attributes) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attributes))
    node.setAttribute(key, String(value));
  return node;
}

/** Validate a bounded engine report before touching the mounted root. This is not evidence authentication. */
function validate(report) {
  const g = report?.geometry;
  if (
    !g ||
    !Number.isFinite(g.width) ||
    !Number.isFinite(g.height) ||
    g.width <= 0 ||
    g.height <= 0 ||
    g.width > 1e10 ||
    g.height > 1e10
  )
    throw new TypeError("Invalid grid report dimensions");
  for (const [values, max, keys] of [
    [g.x, 257, []],
    [g.y, 257, []],
    [g.points, 81, ["x", "y"]],
    [g.diagonals, 10, ["x1", "y1", "x2", "y2"]],
  ]) {
    if (!Array.isArray(values) || values.length > max)
      throw new TypeError("Invalid grid report budget");
    for (const item of values)
      for (const key of keys.length ? keys : [null])
        if (!Number.isFinite(key === null ? item : item[key]))
          throw new TypeError("Invalid grid report coordinates");
  }
  if (g.x.length + g.y.length > 512 || !Object.hasOwn(UNIT_SCALE, g.unit))
    throw new TypeError("Invalid grid report unit or scope budget");
  for (const [values, max, keys] of [
    [g.regions ?? [], 8, ["x", "y", "width", "height"]],
    [g.circles ?? [], 8, ["cx", "cy", "r"]],
  ]) {
    if (!Array.isArray(values) || values.length > max)
      throw new TypeError("Invalid grid guide budget");
    for (const item of values) {
      for (const key of keys)
        if (!Number.isFinite(item[key]))
          throw new TypeError("Invalid grid guide coordinates");
      if (
        (item.r ?? 1) <= 0 ||
        (item.width ?? 1) <= 0 ||
        (item.height ?? 1) <= 0
      )
        throw new TypeError("Invalid grid guide extent");
    }
  }
  if (!Array.isArray(report.results) || report.results.length > 256)
    throw new TypeError("Invalid grid report anchors");
  for (const item of report.results) {
    if (!["hit", "miss", "unknown"].includes(item.status))
      throw new TypeError("Invalid grid report status");
    for (const key of [
      "x",
      "y",
      ...(item.status === "unknown" ? [] : ["targetX", "targetY"]),
    ])
      if (item[key] !== null && !Number.isFinite(item[key]))
        throw new TypeError("Invalid anchor coordinate");
  }
}

/**
 * Paint one shared numeric report in its own carrier. The host owns a visible report equivalent.
 * No observers, layout mutations, focus targets, timers or network requests are installed.
 */
export function createLayoutGridOverlay({
  document = globalThis.document,
  report,
  markerScale = 1,
  ...input
} = {}) {
  if (
    typeof markerScale !== "number" ||
    !Number.isFinite(markerScale) ||
    markerScale < 0.001 ||
    markerScale > 4
  )
    throw new TypeError("Invalid grid marker scale");
  if (!document?.createElementNS) throw new TypeError("DOM document required");
  const element = primitive(document, "svg", {
    class: "ag-layout-grid",
    "aria-hidden": "true",
    focusable: "false",
  });
  element.style.pointerEvents = "none";
  let disposed = false,
    current = null;
  /** Replace only validated geometry while retaining the SVG root; invalid input keeps the previous report. */
  function update(next) {
    if (disposed) return;
    const measured = next.geometry ? next : checkLayoutGrid(next);
    validate(measured);
    const saved = structuredClone(measured),
      g = saved.geometry,
      content = document.createDocumentFragment();
    const markerUnit = UNIT_SCALE[g.unit] * markerScale;
    for (const region of g.regions ?? [])
      content.append(
        primitive(document, "rect", {
          x: region.x,
          y: region.y,
          width: region.width,
          height: region.height,
          class: "ag-layout-grid__region",
          "data-grid-region": region.id,
        }),
      );
    for (const circle of g.circles ?? [])
      content.append(
        primitive(document, "circle", {
          cx: circle.cx,
          cy: circle.cy,
          r: circle.r,
          class: "ag-layout-grid__curve",
          "data-grid-curve": circle.id,
        }),
      );

    for (const x of g.x)
      content.append(
        primitive(document, "line", {
          x1: x,
          y1: 0,
          x2: x,
          y2: g.height,
          class: "ag-layout-grid__guide",
        }),
      );
    for (const y of g.y)
      content.append(
        primitive(document, "line", {
          x1: 0,
          y1: y,
          x2: g.width,
          y2: y,
          class: "ag-layout-grid__guide",
        }),
      );
    for (const diagonal of g.diagonals)
      content.append(
        primitive(document, "line", {
          ...diagonal,
          class: "ag-layout-grid__diagonal",
        }),
      );
    for (const point of g.points)
      content.append(
        primitive(document, "circle", {
          cx: point.x,
          cy: point.y,
          r: markerUnit,
          class: "ag-layout-grid__point",
          "data-control-point": point.id,
        }),
      );
    for (const item of saved.results) {
      const marker = primitive(document, "g", {
        "data-anchor": item.id,
        "data-status": item.status,
      });
      if (item.status !== "unknown") {
        const tx = item.targetX ?? g.width / 2,
          ty = item.targetY ?? g.height / 2;
        if (item.kind === "x-line")
          marker.append(
            primitive(document, "line", {
              x1: tx,
              y1: 0,
              x2: tx,
              y2: g.height,
              class: "ag-layout-grid__target-line",
            }),
          );
        if (item.kind === "y-line" || item.kind === "baseline")
          marker.append(
            primitive(document, "line", {
              x1: 0,
              y1: ty,
              x2: g.width,
              y2: ty,
              class: "ag-layout-grid__target-line",
            }),
          );
        marker.append(
          primitive(document, "circle", {
            cx: tx,
            cy: ty,
            r: 3.5 * markerUnit,
            class: "ag-layout-grid__target",
          }),
        );
        if (item.x !== null && item.y !== null)
          marker.append(
            primitive(document, "line", {
              x1: item.x,
              y1: item.y,
              x2: tx,
              y2: ty,
              class: "ag-layout-grid__residual",
            }),
          );
      }
      if (item.x !== null && item.y !== null)
        marker.append(
          primitive(document, "rect", {
            x: item.x - 2.5 * markerUnit,
            y: item.y - 2.5 * markerUnit,
            width: 5 * markerUnit,
            height: 5 * markerUnit,
            class: "ag-layout-grid__anchor",
          }),
        );
      content.append(marker);
    }
    element.setAttribute("viewBox", `0 0 ${g.width} ${g.height}`);
    element.setAttribute("preserveAspectRatio", "none");
    element.dataset.profile = g.profile;
    element.replaceChildren(content);
    current = saved;
  }
  update(report === undefined ? input : report);
  return {
    element,
    update,
    get report() {
      return structuredClone(current);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      element.remove();
      element.replaceChildren();
      current = null;
    },
  };
}

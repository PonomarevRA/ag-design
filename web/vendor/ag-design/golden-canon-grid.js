import { goldenCanonGeometry, checkGoldenCanon } from "./golden-canon-model.js";
const SVG = "http://www.w3.org/2000/svg";

/** Create literal SVG primitives without HTML parsing or caller-supplied markup. */
function primitive(document, name, attributes) {
  const element = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attributes))
    element.setAttribute(key, String(value));
  return element;
}

/**
 * Create a pointer-transparent carrier overlay with explicit point-hit markers.
 * The caller owns its positioned carrier and supplies carrier-local coordinates.
 * No observers or animation loops are installed. update validates before replacing content.
 */
export function createGoldenCanonGrid({
  document = globalThis.document,
  ...initial
} = {}) {
  if (!document?.createElementNS)
    throw new TypeError("A DOM document is required");
  const element = primitive(document, "svg", {
    class: "ag-golden-canon-grid",
    "aria-hidden": "true",
    focusable: "false",
  });
  // Keep overlays safe even when a consumer forgot the optional package stylesheet.
  element.style.pointerEvents = "none";
  let disposed = false,
    report = null,
    state = {
      width: 960,
      height: 540,
      anchors: [],
      tolerance: 0.008,
      showDiagonals: true,
      provisional: false,
    };
  /** Rebuild bounded geometry only on caller activity, retaining the same SVG root and no focusable nodes. */
  function update(patch = {}) {
    if (disposed) return;
    const next = { ...state, ...patch };
    const measured = checkGoldenCanon(next),
      grid = goldenCanonGeometry(next.width, next.height);
    if (
      typeof next.provisional !== "boolean" ||
      typeof next.showDiagonals !== "boolean"
    )
      throw new TypeError("showDiagonals must be boolean");
    const content = document.createDocumentFragment();
    for (const x of grid.vertical)
      content.append(
        primitive(document, "line", {
          x1: x,
          y1: 0,
          x2: x,
          y2: grid.height,
          class: "ag-golden-canon-grid__line",
        }),
      );
    for (const y of grid.horizontal)
      content.append(
        primitive(document, "line", {
          x1: 0,
          y1: y,
          x2: grid.width,
          y2: y,
          class: "ag-golden-canon-grid__line",
        }),
      );
    if (next.showDiagonals) {
      for (const [x, y, w, h] of [
        [0, 0, grid.width, grid.height],
        [0, 0, grid.width / 2, grid.height],
        [grid.width / 2, 0, grid.width / 2, grid.height],
        [0, 0, grid.width, grid.height / 2],
        [0, grid.height / 2, grid.width, grid.height / 2],
      ]) {
        content.append(
          primitive(document, "line", {
            x1: x,
            y1: y,
            x2: x + w,
            y2: y + h,
            class: "ag-golden-canon-grid__diagonal",
          }),
        );
        content.append(
          primitive(document, "line", {
            x1: x + w,
            y1: y,
            x2: x,
            y2: y + h,
            class: "ag-golden-canon-grid__diagonal",
          }),
        );
      }
    }
    const radius = Math.min(grid.width, grid.height) * 0.0035;
    for (const point of grid.points)
      content.append(
        primitive(document, "circle", {
          cx: point.x,
          cy: point.y,
          r: radius,
          class: "ag-golden-canon-grid__point",
          "data-control-point": point.id,
        }),
      );
    for (const result of measured.results) {
      const marker = primitive(document, "g", {
        "data-anchor": result.id,
        "data-status": next.provisional ? "unknown" : result.status,
      });
      marker.append(
        primitive(document, "line", {
          x1: result.x,
          y1: result.y,
          x2: result.targetX,
          y2: result.targetY,
          class: "ag-golden-canon-grid__residual",
        }),
      );
      marker.append(
        primitive(document, "circle", {
          cx: result.targetX,
          cy: result.targetY,
          r: radius * 2.8,
          class: "ag-golden-canon-grid__target",
        }),
      );
      // A square marks the measured anchor; a circle marks its nearest control point.
      marker.append(
        primitive(document, "rect", {
          x: result.x - radius * 1.8,
          y: result.y - radius * 1.8,
          width: radius * 3.6,
          height: radius * 3.6,
          class: "ag-golden-canon-grid__anchor",
        }),
      );
      content.append(marker);
    }
    element.setAttribute("viewBox", `0 0 ${grid.width} ${grid.height}`);
    element.setAttribute("preserveAspectRatio", "none");
    element.replaceChildren(content);
    element.dataset.evidence = next.provisional ? "provisional" : "geometric";
    report = { ...measured, provisional: next.provisional };
    state = next;
  }
  update(initial);
  return {
    element,
    update,
    get report() {
      return structuredClone(report);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      element.remove();
      element.replaceChildren();
    },
  };
}

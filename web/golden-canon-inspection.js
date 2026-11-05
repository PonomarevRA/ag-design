import { createGoldenCanonGrid } from "./vendor/ag-design/golden-canon-grid.js";
import { goldenCanonRectAnchor } from "./vendor/ag-design/golden-canon-model.js";

/**
 * Own an iframe-viewport overlay. Client rectangles and the SVG share CSS coordinates;
 * outer camera zoom is never part of the measurement. A scroll makes points update with their owners.
 */
export function createGoldenCanonInspection({
  root,
  elements,
  view = root.ownerDocument.defaultView,
}) {
  const document = root.ownerDocument;
  let config = {
      enabled: false,
      selectedId: null,
      anchor: "top-left",
      tolerance: 0.008,
    },
    grid = null,
    evidence = null,
    pending = null,
    disposed = false;
  /** Paint current measured geometry; hidden and zero-size owners cannot create a point hit. */
  function refresh() {
    pending = null;
    if (disposed || !config.enabled) {
      grid?.dispose();
      grid = null;
      return;
    }
    const owner = elements.get(config.selectedId),
      anchors = [];
    let provisional = true;
    if (owner) {
      const rect = owner.getBoundingClientRect(),
        style = view.getComputedStyle(owner);
      if (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden"
      ) {
        anchors.push({
          id: config.selectedId,
          ...goldenCanonRectAnchor(rect, config.anchor),
        });
        const fact = evidence?.nodes.find(
          (item) => item.id === config.selectedId,
        );
        const sameBox =
          fact?.rect &&
          ["x", "y", "width", "height"].every(
            (key) => Math.abs(fact.rect[key] - rect[key]) <= 0.1,
          );
        provisional = !(
          evidence?.complete &&
          evidence.fontsReady &&
          fact?.visible &&
          !fact.clipped &&
          sameBox &&
          evidence.viewport.width === view.innerWidth &&
          evidence.viewport.height === view.innerHeight
        );
      }
    }
    const options = {
      width: view.innerWidth,
      height: view.innerHeight,
      anchors,
      tolerance: config.tolerance,
      provisional,
    };
    if (!grid) {
      grid = createGoldenCanonGrid({ document, ...options });
      Object.assign(grid.element.style, {
        position: "fixed",
        inset: "0",
        zIndex: "200",
        width: "100vw",
        height: "100vh",
      });
      document.body.append(grid.element);
    } else grid.update(options);
  }
  /** Coalesce pointer activity without an idle animation loop or layout mutation. */
  function schedule() {
    if (!disposed && config.enabled && pending === null)
      pending = view.requestAnimationFrame(refresh);
  }
  const controller = new view.AbortController(),
    options = { signal: controller.signal, capture: true };
  for (const event of [
    "scroll",
    "resize",
    "pointermove",
    "pointerup",
    "input",
    "change",
  ])
    view.addEventListener(event, schedule, options);
  return {
    refresh,
    /** Accept only the current iframe capture; live box changes lose hit styling until remeasured. */
    setEvidence(facts) {
      evidence = facts;
      refresh();
    },
    /** Validate before changing current inspection; messages cannot supply styles, HTML or executable content. */
    setState(next) {
      if (
        !next ||
        typeof next.enabled !== "boolean" ||
        (next.selectedId !== null &&
          (typeof next.selectedId !== "string" || next.selectedId.length > 180))
      )
        throw new TypeError("Invalid grid inspection");
      if (
        ![
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
          "center",
        ].includes(next.anchor) ||
        !Number.isFinite(next.tolerance) ||
        next.tolerance < 0 ||
        next.tolerance > 0.05
      )
        throw new TypeError("Invalid grid anchor or tolerance");
      config = {
        enabled: next.enabled,
        selectedId: next.selectedId,
        anchor: next.anchor,
        tolerance: next.tolerance,
      };
      refresh();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      controller.abort();
      if (pending !== null) view.cancelAnimationFrame(pending);
      grid?.dispose();
      grid = null;
    },
  };
}

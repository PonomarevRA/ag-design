import { createGoldenCanonGrid } from "./vendor/ag-design/golden-canon-grid.js";

/** Show one exact hit and one miss in a fixed aspect ratio; no synthetic data becomes usage evidence. */
export function buildGoldenCanonSample(props = {}) {
  const document = globalThis.document,
    element = document.createElement("div");
  element.style.cssText =
    "position:relative;width:100%;aspect-ratio:16/9;min-height:160px";
  const grid = createGoldenCanonGrid({
    document,
    width: 960,
    height: 540,
    tolerance: props.tolerance ?? 0.008,
    anchors: [
      { id: "aligned", x: 320, y: 180 },
      { id: "offset", x: 675, y: 390 },
    ],
  });
  element.append(grid.element);
  return { element, dispose: grid.dispose, interact: () => {} };
}

import { buildCompositionGridWorkshop } from "./composition-grid-workshop.js";
/** The catalog and sandbox use the same owned per-profile workshop as the wiki; no independent geometry or image inference. */
export function buildLayoutGridSample(props = {}) {
  return buildCompositionGridWorkshop({
    type: props.gridType ?? "golden-canon",
    locale: document.documentElement.lang || "ru",
  });
}

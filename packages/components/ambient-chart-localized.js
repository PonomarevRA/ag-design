import { createAmbientChart as implementation } from "./ambient-chart.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./ambient-chart.js";
/** Locale-aware public factory with the same data and lifecycle contract. */
export function createAmbientChart(options = {}) {
  return localizeComponent(implementation(options), "ambient-chart", options);
}

import { createDataGrid as implementation } from "./data-grid.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./data-grid.js";
/** Public locale-aware facade; source/user data and the implementation's state remain unchanged. */
export function createDataGrid(options = {}) {
  return localizeComponent(implementation(options), "data-grid", options);
}

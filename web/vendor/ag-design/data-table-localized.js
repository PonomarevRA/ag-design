import { createDataTable as implementation } from "./data-table.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./data-table.js";
/** Public locale-aware facade; source/user data and the implementation's state remain unchanged. */
export function createDataTable(options = {}) {
  return localizeComponent(implementation(options), "data-table", options);
}

import { createDropdownSelect as implementation } from "./dropdown-select.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./dropdown-select.js";
/** Public locale-aware facade; source/user data and the implementation's state remain unchanged. */
export function createDropdownSelect(options = {}) {
  return localizeComponent(implementation(options), "dropdown-select", options);
}

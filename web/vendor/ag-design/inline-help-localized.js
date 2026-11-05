import { createInlineHelp as implementation } from "./inline-help.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./inline-help.js";
/** Public locale-aware facade; source/user data and the implementation's state remain unchanged. */
export function createInlineHelp(options = {}) {
  return localizeComponent(implementation(options), "inline-help", options);
}

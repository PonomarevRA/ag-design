import { createProgress as implementation } from "./progress.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./progress.js";
/** Public locale-aware facade; source/user data and the implementation's state remain unchanged. */
export function createProgress(options = {}) {
  return localizeComponent(implementation(options), "progress", options);
}

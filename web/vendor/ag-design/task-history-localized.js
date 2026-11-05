import { createTaskHistory as implementation } from "./task-history.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./task-history.js";
/** Public locale-aware facade; source/user data and the implementation's state remain unchanged. */
export function createTaskHistory(options = {}) {
  return localizeComponent(implementation(options), "history", options);
}

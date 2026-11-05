import { createGitHistory as implementation } from "./git-history.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./git-history.js";
/** Public locale-aware facade; source/user data and the implementation's state remain unchanged. */
export function createGitHistory(options = {}) {
  return localizeComponent(implementation(options), "history", options);
}

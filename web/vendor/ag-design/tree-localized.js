import { createTree as implementation } from "./tree.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./tree.js";
/** Public locale-aware facade; source/user data and the implementation's state remain unchanged. */
export function createTree(options = {}) {
  return localizeComponent(implementation(options), "tree", options);
}

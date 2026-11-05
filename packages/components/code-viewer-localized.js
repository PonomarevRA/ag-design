import { createCodeViewer as implementation } from "./code-viewer.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./code-viewer.js";
/** Public locale-aware facade; source/user data and the implementation's state remain unchanged. */
export function createCodeViewer(options = {}) {
  return localizeComponent(implementation(options), "code-viewer", options);
}

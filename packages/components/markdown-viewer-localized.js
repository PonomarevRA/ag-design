import { createMarkdownViewer as implementation } from "./markdown-viewer.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./markdown-viewer.js";
/** Public locale-aware facade; source/user data and the implementation's state remain unchanged. */
export function createMarkdownViewer(options = {}) {
  return localizeComponent(implementation(options), "markdown-viewer", options);
}

import { createMarkdownEditor as implementation } from "./markdown-editor.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./markdown-editor.js";
/** Public locale-aware facade; source/user data and the implementation's state remain unchanged. */
export function createMarkdownEditor(options = {}) {
  return localizeComponent(implementation(options), "markdown-editor", options);
}

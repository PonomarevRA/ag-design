import { createSettingsPanel as implementation } from "./settings-panel.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./settings-panel.js";
/** Public locale-aware facade; source/user data and the implementation's state remain unchanged. */
export function createSettingsPanel(options = {}) {
  return localizeComponent(implementation(options), "settings-panel", options);
}

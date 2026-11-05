import { createLoadingIndicator as implementation } from "./loading-indicator.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./loading-indicator.js";
/** Locale-aware public factory with the same data and lifecycle contract. */
export function createLoadingIndicator(options = {}) {
  return localizeComponent(
    implementation(options),
    "loading-indicator",
    options,
  );
}

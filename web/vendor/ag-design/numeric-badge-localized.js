import { createNumericBadge as implementation } from "./numeric-badge.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./numeric-badge.js";
/** Preserve the original handle while localizing only its owned controls. */
export function createNumericBadge(options = {}) {
  return localizeComponent(implementation(options), "numeric-badge", {
    ...options,
  });
}

import { createBreadcrumbs as implementation } from "./breadcrumbs.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./breadcrumbs.js";
/** Locale-aware public facade; application data is retained by the original controller. */
export function createBreadcrumbs(options = {}) {
  return localizeComponent(implementation(options), "breadcrumbs", options);
}

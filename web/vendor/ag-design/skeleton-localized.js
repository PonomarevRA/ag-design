import { createSkeleton as implementation } from "./skeleton.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./skeleton.js";
/** Locale-aware public facade; application data is retained by the original controller. */
export function createSkeleton(options = {}) {
  return localizeComponent(implementation(options), "skeleton", options);
}

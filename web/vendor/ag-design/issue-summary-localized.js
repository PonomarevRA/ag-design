import { createIssueSummary as implementation } from "./issue-summary.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./issue-summary.js";
/** Locale-aware public facade; application data is retained by the original controller. */
export function createIssueSummary(options = {}) {
  return localizeComponent(implementation(options), "issue-summary", options);
}

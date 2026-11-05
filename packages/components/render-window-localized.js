import { createRenderWindow as implementation } from "./render-window.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./render-window.js";
/** Locale-aware public facade; application data is retained by the original controller. */
export function createRenderWindow(options = {}) {
  return localizeComponent(implementation(options), "render-window", options);
}

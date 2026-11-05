import { createBoardViewport as implementation } from "./board-viewport.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./board-viewport.js";
/** Preserve the original handle while localizing only its owned controls. */
export function createBoardViewport(options = {}) {
  return localizeComponent(implementation(options), "board-viewport", {
    ...options,
    localizationRoot: options.viewport,
  });
}

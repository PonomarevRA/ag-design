import { createCardConnections as implementation } from "./card-connections.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./card-connections.js";
/** Preserve the original handle while localizing only its owned controls. */
export function createCardConnections(options = {}) {
  return localizeComponent(implementation(options), "card-connections", {
    ...options,
    localizationRoot: options.container,
  });
}

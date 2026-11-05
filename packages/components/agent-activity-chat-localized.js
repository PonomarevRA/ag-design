import { createAgentActivityChat as implementation } from "./agent-activity-chat.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./agent-activity-chat.js";
/** Public locale-aware facade; source/user data and the implementation's state remain unchanged. */
export function createAgentActivityChat(options = {}) {
  return localizeComponent(
    implementation(options),
    "agent-activity-chat",
    options,
  );
}

import { createAgentConversation as implementation } from "./agent-conversation.js";
import { localizeComponent } from "./i18n-component.js";
export * from "./agent-conversation.js";
/** Public locale-aware facade; source/user data and the implementation's state remain unchanged. */
export function createAgentConversation(options = {}) {
  return localizeComponent(
    implementation(options),
    "agent-conversation",
    options,
  );
}

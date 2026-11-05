export interface ConversationCardData {
  title: string;
  summary?: string;
  status?: "ready" | "loading" | "empty" | "error";
  /** Non-ready states require a localized visible message supplied by the host. */
  message?: string;
}
export interface ConversationCardAction {
  id: string;
  label: string;
  primary?: boolean;
  onAction(intent: { actionId: string }): unknown;
}
export interface ConversationCardOptions extends ConversationCardData {
  document?: Document;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  actions?: ConversationCardAction[];
  onError?(error: unknown): unknown;
}
export interface ConversationCard {
  element: HTMLElement;
  update(patch: Partial<ConversationCardData>): boolean;
  inspect(): {
    status: string;
    disposed: boolean;
    actionCount: number;
    primaryActionCount: number;
    context: "host-owned";
    mode: "inline";
    transport: "host-owned";
  };
  dispose(): void;
}
export declare function createConversationCard(
  options: ConversationCardOptions,
): ConversationCard;
export { inspectConversationSurface } from "./conversation-surface.js";

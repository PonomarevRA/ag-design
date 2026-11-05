export interface ConversationSurfaceFacts {
  context: "chatgpt" | "web";
  mode: "inline" | "carousel" | "fullscreen" | "pip";
  actionCount?: number;
  primaryActionCount?: number;
  nestedScroll?: boolean;
  deepNavigation?: boolean;
  duplicateComposer?: boolean;
  itemCount?: number;
  allItemsHaveVisual?: boolean;
  maxActionsPerItem?: number;
  modeSupported?: boolean;
  composerOccluded?: boolean;
  closedOnSessionEnd?: boolean;
}
export declare function inspectConversationSurface(
  facts: ConversationSurfaceFacts,
): {
  context: string;
  mode: string;
  status: "pass" | "fail" | "unknown" | "not-applicable";
  checks: { id: string; status: "pass" | "fail" | "unknown" }[];
  trust: string;
  manualRequired: string[];
};

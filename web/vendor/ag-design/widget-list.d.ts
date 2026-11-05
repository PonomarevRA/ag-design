export interface WidgetListItem {
  id: string;
  title: string;
  description?: string;
  meta?: string;
  action?: { id: string; type: string; label: string } | null;
}
export interface WidgetListSnapshot {
  title: string;
  revision: number;
  items: WidgetListItem[];
}
export interface WidgetListIntent {
  itemId: string;
  revision: number;
  actionId: string;
  type: string;
}
export interface WidgetListOptions extends Omit<
  WidgetListSnapshot,
  "revision"
> {
  document?: Document;
  revision?: number;
  limit?: number;
  showMoreLabel: string;
  emptyMessage: string;
  onAction?(intent: WidgetListIntent): unknown;
  onError?(error: unknown): unknown;
}
export interface WidgetList {
  element: HTMLElement;
  update(snapshot: WidgetListSnapshot): boolean;
  setPending(
    value:
      | { scope: "self"; itemId: string; message: string }
      | { scope: "container"; message: string }
      | { scope: "none"; message?: string },
  ): boolean;
  inspect(): {
    schema: "ag-design/widget-list-v1";
    revision: number;
    total: number;
    visible: number;
    mounted: number;
    pendingScope: string;
    disposed: boolean;
    transport: "host-owned";
  };
  dispose(): void;
}
export declare function createWidgetList(
  options: WidgetListOptions,
): WidgetList;

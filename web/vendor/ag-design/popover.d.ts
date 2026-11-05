import type { I18nContext } from "./i18n.js";
export interface PopoverOptions {
  document?: Document;
  i18n?: I18nContext;
  label: string;
  title?: string;
  content: HTMLElement;
  width?: number;
  maxHeight?: number;
  align?: "start" | "end";
  density?: "compact" | "comfortable" | "touch";
  onOpenChange?: (
    opened: boolean,
    detail: { reason: string },
  ) => void | Promise<void>;
  onError?: (error: unknown) => void;
}
export interface PopoverController {
  readonly element: HTMLElement;
  readonly trigger: HTMLButtonElement;
  readonly panel: HTMLElement;
  readonly content: HTMLElement;
  readonly state: { opened: boolean; disposed: boolean; disabled: boolean };
  open(): boolean;
  close(options?: { restoreFocus?: boolean }): boolean;
  setDisabled(value: boolean): boolean;
  dispose(): void;
}
export function createPopover(options: PopoverOptions): PopoverController;

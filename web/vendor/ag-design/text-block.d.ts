import type { I18nContext } from "./i18n.js";
export interface TextBlockOptions {
  document?: Document;
  i18n?: I18nContext;
  label: string;
  text?: string;
  /** Display a quiet copy icon below the block; no clipboard access during rendering. */
  copyable?: boolean;
}
export interface TextBlockController {
  readonly element: HTMLElement;
  readonly content: HTMLElement;
  readonly value: string;
  setText(text: string): void;
  selectAll(): boolean;
  copy(): Promise<boolean>;
  dispose(): void;
}
/** Plain reading surface; first Ctrl/Cmd+A selects its text, quick second selects the page. */
export function createTextBlock(options: TextBlockOptions): TextBlockController;

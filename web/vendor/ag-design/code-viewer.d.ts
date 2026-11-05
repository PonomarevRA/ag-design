import type {I18nContext} from "./i18n.js";
export type CodeChangeOrigin = "input" | "api" | "undo" | "redo";
export interface CodeViewerAppearance {
  label?: string;
  filename?: string;
  readOnly?: boolean;
  lineNumbers?: boolean;
  wrap?: boolean;
  /** Fixed scroll viewport in CSS pixels, 120–1600. Typography remains inherited. */
  height?: number;
  /** Compact icons by default in both readonly and editable modes; labeled keeps visible captions. */
  toolbarMode?: "compact" | "labeled";
  /** Pointer tooltip delay,0..5000ms; default250. Keyboard focus remains immediate. */
  tooltipDelayMs?: number;
}
export interface CodeViewerOptions extends CodeViewerAppearance {
  document?: Document;
  i18n?:I18nContext;
  locale?:string;
  code?: string;
  /** Local aliases are supported; unknown hints display as plaintext. No remote grammar loading. */
  language?: string;
  onChange?: (
    change: Readonly<{ code: string; origin: CodeChangeOrigin }>,
  ) => void;
}
export interface CodeViewerController {
  readonly element: HTMLElement;
  /** Preserves the literal supplied value until an actual edit; homogeneous line endings survive edits. */
  readonly value: string;
  /** Default silent replacement resets history. Await whenIdle before addToHistory:true. */
  setCode(
    code: string,
    options?: { addToHistory?: boolean; emitChange?: boolean },
  ): void;
  setLanguage(language: string): void;
  setOptions(options: CodeViewerAppearance): void;
  focus(): void;
  undo(): boolean;
  redo(): boolean;
  selectAll(): boolean;
  find(): boolean;
  /** Copy current selection, or all source. False leaves a visible manual-copy fallback. */
  copy(): Promise<boolean>;
  /** Lazy engine initialization plus an owned measurement checkpoint; not full parsing/GPU completion. */
  whenIdle(): Promise<void>;
  /** Idempotent; releases owned source/callbacks. Retained value becomes an empty string. */
  dispose(): void;
}
export declare function createCodeViewer(
  options?: CodeViewerOptions,
): CodeViewerController;

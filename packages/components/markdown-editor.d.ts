import type {I18nContext} from "./i18n.js";
import type { CodeChangeOrigin, CodeViewerController } from "./code-viewer.js";
import type {
  MarkdownLink,
  MarkdownViewerController,
} from "./markdown-viewer.js";
export interface MarkdownEditorOptions {
  document?: Document;
  i18n?:I18nContext;
  locale?:string;
  markdown?: string;
  label?: string;
  mode?: "edit" | "split" | "preview";
  height?: number;
  toolbarMode?: "compact" | "labeled";
  tooltipDelayMs?: number;
  previewDelay?: number;
  onChange?: (
    change: Readonly<{ markdown: string; origin: CodeChangeOrigin }>,
  ) => void;
  onSave?: (
    change: Readonly<{ markdown: string }>,
  ) => void | boolean | string | Promise<void | boolean | string>;
  onLink?: (link: MarkdownLink) => void | Promise<void>;
}
export interface MarkdownEditorController {
  readonly element: HTMLElement;
  readonly source: CodeViewerController;
  readonly preview: MarkdownViewerController;
  readonly value: string;
  readonly dirty: boolean;
  readonly mode: "edit" | "split" | "preview";
  setMarkdown(
    markdown: string,
    options?: { addToHistory?: boolean; markSaved?: boolean },
  ): void;
  setMode(mode: "edit" | "split" | "preview"): void;
  undo(): boolean;
  redo(): boolean;
  save(): Promise<boolean>;
  loadFile(
    file: {
      readonly name?: string;
      readonly size: number;
      text(): Promise<string>;
    },
    options?: { replaceDirty?: boolean },
  ): Promise<boolean>;
  download(filename?: string): boolean;
  whenIdle(): Promise<void>;
  dispose(): void;
}
export declare function createMarkdownEditor(
  options?: MarkdownEditorOptions,
): MarkdownEditorController;

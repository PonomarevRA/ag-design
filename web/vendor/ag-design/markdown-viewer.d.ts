import type {I18nContext} from "./i18n.js";
import type { CodeViewerController } from "./code-viewer.js";
export interface MarkdownLink {
  readonly href: string;
  readonly text: string;
}
export interface MarkdownViewerOptions {
  document?: Document;
  i18n?:I18nContext;
  locale?:string;
  markdown?: string;
  label?: string;
  mode?: "rendered" | "source";
  height?: number;
  toolbarMode?: "compact" | "labeled";
  tooltipDelayMs?: number;
  onLink?: (link: MarkdownLink) => void | Promise<void>;
}
export interface MarkdownViewerController {
  readonly element: HTMLElement;
  readonly value: string;
  readonly mode: "rendered" | "source";
  readonly source: CodeViewerController | null;
  setMarkdown(markdown: string): void;
  setMode(mode: "rendered" | "source"): void;
  whenIdle(): Promise<void>;
  dispose(): void;
}
export declare function createMarkdownViewer(
  options?: MarkdownViewerOptions,
): MarkdownViewerController;

import type { I18nContext } from "./i18n.js";
import type { PaletteOptions, PaletteResult } from "./palette-model.js";
export interface PaletteBuilderOptions extends Partial<PaletteOptions> {
  document?: Document;
  i18n?: I18nContext;
}
export interface PaletteBuilder {
  readonly element: HTMLElement;
  readonly result: PaletteResult;
  update(options: Partial<PaletteOptions>): void;
  dispose(): void;
}
/** Linked hue handles support drag and keyboard rotation; dispose releases capture/listeners/queued frames. */
export function createPaletteBuilder(
  options?: PaletteBuilderOptions,
): PaletteBuilder;

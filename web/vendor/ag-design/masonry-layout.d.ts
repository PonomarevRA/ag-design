export interface MasonryLayoutOptions {
  /** Minimum auto-column width in CSS pixels; shrinks to fit a narrow container. Default 280. */
  minColumnWidth?: number;
  /** Auto-fill the available width, or use 1–24 equal columns. Default 'auto'. */
  columns?: "auto" | number;
  /** Equal row/column gap in CSS pixels, 0–10000. Default 16. */
  gap?: number;
  /** Row quantization in CSS pixels, 1–10000. Default 4. */
  rowHeight?: number;
}
export interface MasonryLayoutController {
  element: HTMLElement;
  /** Schedule one layout frame; also use when observers are unavailable. */
  refresh(): void;
  /** Validate the entire patch before modifying geometry; preserves DOM and focus. */
  update(options?: MasonryLayoutOptions): void;
  /** Binding restores styles. Factory additionally removes its root. Idempotent. */
  dispose(): void;
}
export function bindMasonryLayout(
  element: HTMLElement,
  options?: MasonryLayoutOptions,
): MasonryLayoutController;
export function createMasonryLayout(
  options?: MasonryLayoutOptions & {
    document?: Document;
    items?: HTMLElement[];
  },
): MasonryLayoutController;

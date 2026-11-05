export interface BentoItem {
  id: string;
  content: HTMLElement;
  /** Requested columns1..12, clamped to the available grid. Default1. */
  colSpan?: number;
  /** Requested rows1..6; becomes1 in a single-column container. Default1. */
  rowSpan?: number;
}
export interface BentoGridOptions {
  document?: Document;
  /** Required host-localized accessible group name. */
  label: string;
  items?: BentoItem[];
  /** Maximum columns1..12. Default4. */
  columns?: number;
  /** Preferred minimum column width80..1600 CSSpx. Default200; one column can shrink further. */
  minColumnWidth?: number;
  /** Gap0..64 CSSpx; AG default16. */
  gap?: number;
  /** Desktop minimum row height0..800 CSSpx; natural height in one column. Default140. */
  rowMinHeight?: number;
  /** stretch fills the allocated row span; start keeps cards at natural height. Default stretch. */
  alignItems?: "start" | "stretch";
}
export interface BentoGridController {
  element: HTMLElement;
  update(options?: Partial<Omit<BentoGridOptions, "document">>): boolean;
  /** Recompute after host layout changes if ResizeObserver is unavailable. */
  refresh(): void;
  getLayout(): {
    disposed: boolean;
    columns: number;
    width: number;
    gap: number;
    alignItems: "start" | "stretch";
    stale: boolean;
    items: Array<{
      id: string;
      colSpan: number;
      rowSpan: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
  };
  dispose(): void;
}
export function createBentoGrid(options: BentoGridOptions): BentoGridController;

import type { LayoutGridSpec, GridReport } from "./layout-grid.js";
export type GridIconSymbol = "play" | "focus" | "image" | "compass";
export type GridIconPrimitive =
  | { kind: "circle"; cx: number; cy: number; r: number; fill?: boolean }
  | {
      kind: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      fill?: boolean;
    }
  | { kind: "polyline" | "polygon"; points: number[][]; fill?: boolean };
export interface GridIconDraft {
  schemaVersion: string;
  symbol: GridIconSymbol;
  purpose: "ui" | "illustrative";
  label: string;
  viewBox: { x: number; y: number; width: number; height: number };
  strokeWidth: number;
  primitives: GridIconPrimitive[];
  svg: string;
  visibleBounds: { x: number; y: number; width: number; height: number };
  padding: number;
  withinLiveArea: boolean;
  report: GridReport;
  constraints: Record<string, string>;
  warnings: string[];
}
export declare const GRID_ICON_SYMBOLS: readonly GridIconSymbol[];
/** Original bounded starter symbols; system icons use keylines/spacing. SVG uses currentColor and literal escaped title. */
export declare function createGridIconDraft(options?: {
  symbol?: GridIconSymbol;
  purpose?: "ui" | "illustrative";
  grid?: LayoutGridSpec;
  label?: string;
  strokeWidth?: number;
}): GridIconDraft;

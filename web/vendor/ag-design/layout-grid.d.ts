export type LayoutGridType =
  | "golden-canon"
  | "columns"
  | "modular"
  | "baseline"
  | "spacing"
  | "thirds"
  | "manuscript"
  | "edge-balance"
  | "lead-room"
  | "center-perspective"
  | "phi-grid"
  | "golden-triangle"
  | "diagonal-flow"
  | "icon-keylines";
export type GridUnit = "css-px" | "pt" | "emu";
export interface LayoutGridSpec {
  type: LayoutGridType;
  columns?: number;
  rows?: number;
  margin?: number;
  gutter?: number;
  step?: number;
  offset?: number;
  edge?: "left" | "right" | "top" | "bottom";
  insetRatio?: number;
  focusRatio?: number;
  eyeLevel?: number;
  vanishX?: number;
  vanishY?: number;
  flipX?: boolean;
  flipY?: boolean;
}
export interface GridAnchor {
  id: string;
  ownerId?: string;
  x?: number;
  y?: number;
  kind?: "point" | "x-line" | "y-line" | "baseline" | "guide";
  unknownReason?: string;
  baselineSource?: "renderer-baseline" | "native-text-engine";
}
export interface GridRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface GridScope {
  id: string;
  parentId?: string | null;
  rect: GridRect;
  grid: LayoutGridSpec;
  anchors?: GridAnchor[];
  inheritAxes?: "x" | "y" | "both";
}
export interface GridGeometry {
  schemaVersion: string;
  profile: string;
  localProfile?: string;
  width: number;
  height: number;
  unit: GridUnit;
  config: LayoutGridSpec;
  x: number[];
  y: number[];
  points: { id: string; x: number; y: number }[];
  diagonals: { x1: number; y1: number; x2: number; y2: number }[];
  regions: ({ id: string } & GridRect)[];
  circles?: { id: string; cx: number; cy: number; r: number }[];
  defaultKind: string;
  axisSources?: Record<"x" | "y", { scopeId: string; profile: string }>;
  inheritance?: { scopeId: string; axes: string; method: string };
}
export interface GridResult {
  id: string;
  ownerId?: string;
  kind: string;
  x: number | null;
  y: number | null;
  status: "hit" | "miss" | "unknown";
  reason?: string;
  target?: string;
  targetX?: number | null;
  targetY?: number | null;
  dx?: number | null;
  dy?: number | null;
  distance?: number;
  normalizedDistance?: number;
  baselineSource?: string;
}
export interface GridReport {
  schemaVersion: string;
  geometry: GridGeometry;
  unit: GridUnit;
  tolerance: number;
  threshold: number;
  results: GridResult[];
  coverage: {
    measured: number;
    hit: number;
    miss: number;
    unknown: number;
    total: number;
  };
  status: "measured" | "unknown";
  trust: string;
}
export interface GridTreeReport {
  schemaVersion: string;
  unit: GridUnit;
  tolerance: number;
  scopes: (GridReport & {
    id: string;
    parentId: string | null;
    rect: GridRect;
    origin: { x: number; y: number };
  })[];
  trust: string;
}
export declare const LAYOUT_GRID_VERSION: string;
export declare const LAYOUT_GRID_TYPES: readonly LayoutGridType[];
export declare function layoutGridGeometry(input: {
  width: number;
  height: number;
  unit?: GridUnit;
  grid?: LayoutGridSpec;
}): GridGeometry;
export declare function checkLayoutGrid(input: {
  width: number;
  height: number;
  unit?: GridUnit;
  grid?: LayoutGridSpec;
  anchors?: GridAnchor[];
  tolerance?: number;
}): GridReport;
export declare function checkLayoutGridTree(input: {
  unit?: GridUnit;
  tolerance?: number;
  scopes: GridScope[];
}): GridTreeReport;
export declare function createLayoutGridOverlay(
  input:
    | { document?: Document; report: GridReport; markerScale?: number }
    | {
        document?: Document;
        markerScale?: number;
        width: number;
        height: number;
        unit?: GridUnit;
        grid?: LayoutGridSpec;
        anchors?: GridAnchor[];
        tolerance?: number;
      },
): {
  element: SVGSVGElement;
  update(
    input:
      | GridReport
      | {
          width: number;
          height: number;
          unit?: GridUnit;
          grid?: LayoutGridSpec;
          anchors?: GridAnchor[];
          tolerance?: number;
        },
  ): void;
  readonly report: GridReport | null;
  dispose(): void;
};

export type PaletteHarmony =
  | "monochromatic"
  | "analogous"
  | "complementary"
  | "split-complementary"
  | "triadic"
  | "tetradic"
  | "square";
export interface PaletteOptions {
  baseColor: string;
  space?: "oklch" | "hsl";
  harmonies?: readonly PaletteHarmony[];
  background?: string;
  foreground?: string;
  fontSize?: number;
  fontWeight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  role?: "body" | "label" | "large";
}
export interface PalettePairCheck {
  wcag: { ratio: number; minimum: number; aa: boolean; largeText: boolean };
  apca: {
    lc: number;
    target: number;
    meetsAdvisoryTarget: boolean;
    minimumReferenceFontPx: number;
  };
  weightedScore: number;
  verdict: string;
}
export interface PaletteSwatch {
  id: string;
  hex: string;
  offsetDeg: number;
  gamutMapped: boolean;
  mappedChroma: number | null;
  asText: PalettePairCheck;
  asFill: PalettePairCheck;
  suggestedInk: { color: string; checks: PalettePairCheck };
  nonTextOnSurface: { ratio: number; minimum: 3; pass: boolean };
}
export interface PaletteScheme {
  id: PaletteHarmony;
  colors: PaletteSwatch[];
  uniqueColors: number;
  degenerate: boolean;
  pairMatrix: {
    rows: "foreground";
    columns: "background";
    wcagRatios: number[][];
    apcaLc: number[][];
  };
}
export interface PaletteResult {
  policyVersion: "ag-palette-v1";
  baseColor: string;
  colorSpace: "oklch" | "hsl";
  hueDefined: boolean;
  baseHue: number | null;
  context: {
    background: string;
    foreground: string;
    fontSize: number;
    fontWeight: number;
    role: string;
  };
  contrastPolicy: {
    apcaWeight: number;
    wcagWeight: number;
    apcaVersion: string;
    status: string;
  };
  schemes: PaletteScheme[];
  tonalScaleColorSpace: "oklch";
  fontGuidance: string;
  tonalScale: Array<{
    lightness: number;
    hex: string;
    gamutMapped: boolean;
    mappedChroma: number;
  }>;
  hostProfileChanged: false;
  assessment: string;
  limitations: string[];
}
export const PALETTE_HARMONIES: readonly PaletteHarmony[];
export function generatePalette(options: PaletteOptions): PaletteResult;

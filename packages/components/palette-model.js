import { evaluateColorPair, contrastPolicy } from "./color-profile.js";
import {
  parsePaletteHex,
  hexOklch,
  hexHsl,
  mapOklch,
  mapHsl,
  paletteRatio,
  hueWrap,
} from "./palette-color.js";

export const PALETTE_HARMONIES = Object.freeze([
  "monochromatic",
  "analogous",
  "complementary",
  "split-complementary",
  "triadic",
  "tetradic",
  "square",
]);
const offsets = {
  monochromatic: [0, 0, 0, 0, 0],
  analogous: [0, -30, 30],
  complementary: [0, 180],
  "split-complementary": [0, 150, 210],
  triadic: [0, 120, 240],
  tetradic: [0, 60, 180, 240],
  square: [0, 90, 180, 270],
};
const allowed = new Set([
  "baseColor",
  "space",
  "harmonies",
  "background",
  "foreground",
  "fontSize",
  "fontWeight",
  "role",
]);
/** Strict bounded authoring input; palette generation never accepts executable CSS, alpha or host writes. */
function validate(options) {
  if (
    !options ||
    typeof options !== "object" ||
    Array.isArray(options) ||
    Object.keys(options).some((key) => !allowed.has(key))
  )
    throw new TypeError("Invalid palette options");
  const {
    baseColor,
    space = "oklch",
    harmonies = PALETTE_HARMONIES,
    background = "#ffffff",
    foreground = "#202126",
    fontSize = 16,
    fontWeight = 400,
    role = "body",
  } = options;
  for (const color of [baseColor, background, foreground])
    parsePaletteHex(color);
  if (
    !["oklch", "hsl"].includes(space) ||
    !Array.isArray(harmonies) ||
    harmonies.length < 1 ||
    harmonies.length > 7 ||
    new Set(harmonies).size !== harmonies.length ||
    harmonies.some((id) => !PALETTE_HARMONIES.includes(id))
  )
    throw new TypeError("Invalid palette harmonies or color space");
  // Reuse the existing authoritative typography validation and policy.
  evaluateColorPair({ foreground, background, fontSize, fontWeight, role });
  return {
    baseColor: baseColor.toLowerCase(),
    space,
    harmonies: [...harmonies],
    background: background.toLowerCase(),
    foreground: foreground.toLowerCase(),
    fontSize,
    fontWeight,
    role,
  };
}
/** Compact exact contrast projection; keep AA as a separate gate and preserve signed APCA Lc and font guidance. */
function pair(foreground, background, context) {
  const result = evaluateColorPair({
    foreground,
    background,
    fontSize: context.fontSize,
    fontWeight: context.fontWeight,
    role: context.role,
  });
  return {
    wcag: result.wcag2,
    apca: {
      lc: result.apca.lc,
      target: result.apca.target,
      meetsAdvisoryTarget: result.apca.meetsAdvisoryTarget,
      minimumReferenceFontPx: result.apca.minimumReferenceFontPx,
    },
    weightedScore: result.weightedScore,
    verdict: result.verdict,
  };
}
/** Suggest black or white ink for this exact fill; AA gate has precedence over advisory rank. */
function inkFor(hex, context) {
  const candidates = ["#000000", "#ffffff"].map((color) => ({
    color,
    checks: pair(color, hex, context),
  }));
  candidates.sort(
    (a, b) =>
      Number(b.checks.wcag.aa) - Number(a.checks.wcag.aa) ||
      b.checks.weightedScore - a.checks.weightedScore,
  );
  return candidates[0];
}
/** Generate harmony candidates and actual-context checks without applying a theme or changing semantic role tokens. */
export function generatePalette(options) {
  const context = validate(options),
    point =
      context.space === "oklch"
        ? hexOklch(context.baseColor)
        : hexHsl(context.baseColor);
  const map = context.space === "oklch" ? mapOklch : mapHsl;
  function swatch(hex, id, offset = 0, metadata = {}) {
    const ratio = paletteRatio(hex, context.background);
    return {
      id,
      hex,
      offsetDeg: offset,
      ...metadata,
      asText: pair(hex, context.background, context),
      asFill: pair(context.foreground, hex, context),
      suggestedInk: inkFor(hex, context),
      nonTextOnSurface: {
        ratio: Number(ratio.toFixed(4)),
        minimum: 3,
        pass: ratio >= 3,
      },
    };
  }
  const schemes = [];
  for (const id of context.harmonies) {
    const colors = [];
    for (let index = 0; index < offsets[id].length; index++) {
      const offset = offsets[id][index];
      let L = point.L,
        C = point.C;
      if (id === "monochromatic" && index > 0) {
        L = [point.L, 0.2, 0.4, 0.7, 0.9][index];
        C *= 0.7;
      }
      const mapped =
        index === 0
          ? {
              hex: context.baseColor,
              gamutMapped: false,
              mappedChroma:
                context.space === "oklch" ? Number(C.toFixed(6)) : null,
            }
          : map({
              L,
              C,
              h: point.h === null ? null : hueWrap(point.h + offset),
            });
      colors.push(
        swatch(mapped.hex, `color-${index}`, offset, {
          gamutMapped: mapped.gamutMapped,
          mappedChroma: mapped.mappedChroma,
        }),
      );
    }
    // Matrices summarize pairs, not an assertion that every color must contrast with every other.
    const wcagRatios = [],
      apcaLc = [];
    for (const front of colors) {
      const ratios = [],
        lcs = [];
      for (const back of colors) {
        ratios.push(Number(paletteRatio(front.hex, back.hex).toFixed(4)));
        lcs.push(pair(front.hex, back.hex, context).apca.lc);
      }
      wcagRatios.push(ratios);
      apcaLc.push(lcs);
    }
    schemes.push({
      id,
      colors,
      uniqueColors: new Set(colors.map((color) => color.hex)).size,
      degenerate: point.h === null && id !== "monochromatic",
      pairMatrix: {
        rows: "foreground",
        columns: "background",
        wcagRatios,
        apcaLc,
      },
    });
  }
  const tonalPoint = hexOklch(context.baseColor),
    tonalScale = [];
  for (const L of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) {
    const mapped = mapOklch({ ...tonalPoint, L });
    tonalScale.push({ lightness: L, ...mapped });
  }
  return {
    policyVersion: "ag-palette-v1",
    baseColor: context.baseColor,
    colorSpace: context.space,
    hueDefined: point.h !== null,
    baseHue: point.h,
    context: {
      background: context.background,
      foreground: context.foreground,
      fontSize: context.fontSize,
      fontWeight: context.fontWeight,
      role: context.role,
    },
    contrastPolicy,
    schemes,
    tonalScale,
    tonalScaleColorSpace: "oklch",
    fontGuidance:
      "Reference Barlow.999=prohibited,777=non-text,666=spot only,5xx/4xx=restricted. Check real font; APCA beta is advisory.",
    hostProfileChanged: false,
    assessment:
      "candidates-only; contrast checks apply only to the named pairs and supplied typography",
    limitations: [
      "Hue harmony is an authored heuristic, not an accessibility standard or a universal aesthetic score.",
      "OKLCH and HSL rotations differ; neither implements a pigment RYB wheel or Material HCT.",
      "sRGB mapping uses bounded chroma reduction, not CSS LocalMINDE; check emitted hex after rounding.",
      "Keep host semantic roles and palettes; do not assign danger/success/warning from wheel positions.",
      "Non-text3:1 is a numeric adjacent-surface check only; check all actual adjacent colors/states and do not convey meaning by color alone.",
      "APCA beta is advisory; AA failure cannot be offset by a score. Full AT/native/WCAG, CVD distinctness and CMYK print remain unverified.",
    ],
  };
}

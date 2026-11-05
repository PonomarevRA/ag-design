import { APCAcontrast, sRGBtoY, fontLookupAPCA } from "./apca.js";

export const contrastPolicy = Object.freeze({
  apcaWeight: 0.7,
  wcagWeight: 0.3,
  apcaVersion: "apca-w3@0.1.9",
  status: "APCA beta, advisory; WCAG2 AA is a separate gate",
});
const roles = [
  "accent",
  "onAccent",
  "surface",
  "surfaceAlt",
  "text",
  "muted",
  "border",
  "danger",
  "success",
];
const cssRoles = { onAccent: "on-accent", surfaceAlt: "surface-alt" };

/** Apply a complete opaque sRGB profile to one scope; malformed profiles cannot partially change the UI. */
export function applyColorProfile(
  element,
  profile,
  theme = "light",
  contrast = "standard",
) {
  if (!["standard", "increased"].includes(contrast))
    throw new TypeError("Unknown contrast appearance");
  const tokens =
    contrast === "increased"
      ? profile?.highContrast?.[theme]
      : profile?.[theme];
  if (
    !["light", "dark"].includes(theme) ||
    !tokens ||
    roles.some((role) => !/^#[0-9a-f]{6}$/i.test(tokens[role]))
  )
    throw new TypeError("Complete light/dark sRGB profile required");
  const previous = new Map();
  for (const role of roles) {
    const name = `--ag-${cssRoles[role] || role}`;
    previous.set(name, element.style.getPropertyValue(name));
    element.style.setProperty(name, tokens[role]);
  }
  return () => {
    for (const [name, value] of previous) {
      if (value) element.style.setProperty(name, value);
      else element.style.removeProperty(name);
    }
  };
}

/** Evaluate opaque web text in its actual polarity and typography; this is not a complete accessibility certificate. */
export function evaluateColorPair({
  foreground,
  background,
  fontSize = 16,
  fontWeight = 400,
  role = "body",
}) {
  if (
    ![foreground, background].every(
      (value) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value),
    )
  )
    throw new TypeError("Opaque #RRGGBB colors required");
  if (
    !Number.isFinite(fontSize) ||
    fontSize < 8 ||
    fontSize > 120 ||
    !Number.isInteger(fontWeight) ||
    fontWeight < 100 ||
    fontWeight > 900 ||
    fontWeight % 100 ||
    !["body", "label", "large"].includes(role)
  )
    throw new TypeError("Invalid typography");
  const rgb = (color) =>
    [1, 3, 5].map((index) => parseInt(color.slice(index, index + 2), 16));
  const front = rgb(foreground),
    back = rgb(background);
  const luminance = (channels) =>
    channels
      .map((v) => v / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((sum, v, index) => sum + v * [0.2126, 0.7152, 0.0722][index], 0);
  const a = luminance(front),
    b = luminance(back),
    ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const large = fontSize >= 24 || (fontSize >= 18.6666667 && fontWeight >= 700);
  const minimum = large ? 3 : 4.5;
  const lc = APCAcontrast(sRGBtoY(front), sRGBtoY(back));
  const table = fontLookupAPCA(lc, 2),
    minimumReferenceSize = table[fontWeight / 100];
  const target = role === "body" ? 90 : role === "large" ? 60 : 75;
  const apcaScore = Math.min(100, (Math.abs(lc) / target) * 100),
    wcagScore = Math.min(100, (ratio / minimum) * 100);
  const weighted = Math.round(apcaScore * 0.7 + wcagScore * 0.3);
  const apcaMeetsTarget = Math.abs(lc) >= target;
  return {
    foreground,
    background,
    fontSize,
    fontWeight,
    role,
    policy: contrastPolicy,
    wcag2: {
      ratio: Number(ratio.toFixed(4)),
      minimum,
      aa: ratio >= minimum,
      largeText: large,
    },
    apca: {
      lc: Number(lc.toFixed(2)),
      target,
      meetsAdvisoryTarget: apcaMeetsTarget,
      minimumReferenceFontPx: minimumReferenceSize,
      fontGuidance:
        "Reference Barlow. 999=prohibited,777=non-text,666=spot only,5xx/4xx=restricted. Check real font; beta guidance.",
      fontTable: table,
    },
    weightedScore: weighted,
    verdict:
      ratio < minimum
        ? "wcag-fail"
        : apcaMeetsTarget
          ? "contrast-targets-met"
          : "review-apca",
    limitations: [
      "Text/background polarity is significant.",
      "Web content on self-illuminated displays only.",
      "Does not certify WCAG, APCA, HIG or a complete interface.",
    ],
  };
}

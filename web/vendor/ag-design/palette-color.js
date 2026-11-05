/** Opaque sRGB / Oklab math after Björn Ottosson and CSS Color4; no profile or DOM mutation. */
export function parsePaletteHex(value) {
  if (typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value))
    throw new TypeError("Use opaque #RRGGBB colors");
  return [1, 3, 5].map(
    (index) => parseInt(value.slice(index, index + 2), 16) / 255,
  );
}
export const hueWrap = (value) => ((value % 360) + 360) % 360;
const linear = (value) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
const encoded = (value) =>
  value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
/** Relative luminance uses unrounded channels; gates must not compare rounded display ratios. */
export function paletteRatio(a, b) {
  const luminance = (rgb) =>
    rgb
      .map(linear)
      .reduce(
        (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
        0,
      );
  const x = luminance(parsePaletteHex(a)),
    y = luminance(parsePaletteHex(b));
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function rgbHex(rgb) {
  return (
    "#" +
    rgb
      .map((value) =>
        Math.round(Math.max(0, Math.min(1, value)) * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
/** Convert sRGB into polar Oklab; neutral hue is intentionally undefined. */
export function hexOklch(hex) {
  const [r, g, b] = parsePaletteHex(hex).map(linear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const q = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(a, q);
  return {
    L,
    C,
    h: C < 0.0001 ? null : hueWrap((Math.atan2(q, a) * 180) / Math.PI),
  };
}
/** Return raw linear sRGB for an OKLCH point so gamut checking precedes encoding/clipping. */
function oklchLinear({ L, C, h }) {
  const radians = ((h ?? 0) * Math.PI) / 180,
    a = C * Math.cos(radians),
    b = C * Math.sin(radians);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
/** AG chroma-reduction mapping, not CSS LocalMINDE: retain requested L/h while reducing C into sRGB. */
export function mapOklch(point) {
  const inGamut = (rgb) =>
    rgb.every((value) => value >= -1e-7 && value <= 1 + 1e-7);
  let C = point.h === null ? 0 : point.C,
    raw = oklchLinear({ ...point, C }),
    mapped = false;
  if (!inGamut(raw)) {
    let low = 0,
      high = C;
    for (let index = 0; index < 24; index++) {
      const middle = (low + high) / 2;
      if (inGamut(oklchLinear({ ...point, C: middle }))) low = middle;
      else high = middle;
    }
    C = low;
    raw = oklchLinear({ ...point, C });
    mapped = true;
  }
  return {
    hex: rgbHex(raw.map(encoded)),
    gamutMapped: mapped,
    mappedChroma: Number(C.toFixed(6)),
  };
}
/** HSL is the familiar RGB-derived wheel; its hue angles are not OKLCH or a pigment RYB wheel. */
export function hexHsl(hex) {
  const [r, g, b] = parsePaletteHex(hex),
    max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    delta = max - min,
    L = (max + min) / 2;
  let h = null;
  if (delta > 0) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
    h = hueWrap(h);
  }
  return { L, C: delta === 0 ? 0 : delta / (1 - Math.abs(2 * L - 1)), h };
}
export function mapHsl({ L, C, h }) {
  const chroma = (1 - Math.abs(2 * L - 1)) * C,
    k = hueWrap(h ?? 0) / 60,
    x = chroma * (1 - Math.abs((k % 2) - 1)),
    m = L - chroma / 2;
  const rgb =
    k < 1
      ? [chroma, x, 0]
      : k < 2
        ? [x, chroma, 0]
        : k < 3
          ? [0, chroma, x]
          : k < 4
            ? [0, x, chroma]
            : k < 5
              ? [x, 0, chroma]
              : [chroma, 0, x];
  return {
    hex: rgbHex(rgb.map((value) => value + m)),
    gamutMapped: false,
    mappedChroma: null,
  };
}

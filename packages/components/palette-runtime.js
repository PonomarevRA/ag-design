var AGPalette = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/components/palette-model.js
  var palette_model_exports = {};
  __export(palette_model_exports, {
    PALETTE_HARMONIES: () => PALETTE_HARMONIES,
    generatePalette: () => generatePalette
  });

  // packages/components/apca.js
  /** @preserve
  /////    CoLoR PaRsLeY  a simple set of color parsing thingies!
  /////           Beta 0.1.8   Revision date: June 04, 2022
  /////
  /////    Functions to parse color values and return array
  /////    Copyright (c) 2019-2022 by Andrew Somers. All Rights Reserved.
  /////    LICENSE: AGPL 3
  /////    CONTACT: Please use the ISSUES or DISCUSSIONS tab at:
  /////    https://github.com/Myndex/colorparsley/
  /////
  ///////////////////////////////////////////////////////////////////////////////
  /////
  /////    IMPORT:
  /////    import { colorParsley } from 'colorparsley';
  /////
  /////    let rgbaArray = colorParsley('#abcdef');
  /////
  /////    Output as array:  [r,g,b,a,isValid,colorspace]
  /////    Example: [123,123,123,1.0,true,'sRGB']
  // */
  /** @preserve
  /////    SAPC APCA - Advanced Perceptual Contrast Algorithm
  /////           Beta 0.1.9 W3 • contrast function only
  /////           DIST: W3 • Revision date: July 3, 2022
  /////    Function to parse color values and determine Lc contrast
  /////    Copyright © 2019-2022 by Andrew Somers. All Rights Reserved.
  /////    LICENSE: W3 LICENSE
  /////    CONTACT: Please use the ISSUES or DISCUSSIONS tab at:
  /////    https://github.com/Myndex/SAPC-APCA/
  /////
  ///////////////////////////////////////////////////////////////////////////////
  /////
  /////    MINIMAL IMPORTS:
  /////      import { APCAcontrast, sRGBtoY, displayP3toY,
  /////               calcAPCA, fontLookupAPCA } from 'apca-w3';
  /////      import { colorParsley } from 'colorparsley';
  /////
  /////    FORWARD CONTRAST USAGE:
  /////      Lc = APCAcontrast( sRGBtoY( TEXTcolor ) , sRGBtoY( BACKGNDcolor ) );
  /////    Where the colors are sent as an rgba array [255,255,255,1]
  /////
  /////    Retrieving an array of font sizes for the contrast:
  /////      fontArray = fontLookupAPCA(Lc);
  /////
  /////    Live Demonstrator at https://www.myndex.com/APCA/
  // */
  var SA98G = {
    mainTRC: 2.4,
    // 2.4 exponent for emulating actual monitor perception
    // For reverseAPCA
    get mainTRCencode() {
      return 1 / this.mainTRC;
    },
    // sRGB coefficients
    sRco: 0.2126729,
    sGco: 0.7151522,
    sBco: 0.072175,
    // G-4g constants for use with 2.4 exponent
    normBG: 0.56,
    normTXT: 0.57,
    revTXT: 0.62,
    revBG: 0.65,
    // G-4g Clamps and Scalers
    blkThrs: 0.022,
    blkClmp: 1.414,
    scaleBoW: 1.14,
    scaleWoB: 1.14,
    loBoWoffset: 0.027,
    loWoBoffset: 0.027,
    deltaYmin: 5e-4,
    loClip: 0.1,
    ///// MAGIC NUMBERS for UNCLAMP, for use with 0.022 & 1.414 /////
    // Magic Numbers for reverseAPCA
    mFactor: 1.9468554433171,
    get mFactInv() {
      return 1 / this.mFactor;
    },
    mOffsetIn: 0.0387393816571401,
    mExpAdj: 0.283343396420869,
    get mExp() {
      return this.mExpAdj / this.blkClmp;
    },
    mOffsetOut: 0.312865795870758
  };
  function APCAcontrast(txtY, bgY, places = -1) {
    const icp = [0, 1.1];
    if (isNaN(txtY) || isNaN(bgY) || Math.min(txtY, bgY) < icp[0] || Math.max(txtY, bgY) > icp[1]) {
      return 0;
    }
    ;
    let SAPC = 0;
    let outputContrast = 0;
    let polCat = "BoW";
    txtY = txtY > SA98G.blkThrs ? txtY : txtY + Math.pow(SA98G.blkThrs - txtY, SA98G.blkClmp);
    bgY = bgY > SA98G.blkThrs ? bgY : bgY + Math.pow(SA98G.blkThrs - bgY, SA98G.blkClmp);
    if (Math.abs(bgY - txtY) < SA98G.deltaYmin) {
      return 0;
    }
    if (bgY > txtY) {
      SAPC = (Math.pow(bgY, SA98G.normBG) - Math.pow(txtY, SA98G.normTXT)) * SA98G.scaleBoW;
      outputContrast = SAPC < SA98G.loClip ? 0 : SAPC - SA98G.loBoWoffset;
    } else {
      polCat = "WoB";
      SAPC = (Math.pow(bgY, SA98G.revBG) - Math.pow(txtY, SA98G.revTXT)) * SA98G.scaleWoB;
      outputContrast = SAPC > -SA98G.loClip ? 0 : SAPC + SA98G.loWoBoffset;
    }
    if (places < 0) {
      return outputContrast * 100;
    } else if (places == 0) {
      return Math.round(Math.abs(outputContrast) * 100) + "<sub>" + polCat + "</sub>";
    } else if (Number.isInteger(places)) {
      return (outputContrast * 100).toFixed(places);
    } else {
      return 0;
    }
  }
  function fontLookupAPCA(contrast, places = 2) {
    const fontMatrixAscend = [
      ["Lc", 100, 200, 300, 400, 500, 600, 700, 800, 900],
      [0, 999, 999, 999, 999, 999, 999, 999, 999, 999],
      [10, 999, 999, 999, 999, 999, 999, 999, 999, 999],
      [15, 777, 777, 777, 777, 777, 777, 777, 777, 777],
      [20, 777, 777, 777, 777, 777, 777, 777, 777, 777],
      [25, 777, 777, 777, 120, 120, 108, 96, 96, 96],
      [30, 777, 777, 120, 108, 108, 96, 72, 72, 72],
      [35, 777, 120, 108, 96, 72, 60, 48, 48, 48],
      [40, 120, 108, 96, 60, 48, 42, 32, 32, 32],
      [45, 108, 96, 72, 42, 32, 28, 24, 24, 24],
      [50, 96, 72, 60, 32, 28, 24, 21, 21, 21],
      [55, 80, 60, 48, 28, 24, 21, 18, 18, 18],
      [60, 72, 48, 42, 24, 21, 18, 16, 16, 18],
      [65, 68, 46, 32, 21.75, 19, 17, 15, 16, 18],
      [70, 64, 44, 28, 19.5, 18, 16, 14.5, 16, 18],
      [75, 60, 42, 24, 18, 16, 15, 14, 16, 18],
      [80, 56, 38.25, 23, 17.25, 15.81, 14.81, 14, 16, 18],
      [85, 52, 34.5, 22, 16.5, 15.625, 14.625, 14, 16, 18],
      [90, 48, 32, 21, 16, 15.5, 14.5, 14, 16, 18],
      [95, 45, 28, 19.5, 15.5, 15, 14, 13.5, 16, 18],
      [100, 42, 26.5, 18.5, 15, 14.5, 13.5, 13, 16, 18],
      [105, 39, 25, 18, 14.5, 14, 13, 12, 16, 18],
      [110, 36, 24, 18, 14, 13, 12, 11, 16, 18],
      [115, 34.5, 22.5, 17.25, 12.5, 11.875, 11.25, 10.625, 14.5, 16.5],
      [120, 33, 21, 16.5, 11, 10.75, 10.5, 10.25, 13, 15],
      [125, 32, 20, 16, 10, 10, 10, 10, 12, 14]
    ];
    const fontDeltaAscend = [
      ["\u2206Lc", 100, 200, 300, 400, 500, 600, 700, 800, 900],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [10, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [15, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [20, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [25, 0, 0, 0, 12, 12, 12, 24, 24, 24],
      [30, 0, 0, 12, 12, 36, 36, 24, 24, 24],
      [35, 0, 12, 12, 36, 24, 18, 16, 16, 16],
      [40, 12, 12, 24, 18, 16, 14, 8, 8, 8],
      [45, 12, 24, 12, 10, 4, 4, 3, 3, 3],
      [50, 16, 12, 12, 4, 4, 3, 3, 3, 3],
      [55, 8, 12, 6, 4, 3, 3, 2, 2, 0],
      [60, 4, 2, 10, 2.25, 2, 1, 1, 0, 0],
      [65, 4, 2, 4, 2.25, 1, 1, 0.5, 0, 0],
      [70, 4, 2, 4, 1.5, 2, 1, 0.5, 0, 0],
      [75, 4, 3.75, 1, 0.75, 0.188, 0.188, 0, 0, 0],
      [80, 4, 3.75, 1, 0.75, 0.188, 0.188, 0, 0, 0],
      [85, 4, 2.5, 1, 0.5, 0.125, 0.125, 0, 0, 0],
      [90, 3, 4, 1.5, 0.5, 0.5, 0.5, 0.5, 0, 0],
      [95, 3, 1.5, 1, 0.5, 0.5, 0.5, 0.5, 0, 0],
      [100, 3, 1.5, 0.5, 0.5, 0.5, 0.5, 1, 0, 0],
      [105, 3, 1, 0, 0.5, 1, 1, 1, 0, 0],
      [110, 1.5, 1.5, 0.75, 1.5, 1.125, 0.75, 0.375, 1.5, 1.5],
      [115, 1.5, 1.5, 0.75, 1.5, 1.125, 0.75, 0.375, 1.5, 1.5],
      [120, 1, 1, 0.5, 1, 0.75, 0.5, 0.25, 1, 1],
      [125, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];
    const weightArray = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    const weightArrayLen = weightArray.length;
    let returnArray = [contrast.toFixed(places), 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const returnArrayLen = returnArray.length;
    const contrastArrayAscend = ["lc", 0, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125];
    const contrastArrayLenAsc = contrastArrayAscend.length;
    let tempFont = 777;
    contrast = Math.abs(contrast);
    const factor = 0.2;
    const index = contrast == 0 ? 1 : contrast * factor | 0;
    let w = 0;
    let scoreAdj = (contrast - fontMatrixAscend[index][w]) * factor;
    w++;
    for (; w < weightArrayLen; w++) {
      tempFont = fontMatrixAscend[index][w];
      if (tempFont > 400) {
        returnArray[w] = tempFont;
      } else if (contrast < 14.5) {
        returnArray[w] = 999;
      } else if (contrast < 29.5) {
        returnArray[w] = 777;
      } else {
        tempFont > 24 ? returnArray[w] = Math.round(tempFont - fontDeltaAscend[index][w] * scoreAdj) : returnArray[w] = tempFont - (2 * fontDeltaAscend[index][w] * scoreAdj | 0) * 0.5;
      }
    }
    return returnArray;
  }
  function sRGBtoY(rgb = [0, 0, 0]) {
    function simpleExp(chan) {
      return Math.pow(chan / 255, SA98G.mainTRC);
    }
    ;
    return SA98G.sRco * simpleExp(rgb[0]) + SA98G.sGco * simpleExp(rgb[1]) + SA98G.sBco * simpleExp(rgb[2]);
  }

  // packages/components/color-profile.js
  var contrastPolicy = Object.freeze({
    apcaWeight: 0.7,
    wcagWeight: 0.3,
    apcaVersion: "apca-w3@0.1.9",
    status: "APCA beta, advisory; WCAG2 AA is a separate gate"
  });
  function evaluateColorPair({
    foreground,
    background,
    fontSize = 16,
    fontWeight = 400,
    role = "body"
  }) {
    if (![foreground, background].every(
      (value) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ))
      throw new TypeError("Opaque #RRGGBB colors required");
    if (!Number.isFinite(fontSize) || fontSize < 8 || fontSize > 120 || !Number.isInteger(fontWeight) || fontWeight < 100 || fontWeight > 900 || fontWeight % 100 || !["body", "label", "large"].includes(role))
      throw new TypeError("Invalid typography");
    const rgb = (color) => [1, 3, 5].map((index) => parseInt(color.slice(index, index + 2), 16));
    const front = rgb(foreground), back = rgb(background);
    const luminance = (channels) => channels.map((v) => v / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, index) => sum + v * [0.2126, 0.7152, 0.0722][index], 0);
    const a = luminance(front), b = luminance(back), ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const large = fontSize >= 24 || fontSize >= 18.6666667 && fontWeight >= 700;
    const minimum = large ? 3 : 4.5;
    const lc = APCAcontrast(sRGBtoY(front), sRGBtoY(back));
    const table = fontLookupAPCA(lc, 2), minimumReferenceSize = table[fontWeight / 100];
    const target = role === "body" ? 90 : role === "large" ? 60 : 75;
    const apcaScore = Math.min(100, Math.abs(lc) / target * 100), wcagScore = Math.min(100, ratio / minimum * 100);
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
        largeText: large
      },
      apca: {
        lc: Number(lc.toFixed(2)),
        target,
        meetsAdvisoryTarget: apcaMeetsTarget,
        minimumReferenceFontPx: minimumReferenceSize,
        fontGuidance: "Reference Barlow. 999=prohibited,777=non-text,666=spot only,5xx/4xx=restricted. Check real font; beta guidance.",
        fontTable: table
      },
      weightedScore: weighted,
      verdict: ratio < minimum ? "wcag-fail" : apcaMeetsTarget ? "contrast-targets-met" : "review-apca",
      limitations: [
        "Text/background polarity is significant.",
        "Web content on self-illuminated displays only.",
        "Does not certify WCAG, APCA, HIG or a complete interface."
      ]
    };
  }

  // packages/components/palette-color.js
  function parsePaletteHex(value) {
    if (typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value))
      throw new TypeError("Use opaque #RRGGBB colors");
    return [1, 3, 5].map(
      (index) => parseInt(value.slice(index, index + 2), 16) / 255
    );
  }
  var hueWrap = (value) => (value % 360 + 360) % 360;
  var linear = (value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  var encoded = (value) => value <= 31308e-7 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
  function paletteRatio(a, b) {
    const luminance = (rgb) => rgb.map(linear).reduce(
      (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
      0
    );
    const x = luminance(parsePaletteHex(a)), y = luminance(parsePaletteHex(b));
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function rgbHex(rgb) {
    return "#" + rgb.map(
      (value) => Math.round(Math.max(0, Math.min(1, value)) * 255).toString(16).padStart(2, "0")
    ).join("");
  }
  function hexOklch(hex) {
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
      h: C < 1e-4 ? null : hueWrap(Math.atan2(q, a) * 180 / Math.PI)
    };
  }
  function oklchLinear({ L, C, h }) {
    const radians = (h ?? 0) * Math.PI / 180, a = C * Math.cos(radians), b = C * Math.sin(radians);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
    ];
  }
  function mapOklch(point) {
    const inGamut = (rgb) => rgb.every((value) => value >= -1e-7 && value <= 1 + 1e-7);
    let C = point.h === null ? 0 : point.C, raw = oklchLinear({ ...point, C }), mapped = false;
    if (!inGamut(raw)) {
      let low = 0, high = C;
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
      mappedChroma: Number(C.toFixed(6))
    };
  }
  function hexHsl(hex) {
    const [r, g, b] = parsePaletteHex(hex), max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min, L = (max + min) / 2;
    let h = null;
    if (delta > 0) {
      if (max === r) h = 60 * ((g - b) / delta % 6);
      else if (max === g) h = 60 * ((b - r) / delta + 2);
      else h = 60 * ((r - g) / delta + 4);
      h = hueWrap(h);
    }
    return { L, C: delta === 0 ? 0 : delta / (1 - Math.abs(2 * L - 1)), h };
  }
  function mapHsl({ L, C, h }) {
    const chroma = (1 - Math.abs(2 * L - 1)) * C, k = hueWrap(h ?? 0) / 60, x = chroma * (1 - Math.abs(k % 2 - 1)), m = L - chroma / 2;
    const rgb = k < 1 ? [chroma, x, 0] : k < 2 ? [x, chroma, 0] : k < 3 ? [0, chroma, x] : k < 4 ? [0, x, chroma] : k < 5 ? [x, 0, chroma] : [chroma, 0, x];
    return {
      hex: rgbHex(rgb.map((value) => value + m)),
      gamutMapped: false,
      mappedChroma: null
    };
  }

  // packages/components/palette-model.js
  var PALETTE_HARMONIES = Object.freeze([
    "monochromatic",
    "analogous",
    "complementary",
    "split-complementary",
    "triadic",
    "tetradic",
    "square"
  ]);
  var offsets = {
    monochromatic: [0, 0, 0, 0, 0],
    analogous: [0, -30, 30],
    complementary: [0, 180],
    "split-complementary": [0, 150, 210],
    triadic: [0, 120, 240],
    tetradic: [0, 60, 180, 240],
    square: [0, 90, 180, 270]
  };
  var allowed = /* @__PURE__ */ new Set([
    "baseColor",
    "space",
    "harmonies",
    "background",
    "foreground",
    "fontSize",
    "fontWeight",
    "role"
  ]);
  function validate(options) {
    if (!options || typeof options !== "object" || Array.isArray(options) || Object.keys(options).some((key) => !allowed.has(key)))
      throw new TypeError("Invalid palette options");
    const {
      baseColor,
      space = "oklch",
      harmonies = PALETTE_HARMONIES,
      background = "#ffffff",
      foreground = "#202126",
      fontSize = 16,
      fontWeight = 400,
      role = "body"
    } = options;
    for (const color of [baseColor, background, foreground])
      parsePaletteHex(color);
    if (!["oklch", "hsl"].includes(space) || !Array.isArray(harmonies) || harmonies.length < 1 || harmonies.length > 7 || new Set(harmonies).size !== harmonies.length || harmonies.some((id) => !PALETTE_HARMONIES.includes(id)))
      throw new TypeError("Invalid palette harmonies or color space");
    evaluateColorPair({ foreground, background, fontSize, fontWeight, role });
    return {
      baseColor: baseColor.toLowerCase(),
      space,
      harmonies: [...harmonies],
      background: background.toLowerCase(),
      foreground: foreground.toLowerCase(),
      fontSize,
      fontWeight,
      role
    };
  }
  function pair(foreground, background, context) {
    const result = evaluateColorPair({
      foreground,
      background,
      fontSize: context.fontSize,
      fontWeight: context.fontWeight,
      role: context.role
    });
    return {
      wcag: result.wcag2,
      apca: {
        lc: result.apca.lc,
        target: result.apca.target,
        meetsAdvisoryTarget: result.apca.meetsAdvisoryTarget,
        minimumReferenceFontPx: result.apca.minimumReferenceFontPx
      },
      weightedScore: result.weightedScore,
      verdict: result.verdict
    };
  }
  function inkFor(hex, context) {
    const candidates = ["#000000", "#ffffff"].map((color) => ({
      color,
      checks: pair(color, hex, context)
    }));
    candidates.sort(
      (a, b) => Number(b.checks.wcag.aa) - Number(a.checks.wcag.aa) || b.checks.weightedScore - a.checks.weightedScore
    );
    return candidates[0];
  }
  function generatePalette(options) {
    const context = validate(options), point = context.space === "oklch" ? hexOklch(context.baseColor) : hexHsl(context.baseColor);
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
          pass: ratio >= 3
        }
      };
    }
    const schemes = [];
    for (const id of context.harmonies) {
      const colors = [];
      for (let index = 0; index < offsets[id].length; index++) {
        const offset = offsets[id][index];
        let L = point.L, C = point.C;
        if (id === "monochromatic" && index > 0) {
          L = [point.L, 0.2, 0.4, 0.7, 0.9][index];
          C *= 0.7;
        }
        const mapped = index === 0 ? {
          hex: context.baseColor,
          gamutMapped: false,
          mappedChroma: context.space === "oklch" ? Number(C.toFixed(6)) : null
        } : map({
          L,
          C,
          h: point.h === null ? null : hueWrap(point.h + offset)
        });
        colors.push(
          swatch(mapped.hex, `color-${index}`, offset, {
            gamutMapped: mapped.gamutMapped,
            mappedChroma: mapped.mappedChroma
          })
        );
      }
      const wcagRatios = [], apcaLc = [];
      for (const front of colors) {
        const ratios = [], lcs = [];
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
          apcaLc
        }
      });
    }
    const tonalPoint = hexOklch(context.baseColor), tonalScale = [];
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
        role: context.role
      },
      contrastPolicy,
      schemes,
      tonalScale,
      tonalScaleColorSpace: "oklch",
      fontGuidance: "Reference Barlow.999=prohibited,777=non-text,666=spot only,5xx/4xx=restricted. Check real font; APCA beta is advisory.",
      hostProfileChanged: false,
      assessment: "candidates-only; contrast checks apply only to the named pairs and supplied typography",
      limitations: [
        "Hue harmony is an authored heuristic, not an accessibility standard or a universal aesthetic score.",
        "OKLCH and HSL rotations differ; neither implements a pigment RYB wheel or Material HCT.",
        "sRGB mapping uses bounded chroma reduction, not CSS LocalMINDE; check emitted hex after rounding.",
        "Keep host semantic roles and palettes; do not assign danger/success/warning from wheel positions.",
        "Non-text3:1 is a numeric adjacent-surface check only; check all actual adjacent colors/states and do not convey meaning by color alone.",
        "APCA beta is advisory; AA failure cannot be offset by a score. Full AT/native/WCAG, CVD distinctness and CMYK print remain unverified."
      ]
    };
  }
  return __toCommonJS(palette_model_exports);
})();

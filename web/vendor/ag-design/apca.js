// ../../ag299-unified/work/node_modules/colorparsley/src/colorparsley.js
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
function colorParsley(colorIn) {
  if (typeof colorIn === "string") {
    return parseString(colorIn);
  } else if (typeof colorIn === "number") {
    return [
      (colorIn & 16711680) >> 16,
      (colorIn & 65280) >> 8,
      colorIn & 255,
      1,
      true,
      "unknown"
    ];
  } else if (typeof colorIn === "object") {
    if (Array.isArray(colorIn)) {
      return colorIn;
    } else if (!isNaN(colorIn.r) || !isNaN(colorIn.red)) {
      let objArray = [0, 0, 0, 0, false, "unknown"];
      objArray[0] = colorIn.r ? colorIn.r : colorIn.red ? colorIn.red : false;
      objArray[1] = colorIn.g ? colorIn.g : colorIn.green ? colorIn.green : false;
      objArray[2] = colorIn.b ? colorIn.b : colorIn.blue ? colorIn.blue : false;
      objArray[3] = colorIn.a ? colorIn.a : colorIn.alpha ? colorIn.alpha : 1;
      objArray[4] = objArray[0] && objArray[1] && objArray[2] ? true : false;
      objArray[5] = colorIn.space ? colorIn.space : colorIn.colorSpace ? colorIn.colorSpace : colorIn.colorspace ? colorIn.colorspace : "unknown";
      return objArray;
    }
  }
  ;
  console.log("colorParsley error: invalid input");
  return [0, 0, 0, 0, false, "inputError"];
}
function parseString(colorString = "#abcdef") {
  colorString = colorString.replace(/[^\w,.#%()\/ -]/g, "");
  colorString = colorString.toLowerCase();
  let isValid = false;
  let type = "sRGB";
  let retArray = [0, 0, 0, 0, isValid, type];
  if (colorString.match(/^(?:(?!rgb|l.h|hs|col|\d|#).{0,4})(?=[g-z])/)) {
    let namedColors = {
      gray0: "000000",
      gray1: "111111",
      gray2: "222222",
      gray3: "333333",
      gray4: "444444",
      gray5: "555555",
      gray6: "666666",
      gray7: "777777",
      gray8: "888888",
      gray9: "999999",
      graya: "aaaaaa",
      grayb: "bbbbbb",
      grayc: "cccccc",
      grayd: "dddddd",
      graye: "eeeeee",
      grayf: "ffffff",
      midgray: "a0a0a0",
      grey0: "000000",
      grey1: "111111",
      grey2: "222222",
      grey3: "333333",
      grey4: "444444",
      grey5: "555555",
      grey6: "666666",
      grey7: "777777",
      grey8: "888888",
      grey9: "999999",
      greya: "aaaaaa",
      greyb: "bbbbbb",
      greyc: "cccccc",
      greyd: "dddddd",
      greye: "eeeeee",
      greyf: "ffffff",
      midgrey: "a0a0a0",
      aliceblue: "f0f8ff",
      antiquewhite: "faebd7",
      aqua: "00ffff",
      aquamarine: "7fffd4",
      azure: "f0ffff",
      beige: "f5f5dc",
      bisque: "ffe4c4",
      black: "000000",
      blanchedalmond: "ffebcd",
      blue: "0000ff",
      blueviolet: "8a2be2",
      brown: "a52a2a",
      burlywood: "deb887",
      cadetblue: "5f9ea0",
      chartreuse: "7fff00",
      chocolate: "d2691e",
      coral: "ff7f50",
      cornflowerblue: "6495ed",
      cornsilk: "fff8dc",
      crimson: "dc143c",
      cyan: "00ffff",
      darkblue: "00008b",
      darkcyan: "008b8b",
      darkgoldenrod: "b8860b",
      darkgray: "a9a9a9",
      darkgreen: "006400",
      darkgrey: "a9a9a9",
      darkkhaki: "bdb76b",
      darkmagenta: "8b008b",
      darkolivegreen: "556b2f",
      darkorange: "ff8c00",
      darkorchid: "9932cc",
      darkred: "8b0000",
      darksalmon: "e9967a",
      darkseagreen: "8fbc8f",
      darkslateblue: "483d8b",
      darkslategray: "2f4f4f",
      darkslategrey: "2f4f4f",
      darkturquoise: "00ced1",
      darkviolet: "9400d3",
      deeppink: "ff1493",
      deepskyblue: "00bfff",
      dimgray: "696969",
      dimgrey: "696969",
      dodgerblue: "1e90ff",
      firebrick: "b22222",
      floralwhite: "fffaf0",
      forestgreen: "228b22",
      fuchsia: "ff00ff",
      gainsboro: "dcdcdc",
      ghostwhite: "f8f8ff",
      gold: "ffd700",
      goldenrod: "daa520",
      gray: "808080",
      green: "008000",
      greenyellow: "adff2f",
      grey: "808080",
      honeydew: "f0fff0",
      hotpink: "ff69b4",
      indianred: "cd5c5c",
      indigo: "4b0082",
      ivory: "fffff0",
      khaki: "f0e68c",
      lavender: "e6e6fa",
      lavenderblush: "fff0f5",
      lawngreen: "7cfc00",
      lemonchiffon: "fffacd",
      lightblue: "add8e6",
      lightcoral: "f08080",
      lightcyan: "e0ffff",
      lightgoldenrodyellow: "fafad2",
      lightgray: "d3d3d3",
      lightgreen: "90ee90",
      lightgrey: "d3d3d3",
      lightpink: "ffb6c1",
      lightsalmon: "ffa07a",
      lightseagreen: "20b2aa",
      lightskyblue: "87cefa",
      lightslategray: "778899",
      lightslategrey: "778899",
      lightsteelblue: "b0c4de",
      lightyellow: "ffffe0",
      lime: "00ff00",
      limegreen: "32cd32",
      linen: "faf0e6",
      magenta: "ff00ff",
      maroon: "800000",
      mediumaquamarine: "66cdaa",
      mediumblue: "0000cd",
      mediumorchid: "ba55d3",
      mediumpurple: "9370db",
      mediumseagreen: "3cb371",
      mediumslateblue: "7b68ee",
      mediumspringgreen: "00fa9a",
      mediumturquoise: "48d1cc",
      mediumvioletred: "c71585",
      midnightblue: "191970",
      mintcream: "f5fffa",
      mistyrose: "ffe4e1",
      moccasin: "ffe4b5",
      navajowhite: "ffdead",
      navy: "000080",
      oldlace: "fdf5e6",
      olive: "808000",
      olivedrab: "6b8e23",
      orange: "ffa500",
      orangered: "ff4500",
      orchid: "da70d6",
      palegoldenrod: "eee8aa",
      palegreen: "98fb98",
      paleturquoise: "afeeee",
      palevioletred: "db7093",
      papayawhip: "ffefd5",
      peachpuff: "ffdab9",
      peru: "cd853f",
      pink: "ffc0cb",
      plum: "dda0dd",
      powderblue: "b0e0e6",
      purple: "800080",
      rebeccapurple: "663399",
      red: "ff0000",
      rosybrown: "bc8f8f",
      royalblue: "4169e1",
      saddlebrown: "8b4513",
      salmon: "fa8072",
      sandybrown: "f4a460",
      seagreen: "2e8b57",
      seashell: "fff5ee",
      sienna: "a0522d",
      silver: "c0c0c0",
      skyblue: "87ceeb",
      slateblue: "6a5acd",
      slategray: "708090",
      slategrey: "708090",
      snow: "fffafa",
      springgreen: "00ff7f",
      steelblue: "4682b4",
      tan: "d2b48c",
      teal: "008080",
      thistle: "d8bfd8",
      tomato: "ff6347",
      turquoise: "40e0d0",
      violet: "ee82ee",
      wheat: "f5deb3",
      white: "ffffff",
      whitesmoke: "f5f5f5",
      yellow: "ffff00",
      yellowgreen: "9acd32"
    };
    for (let key in namedColors) {
      if (colorString == key) {
        let hexRex = {
          rex: /^([\da-f]{2})([\da-f]{2})([\da-f]{2})$/,
          sprig: function(slices) {
            for (let i = 0; i < 3; i++) {
              retArray[i] = parseInt(slices[i + 1], 16);
            }
            retArray[3] = 1;
            return true;
          }
        };
        let hexProc = hexRex.rex.exec(namedColors[key]);
        retArray[4] = isValid = hexRex.sprig(hexProc);
        return retArray;
      }
    }
  }
  ;
  let colorRex = {
    rex: /(?:^(?:#|0x|)(?:(?:([\da-f])([\da-f])([\da-f])([\da-f])?)(?!\S)|(?:([\da-f]{2})(?:([\da-f]{2})([\da-f]{2})([\da-f]{2})?)?))|(?:(?:^(?:rgba?|)\(? ?(?:(?:(?:(255|(?:25[0-4]|2[0-4]\d|1?\d{1,2})(?:\.\d{1,24})?)))(?:,[^\S]*$|(?:(?:, ?| )(255|(?:25[0-4]|2[0-4]\d|1?\d{1,2})(?:\.\d{1,24})?)(?:, ?| )(255|(?:25[0-4]|2[0-4]\d|1?\d{1,2})(?:\.\d{1,24})?)))|(100%|\d{1,2}(?:\.\d{1,24})?%)(?:,?[^\S]*$|(?:(?:, ?| )(?:(100%|\d{1,2}(?:\.\d{1,24})?%)(?:, ?| )(100%|\d{1,2}(?:\.\d{1,24})?%)))))|^(?:color\((srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65) (?:(100%|\d{1,2}(?:\.\d{1,24})?%|[0 ]\.\d{1,24}|[01])) (?:(100%|\d{1,2}(?:\.\d{1,24})?%|[0 ]\.\d{1,24}|[01])) (?:(100%|\d{1,2}(?:\.\d{1,24})?%|[0 ]\.\d{1,24}|[01])))|^(?:((?:r(?!gb)|c(?!olor)|[abd-qs-z])[a-z]{2,5})\( ?((?:\d{0,3}\.|)\d{1,24}%?)(?:, ?| )((?:\d{0,3}\.|)\d{1,24}%?)(?:, ?| )((?:\d{0,3}\.|)\d{1,24}%?))))(?:(?:,| \/| ) ?(?:(100%|\d{1,2}(?:\.\d{1,24})?%|[0 ]\.\d{1,24}|[01])))?(?:\)| |))[^\S]*$/,
    parsley: function(slices) {
      let slicePos = 0;
      let sliceLast = 0;
      let base = 10;
      let divisor = 100;
      let convertPct = 2.55;
      let alpha = "1";
      if (slices[23]) {
        alpha = slices[23];
        delete slices[23];
      }
      retArray[3] = alpha.match(/%/g) ? parseFloat(alpha) / divisor : parseFloat(alpha);
      for (let k = 1; k < slices.length; k++) {
        if (slices[k]) {
          slicePos = slicePos ? slicePos : k;
          sliceLast = k;
        }
      }
      switch (sliceLast) {
        case 4:
          base = 16;
          divisor = 15;
          retArray[3] = parseInt(slices[sliceLast], base) / divisor;
        case 3:
          base = 16;
          for (let i = 0; i < 3; i++) {
            retArray[i] = parseInt(slices[slicePos + i] + slices[slicePos + i], base);
          }
          break;
        case 5:
          base = 16;
        case 9:
          retArray[0] = retArray[1] = retArray[2] = base == 10 ? parseFloat(slices[sliceLast]) : parseInt(slices[sliceLast], base);
          break;
        case 12:
          retArray[0] = retArray[1] = retArray[2] = parseFloat(slices[sliceLast]) * convertPct;
          break;
        case 8:
          base = 16;
          divisor = 255;
          retArray[3] = parseInt(slices[8], base) / divisor;
        case 7:
          base = 16;
        case 11:
          for (let i = 0; i < 3; i++) {
            retArray[i] = base == 10 ? parseFloat(slices[slicePos + i]) : parseInt(slices[slicePos + i], base);
          }
          break;
        case 14:
          for (let i = 0; i < 3; i++) {
            retArray[i] = parseFloat(slices[slicePos + i]) * convertPct;
          }
          break;
        case 18:
          retArray[5] = slices[15];
          for (let i = 0; i < 3; i++) {
            slicePos++;
            retArray[i] = slices[slicePos].match(/%/g) ? parseFloat(slices[slicePos]) * 2.55 : parseFloat(slices[slicePos]) * 255;
          }
          break;
        case 22:
          retArray[5] = slices[slicePos];
          for (let i = 0; i < 3; i++) {
            slicePos++;
            retArray[i] = slices[slicePos] ? slices[slicePos].match(/%/g) ? parseFloat(slices[slicePos]) / divisor : parseFloat(slices[slicePos]) : 0;
          }
          if (retArray[5].match(/^(?:hsla?|hwba?)/i)) {
            let f = function(n) {
              let k = (n + hue / 30) % 12;
              let a = sat * Math.min(light, 1 - light);
              return light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
            };
            let sat, light, white, black, hwbFact;
            let hue = retArray[0] % 360;
            if (hue < 0) {
              hue += 360;
            }
            if (retArray[5].match(/^hsla?/i)) {
              sat = retArray[1];
              light = retArray[2];
              white = 0;
              hwbFact = 1;
            } else if (retArray[5].match(/^hwba?/i)) {
              white = retArray[1];
              black = retArray[2];
              if (white + black >= 1) {
                retArray[0] = retArray[1] = retArray[2] = white / (white + black);
                retArray[5] = "sRGB";
                break;
              }
              sat = 1;
              light = 0.5;
              hwbFact = 1 - white - black;
            }
            retArray[0] = Math.round(255 * (f(0) * hwbFact + white));
            retArray[1] = Math.round(255 * (f(8) * hwbFact + white));
            retArray[2] = Math.round(255 * (f(4) * hwbFact + white));
            retArray[5] = "sRGB";
          }
          break;
      }
      return true;
    }
    // close parsley sub-function
  };
  let slicesProc = colorRex.rex.exec(colorString);
  if (slicesProc) {
    retArray[4] = isValid = colorRex.parsley(slicesProc);
    return retArray;
  } else {
    isValid = false;
    console.log("colorParsley error: unable to parse string");
    return [0, 0, 0, 0, isValid, "parsleyError"];
  }
}

// ../../ag299-unified/work/node_modules/apca-w3/src/apca-w3.js
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
function reverseAPCA(contrast = 0, knownY = 1, knownType = "bg", returnAs = "hex") {
  if (Math.abs(contrast) < 9) {
    return false;
  }
  ;
  let unknownY = knownY, knownExp, unknownExp;
  const scale = contrast > 0 ? SA98G.scaleBoW : SA98G.scaleWoB;
  const offset = contrast > 0 ? SA98G.loBoWoffset : -SA98G.loWoBoffset;
  contrast = (parseFloat(contrast) * 0.01 + offset) / scale;
  knownY = knownY > SA98G.blkThrs ? knownY : knownY + Math.pow(SA98G.blkThrs - knownY, SA98G.blkClmp);
  if (knownType == "bg" || knownType == "background") {
    knownExp = contrast > 0 ? SA98G.normBG : SA98G.revBG;
    unknownExp = contrast > 0 ? SA98G.normTXT : SA98G.revTXT;
    unknownY = Math.pow(Math.pow(knownY, knownExp) - contrast, 1 / unknownExp);
    if (isNaN(unknownY)) return false;
  } else if (knownType == "txt" || knownType == "text") {
    knownExp = contrast > 0 ? SA98G.normTXT : SA98G.revTXT;
    unknownExp = contrast > 0 ? SA98G.normBG : SA98G.revBG;
    unknownY = Math.pow(contrast + Math.pow(knownY, knownExp), 1 / unknownExp);
    if (isNaN(unknownY)) return false;
  } else {
    return false;
  }
  if (unknownY > 1.06 || unknownY < 0) {
    return false;
  }
  unknownY = unknownY > SA98G.blkThrs ? unknownY : Math.pow(
    (unknownY + SA98G.mOffsetIn) * SA98G.mFactor,
    SA98G.mExp
  ) * SA98G.mFactInv - SA98G.mOffsetOut;
  unknownY = Math.max(Math.min(unknownY, 1), 0);
  if (returnAs === "hex") {
    let hexB = Math.round(Math.pow(unknownY, SA98G.mainTRCencode) * 255).toString(16).padStart(2, "0");
    return "#" + hexB + hexB + hexB;
  } else if (returnAs === "color") {
    let colorB = Math.round(Math.pow(unknownY, SA98G.mainTRCencode) * 255);
    let retUse = knownType == "bg" ? "txtColor" : "bgColor";
    return [colorB, colorB, colorB, 1, retUse];
  } else if (returnAs === "Y" || returnAs === "y") {
    return Math.max(0, unknownY);
  } else {
    return false;
  }
}
function calcAPCA(textColor, bgColor, places = -1, round = true) {
  let bgClr = colorParsley(bgColor);
  let txClr = colorParsley(textColor);
  let hasAlpha = txClr[3] == "" || txClr[3] == 1 ? false : true;
  if (hasAlpha) {
    txClr = alphaBlend(txClr, bgClr, round);
  }
  ;
  return APCAcontrast(sRGBtoY(txClr), sRGBtoY(bgClr), places);
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
function displayP3toY(rgb = [0, 0, 0]) {
  const mainTRC = 2.4;
  const sRco = 0.228982959480578, sGco = 0.691749262585238, sBco = 0.0792677779341829;
  function simpleExp(chan) {
    return Math.pow(chan, mainTRC);
  }
  ;
  return sRco * simpleExp(rgb[0]) + sGco * simpleExp(rgb[1]) + sBco * simpleExp(rgb[2]);
}
function adobeRGBtoY(rgb = [0, 0, 0]) {
  const mainTRC = 2.35;
  const sRco = 0.297355022711381, sGco = 0.627372749714528, sBco = 0.0752722275740913;
  function simpleExp(chan) {
    return Math.pow(chan / 255, mainTRC);
  }
  ;
  return sRco * simpleExp(rgb[0]) + sGco * simpleExp(rgb[1]) + sBco * simpleExp(rgb[2]);
}
function alphaBlend(rgbaFG = [0, 0, 0, 1], rgbBG = [0, 0, 0], round = true) {
  rgbaFG[3] = Math.max(Math.min(rgbaFG[3], 1), 0);
  let compBlend = 1 - rgbaFG[3];
  let rgbOut = [0, 0, 0, 1, true];
  for (let i = 0; i < 3; i++) {
    rgbOut[i] = rgbBG[i] * compBlend + rgbaFG[i] * rgbaFG[3];
    if (round) rgbOut[i] = Math.min(Math.round(rgbOut[i]), 255);
  }
  ;
  return rgbOut;
}
export {
  APCAcontrast,
  adobeRGBtoY,
  alphaBlend,
  calcAPCA,
  displayP3toY,
  fontLookupAPCA,
  reverseAPCA,
  sRGBtoY
};

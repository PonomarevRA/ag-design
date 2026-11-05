// Adapted subset of asciify-engine4.32.0, MIT Copyright(c)2026 ayangabryl. See ASCIIFY-LICENSE.md.
/** Isolate upstream scratch canvas and bounded lookup caches per AG instance; no source is loaded by this converter. */
export function createAsciiConverter(document) {
const HTMLVideoElement=document.defaultView.HTMLVideoElement;
var t = { standard: { label: "Classic ASCII", chars: " .:-=+*#%@" }, asciify: { label: "Asciify", chars: " .:-=+YCIFSA#@" }, minimal: { label: "Minimal", chars: " .:+" }, detailed: { label: "Detailed", chars: " .,:;-~=+*xX#%@" }, letters: { label: "Letters", chars: " .liLTYCFSAWM" }, technical: { label: "Technical", chars: " ._:;+/>=][{}*$#@" }, blocks: { label: "Tonal blocks", chars: " \u2591\u2592\u2593\u2588" }, braille: { label: "Braille", chars: " \u2801\u2803\u2807\u2847\u28C7\u28E7\u28F7\u28FF" }, fish: { label: "Fish", chars: " .'-,:;txoSX%#8@" }, kanji: { label: "Kanji (Japanese)", chars: " \u4E00\u4E8C\u4EBA\u5C0F\u5927\u4E2D\u65E5\u672C\u76EE\u7530\u9577\u9593\u8A9E\u66F8\u66DC\u9A5A\u9727" } };
var r = { fontSize: 7, charSpacing: 1, brightness: 0, contrast: 0, charset: t.standard.chars, colorMode: "grayscale", accentColor: "#d4ff00", invert: false, renderMode: "ascii", animationStyle: "none", animationSpeed: 1, dotSizeRatio: 0.8, ditherStrength: 0, charAspect: 0.55, normalize: false, hoverStrength: 0, hoverRadius: 0.2, hoverEffect: "spotlight", hoverColor: "#ffffff", hoverShape: "circle", hoverText: "ASCIIFY", artStyle: "classic", fineDither: false, customText: "", chromaKey: null, chromaKeyTolerance: 60, chromaKeyTrimPadding: 2e-3, chromaKeyTrimLuminanceThreshold: 0, chromaKeyTrimMode: "range" };
var u = new Float32Array(0);
function T(t2, e) {
  const n = document.createElement("canvas");
  n.width = t2, n.height = e;
  const o = n.getContext("2d", { willReadFrequently: true });
  return { canvas: n, ctx: o };
}
function F(t2, e, n) {
  let o = t2 + 255 * e;
  return o = 259 * (255 * n + 255) / (255 * (259 - 255 * n)) * (o - 128) + 128, Math.max(0, Math.min(255, o));
}
var L = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function R(t2, e, n, o) {
  if (o <= 0) return t2;
  const a = (L[n % 4][e % 4] / 16 - 0.5) * o * 128;
  return Math.max(0, Math.min(255, t2 + a));
}
var H = new Array(256);
var j = new Array(256);
for (let t2 = 0; t2 < 256; t2++) H[t2] = `rgb(${t2},${t2},${t2})`, j[t2] = `rgb(0,${t2},0)`;
function O(t2) {
  const e = t2.match(/rgba?\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)(?:\s*[,/]\s*([\d.]+))?\s*\)/);
  return e ? { r: +e[1], g: +e[2], b: +e[3], a: void 0 !== e[4] ? +e[4] : 1 } : null;
}
function z(t2) {
  let e = t2;
  for (; e && e !== document.documentElement.parentElement; ) {
    const t3 = getComputedStyle(e).backgroundColor;
    if (t3 && "transparent" !== t3 && "rgba(0, 0, 0, 0)" !== t3) {
      const e2 = O(t3);
      if (e2 && e2.a > 0.1) return e2;
    }
    e = e.parentElement;
  }
  return null;
}
function q(t2) {
  if (t2) {
    const e = z(t2);
    if (e) {
      return (0.299 * e.r + 0.587 * e.g + 0.114 * e.b) / 255 < 0.4;
    }
  }
  if ("undefined" != typeof document) {
    const t3 = document.documentElement, e = (t3.getAttribute("data-theme") || "").toLowerCase();
    if ("dark" === e) return true;
    if ("light" === e) return false;
    if (t3.classList.contains("dark")) return true;
    if (document.body) {
      const t4 = z(document.body);
      if (t4) {
        return (0.299 * t4.r + 0.587 * t4.g + 0.114 * t4.b) / 255 < 0.4;
      }
    }
  }
  return "undefined" != typeof window && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function D(t2) {
  if ("string" != typeof t2) return t2;
  const e = document.createElement("canvas");
  e.width = 1, e.height = 1;
  const n = e.getContext("2d");
  n.fillStyle = t2, n.fillRect(0, 0, 1, 1);
  const o = n.getImageData(0, 0, 1, 1).data;
  return { r: o[0], g: o[1], b: o[2] };
}
var V = null;
var Y = null;
function G(t2, e) {
  if (!V || !Y) {
    const n = T(t2, e);
    V = n.canvas, Y = n.ctx;
  }
  return V.width !== t2 && (V.width = t2), V.height !== e && (V.height = e), Y;
}
var J = /* @__PURE__ */ new Map();
var X = /* @__PURE__ */ new Map();
function Q(t2) {
  const e = Intl.Segmenter;
  return e ? Array.from(new e(void 0, { granularity: "grapheme" }).segment(t2), ({ segment: t3 }) => t3) : [...t2];
}
function Z(t2) {
  let e = J.get(t2);
  return e || (e = Q(t2), J.set(t2, e)), e;
}
function et(t2, e, n) {
  const o = n ? 1 - t2 / 255 : t2 / 255, a = Math.floor(o * (e.length - 1));
  return e[Math.max(0, Math.min(e.length - 1, a))] ?? " ";
}
function nt(t2, e, n, o) {
  const a = `${t2}\0${e ? 1 : 0}\0${n}\0${o}`;
  let r2 = X.get(a);
  if (!r2) {
    const i = Z(t2);
    r2 = new Array(256);
    for (let t3 = 0; t3 < 256; t3++) r2[t3] = et(F(t3, n, o), i, e);
    X.set(a, r2);
  }
  return r2;
}
function at(t2, e) {
  return "auto" !== t2 ? t2 : !q(e);
}
function st(t2, e, n) {
  return Math.max(e, Math.min(n, t2));
}
function ht(t2, e, n) {
  if (!t2) return { x: 0, y: 0, width: e, height: n };
  const o = t2.unit ?? "percent", a = false !== t2.preserveAspect, r2 = (t3) => void 0 === t3 ? void 0 : "percent" === o ? t3 * e : t3, i = (t3) => void 0 === t3 ? void 0 : "percent" === o ? t3 * n : t3, s = st(r2(t2.left) ?? 0, 0, e - 1), h = st(r2(t2.right) ?? 0, 0, e - s - 1), c = st(i(t2.top) ?? 0, 0, n - 1), l = st(i(t2.bottom) ?? 0, 0, n - c - 1), f = void 0 !== t2.left || void 0 !== t2.right || void 0 !== t2.top || void 0 !== t2.bottom, m = Math.max(1, e - s - h), d = Math.max(1, n - c - l), u2 = f ? m : r2(t2.width), M = f ? d : i(t2.height);
  let g = u2 ?? e, p = M ?? n;
  if (a && !f) {
    const t3 = g / e, o2 = p / n, a2 = Math.min(t3, o2), r3 = void 0 === u2 ? o2 : void 0 === M ? t3 : a2;
    g = e * r3, p = n * r3;
  }
  g = st(g, 1, f ? m : e), p = st(p, 1, f ? d : n);
  const v = t2.anchor ?? "center", x = r2(t2.x), w = i(t2.y), y = f ? s : 0, b = f ? c : 0, S = f ? m : e, E = f ? d : n, k = v.endsWith("left") || "left" === v ? 0 : v.endsWith("right") || "right" === v ? S - g : (S - g) / 2, A = v.startsWith("top") || "top" === v ? 0 : v.startsWith("bottom") || "bottom" === v ? E - p : (E - p) / 2;
  return { x: st(x ?? y + k, 0, Math.max(0, e - g)), y: st(w ?? b + A, 0, Math.max(0, n - p)), width: g, height: p };
}
function lt(t2, e, n, o) {
  const a = t2 instanceof HTMLVideoElement ? t2.videoWidth : t2.width, r2 = t2 instanceof HTMLVideoElement ? t2.videoHeight : t2.height;
  if (0 === a || 0 === r2) return { rows: [], cols: 0, rowCount: 0 };
  const i = e.charAspect, s = e.fontSize * e.charSpacing, h = e.fontSize / i * e.charSpacing, c = n || a, l = o || r2, f = Math.floor(c / s), m = Math.floor(l / h);
  if (f <= 0 || m <= 0) return { rows: [], cols: 0, rowCount: 0 };
  const d = f, u2 = m, M = G(d, u2), g = ht(e.sourceCrop, a, r2), p = M.globalCompositeOperation;
  M.globalCompositeOperation = "copy";
  try {
    M.drawImage(t2, g.x, g.y, g.width, g.height, 0, 0, d, u2);
  } finally {
    M.globalCompositeOperation = p;
  }
  const v = M.getImageData(0, 0, d, u2).data, x = e.chromaKey, w = null != x && false !== x, y = true === x, b = "blue-screen" === x;
  let S = null, E = 0;
  !w || y || b || (S = D(x), E = (e.chromaKeyTolerance ?? 60) ** 2);
  let k = 0, A = 255;
  if (e.normalize) {
    let t3 = 255, e2 = 0;
    for (let n2 = 0; n2 < v.length; n2 += 4) {
      if (w) {
        const t4 = v[n2], e3 = v[n2 + 1], o3 = v[n2 + 2];
        let a2 = false;
        if (y) a2 = e3 > 1.4 * t4 && e3 > 1.4 * o3 && e3 > 80;
        else if (b) a2 = o3 > 1.4 * t4 && o3 > 1.4 * e3 && o3 > 80;
        else if (null !== S) {
          const n3 = t4 - S.r, r3 = e3 - S.g, i2 = o3 - S.b;
          a2 = n3 * n3 + r3 * r3 + i2 * i2 <= E;
        }
        if (a2) continue;
      }
      const o2 = 0.299 * v[n2] + 0.587 * v[n2 + 1] + 0.114 * v[n2 + 2];
      o2 < t3 && (t3 = o2), o2 > e2 && (e2 = o2);
    }
    k = t3, A = e2 > t3 ? e2 - t3 : 255;
  }
  const C = at(e.invert), T2 = w && e.charset.replace(/ /g, "") || e.charset, I = Z(T2), L2 = e.customText ? null : nt(T2, C, e.brightness, e.contrast), H2 = e.customText ? Z(e.customText) : null, j2 = "fullcolor" === e.colorMode ? new Uint8ClampedArray(f * m * 4) : void 0, W = [];
  for (let t3 = 0; t3 < m; t3++) {
    let n2 = "";
    for (let o2 = 0; o2 < f; o2++) {
      const a2 = 4 * (t3 * d + o2), r3 = a2, i2 = v[a2], s2 = v[a2 + 1], h2 = v[a2 + 2], c2 = v[a2 + 3];
      if (w) {
        let t4 = false;
        if (y) t4 = s2 > 1.4 * i2 && s2 > 1.4 * h2 && s2 > 80;
        else if (b) t4 = h2 > 1.4 * i2 && h2 > 1.4 * s2 && h2 > 80;
        else if (null !== S) {
          const e2 = i2 - S.r, n3 = s2 - S.g, o3 = h2 - S.b;
          t4 = e2 * e2 + n3 * n3 + o3 * o3 <= E;
        }
        if (t4) {
          n2 += " ", j2 && (j2[r3] = 0, j2[r3 + 1] = 0, j2[r3 + 2] = 0, j2[r3 + 3] = 0);
          continue;
        }
      }
      j2 && (j2[r3] = i2, j2[r3 + 1] = s2, j2[r3 + 2] = h2, j2[r3 + 3] = c2);
      const l2 = 0.299 * i2 + 0.587 * s2 + 0.114 * h2, m2 = e.normalize ? (l2 - k) / A * 255 : l2, u3 = e.ditherStrength > 0 || H2 ? F(m2, e.brightness, e.contrast) : m2, M2 = e.ditherStrength > 0 ? R(u3, o2, t3, e.ditherStrength) : u3;
      if (H2) {
        n2 += (C ? 1 - M2 / 255 : M2 / 255) < 0.12 ? " " : H2[(t3 * f + o2) % H2.length];
      } else e.ditherStrength <= 0 ? n2 += L2[Math.max(0, Math.min(255, 0 | m2))] : n2 += et(M2, I, C);
    }
    W.push(n2);
  }
  return { rows: W, cols: f, rowCount: m, colors: j2 };
}

return {options:r,convert:lt,dispose(){if(V){V.width=1;V.height=1;}V=null;Y=null;J.clear();X.clear();u=new Float32Array(0);}};
}

// Local 5×7 bitmap alphabet. Each row is five bits, most significant bit on the left.
// Cyrillic forms are deliberately drawn, not transliterated or downloaded as a font.
const glyphs = {
  A: [14, 17, 17, 31, 17, 17, 17],
  B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14],
  D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31],
  F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 14],
  H: [17, 17, 17, 31, 17, 17, 17],
  I: [31, 4, 4, 4, 4, 4, 31],
  J: [7, 2, 2, 2, 18, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17],
  L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17],
  N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13],
  R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30],
  T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14],
  V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 27, 17],
  X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4],
  Z: [31, 1, 2, 4, 8, 16, 31],
  0: [14, 17, 19, 21, 25, 17, 14],
  1: [4, 12, 4, 4, 4, 4, 14],
  2: [14, 17, 1, 2, 4, 8, 31],
  3: [30, 1, 1, 14, 1, 1, 30],
  4: [2, 6, 10, 18, 31, 2, 2],
  5: [31, 16, 16, 30, 1, 1, 30],
  6: [14, 16, 16, 30, 17, 17, 14],
  7: [31, 1, 2, 4, 8, 8, 8],
  8: [14, 17, 17, 14, 17, 17, 14],
  9: [14, 17, 17, 15, 1, 1, 14],
  Б: [31, 16, 16, 30, 17, 17, 30],
  Г: [31, 16, 16, 16, 16, 16, 16],
  Д: [6, 10, 10, 10, 10, 31, 17],
  Ж: [21, 21, 14, 4, 14, 21, 21],
  З: [30, 1, 1, 14, 1, 1, 30],
  И: [17, 17, 19, 21, 25, 17, 17],
  Й: [10, 4, 17, 19, 21, 25, 17],
  Л: [7, 9, 9, 9, 9, 17, 17],
  П: [31, 17, 17, 17, 17, 17, 17],
  Ф: [4, 14, 21, 21, 21, 14, 4],
  Ц: [18, 18, 18, 18, 18, 31, 1],
  Ч: [17, 17, 17, 15, 1, 1, 1],
  Ш: [21, 21, 21, 21, 21, 21, 31],
  Щ: [21, 21, 21, 21, 21, 31, 1],
  Ъ: [24, 8, 8, 14, 9, 9, 14],
  Ы: [17, 17, 17, 29, 21, 21, 29],
  Ь: [16, 16, 16, 30, 17, 17, 30],
  Э: [14, 17, 1, 7, 1, 17, 14],
  Ю: [18, 21, 21, 29, 21, 21, 18],
  Я: [15, 17, 17, 15, 5, 9, 17],
  Ё: [10, 0, 31, 16, 30, 16, 31],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 12, 12],
  ",": [0, 0, 0, 0, 4, 4, 8],
  ":": [0, 12, 12, 0, 12, 12, 0],
  ";": [0, 12, 12, 0, 4, 4, 8],
  "!": [4, 4, 4, 4, 4, 0, 4],
  "?": [14, 17, 1, 2, 4, 0, 4],
  "-": [0, 0, 0, 31, 0, 0, 0],
  _: [0, 0, 0, 0, 0, 0, 31],
  "+": [0, 4, 4, 31, 4, 4, 0],
  "=": [0, 0, 31, 0, 31, 0, 0],
  "/": [1, 2, 2, 4, 8, 8, 16],
  "\\": [16, 8, 8, 4, 2, 2, 1],
  "(": [2, 4, 8, 8, 8, 4, 2],
  ")": [8, 4, 2, 2, 2, 4, 8],
  "[": [14, 8, 8, 8, 8, 8, 14],
  "]": [14, 2, 2, 2, 2, 2, 14],
  "<": [1, 2, 4, 8, 4, 2, 1],
  ">": [16, 8, 4, 2, 4, 8, 16],
  "|": [4, 4, 4, 4, 4, 4, 4],
  "·": [0, 0, 0, 4, 0, 0, 0],
  "%": [17, 2, 4, 4, 8, 16, 17],
  "#": [10, 10, 31, 10, 31, 10, 10],
  "@": [14, 17, 23, 21, 23, 16, 14],
  '"': [10, 10, 0, 0, 0, 0, 0],
  "'": [4, 4, 0, 0, 0, 0, 0],
};
const aliases = {
  А: "A",
  В: "B",
  Е: "E",
  К: "K",
  М: "M",
  Н: "H",
  О: "O",
  Р: "P",
  С: "C",
  Т: "T",
  У: "Y",
  Х: "X",
  "–": "-",
  "—": "-",
  "«": "<",
  "»": ">",
  "\n": " ",
  "\t": " ",
};

/** Cache at most 4096 source glyphs; render only a 7-row window of at most maxCells ASCII cells. Unknown glyphs become '?'. */
export function asciiTextRaster(text) {
  if (typeof text !== "string") throw new TypeError("Text must be a string");
  const letters = Array.from(text).slice(-4096),
    rows = [];
  let unsupported = 0;
  for (const character of letters) {
    const upper = character.toUpperCase();
    const key = aliases[upper] || upper;
    const glyph = glyphs[key];
    if (!glyph) unsupported++;
    rows.push(glyph || glyphs["?"]);
  }
  const period = Math.max(1, (rows.length + 3) * 6);
  return {
    unsupported,
    period,
    glyphCount: rows.length,
    /** Query one source bit with optional tracking; consumers may draw only the visible window. */
    pixel(column, row, spacing = 1) {
      const pitch = 5 + spacing;
      const glyph = rows[Math.floor(column / pitch)];
      const bit = column % pitch;
      return Boolean(
        glyph &&
        row >= 0 &&
        row < 7 &&
        bit < 5 &&
        glyph[row] & (1 << (4 - bit)),
      );
    },
    /** Draw a wrapping seven-row viewport; offset is measured in character cells. */
    render(offset, columns, ink = "#") {
      if (
        !Number.isFinite(offset) ||
        !Number.isInteger(columns) ||
        columns < 1 ||
        columns > 857 ||
        !["#", "@", "1"].includes(ink)
      )
        throw new RangeError("Use a bounded ASCII viewport");
      const start = ((Math.floor(offset) % period) + period) % period,
        result = [];
      for (let y = 0; y < 7; y++) {
        let line = "";
        for (let x = 0; x < columns; x++) {
          const column = (start + x) % period,
            glyph = rows[Math.floor(column / 6)],
            bit = column % 6;
          line += glyph && bit < 5 && glyph[y] & (1 << (4 - bit)) ? ink : " ";
        }
        result.push(line);
      }
      return result.join("\n");
    },
  };
}

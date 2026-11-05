export const asciiPatterns = Object.freeze(["flow", "rain", "noise"]);
export const asciiAnimations = Object.freeze([
  "none",
  "wave",
  "scan",
  "reveal",
]);
const ramps = Object.freeze({
  classic: " .:-=+*#%@",
  binary: " 01",
  detailed: " .,:;irsXA253hMHGS#9B&@",
});
const defaults = Object.freeze({
  pattern: "flow",
  animation: "none",
  textEffect: "shimmer",
  textWeight: "auto",
  textGap: 3,
  textRoughness: 0.3,
  textEdgeRoughness: 0,
  charset: "classic",
  seed: 42,
  fontSize: 14,
  density: 1,
  speed: 0.6,
  fps: 18,
  maxCells: 4800,
});

/** Validate a complete bounded configuration before publishing any part of an update. */
export function asciiOptions(previous = defaults, patch = {}) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch))
    throw new TypeError("ASCII options must be an object");
  for (const key of Object.keys(patch))
    if (!Object.hasOwn(defaults, key))
      throw new TypeError("Unknown ASCII option: " + key);
  const value = { ...previous, ...patch };
  if (!["auto", "thin", "regular", "bold"].includes(value.textWeight))
    throw new TypeError("Unknown text weight");
  if (!["none", "shimmer", "wave"].includes(value.textEffect))
    throw new TypeError("Unknown text effect");
  if (
    !asciiPatterns.includes(value.pattern) ||
    !asciiAnimations.includes(value.animation) ||
    !Object.hasOwn(ramps, value.charset)
  )
    throw new TypeError("Unknown ASCII pattern, animation or charset");
  for (const [key, min, max] of [
    ["fontSize", 10, 28],
    ["textGap", 2, 6],
    ["textRoughness", 0, 1],
    ["textEdgeRoughness", 0, 1],
    ["density", 0.5, 2],
    ["speed", 0.1, 2],
    ["fps", 4, 24],
    ["maxCells", 128, 6000],
    ["seed", 0, 4294967295],
  ]) {
    if (!Number.isFinite(value[key]) || value[key] < min || value[key] > max)
      throw new RangeError("Invalid ASCII " + key);
  }
  if (
    !Number.isInteger(value.textGap) ||
    !Number.isInteger(value.seed) ||
    !Number.isInteger(value.maxCells) ||
    !Number.isInteger(value.fps)
  )
    throw new RangeError("Seed, cells and fps must be integers");
  return value;
}

/** Fit a monospace grid into a bounded drawing budget, increasing glyph size on large surfaces. */
export function asciiGrid(width, height, options) {
  width = Math.max(1, Math.min(8192, Number.isFinite(width) ? width : 640));
  height = Math.max(1, Math.min(8192, Number.isFinite(height) ? height : 320));
  let font = Math.max(
    options.fontSize / options.density,
    width / (Math.min(240, options.maxCells) * 0.6),
    height / 150,
  );
  let columns = Math.max(1, Math.ceil(width / (font * 0.6))),
    rows = Math.max(1, Math.ceil(height / (font * 1.25)));
  if (columns * rows > options.maxCells) {
    font *= Math.sqrt((columns * rows) / options.maxCells) * 1.04;
    columns = Math.max(1, Math.ceil(width / (font * 0.6)));
    rows = Math.max(
      1,
      Math.min(
        Math.ceil(height / (font * 1.25)),
        Math.floor(options.maxCells / columns),
      ),
    );
  }
  return { columns, rows, font };
}

/** Reproducible spatial hash avoids random state and allocation in the character loop. */
function hash(x, y, seed) {
  let value = Math.imul(x ^ seed, 374761393) ^ Math.imul(y + seed, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

/** Bilinear value noise gives smooth flow; this is not a claim of exact upstream Perlin parity. */
function noise(x, y, seed) {
  const left = Math.floor(x),
    top = Math.floor(y),
    dx = x - left,
    dy = y - top;
  const sx = dx * dx * (3 - 2 * dx),
    sy = dy * dy * (3 - 2 * dy);
  const upper =
    hash(left, top, seed) * (1 - sx) + hash(left + 1, top, seed) * sx;
  const lower =
    hash(left, top + 1, seed) * (1 - sx) + hash(left + 1, top + 1, seed) * sx;
  return upper * (1 - sy) + lower * sy;
}

/** Rain geometry is constant down each column: compute it once per frame, not once per cell. */
function rainRows(options, grid, time, ramp) {
  const tails = new Float64Array(grid.columns);
  const heads = new Float64Array(grid.columns);
  const active = new Uint8Array(grid.columns);
  for (let x = 0; x < grid.columns; x++) {
    tails[x] = 4 + hash(x, 4, options.seed) * 12;
    heads[x] =
      (time * (3 + hash(x, 0, options.seed) * 5) +
        hash(x, 1, options.seed) * grid.rows * 3) %
      (grid.rows + tails[x] + 6);
    active[x] = hash(x, 99, options.seed) < 0.6;
  }
  const rows = [];
  for (let y = 0; y < grid.rows; y++) {
    let row = "";
    for (let x = 0; x < grid.columns; x++) {
      const distance = heads[x] - y;
      const value =
        active[x] && distance >= 0 && distance < tails[x]
          ? 1 - distance / tails[x]
          : 0;
      row +=
        ramp[Math.min(ramp.length - 1, Math.floor(value * (ramp.length - 1)))];
    }
    rows.push(row);
  }
  return rows;
}

/** Generate at most maxCells literal characters; time is elapsed seconds, never a wall-clock dependency. */
export function proceduralRows(options, grid, elapsed) {
  const ramp = ramps[options.charset],
    rows = [],
    time = elapsed * options.speed;
  if (options.pattern === "rain") return rainRows(options, grid, time, ramp);
  for (let y = 0; y < grid.rows; y++) {
    let row = "";
    for (let x = 0; x < grid.columns; x++) {
      let value;
      if (options.pattern === "flow")
        value =
          0.7 *
            noise(
              x * 0.14 + time * 0.32,
              y * 0.18 - time * 0.13,
              options.seed,
            ) +
          0.3 *
            noise(
              x * 0.3 - time * 0.16,
              y * 0.35 + time * 0.1,
              options.seed + 71,
            );
      else value = hash(x, y + Math.floor(time * 3) * 251, options.seed);

      row +=
        ramp[Math.min(ramp.length - 1, Math.floor(value * (ramp.length - 1)))];
    }
    rows.push(row);
  }
  return rows;
}

/** Animate real media rows with bounded displacement/highlight/reveal; reduced motion bypasses this function. */
export function animateAsciiRows(rows, animation, elapsed) {
  if (animation === "none") return rows;
  const result = [],
    scan = Math.floor(elapsed * 5) % (rows.length + 1),
    progress = Math.min(1, (elapsed % 8) / 2.4);
  for (let y = 0; y < rows.length; y++) {
    let row = rows[y];
    if (animation === "wave") {
      const shift = Math.max(
        -row.length,
        Math.min(
          row.length,
          Math.round(Math.sin(y * 0.16 + elapsed * 1.2) * 2),
        ),
      );
      if (shift > 0) row = " ".repeat(shift) + row.slice(0, -shift);
      else if (shift < 0) row = row.slice(-shift) + " ".repeat(-shift);
    } else if (animation === "scan" && Math.abs(y - scan) <= 1)
      row = row.replace(/[^ ]/g, "@");
    else if (animation === "reveal" && y >= rows.length * progress)
      row = " ".repeat(row.length);
    result.push(row);
  }
  return result;
}

/** Keep a literal, single-line stream tail bounded by Unicode code points; no markup or control sequences execute. */
export function appendAsciiText(previous, chunk) {
  if (typeof chunk !== "string")
    throw new TypeError("Text chunk must be a string");
  const tail = chunk.slice(-8192).replace(/[\u0000-\u001f\u007f]/g, " ");
  return Array.from(previous + tail)
    .slice(-4096)
    .join("");
}
export function asciiCharset(name) {
  return ramps[name];
}

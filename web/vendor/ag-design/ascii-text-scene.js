import { asciiGrid, proceduralRows } from "./ascii-patterns.js";

/** Keep letter cells legible within the same bounded grid as their surrounding field. */
function textGrid(width, height, options) {
  return asciiGrid(width, height, {
    ...options,
    fontSize: Math.max(7, options.fontSize * 0.6),
  });
}

/** Build only visible letter pixels. Wider tracking keeps bold strokes from joining adjacent glyphs. */
function letterMask(raster, grid, options, time) {
  const { columns, rows } = grid;
  const scaleY = rows >= 26 ? 2 : 1;
  const scaleX = options.textWeight === "thin" ? 1 : scaleY;
  const period = Math.max(1, (raster.glyphCount + 3) * 8 * scaleX);
  const travel = (time * options.speed * 28) / (grid.font * 0.6);
  const offset = Math.floor(travel) % period;
  const top = Math.floor((rows - 7 * scaleY) / 2);
  const mask = new Uint8Array(columns * rows);
  for (let x = 0; x < columns; x++) {
    const sourceX = Math.floor(((x + offset) % period) / scaleX);
    // The mask follows the same column wave as the letters, so the clearance cannot lag behind.
    const sway =
      options.textEffect !== "wave"
        ? 0
        : Math.round(Math.sin(x * 0.025 + time * 0.75) * 0.65);
    for (let y = 0; y < 7 * scaleY; y++) {
      const targetY = top + y + sway;
      if (
        targetY >= 0 &&
        targetY < rows &&
        raster.pixel(sourceX, Math.floor(y / scaleY), 3)
      )
        mask[targetY * columns + x] = 1;
    }
  }
  if (
    options.textWeight === "bold" ||
    (options.textWeight === "auto" && scaleY === 1)
  ) {
    const original = mask.slice();
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < columns; x++) {
        const index = y * columns + x;
        if (original[index]) continue;
        if (
          (x > 0 && original[index - 1]) ||
          (x + 1 < columns && original[index + 1])
        )
          mask[index] = 1;
      }
  }
  roughenLetters(mask, columns, rows, offset, options);
  return { mask, fraction: travel % 1, scaleY };
}

/** Optional letter fringe preserves every solid pixel and only adds immediate neighbors. */
function roughenLetters(mask, columns, rows, offset, options) {
  if (!options.textEdgeRoughness) return;
  const solid = mask.slice();
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < columns; x++) {
      const index = y * columns + x;
      if (solid[index]) continue;
      const touches =
        (x > 0 && solid[index - 1]) ||
        (x + 1 < columns && solid[index + 1]) ||
        (y > 0 && solid[index - columns]) ||
        (y + 1 < rows && solid[index + columns]);
      const grain =
        (Math.sin((x + offset) * 12.9898 + y * 78.233 + options.seed) *
          43758.5453) %
        1;
      if (touches && Math.abs(grain) < options.textEdgeRoughness * 0.4)
        mask[index] = 2;
    }
}

/** Perturb only the field boundary; letter geometry and its solid ink remain independent. */
function boundaryRoughness(x, y, options) {
  let hash =
    Math.imul(Math.floor(x / 2) + options.seed, 374761393) ^
    Math.imul(Math.floor(y / 2) + 71, 668265263);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  const grain = ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
  return Math.floor(grain * options.textRoughness * 5);
}

/** Chebyshev distance in two linear passes gives a true cell-sized moat around each visible stroke, including holes. */
function contourDistance(mask, columns, rows) {
  const distance = new Uint16Array(mask.length).fill(65500);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < columns; x++) {
      const index = y * columns + x;
      if (mask[index]) {
        distance[index] = 0;
        continue;
      }
      let nearest = distance[index];
      if (x) nearest = Math.min(nearest, distance[index - 1] + 1);
      if (y) {
        nearest = Math.min(nearest, distance[index - columns] + 1);
        if (x) nearest = Math.min(nearest, distance[index - columns - 1] + 1);
        if (x + 1 < columns)
          nearest = Math.min(nearest, distance[index - columns + 1] + 1);
      }
      distance[index] = nearest;
    }
  for (let y = rows - 1; y >= 0; y--)
    for (let x = columns - 1; x >= 0; x--) {
      const index = y * columns + x;
      let nearest = distance[index];
      if (x + 1 < columns) nearest = Math.min(nearest, distance[index + 1] + 1);
      if (y + 1 < rows) {
        nearest = Math.min(nearest, distance[index + columns] + 1);
        if (x) nearest = Math.min(nearest, distance[index + columns - 1] + 1);
        if (x + 1 < columns)
          nearest = Math.min(nearest, distance[index + columns + 1] + 1);
      }
      distance[index] = nearest;
    }
  return distance;
}

/** Hint at flow tangential to the contour; the guarded zone itself always stays empty. */
function contourSymbol(distance, index, x, y, columns, rows) {
  const dx =
    x > 0 && x + 1 < columns ? distance[index + 1] - distance[index - 1] : 0;
  const dy =
    y > 0 && y + 1 < rows
      ? distance[index + columns] - distance[index - columns]
      : 0;
  if (Math.abs(dx) > Math.abs(dy)) return "|";
  if (Math.abs(dy) > Math.abs(dx)) return "-";
  return dx * dy > 0 ? "/" : "\\";
}

/** Compose two aligned ASCII layers in O(maxCells). No full stream bitmap, DOM, font or frame owner is allocated here. */
export function asciiTextScene(raster, options, width, height, time = 0) {
  const grid = textGrid(width, height, options);
  const { columns, rows } = grid;
  const { mask, fraction, scaleY } = letterMask(raster, grid, options, time);
  const distance = contourDistance(mask, columns, rows);
  const field = proceduralRows(options, grid, time);
  const foreground = [],
    background = [];
  const ink =
    options.charset === "binary"
      ? "111"
      : options.textWeight === "thin"
        ? ":+*"
        : "#%@";
  for (let y = 0; y < rows; y++) {
    let front = "",
      back = "";
    for (let x = 0; x < columns; x++) {
      const index = y * columns + x;
      // Empty cells have no ink to shimmer; keep the exact density calculation for solid pixels.
      if (mask[index] === 2) front += options.charset === "binary" ? "1" : "+";
      else if (mask[index]) {
        const shimmer =
          options.textEffect === "none"
            ? 1
            : (Math.sin(x * 0.11 + y * 0.18 - time * 1.15) + 1) / 2;
        front +=
          ink[Math.min(ink.length - 1, Math.floor(shimmer * ink.length))];
      } else front += " ";
      // Outside the widest possible contour, roughness cannot affect the answer.
      const minimumGap = options.textGap + 1;
      if (distance[index] <= minimumGap) back += " ";
      else if (distance[index] > minimumGap + 7) back += field[y][x];
      else {
        const clearance = minimumGap + boundaryRoughness(x, y, options);
        if (distance[index] <= clearance) back += " ";
        else if (distance[index] <= clearance + 2 && field[y][x] !== " ")
          back += contourSymbol(distance, index, x, y, columns, rows);
        else back += field[y][x];
      }
    }
    foreground.push(front);
    background.push(back);
  }
  return { grid, foreground, background, fraction, scale: scaleY };
}

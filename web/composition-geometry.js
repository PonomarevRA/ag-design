/** Index explicit parent relationships. Geometric containment never invents a semantic group. */
export function hierarchy(document) {
  const byId = new Map(document.nodes.map(node => [node.id, node]));
  const children = new Map([[null, []]]);
  for (const node of document.nodes) {
    if (!children.has(node.parentId)) children.set(node.parentId, []);
    children.get(node.parentId).push(node.id);
  }
  return {byId, children};
}

/** Resolve bounded ancestry in parent-first order, including the selected node. */
export function ancestry(document, id) {
  const {byId} = hierarchy(document), result = [], seen = new Set();
  while (id && byId.has(id) && !seen.has(id) && result.length <= 16) {
    seen.add(id); result.unshift(id); id = byId.get(id).parentId;
  }
  return result;
}

/** Measure a deliberately selected pair in unscaled viewport CSS pixels, including distant pairs. */
export function pairGeometry(a, b) {
  if (!a || !b) return null;
  const dx = Math.max(0, b.x - a.x - a.width, a.x - b.x - b.width);
  const dy = Math.max(0, b.y - a.y - a.height, a.y - b.y - b.height);
  const centerX = b.x + b.width / 2 - a.x - a.width / 2;
  const centerY = b.y + b.height / 2 - a.y - a.height / 2;
  const intersectionWidth = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const intersectionHeight = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return {dx, dy, edgeDistance: Math.hypot(dx, dy), centerDistance: Math.hypot(centerX, centerY),
    heightDelta: b.height - a.height, leftDelta: b.x - a.x,
    rightDelta: b.x + b.width - a.x - a.width, centerDelta: centerX,
    topDelta: b.y - a.y, bottomDelta: b.y + b.height - a.y - a.height,
    middleDelta: centerY, intersectionArea: intersectionWidth * intersectionHeight};
}

/** Describe adjacent declared siblings only; this is a bounded summary rather than an all-pairs scan. */
export function siblingGaps(nodes, rectangles, axis = "x") {
  const rows = [];
  for (const node of nodes) {
    const rect = rectangles.get(node.id);
    if (rect) rows.push({id: node.id, rect});
  }
  rows.sort((a, b) => a.rect[axis] - b.rect[axis] || a.id.localeCompare(b.id));
  const values = [];
  for (let index = 1; index < rows.length; index++) {
    const previous = rows[index - 1].rect, current = rows[index].rect;
    values.push(current[axis] - previous[axis] - previous[axis === "x" ? "width" : "height"]);
  }
  if (!values.length) return {count: 0, min: null, max: null, spread: null, values};
  const min = Math.min(...values), max = Math.max(...values);
  return {count: values.length, min, max, spread: max - min, values};
}

/** Abstract graph coordinates are for navigation only and never feed geometry measurements. */
export function semanticPositions(document) {
  const result = new Map(), counters = new Map();
  for (const node of document.nodes) {
    const depth = ancestry(document, node.id).length - 1;
    const row = counters.get(depth) || 0;
    counters.set(depth, row + 1);
    result.set(node.id, {x: depth * 220 + 24, y: row * 84 + 24, width: 196, height: 60});
  }
  return result;
}

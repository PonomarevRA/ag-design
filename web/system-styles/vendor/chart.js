// packages/visual-tools/chart-axis.js
var day = 864e5;
var dateLimit = 864e13;
function axisDateValues(labels, explicit) {
  if (explicit === false) return null;
  if (explicit !== void 0) {
    if (!Array.isArray(explicit) || explicit.length !== labels.length)
      throw new TypeError("One axis date per label required");
    for (const value of explicit)
      if (!Number.isFinite(value) || Math.abs(value) > dateLimit)
        throw new RangeError(
          "Axis dates must be epoch milliseconds in the Date range"
        );
    return [...explicit];
  }
  if (!labels.length) return null;
  const values = [];
  for (const label of labels) {
    if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(
      label
    ))
      return null;
    const value = Date.parse(label);
    const calendar = Date.parse(label.slice(0, 10));
    if (!Number.isFinite(value) || !Number.isFinite(calendar) || new Date(calendar).toISOString().slice(0, 10) !== label.slice(0, 10))
      return null;
    values.push(value);
  }
  return values;
}
function timeAxisUnit(values) {
  let step = Infinity;
  for (let i = 1; i < values.length; i++) {
    const delta = Math.abs(values[i] - values[i - 1]);
    if (delta > 0) step = Math.min(step, delta);
  }
  if (!Number.isFinite(step)) return "day";
  if (step >= 330 * day) return "year";
  if (step >= 28 * day) return "month";
  if (step >= day) return "day";
  if (step >= 6e4) return "minute";
  if (step >= 1e3) return "second";
  return "millisecond";
}
function tickFormatter(values, { locale = "ru-RU", timeZone = "UTC", unit = "auto" } = {}) {
  const granularity = unit === "auto" ? timeAxisUnit(values) : unit;
  if (!["year", "month", "day", "minute", "second", "millisecond"].includes(
    granularity
  ))
    throw new TypeError("Unknown time-axis unit");
  const date = new Intl.DateTimeFormat(locale, {
    timeZone,
    calendar: "gregory",
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
  const clock = new Intl.DateTimeFormat(locale, {
    timeZone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    ...granularity === "second" || granularity === "millisecond" ? { second: "2-digit" } : {},
    ...granularity === "millisecond" ? { fractionalSecondDigits: 3 } : {}
  });
  const offset = new Intl.DateTimeFormat("en", {
    timeZone,
    timeZoneName: "shortOffset"
  });
  function parts(value) {
    const result = {};
    for (const part of date.formatToParts(value))
      result[part.type] = part.value;
    return result;
  }
  return (value, previous) => {
    if (!Number.isFinite(value) || Math.abs(value) > dateLimit)
      throw new RangeError("Valid epoch milliseconds required");
    const current = parts(value), before = previous === void 0 ? null : parts(previous);
    const yearChanged = !before || current.year !== before.year;
    const monthChanged = yearChanged || current.month !== before.month;
    const dayChanged = monthChanged || current.day !== before.day;
    let label, context = "";
    if (granularity === "year") label = current.year;
    else if (granularity === "month") {
      label = current.month;
      if (yearChanged) context = current.year;
    } else if (granularity === "day") {
      label = current.day;
      context = [
        monthChanged ? current.month : "",
        yearChanged ? current.year : ""
      ].filter(Boolean).join(" ");
    } else {
      label = clock.format(value);
      if (dayChanged)
        context = [
          current.day,
          monthChanged ? current.month : "",
          yearChanged ? current.year : ""
        ].filter(Boolean).join(" ");
      if (before && label === clock.format(previous) && value !== previous) {
        const zone = offset.formatToParts(value).find((part) => part.type === "timeZoneName").value;
        label += " " + zone;
      }
    }
    return {
      value,
      label,
      context,
      lines: context ? [label, context] : [label],
      fullLabel: new Date(value).toISOString()
    };
  };
}
function placeTick(tick, position, left, right, measure) {
  const placed = [];
  for (const line of tick.lines) {
    const width = measure(line);
    if (!Number.isFinite(width) || width > right - left) return null;
    const start = Math.max(left, Math.min(position - width / 2, right - width));
    placed.push({ x: start + width / 2, start, end: start + width });
  }
  const main = placed[0], context = placed[1] || main;
  return {
    ...tick,
    x: main.x,
    contextX: context.x,
    position,
    anchor: "middle",
    start: Math.min(main.start, context.start),
    end: Math.max(main.end, context.end)
  };
}
function layoutAxisTicks({
  values,
  labels = [],
  positions,
  left,
  right,
  measure = (text) => Array.from(text).length * 8,
  gap = 12,
  singleLine = false,
  ...options
}) {
  if (!Array.isArray(positions) || positions.length > 4096 || !Number.isFinite(left) || !Number.isFinite(right) || right < left || !Number.isFinite(gap) || gap < 0)
    throw new RangeError(
      "Bounded positions, finite bounds and a nonnegative gap required"
    );
  if (values && values.length !== positions.length || !values && labels.length !== positions.length)
    throw new RangeError("One date or label per position required");
  for (let i = 0; i < positions.length; i++)
    if (!Number.isFinite(positions[i]) || i > 0 && positions[i] < positions[i - 1])
      throw new RangeError("Finite ascending tick positions required");
  const format = values ? tickFormatter(values, options) : null;
  const result = [];
  for (let index = 0; index < positions.length; index++) {
    while (true) {
      const previous = result.at(-1);
      const tick = format ? format(values[index], previous ? values[previous.index] : void 0) : {
        label: labels[index],
        context: "",
        lines: [labels[index]],
        fullLabel: labels[index]
      };
      if (singleLine && tick.context)
        tick.lines = [tick.label + " " + tick.context];
      const placed = placeTick(tick, positions[index], left, right, measure);
      if (!placed) break;
      if (previous && placed.start < previous.end + gap) {
        if (index === positions.length - 1 && result.length > 1) {
          result.pop();
          continue;
        }
        break;
      }
      result.push({ ...placed, index });
      break;
    }
  }
  return result;
}
function axisPointLabel(labels, index, explicit) {
  const label = labels[index];
  return Array.isArray(explicit) ? label + " \xB7 " + new Date(explicit[index]).toISOString() : label;
}

// packages/visual-tools/chart-axis-svg.js
function bindSvgAxisLabels(svg, labels, explicit, { left, right, width, minFont = 12, unit = "auto", onLayout } = {}) {
  const view = svg.ownerDocument.defaultView;
  const entries = [...svg.querySelectorAll("[data-axis-index]")];
  const values = axisDateValues(labels, explicit);
  const probe = entries[0];
  const container = svg.parentElement;
  const originalOverflow = container?.style.overflow || "";
  const originalMargin = container?.style.marginBlockEnd || "";
  const originalSvgOverflow = svg.style.overflow;
  function resize() {
    if (!probe) return;
    const actualWidth = svg.getBoundingClientRect().width || width;
    const scale = actualWidth / width;
    const rootScale = (parseFloat(
      view.getComputedStyle(svg.ownerDocument.documentElement).fontSize
    ) || 16) / 16;
    const parentFont = parseFloat(view.getComputedStyle(svg.parentElement || svg).fontSize) || 14;
    const font = Math.max(minFont * rootScale, parentFont * 0.75) / scale;
    const family = view.getComputedStyle(container || svg).fontFamily;
    for (const entry of entries) {
      entry.style.fontSize = font + "px";
      entry.style.fontFamily = family;
      entry.style.fill = "var(--ag-text)";
    }
    const measure = (text) => {
      probe.textContent = text;
      const measured = probe.getComputedTextLength?.();
      return measured > 0 ? measured : Array.from(text).length * font * 0.7;
    };
    probe.style.display = "";
    const positions = entries.map((entry) => Number(entry.dataset.axisX));
    const ticks = layoutAxisTicks({
      values,
      labels,
      positions,
      left,
      right,
      measure,
      gap: 12 / scale,
      unit
    });
    const retained = new Map(ticks.map((tick) => [tick.index, tick]));
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i], tick = retained.get(i);
      entry.replaceChildren();
      entry.style.display = tick ? "" : "none";
      if (!tick) continue;
      entry.setAttribute("x", tick.x);
      entry.setAttribute("text-anchor", tick.anchor);
      for (let line = 0; line < tick.lines.length; line++) {
        const span = svg.ownerDocument.createElementNS(
          svg.namespaceURI,
          "tspan"
        );
        span.setAttribute("x", line ? tick.contextX : tick.x);
        span.setAttribute("dy", line ? "1.1em" : "0");
        span.textContent = tick.lines[line];
        entry.append(span);
      }
    }
    onLayout?.(ticks);
    const svgBox = svg.getBoundingClientRect();
    let extra = 0;
    for (const entry of entries) {
      if (entry.style.display === "none") continue;
      extra = Math.max(
        extra,
        entry.getBoundingClientRect().bottom - svgBox.bottom
      );
    }
    if (container) {
      container.style.overflow = extra > 0 ? "visible" : originalOverflow;
      container.style.marginBlockEnd = extra > 0 ? Math.ceil(extra + 4) + "px" : originalMargin;
      svg.style.overflow = extra > 0 ? "visible" : originalSvgOverflow;
      svg.dataset.axisExtraSpace = String(extra > 0 ? Math.ceil(extra + 4) : 0);
    }
  }
  const observer = view.ResizeObserver ? new view.ResizeObserver(resize) : null;
  observer?.observe(svg);
  const typography = view.MutationObserver ? new view.MutationObserver(resize) : null;
  typography?.observe(svg.ownerDocument.documentElement, {
    attributes: true,
    attributeFilter: ["style", "class"]
  });
  svg.ownerDocument.fonts?.addEventListener("loadingdone", resize);
  resize();
  return () => {
    observer?.disconnect();
    typography?.disconnect();
    if (container) {
      container.style.overflow = originalOverflow;
      container.style.marginBlockEnd = originalMargin;
    }
    svg.style.overflow = originalSvgOverflow;
    svg.ownerDocument.fonts?.removeEventListener("loadingdone", resize);
  };
}

// packages/visual-tools/chart-ascii-radial.js
var TAU = Math.PI * 2;
function insideAsciiSector(region, x, y, size) {
  const radius = Math.hypot(x - region.x, y - region.y);
  if (radius < region.inner || radius > region.radius) return false;
  const span = region.end - region.start;
  if (span >= TAU - 1e-8) return true;
  const delta = ((Math.atan2(y - region.y, x - region.x) - region.start) % TAU + TAU) % TAU;
  if (delta > span) return false;
  const clearance = Math.min(size * 0.2, radius * span * 0.15);
  const sideDistance = radius * Math.sin(Math.min(delta, span - delta, Math.PI / 2));
  return sideDistance >= clearance;
}
function sectorSelectionTransform(region) {
  const whole = region.end - region.start >= TAU - 1e-8;
  const angle = (region.start + region.end) / 2;
  return {
    x: region.x,
    y: region.y,
    scale: 1.045,
    dx: whole ? 0 : Math.cos(angle) * 4,
    dy: whole ? 0 : Math.sin(angle) * 4
  };
}
function selectedSectorPoint(region, x, y) {
  const t = sectorSelectionTransform(region);
  return {
    x: t.x + (x - t.x) * t.scale + t.dx,
    y: t.y + (y - t.y) * t.scale + t.dy
  };
}
function prepareAsciiRadialFlow(target, size) {
  if (!target.sector) return null;
  const sector = target.sector, dx = target.x - sector.x, dy = target.y - sector.y;
  const radius = Math.hypot(dx, dy), angle = (sector.start + sector.end) / 2;
  return {
    radius,
    ux: radius ? dx / radius : Math.cos(angle),
    uy: radius ? dy / radius : Math.sin(angle),
    inner: Math.max(0, sector.inner - size * 0.8),
    outer: sector.radius + size * 0.35,
    fade: Math.max(1, size * 0.45)
  };
}
function asciiRadialFlowRadius(flow, phase) {
  const span = flow.outer - flow.inner;
  return flow.outer - (flow.outer - flow.radius + phase * 2.8) % span;
}
function asciiRadialFlowOpacity(flow, radius) {
  return Math.max(
    0,
    Math.min(
      1,
      (flow.outer - radius) / flow.fade,
      (radius - flow.inner) / flow.fade
    )
  );
}

// packages/visual-tools/chart-particle-targets.js
var TAU2 = Math.PI * 2;
function particleRandom(seed = 731) {
  return () => {
    seed = Math.imul(seed, 1664525) + 1013904223 >>> 0;
    return seed / 4294967296;
  };
}
function regionWeight(region) {
  if (region.kind === "rect")
    return Math.sqrt(region.width * region.height) * 3;
  if (region.kind === "disk") return region.radius * 8;
  if (region.kind === "sector")
    return (region.end - region.start) * (region.radius ** 2 - region.inner ** 2) / 110;
  const points = region.points;
  let length = 0;
  for (let i = 1; i < points.length; i++)
    length += Math.hypot(
      points[i].x - points[i - 1].x,
      points[i].y - points[i - 1].y
    );
  return Math.max(8, length) * (region.kind === "polygon" ? 2.5 : 1);
}
function insidePolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i], b = points[j];
    if (a.y > y !== b.y > y && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x)
      inside = !inside;
  }
  return inside;
}
function linePoint(region, random) {
  const points = region.edge || region.points;
  const { lengths, total } = region.lineMeasure;
  let distance = random() * total;
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const a = points[i], b = points[i + 1], t = lengths[i] ? distance / lengths[i] : 0;
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        index: t < 0.5 ? a.index : b.index
      };
    }
    distance -= lengths[i];
  }
  return points[0];
}
function polygonBounds(region) {
  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
  for (const p of region.points) {
    left = Math.min(left, p.x);
    right = Math.max(right, p.x);
    top = Math.min(top, p.y);
    bottom = Math.max(bottom, p.y);
  }
  return { left, right, top, bottom };
}
function regionPoint(region, random, bounds) {
  if (region.kind === "rect")
    return {
      x: region.x + random() * region.width,
      y: region.y + random() * region.height
    };
  if (region.kind === "disk" || region.kind === "sector") {
    const inner = region.inner || 0;
    const radius = Math.sqrt(
      inner ** 2 + random() * (region.radius ** 2 - inner ** 2)
    );
    const gap = region.kind === "sector" ? Math.min(0.015, (region.end - region.start) / 8) : 0;
    const angle = region.kind === "sector" ? region.start + gap + random() * (region.end - region.start - gap * 2) : random() * TAU2;
    return {
      x: region.x + Math.cos(angle) * radius,
      y: region.y + Math.sin(angle) * radius
    };
  }
  if (region.kind === "line") return linePoint(region, random);
  for (let attempt = 0; attempt < 40; attempt++) {
    const x = bounds.left + random() * (bounds.right - bounds.left), y = bounds.top + random() * (bounds.bottom - bounds.top);
    if (insidePolygon(x, y, region.points)) return { x, y };
  }
  return linePoint(region, random);
}
function sampleParticleTargets(regions, options = {}) {
  const random = particleRandom(), result = [];
  const weights = regions.map(regionWeight), total = weights.reduce((a, b) => a + b, 0);
  if (!total) return result;
  const budget = Math.min(
    16e3,
    options.particleCount ?? 12e3,
    Math.round(8e3 * (options.particleDensity ?? 1))
  );
  let remaining = budget, remainingWeight = total;
  for (let ri = 0; ri < regions.length; ri++) {
    const region = { ...regions[ri] }, weight = weights[ri];
    let count = remainingWeight ? Math.round(remaining * weight / remainingWeight) : 0;
    if (region.kind === "line" && region.points.length === 1)
      count = Math.min(count, 12);
    remaining -= count;
    remainingWeight -= weight;
    if (region.points) {
      const points = region.edge || region.points, lengths = [];
      let total2 = 0;
      for (let i = 1; i < points.length; i++) {
        const length = Math.hypot(
          points[i].x - points[i - 1].x,
          points[i].y - points[i - 1].y
        );
        lengths.push(length);
        total2 += length;
      }
      region.lineMeasure = { lengths, total: total2 };
    }
    const bounds = region.kind === "polygon" ? polygonBounds(region) : null;
    for (let i = 0; i < count; i++) {
      const point = regionPoint(region, random, bounds);
      if (!point) continue;
      result.push({
        ...point,
        interior: region.kind !== "line",
        color: region.color,
        series: region.series,
        index: region.index ?? point.index,
        r: (options.particleSize ?? 0.7) * (0.65 + random() * 0.65),
        alpha: region.kind === "polygon" ? 0.42 : 0.86,
        phase: random() * TAU2
      });
    }
  }
  return result;
}

// packages/visual-tools/chart-ascii-targets.js
var asciiChartCharsets = Object.freeze({
  classic: ".:+*#@",
  binary: "01",
  braille: "\u2802\u2804\u2806\u2812\u2836\u2876\u28F6\u28FF"
});
function asciiChartTargets(regions, options = {}) {
  const size = options.asciiFontSize ?? 10;
  const dx = size * 0.65, dy = size;
  const samples = sampleParticleTargets(regions, {
    particleDensity: 2,
    particleCount: 12e3
  });
  const sectors = /* @__PURE__ */ new Map();
  for (const region of regions)
    if (region.kind === "sector")
      sectors.set(`${region.series}:${region.index}`, region);
  const cells = /* @__PURE__ */ new Map();
  for (const p of samples) {
    const column = Math.round(p.x / dx), row = Math.round(p.y / dy);
    const sector = sectors.get(`${p.series}:${p.index}`);
    if (sector && !insideAsciiSector(sector, column * dx, row * dy, size))
      continue;
    const key = sector ? `${p.series}:${p.index}:${column}:${row}` : `${p.series}:${column}:${row}`;
    const previous = cells.get(key);
    if (previous && (!previous.interior || p.interior)) continue;
    const glyph = Math.abs(
      Math.imul(column + 17, 731) ^ Math.imul(row + 3, 971)
    );
    let alpha = p.interior ? 0.5 : 0.95;
    if (sector) alpha = 0.78;
    cells.set(key, {
      ...p,
      x: column * dx,
      y: row * dy,
      r: size / 2,
      glyph,
      alpha,
      ...sector ? { sector } : {}
    });
  }
  const candidates = [...cells.values()], limit = options.asciiMaxCells ?? 2400;
  if (candidates.length <= limit) return candidates;
  const result = [];
  for (let i = 0; i < limit; i++)
    result.push(candidates[Math.floor(i * candidates.length / limit)]);
  return result;
}

// packages/visual-tools/chart-ascii-selection.js
var ns = "http://www.w3.org/2000/svg";
function asciiSelectionPoints(shape, scene, size = 10) {
  const result = [], seen = /* @__PURE__ */ new Set(), spacing = Math.max(4, size * 0.8);
  const value = (name) => Number(shape.getAttribute(name));
  function add(x, y) {
    const key = x.toFixed(2) + ":" + y.toFixed(2);
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
    }
  }
  function line(ax, ay, bx, by) {
    const steps = Math.max(
      1,
      Math.ceil(Math.hypot(bx - ax, by - ay) / spacing)
    );
    for (let i = 0; i <= steps; i++)
      add(ax + (bx - ax) * i / steps, ay + (by - ay) * i / steps);
  }
  function arc(cx, cy, r, start, end) {
    const steps = Math.max(1, Math.ceil(Math.abs(end - start) * r / spacing));
    for (let i = 0; i <= steps; i++) {
      const angle = start + (end - start) * i / steps;
      add(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    }
  }
  const region = scene.regions.find(
    (r) => r.kind === "sector" && r.index === value("data-point") && r.series === value("data-series")
  );
  if (region) {
    arc(region.x, region.y, region.radius, region.start, region.end);
    if (region.inner)
      arc(region.x, region.y, region.inner, region.end, region.start);
    if (region.end - region.start < Math.PI * 2 - 1e-8)
      for (const a of [region.start, region.end])
        line(
          region.x + Math.cos(a) * region.inner,
          region.y + Math.sin(a) * region.inner,
          region.x + Math.cos(a) * region.radius,
          region.y + Math.sin(a) * region.radius
        );
    for (let i = 0; i < result.length; i++)
      result[i] = selectedSectorPoint(region, result[i].x, result[i].y);
  } else if (shape.tagName.toLowerCase() === "rect") {
    const x = value("x"), y = value("y"), right = x + value("width"), bottom = y + value("height");
    line(x, y, right, y);
    line(right, y, right, bottom);
    line(right, bottom, x, bottom);
    line(x, bottom, x, y);
  } else if (shape.tagName.toLowerCase() === "circle")
    arc(value("cx"), value("cy"), value("r") + size * 0.45, 0, Math.PI * 2);
  if (result.length <= 192) return result;
  const bounded = [];
  for (let i = 0; i < 192; i++)
    bounded.push(result[Math.floor(i * result.length / 192)]);
  return bounded;
}
function asciiSelectionShape(document, shape, { scene, options }) {
  const size = options.asciiFontSize ?? 10, points = asciiSelectionPoints(shape, scene, size);
  if (!points.length) return null;
  const chars = Array.from(
    asciiChartCharsets[options.asciiCharset ?? "classic"]
  );
  const text = document.createElementNS(ns, "text");
  const attrs = {
    class: "ag-vt-chart__selected ag-vt-chart__selected--ascii",
    "data-ascii-selection": "true",
    x: points.map((p) => p.x).join(" "),
    y: points.map((p) => p.y).join(" "),
    fill: "var(--ag-text)",
    stroke: "none",
    "font-family": "ui-monospace, SFMono-Regular, Consolas, monospace",
    "font-size": size * 0.9,
    "text-anchor": "middle",
    "dominant-baseline": "central"
  };
  for (const [key, value] of Object.entries(attrs))
    text.setAttribute(key, String(value));
  text.textContent = chars[Math.max(0, chars.length - 2)].repeat(points.length);
  return text;
}
function asciiSectorBoundaries(document, scene, svg) {
  const sectors = scene.regions.filter((r) => r.kind === "sector");
  if (!sectors.length) return null;
  const group = document.createElementNS(ns, "g");
  group.setAttribute("class", "ag-vt-chart__sector-boundaries");
  const marks = /* @__PURE__ */ new Map();
  for (const shape of svg.querySelectorAll("[data-point]"))
    marks.set(
      `${shape.getAttribute("data-series")}:${shape.getAttribute("data-point")}`,
      shape
    );
  for (const region of sectors) {
    const shape = marks.get(`${region.series}:${region.index}`);
    if (!shape) continue;
    const copy = shape.cloneNode(false);
    for (const key of ["data-point", "data-series", "data-selected"])
      copy.removeAttribute(key);
    for (const [key, value] of Object.entries({
      fill: "none",
      stroke: "var(--ag-chart-radial-boundary, var(--ag-text))",
      "stroke-width": 0.9,
      "stroke-opacity": 1,
      "stroke-dasharray": "none",
      "stroke-linejoin": "round",
      "vector-effect": "non-scaling-stroke"
    }))
      copy.setAttribute(key, String(value));
    const halo = copy.cloneNode(false);
    halo.setAttribute(
      "stroke",
      "var(--ag-chart-radial-halo, var(--ag-surface))"
    );
    halo.setAttribute("stroke-width", "2.9");
    group.append(halo, copy);
    if (shape.tagName.toLowerCase() === "circle" && region.inner) {
      const inner = copy.cloneNode(false);
      inner.setAttribute("r", String(region.inner));
      const innerHalo = inner.cloneNode(false);
      innerHalo.setAttribute(
        "stroke",
        "var(--ag-chart-radial-halo, var(--ag-surface))"
      );
      innerHalo.setAttribute("stroke-width", "2.9");
      group.append(innerHalo, inner);
    }
  }
  return group;
}

// packages/visual-tools/chart-tooltip-placement.js
function chartAnchor(scene, index, pointer) {
  const boxes = [];
  const point = (x, y, radius = 6) => boxes.push({
    left: x - radius,
    right: x + radius,
    top: y - radius,
    bottom: y + radius
  });
  for (const region of scene.regions) {
    if (region.index === index && region.kind === "rect")
      boxes.push({
        left: region.x - 3,
        top: region.y - 3,
        right: region.x + region.width + 3,
        bottom: region.y + region.height + 3
      });
    if (region.index === index && region.kind === "disk")
      point(region.x, region.y, region.radius + 4);
    if (region.index === index && region.kind === "sector") {
      const angles = [region.start, region.end];
      for (let angle = Math.ceil(region.start / (Math.PI / 2)) * (Math.PI / 2); angle <= region.end; angle += Math.PI / 2)
        angles.push(angle);
      for (const angle of angles)
        for (const radius of [region.inner, region.radius])
          point(
            region.x + Math.cos(angle) * radius,
            region.y + Math.sin(angle) * radius,
            3
          );
    }
    for (const value of region.points || [])
      if (value.index === index) point(value.x, value.y);
  }
  for (const mark of scene.marks) {
    const attrs = mark.attrs;
    if (Number(attrs["data-point"]) === index && mark.tag === "circle")
      point(attrs.cx, attrs.cy, Number(attrs.r || 4) + 3);
  }
  if (pointer) point(pointer.x, pointer.y, 8);
  if (!boxes.length) point(320, 142);
  const bounds = {
    left: Infinity,
    top: Infinity,
    right: -Infinity,
    bottom: -Infinity
  };
  for (const box of boxes) {
    bounds.left = Math.min(bounds.left, box.left);
    bounds.right = Math.max(bounds.right, box.right);
    bounds.top = Math.min(bounds.top, box.top);
    bounds.bottom = Math.max(bounds.bottom, box.bottom);
  }
  return bounds;
}
function chartTooltipPlacement(anchor, size, bounds) {
  const gap = 10, { width, height } = size;
  if (!(width > 0 && height > 0) || width > bounds.right - bounds.left || height > bounds.bottom - bounds.top)
    return null;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const x = clamp(
    (anchor.left + anchor.right - width) / 2,
    bounds.left,
    bounds.right - width
  );
  const y = clamp(
    (anchor.top + anchor.bottom - height) / 2,
    bounds.top,
    bounds.bottom - height
  );
  const candidates = [
    { side: "top", x, y: anchor.top - gap - height },
    { side: "right", x: anchor.right + gap, y },
    { side: "bottom", x, y: anchor.bottom + gap },
    { side: "left", x: anchor.left - gap - width, y }
  ];
  for (const candidate of candidates) {
    if (candidate.x < bounds.left || candidate.y < bounds.top || candidate.x + width > bounds.right || candidate.y + height > bounds.bottom)
      continue;
    return candidate;
  }
  return null;
}
function chartLocalPlacement(plot, rect, origin, placement) {
  if (!placement) return null;
  const view = plot.ownerDocument.defaultView;
  for (let element = plot; element; element = element.parentElement) {
    const style = view?.getComputedStyle(element);
    if (!style) continue;
    if (style.rotate && style.rotate !== "none" || style.perspective && style.perspective !== "none")
      return null;
    if (style.scale && style.scale !== "none" && style.scale.split(/\s+/).some((value) => !(parseFloat(value) > 0)))
      return null;
    const transform = style.transform;
    if (!transform || transform === "none") continue;
    const match = /^matrix\(([^)]+)\)$/.exec(transform);
    if (!match) return null;
    const [a, b, c, d] = match[1].split(",").map(Number);
    if (!(a > 0 && d > 0) || b !== 0 || c !== 0) return null;
  }
  const scaleX = rect.width / (plot.offsetWidth || rect.width), scaleY = rect.height / (plot.offsetHeight || rect.height);
  if (!(scaleX > 0 && scaleY > 0)) return null;
  return {
    x: (placement.x - origin.left) / scaleX,
    y: (placement.y - origin.top) / scaleY,
    side: placement.side
  };
}

// packages/visual-tools/runtime.js
function node(document, tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== void 0) element.textContent = String(text).slice(0, 500);
  return element;
}
function button(document, label, listen, onClick) {
  const control = node(document, "button", "ag-vt-button", label);
  control.type = "button";
  listen(control, "click", onClick);
  return control;
}

// packages/visual-tools/chart-inspect.js
function hitChart(scene, state, x, y) {
  let nearest = null, distance = Infinity;
  for (const region of scene.regions) {
    let inside = false;
    if (region.kind === "rect")
      inside = x >= region.x && x <= region.x + region.width && y >= region.y && y <= region.y + region.height;
    else if (region.kind === "disk")
      inside = Math.hypot(x - region.x, y - region.y) <= region.radius + 8;
    else if (region.kind === "sector") {
      const radius = Math.hypot(x - region.x, y - region.y);
      let angle = Math.atan2(y - region.y, x - region.x);
      while (angle < region.start) angle += Math.PI * 2;
      inside = radius >= region.inner && radius <= region.radius && angle <= region.end;
    }
    if (inside && region.index !== void 0) return region.index;
    if (region.points && !["pie", "donut"].includes(state.type)) {
      for (const point of region.points) {
        if (point.index === void 0) continue;
        const next = Math.hypot(x - point.x, y - point.y);
        if (next < distance) {
          nearest = point.index;
          distance = next;
        }
      }
    }
  }
  if (state.type === "radar") return distance < 100 ? nearest : null;
  if (["scatter", "bubble", "pie", "donut"].includes(state.type)) return null;
  if (state.arrangement === "horizontal") {
    if (y < scene.top || y > scene.bottom) return null;
    return Math.min(
      state.labels.length - 1,
      Math.floor(
        (y - scene.top) / (scene.bottom - scene.top) * state.labels.length
      )
    );
  }
  if (x < scene.left || x > scene.right) return null;
  return Math.min(
    state.labels.length - 1,
    Math.floor(
      (x - scene.left) / (scene.right - scene.left) * state.labels.length
    )
  );
}
function chartInspector(document, plot, state, scene, listen, select, pointText2) {
  const tooltip = node(document, "div", "ag-vt-chart__tooltip"), title = node(document, "strong"), values = node(document, "div");
  const crosshair = node(document, "div", "ag-vt-chart__crosshair");
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = crosshair.hidden = true;
  tooltip.append(title, values);
  plot.append(crosshair, tooltip);
  const center = node(document, "div", "ag-vt-chart__center"), amount = node(document, "strong"), caption = node(document, "span");
  center.setAttribute("aria-hidden", "true");
  center.append(amount, caption);
  if (state.type === "donut") plot.append(center);
  let active = -1;
  function centerValue(index) {
    if (state.type !== "donut") return;
    amount.textContent = pointText2(state.series[0].values[index]);
    caption.textContent = axisPointLabel(state.labels, index, state.axisDates);
  }
  function show(index, x, y) {
    if (state.showTooltip === false || index < 0 || index >= state.labels.length)
      return;
    title.textContent = axisPointLabel(state.labels, index, state.axisDates);
    values.replaceChildren();
    for (let si = 0; si < state.series.length; si++) {
      const series = state.series[si], row = node(document, "div", "ag-vt-chart__tooltip-row"), swatch = node(document, "span", "ag-vt-chart__swatch");
      swatch.dataset.series = String(
        ["pie", "donut"].includes(state.type) ? index % 6 : si
      );
      row.append(
        swatch,
        node(document, "span", "", series.label),
        node(document, "b", "", pointText2(series.values[index]))
      );
      values.append(row);
    }
    plot.append(tooltip);
    tooltip.dataset.placement = "floating";
    tooltip.style.visibility = "hidden";
    tooltip.style.left = tooltip.style.top = "0px";
    tooltip.hidden = false;
    const rect = plot.getBoundingClientRect(), box = tooltip.getBoundingClientRect(), view = document.defaultView;
    const logical = chartAnchor(
      scene,
      index,
      Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null
    );
    const anchor = {
      left: rect.left + logical.left * rect.width / 640,
      right: rect.left + logical.right * rect.width / 640,
      top: rect.top + logical.top * rect.height / 300,
      bottom: rect.top + logical.bottom * rect.height / 300
    };
    const placement = chartTooltipPlacement(anchor, box, {
      left: Math.max(rect.left, 0) + 8,
      right: Math.min(rect.right, view?.innerWidth || rect.right) - 8,
      top: Math.max(rect.top, 0) + 8,
      bottom: Math.min(rect.bottom, view?.innerHeight || rect.bottom) - 8
    });
    const local = chartLocalPlacement(plot, rect, box, placement);
    if (local) {
      tooltip.style.left = local.x + "px";
      tooltip.style.top = local.y + "px";
      tooltip.dataset.side = local.side;
    } else {
      plot.after(tooltip);
      tooltip.dataset.placement = "docked";
      delete tooltip.dataset.side;
    }
    tooltip.style.visibility = "";
    crosshair.hidden = ["pie", "donut", "radar"].includes(state.type);
    const cursorX = Number.isFinite(x) ? x : (logical.left + logical.right) / 2;
    crosshair.style.left = Math.max(0, Math.min(100, cursorX / 640 * 100)) + "%";
  }
  function locate(event) {
    const rect = plot.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = (event.clientX - rect.left) / rect.width * 640, y = (event.clientY - rect.top) / rect.height * 300;
    return { x, y, index: hitChart(scene, state, x, y) };
  }
  listen(plot, "pointermove", (event) => {
    const hit = locate(event);
    if (hit?.index === null || !hit) {
      hide();
      return;
    }
    if (active !== hit.index) {
      active = hit.index;
      select(active, { animate: false, notify: false });
    }
    show(hit.index, hit.x, hit.y);
  });
  listen(plot, "pointerleave", hide);
  if (document.defaultView) listen(document.defaultView, "resize", hide);
  listen(document, "scroll", hide, true);
  listen(plot, "blur", hide);
  listen(plot, "keydown", (event) => {
    if (event.key === "Escape") hide();
  });
  function hide() {
    tooltip.hidden = crosshair.hidden = true;
    active = -1;
  }
  return { show, hide, locate, centerValue };
}

// packages/visual-tools/chart-scene.js
function makeChartScene() {
  const width = 640, height = 300, left = 56, right = 620, top = 24, bottom = 252, marks = [], particles = [], regions = [];
  const add = (tag, attrs, text) => marks.push({ tag, attrs, text });
  const dot = (x, y, color, r = 2) => {
    if (particles.length < 2400) particles.push({ x, y, color, r });
  };
  const segment = (a, b, color) => {
    const count = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 5));
    for (let step = 0; step <= count; step++)
      dot(
        a.x + (b.x - a.x) * step / count,
        a.y + (b.y - a.y) * step / count,
        color
      );
  };
  return {
    width,
    height,
    left,
    right,
    top,
    bottom,
    marks,
    particles,
    regions,
    region: (shape) => regions.push(shape),
    add,
    dot,
    segment
  };
}

// packages/visual-tools/chart-radial.js
var colors = [
  "var(--ag-accent)",
  "var(--ag-success)",
  "var(--ag-text)",
  "var(--ag-danger)",
  "var(--ag-muted)",
  "var(--ag-border)"
];
function pieScene(state, scene) {
  const {
    width,
    height,
    left,
    right,
    top,
    bottom,
    marks,
    particles,
    add,
    dot,
    segment
  } = scene;
  const { type, labels, series, arrangement = "grouped" } = state;
  const values = series[0].values.map((value) => value ?? 0), total = values.reduce((sum, value) => sum + value, 0);
  let angle = -Math.PI / 2;
  const cx = 320, cy = 142, r = 110, inner = type === "donut" ? 65 : 0;
  for (let index = 0; index < values.length; index++) {
    const fraction = total ? values[index] / total : 0;
    if (!fraction) continue;
    const end = angle + fraction * Math.PI * 2, color = colors[index % colors.length], point = (a, radius) => [
      cx + Math.cos(a) * radius,
      cy + Math.sin(a) * radius
    ];
    const [x, y] = point(angle, r), [ex, ey] = point(end, r);
    let d;
    if (fraction >= 1 - 1e-10) {
      add("circle", {
        cx,
        cy,
        r,
        fill: color,
        "data-point": index,
        "data-series": 0
      });
      if (inner) add("circle", { cx, cy, r: inner, fill: "var(--ag-surface)" });
    } else {
      const [ix, iy] = point(end, inner), [sx, sy] = point(angle, inner);
      d = `M${x},${y} A${r},${r} 0 ${fraction > 0.5 ? 1 : 0} 1 ${ex},${ey} L${ix},${iy} ${inner ? `A${inner},${inner} 0 ${fraction > 0.5 ? 1 : 0} 0 ${sx},${sy}` : ""} Z`;
      add("path", {
        "data-point": index,
        "data-series": 0,
        d,
        fill: color,
        stroke: "var(--ag-surface)",
        "stroke-width": 2
      });
    }
    scene.region({
      kind: "sector",
      x: cx,
      y: cy,
      radius: r,
      inner,
      start: angle,
      end,
      color,
      index,
      series: 0
    });
    for (let radius = inner + 3; radius < r; radius += 6) {
      const count = Math.max(1, Math.ceil((end - angle) * radius / 6));
      for (let j = 0; j < count; j++)
        dot(
          cx + Math.cos(angle + (end - angle) * (j + 0.5) / count) * radius,
          cy + Math.sin(angle + (end - angle) * (j + 0.5) / count) * radius,
          color
        );
    }
    angle = end;
  }
  if (!total)
    add(
      "text",
      { x: 320, y: 145, "text-anchor": "middle", fill: "var(--ag-muted)" },
      "\u041D\u0435\u0442 \u043F\u043E\u043B\u043E\u0436\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0445 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0439"
    );
  return { width, height, marks, particles };
}
function radarScene(state, scene) {
  const {
    width,
    height,
    left,
    right,
    top,
    bottom,
    marks,
    particles,
    add,
    dot,
    segment
  } = scene;
  const { type, labels, series, arrangement = "grouped" } = state;
  const all = [];
  for (const item of series)
    for (const value of item.values) if (value !== null) all.push(value);
  const maximum = state.max ?? Math.max(1, ...all), cx = 320, cy = 142, r = 105, count = labels.length;
  if (count < 3) throw new RangeError("Radar needs at least three categories");
  const position = (i, value) => ({
    x: cx + Math.cos(-Math.PI / 2 + i * Math.PI * 2 / count) * r * value / maximum,
    y: cy + Math.sin(-Math.PI / 2 + i * Math.PI * 2 / count) * r * value / maximum
  });
  for (let level = 1; level <= 4; level++) {
    const path = labels.map((_, i) => position(i, maximum * level / 4));
    add("polygon", {
      points: path.map((p) => `${p.x},${p.y}`).join(" "),
      fill: "none",
      stroke: "var(--ag-border)"
    });
  }
  labels.forEach((label, i) => {
    const p = position(i, maximum * 1.15);
    add(
      "text",
      { x: p.x, y: p.y, "text-anchor": "middle", fill: "var(--ag-muted)" },
      label.slice(0, 16)
    );
  });
  series.forEach((item, index) => {
    const color = colors[index];
    const polygon = [];
    let previous;
    item.values.forEach((value, i) => {
      if (value === null) {
        previous = void 0;
        return;
      }
      const p = { ...position(i, value), index: i };
      polygon.push(p);
      add("circle", {
        cx: p.x,
        cy: p.y,
        r: 4,
        fill: color,
        "data-point": i,
        "data-series": index
      });
      if (previous) {
        add("line", {
          x1: previous.x,
          y1: previous.y,
          x2: p.x,
          y2: p.y,
          stroke: color,
          "stroke-width": 2
        });
        scene.region({
          kind: "line",
          points: [previous, p],
          color,
          series: index
        });
        segment(previous, p, color);
      }
      previous = p;
    });
    if (item.values.every((value) => value !== null)) {
      const a = position(count - 1, item.values[count - 1]), b = position(0, item.values[0]);
      add("line", {
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        stroke: color,
        "stroke-width": 2
      });
      scene.region({
        kind: "polygon",
        points: polygon,
        color,
        series: index,
        edge: polygon
      });
      segment(a, b, color);
    }
  });
  return { width, height, marks, particles };
}

// packages/visual-tools/chart-scale.js
function chartDomain(values, min, max) {
  let low = min ?? Math.min(0, ...values), high = max ?? Math.max(0, ...values);
  if (low === high) {
    low -= 1;
    high += 1;
  }
  return [low, high];
}

// packages/visual-tools/chart-cartesian.js
var colors2 = [
  "var(--ag-accent)",
  "var(--ag-success)",
  "var(--ag-text)",
  "var(--ag-danger)",
  "var(--ag-muted)",
  "var(--ag-border)"
];
function cartesianScene(state, scene) {
  const {
    width,
    height,
    left,
    right,
    top,
    bottom,
    marks,
    particles,
    add,
    dot,
    segment
  } = scene;
  const { type, labels, series, arrangement = "grouped" } = state;
  const points = type === "scatter" || type === "bubble";
  let all = [];
  for (const item of series)
    for (const value of item.values)
      if (value !== null) all.push(points ? value.y : value);
  if (type === "bar" && arrangement === "stacked") {
    all = [];
    for (let i = 0; i < labels.length; i++) {
      let positive = 0, negative = 0;
      for (const item of series) {
        const value = item.values[i] ?? 0;
        if (value > 0) positive += value;
        else negative += value;
      }
      all.push(positive, negative);
    }
  }
  const [min, max] = chartDomain(all, state.min, state.max), y = (value) => bottom - (value - min) / (max - min) * (bottom - top), category = (i) => left + (i + 0.5) / Math.max(1, labels.length) * (right - left), number = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
  const horizontal = type === "bar" && arrangement === "horizontal", xValue = (value) => left + (value - min) / (max - min) * (right - left), rowHeight = (bottom - top) / Math.max(1, labels.length);
  for (let i = 0; i <= 4; i++) {
    const value = min + (max - min) * i / 4, position = horizontal ? xValue(value) : y(value);
    add(
      "line",
      horizontal ? {
        x1: position,
        x2: position,
        y1: top,
        y2: bottom,
        stroke: "var(--ag-border)"
      } : {
        x1: left,
        x2: right,
        y1: position,
        y2: position,
        stroke: "var(--ag-border)"
      }
    );
    add(
      "text",
      horizontal ? {
        x: position,
        y: bottom + 24,
        "text-anchor": "middle",
        fill: "var(--ag-muted)"
      } : {
        x: left - 8,
        y: position + 4,
        "text-anchor": "end",
        fill: "var(--ag-muted)"
      },
      number.format(value)
    );
  }
  const dates = axisDateValues(labels, state.axisDates);
  if (dates && !horizontal && !points) scene.height = 344;
  const labelStep = Math.max(1, Math.ceil(labels.length / 8));
  labels.forEach((label, index) => {
    if (horizontal && index % labelStep) return;
    add(
      "text",
      horizontal ? {
        x: left - 8,
        y: top + (index + 0.5) * rowHeight + 4,
        "text-anchor": "end",
        fill: "var(--ag-muted)"
      } : {
        x: category(index),
        y: bottom + 24,
        "data-axis-index": index,
        "data-axis-x": category(index),
        "text-anchor": "middle",
        fill: "var(--ag-muted)"
      },
      label
    );
  });
  const mapping = {
    min,
    max,
    y,
    category,
    number,
    horizontal,
    xValue,
    rowHeight
  };
  if (points) drawPointMarks(state, scene, mapping);
  else if (type === "composed") {
    drawBarMarks(state, scene, mapping);
    drawLineMarks(state, scene, mapping);
  } else if (type === "bar") drawBarMarks(state, scene, mapping);
  else drawLineMarks(state, scene, mapping);
  return { width, height, marks, particles };
}
function drawPointMarks(state, scene, mapping) {
  const {
    width,
    height,
    left,
    right,
    top,
    bottom,
    marks,
    particles,
    add,
    dot,
    segment
  } = scene;
  const { type, labels, series, arrangement = "grouped" } = state;
  const { min, max, y, category, number, horizontal, xValue, rowHeight } = mapping;
  const xs = [];
  let sizeMax = 1;
  for (const item of series)
    for (const value of item.values) {
      if (value === null) continue;
      xs.push(value.x);
      sizeMax = Math.max(sizeMax, value.size ?? 1);
    }
  const [xMin, xMax] = chartDomain(xs);
  series.forEach((item, si) => {
    for (const [pointIndex, value] of item.values.entries()) {
      if (!value) continue;
      const cx = left + (value.x - xMin) / (xMax - xMin) * (right - left), cy = y(value.y), r = type === "bubble" ? 4 + 20 * Math.sqrt(value.size / sizeMax) : 4, color = colors2[si];
      add("circle", {
        "data-point": pointIndex,
        "data-series": si,
        cx,
        cy,
        r,
        fill: color,
        "fill-opacity": 0.7,
        stroke: color
      });
      scene.region({
        kind: "disk",
        x: cx,
        y: cy,
        radius: r,
        color,
        index: pointIndex,
        series: si
      });
      for (let radius = 0; radius <= r; radius += 4) {
        const count = Math.max(1, Math.ceil(radius * Math.PI * 2 / 5));
        for (let j = 0; j < count; j++)
          dot(
            cx + Math.cos(j / count * Math.PI * 2) * radius,
            cy + Math.sin(j / count * Math.PI * 2) * radius,
            color
          );
      }
    }
  });
  for (let i = marks.length - 1; i >= 0; i--)
    if (marks[i].tag === "text" && marks[i].attrs.y === bottom + 24)
      marks.splice(i, 1);
  for (let i = 0; i <= 4; i++)
    add(
      "text",
      {
        x: left + i / 4 * (right - left),
        y: bottom + 24,
        "text-anchor": "middle",
        fill: "var(--ag-muted)"
      },
      number.format(xMin + i / 4 * (xMax - xMin))
    );
}
function drawBarMarks(state, scene, mapping) {
  const {
    width,
    height,
    left,
    right,
    top,
    bottom,
    marks,
    particles,
    add,
    dot,
    segment
  } = scene;
  const { type, labels, series, arrangement = "grouped" } = state;
  const { min, max, y, category, number, horizontal, xValue, rowHeight } = mapping;
  const positive = labels.map(() => 0), negative = labels.map(() => 0), band = (right - left) / Math.max(1, labels.length);
  const barCount = type === "composed" ? series.filter((item) => item.type === "bar").length : series.length;
  let barIndex = -1;
  series.forEach((item, si) => {
    if (type === "composed" && item.type !== "bar") return;
    barIndex++;
    item.values.forEach((value, index) => {
      if (value === null) return;
      const color = colors2[si];
      let x, heightRect, widthRect, topRect;
      if (horizontal) {
        const slot = rowHeight / (series.length + 1);
        x = Math.min(xValue(0), xValue(value));
        widthRect = Math.abs(xValue(value) - xValue(0));
        topRect = top + index * rowHeight + slot * (si + 0.5);
        heightRect = slot * 0.85;
      } else {
        let baseline = 0;
        if (arrangement === "stacked") {
          baseline = value >= 0 ? positive[index] : negative[index];
          if (value >= 0) positive[index] += value;
          else negative[index] += value;
        }
        const slot = band / (arrangement === "stacked" ? 1 : barCount);
        widthRect = slot * 0.72;
        x = left + index * band + (arrangement === "stacked" ? band * 0.14 : slot * (barIndex + 0.14));
        topRect = Math.min(y(baseline), y(baseline + value));
        heightRect = Math.abs(y(baseline + value) - y(baseline));
      }
      add("rect", {
        "data-point": index,
        "data-series": si,
        x,
        y: topRect,
        width: widthRect,
        height: heightRect,
        fill: color
      });
      scene.region({
        kind: "rect",
        x,
        y: topRect,
        width: widthRect,
        height: heightRect,
        color,
        index,
        series: si
      });
      const step = Math.max(
        5,
        Math.sqrt(
          widthRect * heightRect / Math.max(1, 2400 / (series.length * Math.max(1, labels.length)))
        )
      );
      for (let px = x + step / 2; px < x + widthRect; px += step)
        for (let py = topRect + step / 2; py < topRect + heightRect; py += step)
          dot(px, py, color);
    });
  });
}
function drawLineMarks(state, scene, mapping) {
  const {
    width,
    height,
    left,
    right,
    top,
    bottom,
    marks,
    particles,
    add,
    dot,
    segment
  } = scene;
  const { type, labels, series, arrangement = "grouped" } = state;
  const { min, max, y, category, number, horizontal, xValue, rowHeight } = mapping;
  series.forEach((item, si) => {
    if (type === "composed" && item.type === "bar") return;
    const seriesType = type === "composed" ? item.type : type;
    const color = colors2[si];
    let run = [];
    const flush = () => {
      if (!run.length) return;
      const d = run.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
      if (seriesType === "area")
        add("path", {
          d: d + ` L${run.at(-1).x},${y(0)} L${run[0].x},${y(0)} Z`,
          fill: color,
          "fill-opacity": 0.12
        });
      add("path", {
        d,
        fill: "none",
        stroke: color,
        "stroke-width": 2,
        "stroke-dasharray": si % 2 ? "5 3" : "none"
      });
      scene.region({ kind: "line", points: [...run], color, series: si });
      if (seriesType === "area" && run.length > 1) {
        scene.region({
          kind: "polygon",
          points: [
            ...run,
            { x: run.at(-1).x, y: y(0) },
            { x: run[0].x, y: y(0) }
          ],
          color,
          series: si,
          edge: run
        });
      }
      for (let i = 1; i < run.length; i++) segment(run[i - 1], run[i], color);
      run = [];
    };
    item.values.forEach((value, index) => {
      if (value === null) {
        flush();
        return;
      }
      const p = { x: category(index), y: y(value), index };
      run.push(p);
      add("circle", {
        cx: p.x,
        cy: p.y,
        r: 3,
        fill: color,
        "data-point": index,
        "data-series": si
      });
      dot(p.x, p.y, color, 3);
    });
    flush();
  });
}

// packages/visual-tools/chart-validation.js
var chartTypes = Object.freeze([
  "composed",
  "line",
  "area",
  "bar",
  "pie",
  "donut",
  "scatter",
  "bubble",
  "radar"
]);
function validateValue(value, type) {
  if (value === null) return;
  if (type === "scatter" || type === "bubble") {
    if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y))
      throw new TypeError("Finite x/y and nonnegative bubble size required");
    if (type === "bubble" && (!Number.isFinite(value.size) || value.size < 0))
      throw new TypeError("Finite x/y and nonnegative bubble size required");
    return;
  }
  if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > 1e12)
    throw new TypeError("Finite bounded values or null required");
  if (["pie", "donut", "radar"].includes(type) && value < 0)
    throw new RangeError("Radial charts require nonnegative values");
}
function validateSeries(item, ids, labelCount, type) {
  if (!item || !item.id || ids.has(item.id))
    throw new TypeError("Unique series and one value per label are required");
  if (typeof item.label !== "string" || !item.label.trim())
    throw new TypeError("Unique series and one value per label are required");
  if (!Array.isArray(item.values) || item.values.length !== labelCount)
    throw new TypeError("Unique series and one value per label are required");
  if (type === "composed" && !["line", "area", "bar"].includes(item.type))
    throw new TypeError("Composed series require line, area or bar type");
  ids.add(item.id);
  for (const value of item.values) validateValue(value, type);
}
function validateDomain(state) {
  if (state.min !== void 0 && !Number.isFinite(state.min))
    throw new RangeError("Invalid domain");
  if (state.max !== void 0 && !Number.isFinite(state.max))
    throw new RangeError("Invalid domain");
  if (state.min !== void 0 && state.max !== void 0 && state.min >= state.max)
    throw new RangeError("Invalid domain");
  if (state.type === "radar" && state.max !== void 0 && state.max <= 0)
    throw new RangeError("Radar maximum must be positive");
}
function validateChart(state) {
  const {
    type,
    labels,
    series,
    renderer = "svg",
    arrangement = "grouped"
  } = state;
  if (!chartTypes.includes(type) || !["svg", "particles", "ascii"].includes(renderer) || !["grouped", "stacked", "horizontal"].includes(arrangement))
    throw new TypeError("Unknown chart mode");
  if (typeof state.label !== "string" || !state.label.trim())
    throw new TypeError("A chart label is required");
  if (!Array.isArray(labels) || labels.length > 120 || labels.some((label) => typeof label !== "string"))
    throw new RangeError("Use at most 120 category labels");
  axisDateValues(labels, state.axisDates);
  if (!Array.isArray(series) || !series.length || series.length > 6)
    throw new RangeError("Use 1\u20136 series");
  const ids = /* @__PURE__ */ new Set();
  for (const item of series) validateSeries(item, ids, labels.length, type);
  if (type === "radar" && labels.length < 3)
    throw new RangeError("Radar needs at least three categories");
  const hasBars = type === "bar" || type === "composed" && series.some((item) => item.type === "bar");
  if (hasBars && (state.min > 0 || state.max < 0))
    throw new RangeError("Bar domain must include zero");
  if (["pie", "donut"].includes(type) && series.length !== 1)
    throw new TypeError("Pie/donut use one series");
  for (const [key, min, max] of [
    ["asciiFontSize", 6, 14],
    ["asciiMaxCells", 128, 4e3],
    ["asciiSpeed", 0, 2],
    ["asciiGlow", 0, 1],
    ["particleDensity", 0.25, 3],
    ["particleCount", 100, 16e3],
    ["particleFrames", 4, 20],
    ["particleCacheBudget", 262144, 4194304],
    ["particleSize", 0.3, 2],
    ["particleBloom", 0, 1],
    ["particleJitter", 0, 3]
  ]) {
    const value = state[key];
    if (value !== void 0 && (!Number.isFinite(value) || value < min || value > max || [
      "asciiMaxCells",
      "particleCount",
      "particleFrames",
      "particleCacheBudget"
    ].includes(key) && !Number.isInteger(value)))
      throw new RangeError("Invalid " + key);
  }
  for (const key of ["paused", "animated", "showTooltip", "particleCache"])
    if (state[key] !== void 0 && typeof state[key] !== "boolean")
      throw new TypeError("Boolean " + key + " required");
  if (state.particleCacheMode !== void 0 && !["frames", "strips"].includes(state.particleCacheMode))
    throw new TypeError("Unknown particle cache mode");
  if (state.asciiCharset !== void 0 && !["classic", "binary", "braille"].includes(state.asciiCharset))
    throw new TypeError("Unknown ASCII charset");
  if (type === "composed" && arrangement !== "grouped")
    throw new TypeError("Composed charts use grouped shared scales");
  validateDomain(state);
}

// packages/visual-tools/chart-geometry.js
function chartScene(state) {
  const scene = makeChartScene();
  if (state.type === "pie" || state.type === "donut") pieScene(state, scene);
  else if (state.type === "radar") radarScene(state, scene);
  else cartesianScene(state, scene);
  if (state.renderer === "particles")
    scene.particles = sampleParticleTargets(scene.regions, state);
  if (state.renderer === "ascii")
    scene.particles = asciiChartTargets(scene.regions, state);
  return scene;
}

// packages/visual-tools/chart-particle-field.js
function createParticleField(targets, previous) {
  const count = targets.length, random = particleRandom(9182);
  const positions = new Float32Array(count * 2), velocity = new Float32Array(count * 2), delay = new Float32Array(count);
  let elapsed = 0;
  function reset(scatter = false) {
    elapsed = 0;
    for (let i = 0; i < count; i++) {
      const p = targets[i], old = !scatter && previous?.length ? Math.floor(i * previous.length / (count * 2)) * 2 : -1;
      positions[i * 2] = old >= 0 ? previous[old] : p.x + (random() - 0.5) * 180;
      positions[i * 2 + 1] = old >= 0 ? previous[old + 1] : p.y + (random() - 0.5) * 150;
      velocity[i * 2] = velocity[i * 2 + 1] = 0;
      delay[i] = random() * 360;
    }
  }
  function advance(dt) {
    if (elapsed >= 2e3) return true;
    elapsed += dt;
    const step = Math.min(32, dt) / 16.667, damping = Math.pow(0.76, step);
    for (let i = 0; i < count; i++) {
      if (elapsed < delay[i]) continue;
      const j = i * 2, p = targets[i];
      velocity[j] = (velocity[j] + (p.x - positions[j]) * 0.075 * step) * damping;
      velocity[j + 1] = (velocity[j + 1] + (p.y - positions[j + 1]) * 0.075 * step) * damping;
      positions[j] += velocity[j] * step;
      positions[j + 1] += velocity[j + 1] * step;
    }
    if (elapsed >= 2e3) settle();
    return elapsed >= 2e3;
  }
  function settle() {
    elapsed = 2e3;
    for (let i = 0; i < count; i++) {
      positions[i * 2] = targets[i].x;
      positions[i * 2 + 1] = targets[i].y;
    }
  }
  reset();
  return {
    positions,
    delay,
    advance,
    reset,
    settle,
    get elapsed() {
      return elapsed;
    },
    snapshot: () => positions.slice()
  };
}

// packages/visual-tools/chart-radial-contrast.js
function rgb(value) {
  if (typeof value !== "string") return null;
  const hex2 = /^#([a-f0-9]{6})$/i.exec(value.trim());
  if (hex2)
    return [0, 2, 4].map(
      (offset) => parseInt(hex2[1].slice(offset, offset + 2), 16)
    );
  const triplet = /^rgb\(\s*(\d+(?:\.\d+)?)[, ]+(\d+(?:\.\d+)?)[, ]+(\d+(?:\.\d+)?)\s*\)$/i.exec(
    value.trim()
  );
  if (triplet) {
    const result = triplet.slice(1).map(Number);
    if (result.every((channel) => channel >= 0 && channel <= 255))
      return result;
  }
  return null;
}
function luminance(channels) {
  const linear = channels.map((value) => {
    const s = value / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function ratio(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function hex(channels) {
  return "#" + channels.map((value) => Math.round(value).toString(16).padStart(2, "0")).join("");
}
function radialBoundaryPalette(surface, text) {
  const base = rgb(surface), ink = rgb(text);
  if (base && ink) {
    for (let step = 0; step <= 14; step++) {
      const strength = 0.72 + step * 0.02;
      const candidate = base.map(
        (value, i) => Math.round(value + (ink[i] - value) * strength)
      );
      if (ratio(base, candidate) >= 9)
        return { halo: hex(base), stroke: hex(candidate), source: "profile" };
    }
  }
  const dark = base ? luminance(base) < 0.3 : true;
  return {
    halo: dark ? "#000000" : "#ffffff",
    stroke: dark ? "#ffffff" : "#000000",
    source: "fallback"
  };
}

// packages/visual-tools/chart-ascii-paint.js
function asciiChartPainter(document, element, canvas, context, targets, options) {
  const atlas = document.createElement("canvas"), groups = /* @__PURE__ */ new Map(), sectorTransforms = /* @__PURE__ */ new Map();
  for (const target of targets)
    if (target.sector && !sectorTransforms.has(target.sector))
      sectorTransforms.set(
        target.sector,
        sectorSelectionTransform(target.sector)
      );
  const chars = Array.from(
    asciiChartCharsets[options.asciiCharset ?? "classic"]
  );
  const size = options.asciiFontSize ?? 10;
  const radialFlows = targets.map(
    (target) => prepareAsciiRadialFlow(target, size)
  );
  let atlasContext, available = true, selectedIndex = -1;
  function palette() {
    groups.clear();
    const style = document.defaultView.getComputedStyle(element);
    if (sectorTransforms.size) {
      const boundary = radialBoundaryPalette(
        style.getPropertyValue("--ag-surface").trim(),
        style.getPropertyValue("--ag-text").trim()
      );
      for (const [name, value] of [
        ["--ag-chart-radial-boundary", boundary.stroke],
        ["--ag-chart-radial-halo", boundary.halo]
      ])
        if (element.style.getPropertyValue(name) !== value)
          element.style.setProperty(name, value);
      element.dataset.radialBoundarySource = boundary.source;
    }
    for (const p of targets) {
      if (groups.has(p.color)) continue;
      const token = p.color.match(/^var\((--ag-[\w-]+)\)$/)?.[1];
      const color = (token ? style.getPropertyValue(token).trim() : p.color) || "#777777";
      groups.set(p.color, { color, row: groups.size });
    }
    atlas.width = 32 * chars.length;
    atlas.height = 32 * Math.max(1, groups.size);
    atlasContext = atlas.getContext("2d");
    available = Boolean(atlasContext?.fillText && context.drawImage);
    if (!available) return;
    atlasContext.font = `${size * 2}px ui-monospace, SFMono-Regular, Consolas, monospace`;
    atlasContext.textAlign = "center";
    atlasContext.textBaseline = "middle";
    for (const group of groups.values()) {
      atlasContext.fillStyle = group.color;
      atlasContext.shadowColor = group.color;
      atlasContext.shadowBlur = (options.asciiGlow ?? 0.25) * 3;
      for (let i = 0; i < chars.length; i++)
        atlasContext.fillText(chars[i], i * 32 + 16, group.row * 32 + 16);
    }
  }
  function paint(field, time, moving) {
    if (!atlas.width) palette();
    context.setTransform(2, 0, 0, 2, 0, 0);
    context.clearRect(0, 0, 640, 300);
    if (!available) return;
    const speed = options.asciiSpeed ?? 0.6, phase = moving ? time * speed / 1600 : 0;
    for (let i = 0; i < targets.length; i++) {
      const p = targets[i], group = groups.get(p.color);
      const wave = Math.sin(phase + p.x * 0.018 - p.y * 0.025);
      const arrival = Math.max(
        0,
        Math.min(1, (field.elapsed - field.delay[i]) / 300)
      );
      let shimmer = 1;
      if (moving) shimmer = p.sector ? 0.9 + 0.1 * wave : 0.72 + 0.28 * wave;
      const selected = p.sector && p.index === selectedIndex, flow = radialFlows[i], flowing = flow && moving, radius = flowing ? asciiRadialFlowRadius(flow, phase) : 0, flowAlpha = flowing ? asciiRadialFlowOpacity(flow, radius) : 1;
      context.globalAlpha = Math.min(
        1,
        p.alpha * arrival * shimmer * flowAlpha * (selected ? 1.25 : 1)
      );
      let glyph = p.glyph % chars.length;
      if (moving && p.interior)
        glyph = (glyph + Math.floor((wave + 1) * 1.4)) % chars.length;
      const sway = moving && !flow ? wave * (p.interior ? 0.65 : 0.15) : 0;
      let positionX = field.positions[i * 2], positionY = field.positions[i * 2 + 1];
      if (flowing) {
        const distance = radius - flow.radius;
        positionX += flow.ux * distance;
        positionY += flow.uy * distance;
      }
      if (selected) {
        const t = sectorTransforms.get(p.sector);
        positionX = t.x + (positionX - t.x) * t.scale + t.dx;
        positionY = t.y + (positionY - t.y) * t.scale + t.dy;
      }
      context.drawImage(
        atlas,
        glyph * 32,
        group.row * 32,
        32,
        32,
        positionX - 8,
        positionY - 8 + sway,
        16,
        16
      );
    }
    context.globalAlpha = 1;
  }
  function releaseFrames() {
    atlas.width = atlas.height = 0;
  }
  palette();
  return {
    paint,
    /** Change only presentation state; the layer repaints once if motion is paused. */
    select(index) {
      if (selectedIndex === index) return false;
      selectedIndex = index;
      return true;
    },
    palette,
    releaseFrames,
    resize: () => false,
    get cachedFrames() {
      return atlas.width ? 1 : 0;
    },
    get rasterBytes() {
      return atlas.width * atlas.height * 4;
    },
    dispose() {
      releaseFrames();
      groups.clear();
      if (sectorTransforms.size) {
        element.style.removeProperty("--ag-chart-radial-boundary");
        element.style.removeProperty("--ag-chart-radial-halo");
        delete element.dataset.radialBoundarySource;
      }
      sectorTransforms.clear();
      radialFlows.length = 0;
    }
  };
}

// packages/visual-tools/chart-particle-strips.js
var STRIPS = 15;
var PERIOD = 500;
function particleStripCache(document, { budget = 1048576, width = 320 } = {}) {
  let oldCanvas, newCanvas, oldContext, newContext, ready = false, available = true, index = 0, w = 1, h = 1;
  const times = new Float64Array(STRIPS);
  function clear() {
    for (const c of [oldCanvas, newCanvas]) if (c) c.width = c.height = 0;
    oldCanvas = newCanvas = oldContext = newContext = null;
    ready = false;
    index = 0;
  }
  function resize(cssWidth) {
    const b = Number.isFinite(budget) ? Math.max(262144, Math.min(4194304, budget)) : 1048576;
    const maximum = Math.floor(Math.sqrt(b / (8 * 300 / 640)));
    const nextW = Math.max(
      32,
      Math.min(320, Math.ceil(cssWidth || width || 320), maximum)
    ), nextH = Math.max(15, Math.floor(nextW * 300 / 640));
    if (nextW === w && nextH === h) return false;
    clear();
    w = nextW;
    h = nextH;
    return true;
  }
  function initialize(source, time) {
    oldCanvas = document.createElement("canvas");
    newCanvas = document.createElement("canvas");
    for (const c of [oldCanvas, newCanvas]) {
      c.width = w;
      c.height = h;
    }
    oldContext = oldCanvas.getContext("2d");
    newContext = newCanvas.getContext("2d");
    if (!oldContext?.drawImage || !newContext?.drawImage) {
      available = false;
      clear();
      return false;
    }
    oldContext.drawImage(source, 0, 0, w, h);
    newContext.drawImage(source, 0, 0, w, h);
    times.fill(time - PERIOD);
    ready = true;
    return true;
  }
  function paint(context, source, time, draw) {
    if (!ready) {
      draw(time);
      if (!initialize(source, time)) return;
    }
    const y = index * 300 / STRIPS, bottom = (index + 1) * 300 / STRIPS, row = Math.floor(index * h / STRIPS), rowEnd = Math.floor((index + 1) * h / STRIPS);
    oldContext.clearRect(0, row, w, rowEnd - row);
    oldContext.drawImage(
      newCanvas,
      0,
      row,
      w,
      rowEnd - row,
      0,
      row,
      w,
      rowEnd - row
    );
    draw(time + PERIOD, { top: y, bottom });
    newContext.clearRect(0, row, w, rowEnd - row);
    newContext.drawImage(
      source,
      0,
      y * 2,
      1280,
      (bottom - y) * 2,
      0,
      row,
      w,
      rowEnd - row
    );
    times[index] = time;
    index = (index + 1) % STRIPS;
    context.setTransform(2, 0, 0, 2, 0, 0);
    context.clearRect(0, 0, 640, 300);
    for (let i = 0; i < STRIPS; i++) {
      const a = Math.floor(i * h / STRIPS), b = Math.floor((i + 1) * h / STRIPS), top = i * 300 / STRIPS, height = 300 / STRIPS, t = Math.min(1, Math.max(0, (time - times[i]) / PERIOD));
      context.globalAlpha = 1 - t;
      context.globalCompositeOperation = "source-over";
      context.drawImage(oldCanvas, 0, a, w, b - a, 0, top, 640, height);
      context.globalAlpha = t;
      context.globalCompositeOperation = "lighter";
      context.drawImage(newCanvas, 0, a, w, b - a, 0, top, 640, height);
    }
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
  }
  resize(width);
  return {
    paint,
    clear,
    resize,
    get available() {
      return available;
    },
    get size() {
      return ready ? 2 : 0;
    },
    get rasterBytes() {
      return ready ? w * h * 8 : 0;
    }
  };
}

// packages/visual-tools/chart-particle-cache.js
var PARTICLE_CYCLE_MS = 8e3;
function particleFrameCache(document, requestedCount = 6, { budget = 1048576, width = 320 } = {}) {
  const count = Number.isFinite(requestedCount) ? Math.max(4, Math.min(20, Math.round(requestedCount))) : 6;
  const maxBytes = Number.isFinite(budget) ? Math.max(262144, Math.min(4194304, Math.floor(budget))) : 1048576;
  const frames = [];
  let available = true, rasterWidth = 1, rasterHeight = 1;
  function clear() {
    for (const frame of frames) frame.width = frame.height = 0;
    frames.length = 0;
  }
  function resize(cssWidth) {
    const measured = Number.isFinite(cssWidth) && cssWidth > 0 ? cssWidth : 320;
    const maximum = Math.floor(Math.sqrt(maxBytes / (count * 4 * (300 / 640))));
    const nextWidth = Math.max(16, Math.min(640, Math.ceil(measured), maximum));
    const nextHeight = Math.max(1, Math.floor(nextWidth * 300 / 640));
    if (nextWidth === rasterWidth && nextHeight === rasterHeight) return false;
    clear();
    rasterWidth = nextWidth;
    rasterHeight = nextHeight;
    return true;
  }
  function capture(source) {
    if (frames.length >= count || !available) return;
    const frame = document.createElement("canvas");
    frame.width = rasterWidth;
    frame.height = rasterHeight;
    const context = frame.getContext("2d");
    if (!context?.drawImage) {
      frame.width = frame.height = 0;
      available = false;
      return;
    }
    context.drawImage(source, 0, 0, rasterWidth, rasterHeight);
    frames.push(frame);
  }
  function composite(context, time) {
    if (frames.length !== count || !context.drawImage) return false;
    const phase = time % PARTICLE_CYCLE_MS / PARTICLE_CYCLE_MS * count;
    const index = Math.floor(phase), fraction = phase - index;
    context.setTransform(2, 0, 0, 2, 0, 0);
    context.clearRect(0, 0, 640, 300);
    context.globalAlpha = 1 - fraction;
    context.globalCompositeOperation = "source-over";
    context.drawImage(frames[index], 0, 0, 640, 300);
    context.globalAlpha = fraction;
    context.globalCompositeOperation = "lighter";
    context.drawImage(frames[(index + 1) % count], 0, 0, 640, 300);
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
    return true;
  }
  resize(width);
  return {
    capture,
    composite,
    clear,
    resize,
    get available() {
      return available;
    },
    get size() {
      return frames.length;
    },
    get ready() {
      return frames.length === count;
    },
    get nextTime() {
      return frames.length / count * PARTICLE_CYCLE_MS;
    },
    get rasterBytes() {
      return frames.length * rasterWidth * rasterHeight * 4;
    },
    get width() {
      return rasterWidth;
    },
    get height() {
      return rasterHeight;
    }
  };
}

// packages/visual-tools/chart-particle-paint.js
function particlePainter(document, element, canvas, context, targets, options) {
  const view = document.defaultView, glow = document.createElement("canvas");
  glow.width = 320;
  glow.height = 150;
  const glowContext = glow.getContext("2d"), groups = /* @__PURE__ */ new Map();
  const wave = new Float32Array(1024);
  for (let i = 0; i < wave.length; i++)
    wave[i] = Math.sin(i / wave.length * Math.PI * 2);
  const cache = particleFrameCache(document, options.particleFrames ?? 6, {
    budget: options.particleCacheBudget
  });
  const strips = options.particleCacheMode !== "frames" ? particleStripCache(document, { budget: options.particleCacheBudget }) : null;
  let dark = false;
  function luminous(color, text) {
    if (!dark || !/^#[0-9a-f]{6}$/i.test(color) || !/^#[0-9a-f]{6}$/i.test(text))
      return color;
    const rgb2 = [];
    for (let i = 1; i < 7; i += 2)
      rgb2.push(
        Math.round(
          parseInt(color.slice(i, i + 2), 16) * 0.72 + parseInt(text.slice(i, i + 2), 16) * 0.28
        )
      );
    return `rgb(${rgb2.join(",")})`;
  }
  function palette() {
    cache.clear();
    strips?.clear();
    groups.clear();
    const style = view.getComputedStyle(element);
    dark = element.closest('[data-theme="dark"]') !== null || style.colorScheme === "dark";
    for (let i = 0; i < targets.length; i++) {
      const token = targets[i].color;
      if (!groups.has(token)) {
        const key = token.match(/^var\((--ag-[\w-]+)\)$/)?.[1];
        const color = (key ? style.getPropertyValue(key).trim() : token) || "#777777";
        groups.set(token, {
          color,
          core: luminous(color, style.getPropertyValue("--ag-text").trim()),
          indices: []
        });
      }
      groups.get(token).indices.push(i);
    }
  }
  function paintRaw(field, time, moving, band) {
    context.setTransform(2, 0, 0, 2, 0, 0);
    if (band) {
      context.save();
      context.beginPath();
      context.rect(0, band.top, 640, band.bottom - band.top);
      context.clip();
    }
    context.clearRect(0, 0, 640, 300);
    context.globalCompositeOperation = dark ? "lighter" : "source-over";
    const jitter = moving ? options.particleJitter ?? 0.75 : 0;
    const phase = time / PARTICLE_CYCLE_MS * 1024;
    const bandMargin = jitter * 1.8 + (options.particleSize ?? 0.7) * 1.3;
    for (const group of groups.values()) {
      context.fillStyle = group.color;
      let lastColor = group.color;
      for (const i of group.indices) {
        const p = targets[i], j = i * 2;
        if (band && (p.y < band.top - bandMargin || p.y > band.bottom + bandMargin))
          continue;
        const color = p.alpha > 0.5 ? group.core : group.color;
        if (color !== lastColor) {
          context.fillStyle = color;
          lastColor = color;
        }
        const spatial = p.x * 1.7 + p.y * 0.65;
        const a = phase + p.phase * 163 + spatial & 1023, b = phase * 2 + p.phase * 277 - spatial & 1023;
        const amplitude = jitter * (p.interior ? 1.3 : 0.22);
        const x = field.positions[j] + (wave[a] + wave[b + 250 & 1023] * 0.35) * amplitude, y = field.positions[j + 1] + (wave[b] + wave[a + 80 & 1023] * 0.35) * amplitude;
        const arrival = Math.max(
          0,
          Math.min(1, (field.elapsed - field.delay[i]) / 300)
        );
        const shimmer = moving ? p.interior ? 0.42 : 0.08 : 0;
        const illumination = 0.68 + wave[phase + spatial + 180 & 1023] * 0.25 + wave[a + 260 & 1023] * 0.07;
        context.globalAlpha = p.alpha * arrival * (1 - shimmer + illumination * shimmer);
        context.beginPath();
        context.arc(x, y, p.r, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
    const bloom = options.particleBloom ?? 0.65;
    if (glowContext?.drawImage && context.drawImage && bloom > 0) {
      glowContext.clearRect(0, 0, 320, 150);
      glowContext.drawImage(canvas, 0, 0, 320, 150);
      context.globalCompositeOperation = dark ? "lighter" : "source-over";
      context.globalAlpha = bloom * (dark ? 0.65 : 0.3);
      context.filter = "blur(5px)";
      context.drawImage(glow, 0, 0, 640, 300);
      context.globalAlpha = bloom * (dark ? 0.25 : 0.12);
      context.filter = "blur(12px)";
      context.drawImage(glow, 0, 0, 640, 300);
      context.filter = "none";
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
    }
    if (band) context.restore();
  }
  function paint(field, time, moving) {
    const useCache = moving && field.elapsed >= 2e3 && options.particleCache !== false && cache.available && (options.particleJitter ?? 0.75) > 0;
    if (!useCache) {
      paintRaw(field, time, moving);
      return;
    }
    if (strips?.available) {
      strips.paint(
        context,
        canvas,
        time,
        (at, band) => paintRaw(field, at, true, band)
      );
      return;
    }
    if (cache.composite(context, time)) return;
    paintRaw(field, cache.nextTime, true);
    cache.capture(canvas);
    paintRaw(field, time, true);
  }
  palette();
  return {
    paint,
    palette,
    releaseFrames: () => {
      cache.clear();
      strips?.clear();
    },
    resize: () => {
      const width = canvas.getBoundingClientRect().width;
      return strips ? strips.resize(width) : cache.resize(width);
    },
    get cachedFrames() {
      return strips ? strips.size : cache.size;
    },
    get rasterBytes() {
      return strips ? strips.rasterBytes : cache.rasterBytes;
    },
    dispose() {
      cache.clear();
      strips?.clear();
      groups.clear();
      glow.width = glow.height = 0;
    }
  };
}

// packages/visual-tools/chart-particles.js
function particleLayer(document, scene, { element, previousPositions, ...options }) {
  const canvas = node(document, "canvas", "ag-vt-chart__canvas");
  canvas.width = 1280;
  canvas.height = 600;
  canvas.setAttribute("aria-hidden", "true");
  let context;
  try {
    context = canvas.getContext("2d");
  } catch {
    return null;
  }
  if (!context || options.renderer === "ascii" && typeof context.fillText !== "function")
    return null;
  const view = document.defaultView, preference = view?.matchMedia?.("(prefers-reduced-motion: reduce)");
  const field = createParticleField(scene.particles, previousPositions);
  const makePainter = options.renderer === "ascii" ? asciiChartPainter : particlePainter;
  const painter = makePainter(
    document,
    element,
    canvas,
    context,
    scene.particles,
    options
  );
  let frame = 0, disposed = false, visible = !view?.IntersectionObserver, observer, intersection, resizeObserver, last = 0, clock = 0, started = false;
  element.dataset.particleCount = String(scene.particles.length);
  function stop() {
    if (frame) view.cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    field.settle();
    painter.releaseFrames();
    delete element.dataset.particleCachedFrames;
    delete element.dataset.particleCacheBytes;
    painter.paint(field, clock, false);
    painter.releaseFrames();
    element.removeAttribute("data-particles-animating");
  }
  function tick(now) {
    frame = 0;
    if (disposed || !visible || document.hidden || !element.isConnected) {
      stop();
      return;
    }
    const settled = field.elapsed >= 2e3;
    if (!last || now - last >= (settled ? 1e3 / 30 : 1e3 / 60) - 1) {
      const dt = last ? Math.min(64, now - last) : 16.667;
      last = now;
      clock += dt;
      field.advance(dt);
      painter.paint(field, clock, true);
      element.dataset.particleCachedFrames = String(painter.cachedFrames);
      element.dataset.particleCacheBytes = String(painter.rasterBytes);
    }
    const idleMotion = options.renderer === "ascii" ? (options.asciiSpeed ?? 0.6) > 0 : (options.particleJitter ?? 0.75) > 0;
    if (field.elapsed < 2e3 || idleMotion)
      frame = view.requestAnimationFrame(tick);
    else element.removeAttribute("data-particles-animating");
  }
  function play({ replay = false } = {}) {
    if (disposed) return false;
    if (replay) field.reset(true);
    if (!options.animated || options.paused || preference?.matches || document.hidden || !visible || !view?.requestAnimationFrame) {
      stop();
      return false;
    }
    if (!started) {
      field.reset();
      started = true;
    }
    if (!frame && scene.particles.length) {
      element.dataset.particlesAnimating = "true";
      last = 0;
      frame = view.requestAnimationFrame(tick);
    }
    return Boolean(frame);
  }
  const theme = () => {
    painter.palette();
    painter.paint(field, clock, Boolean(frame));
  };
  const resized = () => {
    if (!disposed && painter.resize())
      painter.paint(field, clock, Boolean(frame));
  };
  const changed = () => {
    if (preference?.matches || document.hidden) stop();
    else play();
  };
  function mount() {
    if (disposed) return;
    if (view?.MutationObserver) {
      observer = new view.MutationObserver(theme);
      for (let parent = element; parent; parent = parent.parentElement)
        observer.observe(parent, {
          attributes: true,
          attributeFilter: ["style", "class", "data-theme", "data-palette"]
        });
    }
    if (view?.IntersectionObserver) {
      intersection = new view.IntersectionObserver(
        (entries) => {
          visible = entries.some((entry) => entry.isIntersecting);
          if (visible) play();
          else stop();
        },
        { threshold: 0 }
      );
      intersection.observe(element);
    }
    painter.resize();
    if (view?.ResizeObserver) {
      resizeObserver = new view.ResizeObserver(resized);
      resizeObserver.observe(canvas);
    } else view?.addEventListener?.("resize", resized);
    painter.palette();
    painter.paint(field, clock, false);
    play();
  }
  view?.queueMicrotask?.(mount);
  preference?.addEventListener?.("change", changed);
  document.addEventListener("visibilitychange", changed);
  return {
    canvas,
    play,
    /** Paint an explicit selection once even when paused; ASCII radial motion owns no extra scheduler. */
    select(index) {
      if (!disposed && painter.select?.(index)) {
        painter.paint(field, clock, Boolean(frame));
        if (!frame) painter.releaseFrames();
      }
    },
    snapshot: field.snapshot,
    dispose() {
      if (disposed) return;
      if (frame) view.cancelAnimationFrame(frame);
      frame = 0;
      disposed = true;
      element.removeAttribute("data-particles-animating");
      delete element.dataset.particleCount;
      delete element.dataset.particleCachedFrames;
      delete element.dataset.particleCacheBytes;
      observer?.disconnect();
      intersection?.disconnect();
      resizeObserver?.disconnect();
      view?.removeEventListener?.("resize", resized);
      painter.dispose();
      preference?.removeEventListener?.("change", changed);
      document.removeEventListener("visibilitychange", changed);
      canvas.width = canvas.height = 0;
    }
  };
}

// packages/visual-tools/chart-presentation.js
var ns2 = "http://www.w3.org/2000/svg";
function svgScene(document, scene) {
  const svg = document.createElementNS(ns2, "svg");
  svg.setAttribute("viewBox", `0 0 ${scene.width} ${scene.height}`);
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("ag-vt-chart__svg");
  const axes = document.createElementNS(ns2, "g"), group = document.createElementNS(ns2, "g"), selection = document.createElementNS(ns2, "g");
  group.classList.add("ag-vt-chart__marks");
  selection.classList.add("ag-vt-chart__selection");
  for (const mark of scene.marks) {
    const shape = document.createElementNS(ns2, mark.tag);
    for (const [key, value] of Object.entries(mark.attrs))
      shape.setAttribute(key, String(value));
    if (mark.text !== void 0) shape.textContent = mark.text;
    const isData = ["path", "rect", "circle"].includes(mark.tag) || mark.tag === "line" && mark.attrs.stroke !== "var(--ag-border)";
    (isData ? group : axes).append(shape);
  }
  svg.append(axes, group, selection);
  return { svg, group, selection };
}
function highlight({ svg, selection, overlay, ascii, boundaries }, index) {
  selection.replaceChildren();
  const matches = [];
  for (const shape of svg.querySelectorAll("[data-point]")) {
    const active = Number(shape.getAttribute("data-point")) === index;
    shape.setAttribute("data-selected", String(active));
    if (active) matches.push(shape);
  }
  for (const shape of matches) {
    if (ascii) {
      const glyphs = asciiSelectionShape(svg.ownerDocument, shape, ascii);
      if (glyphs) selection.append(glyphs);
      continue;
    }
    const copy = shape.cloneNode(false);
    copy.removeAttribute("data-point");
    copy.removeAttribute("data-series");
    copy.removeAttribute("data-selected");
    copy.setAttribute("class", "ag-vt-chart__selected");
    copy.setAttribute("stroke", "var(--ag-text)");
    copy.setAttribute("stroke-width", "1.25");
    copy.setAttribute("vector-effect", "non-scaling-stroke");
    if (copy.tagName === "circle") {
      copy.setAttribute("r", String(Number(copy.getAttribute("r")) + 3));
      copy.setAttribute("fill", "none");
    } else copy.setAttribute("fill", "none");
    selection.append(copy);
  }
  if (overlay) {
    const layers = boundaries ? [boundaries, selection.cloneNode(true)] : [selection.cloneNode(true)];
    overlay.replaceChildren(...layers);
  }
}
function chartControls(document, listen, { previous, next, replay }) {
  const footer = node(document, "div", "ag-vt-chart__footer"), controls = node(document, "div", "ag-vt-chart__navigation"), prev = button(document, "", listen, previous), nextButton = button(document, "", listen, next), replayButton = button(document, "", listen, replay), counter = node(document, "span", "ag-vt-chart__counter"), readout = node(document, "output", "ag-vt-chart__readout");
  for (const [control, label, path] of [
    [prev, "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u0442\u043E\u0447\u043A\u0430", "m12 5-6 5 6 5"],
    [nextButton, "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u0442\u043E\u0447\u043A\u0430", "m8 5 6 5-6 5"],
    [replayButton, "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u0430\u043D\u0438\u043C\u0430\u0446\u0438\u044E", "M16 8a6 6 0 1 0 .2 4 M16 3v5h-5"]
  ]) {
    control.classList.add("ag-vt-chart__icon-button");
    control.setAttribute("aria-label", label);
    control.title = label;
    const svg = document.createElementNS(ns2, "svg");
    for (const [key, value] of Object.entries({
      viewBox: "0 0 20 20",
      width: 18,
      height: 18,
      fill: "none",
      stroke: "currentColor",
      "stroke-width": 1.7,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": true
    }))
      svg.setAttribute(key, String(value));
    const line = document.createElementNS(ns2, "path");
    line.setAttribute("d", path);
    svg.append(line);
    control.append(svg);
  }
  readout.setAttribute("aria-live", "polite");
  controls.append(prev, counter, nextButton, replayButton);
  footer.append(readout, controls);
  return {
    footer,
    readout,
    prev,
    next: nextButton,
    replay: replayButton,
    counter
  };
}

// packages/visual-tools/chart-motion.js
function chartMotion({ element, group, selection, animated = true }) {
  const view = element.ownerDocument.defaultView, preference = view?.matchMedia?.("(prefers-reduced-motion: reduce)");
  let entrance = null, pulse = null, disposed = false;
  function stop() {
    entrance?.cancel();
    pulse?.cancel();
    entrance = pulse = null;
    element.removeAttribute("data-animating");
  }
  function play() {
    if (disposed) return false;
    stop();
    if (!animated || preference?.matches || typeof group.animate !== "function")
      return false;
    element.dataset.animating = "true";
    entrance = group.animate(
      [
        { opacity: 0.12, transform: "translateY(14px) scaleY(.78)" },
        { opacity: 1, transform: "translateY(0) scaleY(1)" }
      ],
      { duration: 700, easing: "cubic-bezier(.2,.7,.2,1)", fill: "none" }
    );
    const owned = entrance;
    owned.finished.then(
      () => {
        if (entrance === owned) {
          entrance = null;
          element.removeAttribute("data-animating");
        }
      },
      () => {
      }
    );
    return true;
  }
  function selected() {
    if (disposed || !animated || preference?.matches || typeof selection.animate !== "function")
      return;
    pulse?.cancel();
    pulse = selection.animate([{ opacity: 0.3 }, { opacity: 1 }], {
      duration: 180,
      fill: "none"
    });
    pulse.finished.catch(() => {
    });
  }
  const changed = () => {
    if (preference.matches) stop();
  };
  preference?.addEventListener?.("change", changed);
  return {
    play,
    selected,
    dispose() {
      if (disposed) return;
      stop();
      disposed = true;
      preference?.removeEventListener?.("change", changed);
    }
  };
}

// packages/visual-tools/chart.js
var sequence = 0;
function pointText(value) {
  if (value === null) return "\u043D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445";
  if (typeof value === "object")
    return `x ${value.x}, y ${value.y}${value.size !== void 0 ? ", \u0440\u0430\u0437\u043C\u0435\u0440 " + value.size : ""}`;
  return String(value);
}
function dataTable(document, state) {
  const details = node(document, "details", "ag-vt-chart__data"), summary = node(document, "summary", "", "\u0414\u0430\u043D\u043D\u044B\u0435 \u0433\u0440\u0430\u0444\u0438\u043A\u0430"), table = node(document, "table", "ag-vt-table"), head = node(document, "tr");
  head.append(node(document, "th", "", "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F"));
  for (const series of state.series)
    head.append(node(document, "th", "", series.label));
  const thead = node(document, "thead"), body = node(document, "tbody");
  thead.append(head);
  table.append(thead, body);
  for (let index = 0; index < state.labels.length; index++) {
    const row = node(document, "tr"), heading = node(
      document,
      "th",
      "",
      axisPointLabel(state.labels, index, state.axisDates)
    );
    row.dataset.row = String(index);
    heading.scope = "row";
    row.append(heading);
    for (const series of state.series)
      row.append(
        node(
          document,
          "td",
          "",
          series.values[index] === null ? "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445" : pointText(series.values[index])
        )
      );
    body.append(row);
  }
  details.append(summary, table);
  return details;
}
function createChart({
  document = globalThis.document,
  ...options
} = {}) {
  let state, scene, disposed = false, layer, motion, presentation, controls, table, inspector, axisCleanup, listeners = [], selected = 0;
  const element = node(document, "section", "ag-vt ag-vt-chart"), id = "ag-chart-readout-" + ++sequence;
  const listen = (target, name, handler, options2) => {
    target.addEventListener(name, handler, options2);
    listeners.push(() => target.removeEventListener(name, handler, options2));
  };
  function select(index, { animate = true, notify = true } = {}) {
    if (disposed) return false;
    if (!Number.isInteger(index) || index < 0 || index >= state.labels.length)
      return false;
    selected = index;
    element.dataset.selectedIndex = String(index);
    highlight(presentation, index);
    layer?.select?.(index);
    inspector?.centerValue(index);
    controls.readout.textContent = axisPointLabel(state.labels, index, state.axisDates) + ": " + state.series.map((series) => series.label + " " + pointText(series.values[index])).join("; ");
    controls.counter.textContent = index + 1 + " / " + state.labels.length;
    controls.prev.disabled = index === 0;
    controls.next.disabled = index === state.labels.length - 1;
    for (const row of table.querySelectorAll("[data-row]"))
      row.classList.toggle(
        "ag-vt-chart__row--selected",
        Number(row.dataset.row) === index
      );
    if (animate) motion?.selected();
    if (notify) {
      inspector?.show(index);
      state.onSelect?.({ index, label: state.labels[index] });
    }
    return true;
  }
  function replay() {
    if (disposed) return false;
    const started = motion?.play() ?? false;
    const particles = layer?.play({ replay: true }) ?? false;
    return started || particles;
  }
  function choose(event) {
    const mark = event.target.closest?.("[data-point]");
    if (mark) {
      select(Number(mark.getAttribute("data-point")));
      return;
    }
    const hit = inspector?.locate(event);
    if (hit?.index !== null && hit) select(hit.index);
  }
  function key(event) {
    let index = selected;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") index--;
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") index++;
    else if (event.key === "Home") index = 0;
    else if (event.key === "End") index = state.labels.length - 1;
    else return;
    event.preventDefault();
    select(Math.max(0, Math.min(state.labels.length - 1, index)));
  }
  function update(next = {}) {
    if (disposed) return false;
    const candidate = {
      type: "line",
      renderer: "svg",
      arrangement: "grouped",
      animated: true,
      ...state,
      ...next
    };
    validateChart(candidate);
    if (Array.isArray(candidate.axisDates))
      candidate.axisDates = [...candidate.axisDates];
    const nextScene = chartScene(candidate), previousPositions = layer?.snapshot();
    axisCleanup?.();
    inspector = void 0;
    layer?.dispose();
    layer = void 0;
    motion?.dispose();
    for (const remove of listeners) remove();
    listeners = [];
    state = candidate;
    scene = nextScene;
    selected = Math.min(selected, Math.max(0, state.labels.length - 1));
    element.replaceChildren();
    element.append(node(document, "h3", "", state.label));
    const plot = node(document, "div", "ag-vt-chart__plot");
    plot.style.aspectRatio = scene.width + " / " + scene.height;
    plot.tabIndex = 0;
    plot.setAttribute("role", "group");
    plot.setAttribute("aria-label", state.label + " \u2014 \u0441\u0442\u0440\u0435\u043B\u043A\u0438 \u0432\u044B\u0431\u0438\u0440\u0430\u044E\u0442 \u0442\u043E\u0447\u043A\u0443");
    plot.setAttribute("aria-describedby", id);
    presentation = svgScene(document, scene);
    plot.append(presentation.svg);
    if (state.renderer === "ascii" && ["pie", "donut"].includes(state.type))
      plot.style.backgroundColor = "var(--ag-surface)";
    element.dataset.renderer = state.renderer;
    element.append(plot);
    listen(plot, "click", choose);
    listen(plot, "keydown", key);
    if (state.renderer === "particles" || state.renderer === "ascii") {
      layer = particleLayer(document, scene, {
        ...state,
        element,
        previousPositions
      });
      if (layer) {
        plot.append(layer.canvas);
        presentation.svg.classList.add("ag-vt-chart__svg--axes");
        const overlay = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );
        overlay.setAttribute("viewBox", "0 0 640 300");
        overlay.setAttribute("aria-hidden", "true");
        overlay.classList.add("ag-vt-chart__overlay");
        plot.append(overlay);
        presentation.overlay = overlay;
        if (state.renderer === "ascii") {
          presentation.ascii = { scene, options: state };
          presentation.boundaries = asciiSectorBoundaries(
            document,
            scene,
            presentation.svg
          );
        }
      } else
        element.append(
          node(document, "p", "ag-vt-muted", "Canvas \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D: \u043F\u043E\u043A\u0430\u0437\u0430\u043D SVG.")
        );
    }
    motion = chartMotion({
      element,
      group: presentation.group,
      selection: presentation.selection,
      animated: Boolean(state.animated) && !state.paused && !["particles", "ascii"].includes(state.renderer)
    });
    inspector = chartInspector(
      document,
      plot,
      state,
      scene,
      listen,
      select,
      pointText
    );
    const legend = node(document, "ul", "ag-vt-chart__legend");
    for (const [index, series] of state.series.entries())
      legend.append(node(document, "li", "", `${index + 1}. ${series.label}`));
    element.append(legend);
    controls = chartControls(document, listen, {
      previous: () => select(selected - 1),
      next: () => select(selected + 1),
      replay
    });
    controls.readout.id = id;
    controls.replay.hidden = !state.animated;
    table = dataTable(document, state);
    element.append(controls.footer, table);
    if (state.labels.length)
      select(selected, { animate: false, notify: false });
    else {
      controls.readout.textContent = "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445";
      controls.counter.textContent = "0 / 0";
      controls.prev.disabled = controls.next.disabled = true;
    }
    if (!state.series.some(
      (series) => series.values.some((value) => value !== null)
    ))
      element.append(
        node(document, "p", "ag-vt-muted", "\u041D\u0435\u0442 \u043F\u0435\u0440\u0435\u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0439")
      );
    axisCleanup = bindSvgAxisLabels(
      presentation.svg,
      state.labels,
      state.axisDates,
      { left: scene.left, right: scene.right, width: scene.width }
    );
    motion.play();
    return true;
  }
  update(options);
  return {
    element,
    update,
    select,
    replay,
    dispose() {
      if (disposed) return;
      disposed = true;
      axisCleanup?.();
      layer?.dispose();
      motion?.dispose();
      for (const remove of listeners) remove();
      listeners = [];
      element.remove();
    }
  };
}
export {
  createChart
};

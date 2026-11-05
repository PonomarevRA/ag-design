import { layoutAxisTicks, timeAxisValues, timeAxisUnit } from "./chart-axis.js";
import { reduceSeries } from "./analytic-model.js";
import { seriesOptions, analyticValue } from "./analytic-options.js";
const numberX = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
/** Prepare only visible pixel-budget marks; preserve original observation indices for raw-data lookup. */
export function analyticScene(
  raw,
  options,
  range,
  width,
  height,
  axisFontSize = 11,
) {
  const left = width < 360 ? 38 : 64,
    right = width - 38,
    top = 16,
    bottom = height - (options.time ? axisFontSize * 2.2 + 16 : 32);
  const axes = {
      left: { min: Infinity, max: -Infinity },
      right: { min: Infinity, max: -Infinity },
    },
    series = [];
  for (let i = 0; i < raw.series.length; i++) {
    const source = raw.series[i],
      field = seriesOptions(options, source.id, i);
    if (!field.visible) continue;
    const display = reduceSeries(
      raw,
      source,
      range,
      Math.max(1, right - left),
      field.connectNulls,
    );
    axes[field.axis].min = Math.min(axes[field.axis].min, display.min);
    axes[field.axis].max = Math.max(axes[field.axis].max, display.max);
    series.push({ id: source.id, label: source.label, ...display, field });
  }
  for (const side of ["left", "right"]) {
    const axis = axes[side],
      limits = options.axes[side];
    if (!Number.isFinite(axis.min)) {
      axis.min = 0;
      axis.max = 1;
    }
    axis.min = limits.min ?? axis.min;
    axis.max = limits.max ?? axis.max;
    if (axis.min === axis.max) {
      const pad = Math.abs(axis.min) * 0.05 || 1;
      axis.min = Math.max(-Number.MAX_VALUE, axis.min - pad);
      axis.max = Math.min(Number.MAX_VALUE, axis.max + pad);
    }
    // A single hard bound may exclude all observations. Keep that bound and
    // expand the automatic side; this must not fail later inside a paint callback.
    if (axis.min > axis.max) {
      const pad = Math.abs(limits.min ?? limits.max) * 0.05 || 1;
      if (limits.min !== undefined)
        axis.max = Math.min(Number.MAX_VALUE, axis.min + pad);
      else axis.min = Math.max(-Number.MAX_VALUE, axis.max - pad);
    }
  }
  const sx = (x) =>
    left + ((x - range[0]) / (range[1] - range[0] || 1)) * (right - left);
  // Normalize before subtracting so individually finite opposite-sign series
  // cannot overflow a shared axis span.
  const sy = (y, side = "left") => {
    const axis = axes[side];
    const scale = Math.max(Math.abs(axis.min), Math.abs(axis.max), 1);
    const position =
      (y / scale - axis.min / scale) /
      (axis.max / scale - axis.min / scale || 1);
    return bottom - position * (bottom - top);
  };
  return {
    width,
    height,
    left,
    right,
    top,
    bottom,
    series,
    axes,
    sx,
    sy,
    range,
    axisFontSize,
    time: options.time,
  };
}

/** Format X without changing its numeric coordinate; time labels explicitly use UTC. */
export function analyticX(value, time) {
  return time ? new Date(value).toISOString() : numberX.format(value);
}

/** Share visible tick values, precision and endpoint priority between Canvas and its SVG fallback. */
function analyticAxisTicks(scene, measure) {
  const values = scene.time
    ? timeAxisValues(scene.range, scene.right - scene.left)
    : Array.from(
        { length: 5 },
        (_, i) => scene.range[0] + ((scene.range[1] - scene.range[0]) * i) / 4,
      );
  const unit = timeAxisUnit(values.length > 2 ? values.slice(1) : values);
  // Adding an irregular endpoint must not switch a monthly axis to seconds.
  if (scene.time && values.at(-1) < scene.range[1]) values.push(scene.range[1]);
  scene.axisValues = values;
  scene.axisUnit = unit;
  return layoutAxisTicks({
    values: scene.time ? values : null,
    unit,
    labels: values.map((value) => analyticX(value, false)),
    positions: values.map(scene.sx),
    left: scene.left,
    right: scene.right,
    measure,
  });
}

/** Draw neutral axes, semantic series/thresholds and a precise raw cursor, clipping data to the actual plot. */
export function paintAnalytic(ctx, scene, options, colors, selection) {
  const { width, height, left, right, top, bottom, sx, sy } = scene;
  ctx.clearRect(0, 0, width, height);
  const font = scene.axisFontSize;
  ctx.font = font + "px system-ui";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = top + ((bottom - top) * i) / 4;
    ctx.strokeStyle = colors.border;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = colors.muted;
    ctx.textAlign = "right";
    const axis = scene.axes.left;
    ctx.fillText(
      analyticValue(
        axis.max * (1 - i / 4) + axis.min * (i / 4),
        scene.series.find((s) => s.field.axis === "left")?.field ??
          options.defaults,
      ),
      left - 7,
      y,
    );
    if (scene.series.some((s) => s.field.axis === "right")) {
      ctx.textAlign = "left";
      const a = scene.axes.right;
      ctx.fillText(
        analyticValue(
          a.max * (1 - i / 4) + a.min * (i / 4),
          scene.series.find((s) => s.field.axis === "right").field,
        ),
        right + 5,
        y,
      );
    }
  }
  const ticks = analyticAxisTicks(
    scene,
    (text) => ctx.measureText?.(text).width ?? text.length * font * 0.7,
  );
  scene.xTicks = ticks;
  ctx.textAlign = "center";
  ctx.fillStyle = colors.text;
  for (const tick of ticks) {
    ctx.textAlign =
      tick.anchor === "middle"
        ? "center"
        : tick.anchor === "start"
          ? "left"
          : "right";
    for (let line = 0; line < tick.lines.length; line++)
      ctx.fillText(
        tick.lines[line],
        line ? tick.contextX : tick.x,
        bottom + font + 8 + line * font * 1.1,
      );
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, top, right - left, bottom - top);
  ctx.clip();
  for (const threshold of options.thresholds) {
    ctx.strokeStyle = colors[threshold.color];
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(left, sy(threshold.value, threshold.axis));
    ctx.lineTo(right, sy(threshold.value, threshold.axis));
    ctx.stroke();
    ctx.setLineDash([]);
  }
  for (const series of scene.series) {
    const color = colors[series.field.color],
      baseline = sy(
        Math.max(
          scene.axes[series.field.axis].min,
          Math.min(0, scene.axes[series.field.axis].max),
        ),
        series.field.axis,
      );
    ctx.strokeStyle = color;
    ctx.lineWidth = series.field.lineWidth;
    let segment = [];
    function drawSegment() {
      if (!segment.length) return;
      const trace = () => {
        ctx.moveTo(sx(segment[0].x), sy(segment[0].y, series.field.axis));
        for (let j = 1; j < segment.length; j++) {
          if (series.field.interpolation === "step")
            ctx.lineTo(
              sx(segment[j].x),
              sy(segment[j - 1].y, series.field.axis),
            );
          ctx.lineTo(sx(segment[j].x), sy(segment[j].y, series.field.axis));
        }
      };
      if (series.field.fill) {
        ctx.beginPath();
        trace();
        ctx.lineTo(sx(segment.at(-1).x), baseline);
        ctx.lineTo(sx(segment[0].x), baseline);
        ctx.closePath();
        ctx.globalAlpha = series.field.fill;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      trace();
      ctx.stroke();
      if (segment.length === 1) {
        ctx.fillStyle = color;
        ctx.fillRect(
          sx(segment[0].x) - 1,
          sy(segment[0].y, series.field.axis) - 1,
          2,
          2,
        );
      }
      segment = [];
    }
    for (const point of series.points) {
      if (point.move) drawSegment();
      segment.push(point);
    }
    drawSegment();
  }
  if (selection !== undefined) {
    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(sx(selection), top);
    ctx.lineTo(sx(selection), bottom);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

/** Small SVG fallback uses the same reduced observations and gaps, never a million DOM nodes. */
export function analyticSvg(document, scene, colors) {
  const ns = "http://www.w3.org/2000/svg",
    svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${scene.width} ${scene.height}`);
  svg.setAttribute("aria-hidden", "true");
  for (const series of scene.series) {
    const path = document.createElementNS(ns, "path");
    let d = "";
    for (const point of series.points) {
      d +=
        (!d || point.move ? "M" : "L") +
        scene.sx(point.x) +
        "," +
        scene.sy(point.y, series.field.axis) +
        " ";
    }
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", colors[series.field.color]);
    path.setAttribute("stroke-width", String(series.field.lineWidth));
    svg.append(path);
  }
  const ticks = analyticAxisTicks(
    scene,
    (text) => text.length * scene.axisFontSize * 0.7,
  );
  scene.xTicks = ticks;
  const retained = new Map(ticks.map((tick) => [tick.index, tick]));
  for (let index = 0; index < scene.axisValues.length; index++) {
    const tick = retained.get(index);
    const text = document.createElementNS(ns, "text");
    text.setAttribute("x", scene.sx(scene.axisValues[index]));
    text.setAttribute("y", scene.bottom + scene.axisFontSize + 8);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", colors.text);
    text.setAttribute("font-size", scene.axisFontSize);
    text.setAttribute("font-family", "system-ui");
    text.setAttribute("data-time-axis-tick", index);
    text.setAttribute("data-axis-index", index);
    text.setAttribute("data-axis-x", scene.sx(scene.axisValues[index]));
    text.style.display = tick ? "" : "none";
    for (let line = 0; tick && line < tick.lines.length; line++) {
      const span = document.createElementNS(ns, "tspan");
      span.setAttribute("x", line ? tick.contextX : tick.x);
      span.setAttribute("dy", line ? "1.1em" : "0");
      span.textContent = tick.lines[line];
      text.append(span);
    }
    svg.append(text);
  }
  return svg;
}

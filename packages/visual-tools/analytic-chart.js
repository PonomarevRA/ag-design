import { bindSvgAxisLabels } from "./chart-axis-svg.js";
import { node } from "./runtime.js";
import {
  analyticData,
  analyticRange,
  appendAnalytic,
  nearestIndex,
} from "./analytic-model.js";
import {
  analyticOptions,
  seriesOptions,
  analyticValue,
} from "./analytic-options.js";
import {
  analyticScene,
  paintAnalytic,
  analyticSvg,
  analyticX,
} from "./analytic-paint.js";

/** Explicit local sync groups have no window-global bus and stop retaining charts after unsubscribe. */
export function createChartSync() {
  const subscribers = new Set();
  return {
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
    publish(value, source) {
      for (const fn of subscribers) fn(value, source);
    },
    get size() {
      return subscribers.size;
    },
  };
}

/** Numeric/time analytical Canvas chart: stable DOM, raw exact lookup, partial updates and one visibility-bound pending paint. */
export function createAnalyticChart({
  document = globalThis.document,
  data,
  options = {},
  width = 640,
  height = 260,
  syncGroup,
  autoResize = true,
  pixelRatio,
} = {}) {
  let raw = analyticData(data),
    settings = analyticOptions(options),
    range = analyticRange(raw),
    size = validSize(width, height),
    selected = 0,
    disposed = false,
    frame = 0,
    visible = true,
    scene = null,
    axisCleanup = null,
    paintCount = 0,
    drag = null,
    page = 0,
    selectedSeries = raw.series[0].id;
  if (
    pixelRatio !== undefined &&
    (!Number.isFinite(pixelRatio) || pixelRatio < 1 || pixelRatio > 2)
  )
    throw new RangeError("Pixel ratio1..2 required");
  checkTime(raw, settings, range);
  const view = document.defaultView,
    listeners = [],
    legendButtons = new Map();
  const element = node(document, "section", "ag-vt ag-analytic"),
    title = node(document, "h3", "", settings.label),
    legend = node(document, "div", "ag-analytic__legend"),
    plot = node(document, "div", "ag-analytic__plot"),
    canvas = node(document, "canvas"),
    fallback = node(document, "div", "ag-analytic__fallback"),
    cursor = node(document, "div", "ag-analytic__cursor"),
    readout = node(document, "output", "ag-analytic__readout"),
    actions = node(document, "div", "ag-vt-actions"),
    details = node(document, "details", "ag-vt-chart__data"),
    summary = node(document, "summary", "", "Точные данные"),
    tableHost = node(document, "div"),
    pageLabel = node(document, "output");
  plot.tabIndex = 0;
  plot.setAttribute("role", "group");
  plot.setAttribute(
    "aria-label",
    settings.label + "; стрелки — значения, +/− — масштаб, Home — сброс",
  );
  canvas.setAttribute("aria-hidden", "true");
  cursor.setAttribute("aria-hidden", "true");
  plot.append(canvas, fallback, cursor);
  details.append(summary, tableHost);
  element.append(title, legend, plot, readout, actions, details);
  let ctx = null;
  try {
    ctx = canvas.getContext("2d");
  } catch {
    /* SVG and exact values remain usable without Canvas. */
  }
  canvas.hidden = !ctx;
  fallback.hidden = Boolean(ctx);
  /** Epoch-millisecond mode rejects invalid dates synchronously, before any scheduled paint or state mutation. */
  function checkTime(model, options, viewport) {
    if (
      options.time &&
      [model.x[0], model.x.at(-1), ...viewport].some(
        (value) => Math.abs(value) > 8.64e15,
      )
    )
      throw new RangeError("Time values must fit the JavaScript date range");
  }
  /** Move a lightweight cursor independently of the data canvas. */
  function drawCursor() {
    if (!scene || disposed) return;
    const x = scene.sx(raw.x[selected]);
    cursor.hidden =
      settings.tooltip === "hidden" || x < scene.left || x > scene.right;
    cursor.style.left = (x / size.width) * 100 + "%";
    cursor.style.top = scene.top + "px";
    cursor.style.bottom = size.height - scene.bottom + "px";
  }
  /** Reject allocation sizes outside the documented bounds before changing state. */
  function validSize(w, h) {
    if (
      !Number.isFinite(w) ||
      !Number.isFinite(h) ||
      w < 160 ||
      w > 4096 ||
      h < 100 ||
      h > 2048
    )
      throw new RangeError("Chart size160..4096 ×100..2048 required");
    return { width: Math.round(w), height: Math.round(h) };
  }
  function listen(target, event, fn, options) {
    target.addEventListener(event, fn, options);
    listeners.push(() => target.removeEventListener(event, fn, options));
  }
  function button(label, callback, host = actions) {
    const b = node(document, "button", "ag-vt-button", label);
    b.type = "button";
    listen(b, "click", callback);
    host.append(b);
    return b;
  }
  /** Build a bounded page on demand, retaining every raw observation independently of display reduction. */
  function showTable() {
    if (!details.open) return;
    const table = node(document, "table", "ag-vt-table"),
      head = node(document, "tr");
    head.append(node(document, "th", "", "X" + (settings.time ? " UTC" : "")));
    for (const s of raw.series) head.append(node(document, "th", "", s.label));
    table.append(head);
    page = Math.min(page, Math.floor((raw.x.length - 1) / 64));
    const start = page * 64;
    for (let i = start; i < Math.min(raw.x.length, start + 64); i++) {
      const row = node(document, "tr");
      row.append(node(document, "th", "", analyticX(raw.x[i], settings.time)));
      for (let j = 0; j < raw.series.length; j++)
        row.append(
          node(
            document,
            "td",
            "",
            analyticValue(
              raw.series[j].values[i],
              seriesOptions(settings, raw.series[j].id, j),
            ),
          ),
        );
      table.append(row);
    }
    tableHost.replaceChildren(table);
    pageLabel.textContent = `${page + 1} / ${Math.ceil(raw.x.length / 64)}`;
  }
  const paging = node(document, "div", "ag-vt-actions");
  details.append(paging);
  button(
    "Предыдущие строки",
    () => {
      page = Math.max(0, page - 1);
      showTable();
    },
    paging,
  );
  paging.append(pageLabel);
  button(
    "Следующие строки",
    () => {
      page = Math.min(Math.floor((raw.x.length - 1) / 64), page + 1);
      showTable();
    },
    paging,
  );
  listen(details, "toggle", showTable);
  /** Exact readout always uses original data, including missing values and stable hidden-series settings. */
  function read() {
    if (
      !raw.series.some(
        (s) => s.id === selectedSeries && seriesOptions(settings, s.id).visible,
      )
    )
      selectedSeries = raw.series.find(
        (s) => seriesOptions(settings, s.id).visible,
      )?.id;
    const values = [];
    for (let i = 0; i < raw.series.length; i++) {
      const s = raw.series[i],
        field = seriesOptions(settings, s.id, i);
      if (
        field.visible &&
        (settings.tooltip !== "selected" || s.id === selectedSeries)
      )
        values.push(s.label + ": " + analyticValue(s.values[selected], field));
    }
    readout.textContent =
      analyticX(raw.x[selected], settings.time) + " · " + values.join(" · ");
    readout.hidden = settings.tooltip === "hidden";
  }
  /** Reuse legend controls by ID so a data-only update does not steal keyboard focus. */
  function refreshLegend() {
    const retained = new Set();
    for (const s of raw.series) {
      retained.add(s.id);
      let b = legendButtons.get(s.id);
      if (!b) {
        b = node(document, "button", "ag-vt-button");
        b.type = "button";
        b.dataset.seriesId = s.id;
        legend.append(b);
        legendButtons.set(s.id, b);
      }
      b.textContent = s.label;
      b.setAttribute(
        "aria-pressed",
        String(seriesOptions(settings, s.id).visible),
      );
    }
    for (const [id, b] of legendButtons)
      if (!retained.has(id)) {
        b.remove();
        legendButtons.delete(id);
      }
  }
  // One delegated listener avoids retaining removed controls when series identities change.
  listen(legend, "click", (event) => {
    const control = event.target.closest?.("button[data-series-id]");
    if (!control || control.parentNode !== legend) return;
    const id = control.dataset.seriesId;
    const field = seriesOptions(settings, id);
    setOptions({
      overrides: {
        ...settings.overrides,
        [id]: { ...settings.overrides[id], visible: !field.visible },
      },
    });
  });
  /** Coalesce paints; hidden/offscreen instances keep raw data but release display and canvas buffers. */
  function schedule() {
    if (disposed || !visible || document.hidden || frame) return;
    frame = view.requestAnimationFrame(() => {
      frame = 0;
      flush();
    });
  }
  function colors() {
    const style = view.getComputedStyle(element),
      result = {};
    for (const token of [
      "accent",
      "success",
      "danger",
      "text",
      "muted",
      "border",
    ])
      result[token] =
        style.getPropertyValue("--ag-" + token).trim() || "currentColor";
    return result;
  }
  /** Flush only owned rendering work; no data validation, DOM reconstruction or repeat animation loop. */
  function flush() {
    if (disposed || !visible || document.hidden) return false;
    if (frame) {
      view.cancelAnimationFrame(frame);
      frame = 0;
    }
    const rootScale =
      (parseFloat(view.getComputedStyle(document.documentElement).fontSize) ||
        16) / 16;
    const axisFontSize = Math.max(
      11 * rootScale,
      (parseFloat(view.getComputedStyle(element).fontSize) || 14) * 0.8,
    );
    if (!scene || scene.axisFontSize !== axisFontSize)
      scene = analyticScene(
        raw,
        settings,
        range,
        size.width,
        size.height,
        axisFontSize,
      );
    plot.style.height = size.height + "px";
    const palette = colors();
    if (ctx) {
      const dpr = pixelRatio ?? Math.min(2, view.devicePixelRatio || 1);
      if (
        canvas.width !== size.width * dpr ||
        canvas.height !== size.height * dpr
      ) {
        canvas.width = size.width * dpr;
        canvas.height = size.height * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintAnalytic(ctx, scene, settings, palette, undefined);
    } else {
      axisCleanup?.();
      const svg = analyticSvg(document, scene, palette),
        paintedScene = scene;
      fallback.replaceChildren(svg);
      axisCleanup = bindSvgAxisLabels(
        svg,
        scene.axisValues.map((value) => analyticX(value, false)),
        scene.time ? scene.axisValues : false,
        {
          left: scene.left,
          right: scene.right,
          width: scene.width,
          minFont: 11,
          unit: scene.axisUnit,
          onLayout: (ticks) => {
            paintedScene.xTicks = ticks;
          },
        },
      );
    }
    drawCursor();
    paintCount++;
    return true;
  }
  /** Preserve the same plot/canvas/legend state on validated data replacement. */
  function setData(data) {
    if (disposed) return false;
    const candidate = analyticData(data);
    checkTime(candidate, settings, range);
    const oldX = raw.x[selected];
    raw = candidate;
    selected = nearestIndex(raw.x, oldX);
    if (!raw.series.some((s) => s.id === selectedSeries))
      selectedSeries = raw.series[0].id;
    scene = null;
    refreshLegend();
    read();
    showTable();
    schedule();
    return true;
  }
  function setSize(w, h) {
    if (disposed) return false;
    const candidate = validSize(w, h);
    if (candidate.width === size.width && candidate.height === size.height)
      return true;
    size = candidate;
    scene = null;
    schedule();
    return true;
  }
  function setRange(next, { notify = true } = {}) {
    if (disposed) return false;
    const candidate = analyticRange(raw, next);
    checkTime(raw, settings, candidate);
    range = candidate;
    scene = null;
    schedule();
    if (notify) syncGroup?.publish({ range: [...range] }, element);
    return true;
  }
  /** Merge field groups transactionally. Invalid settings retain the currently usable chart. */
  function setOptions(next) {
    if (disposed) return false;
    const candidate = analyticOptions({
      ...settings,
      ...next,
      defaults: { ...settings.defaults, ...next.defaults },
      axes: { ...settings.axes, ...next.axes },
    });
    checkTime(raw, candidate, range);
    settings = candidate;
    scene = null;
    title.textContent = settings.label;
    plot.setAttribute(
      "aria-label",
      settings.label + "; стрелки — значения, +/− — масштаб, Home — сброс",
    );
    refreshLegend();
    read();
    showTable();
    schedule();
    return true;
  }
  function select(index, { notify = true, seriesId } = {}) {
    if (
      disposed ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= raw.x.length
    )
      return false;
    if (seriesId !== undefined) {
      if (!raw.series.some((s) => s.id === seriesId))
        throw new TypeError("Unknown series");
      selectedSeries = seriesId;
    }
    selected = index;
    read();
    drawCursor();
    if (notify) syncGroup?.publish({ x: raw.x[index] }, element);
    return true;
  }
  function zoom(factor) {
    const center = (range[0] + range[1]) / 2,
      half = ((range[1] - range[0] || 1) * factor) / 2;
    setRange([center - half, center + half]);
  }
  function reset() {
    return setRange([raw.x[0], raw.x.at(-1)]);
  }
  button("Увеличить", () => zoom(0.5));
  button("Уменьшить", () => zoom(2));
  button("Сбросить диапазон", reset);
  listen(plot, "keydown", (event) => {
    if (event.key === "Home") {
      event.preventDefault();
      reset();
    } else if (["+", "=", "-"].includes(event.key)) {
      event.preventDefault();
      zoom(event.key === "-" ? 2 : 0.5);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const step = event.key === "ArrowLeft" ? -1 : 1;
      if (event.shiftKey) {
        const delta = (range[1] - range[0]) * step * 0.1;
        setRange([range[0] + delta, range[1] + delta]);
      } else select(Math.max(0, Math.min(raw.x.length - 1, selected + step)));
    }
  });
  /** Pointer hover performs O(log n) raw lookup; drag changes the viewport, never source observations. */
  function locate(event) {
    const rect = plot.getBoundingClientRect(),
      left = size.width < 360 ? 38 : 64,
      right = size.width - 38;
    const pixel =
      ((event.clientX - rect.left) / Math.max(1, rect.width)) * size.width;
    const value =
      range[0] +
      Math.max(0, Math.min(1, (pixel - left) / (right - left))) *
        (range[1] - range[0]);
    const index = nearestIndex(raw.x, value);
    let closest = Infinity,
      id = selectedSeries;
    if (scene) {
      const y =
        ((event.clientY - rect.top) / Math.max(1, rect.height)) * size.height;
      for (const s of scene.series) {
        const source = raw.series.find((item) => item.id === s.id),
          v = source.values[index];
        if (Number.isNaN(v)) continue;
        const distance = Math.abs(scene.sy(v, s.field.axis) - y);
        if (distance < closest) {
          closest = distance;
          id = s.id;
        }
      }
    }
    select(index, { seriesId: id });
  }
  listen(plot, "pointermove", (event) => {
    if (drag) {
      const delta =
        ((event.clientX - drag.x) /
          Math.max(1, plot.getBoundingClientRect().width)) *
        (drag.range[1] - drag.range[0]);
      setRange([drag.range[0] - delta, drag.range[1] - delta]);
    } else locate(event);
  });
  listen(plot, "pointerdown", (event) => {
    if (event.button !== 0) return;
    drag = { x: event.clientX, range: [...range], id: event.pointerId };
    plot.setPointerCapture?.(event.pointerId);
    plot.focus();
    locate(event);
  });
  function release() {
    if (drag && plot.hasPointerCapture?.(drag.id))
      plot.releasePointerCapture(drag.id);
    drag = null;
  }
  listen(plot, "pointerup", release);
  listen(plot, "pointercancel", release);
  listen(plot, "lostpointercapture", () => {
    drag = null;
  });
  function setVisible(value) {
    if (typeof value !== "boolean")
      throw new TypeError("Boolean visibility required");
    if (disposed) return;
    visible = value;
    if (!visible || document.hidden) {
      if (frame) view.cancelAnimationFrame(frame);
      frame = 0;
      axisCleanup?.();
      axisCleanup = null;
      scene = null;
      canvas.width = canvas.height = 1;
      fallback.replaceChildren();
    } else schedule();
  }
  listen(document, "visibilitychange", () => setVisible(visible));
  const intersection = view.IntersectionObserver
    ? new view.IntersectionObserver(
        (entries) => {
          for (const entry of entries)
            if (entry.target === element) setVisible(entry.isIntersecting);
        },
        { rootMargin: "80px" },
      )
    : null;
  intersection?.observe(element);
  const resize =
    autoResize && view.ResizeObserver
      ? new view.ResizeObserver((entries) => {
          const w = entries[0]?.contentRect.width;
          if (w >= 160 && w <= 4096) setSize(w, size.height);
        })
      : null;
  resize?.observe(plot);
  const paletteObserver = view.MutationObserver
    ? new view.MutationObserver(schedule)
    : null;
  for (const ancestor of [element, document.documentElement])
    paletteObserver?.observe(ancestor, {
      attributes: true,
      attributeFilter: ["style", "class", "data-theme", "data-palette"],
    });
  const unsubscribe = syncGroup?.subscribe((message, source) => {
    if (source === element || disposed) return;
    if (message.range) setRange(message.range, { notify: false });
    if (message.x !== undefined)
      select(nearestIndex(raw.x, message.x), { notify: false });
  });
  refreshLegend();
  read();
  schedule();
  return {
    element,
    setData,
    setSize,
    setRange,
    setOptions,
    select,
    reset,
    flush,
    setVisible,
    appendData(addition, { maxPoints = 1_000_000, follow = false } = {}) {
      if (disposed) return false;
      const candidate = appendAnalytic(raw, addition, maxPoints);
      const span = range[1] - range[0],
        oldX = raw.x[selected];
      const nextRange = follow
        ? analyticRange(candidate, [
            candidate.x.at(-1) - span,
            candidate.x.at(-1),
          ])
        : range;
      checkTime(candidate, settings, nextRange);
      raw = candidate;
      selected = nearestIndex(raw.x, oldX);
      range = nextRange;
      scene = null;
      read();
      showTable();
      schedule();
      return true;
    },
    get options() {
      return structuredClone(settings);
    },
    get range() {
      return [...range];
    },
    get stats() {
      return {
        rawPoints: raw?.x.length ?? 0,
        rawBytes: raw?.bytes ?? 0,
        displayPoints:
          scene?.series.reduce((n, s) => n + s.points.length, 0) ?? 0,
        canvasBytes: canvas.width * canvas.height * 4,
        paintCount,
        pendingFrame: Boolean(frame),
        visible,
        disposed,
      };
    },
    /** Numeric evidence for the last painted X labels; empty before painting or after disposal. */
    getAxisTicks() {
      return structuredClone(scene?.xTicks || []);
    },
    getPoint(index = selected) {
      if (disposed) throw new Error("Chart disposed");
      if (!Number.isInteger(index) || index < 0 || index >= raw.x.length)
        throw new RangeError("Unknown raw index");
      return {
        index,
        x: raw.x[index],
        values: raw.series.map((s) => ({
          id: s.id,
          label: s.label,
          value: Number.isNaN(s.values[index]) ? null : s.values[index],
        })),
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      release();
      if (frame) view.cancelAnimationFrame(frame);
      frame = 0;
      intersection?.disconnect();
      resize?.disconnect();
      paletteObserver?.disconnect();
      axisCleanup?.();
      axisCleanup = null;
      unsubscribe?.();
      for (const remove of listeners) remove();
      legendButtons.clear();
      scene = null;
      raw = null;
      canvas.width = canvas.height = 1;
      element.remove();
    },
  };
}

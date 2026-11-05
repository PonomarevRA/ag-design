const CONTROL = "button,input,select,textarea,a[href],[tabindex]";
const EPSILON = 1;
const MAX_TARGETS = 64;
const MAX_DEPTH = 128;

/** Interpretation identity is separate from the unchanged DOM rectangle measurement method. */
export const COMPOSITION_CLIPPING_METHOD = "scroll-reachability-v1";

/** Normalize CSS overflow's paired-axis computed-value rules, including simplified DOM test realms. */
function overflowAxes(style) {
  const shorthand = (style.overflow || "visible").split(/\s+/);
  let x = style.overflowX || shorthand[0],
    y = style.overflowY || shorthand[1] || shorthand[0];
  const ordinary = new Set(["visible", "clip"]);
  const originalX = x,
    originalY = y;
  if (!ordinary.has(originalY)) {
    if (x === "visible") x = "auto";
    if (x === "clip") x = "hidden";
  }
  if (!ordinary.has(originalX)) {
    if (y === "visible") y = "auto";
    if (y === "clip") y = "hidden";
  }
  return { x, y };
}

/** Recognize geometry outside this axis-aligned, horizontal-writing DOM evidence model. */
function unsupported(style) {
  for (const property of [
    "clipPath",
    "maskImage",
    "webkitMaskImage",
    "transform",
    "translate",
    "rotate",
    "scale",
    "perspective",
  ])
    if (style[property] && style[property] !== "none") return true;
  return Boolean(
    (style.writingMode && style.writingMode !== "horizontal-tb") ||
    (style.zoom && !["normal", "1"].includes(style.zoom)) ||
    /paint|strict|content/.test(style.contain || "") ||
    (style.clip && style.clip !== "auto") ||
    (style.overflowClipMargin && style.overflowClipMargin !== "0px") ||
    ["fixed", "sticky"].includes(style.position),
  );
}

/** Any root/body containment changes viewport overflow propagation, outside this ordinary-document model. */
function rootContainment(style) {
  return Boolean(style?.contain && style.contain !== "none");
}

/** Read finite CSS-pixel bounds without trusting possibly inconsistent cached right/bottom fields. */
function rectangle(element) {
  const value = element.getBoundingClientRect();
  if (
    ![value.x, value.y, value.width, value.height].every(Number.isFinite) ||
    value.width < 0 ||
    value.height < 0
  )
    return null;
  return { x: value.x, y: value.y, width: value.width, height: value.height };
}

/** Intersect possible target-start positions with a visible port. Unknown movement never becomes a guessed failure. */
function constrain(range, start, length) {
  if (range.size > length + EPSILON) return true;
  const low = Math.max(range.low, start),
    high = Math.min(range.high, start + length - range.size);
  if (low > high + EPSILON) return range.uncertain ? null : true;
  const middle = (low + high) / 2;
  return {
    ...range,
    low: low > high ? middle : low,
    high: low > high ? middle : high,
  };
}

/** Expand reachable positions using measured CSSOM offsets; RTL supports the standard negative scrollLeft model. */
function scrollRange(range, element, style, axis, portLength, extent, offset) {
  const maximum = extent - portLength;
  const rtl =
    axis === "x" &&
    (style.direction || element.closest("[dir]")?.dir) === "rtl";
  const lower = rtl ? -maximum : 0,
    upper = rtl ? 0 : maximum;
  const unsupportedOrigin =
    axis === "y" && style.flexDirection === "column-reverse";
  if (
    !Number.isFinite(extent) ||
    !Number.isFinite(offset) ||
    maximum < -EPSILON ||
    offset < lower - EPSILON ||
    offset > upper + EPSILON ||
    unsupportedOrigin ||
    (style.scrollSnapType && style.scrollSnapType !== "none")
  )
    return { ...range, uncertain: true };
  return {
    ...range,
    low: range.low + offset - upper,
    high: range.high + offset - lower,
  };
}

/** A scrollport is its client box, excluding borders and any scrollbar on the inline-start side. */
function clientPort(element, rect, axis) {
  const inset = axis === "x" ? element.clientLeft : element.clientTop,
    length = axis === "x" ? element.clientWidth : element.clientHeight;
  if (
    !Number.isFinite(inset) ||
    !Number.isFinite(length) ||
    inset < 0 ||
    length < 0 ||
    inset + length > rect[axis === "x" ? "width" : "height"] + EPSILON
  )
    return null;
  return { start: rect[axis] + inset, length };
}

/** Propagate a control/endpoint through actual ancestor ports, preserving all outer hidden constraints. */
function throughAncestors(range, context, axis, state) {
  for (const ancestor of context.chain.slice(1)) {
    if (ancestor === state.html || ancestor === state.propagated) continue;
    const style = state.styles.get(ancestor),
      overflow = overflowAxes(style)[axis];
    if (overflow === "visible") continue;
    if (!["hidden", "clip", "auto", "scroll"].includes(overflow)) return null;
    const port = clientPort(ancestor, state.rects.get(ancestor), axis);
    if (!port) return null;
    if (overflow === "auto" || overflow === "scroll") {
      range = scrollRange(
        range,
        ancestor,
        style,
        axis,
        port.length,
        axis === "x" ? ancestor.scrollWidth : ancestor.scrollHeight,
        axis === "x" ? ancestor.scrollLeft : ancestor.scrollTop,
      );
    }
    range = constrain(range, port.start, port.length);
    if (range === true || range === null) return range;
  }
  return range;
}

/** Viewport Y may expose normal document scrolling; page X never receives a horizontal-reflow waiver. */
function throughViewport(range, axis, state) {
  if (axis === "x") {
    if (!Number.isFinite(state.view.scrollX)) return null;
    return constrain(range, -state.view.scrollX, state.width);
  }
  if (["hidden", "clip"].includes(state.viewportOverflow.y))
    return constrain(range, 0, state.height);
  const current = constrain(range, 0, state.height);
  if (current !== true && current !== null) return current;
  const scroll = state.document.scrollingElement || state.html;
  const extent = Math.max(
    scroll.scrollHeight,
    state.html.scrollHeight,
    state.document.body?.scrollHeight || 0,
  );
  if (!Number.isFinite(extent) || extent < state.height - EPSILON) return null;
  range = scrollRange(
    range,
    scroll,
    state.styles.get(state.html),
    "y",
    state.height,
    extent,
    state.view.scrollY,
  );
  return constrain(range, 0, state.height);
}

/**
 * Return true for proven inaccessible clipping, false for supported reachability, otherwise null.
 * Controls must fit a reachable port as a whole. Noninteractive wrappers use endpoint coverage:
 * a tall form may be read sequentially while every contained control is still checked separately.
 * This bounded DOM model does not certify arbitrary transforms, sticky/fixed layouts, snap or AT access.
 */
export function compositionClipping(element, view) {
  const document = element.ownerDocument,
    html = document.documentElement;
  const targets = [element, ...element.querySelectorAll(CONTROL)];
  if (targets.length > MAX_TARGETS) return null;
  const styles = new Map(),
    rects = new Map(),
    contexts = [];
  // Preflight the entire bounded evidence set before declaring any offscreen target a failure.
  for (const target of targets) {
    const chain = [];
    let ancestor = target,
      hidden = false;
    while (ancestor) {
      if (chain.length === MAX_DEPTH) return null;
      chain.push(ancestor);
      if (!styles.has(ancestor)) {
        styles.set(ancestor, view.getComputedStyle(ancestor));
        rects.set(ancestor, rectangle(ancestor));
      }
      const style = styles.get(ancestor);
      if (unsupported(style) || !rects.get(ancestor)) return null;
      if (
        (ancestor === html || ancestor === document.body) &&
        rootContainment(style)
      )
        return null;
      if (style.display === "none" || style.visibility === "hidden")
        hidden = true;
      if (ancestor === html) break;
      ancestor = ancestor.parentElement;
    }
    if (chain.at(-1) !== html) return null;
    if (!hidden) contexts.push({ target, chain });
  }
  const width = html.clientWidth || view.innerWidth,
    height = html.clientHeight || view.innerHeight;
  if (![width, height].every((value) => Number.isFinite(value) && value > 0))
    return null;
  const rootOverflow = overflowAxes(styles.get(html));
  const bodyStyle = document.body
    ? styles.get(document.body) || view.getComputedStyle(document.body)
    : null;
  if (rootContainment(bodyStyle)) return null;
  const propagated =
    rootOverflow.x === "visible" &&
    rootOverflow.y === "visible" &&
    bodyStyle?.display !== "none"
      ? document.body
      : null;
  const propagatedStyle = propagated ? bodyStyle : null;
  if (propagatedStyle && unsupported(propagatedStyle)) return null;
  const viewportOverflow = propagatedStyle
    ? overflowAxes(propagatedStyle)
    : rootOverflow;
  const state = {
    document,
    html,
    view,
    styles,
    rects,
    width,
    height,
    propagated,
    viewportOverflow,
  };
  let unknown = false,
    clipped = false;
  for (const context of contexts) {
    const rect = rects.get(context.target),
      control = context.target.matches(CONTROL);
    for (const axis of ["x", "y"]) {
      const size = rect[axis === "x" ? "width" : "height"];
      const offsets = control ? [0] : [0, size];
      for (const offset of offsets) {
        let range = {
          low: rect[axis] + offset,
          high: rect[axis] + offset,
          size: control ? size : 0,
          uncertain: false,
        };
        range = throughAncestors(range, context, axis, state);
        if (range !== true && range !== null)
          range = throughViewport(range, axis, state);
        if (range === null) unknown = true;
        if (range === true) clipped = true;
      }
    }
  }
  return unknown ? null : clipped;
}

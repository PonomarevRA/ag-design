import { evaluateColorPair } from "./color-profile.js";
import {
  hexOklch,
  hexHsl,
  mapOklch,
  mapHsl,
  hueWrap,
} from "./palette-color.js";

const SVG = "http://www.w3.org/2000/svg";
/** Small annotation ink is checked independently of the user's specimen typography. */
export function paletteLabelInk(hex) {
  const candidates = ["#000000", "#ffffff"].map((color) => ({
    color,
    check: evaluateColorPair({
      foreground: color,
      background: hex,
      fontSize: 12,
      fontWeight: 700,
      role: "label",
    }),
  }));
  candidates.sort(
    (a, b) =>
      Number(b.check.wcag2.aa) - Number(a.check.wcag2.aa) ||
      b.check.weightedScore - a.check.weightedScore,
  );
  return candidates[0].color;
}
/** Snapshot client CSS coordinates to hue degrees/radius in viewBox units; ring repaints cannot move the gesture origin. */
function pointerProjection(svg) {
  const view = svg.ownerDocument.defaultView;
  let inverse;
  const matrix = svg.getScreenCTM?.();
  if (matrix && view.DOMPoint) {
    try {
      inverse = matrix.inverse();
    } catch {
      return null;
    }
  }
  const rect = inverse ? null : svg.getBoundingClientRect();
  const scale = rect ? Math.min(rect.width, rect.height) / 220 : null;
  if (!inverse && !(scale > 0)) return null;
  return (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    const point = inverse
      ? new view.DOMPoint(x, y).matrixTransform(inverse)
      : {
          x: (x - rect.left - rect.width / 2) / scale + 110,
          y: (y - rect.top - rect.height / 2) / scale + 110,
        };
    const dx = point.x - 110,
      dy = point.y - 110,
      radius = Math.hypot(dx, dy);
    return radius < 8
      ? null
      : { hue: hueWrap((Math.atan2(dx, -dy) * 180) / Math.PI), radius };
  };
}
/** Convert a client point to clockwise hue; preserve the existing public numeric helper contract. */
export function palettePointerHue(svg, x, y) {
  return pointerProjection(svg)?.(x, y)?.hue ?? null;
}
/** The painted ring and direct selection use one color-space definition, independent of marker lightness/chroma. */
function ringPoint(space, hue) {
  return space === "oklch"
    ? { L: 0.72, C: 0.14, h: hue }
    : { L: 0.5, C: 0.75, h: hue };
}

/**
 * A persistent local hue control: each marker rotates the base by its harmony offset.
 * onColor receives only opaque base HEX; model generation and contrast checks remain in the builder.
 * Pointer updates coalesce to one frame, while release flushes the last coordinate. Cancel restores the starting color.
 */
export function createPaletteWheel({ document, t, helpId, onColor }) {
  const view = document.defaultView,
    element = document.createElementNS(SVG, "svg");
  element.setAttribute("viewBox", "0 0 220 220");
  element.classList.add("ag-palette-builder__wheel");
  element.setAttribute("role", "group");
  element.setAttribute("aria-describedby", helpId);
  const ring = node("g", element),
    markers = node("g", element),
    handles = [];
  ring.classList.add("ag-palette-builder__ring");
  let current,
    scheme,
    disabled = false,
    space,
    gesture = null,
    keyboard = null,
    frame = null,
    pending = null,
    disposed = false;
  /** Create an owned SVG node; markers stay mounted during same-scheme color updates. */
  function node(tag, parent, attrs = {}) {
    const child = document.createElementNS(SVG, tag);
    for (const [key, value] of Object.entries(attrs))
      child.setAttribute(key, String(value));
    parent.append(child);
    return child;
  }
  /** Keep geometry consistent with the existing wheel: hue0 is at twelve o'clock. */
  function position(hue) {
    const angle = ((hue - 90) * Math.PI) / 180;
    return [110 + 90 * Math.cos(angle), 110 + 90 * Math.sin(angle)];
  }
  /** Rebuild only the decorative ring when the mathematical color space changes. */
  function paintRing(nextSpace) {
    ring.replaceChildren();
    for (let hue = 0; hue < 360; hue += 6) {
      const a = position(hue),
        b = position(hue + 6.2);
      const point = ringPoint(nextSpace, hue);
      const color = (nextSpace === "oklch" ? mapOklch(point) : mapHsl(point))
        .hex;
      node("path", ring, {
        d: `M110 110 L${a.join(" ")} A90 90 0 0 1 ${b.join(" ")} Z`,
        fill: color,
        "data-palette-ring-hue": hue,
      });
    }
    node("circle", ring, {
      cx: 110,
      cy: 110,
      r: 61,
      fill: "var(--ag-surface,#ffffff)",
    });
    ring.setAttribute("aria-hidden", "true");
  }
  /** Update existing marker attributes, preserving pointer capture and keyboard focus. */
  function update(result, nextScheme, isDisabled = false) {
    if (disposed) return;
    current = result;
    scheme = nextScheme;
    disabled = isDisabled;
    element.setAttribute("aria-label", t("wheelLabel"));
    if (space !== result.colorSpace) {
      space = result.colorSpace;
      paintRing(space);
    }
    const count = result.hueDefined
      ? scheme.id === "monochromatic"
        ? 1
        : scheme.colors.length
      : 0;
    while (handles.length > count) handles.pop().group.remove();
    while (handles.length < count) {
      const index = handles.length,
        group = node("g", markers, {
          role: "slider",
          tabindex: 0,
          "data-palette-marker": index,
          "aria-valuemin": 0,
          "aria-valuemax": 359,
          "aria-describedby": helpId,
        });
      group.classList.add("ag-palette-builder__marker");
      node("circle", group, {
        r: 15,
        fill: "transparent",
        class: "ag-palette-builder__marker-hit",
      });
      node("circle", group, {
        r: 16,
        fill: "none",
        class: "ag-palette-builder__marker-focus",
        "aria-hidden": "true",
      });
      const chip = node("circle", group, {
        r: 10,
        stroke: "#ffffff",
        "stroke-width": 4,
      });
      node("circle", group, {
        r: 12,
        fill: "none",
        stroke: "#202126",
        "stroke-width": 1.5,
      });
      const label = node("text", group, {
        y: 3.5,
        "text-anchor": "middle",
        "font-size": 10,
        "font-weight": 700,
      });
      handles.push({ group, chip, label });
    }
    for (let index = 0; index < count; index++) {
      const handle = handles[index],
        color = scheme.colors[index],
        hue = hueWrap(result.baseHue + color.offsetDeg),
        [x, y] = position(hue);
      handle.group.setAttribute("transform", `translate(${x} ${y})`);
      handle.group.setAttribute(
        "aria-label",
        `${t("wheelColor")} ${index + 1}`,
      );
      handle.group.setAttribute(
        "aria-valuenow",
        String(hueWrap(Math.round(hue))),
      );
      handle.group.setAttribute(
        "aria-valuetext",
        `${Math.round(hueWrap(hue))}° · ${color.hex}`,
      );
      handle.group.setAttribute("aria-disabled", String(disabled));
      handle.chip.setAttribute("fill", color.hex);
      handle.label.setAttribute("fill", paletteLabelInk(color.hex));
      handle.label.textContent =
        scheme.id === "monochromatic"
          ? `1–${scheme.colors.length}`
          : String(index + 1);
    }
  }
  /** Snapshot lightness/chroma once per gesture so repeated gamut mapping does not progressively desaturate the palette. */
  function anchor(index) {
    return {
      index,
      offset: scheme.colors[index].offsetDeg,
      point:
        space === "oklch"
          ? hexOklch(current.baseColor)
          : hexHsl(current.baseColor),
      baseColor: current.baseColor,
      space,
    };
  }
  /** Preserve chosen harmony offsets and base lightness/chroma; the existing model handles mapping and checks. */
  function change(hue, state) {
    const point = { ...state.point, h: hueWrap(hue - state.offset) };
    const color = (state.space === "oklch" ? mapOklch(point) : mapHsl(point))
      .hex;
    // Eight-bit near-neutral quantization can erase hue. Keep the last chromatic color/handle,
    // while the mathematical key/gesture anchor continues accumulating until a representable hue returns.
    const represented =
      state.space === "oklch" ? hexOklch(color) : hexHsl(color);
    if (represented.h !== null) onColor(color);
  }
  /** Flush just the latest point, never a queued event from an ended gesture. */
  function flush() {
    frame = null;
    const hue = pending;
    pending = null;
    if (gesture && hue !== null && !disposed) change(hue, gesture);
  }
  /** End ownership before release because lostpointercapture can fire synchronously. */
  function cancel(restore = false) {
    const previous = gesture;
    gesture = null;
    keyboard = null;
    pending = null;
    if (frame !== null) {
      view.cancelAnimationFrame(frame);
      frame = null;
    }
    if (previous && element.hasPointerCapture?.(previous.pointerId))
      element.releasePointerCapture(previous.pointerId);
    if (restore && previous && !disposed) {
      onColor(previous.baseColor);
      // A neutral rollback removes hue handles; return to the original native control instead of losing focus.
      if (
        previous.fromRing &&
        !current.hueDefined &&
        previous.focusBefore?.isConnected
      )
        previous.focusBefore.focus({ preventScroll: true });
    }
  }
  /** Resolve only this wheel's handles, including clicks on their number/outline children. */
  function marker(event) {
    const group = event.target.closest?.("[data-palette-marker]");
    return group && markers.contains(group)
      ? handles[Number(group.dataset.paletteMarker)]
      : null;
  }
  /** Capture a handle drag or a direct click on the colored annulus; the centre and exterior remain inert. */
  function down(event) {
    const handle = marker(event);
    const fromRing =
      !handle &&
      ring.contains(event.target) &&
      event.target.localName === "path";
    if (
      disposed ||
      disabled ||
      gesture ||
      (!handle && !fromRing) ||
      event.button !== 0 ||
      event.isPrimary === false
    )
      return;
    const project = pointerProjection(element),
      position = project?.(event.clientX, event.clientY);
    if (
      !position ||
      (fromRing && (position.radius < 61 || position.radius > 90))
    )
      return;
    if (handle && !current.hueDefined) return;
    keyboard = null;
    // Select the exact painted sector on click; subsequent sweeping remains continuous from that hue.
    const chosenHue = fromRing
      ? Number(event.target.getAttribute("data-palette-ring-hue"))
      : position.hue;
    const state = fromRing
      ? {
          offset: 0,
          point: ringPoint(space, chosenHue),
          baseColor: current.baseColor,
          space,
        }
      : anchor(Number(handle.group.dataset.paletteMarker));
    gesture = {
      ...state,
      fromRing,
      projection: fromRing ? project : null,
      focusBefore: document.activeElement,
      pointerId: event.pointerId,
      grabOffset: fromRing
        ? position.hue - chosenHue
        : position.hue - hueWrap(current.baseHue + state.offset),
    };
    try {
      element.setPointerCapture(event.pointerId);
    } catch {
      gesture = null;
      return;
    }
    if (fromRing) change(chosenHue, gesture);
    (handle ?? handles[0])?.group.focus({ preventScroll: true });
    event.preventDefault();
  }
  /** Ignore unrelated pointers and the centre; coalesce high-rate input without regenerating every event. */
  function move(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const hue = gesture.projection
      ? (gesture.projection(event.clientX, event.clientY)?.hue ?? null)
      : palettePointerHue(element, event.clientX, event.clientY);
    if (hue === null) return;
    pending = hueWrap(hue - gesture.grabOffset);
    if (frame === null) frame = view.requestAnimationFrame(flush);
    event.preventDefault();
  }
  /** Release commits the last location even if a pending frame has not run. */
  function up(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    move(event);
    if (frame !== null) view.cancelAnimationFrame(frame);
    flush();
    cancel();
  }
  /** Cancellation is recoverable; ordinary release already cleared ownership and does not roll back. */
  function interrupted(event) {
    if (gesture && event.pointerId === gesture.pointerId) cancel(true);
  }
  /** Every point has an equivalent hue slider: arrows1°, Shift/Page10°, Home/End and Escape rollback. */
  function key(event) {
    if (event.key === "Escape" && gesture) {
      event.preventDefault();
      cancel(true);
      return;
    }
    const handle = marker(event);
    if (!handle || disabled || disposed || gesture) return;
    const index = Number(handle.group.dataset.paletteMarker),
      offset = scheme.colors[index].offsetDeg;
    if (!keyboard || keyboard.index !== index)
      keyboard = { ...anchor(index), hue: hueWrap(current.baseHue + offset) };
    const hue = keyboard.hue,
      step = event.shiftKey ? 10 : 1;
    let next;
    if (["ArrowRight", "ArrowUp"].includes(event.key)) next = hue + step;
    else if (["ArrowLeft", "ArrowDown"].includes(event.key)) next = hue - step;
    else if (event.key === "PageUp") next = hue + 10;
    else if (event.key === "PageDown") next = hue - 10;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 359;
    else return;
    event.preventDefault();
    keyboard.hue = hueWrap(next);
    change(keyboard.hue, keyboard);
  }
  /** A new focus session starts from the current color, not a previous quantized key intent. */
  function focusOut() {
    keyboard = null;
  }
  function blur() {
    cancel(true);
  }
  function visibility() {
    if (document.hidden) cancel(true);
  }
  const listeners = {
    pointerdown: down,
    pointermove: move,
    pointerup: up,
    pointercancel: interrupted,
    lostpointercapture: interrupted,
    keydown: key,
    focusout: focusOut,
  };
  for (const [name, listener] of Object.entries(listeners))
    element.addEventListener(name, listener);
  view.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", visibility);
  return {
    element,
    update,
    cancel,
    dispose() {
      if (disposed) return;
      disposed = true;
      cancel();
      for (const [name, listener] of Object.entries(listeners))
        element.removeEventListener(name, listener);
      view.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
    },
  };
}

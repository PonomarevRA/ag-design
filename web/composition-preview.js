const MODES = new Map([
  ["50", 0.5],
  ["75", 0.75],
  ["100", 1],
  ["150", 1.5],
]);

/** Scale only the outer preview; the iframe keeps its exact CSS viewport and native interaction. */
export function createCompositionPreview({
  viewport,
  stage,
  frame,
  onChange = () => {},
}) {
  const view = viewport.ownerDocument.defaultView;
  let mode = "fit",
    width = 960,
    height = 640,
    scale = 1,
    disposed = false,
    pending = null;
  const original = {
    stage: stage.getAttribute("style"),
    frame: frame.getAttribute("style"),
    width: frame.getAttribute("width"),
    height: frame.getAttribute("height"),
  };
  /** Retained offscreen editors keep their last visible fit rather than measuring max-content containers. */
  function visibleBox() {
    if (
      !viewport.isConnected ||
      viewport.closest('[hidden],[inert],[aria-hidden="true"]')
    )
      return null;
    const style = view.getComputedStyle(viewport);
    const padding =
      (parseFloat(style.paddingLeft) || 0) +
      (parseFloat(style.paddingRight) || 0);
    const width = viewport.clientWidth - padding;
    const verticalPadding =
      (parseFloat(style.paddingTop) || 0) +
      (parseFloat(style.paddingBottom) || 0);
    const height = viewport.clientHeight - verticalPadding;
    return Number.isFinite(width) &&
      width > 0 &&
      Number.isFinite(height) &&
      height > 0
      ? { width, height }
      : null;
  }
  /** A clipped, scaled footprint prevents the untransformed iframe box from creating false canvas overflow. */
  function update() {
    pending = null;
    if (disposed) return;
    bindVisibility();
    const available = visibleBox();
    const automatic = mode === "fit" || mode === "width";
    if (automatic && available === null) return;
    let next = MODES.get(mode);
    if (mode === "width") next = Math.min(1, available.width / width);
    if (mode === "fit")
      next = Math.min(1, available.width / width, available.height / height);
    scale = next;
    stage.style.width = `${width * scale}px`;
    stage.style.height = `${height * scale}px`;
    stage.style.overflow = "hidden";
    frame.width = String(width);
    frame.height = String(height);
    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;
    frame.style.transformOrigin = "left top";
    frame.style.transform = `scale(${scale})`;
    onChange({ mode, scale, width, height });
  }
  /** Coalesce resize/visibility activity without rendering or measuring the composition. */
  function schedule() {
    if (disposed || pending !== null) return;
    pending = view.requestAnimationFrame(update);
  }
  const resized = view.ResizeObserver
    ? new view.ResizeObserver(schedule)
    : null;
  resized?.observe(viewport);
  // Reactivation can keep the same box dimensions, so resize alone cannot detect a retained tab becoming visible.
  const visibility = view.MutationObserver
    ? new view.MutationObserver(schedule)
    : null;
  let observedAncestors = [];
  /** Resolve the mounted ancestry on activity; construction normally precedes insertion into workspace tabs. */
  function bindVisibility() {
    const ancestors = [];
    let ancestor = viewport;
    while (ancestor && ancestors.length < 32) {
      ancestors.push(ancestor);
      ancestor = ancestor.parentElement;
    }
    if (
      ancestors.length === observedAncestors.length &&
      ancestors.every((node, index) => node === observedAncestors[index])
    )
      return;
    visibility?.disconnect();
    for (const node of ancestors)
      visibility?.observe(node, {
        attributes: true,
        attributeFilter: ["hidden", "aria-hidden", "inert", "class"],
      });
    observedAncestors = ancestors;
  }
  bindVisibility();
  view.addEventListener("resize", schedule);
  /** Validate actual viewport dimensions independently of the chosen visual scale. */
  function setViewport(value) {
    if (disposed) return;
    if (
      !Number.isFinite(value.width) ||
      !Number.isFinite(value.height) ||
      value.width < 1 ||
      value.height < 1
    )
      throw new TypeError(
        "Preview viewport must contain positive finite CSS dimensions",
      );
    width = value.width;
    height = value.height;
    // Viewport attributes must update even when an inactive editor cannot recompute its fit.
    frame.width = String(width);
    frame.height = String(height);
    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;
    schedule();
  }
  schedule();
  return {
    setViewport,
    setScale(value) {
      if (disposed) return;
      if (!["fit", "width"].includes(value) && !MODES.has(value))
        throw new TypeError("Unsupported preview scale");
      mode = value;
      schedule();
    },
    refresh: schedule,
    get scale() {
      return scale;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (pending !== null) view.cancelAnimationFrame(pending);
      resized?.disconnect();
      visibility?.disconnect();
      view.removeEventListener("resize", schedule);
      for (const [element, value] of [
        [stage, original.stage],
        [frame, original.frame],
      ]) {
        if (value === null) element.removeAttribute("style");
        else element.setAttribute("style", value);
      }
      for (const name of ["width", "height"]) {
        if (original[name] === null) frame.removeAttribute(name);
        else frame.setAttribute(name, original[name]);
      }
    },
  };
}

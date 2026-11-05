import { createSkeletonShape } from "./skeleton.js";
export const loadingVariants = Object.freeze([
  "spinner",
  "dots",
  "progress",
  "skeleton",
]);

/** Show indeterminate waiting, never invented completion. Host owns loading state and a visible pause action. */
export function createLoadingIndicator({
  document = globalThis.document,
  variant = "spinner",
  label = "Загрузка",
  animated = true,
} = {}) {
  if (!loadingVariants.includes(variant))
    throw new TypeError("Unknown loading variant");
  if (
    typeof label !== "string" ||
    !label.trim() ||
    label.length > 180 ||
    typeof animated !== "boolean"
  )
    throw new TypeError("Use a label up to180 characters and boolean animated");
  const element = document.createElement("div"),
    visual = document.createElement("div"),
    status = document.createElement("span");
  element.className = "ag-loading-indicator";
  element.dataset.variant = variant;
  visual.className = "ag-loading-indicator__visual";
  visual.setAttribute("aria-hidden", "true");
  status.className = "ag-skeleton__status";
  status.setAttribute("role", "status");
  for (
    let i = 0;
    i < (variant === "dots" || variant === "skeleton" ? 3 : 1);
    i++
  ) {
    const part =
      variant === "skeleton"
        ? createSkeletonShape({ document, width: ["85%", "100%", "65%"][i] })
        : document.createElement("span");
    part.classList.add("ag-loading-indicator__part");
    visual.append(part);
  }
  element.append(visual, status);
  const view = document.defaultView,
    preference = view.matchMedia?.("(prefers-reduced-motion: reduce)");
  let paused = !animated,
    loading = true,
    visible = !view.IntersectionObserver,
    disposed = false;
  /** Reconcile animation lifetime without a timer or RAF. CSS owns motion only while visible and requested. */
  function sync() {
    element.hidden = !loading;
    status.textContent = loading ? label : "";
    // Only the decorative drawing is pending; a busy ancestor can defer live status.
    visual.setAttribute("aria-busy", String(loading));
    element.dataset.motion = motionState();
  }
  /** Read suspension precedence without mutating state or claiming operation completion. */
  function motionState() {
    if (disposed) return "disposed";
    if (preference?.matches) return "reduced-motion";
    if (paused || !loading) return "paused";
    if (document.hidden) return "hidden";
    if (!visible) return "offscreen";
    return "playing";
  }
  const observer = view.IntersectionObserver
    ? new view.IntersectionObserver((entries) => {
        visible = entries.at(-1)?.isIntersecting !== false;
        sync();
      })
    : null;
  observer?.observe(element);
  view.document.addEventListener("visibilitychange", sync);
  preference?.addEventListener?.("change", sync);
  sync();
  return {
    element,
    get state() {
      return element.dataset.motion;
    },
    pause() {
      if (!disposed) {
        paused = true;
        sync();
      }
    },
    play() {
      if (!disposed) {
        paused = false;
        sync();
      }
    },
    setLoading(value) {
      if (typeof value !== "boolean")
        throw new TypeError("loading must be boolean");
      if (!disposed) {
        loading = value;
        sync();
      }
    },
    /** Remove observer/listeners and the CSS animation tree. Late host updates become inert. */
    dispose() {
      if (disposed) return;
      disposed = true;
      loading = false;
      observer?.disconnect();
      view.document.removeEventListener("visibilitychange", sync);
      preference?.removeEventListener?.("change", sync);
      sync();
      element.remove();
    },
  };
}

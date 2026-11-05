export const motionPresets = Object.freeze([
  "fade-in",
  "slide-up",
  "slide-down",
  "slide-left",
  "slide-right",
  "scale-in",
  "pulse",
  "shake",
  "bounce",
]);

/** Describe bounded UI movement without reading layout or changing the element's persistent styles. */
function frames(preset, distance) {
  const entrance = { opacity: 0 };
  if (preset === "fade-in") return [entrance, { opacity: 1 }];
  if (preset.startsWith("slide-")) {
    const vectors = {
      "slide-up": [0, distance],
      "slide-down": [0, -distance],
      "slide-left": [distance, 0],
      "slide-right": [-distance, 0],
    };
    const [x, y] = vectors[preset];
    return [
      { ...entrance, transform: `translate(${x}px,${y}px)` },
      { opacity: 1, transform: "translate(0,0)" },
    ];
  }
  if (preset === "scale-in")
    return [
      { opacity: 0, transform: "scale(.96)" },
      { opacity: 1, transform: "scale(1)" },
    ];
  if (preset === "pulse")
    return [
      { transform: "scale(1)" },
      { transform: "scale(1.025)" },
      { transform: "scale(1)" },
    ];
  if (preset === "bounce")
    return [
      { transform: "translateY(0)" },
      { transform: `translateY(${-distance}px)` },
      { transform: "translateY(0)" },
    ];
  return [
    { transform: "translateX(0)" },
    { transform: `translateX(${-distance / 2}px)` },
    { transform: `translateX(${distance / 2}px)` },
    { transform: "translateX(0)" },
  ];
}

/** Own explicit transient animations; cancellation, reduced-motion changes and disposal never hide final content. */
export function createMotion(
  element,
  { duration = 200, distance = 12, iterations = 1 } = {},
) {
  if (
    !element ||
    (typeof element.animate !== "function" && !element.ownerDocument)
  )
    throw new TypeError("A DOM element is required");
  if (
    !Number.isFinite(duration) ||
    duration < 0 ||
    duration > 2000 ||
    !Number.isFinite(distance) ||
    distance < 0 ||
    distance > 64 ||
    !Number.isInteger(iterations) ||
    iterations < 1 ||
    iterations > 3
  )
    throw new RangeError("Use 0–2000ms, 0–64px and 1–3 iterations");
  const view = element.ownerDocument?.defaultView;
  const preference = view?.matchMedia?.("(prefers-reduced-motion: reduce)");
  let active = null,
    disposed = false;
  /** Release only this controller's animation; consumer transforms and other animations remain untouched. */
  function cancel() {
    active?.cancel();
    active = null;
  }
  const changed = () => {
    if (preference.matches) cancel();
  };
  preference?.addEventListener?.("change", changed);
  /** Start one known preset and return an outcome instead of leaking cancellation rejections. */
  async function play(preset = "fade-in") {
    if (!motionPresets.includes(preset))
      throw new TypeError("Unknown motion preset");
    cancel();
    if (disposed) return "disposed";
    if (preference?.matches || duration === 0) return "reduced-motion";
    if (typeof element.animate !== "function") return "unsupported";
    const animation = element.animate(frames(preset, distance), {
      duration,
      iterations,
      easing: "cubic-bezier(.2,.7,.2,1)",
      fill: "none",
    });
    active = animation;
    try {
      await animation.finished;
      return "finished";
    } catch {
      return "cancelled";
    } finally {
      if (active === animation) active = null;
    }
  }
  return {
    play,
    cancel,
    dispose() {
      if (disposed) return;
      cancel();
      preference?.removeEventListener?.("change", changed);
      disposed = true;
    },
  };
}

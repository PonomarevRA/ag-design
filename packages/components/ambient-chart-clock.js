/** Own one24fps animation clock. Pausing, hidden/offscreen/reduced motion and teardown cancel pending frames. */
export function ambientClock({ element, continuous, animated, paint }) {
  const view = element.ownerDocument.defaultView,
    document = element.ownerDocument;
  const preference = view.matchMedia?.("(prefers-reduced-motion: reduce)");
  let frame = 0,
    last = null,
    elapsed = 0,
    disposed = false,
    paused = !animated,
    visible = true;
  const abort = new view.AbortController();
  /** Resolve suspension precedence without scheduling or changing elapsed time. */
  function reason() {
    if (disposed) return "disposed";
    if (preference?.matches) return "reduced-motion";
    if (paused) return "paused";
    if (document.hidden) return "hidden";
    if (!visible) return "offscreen";
    if (!element.isConnected) return "detached";
    if (!continuous && elapsed >= 1.4) return "idle";
    return "playing";
  }
  /** Cancel the owned frame and discard its timestamp so suspension does not accumulate time. */
  function stop() {
    view.cancelAnimationFrame(frame);
    frame = 0;
    last = null;
  }
  /** Draw at a bounded cadence. Elapsed time excludes suspension and never jumps after tab restoration. */
  function tick(now) {
    frame = 0;
    const state = reason();
    element.dataset.motion = state;
    if (state !== "playing") return;
    if (last === null) last = now;
    if (now - last >= 1000 / 24) {
      elapsed += (now - last) / 1000;
      last = now;
      paint(elapsed, false);
    }
    if (reason() === "playing") frame = view.requestAnimationFrame(tick);
    else element.dataset.motion = reason();
  }
  /** Reconcile host visibility and user intent; a detached mount receives only one initial frame. */
  function sync() {
    stop();
    const state = reason();
    element.dataset.motion = state;
    if (state === "reduced-motion" || (!animated && elapsed === 0))
      paint(1.4, true);
    if (state === "playing" || state === "detached")
      frame = view.requestAnimationFrame(tick);
  }
  const intersection = view.IntersectionObserver
    ? new view.IntersectionObserver((entries) => {
        visible = entries[entries.length - 1]?.isIntersecting !== false;
        sync();
      })
    : null;
  intersection?.observe(element);
  document.addEventListener("visibilitychange", sync, { signal: abort.signal });
  preference?.addEventListener?.("change", sync);
  paint(animated ? 0 : 1.4, !animated);
  sync();
  return {
    get state() {
      return reason();
    },
    play() {
      if (disposed) return;
      paused = false;
      sync();
    },
    pause() {
      if (disposed) return;
      paused = true;
      sync();
    },
    replay() {
      if (disposed) return;
      elapsed = 0;
      paused = false;
      paint(0, Boolean(preference?.matches));
      sync();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      intersection?.disconnect();
      abort.abort();
      preference?.removeEventListener?.("change", sync);
      element.dataset.motion = "disposed";
    },
  };
}

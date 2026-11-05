/** Coalesce geometry notifications; a missing/closed optional native channel never breaks navigation. */
export function bindNativeSidebar(viewport, panel) {
  let timer,
    disposed = false;
  const notify = () => {
    if (disposed) return;
    viewport.clearTimeout(timer);
    timer = viewport.setTimeout(() => {
      try {
        Promise.resolve(
          viewport.pywebview?.api?.standalone_sidebar_changed?.(),
        ).catch(() => {});
      } catch {
        /* Native close can race a pending geometry notification. */
      }
    }, 150);
  };
  const observer = viewport.ResizeObserver
    ? new viewport.ResizeObserver(notify)
    : null;
  observer?.observe(panel);
  viewport.addEventListener("resize", notify);
  viewport.addEventListener("pywebviewready", notify);
  const dispose = () => {
    disposed = true;
    viewport.clearTimeout(timer);
    observer?.disconnect();
    viewport.removeEventListener("resize", notify);
    viewport.removeEventListener("pywebviewready", notify);
  };
  return { notify, dispose };
}

import { createChart } from "./vendor/chart.js";

/**
 * Mount a static SVG chart first; particles are an explicit optional presentation.
 * @param {HTMLElement} host Owned chart region, replaced on mount.
 * @param {object} options Existing AG chart data/options; renderer and motion are owned here.
 * @returns {object} Update/dispose facade; disposal releases observers and chart resources.
 */
export function createStyleChart(host, options) {
  const doc = host.ownerDocument;
  let renderer = "svg",
    paused = false,
    disposed = false;
  const controls = doc.createElement("div");
  controls.className = "style-chart-controls";
  const mode = doc.createElement("button");
  mode.type = "button";
  mode.textContent = "Показать частицы";
  const pause = doc.createElement("button");
  pause.type = "button";
  pause.textContent = "Приостановить";
  pause.disabled = true;
  pause.hidden = true;
  pause.setAttribute("aria-pressed", "false");
  const note = doc.createElement("span");
  note.textContent = "SVG · точные данные ниже";
  controls.append(note, mode, pause);
  const chart = createChart({
    document: doc,
    ...options,
    renderer,
    animated: false,
    particleCount: 6000,
    particleDensity: 1.2,
    particleSize: 1.15,
    particleBloom: 0.7,
    particleJitter: 0.3,
    particleCache: false,
    particleCacheBudget: 262144,
  });
  host.replaceChildren(controls, chart.element);
  host.classList.add("style-chart");
  /**
   * Switch presentation without replacing controls or exact table data.
   * Animation starts only after explicit particle opt-in; AG owns reduced-motion fallback.
   */
  function chooseMode() {
    if (disposed) return;
    renderer = renderer === "particles" ? "svg" : "particles";
    chart.update({ renderer, paused, animated: renderer === "particles" });
    mode.textContent =
      renderer === "particles" ? "Показать SVG" : "Показать частицы";
    note.textContent =
      renderer === "particles"
        ? "Частицы · точные данные ниже"
        : "SVG · те же данные";
    pause.disabled = renderer !== "particles";
    pause.hidden = renderer !== "particles";
  }
  /** Pause is an explicit user preference; reduced motion and visibility are also handled by the shared chart. */
  function choosePause() {
    if (disposed) return;
    paused = !paused;
    chart.update({ paused });
    pause.textContent = paused ? "Продолжить" : "Приостановить";
    pause.setAttribute("aria-pressed", String(paused));
  }
  mode.addEventListener("click", chooseMode);
  pause.addEventListener("click", choosePause);
  return {
    element: host,
    /**
     * Update chart data/options while retaining the explicitly selected presentation.
     * @param {object} next AG chart patch; caller motion/renderer cannot bypass this wrapper.
     * @returns {boolean|undefined} AG update result, or false after disposal.
     */
    update(next) {
      if (disposed) return false;
      return chart.update({
        ...next,
        renderer,
        paused,
        animated: renderer === "particles",
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      mode.removeEventListener("click", chooseMode);
      pause.removeEventListener("click", choosePause);
      chart.dispose();
      controls.remove();
    },
  };
}

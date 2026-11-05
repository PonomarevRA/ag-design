import {
  createLoadingIndicator,
  createButton,
  loadingVariants,
} from "./vendor/ag-design/index.js";
import { h } from "./dom.js";
/** Four visible waiting states share one explicit pause control; each instance releases its own lifecycle bindings. */
export function buildLoadingSample() {
  const names = ["Кольцо", "Прыгающие точки", "Бегущая полоса", "Скелетон"];
  const controllers = loadingVariants.map((variant) =>
    createLoadingIndicator({ variant }),
  );
  const gallery = h(
    "div",
    { className: "loading-sample__grid" },
    controllers.map((c, i) => h("div", {}, c.element, h("p", {}, names[i]))),
  );
  let paused = false;
  const pause = createButton({
    label: "Пауза индикаторов",
    variant: "quiet",
    onClick: () => {
      paused = !paused;
      for (const c of controllers) paused ? c.pause() : c.play();
      pause.setAttribute("aria-pressed", String(paused));
    },
  });
  pause.setAttribute("aria-pressed", "false");
  return {
    element: h("div", { className: "loading-sample" }, gallery, pause),
    interact: () => {
      for (const c of controllers) c.pause();
    },
    dispose() {
      for (const c of controllers) c.dispose();
    },
  };
}

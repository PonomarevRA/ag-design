import {
  createRenderWindow,
  createLoadingIndicator,
} from "./vendor/ag-design/index.js";
import { h } from "./dom.js";

/** Demonstrate real eviction in a local scroll root; editable field state survives remount, counts reflect factory lifetimes. */
export function buildRenderWindowSample() {
  const count = h("p", {}),
    scroller = h("div", {
      className: "render-window-sample__scroll",
      "aria-label": "Пример списка с освобождением",
      tabindex: 0,
    });
  const element = h(
    "section",
    { className: "render-window-sample" },
    h(
      "p",
      {},
      "Прокрутите список: вне экрана карточки освобождаются. Введённое имя сохраняется.",
    ),
    count,
    scroller,
  );
  const windows = [];
  let live = 0;
  const update = () => {
    count.textContent = `Активных карточек: ${live} из 24`;
  };
  for (let index = 0; index < 24; index++) {
    const controller = createRenderWindow({
      document,
      root: scroller,
      rootMargin: "80px",
      estimatedHeight: 132,
      label: `Запись ${index + 1}`,
      render(saved) {
        const input = h("input", {
          className: "ag-input",
          "aria-label": `Имя ${index + 1}`,
          value: saved ?? `Запись ${index + 1}`,
        });
        const loader = createLoadingIndicator({
          variant: "dots",
          label: "Пример анимации",
        });
        const card = h(
          "article",
          { className: "render-window-sample__card" },
          h("strong", {}, `Запись ${index + 1}`),
          input,
          loader.element,
        );
        live++;
        update();
        return {
          element: card,
          snapshot: () => input.value,
          dispose() {
            loader.dispose();
            live--;
            update();
          },
        };
      },
    });
    scroller.append(controller.element);
    windows.push(controller);
  }
  update();
  return {
    element,
    interact() {
      windows[0].setPinned(true);
      windows[0].setPinned(false);
    },
    dispose() {
      for (const c of windows) c.dispose();
    },
  };
}

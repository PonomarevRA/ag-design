import { createAsyncBoundary, createButton } from "./vendor/ag-design/index.js";
import { h } from "./dom.js";

/** Controllable local loads demonstrate lifecycle, never simulate measured network or real progress. */
export function buildAsyncBoundarySample({
  mode = "success",
  delayMs = 900,
} = {}) {
  const scenario = h("select", { "aria-label": "Сценарий загрузки" });
  for (const [value, text] of [
    ["success", "Успех"],
    ["empty", "Нет данных"],
    ["error", "Ошибка"],
    ["timeout", "Не отвечает"],
  ])
    scenario.append(h("option", { value }, text));
  scenario.value = mode;
  let disposed = false,
    version = 0,
    pendingTimers = new Set();
  const metrics = h("p", {
    className: "async-boundary-sample__state",
    "aria-label": "Состояние компонента",
  });
  let boundary;
  const refreshMetrics = () => {
    if (disposed) return;
    metrics.textContent = JSON.stringify(boundary.state);
  };
  const load = ({ signal, key }) =>
    new Promise((resolve, reject) => {
      const choice = scenario.value;
      // A noncooperative pending promise demonstrates boundary-owned deadline handling.
      if (choice === "timeout") return;
      const cleanup = () => {
        clearTimeout(timer);
        pendingTimers.delete(timer);
        signal.removeEventListener("abort", abort);
      };
      const abort = () => {
        cleanup();
        reject(new DOMException("Cancelled", "AbortError"));
      };
      const timer = setTimeout(() => {
        cleanup();
        if (choice === "error") {
          reject(new Error("Sample diagnostic, not UI copy"));
          return;
        }
        if (choice === "empty") {
          resolve(null);
          return;
        }
        const content = h(
          "article",
          { className: "async-boundary-sample__card" },
          h("strong", {}, `Отчёт ${key} · версия ${++version}`),
          h(
            "p",
            {},
            "Содержимое остаётся на экране при обновлении того же объекта.",
          ),
        );
        resolve({
          element: content,
          dispose() {
            content.replaceChildren();
          },
        });
      }, delayMs);
      pendingTimers.add(timer);
      signal.addEventListener("abort", abort, { once: true });
    });
  boundary = createAsyncBoundary({
    document,
    label: "Асинхронный отчёт",
    key: "A",
    load,
    autoStart: false,
    timeoutMs: 2000,
  });
  const start = () => {
    const pending = boundary.run();
    refreshMetrics();
    void pending.then(refreshMetrics);
  };
  const refresh = createButton({ label: "Загрузить / обновить" }),
    change = createButton({ label: "Другой объект" });
  const changeKey = () => {
    const pending = boundary.run({
      key: boundary.state.key === "A" ? "B" : "A",
    });
    refreshMetrics();
    void pending.then(refreshMetrics);
  };
  refresh.addEventListener("click", start);
  change.addEventListener("click", changeKey);
  // State repaint is driven by real boundary DOM transitions, without a polling timer.
  const observer = new MutationObserver(refreshMetrics);
  observer.observe(boundary.element, {
    attributes: true,
    subtree: true,
    childList: true,
  });
  const element = h(
    "section",
    { className: "async-boundary-sample" },
    h(
      "p",
      {},
      "Выберите исход загрузки. Таймаут — 2 секунды. Обновление сохраняет тот же объект.",
    ),
    h("div", { className: "sample-actions" }, scenario, refresh, change),
    boundary.element,
    metrics,
  );
  refreshMetrics();
  return {
    element,
    interact: start,
    dispose() {
      disposed = true;
      observer.disconnect();
      boundary.dispose();
      for (const timer of pendingTimers) clearTimeout(timer);
      pendingTimers.clear();
      refresh.removeEventListener("click", start);
      change.removeEventListener("click", changeKey);
    },
  };
}

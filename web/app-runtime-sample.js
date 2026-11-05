import {
  createEventBus,
  createRequestRouter,
  createButton,
} from "./vendor/ag-design/index.js";
import { h } from "./dom.js";
let serial = 0;

/** Owned local sample connects actual public runtime factories; synthetic adapters count calls but never contact a backend. */
export function buildAppRuntimeSample({
  mode = "bus",
  locale = "ru",
  burstSize = 2000,
  delayMs = 80,
} = {}) {
  const view = document.defaultView ?? globalThis;
  const en = locale.startsWith("en"),
    id = "app-runtime-example-" + ++serial;
  if (
    !["bus", "router"].includes(mode) ||
    !Number.isInteger(burstSize) ||
    burstSize < 1 ||
    burstSize > 20000 ||
    !Number.isInteger(delayMs) ||
    delayMs < 0 ||
    delayMs > 10000
  )
    throw new TypeError("runtime sample options");
  const text = en
    ? {
        bus: "Local event bus",
        router: "Shared request router",
        local:
          "Local demonstration with synthetic data. These counts do not measure production speed or backend capacity.",
        a: "Widget A",
        b: "Widget B",
        empty: "No result yet",
        burst: "Publish a gesture burst",
        load: "Request for both widgets",
        clear: "Invalidate results",
        cancel: "Cancel waiting",
        position: "Position",
        metrics: "Runtime counters",
        done: "Updated locally.",
        expired: "The update expired before display. Repeat the gesture.",
        ready: "Synthetic result received.",
        waiting: "Waiting for the local adapter…",
        stopped: "Waiting cancelled; server rollback is not implied.",
        invalid: "Results invalidated.",
        failed: "The local operation could not complete.",
      }
    : {
        bus: "Локальная шина событий",
        router: "Общий роутер запросов",
        local:
          "Локальный пример с синтетическими данными. Счётчики не измеряют скорость production или мощность бэкенда.",
        a: "Виджет A",
        b: "Виджет B",
        empty: "Результата пока нет",
        burst: "Отправить поток жеста",
        load: "Запросить для двух виджетов",
        clear: "Инвалидировать результаты",
        cancel: "Отменить ожидание",
        position: "Положение",
        metrics: "Счётчики runtime",
        done: "Обновлено локально.",
        expired: "Обновление устарело до отображения. Повторите жест.",
        ready: "Получен синтетический результат.",
        waiting: "Ожидание локального адаптера…",
        stopped: "Ожидание отменено; откат сервера не подразумевается.",
        invalid: "Результаты инвалидированы.",
        failed: "Локальная операция не завершилась.",
      };
  const heading = h("h4", { id: id + "-heading" }, text[mode]),
    element = h(
      "section",
      { className: "app-runtime-example", "aria-labelledby": heading.id },
      heading,
      h("p", {}, text.local),
    );
  const metrics = h("pre", {
      "aria-label": text.metrics,
      className: "app-runtime-example__metrics",
    }),
    status = h("p", { role: "status", "aria-atomic": "true" }),
    widgets = h("div", { className: "app-runtime-example__widgets" });
  const values = [];
  for (const name of [text.a, text.b]) {
    const value = h("p", {}, text.empty);
    values.push(value);
    widgets.append(
      h("section", { "aria-label": name }, h("h5", {}, name), value),
    );
  }
  const actions = h("div", { className: "app-runtime-example__actions" });
  element.append(widgets, actions, metrics, status);
  const listeners = [];
  let disposed = false,
    frame = null,
    generation = 0,
    controllers = [],
    backendCalls = 0;
  const bus = createEventBus({ autoFlush: false, maxEventsPerFlush: 128 }),
    router = createRequestRouter({
      scopeKey: id,
      maxConcurrent: 2,
      maxCacheEntries: 4,
    });
  /** Expose counters only, with no payloads, auth material or user input snapshots. */
  function refresh() {
    if (disposed) return;
    metrics.textContent = JSON.stringify(
      mode === "bus" ? bus.stats : { ...router.stats, backendCalls },
      null,
      2,
    );
  }
  /** All listeners belong to this preview and are removed when render-window/sandbox disposes it. */
  function listen(node, type, handler) {
    node.addEventListener(type, handler);
    listeners.push(() => node.removeEventListener(type, handler));
  }
  /** Publish replaceable local state; one animation frame consumes the latest point for both widgets. */
  function position(x) {
    if (disposed) return;
    bus.publish(
      "gesture.position",
      { x },
      { priority: "user-blocking", ttlMs: 1000, coalesceKey: "position" },
    );
    if (frame === null)
      frame = view.requestAnimationFrame(() => {
        frame = null;
        if (disposed) return;
        const before = bus.stats.delivered;
        bus.flush();
        refresh();
        status.textContent =
          bus.stats.delivered > before ? text.done : text.expired;
      });
  }
  /** Count the exact admitted events, not an invented performance percentage. */
  function burst() {
    for (let i = 0; i < burstSize; i++)
      position(Math.round(((i + 1) * 100) / burstSize));
    refresh();
  }
  /** Reset local observers before aborting so late/reentrant completions cannot update a newer example state. */
  function cancel() {
    generation++;
    for (const c of controllers) c.abort();
    controllers = [];
    status.textContent = text.stopped;
    refresh();
  }
  /** Both widgets use the same explicit complete query key and independently cancellable consumers. */
  function load() {
    if (disposed) return;
    cancel();
    const current = ++generation;
    controllers = [new AbortController(), new AbortController()];
    status.textContent = text.waiting;
    for (let i = 0; i < 2; i++) {
      const pending = router.request(
        "catalog.read",
        { id: "sample-A" },
        { signal: controllers[i].signal },
      );
      pending.then(
        (value) => {
          if (disposed || current !== generation) return;
          values[i].textContent = `${value.id} · ${value.version}`;
          status.textContent = text.ready;
          refresh();
        },
        () => {
          if (disposed || current !== generation) return;
          status.textContent = text.failed;
          refresh();
        },
      );
    }
    refresh();
  }
  if (mode === "bus") {
    const input = h("input", {
        id: id + "-position",
        type: "range",
        min: "0",
        max: "100",
        value: "0",
      }),
      label = h("label", { for: input.id }, text.position);
    actions.append(label, input);
    listen(input, "input", () => position(Number(input.value)));
    bus.subscribe("gesture.position", (event) => {
      input.value = String(event.payload.x);
      for (const value of values) value.textContent = String(event.payload.x);
    });
    const button = createButton({ document, label: text.burst });
    listen(button, "click", burst);
    actions.append(button);
  } else {
    router.register(
      "catalog.read",
      (input, { signal }) =>
        new Promise((resolve, reject) => {
          backendCalls++;
          const version = backendCalls;
          const timer = setTimeout(() => {
            signal.removeEventListener("abort", abort);
            resolve(Object.freeze({ id: input.id, version }));
          }, delayMs);
          function abort() {
            clearTimeout(timer);
            signal.removeEventListener("abort", abort);
            reject(new DOMException("Aborted", "AbortError"));
          }
          if (signal.aborted) abort();
          else signal.addEventListener("abort", abort, { once: true });
        }),
      {
        kind: "query",
        key: (input) => input.id,
        cacheTtlMs: 1000,
        validate: (input) => typeof input?.id === "string",
      },
    );
    for (const [label, action] of [
      [text.load, load],
      [
        text.clear,
        () => {
          cancel();
          router.invalidate("catalog.read");
          for (const value of values) value.textContent = text.empty;
          status.textContent = text.invalid;
          refresh();
        },
      ],
      [text.cancel, cancel],
    ]) {
      const button = createButton({ document, label });
      listen(button, "click", action);
      actions.append(button);
    }
  }
  refresh();
  return {
    element,
    interact: mode === "bus" ? burst : load,
    get state() {
      return { bus: bus.stats, router: router.stats, backendCalls };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      generation++;
      for (const remove of listeners) remove();
      for (const controller of controllers) controller.abort();
      controllers = [];
      if (frame !== null) view.cancelAnimationFrame(frame);
      frame = null;
      bus.dispose();
      router.dispose();
    },
  };
}

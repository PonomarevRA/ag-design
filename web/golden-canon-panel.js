import {
  checkGoldenCanon,
  goldenCanonRectAnchor,
} from "./vendor/ag-design/golden-canon-model.js";
import { get } from "./api.js";
const TYPE =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const messages = {
  ru: {
    title: "Golden Canon Grid",
    enabled: "Наложить сетку",
    anchor: "Опора объекта",
    tolerance: "Допуск (% короткой стороны)",
    topLeft: "Левый верхний угол",
    topRight: "Правый верхний угол",
    bottomLeft: "Левый нижний угол",
    bottomRight: "Правый нижний угол",
    center: "Центр границ",
    unknown: "Выберите видимый объект и дождитесь актуального измерения",
    hit: "Попадание",
    miss: "Отклонение",
    scope:
      "AG diagonal core v1. Квадрат — опора, круг — контрольная точка. Проверяются границы объекта. Базовая линия, смысл и доступность оцениваются отдельно.",
    pptx: "Проверка PPTX",
    upload: "Выбрать PPTX (до 12 MiB)",
    review: "Проверить и скачать копию с сеткой",
    pending: "Проверка…",
    failed: "Не удалось проверить файл",
    limit: "Выберите PPTX размером до 12 MiB",
    slides: "слайдов",
    measured: "опор измерено",
    unknownShapes: "непроверенных объектов",
    native: "PowerPoint и AT: не проверены",
    json: "Скачать отчёт JSON",
  },
  en: {
    title: "Golden Canon Grid",
    enabled: "Overlay grid",
    anchor: "Object anchor",
    tolerance: "Tolerance (% of shorter side)",
    topLeft: "Top left",
    topRight: "Top right",
    bottomLeft: "Bottom left",
    bottomRight: "Bottom right",
    center: "Box center",
    unknown: "Select a visible object and wait for current measurements",
    hit: "Hit",
    miss: "Miss",
    scope:
      "AG diagonal core v1. Square: measured anchor, circle: control point. Box geometry only. Baseline, meaning and accessibility need separate review.",
    pptx: "PPTX review",
    upload: "Choose PPTX (up to 12 MiB)",
    review: "Review and download grid copy",
    pending: "Reviewing…",
    failed: "File review failed",
    limit: "Choose a PPTX up to 12 MiB",
    slides: "slides",
    measured: "measured anchors",
    unknownShapes: "unknown objects",
    native: "PowerPoint and AT: untested",
    json: "Download JSON report",
  },
};

/** Create a bounded literal-text control with a stable accessible label. */
function make(document, tag, attributes = {}, text = "") {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes))
    element.setAttribute(key, String(value));
  element.textContent = text;
  return element;
}

/** Download only locally created evidence and release each object URL after the click has started. */
function download(view, blob, name) {
  const url = view.URL.createObjectURL(blob),
    link = view.document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  view.setTimeout(() => view.URL.revokeObjectURL(url), 1000);
}

/**
 * Transient composition diagnostics and local PPTX review; no document baseline is weakened.
 * Locale follows the host's declared ru/en document language with English fallback.
 */
export function createGoldenCanonPanel({
  document = globalThis.document,
  onChange = () => {},
} = {}) {
  const view = document.defaultView,
    t = messages[document.documentElement.lang.split("-")[0]] || messages.en;
  const controller = new view.AbortController(),
    options = { signal: controller.signal };
  const element = make(document, "details", {
    class: "composition-tool-details golden-canon-panel",
  });
  element.append(make(document, "summary", {}, t.title));
  const enabled = make(document, "input", {
    type: "checkbox",
    "aria-label": t.enabled,
  });
  enabled.checked = true;
  const anchor = make(document, "select", { "aria-label": t.anchor });
  for (const [value, label] of [
    ["top-left", t.topLeft],
    ["top-right", t.topRight],
    ["bottom-left", t.bottomLeft],
    ["bottom-right", t.bottomRight],
    ["center", t.center],
  ])
    anchor.append(make(document, "option", { value }, label));
  const tolerance = make(document, "input", {
    type: "number",
    min: 0,
    max: 5,
    step: 0.1,
    required: true,
    "aria-label": t.tolerance,
  });
  tolerance.value = "0.8";
  const controls = make(document, "div", {
    class: "golden-canon-panel__controls",
  });
  for (const [title, control] of [
    [t.enabled, enabled],
    [t.anchor, anchor],
    [t.tolerance, tolerance],
  ]) {
    const label = make(document, "label", {
      class:
        control === enabled
          ? "golden-canon-panel__toggle"
          : "golden-canon-panel__field",
    });
    const text = make(document, "span", {}, title);
    if (control === enabled) label.append(control, text);
    else label.append(text, control);
    controls.append(label);
  }
  element.append(controls);
  const output = make(document, "output", { "aria-live": "polite" }, t.unknown);
  element.append(
    make(document, "p", { class: "composition-note" }, t.scope),
    output,
  );
  let current = null,
    selectedId = null,
    disposed = false;
  let settings = { enabled: true, anchor: "top-left", tolerance: 0.008 };
  const config = () => ({ ...settings });
  /** Clear old findings when the document, viewport or selected anchor changes. */
  function render() {
    if (!current || !current.complete || !current.fontsReady) {
      output.textContent = t.unknown;
      delete output.dataset.status;
      return;
    }
    const owner = current.nodes.find((item) => item.id === selectedId);
    if (!owner?.rect || !owner.visible || owner.clipped) {
      output.textContent = t.unknown;
      delete output.dataset.status;
      return;
    }
    const point = goldenCanonRectAnchor(owner.rect, anchor.value);
    const report = checkGoldenCanon({
      ...current.viewport,
      anchors: [{ id: selectedId, ...point }],
      tolerance: config().tolerance,
    });
    const result = report.results[0],
      number = new Intl.NumberFormat(document.documentElement.lang || "en", {
        maximumFractionDigits: 2,
      });
    output.textContent = `${result.status === "hit" ? t.hit : t.miss}: ${result.target}; Δx ${number.format(result.dx)}, Δy ${number.format(result.dy)}, d ${number.format(result.distance)} CSS px; ≤ ${number.format(report.threshold)} CSS px`;
    output.dataset.status = result.status;
  }
  for (const control of [enabled, anchor, tolerance])
    control.addEventListener(
      "change",
      () => {
        if (!tolerance.checkValidity()) {
          tolerance.reportValidity();
          tolerance.value = String(settings.tolerance * 100);
          return;
        }
        settings = {
          enabled: enabled.checked,
          anchor: anchor.value,
          tolerance: Number(tolerance.value) / 100,
        };
        render();
        onChange(config());
      },
      options,
    );
  const pptx = make(document, "details"),
    file = make(document, "input", {
      type: "file",
      accept: ".pptx",
      "aria-label": t.upload,
    });
  const run = make(document, "button", { type: "button" }, t.review),
    state = make(document, "p", { role: "status" });
  const save = make(document, "button", { type: "button" }, t.json);
  save.hidden = true;
  pptx.append(make(document, "summary", {}, t.pptx), file, run, state, save);
  element.append(pptx);
  let report = null;
  run.addEventListener(
    "click",
    async () => {
      const chosen = file.files?.[0];
      if (!chosen || chosen.size > 12 * 1024 * 1024) {
        state.textContent = t.limit;
        return;
      }
      if (!tolerance.checkValidity()) {
        tolerance.reportValidity();
        return;
      }
      run.disabled = true;
      state.textContent = t.pending;
      save.hidden = true;
      report = null;
      try {
        const session = await get("ui-session"),
          query = new URLSearchParams({
            anchor: anchor.value,
            tolerance: String(config().tolerance),
            diagnostic: "true",
          });
        const response = await view.fetch(
          `/api/v1/golden-canon/pptx?${query}`,
          {
            method: "POST",
            headers: { "Content-Type": TYPE, "X-Ag-Design-UI": session.token },
            body: chosen,
            redirect: "error",
            signal: controller.signal,
          },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (disposed) return;
        const bytes = Uint8Array.from(
          view.atob(result.diagnosticPptxBase64),
          (char) => char.charCodeAt(0),
        );
        delete result.diagnosticPptxBase64;
        report = result;
        let count = 0,
          unknown = 0,
          hits = 0;
        for (const slide of result.slides) {
          count += slide.coverage.measured;
          hits += slide.coverage.hit;
          unknown += slide.unknown.length;
        }
        state.textContent = `${result.slides.length} ${t.slides}; ${count} ${t.measured}; ${hits} ${t.hit}; ${unknown} ${t.unknownShapes}. ${t.native}`;
        save.hidden = false;
        download(
          view,
          new view.Blob([bytes], { type: TYPE }),
          "golden-canon-review.pptx",
        );
      } catch (error) {
        if (!disposed) state.textContent = `${t.failed}: ${error.message}`;
      } finally {
        if (!disposed) run.disabled = false;
      }
    },
    options,
  );
  save.addEventListener(
    "click",
    () => {
      if (report)
        download(
          view,
          new view.Blob([JSON.stringify(report, null, 2)], {
            type: "application/json",
          }),
          "golden-canon-report.json",
        );
    },
    options,
  );
  return {
    element,
    config,
    setEnabled(value) {
      enabled.checked = value;
      settings = { ...settings, enabled: value };
      onChange(config());
    },
    update(facts, id) {
      current = facts;
      selectedId = id;
      render();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      controller.abort();
      element.remove();
    },
  };
}

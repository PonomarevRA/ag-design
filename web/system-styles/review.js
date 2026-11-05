import { auditInterface } from "./vendor/lab/audit.js";
const paths = {
  "midnight-glass": "example.html?style=midnight-glass",
  "violet-soft-3d": "example.html?style=violet-soft-3d",
  "coral-pulse": "coral-pulse.html",
  "graphite-gold": "gold-console.html",
  "amber-circuit": "amber-circuit.html",
  "saas-clarity": "saas-clarity.html",
  "learning-air": "learning-air.html",
  "orchid-studio": "orchid-studio.html",
  "periwinkle-cms": "periwinkle-cms.html",
};
let frame = document.querySelector("iframe");
const controls = Object.fromEntries(
  ["style", "block", "width", "state"].map((id) => [
    id,
    document.getElementById(id),
  ]),
);
let revision = 0;
let cancelWait = null;
let pendingCase = null;
let stopped = false;

/**
 * Reload one allowlisted same-origin example so test-only text/style mutations never leak between scenarios.
 * The visible controls own synthetic fixture state; no input values are returned in the report.
 */
function load() {
  revision++;
  settlePending(new Error("Проверка заменена новым сценарием"));
  document.getElementById("report").removeAttribute("data-revision");
  document.getElementById("report").textContent = "";
  cancelWait?.();
  document.getElementById("result").textContent = "Подготовка…";
  frame.style.width = `${Number(controls.width.value)}px`;
  const path = paths[controls.style.value];
  const separator = path.includes("?") ? "&" : "?";
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => settlePending(new Error("Пример не загрузился за 15 секунд")),
      15000,
    );
    pendingCase = { resolve, reject, timer };
    frame.src = `./${path}${separator}agReview=${revision}#demo-components`;
  });
}

/**
 * Wait for one same-origin fixture node; late locale/editor mounts must not become false failures.
 * @param {Document} doc The currently loaded allowlisted example document.
 * @param {Function} find Returns the required node once its owned content is mounted.
 * @returns {Promise<Element>} The mounted node, or a bounded loading failure.
 */
function fixtureNode(doc, find) {
  return new Promise((resolve, reject) => {
    const observer = new doc.defaultView.MutationObserver(check);
    const timer = setTimeout(
      () => finish(new Error("Блок не загрузился")),
      8000,
    );
    const cancel = () => finish(new Error("Проверка заменена новым сценарием"));
    /** Settle one wait exactly once and release its observer/timer on navigation or completion. */
    function finish(error, node) {
      observer.disconnect();
      clearTimeout(timer);
      if (cancelWait === cancel) cancelWait = null;
      if (error) reject(error);
      else resolve(node);
    }
    function check() {
      const node = find();
      if (node) finish(null, node);
    }
    cancelWait = cancel;
    observer.observe(doc.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
    });
    check();
  });
}

/** Apply only explicit synthetic typography/feedback stress to the loaded test document. */
function stress(doc, root) {
  const fields = Array.from(
    root.querySelectorAll("[data-ag-form-field]"),
  ).filter((e) => e.getClientRects().length);
  const first = fields[0];
  if (!first) return;
  const caption = first.querySelector(
    ".ag-form-track__label,.ag-field__label,label,span",
  );
  if (controls.state.value === "wrapped" && caption)
    caption.textContent =
      "Поиск по истории изменений выбранного рабочего пространства";
  if (controls.state.value === "feedback") {
    const input = first.querySelector("input,select,textarea");
    const hint = doc.createElement("p");
    hint.id = "review-synthetic-feedback";
    hint.textContent =
      "Проверьте выбранное значение. Длинная подсказка занимает несколько строк и остаётся под своим полем.";
    hint.className = "ag-form-track__feedback";
    hint.style.margin = "0";
    const track = first.querySelector(".ag-form-track__feedback");
    (track || first).append(hint);
    input.setAttribute(
      "aria-describedby",
      [input.getAttribute("aria-describedby"), hint.id]
        .filter(Boolean)
        .join(" "),
    );
    input.setAttribute("aria-invalid", "true");
  }
  if (controls.state.value === "text2x") {
    const targets = new Set(
      root.querySelectorAll(
        "input,select,textarea,.ag-form-track__label,.ag-field__label,.ag-select>label,.ag-field__hint,.ag-select__hint,.ag-select__error,.ag-form-track__feedback",
      ),
    );
    const sizes = Array.from(targets).map((e) => [
      e,
      parseFloat(doc.defaultView.getComputedStyle(e).fontSize),
    ]);
    for (const [e, size] of sizes) e.style.fontSize = `${size * 2}px`;
  }
}

/** Measure the selected real panel after fonts/layout settle; missing declarations stay visible. */
async function measure() {
  const expected = revision;
  const doc = frame.contentDocument;
  await doc.fonts.ready;
  await new Promise((resolve) =>
    frame.contentWindow.requestAnimationFrame(() =>
      frame.contentWindow.requestAnimationFrame(resolve),
    ),
  );
  if (expected !== revision) return;
  const root = doc.querySelector('[role="tabpanel"]:not([hidden])');
  const audit = auditInterface(root);
  const rows = [];
  for (const row of root.querySelectorAll("[data-ag-form-row]")) {
    if (!row.getClientRects().length) continue;
    const values = Array.from(row.querySelectorAll("input,select,textarea"))
      .filter((e) => e.getClientRects().length)
      .map((e) => {
        const r = e.getBoundingClientRect();
        return {
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          bottom: r.bottom,
        };
      });
    rows.push({
      layout: doc.defaultView.getComputedStyle(row).gridTemplateColumns,
      controls: values,
    });
  }
  const result = {
    schemaVersion: "ag-design/updated-block-review-v1",
    revision,
    style: controls.style.value,
    block: controls.block.value,
    width: Number(controls.width.value),
    state: controls.state.value,
    outerOverflow: Math.max(
      0,
      doc.documentElement.scrollWidth - doc.documentElement.clientWidth,
    ),
    audit,
    rows,
    limits: [
      "synthetic fixture changes; no input values retained",
      "rectangle evidence only; keyboard/AT/optics separate",
      "text2x enlarges actual field/caption/feedback text; not whole-document zoom",
    ],
  };
  document.getElementById("report").textContent = JSON.stringify(
    result,
    null,
    2,
  );
  document.getElementById("report").dataset.revision = String(revision);
  const coverage = audit.formRows.coverage;
  document.getElementById("result").textContent =
    `${audit.findings.length} замечаний · полей проверено ${coverage.measuredControls} из ${coverage.visibleControls} · геометрия: ${audit.formRows.geometryGate}`;
  return result;
}
/** Activate the requested real tab in the current fixture; stale navigations never publish a report. */
async function prepareFrame(event) {
  if (event.currentTarget !== frame) return;
  const expected = revision;
  try {
    const doc = frame.contentDocument;
    if (
      !doc?.documentElement ||
      new URL(doc.URL).searchParams.get("agReview") !== String(expected)
    )
      return;
    const block = controls.block.value;
    const tab = await fixtureNode(doc, () =>
      doc.querySelector(`[role="tab"][data-tab-id="${block}"]`),
    );
    if (expected !== revision) return;
    tab.click();
    const root = await fixtureNode(doc, () => {
      const panel = doc.querySelector('[role="tabpanel"]:not([hidden])');
      return panel &&
        (block !== "markdown" || panel.querySelector(".ag-markdown-editor"))
        ? panel
        : null;
    });
    if (expected !== revision) return;
    stress(doc, root);
    const result = await measure();
    if (expected === revision && pendingCase) {
      settlePending(null, result);
    }
  } catch (error) {
    if (expected === revision) {
      document.getElementById("result").textContent = error.message;
      settlePending(error);
    }
  }
}

/** Complete or cancel one case without retaining stale timeouts or unresolved callers. */
function settlePending(error, result) {
  if (!pendingCase) return;
  const pending = pendingCase;
  pendingCase = null;
  clearTimeout(pending.timer);
  if (error) pending.reject(error);
  else pending.resolve(result);
}

/** Keep failed loads explicit; manual runs never produce an unhandled promise rejection. */
function showFailure(error) {
  document.getElementById("result").textContent = error.message;
}

/** Run the declared coverage matrix through the same visible fixture controls and measurement path. */
async function runMatrix() {
  const button = document.getElementById("matrix");
  const output = document.getElementById("matrix-report");
  output.removeAttribute("data-complete");
  const results = [];
  const disabled = [
    ...Object.values(controls),
    document.getElementById("measure"),
    button,
  ];
  for (const control of disabled) control.disabled = true;
  try {
    for (const style of Object.keys(paths)) {
      for (const block of [
        "tasks",
        "settings",
        "git",
        "table",
        "language",
        "markdown",
      ]) {
        const widths = ["tasks", "settings"].includes(block)
          ? [320, 640]
          : [320];
        const states = ["tasks", "settings"].includes(block)
          ? ["normal", "wrapped", "feedback", "text2x"]
          : ["normal"];
        for (const width of widths) {
          for (const state of states) {
            if (stopped)
              throw new Error("Проверка остановлена уходом со страницы");
            controls.style.value = style;
            controls.block.value = block;
            controls.width.value = String(width);
            controls.state.value = state;
            try {
              results.push(await load());
            } catch (error) {
              results.push({
                style,
                block,
                width,
                state,
                error: error.message,
              });
            }
            document.getElementById("matrix-status").textContent =
              `Проверено ${results.length} из 180`;
          }
        }
      }
    }
  } finally {
    for (const control of disabled) control.disabled = false;
    output.textContent = JSON.stringify(results, null, 2);
    output.dataset.complete = "true";
  }
}
document
  .getElementById("measure")
  .addEventListener("click", () => load().catch(showFailure));
document
  .getElementById("matrix")
  .addEventListener("click", () => runMatrix().catch(showFailure));
frame.addEventListener("load", prepareFrame);
window.addEventListener("pagehide", (event) => {
  if (event.persisted) return;
  stopped = true;
  cancelWait?.();
  settlePending(new Error("Проверка остановлена уходом со страницы"));
});
load().catch(showFailure);

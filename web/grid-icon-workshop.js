import {
  createGridIconDraft,
  GRID_ICON_SYMBOLS,
} from "./vendor/ag-design/grid-icon-draft.js";
import { createLayoutGridOverlay } from "./vendor/ag-design/layout-grid-overlay.js";
import { LAYOUT_GRID_TYPES } from "./vendor/ag-design/layout-grid-model.js";
import { GRID_LABELS } from "./composition-grid-labels.js";
import { h } from "./dom.js";
const NS = "http://www.w3.org/2000/svg";
const ILLUSTRATIVE = [
  "icon-keylines",
  "spacing",
  "golden-canon",
  "thirds",
  "edge-balance",
  "lead-room",
  "center-perspective",
  "phi-grid",
  "golden-triangle",
  "diagonal-flow",
];
let serial = 0;
/**
 * Render only a fixed whitelist of generated primitive data; never parse supplied SVG or HTML.
 * @param {Document} document Host DOM document.
 * @param {object} draft Generated bounded primitive data.
 * @param {number} size Display size in CSS pixels.
 * @param {string} name Literal accessible image name.
 * @returns {SVGElement} Detached safe SVG; no supplied SVG markup is parsed.
 * @throws {TypeError} Generated primitive kind is outside the fixed whitelist.
 */
function iconNode(document, draft, size, name) {
  const root = document.createElementNS(NS, "svg");
  root.setAttribute(
    "viewBox",
    `0 0 ${draft.viewBox.width} ${draft.viewBox.height}`,
  );
  root.setAttribute("role", "img");
  root.setAttribute("aria-label", name);
  root.setAttribute("width", String(size));
  root.setAttribute("height", String(size));
  root.setAttribute("stroke", "currentColor");
  root.setAttribute("stroke-width", String(draft.strokeWidth));
  root.setAttribute("stroke-linecap", "round");
  root.setAttribute("stroke-linejoin", "round");
  for (const p of draft.primitives) {
    if (!["circle", "rect", "polyline", "polygon"].includes(p.kind))
      throw new TypeError("icon primitive");
    const node = document.createElementNS(NS, p.kind);
    for (const key of p.kind === "circle"
      ? ["cx", "cy", "r"]
      : p.kind === "rect"
        ? ["x", "y", "width", "height"]
        : [])
      node.setAttribute(key, String(p[key]));
    if (p.points)
      node.setAttribute("points", p.points.map((v) => v.join(",")).join(" "));
    node.setAttribute("fill", p.fill ? "currentColor" : "none");
    root.append(node);
  }
  return root;
}
/**
 * Safe local icon recipe workshop; each preview/download and resource has an explicit owner and accepted draft.
 * @param {object} [options] Initial language, starter symbol and purpose.
 * @param {string} [options.locale="ru"] English or Russian presentation.
 * @param {string} [options.symbol="focus"] Supported starter, otherwise focus.
 * @param {string} [options.purpose="ui"] UI or illustrative, otherwise UI.
 * @returns {object} Owned element, defensive accepted draft getter, interact and idempotent dispose. Downloads and URLs end with this owner.
 */
export function buildGridIconWorkshop({
  locale = "ru",
  symbol: initialSymbol = "focus",
  purpose: initialPurpose = "ui",
} = {}) {
  const en = locale.startsWith("en"),
    prefix = "grid-icon-workshop-" + ++serial,
    labels = GRID_LABELS[en ? "en" : "ru"],
    view = document.defaultView;
  const title = h(
    "h4",
    { id: prefix + "-title" },
    en ? "Grid-first icon drafts" : "Черновики иконок по сетке",
  );
  const element = h(
    "section",
    { className: "grid-icon-workshop", "aria-labelledby": title.id },
    title,
    h(
      "p",
      {},
      en
        ? "Four original starter symbols. Numeric alignment is a construction check; recognition, optical balance and accessible controls need host review."
        : "Четыре оригинальных стартовых символа. Выравнивание проверяет построение; узнаваемость, оптический баланс и доступные контролы требуют проверки в продукте.",
    ),
  );
  const controls = h("div", {
    className: "composition-grid-workshop__controls",
  });
  const select = (name, items) => {
    const node = h("select", { "aria-label": name });
    for (const [value, label] of items)
      node.append(h("option", { value }, label));
    controls.append(h("label", {}, h("span", {}, name), node));
    return node;
  };
  const names = en
    ? ["Play", "Focus", "Image", "Compass"]
    : ["Воспроизведение", "Фокус", "Изображение", "Компас"];
  const symbol = select(
    en ? "Starter symbol" : "Стартовый символ",
    GRID_ICON_SYMBOLS.map((v, i) => [v, names[i]]),
  );
  symbol.value = GRID_ICON_SYMBOLS.includes(initialSymbol)
    ? initialSymbol
    : "focus";
  const purpose = select(en ? "Icon purpose" : "Назначение иконки", [
    ["ui", en ? "UI action icon" : "Значок действия UI"],
    ["illustrative", en ? "Illustrative mark" : "Иллюстративный знак"],
  ]);
  purpose.value = ["ui", "illustrative"].includes(initialPurpose)
    ? initialPurpose
    : "ui";
  const profile = select(
    en ? "Icon grid" : "Сетка иконки",
    LAYOUT_GRID_TYPES.map((id) => [id, labels[id]]),
  );
  profile.value = "icon-keylines";
  const side = select(en ? "Icon subject side" : "Сторона акцента иконки", [
    ["left", en ? "Left" : "Слева"],
    ["right", en ? "Right" : "Справа"],
    ["top", en ? "Top" : "Сверху"],
    ["bottom", en ? "Bottom" : "Снизу"],
  ]);
  const input = h("input", {
      id: prefix + "-label",
      type: "text",
      value: names[GRID_ICON_SYMBOLS.indexOf(symbol.value)],
      maxlength: 80,
    }),
    stroke = h("input", {
      type: "range",
      min: 1,
      max: 3,
      step: 0.25,
      value: 1.5,
      "aria-label": en ? "Stroke width" : "Толщина обводки",
    });
  controls.append(
    h(
      "label",
      { for: input.id },
      h("span", {}, en ? "Icon name" : "Имя иконки"),
      input,
    ),
    h(
      "label",
      {},
      h("span", {}, en ? "Stroke width" : "Толщина обводки"),
      stroke,
    ),
  );
  const show = h("input", { type: "checkbox", checked: true });
  controls.append(
    h(
      "label",
      { className: "grid-icon-workshop__toggle" },
      show,
      h("span", {}, en ? "Show grid" : "Показать сетку"),
    ),
  );
  const stage = h("div", { className: "grid-icon-workshop__stage" }),
    sizes = h("div", { className: "grid-icon-workshop__sizes" }),
    status = h("p", { role: "status", "aria-atomic": "true" }),
    error = h("p", { id: prefix + "-error", hidden: true }),
    facts = h("pre", {
      className: "composition-grid-workshop__facts",
      "aria-label": en
        ? "Icon construction evidence"
        : "Факты построения иконки",
    }),
    download = h(
      "button",
      { type: "button" },
      en ? "Download SVG" : "Скачать SVG",
    );
  element.append(
    controls,
    error,
    stage,
    sizes,
    status,
    download,
    h(
      "details",
      {},
      h("summary", {}, en ? "Numeric draft" : "Числовой черновик"),
      facts,
    ),
  );
  const listeners = [],
    urls = new Map();
  let disposed = false,
    accepted = null,
    overlay = null,
    labelCustomized = false;
  /**
   * Adopt only allowed per-purpose profiles, and reflect disabled choices before rendering a new accepted draft.
   */
  function reflect() {
    const allowed =
      purpose.value === "ui" ? ["icon-keylines", "spacing"] : ILLUSTRATIVE;
    for (const option of profile.options)
      option.disabled = !allowed.includes(option.value);
    if (!allowed.includes(profile.value)) profile.value = "icon-keylines";
    side.disabled = !["edge-balance", "lead-room"].includes(profile.value);
    for (const option of side.options)
      option.disabled =
        profile.value === "lead-room" &&
        ["top", "bottom"].includes(option.value);
    if (
      profile.value === "lead-room" &&
      !["left", "right"].includes(side.value)
    )
      side.value = "left";
  }
  /**
   * Build before replacing; invalid labels preserve the previous accepted image and expose a linked recovery error.
   */
  function render() {
    if (disposed) return;
    reflect();
    const grid = { type: profile.value };
    if (["edge-balance", "lead-room"].includes(grid.type))
      grid.edge = side.value;
    let next;
    try {
      next = createGridIconDraft({
        symbol: symbol.value,
        purpose: purpose.value,
        grid,
        label: input.value,
        strokeWidth: Number(stroke.value),
      });
    } catch {
      error.hidden = false;
      error.textContent = en
        ? "Enter a nonblank name of up to80 UTF-16 units. The previous draft is retained."
        : "Введите непустое имя до80 единиц UTF-16. Сохранён предыдущий черновик.";
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", error.id);
      status.textContent = error.textContent;
      download.disabled = true;
      return;
    }
    const art = iconNode(document, next, 192, next.label);
    overlay?.dispose();
    stage.replaceChildren(art);
    overlay = createLayoutGridOverlay({
      document,
      report: next.report,
      markerScale: next.viewBox.width / 256,
    });
    overlay.element.hidden = !show.checked;
    stage.append(overlay.element);
    sizes.replaceChildren();
    for (const size of [16, 20, 24, 32, 64])
      sizes.append(
        h(
          "figure",
          {},
          iconNode(document, next, size, `${next.label}, ${size}px`),
          h("figcaption", {}, `${size}px`),
        ),
      );
    accepted = next;
    error.hidden = true;
    error.textContent = "";
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
    download.disabled = false;
    status.textContent =
      (en
        ? "Stroke bounds inside live area: "
        : "Границы с обводкой в live area: ") +
      (next.withinLiveArea ? (en ? "yes" : "да") : en ? "no" : "нет") +
      " · " +
      (en ? "optics/recognition: unknown" : "оптика/узнаваемость: неизвестно");
    facts.textContent = JSON.stringify(
      {
        symbol: next.symbol,
        purpose: next.purpose,
        viewBox: next.viewBox,
        visibleBounds: next.visibleBounds,
        withinLiveArea: next.withinLiveArea,
        report: next.report,
        markerScale: next.viewBox.width / 256,
        constraints: next.constraints,
      },
      null,
      2,
    );
  }
  /**
   * Download only this accepted generated SVG; filename never contains user text and every URL is revoked.
   */
  function save() {
    if (disposed || !accepted || download.disabled) return;
    const blob = new view.Blob([accepted.svg], { type: "image/svg+xml" }),
      url = view.URL.createObjectURL(blob),
      link = h("a", {
        href: url,
        download: `ag-${accepted.symbol}-${accepted.report.geometry.config.type}.svg`,
      });
    link.click();
    const timer = view.setTimeout(() => {
      view.URL.revokeObjectURL(url);
      urls.delete(url);
    }, 1000);
    urls.set(url, timer);
  }
  for (const node of [symbol, purpose, profile, side, input, stroke, show]) {
    const type = node === input || node === stroke ? "input" : "change";
    const listener = () => {
      // A generated title follows its symbol; deliberate user wording is retained across changes.
      if (node === input) labelCustomized = true;
      if (node === symbol && !labelCustomized)
        input.value = names[GRID_ICON_SYMBOLS.indexOf(symbol.value)];
      render();
    };
    node.addEventListener(type, listener);
    listeners.push(() => node.removeEventListener(type, listener));
  }
  download.addEventListener("click", save);
  listeners.push(() => download.removeEventListener("click", save));
  render();
  return {
    element,
    get draft() {
      return structuredClone(accepted);
    },
    interact() {
      symbol.value =
        GRID_ICON_SYMBOLS[
          (GRID_ICON_SYMBOLS.indexOf(symbol.value) + 1) %
            GRID_ICON_SYMBOLS.length
        ];
      if (!labelCustomized)
        input.value = names[GRID_ICON_SYMBOLS.indexOf(symbol.value)];
      render();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const stop of listeners) stop();
      overlay?.dispose();
      for (const [url, timer] of urls) {
        view.clearTimeout(timer);
        view.URL.revokeObjectURL(url);
      }
      urls.clear();
      accepted = null;
    },
  };
}

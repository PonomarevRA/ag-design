import { node } from "./runtime.js";
import {
  panelData,
  panelOptions,
  panelCells,
} from "./analytic-panels-model.js";
import { paintPanel } from "./analytic-panels-paint.js";
import { analyticValue } from "./analytic-options.js";

/** Independent small panel runtime with stable controls, exact readout and bounded paged data; ASCII changes appearance only. */
function createPanel(
  kind,
  {
    document = globalThis.document,
    data,
    options = {},
    width = 600,
    height = 240,
  } = {},
) {
  validSize(width, height);
  let state = panelData(kind, data),
    settings = panelOptions(kind, options),
    cells = panelCells(kind, state, settings),
    selected = 0,
    disposed = false,
    visible = true,
    page = 0,
    draw = null;
  const view = document.defaultView,
    element = node(document, "section", "ag-vt ag-analytic-panel"),
    title = node(document, "h3", "", settings.label),
    value = node(document, "strong", "ag-stat-value"),
    plot = node(document, "div", "ag-analytic-panel__plot"),
    readout = node(document, "output", "ag-analytic__readout"),
    actions = node(document, "div", "ag-vt-actions"),
    details = node(document, "details", "ag-vt-chart__data"),
    tableHost = node(document, "div"),
    paging = node(document, "div", "ag-vt-actions"),
    pageLabel = node(document, "output"),
    listeners = [];
  plot.tabIndex = 0;
  plot.setAttribute("role", "group");
  plot.setAttribute(
    "aria-label",
    settings.label + " — стрелки выбирают значение",
  );
  element.append(title);
  if (kind === "stat") element.append(value);
  element.append(plot, readout, actions, details);
  details.append(
    node(document, "summary", "", "Точные данные"),
    tableHost,
    paging,
  );
  function listen(target, type, fn) {
    target.addEventListener(type, fn);
    listeners.push(() => target.removeEventListener(type, fn));
  }
  function button(label, fn, host = actions) {
    const b = node(document, "button", "ag-vt-button", label);
    b.type = "button";
    listen(b, "click", fn);
    host.append(b);
    return b;
  }
  /** Exact text expresses supplied values, bucket intervals or durations without estimating data from glyph density. */
  function text(cell) {
    if (!cell) return "Нет данных";
    if (kind === "stat")
      return `${cell.x}: ${analyticValue(cell.value, settings)}`;
    if (kind === "heatmap")
      return `X [${cell.start}, ${cell.end}), Y [${cell.low}, ${cell.high}): ${analyticValue(cell.value, settings)}`;
    return `${cell.label}: ${cell.state ?? "Нет данных"} · [${cell.start}, ${cell.end}) · длительность ${cell.end - cell.start}`;
  }
  function table() {
    if (!details.open) return;
    const rawCells = panelCells(kind, state, {
      ...settings,
      mergeAdjacent: false,
    });
    const body = node(document, "table", "ag-vt-table");
    page = Math.min(page, Math.max(0, Math.floor((rawCells.length - 1) / 64)));
    for (const cell of rawCells.slice(page * 64, page * 64 + 64)) {
      const row = node(document, "tr");
      row.append(node(document, "td", "", text(cell)));
      body.append(row);
    }
    tableHost.replaceChildren(body);
    pageLabel.textContent = `${page + 1} / ${Math.max(1, Math.ceil(rawCells.length / 64))}`;
  }
  button(
    "Предыдущие строки",
    () => {
      page = Math.max(0, page - 1);
      table();
    },
    paging,
  );
  paging.append(pageLabel);
  button(
    "Следующие строки",
    () => {
      page = Math.min(
        Math.max(
          0,
          Math.floor(
            (panelCells(kind, state, { ...settings, mergeAdjacent: false })
              .length -
              1) /
              64,
          ),
        ),
        page + 1,
      );
      table();
    },
    paging,
  );
  listen(details, "toggle", table);
  /** Rendering has a strict mark/glyph budget; layout and selection always use the same original regions. */
  function paint() {
    if (disposed) return;
    title.textContent = settings.label;
    element.dataset.renderer = settings.renderer;
    element.classList.toggle(
      "ag-analytic-panel--ascii",
      settings.renderer === "ascii",
    );
    value.textContent = analyticValue(state.value, settings);
    let tone = settings.color;
    for (const threshold of settings.thresholds)
      if (state.value !== null && state.value >= threshold.value)
        tone = threshold.color;
    value.style.color = `var(--ag-${tone})`;
    draw = paintPanel(
      document,
      kind,
      state,
      settings,
      cells,
      width,
      height,
      selected,
    );
    plot.replaceChildren(draw.svg);
    plot.style.aspectRatio = `${width}/${height}`;
    plot.hidden = kind === "stat" && !state.spark;
    actions.hidden = !cells.length;
    readout.textContent =
      kind === "stat" && !cells.length
        ? "Значение: " + analyticValue(state.value, settings)
        : text(cells[selected]);
    previous.disabled = selected === 0;
    next.disabled = selected >= cells.length - 1;
    table();
  }
  function select(index) {
    if (
      disposed ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= cells.length
    )
      return false;
    if (index === selected) return true;
    selected = index;
    paint();
    return true;
  }
  const previous = button("Предыдущее значение", () => select(selected - 1)),
    next = button("Следующее значение", () => select(selected + 1));
  listen(plot, "keydown", (event) => {
    let next = selected;
    if (["ArrowLeft", "ArrowUp"].includes(event.key)) next--;
    else if (["ArrowRight", "ArrowDown"].includes(event.key)) next++;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = cells.length - 1;
    else return;
    event.preventDefault();
    select(Math.max(0, Math.min(cells.length - 1, next)));
  });
  listen(plot, "pointermove", (event) => {
    if (kind === "stat") {
      const rect = plot.getBoundingClientRect();
      select(
        Math.round(
          Math.max(
            0,
            Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)),
          ) * Math.max(0, cells.length - 1),
        ),
      );
      return;
    }
    const cell = event.target.closest?.("[data-cell]");
    if (cell) select(Number(cell.dataset.cell));
  });
  listen(plot, "click", (event) => {
    const cell = event.target.closest?.("[data-cell]");
    if (cell) select(Number(cell.dataset.cell));
  });
  function setVisible(value) {
    if (disposed) return;
    visible = value;
    element.classList.toggle("is-paused", !value || document.hidden);
  }
  const observer = view.IntersectionObserver
    ? new view.IntersectionObserver((entries) => {
        for (const entry of entries) setVisible(entry.isIntersecting);
      })
    : null;
  observer?.observe(element);
  listen(document, "visibilitychange", () => setVisible(visible));
  /** Validate new data/settings before replacing state; the current selected index is clamped, never used as a synthetic value. */
  function setData(data) {
    if (disposed) return false;
    const candidate = panelData(kind, data),
      nextCells = panelCells(kind, candidate, settings);
    state = candidate;
    cells = nextCells;
    selected = Math.min(selected, Math.max(0, cells.length - 1));
    paint();
    return true;
  }
  function setOptions(next) {
    if (disposed) return false;
    const candidate = panelOptions(kind, { ...settings, ...next }),
      nextCells = panelCells(kind, state, candidate);
    settings = candidate;
    cells = nextCells;
    selected = Math.min(selected, Math.max(0, cells.length - 1));
    paint();
    return true;
  }
  /** Validate allocation bounds before installing observers or mutating a mounted panel. */
  function validSize(w, h) {
    if (
      !Number.isFinite(w) ||
      !Number.isFinite(h) ||
      w < 160 ||
      w > 1600 ||
      h < 80 ||
      h > 1000
    )
      throw new RangeError("Panel size160..1600 ×80..1000");
  }
  function setSize(w, h) {
    if (disposed) return false;
    validSize(w, h);
    width = w;
    height = h;
    paint();
    return true;
  }
  setSize(width, height);
  return {
    element,
    kind,
    setData,
    setOptions,
    setSize,
    select,
    get options() {
      return structuredClone(settings);
    },
    get stats() {
      return { cells: cells.length, glyphs: draw?.glyphs ?? 0, disposed };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      observer?.disconnect();
      for (const remove of listeners) remove();
      state = null;
      cells = [];
      draw = null;
      element.remove();
    },
  };
}
/** Explicit statistic plus one supplied sparkline; no implicit averaging or last-value policy. */
export const createStat = (options) => createPanel("stat", options);
/** Already-bucketed histogram over numeric X/Y intervals, with nonnegative counts and explicit null cells. */
export const createHeatmap = (options) => createPanel("heatmap", options);
/** Ordered nonoverlapping state intervals; interval widths encode actual supplied duration. */
export const createStateTimeline = (options) =>
  createPanel("state-timeline", options);

import {
  layoutGridGeometry,
  checkLayoutGrid,
  LAYOUT_GRID_TYPES,
} from "./vendor/ag-design/layout-grid-model.js";
import { createLayoutGridOverlay } from "./vendor/ag-design/layout-grid-overlay.js";
import { GRID_LABELS } from "./composition-grid-labels.js";
import { h } from "./dom.js";
const NS = "http://www.w3.org/2000/svg";
let serial = 0;
/**
 * Fixed SVG tags and literal attributes build original schematic examples; no supplied markup or remote image is loaded.
 * @param {Document} document Owned host document.
 * @param {string} tag Fixed SVG primitive tag.
 * @param {object} attrs Literal trusted schematic attributes.
 * @returns {SVGElement} Detached primitive; no supplied markup is parsed.
 */
function svg(document, tag, attrs) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

/**
 * Owned framing workshop makes synthetic point choices explicit, including unknown real text/optical measurements.
 * @param {object} [options] Initial profile and language; no external data or markup.
 * @param {string} [options.type="golden-canon"] Supported profile; invalid IDs use Golden Canon.
 * @param {string} [options.locale="ru"] en prefix selects English, otherwise Russian.
 * @returns {object} Owned element, defensive report getter, interact probe and idempotent dispose.
 */
export function buildCompositionGridWorkshop({
  type = "golden-canon",
  locale = "ru",
} = {}) {
  const en = locale.startsWith("en"),
    labels = GRID_LABELS[en ? "en" : "ru"],
    prefix = "grid-workshop-" + ++serial;
  const title = h(
    "h4",
    { id: prefix + "-title" },
    en ? "Try the composition grid" : "Попробуйте композиционную сетку",
  );
  const element = h(
    "section",
    { className: "composition-grid-workshop", "aria-labelledby": title.id },
    title,
    h(
      "p",
      {},
      en
        ? "Original schematic, not a photograph. The declared point is the object centre; grid hits do not prove aesthetics, gaze or text baselines."
        : "Авторская схема, не фотография. Заявленная точка — центр условного объекта; попадание не доказывает эстетику, направление взгляда или базовую линию текста.",
    ),
  );
  const controls = h("div", {
    className: "composition-grid-workshop__controls",
  });
  const makeSelect = (name, entries) => {
    const select = h("select", { "aria-label": name });
    for (const [value, label] of entries)
      select.append(h("option", { value }, label));
    controls.append(h("label", {}, h("span", {}, name), select));
    return select;
  };
  const profile = makeSelect(
    en ? "Grid profile" : "Профиль сетки",
    LAYOUT_GRID_TYPES.map((id) => [id, labels[id] ?? id]),
  );
  profile.value = LAYOUT_GRID_TYPES.includes(type) ? type : "golden-canon";
  const aspect = makeSelect(en ? "Frame format" : "Формат кадра", [
    ["wide", "16:9"],
    ["square", "1:1"],
    ["portrait", "3:4"],
  ]);
  const edge = makeSelect(en ? "Subject side" : "Сторона объекта", [
    ["left", en ? "Left" : "Слева"],
    ["right", en ? "Right" : "Справа"],
    ["top", en ? "Top" : "Сверху"],
    ["bottom", en ? "Bottom" : "Снизу"],
  ]);
  const mirror = makeSelect(en ? "Reflection" : "Отражение", [
    ["none", en ? "None" : "Без отражения"],
    ["x", "X"],
    ["y", "Y"],
    ["both", "X + Y"],
  ]);
  const x = h("input", {
      type: "range",
      min: 0,
      max: 100,
      step: 0.1,
      "aria-label": en ? "Point X percent" : "Точка X, проценты",
    }),
    y = h("input", {
      type: "range",
      min: 0,
      max: 100,
      step: 0.1,
      "aria-label": en ? "Point Y percent" : "Точка Y, проценты",
    });
  controls.append(
    h("label", {}, h("span", {}, en ? "Point X" : "Точка X"), x),
    h("label", {}, h("span", {}, en ? "Point Y" : "Точка Y"), y),
  );
  const stage = h("div", { className: "composition-grid-workshop__stage" }),
    picture = svg(document, "svg", {
      "aria-hidden": "true",
      focusable: "false",
      preserveAspectRatio: "none",
      class: "composition-grid-workshop__picture",
    }),
    output = h("p", { role: "status", "aria-atomic": "true" }),
    facts = h("pre", {
      "aria-label": en ? "Numeric grid evidence" : "Числовые факты сетки",
      className: "composition-grid-workshop__facts",
    });
  stage.append(picture);
  element.append(
    controls,
    stage,
    output,
    h(
      "details",
      {},
      h("summary", {}, en ? "Numeric report" : "Числовой отчёт"),
      facts,
    ),
  );
  let overlay = null,
    disposed = false,
    current = null;
  /**
   * Resolve only applicable options; stale side/reflection values never leak into another profile's strict config.
   */
  function config() {
    const grid = { type: profile.value };
    if (grid.type === "lead-room" && !["left", "right"].includes(edge.value))
      edge.value = "left";
    for (const option of edge.options)
      option.disabled =
        grid.type === "lead-room" && ["top", "bottom"].includes(option.value);
    if (["edge-balance", "lead-room"].includes(grid.type))
      grid.edge =
        grid.type === "lead-room" && !["left", "right"].includes(edge.value)
          ? "left"
          : edge.value;
    if (["golden-triangle", "diagonal-flow"].includes(grid.type)) {
      grid.flipX = ["x", "both"].includes(mirror.value);
      grid.flipY = ["y", "both"].includes(mirror.value);
    }
    return grid;
  }
  /**
   * Keep exact target/offset fixtures separate from DOM measurement claims.
   */
  function render(reset = false) {
    if (disposed) return;
    const [width, height] = {
        wide: [640, 360],
        square: [480, 480],
        portrait: [360, 480],
      }[aspect.value],
      grid = config(),
      geometry = layoutGridGeometry({ width, height, grid });
    if (reset) {
      const point =
        geometry.points.find((p) =>
          ["subject", "vanishing", "center"].includes(p.id),
        ) ?? geometry.points[0];
      x.value = (point ? point.x / width : 0.3) * 100;
      y.value = (point ? point.y / height : 0.3) * 100;
    }
    edge.disabled = !["edge-balance", "lead-room"].includes(grid.type);
    mirror.disabled = !["golden-triangle", "diagonal-flow"].includes(grid.type);
    const px = (Number(x.value) * width) / 100,
      py = (Number(y.value) * height) / 100;
    const anchors =
      grid.type === "baseline"
        ? [
            {
              id: "declared-baseline",
              x: px,
              kind: "baseline",
              unknownReason: "baseline-unavailable",
            },
          ]
        : [
            {
              id: "declared-object-center",
              ownerId: "schematic-object",
              x: px,
              y: py,
            },
          ];
    current = checkLayoutGrid({ width, height, grid, anchors });
    picture.setAttribute("viewBox", `0 0 ${width} ${height}`);
    picture.replaceChildren(
      svg(document, "rect", {
        width,
        height,
        fill: "var(--ag-surface-alt,var(--ag-surface))",
      }),
    );
    picture.append(
      svg(document, "path", {
        d: `M0 ${height * 0.8} L${width * 0.25} ${height * 0.55} L${width * 0.47} ${height * 0.76} L${width * 0.72} ${height * 0.48} L${width} ${height * 0.78} V${height} H0Z`,
        fill: "var(--ag-muted)",
        opacity: 0.1,
      }),
    );
    const radius = Math.min(width, height) * 0.035;
    picture.append(
      svg(document, "circle", {
        cx: px,
        cy: py,
        r: radius,
        fill: "var(--ag-accent)",
        opacity: 0.8,
      }),
      svg(document, "path", {
        d: `M${px - radius * 1.5} ${py + radius * 4} Q${px} ${py + radius} ${px + radius * 1.5} ${py + radius * 4}`,
        fill: "none",
        stroke: "var(--ag-accent)",
        "stroke-width": radius * 0.8,
        "stroke-linecap": "round",
      }),
    );
    stage.style.aspectRatio = `${width}/${height}`;
    if (overlay) overlay.update(current);
    else {
      overlay = createLayoutGridOverlay({ document, report: current });
      stage.append(overlay.element);
    }
    const result = current.results[0];
    output.textContent = `${labels[grid.type]} · ${result.status}${result.distance === undefined ? "" : ` · d=${result.distance.toFixed(2)}`} · ${en ? "geometry only" : "только геометрия"}`;
    facts.textContent = JSON.stringify(
      {
        profile: current.geometry.profile,
        config: current.geometry.config,
        unit: current.unit,
        points: geometry.points,
        guideSegments: geometry.diagonals.length,
        circles: geometry.circles ?? [],
        result,
      },
      null,
      2,
    );
  }
  const listeners = [];
  for (const input of [profile, aspect, edge, mirror, x, y]) {
    const listener = () =>
      render([profile, aspect, edge, mirror].includes(input));
    input.addEventListener(
      input === x || input === y ? "input" : "change",
      listener,
    );
    listeners.push(() =>
      input.removeEventListener(
        input === x || input === y ? "input" : "change",
        listener,
      ),
    );
  }
  render(true);
  return {
    element,
    get report() {
      return structuredClone(current);
    },
    /**
     * Catalog performance probe exercises the same profile transition as a person.
     */
    interact() {
      if (disposed) return;
      profile.value =
        LAYOUT_GRID_TYPES[
          (LAYOUT_GRID_TYPES.indexOf(profile.value) + 1) %
            LAYOUT_GRID_TYPES.length
        ];
      render(true);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const stop of listeners) stop();
      overlay?.dispose();
      current = null;
    },
  };
}

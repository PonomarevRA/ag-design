import { GRID_LABELS } from "./composition-grid-labels.js";
import { LAYOUT_GRID_TYPES } from "./vendor/ag-design/layout-grid-model.js";
const messages = {
  ru: {
    title: "Сетки по назначению",
    enabled: "Подсветить все элементы и точки",
    pageGrid: "Страница",
    componentGrid: "Группы и панели",
    blockGrid: "Компоненты и внутренние блоки",
    scope: "Локальный контейнер",
    override: "Его сетка",
    inherit: "Наследование осей",
    default: "По умолчанию",
    none: "Независимая локальная",
    unknown: "Актуальный числовой снимок ещё не получен",
    stale: "Геометрия изменилась — прежние попадания скрыты",
    partial: "Неполное измерение: непроверенные опоры unknown",
    current: "Актуальный снимок",
    hit: "попаданий",
    miss: "отклонений",
    unknownCount: "unknown",
    scopes: "контейнеров",
    json: "Скачать JSON координат",
    pptx: "Диагностика PPTX по выбранной сетке страницы",
    upload: "Выберите PPTX до12MiB",
    review: "Скачать редактируемую копию",
    pending: "Измерение…",
    failed: "Не удалось получить актуальный отчёт",
    units:
      "Точка: две оси; линия: одна ось. Baseline/оптический фокус без источника — unknown. Геометрия не является оценкой качества.",
  },
  en: {
    title: "Purpose-specific grids",
    enabled: "Highlight elements and interest points",
    pageGrid: "Page",
    componentGrid: "Groups and panels",
    blockGrid: "Components and inner blocks",
    scope: "Local carrier",
    override: "Its grid",
    inherit: "Inherited axes",
    default: "Use default",
    none: "Independent local grid",
    unknown: "No current numeric capture yet",
    stale: "Geometry changed — previous hits are hidden",
    partial: "Partial capture: unmeasured anchors stay unknown",
    current: "Current capture",
    hit: "hits",
    miss: "misses",
    unknownCount: "unknown",
    scopes: "carriers",
    json: "Download coordinate JSON",
    pptx: "PPTX diagnostics with the selected page grid",
    upload: "Choose PPTX up to12MiB",
    review: "Download editable copy",
    pending: "Measuring…",
    failed: "Current report unavailable",
    units:
      "Point: both axes; line: one axis. Baseline/optical focus without a source remains unknown. Geometry is not a quality score.",
  },
};

/** Create literal localized controls; dynamic identities are text and never inserted as HTML. */
function make(document, tag, text, attributes = {}) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  for (const [name, value] of Object.entries(attributes))
    node.setAttribute(name, String(value));
  return node;
}

/** Download only generated local evidence and release its object URL. */
export function downloadGridFile(document, blob, name) {
  const view = document.defaultView,
    url = view.URL.createObjectURL(blob),
    link = make(document, "a", undefined, { href: url, download: name });
  link.click();
  view.setTimeout(() => view.URL.revokeObjectURL(url), 1000);
}

/** Build UI only; the controller owns CAS configuration, capture transport and evidence lifetime. */
export function createLayoutGridPanel({ document, onChange, onPptx }) {
  const t =
      messages[document.documentElement.lang.split("-")[0]] || messages.en,
    abort = new document.defaultView.AbortController(),
    eventOptions = { signal: abort.signal };
  const element = make(document, "details", undefined, {
    class: "composition-tool-details layout-grid-panel",
  });
  element.append(make(document, "summary", t.title));
  const fields = make(document, "div", undefined, {
      class: "layout-grid-panel__fields composition-toolbar",
    }),
    controls = {};
  let configuration = null,
    current = null,
    scopeSignature = "",
    selected = "";
  /** Wrap a native control in its visible label without replacing focusable nodes during updates. */
  function field(key, control) {
    control.setAttribute("aria-label", t[key]);
    const label = make(document, "label");
    label.append(make(document, "span", t[key]), control);
    fields.append(label);
    controls[key] = control;
    return control;
  }
  const enabled = field(
    "enabled",
    make(document, "input", undefined, { type: "checkbox" }),
  );
  for (const key of ["pageGrid", "componentGrid", "blockGrid", "override"]) {
    const select = field(key, make(document, "select"));
    if (key === "override")
      select.append(make(document, "option", t.default, { value: "" }));
    for (const type of LAYOUT_GRID_TYPES)
      select.append(
        make(
          document,
          "option",
          (GRID_LABELS[document.documentElement.lang.split("-")[0]] ||
            GRID_LABELS.en)[type] || type,
          { value: type },
        ),
      );
  }
  const scope = field("scope", make(document, "select")),
    inherit = field("inherit", make(document, "select"));
  for (const [value, label] of [
    ["", t.none],
    ["x", "X"],
    ["y", "Y"],
    ["both", "X + Y"],
  ])
    inherit.append(make(document, "option", label, { value }));
  const output = make(document, "output", t.unknown, { "aria-live": "polite" }),
    save = make(document, "button", t.json, { type: "button" });
  save.disabled = true;
  element.append(
    fields,
    make(document, "p", t.units, { class: "composition-note" }),
    output,
    save,
  );
  /** Reflect one selected override while keeping its other numeric options intact. */
  function reflectOverride() {
    const item = configuration?.settings.overrides.find(
      (item) => item.nodeId === selected,
    );
    controls.override.value = item?.grid.type || "";
    inherit.value = item?.inheritAxes || "";
    inherit.disabled = selected === "@page" || !controls.override.value;
  }
  for (const key of [
    "enabled",
    "pageGrid",
    "componentGrid",
    "blockGrid",
    "override",
    "inherit",
  ])
    controls[key].addEventListener(
      "change",
      () => {
        if (!configuration) return;
        const next = structuredClone(configuration.settings);
        next.enabled = enabled.checked;
        if (["pageGrid", "componentGrid", "blockGrid"].includes(key))
          next[key] = { type: controls[key].value };
        if (key === "override" || key === "inherit") {
          next.overrides = next.overrides.filter(
            (item) => item.nodeId !== selected,
          );
          if (controls.override.value && selected) {
            const previous = configuration.settings.overrides.find(
              (item) => item.nodeId === selected,
            );
            const grid =
              previous?.grid.type === controls.override.value
                ? structuredClone(previous.grid)
                : { type: controls.override.value };
            const item = { nodeId: selected, grid };
            if (inherit.value && selected !== "@page")
              item.inheritAxes = inherit.value;
            next.overrides.push(item);
          }
        }
        onChange(next);
      },
      eventOptions,
    );
  scope.addEventListener(
    "change",
    () => {
      selected = scope.value;
      reflectOverride();
    },
    eventOptions,
  );
  save.addEventListener(
    "click",
    () => {
      if (current)
        downloadGridFile(
          document,
          new document.defaultView.Blob([JSON.stringify(current, null, 2)], {
            type: "application/json",
          }),
          "ag-layout-grid-capture.json",
        );
    },
    eventOptions,
  );
  const pptx = make(document, "details"),
    file = make(document, "input", undefined, {
      type: "file",
      accept: ".pptx",
      "aria-label": t.upload,
    }),
    run = make(document, "button", t.review, { type: "button" }),
    fileStatus = make(document, "p", "", { role: "status" });
  pptx.append(make(document, "summary", t.pptx), file, run, fileStatus);
  element.append(pptx);
  run.addEventListener(
    "click",
    async () => {
      const chosen = file.files?.[0];
      if (!chosen || chosen.size > 12 * 1024 * 1024) {
        fileStatus.textContent = t.upload;
        return;
      }
      run.disabled = true;
      fileStatus.textContent = t.pending;
      try {
        await onPptx(
          chosen,
          configuration?.settings.pageGrid || { type: "golden-canon" },
        );
        fileStatus.textContent = t.current;
      } catch {
        fileStatus.textContent = t.failed;
      } finally {
        if (!abort.signal.aborted) run.disabled = false;
      }
    },
    eventOptions,
  );
  return {
    element,
    setConfiguration(value) {
      configuration = value;
      enabled.checked = value.settings.enabled;
      for (const key of ["pageGrid", "componentGrid", "blockGrid"])
        controls[key].value = value.settings[key].type;
      reflectOverride();
    },
    show(result) {
      current = result?.report ? result : null;
      save.disabled = !current;
      if (!result || !result.report) {
        output.textContent = result?.status === "stale" ? t.stale : t.unknown;
        return;
      }
      const count = { hit: 0, miss: 0, unknown: 0 };
      for (const item of result.report.scopes)
        for (const key of Object.keys(count)) count[key] += item.coverage[key];
      output.textContent =
        (result.status === "current" ? t.current : t.partial) +
        ": " +
        result.report.scopes.length +
        " " +
        t.scopes +
        "; " +
        count.hit +
        " " +
        t.hit +
        ", " +
        count.miss +
        " " +
        t.miss +
        ", " +
        count.unknown +
        " " +
        t.unknownCount;
      // Only document-owned identities survive a later DOM capture or block reorder.
      const carriers = result.report.scopes.filter((item) =>
        ["viewport", "composition"].includes(item.boundarySource),
      );
      const signature = carriers.map((item) => item.id).join("|");
      if (signature !== scopeSignature) {
        scopeSignature = signature;
        scope.replaceChildren();
        for (const item of carriers)
          scope.append(make(document, "option", item.id, { value: item.id }));
        if (!carriers.some((item) => item.id === selected))
          selected = scope.value;
        else scope.value = selected;
        reflectOverride();
      }
    },
    pending() {
      output.textContent = t.pending;
    },
    busy(value) {
      for (const control of Object.values(controls)) control.disabled = value;
      if (!value) reflectOverride();
    },
    failed() {
      current = null;
      save.disabled = true;
      output.textContent = t.failed;
    },
    dispose() {
      abort.abort();
      current = null;
      configuration = null;
      element.remove();
    },
  };
}

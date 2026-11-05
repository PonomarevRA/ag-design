import { resolveI18n } from "./i18n.js";
import { connectionCurve } from "./card-connections.js";
import { createSelect } from "./select.js";
import { projectHistory } from "./history-model.js";
let sequence = 0;
const SVG = "http://www.w3.org/2000/svg";

/** Render a bounded history with measurable rows, literal details and host-owned actions. */
export function createHistoryView({
  document = globalThis.document,
  label,
  model,
  buildModel,
  onSelect,
  onAction,
  i18n,
}) {
  if (typeof label !== "string" || !label.trim() || label.length > 180)
    throw new TypeError("History needs a bounded accessible label");
  for (const callback of [onSelect, onAction])
    if (callback !== undefined && typeof callback !== "function")
      throw new TypeError("Callbacks must be functions");
  const win = document.defaultView;
  let localeContext = resolveI18n(document, i18n);
  let disposed = false,
    frame = null,
    selectedId = model.nodes[0]?.id ?? null;
  let projection,
    rowNodes = new Map();
  const abort = new win.AbortController();
  /** Create literal semantic DOM without parsing caller strings. */
  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  const element = node("section", undefined, "ag-history"),
    heading = node("h3", label, "ag-history__title"),
    toolbar = node("div", undefined, "ag-history__toolbar ag-form-tracks");
  toolbar.dataset.agFormRow = "auto";
  element.setAttribute("aria-label", label);
  const prefix = `ag-history-${++sequence}`;
  const searchLabel = node("label", undefined, "ag-history__search"),
    searchCaption = node("span", "Поиск в истории"),
    search = node("input");
  searchLabel.dataset.agFormField = "";
  searchCaption.id = `${prefix}-search-caption`;
  searchCaption.className = "ag-form-track__label";
  search.className = "ag-form-track__control";
  search.setAttribute("aria-labelledby", searchCaption.id);
  search.type = "search";
  search.placeholder = "Сообщение, автор или ID…";
  search.maxLength = 240;
  searchLabel.append(
    searchCaption,
    search,
    node("div", undefined, "ag-form-track__feedback"),
  );
  const filter = createSelect({
    document,
    label: "Дорожка",
    options: [
      { value: "all", label: "Все дорожки" },
      ...model.groups.map((g) => ({
        value: g.id,
        label: (g.id + " · " + g.title).slice(0, 180),
      })),
    ],
    value: "all",
    onChange: () => renderRows(),
  });
  filter.element.dataset.agFormField = "";
  filter.element.querySelector("label").classList.add("ag-form-track__label");
  filter.select.classList.add("ag-form-track__control");
  const feedback = node("div", undefined, "ag-form-track__feedback");
  feedback.append(
    ...filter.element.querySelectorAll(".ag-select__hint,.ag-select__error"),
  );
  filter.element.append(feedback);
  filter.element.hidden = model.kind === "git";
  toolbar.dataset.historyFilter = String(!filter.element.hidden);
  toolbar.append(searchLabel, filter.element);
  const legend = node(
    "p",
    model.kind === "git"
      ? "Сплошная линия — родитель коммита. Пунктир — связь за пределами выборки."
      : "Сплошная линия — события одной задачи. Пунктир — явная зависимость или скрытый контекст.",
    "ag-history__legend",
  );
  const layout = node("div", undefined, "ag-history__layout"),
    scroll = node("div", undefined, "ag-history__scroll"),
    graph = node("div", undefined, "ag-history__graph"),
    list = node("ol", undefined, "ag-history__list");
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("ag-history__svg");
  const details = node("aside", undefined, "ag-history__details");
  details.setAttribute("aria-label", "Подробности выбранной записи");
  const count = node("p", undefined, "ag-history__count");
  count.setAttribute("role", "status");
  graph.append(svg, list);
  scroll.append(graph);
  layout.append(scroll, details);
  element.append(heading, toolbar, legend, layout, count);
  /** Mark graph geometry dirty once per frame; row height follows wrapping and user font size. */
  function schedule() {
    if (disposed || frame !== null) return;
    if (win.requestAnimationFrame)
      frame = win.requestAnimationFrame(() => {
        frame = null;
        draw();
      });
    else draw();
  }
  const observer = win.ResizeObserver ? new win.ResizeObserver(schedule) : null;
  observer?.observe(graph);
  /** Draw only explicit model edges using Atlas control points and actual row centres. */
  function draw() {
    if (disposed) return;
    const base = graph.getBoundingClientRect(),
      positions = new Map();
    const height = Math.max(graph.scrollHeight, 1),
      width = 28 + model.laneCount * 18;
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.replaceChildren();
    for (const entry of projection.nodes) {
      const rect = rowNodes.get(entry.id).getBoundingClientRect();
      positions.set(entry.id, {
        x: 18 + entry.lane * 18,
        y: rect.top - base.top + rect.height / 2,
      });
    }
    for (const edge of projection.edges) {
      const from = positions.get(edge.from),
        target = positions.get(edge.to);
      if (!from) continue;
      const to = target ?? { x: from.x, y: Math.min(height - 5, from.y + 22) };
      const path = document.createElementNS(SVG, "path");
      path.setAttribute("d", connectionCurve(from, to, { axis: "vertical" }));
      path.setAttribute(
        "class",
        `ag-history__edge${edge.boundary || edge.kind === "dependency" ? " ag-history__edge--dashed" : ""}`,
      );
      path.dataset.from = edge.from;
      path.dataset.to = edge.to;
      path.style.setProperty(
        "--ag-history-lane",
        `var(--ag-history-lane-${model.nodes.find((n) => n.id === edge.from).lane % 4}, var(--ag-accent))`,
      );
      svg.append(path);
    }
    for (const entry of projection.nodes) {
      const pos = positions.get(entry.id),
        circle = document.createElementNS(SVG, "circle");
      circle.setAttribute("cx", String(pos.x));
      circle.setAttribute("cy", String(pos.y));
      circle.setAttribute("r", entry.id === selectedId ? "6" : "4");
      circle.dataset.nodeId = entry.id;
      circle.style.setProperty(
        "--ag-history-lane",
        `var(--ag-history-lane-${entry.lane % 4}, var(--ag-accent))`,
      );
      svg.append(circle);
    }
  }
  /** Details spell out parent/dependency IDs so colour and graph sight are never required. */
  function renderDetails() {
    const restoreActionFocus =
      details.contains(document.activeElement) &&
      document.activeElement?.classList.contains("ag-history__action");
    details.replaceChildren();
    const entry = model.nodes.find((n) => n.id === selectedId);
    if (!entry) {
      details.append(node("p", "Выберите запись в истории."));
      return;
    }
    details.append(
      node(
        "p",
        model.kind === "git" ? "КОММИТ" : "СОБЫТИЕ ЗАДАЧИ",
        "ag-history__eyebrow",
      ),
      node("h4", entry.title),
      node("code", entry.id),
      node(
        "p",
        (entry.authorMissing
          ? localeContext.t("common.unknownAuthor")
          : entry.author) +
          " · " +
          (entry.dateMissing ? localeContext.t("common.noDate") : entry.date),
        "ag-history__meta",
      ),
    );
    if (entry.description) details.append(node("p", entry.description));
    const relations = node("ul", undefined, "ag-history__relations");
    for (const edge of model.edges) {
      if (edge.from !== entry.id) continue;
      const target = model.nodes.find((n) => n.id === edge.to);
      const kind =
        edge.kind === "parent"
          ? localeContext.t("history.parent")
          : edge.kind === "dependency"
            ? edge.label
            : localeContext.t("history.previousEvent");
      relations.append(
        node(
          "li",
          `${kind}: ${edge.to}${target ? " · " + target.title : " · " + localeContext.t("history.outside")}${projection.nodes.some((n) => n.id === edge.to) ? "" : " · " + localeContext.t("history.hidden")}`,
        ),
      );
    }
    if (relations.childElementCount) details.append(relations);
    if (model.kind === "tasks" && onAction) {
      details.append(
        node(
          "p",
          "Изменения применяет приложение, которому принадлежит задача.",
          "ag-history__meta",
        ),
      );
      const button = node(
        "button",
        "Изменить статус задачи",
        "ag-history__action",
      );
      button.type = "button";
      details.append(button);
      if (restoreActionFocus) button.focus();
    }
  }
  /** Select by stable identity without recreating the focused row or toolbar. */
  function select(id, notify = false) {
    if (disposed) return;
    const entry = model.nodes.find((n) => n.id === id);
    if (!entry) throw new TypeError("Select a known history ID");
    selectedId = id;
    for (const [key, button] of rowNodes)
      button.setAttribute("aria-pressed", String(key === id));
    renderDetails();
    schedule();
    if (notify && onSelect) onSelect(structuredClone(entry));
  }
  /** Replace only list rows; search focus and current selection survive filtering. */
  function renderRows() {
    projection = projectHistory(model, search.value, filter.value);
    observer?.disconnect();
    observer?.observe(graph);
    list.replaceChildren();
    rowNodes = new Map();
    graph.style.setProperty(
      "--ag-history-gutter",
      `${28 + model.laneCount * 18}px`,
    );
    for (const entry of projection.nodes) {
      const li = node("li"),
        button = node("button", undefined, "ag-history__row"),
        copy = node("span", undefined, "ag-history__copy");
      button.type = "button";
      button.dataset.historyId = entry.id;
      button.id = prefix + "-row-" + rowNodes.size;
      button.setAttribute("aria-pressed", String(entry.id === selectedId));
      const refs = node("span", undefined, "ag-history__refs");
      for (const ref of entry.refs) refs.append(node("span", ref));
      copy.append(
        node("strong", entry.title),
        refs,
        node(
          "span",
          `${entry.authorMissing ? localeContext.t("common.unknownAuthor") : entry.author} · ${entry.dateMissing ? localeContext.t("common.noDate") : entry.date} · ${entry.id}`,
          "ag-history__meta",
        ),
      );
      const missing = projection.edges.filter(
        (e) => e.from === entry.id && e.boundary,
      ).length;
      if (missing)
        copy.append(
          node(
            "span",
            `${missing} связей вне видимой выборки`,
            "ag-history__boundary",
          ),
        );
      button.append(copy);
      li.append(button);
      list.append(li);
      rowNodes.set(entry.id, button);
      observer?.observe(button);
    }
    if (!projection.nodes.length)
      list.append(
        node(
          "li",
          "Записи не найдены. Измените поиск или дорожку.",
          "ag-history__empty",
        ),
      );
    count.textContent = `Показано ${projection.nodes.length} из ${model.nodes.length}${selectedId && !rowNodes.has(selectedId) ? " · выбранная запись скрыта фильтром" : ""}`;
    renderDetails();
    schedule();
  }
  details.addEventListener(
    "click",
    (event) => {
      if (!event.target.closest(".ag-history__action") || disposed) return;
      const entry = model.nodes.find((n) => n.id === selectedId);
      if (entry && onAction)
        onAction({
          taskId: entry.group,
          eventId: entry.id,
          action: "change-status",
        });
    },
    { signal: abort.signal },
  );
  search.addEventListener("input", renderRows, { signal: abort.signal });
  list.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest("button[data-history-id]");
      if (button && list.contains(button))
        select(button.dataset.historyId, true);
    },
    { signal: abort.signal },
  );
  list.addEventListener(
    "keydown",
    (event) => {
      if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      const buttons = Array.from(rowNodes.values()),
        at = buttons.indexOf(document.activeElement);
      if (at < 0) return;
      event.preventDefault();
      let next = at;
      if (event.key === "Home") next = 0;
      else if (event.key === "End") next = buttons.length - 1;
      else {
        const direction = event.key === "ArrowDown" ? 1 : -1;
        next = Math.max(0, Math.min(buttons.length - 1, at + direction));
      }
      buttons[next].focus();
    },
    { signal: abort.signal },
  );
  win.addEventListener("resize", schedule, { signal: abort.signal });
  /** Validate an entire snapshot first; task lane identities stay fixed for this mounted instance. */
  function setData(data) {
    if (disposed) return;
    const next = buildModel(data);
    if (
      next.groups.map((g) => g.id).join("|") !==
      model.groups.map((g) => g.id).join("|")
    )
      throw new TypeError("Remount to change task lane identities");
    const focused = document.activeElement?.dataset?.historyId;
    model = next;
    for (const group of model.groups) {
      const option = Array.from(filter.select.options).find(
        (item) => item.value === group.id,
      );
      option.textContent = (group.id + " · " + group.title).slice(0, 180);
    }
    if (!model.nodes.some((n) => n.id === selectedId))
      selectedId = model.nodes[0]?.id ?? null;
    renderRows();
    if (focused) (rowNodes.get(focused) ?? search).focus();
  }
  /** Disconnect every owned observer/listener/frame; late host updates become no-ops. */
  function dispose() {
    if (disposed) return;
    disposed = true;
    observer?.disconnect();
    abort.abort();
    filter.dispose();
    onSelect = undefined;
    onAction = undefined;
    if (frame !== null) win.cancelAnimationFrame?.(frame);
    frame = null;
  }
  renderRows();
  return {
    element,
    search,
    select,
    setData,
    dispose,
    get selectedId() {
      return selectedId;
    },
    refresh: schedule,
    /** Update only owned details on a provider change; user text and the graph snapshot remain intact. */
    refreshLocaleContent(context) {
      if (context === localeContext && element.lang === context.locale) return;
      localeContext = context;
      renderDetails();
    },
  };
}

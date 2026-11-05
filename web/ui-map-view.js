import {
  createBoardViewport,
  createSegmentedChoice,
  applyColorProfile,
} from "./vendor/ag-design/index.js";
import { captureUiSnapshot } from "./ui-map-capture.js";
import { createUiMapClient } from "./ui-map-client.js";
import {
  createUiMapInspector,
  mapElement,
  mapNodeLabel,
} from "./ui-map-inspector.js";

const PAGE_SIZE = 50,
  MAX_BYTES = 4 * 1024 * 1024;
let sequence = 0;

/** Make a local synthetic screen that is captured through the same explicit-root adapter as host content. */
function createDemo(document) {
  const el = (tag, attributes, text) =>
    mapElement(document, tag, attributes, text);
  const root = el("section", {
    class: "ui-map__demo",
    "aria-label": "Локальный пример формы",
  });
  const suffix = ++sequence;
  root.append(el("h3", {}, "Карточка контакта · локальный пример"));
  for (const [title, fields] of [
    ["Контакт", ["Имя", "Рабочая почта"]],
    ["Обращение", ["Тема", "Описание"]],
  ]) {
    const group = el("fieldset");
    group.append(el("legend", {}, title));
    for (const labelText of fields) {
      const id = `ui-map-demo-${suffix}-${root.childElementCount}-${group.childElementCount}`;
      const label = el("label", { for: id }, labelText);
      label.append(el("input", { id, type: "text", autocomplete: "off" }));
      group.append(label);
    }
    root.append(group);
  }
  root.append(
    el(
      "p",
      {},
      "Данные вымышленные. Снимок не содержит значений полей и не отправляет форму.",
    ),
  );
  root.append(
    el("button", { type: "button", class: "ag-button" }, "Сохранить черновик"),
  );
  return root;
}

/** Describe only the present ancestry; page-layout positions in semantic mode are deliberately abstract. */
function nodeDepth(node, parents) {
  let depth = 0,
    parent = node.parentId;
  const seen = new Set([node.id]);
  while (parent && parents.has(parent) && !seen.has(parent) && depth < 128) {
    seen.add(parent);
    depth++;
    parent = parents.get(parent);
  }
  return depth;
}

/** Render at most one paginated node batch; spatial positions use captured bounds without geometry inference. */
function drawScene({
  document,
  scene,
  nodes,
  parents,
  rootBounds,
  mode,
  selectedId,
  statuses,
  select,
}) {
  scene.replaceChildren();
  const positions = new Map();
  let width = 640,
    height = 320,
    omitted = 0;
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index],
      bounds = node.bounds;
    let box;
    if (mode === "spatial") {
      if (!bounds || !rootBounds) {
        omitted++;
        continue;
      }
      box = {
        x: bounds.x - rootBounds.x,
        y: bounds.y - rootBounds.y,
        width: bounds.width,
        height: bounds.height,
      };
      // Extremely large or negative captures remain inspectable in the list; never silently distort physical coordinates.
      if (
        box.x < 0 ||
        box.y < 0 ||
        box.width <= 0 ||
        box.height <= 0 ||
        box.x + box.width > 100000 ||
        box.y + box.height > 100000
      ) {
        omitted++;
        continue;
      }
    } else {
      box = {
        x: nodeDepth(node, parents) * 220 + 20,
        y: index * 62 + 20,
        width: 204,
        height: 46,
      };
    }
    positions.set(node.id, box);
    width = Math.max(width, box.x + box.width + 24);
    height = Math.max(height, box.y + box.height + 24);
    const button = mapElement(document, "button", {
      type: "button",
      class: "ui-map__mark",
      "data-node-id": node.id,
      "data-mode": mode,
      "aria-label": `${mapNodeLabel(node)} · ${node.kind}`,
      "aria-pressed": String(node.id === selectedId),
      "data-status": statuses.get(node.id) || "unknown",
    });
    const label = mapElement(
      document,
      "span",
      {},
      mode === "spatial" ? node.id : mapNodeLabel(node),
    );
    button.append(label);
    Object.assign(button.style, {
      left: `${box.x}px`,
      top: `${box.y}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
    });
    button.addEventListener("click", () => select(node.id, button));
    scene.append(button);
  }
  if (mode === "semantic") {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "ui-map__edges");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("aria-hidden", "true");
    for (const node of nodes) {
      const from = positions.get(node.parentId),
        to = positions.get(node.id);
      if (!from || !to) continue;
      const path = document.createElementNS(svg.namespaceURI, "path");
      path.setAttribute(
        "d",
        `M ${from.x + from.width} ${from.y + from.height / 2} H ${to.x - 10} V ${to.y + to.height / 2} H ${to.x}`,
      );
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "currentColor");
      path.setAttribute("stroke-width", "1");
      svg.append(path);
    }
    scene.prepend(svg);
  }
  scene.style.width = `${width}px`;
  scene.style.height = `${height}px`;
  return omitted;
}

/** Own one graph generation, bounded pages, node inspector and actual local capture; dispose before route replacement. */
export function createUiMapView({
  document = globalThis.document,
  client = createUiMapClient(),
  captureRoot = null,
  profiles = [],
  palette = "design",
  captureEnvironment = {},
  onSnapshotChange = () => {},
} = {}) {
  const view = document.defaultView;
  const el = (tag, attributes, text) =>
    mapElement(document, tag, attributes, text);
  const root = el("section", {
    class: "ui-map",
    "aria-label": "Карта интерфейса",
  });
  const lifetime = new view.AbortController(),
    listeners = { signal: lifetime.signal };
  let disposed = false,
    generation = 0,
    detailGeneration = 0,
    request = null,
    nodeRequest = null;
  let snapshot = null,
    metadata = null,
    page = null,
    selectedId = null,
    selectedFinding = null,
    nodeDetail = null;
  let findings = [],
    groups = [],
    findingNext = null,
    groupNext = null,
    findingOffset = 0,
    groupOffset = 0,
    mode = "spatial";
  let filter = "all",
    groupId = "",
    camera = null,
    lastTrigger = null,
    baselineId = null;
  const parents = new Map(),
    collapsed = new Set();
  const status = el(
    "p",
    { class: "ui-map__status", role: "status", "aria-live": "polite" },
    "Выберите локальный пример или импортируйте структурный JSON-снимок.",
  );
  const coverage = el("section", {
    class: "ui-map__coverage",
    "aria-label": "Покрытие и происхождение",
    hidden: "",
  });
  const toolbar = el("div", { class: "ui-map__toolbar" });
  const providerLabel = el("label", {}, "Провайдер группировки"),
    provider = el("select", { "aria-label": "Провайдер группировки" });
  for (const [value, label] of [
    ["hybrid", "Гибридный"],
    ["semantic", "Смысловой"],
    ["spatial", "Пространственный"],
  ])
    provider.append(el("option", { value }, label));
  providerLabel.append(provider);
  const appearanceLabel = el("label", {}, "Контраст карты"),
    appearance = el("select", { "aria-label": "Контраст карты" });
  appearance.append(
    el("option", { value: "standard" }, "Обычный"),
    el("option", { value: "increased" }, "Повышенный"),
  );
  appearanceLabel.append(appearance);
  const darkQuery = view.matchMedia?.("(prefers-color-scheme: dark)");
  const profile = profiles.find((item) => item.id === palette);
  let activeTheme = "unknown";
  /** Update only this map scope; host colours remain owned by the application. */
  function updateAppearance() {
    const declared = document.documentElement.dataset.theme;
    const theme =
      declared === "dark" || (declared !== "light" && darkQuery?.matches)
        ? "dark"
        : "light";
    activeTheme = theme;
    if (profile) applyColorProfile(root, profile, theme, appearance.value);
  }
  const themeObserver = new view.MutationObserver(updateAppearance);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  darkQuery?.addEventListener("change", updateAppearance);
  appearance.addEventListener("change", updateAppearance, listeners);
  updateAppearance();
  const scan = button("Снять локальный пример", () => capture());
  const rebuild = button("Построить заново", () => {
    if (snapshot) loadSnapshot(snapshot);
  });
  rebuild.disabled = true;
  const cancel = button("Отменить загрузку", () => cancelRequest());
  cancel.disabled = true;
  const rememberGraph = button("Запомнить граф", () => {
    if (metadata) {
      baselineId = metadata.graphId;
      comparison.hidden = false;
      comparison.textContent =
        "Граф запомнен. Снимите или импортируйте другое состояние для явного сравнения.";
      compareGraph.disabled = false;
    }
  });
  const compareGraph = button("Сравнить с запомненным", () =>
    inspectOperation("compare"),
  );
  const evaluateGraph = button("Оценить доступные свидетельства", () =>
    inspectOperation("evaluate"),
  );
  rememberGraph.disabled = true;
  compareGraph.disabled = true;
  evaluateGraph.disabled = true;
  const comparison = el("section", {
    class: "ui-map__coverage",
    "aria-label": "Сравнение и оценка",
    hidden: "",
  });
  toolbar.append(
    scan,
    rebuild,
    cancel,
    providerLabel,
    appearanceLabel,
    rememberGraph,
    compareGraph,
    evaluateGraph,
  );
  const source = el("details", { class: "ui-map__source", open: "" }),
    demo = captureRoot || createDemo(document);
  source.append(
    el(
      "summary",
      {},
      captureRoot
        ? "Явно выбранный локальный корень"
        : "Локальный пример для реального снимка",
    ),
  );
  if (!captureRoot) source.append(demo);
  const approvedLabel = el("label"),
    approvedText = el("input", { type: "checkbox" });
  approvedLabel.append(
    approvedText,
    document.createTextNode(
      " Сохранить подписи вымышленного примера (значения полей всегда исключены)",
    ),
  );
  if (captureRoot) approvedLabel.hidden = true;
  source.append(approvedLabel);
  const importArea = el("details", { class: "ui-map__import" }),
    json = el("textarea", {
      "aria-label": "JSON структурного снимка",
      spellcheck: "false",
      maxlength: String(MAX_BYTES),
    });
  importArea.append(
    el("summary", {}, "Импорт JSON · до 4 MiB"),
    el(
      "p",
      {},
      "Только данные снимка. HTML, скрипты, URL и изображения не исполняются и не загружаются.",
    ),
    json,
    button("Импортировать JSON", () => importJson()),
  );
  const file = el("input", {
    type: "file",
    accept: ".json,application/json",
    "aria-label": "Файл структурного JSON-снимка",
  });
  importArea.append(file);
  const modes = createSegmentedChoice({
    document,
    label: "Представление карты",
    options: [
      { value: "spatial", label: "Геометрия · CSS px" },
      { value: "semantic", label: "Смысловая иерархия" },
    ],
    value: mode,
    onChange(value) {
      mode = value;
      renderNodes();
    },
  });
  const description = el("p", { class: "ui-map__mode-description" });
  const filters = el("div", { class: "ui-map__filters" }),
    resultFilter = el("select", {
      "aria-label": "Замечания загруженной страницы",
    });
  for (const [value, label] of [
    ["all", "Все узлы страницы"],
    ["fail", "С нарушениями"],
    ["unknown", "С неизвестными проверками"],
    ["advisory", "С рекомендациями"],
  ])
    resultFilter.append(el("option", { value }, label));
  const filterLabel = el("label", {}, "Фильтр загруженной страницы");
  filterLabel.append(resultFilter);
  const groupSelect = el("select", { "aria-label": "Группа узлов страницы" }),
    groupLabel = el("label", {}, "Группа");
  groupLabel.append(groupSelect);
  filters.append(filterLabel, groupLabel);
  const workspace = el("div", { class: "ui-map__workspace" }),
    main = el("div", { class: "ui-map__main" });
  const viewport = el("div", {
      class: "ui-map__viewport",
      "aria-label": "Карта текущей страницы узлов",
    }),
    scene = el("div", { class: "ui-map__scene" });
  viewport.append(scene);
  const sceneNote = el("p", {}),
    list = el("ol", {
      class: "ui-map__list",
      "aria-label": "Доступный список узлов карты",
    });
  const nodePager = el("div", { class: "ui-map__pager" }),
    previous = button("Предыдущие узлы", () =>
      changePage(Math.max(0, page.offset - PAGE_SIZE)),
    ),
    next = button("Следующие узлы", () => changePage(page.nextOffset));
  const pageLabel = el("span");
  nodePager.append(previous, pageLabel, next);
  const findingSection = el("section", { "aria-label": "Замечания карты" }),
    findingList = el("ol", { class: "ui-map__finding-list" }),
    findingPager = el("div", { class: "ui-map__pager" });
  const findingPreviousButton = button("Предыдущие замечания", () =>
    changeCollection("findings", Math.max(0, findingOffset - PAGE_SIZE)),
  );
  findingPreviousButton.disabled = true;
  const groupPreviousButton = button("Предыдущие группы", () =>
    changeCollection("groups", Math.max(0, groupOffset - PAGE_SIZE)),
  );
  groupPreviousButton.disabled = true;
  const findingNextButton = button("Следующие замечания", () =>
    changeCollection("findings", findingNext),
  );
  const groupSection = el("section", { "aria-label": "Группы карты" }),
    groupList = el("div"),
    groupNextButton = button("Следующие группы", () =>
      changeCollection("groups", groupNext),
    );
  findingNextButton.disabled = true;
  groupNextButton.disabled = true;
  previous.disabled = true;
  next.disabled = true;
  findingSection.append(
    el("h3", {}, "Замечания · факты и неизвестные проверки"),
    findingList,
    findingPager,
  );
  findingPager.append(findingPreviousButton, findingNextButton);
  groupSection.append(
    el("h3", {}, "Группы · явные и предположенные"),
    groupList,
    groupPreviousButton,
    groupNextButton,
  );
  main.append(
    modes.element,
    description,
    filters,
    viewport,
    sceneNote,
    el("h3", {}, "Узлы текущей страницы"),
    list,
    nodePager,
    groupSection,
    findingSection,
  );
  const inspector = createUiMapInspector({
    document,
    onSelectNode: selectNode,
    onSelectFinding: selectFinding,
    returnTarget: () =>
      [...list.querySelectorAll("[data-node-id]")].find(
        (control) => control.dataset.nodeId === selectedId,
      ) || scan,
  });
  workspace.append(main, inspector.element);
  root.append(
    toolbar,
    status,
    source,
    importArea,
    coverage,
    comparison,
    workspace,
  );
  resultFilter.addEventListener(
    "change",
    () => {
      filter = resultFilter.value;
      renderNodes();
    },
    listeners,
  );
  groupSelect.addEventListener(
    "change",
    () => {
      groupId = groupSelect.value;
      renderNodes();
    },
    listeners,
  );
  file.addEventListener(
    "change",
    async () => {
      const chosen = file.files?.[0];
      if (!chosen) return;
      if (chosen.size > MAX_BYTES) {
        status.textContent = "Файл превышает 4 MiB. Текущая карта сохранена.";
        return;
      }
      const ticket = generation;
      const text = await chosen.text().catch(() => null);
      if (disposed || ticket !== generation) return;
      if (text === null) {
        status.textContent = "Не удалось прочитать локальный файл.";
        return;
      }
      json.value = text;
      importJson();
    },
    listeners,
  );
  renderNodes();

  /** Named local controls share lifecycle cleanup; no callback survives disposal. */
  function button(label, action) {
    const control = el(
      "button",
      { type: "button", class: "ag-button ag-button--quiet" },
      label,
    );
    control.addEventListener("click", () => {
      if (!disposed) action();
    });
    return control;
  }
  /** Reset only the map generation; a rejected import cannot keep a stale graph looking current. */
  function clearMap() {
    camera?.dispose();
    camera = null;
    inspector.hide({ returnFocus: false });
    metadata = null;
    page = null;
    selectedId = null;
    selectedFinding = null;
    nodeDetail = null;
    findings = [];
    groups = [];
    parents.clear();
    collapsed.clear();
    groupId = "";
    groupSelect.replaceChildren();
    comparison.hidden = true;
    comparison.replaceChildren();
    rememberGraph.disabled = true;
    evaluateGraph.disabled = true;
    compareGraph.disabled = true;
    findingNextButton.disabled = true;
    findingPreviousButton.disabled = true;
    groupPreviousButton.disabled = true;
    groupNextButton.disabled = true;
    coverage.hidden = true;
    scene.replaceChildren();
    list.replaceChildren();
    findingList.replaceChildren();
    groupList.replaceChildren();
    renderNodes();
  }
  /** Abort owned network/capture work; tokens also fence clients that do not honour AbortSignal. */
  function cancelRequest() {
    generation++;
    detailGeneration++;
    request?.abort();
    nodeRequest?.abort();
    request = null;
    nodeRequest = null;
    setBusy(false);
    if (!disposed)
      status.textContent = "Загрузка отменена; поздний ответ не заменит карту.";
  }
  /** Expose loading separately from empty/unsupported; actions cannot create duplicate in-flight maps. */
  function setBusy(value) {
    root.setAttribute("aria-busy", String(value));
    rememberGraph.disabled = value || !metadata;
    evaluateGraph.disabled =
      value || !metadata || typeof client.evaluate !== "function";
    compareGraph.disabled =
      value || !metadata || !baselineId || typeof client.compare !== "function";
    cancel.disabled = !value;
    scan.disabled = value;
    rebuild.disabled = value || !snapshot;
  }
  /** Every first request replaces the previous page generation explicitly, never as a continuation retry. */
  function begin(message) {
    request?.abort();
    nodeRequest?.abort();
    detailGeneration++;
    request = new view.AbortController();
    const ticket = ++generation;
    setBusy(true);
    status.textContent = message;
    return { ticket, signal: request.signal };
  }
  /** One safe error message preserves expiry/conflict identity without echoing private JSON or DOM content. */
  function failed(cause, ticket) {
    if (disposed || ticket !== generation) return;
    if (
      [
        "graph_not_found",
        "snapshot_not_found",
        "policy_mismatch",
        "graph_mismatch",
      ].includes(cause.code)
    ) {
      clearMap();
      baselineId = null;
      status.textContent =
        "Карта устарела или удалена из кэша. Нажмите «Построить заново» для нового поколения.";
    } else if (cause.code === "cancelled" || cause.name === "AbortError")
      status.textContent = "Загрузка отменена.";
    else
      status.textContent =
        "Не удалось загрузить карту. Проверьте формат снимка и локальный сервис; повторите явно.";
  }
  /** Capture never clicks, focuses, submits or scrolls the supplied root. */
  async function capture() {
    const run = begin("Снимаем явный локальный корень…");
    try {
      const value = await captureUiSnapshot(demo, {
        signal: run.signal,
        // A fixture may declare its text scale; browser/OS zoom remains unknown unless explicitly supplied by its owner.
        environment: {
          ...captureEnvironment,
          theme: activeTheme,
          contrast: appearance.value,
        },
        privacyMode:
          !captureRoot && approvedText.checked ? "approved-text" : "structural",
        source: {
          artifactId: "ui-map-local-demo",
          scenarioId: "contact-draft",
          stateId: "initial",
        },
      });
      if (disposed || run.ticket !== generation) return;
      await loadSnapshot(value);
    } catch (cause) {
      failed(cause, run.ticket);
    } finally {
      if (!disposed && run.ticket === generation) setBusy(false);
    }
  }
  /** Count UTF-8 bytes before JSON parsing; input stays data and is server-validated before display. */
  async function importJson() {
    if (new TextEncoder().encode(json.value).byteLength > MAX_BYTES) {
      status.textContent = "JSON превышает 4 MiB.";
      return;
    }
    let value;
    try {
      value = JSON.parse(json.value);
    } catch {
      status.textContent =
        "Некорректный JSON. Исправьте синтаксис; содержимое не исполнялось.";
      return;
    }
    await loadSnapshot(value);
  }
  /** Validate through the local service before retaining scope/parent metadata or drawing imported nodes. */
  async function loadSnapshot(value) {
    if (disposed) return;
    onSnapshotChange();
    const run = begin("Проверяем снимок и строим карту…");
    clearMap();
    try {
      const imported = await client.importSnapshot(value, {
        signal: run.signal,
      });
      if (disposed || run.ticket !== generation) return;
      snapshot = JSON.parse(JSON.stringify(value));
      const first = await client.map(
        {
          snapshotId: imported.snapshotId,
          provider: provider.value,
          collection: "nodes",
          offset: 0,
          limit: PAGE_SIZE,
        },
        { signal: run.signal },
      );
      if (disposed || run.ticket !== generation) return;
      const [groupPage, findingPage] = await Promise.all([
        client.map(
          {
            graphId: first.graphId,
            collection: "groups",
            offset: 0,
            limit: PAGE_SIZE,
          },
          { signal: run.signal },
        ),
        client.map(
          {
            graphId: first.graphId,
            collection: "findings",
            offset: 0,
            limit: PAGE_SIZE,
          },
          { signal: run.signal },
        ),
      ]);
      if (disposed || run.ticket !== generation) return;
      if (
        groupPage.graphId !== first.graphId ||
        findingPage.graphId !== first.graphId
      )
        throw Object.assign(new Error("Graph mismatch"), {
          code: "graph_mismatch",
        });
      metadata = first;
      page = first;
      findings = findingPage.items;
      findingNext = findingPage.nextOffset;
      findingOffset = findingPage.offset;
      groupOffset = groupPage.offset;
      groups = groupPage.items;
      groupNext = groupPage.nextOffset;
      for (const node of snapshot.nodes) parents.set(node.id, node.parentId);
      renderCoverage();
      renderGroups();
      renderFindings();
      renderNodes();
      status.textContent = `Карта построена: ${page.total} узлов. Показана одна страница; покрытие и неизвестные проверки указаны отдельно.`;
      return true;
    } catch (cause) {
      failed(cause, run.ticket);
      return false;
    } finally {
      if (!disposed && run.ticket === generation) setBusy(false);
    }
  }
  /** Pin every continuation to the first immutable graphId; never rebuild or mix collections after eviction. */
  async function changePage(offset) {
    if (!metadata || offset === null || disposed) return;
    const id = metadata.graphId,
      run = begin("Загружаем страницу узлов…");
    try {
      const result = await client.map(
        { graphId: id, collection: "nodes", offset, limit: PAGE_SIZE },
        { signal: run.signal },
      );
      if (disposed || run.ticket !== generation) return;
      if (result.graphId !== id)
        throw Object.assign(new Error("Graph mismatch"), {
          code: "graph_mismatch",
        });
      page = result;
      renderNodes();
      status.textContent =
        "Страница узлов загружена. Выбор сохраняется между представлениями.";
    } catch (cause) {
      failed(cause, run.ticket);
    } finally {
      if (!disposed && run.ticket === generation) setBusy(false);
    }
  }
  /** Findings/groups are independently paginated, not silently claimed to cover an entire graph. */
  async function changeCollection(collection, offset) {
    if (!metadata || offset === null || disposed) return;
    const id = metadata.graphId,
      run = begin("Загружаем следующую страницу…");
    try {
      const result = await client.map(
        { graphId: id, collection, offset, limit: PAGE_SIZE },
        { signal: run.signal },
      );
      if (disposed || run.ticket !== generation) return;
      if (result.graphId !== id)
        throw Object.assign(new Error("Graph mismatch"), {
          code: "graph_mismatch",
        });
      if (collection === "groups") {
        groups = result.items;
        groupOffset = result.offset;
        groupNext = result.nextOffset;
        renderGroups();
      } else {
        findings = result.items;
        findingOffset = result.offset;
        findingNext = result.nextOffset;
        renderFindings();
      }
      renderNodes();
      status.textContent = "Показана следующая страница выбранной коллекции.";
    } catch (cause) {
      failed(cause, run.ticket);
    } finally {
      if (!disposed && run.ticket === generation) setBusy(false);
    }
  }
  /** Show current server evaluation or explicit comparability; UI never recomputes scores or promotes unknown evidence. */
  async function inspectOperation(operation) {
    if (!metadata || disposed || (operation === "compare" && !baselineId))
      return;
    const current = metadata.graphId,
      before = baselineId,
      run = begin("Запрашиваем свидетельства текущего графа…");
    try {
      const result =
        operation === "compare"
          ? await client.compare(
              { beforeId: before, afterId: current },
              { signal: run.signal },
            )
          : await client.evaluate({ graphId: current }, { signal: run.signal });
      if (disposed || run.ticket !== generation) return;
      const mismatch =
        operation === "compare"
          ? result.beforeId !== before || result.afterId !== current
          : result.graphId !== current;
      if (mismatch)
        throw Object.assign(new Error("Graph mismatch"), {
          code: "graph_mismatch",
        });
      comparison.hidden = false;
      if (operation === "compare") {
        comparison.replaceChildren(
          el(
            "h3",
            {},
            result.comparable
              ? "Состояния сопоставимы"
              : "Состояния несопоставимы",
          ),
          el(
            "p",
            {},
            `Причины: ${result.reasons.join(", ") || "нет сообщённых"}. Совпадений: ${result.matchCount}; изменений: ${result.changeCount}. Улучшение оценки не установлено.`,
          ),
          el("p", {}, `Ограничения: ${JSON.stringify(result.limitations)}`),
        );
      } else {
        comparison.replaceChildren(
          el("h3", {}, "Оценка по доступным свидетельствам"),
          el(
            "p",
            {},
            `Решение: ${result.evaluation.decision}; критический gate: ${JSON.stringify(result.evaluation.criticalGate)}. Score: ${result.evaluation.score}; покрытие: ${JSON.stringify(result.evaluation.coverage)}.`,
          ),
          el(
            "p",
            {},
            `Требуют ручного сценария: ${result.manualRequired.join(", ")}. Это не сертификация WCAG или AT.`,
          ),
          el("p", {}, `Политика: ${result.policyHash}`),
        );
      }
      status.textContent =
        "Получены серверные свидетельства без изменения исходных фактов.";
    } catch (cause) {
      failed(cause, run.ticket);
    } finally {
      if (!disposed && run.ticket === generation) setBusy(false);
    }
  }
  /** Loading an inspector is independent of scene positioning and has its own stale-response guard. */
  async function selectNode(id, trigger = null) {
    if (!metadata || disposed) return;
    lastTrigger = trigger || lastTrigger;
    selectedId = id;
    const ticket = ++detailGeneration,
      graph = metadata.graphId,
      mapTicket = generation;
    nodeRequest?.abort();
    nodeRequest = new view.AbortController();
    updateSelection();
    try {
      const detail = await client.node(
        { graphId: graph, nodeId: id },
        { signal: nodeRequest.signal },
      );
      if (disposed || ticket !== detailGeneration || mapTicket !== generation)
        return;
      if (detail.graphId !== graph)
        throw Object.assign(new Error("Graph mismatch"), {
          code: "graph_mismatch",
        });
      nodeDetail = detail;
      showInspector();
    } catch (cause) {
      if (disposed || ticket !== detailGeneration || mapTicket !== generation)
        return;
      failed(cause, mapTicket);
    }
  }
  /** Finding selection keeps its target and explanation consistent in both modes. */
  function selectFinding(id, trigger = null) {
    const finding = findings.find((item) => item.id === id);
    if (!finding) {
      status.textContent =
        "Замечание не входит в загруженную страницу. Откройте нужную страницу замечаний.";
      return;
    }
    selectedFinding = finding;
    if (finding.nodeIds?.length) selectNode(finding.nodeIds[0], trigger);
    else
      status.textContent = `${finding.severity} / ${finding.status}: ${finding.summary}`;
  }
  /** Keep every visible mark/list row synchronized without replacing the currently focused DOM control. */
  function updateSelection() {
    for (const button of root.querySelectorAll("[data-node-id]"))
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.nodeId === selectedId),
      );
  }
  /** Inspector only renders bounded validated local data; imported URLs remain inert text. */
  function showInspector() {
    if (!nodeDetail || !metadata) return;
    const related = findings.filter((item) =>
      item.nodeIds.includes(nodeDetail.node.id),
    );
    inspector.show(
      {
        detail: nodeDetail,
        findings: related,
        finding: selectedFinding?.nodeIds?.includes(nodeDetail.node.id)
          ? selectedFinding
          : null,
        metadata,
        source: snapshot.source,
      },
      lastTrigger,
    );
  }
  /** Coverage is always visible with full identity in text, not an optimistic score or screenshot placeholder. */
  function renderCoverage() {
    coverage.hidden = false;
    const value = metadata.coverage;
    coverage.replaceChildren(
      el("h3", {}, `Покрытие: ${value.status}`),
      el(
        "p",
        {},
        `Источник ${snapshot.source.kind} · caller-reported · ${snapshot.privacy.mode}. Снимок без изображения — нормальный структурный режим.`,
      ),
      el(
        "p",
        {},
        `Проверено: ${value.inspected}; пропущено: ${value.omitted ?? "неизвестно"}. Причины: ${value.reasons.join(", ") || "нет сообщённых"}. Неподдержанное: ${value.unsupported.join(", ") || "нет сообщённого"}.`,
      ),
      el(
        "p",
        {},
        `Провайдер ${metadata.provider}; метод ${metadata.methodVersion}. Группировка предположительная, не сертификат доступности.`,
      ),
    );
    const hashes = el("details");
    hashes.append(
      el("summary", {}, "Идентичность и окружение"),
      el("p", {}, `graphId ${metadata.graphId}`),
      el("p", {}, `snapshotHash ${metadata.snapshotHash}`),
      el("p", {}, `policyHash ${metadata.policyHash}`),
      el("p", {}, `parameterHash ${metadata.parameterHash}`),
      el("p", {}, JSON.stringify(snapshot.environment)),
    );
    coverage.append(hashes);
  }
  /** Separate explicit/inferred group membership; collapsing never rewrites captured containment. */
  function renderGroups() {
    groupList.replaceChildren();
    groupSelect.replaceChildren(
      el("option", { value: "" }, "Все группы страницы"),
    );
    for (const group of groups) {
      groupSelect.append(
        el(
          "option",
          { value: group.id },
          `${group.kind} · ${group.memberIds[0] || "группа"} · ${group.memberIds.length} узлов · ${group.id.slice(0, 8)}…`,
        ),
      );
      const disclosure = el("details", { class: "ui-map__group" });
      if (!collapsed.has(group.id)) disclosure.open = true;
      disclosure.append(
        el(
          "summary",
          {},
          `${group.kind} · ${group.memberIds[0] || "группа"} · ${group.memberIds.length} узлов · ${group.id.slice(0, 8)}… · confidence ${group.confidence}`,
        ),
        el(
          "p",
          {},
          `Источник: ${group.source}. Первые участники: ${group.memberIds.slice(0, 20).join(", ")}. Ещё: ${Math.max(0, group.memberIds.length - 20)}; полный состав используется фильтром.`,
        ),
      );
      disclosure.addEventListener("toggle", () => {
        const changed = disclosure.open === collapsed.has(group.id);
        if (!changed || disposed) return;
        if (disclosure.open) collapsed.delete(group.id);
        else collapsed.add(group.id);
        renderNodes();
      });
      groupList.append(disclosure);
    }
    groupSelect.value = groups.some((item) => item.id === groupId)
      ? groupId
      : "";
    groupId = groupSelect.value;
    groupPreviousButton.disabled = groupOffset === 0 || !metadata;
    groupNextButton.disabled = groupNext === null || !metadata;
    if (!groups.length)
      groupList.append(
        el(
          "p",
          {},
          "На этой странице нет групп; это не доказывает отсутствие групп за её пределами.",
        ),
      );
  }
  /** Visible statuses are textual and scoped to the loaded findings page, never inferred pass for all other nodes. */
  function renderFindings() {
    findingList.replaceChildren();
    findingPreviousButton.disabled = findingOffset === 0 || !metadata;
    findingNextButton.disabled = findingNext === null || !metadata;
    for (const finding of findings) {
      const row = el("li"),
        control = button(
          `${finding.severity} / ${finding.status} · ${finding.summary}`,
          () => selectFinding(finding.id, control),
        );
      row.append(control);
      findingList.append(row);
    }
    if (!findings.length)
      findingList.append(
        el(
          "li",
          {},
          "Нет замечаний на этой странице. Непроверенные сценарии остаются неизвестными.",
        ),
      );
  }
  /** Only one bounded page is mounted: pagination preserves browser Find/focus without wrapping an already-bounded list in render-window. */
  function renderNodes() {
    camera?.dispose();
    camera = null;
    scene.replaceChildren();
    list.replaceChildren();
    description.textContent =
      mode === "spatial"
        ? "Реальная геометрия в CSS px: из viewport-координат вычтено положение выбранного корня. Масштаб доски — только способ просмотра; контуры AABB не являются ink/hit bounds."
        : "Абстрактная смысловая иерархия по parentId. Положение и расстояния карточек не являются измерениями страницы. Линии показывают только подтверждённое вложение узлов текущей страницы.";
    previous.disabled = !page || page.offset === 0;
    next.disabled = !page || page.nextOffset === null;
    if (!page) {
      pageLabel.textContent = "Нет карты";
      sceneNote.textContent = "Карта появится после явного снимка или импорта.";
      return;
    }
    const statuses = new Map();
    for (const finding of findings)
      for (const id of finding.nodeIds)
        if (statuses.get(id) !== "fail") statuses.set(id, finding.status);
    const group = groups.find((item) => item.id === groupId),
      hidden = new Set();
    for (const item of groups)
      if (collapsed.has(item.id))
        for (const id of item.memberIds) hidden.add(id);
    const nodes = page.items.filter(
      (node) =>
        !hidden.has(node.id) &&
        (!group || group.memberIds.includes(node.id)) &&
        (filter === "all" || statuses.get(node.id) === filter),
    );
    pageLabel.textContent = `${page.offset + (page.items.length ? 1 : 0)}–${page.offset + page.items.length} из ${page.total}; фильтр: ${nodes.length} узлов`;
    list.start = page.offset + 1;
    for (const node of nodes) {
      const row = el("li"),
        branch = el(
          "span",
          { class: "ui-map__branch" },
          `Уровень ${nodeDepth(node, parents)} · ${node.parentId ? `родитель ${node.parentId}` : "корень"}`,
        );
      const control = button(
        `${mapNodeLabel(node)} · ${node.kind} · ${statuses.get(node.id) || "проверки неизвестны"}`,
        () => selectNode(node.id, control),
      );
      control.dataset.nodeId = node.id;
      control.setAttribute("aria-pressed", String(node.id === selectedId));
      row.append(branch, control);
      list.append(row);
    }
    if (!nodes.length)
      list.append(
        el(
          "li",
          {},
          "Нет узлов по фильтру текущей страницы. Снимите фильтр или откройте другую страницу.",
        ),
      );
    const rootNode = snapshot?.nodes.find(
      (node) => node.id === snapshot.scope.rootId,
    );
    const omitted = drawScene({
      document,
      scene,
      nodes,
      parents,
      rootBounds: rootNode?.bounds,
      mode,
      selectedId,
      statuses,
      select: selectNode,
    });
    sceneNote.textContent = `На доске не более ${PAGE_SIZE} узлов текущей страницы. Без подходящей геометрии: ${omitted}; они остаются доступны в списке. Подписи и значения измерений доступны в деталях.`;
    camera = createBoardViewport({
      viewport,
      scene,
      initialState: { x: 12, y: 12, scale: 1, pattern: "none" },
    });
  }
  return {
    element: root,
    loadSnapshot,
    /** Invalidate every async generation and release camera listeners/RAF and all retained snapshot data. */
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelRequest();
      lifetime.abort();
      themeObserver.disconnect();
      darkQuery?.removeEventListener("change", updateAppearance);
      modes.dispose();
      inspector.dispose();
      camera?.dispose();
      camera = null;
      snapshot = null;
      metadata = null;
      page = null;
      nodeDetail = null;
      selectedFinding = null;
      findings = [];
      groups = [];
      parents.clear();
      collapsed.clear();
      baselineId = null;
      lastTrigger = null;
      json.value = "";
      file.value = "";
      // Release owned text/row subtrees even if a consumer retains the disposed controller.
      for (const owned of [
        scene,
        list,
        groupList,
        findingList,
        coverage,
        comparison,
      ])
        owned.replaceChildren();
      if (!captureRoot) demo.replaceChildren();
      root.replaceChildren();
    },
  };
}

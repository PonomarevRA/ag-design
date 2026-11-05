import { createWorkbenchPanels, fitWorkbenchViewport } from "./workbench-panels.js";
import { createLayoutGridController } from "./layout-grid-controller.js";
import { createGoldenCanonPanel } from "./golden-canon-panel.js";
import { createCompositionTree } from "./composition-tree.js";
import { createCompositionProperties } from "./composition-properties.js";
import { createCompositionPreview } from "./composition-preview.js";
import {
  createButton,
  createBoardViewport,
  createDropdownSelect,
} from "./vendor/ag-design/index.js";
import { h } from "./dom.js";
import { mapElement } from "./ui-map-inspector.js";
import { componentFields, defaultProps } from "./sandbox-components.js";
import { createCompositionClient } from "./composition-client.js";
import {
  ancestry,
  hierarchy,
  pairGeometry,
  siblingGaps,
  semanticPositions,
} from "./composition-geometry.js";

const id = (prefix) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`;
const numberText = (value) =>
  Number.isFinite(value) ? `${Math.round(value * 100) / 100}` : "unknown";

/** Make an explicit composition baseline. Its required node set is fixed on the server after preparation. */
export function initialComposition(components) {
  const button = components.find((item) => item.id === "button");
  const nodes = [
    {
      id: "group",
      parentId: null,
      kind: "frame",
      title: "Группа действий",
      component: null,
      props: {},
      layout: {
        mode: "row",
        x: 24,
        y: 24,
        width: 560,
        height: "hug",
        gap: 16,
        padding: 16,
        align: "center",
      },
    },
  ];
  if (button)
    for (let index = 0; index < 2; index++)
      nodes.push({
        id: `action-${index + 1}`,
        parentId: "group",
        kind: "component",
        title: index ? "Вторичное действие" : "Основное действие",
        component: "button",
        props: {
          ...defaultProps("button"),
          label: index ? "Отмена" : "Сохранить",
          variant: index ? "secondary" : "primary",
        },
        layout: { mode: "free", width: "hug", height: "hug" },
      });
  const constraints = [
    {
      id: "required-content",
      type: "required",
      nodeIds: nodes.map((node) => node.id),
      required: true,
    },
  ];
  if (button)
    constraints.push(
      {
        id: "button-heights",
        type: "equal-height",
        nodeIds: ["action-1", "action-2"],
        tolerance: 1,
        required: true,
      },
      {
        id: "button-centers",
        type: "align",
        nodeIds: ["action-1", "action-2"],
        axis: "middle",
        tolerance: 1,
        required: true,
      },
    );
  const componentPins = {};
  for (const definition of components)
    if (nodes.some((node) => node.component === definition.id)) {
      if (/^[a-f0-9]{64}$/.test(definition.artifactHash || ""))
        componentPins[definition.id] = {
          version: definition.version,
          artifactHash: definition.artifactHash,
        };
    }
  return {
    version: 2,
    title: "Проверяемая композиция",
    viewport: { width: 960, height: 640, direction: "ltr", textScale: 1 },
    nodes,
    constraints,
    componentPins,
    scenarios: [],
  };
}

/** Server-backed editor: durable commands share one revision; selection, camera and measured facts remain transient. */
export function createCompositionEditor({
  components,
  profiles,
  palette = "design",
  legacyDocument,
  assessmentHost,
  client,
  storage,
} = {}) {
  if (storage === undefined) {
    try {
      storage = globalThis.localStorage;
    } catch {
      /* Server persistence works without a local pointer. */
    }
  }
  const controller = new AbortController(),
    signal = controller.signal;
  client ||= createCompositionClient({ signal });
  const root = h("section", {
    className: "composition-editor",
    "aria-label": "Редактор проверяемых композиций",
  });
  const status = h("p", {
    className: "composition-status",
    role: "status",
    "aria-live": "polite",
  });
  const tree = h("nav", {
    className: "composition-tree",
    "aria-label": "Вложенность объектов",
  });
  const treeView = createCompositionTree({
    document: root.ownerDocument,
    onSelect: (id) => select(id, { revealSelection: false }),
  });
  tree.append(h("h3", {}, "Объекты"), treeView.element);
  const inspector = h("aside", {
    className: "composition-inspector",
    "aria-label": "Свойства и измерения",
  });
  const crumbs = h("nav", {
    className: "composition-crumbs",
    "aria-label": "Родители выбранного объекта",
  });
  const frame = h("iframe", {
    className: "composition-frame",
    title: "Реальный интерфейс композиции",
  });
  const overlay = h("div", {
    className: "composition-overlay",
    "aria-hidden": "true",
  });
  const stage = h("div", { className: "composition-stage" }, frame, overlay);
  const frameScroll = h(
    "div",
    { className: "composition-frame-scroll" },
    stage,
  );
  const graphScene = h("div", { className: "composition-graph-scene" });
  const graphViewport = h(
    "div",
    { className: "composition-graph", "aria-label": "Карта композиции" },
    graphScene,
  );
  const reports = h("section", {
    className: "composition-reports",
    "aria-label": "Проверки композиции",
  });
  const channel = id("frame"),
    authorId = id("human"),
    operationId = () => id("change");
  let state = null,
    selectedId = null,
    compareId = null,
    facts = null,
    lastReport = null,
    previousReport = null,
    propertiesController = null;
  let busy = false,
    disposed = false,
    frameReady = false,
    pollTimer = null,
    measurementSequence = 0,
    commandGeneration = 0;
  const measurements = new Map();
  const pendingMeasurements = new Map();
  const pendingSnapshots = new Map();
  const lockedControls = new Map();
  let resolveFrameReady;
  const frameReadiness = new Promise((resolve) => {
    resolveFrameReady = resolve;
  });
  /** Retain only public artifact identity; document props and private field values are not context events. */
  function context() {
    return !disposed && state
      ? {
          kind: "composition",
          documentId: state.documentId,
          revision: state.revision,
          documentHash: state.documentHash,
          scenarioId: scenario.value || "default",
        }
      : null;
  }
  /** Reject pending map exports before switching artifact/scenario or disposing the editor. */
  function cancelSnapshots(message) {
    for (const pending of pendingSnapshots.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error(message));
    }
    pendingSnapshots.clear();
  }
  const button = (label, onClick, variant = "quiet") =>
    createButton({ label, variant, onClick });
  const notify = (message) => {
    if (!disposed) status.textContent = message;
  };
  // The public searchable picker owns popup placement, keyboard/IME and disposal.
  const componentPicker = createDropdownSelect({
    label: "Компонент для добавления",
    searchable: true,
    options: components.map((item) => ({ value: item.id, label: item.name })),
  });
  const picker = componentPicker.select;
  const view = h(
    "select",
    { "aria-label": "Представление композиции" },
    h("option", { value: "interface" }, "Реальный интерфейс"),
    h("option", { value: "spatial" }, "Карта: реальная геометрия"),
    h("option", { value: "semantic" }, "Карта: иерархия"),
  );
  const editingMode = h(
    "select",
    { "aria-label": "Режим работы с интерфейсом" },
    h("option", { value: "edit" }, "Редактирование"),
    h("option", { value: "preview" }, "Просмотр"),
  );
  const scenario = h("select", { "aria-label": "Сценарий измерения" });
  const previewScale = h(
    "select",
    { "aria-label": "Масштаб предпросмотра" },
    h("option", { value: "fit" }, "Вписать"),
    h("option", { value: "width" }, "По ширине"),
    ...[50, 75, 100, 150].map((value) =>
      h("option", { value: String(value) }, `${value}%`),
    ),
  );
  const previewInfo = h("output", {
    className: "composition-preview-info",
    "aria-label": "Фактический масштаб предпросмотра",
  });
  const overlayToggle = h("input", {
    type: "checkbox",
    checked: false,
    "aria-label": "Границы выбранной группы",
  });
  /** Visible labels separate the preview camera from the measured environment. */
  const controlLabel = (title, control) =>
    h("label", {}, h("span", {}, title), control);
  const toolbar = h(
    "div",
    {
      className: "composition-toolbar composition-toolbar--primary",
      role: "group",
      "aria-label": "Проверка и предпросмотр",
    },
    h(
      "div",
      { className: "composition-actions" },
      button("Выбрать компонент", () => {
        panels.open("objects");
        componentPicker.input.focus();
        componentPicker.open();
      }),
      button("Новый экран", () =>
        prepare({
          version: 2,
          title: "Новый экран",
          viewport: {
            ...(state?.document.viewport ||
              initialComposition(components).viewport),
          },
          nodes: [],
          constraints: [],
          componentPins: {},
          scenarios: [],
        }),
      ),
      button("Проверить композицию", runChecks, "primary"),
      button("Отменить мою правку", undo),
    ),
    h(
      "div",
      { className: "composition-preview-controls" },
      controlLabel("Режим", editingMode),
      controlLabel("Представление", view),
      controlLabel("Масштаб просмотра", previewScale),
      h("label", { className: "composition-toggle" }, overlayToggle, "Границы"),
      previewInfo,
    ),
  );
  const documentIdInput = h("input", {
    type: "text",
    "aria-label": "ID документа композиции",
    placeholder: "ID документа от MCP",
    maxlength: 100,
  });
  const insertionMode = h(
    "select",
    { "aria-label": "Размещение компонента" },
    h("option", { value: "sample" }, "Отдельный образец"),
    h("option", { value: "group" }, "В выбранную группу"),
  );
  const addBar = h(
    "fieldset",
    { className: "composition-tool-group" },
    h("legend", {}, "Добавить в композицию"),
    h(
      "div",
      { className: "composition-toolbar" },
      componentPicker.element,
      controlLabel("Размещение", insertionMode),
      button("Добавить компонент", () => addComponent(picker.value)),
      button("Добавить контейнер", addFrame),
      button("Создать форму", addForm),
    ),
    h(
      "p",
      { className: "composition-note" },
      "Отдельный образец проверяется сам по себе. Для общей формы выберите контейнер и размещение «В выбранную группу».",
    ),
  );
  const editingHint = h(
    "p",
    { className: "composition-note composition-editing-hint" },
    "Редактирование: тяните элемент или ручку ⠿; размер — за края. В строке/столбце перенос меняет порядок. Alt — без сетки. В режиме «Просмотр» работают поля и кнопки.",
  );
  addBar.append(
    h("details", {}, h("summary", {}, "Как редактировать"), editingHint),
  );
  const viewportControls = h("div", {
    className: "composition-toolbar composition-environment-fields",
  });
  const environment = h(
    "details",
    { className: "composition-tool-details" },
    h("summary", {}, "Экран и среда"),
    controlLabel("Сценарий измерения", scenario),
    viewportControls,
    h(
      "p",
      { className: "composition-note" },
      "Размеры среды задаются в CSS px. Масштаб просмотра меняет только отображение; масштаб текста входит в проверяемую среду.",
    ),
  );
  const goldenCanon = createGoldenCanonPanel({
    document: root.ownerDocument,
    onChange: () => drawOverlay(),
  });
  const layoutGrids = createLayoutGridController({
    document: root.ownerDocument,
    getContext: context,
    send,
    onEnabled: () => goldenCanon.setEnabled(false),
  });
  const documentTools = h(
    "details",
    { className: "composition-tool-details" },
    h("summary", {}, "Документ"),
    h(
      "div",
      { className: "composition-toolbar" },
      controlLabel("ID документа", documentIdInput),
      button("Открыть документ", () =>
        openDocument(documentIdInput.value.trim()),
      ),
      button("Обновить", refresh),
      button("Новый эталон", () => prepare(initialComposition(components))),
    ),
    h(
      "details",
      {},
      h("summary", {}, "Импорт старой сетки"),
      h(
        "p",
        { className: "composition-note" },
        "Явный импорт создаёт отдельную композицию из сетки v1.",
      ),
      button(
        "Импорт сетки v1",
        () => legacyDocument && prepare(legacyDocument()),
      ),
    ),
  );
  const settings = h("div", { className: "composition-settings" },
    environment, layoutGrids.element, goldenCanon.element, documentTools);
  const workspace = h("div", { className: "composition-workspace" },
    h("div", { className: "composition-center" }, crumbs, frameScroll, graphViewport));
  const panels = createWorkbenchPanels({ root, workspace, panels: [
    { id: "objects", label: "Объекты", title: "Компоненты и объекты", edge: "left", content: tree },
    { id: "properties", label: "Свойства", title: "Свойства и измерения", content: inspector },
    { id: "settings", label: "Параметры", title: "Экран, сетки и документ", content: settings },
  ] });
  const panelActions = h("div", { className: "composition-panel-actions", role: "group", "aria-label": "Панели редактора" },
    panels.buttons.objects, panels.buttons.properties, panels.buttons.settings);
  toolbar.append(panelActions);
  root.append(toolbar, workspace, status);
  const stopFittingViewport = fitWorkbenchViewport({ viewport: frameScroll, chrome: [root, toolbar] });
  // The workspace owns one assessment area; standalone editors retain their own results.
  (assessmentHost || root).append(reports);
  tree.prepend(addBar);
  const camera = createBoardViewport({
    viewport: graphViewport,
    scene: graphScene,
    storageKey: "ag-design:composition:camera:v2",
    storage,
  });
  const preview = createCompositionPreview({
    viewport: frameScroll,
    stage,
    frame,
    onChange({ scale, width, height }) {
      previewInfo.textContent = `Просмотр ${Math.round(scale * 100)}% · ${width}×${height} CSS px`;
    },
  });
  previewScale.addEventListener(
    "change",
    () => preview.setScale(previewScale.value),
    { signal },
  );
  frame.src = `/composition-frame.html#channel=${encodeURIComponent(channel)}`;

  /** Keep both retained and newly rendered controls locked until the current CAS command settles. */
  function lockControls() {
    if (!busy) return;
    for (const control of root.querySelectorAll(
      "button,input,select,textarea",
    )) {
      if (!lockedControls.has(control))
        lockedControls.set(control, control.disabled);
      control.disabled = true;
    }
  }
  /** Resolve only this editor's current document; transport failure is reconciled with inspect, never a duplicate patch. */
  async function execute(action) {
    if (busy || disposed) return;
    const focused = document.activeElement;
    const focusLabel = root.contains(focused)
      ? focused.getAttribute("aria-label")
      : null;
    const focusDocumentId = state?.documentId;
    const focusSelectedId = selectedId;
    const selectionRange =
      (focused?.tagName === "INPUT" && focused.type === "text") ||
      focused?.tagName === "TEXTAREA"
        ? [focused.selectionStart, focused.selectionEnd]
        : null;
    let focusMoved = false;
    // Disabling or replacing a field may drop focus to body. Only an actual
    // focus move cancels restoration, so another workspace keeps its focus.
    const trackFocus = (event) => {
      if (event.target !== focused) focusMoved = true;
    };
    document.addEventListener("focusin", trackFocus, { capture: true, signal });
    busy = true;
    commandGeneration++;
    sendEditing();
    frameScroll.setAttribute("aria-busy", "true");
    // Pending CAS commands must not silently drop a second edit from the old inspector.
    lockControls();
    try {
      await action();
    } catch (error) {
      if (!disposed) notify(
        `${error.message}. После ошибки записи нажмите «Обновить»: timeout не означает отмену.`,
      );
    } finally {
      busy = false;
      if (!disposed) sendEditing();
      if (!disposed) {
        frameScroll.removeAttribute("aria-busy");
        for (const [control, wasDisabled] of lockedControls) {
          if (root.contains(control)) control.disabled = wasDisabled;
        }
      }
      lockedControls.clear();
      document.removeEventListener("focusin", trackFocus, true);
      if (
        !disposed &&
        !focusMoved &&
        focusLabel &&
        focusDocumentId === state?.documentId &&
        focusSelectedId === selectedId
      ) {
        const replacement = [...root.querySelectorAll("[aria-label]")].find(
          (element) => element.getAttribute("aria-label") === focusLabel,
        );
        // Newly rendered controls are enabled only now, after the CAS settles.
        replacement?.focus();
        if (
          selectionRange &&
          (replacement?.type === "text" || replacement?.tagName === "TEXTAREA")
        )
          replacement.setSelectionRange(...selectionRange);
      }
    }
  }
  /** Notify retained workspace views whenever the measured document or scenario changes. */
  function notifyContext() {
    root.dispatchEvent(
      new root.ownerDocument.defaultView.CustomEvent(
        "ag-design:composition-context",
        { bubbles: true, detail: context() },
      ),
    );
  }
  /** Bind display state to a fresh immutable server envelope and invalidate old geometry/checks. */
  function accept(envelope) {
    // Abort is cooperative: a completed request must still belong to a live editor.
    if (disposed || (state?.documentId === envelope.documentId && envelope.revision < state.revision)) return false;
    const focused = document.activeElement;
    const focusLabel = root.contains(focused)
      ? focused.getAttribute("aria-label")
      : null;
    const selectionRange =
      (focused?.tagName === "INPUT" && focused.type === "text") ||
      focused?.tagName === "TEXTAREA"
        ? [focused.selectionStart, focused.selectionEnd]
        : null;
    const focusDocumentId = state?.documentId;
    const focusSelectedId = selectedId;
    if (state?.documentId !== envelope.documentId) {
      lastReport = null;
      previousReport = null;
      selectedId = null;
      compareId = null;
    }
    cancelSnapshots("Композиция изменилась во время снимка");
    state = envelope;
    layoutGrids.sync();
    documentIdInput.value = state.documentId;
    facts = null;
    measurements.clear();
    if (!state.document.nodes.some((node) => node.id === selectedId))
      selectedId = state.document.nodes[0]?.id || null;
    render();
    renderFrame();
    notifyContext();
    if (
      !busy &&
      focusLabel &&
      focusDocumentId === state.documentId &&
      focusSelectedId === selectedId
    ) {
      const replacement = [...root.querySelectorAll("[aria-label]")].find(
        (element) => element.getAttribute("aria-label") === focusLabel,
      );
      replacement?.focus();
      if (
        selectionRange &&
        (replacement?.type === "text" || replacement?.tagName === "TEXTAREA")
      )
        replacement.setSelectionRange(...selectionRange);
    }
    try {
      storage?.setItem("ag-design:composition:document:v2", state.documentId);
    } catch {
      notify("Ссылка на документ не сохранена; документ остаётся на сервере.");
    }
  }
  async function prepare(document) {
    await execute(async () => {
      accept(await client.prepare({ document, authorId }));
      notify("Эталон создан. Измерения ожидаются; допуск ещё не получен.");
    });
  }
  async function openDocument(documentId) {
    if (!/^[A-Za-z0-9_.:-]{1,100}$/.test(documentId)) {
      notify("Нужен явный ID документа: буквы, цифры, _, ., : или -.");
      return;
    }
    await execute(async () => {
      accept(await client.inspect({ documentId }));
      notify(
        `Открыт документ ${state.documentId} · ревизия ${state.revision}.`,
      );
    });
  }
  async function refresh() {
    if (!state) return;
    await execute(async () => {
      accept(await client.inspect({ documentId: state.documentId }));
      notify(`Получена ревизия ${state.revision}.`);
    });
  }
  async function mutate(operations) {
    if (!state) return;
    await execute(async () => {
      const resolvedOperations =
        typeof operations === "function" ? await operations() : operations;
      accept(
        await client.patch({
          documentId: state.documentId,
          expectedRevision: state.revision,
          idempotencyKey: operationId(),
          authorId,
          contextReceipt: state.contextReceipt,
          operations: resolvedOperations,
        }),
      );
      notify(
        `Изменение сохранено: ревизия ${state.revision}. Проверки устарели.`,
      );
    });
  }
  async function undo() {
    if (!state) return;
    await execute(async () => {
      accept(
        await client.undo({
          documentId: state.documentId,
          expectedRevision: state.revision,
          idempotencyKey: operationId(),
          authorId,
          contextReceipt: state.contextReceipt,
        }),
      );
      notify("Моя последняя правка отменена; требуется повторная проверка.");
    });
  }
  /** Deliberately choose the declared parent; proximity is never used to reparent a component. */
  function insertionParent() {
    const node = state?.document.nodes.find((item) => item.id === selectedId);
    return node?.kind === "frame" ? node.id : node?.parentId || null;
  }
  /** Place new siblings after existing content; free-positioned additions must not overlap at a shared default coordinate. */
  function insertionY(parentId, gap = 24) {
    let nextY = 24;
    for (const node of state.document.nodes) {
      if (node.parentId !== parentId) continue;
      const height =
        measurements.get(node.id)?.height ??
        (typeof node.layout.height === "number" ? node.layout.height : 240);
      nextY = Math.max(nextY, node.layout.y + height + gap);
    }
    return Math.min(10000, nextY);
  }
  /** Samples get independent labelled containers; insertion into a real group is an explicit choice. */
  async function addComponent(component) {
    await initialization;
    if (!state || disposed) return;
    const definition = components.find((item) => item.id === component);
    const separate = insertionMode.value === "sample";
    const nodeId = id("node");
    await mutate(async () => {
      if (separate && frameReady) await measure();
      let parentId = insertionParent();
      const operations = [];
      if (separate) {
        const nextY = insertionY(null);
        parentId = id("sample");
        operations.push({
          op: "add",
          node: {
            id: parentId,
            parentId: null,
            kind: "frame",
            component: null,
            title: `Образец: ${definition?.name || component}`,
            props: { sample: true },
            layout: {
              mode: "column",
              x: 24,
              y: nextY,
              width: Math.max(240, state.document.viewport.width - 48),
              height: "hug",
              gap: 16,
              padding: 16,
              align: "stretch",
            },
          },
        });
      }
      operations.push({
        op: "add",
        node: {
          id: nodeId,
          parentId,
          kind: "component",
          component,
          title: definition?.name || component,
          props: defaultProps(component),
          layout: {
            mode: "free",
            x: 24,
            y: separate ? 24 : insertionY(parentId, 16),
            width: separate ? "fill" : "hug",
            height: "hug",
          },
        },
      });
      return operations;
    });
    if (state?.document.nodes.some((node) => node.id === nodeId))
      select(nodeId);
  }
  /** Add a free-placement container and explicitly select it as the next insertion parent. */
  async function addFrame() {
    if (!state) return;
    const groupId = id("group");
    const parentId = insertionMode.value === "group" ? insertionParent() : null;
    await mutate([
      {
        op: "add",
        node: {
          id: groupId,
          parentId,
          kind: "frame",
          component: null,
          title: "Новая группа",
          props: {},
          layout: {
            mode: "free",
            x: 24,
            y: insertionY(parentId),
            width: 320,
            height: 400,
            gap: 16,
            padding: 16,
            align: "start",
          },
        },
      },
    ]);
    if (state?.document.nodes.some((node) => node.id === groupId)) {
      select(groupId);
      insertionMode.value = "group";
    }
  }

  /** Add an ordinary editable form without replacing an existing document or weakening its baseline. */
  async function addForm() {
    await initialization;
    if (!state || disposed) return;
    const groupId = id("form");
    const nextY = insertionY(null);
    const operations = [
      {
        op: "add",
        node: {
          id: groupId,
          parentId: null,
          kind: "frame",
          component: null,
          title: "Форма",
          props: {},
          layout: {
            mode: "column",
            x: 24,
            y: nextY,
            width: Math.min(480, state.document.viewport.width - 48),
            height: "hug",
            gap: 16,
            padding: 16,
            align: "stretch",
          },
        },
      },
    ];
    if (components.some((item) => item.id === "field")) {
      for (const [label, placeholder] of [
        ["Имя", "Введите имя"],
        ["Электронная почта", "name@example.ru"],
      ]) {
        operations.push({
          op: "add",
          node: {
            id: id("field"),
            parentId: groupId,
            kind: "component",
            component: "field",
            title: label,
            props: { ...defaultProps("field"), label, placeholder, hint: "" },
            layout: { mode: "free", width: "fill", height: "hug" },
          },
        });
      }
    }
    if (components.some((item) => item.id === "button"))
      operations.push({
        op: "add",
        node: {
          id: id("submit"),
          parentId: groupId,
          kind: "component",
          component: "button",
          title: "Действие формы",
          props: { ...defaultProps("button"), label: "Сохранить" },
          layout: { mode: "free", width: "hug", height: "hug" },
        },
      });
    await mutate(operations);
    if (state?.document.nodes.some((node) => node.id === groupId)) {
      select(groupId);
      insertionMode.value = "group";
      notify(
        "Форма добавлена. Выбирайте поля на холсте, меняйте текст справа; новые компоненты добавляются в эту группу.",
      );
    }
  }
  function select(id, { revealSelection = true } = {}) {
    selectedId = id;
    sendEditing();
    renderTree({ revealSelection });
    renderInspector();
    drawOverlay();
    drawGraph();
    lockControls();
  }
  function updateSelected(changes) {
    if (selectedId) mutate([{ op: "update", id: selectedId, changes }]);
  }

  /** Render a controlled field; commit only valid values and keep browser-native keyboard/form semantics. */
  function field(
    container,
    label,
    value,
    commit,
    { type = "text", options, min, max } = {},
  ) {
    const input = options
      ? h(
          "select",
          { "aria-label": label },
          options.map((option) => h("option", { value: option }, option)),
        )
      : h("input", { type, "aria-label": label, min, max });
    input.value = value ?? "";
    input.addEventListener(
      "change",
      () => {
        if (!input.checkValidity()) {
          input.reportValidity();
          return;
        }
        commit(type === "number" ? Number(input.value) : input.value);
      },
      { signal },
    );
    container.append(h("label", {}, h("span", {}, label), input));
    return input;
  }
  /** Tree, breadcrumbs, inspector and both graph views always address the same stable instance ID. */
  function renderTree({ revealSelection = false } = {}) {
    crumbs.replaceChildren();
    if (!state) return;
    selectedId = treeView.update({
      documentId: state.documentId,
      nodes: state.document.nodes,
      selectedId,
      revealSelection,
    });
    const { byId } = hierarchy(state.document);
    for (const nodeId of ancestry(state.document, selectedId))
      crumbs.append(
        button(byId.get(nodeId).title || nodeId, () => select(nodeId)),
      );
  }
  /** The prepared scenario matrix is readonly; unpinned base viewports can be edited through CAS commands. */
  function renderViewport() {
    viewportControls.replaceChildren();
    if (!state) return;
    const viewport = state.document.viewport;
    for (const [key, label, min, max] of [
      ["width", "Viewport W, CSS px", 320, 4096],
      ["height", "Viewport H, CSS px", 240, 4096],
      ["textScale", "Масштаб текста", 1, 2],
    ]) {
      const input = field(
        viewportControls,
        label,
        viewport[key],
        (value) => mutate([{ op: "viewport", changes: { [key]: value } }]),
        { type: "number", min, max },
      );
      input.step = key === "textScale" ? "0.25" : "1";
      input.disabled = state.document.scenarios.length > 0;
    }
    const directionInput = field(
      viewportControls,
      "Направление",
      viewport.direction,
      (value) => mutate([{ op: "viewport", changes: { direction: value } }]),
      { options: ["ltr", "rtl"] },
    );
    directionInput.disabled = state.document.scenarios.length > 0;
    if (state.document.scenarios.length)
      viewportControls.append(
        h(
          "span",
          {},
          "Матрица зафиксирована. Для другой матрицы создайте новый эталон.",
        ),
      );
    const previous = scenario.value;
    scenario.replaceChildren();
    if (!state.document.scenarios.length)
      scenario.append(h("option", { value: "default" }, "Текущий viewport"));
    for (const item of state.document.scenarios)
      scenario.append(h("option", { value: item.id }, item.id));
    if ([...scenario.options].some((option) => option.value === previous))
      scenario.value = previous;
  }
  /** Recreate controlled properties for the selected instance; all changes use the same server command bus. */
  function renderInspector() {
    const openGroups = new Set();
    for (const detail of inspector.querySelectorAll("details[open]"))
      openGroups.add(detail.querySelector("summary")?.textContent);
    propertiesController?.dispose();
    propertiesController = null;
    inspector.replaceChildren(h("h3", {}, "Свойства и измерения"));
    if (!state) return;
    const node = state.document.nodes.find((item) => item.id === selectedId);
    if (!node) {
      inspector.append(
        h("p", {}, "Выберите объект в интерфейсе, дереве или на карте."),
      );
      return;
    }
    propertiesController = createCompositionProperties({
      node,
      nodes: state.document.nodes,
      depth: ancestry(state.document, node.id).length - 1,
      fields: node.kind === "component" ? componentFields(node.component) : [],
      onUpdate: updateSelected,
      onRemove: () => mutate([{ op: "remove", id: node.id }]),
      onError: notify,
    });
    inspector.append(propertiesController.element);
    for (const detail of inspector.querySelectorAll("details"))
      detail.open = openGroups.has(
        detail.querySelector("summary")?.textContent,
      );
    renderMeasurements(node);
  }
  /** Present actual CSS-pixel distances independently from editable layout intent. */
  function renderMeasurements(node) {
    const pairPicker = h(
      "select",
      { "aria-label": "Сравнить с объектом" },
      h("option", { value: "" }, "Выберите вторую опору"),
    );
    for (const other of state.document.nodes)
      if (other.id !== node.id)
        pairPicker.append(
          h("option", { value: other.id }, other.title || other.id),
        );
    pairPicker.value = compareId || "";
    pairPicker.addEventListener(
      "change",
      () => {
        compareId = pairPicker.value || null;
        renderInspector();
        drawOverlay();
      },
      { signal },
    );
    inspector.append(h("h4", {}, "Измеренные границы"), pairPicker);
    const rect = measurements.get(node.id);
    const details = h("dl");
    inspector.append(details);
    function metric(label, value) {
      details.append(h("dt", {}, label), h("dd", {}, value));
    }
    metric(
      "Высота / ширина",
      rect
        ? `${numberText(rect.height)} / ${numberText(rect.width)} CSS px`
        : "unknown — снимок ещё не измерен",
    );
    metric("Baseline", "unknown — метод не измеряет базовую линию текста");
    const parent = measurements.get(node.parentId);
    if (rect && parent)
      metric(
        "До границ родителя: L / R / T / B",
        [
          rect.x - parent.x,
          parent.x + parent.width - rect.x - rect.width,
          rect.y - parent.y,
          parent.y + parent.height - rect.y - rect.height,
        ]
          .map(numberText)
          .join(" / ") + " CSS px",
      );
    const pair = pairGeometry(rect, measurements.get(compareId));
    if (pair) {
      const other = state.document.nodes.find((item) => item.id === compareId);
      metric(
        "Группа",
        node.parentId === other.parentId
          ? "Соседи одного явного родителя"
          : "Разные явные группы",
      );
      for (const [key, label] of [
        ["dx", "dx"],
        ["dy", "dy"],
        ["edgeDistance", "Между границами"],
        ["centerDistance", "Между центрами"],
        ["heightDelta", "Отклонение высоты"],
        ["leftDelta", "Left Δ"],
        ["rightDelta", "Right Δ"],
        ["centerDelta", "Center Δ"],
        ["topDelta", "Top Δ"],
        ["bottomDelta", "Bottom Δ"],
        ["middleDelta", "Middle Δ"],
      ])
        metric(label, `${numberText(pair[key])} CSS px`);
      metric("Пересечение", `${numberText(pair.intersectionArea)} CSS px²`);
    }
    const siblings = state.document.nodes.filter(
      (item) => item.parentId === node.parentId,
    );
    const gap = siblingGaps(
      siblings,
      measurements,
      state.document.nodes.find((item) => item.id === node.parentId)?.layout
        .mode === "column"
        ? "y"
        : "x",
    );
    metric(
      "Интервалы соседей: min / max / разброс",
      gap.count
        ? [gap.min, gap.max, gap.spread].map(numberText).join(" / ") + " CSS px"
        : "unknown — недостаточно сопоставимых соседей",
    );
    inspector.append(
      h(
        "p",
        { className: "composition-note" },
        "Близость не доказывает общую задачу. Равные высоты и оси оцениваются только по объявленным ограничениям.",
      ),
    );
  }
  function render() {
    renderTree();
    renderViewport();
    renderInspector();
    drawGraph();
    renderReport();
    lockControls();
  }

  /** Message origin, sender and random channel are checked before accepting any real-browser measurement. */
  function receive(event) {
    if (
      event.source !== frame.contentWindow ||
      event.origin !== globalThis.location.origin ||
      event.data?.channel !== channel ||
      disposed
    )
      return;
    const data = event.data;
    if (data.type === "composition:ready") {
      frameReady = true;
      resolveFrameReady();
      renderFrame();
    } else if (data.type === "composition:select") {
      if (state?.document.nodes.some((node) => node.id === data.id))
        select(data.id);
    } else if (data.type === "composition:undo") {
      if (
        editingMode.value === "edit" &&
        !busy &&
        data.documentHash === state?.documentHash &&
        data.scenarioId === (scenario.value || "default")
      )
        undo();
    } else if (data.type === "composition:gesture") {
      if (
        editingMode.value !== "edit" ||
        busy ||
        data.documentHash !== state?.documentHash ||
        data.scenarioId !== (scenario.value || "default")
      )
        return;
      const operations = data.operations;
      if (!Array.isArray(operations) || operations.length !== 1) return;
      const operation = operations[0];
      if (!state.document.nodes.some((node) => node.id === operation.id))
        return;
      if (operation.op === "update") {
        const layout = operation.changes?.layout;
        if (
          !layout ||
          Object.keys(layout).some(
            (key) =>
              !["x", "y", "width", "height"].includes(key) ||
              !Number.isFinite(layout[key]),
          )
        )
          return;
      } else if (operation.op !== "reorder") return;
      mutate(operations);
    } else if (
      data.type === "composition:ui-map-snapshot" ||
      data.type === "composition:ui-map-error"
    ) {
      const pending = pendingSnapshots.get(data.requestId);
      if (!pending) return;
      clearTimeout(pending.timer);
      pendingSnapshots.delete(data.requestId);
      const current = context();
      if (
        data.type === "composition:ui-map-error" ||
        !current ||
        current.documentHash !== pending.context.documentHash ||
        current.revision !== pending.context.revision ||
        current.documentId !== pending.context.documentId ||
        current.scenarioId !== pending.context.scenarioId ||
        data.documentHash !== current.documentHash
      ) {
        pending.reject(
          new Error(
            "Снимок не получен или композиция изменилась. Повторите явно.",
          ),
        );
        return;
      }
      pending.resolve({ snapshot: data.snapshot, context: pending.context });
    } else if (data.type === "composition:grid-capture") {
      layoutGrids.publish(data);
    } else if (data.type === "composition:grid-stale") {
      layoutGrids.stale(data);
    } else if (
      data.type === "composition:facts" &&
      data.facts.documentHash === state?.documentHash &&
      data.facts.scenarioId === (scenario.value || "default")
    ) {
      facts = data.facts;
      measurements.clear();
      for (const node of facts.nodes)
        if (node.rect) measurements.set(node.id, node.rect);
      if (!inspector.contains(document.activeElement)) renderInspector();
      lockControls();
      drawOverlay();
      drawGraph();
      const pending = pendingMeasurements.get(data.requestId);
      if (pending) {
        clearTimeout(pending.timer);
        pending.resolve(facts);
        pendingMeasurements.delete(data.requestId);
      }
    }
  }
  function send(message) {
    frame.contentWindow?.postMessage(
      { ...message, channel },
      globalThis.location.origin,
    );
  }
  /** Send only transient editor state; it never changes the document or measurement environment. */
  function sendEditing() {
    send({
      type: "composition:editing",
      config: {
        enabled: editingMode.value === "edit",
        selectedId,
        blocked: busy,
      },
    });
  }
  editingMode.addEventListener(
    "change",
    () => {
      sendEditing();
      notify(
        editingMode.value === "edit"
          ? "Перенос и размер доступны на холсте."
          : "Просмотр: поля и кнопки доступны для взаимодействия.",
      );
    },
    { signal },
  );
  /** Set a real browser viewport; Atlas camera zoom never changes these document dimensions. */
  function renderFrame() {
    if (!state || !frameReady) return;
    const currentScenario = state.document.scenarios.find(
      (item) => item.id === scenario.value,
    );
    const viewport = currentScenario?.viewport || state.document.viewport;
    // Explicit viewport edits take precedence for the editor; scenario switches use the pinned scenario dimensions.
    const model = { ...state.document, viewport };
    preview.setViewport(viewport);
    send({
      type: "composition:render",
      goldenCanon: { ...goldenCanon.config(), selectedId },
      layoutGrids: layoutGrids.configuration,
      editing: {
        enabled: editingMode.value === "edit",
        selectedId,
        blocked: busy,
      },
      requestId: `render-${++measurementSequence}`,
      document: model,
      documentHash: state.documentHash,
      scenarioId: scenario.value || "default",
      definitions: components,
      palette,
      profile: profiles.find((item) => item.id === palette),
      theme: document.documentElement.dataset.theme || "auto",
    });
  }
  /** Request a fresh bounded measurement and reject a timeout without inventing evidence. */
  function measure() {
    return new Promise((resolve, reject) => {
      if (!state || !frameReady) {
        reject(new Error("Измерительный iframe ещё не готов"));
        return;
      }
      const requestId = `measure-${++measurementSequence}`;
      const timer = setTimeout(() => {
        pendingMeasurements.delete(requestId);
        reject(new Error("Браузер не завершил измерение"));
      }, 5000);
      pendingMeasurements.set(requestId, { resolve, reject, timer });
      send({ type: "composition:measure", requestId });
    });
  }
  /** Export a bounded structural snapshot of the actual iframe to the existing full UI-map engine. */
  async function captureSnapshot() {
    await initialization;
    if (!state || disposed) throw new Error("Композиция ещё не готова");
    if (!frameReady)
      await new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("Измерительный iframe не готов")),
          5000,
        );
        frameReadiness.then(() => {
          clearTimeout(timer);
          resolve();
        });
      });
    const expected = context();
    await measure();
    if (
      disposed ||
      context()?.documentHash !== expected.documentHash ||
      context()?.revision !== expected.revision
    )
      throw new Error("Композиция изменилась. Повторите снимок.");
    return new Promise((resolve, reject) => {
      const requestId = `ui-map-${++measurementSequence}`;
      const timer = setTimeout(() => {
        pendingSnapshots.delete(requestId);
        reject(new Error("Снимок интерфейса не завершён"));
      }, 6000);
      pendingSnapshots.set(requestId, {
        resolve,
        reject,
        timer,
        context: expected,
      });
      send({
        type: "composition:capture-ui-map",
        requestId,
        documentHash: expected.documentHash,
        documentId: expected.documentId,
        revision: expected.revision,
        scenarioId: expected.scenarioId,
      });
    });
  }
  /** Bind a fresh real-DOM capture to the exact server revision before pure evaluation. */
  async function runChecks() {
    if (!state) return;
    await execute(async () => {
      const captured = await measure();
      previousReport =
        lastReport?.documentId === state.documentId ? lastReport : null;
      if (disposed) return;
      const checkedDocument = state;
      const report = await client.checks({
        documentId: state.documentId,
        expectedRevision: state.revision,
        facts: captured,
        contextReceipt: state.contextReceipt,
      });
      if (disposed || state !== checkedDocument) return;
      lastReport = report;
      lastReport.documentHash = state.documentHash;
      lastReport.scenarioId = captured.scenarioId;
      renderReport();
      root.dispatchEvent(new root.ownerDocument.defaultView.CustomEvent("ag-design:composition-report", { bubbles: true }));
      notify(
        `Проверки завершены; свидетельства браузера: ${captured.complete ? "complete" : "partial"}.`,
      );
    });
  }
  /** Native outlines follow their objects during scrolling; labels and dimensions stay in the inspector. */
  function drawOverlay() {
    overlay.replaceChildren();
    if (!state) return;
    goldenCanon.update(facts, selectedId);
    send({
      type: "composition:golden-canon",
      config: { ...goldenCanon.config(), selectedId },
    });
    const ancestorIds = ancestry(state.document, selectedId);
    const childIds = [];
    for (const node of state.document.nodes) {
      if (node.parentId === selectedId) childIds.push(node.id);
    }
    send({
      type: "composition:inspection",
      config: {
        enabled: overlayToggle.checked,
        selectedId,
        ancestorIds,
        childIds,
        compareId,
      },
    });
  }
  /** Reuse the Atlas camera for navigation; only spatial mode uses the measured CSS rectangles. */
  function drawGraph() {
    if (view.value === "interface") return;
    graphScene.replaceChildren();
    if (!state) return;
    const positions =
      view.value === "semantic"
        ? semanticPositions(state.document)
        : measurements;
    let width = 640,
      height = 320;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("composition-graph-edges");
    svg.setAttribute("aria-hidden", "true");
    graphScene.append(svg);
    function edge(fromId, toId, type) {
      const from = positions.get(fromId),
        to = positions.get(toId);
      if (!from || !to) return;
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      const x1 = from.x + from.width,
        y1 = from.y + from.height / 2,
        x2 = to.x,
        y2 = to.y + to.height / 2;
      const bend = Math.max(24, Math.abs(x2 - x1) / 2);
      path.setAttribute(
        "d",
        `M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}`,
      );
      path.setAttribute("data-relation", type);
      const title = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "title",
      );
      title.textContent = `${type}: ${fromId} → ${toId}`;
      path.append(title);
      svg.append(path);
    }
    for (const node of state.document.nodes)
      if (node.parentId) edge(node.parentId, node.id, "contains");
    for (const constraint of state.document.constraints)
      if (["align", "equal-height"].includes(constraint.type)) {
        for (let index = 1; index < constraint.nodeIds.length; index++)
          edge(constraint.nodeIds[0], constraint.nodeIds[index], "aligns");
      }
    if (view.value === "spatial") {
      const { children, byId } = hierarchy(state.document);
      for (const ids of children.values())
        for (let index = 1; index < ids.length; index++) {
          const first = ids[index - 1],
            second = ids[index],
            measured = pairGeometry(
              positions.get(first),
              positions.get(second),
            );
          if (
            measured &&
            measured.edgeDistance <= 128 &&
            byId.get(first).parentId === byId.get(second).parentId
          )
            edge(
              first,
              second,
              measured.intersectionArea > 0
                ? "overlaps-advisory"
                : "near-advisory",
            );
        }
    }
    for (const node of state.document.nodes) {
      const rect = positions.get(node.id);
      if (!rect) continue;
      width = Math.max(width, rect.x + rect.width + 24);
      height = Math.max(height, rect.y + rect.height + 24);
      const card = mapElement(
        document,
        "button",
        {
          type: "button",
          class: "composition-map-node",
          "aria-pressed": String(node.id === selectedId),
        },
        `${node.title} · ${node.id}`,
      );
      Object.assign(card.style, {
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${Math.max(1, rect.width)}px`,
        height: `${Math.max(1, rect.height)}px`,
      });
      card.addEventListener("click", () => select(node.id), { signal });
      graphScene.append(card);
      const parent = positions.get(node.parentId);
      if (parent && view.value === "semantic") {
        const relation = mapElement(
          document,
          "span",
          { class: "composition-relation" },
          `contains: ${node.parentId} → ${node.id}`,
        );
        Object.assign(relation.style, {
          left: `${parent.x + parent.width}px`,
          top: `${rect.y + 20}px`,
        });
        graphScene.append(relation);
      }
    }
    graphScene.style.width = `${width}px`;
    graphScene.style.height = `${height}px`;
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
  }
  /** Scores never waive an unknown trust gate; stale identity or scenario is visibly distinguished. */
  function renderReport() {
    reports.replaceChildren(h("h3", {}, "Детерминированные проверки"));
    if (!lastReport) {
      reports.append(
        h(
          "p",
          {},
          "Оценка unknown: запустите проверку. Изменения требуют новых измерений.",
        ),
      );
      return;
    }
    const report = lastReport.report || lastReport;
    const stale =
      lastReport.documentId !== state?.documentId ||
      lastReport.documentHash !== state?.documentHash ||
      lastReport.revision !== state?.revision ||
      lastReport.scenarioId !== (scenario.value || "default");
    reports.append(
      h(
        "p",
        {},
        `Ревизия ${lastReport.revision} · ${stale ? "STALE" : "актуальная"} · gate ${report.gate?.status || "unknown"} · score ${JSON.stringify(report.score ?? report.scores ?? "unknown")} · coverage ${JSON.stringify(report.coverage || "unknown")}`,
      ),
      h(
        "p",
        {},
        "Геометрия проверена по переданным фактам. Это не аттестация браузера, WCAG или всей UX.",
      ),
    );
    const checks = report.checks || report.findings || [];
    const filter = h(
      "select",
      { "aria-label": "Фильтр результатов" },
      ...["all", "fail", "unknown", "pass"].map((value) =>
        h("option", { value }, value),
      ),
    );
    const list = h("ul");
    function showChecks() {
      list.replaceChildren();
      for (const check of checks)
        if (filter.value === "all" || check.status === filter.value) {
          const row = h(
            "li",
            {},
            button(
              `${check.status || "finding"} · ${check.ruleId || check.id} · ${(check.nodeIds || []).join(", ")}`,
              () => select(check.nodeIds?.[0] || selectedId),
            ),
            h(
              "span",
              {},
              ` Измерено: ${JSON.stringify(check.measured ?? null)} · ожидается: ${JSON.stringify(check.expected ?? null)} · допуск: ${check.tolerance ?? "unknown"}`,
            ),
          );
          list.append(row);
        }
    }
    filter.addEventListener("change", showChecks, { signal });
    showChecks();
    reports.append(filter, list);
    if (previousReport)
      reports.append(
        button("Сравнить с предыдущим прогоном", () =>
          execute(async () => {
            const comparison = await client.compare({
              beforeId: previousReport.reportId,
              afterId: lastReport.reportId,
            });
            notify(`Сравнение: ${JSON.stringify(comparison)}`);
          }),
        ),
      );
    reports.append(
      button("Проверить допуск", () =>
        execute(async () => {
          const qualification = await client.qualification({
            reportId: lastReport.reportId,
          });
          notify(
            `Допуск: ${qualification.status || qualification.decision || "unknown"}. ${qualification.reason || "Нужны независимые свидетельства среды и целевого интерфейса."}`,
          );
        }),
      ),
    );
  }
  view.addEventListener(
    "change",
    () => {
      const offscreen = view.value !== "interface";
      // display:none would suppress iframe layout and turn a valid UI into zero-sized evidence.
      frameScroll.classList.toggle(
        "composition-frame-scroll--offscreen",
        offscreen,
      );
      if (offscreen) {
        frameScroll.setAttribute("aria-hidden", "true");
        frame.setAttribute("tabindex", "-1");
      } else {
        frameScroll.removeAttribute("aria-hidden");
        frame.removeAttribute("tabindex");
      }
      graphViewport.hidden = !offscreen;
      drawGraph();
    },
    { signal },
  );
  scenario.addEventListener(
    "change",
    () => {
      cancelSnapshots("Сценарий изменился во время снимка");
      notifyContext();
      facts = null;
      measurements.clear();
      drawOverlay();
      drawGraph();
      renderInspector();
      renderFrame();
      renderReport();
    },
    { signal },
  );
  overlayToggle.addEventListener("change", drawOverlay, { signal });
  window.addEventListener("message", receive, { signal });
  root.addEventListener(
    "keydown",
    (event) => {
      if (event.defaultPrevented) return;
      if (event.target.closest("input,select,textarea,[contenteditable=true]"))
        return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
      if (event.key === "Escape") {
        const node = state?.document.nodes.find(
          (item) => item.id === selectedId,
        );
        select(node?.parentId || null);
      }
    },
    { signal },
  );
  graphViewport.hidden = true;
  /** Poll only the owned document while visible, so an MCP edit appears without resetting another tab's document. */
  async function poll() {
    if (disposed) return;
    if (
      state &&
      !busy &&
      root.isConnected &&
      !root.closest("[hidden]") &&
      !document.hidden
    ) {
      try {
        const documentId = state.documentId;
        const generation = commandGeneration;
        const fresh = await client.inspect({ documentId });
        // A foreground command may switch documents while this background request is pending.
        if (!disposed && !busy && generation === commandGeneration && state?.documentId === documentId) {
          if (fresh.documentId === documentId && fresh.revision > state.revision) accept(fresh);
          await layoutGrids.sync();
        }
      } catch {
        /* Foreground commands report transport errors; a background poll never overwrites an error message. */
      }
    }
    if (!disposed) pollTimer = setTimeout(poll, 2000);
  }
  const initialization = execute(async () => {
    let saved = null;
    try {
      saved = storage?.getItem("ag-design:composition:document:v2");
    } catch {
      /* Server persistence remains available. */
    }
    if (saved) {
      try {
        accept(await client.inspect({ documentId: saved }));
      } catch {
        notify("Сохранённый документ недоступен; создайте новый эталон.");
      }
    } else
      accept(
        await client.prepare({
          document: initialComposition(components),
          authorId,
        }),
      );
    if (state) notify("Документ готов. Выберите объект и запустите измерения.");
  });
  pollTimer = setTimeout(poll, 2000);
  return {
    element: root,
    addComponent,
    captureSnapshot,
    get context() {
      return context();
    },
    get document() {
      return state?.document;
    },
    /** Fence every late completion before releasing the editor's owned features. */
    dispose() {
      if (disposed) return;
      disposed = true;
      commandGeneration++;
      stopFittingViewport();
      panels.dispose();
      layoutGrids.dispose();
      goldenCanon.dispose();
      cancelSnapshots("Редактор закрыт");
      clearTimeout(pollTimer);
      controller.abort();
      camera.dispose();
      treeView.dispose();
      componentPicker.dispose();
      preview.dispose();
      propertiesController?.dispose();
      if (assessmentHost) reports.remove();
      for (const pending of pendingMeasurements.values()) {
        clearTimeout(pending.timer);
        pending.reject(new Error("Редактор закрыт"));
      }
      pendingMeasurements.clear();
      frame.src = "about:blank";
    },
  };
}

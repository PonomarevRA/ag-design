import { createTabs, createButton } from "./vendor/ag-design/index.js";
import { createSandbox } from "./sandbox.js";
import { createUiMapView } from "./ui-map-view.js";
import { h } from "./dom.js";

const LEGACY_REVIEW_MESSAGE =
  "Для ручной оценки откройте композицию; сетка v1 не имеет версионированной привязки";

/** Normalize historical section IDs without dropping the map or evidence-review entry points. */
export function workspaceRoute(view) {
  if (view === "ui-map") return { view: "sandbox", mode: "map" };
  if (view === "audit") return { view: "sandbox", mode: "review" };
  return { view, mode: "editor" };
}

/** Retain editor/map views; automated assessment and explicitly bound manual evidence belong to the editor. */
export function createInterfaceWorkspace({
  components,
  profiles,
  palette = "design",
  initialMode = "editor",
  renderReview,
  onAddScreen,
  sandboxFactory = createSandbox,
  mapFactory = createUiMapView,
  tabsFactory = createTabs,
} = {}) {
  const root = h("section", {
    className: "interface-workspace",
    "aria-label": "Песочница интерфейса",
  });
  const status = h("p", {
    className: "workspace-context",
    role: "status",
    "aria-live": "polite",
  });
  let disposed = false,
    captureSequence = 0,
    lastCapture = null,
    editor = null,
    map = null,
    reviewGeneration = 0,
    manualDraft = null,
    manualOpenHandled = false;
  const abort = new AbortController();
  const controllers = [];
  const editorTools = h("div", { className: "workspace-editor-tools" });
  const editorHost = h("div", { className: "workspace-editor-host" });
  const automaticHost = h("section", {
    className: "workspace-assessment",
    "aria-label": "Оценка композиции",
  });
  const provenance = h("p", {
    className: "workspace-review-provenance",
    role: "status",
    "aria-live": "polite",
  });
  const manualHost = h("div", { className: "workspace-review-body" });
  const newReview = createButton({
    label: "Новая ручная оценка",
    onClick: () => {
      if (disposed) return;
      manualDetails.open = true;
      startManualDraft();
    },
  });
  const manualDetails = h(
    "details",
    { className: "workspace-manual-review" },
    h("summary", {}, "Критерии и ручные свидетельства"),
    h(
      "p",
      { className: "muted" },
      "Ручные свидетельства сохраняют привязку к композиции на момент начала оценки.",
    ),
    h("div", { className: "workspace-review-toolbar" }, newReview),
    provenance,
    manualHost,
  );
  const reviewHost = h("section", { className: "workspace-checks", "aria-label": "Проверки композиции и свидетельства" },
    h("header", { className: "section-intro" }, h("h2", {}, "Проверки текущей композиции"),
      h("p", { className: "muted" }, "Геометрия рассчитывается по кадру. Ручные свидетельства и их актуальность проверяются отдельно.")),
    automaticHost, manualDetails);
  manualDetails.addEventListener(
    "toggle",
    () => {
      if (disposed) return;
      // A queued toggle from a legacy opening cannot start a later composition's draft implicitly.
      if (!manualDetails.open) manualOpenHandled = false;
      else if (!manualDraft && !manualOpenHandled) startManualDraft();
    },
    { signal: abort.signal },
  );

  /** Copy only the public artifact identity, including an explicit null before a composition exists. */
  function currentIdentity() {
    const current = editor?.context;
    if (current == null) return null;
    return Object.freeze({
      kind: current.kind,
      documentId: current.documentId,
      revision: current.revision,
      documentHash: current.documentHash,
      scenarioId: current.scenarioId,
    });
  }
  function sameIdentity(a, b) {
    if (a === null || b === null) return a === b;
    return [
      "kind",
      "documentId",
      "revision",
      "documentHash",
      "scenarioId",
    ].every((key) => a[key] === b[key]);
  }
  /** Staleness is sticky: visiting another artifact never silently rehabilitates a manual draft or its pending requests. */
  function describeManualDraft() {
    if (!manualDraft) {
      provenance.textContent =
        currentIdentity()?.kind === "legacy"
          ? LEGACY_REVIEW_MESSAGE
          : "Ручная оценка ещё не начата.";
      return;
    }
    if (!sameIdentity(manualDraft.context, currentIdentity()))
      manualDraft.stale = true;
    provenance.dataset.stale = String(manualDraft.stale);
    const context = manualDraft.context;
    const identity = context
      ? `Документ: ${context.documentId} · ревизия: ${context.revision} · hash: ${context.documentHash} · сценарий: ${context.scenarioId}`
      : "Без композиции на момент начала (null)";
    const legacyInstruction =
      currentIdentity()?.kind === "legacy" ? ` ${LEGACY_REVIEW_MESSAGE}.` : "";
    provenance.textContent = `${identity}. ${manualDraft.stale ? "Оценка устарела. Для текущей композиции начните новую ручную оценку." : "Привязка зафиксирована на момент начала оценки."}${legacyInstruction}`;
  }
  /** Mount once per explicit draft; generation and frozen identity fence asynchronous renderer work. */
  function startManualDraft() {
    if (disposed) return;
    manualOpenHandled = true;
    if (currentIdentity()?.kind === "legacy") {
      describeContext();
      return;
    }
    const ticket = ++reviewGeneration;
    const panel = h(
      "section",
      { className: "workspace-review", "aria-label": "Ручные свидетельства" },
      h("p", {}, "Загружаем критерии…"),
    );
    const draft = { context: currentIdentity(), stale: false };
    manualDraft = draft;
    Object.defineProperty(panel, "reviewContext", { value: draft.context });
    manualHost.replaceChildren(panel);
    describeManualDraft();
    const isCurrent = () => {
      if (disposed || ticket !== reviewGeneration || manualDraft !== draft)
        return false;
      describeManualDraft();
      return !draft.stale;
    };
    Promise.resolve()
      .then(() => {
        if (isCurrent()) return renderReview?.(panel, isCurrent);
      })
      .catch((cause) => {
        if (isCurrent())
          panel.replaceChildren(h("p", { role: "alert" }, cause.message));
      });
  }
  /** Every map keeps its own immutable scope; editing the source only marks that snapshot as stale. */
  function describeContext() {
    if (disposed) return;
    const current = editor?.context;
    // Composition evidence remains retained, but cannot look current while the legacy grid is active.
    automaticHost.hidden = current?.kind === "legacy";
    newReview.disabled = current?.kind === "legacy";
    describeManualDraft();
    if (!lastCapture) {
      status.textContent =
        "Проверки доступны в отдельной вкладке. Снимок карты создаётся явно; значения полей не включаются.";
      return;
    }
    const stale =
      current?.documentId !== lastCapture.documentId ||
      current?.revision !== lastCapture.revision ||
      current?.documentHash !== lastCapture.documentHash ||
      current?.scenarioId !== lastCapture.scenarioId;
    status.textContent = `Карта: ${lastCapture.documentId} · ревизия ${lastCapture.revision ?? "v1"}${stale ? " · снимок устарел, создайте новый явно" : " · снимок текущей композиции"}. Геометрия композиции, метрики карты и ручные свидетельства оцениваются отдельно.`;
  }
  /** Mount each feature once; inactive editor stays laid out offscreen so its viewport measurements remain real. */
  function mountEditor() {
    editor = sandboxFactory({
      components,
      profiles,
      palette,
      initialMode: "composition",
      assessmentHost: automaticHost,
    });
    controllers.push(editor);
    if (editor.toolbar) editorTools.append(editor.toolbar);
    editor.element.addEventListener("ag-design:composition-report", () => {
      if (!disposed) modes.setValue("review");
    }, { signal: abort.signal });
    editor.element.addEventListener(
      "ag-design:composition-context",
      describeContext,
    );
    editorHost.prepend(editor.element);
    return editorHost;
  }
  function mountMap() {
    map = mapFactory({
      profiles,
      palette,
      onSnapshotChange() {
        lastCapture = null;
        describeContext();
      },
    });
    controllers.push(map);
    return map.element;
  }
  const modes = tabsFactory({
    label: "Режим песочницы",
    value: "editor",
    activation: "manual",
    tabs: [
      {
        id: "editor",
        label: "Редактор",
        lifecycle: "offscreen",
        mount: mountEditor,
      },
      {
        id: "map",
        label: "Карта и метрики",
        lifecycle: "preserve",
        mount: mountMap,
      },
      { id: "review", label: "Проверки", lifecycle: "preserve", mount: () => reviewHost },
    ],
    onChange: describeContext,
  });
  /** Import the actual explicit-root snapshot through the existing graph engine, retaining every graph/evaluation capability. */
  async function captureToMap() {
    if (disposed || captureButton.disabled) return;
    const ticket = ++captureSequence;
    captureButton.disabled = true;
    status.textContent = "Снимаем текущую композицию без значений полей…";
    try {
      const captured = await editor.captureSnapshot();
      if (disposed || ticket !== captureSequence) return;
      modes.setValue("map");
      const loaded = await map.loadSnapshot(captured.snapshot);
      if (disposed || ticket !== captureSequence) return;
      if (loaded !== true)
        throw new Error(
          "Карта не загружена. Подробности доступны в её панели.",
        );
      lastCapture = captured.context;
      describeContext();
    } catch (cause) {
      if (!disposed && ticket === captureSequence)
        status.textContent = cause.message;
    } finally {
      if (!disposed && ticket === captureSequence)
        captureButton.disabled = false;
    }
  }
  const captureButton = createButton({
    label: "Карта текущей композиции",
    variant: "secondary",
    onClick: captureToMap,
  });
  const actions = h(
      "div",
      { className: "workspace-toolbar" },
      captureButton,
      ...(onAddScreen ? [createButton({label:"В клиентский путь",variant:"secondary",onClick(){
        const context=editor?.context;
        if(context?.kind!=="composition"){status.textContent="Сначала откройте композицию в редакторе.";return;}
        onAddScreen(context);
      }})] : []),
      editorTools,
    );
  // tablist is an explicit public slot; moving it keeps native tab identities, panels and cleanup.
  root.append(h("header", { className: "workspace-mode-header" }, modes.tablist, actions), modes.element, status);
  describeContext();
  /** Historical review routes now open the retained checks view without recreating the editor document. */
  function setMode(mode) {
    if (disposed || !["editor", "map", "review"].includes(mode)) return;
    modes.setValue(mode);
    if (mode === "review") {
      manualDetails.open = true;
      if (!manualDraft) startManualDraft();
    }
    describeContext();
  }
  if (["map", "review"].includes(initialMode)) setMode(initialMode);
  return {
    element: root,
    captureToMap,
    setMode,
    get reviewContext() {
      return manualDraft?.context ?? null;
    },
    async addComponent(id) {
      if (disposed) return;
      modes.setValue("editor");
      await editor.addComponent(id);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      captureSequence++;
      reviewGeneration++;
      abort.abort();
      editor?.element.removeEventListener(
        "ag-design:composition-context",
        describeContext,
      );
      const errors = [];
      // One failed feature cleanup must not keep another retained feature alive.
      try {
        modes.dispose();
      } catch (cause) {
        errors.push(cause);
      }
      for (const controller of controllers) {
        try {
          controller.dispose?.();
        } catch (cause) {
          errors.push(cause);
        }
      }
      root.replaceChildren();
      if (errors.length)
        throw new AggregateError(
          errors,
          "Workspace cleanup failed after all features were released",
        );
    },
  };
}

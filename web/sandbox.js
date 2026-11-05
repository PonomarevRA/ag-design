import { createCompositionEditor } from "./composition-editor.js";
import { windowedSample } from "./windowed-sample.js";
import { h } from "./dom.js";
import { createButton, applyColorProfile } from "./vendor/ag-design/index.js";
import { createSandboxStore } from "./sandbox-model.js";
import { defaultProps, mountSandboxComponent } from "./sandbox-components.js";
import { bindSandboxGestures } from "./sandbox-gestures.js";
import { renderSandboxInspector } from "./sandbox-inspector.js";

/** Multi-instance layout editor. The serializable store owns changes; mounted factories and gestures are disposable. */
function createLegacySandbox({
  components,
  profiles,
  palette = "design",
  storage,
}) {
  if (storage === undefined) {
    try {
      storage = globalThis.localStorage;
    } catch {
      storage = {
        getItem() {
          throw new Error("Storage unavailable");
        },
        setItem() {
          throw new Error("Storage unavailable");
        },
      };
    }
  }
  const definitions = new Map(components.map((item) => [item.id, item]));
  const root = h("section", {
    className: "sandbox",
    "aria-label": "Песочница компонентов",
    "data-preview": "false",
  });
  const abort = new AbortController(),
    options = { signal: abort.signal };
  const notice = h("p", {
    className: "sandbox-status",
    role: "status",
    "aria-live": "polite",
  });
  const persistenceNotice = h("p", {
    className: "sandbox-persistence",
    role: "status",
    "aria-live": "polite",
  });
  const inspector = h("aside", {
    className: "sandbox-inspector",
    "aria-label": "Настройки выбранного элемента",
  });
  const viewport = h("div", { className: "sandbox-viewport" });
  const canvas = h("div", {
    className: "sandbox-canvas preview",
    "data-palette": palette,
    "aria-label": "Сетка экрана",
  });
  const separator = h("div", {
    className: "sandbox-viewport-resizer",
    role: "separator",
    tabindex: 0,
    "aria-label": "Ширина экрана",
    "aria-orientation": "vertical",
    "aria-valuemin": 320,
    "aria-valuemax": 1600,
    "data-gesture": "viewport",
    title: "Тяните край · стрелки, Home и End",
  });
  const scroller = h("div", { className: "sandbox-scroll" }, viewport);
  viewport.append(canvas, separator);
  const mounted = new Map();
  let selection = null,
    mode = false,
    disposed = false,
    inspectorEditing = false;
  const warning = (message) => {
    notice.textContent = message;
  };
  let store;
  const undo = createButton({
    label: "Отменить",
    icon: "↶",
    variant: "quiet",
    onClick: () => {
      store.undo();
      refreshInspector();
    },
  });
  const redo = createButton({
    label: "Повторить",
    icon: "↷",
    variant: "quiet",
    onClick: () => {
      store.redo();
      refreshInspector();
    },
  });
  const width = h("input", {
    type: "number",
    min: 320,
    max: 1600,
    step: 1,
    "aria-label": "Ширина экрана, пикселей",
  });
  const paletteInput = h(
    "select",
    { "aria-label": "Палитра экрана" },
    profiles.map((profile) => h("option", { value: profile.id }, profile.name)),
  );
  paletteInput.value = palette;
  const previewMode = createButton({
    label: "Просмотр",
    variant: "quiet",
    onClick: () => {
      mode = !mode;
      for (const record of mounted.values()) record.body.inert = !mode;
      root.dataset.preview = String(mode);
      previewMode.setAttribute("aria-pressed", String(mode));
      warning(
        mode
          ? "Просмотр: компоненты доступны для взаимодействия."
          : "Редактор: перемещайте за ручку, меняйте размер за нижний угол.",
      );
    },
  });
  previewMode.setAttribute("aria-pressed", "false");
  const toolbar = h(
    "div",
    { className: "sandbox-toolbar" },
    h("div", { className: "sandbox-history" }, undo, redo),
    h("label", {}, "Экран ", width, h("span", {}, "px")),
    paletteInput,
    previewMode,
  );
  for (const size of [320, 768, 1280])
    toolbar.append(
      createButton({
        label: String(size),
        variant: "quiet",
        onClick: () => store.width(size),
      }),
    );
  toolbar.append(
    createButton({
      label: "По окну",
      variant: "quiet",
      onClick: () =>
        store.width(Math.max(320, Math.min(1600, scroller.clientWidth - 56))),
    }),
  );
  const gridToggle = createButton({
    label: "Сетка",
    variant: "quiet",
    onClick: () => {
      const show = root.dataset.grid !== "true";
      root.dataset.grid = String(show);
      gridToggle.setAttribute("aria-pressed", String(show));
    },
  });
  gridToggle.setAttribute("aria-pressed", "false");
  toolbar.append(gridToggle);
  const picker = h(
    "select",
    { "aria-label": "Компонент для добавления" },
    components.map((item) => h("option", { value: item.id }, item.name)),
  );
  const addBar = h(
    "div",
    { className: "sandbox-add" },
    picker,
    createButton({
      label: "Добавить",
      icon: "plus",
      variant: "primary",
      onClick: () => addComponent(picker.value),
    }),
  );
  root.append(
    toolbar,
    addBar,
    h(
      "p",
      { className: "sandbox-hint" },
      "Выберите элемент на холсте · перенос за ручку · стрелки для точной настройки · ⌘/Ctrl Z — отмена",
    ),
    h("div", { className: "sandbox-workspace" }, scroller, inspector),
    notice,
    persistenceNotice,
  );

  /** Keep selection outside persisted content so undo never restores obsolete focus or DOM references. */
  function select(id) {
    if (selection === id) return;
    selection = id;
    for (const [key, record] of mounted) {
      record.tile.dataset.selected = String(key === id);
      record.sample.setPinned?.(key === id);
    }
    refreshInspector();
  }
  /** Rebuild controls on selection/history changes; preserve the active field during its own commit. */
  function refreshInspector() {
    const item = store?.document.items.find((item) => item.id === selection);
    renderSandboxInspector(inspector, item, {
      patch: (patch, groupKey) => {
        inspectorEditing = true;
        try {
          store.patch(item.id, patch, {
            groupKey: groupKey ? item.id + ":" + groupKey : null,
          });
        } finally {
          inspectorEditing = false;
        }
      },
      remove: () => {
        store.remove(item.id);
        select(null);
        warning("Компонент удалён.");
      },
      duplicate: () => addComponent(item.component, item),
      finishEdit: () => store.endEdit(),
      fit: () => {
        const wrapper = mounted.get(item.id)?.body.firstElementChild;
        const child = wrapper?.firstElementChild;
        if (child) {
          const height = Math.max(
            child.scrollHeight,
            child.getBoundingClientRect().height,
          );
          try {
            store.patch(item.id, {
              h: Math.max(2, Math.min(40, Math.ceil((height + 8) / 32))),
            });
          } catch (error) {
            warning(error.message);
          }
        }
      },
      description: definitions.get(item?.component)?.summary,
      notice: warning,
    });
  }
  /** Resolve automatic appearance using the same host preference as catalogue previews. */
  function theme() {
    const selected = document.documentElement.dataset.theme;
    return selected === "dark" ||
      (selected === "auto" &&
        globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches)
      ? "dark"
      : "light";
  }
  /** Replace the complete token scope so no previous palette values leak into the new selection. */
  function applyProfile() {
    const profile = profiles.find((item) => item.id === paletteInput.value);
    canvas.dataset.palette = paletteInput.value;
    if (profile) applyColorProfile(canvas, profile, theme());
  }
  /** Mount or update one instance. Geometry-only changes retain the factory and its interaction state. */
  function synchronizeInstance(item) {
    const signature = JSON.stringify([item.component, item.props]);
    let record = mounted.get(item.id);
    if (!record) {
      const handle = createButton({
        label: `Переместить: ${item.title}`,
        icon: "⠿",
        iconOnly: true,
        variant: "quiet",
      });
      handle.dataset.gesture = "move";
      const resize = createButton({
        label: `Размер: ${item.title}`,
        icon: "↘",
        iconOnly: true,
        variant: "quiet",
      });
      resize.dataset.gesture = "resize";
      resize.dataset.edge = "se";
      resize.classList.add("sandbox-item-resizer");
      const resizers = [resize];
      for (const [edge, name] of [
        ["n", "сверху"],
        ["ne", "справа сверху"],
        ["e", "справа"],
        ["s", "снизу"],
        ["sw", "слева снизу"],
        ["w", "слева"],
        ["nw", "слева сверху"],
      ]) {
        const handle = createButton({
          label: `Размер: ${item.title} — ${name}`,
          iconOnly: true,
          variant: "quiet",
        });
        handle.dataset.gesture = "resize";
        handle.dataset.edge = edge;
        handle.dataset.edgeName = name;
        handle.classList.add("sandbox-item-resizer");
        resizers.push(handle);
      }
      const settings = createButton({
        label: `Настройки: ${item.title}`,
        icon: "dot",
        iconOnly: true,
        variant: "quiet",
        onClick: () => {
          select(item.id);
          inspector.scrollIntoView?.({ block: "nearest" });
          inspector.querySelector("h2")?.focus({ preventScroll: true });
        },
      });
      settings.classList.add("sandbox-item-settings");
      const label = h(
        "button",
        { type: "button", className: "sandbox-item-label" },
        item.title,
      );
      label.addEventListener("click", () => select(item.id));
      const body = h("div", { className: "sandbox-item-body" });
      const selector = h("button", {
        type: "button",
        className: "sandbox-item-selector",
        "aria-label": `Выбрать: ${item.title}`,
      });
      selector.addEventListener("click", () => select(item.id));
      const tile = h(
        "article",
        { className: "sandbox-item", "data-item": item.id },
        h("div", { className: "sandbox-item-bar" }, handle, label),
        body,
        selector,
        settings,
        ...resizers,
      );
      tile.addEventListener("pointerdown", () => select(item.id));
      tile.addEventListener("focusin", () => select(item.id));
      canvas.append(tile);
      record = {
        tile,
        body,
        label,
        selector,
        settings,
        resizers,
        handle,
        resize,
        sample: { dispose() {} },
        signature: null,
      };
      mounted.set(item.id, record);
    }
    if (record.signature !== signature) {
      record.sample.dispose?.();
      try {
        record.sample = windowedSample(
          () =>
            mountSandboxComponent(
              item,
              definitions.get(item.component),
              paletteInput.value,
              profiles.find((p) => p.id === paletteInput.value),
            ),
          { label: item.title, estimatedHeight: item.h * 32 },
        );
      } catch (error) {
        record.sample = {
          element: h(
            "p",
            { role: "alert" },
            "Пример недоступен: " + error.message,
          ),
          dispose() {},
        };
      }
      record.body.replaceChildren(record.sample.element);
      record.signature = signature;
    }
    record.body.inert = !mode;
    record.label.textContent = item.title;
    record.selector.setAttribute("aria-label", `Выбрать: ${item.title}`);
    record.handle.setAttribute("aria-label", `Переместить: ${item.title}`);
    for (const handle of record.resizers)
      handle.setAttribute(
        "aria-label",
        `Размер: ${item.title}${handle.dataset.edgeName ? " — " + handle.dataset.edgeName : ""}`,
      );
    record.settings.setAttribute("aria-label", `Настройки: ${item.title}`);
    record.tile.style.gridColumn = `${item.x + 1} / span ${item.w}`;
    record.tile.style.gridRow = `${item.y + 1} / span ${item.h}`;
    record.tile.dataset.selected = String(selection === item.id);
    record.sample.setPinned?.(selection === item.id);
  }
  /** Rebuild only changed instances; selection and width changes leave all component state and clocks intact. */
  function synchronize(doc) {
    if (disposed) return;
    const focus = document.activeElement;
    const focusedItem = focus?.closest?.("[data-item]")?.dataset.item;
    const focusedGesture = focus?.dataset?.gesture;
    const ids = new Set(doc.items.map((item) => item.id));
    for (const [id, record] of mounted) {
      if (!ids.has(id)) {
        record.sample.dispose?.();
        record.tile.remove();
        mounted.delete(id);
      }
    }
    for (const item of doc.items) synchronizeInstance(item);
    canvas.classList.toggle("is-empty", !doc.items.length);
    canvas.style.minHeight = `${Math.max(520, ...doc.items.map((item) => (item.y + item.h) * 32 + 48))}px`;
    viewport.style.width = doc.width + "px";
    width.value = doc.width;
    separator.setAttribute("aria-valuenow", String(doc.width));
    undo.disabled = !store?.canUndo;
    redo.disabled = !store?.canRedo;
    const selectionRemoved = selection && !ids.has(selection);
    const restoreInspectorFocus = selectionRemoved && inspector.contains(focus);
    if (selectionRemoved) selection = null;
    if (selectionRemoved || (!inspectorEditing && !inspector.contains(focus)))
      refreshInspector();
    // Removed controls cannot keep focus or continue editing the deleted record.
    if (restoreInspectorFocus)
      inspector.querySelector("h2")?.focus({ preventScroll: true });
    // Retained handles keep their exact edge identity during keyboard resize.
    if (focusedItem && focusedGesture && focus.isConnected)
      focus.focus({ preventScroll: true });
  }
  store = createSandboxStore({
    knownIds: new Set(definitions.keys()),
    storage,
    onChange: synchronize,
    onWarning: warning,
    onPersistence: (saved) => {
      persistenceNotice.textContent = saved
        ? "Сохранено на этом устройстве."
        : "Не сохранено: композиция доступна до закрытия страницы.";
    },
  });
  /** Insert or duplicate an instance into the first free rectangle; catalogue definitions stay immutable. */
  function addComponent(id, copy) {
    const definition = definitions.get(id);
    if (!definition) return;
    try {
      const item = {
        id: globalThis.crypto.randomUUID(),
        component: id,
        title: copy?.title || definition.name,
        w: copy?.w || (id === "ambient-chart" ? 12 : 6),
        h:
          copy?.h ||
          (id === "ambient-chart"
            ? 22
            : id === "ascii-background"
              ? 8
              : ["button", "status", "breadcrumbs"].includes(id)
                ? 2
                : id === "field"
                  ? 4
                  : 6),
        props: copy?.props || defaultProps(id),
      };
      store.add(item);
      select(item.id);
      warning("Компонент добавлен.");
    } catch (error) {
      warning(error.message);
    }
  }
  width.addEventListener(
    "change",
    () => {
      if (width.checkValidity()) store.width(Number(width.value));
      else width.reportValidity();
    },
    options,
  );
  paletteInput.addEventListener(
    "change",
    () => {
      applyProfile();
      for (const record of mounted.values()) record.signature = null;
      synchronize(store.document);
    },
    options,
  );
  const disposeGestures = bindSandboxGestures({
    root,
    canvas,
    viewport,
    separator,
    getItems: () => store.document.items,
    getItem: (id) => store.document.items.find((item) => item.id === id),
    select,
    commit: (id, patch) => store.patch(id, patch),
    widthChanged: (value) => store.width(value),
    onNotice: warning,
  });
  root.addEventListener(
    "keydown",
    (event) => {
      if (
        event.target.closest('input,textarea,select,[contenteditable="true"]')
      )
        return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) store.redo();
        else store.undo();
        refreshInspector();
      }
    },
    options,
  );
  synchronize(store.document);
  applyProfile();
  refreshInspector();
  return {
    element: root,
    addComponent,
    get document() {
      return store.document;
    },
    /** Gridv1 remains editable; explicit import into v2 avoids capturing editor handles as product UI. */
    async captureSnapshot() {
      throw new Error(
        "Для карты текущей композиции откройте режим «Композиция и проверки» и явно импортируйте сетку v1.",
      );
    },
    dispose() {
      disposed = true;
      disposeGestures();
      abort.abort();
      for (const record of mounted.values()) record.sample.dispose?.();
      mounted.clear();
    },
  };
}

/** Keep legacy grid documents accessible; workspace callers explicitly choose composition as their primary editor. */
export function createSandbox(options) {
  const legacy = createLegacySandbox(options);
  const original = [...legacy.element.children];
  const holder = h("div", {
    className: "sandbox-composition-host",
    hidden: true,
  });
  let composition = null,
    active = false;
  /** Preserve both editors; mode changes never migrate or overwrite a document implicitly. */
  function setMode(mode) {
    active = mode === "composition";
    if (active && !composition) {
      composition = createCompositionEditor({
        ...options,
        legacyDocument: () => legacy.document,
      });
      holder.append(composition.element);
    }
    for (const child of original) child.hidden = active;
    holder.hidden = !active;
    toggle.textContent = active ? "Сетка v1" : "Композиция и проверки";
    toggle.setAttribute("aria-pressed", String(active));
    legacy.element.dispatchEvent(
      new legacy.element.ownerDocument.defaultView.CustomEvent(
        "ag-design:composition-context",
        { bubbles: true },
      ),
    );
  }
  const toggle = createButton({
    label: "Композиция и проверки",
    variant: "quiet",
    onClick: () => setMode(active ? "legacy" : "composition"),
  });
  toggle.setAttribute("aria-pressed", "false");
  // Both retained editors remain visibly reachable; changing modes never imports or overwrites content.
  const legacyTools = h(
    "nav",
    { className: "sandbox-legacy-tools", "aria-label": "Редакторы песочницы" },
    toggle,
  );
  legacy.element.append(holder);
  legacy.element.prepend(legacyTools);
  if (options.initialMode === "composition") setMode("composition");
  return {
    element: legacy.element,
    toolbar: legacyTools,
    get context() {
      return active
        ? composition?.context
        : {
            kind: "legacy",
            documentId: "sandbox-grid-v1",
            revision: null,
            documentHash: null,
          };
    },
    async addComponent(id) {
      if (active) await composition.addComponent(id);
      else legacy.addComponent(id);
    },
    async captureSnapshot() {
      return active ? composition.captureSnapshot() : legacy.captureSnapshot();
    },
    dispose() {
      composition?.dispose();
      legacy.dispose();
    },
  };
}

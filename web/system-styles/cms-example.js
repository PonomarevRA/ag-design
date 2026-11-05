import { disposeOnPageExit } from "./demo-page-lifecycle.js";
import { compactDemoEditorToolbar } from "./demo-editor-toolbar.js?v=demo-systems-3";
import { createDemoState } from "./demo-state.js";
import { mountDemoSystem } from "./demo-shell.js?v=demo-systems-5";
import { getLocaleRuntime } from "./vendor/lab/locale.js";
import { createMarkdownEditor } from "./vendor/cms/editor.js";
import { createCmsState, visibleMaterials, cmsSummary } from "./cms-model.js";

/** Compose the existing Markdown editor with local CMS metadata, draft preservation and literal list rendering. */
export function mountCmsExample(doc = document) {
  const localeRuntime = getLocaleRuntime(doc);
  const initial = { ...createCmsState(), drafts: [] };
  const template = { ...initial, drafts: [initial.items[0]] };
  const store = createDemoState({
    window: doc.defaultView,
    style: doc.documentElement.dataset.style,
    scope: "cms",
    initial,
    template,
    validate: (value) =>
      value.items.length > 0 &&
      value.items.length <= 30 &&
      value.items.some((item) => item.id === value.selected) &&
      value.items.every(
        (item) =>
          /^[a-z0-9-]{1,64}$/.test(item.id) &&
          ["draft", "published"].includes(item.status),
      ) &&
      Number.isInteger(value.nextId) &&
      value.nextId > 0,
  });
  const state = store.state,
    byId = (id) => doc.getElementById(id),
    drafts = new Map(state.drafts.map((item) => [item.id, item]));
  const events = new doc.defaultView.AbortController();
  const listen = (node, name, action) =>
    node.addEventListener(name, action, { signal: events.signal });
  let disposed = false,
    editor = null,
    editorToolbar = null;
  const selected = () => state.items.find((item) => item.id === state.selected);
  /** Literal text nodes keep content titles and status values out of HTML parsing. */
  function element(tag, text, className) {
    const node = doc.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  /** Persist explicit saved records and separate unsaved drafts; neither operation publishes content. */
  function persistDrafts() {
    state.drafts = [...drafts].map(([id, draft]) => ({ id, ...draft }));
    return store.save();
  }
  /** Preserve metadata and editor text before switching records; saving remains a separate explicit action. */
  function stashDraft() {
    if (editor) {
      const draft = {
        title: byId("cms-title").value,
        category: byId("cms-category").value,
        status: byId("cms-status").value,
        excerpt: byId("cms-excerpt").value,
        body: editor.value,
      };
      const saved = selected();
      let dirty = false;
      for (const key of Object.keys(draft))
        if (draft[key] !== saved[key]) dirty = true;
      if (dirty) drafts.set(state.selected, draft);
      else drafts.delete(state.selected);
    }
    persistDrafts();
  }
  /** Reconcile metrics from saved records, never from decorative illustration bars. */
  function renderSummary() {
    const summary = cmsSummary(state);
    for (const [id, value] of Object.entries(summary))
      byId(`cms-${id}`).textContent = value;
    if (byId("cms-summary-title"))
      byId("cms-summary-title").textContent =
        `Материалы: ${summary.total} · Черновики: ${summary.drafts}`;
  }
  /** Render stable record identities and restore keyboard focus when selection changes. */
  function renderList(focusId = null) {
    const host = byId("cms-items"),
      visible = visibleMaterials(
        state,
        byId("cms-search").value,
        byId("cms-filter").value,
      );
    host.replaceChildren();
    for (const item of visible) {
      const button = element("button", undefined, "material-item");
      button.type = "button";
      button.dataset.material = item.id;
      button.setAttribute("aria-pressed", String(item.id === state.selected));
      const icon = element(
        "span",
        item.category === "Статья"
          ? "Aa"
          : item.category === "Страница"
            ? "▤"
            : "✦",
        "material-icon",
      );
      icon.setAttribute("aria-hidden", "true");
      const copy = element("span", undefined, "material-copy");
      copy.append(
        element("strong", item.title),
        element(
          "span",
          `${item.category} · ${item.status === "published" ? "Опубликовано в демо" : "Черновик"}`,
        ),
      );
      button.append(icon, copy);
      listen(button, "click", () => {
        if (item.id === state.selected) return;
        stashDraft();
        state.selected = item.id;
        renderSelected();
        renderList(item.id);
      });
      host.append(button);
    }
    byId("cms-list-count").textContent =
      `Показано ${visible.length} из ${state.items.length}`;
    byId("cms-empty").hidden = visible.length > 0;
    if (focusId) host.querySelector(`[data-material="${focusId}"]`)?.focus();
  }
  /** Save one selected snapshot locally after native title validation; no transport or filesystem write is implied. */
  function saveDraft({ markdown }) {
    if (disposed) return false;
    if (!byId("cms-title").value.trim()) {
      byId("cms-title").focus();
      return "Укажите заголовок материала";
    }
    const item = selected();
    Object.assign(item, {
      title: byId("cms-title").value.trim(),
      category: byId("cms-category").value,
      status: byId("cms-status").value,
      excerpt: byId("cms-excerpt").value,
      body: markdown,
    });
    drafts.delete(item.id);
    const saved = persistDrafts();
    byId("cms-save-state").textContent = saved
      ? "Сохранено в этом браузере"
      : "Хранилище недоступно: сохранено до перезагрузки";
    byId("cms-announcement").textContent =
      `Материал «${item.title}» сохранён локально`;
    byId("cms-selected-title").textContent = item.title;
    renderList();
    renderSummary();
    return true;
  }
  /** Load only the selected local snapshot; the editor's bounded parser owns safe Markdown rendering/history. */
  function renderSelected() {
    const item = selected(),
      draft = drafts.get(item.id) || item;
    byId("cms-selected-title").textContent = item.title;
    byId("cms-title").value = draft.title;
    byId("cms-category").value = draft.category;
    byId("cms-status").value = draft.status;
    byId("cms-excerpt").value = draft.excerpt;
    if (editor)
      editor.setMarkdown(draft.body, {
        addToHistory: false,
        markSaved: !drafts.has(item.id),
      });
    else {
      editor = createMarkdownEditor({
        document: doc,
        i18n: localeRuntime.context,
        markdown: draft.body,
        label: "Текст материала",
        mode: doc.defaultView.innerWidth <= 760 ? "edit" : "split",
        height: 340,
        previewDelay: 80,
        onChange: () => {
          stashDraft();
          byId("cms-save-state").textContent =
            "Черновик: есть несохранённые изменения";
        },
        onSave: saveDraft,
      });
      byId("cms-editor").replaceChildren(editor.element);
      editorToolbar = compactDemoEditorToolbar(editor, doc);
    }
    byId("cms-save-state").textContent = drafts.has(item.id)
      ? "Черновик восстановлен"
      : "Локальный материал";
    persistDrafts();
  }
  /** Add a bounded independent local draft and focus its title rather than changing another record. */
  function createMaterial() {
    if (state.items.length >= 30) {
      byId("cms-announcement").textContent =
        "В примере доступно до 30 материалов";
      return;
    }
    stashDraft();
    const id = `new-${state.nextId++}`;
    state.items.unshift({
      id,
      title: "Новый материал",
      category: "Статья",
      status: "draft",
      excerpt: "",
      body: "# Новая история\n\nНачните с главного.",
    });
    state.selected = id;
    byId("cms-search").value = "";
    byId("cms-filter").value = "all";
    renderSelected();
    renderList();
    renderSummary();
    byId("cms-title").focus();
    byId("cms-title").select();
  }
  const onSearch = () => renderList();
  listen(byId("cms-search"), "input", onSearch);
  listen(byId("cms-filter"), "change", onSearch);
  listen(byId("cms-create"), "click", createMaterial);
  for (const id of ["cms-title", "cms-category", "cms-status", "cms-excerpt"])
    listen(byId(id), "input", () => {
      stashDraft();
      byId("cms-save-state").textContent =
        "Черновик: есть несохранённые изменения";
    });
  renderSelected();
  renderList();
  renderSummary();
  const metrics = doc.querySelector(".cms-metrics");
  const overview = element("details", undefined, "demo-cms-summary");
  const overviewTitle = element("summary");
  overviewTitle.id = "cms-summary-title";
  metrics.before(overview);
  overview.append(overviewTitle, metrics);
  renderSummary();
  const system = mountDemoSystem({ document: doc });
  /** Release the component's editor/history, preview timer and observers on page exit. */
  function dispose() {
    if (disposed) return;
    stopExitCleanup();
    stashDraft();
    disposed = true;
    system?.dispose();
    events.abort();
    editorToolbar?.dispose();
    editor.dispose();
    byId("cms-search").removeEventListener("input", onSearch);
    byId("cms-filter").removeEventListener("change", onSearch);
    byId("cms-create").removeEventListener("click", createMaterial);
  }
  const stopExitCleanup = disposeOnPageExit(doc.defaultView, dispose);
  return { editor, state, dispose };
}
if (typeof document !== "undefined" && document.getElementById("cms-editor"))
  mountCmsExample();

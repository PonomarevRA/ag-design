import { createDemoState } from "./demo-state.js";

/** Literal DOM construction for authored controls and untrusted, locally edited record text. */
function node(doc, tag, text, className) {
  const result = doc.createElement(tag);
  if (text !== undefined) result.textContent = text;
  if (className) result.className = className;
  return result;
}

/** Mount a bounded local collection/editor; the host owns field definitions and optional apply behavior. */
export function mountDemoRecords({
  document: doc,
  style,
  config,
  onApply,
  getNewRecord,
}) {
  const win = doc.defaultView;
  const initial = {
    items: config.items.map((item) => ({ ...item, archived: false })),
    selected: config.items[0].id,
  };
  /** Reject invalid IDs, duplicate rows and values outside the authored field contract on both read and write. */
  function validate(data) {
    if (
      data.items.length > 50 ||
      new Set(data.items.map((item) => item.id)).size !== data.items.length
    )
      return false;
    for (const item of data.items) {
      if (!/^[a-z0-9-]{1,64}$/.test(item.id)) return false;
      for (const field of config.fields) {
        const value = item[field.key];
        if (
          field.type === "number" &&
          (!Number.isFinite(value) || value < field.min || value > field.max)
        )
          return false;
        if (
          field.options &&
          !field.options.some((option) => option.value === value)
        )
          return false;
        if (
          typeof value === "string" &&
          value.length > (field.maxLength || 1000)
        )
          return false;
      }
    }
    return true;
  }
  const store = createDemoState({
    window: win,
    style,
    scope: "records",
    initial,
    validate,
  });
  const state = store.state;
  const events = new win.AbortController();
  let rows = new win.AbortController();
  const root = node(doc, "section", undefined, "demo-records demo-wide");
  root.id = "demo-records";
  root.setAttribute("aria-label", config.title);
  const collection = node(doc, "section", undefined, "demo-collection");
  const header = node(doc, "div", undefined, "demo-section-heading");
  const title = node(doc, "h2", config.title);
  const create = node(doc, "button", config.createLabel, "demo-primary");
  create.type = "button";
  header.append(title, create);
  const searchLabel = node(doc, "label", "Поиск");
  const search = node(doc, "input");
  search.type = "search";
  search.placeholder = config.searchPlaceholder || "Название или заметка";
  searchLabel.append(search);
  const filterLabel = node(doc, "label", "Показывать");
  const filter = node(doc, "select");
  for (const [value, label] of [
    ["active", "Рабочие записи"],
    ["archived", "Архив"],
    ["all", "Все записи"],
  ]) {
    const option = node(doc, "option", label);
    option.value = value;
    filter.append(option);
  }
  filterLabel.append(filter);
  const tools = node(doc, "div", undefined, "demo-search-row");
  tools.append(searchLabel, filterLabel);
  const count = node(doc, "p", undefined, "demo-muted");
  const list = node(doc, "div", undefined, "demo-record-list");
  const empty = node(
    doc,
    "p",
    "Ничего не найдено. Измените поиск или создайте запись.",
    "demo-empty",
  );
  collection.append(header, tools, count, list, empty);
  const form = node(doc, "form", undefined, "demo-record-editor");
  form.setAttribute("aria-label", config.editorLabel);
  const formTitle = node(doc, "h2", config.editorLabel);
  const note = node(doc, "p", config.description, "demo-muted");
  const fields = node(doc, "div", undefined, "demo-fields");
  const inputs = new Map();
  for (const field of config.fields) {
    const label = node(doc, "label", field.label);
    const input = node(
      doc,
      field.options
        ? "select"
        : field.type === "textarea"
          ? "textarea"
          : "input",
    );
    input.name = field.key;
    input.id = `demo-record-${field.key}`;
    if (input.tagName === "INPUT") input.type = field.type || "text";
    if (field.type === "textarea") {
      input.rows = 4;
      label.className = "demo-span";
    }
    if (field.options)
      for (const option of field.options) {
        const item = node(doc, "option", option.label);
        item.value = option.value;
        input.append(item);
      }
    input.required = Boolean(field.required);
    if (field.maxLength) input.maxLength = field.maxLength;
    if (field.type === "number") {
      input.min = String(field.min);
      input.max = String(field.max);
      input.step = "1";
    }
    label.append(input);
    inputs.set(field.key, input);
    fields.append(label);
  }
  const actions = node(doc, "div", undefined, "demo-actions");
  const save = node(doc, "button", "Сохранить", "demo-primary");
  save.type = "submit";
  const apply = node(
    doc,
    "button",
    config.applyLabel || "Открыть в рабочей области",
  );
  apply.type = "button";
  apply.hidden = typeof onApply !== "function";
  const archive = node(doc, "button", "В архив");
  archive.type = "button";
  const status = node(
    doc,
    "p",
    "Данные этого примера сохраняются только в браузере.",
    "demo-save-status",
  );
  status.setAttribute("role", "status");
  actions.append(save, apply, archive);
  form.append(formTitle, note, fields, actions, status);
  root.append(collection, form);
  let editingId = state.items.some((item) => item.id === state.selected)
    ? state.selected
    : state.items[0]?.id;

  /** Keep the editor nodes mounted while selecting records; selecting never commits another record's fields. */
  function showRecord(item) {
    editingId = item.id;
    state.selected = item.id;
    for (const field of config.fields)
      inputs.get(field.key).value = item[field.key];
    archive.hidden = !state.items.some((record) => record.id === item.id);
    archive.textContent = item.archived ? "Восстановить" : "В архив";
    apply.disabled = archive.hidden || item.archived;
    formTitle.textContent = item.name || config.editorLabel;
    status.textContent = item.archived
      ? "Запись в архиве. Её можно восстановить."
      : "Измените поля и сохраните запись.";
  }

  /** Render searchable literal record buttons and retain the activated list button's keyboard focus. */
  function renderList(focusId = null) {
    rows.abort();
    rows = new win.AbortController();
    const needle = search.value.trim().toLocaleLowerCase("ru");
    list.replaceChildren();
    let shown = 0;
    for (const item of state.items) {
      if (filter.value === "active" && item.archived) continue;
      if (filter.value === "archived" && !item.archived) continue;
      if (
        !Object.values(item).join(" ").toLocaleLowerCase("ru").includes(needle)
      )
        continue;
      shown++;
      const button = node(doc, "button", undefined, "demo-record-row");
      button.type = "button";
      button.dataset.recordId = item.id;
      button.setAttribute("aria-pressed", String(item.id === editingId));
      button.append(
        node(doc, "strong", item.name),
        node(doc, "span", item.note || config.description),
      );
      if (item.status) {
        const field = config.fields.find((value) => value.key === "status");
        const text =
          field?.options?.find((value) => value.value === item.status)?.label ||
          item.status;
        button.append(node(doc, "small", item.archived ? "В архиве" : text));
      }
      button.addEventListener(
        "click",
        () => {
          showRecord(item);
          renderList(item.id);
          store.save();
        },
        { signal: rows.signal },
      );
      list.append(button);
    }
    count.textContent = `Показано ${shown} из ${state.items.length}`;
    empty.hidden = shown !== 0;
    if (focusId)
      for (const button of list.querySelectorAll("button")) {
        if (button.dataset.recordId === focusId)
          button.focus({ preventScroll: true });
      }
  }

  create.addEventListener(
    "click",
    () => {
      if (state.items.length >= 50) {
        status.textContent =
          "В демо доступно до 50 записей. Используйте существующие записи.";
        return;
      }
      const item = {
        ...config.items[0],
        ...(getNewRecord?.() || {}),
        id: win.crypto.randomUUID(),
        name: "",
        note: "",
        archived: false,
      };
      showRecord(item);
      renderList();
      inputs.get("name").focus();
    },
    { signal: events.signal },
  );
  form.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const index = state.items.findIndex((item) => item.id === editingId);
      const item = {
        id: editingId,
        archived: index >= 0 ? state.items[index].archived : false,
      };
      for (const field of config.fields) {
        const value = inputs.get(field.key).value;
        item[field.key] =
          field.type === "number" ? Number(value) : value.trim();
      }
      if (!item.name) {
        inputs.get("name").focus();
        status.textContent = "Укажите название записи.";
        return;
      }
      if (index < 0) state.items.unshift(item);
      else state.items[index] = item;
      state.selected = item.id;
      const saved = store.save();
      showRecord(item);
      renderList();
      status.textContent = saved
        ? "Сохранено в этом браузере."
        : "Хранилище недоступно. Запись доступна до перезагрузки.";
    },
    { signal: events.signal },
  );
  archive.addEventListener(
    "click",
    () => {
      const item = state.items.find((record) => record.id === editingId);
      if (!item) return;
      item.archived = !item.archived;
      store.save();
      showRecord(item);
      renderList();
    },
    { signal: events.signal },
  );
  apply.addEventListener(
    "click",
    () => {
      const item = state.items.find((record) => record.id === editingId);
      if (item && !item.archived) onApply?.({ ...item });
    },
    { signal: events.signal },
  );
  search.addEventListener("input", () => renderList(), {
    signal: events.signal,
  });
  filter.addEventListener("change", () => renderList(), {
    signal: events.signal,
  });
  if (editingId) showRecord(state.items.find((item) => item.id === editingId));
  renderList();
  return {
    element: root,
    state,
    dispose() {
      rows.abort();
      events.abort();
    },
  };
}

import { createButton, createTabs } from "./vendor/ag-design/index.js";
import { createStudioClient } from "./studio-client.js";
import { createCompositionClient } from "./composition-client.js";
import { createStudioBoard } from "./studio-board.js";
import { createStudioJourney } from "./studio-journey.js";
import {
  initialStudio,
  studioId,
  screenFromComposition,
  exampleComposition,
  removeScreen,
} from "./studio-model.js";
import { h } from "./dom.js";
import { createStudioTrialPanel } from "./studio-trial-panel.js";
import { createStudioActivity } from "./studio-activity.js";

/** Bounded field factory uses existing AG form classes and literal values, never source markup. */
function field(label, value, options = {}) {
  const input = h(options.multiline ? "textarea" : "input", {
    type: options.type || "text",
    maxlength: options.multiline ? 4096 : 256,
    ...(options.min !== undefined ? { min: options.min } : {}),
    ...(options.max !== undefined ? { max: options.max } : {}),
  });
  input.value = value ?? "";
  return {
    element: h(
      "label",
      { className: "ag-field" },
      h("span", { className: "ag-field__label" }, label),
      input,
    ),
    input,
  };
}

/** One revisioned brand-board and journey editor. Only the selected screen runs a preview; edits share the server command bus. */
export function createBrandStudio({
  components = [],
  profiles = [],
  palette = "design",
  initialComposition = null,
  client,
  compositionClient,
  storage,
  onOpenComposition,
} = {}) {
  if (storage === undefined) {
    try {
      storage = globalThis.localStorage;
    } catch {
      storage = null;
    }
  }
  const abort = new AbortController();
  client ||= createStudioClient({ signal: abort.signal });
  compositionClient ||= createCompositionClient({ signal: abort.signal });
  let authorId;
  try {
    authorId = storage?.getItem("ag-design:studio:author");
  } catch {
    /* A denied pointer store never prevents server persistence. */
  }
  authorId ||= studioId("human");
  try {
    storage?.setItem("ag-design:studio:author", authorId);
  } catch {
    /* Own undo stays available for this mounted session. */
  }
  const status = h("p", {
    className: "studio-status",
    role: "status",
    "aria-live": "polite",
  });
  const content = h("div", { className: "studio-content" });
  const inspector = h("aside", {
    className: "studio-inspector",
    "aria-label": "Свойства доски и экрана",
  });
  const library = h("select", { "aria-label": "Сохранённые бренд-буки" });
  const toolbar = h("div", { className: "studio-toolbar" });
  const root = h(
    "section",
    { className: "brand-studio", "aria-label": "Бренд-бук и клиентские пути" },
    toolbar,
    status,
    h("div", { className: "studio-layout" }, content, inspector),
  );
  let state = null,
    selected = null,
    mode = "board",
    busy = false,
    isTesting = false,
    disposed = false,
    pending = null,
    importHandled = false;
  const buttons = [];
  const retentionLabel = h("span");
  const retentionEditor = h("span", { className: "studio-retention-editor" });
  const retention = h(
    "div",
    {
      className: "studio-retention",
      "aria-live": "polite",
    },
    retentionLabel,
    retentionEditor,
  );
  toolbar.after(retention);
  /** Update the deadline without replacing an open editor, its selected window or keyboard focus. */
  function retentionText() {
    if (!state) {
      retentionLabel.textContent = "";
      return;
    }
    retentionLabel.textContent =
      state.retention?.mode === "temporary"
        ? `Временный путь · до ${new Date(state.retention.expiresAt * 1000).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })} · срок продлевается при работе с доской`
        : "Постоянная доска · результаты прохождения хранятся временно";
  }
  const activity = createStudioActivity({
    element: root,
    client,
    getDocumentId: () => state?.documentId,
    onTouch(result, error) {
      if (disposed) return;
      if (result && state?.retention?.mode === "temporary") {
        state.retention.expiresAt = result.expiresAt;
        retentionText();
      }
      if (error)
        status.textContent = `Продлить хранение не удалось: ${error.message}. Сохранённый срок не изменён.`;
    },
  });

  /** All commands enter through one busy fence; failures retain the exact request for explicit recovery. */
  async function run(operation) {
    if (busy || isTesting || disposed) return;
    const before = root.ownerDocument.activeElement;
    const label = before?.closest("label")?.textContent;
    const heading = before?.closest("form")?.querySelector("h3")?.textContent;
    const buttonText =
      before?.localName === "button" ? before.textContent : null;
    busy = true;
    setBusy();
    try {
      await operation();
    } catch (error) {
      if (error.code && error.code !== "transport") pending = null;
      if (!disposed)
        status.textContent = `${error.message}. ${pending ? "Команда сохранена для точного повтора. Проверьте состояние или повторите ту же команду." : "Данные на сервере не заменены неподтверждённым результатом."}`;
    } finally {
      busy = false;
      if (!disposed) {
        setBusy();
        // An acknowledged edit may replace controls. Restore only focus lost to that replacement, never a new user choice.
        const active = root.ownerDocument.activeElement;
        if (active === before || active === root.ownerDocument.body) {
          let replacement = null;
          if (label)
            for (const candidate of inspector.querySelectorAll("label")) {
              if (
                candidate.textContent === label &&
                candidate.closest("form")?.querySelector("h3")?.textContent ===
                  heading
              )
                replacement = candidate.querySelector("input,textarea,select");
            }
          if (buttonText)
            replacement = [...root.querySelectorAll("button")].find(
              (button) => button.textContent === buttonText && !button.disabled,
            );
          replacement?.focus();
        }
      }
    }
  }

  /** Existing AG buttons keep actions keyboard-accessible and use host semantic profiles. */
  function button(label, action, variant = "secondary") {
    const element = createButton({
      label,
      variant,
      onClick: () => run(action),
    });
    buttons.push(element);
    return element;
  }

  /** A server acknowledgement is the sole committed document source. */
  function accept(value) {
    if (disposed) return;
    state = value;
    pending = null;
    retentionEditor.replaceChildren();
    try {
      storage?.setItem("ag-design:studio:document", state.documentId);
    } catch {
      /* Visible ID and list remain usable. */
    }
    if (
      selected?.kind === "object" &&
      !state.document.board.objects.some((item) => item.id === selected.id)
    )
      selected = null;
    if (
      selected?.kind === "screen" &&
      !state.document.screens.some((item) => item.id === selected.id)
    )
      selected = null;
    board.update(
      state.document.board,
      selected?.kind === "object" ? selected.id : null,
      busy,
    );
    journey.update(state);
    trialPanel.update(state);
    retentionText();
    renderInspector();
    status.textContent = `${state.document.title} · ревизия ${state.revision} · ${state.documentId}. Сохранено локально.`;
  }

  /** Commit a whole validated document under CAS; there is no optimistic replacement of acknowledged state. */
  async function replace(document) {
    requireResolvedCommand();
    pending = {
      documentId: state.documentId,
      expectedRevision: state.revision,
      idempotencyKey: studioId("command"),
      authorId,
      kind: "replace",
      document,
    };
    accept(await client.command(pending));
  }
  async function edit(change) {
    if (!state || disposed) return;
    requireResolvedCommand();
    const next = structuredClone(state.document);
    change(next);
    await replace(next);
  }

  /** Selection is shared by board, object list, graph and inspector. */
  function select(kind, id) {
    if (isTesting) return;
    selected = { kind, id };
    if (state)
      board.update(
        state.document.board,
        kind === "object" ? id : null,
        busy || isTesting || !!pending,
      );
    if (kind === "screen") journey.select(id);
    renderInspector();
  }
  const board = createStudioBoard({
    onSelect: (id) => select("object", id),
    onCommit: (id, next) =>
      run(() =>
        edit((document) => {
          document.board.objects = document.board.objects.map((item) =>
            item.id === id ? next : item,
          );
        }),
      ),
  });
  const journey = createStudioJourney({
    definitions: components,
    profiles,
    palette,
    onSelect: (id) => select("screen", id),
    onActivity: () => activity.noteInput(),
  });
  const trialPanel = createStudioTrialPanel({
    client,
    journey,
    onEdit: (change) => run(() => edit(change)),
    onRunningChange(value) {
      isTesting = value;
      setBusy();
    },
  });
  journey.element.prepend(trialPanel.element);
  journey.setActive(false);
  const tabs = createTabs({
    label: "Бренд-доска и клиентский путь",
    value: "board",
    activation: "manual",
    tabs: [
      {
        id: "board",
        label: "Бренд-доска",
        lifecycle: "preserve",
        mount: () => board.element,
      },
      {
        id: "journey",
        label: "Клиентские пути",
        lifecycle: "preserve",
        mount: () => journey.element,
      },
    ],
    onChange: (value) => {
      if (isTesting && value !== "journey") return;
      mode = value;
      journey.setActive(mode === "journey");
      renderInspector();
    },
  });
  content.append(tabs.element);

  /** List metadata without loading all screen renderers or losing the explicit selected document. */
  async function refreshList() {
    const result = await client.list();
    if (disposed) return;
    library.replaceChildren(
      h("option", { value: "" }, "Открыть сохранённую доску…"),
    );
    for (const item of result.items)
      library.append(
        h(
          "option",
          { value: item.documentId },
          `${item.title} · r${item.revision}${item.retention?.mode === "temporary" ? " · временный" : ""}`,
        ),
      );
    library.value = state?.documentId || "";
  }
  library.addEventListener(
    "change",
    () =>
      run(async () => {
        if (library.value) {
          selected = null;
          accept(await client.inspect({ documentId: library.value }));
        }
      }),
    { signal: abort.signal },
  );

  /** Hold a timed-out mutation until explicit recovery; a new edit must not erase its operation identity. */
  function requireResolvedCommand() {
    if (pending)
      throw new Error(
        "Сначала проверьте, повторите или явно сбросьте неподтверждённую команду",
      );
  }

  /** New boards start explicitly; opening the UI alone never creates durable documents. */
  async function create(temporary = false) {
    requireResolvedCommand();
    selected = null;
    const document = initialStudio();
    if (temporary) {
      document.board.objects = [];
      document.title = "Новый клиентский путь";
    }
    accept(
      await client.create({
        document,
        authorId,
        ...(temporary ? { ttlSeconds: 86400 } : {}),
      }),
    );
    if (temporary) tabs.setValue("journey", { emit: true });
    await refreshList();
    board.fit();
  }
  async function history(kind) {
    if (!state) return;
    requireResolvedCommand();
    pending = {
      documentId: state.documentId,
      expectedRevision: state.revision,
      idempotencyKey: studioId(kind),
      authorId,
      kind,
    };
    accept(await client.command(pending));
  }
  const undo = button("Отменить", () => history("undo"), "quiet");
  const redo = button("Повторить", () => history("redo"), "quiet");
  const retry = button(
    "Повторить команду",
    async () => {
      if (pending) accept(await client.command(pending));
    },
    "quiet",
  );
  const inspectCurrent = button(
    "Проверить состояние",
    async () => {
      if (!state) return;
      const held = pending;
      accept(await client.inspect({ documentId: state.documentId }));
      // Reading current state does not establish whether a different, ambiguous command committed earlier.
      if (held) {
        pending = held;
        status.textContent +=
          " Неподтверждённая команда сохранена для точного повтора или явного сброса.";
      }
    },
    "quiet",
  );
  const discard = button(
    "Сбросить неподтверждённую команду",
    async () => {
      pending = null;
      status.textContent =
        "Неподтверждённая команда сброшена. Перед новым редактированием проверьте текущее состояние.";
    },
    "quiet",
  );

  /** Export acknowledged server geometry; downloadable blobs are revoked promptly after the browser consumes them. */
  async function download(format) {
    if (!state) return;
    const result = await client.export({
      documentId: state.documentId,
      expectedRevision: state.revision,
      format,
    });
    if (disposed) return;
    const url = URL.createObjectURL(
      new Blob(
        [
          result.encoding === "base64"
            ? Uint8Array.from(atob(result.content), (char) =>
                char.charCodeAt(0),
              )
            : result.content,
        ],
        { type: result.mediaType },
      ),
    );
    const link = h("a", {
      href: url,
      download: `ag-brand-${state.documentId}${format === "tokens" ? ".tokens.json" : `.${format}`}`,
    });
    root.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent =
      format === "pptx"
        ? "PPTX: редактируемый граф, схемы компонентов и наблюдения. Живые формы и браузерные снимки в файл не переносятся."
        : format === "svg"
          ? "SVG: векторная доска без внешних ресурсов. Native-компоненты Figma и интерактивность в SVG не переносятся."
          : "Экспорт готов. JSON сохраняет модель и снимки; tokens — цвета DTCG 2025.10.";
  }
  toolbar.append(
    library,
    button("Новая доска", () => create()),
    button("Новый временный путь", () => create(true)),
    button("Срок хранения…", async () => {
      if (!state || state.retention?.mode !== "temporary") {
        status.textContent =
          "Срок задаётся только временной доске. Создайте временную копию.";
        return;
      }
      retentionEditor.replaceChildren(
        h("span", {}, "Продлевать срок при работе с доской на: "),
      );
      const duration = h("select", {
        "aria-label": "Окно временного хранения",
      });
      for (const [seconds, label] of [
        [3600, "1 час"],
        [86400, "24 часа"],
        [604800, "7 дней"],
      ])
        duration.append(h("option", { value: seconds }, label));
      duration.value = String(state.retention.ttlSeconds);
      const apply = createButton({
        label: "Применить",
        variant: "quiet",
        onClick: () =>
          run(async () => {
            accept(
              await client.extend({
                documentId: state.documentId,
                expectedRevision: state.revision,
                ttlSeconds: Number(duration.value),
              }),
            );
          }),
      });
      retentionEditor.append(duration, apply);
    }),
    button("Временная копия 24 ч", async () => {
      if (!state) return;
      accept(
        await client.temporaryCopy({
          documentId: state.documentId,
          expectedRevision: state.revision,
          authorId,
          ttlSeconds: 86400,
        }),
      );
      await refreshList();
      tabs.setValue("journey", { emit: true });
    }),
    undo,
    redo,
    inspectCurrent,
    retry,
    discard,
    button("SVG", () => download("svg")),
    button("JSON", () => download("json")),
    button("PPTX", () => download("pptx")),
    button("Цветовые токены", () => download("tokens")),
  );

  /** Disable mutation while a command is outstanding; a second event cannot silently race the server revision. */
  function setBusy() {
    root.setAttribute("aria-busy", String(busy));
    library.disabled = busy || isTesting || !!pending;
    for (const tab of tabs.element.querySelectorAll('[role="tab"]'))
      tab.disabled = isTesting;
    trialPanel.element.inert = busy || !!pending;
    for (const control of retention.querySelectorAll("button,select"))
      control.disabled = busy || isTesting || !!pending;
    for (const element of buttons)
      element.disabled = busy || isTesting || !!pending;
    undo.disabled = busy || isTesting || !!pending || !state?.canUndo;
    redo.disabled = busy || isTesting || !!pending || !state?.canRedo;
    retry.hidden = !pending;
    retry.disabled = busy || !pending;
    discard.hidden = !pending;
    discard.disabled = busy || !pending;
    inspectCurrent.disabled = busy || isTesting || !state;
    if (state)
      board.update(
        state.document.board,
        selected?.kind === "object" ? selected.id : null,
        busy || isTesting || !!pending,
      );
    for (const control of inspector.querySelectorAll(
      "input,textarea,button,select",
    ))
      control.disabled =
        busy ||
        isTesting ||
        !!pending ||
        !state ||
        control.dataset.studioReadOnly === "true";
  }

  /** Apply a small group of related fields as one history entry rather than one request for every keystroke. */
  function form(title, values, apply) {
    const element = h(
      "form",
      { className: "studio-property-form" },
      h("h3", {}, title),
    );
    const entries = {};
    for (const [key, definition] of Object.entries(values)) {
      const editor = field(definition.label, definition.value, definition);
      entries[key] = editor.input;
      element.append(editor.element);
    }
    const submit = createButton({ label: "Применить", variant: "secondary" });
    submit.type = "submit";
    element.append(submit);
    element.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        if (!element.reportValidity()) return;
        run(() =>
          apply(
            Object.fromEntries(
              Object.entries(entries).map(([key, input]) => [
                key,
                input.type === "number" ? Number(input.value) : input.value,
              ]),
            ),
          ),
        );
      },
      { signal: abort.signal },
    );
    inspector.append(element);
    return entries;
  }

  /** Board parameters, brief and selected object all edit the same serializable model. */
  function boardInspector() {
    const document = state.document;
    form(
      "Бриф и бренд",
      {
        title: { label: "Название", value: document.title },
        audience: {
          label: "Аудитория",
          value: document.brief.audience,
          multiline: true,
        },
        goal: {
          label: "Задача человека",
          value: document.brief.goal,
          multiline: true,
        },
        positioning: {
          label: "Позиционирование и характер",
          value: document.brief.positioning,
          multiline: true,
        },
        evidence: {
          label: "Факты, гипотезы, измерения",
          value: document.brief.evidence,
          multiline: true,
        },
        width: {
          label: "Ширина доски, px",
          value: document.board.width,
          type: "number",
          min: 240,
          max: 4096,
        },
        height: {
          label: "Высота доски, px",
          value: document.board.height,
          type: "number",
          min: 200,
          max: 4096,
        },
        background: {
          label: "Фон доски",
          value: document.board.background,
          type: "color",
        },
      },
      (values) =>
        edit((next) => {
          const { title, width, height, background, ...brief } = values;
          Object.assign(next, { title, brief });
          Object.assign(next.board, { width, height, background });
        }),
    );
    const add = h("div", { className: "studio-toolbar" });
    for (const [type, label] of [
      ["text", "Текст"],
      ["swatch", "Цвет"],
      ["rect", "Прямоугольник"],
      ["ellipse", "Эллипс"],
    ]) {
      add.append(
        createButton({
          label: `+ ${label}`,
          variant: "quiet",
          onClick: () =>
            run(() =>
              edit((next) => {
                const object = {
                  id: studioId(type),
                  type,
                  title: label,
                  x: 32,
                  y: 32,
                  width: 200,
                  height: 100,
                  rotation: 0,
                  color: "#006d77",
                  text: type === "text" ? "Новый текст" : "",
                  fontSize: 24,
                  fontWeight: 600,
                  hidden: false,
                  locked: false,
                };
                next.board.objects.push(object);
                selected = { kind: "object", id: object.id };
              }),
            ),
        }),
      );
    }
    inspector.append(add, h("h3", {}, "Объекты"));
    for (const item of document.board.objects) {
      const itemButton = createButton({
        label: `${item.title}${item.hidden ? " · скрыт" : ""}${item.locked ? " · заблокирован" : ""}`,
        variant: "quiet",
        onClick: () => select("object", item.id),
      });
      itemButton.setAttribute("aria-pressed", String(selected?.id === item.id));
      inspector.append(itemButton);
    }
    if (selected?.kind === "object")
      objectInspector(
        document.board.objects.find((item) => item.id === selected.id),
      );
  }

  /** Object inspector exposes size/position, text weight, rotation, locking and visibility without editing raw JSON. */
  function objectInspector(item) {
    if (!item) return;
    const fields = {
      title: { label: "Имя объекта", value: item.title },
      text: {
        label: "Текст (переносы строк явные)",
        value: item.text,
        multiline: true,
      },
      color: { label: "Цвет", value: item.color, type: "color" },
    };
    for (const [key, label, min, max] of [
      ["x", "X, px", 0, 4096],
      ["y", "Y, px", 0, 4096],
      ["width", "Ширина, px", 16, 4096],
      ["height", "Высота, px", 16, 4096],
      ["rotation", "Поворот, °", -180, 180],
      ["fontSize", "Шрифт, px", 8, 160],
      ["fontWeight", "Толщина: 400/500/600/700/800", 400, 800],
    ])
      fields[key] = { label, value: item[key], type: "number", min, max };
    const entries = form("Выбранный объект", fields, (values) =>
      edit((next) => {
        const object = next.board.objects.find((value) => value.id === item.id);
        if (!object.locked) Object.assign(object, values);
      }),
    );
    if (item.locked)
      for (const input of Object.values(entries)) {
        input.disabled = true;
        input.dataset.studioReadOnly = "true";
      }
    for (const [key, label] of [
      ["locked", item.locked ? "Разблокировать" : "Заблокировать"],
      ["hidden", item.hidden ? "Показать" : "Скрыть"],
    ])
      inspector.append(
        createButton({
          label,
          variant: "quiet",
          onClick: () =>
            run(() =>
              edit((next) => {
                const object = next.board.objects.find(
                  (value) => value.id === item.id,
                );
                object[key] = !object[key];
              }),
            ),
        }),
      );
    for (const [direction, label] of [
      [-1, "На слой ниже"],
      [1, "На слой выше"],
    ]) {
      const control = createButton({
        label,
        variant: "quiet",
        onClick: () =>
          run(() =>
            edit((next) => {
              if (item.locked) return;
              const objects = next.board.objects;
              const index = objects.findIndex((value) => value.id === item.id),
                target = index + direction;
              if (target >= 0 && target < objects.length)
                [objects[index], objects[target]] = [
                  objects[target],
                  objects[index],
                ];
            }),
          ),
      });
      control.dataset.studioReadOnly = String(item.locked);
      inspector.append(control);
    }
    inspector.append(
      createButton({
        label: "Дублировать объект",
        variant: "quiet",
        onClick: () =>
          run(() =>
            edit((next) => {
              const duplicate = {
                ...item,
                id: studioId(item.type),
                title: `${item.title} · копия`,
                locked: false,
                x: Math.min(next.board.width - item.width, item.x + 20),
                y: Math.min(next.board.height - item.height, item.y + 20),
              };
              next.board.objects.push(duplicate);
              selected = { kind: "object", id: duplicate.id };
            }),
          ),
      }),
    );
    inspector.append(
      createButton({
        label: "Удалить объект",
        variant: "quiet",
        onClick: () =>
          run(() =>
            edit((next) => {
              if (!item.locked)
                next.board.objects = next.board.objects.filter(
                  (value) => value.id !== item.id,
                );
            }),
          ),
      }),
    );
  }

  /** Binding imports an existing composition revision; no copied HTML, remote pages or arbitrary scripts are accepted. */
  async function addScreen(documentId, expected = null) {
    if (!state) await create();
    const source = await compositionClient.inspect({ documentId });
    if (
      expected &&
      (source.revision !== expected.revision ||
        source.documentHash !== expected.documentHash)
    )
      throw new Error(
        "Исходный экран изменился после выбора. Откройте актуальную композицию и добавьте её снова",
      );
    const screen = screenFromComposition(source, state.document.screens.length);
    await edit((next) => {
      next.screens.push(screen);
      next.startScreenId ||= screen.id;
    });
    select("screen", screen.id);
    tabs.setValue("journey", { emit: true });
    journey.fit();
  }

  /** Build a small explicit demo on demand, through the same real composition preparation path as agents use. */
  async function demo() {
    requireResolvedCommand();
    if (!state) await create();
    const screens = [];
    for (const [title, label, action] of [
      ["Заявка", "Как к вам обращаться", "Продолжить"],
      ["Проверка", "Проверьте данные", "Подтвердить"],
      ["Готово", "Заявка сохранена", "Создать ещё"],
    ]) {
      const source = await compositionClient.prepare({
        document: exampleComposition(title, label, action),
        authorId,
      });
      screens.push(
        screenFromComposition(
          source,
          state.document.screens.length + screens.length,
        ),
      );
    }
    await edit((next) => {
      next.screens.push(...screens);
      next.startScreenId = screens[0].id;
      next.transitions.push(
        {
          id: studioId("edge"),
          from: screens[0].id,
          to: screens[1].id,
          action: "Продолжить",
          condition: "Имя заполнено",
          triggerNodeId: "action",
        },
        {
          id: studioId("edge"),
          from: screens[1].id,
          to: screens[2].id,
          action: "Подтвердить",
          condition: "",
          triggerNodeId: "action",
        },
        {
          id: studioId("edge"),
          from: screens[1].id,
          to: screens[0].id,
          action: "Исправить",
          condition: "Нужна правка",
          triggerNodeId: null,
        },
        {
          id: studioId("edge"),
          from: screens[2].id,
          to: screens[0].id,
          action: "Создать ещё",
          condition: "",
          triggerNodeId: "action",
        },
      );
    });
    tabs.setValue("journey", { emit: true });
    journey.fit();
  }

  /** Edit explicit screen states and transition branches alongside the live graph. */
  function journeyInspector() {
    form(
      "Экран из песочницы",
      { composition: { label: "ID композиции", value: "" } },
      (values) => addScreen(values.composition),
    );
    inspector.append(
      createButton({
        label: "Пример клиентского пути",
        variant: "quiet",
        onClick: () => run(demo),
      }),
    );
    const screen = state.document.screens.find(
      (item) => item.id === selected?.id,
    );
    if (screen) {
      form(
        "Выбранный экран",
        {
          title: { label: "Название экрана", value: screen.title },
          state: {
            label: "Состояние и контекст",
            value: screen.state,
            multiline: true,
          },
          x: {
            label: "X на графе",
            value: screen.x,
            type: "number",
            min: 0,
            max: 8192,
          },
          y: {
            label: "Y на графе",
            value: screen.y,
            type: "number",
            min: 0,
            max: 8192,
          },
        },
        (values) =>
          edit((next) =>
            Object.assign(
              next.screens.find((item) => item.id === screen.id),
              values,
            ),
          ),
      );
      inspector.append(
        createButton({
          label: "Сделать началом пути",
          variant: "quiet",
          onClick: () =>
            run(() =>
              edit((next) => {
                next.startScreenId = screen.id;
              }),
            ),
        }),
      );
      if (onOpenComposition)
        inspector.append(
          createButton({
            label: "Править экран в песочнице",
            variant: "quiet",
            onClick: () => onOpenComposition(screen.source.documentId),
          }),
        );
      inspector.append(
        createButton({
          label: "Удалить экран и его переходы",
          variant: "quiet",
          onClick: () =>
            run(() => replace(removeScreen(state.document, screen.id))),
        }),
      );
    }
    if (state.document.screens.length) {
      const formElement = h(
        "form",
        { className: "studio-property-form" },
        h("h3", {}, "Новый переход"),
      );
      const picks = {};
      for (const [key, title] of [
        ["from", "Из экрана"],
        ["to", "В экран"],
      ]) {
        const select = h("select", { "aria-label": title });
        for (const item of state.document.screens)
          select.append(h("option", { value: item.id }, item.title));
        if (key === "from" && screen) select.value = screen.id;
        formElement.append(
          h("label", { className: "ag-field" }, h("span", {}, title), select),
        );
        picks[key] = select;
      }
      for (const [key, label] of [
        ["action", "Действие пользователя"],
        ["condition", "Условие (описание, не код)"],
        ["triggerNodeId", "ID компонента-триггера (необязательно)"],
      ]) {
        const editor = field(label, "");
        formElement.append(editor.element);
        picks[key] = editor.input;
      }
      const submit = createButton({ label: "Добавить переход" });
      submit.type = "submit";
      formElement.append(submit);
      formElement.addEventListener(
        "submit",
        (event) => {
          event.preventDefault();
          run(() =>
            edit((next) => {
              const edge = Object.fromEntries(
                Object.entries(picks).map(([key, input]) => [key, input.value]),
              );
              edge.triggerNodeId ||= null;
              next.transitions.push({ id: studioId("edge"), ...edge });
            }),
          );
        },
        { signal: abort.signal },
      );
      inspector.append(formElement, h("h3", {}, "Переходы"));
      for (const edge of state.document.transitions)
        inspector.append(
          h(
            "div",
            { className: "studio-edge-summary" },
            h(
              "p",
              {},
              `${state.document.screens.find((item) => item.id === edge.from).title} → ${state.document.screens.find((item) => item.id === edge.to).title}: ${edge.action}${edge.condition ? ` · Если: ${edge.condition}` : ""}`,
            ),
            createButton({
              label: `Удалить переход «${edge.action}» и связанные задачи`,
              variant: "quiet",
              onClick: () =>
                run(() =>
                  edit((next) => {
                    next.transitions = next.transitions.filter(
                      (item) => item.id !== edge.id,
                    );
                    if (next.testPlan)
                      next.testPlan.tasks = next.testPlan.tasks.filter(
                        (task) => !task.requiredTransitionIds.includes(edge.id),
                      );
                  }),
                ),
            }),
          ),
        );
    }
  }

  /** Render bounded properties; controls commit whole semantic edits and never an event per typed character. */
  function renderInspector() {
    if (disposed) return;
    inspector.replaceChildren();
    if (!state) {
      inspector.append(
        h("h3", {}, "Бренд-бук и путь"),
        h(
          "p",
          {},
          "Создайте доску или откройте сохранённую. Экран добавляется из композиции песочницы.",
        ),
      );
      return;
    }
    if (mode === "board") boardInspector();
    else journeyInspector();
    for (const control of inspector.querySelectorAll(
      "input,textarea,button,select",
    ))
      if (
        busy ||
        isTesting ||
        pending ||
        control.dataset.studioReadOnly === "true"
      )
        control.disabled = true;
  }

  /** Restore an explicit local pointer; list/source failures remain visible rather than replacing a document with a demo. */
  const ready = run(async () => {
    await refreshList();
    let saved;
    try {
      saved = storage?.getItem("ag-design:studio:document");
    } catch {
      /* The user can open a board from the list. */
    }
    if (saved) accept(await client.inspect({ documentId: saved }));
    if (initialComposition && !importHandled) {
      importHandled = true;
      await addScreen(initialComposition.documentId, initialComposition);
    }
    if (!state)
      status.textContent =
        "Создайте бренд-доску. Правила и измерения доступны в Дизайн-буке: креатив, бренд-бук, дизайн-система, клиентский путь.";
  });
  renderInspector();
  window.addEventListener(
    "ag-design:appearance",
    (event) => journey.updateAppearance(event.detail),
    { signal: abort.signal },
  );
  root.addEventListener(
    "keydown",
    (event) => {
      if (event.target.closest("input,textarea,select,[contenteditable]"))
        return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        run(() => history(event.shiftKey ? "redo" : "undo"));
      }
    },
    { signal: abort.signal },
  );
  return {
    element: root,
    ready,
    addScreen: (id) => run(() => addScreen(id)),
    get state() {
      return state;
    },
    dispose() {
      disposed = true;
      abort.abort();
      activity.dispose();
      trialPanel.dispose();
      tabs.dispose();
      board.dispose();
      journey.dispose();
      root.replaceChildren();
    },
  };
}

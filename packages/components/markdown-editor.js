import { createCodeViewer } from "./code-viewer.js";
import { createMarkdownViewer } from "./markdown-viewer.js";
import { validateMarkdown } from "./markdown-render.js";
function deliverMarkdownFile(token, text) {
  token.owner?.accept(token, text);
}
function failMarkdownFile(token, error) {
  token.owner?.fail(token, error);
}
/** Editable Markdown delegates text/history to CodeViewer and preview to the exact shared MarkdownViewer. */
export function createMarkdownEditor(options = {}) {
  options = { ...options };
  const document = options.document ?? globalThis.document;
  if (!document?.createElement) throw new TypeError("document required");
  const label = options.label ?? "Редактор Markdown";
  if (typeof label !== "string" || !label.trim() || label.length > 200)
    throw new TypeError("label");
  for (const key of ["onChange", "onSave", "onLink"])
    if (options[key] !== undefined && typeof options[key] !== "function")
      throw new TypeError(key);
  const height = options.height ?? 360,
    previewDelay = options.previewDelay ?? 160;
  if (!Number.isInteger(height) || height < 120 || height > 1600)
    throw new RangeError("height:120–1600");
  if (
    !Number.isInteger(previewDelay) ||
    previewDelay < 0 ||
    previewDelay > 2000
  )
    throw new RangeError("previewDelay:0–2000");
  let initial = validateMarkdown(options.markdown ?? ""),
    saved = initial,
    mode = options.mode ?? "split",
    disposed = false;
  if (!["edit", "split", "preview"].includes(mode)) throw new TypeError("mode");
  let timer = null,
    pendingResolve = null,
    previewPromise = Promise.resolve(),
    saveJob = null,
    fileJob = null,
    editRevision = 0,
    chosenFile = null;
  const downloads = new Map();
  const fileChoiceListeners = [];
  const element = document.createElement("section");
  element.className = "ag-markdown-editor";
  element.setAttribute("data-ag-width", "fill");
  element.style.setProperty("--ag-md-editor-height", `${height}px`);
  element.setAttribute("aria-label", label);
  const toolbar = document.createElement("div");
  toolbar.className = "ag-markdown-editor__toolbar";
  toolbar.setAttribute("role", "group");
  toolbar.setAttribute("aria-label", `${label}: управление`);
  const status = document.createElement("div");
  status.className = "ag-markdown-editor__status";
  status.setAttribute("role", "status");
  const previewStatus = document.createElement("div");
  previewStatus.className = "ag-markdown-editor__preview-status";
  previewStatus.setAttribute("role", "status");
  const fileChoice = document.createElement("div");
  fileChoice.className = "ag-markdown-editor__file-choice";
  fileChoice.hidden = true;
  const panes = document.createElement("div");
  panes.className = "ag-markdown-editor__panes";
  const buttons = [],
    listeners = [];
  function button(text, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", action);
    listeners.push(() => button.removeEventListener("click", action));
    toolbar.append(button);
    return button;
  }
  const modes = ["edit", "split", "preview"],
    modeLabels = ["Редактирование", "Рядом", "Просмотр"];
  for (let index = 0; index < modes.length; index++) {
    const value = modes[index];
    buttons.push([value, button(modeLabels[index], () => setMode(value))]);
  }
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".md,.markdown,text/markdown,text/plain";
  fileInput.hidden = true;
  button("Открыть .md", () => fileInput.click());
  button("Скачать .md", () => download());
  toolbar.append(fileInput);
  /** Stage one bounded user-selected file; dirty replacement always needs a visible explicit action. */
  const chooseFile = () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      validateFile(file);
      if (source.value !== saved) {
        clearFileChoice();
        chosenFile = file;
        fileChoice.hidden = false;
        fileChoice.append(
          document.createTextNode(
            "Заменить несохранённый черновик выбранным файлом?",
          ),
        );
        const replace = document.createElement("button");
        replace.type = "button";
        replace.textContent = "Заменить черновик";
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.textContent = "Отмена";
        const replaceChosen = () => {
          const accepted = chosenFile;
          clearFileChoice();
          if (accepted && !disposed) {
            try {
              loadFile(accepted, { replaceDirty: true });
            } catch (error) {
              status.textContent = error.message;
            }
          }
        };
        replace.addEventListener("click", replaceChosen);
        cancel.addEventListener("click", clearFileChoice);
        fileChoiceListeners.push(
          () => replace.removeEventListener("click", replaceChosen),
          () => cancel.removeEventListener("click", clearFileChoice),
        );
        fileChoice.append(replace, cancel);
      } else loadFile(file);
    } catch (error) {
      status.textContent = error.message;
    }
    fileInput.value = "";
  };
  fileInput.addEventListener("change", chooseFile);
  listeners.push(() => fileInput.removeEventListener("change", chooseFile));
  button("Отменить", () => undo());
  button("Повторить", () => redo());
  const saveButton = button("Сохранить", () => save());
  let preview = null,
    source = null;
  try {
    preview = createMarkdownViewer({
      document,
      i18n: options.i18n,
      toolbarMode: options.toolbarMode,
      tooltipDelayMs: options.tooltipDelayMs,
      markdown: initial,
      label: `${label}: предпросмотр`,
      mode: "rendered",
      height,
      onLink: options.onLink,
    });
    source = createCodeViewer({
      document,
      i18n: options.i18n,
      toolbarMode: options.toolbarMode,
      tooltipDelayMs: options.tooltipDelayMs,
      code: initial,
      language: "markdown",
      readOnly: false,
      label: `${label}: исходник`,
      height,
      lineNumbers: true,
      wrap: true,
      onChange: handleSourceChange,
    });
  } catch (error) {
    preview?.dispose();
    source?.dispose();
    for (const remove of listeners) remove();
    throw error;
  }
  source.element.setAttribute("data-ag-width", "content");
  preview.element.setAttribute("data-ag-width", "content");
  panes.append(source.element, preview.element);
  element.append(toolbar, status, previewStatus, fileChoice, panes);
  /** Synchronize pane/dirty controls without replacing the editable source or its selection. */
  function updateState() {
    if (disposed) return;
    const dirty = source.value !== saved;
    element.dataset.dirty = String(dirty);
    element.dataset.mode = mode;
    source.element.hidden = mode === "preview";
    preview.element.hidden =
      mode === "edit" || element.dataset.previewError === "true";
    for (const [value, node] of buttons)
      node.setAttribute("aria-pressed", String(mode === value));
    saveButton.disabled = Boolean(saveJob);
    let saveLabel = dirty ? "Сохранить изменения" : "Сохранить";
    if (saveJob) saveLabel = "Сохранение…";
    saveButton.textContent = saveLabel;
  }
  /** Debounced preview has one owned timer/waiter; replacement settles obsolete callers immediately. */
  function cancelPreview() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    pendingResolve?.();
    pendingResolve = null;
  }
  /** Update only preview feedback; host save/file failures remain visible independently. */
  function renderPreview() {
    if (disposed) return;
    try {
      preview.setMarkdown(source.value);
      element.dataset.previewError = "false";
      previewStatus.textContent = "";
    } catch (error) {
      element.dataset.previewError = "true";
      previewStatus.textContent =
        error?.message || "Не удалось построить предпросмотр";
    }
    updateState();
  }
  /** Replace one debounce job and wait only for its owned viewer work. */
  function schedulePreview(immediate = false) {
    cancelPreview();
    if (disposed) return Promise.resolve();
    previewPromise = new Promise((resolve) => {
      pendingResolve = resolve;
    });
    const current = previewPromise;
    const run = () => {
      timer = null;
      const done = pendingResolve;
      pendingResolve = null;
      renderPreview();
      Promise.resolve(preview.whenIdle()).then(done, done);
    };
    if (immediate) run();
    else timer = setTimeout(run, previewDelay);
    return current;
  }
  /** Forward actual shared-engine changes and invalidate stale file reads. */
  function handleSourceChange(change) {
    if (disposed || !source) return;
    editRevision++;
    abandonLoad();
    clearFileChoice();
    schedulePreview();
    updateState();
    try {
      options.onChange?.(
        Object.freeze({ markdown: change.code, origin: change.origin }),
      );
    } catch (error) {
      status.textContent = error?.message || "Ошибка обработчика изменений";
    }
  }
  /** Apply a validated silent source replacement and explicitly requested clean baseline. */
  function setMarkdown(markdown, settings = {}) {
    if (disposed) return;
    validateMarkdown(markdown);
    if (
      typeof settings !== "object" ||
      (settings.addToHistory !== undefined &&
        typeof settings.addToHistory !== "boolean") ||
      (settings.markSaved !== undefined &&
        typeof settings.markSaved !== "boolean")
    )
      throw new TypeError("setMarkdown settings");
    source.setCode(markdown, {
      addToHistory: settings.addToHistory ?? false,
      emitChange: false,
    });
    editRevision++;
    abandonLoad();
    clearFileChoice();
    if (settings.markSaved) {
      saveJob?.cancel();
      saveJob = null;
      saved = markdown;
    }
    schedulePreview();
    updateState();
  }
  /** Switch pane visibility while retaining editable engine/history/composition state. */
  function setMode(next) {
    if (disposed) return;
    if (!["edit", "split", "preview"].includes(next))
      throw new TypeError("mode");
    mode = next;
    updateState();
    if (next !== "edit") schedulePreview(true);
  }
  function undo() {
    if (disposed) return false;
    return source.undo();
  }
  function redo() {
    if (disposed) return false;
    return source.redo();
  }
  /** Save marks only the submitted snapshot clean; later edits remain dirty and failures retain the draft. */
  function save() {
    if (disposed) return Promise.resolve(false);
    if (saveJob) return saveJob.promise ?? Promise.resolve(false);
    if (!options.onSave) {
      status.textContent =
        "Для сохранения подключите обработчик или скачайте .md";
      return Promise.resolve(false);
    }
    const markdown = source.value,
      token = { cancel: null, promise: null };
    let cancel;
    const canceled = new Promise((resolve) => {
      cancel = () => resolve({ canceled: true });
    });
    token.cancel = cancel;
    saveJob = token;
    updateState();
    let result;
    try {
      result = options.onSave?.(Object.freeze({ markdown }));
    } catch (error) {
      result = Promise.reject(error);
    }
    token.promise = Promise.race([
      Promise.resolve(result).then((value) => ({ value })),
      canceled,
    ])
      .then(
        (outcome) => {
          if (disposed || saveJob !== token || outcome.canceled) return false;
          if (outcome.value === false || typeof outcome.value === "string") {
            status.textContent =
              typeof outcome.value === "string"
                ? outcome.value
                : "Не удалось сохранить";
            return false;
          }
          saved = markdown;
          status.textContent = "Сохранено";
          return true;
        },
        (error) => {
          if (!disposed && saveJob === token)
            status.textContent = error?.message || "Не удалось сохранить";
          return false;
        },
      )
      .finally(() => {
        if (saveJob === token) {
          saveJob = null;
          updateState();
        }
      });
    return token.promise;
  }
  /** Release the single read owner even when the host's File.text promise never settles. */
  function abandonLoad() {
    if (!fileJob) return;
    const previous = fileJob;
    fileJob = null;
    previous.owner = null;
    previous.resolve(false);
    previous.resolve = null;
  }
  function clearFileChoice() {
    for (const remove of fileChoiceListeners.splice(0)) remove();
    chosenFile = null;
    fileChoice.replaceChildren();
    fileChoice.hidden = true;
  }
  function validateFile(file) {
    if (
      !file ||
      !Number.isSafeInteger(file.size) ||
      file.size < 0 ||
      file.size > 1048576 ||
      typeof file.text !== "function"
    )
      throw new TypeError("Файл должен быть текстовым и не больше1MiB");
  }
  /** A dirty document requires explicit host confirmation before replacing it with bounded file text. */
  function loadFile(file, settings = {}) {
    if (disposed) return Promise.resolve(false);
    validateFile(file);
    clearFileChoice();
    if (
      settings.replaceDirty !== undefined &&
      typeof settings.replaceDirty !== "boolean"
    )
      throw new TypeError("replaceDirty");
    if (source.value !== saved && settings.replaceDirty !== true) {
      status.textContent =
        "Есть несохранённые изменения; подтвердите замену через replaceDirty";
      return Promise.resolve(false);
    }
    abandonLoad();
    let resolve;
    const promise = new Promise((done) => {
      resolve = done;
    });
    const token = {
      resolve,
      revision: editRevision,
      owner: { accept: finishFile, fail: rejectFile },
    };
    fileJob = token;
    let read;
    try {
      read = file.text();
    } catch (error) {
      rejectFile(token, error);
      return promise;
    }
    Promise.resolve(read).then(
      deliverMarkdownFile.bind(null, token),
      failMarkdownFile.bind(null, token),
    );
    return promise;
  }
  /** Commit only the current read after validation; every path settles its owner. */
  function finishFile(token, text) {
    if (
      disposed ||
      fileJob !== token ||
      !token.owner ||
      token.revision !== editRevision
    )
      return;
    try {
      validateMarkdown(text);
    } catch (error) {
      rejectFile(token, error);
      return;
    }
    const resolve = token.resolve;
    fileJob = null;
    token.owner = null;
    token.resolve = null;
    try {
      setMarkdown(text, { markSaved: true, addToHistory: false });
      status.textContent = "Файл открыт";
      resolve(true);
    } catch (error) {
      if (!disposed)
        status.textContent = error?.message || "Не удалось открыть файл";
      resolve(false);
    }
  }
  /** Report a current read failure without changing draft or clean baseline. */
  function rejectFile(token, error) {
    if (disposed || fileJob !== token || !token.owner) return;
    fileJob = null;
    token.owner = null;
    status.textContent = error?.message || "Не удалось прочитать файл";
    token.resolve(false);
    token.resolve = null;
  }
  /** Export only an explicit bounded local Blob; URL creation is not proof of a filesystem write. */
  function download(filename = "document.md") {
    if (disposed) return false;
    if (
      typeof filename !== "string" ||
      !filename ||
      filename.length > 255 ||
      filename.trim() !== filename ||
      /[\\/\u0000-\u001f\u007f]/u.test(filename) ||
      [".", ".."].includes(filename)
    )
      throw new TypeError("filename");
    const URL = document.defaultView?.URL,
      Blob = document.defaultView?.Blob;
    if (!URL?.createObjectURL || !URL.revokeObjectURL || !Blob) {
      status.textContent = "Скачивание недоступно в этом окружении";
      return false;
    }
    if (downloads.size >= 4) {
      status.textContent = "Дождитесь завершения предыдущих скачиваний";
      return false;
    }
    let url;
    try {
      url = URL.createObjectURL(
        new Blob([source.value], { type: "text/markdown;charset=utf-8" }),
      );
      if (typeof url !== "string" || !url.startsWith("blob:"))
        throw new Error("Ожидается локальный blob URL");
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.hidden = true;
      element.append(link);
      try {
        link.click();
      } finally {
        link.remove();
      }
      if (disposed) {
        URL.revokeObjectURL(url);
        return false;
      }
      const timer = setTimeout(() => {
        downloads.delete(url);
        URL.revokeObjectURL(url);
      }, 1000);
      downloads.set(url, { timer, URL });
      return true;
    } catch (error) {
      if (url) URL.revokeObjectURL(url);
      status.textContent =
        error?.message || "Не удалось подготовить скачивание";
      return false;
    }
  }
  updateState();
  initial = "";
  delete options.markdown;
  return {
    element,
    /** Forward locale configuration to the retained code engine, preserving this editor's draft/history. */
    refreshLocaleContent(context) {
      source.refreshLocaleContent?.(context);
      preview.refreshLocaleContent?.(context);
    },
    source,
    preview,
    get value() {
      return disposed ? "" : source.value;
    },
    get dirty() {
      return !disposed && source.value !== saved;
    },
    get mode() {
      return mode;
    },
    setMarkdown,
    setMode,
    undo,
    redo,
    save,
    loadFile,
    download,
    async whenIdle() {
      while (!disposed) {
        const current = previewPromise;
        await current;
        await source.whenIdle();
        await preview.whenIdle();
        if (current === previewPromise && timer === null) return;
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelPreview();
      abandonLoad();
      clearFileChoice();
      saveJob?.cancel();
      saveJob = null;
      for (const { timer } of downloads.values()) clearTimeout(timer);
      for (const [url, { URL }] of downloads) URL.revokeObjectURL(url);
      downloads.clear();
      for (const remove of listeners.splice(0)) remove();
      source.dispose();
      preview.dispose();
      saved = "";
      options = {};
      status.textContent = "";
      previewStatus.textContent = "";
      panes.replaceChildren();
    },
  };
}

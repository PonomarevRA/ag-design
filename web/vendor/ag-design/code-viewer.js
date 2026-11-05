import { resolveI18n } from "./i18n.js";
import { createButtonIcon } from "./button-icons.js";
import { bindTooltip } from "./tooltip.js";
import {
  CODE_VIEWER_LIMITS,
  validateCodeSource,
  validateCodeLanguage,
  checkedCodeOptions,
  codeLineSeparator,
  literalCodeOffset,
} from "./code-viewer-model.js";
import { codeViewerTheme } from "./code-viewer-theme.js";

let enginePromise;
/** Keep the shared public package entry lightweight; the local grammar bundle loads only on first use. */
function loadTextEngine() {
  return (enginePromise ??= import("./text-engine.js"));
}

/** Create a bounded literal source surface with a shared lazy read-only/editable syntax engine. */
export function createCodeViewer(input = {}) {
  const document = input.document ?? globalThis.document;
  if (!document?.createElement || !document.defaultView)
    throw new TypeError("A local browser Document is required");
  let localeContext = resolveI18n(document, input.i18n),
    localeSignature = "";
  let value = validateCodeSource(input.code ?? "");
  let language = validateCodeLanguage(input.language ?? "text");
  let options = checkedCodeOptions({
    label: input.label,
    filename: input.filename,
    readOnly: input.readOnly,
    lineNumbers: input.lineNumbers,
    wrap: input.wrap,
    height: input.height,
    toolbarMode: input.toolbarMode,
    tooltipDelayMs: input.tooltipDelayMs,
  });
  let onChange = input.onChange;
  if (onChange !== undefined && typeof onChange !== "function")
    throw new TypeError("onChange must be a function");
  input = null;
  const window = document.defaultView;
  const element = document.createElement("section");
  element.className = "ag-code-viewer";
  const toolbar = document.createElement("div");
  toolbar.className = "ag-code-viewer__toolbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Действия с кодом");
  const title = document.createElement("span");
  title.className = "ag-code-viewer__title";
  const actions = document.createElement("div");
  actions.className = "ag-code-viewer__actions";
  const host = document.createElement("div");
  host.className = "ag-code-viewer__surface";
  const fallback = document.createElement("pre");
  fallback.className = "ag-code-viewer__fallback";
  fallback.tabIndex = 0;
  fallback.textContent = value;
  host.append(fallback);
  const status = document.createElement("p");
  status.className = "ag-code-viewer__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  toolbar.append(title, actions);
  element.append(toolbar, host, status);
  let disposed = false,
    engine = null,
    view = null,
    loadingError = null,
    setting = false;
  let settingsCompartment, languageCompartment, separatorCompartment;
  const pendingMeasurements = new Set();
  let resolveReady;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });
  const buttonListeners = [];
  const actionHints = [];

  /** Keep feedback visible without moving focus or serializing source into diagnostics. */
  function feedback(message) {
    if (!disposed) status.textContent = message;
  }

  /** Preserve named native buttons while switching only their icon/label presentation. */
  function action(labelKey, textKey, iconName, callback) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ag-code-viewer__action";
    button.setAttribute("aria-label", localeContext.t(labelKey));
    const icon = document.createElement("span");
    icon.className = "ag-code-viewer__action-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.append(createButtonIcon(document, iconName));
    const caption = document.createElement("span");
    caption.className = "ag-code-viewer__action-label";
    caption.textContent = localeContext.t(textKey);
    button.append(icon, caption);
    const listener = () => {
      if (!disposed) callback();
    };
    button.addEventListener("click", listener);
    buttonListeners.push(() => button.removeEventListener("click", listener));
    actions.append(button);
    const hint = bindTooltip({
      trigger: button,
      container: actions,
      text: localeContext.t(labelKey),
      hoverDelayMs: options.tooltipDelayMs,
      placement: "bottom",
    });
    actionHints.push({ button, icon, caption, hint, labelKey, textKey });
    buttonListeners.push(hint.dispose);
    return button;
  }
  const findButton = action("code.find", "code.findShort", "search", () =>
    find(),
  );
  const copyButton = action("code.copy", "common.copy", "copy", () => {
    void copy();
  });
  const wrapButton = action("code.wrapLabel", "code.wrap", "wrap-text", () =>
    setOptions({ wrap: !options.wrap }),
  );
  const linesButton = action(
    "code.linesLabel",
    "code.lines",
    "list-ordered",
    () => setOptions({ lineNumbers: !options.lineNumbers }),
  );

  /** Owned translations update existing nodes; no source text, selection or editor history is replaced. */
  function refreshActions() {
    for (const item of actionHints) {
      const label = localeContext.t(item.labelKey),
        caption = localeContext.t(item.textKey);
      if (item.button.getAttribute("aria-label") !== label)
        item.button.setAttribute("aria-label", label);
      if (item.caption.textContent !== caption)
        item.caption.textContent = caption;
      item.hint.setText(label);
      if (item.hint.panel.lang !== localeContext.locale)
        item.hint.panel.lang = localeContext.locale;
      if (item.hint.panel.dir !== localeContext.direction)
        item.hint.panel.dir = localeContext.direction;
    }
  }

  /** Computed direction wins over distant ancestors; fallback respects the nearest explicit direction. */
  function toolbarDirection() {
    const computed = window.getComputedStyle(toolbar).direction;
    if (computed === "ltr" || computed === "rtl") return computed;
    const nearest = toolbar.closest("[dir]");
    const declared = nearest?.getAttribute("dir")?.toLowerCase();
    if (declared === "ltr" || declared === "rtl") return declared;
    // In a browser dir=auto is resolved by CSS; limited DOM implementations may omit that result.
    const resolved = nearest ? window.getComputedStyle(nearest).direction : "";
    if (resolved === "ltr" || resolved === "rtl") return resolved;
    const documentDirection = window.getComputedStyle(
      document.documentElement,
    ).direction;
    return documentDirection === "rtl" ? "rtl" : "ltr";
  }

  /** One toolbar tab stop plus arrow/Home/End navigation keeps keyboard access predictable. */
  function toolbarNavigation(event) {
    if (
      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const enabled = [...actions.querySelectorAll("button:not(:disabled)")];
    const current = enabled.indexOf(event.target);
    if (current < 0) return;
    const rtl = toolbarDirection() === "rtl";
    let next = current;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = enabled.length - 1;
    else {
      const delta = (event.key === "ArrowRight" ? 1 : -1) * (rtl ? -1 : 1);
      next = (current + delta + enabled.length) % enabled.length;
    }
    event.preventDefault();
    for (const button of enabled) button.tabIndex = -1;
    enabled[next].tabIndex = 0;
    enabled[next].focus();
  }
  toolbar.addEventListener("keydown", toolbarNavigation);
  buttonListeners.push(() =>
    toolbar.removeEventListener("keydown", toolbarNavigation),
  );

  /** Metadata and toolbar state do not rebuild the editor or replace its selection. */
  function updateChrome() {
    element.dataset.toolbarMode = options.toolbarMode;
    for (const item of actionHints) {
      item.icon.hidden = options.toolbarMode === "labeled";
      item.caption.hidden = options.toolbarMode === "compact";
      item.hint.setDelays({ hoverDelayMs: options.tooltipDelayMs });
    }
    refreshActions();
    title.textContent = options.filename || options.label;
    title.title = options.filename || options.label;
    fallback.setAttribute("aria-label", options.label);
    element.dataset.readOnly = String(options.readOnly);
    element.style.setProperty("--ag-code-height", `${options.height}px`);
    wrapButton.setAttribute("aria-pressed", String(options.wrap));
    linesButton.setAttribute("aria-pressed", String(options.lineNumbers));
    findButton.disabled = !view;
    wrapButton.disabled = !view;
    linesButton.disabled = !view;
    copyButton.disabled = false;
    const enabled = [...actions.querySelectorAll("button:not(:disabled)")];
    const active = enabled.includes(document.activeElement)
      ? document.activeElement
      : (enabled.find((button) => button.tabIndex === 0) ?? enabled[0]);
    for (const button of actions.querySelectorAll("button"))
      button.tabIndex = button === active ? 0 : -1;
  }

  /** Host callbacks cannot corrupt an accepted edit or expose source through an exception log. */
  function changed(origin) {
    if (disposed || !onChange) return;
    try {
      onChange(Object.freeze({ code: value, origin }));
    } catch {
      feedback("Изменение внесено. Не удалось завершить его обработку.");
    }
  }

  /** CodeMirror search uses its supported phrase facet, independently of source language and undo history. */
  function searchPhrases() {
    const keys = {
      Find: "code.searchPanel",
      Replace: "code.replacePanel",
      "Replace all": "code.replaceAll",
      next: "code.nextMatch",
      previous: "code.previousMatch",
      "match case": "code.matchCase",
      regexp: "code.regexp",
      "by word": "code.wholeWord",
      close: "code.closeSearch",
      Search: "code.searchLabel",
      "Replace with": "code.replaceWith",
    };
    const phrases = {};
    for (const [source, key] of Object.entries(keys))
      phrases[source] = localeContext.t(key);
    return phrases;
  }
  /** Reconfiguration uses one compartment so wrap/read-only/line numbers preserve the text model. */
  function configuration() {
    return [
      engine.EditorState.phrases.of(searchPhrases()),
      engine.EditorState.readOnly.of(options.readOnly),
      engine.EditorView.editable.of(!options.readOnly),
      engine.EditorView.contentAttributes.of({
        "aria-label": options.label,
        "aria-readonly": String(options.readOnly),
        tabindex: "0",
      }),
      options.lineNumbers ? engine.lineNumbers() : [],
      options.wrap ? engine.EditorView.lineWrapping : [],
    ];
  }

  /** Parse line endings independently of the output separator; literal mixed input is preserved until an actual edit. */
  function sourceText(code) {
    return engine.EditorState.create({ doc: code }).doc;
  }

  /** Reject one whole edit when it exceeds the same budgets used by explicit setters. */
  function filterTransaction(transaction) {
    if (!transaction.docChanged || setting) return transaction;
    try {
      if (transaction.newDoc.length > CODE_VIEWER_LIMITS.bytes)
        throw new RangeError("source budget");
      validateCodeSource(
        transaction.newDoc.sliceString(
          0,
          transaction.newDoc.length,
          transaction.state.lineBreak,
        ),
      );
      return transaction;
    } catch {
      feedback("Изменение слишком большое. Сократите текст или длину строки.");
      return [];
    }
  }

  /** Publish the editor's current source and user/history origin after an accepted transaction. */
  function editorUpdated(update) {
    if (!update.docChanged || disposed || setting) return;
    value = update.state.sliceDoc();
    let origin = "input";
    for (const transaction of update.transactions) {
      if (transaction.isUserEvent("undo")) origin = "undo";
      else if (transaction.isUserEvent("redo")) origin = "redo";
    }
    feedback("");
    changed(origin);
  }

  /** New state is used for an explicit silent baseline replacement; ordinary edits remain incremental. */
  function editorState(code, selection = 0) {
    const text = sourceText(code);
    const extensions = [
      settingsCompartment.of(configuration()),
      languageCompartment.of(engine.codeLanguageSupport(language)),
      separatorCompartment.of(
        engine.EditorState.lineSeparator.of(codeLineSeparator(code)),
      ),
      engine.history(),
      engine.drawSelection(),
      engine.highlightSelectionMatches(),
      engine.search({ top: true }),
      engine.keymap.of([
        ...engine.searchKeymap,
        ...engine.historyKeymap,
        ...engine.defaultKeymap,
      ]),
      ...codeViewerTheme(engine),
      engine.EditorState.transactionFilter.of(filterTransaction),
      engine.EditorView.updateListener.of(editorUpdated),
    ];
    const state = engine.EditorState.create({
      doc: text,
      selection: { anchor: Math.min(selection, text.length) },
      extensions,
    });
    return state;
  }

  /** Validate the whole source before replacement; silent setters reset the undo baseline. */
  function setCode(code, { addToHistory = false, emitChange = false } = {}) {
    if (disposed) return;
    validateCodeSource(code);
    if (typeof addToHistory !== "boolean" || typeof emitChange !== "boolean")
      throw new TypeError("Setter options must be boolean");
    if (!view && addToHistory)
      throw new Error(
        "Await whenIdle before adding a programmatic history entry",
      );
    if (code === value) return;
    setting = true;
    try {
      if (view) {
        if (addToHistory)
          view.dispatch({
            changes: {
              from: 0,
              to: view.state.doc.length,
              insert: sourceText(code),
            },
            effects: separatorCompartment.reconfigure(
              engine.EditorState.lineSeparator.of(codeLineSeparator(code)),
            ),
            annotations: engine.Transaction.addToHistory.of(true),
          });
        else view.setState(editorState(code, view.state.selection.main.head));
      } else fallback.textContent = code;
      value = code;
    } finally {
      setting = false;
    }
    feedback("");
    if (emitChange) changed("api");
  }

  /** Unknown hints normalize to plaintext through the local registry; this never downloads a grammar. */
  function setLanguage(next) {
    if (disposed) return;
    validateCodeLanguage(next);
    if (view)
      view.dispatch({
        effects: languageCompartment.reconfigure(
          engine.codeLanguageSupport(next),
        ),
      });
    language = next;
  }

  /** Validate every option before changing geometry or reconfiguring the live instance. */
  function setOptions(patch) {
    if (disposed) return;
    const next = checkedCodeOptions(patch, options);
    options = next;
    if (view)
      view.dispatch({
        effects: settingsCompartment.reconfigure(configuration()),
      });
    updateChrome();
    view?.requestMeasure();
  }

  function focus() {
    if (!disposed) {
      if (view) view.focus();
      else fallback.focus();
    }
  }
  function selectAll() {
    if (disposed) return false;
    if (view) {
      engine.selectAll(view);
      view.focus();
    } else {
      const range = document.createRange();
      range.selectNodeContents(fallback);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      fallback.focus();
    }
    return true;
  }
  function find() {
    if (disposed || !view) return false;
    return engine.openSearchPanel(view);
  }
  function undo() {
    return !disposed && !options.readOnly && Boolean(view && engine.undo(view));
  }
  function redo() {
    return !disposed && !options.readOnly && Boolean(view && engine.redo(view));
  }

  /** Copy literal source or model selection only after user action; denial leaves a manual-copy path. */
  async function copy() {
    if (disposed) return false;
    let text = value;
    if (view && !view.state.selection.main.empty) {
      const range = view.state.selection.main;
      text = value.slice(
        literalCodeOffset(value, range.from),
        literalCodeOffset(value, range.to),
      );
    }
    try {
      if (!window.navigator.clipboard?.writeText)
        throw new Error("clipboard unavailable");
      await window.navigator.clipboard.writeText(text);
      if (disposed) return false;
      feedback("Скопировано");
      return true;
    } catch {
      if (disposed) return false;
      selectAll();
      feedback("Текст выделен. Скопируйте его стандартной командой браузера.");
      return false;
    }
  }

  /** Resolve a visible measurement checkpoint, not background syntax completion or GPU presentation. */
  async function whenIdle() {
    await ready;
    if (disposed) return;
    if (loadingError) throw loadingError;
    if (!element.isConnected || !view || !view.dom.getClientRects().length)
      return;
    return new Promise((resolve) => {
      pendingMeasurements.add(resolve);
      view.requestMeasure({
        read() {
          pendingMeasurements.delete(resolve);
          resolve();
        },
      });
    });
  }

  /** Destroy owned editor observers/handlers and settle waiters; late local imports cannot remount it. */
  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const remove of buttonListeners) remove();
    buttonListeners.length = 0;
    for (const resolve of pendingMeasurements) resolve();
    pendingMeasurements.clear();
    resolveReady();
    try {
      view?.destroy();
    } finally {
      view = null;
      value = "";
      language = "text";
      onChange = null;
      options = null;
      fallback.textContent = "";
      host.replaceChildren();
      title.textContent = "";
      status.textContent = "";
      element.replaceChildren();
      element.remove();
    }
  }

  updateChrome();
  feedback("Подготовка просмотра…");
  void loadTextEngine()
    .then((module) => {
      if (disposed) return;
      engine = module;
      settingsCompartment = new engine.Compartment();
      languageCompartment = new engine.Compartment();
      separatorCompartment = new engine.Compartment();
      view = new engine.EditorView({
        state: editorState(value),
        parent: host,
        root: document,
      });
      fallback.remove();
      updateChrome();
      feedback("");
    })
    .catch((error) => {
      if (disposed) return;
      loadingError = new Error(
        "Не удалось открыть редактор. Исходный текст доступен для чтения.",
        { cause: error },
      );
      feedback(loadingError.message);
    })
    .finally(() => resolveReady());

  return {
    element,
    /** Reconfigure search phrases without recreating the editor or resetting selection/history. */
    refreshLocaleContent(context) {
      if (disposed) return;
      localeContext = context;
      refreshActions();
      const signature = JSON.stringify(searchPhrases());
      if (signature === localeSignature) return;
      localeSignature = signature;
      if (view)
        view.dispatch({
          effects: settingsCompartment.reconfigure(configuration()),
        });
    },
    get value() {
      return value;
    },
    setCode,
    setLanguage,
    setOptions,
    focus,
    undo,
    redo,
    selectAll,
    find,
    copy,
    whenIdle,
    dispose,
  };
}

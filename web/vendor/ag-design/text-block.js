import { createButton } from "./primitives.js";
import { resolveI18n } from "./i18n.js";
import { bindTextBlockSelection } from "./text-selection.js";

/** Validate literal text before any DOM mutation; the host owns content and persistence. */
function literal(text) {
  if (typeof text !== "string")
    throw new TypeError("Text block content must be literal text");
  return text;
}

/**
 * Create a plain reading block with scoped select-all and optional quiet copy action beneath it.
 * Clipboard access occurs only through copy()/button activation; rejected writes retain manual copy.
 */
export function createTextBlock({
  document = globalThis.document,
  text = "",
  label,
  copyable = false,
  i18n,
} = {}) {
  literal(text);
  if (typeof label !== "string" || !label.trim())
    throw new TypeError("Text block label is required");
  if (typeof copyable !== "boolean")
    throw new TypeError("copyable must be boolean");
  const context = resolveI18n(document, i18n);
  const element = document.createElement("div");
  element.className = "ag-text-block";
  const content = document.createElement("div");
  content.className = "ag-text-block__content";
  content.setAttribute("role", "region");
  content.setAttribute("aria-label", label);
  content.tabIndex = 0;
  content.textContent = text;
  element.append(content);
  const selection = bindTextBlockSelection(content);
  let disposed = false;
  let revision = 0;
  let pending = false;
  let statusKey = "";
  let button, status;

  /** Translate only owned action/status chrome; preserve content and selection. */
  function refresh() {
    if (disposed || !button) return;
    const name = context.t("textBlock.copy");
    button.setAttribute("aria-label", name);
    button.title = name;
    button.lang = context.locale;
    status.lang = context.locale;
    status.textContent = statusKey ? context.t(statusKey) : "";
  }

  /** Copy all accepted block text; generation fencing prevents stale success after replacement. */
  async function copy() {
    if (disposed || pending || !copyable) return false;
    const expected = revision;
    const value = content.textContent;
    pending = true;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    try {
      const clipboard = document.defaultView?.navigator.clipboard;
      if (!clipboard?.writeText) throw new Error("Clipboard unavailable");
      await clipboard.writeText(value);
      if (disposed || revision !== expected) return false;
      statusKey = "textBlock.copied";
      refresh();
      return true;
    } catch {
      if (disposed || revision !== expected) return false;
      content.focus({ preventScroll: true });
      selection.selectAll();
      statusKey = "textBlock.manualCopy";
      refresh();
      return false;
    } finally {
      pending = false;
      if (!disposed) {
        button.disabled = false;
        button.removeAttribute("aria-busy");
      }
    }
  }

  /** The button is the user gesture boundary; no clipboard write occurs during render. */
  function activateCopy() {
    void copy();
  }
  if (copyable) {
    const footer = document.createElement("div");
    footer.className = "ag-text-block__footer";
    button = createButton({
      document,
      label: context.t("textBlock.copy"),
      icon: "copy",
      iconOnly: true,
      variant: "quiet",
    });
    button.addEventListener("click", activateCopy);
    status = document.createElement("span");
    status.className = "ag-text-block__status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    footer.append(button, status);
    element.append(footer);
  }
  refresh();
  const offLocale = copyable ? context.subscribe(refresh) : () => {};
  return {
    element,
    content,
    copy,
    selectAll: selection.selectAll,
    get value() {
      return content.textContent;
    },
    /** Replace literal content atomically and retire feedback from an older clipboard request. */
    setText(next) {
      if (disposed) return;
      literal(next);
      revision++;
      statusKey = "";
      selection.reset();
      content.textContent = next;
      refresh();
    },
    /** Remove subscriptions, disable retained action and ignore any late clipboard result. */
    dispose() {
      if (disposed) return;
      disposed = true;
      revision++;
      selection.dispose();
      offLocale();
      button?.removeEventListener("click", activateCopy);
      if (button) button.disabled = true;
    },
  };
}

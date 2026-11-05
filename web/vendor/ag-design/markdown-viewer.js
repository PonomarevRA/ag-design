import { createCodeViewer } from "./code-viewer.js";
import { renderMarkdownDocument, validateMarkdown } from "./markdown-render.js";
/** Offline Markdown with explicit rendered/source modes and callback-only links. */
export function createMarkdownViewer(options = {}) {
  options = { ...options };
  const document = options.document ?? globalThis.document;
  if (!document?.createElement) throw new TypeError("document required");
  const label = options.label ?? "Markdown";
  if (typeof label !== "string" || !label.trim() || label.length > 240)
    throw new TypeError("label");
  if (options.onLink !== undefined && typeof options.onLink !== "function")
    throw new TypeError("onLink");
  const height = options.height ?? 360;
  if (!Number.isInteger(height) || height < 120 || height > 1600)
    throw new RangeError("height:120–1600");
  let value = validateMarkdown(options.markdown ?? ""),
    mode = options.mode ?? "rendered",
    disposed = false;
  if (!["rendered", "source"].includes(mode)) throw new TypeError("mode");
  const element = document.createElement("section");
  element.className = "ag-markdown-viewer";
  element.setAttribute("aria-label", label);
  const toolbar = document.createElement("div");
  toolbar.className = "ag-markdown-viewer__toolbar";
  toolbar.setAttribute("role", "group");
  toolbar.setAttribute("aria-label", `${label}: вид`);
  const renderedButton = document.createElement("button"),
    sourceButton = document.createElement("button");
  for (const button of [renderedButton, sourceButton]) button.type = "button";
  renderedButton.textContent = "Просмотр";
  sourceButton.textContent = "Исходник";
  toolbar.append(renderedButton, sourceButton);
  const content = document.createElement("div");
  content.className = "ag-markdown ag-markdown-viewer__content";
  const status = document.createElement("div");
  status.className = "ag-markdown-viewer__status";
  status.setAttribute("role", "status");
  element.append(toolbar, status, content);
  let source = null,
    rendered = null,
    revision = 0;
  /** Report a host-link failure without granting navigation or changing document data. */
  function activateLink(link) {
    if (disposed) return;
    try {
      Promise.resolve(options.onLink?.(link)).catch((error) => {
        if (!disposed)
          status.textContent = error?.message || "Не удалось открыть ссылку";
      });
    } catch (error) {
      status.textContent = error?.message || "Не удалось открыть ссылку";
    }
  }
  /** Build replacements before retiring the current mode, preserving old content on rejected input. */
  function build(markdown, nextMode) {
    if (nextMode === "source")
      return {
        source: createCodeViewer({
          document,
          i18n: options.i18n,
          toolbarMode: options.toolbarMode,
          tooltipDelayMs: options.tooltipDelayMs,
          code: markdown,
          language: "markdown",
          label: `${label}: исходник`,
          readOnly: true,
          height,
          wrap: true,
          lineNumbers: true,
        }),
        rendered: null,
      };
    return {
      source: null,
      rendered: renderMarkdownDocument({
        document,
        markdown,
        label,
        onLink: options.onLink ? activateLink : undefined,
      }),
    };
  }
  /** Retire old owned resources only after a complete replacement was built. */
  function commit(next, markdown, nextMode) {
    source?.dispose();
    rendered?.dispose();
    source = next.source;
    rendered = next.rendered;
    content.replaceChildren(source ? source.element : rendered.fragment);
    value = markdown;
    mode = nextMode;
    revision++;
    element.dataset.mode = mode;
    status.textContent = "";
    renderedButton.setAttribute("aria-pressed", String(mode === "rendered"));
    sourceButton.setAttribute("aria-pressed", String(mode === "source"));
  }
  /** Validate and silently replace the accepted Markdown without partial rendered mutation. */
  function setMarkdown(markdown) {
    if (disposed) return;
    validateMarkdown(markdown);
    if (markdown === value) return;
    if (source) {
      source.setCode(markdown);
      value = markdown;
      revision++;
      return;
    }
    commit(build(markdown, mode), markdown, mode);
  }
  /** Create only the selected readonly presentation and release the previous one. */
  function setMode(nextMode) {
    if (disposed) return;
    if (!["rendered", "source"].includes(nextMode)) throw new TypeError("mode");
    if (nextMode === mode) return;
    commit(build(value, nextMode), value, nextMode);
  }
  function chooseRendered() {
    try {
      setMode("rendered");
    } catch (error) {
      status.textContent = error.message;
    }
  }
  function chooseSource() {
    try {
      setMode("source");
    } catch (error) {
      status.textContent = error.message;
    }
  }
  renderedButton.addEventListener("click", chooseRendered);
  sourceButton.addEventListener("click", chooseSource);
  try {
    commit(build(value, mode), value, mode);
  } catch (error) {
    renderedButton.removeEventListener("click", chooseRendered);
    sourceButton.removeEventListener("click", chooseSource);
    throw error;
  }
  delete options.markdown;
  return {
    element,
    /** Forward language changes to a retained source engine without changing Markdown. */
    refreshLocaleContent(context) {
      source?.refreshLocaleContent?.(context);
    },
    get value() {
      return value;
    },
    get mode() {
      return mode;
    },
    get source() {
      return source;
    },
    setMarkdown,
    setMode,
    async whenIdle() {
      while (!disposed) {
        const expected = revision;
        try {
          await (source?.whenIdle() ?? rendered?.whenIdle());
        } catch (error) {
          if (!disposed && expected === revision) throw error;
        }
        if (disposed || expected === revision) return;
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      renderedButton.removeEventListener("click", chooseRendered);
      sourceButton.removeEventListener("click", chooseSource);
      source?.dispose();
      rendered?.dispose();
      source = null;
      rendered = null;
      value = "";
      options = {};
      content.replaceChildren();
      status.textContent = "";
    },
  };
}

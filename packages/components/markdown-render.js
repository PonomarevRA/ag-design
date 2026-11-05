import MarkdownIt from "./markdown-parser.js";
import { createCodeViewer } from "./code-viewer.js";
import { CODE_VIEWER_LIMITS, validateCodeSource } from "./code-viewer-model.js";
export const MARKDOWN_LIMITS = Object.freeze({
  ...CODE_VIEWER_LIMITS,
  tokens: 20000,
  nodes: 20000,
  fences: 32,
  nesting: 32,
});
const parser = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false,
  maxNesting: MARKDOWN_LIMITS.nesting,
});
/** Share the exact source validation, including UTF-8 and all newline conventions. */
export function validateMarkdown(value) {
  return validateCodeSource(value);
}
/** Links carry literal destinations to the host callback; the DOM never receives href/src. */
export function safeMarkdownHref(value) {
  if (
    typeof value !== "string" ||
    !value ||
    value.length > 4096 ||
    /[\s\u0000-\u001f\u007f]/u.test(value)
  )
    return null;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value);
  if (
    scheme &&
    !["http", "https", "mailto", "tel"].includes(scheme[1].toLowerCase())
  )
    return null;
  if (value.includes("\\") || (!scheme && /^[^/?#]*:/.test(value))) return null;
  try {
    const normalized = new URL(value, "https://markdown.invalid/");
    if (!["http:", "https:", "mailto:", "tel:"].includes(normalized.protocol))
      return null;
  } catch {
    return null;
  }
  return value;
}
/** Count the entire vetted token tree before allocating DOM or code-editor instances. */
function checkTokenBudget(tokens) {
  let total = 0,
    fences = 0;
  const stack = [{ tokens, depth: 0 }];
  while (stack.length) {
    const current = stack.pop();
    if (current.depth > MARKDOWN_LIMITS.nesting)
      throw new RangeError("Markdown: слишком глубокая вложенность");
    for (const token of current.tokens) {
      if (++total > MARKDOWN_LIMITS.tokens)
        throw new RangeError("Markdown: превышен бюджет токенов");
      if (token.type === "fence" || token.type === "code_block")
        if (++fences > MARKDOWN_LIMITS.fences)
          throw new RangeError("Markdown: слишком много блоков кода");
      if (token.children)
        stack.push({ tokens: token.children, depth: current.depth + 1 });
    }
  }
}
const OPEN_TAGS = Object.freeze({
  paragraph_open: "p",
  blockquote_open: "blockquote",
  bullet_list_open: "ul",
  ordered_list_open: "ol",
  list_item_open: "li",
  table_open: "table",
  thead_open: "thead",
  tbody_open: "tbody",
  tr_open: "tr",
  th_open: "th",
  td_open: "td",
  em_open: "em",
  strong_open: "strong",
  s_open: "s",
});
/** Render CommonMark/tables from token types, never supplied HTML or arbitrary token attributes. */
export function renderMarkdownDocument({ document, markdown, label, onLink }) {
  const tokens = parser.parse(validateMarkdown(markdown), {});
  checkTokenBudget(tokens);
  const fragment = document.createDocumentFragment(),
    codeViewers = [],
    listeners = [];
  let nodes = 0;
  function make(tag, text) {
    if (++nodes > MARKDOWN_LIMITS.nodes)
      throw new RangeError("Markdown: превышен бюджет DOM");
    const element = document.createElement(tag);
    if (text !== undefined) {
      if (++nodes > MARKDOWN_LIMITS.nodes)
        throw new RangeError("Markdown: превышен бюджет DOM");
      element.textContent = text;
    }
    return element;
  }
  function appendText(parent, value) {
    if (++nodes > MARKDOWN_LIMITS.nodes)
      throw new RangeError("Markdown: превышен бюджет DOM");
    parent.append(document.createTextNode(value));
  }
  /** Preserve token hierarchy while allowing only explicit semantic tags and literal content. */
  function renderTokens(sequence, root) {
    const parents = [root];
    for (const token of sequence) {
      const parent = parents[parents.length - 1];
      if (token.type === "inline") {
        renderTokens(token.children ?? [], parent);
        continue;
      }
      if (
        token.type === "text" ||
        token.type === "html_inline" ||
        token.type === "html_block"
      ) {
        appendText(parent, token.content);
        continue;
      }
      if (token.type === "softbreak") {
        appendText(parent, "\n");
        continue;
      }
      if (token.type === "hardbreak") {
        parent.append(make("br"));
        continue;
      }
      if (token.type === "hr") {
        parent.append(make("hr"));
        continue;
      }
      if (token.type === "code_inline") {
        parent.append(make("code", token.content));
        continue;
      }
      if (token.type === "fence" || token.type === "code_block") {
        const language =
          token.type === "fence"
            ? token.info.trim().split(/\s+/u)[0].slice(0, 64)
            : "text";
        const viewer = createCodeViewer({
          document,
          code: token.content,
          language: language || "text",
          readOnly: true,
          label: `${label}: блок кода`,
          lineNumbers: false,
          wrap: true,
          height: 220,
        });
        codeViewers.push(viewer);
        parent.append(viewer.element);
        continue;
      }
      if (token.type === "image") {
        const alt = token.content || token.attrGet("alt") || "Изображение";
        const placeholder = make("span", `Изображение: ${alt}`);
        placeholder.className = "ag-markdown__image";
        placeholder.setAttribute("role", "img");
        placeholder.setAttribute(
          "aria-label",
          `${alt}. Изображение не загружено`,
        );
        parent.append(placeholder);
        continue;
      }
      if (token.type === "link_open") {
        const href = safeMarkdownHref(token.attrGet("href"));
        const link = make(href && onLink ? "button" : "span");
        link.className = "ag-markdown__link";
        if (link.tagName === "BUTTON") {
          link.type = "button";
          link.setAttribute("role", "link");
          const activate = (event) => {
            event.preventDefault();
            onLink(Object.freeze({ href, text: link.textContent ?? "" }));
          };
          link.addEventListener("click", activate);
          listeners.push(() => link.removeEventListener("click", activate));
        }
        parent.append(link);
        parents.push(link);
        continue;
      }
      if (token.nesting === -1) {
        if (parents.length > 1) parents.pop();
        continue;
      }
      let tag = OPEN_TAGS[token.type];
      if (token.type === "heading_open" && /^h[1-6]$/.test(token.tag))
        tag = token.tag;
      if (tag) {
        const element = make(tag);
        if (tag === "ol") {
          const start = token.attrGet("start");
          if (start && /^\d{1,6}$/.test(start)) element.start = Number(start);
        }
        if (tag === "td" || tag === "th") {
          const align = /^text-align:(left|right|center)$/.exec(
            token.attrGet("style") ?? "",
          );
          if (align) element.style.textAlign = align[1];
          if (tag === "th") element.scope = "col";
        }
        parent.append(element);
        parents.push(element);
      } else if (token.content) appendText(parent, token.content);
    }
  }
  function dispose() {
    for (const remove of listeners.splice(0)) remove();
    for (const viewer of codeViewers.splice(0)) viewer.dispose();
  }
  try {
    renderTokens(tokens, fragment);
  } catch (error) {
    dispose();
    throw error;
  }
  return {
    fragment,
    codeViewers,
    whenIdle: () =>
      Promise.all(codeViewers.map((viewer) => viewer.whenIdle())).then(
        () => undefined,
      ),
    dispose,
  };
}

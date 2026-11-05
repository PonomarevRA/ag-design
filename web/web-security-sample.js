import { createButton, createTextarea } from "./vendor/ag-design/index.js";
import { renderMarkdownDocument } from "./vendor/ag-design/markdown-render.js";
import { h } from "./dom.js";
let serial = 0;
const LIMIT = 4000;

/** Demonstrate bounded untrusted output without executing markup, navigating or persisting user input. */
export function buildWebSecuritySample({ locale = "ru" } = {}) {
  const en = locale.startsWith("en"),
    prefix = `web-security-example-${++serial}`;
  const heading = h(
    "h4",
    { id: prefix + "-heading" },
    en ? "Safe content example" : "Пример безопасного вывода",
  );
  const element = h(
    "section",
    { className: "web-security-example", "aria-labelledby": heading.id },
    heading,
    h(
      "p",
      {},
      en
        ? "Local demonstration: text and restricted Markdown. Links and supplied images do not open or load; this is a local output example."
        : "Локальная демонстрация: текст и ограниченный Markdown. Ссылки не открываются, указанные изображения не загружаются; это локальный пример вывода.",
    ),
  );
  const initial = en
    ? '**Product**\n\n<img src="/should-not-request" onerror="window.__agSecurityProbe=1">\n\n[Documentation](https://example.com/docs)\n\n[Unsafe link](javascript:alert(1))\n\n![Remote image](https://example.invalid/image.png)'
    : '**Товар**\n\n<img src="/should-not-request" onerror="window.__agSecurityProbe=1">\n\n[Документация](https://example.com/docs)\n\n[Опасная ссылка](javascript:alert(1))\n\n![Удалённое изображение](https://example.invalid/image.png)';
  const form = h("form", { noValidate: true });
  const field = createTextarea({
    document,
    id: prefix + "-source",
    label: en ? "Untrusted content" : "Недоверенное содержимое",
    value: initial,
    rows: 7,
    maxLength: LIMIT,
    hint: en
      ? "Up to 4000 characters. Input stays local to this example."
      : "До 4000 символов. Ввод остаётся только в этом примере.",
  });
  const input = field.querySelector("textarea");
  const error = h("p", { id: prefix + "-error", hidden: true });
  const apply = createButton({
    document,
    label: en ? "Render safely" : "Показать безопасно",
  });
  apply.type = "submit";
  form.append(field, error, apply);
  const plain = h("pre", {
    className: "web-security-example__plain",
    "aria-label": en ? "Literal text result" : "Результат как текст",
  });
  const markdown = h("div", {
    className: "ag-markdown web-security-example__markdown",
    role: "region",
    "aria-label": en ? "Restricted Markdown result" : "Ограниченный Markdown",
  });
  const status = h("p", { role: "status", "aria-atomic": "true" });
  element.append(
    form,
    h("h5", {}, en ? "Literal text" : "Как текст"),
    plain,
    h("h5", {}, en ? "Restricted Markdown" : "Ограниченный Markdown"),
    markdown,
    status,
  );
  let rendered = null,
    disposed = false,
    accepted = "";
  /** Callback is deliberately observational; a production host owns destination policy and authority. */
  function inspectLink(link) {
    if (disposed) return;
    status.textContent =
      (en
        ? "Link requested; no navigation: "
        : "Запрошена ссылка; переход не выполняется: ") + link.href;
  }
  /** Build a complete accepted result before retiring previous resources; rejected drafts remain editable. */
  function submit(event) {
    event?.preventDefault();
    field.sync();
    if (disposed) return;
    const value = input.value;
    if (value.length > LIMIT) {
      error.hidden = false;
      error.textContent = en
        ? "Use at most 4000 characters. The previous result is retained."
        : "Оставьте не больше 4000 символов. Предыдущий результат сохранён.";
      input.setAttribute("aria-invalid", "true");
      input.setAttribute(
        "aria-describedby",
        `${prefix}-source-hint ${error.id} ${prefix}-source-count`,
      );
      status.textContent = error.textContent;
      return;
    }
    let next;
    try {
      next = renderMarkdownDocument({
        document,
        markdown: value,
        label: en ? "Safe content" : "Безопасное содержимое",
        onLink: inspectLink,
      });
    } catch {
      error.hidden = false;
      error.textContent = en
        ? "Could not render the content. Simplify the text and retry; the previous result is retained."
        : "Не удалось отобразить содержимое. Упростите текст и повторите; предыдущий результат сохранён.";
      input.setAttribute("aria-invalid", "true");
      input.setAttribute(
        "aria-describedby",
        `${prefix}-source-hint ${error.id} ${prefix}-source-count`,
      );
      status.textContent = error.textContent;
      return;
    }
    rendered?.dispose();
    rendered = next;
    markdown.replaceChildren(next.fragment);
    plain.textContent = value;
    accepted = value;
    error.hidden = true;
    error.textContent = "";
    input.removeAttribute("aria-invalid");
    input.setAttribute("aria-describedby", `${prefix}-source-hint ${prefix}-source-count`);
    status.textContent = en
      ? "Rendered locally. HTML stays text; images are placeholders; links only report intent."
      : "Показано локально. HTML остаётся текстом; изображения заменены подписями; ссылки только сообщают намерение.";
  }
  form.addEventListener("submit", submit);
  submit();
  return {
    element,
    get accepted() {
      return accepted;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      form.removeEventListener("submit", submit);
      field.dispose();
      rendered?.dispose();
      rendered = null;
    },
  };
}

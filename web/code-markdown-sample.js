import {
  createCodeViewer,
  createMarkdownViewer,
  createMarkdownEditor,
} from "./vendor/ag-design/index.js";

export const codeMarkdownIds = new Set([
  "code-viewer",
  "markdown-viewer",
  "markdown-editor",
]);
export const sampleCode =
  'interface Project { name: string; ready: boolean; }\n\nconst project: Project = {\n  name: "Новый интерфейс",\n  ready: true,\n};\n\nconsole.log(project.name);';
export const sampleMarkdown =
  "# План проекта\n\nСоберите **понятный интерфейс** из готовых компонентов.\n\n- [x] Подготовить структуру\n- [ ] Проверить клавиатуру\n\n| Этап | Статус |\n| --- | --- |\n| Макет | Готов |\n| Проверка | В работе |\n\n```typescript\nconst ready: boolean = true;\n```\n\n> Все изменения остаются у владельца документа.\n";

/** Mount the exact public factories; snippets are literal content, never evaluated or sent to a service. */
export function buildCodeMarkdownSample(
  id,
  props = {},
  document = globalThis.document,
) {
  if (!codeMarkdownIds.has(id)) throw new TypeError("Unknown text sample");
  const settings = {
    document,
    label:
      props.label ||
      (id === "code-viewer" ? "Исходный код" : "Документ Markdown"),
    height: props.height ?? 300,
    toolbarMode: props.toolbarMode ?? "compact",
    tooltipDelayMs: props.tooltipDelayMs ?? 250,
  };
  let controller;
  if (id === "code-viewer")
    controller = createCodeViewer({
      ...settings,
      code: props.code ?? sampleCode,
      language: props.language || "typescript",
      wrap: props.wrap === "true",
      lineNumbers: props.lineNumbers !== "false",
    });
  else if (id === "markdown-viewer")
    controller = createMarkdownViewer({
      ...settings,
      markdown: props.markdown ?? sampleMarkdown,
      mode: props.mode || "rendered",
    });
  else
    controller = createMarkdownEditor({
      ...settings,
      markdown: props.markdown ?? sampleMarkdown,
      mode: props.mode || "split",
    });
  let updated = false;
  return {
    element: controller.element,
    controller,
    whenIdle: () => controller.whenIdle(),
    /** Exercise the public content update and wait for parsing/rendering before reporting completion. */
    async interact() {
      updated = !updated;
      if (id === "code-viewer") controller.setCode((props.code ?? sampleCode) + (updated ? "\n// Обновлено" : ""));
      else controller.setMarkdown((props.markdown ?? sampleMarkdown) + (updated ? "\nОбновлено.\n" : ""));
      await controller.whenIdle();
    },
    dispose() {
      controller.dispose();
    },
  };
}

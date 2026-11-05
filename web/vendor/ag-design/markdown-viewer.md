# Markdown Viewer

`createMarkdownViewer({document, markdown, label, mode:'rendered'|'source', height, onLink})` provides real local Markdown parsing and a source view through the shared `createCodeViewer`. It uses the bundled parser with HTML, linkification and typographic substitutions disabled. CommonMark headings/paragraphs/emphasis/code/quotes/lists/rules/links and local table/strikethrough tokens become whitelisted DOM nodes. No supplied HTML, arbitrary token attributes, scripts or styles are executed.

```js
const viewer = createMarkdownViewer({
  document,
  markdown: "# Документ\n\n**Важный** текст.",
  mode: "rendered",
  onLink: ({ href, text }) => application.openLink({ href, text }),
});
container.append(viewer.element);
```

Links activate only through the explicit callback. The component never assigns `href`, `src`, `srcset`, media URLs or remote-resource styles. Without a callback, links remain readable inert text. Destinations permit HTTP(S), mailto, tel and relative references; javascript/data/file and other schemes, malformed URLs and control/whitespace/backslash tricks are rejected. The callback owns its own validation/navigation policy. Images always render accessible alt placeholders and are never fetched. Fenced blocks use the same readonly `CodeViewer` factory and offline languages; unknown language names fall back to text.

The controller exposes `element`, `value`, `mode`, nullable `source`, `setMarkdown`, `setMode`, `whenIdle()` and idempotent `dispose()`. Setters are silent. Rendering is built before replacing the previous accepted document; rejected values leave it intact. Changing readonly source/rendered modes retires the old engine, while the editable Markdown component preserves its own source engine/history across mode changes. `whenIdle()` follows owned component work, not browser paint, full grammar completion or an accessibility check.

Limits match the shared source engine:1MiB UTF-8,100,000 lines,20,000 code units per line. Preview additionally bounds20,000 parser tokens,20,000 Markdown-owned DOM nodes plus up to32 separately bounded CodeViewer blocks and32 nesting levels. An over-budget preview throws before committed document mutation; no silent truncation presents incomplete text as complete. Parsing remains synchronous but bounded; these limits do not establish measured worst-case latency. Disposal removes listeners/code engines and releases retained source/content. Text uses scoped semantic AG tokens and inherits the local color profile.

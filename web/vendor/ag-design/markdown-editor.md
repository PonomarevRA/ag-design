# Markdown Editor

`createMarkdownEditor({document, markdown, label, mode:'edit'|'split'|'preview', height, previewDelay, onChange, onSave, onLink})` composes the editable shared `CodeViewer` with **the exact `createMarkdownViewer` factory**. It has one Markdown source and one history engine. Edit/split/preview modes hide panes without rebuilding the editable source, preserving selection, composition and undo/redo.

```js
const editor = createMarkdownEditor({
  document,
  markdown: "# Заметка",
  mode: "split",
  onChange: ({ markdown, origin }) => application.updateDraft(markdown),
  onSave: async ({ markdown }) => application.saveDocument(markdown),
});
```

`source`, `preview`, `value`, `dirty` and `mode` are readable. `setMarkdown(value,{addToHistory:false,markSaved:false})` validates text atomically and stays silent; `undo()`/`redo()` use the shared engine. Actual source changes notify `onChange` with `input`, `api`, `undo` or `redo` provenance supplied by that engine. There is no independent regex textarea/highlight overlay. The component does not invoke services; file reads are explicit through the bounded controller API or a user-selected local file.

`save()` snapshots the submitted text. False/string/rejected saves preserve the draft and dirty state. A successful save marks only that snapshot clean; changes made while saving stay dirty. Without `onSave`, Save reports unavailable and keeps the draft dirty. One save can be in flight; disposal settles its waiter false even if host work ignores cancellation. Host-owned I/O itself cannot be terminated by this component.

Preview changes debounce through one owned timer (default160ms). Replacements/disposal cancel obsolete timers and settle waiters. `whenIdle()` follows the latest preview plus source/viewer work. A preview work-budget failure is visible, hides the stale preview, and leaves the editable source intact. A corrected draft recovers. Both panes use the same Markdown safety policy and1MiB/line/token budgets described in `markdown-viewer.md`; links are callback-only and images remain placeholders.

Semantic AG tokens/local font settings flow through both panes. Split becomes a single column on narrow component containers as well as narrow screens; tools wrap and use named native buttons. Source editing, line-number/wrap/history semantics belong to `CodeViewer`; Markdown safety/rendering belongs to `MarkdownViewer`. Browser fonts, actual frame/heap costs, profile/200% text and assistive-technology qualification need real target-host checks; Node tests alone do not certify them.

`loadFile(file,{replaceDirty:false})` accepts a File or compatible `{size,text()}`. It checks declared size before reading and actual text limits before committing. Dirty buffers require explicit confirmation through the inline “Заменить черновик” action or host-owned `replaceDirty:true`; the component never prompts or discards changes silently. Only the latest owned read may commit, and a newer edit/setter or disposal invalidates it immediately. Loaded file text becomes the clean local baseline; this is a read, not an automatic write-back.

`download(filename='document.md')` and the explicit toolbar action create a local Markdown Blob and temporary blob URL. At most4 exports remain pending and their URLs are revoked after a bounded delay or on disposal. Download preparation does not prove a filesystem write, invoke `onSave`, or clear dirty state. Environments without Blob URL support report the limitation. Save without an `onSave` adapter now reports unavailable and leaves dirty unchanged. The component never autosaves or acquires filesystem access.

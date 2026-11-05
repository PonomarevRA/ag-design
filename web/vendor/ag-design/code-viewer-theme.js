let sharedTheme;

/** Opaque semantic fills prevent selection/search/native layers from compounding their accent opacity. */
export const CODE_VIEWER_HIGHLIGHT_FILL = Object.freeze({
  accentRatio: 0.04,
  coverage: 1,
});

/** These exact rules are shared by the editor theme and canonical palette regression checks. */
export function codeViewerHighlightStyles() {
  const backgroundColor = `color-mix(in srgb, var(--ag-accent) ${CODE_VIEWER_HIGHLIGHT_FILL.accentRatio * 100}%, var(--ag-surface))`;
  return {
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection":
      { backgroundColor },
    ".cm-searchMatch": {
      backgroundColor,
      outline: "1px solid var(--ag-accent)",
    },
    ".cm-searchMatch-selected": {
      backgroundColor,
      outline: "2px solid var(--ag-accent)",
    },
  };
}

/** Build scoped syntax and editor styling from semantic host tokens, never a global editor theme. */
export function codeViewerTheme(engine) {
  if (sharedTheme) return sharedTheme;
  const { EditorView, HighlightStyle, syntaxHighlighting, tags } = engine;
  const editor = EditorView.theme({
    "&": {
      color: "var(--ag-text)",
      backgroundColor: "var(--ag-surface)",
      height: "var(--ag-code-height)",
      fontSize: "inherit",
    },
    ".cm-scroller": {
      fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
      overflow: "auto",
      lineHeight: "1.55",
    },
    ".cm-content": { padding: "12px 0", caretColor: "var(--ag-accent)" },
    ".cm-line": { padding: "0 12px" },
    ".cm-gutters": {
      color: "var(--ag-muted)",
      backgroundColor: "var(--ag-surface-alt)",
      border: "0",
      minWidth: "2.75em",
    },
    ".cm-gutterElement": { padding: "0 8px" },
    "&.cm-focused": { outline: "none" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--ag-accent)" },
    ".cm-panels": {
      color: "var(--ag-text)",
      backgroundColor: "var(--ag-surface-alt)",
      borderColor: "var(--ag-border)",
    },
    ...codeViewerHighlightStyles(),
  });
  // Stable token classes keep highlighting usable when CSP blocks runtime style modules.
  const highlight = HighlightStyle.define([
    {
      tag: [tags.keyword, tags.operatorKeyword, tags.modifier],
      class: "ag-code-token-keyword",
    },
    {
      tag: [tags.string, tags.special(tags.string), tags.regexp],
      class: "ag-code-token-string",
    },
    {
      tag: [tags.number, tags.bool, tags.null],
      class: "ag-code-token-literal",
    },
    {
      tag: [tags.comment, tags.meta],
      class: "ag-code-token-comment",
    },
    {
      tag: [tags.typeName, tags.className, tags.tagName],
      class: "ag-code-token-type",
    },
    {
      tag: [tags.propertyName, tags.attributeName],
      class: "ag-code-token-property",
    },
    {
      tag: tags.invalid,
      class: "ag-code-token-invalid",
    },
  ]);
  sharedTheme = Object.freeze([editor, syntaxHighlighting(highlight)]);
  return sharedTheme;
}

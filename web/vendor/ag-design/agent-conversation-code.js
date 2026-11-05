/** Render literal, bounded operation data with local expansion and wrapping, independent of host command actions. */
export function createConversationCode({ document, label, kind }) {
  const element = document.createElement("section");
  element.className = "ag-conversation__code";
  element.dataset.field = kind;
  element.setAttribute("aria-label", label);
  const toolbar = document.createElement("div");
  toolbar.className = "ag-conversation__code-tools";
  const pre = document.createElement("pre");
  pre.tabIndex = 0;
  pre.setAttribute("aria-label", label);
  const code = document.createElement("code");
  pre.append(code);
  const expand = document.createElement("button"),
    wrap = document.createElement("button");
  for (const button of [expand, wrap]) {
    button.type = "button";
    button.className = "ag-conversation__code-button";
  }
  wrap.textContent = "Перенос строк";
  wrap.setAttribute("aria-label", `${label}: перенос строк`);
  toolbar.append(expand, wrap);
  element.append(toolbar, pre);
  let full = "",
    expanded = false,
    wrapped = true;

  /** Limit the preview by lines and characters without discarding the full bounded source string. */
  function render() {
    const lines = full.split("\n");
    const preview = lines.slice(0, 8).join("\n").slice(0, 1200);
    const truncated = preview.length < full.length;
    const visible = !expanded && truncated ? `${preview}\n…` : full;
    if (code.textContent !== visible) code.textContent = visible;
    expand.hidden = !truncated;
    expand.textContent = expanded ? "Свернуть данные" : "Показать полностью";
    expand.setAttribute(
      "aria-label",
      `${label}: ${expand.textContent.toLowerCase()}`,
    );
    expand.setAttribute("aria-expanded", String(expanded));
    wrap.setAttribute("aria-pressed", String(wrapped));
    element.dataset.wrapped = String(wrapped);
    element.dataset.expanded = String(expanded);
  }
  /** Expand only this field; new stream data never resets the reader's local choice. */
  function toggleExpanded() {
    expanded = !expanded;
    render();
  }
  /** Soft wrapping changes presentation only, preserving literal input and output data. */
  function toggleWrapped() {
    wrapped = !wrapped;
    render();
  }
  expand.addEventListener("click", toggleExpanded);
  wrap.addEventListener("click", toggleWrapped);
  return {
    element,
    update(value) {
      element.hidden = value === undefined;
      const next = value ?? "";
      if (next === full && element.dataset.wrapped !== undefined) return;
      full = next;
      render();
    },
    dispose() {
      expand.removeEventListener("click", toggleExpanded);
      wrap.removeEventListener("click", toggleWrapped);
    },
  };
}

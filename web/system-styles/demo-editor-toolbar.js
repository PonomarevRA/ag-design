/** Adapt the pinned editor's real commands to its measured container, retaining file input and handlers. */
export function compactDemoEditorToolbar(editor, doc) {
  const toolbar = editor.element.querySelector(".ag-markdown-editor__toolbar");
  if (!toolbar) return { dispose() {} };
  const commands = [...toolbar.children].filter(
    (node) => node.tagName === "BUTTON",
  );
  if (commands.length !== 8) return { dispose() {} };
  const win = doc.defaultView;
  const events = new win.AbortController();
  const save = commands.pop();
  const details = doc.createElement("details");
  details.className = "demo-editor-actions";
  const summary = doc.createElement("summary");
  summary.textContent = "Действия";
  summary.setAttribute("aria-label", "Режим и действия редактора");
  const menu = doc.createElement("div");
  menu.className = "demo-editor-actions-list";
  menu.append(...commands);
  details.append(summary, menu);
  toolbar.insertBefore(details, save);
  const media = win.matchMedia?.("(min-width: 761px)");
  /** Measure the panel rather than assuming a wide browser contains a desktop-sized editor. */
  function respond() {
    const width = toolbar.getBoundingClientRect().width;
    const compact =
      width > 0
        ? width < 680
        : doc.documentElement.dataset.example === "fitness" ||
          !(media ? media.matches : win.innerWidth > 760);
    toolbar.dataset.demoToolbarCompact = String(compact);
    if (!details.contains(doc.activeElement)) details.open = !compact;
  }
  /** An executed command returns to the compact trigger without recreating the editor or changing its history. */
  function dismiss() {
    if (toolbar.dataset.demoToolbarCompact !== "true") return;
    details.open = false;
    summary.focus();
  }
  menu.addEventListener(
    "click",
    (event) => {
      if (event.target.closest("button")) dismiss();
    },
    { signal: events.signal },
  );
  details.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && details.open) {
        event.preventDefault();
        dismiss();
      }
    },
    { signal: events.signal },
  );
  doc.addEventListener(
    "pointerdown",
    (event) => {
      if (
        toolbar.dataset.demoToolbarCompact === "true" &&
        !details.contains(event.target)
      )
        details.open = false;
    },
    { signal: events.signal },
  );
  const observer = win.ResizeObserver ? new win.ResizeObserver(respond) : null;
  observer?.observe(toolbar);
  media?.addEventListener("change", respond, { signal: events.signal });
  respond();
  return {
    dispose() {
      events.abort();
      observer?.disconnect();
    },
  };
}

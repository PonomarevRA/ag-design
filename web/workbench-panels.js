import { createButton } from "./vendor/ag-design/index.js";
import { h } from "./dom.js";

let panelSequence = 0;

/**
 * Own mutually exclusive contextual drawers without changing the composition's CSS viewport.
 * @param {object} options - Same-document root/workspace and named retained panel contents.
 * @returns {object} Buttons, explicit open/close commands and idempotent resource cleanup.
 */
export function createWorkbenchPanels({ root, workspace, panels }) {
  const document = root.ownerDocument;
  const controller = new AbortController();
  const records = new Map();
  let active = null;
  let disposed = false;

  /** Close the current drawer; restore its trigger only when focus belonged to that drawer. */
  function close({ restoreFocus = false } = {}) {
    if (disposed || active === null) return;
    const record = records.get(active);
    const containsFocus = record.element.contains(document.activeElement);
    record.element.hidden = true;
    record.trigger.setAttribute("aria-expanded", "false");
    active = null;
    delete workspace.dataset.openPanel;
    if (restoreFocus || containsFocus) record.trigger.focus();
  }

  /** Reveal one retained panel; no document, form values or measured frame dimensions are recreated. */
  function open(id, { focus = false } = {}) {
    if (disposed || !records.has(id)) return;
    if (active !== id) {
      close();
      const record = records.get(id);
      record.element.hidden = false;
      record.trigger.setAttribute("aria-expanded", "true");
      workspace.dataset.openPanel = id;
      active = id;
    }
    if (focus) records.get(id).closeButton.focus();
  }

  for (const panel of panels) {
    const titleId = `workbench-panel-${++panelSequence}`;
    const trigger = createButton({
      label: panel.label,
      variant: "quiet",
      onClick: () => (active === panel.id ? close() : open(panel.id)),
    });
    const closeButton = createButton({
      label: "Закрыть панель",
      variant: "quiet",
      onClick: () => close({ restoreFocus: true }),
    });
    const element = h(
      "section",
      {
        id: titleId + "-body",
        className:
          "workbench-panel workbench-panel--" + (panel.edge || "right"),
        "aria-labelledby": titleId,
        hidden: true,
      },
      h(
        "header",
        { className: "workbench-panel__header" },
        h("h3", { id: titleId }, panel.title || panel.label),
        closeButton,
      ),
      panel.content,
    );
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", element.id);
    workspace.append(element);
    records.set(panel.id, { element, trigger, closeButton });
  }

  root.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape" || event.defaultPrevented || active === null)
        return;
      event.preventDefault();
      event.stopPropagation();
      close({ restoreFocus: true });
    },
    { signal: controller.signal },
  );

  return {
    buttons: Object.fromEntries(
      [...records].map(([id, record]) => [id, record.trigger]),
    ),
    open,
    close,
    /** Release only drawer chrome; the composition editor still owns each retained feature. */
    dispose() {
      if (disposed) return;
      close();
      disposed = true;
      controller.abort();
      for (const record of records.values()) record.element.remove();
      records.clear();
    },
  };
}

/**
 * Fit a live editor region to the available window height without scaling the document itself.
 * @param {object} options - Viewport, measured chrome and an optional minimum reachable height in CSS px.
 * @returns {Function} Idempotent disposal of observers, resize listeners and scheduled work.
 */
export function fitWorkbenchViewport({ viewport, chrome = [], minimum = 280 }) {
  const view = viewport.ownerDocument.defaultView;
  let scheduled = null;
  let disposed = false;
  let lastHeight = null;
  function measure() {
    scheduled = null;
    if (
      disposed ||
      !viewport.isConnected ||
      viewport.closest("[hidden],[inert]")
    )
      return;
    const top = Math.max(0, viewport.getBoundingClientRect().top);
    const height = Math.max(
      minimum,
      Math.floor(Math.min(view.innerHeight - 64, view.innerHeight - top - 16)),
    );
    if (height === lastHeight) return;
    lastHeight = height;
    viewport.style.setProperty("--workbench-viewport-height", height + "px");
  }
  /** Coalesce actual chrome/window changes; no idle polling or frame loop is needed. */
  function schedule() {
    if (!disposed && scheduled === null)
      scheduled = view.requestAnimationFrame(measure);
  }
  const observer = view.ResizeObserver
    ? new view.ResizeObserver(schedule)
    : null;
  for (const element of chrome) observer?.observe(element);
  view.addEventListener("resize", schedule);
  schedule();
  return () => {
    if (disposed) return;
    disposed = true;
    observer?.disconnect();
    view.removeEventListener("resize", schedule);
    if (scheduled !== null) view.cancelAnimationFrame(scheduled);
  };
}

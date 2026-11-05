import { helpPositioner } from "./inline-help-position.js";
import { bindHintBehavior } from "./hint-behavior.js";
import { defaultHoverDelayMs, validateHintDelay } from "./hint-timing.js";

let sequence = 0;

/** Bind a literal supplemental tooltip to an existing named control; the caller still owns its action and focus. */
export function bindTooltip({
  trigger,
  text,
  container,
  hoverDelayMs = defaultHoverDelayMs,
  focusDelayMs = 0,
  placement = "auto",
} = {}) {
  if (!trigger?.ownerDocument || !trigger.addEventListener)
    throw new TypeError("A local trigger Element is required");
  if (typeof text !== "string" || !text.trim())
    throw new TypeError("Literal tooltip text is required");
  if (!["auto", "right", "bottom"].includes(placement))
    throw new TypeError("Unknown tooltip placement");
  validateHintDelay(hoverDelayMs);
  validateHintDelay(focusDelayMs, "focusDelayMs");
  const document = trigger.ownerDocument;
  const owner = container ?? trigger.parentElement ?? document.body;
  if (
    !owner?.append ||
    owner.ownerDocument !== document ||
    trigger.contains(owner)
  )
    throw new TypeError(
      "Tooltip container must be a separate same-document owner",
    );
  const nativeTitle = trigger.getAttribute("title");
  trigger.removeAttribute("title");
  const panel = document.createElement("span");
  do {
    panel.id = `ag-tooltip-${++sequence}`;
  } while (document.getElementById(panel.id));
  panel.className = "ag-inline-help__panel ag-tooltip";
  panel.setAttribute("role", "tooltip");
  panel.hidden = true;
  const content = document.createElement("span");
  content.className = "ag-inline-help__content";
  content.textContent = text;
  panel.append(content);
  owner.append(panel);
  const position = helpPositioner({
    document,
    element: trigger,
    restoreParent: owner,
    trigger,
    panel,
    preferred: placement,
    maxWidth: 280,
    fitContent: true,
  });
  const behavior = bindHintBehavior({
    trigger,
    panel,
    position,
    hoverDelayMs,
    focusDelayMs,
  });
  let disposed = false;
  return {
    panel,
    trigger,
    setOpen: behavior.setOpen,
    setDelays: behavior.setDelays,
    get isOpen() {
      return behavior.isOpen;
    },
    /** Keep the accepted description literal and reposition if a new locale changes its size. */
    setText(value) {
      if (disposed) return;
      if (typeof value !== "string" || !value.trim())
        throw new TypeError("Literal tooltip text is required");
      if (value === content.textContent) return;
      content.textContent = value;
      behavior.refresh();
    },
    /** Retire the bound behavior and remove only the tooltip's owned node. */
    dispose() {
      if (disposed) return;
      behavior.dispose();
      panel.remove();
      if (nativeTitle !== null && !trigger.hasAttribute("title"))
        trigger.setAttribute("title", nativeTitle);
      disposed = true;
    },
  };
}

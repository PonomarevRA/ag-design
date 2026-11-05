// The host pins the same positioning module as InlineHelp; public component APIs stay unchanged.
import {helpPositioner} from "./vendor/ag-design/inline-help-position.js";
let nextId = 0;

/** Attach a dismissible, hoverable explanation to the existing count, without an extra control. */
export function bindUsageTooltip({trigger, text}) {
  const document = trigger.ownerDocument;
  const view = document.defaultView;
  const panel = document.createElement("span");
  panel.className = "ag-inline-help__panel component-usage__tooltip";
  panel.id = `usage-tooltip-${++nextId}`;
  panel.setAttribute("role", "tooltip");
  const content = document.createElement("span");
  content.className = "ag-inline-help__content";
  content.textContent = text.length > 1200 ? text.slice(0,1199) + "…" : text;
  panel.append(content);
  panel.hidden = true;
  trigger.tabIndex = 0;
  trigger.removeAttribute("title");
  const previousDescription = trigger.getAttribute("aria-describedby");
  trigger.setAttribute("aria-describedby", [previousDescription, panel.id].filter(Boolean).join(" "));
  const element = trigger.parentElement;
  element.append(panel);
  const position = helpPositioner({document, element, trigger, panel, preferred:"bottom"});
  let open = false, disposed = false, overTrigger = false, overPanel = false, focused = false, dismissed = false, timer;

  /** Own one short bridge timer so the pointer can cross the gap without losing the explanation. */
  function cancelClose() {
    view.clearTimeout(timer);
    timer = undefined;
  }
  /** Start positioning only while the tooltip is visible, without changing keyboard focus. */
  function show() {
    cancelClose();
    if (disposed || dismissed || open) return;
    panel.hidden = false;
    open = true;
    position.start();
    document.addEventListener("keydown", keydown);
  }
  /** Remove open-only listeners and release the portal before hiding it. */
  function hide() {
    cancelClose();
    if (!open) return;
    position.stop();
    panel.hidden = true;
    open = false;
    overPanel = false;
    document.removeEventListener("keydown", keydown);
  }
  /** Rearm an Escape-dismissed tooltip only after both hover and focus have left. */
  function leave() {
    cancelClose();
    timer = view.setTimeout(() => {
      timer = undefined;
      if (overTrigger || overPanel || focused) return;
      dismissed = false;
      hide();
    }, 160);
  }
  /** Escape dismisses the explanation while retaining the user's current focus. */
  function keydown(event) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    dismissed = true;
    hide();
  }
  const handlers = [
    [trigger, "pointerenter", () => {overTrigger = true; show();}],
    [trigger, "pointerleave", () => {overTrigger = false; leave();}],
    [trigger, "focus", () => {focused = true; show();}],
    [trigger, "blur", () => {focused = false; leave();}],
    [panel, "pointerenter", () => {overPanel = true; cancelClose();}],
    [panel, "pointerleave", () => {overPanel = false; leave();}],
  ];
  for (const [target, type, listener] of handlers) target.addEventListener(type, listener);
  return () => {
    if (disposed) return;
    disposed = true;
    hide();
    cancelClose();
    for (const [target, type, listener] of handlers) target.removeEventListener(type, listener);
    if (previousDescription) trigger.setAttribute("aria-describedby", previousDescription);
    else trigger.removeAttribute("aria-describedby");
    trigger.removeAttribute("tabindex");
    panel.remove();
  };
}

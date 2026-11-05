import { resolveI18n } from "./i18n.js";
import { applyControlGeometry } from "./geometry.js";
import { dropdownPositioner } from "./dropdown-select-position.js";
let sequence = 0;

/**
 * Create a click-operated nonmodal settings/helper surface; content is borrowed, never cloned or disposed.
 * @param {object} options Same-document detached content, visible label/title, locale and optional callbacks.
 * Width 240–640 and maxHeight 120–720 are bounded AG CSS-pixel settings. Host owns draft/save/validation.
 * @returns {object} Owned trigger/panel, explicit state, open/close/disable and idempotent disposal.
 */
export function createPopover({
  document = globalThis.document,
  i18n,
  label,
  title = label,
  content,
  width = 340,
  maxHeight = 480,
  align = "end",
  density = "comfortable",
  onOpenChange = () => {},
  onError = () => {},
} = {}) {
  if (
    !document?.createElement ||
    !document.defaultView ||
    !["compact", "comfortable", "touch"].includes(density) ||
    typeof label !== "string" ||
    !label.trim() ||
    label.length > 180 ||
    typeof title !== "string" ||
    !title.trim() ||
    title.length > 256 ||
    content?.ownerDocument !== document ||
    content.nodeType !== 1 ||
    content.parentNode ||
    !Number.isFinite(width) ||
    width < 240 ||
    width > 640 ||
    !Number.isFinite(maxHeight) ||
    maxHeight < 120 ||
    maxHeight > 720 ||
    !["start", "end"].includes(align) ||
    typeof onOpenChange !== "function" ||
    typeof onError !== "function"
  )
    throw new TypeError("Invalid popover label, detached content or bounds");
  const context = resolveI18n(document, i18n),
    id = "ag-popover-" + ++sequence;
  const element = document.createElement("span"),
    trigger = document.createElement("button"),
    panel = document.createElement("section");
  const header = document.createElement("div"),
    heading = document.createElement("h2"),
    closeButton = document.createElement("button");
  element.className = "ag-popover";
  trigger.className = "ag-button ag-button--secondary ag-popover__trigger";
  trigger.type = "button";
  trigger.textContent = label;
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", id);
  panel.className = "ag-popover__panel";
  panel.id = id;
  panel.hidden = true;
  panel.tabIndex = -1;
  panel.dataset.agLayerRoot = "";
  panel.setAttribute("role", "dialog");
  heading.id = id + "-title";
  heading.textContent = title;
  panel.setAttribute("aria-labelledby", heading.id);
  header.className = "ag-popover__header";
  closeButton.className = "ag-button ag-button--quiet ag-popover__close";
  closeButton.type = "button";
  closeButton.textContent = "×";
  content.classList.add("ag-popover__content");
  header.append(heading, closeButton);
  panel.append(header, content);
  element.append(trigger, panel);
  const restoreTrigger = applyControlGeometry(trigger, { density }),
    restoreClose = applyControlGeometry(closeButton, { density: "compact" });
  let announced = false;
  let opened = false,
    disposed = false,
    disabled = false,
    revision = 0;
  const position = dropdownPositioner({
    document,
    element,
    input: trigger,
    panel,
    onUnavailable: unavailable,
    minimumWidth: width,
    maximumHeight: maxHeight,
    align,
  });

  /**
 * Keep owned close/locale names current without changing host text or remounting form controls.
 */
  function paintLocale() {
    element.lang = context.locale;
    element.dir = context.direction;
    panel.lang = context.locale;
    panel.dir = context.direction;
    closeButton.setAttribute("aria-label", context.t("popover.close"));
    position.schedule();
  }
  /**
 * Catch host callbacks only; rejected retired notifications cannot leak into a newer state.
 */
  function notify(value, reason) {
    const generation = revision;
    const report = (error) => {
      if (!disposed && generation === revision) {
        try {
          onError(error);
        } catch {
          /* Error reporting cannot reopen or strand a surface. */
        }
      }
    };
    try {
      Promise.resolve(onOpenChange(value, { reason })).catch(report);
    } catch (error) {
      report(error);
    }
  }
  /**
 * Install open-only handlers; child combobox/menu Escape handlers run before this bubble listener.
 */
  function listen(method) {
    document[method]("pointerdown", outside, true);
    document[method]("focusin", outside, true);
    document[method]("keydown", keydown);
  }
  /**
 * Complete cleanup and focus recovery before invoking code that may destroy this instance.
 */
  function dismiss(reason, restoreFocus = false, publish = true) {
    if (!opened) return false;
    const notifyClosed = publish && announced;
    announced = false;
    opened = false;
    const closedRevision = ++revision;
    listen("removeEventListener");
    position.stop();
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus && trigger.isConnected && !disabled)
      trigger.focus({ preventScroll: true });
    if (revision !== closedRevision || (disposed && publish)) return true;
    if (panel.contains(document.activeElement)) document.activeElement.blur();
    if (revision !== closedRevision) return true;
    if (notifyClosed && !disposed) notify(false, reason);
    return true;
  }
  /**
 * Close a hidden/offscreen/removed owner without stealing the user's current focus.
 */
  function unavailable() {
    dismiss("unavailable", panel.contains(document.activeElement));
  }
  /**
 * Pointer/focus leaving the owned surface is a dismissal, with the next focus target preserved.
 */
  function outside(event) {
    if (
      opened &&
      !element.contains(event.target) &&
      !panel.contains(event.target)
    )
      dismiss(event.type === "focusin" ? "focus-out" : "outside");
  }
  /**
 * Escape dismisses this layer only when a nested interactive component has not already handled it.
 */
  function keydown(event) {
    if (
      event.key === "Escape" &&
      !event.defaultPrevented &&
      opened &&
      (panel.contains(event.target) || trigger === event.target)
    ) {
      event.preventDefault();
      event.stopPropagation();
      dismiss("escape", true);
    }
  }
  /**
 * Open after insertion; focus a real content control, with no modal trap or forced task completion.
 */
  function open() {
    if (disposed || disabled || opened || !trigger.isConnected) return false;
    opened = true;
    const openedRevision = ++revision;
    panel.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    listen("addEventListener");
    position.start();
    if (!opened || disposed) return false;
    const focusable = [
      ...content.querySelectorAll(
        "button,a[href],input,select,textarea,[tabindex]",
      ),
    ].find(
      (node) =>
        !node.matches(
          ':disabled,[hidden],input[type=hidden],[tabindex="-1"]',
        ) && !node.closest("[hidden], [inert], details:not([open])"),
    );
    (focusable || panel).focus({ preventScroll: true });
    if (opened && !disposed && revision === openedRevision) {
      announced = true;
      notify(true, "open");
    }
    return opened && !disposed;
  }
  function toggle() {
    if (opened) dismiss("toggle", true);
    else open();
  }
  function closeClicked() {
    dismiss("close-button", true);
  }
  const off = context.subscribe(paintLocale);
  paintLocale();
  trigger.addEventListener("click", toggle);
  closeButton.addEventListener("click", closeClicked);
  return Object.freeze({
    element,
    trigger,
    panel,
    content,
    get state() {
      return { opened, disposed, disabled };
    },
    open,
    /**
 * Programmatic close defaults to preserving the external focus target.
 */
    close({ restoreFocus = false } = {}) {
      return dismiss("programmatic", restoreFocus);
    },
    /**
 * Disable the trigger before closing, so a host callback cannot reopen a disabled surface.
 */
    setDisabled(value) {
      if (typeof value !== "boolean")
        throw new TypeError("Boolean disabled required");
      if (disposed) return false;
      disabled = value;
      trigger.disabled = value;
      if (value) dismiss("disabled");
      return true;
    },
    /**
 * Remove owned listeners/observers and retain borrowed content for host disposal.
 */
    dispose() {
      if (disposed) return;
      disposed = true;
      dismiss("dispose", panel.contains(document.activeElement), false);
      revision++;
      off();
      trigger.removeEventListener("click", toggle);
      closeButton.removeEventListener("click", closeClicked);
      restoreTrigger();
      restoreClose();
    },
  });
}

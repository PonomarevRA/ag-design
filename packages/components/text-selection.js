const nativeTargets =
  "input,textarea,select,button,a,[contenteditable]:not([contenteditable=false]),[role=textbox]";

/**
 * Scope select-all to a focused reading surface; a second distinct press within600ms
 * selects the document. No global key listener or nested native-editor overrides.
 */
export function bindTextBlockSelection(content) {
  const document = content.ownerDocument;
  let lastPress = -Infinity;
  let lastRange = null;
  let disposed = false;

  /** Select actual DOM text, retaining normal browser copy and drag selection. */
  function select(element) {
    if (disposed || !element?.isConnected) return false;
    const selection = document.getSelection();
    if (!selection) return false;
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }

  /** An unrelated selection or activation ends the quick-repeat gesture. */
  function reset() {
    lastPress = -Infinity;
    lastRange = null;
  }

  /** Mouse activation also works on nested text, without blocking links/editors or text dragging. */
  function activate(event) {
    reset();
    if (!event.target.closest?.(nativeTargets))
      content.focus({ preventScroll: true });
  }

  /** Preserve modifiers, held-key repeats and native controls; only own a plain select-all chord. */
  function keydown(event) {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.target.closest?.(nativeTargets)
    )
      return;
    if (
      (event.key.toLowerCase() !== "a" && event.code !== "KeyA") ||
      !(event.ctrlKey || event.metaKey) ||
      event.shiftKey ||
      event.altKey
    ) {
      if (!["Control", "Meta"].includes(event.key)) reset();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (event.repeat) return;
    const selection = document.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    const unchanged =
      range &&
      lastRange &&
      range.compareBoundaryPoints(0, lastRange) === 0 &&
      range.compareBoundaryPoints(2, lastRange) === 0;
    const now = event.timeStamp;
    if (unchanged && now >= lastPress && now - lastPress <= 600) {
      select(document.body);
      reset();
      return;
    }
    if (select(content)) {
      lastPress = now;
      lastRange = document.getSelection().getRangeAt(0).cloneRange();
    }
  }
  content.addEventListener("keydown", keydown);
  content.addEventListener("pointerdown", activate);
  content.addEventListener("blur", reset);
  return {
    selectAll: () => select(content),
    reset,
    /** Detach only this surface's handlers; selection remains owned by the browser. */
    dispose() {
      if (disposed) return;
      disposed = true;
      reset();
      content.removeEventListener("keydown", keydown);
      content.removeEventListener("pointerdown", activate);
      content.removeEventListener("blur", reset);
    },
  };
}

/** Validate before mutating a live boundary; timers use the browser's signed 32-bit range. */
export function validateAsyncOptions(options) {
  const {
    document,
    label,
    load,
    key,
    autoStart,
    keepPrevious,
    loadingDelayMs,
    timeoutMs,
    minHeight,
    onError,
  } = options;
  if (!document?.createElement || typeof label !== "string" || !label.trim())
    throw new TypeError("Async boundary requires document and label");
  validateAsyncRun({ key, load });
  if (
    typeof autoStart !== "boolean" ||
    typeof keepPrevious !== "boolean" ||
    typeof onError !== "function"
  )
    throw new TypeError("Invalid async boundary options");
  for (const value of [loadingDelayMs, timeoutMs, minHeight]) {
    if (!Number.isFinite(value) || value < 0 || value > 2147483647)
      throw new TypeError("Invalid async boundary size or delay");
  }
}
/** Require an explicit identity and factory before replacing any current operation. */
export function validateAsyncRun({ key, load }) {
  if (typeof key !== "string" || !key.trim() || typeof load !== "function")
    throw new TypeError(
      "Async run requires a nonempty string key and load function",
    );
}
/** Never move a connected or foreign node out of its host. Results must transfer ownership explicitly. */
export function validateAsyncResult(result, document, boundary) {
  if (result === null) return;
  if (
    !result ||
    result.element?.nodeType !== 1 ||
    result.element.ownerDocument !== document ||
    result.element.isConnected ||
    result.element === boundary ||
    result.element.contains(boundary) ||
    typeof result.dispose !== "function"
  )
    throw new TypeError(
      "Async load must return a detached owned {element, dispose} or null",
    );
}

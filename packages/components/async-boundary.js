import {
  validateAsyncOptions,
  validateAsyncRun,
  validateAsyncResult,
} from "./async-boundary-contract.js";
import { createAsyncBoundaryView } from "./async-boundary-view.js";

/** Own one asynchronous component at a time. Abort is cooperative; generation identity fences all late results. */
export function createAsyncBoundary({
  document = globalThis.document,
  label,
  load,
  key = "default",
  autoStart = true,
  keepPrevious = true,
  loadingDelayMs = 150,
  timeoutMs = 15000,
  minHeight = 96,
  i18n,
  onError = () => {},
} = {}) {
  validateAsyncOptions({
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
  });
  const clock = document.defaultView ?? globalThis;
  const Controller = clock.AbortController ?? globalThis.AbortController;
  let active = null,
    owned = null,
    serial = 0,
    disposed = false;
  const released = new WeakSet(),
    releasedElements = new WeakSet();
  let state = Object.freeze({
    status: "idle",
    key,
    requestId: 0,
    hasContent: false,
    refreshing: false,
    stale: false,
    errorKind: null,
  });
  const view = createAsyncBoundaryView({
    document,
    label,
    minHeight,
    i18n,
    run: () => {
      void run();
    },
    cancel,
  });

  /**
   * Contain synchronous/async diagnostic failures without changing the operation result or UI copy.
   * @param {unknown} error Original load, contract, deadline or cleanup diagnostic.
   * @param {string} kind Existing diagnostic category, independent of display copy.
   */
  function report(error, kind) {
    try {
      Promise.resolve(onError(error, kind)).catch(() => {});
    } catch {
      /* Host diagnostics must not own lifecycle. */
    }
  }
  function release(component) {
    if (
      !component ||
      typeof component !== "object" ||
      released.has(component) ||
      releasedElements.has(component.element)
    )
      return;
    // Foreign-document results never transfer ownership, even when malformed.
    if (
      component.element?.ownerDocument !== document ||
      typeof component.dispose !== "function"
    )
      return;
    released.add(component);
    releasedElements.add(component.element);
    try {
      component.dispose();
    } catch (error) {
      report(error, "cleanup");
    }
  }
  function releaseCandidate(component) {
    if (
      component?.element?.isConnected ||
      component === owned ||
      (owned && component?.element === owned.element) ||
      component?.element === view.element ||
      component?.element?.contains?.(view.element)
    )
      return;
    release(component);
  }
  function update(status, errorKind = null, loadingVisible = false) {
    const hasContent = owned !== null;
    state = Object.freeze({
      status,
      key,
      requestId: serial,
      hasContent,
      refreshing: status === "loading" && hasContent,
      stale: hasContent && status !== "ready",
      errorKind,
    });
    view.update(state, loadingVisible);
  }
  function clearOwned() {
    const previous = owned;
    owned = null;
    view.clear();
    release(previous);
  }
  /** Settle before abort listeners run: host callbacks may synchronously start or dispose another run. */
  function finish(operation, outcome, errorKind = null, abort = false) {
    clock.clearTimeout(operation.delay);
    clock.clearTimeout(operation.deadline);
    if (active === operation) active = null;
    operation.resolve(
      Object.freeze({
        outcome,
        key: operation.key,
        requestId: operation.id,
        errorKind,
      }),
    );
    if (abort) operation.controller.abort();
  }
  function fail(operation, error, errorKind) {
    if (active !== operation || disposed) return;
    finish(operation, "error", errorKind);
    update("error", errorKind);
    if (errorKind === "timeout") operation.controller.abort();
    report(error, errorKind);
  }
  /** Start a new explicit identity. Invalid options leave the existing operation untouched. */
  function run(options = {}) {
    if (!options || typeof options !== "object" || Array.isArray(options))
      throw new TypeError("Async run options required");
    const next = {
      key: options.key === undefined ? key : options.key,
      load: options.load === undefined ? load : options.load,
    };
    validateAsyncRun(next);
    if (disposed)
      return Promise.resolve(
        Object.freeze({
          outcome: "disposed",
          key,
          requestId: serial,
          errorKind: null,
        }),
      );
    const previous = active,
      changedKey = next.key !== key;
    const operation = {
      id: ++serial,
      key: next.key,
      controller: new Controller(),
      resolve: null,
      delay: null,
      deadline: null,
    };
    const pending = new Promise((resolve) => {
      operation.resolve = resolve;
    });
    active = operation;
    key = next.key;
    load = next.load;
    if (previous) finish(previous, "superseded", null, true);
    if (active !== operation || disposed) return pending;
    if (changedKey || !keepPrevious) clearOwned();
    if (active !== operation || disposed) return pending;
    update("loading", null, loadingDelayMs === 0);
    if (active !== operation || disposed) return pending;
    if (loadingDelayMs > 0)
      operation.delay = clock.setTimeout(() => {
        if (active === operation && !disposed) update("loading", null, true);
      }, loadingDelayMs);
    if (timeoutMs > 0)
      operation.deadline = clock.setTimeout(
        () =>
          fail(operation, new Error("Async load deadline exceeded"), "timeout"),
        timeoutMs,
      );
    // Scheduling the host factory also makes sync throws follow the same failure path.
    Promise.resolve()
      .then(() => {
        if (active !== operation || disposed) return null;
        return next.load({
          signal: operation.controller.signal,
          key: operation.key,
        });
      })
      .then(
        (result) => {
          if (active !== operation || disposed) {
            releaseCandidate(result);
            return;
          }
          try {
            validateAsyncResult(result, document, view.element);
            if (
              result &&
              (result === owned ||
                result.element === owned?.element ||
                released.has(result) ||
                releasedElements.has(result.element))
            )
              throw new TypeError(
                "Async results transfer fresh ownership exactly once",
              );
          } catch (error) {
            fail(operation, error, "contract");
            releaseCandidate(result);
            return;
          }
          clearOwned();
          if (active !== operation || disposed) {
            releaseCandidate(result);
            return;
          }
          try {
            validateAsyncResult(result, document, view.element);
          } catch (error) {
            fail(operation, error, "contract");
            releaseCandidate(result);
            return;
          }
          owned = result;
          if (result) view.append(result.element);
          if (active !== operation || disposed) return;
          finish(operation, result ? "ready" : "empty");
          update(result ? "ready" : "empty");
        },
        (error) => fail(operation, error, "load"),
      )
      .catch((error) => fail(operation, error, "contract"));
    return pending;
  }
  /** Quiet cancellation retains only same-key content and clears both owned timers. */
  function cancel() {
    if (disposed || !active) return;
    const operation = active;
    finish(operation, "cancelled");
    update("cancelled");
    operation.controller.abort();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    const operation = active;
    if (operation) finish(operation, "disposed", null, true);
    clearOwned();
    update("disposed");
    view.dispose();
  }
  update("idle");
  if (autoStart) void run();
  return Object.freeze({
    element: view.element,
    run,
    cancel,
    dispose,
    get state() {
      return state;
    },
  });
}

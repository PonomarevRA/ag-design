import { observeRenderWindow } from "./render-window-observer.js";

/** Validate the synchronous ownership contract before installing observers or calling a factory. */
function validate(options) {
  const {
    document,
    render,
    root,
    rootMargin,
    estimatedHeight,
    unmountDelay,
    label,
    onError,
  } = options;
  if (
    !document?.defaultView ||
    typeof render !== "function" ||
    typeof onError !== "function"
  )
    throw new TypeError(
      "A document, synchronous render factory and onError function are required",
    );
  if (root !== null && (root.ownerDocument !== document || root.nodeType !== 1))
    throw new TypeError("root must be an element in the same document");
  if (
    typeof rootMargin !== "string" ||
    !/^(\d{1,4}px)( \d{1,4}px){0,3}$/.test(rootMargin) ||
    rootMargin.split(" ").some((value) => parseInt(value) > 1024)
  )
    throw new RangeError(
      "rootMargin must contain 1–4 positive pixel lengths up to1024px",
    );
  if (
    !Number.isFinite(estimatedHeight) ||
    estimatedHeight < 0 ||
    estimatedHeight > 10000
  )
    throw new RangeError("estimatedHeight must be0–10000px");
  if (!Number.isFinite(unmountDelay) || unmountDelay < 0 || unmountDelay > 5000)
    throw new RangeError("unmountDelay must be0–5000ms");
  if (typeof label !== "string" || !label.trim() || label.length > 180)
    throw new TypeError("A placeholder label up to180 characters is required");
}

/**
 * Lazily own a fresh synchronous component and evict only explicitly captured state.
 * @param {object} options Document, detached render factory, root/visibility budgets, initial state and diagnostics.
 * @returns {object} Owned element, lifecycle state and idempotent teardown; reentrant disposal stays final.
 * @throws {TypeError|RangeError} Invalid ownership options or visibility/retention budgets, before mounting.
 */
export function createRenderWindow({
  document = globalThis.document,
  render,
  initialState,
  root = null,
  rootMargin = "160px",
  estimatedHeight = 240,
  unmountDelay = 200,
  label = "Содержимое",
  onError = () => {},
} = {}) {
  validate({
    document,
    render,
    root,
    rootMargin,
    estimatedHeight,
    unmountDelay,
    label,
    onError,
  });
  const view = document.defaultView;
  const element = document.createElement("div");
  element.className = "ag-render-window";
  element.setAttribute("aria-label", label);
  element.style.minBlockSize = `${estimatedHeight}px`;
  let instance = null,
    saved = initialState,
    visible = false,
    pinned = false,
    pointer = false,
    disposed = false,
    mounting = false,
    releasing = false,
    timer = 0,
    state = "idle";
  const retired = new WeakSet(),
    retiredElements = new WeakSet();

  /** Publish observable lifecycle without an always-live status announcement. Empty windows remain keyboard reachable. */
  function publish(value) {
    state = value;
    element.dataset.renderState = value;
    element.tabIndex = instance ? -1 : 0;
  }
  /** Cancel only the owned eviction deadline; no frame or polling loop is used. */
  function cancelDeadline() {
    if (timer) view.clearTimeout(timer);
    timer = 0;
  }
  /**
   * Report host failure without letting synchronous or async diagnostics own cleanup.
   * @param {unknown} error Original factory/snapshot/disposal failure.
   */
  function fail(error) {
    if (!disposed) publish("error");
    try {
      Promise.resolve(onError(error)).catch(() => {});
    } catch {
      /* Error reporters cannot break resource cleanup. */
    }
  }
  /** Keep focused and dragged content mounted even after it crosses the visibility boundary. */
  function retained() {
    return pinned || pointer || element.contains(document.activeElement);
  }
  /**
   * Dispose transferred resources once, even when host cleanup calls back into this controller.
   * @param {object} component Owned factory result; its DOM may still be connected here.
   */
  function retire(component) {
    if (retired.has(component)) return;
    retired.add(component);
    if (component.element?.nodeType === 1)
      retiredElements.add(component.element);
    try {
      component.dispose();
    } catch (error) {
      fail(error);
    }
  }
  /**
   * Release abandoned detached candidates without touching another owner's DOM or callbacks.
   * @param {object|undefined} candidate Factory output whose ownership was not committed.
   */
  function releaseCandidate(candidate) {
    if (!candidate || typeof candidate.dispose !== "function") return;
    const child = candidate.element;
    if (
      child &&
      (child.ownerDocument !== document ||
        child.isConnected ||
        child.contains?.(element))
    )
      return;
    if (retired.has(candidate) || (child && retiredElements.has(child))) return;
    retire(candidate);
  }
  /**
   * Transfer a fresh detached result only while the synchronous mount still has an owner.
   * Reentrant refresh is ignored; disposal during render/DOM connection remains final.
   */
  function mount() {
    if (disposed || instance || mounting || releasing) return;
    mounting = true;
    let candidate;
    try {
      candidate = render(saved);
      if (!candidate || typeof candidate.dispose !== "function")
        throw new TypeError(
          "render must return {element, dispose, snapshot?} synchronously",
        );
      const child = candidate.element;
      if (child?.nodeType !== 1 || child.ownerDocument !== document)
        throw new TypeError("render element must belong to the same document");
      if (child.contains(element))
        throw new TypeError("render element cannot contain its own window");
      if (child.isConnected)
        throw new TypeError(
          "render element must be detached from another owner",
        );
      if (retired.has(candidate) || retiredElements.has(child))
        throw new TypeError(
          "render must transfer fresh ownership exactly once",
        );
      if (
        candidate.snapshot !== undefined &&
        typeof candidate.snapshot !== "function"
      )
        throw new TypeError("snapshot must be a function");
      if (disposed) {
        releaseCandidate(candidate);
        return;
      }
      // Commit ownership before DOM connection can invoke a custom-element callback.
      instance = candidate;
      element.replaceChildren(child);
      if (disposed || instance !== candidate) return;
      element.style.minBlockSize = "";
      publish("mounted");
    } catch (error) {
      try {
        releaseCandidate(candidate);
      } catch {
        /* Preserve the factory error. */
      }
      if (!disposed) element.replaceChildren();
      fail(error);
    } finally {
      mounting = false;
    }
  }
  /**
   * Capture state before eviction; failed snapshots retain content and final teardown discards it.
   * @param {boolean} final Whether the owner is ending rather than temporarily evicting content.
   */
  function release(final = false) {
    if (!instance || releasing) return;
    const owned = instance;
    if (!final) {
      let snapshot = saved;
      try {
        if (owned.snapshot) snapshot = owned.snapshot();
      } catch (error) {
        fail(error);
        return;
      }
      // Snapshot hooks may dispose this exact instance or newly retain its interaction.
      if (disposed || instance !== owned) return;
      saved = snapshot;
      if (visible || retained()) return;
    }
    const height = element.getBoundingClientRect().height;
    if (height > 0) element.style.minBlockSize = `${height}px`;
    instance = null; // Drop the controller's strong reference even if disposal throws.
    releasing = true;
    try {
      retire(owned);
    } finally {
      element.replaceChildren();
      releasing = false;
    }
    if (!disposed) {
      publish("suspended");
      // A cleanup hook may pin/reveal the window; mount only after old DOM is cleared.
      sync();
    }
  }
  /** Reconcile one event. Hysteresis prevents churn during a quick boundary crossing. */
  function sync() {
    cancelDeadline();
    if (disposed || mounting || releasing) return;
    if (visible || retained()) {
      mount();
      return;
    }
    if (!instance) return;
    timer = view.setTimeout(() => {
      timer = 0;
      if (!disposed && !visible && !retained()) release();
    }, unmountDelay);
  }
  /** Recheck after focus moves; focusout still points at the old active element synchronously. */
  function focusChanged() {
    view.queueMicrotask(sync);
  }
  /** Stop retaining a pointer interaction on release/cancel/window blur, including releases outside this window. */
  function pointerEnd() {
    pointer = false;
    view.removeEventListener("pointerup", pointerEnd, true);
    view.removeEventListener("pointercancel", pointerEnd, true);
    view.removeEventListener("blur", pointerEnd);
    sync();
  }
  /** Retain live content for a drag without keeping document-wide listeners on idle placeholders. */
  function pointerStart() {
    pointer = true;
    view.addEventListener("pointerup", pointerEnd, true);
    view.addEventListener("pointercancel", pointerEnd, true);
    view.addEventListener("blur", pointerEnd);
    sync();
  }
  element.addEventListener("focusin", sync);
  element.addEventListener("focusout", focusChanged);
  element.addEventListener("pointerdown", pointerStart);
  publish("idle");
  let unobserve = observeRenderWindow(element, root, rootMargin, (value) => {
    visible = value;
    sync();
  });
  return {
    element,
    get state() {
      return state;
    },
    get mounted() {
      return instance !== null;
    },
    /** Explicitly retain a host-owned selection/modal interaction; false resumes normal visibility management. */
    setPinned(value) {
      if (typeof value !== "boolean")
        throw new TypeError("pinned must be boolean");
      pinned = value;
      sync();
    },
    /** Retry a failed factory or reconcile a host state change without adding a polling loop. */
    refresh: sync,
    /** Final teardown discards snapshots and all owned subscriptions, deadlines and DOM. Late callbacks become inert. */
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelDeadline();
      unobserve();
      unobserve = null; // A retained disposed controller must not retain a shared pool.
      pointerEnd();
      element.removeEventListener("focusin", sync);
      element.removeEventListener("focusout", focusChanged);
      element.removeEventListener("pointerdown", pointerStart);
      release(true);
      saved = undefined;
      render = null;
      publish("disposed");
      element.remove();
    },
  };
}

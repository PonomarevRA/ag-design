import { createButton } from "./primitives.js";

/** Normalize up to four inert composer actions before mounting any DOM. */
export function normalizeComposerActions(actions) {
  if (!Array.isArray(actions) || actions.length > 4)
    throw new TypeError("At most four composer actions are supported");
  const ids = new Set(),
    result = [];
  for (const action of actions) {
    if (
      !action ||
      typeof action !== "object" ||
      Array.isArray(action) ||
      Object.keys(action).some((key) => !["id", "label"].includes(key)) ||
      typeof action.id !== "string" ||
      !/^[A-Za-z0-9_.:-]{1,64}$/.test(action.id) ||
      action.id === "send" ||
      ids.has(action.id) ||
      typeof action.label !== "string" ||
      !action.label.trim() ||
      action.label.length > 256
    )
      throw new TypeError(
        "Composer actions require unique IDs and literal labels",
      );
    ids.add(action.id);
    result.push({ id: action.id, label: action.label });
  }
  return result;
}

/**
 * Create scoped host-intent controls. Parent supplies current session/generation and UI availability.
 * At most eight unsettled tool intents are retained across session switches; this is not server deduplication.
 * No draft text, files, permissions, transport or durable results are collected here.
 */
export function createComposerActions({
  document,
  actions,
  getContext,
  onAction,
  onError,
}) {
  const element = document.createElement("div"),
    bindings = [],
    pending = new Map();
  element.className = "ag-conversation__composer-tools";
  let disposed = false;
  /** Combine bounded public identities without delimiter ambiguity. */
  function identity(context, actionId) {
    return JSON.stringify([context.sessionId, actionId]);
  }
  /** Refresh native disabled state without changing controls, focus or user data. */
  function refresh(context = getContext()) {
    if (disposed) return;
    for (const binding of bindings)
      binding.button.disabled =
        !context.canAct ||
        pending.size >= 8 ||
        pending.has(identity(context, binding.id));
  }
  /** Ignore stale diagnostics and contain failures in the host's diagnostic callback. */
  function report(error, context) {
    if (disposed) return;
    const current = getContext();
    if (
      current.sessionId !== context.sessionId ||
      current.generation !== context.generation
    )
      return;
    try {
      Promise.resolve(onError(error)).catch(() => {});
    } catch {
      /* Diagnostic failures cannot own the UI lifecycle. */
    }
  }
  for (const action of actions) {
    const button = createButton({
      document,
      label: action.label,
      variant: "quiet",
    });
    /** Resolve the actual current recipient at activation and fence late completions by their own token. */
    function activate() {
      const context = getContext(),
        key = identity(context, action.id);
      if (disposed || !context.canAct || pending.size >= 8 || pending.has(key))
        return;
      const token = {};
      pending.set(key, token);
      refresh(context);
      let returned;
      try {
        returned = onAction({
          sessionId: context.sessionId,
          actionId: action.id,
        });
      } catch (error) {
        report(error, context);
      }
      Promise.resolve(returned)
        .catch((error) => report(error, context))
        .finally(() => {
          if (disposed) return;
          if (pending.get(key) === token) pending.delete(key);
          refresh();
        });
    }
    button.addEventListener("click", activate);
    bindings.push({ id: action.id, button, activate });
    element.append(button);
  }
  /** Structural facts omit action names, session IDs and all draft content. */
  function inspect() {
    return { toolCount: bindings.length, pendingTools: pending.size };
  }
  /** Release only owned listeners and bounded pending references; host operations remain host-owned. */
  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const { button, activate } of bindings) {
      button.removeEventListener("click", activate);
      button.disabled = true;
    }
    bindings.length = 0;
    pending.clear();
    element.remove();
  }
  return { element, refresh, inspect, dispose };
}

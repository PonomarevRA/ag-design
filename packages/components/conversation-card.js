import { createButton } from "./primitives.js";

let serial = 0;
const states = new Set(["ready", "loading", "empty", "error"]);

/** Validate bounded literal content before changing any visible state. */
function normalize(data) {
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new TypeError("Card data must be an object");
  const result = {};
  for (const [key, limit] of [
    ["title", 256],
    ["summary", 4096],
    ["message", 1024],
  ]) {
    const value = data[key] ?? "";
    if (
      typeof value !== "string" ||
      value.length > limit ||
      (key === "title" && !value.trim())
    )
      throw new TypeError(`Invalid card ${key}`);
    result[key] = value;
  }
  result.status = data.status ?? "ready";
  if (!states.has(result.status)) throw new TypeError("Unknown card status");
  if (result.status !== "ready" && !result.message.trim())
    throw new TypeError(
      "Loading, empty and error states need a visible message",
    );
  return result;
}

/**
 * Create an inline result card, with at most two host-owned actions.
 * Callbacks express intent only; the host owns async work, permissions and accepted data.
 * Updates retain button identity and previous content unless explicitly replaced.
 * Disabling a focused action while loading follows native focus behavior; the host owns recovery.
 * No bridge, fullscreen, automatic retry, HTML parsing or persistence is installed.
 */
export function createConversationCard({
  document = globalThis.document,
  headingLevel = 3,
  actions = [],
  onError = () => {},
  ...data
} = {}) {
  if (
    !document?.createElement ||
    ![2, 3, 4, 5, 6].includes(headingLevel) ||
    !Array.isArray(actions) ||
    actions.length > 2 ||
    typeof onError !== "function"
  )
    throw new TypeError("Invalid conversation card options");
  let current = normalize(data),
    disposed = false;
  const identities = new Set(),
    definitions = [];
  let primaryCount = 0;
  for (const action of actions) {
    if (
      !action ||
      typeof action.id !== "string" ||
      !/^[A-Za-z0-9_.:-]{1,64}$/.test(action.id) ||
      identities.has(action.id) ||
      typeof action.label !== "string" ||
      !action.label.trim() ||
      action.label.length > 256 ||
      typeof action.onAction !== "function" ||
      (action.primary !== undefined && typeof action.primary !== "boolean")
    )
      throw new TypeError(
        "Actions need unique public ids, labels and callbacks",
      );
    identities.add(action.id);
    if (action.primary) primaryCount++;
    definitions.push({
      id: action.id,
      label: action.label,
      primary: action.primary === true,
      onAction: action.onAction,
    });
  }
  if (primaryCount > 1)
    throw new TypeError("Only one primary action is supported");
  const element = document.createElement("article"),
    content = document.createElement("div"),
    title = document.createElement(`h${headingLevel}`),
    summary = document.createElement("p"),
    message = document.createElement("p"),
    footer = document.createElement("div");
  element.className = "ag-conversation-card";
  title.id = `ag-conversation-card-${++serial}`;
  element.setAttribute("aria-labelledby", title.id);
  content.className = "ag-conversation-card__content";
  message.className = "ag-conversation-card__message";
  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");
  message.setAttribute("aria-atomic", "true");
  footer.className = "ag-conversation-card__actions";
  content.append(title, summary);
  // Keep status outside the busy subtree so loading does not defer its announcement.
  element.append(content, message, footer);
  const bindings = [];
  /** Contain callback and diagnostic failures; an attempted action never implies success. */
  function report(error) {
    if (disposed) return;
    try {
      Promise.resolve(onError(error)).catch(() => {});
    } catch {
      /* Diagnostics cannot own the card lifecycle. */
    }
  }
  for (const action of definitions) {
    const button = createButton({
      document,
      label: action.label,
      variant: action.primary ? "primary" : "secondary",
    });
    /** Forward a public intent once; the host applies results explicitly through update. */
    function activate() {
      if (disposed || current.status === "loading") return;
      try {
        Promise.resolve(action.onAction({ actionId: action.id })).catch(report);
      } catch (error) {
        report(error);
      }
    }
    button.addEventListener("click", activate);
    bindings.push({ button, activate });
    footer.append(button);
  }
  /** Patch owned literal nodes; preserve action nodes and follow native disabled focus behavior. */
  function paint() {
    title.textContent = current.title;
    summary.textContent = current.summary;
    summary.hidden = !current.summary;
    content.setAttribute("aria-busy", String(current.status === "loading"));
    element.dataset.state = current.status;
    message.textContent = current.message;
    message.hidden = !current.message;
    footer.hidden = bindings.length === 0;
    for (const { button } of bindings)
      button.disabled = current.status === "loading";
  }
  /** Atomically apply validated display data; no accepted business state is inferred. */
  function update(patch) {
    if (disposed) return false;
    if (!patch || typeof patch !== "object" || Array.isArray(patch))
      throw new TypeError("Card patch must be an object");
    const next = normalize({ ...current, ...patch });
    current = next;
    paint();
    return true;
  }
  /** Return redacted bounded facts, without titles, summaries, messages or callbacks. */
  function inspect() {
    return {
      status: current.status,
      disposed,
      actionCount: bindings.length,
      primaryActionCount: primaryCount,
      context: "host-owned",
      mode: "inline",
      transport: "host-owned",
    };
  }
  /** Release only owned handlers and DOM; late callback results become inert. */
  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const { button, activate } of bindings) {
      button.removeEventListener("click", activate);
      button.disabled = true;
    }
    element.remove();
  }
  paint();
  return { element, update, inspect, dispose };
}

export { inspectConversationSurface } from "./conversation-surface.js";

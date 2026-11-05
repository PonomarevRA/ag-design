import { resolveI18n } from "./i18n.js";
import { applyControlGeometry } from "./geometry.js";

/** Stable UI: status lives outside the busy subtree; locale changes preserve content and controls. */
export function createAsyncBoundaryView({
  document,
  label,
  minHeight,
  i18n,
  run,
  cancel,
}) {
  const context = resolveI18n(document, i18n);
  const element = document.createElement("section");
  element.className = "ag-async-boundary";
  element.setAttribute("role", "region");
  element.setAttribute("aria-label", label);
  element.tabIndex = -1;
  const content = document.createElement("div");
  content.className = "ag-async-boundary__content";
  content.style.minHeight = `${minHeight}px`;
  const status = document.createElement("p");
  status.className = "ag-async-boundary__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-atomic", "true");
  const actions = document.createElement("div");
  actions.className = "ag-async-boundary__actions";
  const retry = document.createElement("button"),
    stop = document.createElement("button");
  for (const button of [retry, stop]) {
    button.type = "button";
    button.className = "ag-button ag-button--secondary";
    applyControlGeometry(button, { density: "comfortable" });
    actions.append(button);
  }
  retry.addEventListener("click", run);
  stop.addEventListener("click", cancel);
  element.append(content, status, actions);
  let state,
    showLoading = false,
    disposed = false;

  /** Preserve focus during retained refreshes; removing a focused owned subtree uses the named region. */
  function clear() {
    if (content.contains(document.activeElement)) element.focus();
    content.replaceChildren();
  }
  function visible(button, show) {
    if (!show && button.contains(document.activeElement)) element.focus();
    button.hidden = !show;
  }
  function paint() {
    if (disposed || !state) return;
    element.dataset.state = state.status;
    element.dataset.stale = String(state.stale);
    content.setAttribute("aria-busy", String(state.status === "loading"));
    let key = state.status;
    if (key === "loading")
      key = showLoading ? (state.hasContent ? "refreshing" : "loading") : null;
    if (key === "error" && state.errorKind === "timeout") key = "timeout";
    if (key === "ready" || key === "disposed") key = null;
    status.textContent = key ? context.t(`async.${key}`) : "";
    if (state.stale && key && key !== "refreshing")
      status.textContent += ` ${context.t("async.stale")}`;
    retry.textContent = context.t("async.retry");
    stop.textContent = context.t("common.cancel");
    visible(
      retry,
      ["error", "cancelled", "empty", "idle"].includes(state.status),
    );
    if (disposed) return;
    visible(stop, state.status === "loading");
    actions.hidden = retry.hidden && stop.hidden;
  }
  const off = context.subscribe(paint);
  return {
    element,
    clear,
    append(node) {
      content.append(node);
    },
    update(next, loadingVisible = false) {
      state = next;
      showLoading = loadingVisible;
      paint();
    },
    dispose() {
      if (disposed) return;
      clear();
      content.setAttribute("aria-busy", "false");
      status.textContent = "";
      visible(retry, false);
      visible(stop, false);
      actions.hidden = true;
      retry.removeEventListener("click", run);
      stop.removeEventListener("click", cancel);
      off();
      disposed = true;
    },
  };
}

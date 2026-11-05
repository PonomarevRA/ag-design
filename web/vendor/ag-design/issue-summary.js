import {resolveI18n} from "./i18n.js";
/** Keep a task scannable: decision context first, supporting evidence behind one disclosure. */
export function createIssueSummary({
  document = globalThis.document,
  issue = {},
  onOpen,
  i18n,
} = {}) {
  let localeContext=resolveI18n(document,i18n), localeSignature="";
  const element = document.createElement("article");
  element.className = "ag-issue-summary";
  const top = node("div", "ag-issue-summary__top"),
    key = node("span", "ag-issue-summary__key"),
    status = node("span", "ag-status");
  top.append(key, status);
  const heading = node("h3", "ag-issue-summary__heading"),
    open = document.createElement("button");
  open.type = "button";
  open.className = "ag-issue-summary__open";
  heading.append(open);
  const context = node("p", "ag-issue-summary__context"),
    next = node("p", "ag-issue-summary__next");
  const details = document.createElement("details"),
    summary = document.createElement("summary"),
    evidence = node("p"),
    problems = node("p");
  summary.textContent = "Результат и проблемы";
  details.append(summary, evidence, problems);
  element.append(top, heading, context, next, details);
  let disposed = false,
    current = {};
  const activate = () => {
    if (!disposed && onOpen) onOpen(current);
  };
  open.addEventListener("click", activate);
  /** Render text literally and preserve the focused title control and disclosure state on updates. */
  function update(value) {
    if (disposed) return;
    current = { ...value };
    key.textContent = text(value.key, localeContext.t("issue.noNumber"), 80);
    status.textContent = text(value.status, localeContext.t("issue.noStatus"), 120);
    status.dataset.tone = ["accent", "success", "danger"].includes(value.tone)
      ? value.tone
      : "neutral";
    open.textContent = text(value.title, localeContext.t("issue.untitled"), 400);
    open.disabled = !onOpen;
    const role = text(value.role, localeContext.t("issue.noRole"), 120);
    const systems = Array.isArray(value.systems)
      ? value.systems
          .slice(0, 3)
          .map((item) => text(item, "", 80))
          .join(" · ")
      : "";
    context.textContent = systems ? `${role} · ${systems}` : role;
    next.textContent = localeContext.t("issue.next",{name:text(value.nextAction,localeContext.t("issue.noNext"),240)});
    evidence.textContent = localeContext.t("issue.result",{name:text(value.result,localeContext.t("issue.noResult"),600)});
    problems.textContent = localeContext.t("issue.problems",{name:text(value.problems,localeContext.t("issue.noProblems"),600)});
    element.dataset.state = value.tone === "danger" ? "attention" : "ordinary";
  }
  /** Remove the callback and prevent stale asynchronous updates after unmount. */
  function dispose() {
    disposed = true;
    open.removeEventListener("click", activate);
    current = {};
  }
  /** Create one owned DOM node; callers never supply HTML. */
  function node(tag, className = "") {
    const item = document.createElement(tag);
    item.className = className;
    return item;
  }
  update(issue);
  return { element, update, dispose,
    /** Repaint only default labels; explicit task fields remain literal. */
    refreshLocaleContent(context){const signature=context.locale+context.t("issue.next")+context.t("issue.untitled");if(signature===localeSignature)return;localeSignature=signature;localeContext=context;update(current);}
  };
}

/** Bound log-derived content; a visible ellipsis communicates truncation. */
function text(value, fallback, limit) {
  const result = typeof value === "string" && value.trim() ? value : fallback;
  return result.length > limit ? result.slice(0, limit - 1) + "…" : result;
}

import { renderConversationText } from "./agent-conversation-markdown.js";
import { createConversationCode } from "./agent-conversation-code.js";
import { conversationLabels } from "./conversation-labels.js";
export { conversationStatusLabels } from "./conversation-labels.js";

/** Monochrome operation marks are decorative; kind and status remain available as readable text. */
function operationIcon(document, kind) {
  const icon = document.createElement("span");
  icon.className = "ag-conversation__operation-icon";
  icon.setAttribute("aria-hidden", "true");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 20 20");
  svg.setAttribute("focusable", "false");
  const path = document.createElementNS(svg.namespaceURI, "path");
  const paths = {
    terminal: "M3 4h14v12H3z M6 8l2 2-2 2 M10 12h4",
    files: "M5 2h7l4 4v12H5z M12 2v5h4 M8 11h5 M8 14h5",
    permission: "M10 2l7 3v5c0 4-7 8-7 8S3 14 3 10V5z M10 6v5 M10 14v.1",
    tool: "M8 6l2-2a3 3 0 014 4l-3 3a3 3 0 01-4 0 M12 14l-2 2a3 3 0 01-4-4l3-3a3 3 0 014 0",
  };
  path.setAttribute("d", paths[kind] ?? "M4 5h12 M4 10h12 M4 15h8");
  svg.append(path);
  icon.append(svg);
  return icon;
}

/** Build one safe typed block. All content is literal; host capabilities gate every user action. */
export function createConversationBlock({
  document,
  part,
  onAction,
  canAct,
  getLabels = conversationLabels,
}) {
  let current = part,
    renderedText = null,
    pending = false,
    disposed = false;
  const kind = part.kind;
  const plain = ["text", "markdown", "result", "error"].includes(kind);
  const technical = ["tool", "terminal", "files"].includes(kind);
  const element = document.createElement(plain ? "div" : "details");
  element.className = "ag-conversation__block";
  element.dataset.kind = kind;
  element.dataset.blockId = part.id;
  const summary = document.createElement(plain ? "p" : "summary");
  summary.className = "ag-conversation__block-summary";
  const title = document.createElement("strong"),
    status = document.createElement("span");
  status.className = "ag-conversation__block-status";
  if (!plain) summary.append(operationIcon(document, kind));
  summary.append(title, status);
  const body = document.createElement("div");
  body.className = "ag-conversation__block-body";
  const content = document.createElement("div");
  content.className = "ag-conversation__text";
  body.append(content);
  const fields = {};
  const fieldLabels = [
    ["input", kind === "terminal" ? "Команда" : "Входные данные"],
    ["output", "Результат операции"],
  ];
  const actions = document.createElement("div");
  actions.className = "ag-conversation__actions";
  const controls = [];
  /** The callback is an intent only; even approval does not change the displayed operation state. */
  function action(label, decision) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ag-button";
    button.textContent = label;
    const listener = () => {
      if (button.disabled) return;
      if (decision !== "inspect") {
        pending = true;
        update(current);
      }
      const requestRevision = current.revision;
      try {
        const result = onAction?.({
          blockId: current.id,
          blockRevision: requestRevision,
          actionId: current.actionId,
          decision,
        });
        Promise.resolve(result).catch(() => {
          if (!disposed && current.revision === requestRevision)
            unavailable.textContent =
              "Исход действия не подтверждён. Требуется обновление от приложения.";
        });
      } catch {
        unavailable.textContent =
          "Исход действия не подтверждён. Требуется обновление от приложения.";
      }
    };
    button.addEventListener("click", listener);
    actions.append(button);
    controls.push({ button, listener });
  }
  if (kind === "permission") {
    action("Подтвердить", "approve");
    action("Отклонить", "deny");
  } else if (kind === "question") action("Ответить", "reply");
  else if (["tool", "terminal", "files"].includes(kind))
    action("Открыть в приложении", "inspect");
  const unavailable = document.createElement("p");
  unavailable.className = "ag-conversation__muted";
  unavailable.textContent = "Действия недоступны в режиме наблюдения.";
  body.append(actions, unavailable);
  element.append(summary, body);
  if (!plain) element.open = ["question", "permission"].includes(kind);

  /** Update text nodes in place so stream chunks preserve selection, disclosure and keyboard focus. */
  function update(value) {
    if (value.revision !== current.revision) pending = false;
    current = value;
    element.dataset.status = value.status;
    const labels = getLabels();
    const caption =
      value.title || labels.kind[kind] || (plain ? "" : `Данные · ${kind}`);
    if (title.textContent !== caption) title.textContent = caption;
    // Narrative success is conveyed by the turn itself; exceptional states stay explicit.
    const quiet =
      ["text", "markdown"].includes(kind) &&
      ["unknown", "completed"].includes(value.status);
    const statusText = quiet ? "" : labels.status[value.status];
    if (status.textContent !== statusText) status.textContent = statusText;
    summary.hidden = !title.textContent && !status.textContent;
    const captionText = `${value.title || labels.kind[kind] || kind} · ${labels.status[value.status]}`;
    if (!plain) {
      summary.setAttribute("aria-label", captionText);
      summary.title = captionText;
    }
    if (renderedText !== (value.text ?? "")) {
      renderConversationText(content, value.text ?? "", kind === "markdown");
      renderedText = value.text ?? "";
    }
    content.hidden = !value.text;
    for (const [key, label] of fieldLabels) {
      let field = fields[key];
      if (!field && value[key] !== undefined) {
        field = createConversationCode({ document, label, kind: key });
        fields[key] = field;
        // Late input still precedes output, without recreating a focused output viewer.
        body.insertBefore(
          field.element,
          key === "input" ? content.nextSibling : actions,
        );
      }
      field?.update(value[key]);
    }
    const actionable =
      !["permission", "question"].includes(kind) ||
      ["requested", "pending"].includes(value.status);
    const enabled = Boolean(
      !pending &&
      actionable &&
      value.actionId &&
      canAct(value.actionId) &&
      onAction,
    );
    for (const { button } of controls) {
      button.disabled = !enabled;
      // Reading a local disclosure remains useful without an unavailable host inspector.
      button.hidden = technical && !enabled;
    }
    actions.hidden = !controls.length || (technical && !enabled);
    unavailable.hidden = !controls.length || enabled || technical;
    unavailable.textContent = pending
      ? "Ответ передан приложению. Ожидаем подтверждение."
      : "Действия недоступны в режиме наблюдения.";
  }
  update(part);
  return {
    element,
    update,
    dispose() {
      disposed = true;
      for (const { button, listener } of controls)
        button.removeEventListener("click", listener);
      for (const field of Object.values(fields)) field.dispose();
    },
  };
}

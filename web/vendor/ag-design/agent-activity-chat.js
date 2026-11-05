import { createButton } from "./primitives.js";
import { createButtonIcon } from "./button-icons.js";
import { createAgentConversation } from "./agent-conversation.js";
let sequence = 0;

/** Create a bounded, non-modal activity viewer; the application owns transport, task identity and marker effects. */
export function createAgentActivityChat({
  document = globalThis.document,
  title = "Агенты",
  status = "MCP · ожидание",
  onHistory = null,
  maxEntries = 50,
  mode = "floating",
  view = "activity",
  onMarkersChange = () => {},
} = {}) {
  if (
    !Number.isInteger(maxEntries) ||
    maxEntries < 1 ||
    maxEntries > 500 ||
    !["floating", "inline"].includes(mode) ||
    !["activity", "conversation"].includes(view)
  )
    throw new TypeError("Bounded chat capacity and mode required");
  const root = document.createElement("section");
  root.className = "ag-agent-chat";
  root.dataset.mode = mode;
  root.dataset.agComponent = "agent-activity-chat";
  const id = `ag-agent-chat-${++sequence}`,
    panel = document.createElement("section");
  panel.className = "ag-agent-chat__panel";
  panel.id = id;
  panel.hidden = true;
  panel.setAttribute("aria-label", title);
  panel.setAttribute("role", "region");
  const launcher = createButton({
    document,
    label: "Открыть действия агентов",
    icon: "●",
    iconOnly: true,
    variant: "primary",
    onClick: () => setOpen(!open),
  });
  launcher.setAttribute("aria-controls", id);
  launcher.setAttribute("aria-expanded", "false");
  /** Keep popup controls independent of the native application window. */
  function control(label, icon, action, className = "") {
    const button = createButton({
      document,
      label,
      icon,
      iconOnly: true,
      variant: "quiet",
      onClick: () => {
        if (!disposed) action();
      },
    });
    button.className += ` ag-agent-chat__control ${className}`;
    button.title = label;
    return button;
  }
  const header = document.createElement("header");
  header.className = "ag-agent-chat__header";
  const heading = document.createElement("strong");
  heading.textContent = title;
  const close = control("Закрыть ленту", "×", () => setOpen(false), "is-close");
  const minimize = control(
    "Свернуть ленту",
    "−",
    () => setOpen(false),
    "is-minimize",
  );
  const expand = control(
    "Развернуть чат",
    "↗",
    () => {
      expanded = !expanded;
      panel.dataset.expanded = String(expanded);
      expand.setAttribute("aria-pressed", String(expanded));
      expand.title = expanded ? "Вернуть размер" : "Развернуть чат";
      expand.setAttribute("aria-label", expand.title);
      expand
        .querySelector(".ag-button__icon")
        .replaceChildren(
          createButtonIcon(document, expanded ? "restore" : "expand"),
        );
    },
    "is-expand",
  );
  expand.setAttribute("aria-pressed", "false");
  const controls = document.createElement("div");
  controls.className = "ag-agent-chat__window-controls";
  controls.append(close, minimize, expand);
  const settings = control("Настройки ленты", "", () => {
    options.hidden = !options.hidden;
    settings.setAttribute("aria-expanded", String(!options.hidden));
  });
  /** Draw fixed trusted icons without treating any supplied evidence as markup. */
  function drawIcon(button, path) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const shape = document.createElementNS(svg.namespaceURI, "path");
    shape.setAttribute("d", path);
    svg.append(shape);
    button.replaceChildren(svg);
  }
  drawIcon(settings, "M4 7h16M4 17h16M9 4v6M15 14v6");
  settings.setAttribute("aria-expanded", "false");
  settings.setAttribute("aria-controls", `${id}-settings`);
  const markerButton = control(
    "Показывать работу агентов на карте",
    "●",
    () => setMarkers(!markers.checked),
    "ag-agent-chat__marker",
  );
  markerButton.setAttribute("aria-pressed", "false");
  header.append(controls, heading, settings, markerButton);
  const connection = document.createElement("p");
  connection.className = "ag-agent-chat__status";
  connection.setAttribute("role", "status");
  const options = document.createElement("div");
  options.id = `${id}-settings`;
  options.className = "ag-agent-chat__options";
  options.hidden = true;
  const label = document.createElement("label");
  label.className = "ag-agent-chat__markers";
  const markers = document.createElement("input");
  markers.type = "checkbox";
  markers.checked = false;
  label.append(markers, document.createTextNode("Показывать агентов на карте"));
  /** Reflect the independent opt-in in both representations before notifying the host. */
  function setMarkers(value) {
    if (disposed) return;
    markers.checked = Boolean(value);
    markerButton.setAttribute("aria-pressed", String(markers.checked));
    onMarkersChange(markers.checked);
  }
  const markerChange = () => setMarkers(markers.checked);
  markers.addEventListener("change", markerChange);
  options.append(label);
  const viewButton = document.createElement("button");
  viewButton.type = "button";
  viewButton.className = "ag-button";
  viewButton.textContent = "Диалог / операции";
  viewButton.setAttribute("aria-label", "Режим диалога");
  viewButton.setAttribute("aria-pressed", String(view === "conversation"));
  options.append(viewButton);
  const conversationHost = document.createElement("div");
  conversationHost.className = "ag-agent-chat__conversation";
  conversationHost.hidden = true;
  let conversation = null,
    entrySequence = 0;
  const records = [];
  const log = document.createElement("div");
  log.className = "ag-agent-chat__log";
  log.setAttribute("aria-label", "Запросы и ответы");
  log.tabIndex = 0;
  const empty = document.createElement("p");
  empty.className = "ag-agent-chat__empty";
  empty.textContent = "Нет наблюдаемых операций в выбранном окне.";
  log.append(empty);
  const notice = document.createElement("p");
  notice.className = "ag-agent-chat__notice";
  notice.setAttribute("role", "status");
  const footer = document.createElement("footer");
  footer.className = "ag-agent-chat__footer";
  const older = control("Более ранние операции", "↑", () => {
    log.scrollTop = 0;
    onHistory?.();
  });
  const live = control("К новым событиям", "↓", () => {
    log.scrollTop = log.scrollHeight;
  });
  const counter = document.createElement("span");
  counter.textContent = "Операций: 0";
  const clearButton = control("Очистить видимый журнал", "", clear);
  drawIcon(clearButton, "M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 10v6M14 10v6");
  footer.append(older, live, counter, clearButton);
  options.append(notice);
  panel.append(header, connection, options, conversationHost, log, footer);
  root.append(launcher, panel);
  let open = false,
    expanded = false,
    disposed = false,
    count = 0,
    omitted = 0;
  setStatus(status);
  const safe = (value, max = 8192) => {
    const text = String(value ?? "");
    return text.length > max ? text.slice(0, max) + "… [сокращено]" : text;
  };
  /** Convert legacy evidence into typed tool blocks without giving observations any command capability. */
  function showRecord(record) {
    const current = conversation.snapshot();
    conversation.applyUpdates({
      version: 1,
      sessionId: current.sessionId,
      sequence: current.sequence + 1,
      eventId: `activity-${record.id}`,
      operations: [
        {
          type: "upsert",
          message: {
            id: `activity-${record.id}`,
            revision: 0,
            role: "agent",
            author: record.agent,
            label: safe(`${record.task} · ${record.status}`, 256),
            blocks: [
              {
                id: "operation",
                revision: 0,
                kind: "tool",
                status: "unknown",
                title:
                  safe(record.request.split("\n")[0], 160) ||
                  "Наблюдаемая операция",
                input: record.request,
                output: record.response,
              },
            ],
          },
        },
      ],
    });
  }
  /** Keep the old renderer available; create the richer view lazily so existing popup consumers retain their DOM budget. */
  function setView(value) {
    if (disposed) return;
    if (!["activity", "conversation"].includes(value))
      throw new TypeError("Unknown activity view");
    view = value;
    panel.dataset.view = view;
    if (view === "conversation" && !conversation) {
      conversation = createAgentConversation({
        document,
        maxMessages: maxEntries,
        maxText: 16777216,
        onHistory: onHistory
          ? async () => {
              await onHistory();
              return { sessionId: `activity-${id}`, messages: [] };
            }
          : null,
      });
      conversation.applySnapshot({
        version: 1,
        sessionId: `activity-${id}`,
        title,
        messages: [],
      });
      conversationHost.append(conversation.element);
      for (const record of records) showRecord(record);
    }
    conversationHost.hidden = view !== "conversation";
    log.hidden = footer.hidden = view === "conversation";
    viewButton.setAttribute("aria-pressed", String(view === "conversation"));
  }
  const viewChange = () =>
    setView(view === "activity" ? "conversation" : "activity");
  viewButton.addEventListener("click", viewChange);
  /** Toggle without subscribing or polling; closing restores focus only when it was inside the panel. */
  function setOpen(value) {
    if (disposed) return;
    open = Boolean(value);
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));
    launcher.hidden = open;
    if (!open && panel.contains(document.activeElement)) launcher.focus();
  }
  /** Status is supplied by the host; the component never implies a live subscription itself. */
  function setStatus(value) {
    if (disposed) return;
    connection.textContent = String(value ?? "").slice(0, 256);
  }
  /** Clear only this viewer; durable server history remains the host application's responsibility. */
  function clear() {
    if (disposed) return;
    count = omitted = 0;
    log.replaceChildren(empty);
    counter.textContent = "Операций: 0";
    notice.textContent = "";
    records.length = 0;
    conversation?.applySnapshot({
      version: 1,
      sessionId: `activity-${id}`,
      title,
      messages: [],
    });
  }
  /** Append literal request/response evidence, evicting the oldest rows while retaining an explicit omission count. */
  function append(entry) {
    if (disposed) return;
    const record = {
      id: ++entrySequence,
      agent: safe(entry.agent || "Агент", 256),
      task: safe(entry.task || "Без задачи", 256),
      status: safe(entry.status || "ответ", 256),
      request: safe(entry.request),
      response: safe(entry.response),
    };
    records.push(record);
    if (records.length > maxEntries) records.shift();
    if (conversation) {
      // Local viewer cleanup can remove its window; recreate its observation session before the next legacy entry.
      if (!conversation.snapshot())
        conversation.applySnapshot({
          version: 1,
          sessionId: `activity-${id}`,
          title,
          messages: [],
        });
      showRecord(record);
    }
    const pinned =
      open && log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    const row = document.createElement("article");
    row.className = "ag-agent-chat__entry";
    const meta = document.createElement("strong");
    meta.textContent = safe(
      `${entry.agent || "Агент"} · ${entry.task || "Без задачи"} · ${entry.status || "ответ"}`,
      256,
    );
    row.append(meta);
    for (const [key, title] of [
      ["request", "Запрос"],
      ["response", "Ответ"],
    ]) {
      const block = document.createElement("details");
      block.open = key === "request";
      const caption = document.createElement("summary");
      caption.textContent = title;
      const text = document.createElement("pre");
      text.textContent = safe(entry[key]);
      block.append(caption, text);
      row.append(block);
    }
    empty.remove();
    log.append(row);
    count++;
    while (count > maxEntries) {
      log.firstElementChild.remove();
      count--;
      omitted++;
    }
    counter.textContent = `Операций: ${count}`;
    notice.textContent = omitted
      ? `Старых записей скрыто: ${omitted}. В окне: ${count}.`
      : `В окне: ${count}.`;
    if (pinned) log.scrollTop = log.scrollHeight;
  }
  const keydown = (event) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  };
  root.addEventListener("keydown", keydown);
  setView(view);
  return {
    element: root,
    append,
    setOpen,
    setStatus,
    setView,
    clear,
    get count() {
      return count;
    },
    get markersEnabled() {
      return markers.checked;
    },
    dispose() {
      if (disposed) return;
      setOpen(false);
      disposed = true;
      markers.removeEventListener("change", markerChange);
      viewButton.removeEventListener("click", viewChange);
      conversation?.dispose();
      records.length = 0;
      root.removeEventListener("keydown", keydown);
      log.replaceChildren();
    },
  };
}

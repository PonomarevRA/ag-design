import { createAgentConversationModel } from "./agent-conversation-model.js";
import { createConversationMessage } from "./agent-conversation-message.js";
import { bindConversationViewport } from "./agent-conversation-viewport.js";
import {
  normalizeComposerActions,
  createComposerActions,
} from "./conversation-composer-actions.js";

import { conversationLabels } from "./conversation-labels.js";

/** Create an independent, transport-free agent transcript. Host owns history, command keys and execution. */
export function createAgentConversation({
  document = globalThis.document,
  title = "Чат с агентом",
  maxMessages = 100,
  maxText,
  onHistory = null,
  onAction = null,
  onSend = null,
  capabilities = [],
  presentation = "document",
  composerAppearance = "standard",
  composerLabel = "Сообщение агенту",
  composerActions = [],
  onComposerAction = null,
} = {}) {
  const presentations = new Set(["document", "messenger", "work-log"]);
  if (!presentations.has(presentation))
    throw new TypeError("Unknown conversation presentation");
  if (typeof title !== "string" || !title.trim() || title.length > 256)
    throw new TypeError("Bounded title required");
  if (
    [onHistory, onAction, onSend, onComposerAction].some(
      (value) => value !== null && typeof value !== "function",
    ) ||
    !Array.isArray(capabilities) ||
    capabilities.length > 32 ||
    capabilities.some(
      (value) => typeof value !== "string" || value.length > 256,
    )
  )
    throw new TypeError(
      "Explicit bounded capabilities and optional callbacks required",
    );
  if (
    !["standard", "compact"].includes(composerAppearance) ||
    typeof composerLabel !== "string" ||
    !composerLabel.trim() ||
    composerLabel.length > 256
  )
    throw new TypeError(
      "A supported composer appearance and bounded label are required",
    );
  const actionDefinitions = normalizeComposerActions(composerActions);
  if (actionDefinitions.length && !onComposerAction)
    throw new TypeError("Composer actions need an explicit host callback");
  const allowed = new Set(capabilities);
  const senderId =
    onSend && allowed.has("send") ? globalThis.crypto?.randomUUID?.() : "";
  if (onSend && allowed.has("send") && !senderId)
    throw new TypeError(
      "Secure intent identity unavailable; use a host-owned composer",
    );
  const model = createAgentConversationModel({ maxMessages, maxText });
  const element = document.createElement("section");
  element.className = "ag-conversation";
  element.dataset.presentation = presentation;
  element.dataset.agComponent = "agent-conversation";
  element.setAttribute("aria-label", title);
  const header = document.createElement("header"),
    heading = document.createElement("h2"),
    connection = document.createElement("p");
  header.className = "ag-conversation__header";
  heading.textContent = title;
  connection.className = "ag-conversation__muted";
  connection.setAttribute("role", "status");
  header.append(heading, connection);
  const viewport = document.createElement("div"),
    list = document.createElement("div");
  viewport.className = "ag-conversation__viewport";
  viewport.tabIndex = 0;
  viewport.setAttribute("role", "region");
  viewport.setAttribute("aria-label", "Сообщения чата");
  list.className = "ag-conversation__messages";
  const empty = document.createElement("p");
  empty.textContent = "Сообщений пока нет. Историю предоставляет приложение.";
  empty.className = "ag-conversation__empty";
  const notice = document.createElement("p");
  notice.className = "ag-conversation__notice";
  notice.setAttribute("role", "status");
  const footer = document.createElement("footer");
  footer.className = "ag-conversation__footer";
  const older = document.createElement("button"),
    latest = document.createElement("button"),
    clear = document.createElement("button");
  for (const button of [older, latest, clear]) {
    button.type = "button";
    button.className = "ag-button";
  }
  older.textContent = "Загрузить историю";
  latest.textContent = "К последним";
  clear.textContent = "Очистить видимое";
  older.disabled = !onHistory;
  footer.append(older, latest, clear);
  viewport.append(empty, list);
  element.append(header, viewport, notice, footer);
  const rows = new Map(),
    listeners = [],
    views = new Map(),
    outgoing = new Map();
  let disposed = false,
    unread = 0,
    generation = 0,
    loading = false,
    abort = null,
    draft = "",
    input,
    send,
    requestCounter = 0,
    needsSnapshot = false,
    historyEnded = false,
    messageSignature = "";
  let composerTools = null,
    labels = conversationLabels();
  let labelSignature = JSON.stringify(labels);
  const scroll = bindConversationViewport({
    viewport,
    list,
    onFollowChange: (value) => {
      if (value) {
        unread = 0;
        latest.textContent = "К последним";
      }
    },
  });
  /** Track local control listeners for deterministic disposal without owning any host subscriptions. */
  function listen(target, type, callback) {
    target.addEventListener(type, callback);
    listeners.push(() => target.removeEventListener(type, callback));
  }
  /** Keep errors readable without clearing the transcript or retrying an ambiguous operation automatically. */
  function showError(error) {
    notice.textContent =
      error instanceof RangeError
        ? error.message
        : "Не удалось обновить чат. Проверьте состояние источника и повторите безопасно.";
  }

  /** Key rows and blocks independently. Existing content nodes remain mounted during unrelated updates. */
  function render() {
    const state = model.snapshot();
    if (heading.textContent !== (state?.title ?? title))
      heading.textContent = state?.title ?? title;
    const sourceStatus = `${labels.connection[state?.connection ?? "unknown"]} · ${labels.runtime[state?.runtime ?? "unknown"]}`;
    if (connection.textContent !== sourceStatus)
      connection.textContent = sourceStatus;
    empty.hidden = Boolean(state?.messages.length);
    const visible = new Set(state?.messages.map((item) => item.id));
    for (const [id, row] of rows)
      if (!visible.has(id)) {
        row.dispose();
        row.element.remove();
        rows.delete(id);
      }
    let previous = null;
    for (const item of state?.messages ?? []) {
      let row = rows.get(item.id);
      if (!row) {
        row = createConversationMessage({
          document,
          initial: item,
          presentation,
          getLabels: () => labels,
          canAct: (actionId) =>
            actionId !== "send" &&
            !needsSnapshot &&
            model.snapshot()?.connection === "connected" &&
            allowed.has(actionId),
          onAction: onAction
            ? (intent) =>
                onAction({ sessionId: model.snapshot()?.sessionId, ...intent })
            : null,
        });
        rows.set(item.id, row);
      }
      row.update(item);
      const expected = previous
        ? previous.nextElementSibling
        : list.firstElementChild;
      if (expected !== row.element) list.insertBefore(row.element, expected);
      previous = row.element;
    }
    if (state?.omitted) {
      const omission = `В окне ${state.messages.length} сообщений. Вытеснено: ${state.omitted}; полный архив хранит приложение.`;
      if (notice.textContent !== omission) notice.textContent = omission;
    }
    if (input)
      send.disabled =
        needsSnapshot ||
        outgoing.has(state?.sessionId) ||
        state?.connection !== "connected" ||
        !input.value.trim();
    composerTools?.refresh(composerContext(state));
    const ids = state?.messages.map((item) => item.id) ?? [];
    const signature = JSON.stringify([state?.sessionId, ids]);
    if (signature !== messageSignature) {
      messageSignature = signature;
      const Event = document.defaultView?.CustomEvent;
      if (Event)
        element.dispatchEvent(
          new Event("ag-conversation:messages", {
            detail: { sessionId: state?.sessionId, ids },
          }),
        );
    }
  }

  /** Locale facade hook: update owned state labels only when their dictionary changes; never translate source data. */
  function refreshLocaleContent(context) {
    if (disposed) return;
    const next = conversationLabels(context),
      signature = JSON.stringify(next);
    if (signature === labelSignature) return;
    const anchor = scroll.capture();
    labels = next;
    labelSignature = signature;
    render();
    scroll.restore(anchor);
  }

  /** Change visual presentation in place; preserve focus, disclosures, draft, requests and follow/read mode. */
  function setPresentation(value) {
    if (disposed) return false;
    if (!presentations.has(value))
      throw new TypeError("Unknown conversation presentation");
    if (presentation === value) return true;
    const anchor = scroll.capture();
    presentation = value;
    element.dataset.presentation = value;
    for (const row of rows.values()) row.setPresentation(value);
    scroll.restore(anchor);
    return true;
  }

  /** Redacted structure for agent checks; omits source text, drafts, IDs and server guarantees. */
  function presentationState() {
    let blockCount = 0,
      technicalCount = 0;
    for (const message of model.snapshot()?.messages ?? []) {
      blockCount += message.blocks.length;
      for (const block of message.blocks)
        if (["tool", "terminal", "files"].includes(block.kind))
          technicalCount++;
    }
    return {
      presentation,
      available: !disposed,
      messageCount: rows.size,
      blockCount,
      technicalCount,
    };
  }

  /** Return current UI availability without treating declared capabilities as server authorization. */
  function composerContext(state = model.snapshot()) {
    return {
      sessionId: state?.sessionId,
      generation,
      canAct:
        !disposed &&
        !needsSnapshot &&
        !outgoing.has(state?.sessionId) &&
        state?.connection === "connected",
    };
  }

  /** Expose redacted composer structure; browser geometry, AT and accepted host effects remain separate. */
  function composerState() {
    return {
      available: Boolean(input) && !disposed,
      appearance: composerAppearance,
      sendBlocked: !send || send.disabled || disposed,
      ...(composerTools?.inspect() ?? { toolCount: 0, pendingTools: 0 }),
    };
  }

  /** Remember bounded view state for at most eight sessions, independently from their host-owned data. */
  function saveView() {
    const id = model.snapshot()?.sessionId;
    if (!id) return;
    const opened = [];
    for (const [messageId, row] of rows)
      for (const part of row.element.querySelectorAll("details[open]")) {
        if (opened.length < 2048)
          opened.push([
            messageId,
            part.dataset.blockId
              ? `block:${part.dataset.blockId}`
              : `group:${part.dataset.groupId}`,
          ]);
      }
    views.set(id, {
      anchor: scroll.capture(),
      following: scroll.following,
      draft: input?.value ?? draft,
      opened,
    });
    if (views.size > 8) views.delete(views.keys().next().value);
  }
  /** Replace the active data window; invalidate pending history responses from its previous generation. */
  function applySnapshot(value) {
    if (disposed) return false;
    const anchor = scroll.capture(),
      previousId = model.snapshot()?.sessionId;
    saveView();
    model.applySnapshot(value);
    needsSnapshot = false;
    if (previousId !== value.sessionId) {
      for (const row of rows.values()) row.dispose();
      rows.clear();
      list.replaceChildren();
      unread = 0;
    }
    abort?.abort();
    generation++;
    loading = false;
    historyEnded = false;
    older.disabled = !onHistory;
    notice.textContent = "";
    render();
    const view = views.get(value.sessionId);
    if (view && previousId !== value.sessionId) {
      for (const [messageId, row] of rows)
        for (const part of row.element.querySelectorAll("details")) {
          const id = part.dataset.blockId
            ? `block:${part.dataset.blockId}`
            : `group:${part.dataset.groupId}`;
          part.open = view.opened.some(
            ([savedMessage, savedId]) =>
              savedMessage === messageId && savedId === id,
          );
        }
    }
    if (input) input.value = view?.draft ?? "";
    if (previousId === value.sessionId) scroll.restore(anchor);
    else if (view && !view.following) scroll.read(view.anchor);
    else scroll.follow();
    render();
    return true;
  }
  /** Publish a validated update; an ambiguous stream leaves the last data visible and asks for resynchronization. */
  function applyUpdates(value) {
    if (disposed) return false;
    const anchor = scroll.capture(),
      following = scroll.following;
    const retainIds = [];
    const focused = document.activeElement?.closest?.("[data-message-id]");
    if (focused && list.contains(focused))
      retainIds.push(focused.dataset.messageId);
    if (!following && anchor.id) retainIds.push(anchor.id);
    let result;
    try {
      result = model.applyUpdates(value, { retainIds });
    } catch (error) {
      if (error.code !== "window_full") throw error;
      showError(error);
      return { applied: false, reason: "window_full" };
    }
    if (!result.applied) {
      if (["gap", "resync_required"].includes(result.reason)) {
        needsSnapshot = true;
        render();
        notice.textContent =
          "Есть пропуск событий. Требуется свежий снимок; отправка команд не повторялась.";
      }
      return result;
    }
    render();
    scroll.restore(anchor);
    if (!following) {
      unread++;
      latest.textContent = `Новых обновлений: ${unread} · К последним`;
    }
    return result;
  }
  /** Ask the host for one bounded history page; stale responses and errors cannot alter another session. */
  async function history() {
    if (!onHistory || loading || historyEnded || disposed || !model.snapshot())
      return;
    const sessionId = model.snapshot().sessionId,
      token = generation;
    const anchor = scroll.capture();
    loading = true;
    older.disabled = true;
    abort = new AbortController();
    notice.textContent = "Загружаем историю…";
    try {
      const page = await onHistory({
        sessionId,
        beforeMessageId: model.snapshot().messages[0]?.id,
        signal: abort.signal,
      });
      if (disposed || token !== generation) return;
      if (page?.sessionId !== sessionId)
        throw new TypeError("History session mismatch");
      model.prepend(page);
      historyEnded = page.hasMore === false;
      notice.textContent = page.messages.length
        ? "История загружена."
        : "Более ранних сообщений нет.";
      render();
      scroll.read(anchor);
    } catch (error) {
      if (!disposed && token === generation) showError(error);
    } finally {
      if (!disposed && token === generation) {
        loading = false;
        older.disabled = historyEnded;
      }
    }
  }
  /** Clear the current viewer only. It cannot delete durable history or revoke an outstanding command. */
  function clearVisible() {
    abort?.abort();
    generation++;
    loading = false;
    historyEnded = false;
    older.disabled = !onHistory;
    model.clear();
    unread = 0;
    notice.textContent =
      "Очищено только видимое окно. История приложения сохранена.";
    render();
  }

  /** Resolve only a matching outgoing intent. Unknown keeps Send blocked until the host reconciles its durable outcome. */
  function resolveSend({ sessionId, requestId, status }) {
    const pending = outgoing.get(sessionId);
    if (
      disposed ||
      !pending ||
      pending.requestId !== requestId ||
      !["accepted", "rejected", "unknown"].includes(status)
    )
      return false;
    const active = model.snapshot()?.sessionId === sessionId;
    if (status === "unknown") {
      if (active)
        notice.textContent =
          "Статус отправки неизвестен. Приложение должно сверить исход; автоматического повтора нет.";
      return true;
    }
    outgoing.delete(sessionId);
    if (status === "accepted") {
      if (active && input?.value === pending.text) input.value = "";
      const saved = views.get(sessionId);
      if (saved?.draft === pending.text) saved.draft = "";
    }
    if (active) {
      notice.textContent =
        status === "accepted"
          ? "Сообщение принято приложением."
          : "Отправка отклонена; текст сохранён.";
      render();
    }
    return true;
  }
  listen(older, "click", history);
  listen(latest, "click", () => scroll.follow());
  listen(clear, "click", clearVisible);

  if (onSend && allowed.has("send")) {
    const form = document.createElement("form"),
      label = document.createElement("label");
    form.className = `ag-conversation__composer${composerAppearance === "compact" ? " ag-conversation__composer--compact" : ""}`;
    label.textContent = composerLabel;
    input = document.createElement("textarea");
    input.rows = composerAppearance === "compact" ? 1 : 3;
    input.maxLength = 16384;
    input.setAttribute("aria-label", composerLabel);
    input.placeholder = "Опишите задачу · Enter — новая строка";
    label.append(input);
    send = document.createElement("button");
    send.type = "submit";
    send.className = "ag-button";
    send.textContent = "Отправить";
    const visibleActions = actionDefinitions.filter((action) =>
      allowed.has(action.id),
    );
    if (visibleActions.length) {
      composerTools = createComposerActions({
        document,
        actions: visibleActions,
        getContext: composerContext,
        onAction: onComposerAction,
        onError: showError,
      });
    }
    if (composerAppearance === "compact" || composerTools) {
      const bar = document.createElement("div");
      bar.className = "ag-conversation__composer-bar";
      if (composerTools) bar.append(composerTools.element);
      bar.append(send);
      form.append(label, bar);
    } else form.append(label, send);
    element.append(form);
    listen(input, "input", () => {
      draft = input.value;
      render();
    });
    listen(form, "submit", async (event) => {
      event.preventDefault();
      const session = model.snapshot();
      if (
        needsSnapshot ||
        outgoing.has(session?.sessionId) ||
        !input.value.trim() ||
        session?.connection !== "connected" ||
        disposed
      )
        return;
      if (outgoing.size >= 8) {
        notice.textContent = "Сначала уточните исход предыдущих отправок.";
        return;
      }
      if (input.value.length > 16384) {
        notice.textContent = "Сообщение превышает лимит16384 символов.";
        return;
      }
      const submitted = input.value,
        requestId = `view-${senderId}-${++requestCounter}`;
      outgoing.set(session.sessionId, { requestId, text: submitted });
      render();
      try {
        const outcome = await onSend({
          sessionId: session.sessionId,
          text: submitted,
          requestId,
        });
        resolveSend({
          sessionId: session.sessionId,
          requestId,
          status: ["accepted", "rejected", "unknown"].includes(outcome?.status)
            ? outcome.status
            : "unknown",
        });
      } catch {
        resolveSend({
          sessionId: session.sessionId,
          requestId,
          status: "unknown",
        });
      } finally {
        if (!disposed) render();
      }
    });
  }
  render();
  return {
    element,
    applySnapshot,
    applyUpdates,
    clear: clearVisible,
    loadHistory: history,
    snapshot: model.snapshot,
    follow: () => scroll.follow(),
    resolveSend,
    composerState,
    setPresentation,
    presentationState,
    refreshLocaleContent,
    dispose() {
      if (disposed) return;
      disposed = true;
      abort?.abort();
      generation++;
      for (const remove of listeners) remove();
      for (const row of rows.values()) row.dispose();
      rows.clear();
      views.clear();
      outgoing.clear();
      composerTools?.dispose();
      scroll.dispose();
      model.clear();
      element.replaceChildren();
    },
  };
}

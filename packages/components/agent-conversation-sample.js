import { createAgentConversation } from "./agent-conversation.js";

/** Synthetic, offline conversation. Demo callbacks never contact an agent, shell or task service. */
export function createAgentConversationSample(document = globalThis.document) {
  const element = document.createElement("section");
  element.className = "ag-conversation-demo";
  const intro = document.createElement("p");
  intro.textContent =
    "Демонстрация · все сообщения и действия локальные. Подключение агента выполняет приложение.";
  intro.className = "ag-conversation__muted";
  const controls = document.createElement("div");
  controls.className = "ag-conversation__actions";
  const listeners = [],
    sessions = new Map();
  let chat,
    chunk = 0,
    disposed = false;
  /** Commit one deterministic demo event through the same public reducer used by real host adapters. */
  function update(operations, extra = {}) {
    const current = chat.snapshot();
    chat.applyUpdates({
      version: 1,
      sessionId: current.sessionId,
      eventId: `${current.sessionId}-${current.sequence + 1}`,
      sequence: current.sequence + 1,
      operations,
      ...extra,
    });
  }
  chat = createAgentConversation({
    document,
    maxMessages: 100,
    capabilities: ["send", "demo-inspect", "demo-permission", "demo-context"],
    composerAppearance: "compact",
    composerActions: [{ id: "demo-context", label: "Контекст" }],
    onComposerAction: ({ sessionId }) => {
      intro.textContent = `Демонстрация: параметры текущего диалога ${sessionId}. Файлы и микрофон не запрашиваются.`;
    },
    onHistory: async ({ sessionId }) => ({
      sessionId,
      hasMore: false,
      messages: [
        {
          id: "earlier",
          revision: 0,
          role: "system",
          author: "История",
          blocks: [
            {
              id: "earlier-text",
              revision: 0,
              kind: "text",
              text: "Ранее выбран проект. Это синтетическая запись истории.",
            },
          ],
        },
      ],
    }),
    onAction: (intent) => {
      if (intent.decision === "inspect") {
        intro.textContent =
          "Демонстрация: здесь приложение открыло бы файл, команду или diff. Сетевых действий нет.";
        return;
      }
      const current = chat.snapshot(),
        message = current.messages.find((item) => item.id === intent.messageId);
      message.revision++;
      const block = message.blocks.find((item) => item.id === intent.blockId);
      block.revision++;
      block.status = intent.decision === "approve" ? "completed" : "rejected";
      block.text =
        intent.decision === "approve"
          ? "Демо-приложение подтвердило выбор."
          : "Демо-приложение подтвердило отказ.";
      update([{ type: "upsert", message }], { runtime: "idle" });
    },
    onSend: async ({ text, requestId }) => {
      update([
        {
          type: "upsert",
          message: {
            id: requestId,
            revision: 0,
            role: "user",
            author: "Вы",
            blocks: [{ id: "text", revision: 0, kind: "text", text }],
          },
        },
      ]);
      return { status: "accepted" };
    },
  });
  chat.applySnapshot({
    version: 1,
    sessionId: "demo-a",
    title: "Codex · проверка задачи",
    connection: "connected",
    runtime: "waiting",
    messages: [
      {
        id: "prompt",
        revision: 0,
        role: "user",
        author: "Вы",
        blocks: [
          {
            id: "text",
            revision: 0,
            kind: "text",
            text: "Проверь задачу и покажи изменения перед применением.",
          },
        ],
      },
      {
        id: "answer",
        revision: 0,
        role: "agent",
        author: "Codex",
        label: "DEMO-12",
        blocks: [
          {
            id: "intro",
            revision: 0,
            kind: "markdown",
            text: "Проверю **контракт** и связанные файлы. Изменения покажу отдельно.",
          },
          {
            id: "read",
            revision: 0,
            kind: "tool",
            title: "mcp.project.read_context",
            status: "completed",
            input: "read project-contract.md",
            output: "Контракт прочитан · 2 связанных файла",
            actionId: "demo-inspect",
          },
          {
            id: "related",
            revision: 0,
            kind: "tool",
            title: "mcp.project.read_context",
            status: "completed",
            input: '{\n  "file": "example.js",\n  "related": true\n}',
            output:
              '{\n  "files": ["example.js", "example.test.js"],\n  "contract": "Синтетический пример"\n}',
            actionId: "demo-inspect",
          },
          {
            id: "test",
            revision: 0,
            kind: "terminal",
            title: "npm test -- example",
            status: "completed",
            input: "npm test -- example",
            output:
              "Синтетический результат · команды не запускались\n" +
              Array.from(
                { length: 16 },
                (_, index) => `✓ example ${index + 1}: passed`,
              ).join("\n"),
            actionId: "demo-inspect",
          },
          {
            id: "files",
            revision: 0,
            kind: "files",
            title: "Предложенные изменения",
            status: "completed",
            text: "example.js · +8 / −2\nexample.test.js · +12",
            actionId: "demo-inspect",
          },
          {
            id: "progress",
            revision: 0,
            kind: "text",
            text: "Проверка завершена.",
          },
          {
            id: "permission",
            revision: 0,
            kind: "permission",
            title: "Требуется ваш ответ",
            text: "Сохранить синтетическое решение? Файлы на диске не изменятся.",
            status: "requested",
            actionId: "demo-permission",
          },
        ],
      },
    ],
  });
  /** Bind demo actions explicitly and release them with their mounted example. */
  function button(label, action) {
    const control = document.createElement("button");
    control.type = "button";
    control.className = "ag-button";
    control.textContent = label;
    const listener = () => {
      if (!disposed) action();
    };
    control.addEventListener("click", listener);
    listeners.push(() => control.removeEventListener("click", listener));
    controls.append(control);
  }
  button("Продолжить ответ", () => {
    const current = chat.snapshot(),
      answer = current.messages.find((item) => item.id === "answer");
    if (!answer) return;
    const part = answer.blocks.find((item) => item.id === "progress");
    update([
      {
        type: "delta",
        messageId: "answer",
        blockId: "progress",
        baseRevision: part.revision,
        revision: part.revision + 1,
        text: `\nФрагмент ${++chunk}: данные обновлены без новой карточки.`,
      },
    ]);
  });
  button("Обрыв / восстановление", () =>
    update([], {
      connection:
        chat.snapshot().connection === "connected"
          ? "disconnected"
          : "connected",
      runtime: "unknown",
    }),
  );
  button("Другая сессия", () => {
    const current = chat.snapshot();
    sessions.set(current.sessionId, current);
    const nextId = current.sessionId === "demo-a" ? "demo-b" : "demo-a";
    chat.applySnapshot(
      sessions.get(nextId) ?? {
        version: 1,
        sessionId: nextId,
        title: "Claude · другой диалог",
        connection: "connected",
        messages: [
          {
            id: "other",
            revision: 0,
            role: "agent",
            author: "Claude",
            blocks: [
              {
                id: "text",
                revision: 0,
                kind: "text",
                text: "Отдельная сессия. Черновики и раскрытие первой сессии сохраняются в окне.",
              },
            ],
          },
        ],
      },
    );
  });
  element.append(intro, controls, chat.element);
  return {
    element,
    conversation: chat,
    interact: () => controls.firstElementChild.click(),
    dispose() {
      disposed = true;
      for (const remove of listeners) remove();
      sessions.clear();
      chat.dispose();
    },
  };
}

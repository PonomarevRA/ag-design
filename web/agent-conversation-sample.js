import { createAgentConversationSample } from "./vendor/ag-design/agent-conversation-sample.js";
import { createChoiceChips } from "./vendor/ag-design/choice-chips.js";
import { createConversationRail } from "./vendor/content-rail/content-rail.js";

/** Compose independent core/visual-tools packages; the host owns bookmarks and the bounded target window. */
export function buildAgentConversationSample() {
  const sample = createAgentConversationSample(document);
  const element = sample.element,
    navigation = document.createElement("div");
  navigation.className = "ag-conversation-demo__navigation";
  const layout = document.createElement("div");
  layout.className = "ag-conversation-demo__layout";
  sample.conversation.element.replaceWith(layout);
  layout.append(navigation, sample.conversation.element);
  const choice = createChoiceChips({
    document,
    label: "Представление чата",
    value: "document",
    options: [
      { value: "document", label: "Документ" },
      { value: "messenger", label: "Переписка" },
      { value: "work-log", label: "Журнал работы" },
    ],
    onChange: (value) => sample.conversation.setPresentation(value),
  });
  const presentation = document.createElement("div");
  presentation.className = "ag-conversation-demo__presentation";
  const compare = document.createElement("a");
  compare.className = "ag-conversation-demo__compare";
  compare.href = "/chat-comparison.html";
  compare.textContent = "Сравнить режимы";
  compare.target = "_blank";
  compare.rel = "noopener";
  presentation.append(choice.element, compare);
  element.prepend(presentation);
  const bookmarks = new Map();
  let rail = null;
  /** Rebuild only when target identities change; streaming text does not recreate navigation or lose its focus. */
  function sync() {
    const state = sample.conversation.snapshot(),
      current = rail?.activeId;
    const focused = rail?.element.contains(document.activeElement);
    rail?.dispose();
    rail = null;
    navigation.replaceChildren();
    if (!state?.messages.length) return;
    const rows = [
      ...sample.conversation.element.querySelectorAll("[data-message-id]"),
    ];
    const items = [];
    for (const message of state.messages) {
      const target = rows.find((row) => row.dataset.messageId === message.id);
      if (!target) continue;
      const id = JSON.stringify([state.sessionId, message.id]);
      items.push({
        id,
        target,
        label: message.author ?? "Сообщение",
        context: message.label ?? state.title ?? "",
        preview: message.blocks
          .map((block) => block.text ?? block.title ?? "")
          .join("\n")
          .slice(0, 1000),
        bookmarked: bookmarks.get(id) ?? false,
      });
    }
    if (!items.length) return;
    rail = createConversationRail({
      document,
      items,
      scrollRoot: sample.conversation.element.querySelector(
        ".ag-conversation__viewport",
      ),
      label: "Навигация по сообщениям",
      onBookmarkChange: ({ id, bookmarked }) => {
        bookmarks.set(id, bookmarked);
        if (bookmarks.size > 120)
          bookmarks.delete(bookmarks.keys().next().value);
      },
    });
    navigation.append(rail.element);
    const index = items.findIndex((item) => item.id === current);
    if (focused)
      rail.element
        .querySelectorAll("ol > li > button")
        [Math.max(0, index)]?.focus({ preventScroll: true });
  }
  sample.conversation.element.addEventListener(
    "ag-conversation:messages",
    sync,
  );
  sync();
  return {
    element,
    interact: sample.interact,
    dispose() {
      sample.conversation.element.removeEventListener(
        "ag-conversation:messages",
        sync,
      );
      rail?.dispose();
      bookmarks.clear();
      choice.dispose();
      sample.dispose();
    },
  };
}

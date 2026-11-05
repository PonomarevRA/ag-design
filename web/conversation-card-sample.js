import {
  createConversationCard,
  createButton,
  inspectConversationSurface,
} from "./vendor/ag-design/index.js";

/** A local-only demonstration; no real booking, bridge, credentials or network effects. */
export function buildConversationCardSample() {
  const en = document.documentElement.lang.startsWith("en"),
    element = document.createElement("section"),
    diagnostics = document.createElement("output");
  let revision = 1;
  const card = createConversationCard({
    title: en ? "Workspace preview" : "Предпросмотр рабочего пространства",
    summary: en
      ? "Two quiet areas and a shared project table."
      : "Две тихие зоны и общий стол для проекта.",
    actions: [
      {
        id: "select",
        label: en ? "Select option" : "Выбрать вариант",
        primary: true,
        onAction: () => {
          revision++;
          card.update({
            status: "ready",
            message: en
              ? `Local selection · revision ${revision}`
              : `Локальный выбор · версия ${revision}`,
          });
          renderFacts();
        },
      },
      {
        id: "details",
        label: en ? "View details" : "Уточнить детали",
        onAction: () => {
          card.update({
            summary: en
              ? "Seats: 8. This demo preserves the selected option while details change."
              : "Мест: 8. При уточнении деталей выбранный вариант сохраняется.",
          });
        },
      },
    ],
  });
  /** Display synthetic structural checks independently of actual host qualification. */
  function renderFacts() {
    const facts = card.inspect();
    const result = inspectConversationSurface({
      ...facts,
      context: "chatgpt",
      nestedScroll: false,
      deepNavigation: false,
      duplicateComposer: false,
    });
    diagnostics.textContent = en
      ? `Declared structure: ${result.status}. Host and AT: untested.`
      : `Заявленная структура: ${result.status}. Host и AT: не проверены.`;
  }
  const reset = createButton({
    label: en ? "Show loading state" : "Показать загрузку",
    variant: "quiet",
  });
  /** Toggle a synthetic pending state without performing asynchronous side effects. */
  function toggle() {
    const loading = card.inspect().status !== "loading";
    card.update({
      status: loading ? "loading" : "ready",
      message: loading ? (en ? "Updating details…" : "Обновляем детали…") : "",
    });
    renderFacts();
  }
  reset.addEventListener("click", toggle);
  element.className = "ag-conversation-sample";
  element.append(card.element, reset, diagnostics);
  renderFacts();
  return {
    element,
    interact: toggle,
    dispose() {
      reset.removeEventListener("click", toggle);
      card.dispose();
      element.remove();
    },
  };
}

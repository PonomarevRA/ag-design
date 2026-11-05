import { createAgentConversation } from "./vendor/ag-design/agent-conversation-localized.js";
import { createSegmentedChoice } from "./vendor/ag-design/segmented-choice.js";
import { applyColorProfile } from "./vendor/ag-design/color-profile.js";
import { createI18n } from "./vendor/ag-design/i18n.js";
import { comparisonSnapshot } from "./chat-comparison-data.js";

/** Own only a bounded comparison host. All three real controllers receive the same snapshot and local update. */
export function mountChatComparison({ document, root, locale = "ru" }) {
  const en = locale === "en",
    text = (ru, english) => (en ? english : ru);
  const context = createI18n({
    locale,
    availableLocales: [locale],
    fallbackLocale: locale,
  });
  const views = ["document", "messenger", "work-log"],
    chats = [];
  let disposed = false,
    scenario = "result",
    shared = null;
  const status = document.createElement("p");
  status.className = "comparison-status";
  status.setAttribute("role", "status");
  const grid = document.createElement("div");
  grid.className = "comparison-grid";
  const notes = [
    text(
      "Объяснения и большие ответы. Содержание читается как документ.",
      "Explanations and longer answers. Content reads as a document.",
    ),
    text(
      "Короткие реплики и работа с собеседником. Автор различим по положению.",
      "Short exchanges with a recipient. Position distinguishes speakers.",
    ),
    text(
      "Операции и длительная работа. Хронология и статусы видны сразу.",
      "Operations and longer work. Chronology and status stay explicit.",
    ),
  ];
  /** Reset the scenario atomically across the three bounded viewers; no external effects or synthetic clocks. */
  function setScenario(value) {
    if (disposed) return false;
    const next = comparisonSnapshot(value, locale);
    scenario = value;
    choice.setValue(value);
    shared = next;
    for (const chat of chats) chat.applySnapshot(next);
    status.textContent = text(
      "Одинаковые сообщения во всех трёх вариантах. Все действия локальные.",
      "Identical messages in all three views. All actions are local.",
    );
    return true;
  }
  /** Append only the explicit local user's message to every view; it is not agent execution or network delivery. */
  function send(intent) {
    if (disposed) return { status: "rejected" };
    if (shared.messages.length >= 24) {
      status.textContent = text(
        "Для продолжения выберите сценарий заново.",
        "Choose a scenario again to continue.",
      );
      return { status: "rejected" };
    }
    const message = {
      id: "local-" + shared.messages.length,
      revision: 0,
      role: "user",
      author: text("Вы", "You"),
      blocks: [{ id: "text", revision: 0, kind: "text", text: intent.text }],
    };
    shared = { ...shared, messages: [...shared.messages, message] };
    for (const chat of chats) chat.applySnapshot(shared);
    status.textContent = text(
      "Сообщение добавлено локально во все варианты. Ответ агента не имитируется.",
      "Message added locally to every view. No agent response is simulated.",
    );
    return { status: "accepted" };
  }
  for (let i = 0; i < views.length; i++) {
    const card = document.createElement("section"),
      heading = document.createElement("h2"),
      note = document.createElement("p");
    card.className = "comparison-column";
    card.dataset.view = views[i];
    heading.textContent = [
      text("Документ", "Document"),
      text("Переписка", "Messenger"),
      text("Журнал работы", "Work log"),
    ][i];
    note.textContent = notes[i];
    note.className = "comparison-note";
    const chat = createAgentConversation({
      document,
      i18n: context,
      title: heading.textContent,
      presentation: views[i],
      composerAppearance: "compact",
      composerLabel: text(
        "Сообщение для общего сценария",
        "Message for the shared scenario",
      ),
      capabilities: ["send", "demo-answer"],
      onSend: async (intent) => send(intent),
      onAction: () => {
        if (!disposed)
          status.textContent = text(
            "Это локальный пример вопроса. Решение и результат задаёт приложение.",
            "This is a local question example. The host supplies the decision and result.",
          );
      },
    });
    card.append(heading, note, chat.element);
    grid.append(card);
    chats.push(chat);
  }
  const choice = createSegmentedChoice({
    document,
    label: text("Общий сценарий", "Shared scenario"),
    value: scenario,
    options: [
      { value: "result", label: text("Результат", "Result") },
      { value: "running", label: text("В работе", "Running") },
      { value: "question", label: text("Вопрос", "Question") },
      { value: "error", label: text("Ошибка", "Error") },
    ],
    onChange: setScenario,
  });
  root.append(choice.element, status, grid);
  setScenario(scenario);
  return {
    chats,
    setScenario,
    /** Set the actual shared component direction without remounting any viewer. */
    setDirection(value) {
      if (disposed) return false;
      context.configure({ direction: value });
      return true;
    },
    /** Redacted comparison facts never return a draft or transcript. */
    inspect() {
      const signatures = chats.map((chat) => JSON.stringify(chat.snapshot()));
      return {
        scenario,
        available: !disposed,
        identicalContent:
          !disposed && signatures.every((value) => value === signatures[0]),
        views: chats.map((chat) => chat.presentationState()),
      };
    },
    /** Release only owned controllers/controls; the page owns its theme and navigation. */
    dispose() {
      if (disposed) return;
      disposed = true;
      choice.dispose();
      for (const chat of chats) chat.dispose();
      context.dispose();
      root.replaceChildren();
    },
  };
}

/** Start only when this module is loaded by its authored comparison page, not by imports in tests. */
const root = globalThis.document?.querySelector("[data-chat-comparison]");
if (root) {
  const locale =
    new URLSearchParams(location.search).get("lang") === "en" ? "en" : "ru";
  document.documentElement.lang = locale;
  const comparison = mountChatComparison({ document, root, locale });
  const theme = document.querySelector("#comparison-theme");
  document
    .querySelector("#comparison-text-size")
    .addEventListener("change", (event) => {
      document.documentElement.style.fontSize = event.target.value + "px";
    });
  document
    .querySelector("#comparison-direction")
    .addEventListener("change", (event) => {
      document.documentElement.dir = event.target.value;
      comparison.setDirection(event.target.value);
    });
  const profile = document.querySelector("#comparison-profile");
  let profiles = [];
  const abort = new AbortController();
  /** A profile changes host tokens only; unknown/unavailable profiles retain existing semantic defaults. */
  function appearance() {
    const selected = profiles.find((item) => item.id === profile.value);
    if (selected)
      applyColorProfile(document.documentElement, selected, theme.value);
    document.documentElement.style.colorScheme = theme.value;
  }
  theme.addEventListener("change", appearance);
  profile.addEventListener("change", appearance);
  fetch("/api/v1/profiles", { signal: abort.signal })
    .then((response) => {
      if (!response.ok) throw new Error("Profile unavailable");
      return response.json();
    })
    .then((data) => {
      profiles = data.items;
      for (const item of profiles) {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.name;
        profile.append(option);
      }
      profile.disabled = false;
      appearance();
    })
    .catch((error) => {
      if (error.name !== "AbortError")
        profile.title =
          locale === "en"
            ? "Default semantic tokens retained"
            : "Сохранены стандартные семантические токены";
    });
  if (locale === "en") {
    const copy = {
      heading: "Three views. One conversation.",
      textSize: "Text size",
      intro:
        "Compare the same messages and operation states. Presentation changes how content reads; it does not change what happened.",
      back: "AG Design catalogue",
      theme: "Appearance",
      profile: "Palette",
      check: "Show structural checks",
      checks: "Agent checks",
      light: "Light",
      dark: "Dark",
    };
    for (const node of document.querySelectorAll("[data-copy]"))
      node.textContent = copy[node.dataset.copy];
  }
  const language = document.querySelector("#comparison-language");
  language.value = locale;
  language.addEventListener("change", () => {
    const url = new URL(location.href);
    url.searchParams.set("lang", language.value);
    location.assign(url);
  });
  document.querySelector("#comparison-check").addEventListener("click", () => {
    document.querySelector("#comparison-facts").textContent = JSON.stringify(
      comparison.inspect(),
      null,
      2,
    );
  });
  window.addEventListener(
    "pagehide",
    () => {
      abort.abort();
      comparison.dispose();
    },
    { once: true },
  );
}

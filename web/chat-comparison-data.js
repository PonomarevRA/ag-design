/** Produce fresh equal synthetic snapshots; no vendor data, timers, transport or inferred delivery. */
export function comparisonSnapshot(scenario = "result", locale = "ru") {
  if (!["result", "running", "question", "error"].includes(scenario))
    throw new TypeError("Unknown comparison scenario");
  const en = locale === "en";
  const text = (ru, english) => (en ? english : ru);
  const operationStatus = {
    result: "completed",
    running: "running",
    question: "completed",
    error: "failed",
  }[scenario];
  const runtime = {
    result: "idle",
    running: "running",
    question: "waiting",
    error: "idle",
  }[scenario];
  const blocks = [
    {
      id: "read",
      revision: 0,
      kind: "tool",
      title: text("Изучить компоненты", "Inspect components"),
      status: "completed",
      text: text(
        "Проверены форма, поиск и карточки каталога.",
        "Reviewed the form, search and catalogue cards.",
      ),
    },
    {
      id: "layout",
      revision: 0,
      kind: "tool",
      title: text("Проверить компоновку", "Check layout"),
      status: operationStatus,
      text: text(
        "Контрольные ширины: 320, 768 и 1440 px.",
        "Review widths: 320, 768 and 1440 px.",
      ),
    },
  ];
  if (scenario === "question")
    blocks.push({
      id: "question",
      revision: 0,
      kind: "question",
      title: text("Уточните приоритет", "Choose a priority"),
      status: "requested",
      text: text(
        "Что важнее для первого экрана: поиск или последние компоненты?",
        "What matters most on the first screen: search or recent components?",
      ),
      actionId: "demo-answer",
    });
  if (scenario === "error")
    blocks.push({
      id: "error",
      revision: 0,
      kind: "error",
      status: "failed",
      title: text("Проверка не завершена", "Check incomplete"),
      text: text(
        "Данные для узкого экрана недоступны. Предыдущий результат сохранён; повтор запускает приложение.",
        "Narrow-screen data is unavailable. The previous result is retained; the host owns retries.",
      ),
    });
  if (scenario === "result")
    blocks.push({
      id: "answer",
      revision: 0,
      kind: "markdown",
      status: "completed",
      text: text(
        "**Каталог стал понятнее**\n\n- Поиск занимает основное место в первой строке.\n- Связанные поля используют общие треки.\n- Карточки сохраняют компоновку Pinterest.\n\nПодготовлено 3 рекомендации. Изменения не опубликованы.",
        "**A clearer catalogue**\n\n- Search leads the first row.\n- Related fields share layout tracks.\n- Cards retain the Pinterest layout.\n\nPrepared 3 recommendations. No changes have been published.",
      ),
    });
  return {
    version: 1,
    sessionId: "comparison",
    title: text("Ревью каталога", "Catalogue review"),
    connection: "connected",
    runtime,
    messages: [
      {
        id: "request",
        revision: 0,
        role: "user",
        author: text("Вы", "You"),
        blocks: [
          {
            id: "prompt",
            revision: 0,
            kind: "text",
            text: text(
              "Проверь каталог компонентов и предложи три улучшения, сохранив текущую палитру.",
              "Review the component catalogue and suggest three improvements while preserving its palette.",
            ),
          },
        ],
      },
      {
        id: "review",
        revision: 0,
        role: "agent",
        author: text("Дизайн-агент", "Design agent"),
        blocks,
      },
    ],
  };
}

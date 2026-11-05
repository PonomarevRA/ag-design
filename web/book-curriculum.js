/** Stable learning routes keep chapter identities while grouping reading by a person's task. */
export const learningGroups = [
  {
    "id": "start",
    "ru": "Задача и замысел",
    "en": "Task and intent",
    "goalRu": "Результат: задача человека, контекст и критерий успеха.",
    "goalEn": "Outcome: a human task, context and success criterion."
  },
  {
    "id": "interface",
    "ru": "Взаимодействие и визуальный язык",
    "en": "Interaction and visual language",
    "goalRu": "Результат: понятный путь, состояния и выразительная композиция.",
    "goalEn": "Outcome: a usable journey, states and visual composition."
  },
  {
    "id": "inclusion",
    "ru": "Доступность и языки",
    "en": "Accessibility and languages",
    "goalRu": "Результат: управление и содержание для разных людей.",
    "goalEn": "Outcome: usable controls and content for different people."
  },
  {
    "id": "system",
    "ru": "Архитектура и дизайн-система",
    "en": "Architecture and design systems",
    "goalRu": "Результат: границы компонентов, данные и правила развития.",
    "goalEn": "Outcome: component boundaries, data and governance."
  },
  {
    "id": "assistants",
    "ru": "Ассистенты и действия приложения",
    "en": "Assistants and application actions",
    "goalRu": "Результат: общий контракт задач и платформенная матрица.",
    "goalEn": "Outcome: shared task contracts and a platform matrix."
  },
  {
    "id": "delivery",
    "ru": "Проверка и поставка",
    "en": "Validation and delivery",
    "goalRu": "Результат: доказательства качества и известные ограничения.",
    "goalEn": "Outcome: quality evidence and known limitations."
  },
  {
    "id": "communication",
    "ru": "Данные, презентации и документы",
    "en": "Data, presentations and documents",
    "goalRu": "Результат: объяснение данных в подходящем формате.",
    "goalEn": "Outcome: a data narrative in the appropriate format."
  },
  {
    "id": "other",
    "ru": "Дополнительные материалы",
    "en": "Additional guidance",
    "goalRu": "Справочные главы и материалы подключённых библиотек.",
    "goalEn": "Reference chapters and guidance from connected libraries."
  }
];
const chapterOrder = [
  "human-centered",
  "information-architecture",
  "creative-direction",
  "customer-journey-prototype",
  "layout",
  "hierarchy",
  "grouping",
  "spacing",
  "typography",
  "color",
  "color-palettes",
  "apple-shapes-color",
  "composition-optics",
  "golden-canon-grid",
  "layers",
  "navigation",
  "icons",
  "actions",
  "feedback",
  "async-components",
  "event-bus-coordination",
  "request-routing-data",
  "realtime-ui-load",
  "forms",
  "form-quality-common",
  "forms-business",
  "form-funnel",
  "form-operations",
  "cards",
  "catalog-item-presentation",
  "catalog-discovery",
  "assistant-action-contract",
  "native-assistant-overview",
  "apple-app-intents",
  "windows-app-actions",
  "android-app-functions",
  "linux-assistant-interfaces",
  "agent-control",
  "human-first-agent-interfaces",
  "webmcp-design",
  "web-security-by-design",
  "safe-web-content",
  "secure-web-actions",
  "assistant-components",
  "agent-interface-verification",
  "assistant-integration-testing",
  "motion",
  "accessibility",
  "inclusive-design",
  "internationalization-localization",
  "artifact-format-selection",
  "data",
  "data-explanation",
  "presentation-storytelling",
  "presentation-layout-recipes",
  "excel-dashboard-levels",
  "persuasive-copy",
  "platform",
  "performance",
  "evaluation",
  "creative-measurement",
  "pptx-production",
  "excel-dashboard-production",
  "brand-interchange",
  "journey-testing-retention",
  "artifact-validation",
  "golden-canon-validation",
  "marketplace",
  "component-roadmap",
  "brand-book",
  "design-system-governance",
  "trend-research",
];
const rank = new Map(chapterOrder.map((id, index) => [id, index]));

/** Unknown custom chapters remain reachable instead of disappearing from the curriculum. */
export function groupChapters(sections) {
  const buckets = new Map(learningGroups.map((group) => [group.id, []]));
  for (const section of sections)
    buckets
      .get(buckets.has(section.learningGroup) ? section.learningGroup : "other")
      .push(section);
  return learningGroups
    .map((group) => ({
      ...group,
      sections: buckets
        .get(group.id)
        .sort((a, b) => (rank.get(a.id) ?? 1000) - (rank.get(b.id) ?? 1000)),
    }))
    .filter((group) => group.sections.length);
}

/** Estimate reading time from the actual selected prose; this is a reading estimate, never learning progress. */
export function readingMinutes(detail) {
  const lesson = detail.lesson;
  const text = [
    detail.body,
    detail.summary,
    lesson?.scenario,
    lesson?.takeaway,
    lesson?.before,
    lesson?.after,
    ...(lesson?.practice ?? []),
  ]
    .filter(Boolean)
    .join(" ");
  return Math.max(1, Math.ceil(text.trim().split(/\s+/u).length / 180));
}

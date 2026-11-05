/** Each example owns a fresh synthetic editorial collection; no request publishes outside the browser. */
export function createCmsState() {
  return {
    selected: "guide",
    nextId: 1,
    items: [
      {
        id: "guide",
        title: "Хороший контент начинается с идеи",
        category: "Статья",
        status: "draft",
        excerpt: "От первого наброска — к странице, которую хочется читать.",
        body: "# Пространство для вашей идеи\n\nСоберите главное, найдите ясные слова и добавьте детали.\n\n## Сначала — смысл\n\n- Одна тема на страницу\n- Понятная структура\n- Спокойный визуальный ритм\n\n**Хороший текст помогает действовать.**",
      },
      {
        id: "about",
        title: "О нашей студии",
        category: "Страница",
        status: "published",
        excerpt: "Делаем сложное понятным.",
        body: "# Идеи, которым есть место\n\nМы создаём простые цифровые продукты для людей.\n\n## Как мы работаем\n\nИсследуем задачу, проверяем решения и бережно относимся к деталям.",
      },
      {
        id: "news",
        title: "Новая коллекция материалов",
        category: "Новость",
        status: "draft",
        excerpt: "Обновления редакционной библиотеки.",
        body: "# Небольшое обновление\n\nВ библиотеке появились новые материалы и примеры.\n\nВыберите подходящий формат и начните свой следующий проект.",
      },
    ],
  };
}
/** Filter only explicit title/category/status text while preserving the selected draft outside the result set. */
export function visibleMaterials(state, query = "", status = "all") {
  const needle = query.trim().toLocaleLowerCase("ru");
  return state.items.filter(
    (item) =>
      (status === "all" || item.status === status) &&
      `${item.title} ${item.category}`.toLocaleLowerCase("ru").includes(needle),
  );
}
/** Counts describe the same local records as the list; published is a demo state, not a network claim. */
export function cmsSummary(state) {
  let published = 0;
  for (const item of state.items) if (item.status === "published") published++;
  return {
    total: state.items.length,
    published,
    drafts: state.items.length - published,
  };
}

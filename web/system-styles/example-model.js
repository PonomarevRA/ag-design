/** Create independent synthetic records for each demo mount; no user data or persistence is involved. */
export function createWorkspace() {
  return [
    {
      id: "account",
      name: "Личный кабинет",
      category: "Продуктовый дизайн",
      description:
        "Пространство, в котором всё нужное находится с первого раза.",
      owner: "Александра",
      date: "28 октября",
      team: ["АК", "МС", "ДИ"],
      symbol: "◈",
      tasks: [
        { label: "Собрать структуру кабинета", done: true, date: "23 окт." },
        { label: "Проверить сценарий входа", done: true, date: "24 окт." },
        { label: "Подготовить UI-концепцию", done: true, date: "25 окт." },
        {
          label: "Собрать интерактивный прототип",
          done: false,
          date: "28 окт.",
        },
      ],
    },
    {
      id: "identity",
      name: "Новая айдентика",
      category: "Брендинг",
      description: "Единый язык для всех точек встречи команды и её аудитории.",
      owner: "Михаил",
      date: "30 октября",
      team: ["МС", "ЕК"],
      symbol: "✳",
      tasks: [
        { label: "Определить характер бренда", done: true, date: "22 окт." },
        {
          label: "Собрать визуальные направления",
          done: true,
          date: "24 окт.",
        },
        { label: "Выбрать финальную палитру", done: false, date: "29 окт." },
        { label: "Подготовить руководство", done: false, date: "30 окт." },
      ],
    },
    {
      id: "website",
      name: "Сайт студии",
      category: "Веб-дизайн",
      description:
        "Чёткая история студии и её работы. Первая версия готова к показу.",
      owner: "Дарья",
      date: "Завершён",
      team: ["ДИ", "АК"],
      symbol: "▤",
      tasks: [
        { label: "Собрать структуру сайта", done: true, date: "20 окт." },
        { label: "Оформить главную страницу", done: true, date: "21 окт." },
        { label: "Проверить мобильный вид", done: true, date: "22 окт." },
        { label: "Подготовить передачу", done: true, date: "23 окт." },
      ],
    },
    {
      id: "research",
      name: "Карта пути клиента",
      category: "Исследование",
      description:
        "Увидеть весь путь глазами человека и найти точки для улучшения.",
      owner: "Елена",
      date: "3 ноября",
      team: ["ЕК", "АК"],
      symbol: "⌘",
      tasks: [
        { label: "Сформулировать вопросы", done: false, date: "29 окт." },
        { label: "Провести интервью", done: false, date: "30 окт." },
        { label: "Собрать карту наблюдений", done: false, date: "3 нояб." },
      ],
    },
  ];
}

/** Derive status and progress from actual demo tasks so checkboxes and table filters remain consistent. */
export function projectSummary(project) {
  const total = project.tasks.length;
  let done = 0;
  for (const task of project.tasks) if (task.done) done++;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const state = total && done === total ? "done" : done ? "active" : "planned";
  return {
    done,
    total,
    percent,
    state,
    label: { done: "Готово", active: "В работе", planned: "Запланирован" }[
      state
    ],
  };
}

/** Filter by visible project prose and exact demo state; empty queries preserve the original order. */
export function visibleProjects(projects, query, filter) {
  const needle = query.trim().toLocaleLowerCase("ru");
  return projects.filter((project) => {
    const matchesQuery = `${project.name} ${project.category}`
      .toLocaleLowerCase("ru")
      .includes(needle);
    return (
      matchesQuery &&
      (filter === "all" || projectSummary(project).state === filter)
    );
  });
}

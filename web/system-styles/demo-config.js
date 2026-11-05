/** Authored scenario definitions: data is synthetic, local and never a device/account connection. */
const name = { key: "name", label: "Название", required: true, maxLength: 120 };
const note = {
  key: "note",
  label: "Описание и заметки",
  type: "textarea",
  maxLength: 1000,
};
const status = {
  key: "status",
  label: "Статус",
  options: [
    { value: "draft", label: "Черновик" },
    { value: "ready", label: "Готово" },
  ],
};

/** Return fresh scenario data so neighboring examples cannot mutate one another's fixtures. */
export function demoConfig(kind) {
  const configs = {
    workspace: {
      title: "Проекты и задачи",
      description:
        "Выберите проект, уточните следующий шаг и распределите работу команды.",
      records: {
        title: "Команда",
        createLabel: "Добавить участника",
        editorLabel: "Участник команды",
        description:
          "Локальный справочник команды. Приглашения и письма не отправляются.",
        fields: [
          { ...name, label: "Имя участника" },
          { key: "role", label: "Роль", maxLength: 80, required: true },
          status,
          note,
        ],
        items: [
          {
            id: "alexandra",
            name: "Александра К.",
            role: "Дизайнер продукта",
            status: "ready",
            note: "Личный кабинет · организация работы команды",
          },
          {
            id: "mikhail",
            name: "Михаил С.",
            role: "Бренд-дизайнер",
            status: "ready",
            note: "Новая айдентика · визуальное направление",
          },
        ],
      },
    },
    cms: {
      title: "Редакционная студия",
      description:
        "Материал, его свойства и предпросмотр — в одной рабочей области.",
      records: {
        title: "Медиатека",
        createLabel: "Добавить материал",
        editorLabel: "Карточка медиаматериала",
        description:
          "Локальные карточки обложек и иллюстраций. Файлы не загружаются на сервер.",
        fields: [
          name,
          {
            key: "format",
            label: "Назначение",
            options: [
              { value: "cover", label: "Обложка" },
              { value: "illustration", label: "Иллюстрация" },
              { value: "document", label: "Документ" },
            ],
          },
          status,
          note,
        ],
        items: [
          {
            id: "cover",
            name: "Обложка редакционной коллекции",
            format: "cover",
            status: "ready",
            note: "Геометрическая композиция для стартового материала",
          },
          {
            id: "guide",
            name: "Схема работы с контентом",
            format: "illustration",
            status: "draft",
            note: "Иллюстрация к разделу о структуре статьи",
          },
        ],
      },
    },
    analytics: {
      title: "Аналитика продукта",
      description:
        "Сравнивайте периоды, исследуйте рост и сохраняйте контекст решения.",
      records: {
        title: "Сохранённые отчёты",
        createLabel: "Новый отчёт",
        editorLabel: "Параметры отчёта",
        description:
          "Отчёт сохраняет выбранный период и заметку. Показатели остаются синтетическими.",
        applyLabel: "Открыть отчёт",
        fields: [
          name,
          {
            key: "period",
            label: "Период",
            options: [
              { value: "oct", label: "Октябрь 2026" },
              { value: "sep", label: "Сентябрь 2026" },
            ],
          },
          status,
          note,
        ],
        items: [
          {
            id: "october",
            name: "Рост за октябрь",
            period: "oct",
            status: "ready",
            note: "Сравнить активные пространства с платными подписками",
          },
          {
            id: "activation",
            name: "Активация в сентябре",
            period: "sep",
            status: "draft",
            note: "Найти наибольшую потерю между шагами воронки",
          },
        ],
      },
    },
    learning: {
      title: "Учебный кабинет",
      description: "Продолжайте выбранный курс и планируйте следующие занятия.",
      records: {
        title: "План занятий",
        createLabel: "Запланировать занятие",
        editorLabel: "Занятие",
        description:
          "Личный план. Исторические минуты обучения не изменяются от редактирования плана.",
        fields: [
          name,
          { key: "date", label: "Дата", type: "date", required: true },
          {
            key: "minutes",
            label: "Длительность, мин",
            type: "number",
            min: 5,
            max: 480,
            required: true,
          },
          status,
          note,
        ],
        items: [
          {
            id: "research",
            name: "Практика: исследование",
            date: "2026-11-03",
            minutes: 45,
            status: "draft",
            note: "Сформулировать вопросы к учебному проекту",
          },
          {
            id: "layout",
            name: "Разбор компоновки",
            date: "2026-11-04",
            minutes: 30,
            status: "draft",
            note: "Проверить иерархию и локальность действий",
          },
        ],
      },
    },
    console: {
      title: "Управление пространством",
      description:
        "Настройте каналы, примените локальную сцену и сохраните свой вариант.",
      records: {
        title: "Библиотека сцен",
        createLabel: "Сохранить новую сцену",
        editorLabel: "Сцена",
        description:
          "Сцены действуют только в демонстрации. Реальные устройства не подключены.",
        applyLabel: "Применить сцену",
        fields: [
          name,
          ...[0, 1, 2, 3].map((index) => ({
            key: `level${index}`,
            label: `Канал ${index + 1}, %`,
            type: "number",
            min: 0,
            max: 100,
            required: true,
          })),
          status,
          note,
        ],
        items: [
          {
            id: "work",
            name: "Рабочая сцена",
            level0: 72,
            level1: 48,
            level2: 66,
            level3: 12,
            status: "ready",
            note: "Базовые значения для повседневной работы",
          },
          {
            id: "quiet",
            name: "Спокойный вечер",
            level0: 35,
            level1: 20,
            level2: 55,
            level3: 0,
            status: "ready",
            note: "Мягкая локальная настройка",
          },
        ],
      },
    },
    fitness: {
      title: "Дневник активности",
      description:
        "Изучайте демонстрационные показатели и ведите отдельный журнал тренировок.",
      records: {
        title: "Журнал тренировок",
        createLabel: "Добавить тренировку",
        editorLabel: "Тренировка",
        description:
          "Учебный журнал с демонстрационными данными. Записи журнала отделены от примеров графиков.",
        fields: [
          name,
          { key: "date", label: "Дата", type: "date", required: true },
          {
            key: "minutes",
            label: "Длительность, мин",
            type: "number",
            min: 1,
            max: 600,
            required: true,
          },
          status,
          note,
        ],
        items: [
          {
            id: "walk",
            name: "Прогулка",
            date: "2026-10-26",
            minutes: 32,
            status: "ready",
            note: "Спокойный темп · демонстрационная запись",
          },
          {
            id: "stretch",
            name: "Растяжка",
            date: "2026-10-27",
            minutes: 15,
            status: "draft",
            note: "Запланировано на вечер",
          },
        ],
      },
    },
  };
  return configs[kind] ? JSON.parse(JSON.stringify(configs[kind])) : null;
}

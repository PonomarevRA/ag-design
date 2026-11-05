export const names = {
  tool: "Инструмент",
  terminal: "Команда",
  files: "Изменения файлов",
  plan: "План",
  thinking: "Ход работы",
  progress: "Прогресс",
  question: "Вопрос",
  permission: "Запрос разрешения",
  result: "Результат",
  error: "Ошибка",
};
export const conversationStatusLabels = {
  pending: "Ожидает",
  running: "Выполняется",
  completed: "Завершено",
  failed: "Ошибка",
  requested: "Запрошено",
  cancelled: "Отмена подтверждена",
  rejected: "Отклонено",
  unknown: "Состояние неизвестно",
};

export const connections = {
  connected: "Подключено",
  disconnected: "Связь прервана",
  loading: "Загрузка",
  error: "Источник недоступен",
  unknown: "Связь не подтверждена",
};
export const runtimes = {
  idle: "Нет текущего ответа",
  running: "Агент работает",
  waiting: "Ожидает вашего ответа",
  unknown: "Активность агента неизвестна",
};

/** Build only owned state labels through stable keys; source titles, messages and drafts never enter translation. */
export function conversationLabels(context) {
  const result = {};
  for (const [group, fallback] of Object.entries({
    kind: names,
    status: conversationStatusLabels,
    connection: connections,
    runtime: runtimes,
  })) {
    result[group] = {};
    for (const [key, value] of Object.entries(fallback))
      result[group][key] = context
        ? context.t(`conversation.${group}.${key}`)
        : value;
  }
  return result;
}

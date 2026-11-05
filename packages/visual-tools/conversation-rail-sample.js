import { createConversationRail } from "./content-rail.js";
import { node } from "./runtime.js";
let sequence = 0;
/** Demonstrate a real scroll-synchronized message rail and interactive preview inside the catalogue iframe. */
export function createConversationRailSample(document) {
  const host = node(document, "section", "ag-vt ag-vt-conversation-demo"),
    layout = node(document, "div", "ag-vt-conversation-demo__layout"),
    body = node(document, "div", "ag-vt-conversation-demo__body");
  const intro = node(
    document,
    "p",
    "ag-vt-muted",
    "Навигация по переписке · наведите на штрих или выберите его клавиатурой",
  );
  const status = node(
      document,
      "output",
      "ag-vt-muted",
      "Закладки сохраняются приложением",
    ),
    show = node(document, "button", "ag-vt-button", "Показать предпросмотр");
  show.type = "button";
  status.setAttribute("aria-live", "polite");
  const content = [
    [
      "Задача проекта",
      "Запрос",
      "Собрать библиотеку переиспользуемых элементов. Цветовой профиль выбирается отдельно от геометрии.",
    ],
    [
      "Компоненты главной страницы",
      "Обзор интерфейса",
      "Карточки показателей, таблицы и переключение периода. Данные и бизнес-расчёты принадлежат приложению.",
    ],
    [
      "Настройки отображения",
      "Решение",
      "Сохранить светлую и тёмную темы. Частые параметры доступны рядом с выбранным компонентом.",
    ],
    [
      "Навигация по сообщениям",
      "Текущий пример",
      "Боковая шкала показывает текущую позицию. Наведите на отметку: здесь появятся заголовок, контекст и отрывок. Закладка помогает вернуться к важному сообщению.",
    ],
    [
      "Проверка доступности",
      "Проверки",
      "Стрелки и Home/End выбирают пункты. Tab открывает действия карточки. Escape закрывает предпросмотр и возвращает фокус.",
    ],
    [
      "Профили и размеры",
      "Адаптация",
      "Карточка использует семантические цвета и помещается в узком окне. Длинные строки ограничены и не становятся HTML.",
    ],
    [
      "Ресурсы компонента",
      "Производительность",
      "Позиция пересчитывается только при прокрутке и изменении размера. После удаления нет фоновых кадров, таймеров и подписок.",
    ],
    [
      "Готовый результат",
      "Итог",
      "Автономный компонент без загрузок из интернета. Приложение управляет содержимым сообщений и хранением закладок.",
    ],
  ];
  const instance = ++sequence;
  const items = content.map(([label, context, preview], index) => {
    const target = node(document, "section");
    target.id = `ag-conversation-${instance}-${index}`;
    target.append(
      node(document, "small", "ag-vt-muted", context),
      node(document, "h3", "", label),
      node(document, "p", "", preview),
    );
    body.append(target);
    return {
      id: String(index),
      label,
      context,
      preview,
      target,
      bookmarked: index === 1,
    };
  });
  const rail = createConversationRail({
    document,
    items,
    scrollRoot: body,
    label: "Навигация по сообщениям",
    onBookmarkChange: ({ id, bookmarked }) => {
      status.textContent =
        (bookmarked ? "Добавлена закладка: " : "Убрана закладка: ") +
        items[Number(id)].label;
    },
  });
  const reveal = () => rail.showPreview(3);
  show.addEventListener("click", reveal);
  layout.append(rail.element, body);
  host.append(intro, show, layout, status);
  let disposed = false;
  // The catalogue should show the promised card immediately, without making the user discover a hidden hover-only feature.
  document.defaultView.queueMicrotask(() => {
    if (!disposed) reveal();
  });
  return {
    element: host,
    interact: () => rail.select(4, { focusTarget: false }),
    dispose() {
      if (disposed) return;
      disposed = true;
      show.removeEventListener("click", reveal);
      rail.dispose();
      host.remove();
    },
  };
}

import { createWidgetList, createButton } from "./vendor/ag-design/index.js";

/** Synthetic local results demonstrate current-key actions and scoped pending without real effects. */
export function buildWidgetListSample() {
  const en = document.documentElement.lang.startsWith("en"),
    element = document.createElement("section"),
    facts = document.createElement("output");
  let revision = 1;
  const items = ["Aster", "Birch", "Cedar", "Dahlia", "Elm"].map(
    (title, index) => ({
      id: `option-${index}`,
      title,
      description: en
        ? "Workspace option for comparison"
        : "Вариант рабочего пространства для сравнения",
      meta: en ? `${index + 4} seats` : `Мест: ${index + 4}`,
      action: {
        id: "choose",
        type: "workspace.choose",
        label: en ? "Select option" : "Выбрать вариант",
      },
    }),
  );
  const widget = createWidgetList({
    title: en ? "Workspace options" : "Варианты пространства",
    revision,
    items,
    limit: 3,
    showMoreLabel: en ? "Show more options" : "Показать ещё варианты",
    emptyMessage: en ? "No options" : "Нет вариантов",
    onAction(intent) {
      widget.setPending({
        scope: "self",
        itemId: intent.itemId,
        message: en
          ? "Local preview: selected action is pending"
          : "Локальный пример: ожидает только выбранное действие",
      });
      paintFacts();
    },
  });
  const finish = createButton({
    label: en ? "Complete local update" : "Завершить локальное обновление",
    variant: "quiet",
  });
  /** Apply a synthetic accepted display revision and explicitly release pending scope. */
  function complete() {
    revision++;
    widget.update({
      title: en ? "Workspace options" : "Варианты пространства",
      revision,
      items,
    });
    widget.setPending({
      scope: "none",
      message: en
        ? "Local data updated; no booking created"
        : "Локальные данные обновлены; бронирование не создавалось",
    });
    paintFacts();
  }
  /** Surface redacted structural facts independently from host/AT qualification. */
  function paintFacts() {
    const value = widget.inspect();
    facts.textContent = en
      ? `${value.visible}/${value.total} shown · revision ${value.revision}`
      : `Показано ${value.visible}/${value.total} · версия ${value.revision}`;
  }
  finish.addEventListener("click", complete);
  element.className = "ag-widget-sample";
  element.append(widget.element, finish, facts);
  paintFacts();
  return {
    element,
    interact: complete,
    dispose() {
      finish.removeEventListener("click", complete);
      widget.dispose();
      element.remove();
    },
  };
}

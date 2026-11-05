import { node } from "./runtime.js";
import {
  createToastStack,
  createFilterChips,
  createAnimatedNumber,
} from "./index.js";

/** Showcase actual public factories with synthetic data and a symmetrical owner for every local handler. */
export function createSample(id, document) {
  const element = node(document, "section", "ag-it ag-it-demo"),
    controls = node(document, "div", "ag-it-demo__controls"),
    status = node(document, "output", "ag-it-demo__status");
  const removers = [];
  let component, interact;
  /** Keep demo actions local, named and released with their sample. */
  function action(label, run) {
    const b = node(document, "button", "ag-it-demo-button", label);
    b.type = "button";
    b.addEventListener("click", run);
    removers.push(() => b.removeEventListener("click", run));
    controls.append(b);
  }
  if (id === "toast-stack") {
    component = createToastStack({ document });
    const show = () =>
      component.push({
        message: "Изменения сохранены локально",
        actionLabel: "Отменить",
        onAction: () => {
          status.textContent = "Действие отменено приложением";
        },
        duration: 5000,
      });
    action("Показать уведомление", show);
    action("Очистить", () => component.clear());
    component.push({
      message: "Композиция сохранена",
      actionLabel: "Отменить",
      onAction: () => {
        status.textContent = "Сохранение отменено приложением";
      },
      duration: 0,
    });
    status.textContent = "Действия и данные принадлежат приложению";
    interact = () => {
      show();
      component.clear();
    };
  } else if (id === "filter-chips") {
    let items = [
      { id: "all", label: "Все", count: 12 },
      { id: "ready", label: "Готово", count: 8 },
      { id: "working", label: "В работе", count: 3 },
      { id: "review", label: "На проверке", count: 1 },
      { id: "later", label: "Отложено", count: 0 },
      { id: "archived", label: "Архив", disabled: true },
    ];
    component = createFilterChips({
      document,
      items,
      onChange: ({ id }) => {
        status.textContent =
          "Выбрано: " + items.find((item) => item.id === id).label;
      },
    });
    action("Изменить счётчики", () => {
      items = items.map((item) =>
        item.count === undefined ? item : { ...item, count: item.count + 1 },
      );
      component.update({ items });
    });
    status.textContent = "Стрелки и Home/End выбирают доступный фильтр";
    interact = () => component.update({ selectedId: "working" });
  } else if (id === "animated-number") {
    component = createAnimatedNumber({
      document,
      value: 128,
      label: "Активные задачи",
    });
    element.append(
      node(document, "p", "ag-it-demo__caption", "Активные задачи"),
    );
    action("Увеличить", () => component.update(component.value + 17));
    action("Уменьшить", () => component.update(component.value - 13));
    status.textContent =
      "Точное значение · анимация только изменённых символов";
    interact = () => component.update(component.value + 17);
  } else throw new TypeError("Unknown interaction sample");
  element.append(component.element, controls, status);
  return {
    element,
    interact,
    dispose() {
      for (const remove of removers) remove();
      component.dispose();
      element.remove();
    },
  };
}

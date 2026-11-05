import { createBentoGrid, createButton } from "./vendor/ag-design/index.js";

/** Interactive modular composition; the catalogue feed remains host-owned masonry. */
export function buildBentoSample(document = globalThis.document) {
  const en = document.documentElement.lang.startsWith("en");
  const text = en
    ? {
        label: "Project overview",
        add: "Add a block",
        remove: "Remove last",
        main: "One system. Different priorities.",
        body: "A large module explains the main idea; smaller modules show supporting facts.",
        ready: "Ready to review",
        components: "Reusable modules",
        nested: "Local layout",
        first: "Structure",
        second: "Checks",
        item: "Module",
        count: "modules",
      }
    : {
        label: "Обзор проекта",
        add: "Добавить блок",
        remove: "Убрать последний",
        main: "Одна система. Разные акценты.",
        body: "Крупный блок раскрывает главную мысль, малые показывают дополнительные факты.",
        ready: "Готово к ревью",
        components: "Готовые модули",
        nested: "Локальная сетка",
        first: "Структура",
        second: "Проверки",
        item: "Блок",
        count: "блоков",
      };
  const element = document.createElement("section");
  element.className = "bento-sample";
  const actions = document.createElement("div");
  actions.className = "sample-actions";
  const status = document.createElement("output");
  status.setAttribute("role", "status");
  let serial = 4,
    disposed = false;
  /** Literal host-owned content, with no injected markup or remote imagery. */
  function card(title, description = "", main = false) {
    const node = document.createElement("article");
    node.className =
      "bento-sample__card" + (main ? " bento-sample__card--main" : "");
    const heading = document.createElement("h4");
    heading.textContent = title;
    node.append(heading);
    if (description) {
      const paragraph = document.createElement("p");
      paragraph.textContent = description;
      node.append(paragraph);
    }
    return node;
  }
  const nested = createBentoGrid({
    document,
    label: text.nested,
    columns: 2,
    minColumnWidth: 80,
    gap: 8,
    rowMinHeight: 50,
    items: [
      { id: "structure", content: card(text.first) },
      { id: "checks", content: card(text.second) },
    ],
  });
  const entries = [
    {
      id: "main",
      content: card(text.main, text.body, true),
      colSpan: 2,
      rowSpan: 2,
    },
    { id: "ready", content: card("12", text.ready) },
    { id: "modules", content: card("04", text.components) },
    { id: "nested", content: nested.element, colSpan: 2 },
  ];
  const grid = createBentoGrid({
    document,
    label: text.label,
    columns: 4,
    minColumnWidth: 130,
    gap: 12,
    rowMinHeight: 100,
    items: entries,
  });
  /** Announce only module count; card content stays outside the live region. */
  function announce() {
    status.textContent = `${entries.length} ${text.count}`;
  }
  /** Append a bounded optional module without recreating existing card content. */
  function add() {
    if (disposed || entries.length >= 8) return;
    entries.push({
      id: "extra-" + ++serial,
      content: card(`${text.item} ${serial}`),
    });
    grid.update({ items: entries });
    announce();
  }
  const insert = createButton({
    document,
    label: text.add,
    variant: "quiet",
    onClick: add,
  });
  const remove = createButton({
    document,
    label: text.remove,
    variant: "quiet",
    onClick: () => {
      if (disposed || entries.length <= 4) return;
      entries.pop();
      grid.update({ items: entries });
      announce();
    },
  });
  actions.append(insert, remove);
  element.append(actions, grid.element, status);
  announce();
  return {
    element,
    interact: add,
    /** Release nested factories before removing their owning composition. */
    dispose() {
      if (disposed) return;
      disposed = true;
      nested.dispose();
      grid.dispose();
      element.remove();
    },
  };
}

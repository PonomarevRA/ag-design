import {
  createCatalogCard,
  createCatalogSearchControls,
  createI18n,
} from "./vendor/ag-design/index.js";
import { h } from "./dom.js";

/** Synthetic fixtures illustrate presentation fields; no prices, ratings or availability describe a real offer. */
export function buildCatalogPresentationSample({
  mode = "cards",
  locale = "ru",
  headingLevel = 3,
} = {}) {
  const i18n = createI18n({ locale, availableLocales: ["ru", "en"] }),
    english = locale.startsWith("en");
  const message = h("p", {
    className: "catalog-presentation-sample__message",
    role: "status",
  });
  const cards = [],
    data = [
      {
        id: "lamp",
        type: "product",
        title: english ? "Luma desk lamp" : "Настольная лампа Luma",
        summary: english
          ? "Direct light for a small workspace."
          : "Направленный свет для небольшого рабочего места.",
        priceText: english ? "Demo price:€40" : "Пример цены:4 000 ₽",
        facts: [
          { label: english ? "Power" : "Мощность", value: "8 W" },
          { label: english ? "Height" : "Высота", value: "42 cm" },
        ],
        rating: { value: 4.6, count: 128 },
        eyebrow: english
          ? "Product · fictional example"
          : "Товар · демонстрационный пример",
      },
      {
        id: "bag",
        type: "product",
        title: english ? "Daily backpack" : "Городской рюкзак Daily",
        summary: english
          ? "A laptop compartment and a compact daily carry."
          : "Отделение для ноутбука и компактный объём на каждый день.",
        priceText: english ? "Demo price:€65" : "Пример цены:6 500 ₽",
        facts: [
          { label: english ? "Volume" : "Объём", value: "18 L" },
          { label: english ? "Laptop" : "Ноутбук", value: "14″" },
        ],
        rating: { count: 0 },
        eyebrow: english
          ? "Product · fictional example"
          : "Товар · демонстрационный пример",
      },
      {
        id: "tree",
        type: "component",
        title: english ? "Object tree" : "Дерево объектов",
        summary: english
          ? "Choose nested objects with keyboard navigation."
          : "Выбор вложенных объектов с клавиатурной навигацией.",
        facts: [
          { label: english ? "Platform" : "Платформа", value: "Web" },
          {
            label: english ? "Status" : "Статус",
            value: english
              ? "Draft; qualify in the host"
              : "Черновик; проверить в host",
          },
        ],
        note: english
          ? "Registered uses are not a quality rating."
          : "Число использований не является рейтингом качества.",
        eyebrow: english
          ? "Component · illustrative fixture"
          : "Компонент · демонстрационный пример",
      },
      {
        id: "table",
        type: "component",
        title: english ? "Data table" : "Таблица данных",
        summary: english
          ? "Compare structured rows and use native controls."
          : "Сравнение структурированных строк и нативные элементы управления.",
        facts: [
          { label: english ? "Platform" : "Платформа", value: "Web" },
          {
            label: english ? "Status" : "Статус",
            value: english
              ? "Draft; verify actual evidence"
              : "Черновик; изучить свидетельства",
          },
        ],
        eyebrow: english
          ? "Component · illustrative fixture"
          : "Компонент · демонстрационный пример",
      },
    ];
  /** Offline schematic media makes fictional fixtures explicit and creates no external resources. */
  function media(item) {
    const panel = h("div", { className: "catalog-presentation-sample__media" });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 240 140");
    svg.setAttribute("role", "img");
    const title = document.createElementNS(svg.namespaceURI, "title");
    title.textContent = english
      ? "Schematic example, not a product photograph"
      : "Схема-пример, не фотография товара";
    svg.append(title);
    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute(
      "d",
      item.id === "lamp"
        ? "M80 115H160M120 115V62L166 30M140 20L182 50L158 62L128 38Z"
        : item.id === "bag"
          ? "M76 45Q76 24 120 24Q164 24 164 45V118H76ZM102 24V16H138V24M88 78H152V106H88Z"
          : "M42 28H198V112H42ZM42 56H198M80 56V112M42 84H198",
    );
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "var(--ag-accent)");
    path.setAttribute("stroke-width", "5");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.append(path);
    panel.append(svg);
    return panel;
  }
  const grid = h("div", { className: "catalog-presentation-sample__grid" }),
    element = h(
      "section",
      { className: "catalog-presentation-sample" },
      h(
        "p",
        {},
        english
          ? "Fictional examples. Card content adapts to its domain; the host chooses the catalog layout."
          : "Демонстрационные данные. Содержание карточки зависит от предмета, раскладку каталога выбирает host.",
      ),
      message,
    );
  let search = null;
  /** Apply this small local example only; the public controls do not implement search semantics. */
  function render(request = { query: "", filters: { kind: [] } }) {
    for (const card of cards) card.dispose();
    cards.length = 0;
    grid.replaceChildren();
    const query = request.query.toLocaleLowerCase().trim(),
      selected = request.filters.kind ?? [];
    const matches = data.filter(
      (item) =>
        (!selected.length || selected.includes(item.type)) &&
        (!query ||
          `${item.title} ${item.summary} ${item.id}`
            .toLocaleLowerCase()
            .includes(query)),
    );
    for (const item of matches) {
      const { id, type, ...cardData } = item;
      const card = createCatalogCard({
        document,
        i18n,
        headingLevel,
        ...cardData,
        media: media(item),
        onOpen: () => {
          message.textContent =
            (english ? "Selected: " : "Выбрано: ") + item.title;
        },
        primaryAction: {
          label: english ? "View details" : "Подробнее",
          onAction: () => {
            message.textContent =
              (english ? "Details: " : "Подробнее: ") + item.title;
          },
        },
      });
      grid.append(card.element);
      cards.push(card);
    }
    if (!matches.length)
      grid.append(
        h(
          "p",
          {},
          english
            ? "No matches. Remove a filter or change your query."
            : "Нет совпадений. Снимите фильтр или измените запрос.",
        ),
      );
    if (search)
      search.report({
        revision: request.revision ?? search.state.revision,
        status: "ready",
        total: matches.length,
      });
  }
  if (mode === "search") {
    search = createCatalogSearchControls({
      document,
      i18n,
      label: english ? "Find in example catalog" : "Найти в примере каталога",
      facets: [
        {
          id: "kind",
          label: english ? "Item kind" : "Тип объекта",
          multiple: true,
          options: [
            { value: "product", label: english ? "Products" : "Товары" },
            {
              value: "component",
              label: english ? "Components" : "Компоненты",
            },
          ],
        },
      ],
      onChange: render,
    });
    element.append(search.element);
  }
  element.append(grid);
  render();
  return {
    element,
    interact() {
      if (search) {
        search.update({ query: "", filters: { kind: ["component"] } });
        render({ ...search.state.applied, revision: search.state.revision });
      } else cards[0]?.parts.heading.querySelector("button")?.click();
    },
    dispose() {
      search?.dispose();
      for (const card of cards) card.dispose();
      cards.length = 0;
      i18n.dispose();
    },
  };
}

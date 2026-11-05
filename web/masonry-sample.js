import { createMasonryLayout, createButton } from "./vendor/ag-design/index.js";

/** Local natural-height cards demonstrate live insertion, removal and responsive columns. */
export function buildMasonrySample(document = globalThis.document) {
  const element = document.createElement("section");
  element.className = "masonry-sample";
  element.setAttribute("aria-label", "Пример Pinterest / masonry-layout");
  const toolbar = document.createElement("div");
  toolbar.className = "sample-actions";
  const status = document.createElement("p");
  status.className = "muted";
  status.setAttribute("role", "status");
  let serial = 0,
    disposed = false,
    compact = false;

  /** Card heights come from text and decoration, not a required image aspect ratio. */
  function card() {
    const index = serial++;
    const item = document.createElement("article");
    item.className = "masonry-sample__card";
    const cover = document.createElement("div");
    cover.className = "masonry-sample__cover";
    cover.style.height = `${44 + (index % 3) * 24}px`;
    cover.setAttribute("aria-hidden", "true");
    const title = document.createElement("strong");
    title.textContent = `Идея ${index + 1}`;
    const description = document.createElement("p");
    description.textContent = [
      "Короткая заметка",
      "Карточки разной высоты сохраняют порядок чтения.",
      "Добавляйте локальные изображения, текст и готовые компоненты.",
    ][index % 3];
    item.append(cover, title, description);
    return item;
  }
  const layout = createMasonryLayout({
    document,
    items: Array.from({ length: 5 }, card),
    minColumnWidth: 140,
    gap: 12,
  });

  /** Bound the demo while preserving existing card nodes and any local interaction state. */
  function add() {
    if (disposed || layout.element.children.length >= 12) return;
    layout.element.append(card());
    announce();
  }
  const remove = createButton({
    document,
    label: "Убрать последнюю",
    variant: "quiet",
    onClick: () => {
      layout.element.lastElementChild?.remove();
      announce();
    },
  });
  const insert = createButton({
    document,
    label: "Добавить карточку",
    variant: "quiet",
    onClick: add,
  });
  const columns = createButton({
    document,
    label: "Две колонки",
    variant: "quiet",
    onClick: () => {
      compact = !compact;
      layout.update({ columns: compact ? 2 : "auto" });
      columns.textContent = compact ? "Автоколонки" : "Две колонки";
      announce();
    },
  });

  /** Announce explicit actions without live announcements during passive resize. */
  function announce() {
    const count = layout.element.children.length;
    status.textContent = `${count} карточек · ${compact ? "2 колонки" : "автоколонки"}`;
    insert.disabled = count >= 12;
    remove.disabled = count === 0;
  }
  toolbar.append(insert, remove, columns);
  element.append(toolbar, layout.element, status);
  announce();
  return {
    element,
    interact: add,
    dispose() {
      if (disposed) return;
      disposed = true;
      layout.dispose();
      element.remove();
    },
  };
}

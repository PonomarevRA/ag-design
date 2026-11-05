import { createFeedRail } from "./vendor/content-rail/feed-rail.js";
import { categoryLabel } from "./catalog-search.js";

/** Map mounted filtered card shells to the exact reusable feed rail; the host retains category/library knowledge. */
export function createCatalogRail({ document, entries, libraries = [] }) {
  const names = new Map(libraries.map(library => [library.id, library.name]));
  const items = entries.map(({ component, target }) => ({
    id: component.id, label: component.name, target, preview: component.summary,
    context: `${categoryLabel(component.category)} · ${names.get(component.libraryId || "ag-core") || component.package}`,
  }));
  const boundsElement = entries[0]?.target.parentElement || null;
  const rail = createFeedRail({ document, items, boundsElement,
    scrollRoot: boundsElement?.closest("main") || null, header: document.querySelector(".titlebar"), label: "Быстрый переход к компонентам" });
  rail.element.classList.add("catalog-rail");
  rail.element.querySelector(".ag-vt-rail-card")?.setAttribute("aria-label", "Предпросмотр компонента");
  return rail;
}

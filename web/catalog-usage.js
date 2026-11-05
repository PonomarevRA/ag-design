import { createNumericScale } from "./vendor/ag-design/numeric-scale.js";

export const catalogueSorts = ["relevance", "usage-desc", "usage-asc", "name-asc", "name-desc"];

/** Read a coherent, bounded summary without exposing consumer names or treating a failed fetch as zero usage. */
export async function loadCatalogUsage(load, maximum = 10000) {
  const items = [];
  let offset = 0, revision, dataset;
  while (items.length < maximum) {
    const result = await load(`usage-summary?limit=${Math.min(100, maximum - items.length)}&offset=${offset}`);
    if (!revision) { revision = result.catalogRevision; dataset = result.dataset; }
    if (result.catalogRevision !== revision) throw new Error("Сводка использования изменилась. Обновите каталог.");
    items.push(...result.items);
    if (!result.hasMore) return { items, dataset, catalogRevision: revision };
    if (!Number.isInteger(result.nextOffset) || result.nextOffset <= offset)
      throw new Error("Некорректная пагинация сводки использования.");
    offset = result.nextOffset;
  }
  throw new Error("Сводка использования превышает доступный размер каталога.");
}

/** Calculate one scale over the entire active catalogue; filtering must never change a component's score. */
export function catalogUsageModel(summary) {
  const counts = new Map();
  if (!summary) return { counts, scale: null };
  for (const item of summary.items) {
    if (typeof item.componentId !== "string" || !Number.isSafeInteger(item.count) || item.count < 0)
      throw new TypeError("Invalid registered usage count");
    counts.set(item.componentId, item.count);
  }
  const scale = createNumericScale({ values: summary.dataset.counts, maximum: 5 });
  return { counts, scale };
}

/** Sort copies only; unknown counts stay last and equal values use names/IDs rather than unstable server order. */
export function sortCatalogComponents(components, order, counts = new Map()) {
  if (!catalogueSorts.includes(order)) throw new TypeError("Unknown catalogue order");
  const result = [...components];
  if (order === "relevance") return result;
  const names = (a, b) => a.name.localeCompare(b.name, "ru", { numeric: true, sensitivity: "base" }) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  result.sort((a, b) => {
    if (order.startsWith("usage")) {
      const left = counts.get(a.id), right = counts.get(b.id);
      if (left === undefined || right === undefined) {
        if (left !== right) return left === undefined ? 1 : -1;
      } else if (left !== right) return order === "usage-desc" ? right - left : left - right;
      return names(a, b);
    }
    return names(a, b) * (order === "name-desc" ? -1 : 1);
  });
  return result;
}

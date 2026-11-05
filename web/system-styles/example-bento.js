import { createBentoGrid } from "../../packages/components/bento-grid.js";
import { disposeOnPageExit } from "./demo-page-lifecycle.js";

const mounted = new WeakMap();
const recipes = {
  "saas-clarity": {
    host: ".analytics-grid",
    label: "Отчёты пространства",
    columns: 3,
    minColumnWidth: 260,
    modules: [
      [".growth-panel", "growth", 2],
      [".segment-panel", "segments", 1],
      [".funnel-panel", "activation", 1],
      [".market-panel", "markets", 2],
      [".cohort-panel", "cohorts", 2],
      [".adoption-panel", "adoption", 1],
    ],
  },
  "learning-air": {
    host: ".learning-middle",
    label: "Курсы и учебная активность",
    alignItems: "start",
    columns: 2,
    minColumnWidth: 300,
    modules: [
      [".courses-panel", "courses", 2],
      [".heatmap-panel", "activity", 1],
      [".community-section", "community", 1],
    ],
  },
};

/** Reuse existing nodes in two authored overviews; forms, peer KPI strips and the catalogue keep their layout. */
export function mountExampleBento({
  document: doc = globalThis.document,
} = {}) {
  const recipe = recipes[doc.documentElement.dataset.style];
  if (!recipe) return null;
  const host = doc.querySelector(recipe.host);
  if (!host) return null;
  if (mounted.has(host)) return mounted.get(host);
  // Resolve the whole recipe before moving nodes, preserving IDs, event handlers and form drafts.
  const entries = recipe.modules.map(([selector, id, colSpan]) => {
    const content = doc.querySelector(selector);
    if (
      !content ||
      (content.parentElement !== host &&
        content.previousElementSibling !== host)
    )
      throw new TypeError(
        "Bento example module is absent or outside its authored overview: " +
          id,
      );
    return { id, content, colSpan };
  });
  const original = entries.map(({ content }) => ({
    content,
    parent: content.parentNode,
    next: content.nextSibling,
  }));
  const grid = createBentoGrid({
    document: doc,
    label: recipe.label,
    items: entries,
    columns: recipe.columns,
    minColumnWidth: recipe.minColumnWidth,
    gap: 24,
    rowMinHeight: 0,
    alignItems: recipe.alignItems ?? "stretch",
  });
  grid.element.classList.add("example-bento");
  host.classList.add("example-bento-host");
  host.append(grid.element);
  let disposed = false;
  const controller = {
    element: grid.element,
    getLayout: grid.getLayout,
    refresh: grid.refresh,
    /** Restore host-owned modules before releasing this layout; nested charts keep their own lifetime. */
    dispose() {
      if (disposed) return;
      disposed = true;
      detachExit();
      for (let i = original.length - 1; i >= 0; i--) {
        const { content, parent, next } = original[i];
        parent.insertBefore(content, next?.parentNode === parent ? next : null);
      }
      grid.dispose();
      host.classList.remove("example-bento-host");
      mounted.delete(host);
    },
  };
  const detachExit = disposeOnPageExit(doc.defaultView, controller.dispose);
  mounted.set(host, controller);
  return controller;
}

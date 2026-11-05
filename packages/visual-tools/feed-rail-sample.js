import { createFeedRail } from "./feed-rail.js";
import { node } from "./runtime.js";

/** Demonstrate the public factory in a local scrolling feed; no product metadata or remote resources are used. */
export function createFeedRailSample(document) {
  const host = node(document, "div", "ag-vt-feed-demo"), body = node(document, "div", "ag-vt-feed-demo__body");
  const items = [];
  for (let index = 0; index < 18; index++) {
    const target = node(document, "section");
    target.append(node(document, "h3", "", `Раздел ${index + 1}`), node(document, "p", "", "Локальная лента: текущая позиция, предпросмотр и отдельная прокрутка навигации."));
    body.append(target);
    items.push({ id: `section-${index}`, label: `Раздел ${index + 1}`, target, context: "Демонстрационная лента", preview: "Содержимое остаётся во владении приложения." });
  }
  const rail = createFeedRail({ document, items, boundsElement: body, scrollRoot: body });
  host.append(rail.element, body);
  return { element: host, interact() { rail.element.querySelectorAll(".ag-vt-rail__item")[2].click(); },
    dispose() { rail.dispose(); host.remove(); } };
}

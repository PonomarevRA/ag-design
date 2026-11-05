import { h } from "./dom.js";
import { createButton } from "./vendor/ag-design/index.js";

/**
 * Render host-owned candidate links separately from exact results; metadata stays literal text.
 * @param {object} options Current candidates, localized title and onSelect(candidate) callback.
 * @returns {HTMLElement|null} Named advisory section, or null when no current candidates exist.
 */
export function discoveryLinks({ candidates = [], title, onSelect, locale = "ru" }) {
  if (!candidates.length) return null;
  const ru = locale.startsWith("ru");
  const list = h("ul");
  for (const candidate of candidates.slice(0, 8)) {
    const button = createButton({
      document: globalThis.document, label: candidate.title, variant: "quiet",
      onClick: () => onSelect(candidate),
    });
    button.dataset.discoveryId = candidate.id;
    const reason = candidate.methods?.includes("e5-cosine")
      ? (ru ? "По смыслу" : "Similar meaning")
      : (ru ? "По словам" : "Related words");
    list.append(h("li", {}, button, h("span", { className: "discovery-reason" }, reason)));
  }
  return h("section", { className: "discovery-candidates", "aria-label": title },
    h("h3", {}, title),
    h("p", {}, ru ? "Возможные варианты. Назначение, ограничения и проверки — в подробностях." : "Possible candidates. Inspect purpose, limitations and checks before use."),
    list);
}

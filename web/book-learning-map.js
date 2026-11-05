import { groupChapters } from "./book-curriculum.js";

/** A compact reading route. Selection is location, never a claim of learning or completion. */
export function createBookLearningMap({ document: doc, onSelect }) {
  const element = doc.createElement("details");
  element.className = "book-learning-map";
  const summary = doc.createElement("summary");
  const nav = doc.createElement("nav");
  const list = doc.createElement("ol");
  nav.append(list);
  element.append(summary, nav);
  let disposed = false;
  const routes = new Map();

  /** Rebuild only on a new corpus/locale; ordinary scroll changes do not replace focused controls. */
  function update(sections, locale, messages) {
    if (disposed) return;
    routes.clear();
    list.replaceChildren();
    summary.textContent = messages.learningMap;
    nav.setAttribute("aria-label", messages.learningMap);
    const ru = locale.toLowerCase().startsWith("ru");
    for (const group of groupChapters(sections)) {
      const item = doc.createElement("li");
      const button = doc.createElement("button");
      const title = doc.createElement("strong");
      const purpose = doc.createElement("span");
      button.type = "button";
      button.dataset.bookPart = group.id;
      title.textContent = ru ? group.ru : group.en;
      purpose.textContent = ru ? group.goalRu : group.goalEn;
      button.append(title, purpose);
      item.append(button);
      list.append(item);
      routes.set(group.id, { button, sections: group.sections });
    }
  }

  /** Mark only the current part and derive an explicit chapter location from the unfiltered corpus. */
  function setCurrent(id, messages) {
    let location = "";
    for (const [part, route] of routes) {
      const index = route.sections.findIndex((section) => section.id === id);
      if (index < 0) route.button.removeAttribute("aria-current");
      else {
        route.button.setAttribute("aria-current", "step");
        const title = route.button.querySelector("strong").textContent;
        location = messages.chapterPosition(title, index + 1, route.sections.length);
      }
    }
    return location;
  }

  /** Delegate only owned buttons; disposal removes the single listener and callbacks. */
  function activate(event) {
    if (disposed) return;
    const button = event.target.closest("button[data-book-part]");
    if (!button || !element.contains(button)) return;
    const route = routes.get(button.dataset.bookPart);
    if (route) onSelect(route.sections[0]);
  }
  element.addEventListener("click", activate);
  return {
    element, update, setCurrent,
    dispose() {
      disposed = true;
      element.removeEventListener("click", activate);
      routes.clear();
    },
  };
}

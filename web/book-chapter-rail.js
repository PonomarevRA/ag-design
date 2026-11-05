import { h } from "./dom.js";

/** Chapter ticks select published identities; progress uses only the actual current mounted article. */
export function createBookChapterRail({ document, article, onSelect }) {
  const element = h("nav", { className: "book-chapter-rail" }),
    position = h("span", { className: "book-chapter-position" }),
    list = h("div", { className: "book-chapter-ticks" }),
    progress = h("progress", {
      max: 100,
      value: 0,
      className: "book-reading-progress",
    });
  element.append(position, list, progress);
  const view = document.defaultView;
  let progressArticle = article;
  let chapters = [],
    buttons = [],
    current = "",
    disposed = false,
    frame = 0;

  /** Reveal only inside this navigator; passive current updates must never move the page or keyboard focus. */
  function setCurrent(id) {
    if (disposed) return;
    current = id;
    const index = chapters.findIndex((chapter) => chapter.id === id);
    position.textContent =
      index < 0 ? "—" : `${index + 1} / ${chapters.length}`;
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].tabIndex = i === Math.max(0, index) ? 0 : -1;
      if (i === index) buttons[i].setAttribute("aria-current", "page");
      else buttons[i].removeAttribute("aria-current");
    }
    if (index >= 0 && !element.contains(document.activeElement)) {
      const button = buttons[index];
      const bottom = button.offsetTop + button.offsetHeight;
      if (button.offsetTop < list.scrollTop) list.scrollTop = button.offsetTop;
      else if (bottom > list.scrollTop + list.clientHeight)
        list.scrollTop = bottom - list.clientHeight;
    }
    schedule();
  }
  /** Rebuild for a new edition, independently of contents search; every published chapter remains reachable. */
  function update(items, messages) {
    if (disposed) return;
    const focused = element.contains(document.activeElement);
    chapters = items;
    element.setAttribute("aria-label", messages.chapterRail);
    progress.setAttribute("aria-label", messages.readingProgress);
    buttons = [];
    list.replaceChildren();
    for (let index = 0; index < chapters.length; index++) {
      const chapter = chapters[index],
        caption = `${index + 1}. ${chapter.title}`;
      const button = h(
        "button",
        {
          type: "button",
          title: caption,
          "aria-label": caption,
          className: "book-chapter-tick",
          "data-chapter": chapter.id,
        },
        h("span", { "aria-hidden": "true" }),
      );
      button.addEventListener("click", () => {
        if (!disposed) onSelect(chapter, { focus: true });
      });
      button.addEventListener("keydown", (event) => {
        if (disposed) return;
        let next = index;
        if (event.key === "ArrowDown")
          next = Math.min(index + 1, buttons.length - 1);
        else if (event.key === "ArrowUp") next = Math.max(index - 1, 0);
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = buttons.length - 1;
        else return;
        event.preventDefault();
        buttons[next].focus({ preventScroll: true });
        buttons[next].scrollIntoView?.({ block: "nearest" });
        // Arrow keys explore titles; Enter/Space activates, avoiding dozens of asynchronous chapter requests.
      });
      buttons.push(button);
      list.append(button);
    }
    setCurrent(current);
    if (focused)
      buttons.find((button) => button.dataset.chapter === current)?.focus();
    element.hidden = !chapters.length;
  }
  /** Measure only the current article against the real scrolling viewport, coalesced to one animation frame. */
  function measure() {
    frame = 0;
    if (disposed) return;
    const box = progressArticle.getBoundingClientRect();
    const top = Math.max(
      0,
      document.querySelector(".titlebar")?.getBoundingClientRect().bottom ?? 0,
    );
    const distance = box.height - (view.innerHeight - top);
    progress.value =
      distance <= 0
        ? 100
        : Math.max(0, Math.min(100, ((top - box.top) / distance) * 100));
  }
  /** Batch scroll and resize notifications without polling the page. */
  function schedule() {
    if (!disposed && !frame) frame = view.requestAnimationFrame(measure);
  }
  document.addEventListener("scroll", schedule, {
    capture: true,
    passive: true,
  });
  view.addEventListener("resize", schedule);
  return {
    element,
    update,
    setCurrent,
    refresh: schedule,
    /** Follow the host's current mounted chapter without inventing geometry for unloaded articles. */
    setArticle(target) {
      progressArticle = target;
      schedule();
    },
    /** Remove every host subscription before detaching the view. */
    dispose() {
      disposed = true;
      if (frame) view.cancelAnimationFrame(frame);
      document.removeEventListener("scroll", schedule, true);
      view.removeEventListener("resize", schedule);
      list.replaceChildren();
      element.remove();
    },
  };
}

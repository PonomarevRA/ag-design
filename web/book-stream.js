import { h } from "./dom.js";

/** Append one published chapter near the reading boundary; selection and locale changes fence old replies. */
export function createBookStream({
  document,
  element,
  load,
  render,
  onCurrent,
  onStatus,
  isCurrent,
}) {
  const view = document.defaultView;
  const tail = h("div", { className: "book-stream-tail" });
  const message = h("p", { className: "muted" });
  const nextButton = h("button", {
    type: "button",
    className: "book-stream-next",
  });
  tail.append(message, nextButton);
  let chapters = [],
    entries = [],
    start = 0,
    generation = 0;
  let locale = "",
    direction = "ltr",
    messages,
    pending = false,
    failed = false,
    disposed = false,
    frame = 0;
  let current = "";
  let focusWhenReady = false;
  const observer = view.IntersectionObserver
    ? new view.IntersectionObserver(
        (records) => {
          const box = tail.getBoundingClientRect();
          // Ignore queued intersections from the previous tail position after an article was appended.
          const nearReadingBoundary =
            box.top <= view.innerHeight + 500 && box.bottom >= 0;
          if (
            records.some((record) => record.isIntersecting) &&
            nearReadingBoundary &&
            !failed
          )
            void appendNext();
        },
        { rootMargin: "0px 0px 500px 0px" },
      )
    : null;
  const alive = () => !disposed && isCurrent();

  /** Keep a real action for unsupported observers, deliberate continuation, and failures; never retry in a loop. */
  function updateTail() {
    observer?.disconnect();
    const next = chapters[start + entries.length];
    message.textContent = failed
      ? messages.error
      : next
        ? messages.continuous
        : messages.bookEnd;
    message.setAttribute("role", failed ? "alert" : "note");
    nextButton.hidden = !next;
    nextButton.disabled = pending;
    if (pending) nextButton.textContent = messages.loading;
    else if (failed) nextButton.textContent = messages.retry;
    else
      nextButton.textContent = next ? messages.continueChapter(next.title) : "";
    if (next && !pending && !failed && entries.length) observer?.observe(tail);
  }
  /** Focus only after an explicit navigation action; appending content never moves the reading position. */
  function reveal(entry) {
    entry.heading.focus({ preventScroll: true });
    entry.heading.scrollIntoView?.({ block: "start" });
  }
  /** Publish the chapter at the reading line using mounted article bounds, without moving focus or page scroll. */
  function mark(entry) {
    if (!entry || current === entry.id) return;
    current = entry.id;
    onCurrent(entry);
  }
  /** Locate the chapter crossing the reading line; unloaded chapters have no fabricated positions. */
  function measure() {
    frame = 0;
    if (!alive() || !entries.length) return;
    const chrome = Math.max(
      0,
      document.querySelector(".titlebar")?.getBoundingClientRect().bottom ?? 0,
    );
    const line = chrome + Math.min(140, view.innerHeight * 0.2);
    let active = entries[0];
    for (const entry of entries) {
      if (entry.element.getBoundingClientRect().top <= line) active = entry;
      else break;
    }
    mark(active);
  }
  /** Coalesce native or browser scroll events; no permanent polling loop. */
  function schedule() {
    if (alive() && !frame) frame = view.requestAnimationFrame(measure);
  }
  /** Dispose chapter examples before removing their nodes or invalidating an edition. */
  function clear() {
    ++generation;
    observer?.disconnect();
    for (const entry of entries) entry.dispose();
    entries = [];
    current = "";
    pending = failed = focusWhenReady = false;
    if (frame) view.cancelAnimationFrame(frame);
    frame = 0;
  }
  /** Configure one ordered edition after its summaries arrive; individual chapter fallback remains local. */
  function configure(options) {
    clear();
    chapters = options.chapters;
    locale = options.locale;
    direction = options.direction;
    messages = options.messages;
  }
  /** Fetch exactly the next identity. A stale completion cannot attach content, change busy state, or restart observation. */
  async function appendNext({ focus = false, restoreOffset } = {}) {
    if (!alive()) return;
    if (pending) {
      focusWhenReady ||= focus;
      return;
    }
    focusWhenReady = focus;
    const section = chapters[start + entries.length];
    if (!section) return;
    const token = generation;
    pending = true;
    failed = false;
    element.setAttribute("aria-busy", "true");
    updateTail();
    onStatus(messages.loading);
    try {
      const detail = await load(section, locale);
      if (!alive() || token !== generation) return;
      const chapter = render(section, detail);
      const shell = h("section", {
        className: "book-stream-chapter",
        "data-book-chapter": section.id,
        "aria-labelledby": chapter.heading.id,
      });
      shell.lang = detail.locale ?? locale;
      shell.dir =
        shell.lang === locale || shell.lang === locale.split("-")[0]
          ? direction
          : "ltr";
      shell.append(chapter.element);
      const entry = { ...chapter, id: section.id, element: shell };
      entries.push(entry);
      element.insertBefore(shell, tail);
      if (entries.length === 1 || focusWhenReady) mark(entry);
      if (focusWhenReady) reveal(entry);
      else if (entries.length === 1 && Number.isFinite(restoreOffset)) {
        const box = shell.getBoundingClientRect();
        // Translate the current chapter in place rather than preserving an obsolete whole-stream scroll offset.
        if (box.height > 0)
          view.scrollBy({ top: box.top - restoreOffset, behavior: "instant" });
      }
      schedule();
    } catch (error) {
      if (alive() && token === generation) failed = true;
    } finally {
      if (alive() && token === generation) {
        pending = false;
        element.setAttribute("aria-busy", "false");
        onStatus("");
        updateTail();
      }
    }
  }
  /** Direct chapter selection starts a new stream; old asynchronous work is invalidated first. */
  async function open(section, options = {}) {
    if (!alive()) return;
    clear();
    start = chapters.findIndex((chapter) => chapter.id === section.id);
    if (start < 0) return;
    element.removeAttribute("aria-labelledby");
    element.replaceChildren(tail);
    await appendNext(options);
  }
  /** Article pagers use an existing mounted chapter or append the immediate next chapter before falling back to a jump. */
  async function navigate(section) {
    if (!alive()) return;
    const existing = entries.find((entry) => entry.id === section.id);
    if (existing) {
      mark(existing);
      reveal(existing);
      return;
    }
    if (chapters[start + entries.length]?.id === section.id)
      await appendNext({ focus: true });
    else await open(section, { focus: true });
  }
  const continueReading = () => {
    void appendNext({ focus: true });
  };
  nextButton.addEventListener("click", continueReading);
  document.addEventListener("scroll", schedule, {
    capture: true,
    passive: true,
  });
  view.addEventListener("resize", schedule);
  return {
    configure,
    open,
    navigate,
    invalidate: clear,
    /** Release all chapters, observer, animation frame and listeners at route disposal. */
    dispose() {
      clear();
      disposed = true;
      nextButton.removeEventListener("click", continueReading);
      document.removeEventListener("scroll", schedule, true);
      view.removeEventListener("resize", schedule);
    },
  };
}

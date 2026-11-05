import { h } from "./dom.js";
import { get, getAll } from "./api.js";
import { createLanguageSwitcher } from "./vendor/ag-design/index.js";
import { getLocaleRuntime } from "./locale-preferences.js";
import { bookMessages } from "./design-book-i18n.js";
import { createBookArticle } from "./book-article.js";
import { createBookChapterRail } from "./book-chapter-rail.js";
import { createBookStream } from "./book-stream.js";
import { createBookLearningMap } from "./book-learning-map.js";
import { groupChapters } from "./book-curriculum.js";
import { discoveryLinks } from "./discovery-links.js";
export { sourceLink, bookBody } from "./book-article.js";

/** Keep locale/search/chapter state stable while composing bounded, source-backed teaching articles. */
export async function renderDesignBook(
  container,
  {
    isCurrent = () => true,
    runtime = getLocaleRuntime(container.ownerDocument),
    onContext = () => {},
    initialSection = "",
  } = {},
) {
  const doc = container.ownerDocument,
    i18n = runtime.context,
    search = h("input", { type: "search" }),
    nav = h("nav", { className: "book-navigation" }),
    article = h("article", { className: "book-article" }),
    count = h("p", { className: "book-count" }),
    title = h("h2"),
    introText = h("p"),
    findLabel = h("span", { className: "ag-field__label" }),
    navigationSummary = h("summary"),
    hint = h("p", { className: "book-nav-hint" }),
    position = h("p", { className: "book-position" }),
    navigation = h(
      "details",
      { className: "book-chapters" },
      navigationSummary,
      nav,
    ),
    status = h("p", { className: "sr-only", role: "status" });
  navigation.open = (doc.defaultView.innerWidth ?? 1000) >= 1100;
  const learningMap = createBookLearningMap({
    document: doc,
    onSelect: (chapter) => { void select(chapter, { focus: true }); },
  });
  const intro = h("header", { className: "book-intro" }, title, introText, learningMap.element);
  let sections = [],
    ordered = [],
    selected = initialSection,
    listGeneration = 0,
    disposed = false;
  const discoveryRegion = h("div", { className: "book-discovery" });
  let discoveryController = null, discoveryTimer = 0, discoveryGeneration = 0;
  const alive = () => !disposed && isCurrent(),
    ui = () => bookMessages(i18n.locale),
    openGroups = new Set(["start", "other"]);
  const language = createLanguageSwitcher({
    document: doc,
    i18n,
    variant: "auto",
    appearance: "quiet",
    onChange() {
      runtime.save();
    },
  });
  language.element.classList.add("book-language");
  const rail = createBookChapterRail({
    document: doc,
    article,
    onSelect: (chapter, options) => {
      void select(chapter, options);
    },
  });
  const stream = createBookStream({
    document: doc,
    element: article,
    isCurrent: alive,
    load: (section, locale) =>
      get(
        `rule-sections/${encodeURIComponent(section.id)}?locale=${encodeURIComponent(locale)}&audience=user`,
      ),
    render: renderChapter,
    onStatus: (text) => {
      status.textContent = text;
    },
    onCurrent: markChapter,
  });
  const sidebar = h(
    "aside",
    { className: "book-sidebar" },
    h(
      "div",
      { className: "book-sidebar-inner" },
      h(
        "div",
        { className: "book-sidebar-content" },
        h("p", { className: "book-sidebar-title" }),
        h("label", { className: "ag-field" }, findLabel, search),
        hint,
        position,
        count,
        discoveryRegion,
        navigation,
      ),
      h("footer", { className: "book-sidebar-footer" }, language.element),
    ),
  );
  const shell = h(
    "div",
    { className: "book-layout" },
    h("div", { className: "book-rail-column" }, rail.element),
    sidebar,
    h("div", { className: "book-main" }, intro, article),
  );
  container.classList.add("book-reader");
  container.replaceChildren(status, shell);
  /** Relabel existing search and locale nodes; a one-language policy recovers focus to the retained search. */
  function chrome() {
    const t = ui();
    title.textContent = t.title;
    introText.textContent = t.intro;
    onContext({ title: t.pageTitle, description: t.pageDescription });
    findLabel.textContent = t.find;
    search.placeholder = t.searchPlaceholder;
    search.setAttribute("aria-label", t.searchName);
    nav.setAttribute("aria-label", t.navigation);
    navigationSummary.textContent = t.chapters;
    sidebar.setAttribute("aria-label", t.navigation);
    sidebar.querySelector(".book-sidebar-title").textContent = t.pageTitle;
    hint.textContent = t.chapterHint;
    const focused = language.element.contains(doc.activeElement);
    language.element.hidden = i18n.availableLocales.length < 2;
    if (focused && language.element.hidden) search.focus();
  }
  /** Group the bounded summaries by curriculum and keep custom chapters reachable in their own group. */
  function filter() {
    if (disposed) return;
    const query = search.value.trim().toLocaleLowerCase();
    const matches = sections.filter((section) =>
      `${section.id} ${section.title} ${section.summary} ${(section.tags ?? []).join(" ")} ${(section.searchTerms ?? []).join(" ")}`
        .toLocaleLowerCase()
        .includes(query),
    );
    nav.replaceChildren();
    count.textContent = ui().count(matches.length, sections.length);
    for (const group of groupChapters(matches)) {
      const items = h("div", { className: "book-group__items" }),
        details = h(
          "details",
          { className: "book-group" },
          h("summary", {}, i18n.locale.startsWith("ru") ? group.ru : group.en),
          items,
        );
      details.open =
        !!query ||
        openGroups.has(group.id) ||
        group.sections.some((s) => s.id === selected);
      details.addEventListener("toggle", () => {
        if (details.open) openGroups.add(group.id);
        else openGroups.delete(group.id);
      });
      for (const section of group.sections) {
        const button = h(
          "button",
          {
            type: "button",
            className: "book-nav-item",
            "data-section": section.id,
          },
          section.title,
        );
        if (section.id === selected)
          button.setAttribute("aria-current", "page");
        button.addEventListener("click", () => {
          void select(section, { focus: true });
        });
        items.append(button);
      }
      nav.append(details);
    }
    if (!matches.length)
      nav.append(h("p", { className: "book-empty-search" }, ui().emptySearch));
    if (query) navigation.open = true;
    scheduleDiscovery(query);
  }
  /** Abort superseded semantic reads; retain native contents filtering and exact chapter counts. */
  function scheduleDiscovery(query) {
    ++discoveryGeneration;
    discoveryController?.abort();
    discoveryController = null;
    doc.defaultView.clearTimeout(discoveryTimer);
    discoveryRegion.replaceChildren();
    if (!query || !alive()) return;
    const request = discoveryGeneration;
    discoveryTimer = doc.defaultView.setTimeout(async () => {
      const controller = new AbortController();
      discoveryController = controller;
      try {
        const result = await get(`discovery?kind=sections&q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!alive() || request !== discoveryGeneration || controller.signal.aborted) return;
        const candidates = (result.sections?.candidates ?? []).map(candidate => ({ ...candidate,
          title: sections.find(section => section.id === candidate.id)?.title ?? candidate.title }));
        const links = discoveryLinks({ candidates, title: i18n.locale.startsWith("ru") ? "Близкие по смыслу главы" : "Related chapters", locale: i18n.locale,
          onSelect: candidate => {
            const section = sections.find(item => item.id === candidate.id);
            if (section) void select(section, { focus: true });
          }});
        discoveryRegion.replaceChildren(...(links ? [links] : []));
      } catch {
        // Optional discovery never hides the retained exact contents or navigates on failure.
      } finally {
        if (discoveryController === controller) discoveryController = null;
      }
    }, 180);
  }
  /** Active chapter follows real reading geometry; reveal only within the contents scroller, preserving focus. */
  function markChapter(entry) {
    selected = entry.id;
    position.textContent = learningMap.setCurrent(selected, ui());
    rail.setArticle(entry.element);
    rail.setCurrent(selected);
    article.lang = entry.element.lang;
    article.dir = entry.element.dir;
    article.setAttribute("aria-labelledby", entry.heading.id);
    for (const button of nav.querySelectorAll("button")) {
      if (button.dataset.section !== selected) {
        button.removeAttribute("aria-current");
        continue;
      }
      button.setAttribute("aria-current", "page");
      const group = button.closest(".book-group");
      if (group) group.open = true;
      const scroller = sidebar.querySelector(".book-sidebar-content");
      if (!scroller.contains(doc.activeElement)) {
        const box = scroller.getBoundingClientRect(),
          target = button.getBoundingClientRect();
        if (target.top < box.top) scroller.scrollTop += target.top - box.top;
        else if (target.bottom > box.bottom)
          scroller.scrollTop += target.bottom - box.bottom;
      }
    }
  }
  /** Render one edition with chapter-local ownership and the existing article factory. */
  function renderChapter(section, detail) {
    const groups = groupChapters(sections),
      group = groups.find((g) => g.sections.some((s) => s.id === section.id)),
      index = ordered.findIndex((s) => s.id === section.id),
      language = detail.locale ?? i18n.locale;
    return createBookArticle({
      document: doc,
      detail,
      hostText: ui(),
      group: group ? (language.startsWith("ru") ? group.ru : group.en) : "",
      previous: ordered[index - 1],
      next: ordered[index + 1],
      onNavigate: (chapter) => {
        void stream.navigate(chapter);
      },
    });
  }
  /** Explicit jumps start at the requested chapter; automatic continuation never invokes this focus path. */
  async function select(section, { focus = false, restoreOffset } = {}) {
    if (!alive()) return;
    selected = section.id;
    await stream.open(section, { focus, restoreOffset });
    if (alive() && focus && doc.defaultView.innerWidth < 1100)
      navigation.open = false;
  }
  /** Locale requests invalidate older detail replies while retaining the selected identity and typed search. */
  async function loadLocale() {
    const request = ++listGeneration;
    const currentChapter = [
      ...article.querySelectorAll("[data-book-chapter]"),
    ].find((entry) => entry.dataset.bookChapter === selected);
    const restoreOffset = currentChapter?.getBoundingClientRect().top;
    stream.invalidate();
    const locale = i18n.locale;
    chrome();
    article.setAttribute("aria-busy", "true");
    try {
      const response = await getAll(
        `rule-sections?locale=${encodeURIComponent(locale)}&audience=user`,
      );
      if (!alive() || request !== listGeneration) return;
      sections = response.items;
      ordered = groupChapters(sections).flatMap((group) => group.sections);
      learningMap.update(sections, locale, ui());
      position.textContent = learningMap.setCurrent(selected, ui());
      filter();
      rail.update(ordered, ui());
      stream.configure({
        chapters: ordered,
        locale,
        direction: i18n.direction,
        messages: ui(),
      });
      const target = sections.find((s) => s.id === selected) ?? ordered[0];
      if (target) await select(target, { restoreOffset });
      else {
        position.textContent = "";
        stream.invalidate();
        article.replaceChildren(h("p", {}, ui().noSections));
        article.setAttribute("aria-busy", "false");
      }
    } catch (cause) {
      if (alive() && request === listGeneration) {
        stream.invalidate();
        article.replaceChildren(h("p", { role: "alert" }, ui().error));
        article.setAttribute("aria-busy", "false");
      }
    }
  }
  const off = i18n.subscribe(() => {
    void loadLocale();
  });
  search.addEventListener("input", filter);
  await loadLocale();
  /** Release view resources, not the host-owned locale context or user preferences. */
  function dispose() {
    if (disposed) return;
    disposed = true;
    ++discoveryGeneration;
    discoveryController?.abort();
    doc.defaultView.clearTimeout(discoveryTimer);
    stream.invalidate();
    ++listGeneration;
    off();
    stream.dispose();
    search.removeEventListener("input", filter);
    language.dispose();
    rail.dispose();
    learningMap.dispose();
    container.classList.remove("book-reader");
  }
  if (!alive()) dispose();
  return dispose;
}

import { buildCompositionGridWorkshop } from "./composition-grid-workshop.js";
import { buildGridIconWorkshop } from "./grid-icon-workshop.js";
import { GRID_LABELS } from "./composition-grid-labels.js";
import { buildAppRuntimeSample } from "./app-runtime-sample.js";
import { buildWebSecuritySample } from "./web-security-sample.js";
import { buildHumanAgentSample } from "./human-agent-sample.js";
import { buildCatalogPresentationSample } from "./catalog-presentation-sample.js";
import { createPaletteBuilder, createI18n } from "./vendor/ag-design/index.js";
import { h } from "./dom.js";
import { bookMessages } from "./design-book-i18n.js";
import { createLessonFigure } from "./book-figures.js";
import { readingMinutes } from "./book-curriculum.js";
let sequence = 0;

/** Source metadata is data: only ordinary web URLs become links, with literal visible titles. */
export function sourceLink(source) {
  try {
    const url = new URL(source.url);
    if (["https:", "http:"].includes(url.protocol))
      return h(
        "a",
        { href: url.href, target: "_blank", rel: "noopener noreferrer" },
        source.title || url.hostname,
      );
  } catch {}
  return h("span", {}, source.title || "Source");
}

/** Render a small literal inline subset; executable HTML and URL schemes are never interpreted. */
function inline(text) {
  const result = [];
  for (const part of String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g)) {
    if (part.startsWith("**") && part.endsWith("**"))
      result.push(h("strong", {}, part.slice(2, -2)));
    else if (part.startsWith("`") && part.endsWith("`"))
      result.push(h("code", {}, part.slice(1, -1)));
    else result.push(part);
  }
  return result;
}

/** Keep ordinary paragraphs, lists, headings and fenced code readable without permitting raw markup. */
export function bookBody(body) {
  const element = h("div", { className: "book-prose" });
  let list = null,
    paragraph = [],
    code = null;
  const flush = () => {
    if (paragraph.length) {
      element.append(h("p", {}, ...inline(paragraph.join(" "))));
      paragraph = [];
    }
  };
  for (const line of String(body || "")
    .slice(0, 64000)
    .split("\n")) {
    if (line.startsWith("```")) {
      flush();
      list = null;
      if (code) {
        element.append(h("pre", {}, h("code", {}, code.join("\n"))));
        code = null;
      } else code = [];
      continue;
    }
    if (code) {
      code.push(line);
      continue;
    }
    if (!line.trim()) {
      flush();
      list = null;
      continue;
    }
    const heading = /^(#{1,4}) (.+)$/.exec(line),
      item = /^(?:[-*]|\d+\.) (.+)$/.exec(line);
    if (heading) {
      flush();
      list = null;
      element.append(
        h(heading[1].length > 1 ? "h4" : "h3", {}, ...inline(heading[2])),
      );
    } else if (item) {
      flush();
      const tag = /^\d/.test(line) ? "ol" : "ul";
      if (!list || list.localName !== tag) {
        list = h(tag);
        element.append(list);
      }
      list.append(h("li", {}, ...inline(item[1])));
    } else {
      list = null;
      paragraph.push(line);
    }
  }
  flush();
  if (code) element.append(h("pre", {}, h("code", {}, code.join("\n"))));
  return element;
}

/** Compose one selected edition as an article. Chapter-local examples release all their resources on replacement. */
export function createBookArticle({
  document,
  detail,
  group,
  hostText,
  onNavigate,
  previous,
  next,
}) {
  const t = detail.locale ? bookMessages(detail.locale) : hostText,
    prefix = `book-article-${++sequence}`,
    element = h("div", { className: "book-article-content" }),
    heading = h(
      "h2",
      {
        className: "book-article-title",
        id: `${prefix}-title`,
        tabindex: "-1",
      },
      detail.title,
    ),
    lesson = detail.lesson;
  element.append(
    h(
      "header",
      { className: "book-article-header" },
      h(
        "p",
        { className: "book-article-meta" },
        group
          ? `${group} · ${t.readingTime(readingMinutes(detail))}`
          : t.readingTime(readingMinutes(detail)),
      ),
      heading,
      h("p", { className: "book-lede" }, lesson?.takeaway ?? detail.summary),
    ),
  );
  if (detail.fallbackUsed)
    element.append(
      h(
        "p",
        { className: "book-fallback", role: "status" },
        hostText.fallback(detail.locale),
      ),
    );
  let catalogExample = null,
    humanAgentExample = null,
    securityExample = null,
    runtimeExample = null,
    framingExample = null,
    iconExample = null;
  let graphic = null,
    workshop = null,
    workshopI18n = null;
  let disposed = false;
  const removals = [];
  /** Every local navigation handler is removed when its article is replaced. */
  function listen(button, action) {
    button.addEventListener("click", action);
    removals.push(() => button.removeEventListener("click", action));
  }
  const anchors = [];
  /** Heading identities and local focus moves avoid changing the application's established hash routes. */
  function section(title, key, ...content) {
    const target = h("h3", { id: `${prefix}-${key}`, tabindex: "-1" }, title);
    const region = h(
      "section",
      { className: "book-reading-section", "aria-labelledby": target.id },
      target,
      ...content,
    );
    anchors.push({ title, target });
    return region;
  }
  const body = [];
  if (
    detail.id.startsWith("grid-") &&
    Object.hasOwn(GRID_LABELS.en, detail.id.slice(5))
  ) {
    framingExample = buildCompositionGridWorkshop({
      type: detail.id.slice(5),
      locale: detail.locale || "ru",
    });
    body.push(
      section(
        detail.locale === "en"
          ? "Try the composition"
          : "Попробуйте композицию",
        "framing-example",
        framingExample.element,
      ),
    );
  }
  if (detail.id === "grid-icon-generation") {
    iconExample = buildGridIconWorkshop({ locale: detail.locale || "ru" });
    body.push(
      section(
        detail.locale === "en"
          ? "Try an icon draft"
          : "Попробуйте черновик иконки",
        "icon-example",
        iconExample.element,
      ),
    );
  }

  if (
    [
      "event-bus-coordination",
      "request-routing-data",
      "realtime-ui-load",
    ].includes(detail.id)
  ) {
    runtimeExample = buildAppRuntimeSample({
      mode: detail.id === "request-routing-data" ? "router" : "bus",
      locale: detail.locale || "ru",
    });
    body.push(
      section(
        detail.locale === "en" ? "Try the runtime" : "Попробуйте runtime",
        "runtime-example",
        runtimeExample.element,
      ),
    );
  }
  if (detail.id === "safe-web-content") {
    securityExample = buildWebSecuritySample({ locale: detail.locale || "ru" });
    body.push(
      section(
        detail.locale === "en"
          ? "Try safe output"
          : "Попробуйте безопасный вывод",
        "security-example",
        securityExample.element,
      ),
    );
  }
  if (
    ["human-first-agent-interfaces", "agent-interface-verification"].includes(
      detail.id,
    )
  ) {
    humanAgentExample = buildHumanAgentSample({
      locale: detail.locale || "ru",
    });
    body.push(
      section(
        detail.locale === "en"
          ? "Try the semantic task"
          : "Попробуйте семантический сценарий",
        "human-agent-example",
        humanAgentExample.element,
      ),
    );
  }
  if (["catalog-item-presentation", "catalog-discovery"].includes(detail.id)) {
    catalogExample = buildCatalogPresentationSample({
      mode: detail.id === "catalog-discovery" ? "search" : "cards",
      locale: detail.locale || "ru",
      headingLevel: 4,
    });
    body.push(
      section(
        detail.locale === "en" ? "Try the pattern" : "Попробуйте пример",
        "catalog-example",
        catalogExample.element,
      ),
    );
  }
  if (lesson) {
    body.push(section(t.scenario, "scenario", h("p", {}, lesson.scenario)));
    graphic = createLessonFigure({
      document,
      lesson,
      locale: detail.locale,
      sectionId: detail.id,
    });
    body.push(section(t.example, "example", graphic.element));
  }
  if (detail.id === "color-palettes") {
    workshopI18n = createI18n({
      locale: detail.locale || "ru",
      availableLocales: ["ru", "en"],
    });
    workshop = createPaletteBuilder({
      document,
      i18n: workshopI18n,
      baseColor: "#176f56",
    });
    body.push(
      section(
        detail.locale === "en" ? "Try a palette" : "Попробуйте палитру",
        "palette",
        workshop.element,
      ),
    );
  }
  body.push(section(t.principle, "principle", bookBody(detail.body)));
  if (lesson)
    body.push(
      section(
        t.practice,
        "practice",
        h(
          "ol",
          { className: "book-practice" },
          lesson.practice.map((step) => h("li", {}, step)),
        ),
      ),
    );
  const outline = h(
    "nav",
    { className: "book-outline", "aria-label": t.contents },
    h("strong", {}, t.contents),
  );
  for (const { title, target } of anchors) {
    const button = h("button", { type: "button" }, title);
    listen(button, () => {
      target.scrollIntoView?.({ block: "start" });
      target.focus({ preventScroll: true });
    });
    outline.append(button);
  }
  element.append(outline, ...body);
  const sources = h(
    "details",
    { className: "book-sources" },
    h("summary", {}, t.sources),
  );
  for (const source of detail.sources ?? [])
    sources.append(
      h(
        "div",
        { className: "book-source" },
        sourceLink(source),
        h(
          "span",
          { className: "muted" },
          source.kind === "primary"
            ? t.primary
            : source.kind === "ag-policy"
              ? t.policy
              : t.secondary,
        ),
        source.note ? h("p", { className: "muted" }, source.note) : null,
      ),
    );
  element.append(sources);
  const pager = h("nav", { className: "book-pager", "aria-label": t.chapters });
  for (const [chapter, label, direction] of [
    [previous, t.previous, "previous"],
    [next, t.next, "next"],
  ])
    if (chapter) {
      const button = h(
        "button",
        { type: "button", className: `book-pager__${direction}` },
        h("span", {}, label),
        h("strong", {}, chapter.title),
      );
      listen(button, () => onNavigate(chapter));
      pager.append(button);
    }
  element.append(
    pager,
    h(
      "details",
      { className: "book-agent-access" },
      h("summary", {}, t.agentAccess),
      h(
        "code",
        {},
        `design_rule_section(section_id=${JSON.stringify(detail.id)}, audience="agent", locale="en")`,
      ),
      h(
        "p",
        { className: "muted" },
        `${t.revision}: ${String(detail.catalogRevision ?? t.unknownRevision).slice(0, 12)}`,
      ),
    ),
    h("p", { className: "muted book-contract" }, t.contract),
  );
  return {
    element,
    heading,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const remove of removals) remove();
      removals.length = 0;
      catalogExample?.dispose();
      catalogExample = null;
      humanAgentExample?.dispose();
      securityExample?.dispose();
      runtimeExample?.dispose();
      framingExample?.dispose();
      iconExample?.dispose();
      humanAgentExample = null;
      workshop?.dispose();
      workshopI18n?.dispose();
      workshop = null;
      workshopI18n = null;
      graphic?.dispose();
      graphic = null;
    },
  };
}

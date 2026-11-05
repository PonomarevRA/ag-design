import { createButton, createNotice } from "./vendor/ag-design/index.js";
import { get } from "./api.js";
import { h } from "./dom.js";
import { preview } from "./previews.js";
import { categoryLabel, maturityLabel } from "./catalog-search.js";
import { componentSources } from "./component-sources.js";
import { sourceLink } from "./design-book.js";

/** Render one component's literal anatomy, supported variants and attributed sources. */
function contract(item) {
  const section = h(
    "section",
    { className: "component-contract" },
    h("h3", {}, "Анатомия и варианты"),
  );
  const anatomy = h("ol", { className: "anatomy-list" });
  for (const part of item.anatomy || []) anatomy.append(h("li", {}, part));
  section.append(anatomy);
  for (const [label, values] of [
    ["Варианты", item.variants],
    ["Состояния", item.states],
  ]) {
    section.append(
      h("h4", {}, label),
      h("p", {}, (values || []).join(" · ") || "Описаны в контракте экспорта"),
    );
  }
  const sources = h(
    "div",
    { className: "contract-sources" },
    h("h4", {}, "Происхождение решения"),
  );
  const references = componentSources(item.design?.sources);
  for (const url of references)
    sources.append(sourceLink({ url, title: "Стандарт или документация ↗" }));
  if (references.length) section.append(sources);
  return section;
}

/** Keep actual rule text and its manual/automated evidence boundary available inside a disclosure. */
function ruleList(rules) {
  const list = h("div", { className: "rule-list" });
  for (const rule of rules) {
    list.append(
      h(
        "article",
        { className: "rule-item" },
        h("h3", {}, rule.title),
        h("p", {}, rule.summary),
        h(
          "div",
          { className: "rule-meta" },
          h(
            "span",
            { className: "muted" },
            rule.check === "automated"
              ? "Автопроверка + ревью"
              : "Ручная проверка",
          ),
          sourceLink({ url: rule.sourceUrl, title: "Источник ↗" }),
        ),
      ),
    );
  }
  return list;
}

/**
 * Own one component-detail session, its full interactive preview and cancellable evidence reads.
 * @param {object} options - The existing dialog, host-state readers and explicit sandbox/report adapters.
 * @returns {object} open(item) and idempotent disposal; late completions cannot update another session.
 */
export function createComponentDetail({
  dialog,
  presentation,
  rules,
  openSandbox,
  renderPerformanceRows,
  makePreview = preview,
}) {
  const content = dialog.querySelector("#detail-content");
  let current = null;
  let disposed = false;

  /** Retire the exact previous preview and abort only its read requests. */
  function release() {
    const previous = current;
    current = null;
    if (!previous) return;
    previous.controller.abort();
    previous.sample.dispose();
  }
  const isCurrent = (session) =>
    !disposed && current === session && dialog.open;
  /** Native close events are queued: an old event must not retire an already reopened dialog. */
  function closeInactiveSession() {
    if (!dialog.open) release();
  }
  dialog.addEventListener("close", closeInactiveSession);

  /** Read fresh evidence for the retained component; retry preserves the user's interactive preview state. */
  async function loadEvidence(session) {
    if (!isCurrent(session) || session.pending) return;
    session.pending = true;
    const id = encodeURIComponent(session.item.id);
    try {
      const [usage, performance, qualification] = await Promise.all([
        get(`usage?componentId=${id}`, { signal: session.controller.signal }),
        get(`performance?componentId=${id}`, {
          signal: session.controller.signal,
        }),
        get(`components/${id}/checks`, { signal: session.controller.signal }),
      ]);
      if (!isCurrent(session)) return;
      session.evidence.replaceChildren(
        h("h3", {}, "Проверки и использование"),
        h(
          "p",
          {},
          qualification.readyForConsumer
            ? "Проверка текущего определения в дизайн-системе пройдена. Далее нужна проверка продукта."
            : "Текущему определению нужна проверка в дизайн-системе.",
        ),
        h(
          "p",
          { className: "muted" },
          `${usage.total} интеграций · ${performance.total} отчётов`,
        ),
      );
      for (const entry of usage.items)
        session.evidence.append(
          h(
            "p",
            { className: "usage-note" },
            `${entry.consumerName} · ${entry.location}: ${entry.note}`,
          ),
        );
      if (performance.total)
        // Reports compare against this exact detail item, including its current version/budget.
        session.evidence.append(renderPerformanceRows(performance.items, [session.item]));
      else
        session.evidence.append(
          h(
            "p",
            { className: "muted" },
            "Нет замеров. Их можно запустить в разделе «Производительность».",
          ),
        );
    } catch (cause) {
      if (!isCurrent(session)) return;
      session.evidence.replaceChildren(
        createNotice({ text: cause.message, tone: "danger" }),
        createButton({
          label: "Повторить загрузку сведений",
          onClick: () => loadEvidence(session),
        }),
      );
    } finally {
      session.pending = false;
    }
  }

  /** Present a fresh exact item; identity uses the session object, never a possibly duplicated title. */
  async function open(item) {
    if (disposed) return;
    release();
    const { palette, profile } = presentation();
    const sample = makePreview(item.id, palette, profile, item);
    const evidence = h(
      "section",
      { className: "detail-evidence" },
      h("h3", {}, "Проверки и использование"),
      h("p", { className: "muted" }, "Загружаем сведения…"),
    );
    const session = {
      item,
      sample,
      evidence,
      controller: new AbortController(),
      pending: false,
    };
    current = session;
    dialog.querySelector("#detail-title").textContent = item.name;
    dialog.querySelector("#detail-category").textContent = categoryLabel(
      item.category,
    );
    const matchedRules = rules().filter((rule) => item.rules.includes(rule.id));
    const definition = h("dl", { className: "facts" });
    for (const [label, value] of [
      ["Пакет", `${item.package} ${item.version}`],
      ["Экспорт", item.exportName],
      ["Расширение", item.extensions.join(", ")],
      ["Платформы", item.platforms.join(", ")],
    ]) {
      definition.append(h("dt", {}, label), h("dd", {}, value));
    }
    content.replaceChildren(
      h(
        "div",
        { className: "detail-presentation" },
        h(
          "section",
          {
            className: "detail-demo",
            "aria-label": "Интерактивный пример компонента",
          },
          h("h3", {}, "Интерактивный пример"),
          sample.element,
          createButton({
            label: "Добавить в песочницу",
            onClick: () => {
              dialog.close();
              openSandbox(item);
            },
          }),
        ),
        h(
          "section",
          { className: "detail-overview" },
          h("p", { className: "detail-summary" }, item.summary),
          h("h3", {}, "Когда использовать"),
          h("p", {}, item.design?.intendedUse || "Не описано"),
          h("h3", {}, "Почему выбран этот дизайн"),
          h("p", {}, item.design?.rationale || "Не описано"),
          h("h3", {}, "Ограничения и альтернативы"),
          h("p", {}, item.design?.limitations || "Требуется ревью"),
          h("p", {}, (item.design?.alternatives || []).join(" ")),
          h(
            "p",
            { className: "muted" },
            `${maturityLabel(item.design?.lifecycle)} · это статус разработки, а не проверка продукта.`,
          ),
          definition,
        ),
      ),
      evidence,
      h(
        "details",
        { className: "detail-disclosure" },
        h("summary", {}, "Подключение, анатомия и варианты"),
        h(
          "pre",
          {},
          `import { ${item.exportName} } from '${item.package}';\n${item.usageExample}`,
        ),
        contract(item),
      ),
      h(
        "details",
        { className: "detail-disclosure" },
        h("summary", {}, `Правила и источники · ${matchedRules.length}`),
        ruleList(matchedRules),
      ),
    );
    if (!dialog.open) dialog.showModal();
    dialog.querySelector(".detail-body").scrollTop = 0;
    await loadEvidence(session);
  }

  return {
    open,
    dispose() {
      if (disposed) return;
      disposed = true;
      dialog.removeEventListener("close", closeInactiveSession);
      release();
    },
  };
}

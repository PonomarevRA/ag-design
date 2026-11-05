import { get, post } from "./api.js";
import { h } from "./dom.js";
import { discoveryLinks } from "./discovery-links.js";
import {
  createButton,
  createSelect,
  createNotice,
  applyColorProfile,
  evaluateColorPair,
  createStatus,
} from "./vendor/ag-design/index.js";

/**
 * Render guidance within an optional navigation-owned read lifetime.
 * @param {HTMLElement} parent Host screen region replaced synchronously on mount.
 * @param {object} options Optional AbortSignal cancels pending reads and disposes controls immediately.
 * @returns {Promise<Function>} Idempotent teardown; abort never submits or retries writes.
 */
export async function renderRecommendations(parent, { signal, onOpenChapter, onOpenComponent } = {}) {
  const root = h("section", { className: "recommendation-workspace" }),
    output = h("section", { className: "recommendation-results" }),
    color = h("section");
  parent.replaceChildren(root);
  const query = h("input", {
      placeholder: "Например, чат запросов агента",
      maxLength: 256,
    }),
    project = h("input", { value: "ag-design", maxLength: 128 });
  const stageControl = createSelect({ label: "Этап", options: [
    {value:"plan",label:"Планирование"}, {value:"layout",label:"Компоновка"},
    {value:"component",label:"Компонент"}, {value:"review",label:"Ревью"},
    {value:"release",label:"Выпуск"},
  ]});
  const platformControl = createSelect({label:"Платформа", options: [
    {value:"web",label:"Браузер"}, {value:"macos",label:"macOS"},
    {value:"windows",label:"Windows"}, {value:"linux",label:"Linux"},
  ]});
  const stage = stageControl.select, platform = platformControl.select;
  const form = h(
    "form",
    { className: "recommendation-form" },
    h("label", { className: "ag-field recommendation-goal" }, "Что проектируем", query),
    h("label", { className: "ag-field" }, "Проект", project),
    stageControl.element, platformControl.element,
  );
  const submit = createButton({
    label: "Подобрать рекомендации",
    onClick: load,
  });
  form.append(submit);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    load();
  });
  const location = h(
    "p",
    { className: "muted" },
    "Читаем расположение библиотеки…",
  );
  const freshness = h("p", { className: "recommendation-freshness", role: "status" });
  root.append(h("section", { className: "recommendation-brief" },
    h("h2", {}, "Задача и контекст"), form, freshness),
    h("details", { className: "detail-disclosure" }, h("summary", {}, "Хранение библиотеки"), location), output, color);
  let generation = 0, disposed = false, loadController = null,
    restoreProfile = () => {};
  /** Input changes invalidate the displayed request scope and abort only an obsolete read. */
  function changeScope() {
    generation++;
    loadController?.abort();
    loadController = null;
    submit.disabled = false;
    output.dataset.stale = "true";
    freshness.textContent = "Условия изменились. Обновите подбор для текущей задачи.";
  }
  form.addEventListener("input", changeScope, true);
  form.addEventListener("change", changeScope, true);
  /** Release public control listeners as well as the profile on navigation or a late response. */
  function dispose() {
    if (disposed) return;
    disposed = true;
    generation++;
    signal?.removeEventListener("abort", dispose);
    loadController?.abort();
    form.removeEventListener("input", changeScope, true);
    form.removeEventListener("change", changeScope, true);
    restoreProfile();
    stageControl.dispose();
    platformControl.dispose();
  }
  signal?.addEventListener("abort", dispose, { once: true });
  if (signal?.aborted) {
    dispose();
    return dispose;
  }
  /** Keep late responses inside the requesting page; absence of a matching component is a usable guidance state. */
  async function load() {
    if (disposed) return;
    loadController?.abort();
    loadController = new AbortController();
    const signal = loadController.signal;
    const current = ++generation;
    const requestedQuery = query.value.trim();
    submit.disabled = true;
    output.replaceChildren(h("p", {}, "Подбираем рекомендации…"));
    try {
      const params = new URLSearchParams({
        q: requestedQuery,
        project: project.value,
        stage: stage.value,
        platform: platform.value,
      });
      const result = await get("recommendations?" + params, { signal });
      if (disposed || !root.isConnected || current !== generation) return;
      delete output.dataset.stale;
      freshness.textContent = "Подбор соответствует отправленным условиям.";
      const note = !requestedQuery
        ? "Опишите задачу, чтобы найти подходящие элементы. Ниже — общие правила проектирования."
        : result.components.length
        ? `Найдено компонентов: ${result.components.length}`
        : "Совпадений не найдено. Уточните назначение или посмотрите каталог и общие правила; новый элемент создавайте после проверки подходящих компонентов.";
      output.replaceChildren(
        h("h2", {}, "Подбор под проект"),
        h("p", {}, note),
      );
      if (requestedQuery) output.append(h("p", {className:"muted"}, `Задача: ${requestedQuery}`));
      for (const item of result.components)
        output.append(
          h(
            "p",
            {},
            `${item.name}: ${item.design?.intendedUse || item.summary}`,
          ),
        );
      if (onOpenComponent) {
        const links = discoveryLinks({ candidates: result.componentCandidates, title: "Похожие компоненты", onSelect: candidate => { if (!disposed) onOpenComponent(candidate); } });
        if (links) output.append(links);
      }
      if (onOpenChapter) {
        const links = discoveryLinks({ candidates: result.knowledgeCandidates, title: "Рекомендации из справочника", onSelect: candidate => { if (!disposed) onOpenChapter(candidate); } });
        if (links) output.append(links);
      }
      for (const style of result.systemStyles || []) {
        output.append(h("article", {className:"rule-item"}, h("h3", {}, `Стиль системы: ${style.name}`),
          h("p", {}, style.summary), h("p", {className:"muted"}, "Кандидат по словам запроса. Применяйте при явно выбранной пользователем эстетике."),
          h("a", {href:"#styles"}, "Открыть стили систем")));
      }
      for (const item of result.recommendations) {
        const article = h(
          "article",
          { className: "rule-item" },
          h("h3", {}, item.title),
          h("p", {}, item.recommendation),
        );
        const sources = h("ul", {className:"recommendation-sources", "aria-label":"Источники"});
        for (const url of item.sources)
          sources.append(h("li", {},
            h(
              "a",
              {
                href: url,
                target: "_blank",
                rel: "noopener",
                className: "recommendation-source",
              },
              sourceTitle(url),
            ),
          ));
        article.append(sources);
        output.append(article);
      }
    } catch (error) {
      if (root.isConnected && current === generation)
        output.replaceChildren(
          createNotice({ text: error.message, tone: "danger" }),
        );
    } finally {
      if (current === generation) submit.disabled = false;
    }
  }
  try {
    const [profiles, library] = await Promise.all([
      get("profiles", { signal }),
      get("library", { signal }),
    ]);
    if (disposed || !root.isConnected) return dispose;
    location.textContent = `Внешняя библиотека: ${library.directory}. Компоненты и пакеты сохраняются отдельно от приложения.`;
    const select = h("select", { "aria-label": "Цветовой профиль" }),
      theme = h("select", { "aria-label": "Тема профиля" });
    for (const profile of profiles.items)
      select.append(h("option", { value: profile.id }, profile.name));
    for (const value of ["light", "dark"])
      theme.append(h("option", { value }, value));
    select.value = "design";
    const sample = h("div", { className: "profile-preview" }),
      scores = h("div", { className: "score-grid" });
    color.append(
      h("h2", {}, "Цветовые профили и контраст"),
      h(
        "p",
        {},
        "Рекомендательный вес: APCA 70%, WCAG2 30%. Провал AA остаётся отдельным провалом. Это не сертификация интерфейса.",
      ),
      h("div", { className: "action-row" },
        h("label", { className: "ag-field" }, "Цветовой профиль", select),
        h("label", { className: "ag-field" }, "Оформление", theme)),
      sample,
      scores,
    );
    const render = () => {
      restoreProfile();
      const profile =
        profiles.items.find((item) => item.id === select.value) ||
        profiles.items[0];
      restoreProfile = applyColorProfile(sample, profile, theme.value);
      sample.replaceChildren(
        h("strong", {}, "Одинаковое поведение, палитра проекта"),
        h(
          "p",
          { className: "muted" },
          "Второстепенный текст и состояния проверяются отдельно.",
        ),
        createButton({ label: "Основное действие", variant: "primary" }),
        createStatus({ label: "Ожидает проверки" }),
      );
      const tokens = profile[theme.value];
      scores.replaceChildren();
      for (const [title, foreground, background, role] of [
        ["Основной текст", tokens.text, tokens.surface, "body"],
        ["Второстепенный", tokens.muted, tokens.surface, "label"],
        ["Действие", tokens.onAccent, tokens.accent, "label"],
      ]) {
        const result = evaluateColorPair({
          foreground,
          background,
          fontSize: 16,
          fontWeight: 400,
          role,
        });
        scores.append(
          h(
            "article",
            { className: "rule-item" },
            h("h3", {}, title),
            h(
              "p",
              {},
              `WCAG2: ${result.wcag2.ratio}:1 · AA ${result.wcag2.aa ? "PASS" : "FAIL"}`,
            ),
            h(
              "p",
              {},
              `APCA: Lc ${result.apca.lc} · цель |Lc| ${result.apca.target}`,
            ),
            h(
              "p",
              {},
              `Баллы: ${result.weightedScore}/100 · ${result.verdict}`,
            ),
            h(
              "p",
              { className: "muted" },
              `Barlow,400: ${result.apca.minimumReferenceFontPx}px. Beta font guidance; реальный шрифт требует проверки.`,
            ),
          ),
        );
      }
    };
    select.addEventListener("change", render);
    theme.addEventListener("change", render);
    render();
  } catch (error) {
    if (root.isConnected) location.textContent = error.message;
  }
  await load();
  return dispose;
}

/** Present readable source identities while retaining exact provenance in the link target. */
function sourceTitle(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url; }
}

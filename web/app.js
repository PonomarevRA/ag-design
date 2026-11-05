import {createCatalogViewControls} from "./catalog-view-controls.js";
import { discoveryLinks } from "./discovery-links.js";
import { createComponentDetail } from "./component-detail.js";
import {getLocaleRuntime,createLocaleSettings} from "./locale-preferences.js";
import {localizeComponent} from "./vendor/ag-design/i18n-component.js";
import { createBrandStudio } from "./brand-studio.js";
import {renderSystemStyles} from "./system-styles.js";
import {bindUsageTooltip} from "./usage-tooltip.js";
import { catalogUsageModel, loadCatalogUsage, sortCatalogComponents } from "./catalog-usage.js";
import { createCatalogRail } from "./catalog-rail.js";
import { windowedSample } from "./windowed-sample.js";
import {bindMasonry} from "./masonry.js";
import {createInterfaceWorkspace, workspaceRoute} from "./interface-workspace.js";
import {createCatalogSearch, categoryLabel, maturityLabel} from "./catalog-search.js";
import {
  createButton,
  createSelect,
  createCatalogCard,
  createCatalogSearchControls,
  createNumericBadge,
  createStatus,
  createEmptyState,
  createNotice,
  bindNavigation,
  bindWindowShell,
} from "./vendor/ag-design/index.js";
import { auditInterface } from "./vendor/ag-design/audit.js";
import { get, post, getAll } from "./api.js";
import { bindNativeSidebar } from "./native-sidebar.js";
import { h, table } from "./dom.js";
import { preview, updatePreviewProfiles, currentPreviewTheme } from "./previews.js";
import {renderElementLibraries} from "./element-libraries.js";
import {renderRecommendations} from "./recommendations.js";
import {renderDesignBook} from "./design-book.js";
import {renderInterfaceReview} from "./interface-review.js";
import { runBenchmarkSuite, restorePerformanceView } from "./performance.js";
import { renderPerformanceRows, performanceRunSummary } from "./performance-view.js";

const localeRuntime=getLocaleRuntime(document);
let studioComposition = null;
const titles = {
  settings: ["Язык и регион", "Язык интерфейса и доступные локали на этом устройстве."],
  studio: ["Бренд-бук и клиентские пути", "Доска визуального языка, граф переходов и реальные экраны из композиций."],
  styles: ["Стили систем", "Визуальный язык целого продукта: композиция, материалы, типографика и правила применения."],
  "ui-map": ["Карта интерфейса", "Реальная геометрия, смысловые группы и проверяемые свидетельства одного локального снимка."],
  sandbox:["Песочница","Редактор, карта с метриками и проверка интерфейса в одном рабочем пространстве."],
  libraries: ["Библиотеки элементов", "Подключённые наборы, отдельные версии и происхождение компонентов."],
  recommendations: ["Рекомендации", "Подбор под проект, этап разработки, профили и проверяемые основания."],
  catalog: ["Компоненты", "Одна система поведения. Палитра вашего сервиса."],
  rules: [
    "Дизайн-бук",
    "Сценарии, композиция, семантический цвет и проверяемые основания для каждого решения.",
  ],
  usage: [
    "Проекты и дизайн-долг",
    "Где используются элементы и что проверить при обновлении.",
  ],
  performance: [
    "Производительность",
    "Замеры компонентов с версией сценария, окружением и ограничениями метода.",
  ],
  audit: [
    "Проверка интерфейса",
    "Проверяемые правила и обязательные ручные сценарии.",
  ],
};
const state = {
  view: titles[window.location.hash.slice(1)] ? window.location.hash.slice(1) : "catalog",
  components: [],
  libraries: [],
  library: "",
  profiles: [],
  rules: [],
  category: "",
  sort: "relevance",
  usageMode: "value",
  usage: catalogUsageModel(null),
  usageError: null,
  query: "",
  searchResult: null,
  catalogSearchStatus: "ready",
  palette: "design",
  generation: 0,
  disposers: [],
  run: null,
  refreshGeneration: 0,
  navigationRead: null,
  refreshRead: null,
  disposed: false,
  performanceOffset: 0,
  notesOffset: 0,
  visibleComponents: 100,
};
const content = document.getElementById("content"),
  error = document.getElementById("error");
const nav = document.querySelector("#sidebar nav");
const detailController = createComponentDetail({
  dialog: document.getElementById("detail"),
  presentation: () => ({ palette: state.palette, profile: state.profiles.find(profile => profile.id === state.palette) }),
  rules: () => state.rules,
  openSandbox,
  renderPerformanceRows,
});
let windowShell, catalogSearchTimer;
// Query controls own native input/feedback; the existing catalog engine still owns interpretation and results.
const catalogQueryControls = createCatalogSearchControls({
  document, i18n:localeRuntime.context, label:"Найти компонент", mode:"instant",
  adjacentFields:[document.getElementById("library").closest("label")],
  onChange(request,detail){
    if(detail.reason === "reset"){resetCatalogFilters();return;}
    beginCatalogQuery(request.query,detail.reason);
  },
});
const previousSearch = document.getElementById("search");
previousSearch.closest("label").replaceWith(catalogQueryControls.element);
catalogQueryControls.input.id = "search";
catalogQueryControls.input.maxLength = 256;
catalogQueryControls.input.placeholder = "Название, назначение или совместимость…";
catalogQueryControls.element.classList.add("search-field");
const catalogViewControls=createCatalogViewControls({document,i18n:localeRuntime.context,details:document.querySelector(".catalog-options"),palette:state.palette});
const catalogSearch = createCatalogSearch({
  load: (query, { signal }) => getAll(`components?q=${encodeURIComponent(query)}&libraryId=${encodeURIComponent(state.library)}`, 2000, { signal }),
  apply: (query, result) => {
    if (state.view !== "catalog" || state.query.trim() !== query) return;
    error.hidden = true;
    error.replaceChildren();
    state.searchResult = {query, ...result};
    state.catalogSearchStatus = "ready";
    clearPreviews();
    renderCatalog();
    content.setAttribute("aria-busy", "false");
  },
  fail: () => {
    if(state.view !== "catalog")return;
    state.catalogSearchStatus = "error";
    // Navigation may have replaced the retained tree with its loading view.
    // Restore the last result/inventory before announcing that the request failed.
    if (!content.querySelector(".component-grid")) {
      clearPreviews();
      renderCatalog();
    }
    content.setAttribute("aria-busy", "false");
    content.dataset.catalogStale = "true";
    catalogQueryControls.report({revision:catalogQueryControls.state.revision,status:"error"});
    error.replaceChildren(createNotice({text:"Поиск не выполнен. Сохранены запрос и предыдущая выдача; повторите поиск или измените условия.",tone:"danger"}));
    error.hidden = false;
  },
});
const nativeSidebar = bindNativeSidebar(
  window,
  document.getElementById("sidebar"),
);

/** Show a recoverable failure without discarding the previously loaded catalogue. */
function showError(cause) {
  error.replaceChildren(createNotice({ text: cause.message, tone: "danger" }));
  error.hidden = false;
}

/** Release live preview subscriptions before replacing a page. */
function clearPreviews() {
  for (const dispose of state.disposers) dispose();
  state.disposers = [];
}

/** Synchronize the native/browser sidebar without moving its leading edge. */
function setCollapsed(collapsed, { remember = true } = {}) {
  document.body.classList.toggle("sidebar-collapsed", collapsed);
  const toggle = document.getElementById("sidebar-toggle");
  toggle.setAttribute("aria-expanded", String(!collapsed));
  toggle.title = collapsed ? "Развернуть меню (⌘⇧S)" : "Свернуть меню (⌘⇧S)";
  toggle.setAttribute(
    "aria-label",
    collapsed ? "Развернуть меню" : "Свернуть меню",
  );
  if (remember)
    try {
      localStorage.setItem("ag-design-sidebar", String(collapsed));
    } catch {
      /* Collapse works in private mode. */
    }
  nativeSidebar.notify();
}

/** Keep explicit and automatic appearance changes consistent with complete palette scopes already mounted. */
function refreshPreviewThemes() {
  updatePreviewProfiles(document.querySelectorAll(".preview[data-palette], .catalog-render-window[data-palette]"), state.profiles, currentPreviewTheme());
  window.dispatchEvent(new CustomEvent("ag-design:appearance",{detail:{palette:state.palette,profiles:state.profiles}}));
}

/** Preview cleanup belongs to its current page or dialog, never global observers. */
function trackedPreview(id, { presentation = "catalog" } = {}) {
  const definition = state.components.find(item=>item.id===id);
  const sample = windowedSample(() => preview(id, state.palette, state.profiles.find(profile=>profile.id===state.palette), definition, { presentation }),
    {label: definition?.name || id, estimatedHeight: definition?.libraryId ? 280 : 300, retainInteractions: id !== "field"});
  sample.element.classList.add('catalog-render-window');
  sample.element.dataset.palette = state.palette;
  updatePreviewProfiles([sample.element], state.profiles, currentPreviewTheme());
  state.disposers.push(sample.dispose);
  return sample.element;
}

/** Display all matching real components on one page with explicit empty results. */
function renderCatalog() {
  document.getElementById("catalog-reset").hidden = !state.query.trim() && !state.category && !state.library;
  renderCategories();
  const query = state.query.trim();
  const result = query ? state.searchResult : null;
  const pending = !!query && (result?.query !== query || state.catalogSearchStatus !== "ready");
  const candidates = query ? (result?.items ?? state.components) : state.components;
  const filtered = candidates.filter(item => (!state.category || item.category === state.category) && (!state.library || (item.libraryId || "ag-core") === state.library));
  const matches = sortCatalogComponents(filtered, state.sort, state.usage.counts);
  const alternatives = [];
  if (!pending && result) {
    for (const candidate of result.discoveryCandidates ?? []) {
      const item = state.components.find(component => component.id === candidate.id);
      if (!item || matches.some(match => match.id === item.id)) continue;
      if (state.category && item.category !== state.category) continue;
      if (state.library && (item.libraryId || "ag-core") !== state.library) continue;
      alternatives.push(candidate);
    }
  }
  const discoveryCount = pending ? 0 : alternatives.length + (result?.knowledgeCandidates?.length ?? 0);
  const grid = h("div", { className: "component-grid" });
  const railEntries = [];
  for (const item of matches.slice(0, state.visibleComponents)) {
    const cardView = createCatalogCard({
      document, i18n:localeRuntime.context, headingLevel:2, appearance:"plain",
      title:item.name, summary:item.summary,
      note:maturityLabel(item.design?.lifecycle) + " · допуск к использованию — в подробностях",
      facts:[{label:"Пакет",value:item.package},{label:"Версия",value:item.version}],
      media:trackedPreview(item.id),
      onOpen:()=>openDetail(item),
      primaryAction:{label:"Подробнее",variant:"secondary",onAction:()=>openDetail(item)},
      secondaryActions:[{label:"В песочницу",variant:"quiet",onAction:()=>openSandbox(item)}],
    });
    const card=cardView.element;
    card.id=`catalog-component-${item.id}`;
    card.classList.add("component-card");
    if(item.id==="board-viewport")card.classList.add("component-card--wide");
    cardView.parts.header.classList.add("component-heading");
    cardView.parts.header.append(usageLabel(item),createStatus({label:categoryLabel(item.category)}));
    cardView.parts.body.classList.add("component-info");
    cardView.parts.note.classList.add("component-maturity");
    cardView.parts.footer.classList.add("component-meta");
    cardView.parts.actions.classList.add("component-actions");
    state.disposers.push(cardView.dispose);
    grid.append(card);
    railEntries.push({ component: item, target: card });
  }
  state.disposers.push(bindMasonry(grid));
  if (railEntries.length) {
    const rail = createCatalogRail({ document, entries: railEntries, libraries: state.libraries });
    content.replaceChildren(h("div", { className: "catalog-layout" }, rail.element, grid));
    state.disposers.push(rail.dispose);
  } else if (discoveryCount) {
    content.replaceChildren(h("p", {className:"catalog-match-note"}, "Точных совпадений нет. Ниже — возможные компоненты и рекомендации для проверки."));
  } else {
    content.replaceChildren(createEmptyState({
      title: "Ничего не найдено",
      description: "Попробуйте другое название, назначение или категорию.",
    }), createButton({label: "Сбросить фильтры", onClick: resetCatalogFilters}));
  }
  if (matches.length > state.visibleComponents)
    content.append(
      createButton({
        label: "Показать ещё компоненты",
        onClick: () => {
          state.visibleComponents += 100;
          clearPreviews();
          renderCatalog();
        },
      }),
    );
  if (!pending && result) {
    const components = discoveryLinks({ candidates: alternatives, title: "Похожие компоненты", onSelect: candidate => {
      if (state.view !== "catalog" || state.query.trim() !== query) return;
      const item = state.components.find(component => component.id === candidate.id);
      if (item) openDetail(item);
    }});
    const chapters = discoveryLinks({ candidates: result.knowledgeCandidates, title: "Рекомендации из справочника", onSelect: candidate => {
      if (state.view !== "catalog" || state.query.trim() !== query) return;
      state.pendingBookChapter = candidate.id;
      void navigate("rules");
    }});
    if (!matches.length && chapters) content.append(chapters);
    if (components) content.append(components);
    if (matches.length && chapters) content.append(chapters);
  }
  catalogViewControls.setUsageAvailable(!state.usageError);
  document.getElementById("catalog-count").textContent =
    `${pending ? "Предыдущая выдача · " : ""}${matches.length}${discoveryCount ? " точных · " + discoveryCount + " кандидатов" : " найдено"} · в каталоге ${state.components.length}${result?.truncated ? " · выборка ограничена, уточните запрос" : ""}`;
  content.dataset.catalogStale = String(pending);
  content.dataset.catalogQuery = query ? result?.query ?? "" : "";
  const searchStatus = pending ? state.catalogSearchStatus : "ready";
  catalogQueryControls.report({
    revision: catalogQueryControls.state.revision,
    status: searchStatus,
    ...(pending ? {} : { total: matches.length }),
  });
}

/** A registered count is a reuse fact, not a quality rating or a preview/view counter. */
function usageLabel(item) {
  const count = state.usage.counts.get(item.id);
  const bar = h("div", {className: "component-usage"});
  let trigger;
  if (count === undefined) {
    trigger = h("span", {className: "component-usage__unknown", role: "img", "aria-label": "Число использований неизвестно"}, "—");
  } else {
    const badge = createNumericBadge({value: count, label: "Использований", mode: state.usageMode, scale: state.usage.scale});
    trigger = badge.element;
    trigger.classList.add("component-usage__badge");
    state.disposers.push(badge.dispose);
  }
  bar.append(trigger);
  state.disposers.push(bindUsageTooltip({trigger, text: count === undefined
    ? "Число использований неизвестно. " + (state.usageError || "Для компонента нет сводки зарегистрированных применений.")
    : "Число зарегистрированных мест использования компонента. Превью и повторные отчёты счётчик не увеличивают. В режиме «Частота» показана относительная оценка от 0 до 5; точное количество: " + count + ".",
  }));
  return bar;
}

/** Open the exact current component through the detail window's single resource owner. */
function openDetail(item) {
  return detailController.open(item);
}

/**
 * Read integrations/notes for one navigation owner; late note writes never navigate another screen.
 * @param {number} generation Exact screen generation that requested these records.
 * @param {AbortSignal} signal Navigation-owned read cancellation, never forwarded to mutation POST.
 */
async function renderUsage(generation, signal) {
  const [usage, debt, notes] = await Promise.all([
    getAll("usage", 2000, { signal }),
    getAll("debt", 2000, { signal }),
    get(`notes?limit=50&offset=${state.notesOffset}`, { signal }),
  ]);
  if (generation !== state.generation) return;
  const groups = new Map();
  for (const entry of usage.items) {
    if (!groups.has(entry.consumerId)) groups.set(entry.consumerId, []);
    groups.get(entry.consumerId).push(entry);
  }
  const list = h("div");
  list.append(
    h(
      "p",
      { className: "muted" },
      "Записи отражают manifest и ревью проекта. Это не автоматическое сканирование текущего runtime.",
    ),
  );
  for (const entries of groups.values())
    list.append(
      h(
        "section",
        { className: "usage-group" },
        h("h2", {}, entries[0].consumerName),
        table(
          "Использование компонентов",
          ["Компонент", "Версия", "Место", "Заметка"],
          entries.map((entry) => [
            entry.componentId,
            entry.version,
            h("code", {}, entry.location),
            entry.note,
          ]),
        ),
      ),
    );
  if (!groups.size)
    list.append(
      createEmptyState({
        title: "Интеграции ещё не зарегистрированы",
        description:
          "Добавьте manifest проекта и атрибутированную запись использования в каталог.",
      }),
    );
  list.append(
    h(
      "section",
      { className: "detail-section" },
      h("h2", {}, "Рекомендации по обновлению"),
      debt.items.length
        ? table(
            "Дизайн-долг",
            ["Проект", "Компонент", "Рекомендация", "Статус"],
            debt.items.map((entry) => [
              entry.consumerId,
              entry.componentId,
              entry.summary,
              entry.status,
            ]),
          )
        : createEmptyState({
            title: "Открытых рекомендаций нет",
            description:
              "Это не подтверждает отсутствие долга в непроверенных интерфейсах.",
          }),
    ),
  );
  const form = h(
    "form",
    { className: "note-form detail-section" },
    h("h2", {}, "Заметка для следующего ревью"),
  );
  const area = h("textarea", {
    rows: 3,
    maxlength: 8192,
    required: true,
    id: "note-text",
    className: "ag-input",
  });
  const submit = createButton({
    label: "Сохранить заметку",
    variant: "primary",
  });
  submit.type = "submit";
  form.append(
    h(
      "label",
      { className: "ag-field", for: "note-text" },
      h("span", { className: "ag-field__label" }, "Наблюдение о дизайне"),
      area,
    ),
    submit,
  );
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    try {
      await post("notes", { text: area.value });
      if (generation !== state.generation || signal.aborted) return;
      area.value = "";
      await navigate("usage");
    } catch (cause) {
      if (generation === state.generation && !signal.aborted) showError(cause);
    } finally {
      submit.disabled = false;
    }
  });
  list.append(
    form,
    h(
      "section",
      { className: "detail-section" },
      h("h2", {}, "Последние заметки"),
      notes.items.map((note) => h("p", { className: "usage-note" }, note.text)),
    ),
  );
  list.append(
    pageControls(notes, state.notesOffset, (offset) => {
      state.notesOffset = offset;
      navigate("usage");
    }),
  );
  content.replaceChildren(list);
}

/** Retain the last run summary and target across report refreshes, without persistent user telemetry. */
let lastPerformanceRun = null;
let lastPerformanceComponent = "all";

/** Run each component independently; always restore the launch control even when reload/storage fails. */
async function runBenchmarks(button, progress, components) {
  const controller = new AbortController();
  state.run = controller;
  button.textContent = "Остановить";
  let failure;
  try {
    lastPerformanceRun = await runBenchmarkSuite({
      components, signal:controller.signal, save:report=>post("performance",report),
      onProgress(component,step,total) { progress.textContent = `${component.name}: ${step}/${total}`; },
    });
    document.getElementById("announcement").textContent = lastPerformanceRun.cancelled
      ? "Проверка остановлена"
      : `Проверка завершена; ошибок: ${lastPerformanceRun.failed}; не сохранено: ${lastPerformanceRun.unsaved}`;
  } catch (cause) { failure = cause; }
  finally {
    if (state.run === controller) state.run = null;
    button.textContent = "Запустить проверку";
    try { await restorePerformanceView({ refresh:()=>navigate("performance"), isCurrent:()=>state.view === "performance", showError, failure }); }
    catch (cause) { if (state.view === "performance") showError(cause); }
  }
}

/**
 * Read retained reports for this screen; scores never imply missing measurements are zero.
 * @param {number} generation Exact navigation generation receiving this report page.
 * @param {AbortSignal} signal Owner cancellation for the read, separate from explicit benchmark writes.
 */
async function renderPerformance(generation, signal) {
  const reports = await get(
    `performance?limit=50&offset=${state.performanceOffset}`,
    { signal },
  );
  if (generation !== state.generation) return;
  const progress = h("span", { className: "run-progress", role: "status" });
  const candidates = state.components.filter(component=>!component.libraryId);
  const selected = createSelect({label:"Проверяемый компонент",value:lastPerformanceComponent,onChange:value=>{lastPerformanceComponent=value;}, options:[{value:"all",label:`Все встроенные примеры (${candidates.length})`},...candidates.map(component=>({value:component.id,label:component.name}))]});
  state.disposers.push(selected.dispose);
  const button = createButton({
    label: "Запустить проверку",
    variant: "primary",
  });
  button.addEventListener("click", () => {
    if (state.run) state.run.abort();
    else { const id = selected.value; lastPerformanceComponent = id; void runBenchmarks(button, progress, candidates.filter(component=>id === "all" || component.id === id)); }
  });
  const intro = h(
    "div",
    { className: "section-intro" },
    h("h2", {}, "Измерять, затем оптимизировать"),
    h(
      "p",
      {},
      "12 пакетов по 40 экземпляров после прогрева. Mount и update включают синхронную компоновку. Тест запускается только по команде.",
    ),
    h(
      "p",
      {},
      "Browser heap и Node/jsdom heap показаны раздельно. Отсутствующий замер не участвует в оценке; полного рейтинга без памяти нет.",
    ),
  );
  const launch = h("section", { className: "check-launch" },
    h("h2", {}, "Проверка компонентов"),
    h("p", {}, "Запустите измерения после выбора окружения и завершения взаимодействий с компонентами."),
    selected.element,
    h("div", { className: "action-row" }, button, progress),
    h("p", {className:"muted"}, "Ошибка одного компонента сохраняется отдельно; остальные проверки продолжаются. Подключаемые библиотеки проверяются своим пакетным сценарием."),
    h("p", {className:"muted"}, "Heap / экземпляр — удерживаемая JS-память одного живого экземпляра. Браузерный сценарий её не измеряет. Результаты Node/jsdom с GC показаны отдельными строками и не являются памятью браузера."));
  const method = h("details", { className: "check-method" },
    h("summary", {}, "Метод измерения и ограничения"), intro);
  content.replaceChildren(
    h("div", { className: "check-overview" }, launch, method, performanceRunSummary(lastPerformanceRun)),
    reports.items.length
      ? renderPerformanceRows(reports.items, state.components)
      : createEmptyState({
          title: "Пока нет измерений",
          description:
            "Запустите тест, чтобы сохранить воспроизводимые результаты.",
        }),
  );
  content.append(
    pageControls(reports, state.performanceOffset, (offset) => {
      state.performanceOffset = offset;
      navigate("performance");
    }),
  );
}

/** Show explicit source coverage and navigate byte-limited report pages by the server cursor. */
function pageControls(page, offset, onPage) {
  const row = h(
    "nav",
    { className: "action-row", "aria-label": "Страницы отчётов" },
    h(
      "span",
      { className: "muted" },
      `Показано ${page.items.length ? offset + 1 : 0}-${offset + page.items.length} из ${page.total}`,
    ),
  );
  if (offset > 0)
    row.append(createButton({ label: "Сначала", onClick: () => onPage(0) }));
  if (page.hasMore)
    row.append(
      createButton({
        label: "Следующие",
        onClick: () => onPage(page.nextOffset),
      }),
    );
  return row;
}

/** Audit only the user's current sample; manual acceptance cannot be inferred from an empty finding list. */
function renderAudit(container = content) {
  const target = h(
    "section",
    { className: "audit-target", "aria-label": "Проверяемые компоненты" },
    trackedPreview("button", { presentation: "interactive" }),
    trackedPreview("field", { presentation: "interactive" }),
    trackedPreview("sidebar", { presentation: "interactive" }),
  );
  const result = h("div", { className: "detail-section", role: "status" });
  const button = createButton({
    label: "Проверить образцы",
    variant: "primary",
    onClick: async () => {
      const audit = auditInterface(target);
      result.replaceChildren(
        h("h2", {}, "Результат автоматической проверки"),
        h(
          "p",
          {},
          `Проверено ${audit.inspected} управлений; замечаний ${audit.findings.length}. ${audit.truncated ? "Объём ограничен." : ""}`,
        ),
        h("p", { className: "muted" },
          `Ширина: ${audit.layoutWidths.targets.length} целей; ${audit.layoutWidths.coverage.measured} измерены; ${audit.layoutWidths.coverage.unknown} без проверки; gate ${audit.layoutWidths.geometryGate}. Поля: ${audit.formRows.rows.length}; геометрия: ${audit.formRows.geometryGate}. Проверяются явно обозначенные группы подписей, полей и подсказок. Отсутствие измерений не означает успех.`),
        h(
          "p",
          { className: "muted" },
          "Далее вручную: клавиатура и возврат фокуса, обе темы, контраст, 200% текста, узкое окно, native fallback и screen reader.",
        ),
      );
      for (const finding of audit.findings)
        result.append(
          createNotice({ text: `${finding.summary} ${finding.evidence}` }),
        );
      try {
        await post("audits", {
          title: "Видимые образцы ag-design",
          componentIds: ["button", "field", "sidebar"],
          summary: `${audit.inspected} управлений; ручная проверка обязательна.`,
          findings: audit.findings,
        });
      } catch (cause) {
        showError(cause);
      }
    },
  });
  container.replaceChildren(
    h(
      "div",
      { className: "section-intro" },
      h("h2", {}, "Проверка помогает ревью, а не заменяет его"),
      h(
        "p",
        {},
        "Автоматически проверяются доступные названия, размер целей и ссылки aria-controls. Чеклист и scanner доступны в npm-пакетах для запуска внутри проекта. MCP читает каталог и доказательства без выполнения чужого кода.",
      ),
    ),
    h(
      "a",
      { href: "/layout-review.html", className: "ag-button" },
      "Проверить размеры окна",
    ),
    target,
    h("div", { className: "action-row" }, button),
    result,
  );
}

let activeSandbox = null;
/** Open a concrete catalogue item in the layout editor after the page has mounted. */
async function openSandbox(item) {
  await navigate("sandbox");
  await activeSandbox?.addComponent(item.id);
}

/**
 * Own the requested screen, its cancellable reads and its current-only render callbacks.
 * @param {string} requestedView Known screen ID or supported workspace-mode alias.
 * @returns {Promise<void>} Resolves after this render attempt; obsolete completions never replace a newer view.
 */
async function navigate(requestedView) {
  if (state.disposed) return;
  const {view, mode} = workspaceRoute(requestedView);
  if (!titles[view]) return;
  if (view === "sandbox" && state.view === "sandbox" && activeSandbox) {activeSandbox.setMode(mode); return;}
  state.run?.abort();
  state.navigationRead?.abort();
  const navigationRead = new AbortController();
  state.navigationRead = navigationRead;
  const signal = navigationRead.signal;
  clearTimeout(catalogSearchTimer);
  catalogSearch.invalidate();
  state.view = view;
  document.body.dataset.view = view;
  // Every actual screen has a stable local entry point; component/document ownership remains separate.
  const route = new URL(window.location.href);
  route.hash = view === "catalog" ? "" : view;
  window.history.replaceState(null, "", route);
  const generation = ++state.generation;
  clearPreviews();
  for (const button of nav.querySelectorAll("[data-view]")) {
    if (button.dataset.view === view)
      button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
  document.getElementById("heading").textContent = titles[view][0];
  document.getElementById("description").textContent = titles[view][1];
  document.getElementById("catalog-tools").hidden = view !== "catalog";
  document.getElementById("catalog-count").hidden = view !== "catalog";
  error.hidden = true;
  content.setAttribute("aria-busy", "true");
  content.replaceChildren(
    createEmptyState({
      title: "Загружаем данные",
      description: "Ожидаем локальный сервис.",
    }),
  );
  try {
    if (view === "catalog") {
      if (state.query.trim()) {state.catalogSearchStatus="loading";catalogQueryControls.report({revision:catalogQueryControls.state.revision,status:"loading"});await catalogSearch.run(state.query.trim());}
      else renderCatalog();
    }
    else if (view === "settings") {
      const settings=createLocaleSettings({document,runtime:localeRuntime});content.replaceChildren(settings.element);state.disposers.push(settings.dispose);
    }
    else if (view === "studio") {
      const studio = createBrandStudio({components:state.components,profiles:state.profiles,palette:state.palette,initialComposition:studioComposition,onOpenComposition(documentId){
        try {localStorage.setItem("ag-design:composition:document:v2",documentId);} catch {}
        navigate("sandbox");
      }});
      studioComposition = null; content.replaceChildren(studio.element); state.disposers.push(()=>studio.dispose());
    }
    else if (view === "sandbox") {
      // Fixed sample previews belong to the workspace, not to each manual draft.
      let scanner = null;
      activeSandbox = createInterfaceWorkspace({components:state.components,profiles:state.profiles,palette:state.palette,initialMode:mode,
        onAddScreen(context){studioComposition=context;navigate("studio");},
        renderReview: async (container,isCurrent) => {
          if (!isCurrent() || generation !== state.generation) return;
          const review = h("section",{className:"interface-review"});
          if (!scanner) {
            const samples = h("div",{className:"workspace-sample-audit"});
            scanner = h("details",{className:"workspace-sample-scanner"},
              h("summary",{},"Сканер тестовых образцов"),
              h("p",{className:"muted"},"Проверяет фиксированные образцы компонентов. Результат не относится автоматически к текущей композиции."),samples);
            renderAudit(samples);
          }
          container.replaceChildren(review,scanner);
          await renderInterfaceReview(review,{isCurrent:()=>isCurrent() && generation===state.generation,reviewContext:container.reviewContext});
        }});
      content.replaceChildren(activeSandbox.element);
      const workspace=activeSandbox;
      state.disposers.push(()=>{workspace.dispose();if(activeSandbox===workspace)activeSandbox=null;});
    }
    else if (view === "styles") {
      const dispose = await renderSystemStyles(content, {isCurrent:()=>generation===state.generation});
      if (generation === state.generation) state.disposers.push(dispose);
      else dispose();
    }
    else if (view === "libraries") await renderElementLibraries(content,{refresh,openLibrary:selectLibrary,isCurrent:()=>generation===state.generation});
    else if (view === "rules") {
      const initialSection=state.pendingBookChapter ?? "";
      state.pendingBookChapter="";
      const dispose=await renderDesignBook(content,{initialSection,runtime:localeRuntime,isCurrent:()=>generation===state.generation,onContext:({title,description})=>{if(generation!==state.generation)return;document.getElementById("heading").textContent=title;document.getElementById("description").textContent=description;}});
      if(generation===state.generation)state.disposers.push(dispose);else dispose();
    }
    else if (view === "recommendations") {
      const dispose = await renderRecommendations(content, { signal,
        onOpenComponent: candidate => {
          const item = state.components.find(component => component.id === candidate.id);
          if (item) openDetail(item);
        },
        onOpenChapter: candidate => {
          state.pendingBookChapter = candidate.id;
          void navigate("rules");
        },
      });
      if (generation === state.generation) state.disposers.push(dispose);
      else dispose();
    }
    else if (view === "usage") await renderUsage(generation, signal);
    else if (view === "performance") await renderPerformance(generation, signal);
    else {
      renderAudit();
      const review = h("section",{className:"interface-review"});
      content.append(review);
      await renderInterfaceReview(review,{isCurrent:()=>generation===state.generation});
    }
  } catch (cause) {
    if (generation === state.generation) {
      showError(cause);
      content.replaceChildren(
        createEmptyState({
          title: "Данные недоступны",
          description:
            "Проверьте локальный сервис и нажмите «Обновить каталог».",
        }),
      );
    }
  } finally {
    if (generation === state.generation)
      content.setAttribute("aria-busy", "false");
  }
}

/**
 * Refresh bounded metadata as one cancellable owner, preserving current section/search.
 * New refreshes or final page disposal fence and abort obsolete reads; POST lifetime stays separate.
 */
async function refresh() {
  if (state.disposed) return;
  const revision = ++state.refreshGeneration;
  const previous = state.refreshRead;
  const operation = new AbortController();
  state.refreshRead = operation;
  previous?.abort();
  const signal = operation.signal;
  try {
    const [components, rules, profiles, libraries, usage] = await Promise.all([
      getAll("components", 2000, { signal }),
      getAll("rules", 2000, { signal }),
      get("profiles", { signal }),
      get("libraries", { signal }),
      loadCatalogUsage(path => get(path, { signal })).then(value => ({value}), cause => ({error: cause.message})),
    ]);
    if (revision !== state.refreshGeneration) return;
    state.components = components.items;
    state.usageError = usage.error || null;
    state.usage = catalogUsageModel(usage.value);
    state.rules = rules.items;
    state.profiles = profiles.items;
    state.libraries = libraries.items;
    const available = state.libraries.filter(item=>item.enabled);
    if (state.library && !available.some(item=>item.id===state.library)) state.library="";
    if (!state.profiles.some(item=>item.id===state.palette)) state.palette=state.profiles.find(item=>item.id==="design")?.id || state.profiles[0]?.id || "";
    const librarySelect=document.getElementById("library");
    librarySelect.replaceChildren(h("option",{value:""},"Все библиотеки"));
    for(const item of available) librarySelect.append(h("option",{value:item.id},item.name));
    librarySelect.value=state.library;
    catalogViewControls.setProfiles(state.profiles,state.palette);
    document.getElementById("connection").textContent =
      `${state.components.length} компонентов`;
    await navigate(state.view);
  } catch (cause) {
    if (revision !== state.refreshGeneration) return;
    content.setAttribute("aria-busy", "false");
    document.getElementById("connection").textContent = "Сервис недоступен";
    showError(cause);
  } finally {
    if (state.refreshRead === operation) state.refreshRead = null;
  }
}

/** Filter one active library and select its original semantic palette without changing other libraries. */
function selectLibrary(library) {
  state.library=library?.id || "";
  if(library?.defaultProfile) state.palette=library.defaultProfile;
  document.getElementById("library").value=state.library;
  catalogViewControls.setPalette(state.palette);
  catalogSearch.invalidate();
  state.searchResult=null;
  return navigate("catalog");
}
document.getElementById("library").addEventListener("change",event=>selectLibrary(state.libraries.find(item=>item.id===event.target.value)));
for (const button of nav.querySelectorAll("[data-view]"))
  button.addEventListener("click", () => navigate(button.dataset.view));
const disposeNav = bindNavigation(nav);
window.addEventListener("hashchange", () => {
  const view = window.location.hash.slice(1) || "catalog";
  if (titles[view] && state.view !== view) navigate(view);
});
document
  .getElementById("sidebar-toggle")
  .addEventListener("click", () =>
    setCollapsed(!document.body.classList.contains("sidebar-collapsed")),
  );
window.addEventListener("ag-design:toggle-sidebar", () =>
  setCollapsed(!document.body.classList.contains("sidebar-collapsed")),
);
document.addEventListener("keydown", (event) => {
  if (
    !document.documentElement.classList.contains("native-toolbar") &&
    (event.metaKey || event.ctrlKey) &&
    event.shiftKey &&
    event.code === "KeyS"
  ) {
    event.preventDefault();
    setCollapsed(!document.body.classList.contains("sidebar-collapsed"));
  }
});
document.getElementById("refresh").addEventListener("click", refresh);
document.getElementById("theme").addEventListener("click", () => {
  const choices = ["auto", "light", "dark"];
  const theme =
    choices[(choices.indexOf(document.documentElement.dataset.theme) + 1) % 3];
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("ag-design-theme", theme);
  } catch {}
  document.getElementById("announcement").textContent = `Тема: ${theme}`;
  refreshPreviewThemes();
});
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", refreshPreviewThemes);
/** Keep the last committed masonry/preview tree while a newer query waits or fails. */
function beginCatalogQuery(value,reason="input") {
  state.query=value;
  clearTimeout(catalogSearchTimer);
  catalogSearch.invalidate();
  if(state.view!=="catalog")return;
  error.hidden=true;
  if(!value.trim()) {
    state.searchResult=null;state.catalogSearchStatus="ready";
    clearPreviews();renderCatalog();content.setAttribute("aria-busy","false");return;
  }
  state.catalogSearchStatus="loading";
  content.setAttribute("aria-busy","true");content.dataset.catalogStale="true";
  document.getElementById("catalog-count").textContent="Ищем · показана предыдущая выдача";
  if(!content.querySelector(".component-grid")){clearPreviews();renderCatalog();}
  const run=()=>catalogSearch.run(state.query.trim());
  if(reason==="submit"||reason==="retry")void run();
  else catalogSearchTimer=setTimeout(run,180);
}
for (const [id, key] of [["catalog-sort", "sort"], ["catalog-usage-mode", "usageMode"]])
  document.getElementById(id).addEventListener("change", (event) => {
    state[key] = event.target.value;
    if(key==="sort")catalogViewControls.setSort(state.sort);
    else catalogViewControls.setMetric(state.usageMode);
    clearPreviews();
    renderCatalog();
    document.getElementById("announcement").textContent = `${event.target.selectedOptions[0].textContent}. Порядок и метки обновлены.`;
  });
document.getElementById("palette").addEventListener("change", (event) => {
  state.palette = event.target.value;
  catalogViewControls.setPalette(state.palette);
  for (const element of document.querySelectorAll(".preview, .catalog-render-window[data-palette]"))
    element.dataset.palette = state.palette;
  refreshPreviewThemes();
});
/** Build every available category from catalog metadata, retaining stable filter identities. */
function renderCategories() {
  const categories = document.querySelector(".categories");
  const values = ["", ...new Set(state.components.map(item => item.category).filter(Boolean))];
  const current = [...categories.querySelectorAll("[data-category]")];
  if (current.length === values.length && current.every((control, index) => control.dataset.category === values[index])) {
    for (const control of current)
      control.setAttribute("aria-pressed", String(control.dataset.category === state.category));
    return;
  }
  categories.replaceChildren();
  for (const value of values) {
    const control = createButton({label: value ? categoryLabel(value) : "Все", variant: "quiet",
      onClick: () => {
        state.category = value;
        renderCategories(); clearPreviews(); renderCatalog();
      }});
    control.dataset.category = value;
    control.setAttribute("aria-pressed", String(state.category === value));
    categories.append(control);
  }
}

/** Clear search/filter state together; presentation choices and usage evidence remain intact. */
function resetCatalogFilters() {
  clearTimeout(catalogSearchTimer);
  catalogSearch.invalidate();
  state.query = ""; state.searchResult = null; state.category = ""; state.library = "";state.catalogSearchStatus="ready";
  catalogQueryControls.update({query:""});
  error.hidden = true;
  error.replaceChildren();
  document.getElementById("library").value = "";
  renderCategories(); clearPreviews(); renderCatalog();
  content.setAttribute("aria-busy", "false");
  // Recovery may remove its own empty-state button; return to a stable input.
  document.getElementById("search").focus({preventScroll: true});
}
document.getElementById("catalog-reset").append(createButton({
  label: "Сбросить фильтры", variant: "quiet", onClick: resetCatalogFilters,
}));
document
  .getElementById("detail-close")
  .addEventListener("click", () => document.getElementById("detail").close());
window.addEventListener("pagehide", (event) => {
  // A bfcache suspension retains the document and its controls for pageshow.
  if (event.persisted) return;
  state.disposed = true;
  state.generation++;
  state.refreshGeneration++;
  state.navigationRead?.abort();
  state.refreshRead?.abort();
  clearTimeout(catalogSearchTimer);
  catalogSearch.invalidate();
  state.run?.abort();
  clearPreviews();
  detailController.dispose();
  windowShell?.dispose();
  disposeNav();
  nativeSidebar.dispose();
});
try {
  setCollapsed(localStorage.getItem("ag-design-sidebar") === "true", {
    remember: false,
  });
} catch {}
windowShell = bindWindowShell({identity:'ag-design',header:'.content-header',titleSource:'#heading',detailTitleSource:'#detail-title',navigation:'#sidebar [aria-current="page"]',actions:[{selector:'#refresh',id:'refresh'},{selector:'#theme',id:'theme'}],panels:[{selector:'#sidebar',edge:'right',variable:'--nav-width',layout:'.app-window'}]});
refresh();

const shellLocale=localizeComponent({element:document.body,dispose(){}},"application-shell",{i18n:localeRuntime.context});
window.addEventListener("pagehide",event=>{if(!event.persisted){catalogViewControls.dispose();catalogQueryControls.dispose();shellLocale.dispose();localeRuntime.dispose();}});

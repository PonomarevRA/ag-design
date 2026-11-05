import { h, table } from "./dom.js";
import { performanceVerdict } from "./performance.js";

/** Show a real retained metric with its environment; absent memory is a reason, never zero bytes. */
export function performanceMemory(report) {
  const metric = report.metrics.find((m) => m.name === "retained_bytes_per_instance");
  if (metric && Number.isFinite(metric.value)) return {
    value: new Intl.NumberFormat("ru", { maximumFractionDigits: 1 }).format(metric.value / 1024) + " КиБ",
    reason: report.memory?.method === "node-jsdom-gc" || report.environment.runtime?.includes("Node") ? "Node/jsdom · с GC; не память браузера" : "См. метод и окружение",
  };
  return { value: "Не измерена", reason: report.memory?.reason || (report.measuredBy === "browser-harness" ? "В этом сценарии нет замера памяти компонента" : "В отчёте нет метрики Heap / экземпляр") };
}

/** Keep outcome, coverage and version comparison separate; long evidence stays in an optional disclosure. */
export function renderPerformanceRows(reports, components) {
  const rows = [];
  for (const report of reports) {
    const metric = (name) => report.metrics.find((m) => m.name === name);
    const timing = (name) => metric(name) ? `${metric(name).value.toFixed(3)} мс` : "—";
    const component = components.find((c) => c.id === report.componentId);
    const current = component && component.version === report.componentVersion;
    const failed = report.outcome === "failed", cancelled = report.outcome === "cancelled";
    const verdict = failed || cancelled || current ? performanceVerdict(report, component?.budget) : {label:"Версия отличается от текущей",score:null,reason:"Сравнение бюджета отключено для другой версии компонента."};
    const memory = performanceMemory(report);
    const status = h("div", {className:"performance-result", "data-outcome":report.outcome || "measured"}, h("strong", {}, failed ? "Проверка с ошибкой" : cancelled ? "Остановлено" : "Сценарий выполнен"));
    if (failed) status.append(h("span",{},`${report.error?.phase || "Сценарий"}: ${report.error?.message || "Подробности в отчёте"}`));
    rows.push([
      h("div",{},h("strong",{},component?.name || report.componentId || "Все"),h("small",{},`${report.componentId || "Все"} · ${report.componentVersion || "версия не указана"}`),h("small",{},report.environment.runtime?.includes("Node") ? "Node/jsdom" : report.measuredBy === "browser-harness" ? "Браузер · DOM и CSS" : report.environment.runtime || "Среда не указана")),
      status, timing("mount_p95_ms"), timing("interaction_p95_ms"),
      h("div",{className:"performance-memory"},h("strong",{},memory.value),h("small",{},memory.reason)),
      h("div",{},verdict.score === null ? verdict.label : `${verdict.score}/100 · ${verdict.label}`,h("small",{},verdict.reason)),
      h("details",{},h("summary",{},"Доказательства"),h("pre",{},JSON.stringify({scenario:report.scenario,outcome:report.outcome || "legacy measurement",error:report.error,environment:report.environment,memory:report.memory,method:report.measuredBy,trust:report.trust || "caller-reported",measuredAt:report.measuredAt,notes:report.notes,metrics:report.metrics},null,2))),
    ]);
  }
  const element = table("Результаты проверки компонентов",["Компонент и среда","Результат","Создание p95","Обновление p95","Heap / экземпляр","Оценка бюджета","Метод"],rows);
  element.classList.add("performance-results");
  return element;
}

/** Summarize this run only, including per-component save failures without pretending they were persisted. */
export function performanceRunSummary(summary) {
  if (!summary) return null;
  const completed = summary.results.filter((r) => r.report.outcome === "measured").length;
  const element = h("section",{className:"performance-run-summary","aria-label":"Итог последнего запуска"},h("p",{},`${summary.cancelled ? "Запуск остановлен" : "Запуск завершён"}. Выполнено: ${completed}; с ошибкой: ${summary.failed}; не сохранено: ${summary.unsaved}.`));
  const errors = summary.results.filter((r) => r.report.outcome === "failed" || !r.saved);
  if (errors.length) element.append(h("ul",{},errors.map((r)=>h("li",{},`${r.report.componentId}: ${r.report.error?.message || "Сценарий выполнен"}${r.saveError ? "; не сохранено: "+r.saveError : ""}`))));
  return element;
}

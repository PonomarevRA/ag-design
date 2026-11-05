import { h } from "./dom.js";
import { get, post } from "./api.js";
import { evidenceRow, observation } from "./review-fields.js";

let reviewSequence = 0;

/** Review both the fixed summary rubric and detailed requirements using the server's current policy. */
export async function renderInterfaceReview(
  container,
  { isCurrent = () => true, reviewContext } = {},
) {
  // Snapshot only public identity before async loading; null is an explicit unbound draft.
  let frozenContext = reviewContext;
  if (reviewContext != null) {
    frozenContext = {};
    for (const key of [
      "kind",
      "documentId",
      "revision",
      "documentHash",
      "scenarioId",
    ])
      frozenContext[key] = reviewContext[key];
  }
  const rubric = await get("interface-rubric");
  if (!isCurrent()) return;
  const form = h("form", { className: "review-form" });
  const context = h("input", { type: "text", maxlength: "2048" });
  const contextHint = h("p", {
    className: "muted",
    id: `interface-review-${++reviewSequence}-context-hint`,
  });
  context.setAttribute("aria-describedby", contextHint.id);
  if (frozenContext !== undefined) {
    const available = Math.max(
      0,
      2048 -
        JSON.stringify({ composition: frozenContext, description: "" }).length,
    );
    context.maxLength = available;
    contextHint.textContent = `Описание до ${available} символов. Общий объём описания и привязки проверяется перед сохранением.`;
  }
  form.append(
    h("h2", {}, "Оценка по свидетельствам"),
    h(
      "p",
      { className: "muted" },
      "Детальные правила влияют на оценку и допуск. Неизвестные проверки не дают баллов; обязательный провал блокирует готовность. Это оценка AG, не сертификация WCAG или Apple.",
    ),
    h(
      "label",
      { className: "ag-field" },
      h("span", {}, "Страница, сценарий и окружение"),
      context,
    ),
    contextHint,
  );
  form.addEventListener(
    "invalid",
    (event) => {
      let group = event.target.parentElement;
      while (group && group !== form) {
        if (group.tagName === "DETAILS") group.open = true;
        group = group.parentElement;
      }
    },
    true,
  );
  form.append(
    h(
      "a",
      { href: "/requirements-preview.html" },
      "Примеры вариантов и согласованных скруглений",
    ),
  );
  const parents = [],
    requirements = [];
  const progress = h("output", {
    className: "review-progress",
    "aria-label": "Заполнение свидетельств",
  });
  const sections = h("div", { className: "review-sections" });
  form.append(progress, sections);
  for (const check of rubric.checks) {
    const badge = h(
      "span",
      { className: "review-section__status" },
      "Не проверено",
    );
    const section = h(
      "details",
      { className: "review-section", "data-check-id": check.id },
      h("summary", {}, h("span", {}, check.title), badge),
    );
    const row = evidenceRow(check.title);
    row.element.prepend(
      h(
        "small",
        { className: "muted" },
        `Вес ${check.weight}${check.critical ? " · критическая проверка" : ""}`,
      ),
    );
    section.append(row.element);
    sections.append(section);
    row.select.addEventListener("change", () => {
      badge.textContent = row.select.selectedOptions[0].textContent;
      badge.dataset.status = row.select.value;
    });
    parents.push({ ...row, id: check.id });
    const children = (rubric.requirements || []).filter(
      (rule) => rule.checkId === check.id,
    );
    if (!children.length) continue;
    const group = h(
      "details",
      {},
      h("summary", {}, `Детальные правила: ${children.length}`),
    );
    for (const rule of children) {
      const detail = evidenceRow(rule.title, rule.metric);
      detail.element.append(
        h("p", { className: "muted" }, rule.method),
        h(
          "small",
          {},
          `${rule.id} · ${rule.mandatory ? "обязательное" : "рекомендация"}`,
        ),
      );
      group.append(detail.element);
      requirements.push({ ...detail, id: rule.id });
    }
    section.append(group);
  }
  const submit = h(
    "button",
    { type: "submit", className: "ag-button ag-button--primary" },
    "Рассчитать оценку",
  );
  const result = h("div", { className: "review-result", role: "status" });
  form.append(h("footer", { className: "review-submit" }, submit), result);
  let inputRevision = 0,
    resultRevision = null,
    pending = false;
  /** A visible calculation belongs to the submitted evidence revision, not to later editable inputs. */
  function markChanged() {
    inputRevision++;
    const rows = [...parents, ...requirements];
    const described = rows.filter(
      (row) => row.select.value !== "unknown",
    ).length;
    progress.textContent = `Отмечено ${described} из ${rows.length} · это заполнение, не оценка качества`;
    if (pending || resultRevision !== null) {
      result.dataset.stale = "true";
      result.replaceChildren(
        h(
          "p",
          {},
          "Ввод изменён. Пересчитайте оценку для текущих свидетельств.",
        ),
      );
    }
  }
  form.addEventListener("input", markChanged, true);
  form.addEventListener("change", markChanged, true);
  progress.textContent = `Отмечено 0 из ${parents.length + requirements.length} · выберите критерий для проверки`;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (pending) return;
    if (!isCurrent()) {
      result.replaceChildren(
        h(
          "p",
          { role: "alert" },
          "Оценка устарела. Начните новую ручную оценку для текущей композиции.",
        ),
      );
      return;
    }
    const reportContext =
      frozenContext === undefined
        ? context.value
        : JSON.stringify({
            composition: frozenContext,
            description: context.value,
          });
    if (reportContext.length > 2048) {
      result.replaceChildren(
        h(
          "p",
          { role: "alert" },
          "Описание вместе с привязкой слишком длинное. Сократите описание и повторите расчёт.",
        ),
      );
      return;
    }
    submit.disabled = true;
    pending = true;
    const submittedRevision = inputRevision;
    delete result.dataset.stale;
    try {
      const report = await post("interface-evaluation", {
        policyVersion: rubric.policyVersion,
        context: reportContext,
        observations: parents.map((row) =>
          observation(row, { checkId: row.id }),
        ),
        requirementObservations: requirements.map((row) =>
          observation(row, { ruleId: row.id }),
        ),
      });
      if (!isCurrent()) return;
      if (inputRevision !== submittedRevision) {
        result.dataset.stale = "true";
        result.replaceChildren(
          h(
            "p",
            {},
            "Расчёт относится к предыдущему вводу. Пересчитайте текущие свидетельства.",
          ),
        );
        return;
      }
      resultRevision = submittedRevision;
      const decisions = {
        blocked: "Блокирующие проблемы",
        "needs-evidence": "Нужны свидетельства",
        revise: "Нужна доработка",
        ready: "Проверки пройдены",
      };
      const findings = h("ul");
      for (const finding of report.requirements?.findings || [])
        findings.append(h("li", {}, `${finding.ruleId}: ${finding.fix}`));
      result.replaceChildren(
        h("h3", {}, decisions[report.decision] || report.decision),
        h(
          "p",
          {},
          `Оценка: ${report.score ?? "—"} / 100 · Покрытие: ${report.coverage}% · Обязательные правила: ${report.requirements?.gate ?? "—"}`,
        ),
        findings,
        h(
          "details",
          {},
          h("summary", {}, `Расчёт ${report.policyVersion} и свидетельства`),
          h("pre", {}, JSON.stringify(report, null, 2)),
        ),
      );
    } catch (cause) {
      if (isCurrent())
        result.replaceChildren(h("p", { role: "alert" }, cause.message));
    } finally {
      pending = false;
      submit.disabled = false;
    }
  });
  container.replaceChildren(form);
}

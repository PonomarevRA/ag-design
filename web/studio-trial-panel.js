import { createButton } from "./vendor/ag-design/index.js";
import { h } from "./dom.js";
import { studioId } from "./studio-model.js";

/** Planner and an explicitly started prototype trial; never observes participant field values in the preview. */
export function createStudioTrialPanel({
  client,
  journey,
  onEdit,
  onRunningChange,
  now = () => performance.now(),
}) {
  const abort = new AbortController();
  const root = h("section", {
    className: "studio-trials",
    "aria-label": "Проверка клиентского пути",
  });
  const message = h("p", { role: "status", "aria-live": "polite" });
  let state = null,
    active = null,
    starting = null,
    finishing = null,
    terminalFailure = null,
    busy = false,
    disposed = false;
  let started = 0,
    events = [],
    checkInputs = [],
    notes = null,
    reportEpoch = 0;
  let renderAbort = new AbortController();

  /** Keep an ambiguous request intact until an explicit exact retry; no trial is silently duplicated. */
  async function run(action) {
    if (busy || disposed) return;
    busy = true;
    render();
    try {
      await action();
    } catch (error) {
      message.textContent = terminalFailure
        ? `${error.message}. Закройте локальную попытку, чтобы продолжить работу с доской.`
        : `${error.message}. При ошибке связи повторите ту же операцию.`;
    } finally {
      busy = false;
      if (!disposed) render();
    }
  }
  function button(label, action, variant = "secondary") {
    const result = createButton({ label, variant, onClick: () => run(action) });
    result.disabled = busy;
    return result;
  }
  function select(label, choices, value) {
    const control = h("select", { "aria-label": label });
    for (const [id, title] of choices)
      control.append(h("option", { value: id }, title));
    control.value = value;
    return {
      control,
      element: h(
        "label",
        { className: "ag-field" },
        h("span", {}, label),
        control,
      ),
    };
  }
  function input(label, multiline = false) {
    const control = h(multiline ? "textarea" : "input", {
      maxlength: multiline ? 1024 : 256,
      required: true,
    });
    return {
      control,
      element: h(
        "label",
        { className: "ag-field" },
        h("span", {}, label),
        control,
      ),
    };
  }
  function planEditor(container) {
    const plan = state.document.testPlan || {
      purpose: "operations",
      tasks: [],
    };
    const details = h("details", {}, h("summary", {}, "Задачи и тип формы"));
    const purpose = select(
      "Назначение",
      [
        ["operations", "Управление и технические формы"],
        ["funnel", "Маркетинговая воронка"],
      ],
      plan.purpose,
    );
    purpose.control.disabled = busy || !!starting;
    purpose.control.addEventListener(
      "change",
      () =>
        run(() =>
          onEdit((document) => {
            document.testPlan = { ...plan, purpose: purpose.control.value };
          }),
        ),
      { signal: renderAbort.signal },
    );
    details.append(purpose.element);
    for (const task of plan.tasks)
      details.append(
        h(
          "div",
          { className: "studio-trial-task" },
          h("p", {}, `${task.title}: ${task.instruction}`),
          button(
            `Удалить задачу «${task.title}»`,
            () =>
              onEdit((document) => {
                document.testPlan.tasks = document.testPlan.tasks.filter(
                  (item) => item.id !== task.id,
                );
              }),
            "quiet",
          ),
        ),
      );
    if (state.document.screens.length && plan.tasks.length < 12) {
      const title = input("Название задачи");
      const instruction = input(
        "Нейтральная задача участнику: цель без подсказки кнопок",
        true,
      );
      const choices = state.document.screens.map((screen) => [
        screen.id,
        screen.title,
      ]);
      const entry = select(
        "Стартовый экран",
        choices,
        state.document.startScreenId,
      );
      const goal = select("Целевой экран", choices, choices.at(-1)[0]);
      const required = input(
        "Обязательные ID переходов через запятую (необязательно)",
      );
      required.control.required = false;
      const form = h(
        "form",
        { className: "studio-property-form" },
        title.element,
        instruction.element,
        entry.element,
        goal.element,
        required.element,
      );
      const submit = createButton({
        label: "Добавить задачу",
        variant: "secondary",
      });
      submit.type = "submit";
      submit.disabled = busy || !!starting;
      form.append(submit);
      form.addEventListener(
        "submit",
        (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          run(() =>
            onEdit((document) => {
              document.testPlan ||= { purpose: "operations", tasks: [] };
              document.testPlan.tasks.push({
                id: studioId("task"),
                title: title.control.value,
                instruction: instruction.control.value,
                entryScreenId: entry.control.value,
                goalScreenIds: [goal.control.value],
                requiredTransitionIds: required.control.value
                  .split(",")
                  .map((value) => value.trim())
                  .filter(Boolean),
              });
            }),
          );
        },
        { signal: renderAbort.signal },
      );
      details.append(form);
    }
    container.append(details);
  }

  /** Events describe only declared graph navigation; free exploration must not masquerade as a recorded task. */
  function record(event) {
    if (!active || finishing || busy) return false;
    if (events.length >= 256) {
      message.textContent =
        "Достигнут предел 256 переходов. Завершите попытку и начните новую задачу.";
      return false;
    }
    events.push({
      ...event,
      elapsedMs: Math.max(0, Math.round(now() - started)),
    });
    return true;
  }
  async function start(taskId) {
    starting ||= {
      documentId: state.documentId,
      expectedRevision: state.revision,
      taskId,
      idempotencyKey: studioId("trial"),
    };
    onRunningChange(true);
    try {
      active = await client.startTrial(starting);
      if (disposed) return;
      starting = null;
      events = [];
      started = now();
      checkInputs = [];
      notes = null;
      onRunningChange(true);
      journey.startTesting(active.task.entryScreenId, record);
      message.textContent =
        "Попытка начата. Переходы записываются; содержимое полей не записывается.";
    } catch (error) {
      if (error.code && error.code !== "transport") {
        starting = null;
        onRunningChange(false);
      }
      throw error;
    }
  }
  async function finish(outcome) {
    if (!finishing) {
      const checks = {};
      for (const [id, control] of checkInputs) checks[id] = control.value;
      finishing = {
        trialId: active.trialId,
        idempotencyKey: studioId("finish"),
        events: structuredClone(events),
        durationMs: Math.max(0, Math.round(now() - started)),
        outcome,
        notes: notes?.value || "",
        checks,
      };
    }
    let result;
    try {
      result = await client.finishTrial(finishing);
    } catch (error) {
      // These acknowledged domain errors cannot be recovered by replaying the frozen request.
      // Transport/unknown server errors remain ambiguous and retain the exact retry payload.
      if (
        [
          "studio_expired",
          "invalid_studio",
          "studio_idempotency_conflict",
        ].includes(error.code)
      )
        terminalFailure = error.code;
      throw error;
    }
    if (disposed) return;
    active = null;
    finishing = null;
    journey.stopTesting();
    onRunningChange(false);
    message.textContent = `Попытка сохранена. Критерии пути: ${result.result.pathCriteriaMet ? "достигнуты" : "не достигнуты"}. Проверка формы: ${result.result.formChecks.gate}.`;
  }
  /** Close only local trial state after a definitive failure, without claiming that a result was retained. */
  function leaveFailedTrial() {
    const expired = terminalFailure === "studio_expired";
    active = finishing = terminalFailure = null;
    events = [];
    checkInputs = [];
    notes = null;
    journey.stopTesting();
    onRunningChange(false);
    message.textContent = expired
      ? "Попытка истекла и закрыта. Её результат не сохранён; можно начать новую задачу."
      : "Локальная попытка закрыта. Сохранение не подтверждено; проверьте результаты доски.";
  }
  function participant(container) {
    container.append(
      h("h3", {}, active.task.title),
      h("p", {}, active.task.instruction),
      h(
        "p",
        {},
        "Прохождение прототипа проверяет маршрут. Выполнение бизнес-операции и доступность требуют отдельной проверки.",
      ),
    );
    const details = h(
      "details",
      {},
      h("summary", {}, "Наблюдения по форме (вручную)"),
    );
    // Preserve unsent observations across busy renders without reading any embedded form.
    const previous = new Map(
      checkInputs.map(([id, control]) => [id, control.value]),
    );
    checkInputs = [];
    for (const requirement of active.requirements.checks) {
      const field = select(
        requirement.title,
        [
          ["unknown", "Не проверено"],
          ["pass", "Проверено"],
          ["fail", "Есть проблема"],
        ],
        previous.get(requirement.id) || "unknown",
      );
      field.control.disabled = busy || !!finishing;
      checkInputs.push([requirement.id, field.control]);
      details.append(field.element, h("small", {}, requirement.method));
    }
    const oldNotes = notes?.value || "";
    const comment = input(
      "Наблюдения (не вводите персональные данные или значения полей)",
      true,
    );
    comment.control.required = false;
    comment.control.value = oldNotes;
    comment.control.disabled = busy || !!finishing;
    notes = comment.control;
    details.append(comment.element);
    container.append(details);
    if (terminalFailure)
      container.append(button("Выйти из попытки", leaveFailedTrial));
    else if (finishing)
      container.append(
        button("Повторить сохранение попытки", () => finish(finishing.outcome)),
      );
    else
      for (const [value, label] of [
        ["completed", "Цель выполнена"],
        ["assisted", "Выполнена с помощью"],
        ["failed", "Не получилось"],
        ["abandoned", "Прервать попытку"],
      ])
        container.append(button(label, () => finish(value), "quiet"));
  }
  function render() {
    if (disposed) return;
    renderAbort.abort();
    renderAbort = new AbortController();
    const body = h("div", {});
    root.replaceChildren(h("h3", {}, "Проверка пути"), message, body);
    if (!state) {
      body.append(h("p", {}, "Откройте доску и добавьте экраны."));
      return;
    }
    if (!client.startTrial) {
      root.hidden = true;
      return;
    }
    root.hidden = false;
    if (active) {
      participant(body);
      return;
    }
    if (!starting) planEditor(body);
    const tasks = state.document.testPlan?.tasks || [];
    if (!tasks.length)
      body.append(
        h(
          "p",
          {},
          "Добавьте задачу и целевой экран. Наблюдения хранятся временно, без значений полей.",
        ),
      );
    else {
      const task = select(
        "Задача для прохождения",
        tasks.map((item) => [item.id, item.title]),
        starting?.taskId || tasks[0].id,
      );
      task.control.disabled = busy || !!starting;
      body.append(
        task.element,
        button(starting ? "Повторить начало попытки" : "Начать попытку", () =>
          start(task.control.value),
        ),
      );
    }
    body.append(
      button("Обновить результаты этой ревизии", showReport, "quiet"),
    );
  }
  async function showReport() {
    const epoch = ++reportEpoch;
    const result = await client.trialReport({ documentId: state.documentId });
    if (disposed || epoch !== reportEpoch) return;
    const summary = result.summary;
    message.textContent = `Завершено: ${summary.finished}. Критерии маршрута: ${summary.successful}. С помощью: ${summary.assisted}. Прервано: ${summary.abandoned}. Форма: проблем ${summary.formObservations?.fail || 0}, не проверено ${summary.formObservations?.unknown || 0}. Это наблюдения прототипа, не конверсия продукта.`;
  }
  return {
    element: root,
    update(value) {
      if (!active && !starting) {
        state = value;
        reportEpoch++;
        render();
      }
    },
    dispose() {
      disposed = true;
      reportEpoch++;
      abort.abort();
      renderAbort.abort();
      journey.stopTesting();
      root.replaceChildren();
    },
  };
}

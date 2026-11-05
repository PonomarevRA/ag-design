import {createGoldenCanonGrid} from "./vendor/ag-design/golden-canon-grid.js";
import {
  createButton,
  createField,
  createI18n,
  createLanguageSwitcher,
} from "./vendor/ag-design/index.js";
import { h } from "./dom.js";
let sequence = 0;

/** Language-owned labels for synthetic examples; customer data is never translated or inserted here. */
function figureText(locale) {
  return locale === "ru"
    ? {
        example: "Учебный пример",
        before: "До изменения",
        after: "После изменения",
        read: "Что заметить",
        name: "Название отчёта",
        period: "Период",
        hint: "Понятная подпись остаётся рядом с полем",
        value: "Отчёт за квартал",
        periodValue: "Апрель-июнь",
        refresh: "Обновить",
        chosen: "Выбрано",
        cycle: "Показать следующее состояние",
        states: [
          "Ожидаем ответ",
          "Результат готов",
          "Не удалось загрузить. Можно повторить.",
        ],
        sampleData: "Условные данные для объяснения приёма",
        requests: "Обращения, шт.",
        conversion: "Конверсия, %",
        conversionContext:
          "Условные периоды А и Б: по 1000 посетителей, 40 и 50 регистраций.",
        months: ["Апрель", "Май", "Июнь"],
        previous: "Было",
        current: "Стало",
        values: "Точные значения",
        unit: "Значение",
        delta: "+1 п.п.; +25% относительно базы. Причина роста не установлена.",
        claim: "Обращений стало больше",
        slide: "Схема слайда",
        plan: "План",
        fact: "Факт",
        difference: "Разница",
        local: "Язык меняется только внутри примера",
        recovery: "Нужно исправить: вернуться к данным",
        try: "Попробуйте кнопки",
        typeBody:
          "Понятная строка помогает читать мысль целиком и переходить к следующей.",
        typeCaption: "Подпись уточняет контекст, не споря с основным текстом.",
        step: "Связанные действия",
      }
    : {
        example: "Teaching example",
        before: "Before",
        after: "After",
        read: "What to notice",
        name: "Report name",
        period: "Period",
        hint: "The visible label stays with its field",
        value: "Quarterly report",
        periodValue: "April to June",
        refresh: "Refresh",
        chosen: "Selected",
        cycle: "Show the next state",
        states: [
          "Waiting for a response",
          "Results are ready",
          "Unable to load. You can retry.",
        ],
        sampleData: "Illustrative data used to explain the technique",
        requests: "Requests, count",
        conversion: "Conversion, %",
        conversionContext:
          "Illustrative periods A and B: 1000 visitors each, with 40 and 50 registrations.",
        months: ["April", "May", "June"],
        previous: "Before",
        current: "After",
        values: "Exact values",
        unit: "Value",
        delta:
          "+1 percentage point; +25% relative to baseline. The cause is not established.",
        claim: "The number of requests increased",
        slide: "Slide schematic",
        plan: "Plan",
        fact: "Actual",
        difference: "Difference",
        local: "Language changes only inside this example",
        recovery: "Correction needed: return to the details",
        try: "Try the buttons",
        typeBody:
          "A readable line helps people follow a complete thought and move to the next one.",
        typeCaption:
          "A caption adds context without competing with the main text.",
        step: "Related actions",
      };
}

/** A labelled relationship diagram; arrows carry order, while all essential meaning remains literal text. */
function flow(labels, document, { branch, recovery } = {}) {
  const element = document.createElement("div");
  element.className = "lesson-flow";
  labels.forEach((label, index) => {
    const node = h(
      "div",
      { className: "lesson-flow__node" },
      h("span", {}, label),
    );
    if (index < labels.length - 1)
      node.append(
        h(
          "span",
          { className: "lesson-flow__arrow", "aria-hidden": "true" },
          "→",
        ),
      );
    element.append(node);
  });
  if (branch)
    element.append(h("p", { className: "lesson-flow__branch" }, recovery));
  return element;
}

/** Real readonly AG fields illustrate label/group relationships without capturing any user data. */
function fields(document, t, suffix) {
  const element = h("div", { className: "lesson-fields" });
  for (const [key, label, value] of [
    ["name", t.name, t.value],
    ["period", t.period, t.periodValue],
  ]) {
    const field = createField({
      document,
      id: `book-example-${++sequence}-${suffix}-${key}`,
      label,
      hint: key === "name" ? t.hint : "",
      readOnly: true,
      density: "comfortable",
    });
    field.querySelector("input").value = value;
    element.append(field);
  }
  return element;
}

/** Draw an exact zero-based sample comparison; bars, written values and table share one numeric snapshot. */
function dataChart(document, t, conversion = false) {
  const labels = conversion ? [t.previous, t.current] : t.months,
    values = conversion ? [4, 5] : [18, 26, 34],
    maximum = conversion ? 5 : 40,
    element = h("div", { className: "lesson-chart" }),
    bars = h("div", {
      className: "lesson-chart__bars",
      role: "img",
      "aria-label": `${conversion ? t.conversion : t.requests}: ${labels.map((label, i) => `${label} ${values[i]}`).join(", ")}`,
    });
  element.append(
    h("p", { className: "lesson-data-note" }, t.sampleData),
    h("h4", {}, conversion ? t.conversion : t.requests),
    conversion
      ? h("p", { className: "lesson-data-note" }, t.conversionContext)
      : null,
  );
  labels.forEach((label, i) => {
    const track = h("div", { className: "lesson-chart__track" }),
      bar = h("span", { className: "lesson-chart__bar" });
    bar.style.width = `${(values[i] / maximum) * 100}%`;
    track.append(bar);
    bars.append(
      h(
        "div",
        { className: "lesson-chart__row" },
        h("span", {}, label),
        track,
        h("strong", {}, String(values[i])),
      ),
    );
  });
  bars.append(
    h(
      "div",
      { className: "lesson-chart__axis", "aria-hidden": "true" },
      h("span", {}, "0"),
      h("span", {}, String(maximum)),
    ),
  );
  const table = h("table", { className: "lesson-values" });
  const head = h(
    "tr",
    {},
    h("th", { scope: "col" }, t.period),
    h("th", { scope: "col" }, t.unit),
  );
  const body = h("tbody");
  for (let i = 0; i < labels.length; i++)
    body.append(
      h(
        "tr",
        {},
        h("th", { scope: "row" }, labels[i]),
        h("td", {}, String(values[i])),
      ),
    );
  table.append(
    h("caption", {}, `${t.values}: ${conversion ? t.conversion : t.requests}`),
    h("thead", {}, head),
    body,
  );
  const disclosure = h("details", {}, h("summary", {}, t.values), table);
  element.append(
    bars,
    conversion ? h("p", { className: "lesson-chart__meaning" }, t.delta) : null,
    disclosure,
  );
  return element;
}

/** A small actual table demonstrates value lookup and explicit differences; color never replaces the number. */
function workbook(document, t, labels) {
  const element = h("div", { className: "lesson-workbook" }),
    table = h(
      "table",
      { className: "lesson-values" },
      h("caption", {}, `${t.sampleData}: ${t.requests}`),
      h(
        "thead",
        {},
        h(
          "tr",
          {},
          [t.period, t.plan, t.fact, t.difference].map((x) =>
            h("th", { scope: "col" }, x),
          ),
        ),
      ),
    );
  const body = h("tbody");
  [
    [20, 18],
    [24, 26],
    [32, 34],
  ].forEach(([plan, fact], i) => {
    const value = h(
      "td",
      { className: "lesson-workbook__value" },
      String(fact),
    );
    value.style.setProperty("--lesson-intensity", `${10 + fact / 4}%`);
    body.append(
      h(
        "tr",
        {},
        h("th", { scope: "row" }, t.months[i]),
        h("td", {}, String(plan)),
        value,
        h("td", {}, `${fact - plan > 0 ? "+" : ""}${fact - plan}`),
      ),
    );
  });
  table.append(body);
  element.append(table, flow(labels, document));
  return element;
}

/** Render local figures only. Each example owns its listeners and isolated locale context until disposal. */
export function createLessonFigure({
  document = globalThis.document,
  lesson,
  locale = "ru",
  sectionId = "",
}) {
  const t = figureText(locale),
    labels = lesson.figure.labels,
    kind = lesson.figure.kind,
    element = h("figure", { className: `book-figure book-figure--${kind}` }),
    canvas = h("div", { className: "book-figure__canvas" }),
    disposers = [];
  const status = h("p", { className: "lesson-example-status", role: "status" });
  /** Attach a sample action with explicit cleanup; no route, preference or external operation is invoked. */
  function sampleButton(label, variant = "secondary", options = {}) {
    const click = () => {
      status.textContent = `${t.chosen}: ${label}`;
    };
    const button = createButton({
      document,
      label,
      variant,
      density: "comfortable",
      ...options,
      onClick: click,
    });
    disposers.push(() => button.removeEventListener("click", click));
    return button;
  }
  if (kind === "golden-grid") {
    const grid=createGoldenCanonGrid({document,width:960,height:540,anchors:[{id:"aligned",x:320,y:180},{id:"offset",x:675,y:390}]});
    const holder=h("div",{className:"lesson-golden-grid"});
    holder.style.cssText="width:100%;aspect-ratio:16/9;min-height:180px";
    holder.append(grid.element);canvas.append(holder,h("p",{},labels.join(" · ")));
    disposers.push(grid.dispose);
  } else if (kind === "data")
    canvas.append(dataChart(document, t, sectionId === "data-explanation"));
  else if (kind === "slide") {
    const slide = h(
      "section",
      { className: "lesson-slide", "aria-label": t.slide },
      h("p", { className: "lesson-data-note" }, t.slide),
      h("h4", {}, t.claim),
      dataChart(document, t),
    );
    canvas.append(slide);
  } else if (kind === "workbook") canvas.append(workbook(document, t, labels));
  else if (kind === "form") canvas.append(fields(document, t, "form"));
  else if (kind === "spacing") {
    canvas.classList.add("lesson-spacing");
    const before = fields(document, t, "before"),
      after = fields(document, t, "after");
    before.classList.add("lesson-fields--tight");
    canvas.append(
      h("section", {}, h("h4", {}, t.before), before),
      h("section", {}, h("h4", {}, t.after), after),
    );
  } else if (kind === "typography") {
    canvas.append(
      h(
        "div",
        { className: "lesson-type" },
        h("p", { className: "lesson-type__heading" }, labels[0]),
        h("p", { className: "lesson-type__body" }, t.typeBody),
        h("p", { className: "lesson-type__caption" }, t.typeCaption),
      ),
    );
  } else if (kind === "color") {
    const swatches = h("div", { className: "lesson-swatches" });
    labels.forEach((label, i) => {
      const swatch = h("span", {
        className: "lesson-swatch__sample",
        "aria-hidden": "true",
      });
      swatch.style.background = [
        "var(--text)",
        "var(--panel)",
        "var(--accent)",
      ][i % 3];
      swatches.append(
        h(
          "div",
          { className: "lesson-swatch" },
          swatch,
          h("strong", {}, label),
        ),
      );
    });
    canvas.append(swatches);
  } else if (kind === "actions") {
    const row = h("div", { className: "lesson-actions" });
    if (sectionId === "icons")
      row.append(
        sampleButton(t.refresh, "secondary", {
          icon: "refresh",
          iconOnly: true,
        }),
        ...labels.slice(1).map((label) => sampleButton(label)),
      );
    else
      labels.forEach((label, i) =>
        row.append(
          sampleButton(
            label,
            i === 0
              ? "primary"
              : i === 2 && sectionId === "actions"
                ? "danger"
                : "secondary",
          ),
        ),
      );
    canvas.append(
      h("p", { className: "lesson-data-note" }, t.try),
      row,
      status,
    );
  } else if (kind === "states") {
    let current = 0;
    status.textContent = t.states[0];
    const button = createButton({
      document,
      label: t.cycle,
      density: "comfortable",
    });
    const click = () => {
      current = (current + 1) % t.states.length;
      status.textContent = t.states[current];
    };
    button.addEventListener("click", click);
    disposers.push(() => button.removeEventListener("click", click));
    canvas.append(flow(labels, document), status, button);
  } else if (kind === "languages") {
    const context = createI18n({
        locale,
        availableLocales: ["ru", "en"],
        fallbackLocale: "en",
      }),
      compact = createLanguageSwitcher({ document, i18n: context }),
      inline = createLanguageSwitcher({
        document,
        i18n: context,
        variant: "inline",
      });
    canvas.classList.add("lesson-languages");
    canvas.append(
      compact.element,
      inline.element,
      h("p", { className: "lesson-data-note" }, t.local),
    );
    disposers.push(() => {
      compact.dispose();
      inline.dispose();
      context.dispose();
    });
  } else if (kind === "structure") {
    const regions = h("div", { className: "lesson-regions" });
    labels.forEach((label, i) =>
      regions.append(
        h("div", { className: `lesson-region lesson-region--${i}` }, label),
      ),
    );
    canvas.append(regions);
  } else
    canvas.append(
      flow(labels, document, {
        branch: kind === "journey",
        recovery: t.recovery,
      }),
    );
  const comparison = h(
    "div",
    { className: "book-example-comparison" },
    h("section", {}, h("h4", {}, t.before), h("p", {}, lesson.before)),
    h("section", {}, h("h4", {}, t.after), h("p", {}, lesson.after)),
  );
  element.append(
    h("div", { className: "book-figure__label" }, t.example),
    canvas,
    h("figcaption", {}, comparison),
  );
  let disposed = false;
  return {
    element,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const dispose of disposers) dispose();
      disposers.length = 0;
    },
  };
}

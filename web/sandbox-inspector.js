import { h } from "./dom.js";
import { createButton } from "./vendor/ag-design/index.js";
import { componentFields, checkedProps } from "./sandbox-components.js";

/** Describe one selected instance. Changes go through validated commands, never through DOM text replacement. */
export function renderSandboxInspector(
  host,
  item,
  {
    patch,
    remove,
    duplicate,
    notice,
    description,
    finishEdit = () => {},
    fit = () => {},
  },
) {
  if (!item) {
    host.replaceChildren(
      h("h2", { tabindex: -1 }, "Параметры"),
      h(
        "p",
        { className: "muted" },
        "Добавьте компонент или выберите его на сетке.",
      ),
    );
    return;
  }
  const form = h("form", {
    className: "sandbox-form",
    "aria-label": "Параметры компонента",
  });
  form.addEventListener("submit", (event) => event.preventDefault());
  /** Native validity prevents partial numeric edits from corrupting the document. */
  function field(spec, value, change) {
    const input = spec.options
      ? h(
          "select",
          {},
          spec.options.map((option) =>
            h("option", { value: option }, spec.labels?.[option] || option),
          ),
        )
      : h(spec.type === "text" ? "textarea" : "input", {
          type: spec.type === "number" ? "number" : undefined,
          min: spec.min,
          max: spec.max,
          step: spec.step || 1,
          maxlength: spec.maxlength || 4096,
          rows: spec.type === "text" ? 2 : undefined,
        });
    input.value = String(value);
    let committed = input.value;
    input.setAttribute("aria-label", spec.label);
    const apply = (live = false) => {
      if (!input.checkValidity()) {
        input.reportValidity();
        return;
      }
      try {
        change(
          spec.type === "number" ? Number(input.value) : input.value,
          live ? spec.label : undefined,
        );
        committed = input.value;
      } catch (error) {
        input.value = committed;
        notice(error.message);
      }
    };
    if (spec.type === "text")
      input.addEventListener("input", () => apply(true));
    input.addEventListener("change", () => {
      apply(spec.type === "text");
      finishEdit();
    });
    input.addEventListener("blur", finishEdit);
    form.append(h("label", {}, h("span", {}, spec.label), input));
  }
  field(
    { label: "Подпись в редакторе", type: "text", maxlength: 180 },
    item.title,
    (value, key) => patch({ title: value }, key),
  );
  const props = checkedProps(item.component, item.props);
  const schema = componentFields(item.component);
  for (const spec of schema)
    field(spec, props[spec.key], (value, key) => {
      props[spec.key] = value;
      patch({ props: { ...props } }, key);
    });
  if (!schema.length)
    form.append(
      h(
        "p",
        { className: "muted" },
        "Содержимое этого примера фиксировано. Можно изменить подпись, размер и положение.",
      ),
    );
  form.append(h("h3", {}, "Положение на сетке"));
  for (const [key, label, min, max] of [
    ["x", "Колонка", 1, 12],
    ["y", "Строка", 1, 301],
    ["w", "Ширина, колонок", 1, 12],
    ["h", "Высота, строк", 2, 40],
  ]) {
    field(
      { label, type: "number", min, max },
      item[key] + (key === "x" || key === "y" ? 1 : 0),
      (value) => {
        if (!Number.isInteger(value))
          throw new TypeError("Введите целое число");
        patch({ [key]: value - (key === "x" || key === "y" ? 1 : 0) });
      },
    );
  }
  host.replaceChildren(
    h("h2", { tabindex: -1 }, item.title),
    description ? h("p", { className: "muted" }, description) : null,
    form,
    h(
      "div",
      { className: "sandbox-inspector-actions" },
      createButton({ label: "По содержимому", variant: "quiet", onClick: fit }),
      createButton({
        label: "Дублировать",
        variant: "quiet",
        onClick: duplicate,
      }),
      createButton({ label: "Удалить", variant: "quiet", onClick: remove }),
    ),
  );
}

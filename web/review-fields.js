import { h } from "./dom.js";

/**
 * Build one labelled evidence group; unknown and absent measurements never imply a pass.
 * @param {string} title - Human criterion used by visible group legend and complete accessible names.
 * @param {object} [metric] - Optional measured name/unit/maximum from the current server policy.
 * @returns {object} Retained native controls plus their semantic group for bounded serialization.
 */
export function evidenceRow(title, metric) {
  const select = h("select", { "aria-label": `Результат: ${title}` });
  for (const [value, label] of [
    ["unknown", "Не проверено"],
    ["pass", "Пройдено"],
    ["fail", "Не пройдено"],
    ["not-applicable", "Не применимо"],
  ]) {
    select.append(h("option", { value }, label));
  }
  const evidence = h("textarea", {
    rows: "3",
    maxlength: "4096",
    "aria-label": `Свидетельство: ${title}`,
  });
  const reason = h("input", {
    type: "text",
    maxlength: "2048",
    "aria-label": `Причина исключения: ${title}`,
    hidden: true,
  });
  const field = (label, control) =>
    h(
      "label",
      { className: "ag-field review-field" },
      h("span", { className: "ag-field__label" }, label),
      control,
    );
  const reasonField = field("Почему критерий не применим", reason);
  reasonField.hidden = true;
  const measurement = metric
    ? h("input", {
        type: "number",
        min: "0",
        step: "any",
        "aria-label": `${metric.name}, ${metric.unit}`,
      })
    : null;
  const measurementField = measurement
    ? field(
        `${metric.name}, ${metric.unit} · максимум ${metric.maximum}`,
        measurement,
      )
    : null;
  const element = h(
    "fieldset",
    { className: "review-check" },
    h("legend", {}, title),
    h(
      "div",
      { className: "review-check__fields" },
      field("Результат", select),
      field("Свидетельство проверки", evidence),
      reasonField,
      ...(measurementField ? [measurementField] : []),
    ),
  );
  select.addEventListener("change", () => {
    const excluded = select.value === "not-applicable";
    reason.hidden = reasonField.hidden = !excluded;
    reason.required = excluded;
    evidence.required = ["pass", "fail"].includes(select.value);
    if (measurement) measurement.required = select.value === "pass";
  });
  return { element, select, evidence, reason, measurement, metric };
}

/**
 * Serialize one actual row snapshot without creating values for omitted evidence or measurements.
 * @param {object} row - Native controls returned by evidenceRow.
 * @param {object} identity - The server checkId or ruleId belonging to this exact row.
 * @returns {object} Declarative observation for the existing immutable evaluation endpoint.
 */
export function observation(row, identity) {
  const value = {
    ...identity,
    status: row.select.value,
    evidence: row.evidence.value,
  };
  if (value.status === "not-applicable") value.reason = row.reason.value;
  if (row.measurement && row.measurement.value !== "")
    value.measurement = {
      value: row.measurement.valueAsNumber,
      unit: row.metric.unit,
    };
  return value;
}

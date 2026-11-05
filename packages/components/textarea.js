import { applyControlGeometry } from "./geometry.js";
import { attachFieldCounter, validateMaxLength } from "./field-counter.js";

/**
 * Create a native multiline field with caller-owned text, identity and validation.
 * Returns the same labelled wrapper shape as createField; use its textarea for native
 * value/selection/form APIs. A supplied maxLength adds remaining-count feedback;
 * dispose its subscriptions on removal and call sync after programmatic value changes.
 */
export function createTextarea({
  document = globalThis.document,
  id,
  label,
  name = id,
  value = "",
  placeholder = "",
  hint = "",
  error = "",
  rows = 3,
  maxLength,
  i18n,
  density = "compact",
  readOnly = false,
  disabled = false,
  required = false,
  resize = "vertical",
} = {}) {
  for (const [key, text] of Object.entries({
    id,
    label,
    name,
    value,
    placeholder,
    hint,
    error,
  })) {
    if (
      typeof text !== "string" ||
      (["id", "label", "name"].includes(key) && !text.trim())
    )
      throw new TypeError(`Textarea ${key} must be literal text`);
  }
  if (!Number.isInteger(rows) || rows < 1 || rows > 50)
    throw new TypeError("Textarea rows must be an integer from1 through50");
  validateMaxLength(maxLength);
  if (!["vertical", "none"].includes(resize))
    throw new TypeError("Unknown textarea resize mode");
  for (const flag of [readOnly, disabled, required])
    if (typeof flag !== "boolean")
      throw new TypeError("Textarea states must be boolean");

  const element = document.createElement("label"),
    caption = document.createElement("span"),
    control = document.createElement("textarea");
  element.className = "ag-field ag-textarea";
  element.htmlFor = id;
  caption.className = "ag-field__label";
  caption.id = `${id}-label`;
  caption.textContent = label;
  control.className = "ag-textarea__control";
  control.id = id;
  control.name = name;
  control.value = value;
  control.defaultValue = value;
  control.placeholder = placeholder;
  control.rows = rows;
  control.readOnly = readOnly;
  control.disabled = disabled;
  control.required = required;
  control.dataset.resize = resize;
  if (maxLength !== undefined) control.maxLength = maxLength;
  control.setAttribute("aria-labelledby", caption.id);
  applyControlGeometry(control, { density });
  element.append(caption, control);

  const descriptions = [];
  for (const [kind, text] of [
    ["hint", hint],
    ["error", error],
  ]) {
    if (!text) continue;
    const description = document.createElement("span");
    description.className = `ag-field__${kind}`;
    description.id = `${id}-${kind}`;
    description.textContent = text;
    descriptions.push(description.id);
    element.append(description);
  }
  if (descriptions.length)
    control.setAttribute("aria-describedby", descriptions.join(" "));
  if (error) control.setAttribute("aria-invalid", "true");
  return attachFieldCounter(element, control, { i18n });
}

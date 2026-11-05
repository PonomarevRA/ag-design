import { applyControlGeometry } from "./geometry.js";
let sequence = 0;

/** Choose a bounded literal option with a native select; the host owns data and programmatic updates are silent. */
export function createSelect({
  document = globalThis.document,
  label,
  options,
  value,
  placeholder,
  hint = "",
  error = "",
  disabled = false,
  required = false,
  density = "compact",
  onChange,
} = {}) {
  const text = (item, maximum) =>
    typeof item === "string" && item.length <= maximum;
  if (
    !text(label, 180) ||
    !label.trim() ||
    !Array.isArray(options) ||
    options.length > 500 ||
    !text(hint, 2048) ||
    !text(error, 2048) ||
    (placeholder !== undefined && !text(placeholder, 180)) ||
    typeof disabled !== "boolean" ||
    typeof required !== "boolean" ||
    (onChange !== undefined && typeof onChange !== "function")
  )
    throw new TypeError("A labelled bounded native select is required");
  const known = new Map();
  for (const item of options) {
    if (
      !item ||
      !text(item.value, 80) ||
      !item.value ||
      known.has(item.value) ||
      !text(item.label, 180) ||
      !item.label.trim() ||
      (item.disabled !== undefined && typeof item.disabled !== "boolean") ||
      (item.group !== undefined &&
        (!text(item.group, 180) || !item.group.trim()))
    )
      throw new TypeError("Options need distinct values and literal labels");
    known.set(item.value, { ...item });
  }
  let current =
    value === undefined
      ? placeholder !== undefined
        ? ""
        : (options.find((item) => !item.disabled)?.value ?? "")
      : value;
  function valid(next) {
    return (
      typeof next === "string" &&
      ((next === "" && placeholder !== undefined) ||
        (known.has(next) && !known.get(next).disabled))
    );
  }
  if (!valid(current))
    throw new TypeError(
      "Select an enabled known option or explicit placeholder",
    );
  const element = document.createElement("div"),
    title = document.createElement("label"),
    select = document.createElement("select"),
    hintElement = document.createElement("span"),
    errorElement = document.createElement("span");
  element.className = "ag-select";
  select.className = "ag-select__control";
  select.id = `ag-select-${++sequence}`;
  title.htmlFor = select.id;
  title.textContent = label;
  hintElement.id = `${select.id}-hint`;
  hintElement.className = "ag-select__hint";
  hintElement.textContent = hint;
  errorElement.id = `${select.id}-error`;
  errorElement.className = "ag-select__error";
  errorElement.setAttribute("aria-live", "polite");
  if (placeholder !== undefined) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = placeholder;
    select.append(option);
  }
  let group = null,
    groupName = null;
  for (const item of options) {
    if (item.group !== groupName) {
      groupName = item.group;
      group = item.group ? document.createElement("optgroup") : null;
      if (group) {
        group.label = item.group;
        select.append(group);
      }
    }
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    option.disabled = !!item.disabled;
    (group || select).append(option);
  }
  for (const option of select.options)
    option.defaultSelected = option.value === current;
  select.value = current;
  select.disabled = disabled;
  select.required = required;
  const restoreGeometry = applyControlGeometry(select, { density });
  let disposed = false;
  /** Keep visible error and described-by references coherent, without submitting or focusing the field. */
  function setError(next) {
    if (disposed) return;
    if (!text(next, 2048))
      throw new TypeError("Error must be bounded literal text");
    errorElement.textContent = next;
    errorElement.hidden = !next;
    hintElement.hidden = !hint;
    select.setAttribute("aria-invalid", String(!!next));
    const references = [];
    if (hint) references.push(hintElement.id);
    if (next) references.push(errorElement.id);
    if (references.length)
      select.setAttribute("aria-describedby", references.join(" "));
    else select.removeAttribute("aria-describedby");
  }
  /** Reject disabled/unknown programmatic values while preserving the mounted native control and focus. */
  function setValue(next) {
    if (disposed) return;
    if (!valid(next)) throw new TypeError("Select an enabled known value");
    current = next;
    select.value = next;
  }
  function changed() {
    if (disposed) return;
    if (select.disabled) {
      select.value = current;
      return;
    }
    const next = select.value;
    if (!valid(next)) {
      select.value = current;
      return;
    }
    if (next === current) return;
    current = next;
    onChange?.(next);
  }
  /** Form reset uses native defaults and does not emit a fabricated change action. */
  function reset(event) {
    if (event.target !== select.form) return;
    Promise.resolve().then(() => {
      if (!disposed && !event.defaultPrevented) current = select.value;
    });
  }
  select.addEventListener("change", changed);
  document.addEventListener("reset", reset, true);
  setError(error);
  element.append(title, select, hintElement, errorElement);
  return {
    element,
    select,
    setValue,
    setError,
    setDisabled(next) {
      if (typeof next !== "boolean")
        throw new TypeError("disabled must be boolean");
      if (!disposed) select.disabled = next;
    },
    get value() {
      return select.value;
    },
    dispose() {
      if (!disposed) {
        disposed = true;
        select.removeEventListener("change", changed);
        document.removeEventListener("reset", reset, true);
        onChange = undefined;
        restoreGeometry();
      }
    },
  };
}

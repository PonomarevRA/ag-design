let sequence = 0;

/** Choose one of 2–6 local values with native radio semantics; this is not route navigation or a tabs widget. */
export function createSegmentedChoice({
  document = globalThis.document,
  label,
  options,
  value,
  onChange,
  disabled = false,
} = {}) {
  if (
    typeof label !== "string" ||
    !label.trim() ||
    !Array.isArray(options) ||
    options.length < 2 ||
    options.length > 6
  )
    throw new TypeError("A label and 2–6 choices are required");
  const known = new Set();
  for (const option of options) {
    if (
      !option ||
      typeof option.value !== "string" ||
      !option.value ||
      option.value.length > 80 ||
      known.has(option.value) ||
      typeof option.label !== "string" ||
      !option.label.trim()
    )
      throw new TypeError("Choices require distinct bounded values and labels");
    known.add(option.value);
  }
  if (
    !known.has(value) ||
    options.find((option) => option.value === value).disabled
  )
    throw new TypeError("An enabled known initial value is required");
  const element = document.createElement("fieldset"),
    legend = document.createElement("legend"),
    group = document.createElement("span");
  element.className = "ag-segmented-choice";
  element.disabled = Boolean(disabled);
  // Preserve the name people see and agents/voice controls address; layout wraps it.
  legend.textContent = label;
  group.className = "ag-segmented-choice__group";
  const name = `ag-segmented-${++sequence}`,
    inputs = new Map();
  for (const option of options) {
    const item = document.createElement("label"),
      input = document.createElement("input"),
      text = document.createElement("span");
    item.className = "ag-segmented-choice__option";
    input.type = "radio";
    input.name = name;
    input.value = option.value;
    input.disabled = Boolean(option.disabled);
    input.checked = option.value === value;
    text.textContent = option.label;
    item.append(input, text);
    group.append(item);
    inputs.set(option.value, input);
  }
  element.append(legend, group);
  let current = value,
    disposed = false;
  /** Native radio keyboard/click behavior owns selection; callbacks never fire for disabled or unchecked entries. */
  function changed(event) {
    const input = inputs.get(event.target.value);
    if (
      disposed ||
      element.disabled ||
      !input ||
      input !== event.target ||
      input.disabled ||
      !input.checked ||
      current === input.value
    )
      return;
    current = input.value;
    onChange?.(current);
  }
  /** Programmatic selection preserves the focused DOM node and never dispatches a user action callback. */
  function setValue(next) {
    if (disposed) return;
    const selected = inputs.get(next);
    if (!selected || selected.disabled)
      throw new TypeError("Select an enabled known value");
    for (const input of inputs.values()) input.checked = input === selected;
    current = next;
  }
  /** Remove the one delegated listener so a stale unmounted control cannot trigger product actions. */
  function dispose() {
    if (!disposed) {
      element.removeEventListener("change", changed);
      disposed = true;
    }
  }
  element.addEventListener("change", changed);
  return {
    element,
    setValue,
    get value() {
      return current;
    },
    dispose,
  };
}

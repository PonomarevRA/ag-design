// packages/components/segmented-choice.js
var sequence = 0;
function createSegmentedChoice({
  document = globalThis.document,
  label,
  options,
  value,
  onChange,
  disabled = false
} = {}) {
  if (typeof label !== "string" || !label.trim() || !Array.isArray(options) || options.length < 2 || options.length > 6)
    throw new TypeError("A label and 2\u20136 choices are required");
  const known = /* @__PURE__ */ new Set();
  for (const option of options) {
    if (!option || typeof option.value !== "string" || !option.value || option.value.length > 80 || known.has(option.value) || typeof option.label !== "string" || !option.label.trim())
      throw new TypeError("Choices require distinct bounded values and labels");
    known.add(option.value);
  }
  if (!known.has(value) || options.find((option) => option.value === value).disabled)
    throw new TypeError("An enabled known initial value is required");
  const element = document.createElement("fieldset"), legend = document.createElement("legend"), group = document.createElement("span");
  element.className = "ag-segmented-choice";
  element.disabled = Boolean(disabled);
  legend.textContent = label;
  group.className = "ag-segmented-choice__group";
  const name = `ag-segmented-${++sequence}`, inputs = /* @__PURE__ */ new Map();
  for (const option of options) {
    const item = document.createElement("label"), input = document.createElement("input"), text = document.createElement("span");
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
  let current = value, disposed = false;
  function changed(event) {
    const input = inputs.get(event.target.value);
    if (disposed || element.disabled || !input || input !== event.target || input.disabled || !input.checked || current === input.value)
      return;
    current = input.value;
    onChange?.(current);
  }
  function setValue(next) {
    if (disposed) return;
    const selected = inputs.get(next);
    if (!selected || selected.disabled)
      throw new TypeError("Select an enabled known value");
    for (const input of inputs.values()) input.checked = input === selected;
    current = next;
  }
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
    dispose
  };
}

// packages/components/choice-chips.js
function createChoiceChips(options = {}) {
  const choice = createSegmentedChoice(options);
  const { element } = choice;
  const group = element.querySelector(".ag-segmented-choice__group");
  element.classList.add("ag-choice-chips");
  let disposed = false;
  const rail = bindChoiceChipRail(group);
  return {
    element,
    setValue(value) {
      choice.setValue(value);
      rail.reveal(group.querySelector("input:checked"));
    },
    get value() {
      return choice.value;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      rail.dispose();
      choice.dispose();
    }
  };
}
function bindChoiceChipRail(group) {
  group.classList.add("ag-choice-chips__rail");
  let disposed = false;
  function reveal(input) {
    if (disposed || !input || !group.isConnected || !group.contains(input))
      return false;
    const rail = group.getBoundingClientRect();
    if (!rail.width) return false;
    const chip = (input.matches('input[type="radio"]') ? input.parentElement : input).getBoundingClientRect();
    const inset = 4;
    let distance = 0;
    if (chip.left < rail.left + inset) distance = chip.left - rail.left - inset;
    else if (chip.right > rail.right - inset)
      distance = chip.right - rail.right + inset;
    if (distance) group.scrollBy({ left: distance, behavior: "auto" });
    return true;
  }
  function focused(event) {
    if (event.target.matches('input[type="radio"],button[aria-pressed]'))
      reveal(event.target);
  }
  group.addEventListener("focusin", focused);
  return {
    reveal,
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeEventListener("focusin", focused);
    }
  };
}

// web/system-styles/style-choice.js
function mountStyleChoice({ document, host, attribute, value, onChange }) {
  const buttons = [...host.querySelectorAll("button")];
  const label = host.getAttribute("aria-label");
  const choice = createChoiceChips({
    document,
    label,
    value,
    options: buttons.map((button) => ({
      value: button.getAttribute(attribute),
      label: button.textContent.trim(),
      disabled: button.disabled
    })),
    onChange
  });
  choice.element.classList.add("style-choice");
  if (host.id) choice.element.id = host.id;
  for (const input of choice.element.querySelectorAll("input"))
    input.setAttribute(attribute, input.value);
  host.replaceWith(choice.element);
  return choice;
}
export {
  mountStyleChoice
};

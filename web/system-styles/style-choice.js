import { createChoiceChips } from "../../packages/components/choice-chips.js";

/**
 * Adapt an existing local value group to shared chips, keeping literal labels and stable host selectors.
 * Routes, panel tabs and commands keep their own controls. The caller owns state and disposal.
 */
export function mountStyleChoice({ document, host, attribute, value, onChange }) {
  const buttons = [...host.querySelectorAll("button")];
  const label = host.getAttribute("aria-label");
  const choice = createChoiceChips({
    document,
    label,
    value,
    options: buttons.map(button => ({
      value: button.getAttribute(attribute),
      label: button.textContent.trim(),
      disabled: button.disabled,
    })),
    onChange,
  });
  choice.element.classList.add("style-choice");
  if (host.id) choice.element.id = host.id;
  for (const input of choice.element.querySelectorAll("input"))
    input.setAttribute(attribute, input.value);
  host.replaceWith(choice.element);
  return choice;
}

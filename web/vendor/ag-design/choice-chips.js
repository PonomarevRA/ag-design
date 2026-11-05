import { createSegmentedChoice } from "./segmented-choice.js";

/**
 * Present 2–6 mutually exclusive values in one horizontally scrollable row.
 * Native radio keys and host callbacks own selection. Only the local rail scrolls.
 */
export function createChoiceChips(options = {}) {
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
    },
  };
}

/**
 * Bind local focus reveal to an existing radio/button rail without changing selection semantics.
 * The host owns labels, item count and callbacks; dispose removes only this binding's listener.
 */
export function bindChoiceChipRail(group) {
  group.classList.add("ag-choice-chips__rail");
  let disposed = false;
  /** Reveal a chip using physical bounds, which also work with RTL scroll coordinates. */
  function reveal(input) {
    if (disposed || !input || !group.isConnected || !group.contains(input))
      return false;
    const rail = group.getBoundingClientRect();
    if (!rail.width) return false;
    const chip = (
      input.matches('input[type="radio"]') ? input.parentElement : input
    ).getBoundingClientRect();
    const inset = 4; // Keep the keyboard outline inside the scroll clip.
    let distance = 0;
    if (chip.left < rail.left + inset) distance = chip.left - rail.left - inset;
    else if (chip.right > rail.right - inset)
      distance = chip.right - rail.right + inset;
    if (distance) group.scrollBy({ left: distance, behavior: "auto" });
    return true;
  }

  /** Focused native choices reveal themselves without scrolling ancestor panels. */
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
    },
  };
}

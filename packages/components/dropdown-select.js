import { applyControlGeometry } from "./geometry.js";
import { dropdownOptions, dropdownSearch, dropdownText, dropdownValue } from "./dropdown-select-model.js";
import { dropdownPositioner } from "./dropdown-select-position.js";

let sequence = 0;

/** Build a single-choice local combobox with native form semantics and an owned searchable popup.
 * Setters/reset are silent. Only committing an enabled user option emits input/change and onChange.
 * The host owns insertion/disposal and may inspect the backing select for FormData/validity.
 */
export function createDropdownSelect({
  document = globalThis.document, label, options, value, placeholder = "Выберите...",
  searchable = true, hint = "", error = "", disabled = false, required = false,
  name = "", density = "compact", searchPlaceholder = "Поиск…", emptyText = "Ничего не найдено", onChange,
} = {}) {
  dropdownText(label, "Label", 180, { nonempty: true });
  dropdownText(placeholder, "Placeholder", 180);
  dropdownText(searchPlaceholder, "Search placeholder", 180);
  dropdownText(emptyText, "Empty text", 180, { nonempty: true });
  dropdownText(hint, "Hint", 2048); dropdownText(error, "Error", 2048);
  dropdownText(name, "Name", 180);
  if ([searchable, disabled, required].some(item => typeof item !== "boolean") ||
      (onChange !== undefined && typeof onChange !== "function"))
    throw new TypeError("Boolean states and an optional change callback are required");
  let model = dropdownOptions(options);
  let current = value === undefined ? "" : value;
  if (!dropdownValue(current, model.known)) throw new TypeError("Select an enabled known value or empty placeholder");
  const initial = current;
  const id = `ag-dropdown-select-${++sequence}`;
  const element = document.createElement("div"), title = document.createElement("label");
  const control = document.createElement("div"), toggle = document.createElement("button");
  const input = document.createElement("input"), select = document.createElement("select");
  const hintElement = document.createElement("span"), errorElement = document.createElement("span");
  const panel = document.createElement("div"), list = document.createElement("div"), empty = document.createElement("p");
  element.className = "ag-dropdown-select";
  title.htmlFor = id; title.textContent = label;
  input.id = id; input.type = "text"; input.className = "ag-dropdown-select__input";
  input.maxLength = 180;
  input.autocomplete = "off"; input.readOnly = !searchable; input.disabled = disabled;
  input.setAttribute("role", "combobox"); input.setAttribute("aria-autocomplete", searchable ? "list" : "none");
  input.setAttribute("aria-haspopup", "listbox"); input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-controls", `${id}-list`); input.setAttribute("aria-required", String(required));
  control.className = "ag-dropdown-select__control";
  toggle.type = "button"; toggle.tabIndex = -1; toggle.className = "ag-dropdown-select__toggle";
  toggle.disabled = disabled; toggle.setAttribute("aria-label", "Открыть варианты");
  toggle.setAttribute("aria-controls", `${id}-list`); toggle.setAttribute("aria-expanded", "false");
  control.append(input, toggle);
  select.className = "ag-dropdown-select__native"; select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true"); select.required = required; select.disabled = disabled; select.name = name;
  hintElement.id = `${id}-hint`; hintElement.className = "ag-dropdown-select__hint"; hintElement.textContent = hint;
  errorElement.id = `${id}-error`; errorElement.className = "ag-dropdown-select__error";
  errorElement.setAttribute("aria-live", "polite");
  panel.className = "ag-dropdown-select__popup"; panel.hidden = true; panel.dataset.agDensity = density;
  list.className = "ag-dropdown-select__list"; list.id = `${id}-list`;
  list.setAttribute("role", "listbox"); list.setAttribute("aria-label", label);
  empty.className = "ag-dropdown-select__empty"; empty.textContent = emptyText; empty.setAttribute("role", "status");
  panel.append(list, empty); element.append(title, control, select, hintElement, errorElement, panel);
  const restoreGeometry = applyControlGeometry(input, { density });
  let opened = false, disposed = false, composing = false, dispatching = false;
  let query = "", active = null, visible = [], manualError = error, validationError = "";
  const position = dropdownPositioner({ document, element, input, panel, onUnavailable: close });

  /** Native fieldset disabling applies to the enhancement as well as its backing select. */
  function isDisabled() { return input.disabled || input.matches(":disabled"); }

  /** Rebuild a detached native option tree, preserving the constructor's reset choice when still enabled. */
  function nativeOptions(nextModel) {
    const fragment = document.createDocumentFragment(), placeholderOption = document.createElement("option");
    placeholderOption.value = ""; placeholderOption.textContent = placeholder;
    const defaultValue = dropdownValue(initial, nextModel.known) ? initial : "";
    placeholderOption.defaultSelected = defaultValue === ""; fragment.append(placeholderOption);
    let previousGroup, group = null;
    for (const item of nextModel.items) {
      if (item.group !== previousGroup) {
        previousGroup = item.group; group = item.group ? document.createElement("optgroup") : null;
        if (group) { group.label = item.group; fragment.append(group); }
      }
      const option = document.createElement("option"); option.value = item.value; option.textContent = item.label;
      option.disabled = item.disabled; option.defaultSelected = item.value === defaultValue;
      (group || fragment).append(option);
    }
    return fragment;
  }

  /** Keep hints and visible errors attached to the visible focus target, not the hidden backing control. */
  function describe() {
    const message = manualError || validationError;
    hintElement.hidden = !hint; errorElement.hidden = !message; errorElement.textContent = message;
    input.setAttribute("aria-invalid", String(!!message));
    const references = [];
    if (hint) references.push(hintElement.id);
    if (message) references.push(errorElement.id);
    if (references.length) input.setAttribute("aria-describedby", references.join(" "));
    else input.removeAttribute("aria-describedby");
  }

  /** Restore the committed label when an edit is cancelled; query text is never itself a selected value. */
  function restoreLabel() {
    input.value = model.known.get(current)?.label || "";
    input.placeholder = placeholder;
  }

  /** Highlight one enabled visible option without moving DOM focus out of the combobox. */
  function highlight(value) {
    active = value;
    let target;
    for (const node of list.querySelectorAll('[role="option"]')) {
      const selected = node.dataset.value === active;
      node.dataset.active = String(selected);
      if (selected) target = node;
    }
    if (target) {
      input.setAttribute("aria-activedescendant", target.id);
      // Reveal only this popup, never the document/containing dialog.
      const popupBounds = panel.getBoundingClientRect(), bounds = target.getBoundingClientRect();
      if (bounds.top < popupBounds.top) panel.scrollTop -= popupBounds.top - bounds.top;
      else if (bounds.bottom > popupBounds.bottom) panel.scrollTop += bounds.bottom - popupBounds.bottom;
    } else input.removeAttribute("aria-activedescendant");
  }

  /** Render bounded literal results, preserving disabled rows and explicit group semantics. */
  function renderOptions() {
    const normalized = dropdownSearch(query.trim());
    visible = [];
    for (const item of model.items) if (!normalized || dropdownSearch(item.label).includes(normalized)) visible.push(item);
    const fragment = document.createDocumentFragment();
    let previousGroup, group = null;
    for (let index = 0; index < visible.length; index++) {
      const item = visible[index];
      if (item.group !== previousGroup) {
        previousGroup = item.group; group = item.group ? document.createElement("div") : null;
        if (group) {
          group.className = "ag-dropdown-select__group"; group.setAttribute("role", "group"); group.setAttribute("aria-label", item.group);
          const header = document.createElement("div"); header.className = "ag-dropdown-select__group-label";
          header.textContent = item.group; header.setAttribute("aria-hidden", "true"); group.append(header); fragment.append(group);
        }
      }
      const option = document.createElement("div"); option.id = `${id}-option-${index}`;
      option.className = "ag-dropdown-select__option"; option.dataset.value = item.value;
      option.setAttribute("role", "option"); option.setAttribute("aria-selected", String(item.value === current));
      option.setAttribute("aria-disabled", String(item.disabled)); option.textContent = item.label;
      (group || fragment).append(option);
    }
    list.replaceChildren(fragment); empty.hidden = visible.length !== 0;
    const enabled = visible.filter(item => !item.disabled);
    let next = active;
    if (!enabled.some(item => item.value === next))
      next = enabled.find(item => item.value === current)?.value ?? enabled[0]?.value ?? null;
    highlight(next); position.schedule();
  }

  /** Close on outside pointer/focus without redirecting focus back from the user's next target. */
  function outside(event) {
    if (!element.contains(event.target) && !panel.contains(event.target)) close();
  }

  /** Attach outside listeners only while the popup is visible. */
  function outsideListeners(method) {
    for (const type of ["pointerdown", "mousedown", "click", "focusin"])
      document[method](type, outside, true);
  }

  /** Open with either an explicit empty query or the current input edit; no value is committed. */
  function show(preserveQuery = false) {
    if (disposed || isDisabled() || !input.isConnected) return false;
    if (!opened) {
      opened = true;
      if (!preserveQuery) query = "";
      if (searchable) { input.value = query; input.placeholder = searchPlaceholder; }
      panel.hidden = false; input.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-expanded", "true"); toggle.setAttribute("aria-label", "Закрыть варианты");
      renderOptions(); outsideListeners("addEventListener"); position.start();
    }
    return opened;
  }

  /** Cancel editing and release all open-only resources; Escape can then bubble when already closed. */
  function close() {
    if (!opened) return false;
    opened = false; outsideListeners("removeEventListener"); position.stop();
    panel.hidden = true; active = null; query = "";
    input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant");
    toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Открыть варианты");
    restoreLabel(); return true;
  }

  /** Publish a validated programmatic selection silently and dismiss any stale search results. */
  function setValue(next) {
    if (disposed) return false;
    if (!dropdownValue(next, model.known)) throw new TypeError("Select an enabled known value or empty placeholder");
    current = next; select.value = next;
    if (select.validity.valid) validationError = "";
    close(); restoreLabel(); describe(); return true;
  }

  /** Commit only real enabled options, with synchronous native events and one user callback. */
  function commit(next) {
    if (disposed || isDisabled() || !next || !dropdownValue(next, model.known)) return;
    const changed = next !== current;
    setValue(next); input.focus({ preventScroll: true });
    if (!changed) return;
    dispatching = true;
    try {
      select.dispatchEvent(new document.defaultView.Event("input", { bubbles: true }));
      if (!disposed) select.dispatchEvent(new document.defaultView.Event("change", { bubbles: true }));
    } finally { dispatching = false; }
    if (!disposed) onChange?.(next);
  }

  /** Search composition is local and noncommitting; IME owns its intermediate keystrokes. */
  function typed() {
    if (disposed || isDisabled() || !searchable || composing) return;
    query = input.value;
    if (opened) renderOptions(); else show(true);
  }

  /** Keep navigation in the visible combobox, skipping disabled results and leaving closed Enter to its form. */
  function keydown(event) {
    if (disposed || isDisabled() || composing || event.isComposing || event.keyCode === 229 ||
        event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Escape") {
      if (opened) { event.preventDefault(); event.stopPropagation(); close(); }
      return;
    }
    if (event.key === "Tab") { close(); return; }
    if (event.key === "Enter") {
      if (opened) { event.preventDefault(); if (active !== null) commit(active); }
      return;
    }
    if (!searchable && event.key === " ") { event.preventDefault(); show(); return; }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    if (!opened && (event.key === "Home" || event.key === "End")) return;
    event.preventDefault();
    const wasOpen = opened;
    if (!show()) return;
    const enabled = visible.filter(item => !item.disabled);
    if (!enabled.length) return;
    let index = enabled.findIndex(item => item.value === active);
    if (event.key === "Home") index = 0;
    else if (event.key === "End") index = enabled.length - 1;
    else if (wasOpen) index = (index + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length;
    else if (current === "") index = event.key === "ArrowUp" ? enabled.length - 1 : 0;
    highlight(enabled[Math.max(0, index)].value);
  }

  /** Prevent mouse focus from leaving the input; touch panning remains a native scroll gesture. */
  function press(event) {
    if (event.pointerType !== "touch" && event.target !== panel && panel.contains(event.target)) event.preventDefault();
  }
  /** Delegate only to owned literal option rows; disabled rows never commit a selection. */
  function clicked(event) {
    const option = event.target.closest?.('[role="option"]');
    if (option && list.contains(option) && option.getAttribute("aria-disabled") !== "true") commit(option.dataset.value);
  }
  /** Honor deliberate native change events while preventing our own emitted event from calling back twice. */
  function nativeChanged() {
    if (disposed || dispatching) return;
    const next = select.value;
    if (select.disabled || !dropdownValue(next, model.known)) { select.value = current; return; }
    const changed = next !== current;
    setValue(next); if (changed) onChange?.(next);
  }
  /** Native reset happens after the reset event; defer synchronization and respect cancelled resets. */
  function reset(event) {
    if (event.target !== select.form) return;
    Promise.resolve().then(() => {
      if (!disposed && !event.defaultPrevented) { validationError = ""; setValue(select.value); }
    });
  }
  /** Suppress the hidden native focus attempt and expose its actual validation message on the combobox. */
  function invalid(event) {
    event.preventDefault();
    if (disposed || select.disabled) return;
    validationError = select.validationMessage || "Выберите значение";
    describe(); input.focus({ preventScroll: true }); show();
  }
  const clickedInput = () => show();
  const pressedToggle = event => event.preventDefault();
  const clickedToggle = () => { if (!disposed && !isDisabled()) { input.focus({ preventScroll: true }); if (opened) close(); else show(); } };
  const compositionStart = () => { composing = true; };
  const compositionEnd = () => { composing = false; typed(); };
  input.addEventListener("click", clickedInput); input.addEventListener("input", typed); input.addEventListener("keydown", keydown);
  input.addEventListener("compositionstart", compositionStart); input.addEventListener("compositionend", compositionEnd);
  toggle.addEventListener("mousedown", pressedToggle); toggle.addEventListener("click", clickedToggle);
  panel.addEventListener("pointerdown", press); panel.addEventListener("mousedown", press); panel.addEventListener("click", clicked);
  select.addEventListener("change", nativeChanged); select.addEventListener("invalid", invalid);
  document.addEventListener("reset", reset, true);
  select.append(nativeOptions(model)); select.value = current; restoreLabel(); describe();
  return {
    element, input, select, open: () => show(), close, setValue,
    /** Validate a complete replacement first; preserve an enabled selection or return to the empty placeholder. */
    setOptions(nextOptions, nextValue) {
      if (disposed) return false;
      const nextModel = dropdownOptions(nextOptions);
      const next = nextValue === undefined ? (dropdownValue(current, nextModel.known) ? current : "") : nextValue;
      if (!dropdownValue(next, nextModel.known)) throw new TypeError("Select an enabled replacement value or empty placeholder");
      const fragment = nativeOptions(nextModel);
      close(); model = nextModel; select.replaceChildren(fragment); return setValue(next);
    },
    setDisabled(next) {
      if (disposed) return false;
      if (typeof next !== "boolean") throw new TypeError("disabled must be boolean");
      select.disabled = input.disabled = toggle.disabled = next; if (next) close(); return true;
    },
    setError(next) {
      if (disposed) return false;
      dropdownText(next, "Error", 2048); manualError = next; describe(); return true;
    },
    get value() { return select.value; },
    /** Remove the enhanced UI and reveal its native form fallback; no hidden required control is left unfocusable. */
    dispose() {
      if (disposed) return;
      close(); disposed = true;
      input.removeEventListener("click", clickedInput); input.removeEventListener("input", typed); input.removeEventListener("keydown", keydown);
      input.removeEventListener("compositionstart", compositionStart); input.removeEventListener("compositionend", compositionEnd);
      toggle.removeEventListener("mousedown", pressedToggle); toggle.removeEventListener("click", clickedToggle);
      panel.removeEventListener("pointerdown", press); panel.removeEventListener("mousedown", press); panel.removeEventListener("click", clicked);
      select.removeEventListener("change", nativeChanged); select.removeEventListener("invalid", invalid); document.removeEventListener("reset", reset, true);
      panel.remove(); list.replaceChildren(); onChange = undefined; visible = []; model = { items: [], known: new Map() }; restoreGeometry();
      input.hidden = true; input.disabled = true; toggle.hidden = true; toggle.disabled = true;
      select.className = "ag-dropdown-select__fallback"; select.removeAttribute("aria-hidden"); select.removeAttribute("tabindex");
      select.id = `${id}-native`; title.htmlFor = select.id;
      const description = input.getAttribute("aria-describedby");
      if (description) select.setAttribute("aria-describedby", description);
      select.setAttribute("aria-invalid", input.getAttribute("aria-invalid"));
    },
  };
}

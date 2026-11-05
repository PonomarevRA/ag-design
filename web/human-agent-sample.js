import {
  createButton,
  createField,
  createSegmentedChoice,
} from "./vendor/ag-design/index.js";
import { h } from "./dom.js";
let serial = 0;

/** A local fictional form exposes the same native labels/state/result to people and semantic task tests. */
export function buildHumanAgentSample({ locale = "ru" } = {}) {
  const en = locale.startsWith("en"),
    prefix = `human-agent-example-${++serial}`;
  const heading = h(
    "h4",
    { id: prefix + "-heading" },
    en ? "Example settings" : "Настройки примера",
  );
  const element = h(
    "section",
    { className: "human-agent-example", "aria-labelledby": heading.id },
    heading,
    h(
      "p",
      {},
      en
        ? "Local demonstration only. Saving changes this example; no account or server data is modified."
        : "Только локальная демонстрация. Сохранение меняет этот пример; данные аккаунта или сервера не изменяются.",
    ),
  );
  const form = h("form", { noValidate: true });
  const field = createField({
    document,
    id: prefix + "-name",
    label: en ? "Collection name" : "Название подборки",
    required: true,
    hint: en
      ? "Use a name that people recognize."
      : "Используйте понятное людям название.",
  });
  const input = field.querySelector("input");
  input.maxLength = 180;
  input.value = en ? "Autumn catalog" : "Осенний каталог";
  const choice = createSegmentedChoice({
    document,
    label: en ? "Collection visibility" : "Видимость подборки",
    value: "personal",
    options: [
      { value: "personal", label: en ? "Personal" : "Личная" },
      { value: "team", label: en ? "Team" : "Командная" },
    ],
  });
  const message = h("p", {
    className: "human-agent-example__message",
    role: "status",
    "aria-atomic": "true",
  });
  const invalid = h("p", {
    id: prefix + "-error",
    className: "human-agent-example__error",
    hidden: true,
  });
  const actions = h("div", { className: "human-agent-example__actions" });
  const save = createButton({
    document,
    label: en ? "Save example" : "Сохранить пример",
  });
  save.type = "submit";
  const reset = createButton({
    document,
    label: en ? "Reset example" : "Сбросить пример",
    variant: "quiet",
  });
  actions.append(save, reset);
  form.append(field, choice.element, invalid, actions);
  element.append(form, message);
  let disposed = false,
    result = null;
  /** Validate local input before committing; preserve focus/drafts and expose an observable outcome. */
  function submit(event) {
    event.preventDefault();
    if (disposed) return;
    const name = input.value.trim();
    if (!name) {
      input.setAttribute("aria-invalid", "true");
      input.setAttribute(
        "aria-describedby",
        `${prefix}-name-hint ${invalid.id}`,
      );
      invalid.hidden = false;
      invalid.textContent = en
        ? "Enter a collection name, then save again."
        : "Введите название подборки и сохраните ещё раз.";
      message.textContent = invalid.textContent;
      return;
    }
    input.removeAttribute("aria-invalid");
    input.setAttribute("aria-describedby", prefix + "-name-hint");
    invalid.hidden = true;
    result = { name, visibility: choice.value };
    const visibility =
      choice.value === "team"
        ? en
          ? "Team"
          : "Командная"
        : en
          ? "Personal"
          : "Личная";
    message.textContent =
      (en ? "Saved locally: " : "Сохранено локально: ") +
      name +
      " · " +
      visibility;
  }
  /** Reset the example's explicit domain state silently; no real product request or native form reset is implied. */
  function clear() {
    if (disposed) return;
    input.value = en ? "Autumn catalog" : "Осенний каталог";
    choice.setValue("personal");
    input.removeAttribute("aria-invalid");
    input.setAttribute("aria-describedby", prefix + "-name-hint");
    invalid.hidden = true;
    invalid.textContent = "";
    result = null;
    message.textContent = en ? "Example reset." : "Пример сброшен.";
  }
  form.addEventListener("submit", submit);
  reset.addEventListener("click", clear);
  return {
    element,
    get state() {
      return result ? { ...result } : null;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      form.removeEventListener("submit", submit);
      reset.removeEventListener("click", clear);
      choice.dispose();
    },
  };
}

import {
  createDropdownSelect,
  createButton,
} from "./vendor/ag-design/index.js";

const initialOptions = [
  { value: "design", label: "Дизайн", group: "Команды" },
  { value: "engineering", label: "Разработка", group: "Команды" },
  { value: "research", label: "Исследования", group: "Команды" },
  { value: "archive", label: "Архив — недоступен", disabled: true },
];

/** Read bounded literal fixture data; the shared component validates option identities and fields. */
function optionsFrom(value) {
  if (value === undefined) return initialOptions;
  if (typeof value !== "string" || value.length > 4096)
    throw new TypeError("Варианты должны быть JSON длиной до 4096 символов");
  const options = JSON.parse(value);
  if (!Array.isArray(options) || options.length > 500)
    throw new TypeError("Укажите массив не более 500 вариантов");
  return options;
}

/** Mount the actual public combobox with local data, live option replacement and visible action results. */
export function buildDropdownSelectSample(
  props = {},
  document = globalThis.document,
) {
  const element = document.createElement("section");
  element.className = "dropdown-select-sample";
  const status = document.createElement("p");
  status.className = "muted";
  status.setAttribute("role", "status");
  let disposed = false,
    alternative = false;
  const control = createDropdownSelect({
    document,
    label: props.label ?? "Команда",
    options: optionsFrom(props.options),
    value: props.value ?? "design",
    placeholder: props.placeholder ?? "Выберите команду",
    hint: props.hint ?? "Начните вводить название или откройте список",
    error: props.error ?? "",
    searchable: props.searchable !== "false",
    disabled: props.disabled === "true",
    required: props.required === "true",
    name: "team",
    searchPlaceholder: "Поиск команды",
    emptyText: "Совпадений не найдено",
    onChange(value) {
      if (!disposed) status.textContent = `Выбрано: ${value || "нет значения"}`;
    },
  });
  const actions = document.createElement("div");
  actions.className = "sample-actions";
  const open = createButton({
    document,
    label: "Открыть список",
    variant: "quiet",
    disabled: props.disabled === "true",
    onClick: () => {
      control.input.focus({ preventScroll: true });
      control.open();
    },
  });

  /** Changing the local dataset keeps the mounted input and follows the component's silent-setter contract. */
  function replaceOptions() {
    if (disposed) return;
    alternative = !alternative;
    control.setOptions(
      alternative
        ? [
            { value: "product", label: "Продуктовая команда" },
            { value: "platform", label: "Платформа" },
            { value: "support", label: "Поддержка" },
          ]
        : initialOptions,
    );
    status.textContent = "Варианты обновлены";
  }
  actions.append(
    open,
    createButton({
      document,
      label: "Сменить варианты",
      variant: "quiet",
      onClick: replaceOptions,
    }),
  );
  element.append(control.element, actions, status);
  return {
    element,
    interact: () => control.open(),
    dispose() {
      if (disposed) return;
      disposed = true;
      control.dispose();
      element.remove();
    },
  };
}

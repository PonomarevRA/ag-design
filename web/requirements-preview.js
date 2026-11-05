import {
  createButton,
  createField,
  resolveCornerRadius,
} from "./vendor/ag-design/index.js";
import { applyColorProfile } from "./vendor/ag-design/color-profile.js";

const appearances = document.querySelector("#appearance");
const density = document.querySelector("#density");
const examples = document.querySelector("#examples");
const result = document.querySelector("#result");
const response = await fetch("/api/v1/profiles", { redirect: "error" });
if (!response.ok) throw new Error("Не удалось загрузить локальные профили");
const profile = (await response.json()).items.find(
  (item) => item.id === "design",
);

/** Mount actual shared variants with stable labels and separate action groups. */
function renderExamples() {
  examples.replaceChildren();
  for (const [title, options] of [
    ["Обычное заполнение", {}],
    [
      "Исправление ошибки",
      { error: "Укажите email в формате name@example.com" },
    ],
    ["Просмотр значения", { readOnly: true }],
  ]) {
    const section = document.createElement("section");
    section.className = "example";
    const heading = document.createElement("h2");
    heading.textContent = title;
    const form = document.createElement("form");
    const field = createField({
      id: `email-${examples.childElementCount}`,
      label: "Рабочая почта",
      hint: "Используем для ответа",
      density: density.value,
      type: "email",
      ...options,
    });
    field.querySelector("input").value = options.error
      ? "name@"
      : "name@example.com";
    const actions = document.createElement("div");
    actions.className = "actions";
    actions.append(
      createButton({
        label: "Сохранить контакт",
        variant: "primary",
        density: density.value,
        onClick: () => {
          if (form.reportValidity())
            result.textContent = "Пример: контакт сохранён";
          else result.textContent = "Исправьте поле перед сохранением";
        },
      }),
      createButton({
        label: "Обновить данные",
        icon: "refresh",
        iconOnly: true,
        variant: "quiet",
        density: density.value,
        onClick: () => {
          result.textContent = "Пример: данные обновлены";
        },
      }),
    );
    form.addEventListener("submit", (event) => event.preventDefault());
    form.append(field, actions);
    section.append(heading, form);
    examples.append(section);
  }
  const section = document.createElement("section");
  section.className = "example";
  const heading = document.createElement("h2");
  heading.textContent = "Вложенные поверхности";
  const parent = document.createElement("div");
  parent.className = "corner-parent";
  const child = document.createElement("div");
  child.className = "corner-child";
  child.style.borderRadius = `${resolveCornerRadius({ shape: "concentric", parentRadius: 24, inset: 8 })}px`;
  child.textContent =
    "Внешний радиус 24 px, отступ 8 px, внутренний радиус 16 px";
  const note = document.createElement("p");
  note.className = "corner-note";
  note.textContent =
    "Пример равномерного отступа и круговых дуг. Соседние элементы выбирают форму по своей роли.";
  parent.append(child);
  section.append(heading, parent, note);
  examples.append(section);
}

/** Select explicitly supplied semantic variants; standard host colors remain unchanged. */
function updateAppearance() {
  const theme = appearances.value.startsWith("dark") ? "dark" : "light";
  const contrast = appearances.value.endsWith("increased")
    ? "increased"
    : "standard";
  applyColorProfile(document.documentElement, profile, theme, contrast);
}
appearances.addEventListener("change", updateAppearance);
density.addEventListener("change", renderExamples);
updateAppearance();
renderExamples();

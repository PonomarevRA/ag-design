import {
  createPopover,
  createSortingControl,
  createI18n,
} from "./vendor/ag-design/index.js";

/**
 * Synthetic, local-only fixtures share the actual public factories with catalog and sandbox.
 */
export function buildGitlabPatternsSample(
  id,
  { document = globalThis.document, locale = "ru" } = {},
) {
  const english = locale.startsWith("en"),
    i18n = createI18n({ locale, availableLocales: ["en", "ru"] });
  const element = document.createElement("div");
  element.className = "gitlab-patterns-sample";
  let control;
  if (id === "popover") {
    const content = document.createElement("div"),
      label = document.createElement("label"),
      checkbox = document.createElement("input"),
      caption = document.createElement("span"),
      note = document.createElement("p");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    caption.textContent = english ? "Show labels" : "Показывать подписи";
    label.append(checkbox, caption);
    note.textContent = english
      ? "Local example. Settings remain after closing."
      : "Локальный пример. Настройки сохраняются при закрытии.";
    content.append(label, note);
    control = createPopover({
      document,
      i18n,
      label: english ? "View" : "Вид",
      title: english ? "View settings" : "Настройки вида",
      content,
    });
    element.append(control.element);
  } else {
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    status.textContent = english
      ? "Local sorting example"
      : "Локальный пример сортировки";
    control = createSortingControl({
      document,
      i18n,
      label: english ? "Sort by" : "Сортировка",
      options: [
        {
          value: "relevance",
          label: english ? "Relevance" : "По соответствию",
          directional: false,
        },
        {
          value: "name",
          label: english ? "Name" : "Название",
          defaultDirection: "asc",
        },
        {
          value: "usage",
          label: english ? "Usage" : "Использование",
          defaultDirection: "desc",
        },
      ],
      value: { by: "name", direction: "asc" },
      onChange: (value) => {
        status.textContent = value.by + " · " + (value.direction || "fixed");
      },
    });
    element.append(control.element, status);
  }
  return {
    element,
    /** Exercise the real open/close or sorting state without network or persistence. */
    interact() {
      if (id === "popover") { control.open(); control.close(); }
      else control.setValue({ by:"name", direction:control.value.direction === "asc" ? "desc" : "asc" });
    },
    dispose() {
      control.dispose();
      i18n.dispose();
    },
  };
}

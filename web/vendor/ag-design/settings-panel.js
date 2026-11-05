import { createTabs } from "./tabs.js";
let sequence = 0;
const identifier = (value) =>
  typeof value === "string" && /^[A-Za-z0-9_.:-]{1,80}$/.test(value);

/** Settings data describes only layout and local factories; it never reads or persists application preferences. */
function categoriesValue(categories) {
  if (
    !Array.isArray(categories) ||
    !categories.length ||
    categories.length > 24
  )
    throw new TypeError("Settings require 1–24 categories");
  const ids = new Set();
  let totalRows = 0;
  return categories.map((category) => {
    if (
      !category ||
      !identifier(category.id) ||
      ids.has(category.id) ||
      typeof category.label !== "string" ||
      !category.label.trim() ||
      category.label.length > 180 ||
      (category.disabled !== undefined &&
        typeof category.disabled !== "boolean") ||
      (category.sensitive !== undefined &&
        typeof category.sensitive !== "boolean")
    )
      throw new TypeError("Categories require unique IDs and bounded labels");
    ids.add(category.id);
    const lifecycle =
      category.lifecycle ?? (category.sensitive ? "destroy" : "preserve");
    if (!["preserve", "destroy"].includes(lifecycle))
      throw new TypeError("Settings lifecycle must be preserve or destroy");
    const groups = category.groups ?? [];
    if (!Array.isArray(groups) || groups.length > 32)
      throw new TypeError("At most 32 groups per category are supported");
    const groupIds = new Set(),
      rowIds = new Set();
    const normalized = groups.map((group) => {
      if (
        !group ||
        !identifier(group.id) ||
        groupIds.has(group.id) ||
        (group.title !== undefined &&
          (typeof group.title !== "string" ||
            !group.title.trim() ||
            group.title.length > 180)) ||
        (group.description !== undefined &&
          (typeof group.description !== "string" ||
            group.description.length > 2048)) ||
        !Array.isArray(group.rows) ||
        group.rows.length > 128
      )
        throw new TypeError("Groups require IDs and bounded rows/text");
      groupIds.add(group.id);
      const rows = group.rows.map((row) => {
        if (
          !row ||
          !identifier(row.id) ||
          rowIds.has(row.id) ||
          typeof row.label !== "string" ||
          !row.label.trim() ||
          row.label.length > 180 ||
          (row.description !== undefined &&
            (typeof row.description !== "string" ||
              row.description.length > 2048)) ||
          typeof row.mount !== "function"
        )
          throw new TypeError(
            "Rows require unique IDs, labels and local mount factories",
          );
        rowIds.add(row.id);
        totalRows++;
        if (totalRows > 1000)
          throw new TypeError("At most 1000 settings rows are supported");
        return { ...row };
      });
      return { ...group, rows };
    });
    if (
      category.description !== undefined &&
      (typeof category.description !== "string" ||
        category.description.length > 2048)
    )
      throw new TypeError("Category description exceeds its budget");
    return { ...category, lifecycle, groups: normalized };
  });
}

/** Group local preference controls in vertical categories. Use existing createPopup when modal presentation is required. */
export function createSettingsPanel({
  document = globalThis.document,
  title,
  description = "",
  categories,
  value,
  footer = null,
  activation = "automatic",
  onChange,
} = {}) {
  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.length > 180 ||
    typeof description !== "string" ||
    description.length > 2048 ||
    (onChange !== undefined && typeof onChange !== "function")
  )
    throw new TypeError(
      "Settings require bounded title/description and an optional callback",
    );
  if (!["automatic", "manual"].includes(activation))
    throw new TypeError("Unknown category activation mode");
  if (
    footer !== null &&
    (footer?.nodeType !== 1 ||
      footer.ownerDocument !== document ||
      footer.parentNode)
  )
    throw new TypeError("Footer must be a detached local element");
  const definitions = categoriesValue(categories),
    instance = ++sequence;
  const element = document.createElement("section");
  element.className = "ag-settings-panel";
  element.setAttribute("data-ag-width", "fill");
  const header = document.createElement("header"),
    heading = document.createElement("h2");
  header.className = "ag-settings-panel__header";
  heading.id = `ag-settings-${instance}-title`;
  heading.textContent = title;
  header.append(heading);
  element.setAttribute("aria-labelledby", heading.id);
  if (description) {
    const text = document.createElement("p");
    text.textContent = description;
    header.append(text);
  }
  let disposed = false,
    mountedSequence = 0;

  /** Mount one category lazily. Destroyed categories dispose fields and require fresh factories on their next activation. */
  function mountCategory(category) {
    const content = document.createElement("div");
    content.className = "ag-settings-panel__category";
    const resources = [],
      controlIds = new Set();
    let categoryDisposed = false;
    if (category.description) {
      const note = document.createElement("p");
      note.className = "ag-settings-panel__description";
      note.textContent = category.description;
      content.append(note);
    }
    /** Release owned fields in reverse mount order, even when one host cleanup throws. */
    function disposeCategory() {
      if (categoryDisposed) return;
      categoryDisposed = true;
      let failure = null;
      for (const resource of resources.reverse()) {
        if (category.sensitive)
          for (const input of resource.element.matches("input,textarea")
            ? [resource.element]
            : resource.element.querySelectorAll("input,textarea"))
            input.value = "";
        try {
          resource.dispose?.();
        } catch (cause) {
          failure ||= cause;
        }
      }
      resources.length = 0;
      content.replaceChildren();
      if (failure) throw failure;
    }
    try {
      for (const group of category.groups) {
        const section = document.createElement("section");
        section.className = "ag-settings-panel__group";
        if (group.title) {
          const title = document.createElement("h3");
          title.textContent = group.title;
          section.append(title);
        }
        if (group.description) {
          const note = document.createElement("p");
          note.className = "ag-settings-panel__description";
          note.textContent = group.description;
          section.append(note);
        }
        const rows = document.createElement("div");
        rows.className = "ag-settings-panel__rows";
        for (const row of group.rows) {
          const mounted = row.mount(),
            control = mounted?.nodeType === 1 ? mounted : mounted?.element;
          if (
            control?.nodeType !== 1 ||
            control.ownerDocument !== document ||
            control.parentNode ||
            (mounted?.dispose !== undefined &&
              typeof mounted.dispose !== "function")
          )
            throw new TypeError(
              "A settings factory returns a fresh local element or controller",
            );
          resources.push({
            element: control,
            dispose: mounted?.nodeType === 1 ? null : mounted.dispose,
          });
          const wrapper = document.createElement("div"),
            labelBox = document.createElement("div"),
            controlBox = document.createElement("div");
          wrapper.className = "ag-settings-panel__row";
          wrapper.dataset.settingId = row.id;
          labelBox.className = "ag-settings-panel__label";
          controlBox.className = "ag-settings-panel__control";
          const directControl = control.matches(
            "input,select,textarea,button,meter,progress",
          );
          const name = document.createElement(directControl ? "label" : "span");
          name.id = `ag-settings-${instance}-label-${++mountedSequence}`;
          name.textContent = row.label;
          if (directControl) {
            if (!control.id) control.id = name.id + "-control";
            if (
              controlIds.has(control.id) ||
              document.getElementById(control.id)
            )
              throw new TypeError(
                "Mounted settings control IDs must be unique",
              );
            controlIds.add(control.id);
            name.htmlFor = control.id;
          } else {
            controlBox.setAttribute("role", "group");
            controlBox.setAttribute("aria-labelledby", name.id);
          }
          labelBox.append(name);
          if (row.description) {
            const note = document.createElement("p");
            note.id = name.id + "-description";
            note.textContent = row.description;
            labelBox.append(note);
            const target = directControl ? control : controlBox,
              previous = target.getAttribute("aria-describedby");
            target.setAttribute(
              "aria-describedby",
              previous ? `${previous} ${note.id}` : note.id,
            );
          }
          controlBox.append(control);
          wrapper.append(labelBox, controlBox);
          rows.append(wrapper);
        }
        section.append(rows);
        content.append(section);
      }
    } catch (cause) {
      try {
        disposeCategory();
      } catch {
        /* Preserve the original mount error after releasing every already-owned field. */
      }
      throw cause;
    }
    return { element: content, dispose: disposeCategory };
  }
  const tabs = createTabs({
    document,
    label: `${title}: категории`,
    orientation: "vertical",
    activation,
    tabs: definitions.map((category) => ({
      id: category.id,
      label: category.label,
      disabled: category.disabled,
      lifecycle: category.lifecycle,
      mount: () => mountCategory(category),
    })),
    value,
    onChange,
  });
  tabs.element.classList.add("ag-settings-panel__body");
  tabs.element.querySelector(".ag-tabs__panels").setAttribute("data-ag-width", "content");
  element.append(header, tabs.element);
  if (footer) {
    const container = document.createElement("footer");
    container.className = "ag-settings-panel__footer";
    container.append(footer);
    element.append(container);
  }
  return {
    element,
    setValue: (id, options) => {
      if (!disposed) tabs.setValue(id, options);
    },
    get value() {
      return tabs.value;
    },
    dispose() {
      if (!disposed) {
        disposed = true;
        try {
          tabs.dispose();
        } finally {
          element.replaceChildren();
        }
      }
    },
  };
}

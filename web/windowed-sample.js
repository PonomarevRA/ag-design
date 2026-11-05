import { createRenderWindow } from "./vendor/ag-design/index.js";

/** Identify ordinary fields by stable labels/names, including a sample that is itself an input. */
function fieldsByKey(element) {
  const selector = "input,textarea,select,details";
  const fields = [...element.querySelectorAll(selector)];
  if (element.matches(selector)) fields.unshift(element);
  const occurrences = new Map();
  const result = new Map();
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index];
    const label =
      field.getAttribute("aria-label") ||
      field.labels?.[0]?.textContent ||
      field.name ||
      field.querySelector("summary")?.textContent ||
      field.id ||
      `${field.tagName}:${index}`;
    const occurrence = occurrences.get(label) || 0;
    occurrences.set(label, occurrence + 1);
    result.set(`${label}:${occurrence}`, field);
  }
  return result;
}

/** Snapshot bounded ordinary form/disclosure values without retaining DOM or copying HTML. Sensitive/file fields stay host-owned. */
function readFields(element) {
  const fields = fieldsByKey(element);
  if (fields.size > 256)
    throw new RangeError("Too many preview fields to evict safely");
  const result = [];
  for (const [key, field] of fields) {
    if (["file", "password"].includes(field.type)) {
      if (field.value || field.files?.length)
        throw new Error("Sensitive preview remains mounted until disposed");
      continue;
    }
    if (field.value?.length > 4096)
      throw new RangeError("Large preview value remains mounted");
    result.push({
      key,
      value: field.value,
      checked: field.checked,
      open: field.open,
      selected:
        field.tagName === "SELECT"
          ? [...field.options].map((option) => option.selected)
          : null,
    });
  }
  return result;
}

/** Restore values into matching fields in the new sample; missing dynamic fields never overwrite unrelated inputs. Component-specific models belong in factory snapshot/restore. */
function restoreFields(element, values = []) {
  const fields = fieldsByKey(element);
  for (const value of values) {
    const field = fields.get(value.key);
    if (!field) continue;
    if (value.value !== undefined) field.value = value.value;
    if (value.checked !== undefined) field.checked = value.checked;
    if (value.open !== undefined) field.open = value.open;
    if (value.selected)
      for (let option = 0; option < field.options.length; option++)
        field.options[option].selected = value.selected[option] === true;
  }
}

/** Adapt actual samples to eviction while retaining ordinary user input and the caller's persistent editor model. */
export function windowedSample(
  factory,
  { label, estimatedHeight = 240, root = null, retainInteractions = true } = {},
) {
  let hostPinned = false,
    interacted = false;
  const controller = createRenderWindow({
    document,
    label,
    estimatedHeight,
    root,
    render(saved) {
      const sample = factory(saved?.custom);
      restoreFields(sample.element, saved?.fields);
      // A generic form snapshot cannot reconstruct a chart camera, loaded media
      // or arbitrary widget model. Retain interacted complex samples safely.
      const simpleField =
        sample.element.matches("input,textarea") ||
        sample.element.classList.contains("ag-field");
      const changed = () => {
        if (!retainInteractions || simpleField || sample.snapshot) return;
        interacted = true;
        controller.setPinned(true);
      };
      sample.element.addEventListener("input", changed);
      sample.element.addEventListener("change", changed);
      sample.element.addEventListener("click", changed);
      sample.element.addEventListener("focusin", changed);
      return {
        element: sample.element,
        dispose() {
          sample.element.removeEventListener("input", changed);
          sample.element.removeEventListener("change", changed);
          sample.element.removeEventListener("click", changed);
          sample.element.removeEventListener("focusin", changed);
          sample.dispose?.();
        },
        snapshot: () => ({
          fields: readFields(sample.element),
          custom: sample.snapshot?.(),
        }),
      };
    },
    onError(error) {
      console.warn("Render window:", error.message);
    },
  });
  return {
    element: controller.element,
    get state() {
      return controller.state;
    },
    get mounted() {
      return controller.mounted;
    },
    setPinned(value) {
      if (typeof value !== "boolean")
        throw new TypeError("pinned must be boolean");
      hostPinned = value;
      controller.setPinned(hostPinned || interacted);
    },
    refresh: controller.refresh,
    dispose() {
      controller.dispose();
      factory = null;
    },
  };
}

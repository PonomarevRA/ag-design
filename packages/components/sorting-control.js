import { createDropdownSelect } from "./dropdown-select-localized.js";
import { resolveI18n } from "./i18n.js";
import { applyControlGeometry } from "./geometry.js";

/**
 * Validate/copy bounded criteria; relevance-like options have no artificial inverse direction.
 */
function criteriaModel(options) {
  if (!Array.isArray(options) || !options.length || options.length > 32)
    throw new TypeError("Use 1–32 sort criteria");
  const known = new Map();
  for (const option of options) {
    if (
      !option ||
      typeof option.value !== "string" ||
      !option.value ||
      option.value.length > 80 ||
      known.has(option.value) ||
      typeof option.label !== "string" ||
      !option.label.trim() ||
      option.label.length > 180 ||
      (option.directional !== undefined &&
        typeof option.directional !== "boolean") ||
      (option.defaultDirection !== undefined &&
        !["asc", "desc"].includes(option.defaultDirection))
    )
      throw new TypeError("Invalid sort criterion");
    known.set(
      option.value,
      Object.freeze({
        value: option.value,
        label: option.label,
        directional: option.directional !== false,
        defaultDirection: option.defaultDirection || "asc",
      }),
    );
  }
  return known;
}
/**
 * Validate a complete controlled value before any DOM/state changes.
 */
function sortValue(value, known) {
  const criterion = known.get(value?.by);
  if (
    !criterion ||
    (criterion.directional
      ? !["asc", "desc"].includes(value.direction)
      : value.direction !== null)
  )
    throw new TypeError(
      "Known sort criterion and applicable direction required",
    );
  return { by: value.by, direction: value.direction };
}

/**
 * Create independent sort criterion/direction controls; the host owns actual ordering, URLs and transport.
 * @param {object} options Explicit locale, label, 1–32 criteria and {by,direction:asc|desc|null}; callbacks are user actions only.
 * @returns {object} Element/dropdown, copied value, silent restore/disable and idempotent disposal.
 */
export function createSortingControl({
  document = globalThis.document,
  i18n,
  label,
  options,
  value,
  disabled = false,
  density = "comfortable",
  onChange = () => {},
  onError = () => {},
} = {}) {
  if (
    typeof label !== "string" ||
    !label.trim() ||
    label.length > 180 ||
    typeof disabled !== "boolean" ||
    typeof onChange !== "function" ||
    typeof onError !== "function"
  )
    throw new TypeError("Invalid sorting control options");
  const known = criteriaModel(options),
    context = resolveI18n(document, i18n);
  let current = sortValue(value, known),
    disposed = false,
    revision = 0;
  const element = document.createElement("div"),
    directionButton = document.createElement("button");
  element.className = "ag-sorting-control";
  element.setAttribute("role", "group");
  element.setAttribute("aria-label", label);
  directionButton.className =
    "ag-button ag-button--secondary ag-sorting-control__direction";
  directionButton.type = "button";
  const dropdown = createDropdownSelect({
    document,
    i18n: context,
    label,
    options: [...known.values()].map((item) => ({
      value: item.value,
      label: item.label,
    })),
    value: current.by,
    searchable: false,
    density,
    disabled,
    onChange: selectCriterion,
  });
  const restore = applyControlGeometry(directionButton, { density });
  element.append(dropdown.element, directionButton);
  /**
 * Paint existing nodes; locale changes never replace a focused criterion or direction button.
 */
  function paint() {
    element.lang = context.locale;
    element.dir = context.direction;
    directionButton.hidden = current.direction === null;
    directionButton.disabled = disabled;
    directionButton.textContent = current.direction === "asc" ? "↑" : "↓";
    const next = current.direction === "asc" ? "desc" : "asc";
    directionButton.setAttribute(
      "aria-label",
      context.t("sorting.changeDirection", {
        current: context.t("sorting." + (current.direction || "none")),
        next: context.t("sorting." + next),
      }),
    );
    directionButton.title = directionButton.getAttribute("aria-label");
    element.dataset.direction = current.direction || "none";
  }
  /**
 * Publish a copied value; late callback failure cannot affect a newer selection or disposed instance.
 */
  function publish() {
    const generation = ++revision;
    const report = (error) => {
      if (!disposed && generation === revision) {
        try {
          onError(error);
        } catch {
          /* Host error reporting is isolated. */
        }
      }
    };
    try {
      Promise.resolve(onChange({ ...current })).catch(report);
    } catch (error) {
      report(error);
    }
  }
  /**
 * Choosing a criterion applies its declared default direction or an explicit null for relevance.
 */
  function selectCriterion(by) {
    if (disposed || disabled || by === current.by || dropdown.value !== by)
      return;
    const criterion = known.get(by);
    current = {
      by,
      direction: criterion.directional ? criterion.defaultDirection : null,
    };
    paint();
    publish();
  }
  /**
 * Toggle only a meaningful enabled direction; criterion and host data remain untouched.
 */
  function toggleDirection() {
    if (disposed || disabled || current.direction === null) return;
    current = {
      ...current,
      direction: current.direction === "asc" ? "desc" : "asc",
    };
    paint();
    publish();
  }
  directionButton.addEventListener("click", toggleDirection);
  const off = context.subscribe(paint);
  paint();
  return Object.freeze({
    element,
    dropdown,
    directionButton,
    get value() {
      return { ...current };
    },
    /**
 * Restore host state silently and atomically; this never sorts data or emits a user request.
 */
    setValue(value) {
      if (disposed) return false;
      const next = sortValue(value, known);
      dropdown.setValue(next.by);
      current = next;
      revision++;
      paint();
      return true;
    },
    /**
 * Keep both controls consistently unavailable and close the child listbox.
 */
    setDisabled(value) {
      if (typeof value !== "boolean")
        throw new TypeError("Boolean disabled required");
      if (disposed) return false;
      disabled = value;
      dropdown.setDisabled(value);
      paint();
      return true;
    },
    /**
 * Release only owned controls/subscriptions; the host removes the returned DOM.
 */
    dispose() {
      if (disposed) return;
      disposed = true;
      revision++;
      off();
      dropdown.dispose();
      directionButton.removeEventListener("click", toggleDirection);
      restore();
    },
  });
}

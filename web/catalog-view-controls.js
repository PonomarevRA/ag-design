import {
  createPopover,
  createSortingControl,
  createDropdownSelect,
  createSegmentedChoice,
  resolveI18n,
} from "./vendor/ag-design/index.js";

/**
 * Map the existing host sort contract to independent criterion/direction; no ordering or query ownership moves.
 */
function sortDescriptor(value) {
  if (value === "relevance") return { by: "relevance", direction: null };
  const match = /^(usage|name)-(asc|desc)$/.exec(value);
  if (!match) throw new TypeError("Unknown catalog sort");
  return { by: match[1], direction: match[2] };
}
/**
 * Keep native backing values/events for the existing catalog handlers, with no second accessible control tree.
 */
function commit(select, value) {
  select.value = value;
  select.dispatchEvent(
    new select.ownerDocument.defaultView.Event("change", { bubbles: true }),
  );
}

/**
 * Compose compact list controls from existing AG primitives; profiles, sort, palette and metrics stay host-owned.
 * @param {object} options Existing fallback details with native value models, explicit locale and initial palette.
 * @returns {object} Toolbar, silent profile/palette synchronization and owned component disposal.
 */
export function createCatalogViewControls({
  document = globalThis.document,
  i18n,
  details,
  palette = "design",
} = {}) {
  const context = resolveI18n(document, i18n),
    t = (key) => context.t("viewControls." + key);
  const nativePalette = document.getElementById("palette"),
    nativeSort = document.getElementById("catalog-sort"),
    nativeMetric = document.getElementById("catalog-usage-mode"),
    note = document.getElementById("catalog-usage-note");
  if (
    !details ||
    ![nativePalette, nativeSort, nativeMetric, note].every(
      (node) => node && details.contains(node),
    )
  )
    throw new TypeError("Catalog view fallback controls required");
  const options = [...nativePalette.options].map((option) => ({
    value: option.value,
    label: option.textContent,
  }));
  const paletteControl = createDropdownSelect({
    document,
    i18n,
    label: t("palette"),
    options,
    value: palette,
    searchable: false,
    density: "comfortable",
  });
  paletteControl.select.id = "palette";
  nativePalette.remove();
  const sorting = createSortingControl({
    document,
    i18n,
    label: t("sort"),
    options: [
      { value: "relevance", label: t("relevance"), directional: false },
      { value: "usage", label: t("usage"), defaultDirection: "desc" },
      { value: "name", label: t("name"), defaultDirection: "asc" },
    ],
    value: sortDescriptor(nativeSort.value),
    onChange: (value) =>
      commit(
        nativeSort,
        value.by === "relevance"
          ? "relevance"
          : value.by + "-" + value.direction,
      ),
  });
  nativeSort.hidden = true;
  nativeSort.tabIndex = -1;
  sorting.element.append(nativeSort);
  const metric = createSegmentedChoice({
    document,
    label: t("metric"),
    options: [
      { value: "value", label: t("count") },
      { value: "score", label: t("score") },
    ],
    value: nativeMetric.value,
    onChange: (value) => commit(nativeMetric, value),
  });
  nativeMetric.hidden = true;
  nativeMetric.tabIndex = -1;
  metric.element.append(nativeMetric);
  const content = document.createElement("div"),
    help = document.createElement("details"),
    summary = document.createElement("summary");
  content.className = "catalog-view-controls__settings";
  const timing = document.createElement("p");
  timing.className = "catalog-view-controls__timing";
  timing.textContent = t("timing");
  content.append(timing);
  summary.textContent = t("about");
  help.className = "catalog-view-controls__help";
  help.append(summary, note);
  content.append(paletteControl.element, metric.element, help);
  const popover = createPopover({
    document,
    i18n,
    label: t("view"),
    title: t("title"),
    content,
    width: 340,
    align: "end",
    onOpenChange(opened) {
      if (!opened) paletteControl.close();
    },
  });
  popover.panel.dataset.catalogViewPanel = "";
  popover.trigger.dataset.catalogViewTrigger = "";
  const element = document.createElement("div");
  element.className = "catalog-view-controls";
  element.setAttribute("role", "group");
  element.setAttribute("aria-label", t("group"));
  element.append(sorting.element, popover.element);
  const band = document.createElement("div");
  band.className = "catalog-view-band";
  const categories = document.querySelector(".categories");
  details.replaceWith(band);
  band.append(categories, element);
  const sortingList =
    sorting.dropdown.element.querySelector('[role="listbox"]');
  const paletteList = paletteControl.element.querySelector('[role="listbox"]');
  let disposed = false,
    usageAvailable = true;
  /**
 * Translate only this composition's owned nodes; native models, selected values and focus remain stable.
 */
  function paintLocale() {
    element.setAttribute("aria-label", t("group"));
    sorting.element.setAttribute("aria-label", t("sort"));
    sorting.dropdown.element.querySelector("label").textContent = t("sort");
    sortingList.setAttribute("aria-label", t("sort"));
    sorting.dropdown.setOptions(
      [
        { value: "relevance", label: t("relevance") },
        { value: "usage", label: t("usage") },
        { value: "name", label: t("name") },
      ],
      sorting.value.by,
    );
    paletteControl.element.querySelector("label").textContent = t("palette");
    paletteList.setAttribute("aria-label", t("palette"));
    metric.element.querySelector("legend").textContent = t("metric");
    for (const [index, key] of ["count", "score"].entries())
      metric.element.querySelectorAll(".ag-segmented-choice__option>span")[
        index
      ].textContent = t(key);
    popover.trigger.textContent = t("view");
    popover.panel.querySelector("h2").textContent = t("title");
    timing.textContent = t("timing");
    summary.textContent = t("about");
    note.textContent = t(usageAvailable ? "help" : "unavailable");
  }
  const offLocale = context.subscribe(paintLocale);
  paintLocale();
  return {
    element,
    sorting,
    paletteControl,
    popover,
    metric,
    /**
 * Keep unavailable usage distinct from zero without changing the selected badge representation.
 */
    setUsageAvailable(value) {
      usageAvailable = Boolean(value);
      note.textContent = t(usageAvailable ? "help" : "unavailable");
    },
    /**
 * Refresh dynamic profile labels without rebuilding controls or changing a user selection silently.
 */
    setProfiles(profiles, value) {
      if (disposed) return;
      paletteControl.setOptions(
        profiles.map((profile) => ({ value: profile.id, label: profile.name })),
        value,
      );
    },
    /**
 * Keep external/native host changes synchronized with the visible criterion and metric controls.
 */
    setSort(value) {
      if (!disposed) sorting.setValue(sortDescriptor(value));
    },
    setMetric(value) {
      if (!disposed) metric.setValue(value);
    },
    /**
 * Restore a library's profile in both visible and native representations without emitting a user action.
 */
    setPalette(value) {
      if (!disposed) paletteControl.setValue(value);
    },
    /**
 * Dispose the overlay first, then its borrowed controls; host owns removal of the composed DOM.
 */
    dispose() {
      if (disposed) return;
      disposed = true;
      offLocale();
      popover.dispose();
      sorting.dispose();
      paletteControl.dispose();
      metric.dispose();
    },
  };
}

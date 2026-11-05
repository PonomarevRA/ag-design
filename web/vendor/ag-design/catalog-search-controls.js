import { catalogText } from "./catalog-card-contract.js";
import {
  catalogSearchSchema,
  catalogSearchValue,
  copyCatalogValue,
  sameCatalogValue,
  catalogSearchRequest,
} from "./catalog-search-model.js";
import { resolveI18n } from "./i18n.js";
import { applyControlGeometry } from "./geometry.js";
let serial = 0;

/**
 * Validate the complete borrowed field set before any live host nodes move.
 * @param {HTMLLabelElement[]} fields At most four distinct caption/control labels.
 * @param {Document} document The owning document; cross-document transfers are rejected.
 * @throws {TypeError} A label is incomplete or its control requires a separate layout.
 */
function validateAdjacentFields(fields, document) {
  if (
    !Array.isArray(fields) ||
    fields.length > 4 ||
    new Set(fields).size !== fields.length
  )
    throw new TypeError("Use at most four distinct adjacent fields");
  for (const field of fields) {
    if (
      field?.ownerDocument !== document ||
      field.tagName !== "LABEL" ||
      field.children.length !== 2
    )
      throw new TypeError(
        "Adjacent fields need same-document caption/control labels",
      );
    const [caption, control] = field.children;
    if (
      caption.tagName !== "SPAN" ||
      !caption.textContent.trim() ||
      !["INPUT", "SELECT"].includes(control.tagName)
    )
      throw new TypeError(
        "Adjacent labels need a caption span and one native input/select",
      );
    if (control.tagName === "SELECT" && (control.multiple || control.size > 1))
      throw new TypeError("Multi-row selections need a separate field group");
    if (
      control.tagName === "INPUT" &&
      [
        "checkbox",
        "radio",
        "hidden",
        "file",
        "range",
        "button",
        "submit",
        "reset",
        "image",
      ].includes(control.type)
    )
      throw new TypeError("Adjacent input must be a single-line value control");
  }
}

/**
 * Create native query/filter controls and revision-bound feedback without owning search transport.
 * @param {object} options Search schema, locale and callbacks. adjacentFields accepts up to four
 * same-document label elements with one native control each; host owns their values and listeners.
 * Borrowed labels move into shared tracks after validation and remain mounted on disposal.
 * @returns {object} Element, query input, state, receipt reporting and idempotent disposal.
 */
export function createCatalogSearchControls({
  document = globalThis.document,
  i18n,
  label,
  query = "",
  filters = {},
  sort,
  facets = [],
  sortOptions = [],
  mode = "submit",
  queryId,
  adjacentFields = [],
  onChange = () => {},
  onError = () => {},
} = {}) {
  if (
    !document?.createElement ||
    !["submit", "instant"].includes(mode) ||
    typeof onChange !== "function" ||
    typeof onError !== "function"
  )
    throw new TypeError("Invalid catalog search options");
  validateAdjacentFields(adjacentFields, document);
  catalogText(label, "search label", 160, true);
  if (
    queryId !== undefined &&
    (!/^[a-z][a-z0-9_-]{0,100}$/i.test(queryId) ||
      document.getElementById(queryId))
  )
    throw new TypeError("Unique queryId required");
  const schema = catalogSearchSchema(facets, sortOptions),
    context = resolveI18n(document, i18n),
    prefix = `ag-catalog-search-${++serial}`;
  let draft = catalogSearchValue({ query, filters, sort }, schema),
    applied = copyCatalogValue(draft),
    revision = 0,
    status = "idle",
    total = null,
    resultRevision = null,
    disposed = false,
    composing = false;
  const t = (key, params) => context.t(`catalog.${key}`, params);
  const node = (tag, className = "") => {
    const element = document.createElement(tag);
    element.className = className;
    return element;
  };
  const element = node("section", "ag-catalog-search"),
    form = node("form", "ag-catalog-search__form"),
    primary = node("div", "ag-catalog-search__primary"),
    actions = node("div", "ag-catalog-search__actions"),
    field = node("label", "ag-catalog-search__query"),
    caption = node("span"),
    input = node("input"),
    clear = node(
      "button",
      "ag-button ag-button--quiet ag-catalog-search__clear",
    ),
    submit = node(
      "button",
      "ag-button ag-button--secondary ag-catalog-search__submit",
    ),
    facetRoot = node("div", "ag-catalog-search__facets"),
    chips = node("div", "ag-catalog-search__chips"),
    reset = node("button", "ag-button ag-button--quiet"),
    dirty = node("p", "ag-catalog-search__dirty"),
    message = node("p", "ag-catalog-search__status"),
    retry = node("button", "ag-button ag-button--secondary");
  caption.textContent = label;
  input.id = queryId ?? prefix + "-query";
  input.type = "search";
  input.maxLength = 512;
  input.autocomplete = "off";
  input.name = "query";
  field.append(caption, input);
  clear.type = "button";
  submit.type = "submit";
  reset.type = "button";
  retry.type = "button";
  for (const button of [clear, submit, reset, retry])
    applyControlGeometry(button, { density: "comfortable" });
  form.setAttribute("role", "search");
  form.setAttribute("aria-label", label);
  primary.dataset.adjacentCount = String(adjacentFields.length);
  primary.style.setProperty(
    "--ag-search-columns",
    "minmax(0,1fr) auto" + " minmax(10rem,16rem)".repeat(adjacentFields.length),
  );
  actions.append(clear, submit);
  primary.append(field, actions);
  for (const [index, adjacent] of adjacentFields.entries()) {
    adjacent.classList.add("ag-catalog-search__adjacent");
    adjacent.style.setProperty("--ag-search-column", String(index + 3));
    primary.append(adjacent);
  }
  form.append(primary, facetRoot);
  message.setAttribute("role", "status");
  message.setAttribute("aria-atomic", "true");
  dirty.setAttribute("aria-live", "off");
  element.append(form, chips, reset, dirty, message, retry);
  const controls = new Map(),
    labels = new Map(),
    anyOptions = [];
  for (const facet of schema.facets) {
    if (facet.multiple) {
      const group = node("fieldset", "ag-catalog-search__facet"),
        legend = node("legend");
      legend.textContent = facet.label;
      group.append(legend);
      for (const option of facet.options) {
        const label = node("label"),
          checkbox = node("input"),
          text = node("span");
        checkbox.type = "checkbox";
        checkbox.dataset.facet = facet.id;
        checkbox.value = option.value;
        text.textContent = option.label;
        label.append(checkbox, text);
        group.append(label);
      }
      controls.set(facet.id, group);
      facetRoot.append(group);
    } else {
      const label = node("label", "ag-catalog-search__facet"),
        caption = node("span"),
        select = node("select"),
        any = node("option");
      caption.textContent = facet.label;
      any.value = "";
      select.append(any);
      anyOptions.push(any);
      for (const option of facet.options) {
        const nodeOption = node("option");
        nodeOption.value = option.value;
        nodeOption.textContent = option.label;
        select.append(nodeOption);
      }
      select.dataset.facet = facet.id;
      label.append(caption, select);
      controls.set(facet.id, select);
      facetRoot.append(label);
    }
  }
  let sortControl = null;
  if (schema.sortOptions.length) {
    const label = node("label", "ag-catalog-search__facet"),
      caption = node("span");
    labels.set("sort", caption);
    sortControl = node("select");
    sortControl.name = "sort";
    for (const option of schema.sortOptions) {
      const el = node("option");
      el.value = option.value;
      el.textContent = option.label;
      sortControl.append(el);
    }
    label.append(caption, sortControl);
    facetRoot.append(label);
  }
  facetRoot.hidden = !schema.facets.length && !sortControl;
  const chipNodes = new Map();
  function synchronize() {
    input.value = draft.query;
    for (const facet of schema.facets) {
      const control = controls.get(facet.id);
      if (facet.multiple)
        for (const checkbox of control.querySelectorAll("input"))
          checkbox.checked = draft.filters[facet.id].includes(checkbox.value);
      else control.value = draft.filters[facet.id][0] ?? "";
    }
    if (sortControl) sortControl.value = draft.sort;
  }
  /** Reuse chip nodes across status/locale updates so passive feedback never destroys keyboard focus. */
  function paintChips() {
    let focusRemoved = false;
    const wanted = new Map();
    if (applied.query)
      wanted.set("query", {
        label: t("queryChip", { query: applied.query }),
        facet: null,
        value: null,
      });
    for (const facet of schema.facets)
      for (const value of applied.filters[facet.id]) {
        const option = facet.options.find((item) => item.value === value);
        wanted.set(`${facet.id}:${value}`, {
          label: `${facet.label}: ${option.label}`,
          facet: facet.id,
          value,
        });
      }
    for (const [key, button] of chipNodes)
      if (!wanted.has(key)) {
        focusRemoved ||= document.activeElement === button;
        button.remove();
        chipNodes.delete(key);
      }
    for (const [key, entry] of wanted) {
      let button = chipNodes.get(key);
      if (!button) {
        button = node("button", "ag-button ag-button--quiet");
        button.type = "button";
        button.dataset.chip = key;
        chips.append(button);
        chipNodes.set(key, button);
      }
      button.textContent = `${entry.label} ×`;
      button.setAttribute(
        "aria-label",
        t("removeFilter", { name: entry.label }),
      );
      button.dataset.facet = entry.facet ?? "";
      button.dataset.value = entry.value ?? "";
    }
    chips.hidden = wanted.size === 0;
    return focusRemoved;
  }
  function paint() {
    if (disposed) return;
    element.dataset.status = status;
    let focusRemoved = paintChips();
    const focused = document.activeElement;
    clear.textContent = t("clearQuery");
    clear.hidden = !draft.query && !applied.query;
    submit.textContent = t("search");
    reset.textContent = t("resetFilters");
    retry.textContent = t("retrySearch");
    retry.hidden = status !== "error";
    reset.hidden =
      !applied.query &&
      !Object.values(applied.filters).some((values) => values.length) &&
      applied.sort === (schema.sortOptions[0]?.value ?? "");
    for (const option of anyOptions) option.textContent = t("any");
    if (labels.has("sort")) labels.get("sort").textContent = t("sort");
    dirty.textContent = sameCatalogValue(draft, applied)
      ? ""
      : t("unappliedFilters");
    let text =
      status === "loading"
        ? t("searching")
        : status === "error"
          ? t("searchFailed")
          : status === "ready"
            ? t(total === 0 ? "noResults" : "resultCount", {
                count: new Intl.NumberFormat(context.locale).format(total),
              })
            : "";
    if (total !== null && status !== "ready")
      text +=
        " " +
        t("previousCount", {
          count: new Intl.NumberFormat(context.locale).format(total),
        });
    if (message.textContent !== text) message.textContent = text;
    for (const control of [clear, reset, retry])
      if (control.hidden && control === focused) focusRemoved = true;
    if (focusRemoved) input.focus();
  }
  /** Host callbacks may re-enter or return a promise; late errors cannot overwrite a newer revision. */
  function notify(reason) {
    const key = revision,
      request = catalogSearchRequest(applied, key);
    const fail = (error) => {
      if (disposed || key !== revision) return;
      status = "error";
      paint();
      try {
        onError(error);
      } catch {
        /* Diagnostics must not break the search form. */
      }
    };
    try {
      const response = onChange(request, Object.freeze({ reason }));
      if (response && typeof response.then === "function")
        Promise.resolve(response).catch(fail);
    } catch (error) {
      fail(error);
    }
  }
  function publish(next, reason, force = false) {
    if (!force && sameCatalogValue(next, applied)) {
      paint();
      return;
    }
    applied = copyCatalogValue(next);
    const key = ++revision;
    status = "loading";
    paint();
    if (!disposed && key === revision) notify(reason);
  }
  function commit(reason, force = false) {
    publish(draft, reason, force);
  }
  function readDraft() {
    const value = {
      query: input.value,
      filters: {},
      sort: sortControl?.value ?? "",
    };
    for (const facet of schema.facets) {
      const control = controls.get(facet.id);
      value.filters[facet.id] = facet.multiple
        ? [...control.querySelectorAll("input:checked")].map(
            (input) => input.value,
          )
        : control.value
          ? [control.value]
          : [];
    }
    draft = catalogSearchValue(value, schema);
  }
  function inputEvent(event) {
    if (disposed || event.target !== input) return;
    readDraft();
    if (mode === "instant" && !composing && !event.isComposing) commit("input");
    else paint();
  }
  function changeEvent(event) {
    if (disposed || event.target === input) return;
    if (!facetRoot.contains(event.target)) return;
    readDraft();
    if (mode === "instant") commit("filter");
    else paint();
  }
  function submitEvent(event) {
    event.preventDefault();
    if (disposed || composing || event.isComposing) return;
    readDraft();
    commit("submit", true);
  }
  function compositionStart() {
    composing = true;
  }
  function compositionEnd() {
    if (disposed) return;
    composing = false;
    readDraft();
    if (mode === "instant") commit("input");
    else paint();
  }
  /** Removing a committed chip applies immediately without committing unrelated batch drafts. */
  function click(event) {
    if (disposed) return;
    const target = event.target.closest?.("button");
    if (!target) return;
    if (target === clear) {
      draft.query = "";
      const next = copyCatalogValue(applied);
      next.query = "";
      synchronize();
      publish(next, "clear");
      return;
    }
    if (target === reset) {
      draft = catalogSearchValue({}, schema);
      synchronize();
      publish(draft, "reset", true);
      return;
    }
    if (target === retry) {
      publish(applied, "retry", true);
      return;
    }
    if (!chips.contains(target) || !target.dataset.chip) return;
    const next = copyCatalogValue(applied),
      facet = target.dataset.facet,
      value = target.dataset.value;
    if (facet) {
      next.filters[facet] = next.filters[facet].filter(
        (item) => item !== value,
      );
      draft.filters[facet] = draft.filters[facet].filter(
        (item) => item !== value,
      );
    } else {
      next.query = "";
      draft.query = "";
    }
    synchronize();
    publish(next, "remove-filter");
  }
  input.addEventListener("input", inputEvent);
  facetRoot.addEventListener("change", changeEvent);
  form.addEventListener("submit", submitEvent);
  input.addEventListener("compositionstart", compositionStart);
  input.addEventListener("compositionend", compositionEnd);
  element.addEventListener("click", click);
  const off = context.subscribe(paint);
  synchronize();
  paint();
  return Object.freeze({
    element,
    input,
    get state() {
      return {
        revision,
        draft: copyCatalogValue(draft),
        applied: copyCatalogValue(applied),
        dirty: !sameCatalogValue(draft, applied),
        results: {
          status,
          total,
          revision: resultRevision,
          stale: total !== null && status !== "ready",
        },
        disposed,
      };
    },
    /** Silent host restore invalidates pending receipts without running or reinterpreting a query. */
    update(value) {
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new TypeError("Catalog search update required");
      if (disposed) throw new Error("Catalog search disposed");
      const next = catalogSearchValue({ ...draft, ...value }, schema);
      draft = next;
      applied = copyCatalogValue(next);
      revision++;
      status = "idle";
      synchronize();
      paint();
    },
    /** Ignore retired request results; no error string, card DOM or transport enters the status controller. */
    report(value) {
      if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value) ||
        Object.keys(value).some(
          (key) => !["revision", "status", "total"].includes(key),
        ) ||
        !Number.isSafeInteger(value.revision) ||
        value.revision < 0 ||
        !["idle", "loading", "ready", "error"].includes(value.status) ||
        (value.status === "ready" &&
          (!Number.isInteger(value.total) ||
            value.total < 0 ||
            value.total > 1e9))
      )
        throw new TypeError("Invalid catalog search report");
      if (disposed || value.revision !== revision) return false;
      status = value.status;
      if (status === "ready") {
        total = value.total;
        resultRevision = revision;
      }
      paint();
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      input.removeEventListener("input", inputEvent);
      facetRoot.removeEventListener("change", changeEvent);
      form.removeEventListener("submit", submitEvent);
      input.removeEventListener("compositionstart", compositionStart);
      input.removeEventListener("compositionend", compositionEnd);
      element.removeEventListener("click", click);
      off();
    },
  });
}

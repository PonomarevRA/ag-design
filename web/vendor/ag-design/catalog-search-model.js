import { catalogText } from "./catalog-card-contract.js";
/** Define bounded native facets once. The host owns index data, query interpretation and translated labels. */
export function catalogSearchSchema(facets = [], sortOptions = []) {
  if (
    !Array.isArray(facets) ||
    facets.length > 8 ||
    !Array.isArray(sortOptions) ||
    sortOptions.length > 20
  )
    throw new TypeError("Invalid catalog search schema");
  const seen = new Set();
  const normalized = Array.from(facets, (facet) => {
    const id = catalogText(facet?.id, "facet id", 64, true);
    if (
      !/^[a-z][a-z0-9_-]*$/i.test(id) ||
      ["constructor", "prototype"].includes(id) ||
      seen.has(id)
    )
      throw new TypeError("Invalid or duplicate facet id");
    seen.add(id);
    if (
      (facet.multiple !== undefined && typeof facet.multiple !== "boolean") ||
      !Array.isArray(facet.options) ||
      facet.options.length < 1 ||
      facet.options.length > 64
    )
      throw new TypeError("Invalid facet choices");
    return {
      id,
      label: catalogText(facet.label, "facet label", 160, true),
      multiple: facet.multiple ?? false,
      options: options(facet.options),
    };
  });
  return { facets: normalized, sortOptions: options(sortOptions) };
}
function options(items) {
  const seen = new Set();
  return Array.from(items, (item) => {
    const value = catalogText(item?.value, "option value", 128, true);
    if (seen.has(value)) throw new TypeError("Duplicate catalog choice");
    seen.add(value);
    return { value, label: catalogText(item.label, "option label", 160, true) };
  });
}
/** Canonical filter order makes restore, chips and dirty-state comparison deterministic. */
export function catalogSearchValue(value, schema) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some(
      (key) => !["query", "filters", "sort"].includes(key),
    )
  )
    throw new TypeError("Invalid catalog search value");
  const query = catalogText(value.query ?? "", "query", 512),
    input = value.filters === undefined ? {} : value.filters;
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some(
      (key) => !schema.facets.some((facet) => facet.id === key),
    )
  )
    throw new TypeError("Unknown catalog facet");
  const filters = Object.create(null);
  for (const facet of schema.facets) {
    const selected = Object.hasOwn(input, facet.id) ? input[facet.id] : [];
    if (
      !Array.isArray(selected) ||
      selected.length > 64 ||
      (!facet.multiple && selected.length > 1) ||
      Array.from(selected).some(
        (v) =>
          typeof v !== "string" ||
          !facet.options.some((option) => option.value === v),
      ) ||
      new Set(selected).size !== selected.length
    )
      throw new TypeError("Invalid catalog filter selection");
    filters[facet.id] = facet.options
      .filter((option) => selected.includes(option.value))
      .map((option) => option.value);
  }
  const sort = value.sort ?? schema.sortOptions[0]?.value ?? "";
  if (
    typeof sort !== "string" ||
    (schema.sortOptions.length
      ? !schema.sortOptions.some((option) => option.value === sort)
      : sort !== "")
  )
    throw new TypeError("Invalid catalog sort");
  return { query, filters, sort };
}
export function copyCatalogValue(value) {
  return {
    query: value.query,
    filters: Object.fromEntries(
      Object.entries(value.filters).map(([id, values]) => [id, [...values]]),
    ),
    sort: value.sort,
  };
}
export function sameCatalogValue(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
/** Machine callbacks receive their own frozen snapshot; no caller can mutate the internal filter arrays. */
export function catalogSearchRequest(value, revision) {
  const copy = copyCatalogValue(value);
  for (const values of Object.values(copy.filters)) Object.freeze(values);
  Object.freeze(copy.filters);
  return Object.freeze({ ...copy, revision });
}

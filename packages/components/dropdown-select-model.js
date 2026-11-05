/** Require literal bounded strings; option labels are never interpreted as markup. */
export function dropdownText(value, name, maximum, { nonempty = false } = {}) {
  if (typeof value !== "string" || value.length > maximum || (nonempty && !value.trim()))
    throw new TypeError(`${name} must be bounded literal text`);
  return value;
}

/** Validate a complete option replacement before changing native options, defaults or the open popup. */
export function dropdownOptions(options) {
  if (!Array.isArray(options) || options.length > 500)
    throw new TypeError("Options must contain at most500items");
  const items = [], known = new Map();
  for (const option of options) {
    if (!option || typeof option !== "object") throw new TypeError("An option is required");
    const value = dropdownText(option.value, "Option value", 80);
    const label = dropdownText(option.label, "Option label", 180, { nonempty: true });
    if (!value || known.has(value) || (option.disabled !== undefined && typeof option.disabled !== "boolean"))
      throw new TypeError("Option values must be unique and disabled must be boolean");
    const group = option.group === undefined ? undefined :
      dropdownText(option.group, "Option group", 180, { nonempty: true });
    const copy = Object.freeze({ value, label, disabled: !!option.disabled, group });
    items.push(copy); known.set(value, copy);
  }
  return { items, known };
}

/** Empty is the explicit placeholder choice; disabled/unknown real values are rejected. */
export function dropdownValue(value, known) {
  return typeof value === "string" && (value === "" || (known.has(value) && !known.get(value).disabled));
}

/** Match local labels with deterministic Unicode normalization and case folding, without remote queries. */
export function dropdownSearch(value) {
  return value.normalize("NFKC").toLowerCase();
}

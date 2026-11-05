/** Literal bounded catalog metadata; host owns truth, navigation and media resources. */
export function catalogText(value, name, max = 400, required = false) {
  if (value === undefined && !required) return "";
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  )
    throw new TypeError(`Invalid catalog ${name}`);
  return value;
}
/** Keep native navigation while excluding executable or opaque schemes; fragments remain usable offline. */
function safeHref(value, document) {
  catalogText(value, "href", 2048, true);
  if (value.startsWith("#")) return value;
  let url;
  try {
    url = new URL(value, document.baseURI);
  } catch {
    throw new TypeError("Invalid catalog href");
  }
  if (!["http:", "https:"].includes(url.protocol))
    throw new TypeError("Catalog links require HTTP(S) or a fragment");
  return value;
}
function action(value, document) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TypeError("Catalog action required");
  const label = catalogText(value.label, "action label", 160, true),
    href =
      value.href === undefined ? undefined : safeHref(value.href, document);
  if (
    (href !== undefined) === (typeof value.onAction === "function") ||
    (value.onAction !== undefined && typeof value.onAction !== "function")
  )
    throw new TypeError("Catalog action requires href or callback");
  if (
    (value.disabled !== undefined && typeof value.disabled !== "boolean") ||
    (href && value.disabled)
  )
    throw new TypeError("Only button actions can be disabled");
  const variant = value.variant ?? "secondary";
  if (!["primary", "secondary", "quiet"].includes(variant))
    throw new TypeError("Invalid catalog action variant");
  return {
    label,
    href,
    onAction: value.onAction,
    disabled: value.disabled ?? false,
    variant,
  };
}
const keys = new Set([
  "title",
  "summary",
  "eyebrow",
  "note",
  "facts",
  "badges",
  "priceText",
  "rating",
  "href",
  "onOpen",
  "primaryAction",
  "secondaryActions",
]);
/** Validate a full update before touching the rendered card or a borrowed media subtree. */
export function normalizeCatalogCard(value, document) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !keys.has(key))
  )
    throw new TypeError("Invalid catalog card data");
  const result = {};
  for (const [key, max] of [
    ["title", 400],
    ["summary", 1600],
    ["eyebrow", 160],
    ["note", 600],
    ["priceText", 300],
  ])
    result[key] = catalogText(value[key], key, max, key === "title");
  result.href =
    value.href === undefined ? undefined : safeHref(value.href, document);
  result.onOpen = value.onOpen;
  if (
    (result.onOpen !== undefined && typeof result.onOpen !== "function") ||
    (result.href && result.onOpen)
  )
    throw new TypeError("Card title requires href or onOpen, not both");
  const facts = value.facts ?? [],
    badges = value.badges ?? [],
    secondary = value.secondaryActions ?? [];
  if (
    !Array.isArray(facts) ||
    facts.length > 8 ||
    !Array.isArray(badges) ||
    badges.length > 4 ||
    !Array.isArray(secondary) ||
    secondary.length > 4
  )
    throw new TypeError("Catalog metadata exceeds its bounded slots");
  result.facts = Array.from(facts, (fact) => ({
    label: catalogText(fact?.label, "fact label", 100, true),
    value: catalogText(fact?.value, "fact value", 400, true),
  }));
  result.badges = Array.from(badges, (label) =>
    catalogText(label, "badge", 100, true),
  );
  result.primaryAction =
    value.primaryAction == null ? null : action(value.primaryAction, document);
  result.secondaryActions = Array.from(secondary, (item) =>
    action(item, document),
  );
  result.rating = null;
  if (value.rating !== undefined && value.rating !== null) {
    const { value: score, max = 5, count } = value.rating;
    if (
      !Number.isInteger(count) ||
      count < 0 ||
      count > 1e9 ||
      !Number.isFinite(max) ||
      max < 1 ||
      max > 10 ||
      (count === 0
        ? score !== undefined
        : !Number.isFinite(score) || score < 0 || score > max)
    )
      throw new TypeError(
        "Rating requires a real scale and count; zero reviews has no score",
      );
    result.rating = { value: score, max, count };
  }
  return result;
}
/** Exclude callbacks and DOM from machine-readable state; it is metadata, never verified quality. */
export function catalogCardState(current, disposed = false) {
  const action = (value) =>
    value
      ? {
          label: value.label,
          href: value.href ?? null,
          disabled: value.disabled,
          variant: value.variant,
        }
      : null;
  return {
    title: current.title,
    summary: current.summary,
    eyebrow: current.eyebrow,
    note: current.note,
    priceText: current.priceText,
    facts: current.facts.map((f) => ({ ...f })),
    badges: [...current.badges],
    rating: current.rating ? { ...current.rating } : null,
    href: current.href ?? null,
    hasOpenAction: !!current.onOpen,
    primaryAction: action(current.primaryAction),
    secondaryActions: current.secondaryActions.map(action),
    disposed,
  };
}

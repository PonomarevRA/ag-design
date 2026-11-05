import { resolveI18n } from "./i18n.js";
import { applyControlGeometry } from "./geometry.js";
let sequence = 0;

/** Autonyms stay readable even when the surrounding interface is in an unfamiliar language. */
export function languageName(locale) {
  const canonical = Intl.getCanonicalLocales(locale)[0];
  if (!canonical) throw new TypeError("A language tag is required");
  if (canonical === "en") return "English";
  if (canonical === "ru") return "Русский";
  try {
    return (
      new Intl.DisplayNames([canonical], { type: "language" }).of(canonical) ||
      canonical
    );
  } catch {
    return canonical;
  }
}

/** Switch an explicit enabled locale in place. The host owns persistence, navigation and content translation.
 * Compact uses a native select; inline exposes all choices; auto exposes a pair and compacts larger sets.
 * Appearance never chooses a page position or changes navigation/persistence ownership.
 */
export function createLanguageSwitcher({
  document = globalThis.document,
  i18n,
  variant = "compact",
  appearance = "outlined",
  labelVisibility = "visible",
  label,
  names = {},
  density = "comfortable",
  onChange,
} = {}) {
  if (
    !["compact", "inline", "auto"].includes(variant) ||
    !["outlined", "quiet"].includes(appearance) ||
    !["visible", "sr-only"].includes(labelVisibility) ||
    !["compact", "comfortable", "touch"].includes(density) ||
    (label !== undefined &&
      (typeof label !== "string" || !label.trim() || label.length > 180)) ||
    !names ||
    typeof names !== "object" ||
    Array.isArray(names) ||
    Object.keys(names).length > 32 ||
    (onChange !== undefined && typeof onChange !== "function")
  )
    throw new TypeError(
      "A bounded language switcher configuration is required",
    );
  const customNames = new Map();
  for (const [locale, name] of Object.entries(names)) {
    if (typeof name !== "string" || !name.trim() || name.length > 180)
      throw new TypeError("Language names must be bounded literal text");
    customNames.set(Intl.getCanonicalLocales(locale)[0], name);
  }
  const context = resolveI18n(document, i18n),
    element = document.createElement("div"),
    caption = document.createElement("label"),
    row = document.createElement("div"),
    single = document.createElement("span"),
    select = document.createElement("select"),
    choices = document.createElement("div");
  const id = `ag-language-${++sequence}`;
  element.className = `ag-language-switcher ag-language-switcher--${appearance}`;
  caption.id = `${id}-label`;
  caption.className = "ag-language-switcher__label";
  caption.classList.toggle(
    "ag-language-switcher__label--sr-only",
    labelVisibility === "sr-only",
  );
  row.className = "ag-language-switcher__row";
  single.className = "ag-language-switcher__single";
  select.className = "ag-language-switcher__select";
  select.id = id;
  caption.htmlFor = id;
  choices.className = "ag-language-switcher__choices";
  choices.setAttribute("role", "group");
  choices.setAttribute("aria-labelledby", caption.id);
  // The globe is supplemental. Visible names and an associated label carry the meaning.
  const globe = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  globe.setAttribute("viewBox", "0 0 24 24");
  globe.setAttribute("aria-hidden", "true");
  globe.setAttribute("focusable", "false");
  const path = document.createElementNS(globe.namespaceURI, "path");
  path.setAttribute(
    "d",
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c4 5 4 13 0 18-4-5-4-13 0-18Z",
  );
  globe.append(path);
  row.append(globe);
  // Preserve the DOM shape of explicit legacy variants; only auto needs both interchangeable controls.
  if (variant !== "inline") row.append(select);
  if (variant !== "compact") row.append(choices);
  row.append(single);
  element.append(caption, row);
  let disposed = false,
    resolvedVariant = variant === "auto" ? "inline" : variant;
  const controls = new Map(),
    restores = [];
  restores.push(applyControlGeometry(select, { density }));
  const nameOf = (locale) => customNames.get(locale) ?? languageName(locale);

  /** Validate against the current policy rather than a stale option list; only real user changes notify the host. */
  function choose(locale) {
    if (
      disposed ||
      !context.availableLocales.includes(locale) ||
      context.locale === locale
    )
      return;
    context.setLocale(locale);
    onChange?.(context.locale, context);
  }
  function changed() {
    choose(select.value);
  }
  select.addEventListener("change", changed);

  /** Update existing nodes and selected state without rebuilding the surrounding screen or taking focus. */
  function refresh() {
    if (disposed) return;
    const focused = element.contains(document.activeElement)
      ? document.activeElement
      : null;
    const locales = context.availableLocales,
      only = locales.length === 1;
    resolvedVariant = variant;
    if (variant === "auto")
      resolvedVariant = locales.length > 2 ? "compact" : "inline";
    element.dataset.variant = resolvedVariant;
    element.classList.toggle(
      "ag-language-switcher--compact",
      resolvedVariant === "compact",
    );
    element.classList.toggle(
      "ag-language-switcher--inline",
      resolvedVariant === "inline",
    );
    element.lang = context.locale;
    element.dir = context.direction;
    caption.textContent = label ?? context.t("ui.language");
    element.dataset.singleLocale = String(only);
    single.hidden = !only;
    single.textContent = nameOf(context.locale);
    single.lang = context.locale;
    single.dir = "auto";
    select.hidden = only || resolvedVariant !== "compact";
    select.disabled = only;
    choices.hidden = only || resolvedVariant !== "inline";
    // Keep the dormant native options aligned too; enabled-policy inspection never exposes stale locales.
    for (const option of [...select.options])
      if (!locales.includes(option.value)) option.remove();
    for (const locale of locales) {
      let option = [...select.options].find((node) => node.value === locale);
      if (!option) {
        option = document.createElement("option");
        option.value = locale;
        select.append(option);
      }
      option.textContent = nameOf(locale);
      option.lang = locale;
      option.dir = "auto";
    }
    select.value = context.locale;
    select.lang = context.locale;
    if (resolvedVariant === "compact") {
      caption.htmlFor = id;
      for (const control of controls.values()) {
        control.button.removeEventListener("click", control.click);
        control.restore();
        control.button.remove();
      }
      controls.clear();
    } else {
      caption.removeAttribute("for");
      for (const [locale, control] of controls) {
        if (!locales.includes(locale)) {
          control.button.removeEventListener("click", control.click);
          control.restore();
          control.button.remove();
          controls.delete(locale);
        }
      }
      for (const locale of locales) {
        let control = controls.get(locale);
        if (!control) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "ag-language-switcher__choice";
          button.lang = locale;
          button.dir = "auto";
          const click = () => choose(locale);
          button.addEventListener("click", click);
          control = {
            button,
            click,
            restore: applyControlGeometry(button, { density }),
          };
          controls.set(locale, control);
          choices.append(button);
        }
        control.button.textContent = nameOf(locale);
        control.button.setAttribute(
          "aria-pressed",
          String(locale === context.locale),
        );
      }
    }
    if (element.hasAttribute("tabindex") || focused)
      element.setAttribute(
        "aria-label",
        `${caption.textContent}: ${nameOf(context.locale)}`,
      );
    // A policy edit can remove the focused choice; keep a stable nearby focus anchor.
    if (
      focused &&
      (only ||
        !element.contains(focused) ||
        (focused === select && select.hidden))
    ) {
      if (!only && resolvedVariant === "compact")
        select.focus({ preventScroll: true });
      else if (!only && controls.has(context.locale))
        controls.get(context.locale).button.focus({ preventScroll: true });
      else {
        element.tabIndex = -1;
        element.focus({ preventScroll: true });
      }
    }
  }
  const off = context.subscribe(refresh);
  refresh();
  return {
    element,
    get select() {
      return resolvedVariant === "compact" ? select : null;
    },
    get value() {
      return context.locale;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      off();
      select.removeEventListener("change", changed);
      for (const control of controls.values()) {
        control.button.removeEventListener("click", control.click);
        control.restore();
      }
      controls.clear();
      for (const restore of restores) restore();
      onChange = undefined;
    },
  };
}

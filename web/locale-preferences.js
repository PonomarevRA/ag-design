import {
  createI18n,
  setDocumentI18n,
  createI18nBindings,
  createSelect,
  createLanguageSwitcher,
  createButton,
} from "./vendor/ag-design/index.js";
const KEY = "ag-design:locale:v1",
  runtimes = new WeakMap();

/** Read only the versioned language preference. Corrupt/disabled storage never prevents opening the system. */
export function readLocalePreferences(storage) {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return null;
    if (raw.length > 4096) return null;
    const value = JSON.parse(raw);
    if (
      value.version !== 1 ||
      Object.keys(value).some(
        (k) =>
          !["version", "locale", "fallbackLocale", "availableLocales"].includes(
            k,
          ),
      )
    )
      return null;
    const context = createI18n({
      locale: value.locale,
      fallbackLocale: value.fallbackLocale,
      availableLocales: value.availableLocales,
    });
    const result = {
      locale: context.locale,
      fallbackLocale: context.fallbackLocale,
      availableLocales: context.availableLocales,
    };
    context.dispose();
    return result;
  } catch {
    return null;
  }
}
/** Save configuration only, without user data or translation documents; persistence failure stays visible to the caller. */
export function writeLocalePreferences(storage, context) {
  try {
    storage?.setItem(
      KEY,
      JSON.stringify({
        version: 1,
        locale: context.locale,
        fallbackLocale: context.fallbackLocale,
        availableLocales: context.availableLocales,
      }),
    );
    return Boolean(storage);
  } catch {
    return false;
  }
}
/** Own one provider per document so separate bundles share a context object rather than singleton module state. */
export function getLocaleRuntime(document = globalThis.document) {
  if (runtimes.has(document)) return runtimes.get(document);
  let storage;
  try {
    storage = document.defaultView.localStorage;
  } catch {}
  const preference = readLocalePreferences(storage);
  const context = createI18n(
    preference ?? {
      locale:
        document.documentElement.lang ||
        document.defaultView.navigator.language,
      availableLocales: ["en", "ru"],
      fallbackLocale: "en",
    },
  );
  const detach = setDocumentI18n(document, context);
  const runtime = {
    context,
    save: () => writeLocalePreferences(storage, context),
    dispose() {
      detach();
      context.dispose();
      runtimes.delete(document);
    },
  };
  runtimes.set(document, runtime);
  return runtime;
}

/** Real settings use explicit message keys; changing a language never rebuilds the surrounding application. */
export function createLocaleSettings({
  document = globalThis.document,
  runtime = getLocaleRuntime(document),
  compact = false,
  supportedLocales,
} = {}) {
  const context = runtime.context,
    bind = createI18nBindings(context),
    element = document.createElement("section");
  element.className = "ag-locale-settings";
  const title = document.createElement("h3"),
    hint = document.createElement("p"),
    status = document.createElement("p");
  hint.className = "muted";
  status.setAttribute("role", "status");
  bind.text(title, "ui.settings");
  bind.text(hint, "ui.hint");
  const choices = [
    ...new Set(supportedLocales ?? ["en", "ru", ...context.availableLocales]),
  ];
  if (
    !choices.length ||
    choices.length > 32 ||
    context.availableLocales.some((locale) => !choices.includes(locale))
  )
    throw new TypeError(
      "Settings locale policy must include every active locale",
    );
  const name = (locale) =>
    locale === "en"
      ? context.t("ui.english")
      : locale === "ru"
        ? context.t("ui.russian")
        : locale;
  const language = createLanguageSwitcher({
    document,
    i18n: context,
    variant: "inline",
    onChange() {
      notify(runtime.save());
    },
  });
  const fallback = createSelect({
    document,
    label: context.t("ui.fallback"),
    options: choices.map((value) => ({ value, label: name(value) })),
    value: context.fallbackLocale,
  });
  const group = document.createElement("fieldset"),
    legend = document.createElement("legend");
  bind.text(legend, "ui.languages");
  group.append(legend);
  const boxes = new Map();
  for (const locale of choices) {
    const label = document.createElement("label"),
      input = document.createElement("input"),
      text = document.createElement("span");
    input.type = "checkbox";
    input.value = locale;
    input.checked = context.availableLocales.includes(locale);
    text.textContent = name(locale);
    label.append(input, text);
    group.append(label);
    boxes.set(locale, { input, text });
  }
  let unbindStatus;
  /** Replace the one status binding rather than retaining a binding for every user action. */
  function notify(persisted) {
    unbindStatus?.();
    unbindStatus = bind.text(
      status,
      persisted ? "ui.localSaved" : "ui.localUnsaved",
    );
  }
  const apply = createButton({
    document,
    label: context.t("ui.apply"),
    variant: "primary",
    onClick: () => {
      const availableLocales = choices.filter(
        (locale) => boxes.get(locale).input.checked,
      );
      if (!availableLocales.length) {
        unbindStatus?.();
        unbindStatus = bind.text(status, "ui.atLeastOne");
        return;
      }
      const fallbackLocale = availableLocales.includes(fallback.value)
        ? fallback.value
        : availableLocales.includes("en")
          ? "en"
          : availableLocales[0];
      context.configure({
        availableLocales,
        fallbackLocale,
        locale: language.value,
      });
      notify(runtime.save());
    },
  });
  let previousPolicy = "";
  /** Re-label existing controls/options in place so the active control and unsaved fields stay mounted. */
  function refresh() {
    fallback.element.querySelector("label").textContent =
      context.t("ui.fallback");
    for (const control of [fallback])
      for (const option of control.select.options) {
        option.textContent = name(option.value);
        option.disabled = !context.availableLocales.includes(option.value);
        option.hidden = option.disabled;
      }
    const policy = JSON.stringify([
      context.availableLocales,
      context.fallbackLocale,
    ]);
    const policyChanged = policy !== previousPolicy;
    previousPolicy = policy;
    if (policyChanged) fallback.setValue(context.fallbackLocale);
    language.element.hidden = context.availableLocales.length < 2;
    fallback.element.hidden = context.availableLocales.length < 2;
    for (const [locale, box] of boxes) {
      if (policyChanged)
        box.input.checked = context.availableLocales.includes(locale);
      box.text.textContent = name(locale);
    }
    apply.querySelector(".ag-nav__label").textContent = context.t("ui.apply");
  }
  const off = context.subscribe(refresh);
  refresh();
  const form = document.createElement("div");
  form.className = "ag-locale-settings__fields";
  form.dataset.agFormRow = "auto";
  fallback.element.dataset.agFormField = "";
  form.append(language.element, fallback.element);
  element.append(title, hint, form, group, apply, status);
  if (compact) element.classList.add("ag-locale-settings--compact");
  return {
    element,
    dispose() {
      off();
      bind.dispose();
      language.dispose();
      fallback.dispose();
    },
  };
}

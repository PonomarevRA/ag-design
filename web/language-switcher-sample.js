import {
  createLanguageSwitcher,
  createI18n,
} from "./vendor/ag-design/index.js";

/** Real header/content/sidebar-footer compositions share an isolated language policy, never host preferences. */
export function buildLanguageSwitcherSample(
  props = {},
  document = globalThis.document,
) {
  const element = document.createElement("section");
  const context = createI18n({
    locale: "ru",
    availableLocales: ["ru", "en"],
    messages: { fr: { "ui.language": "Langue de l’interface" } },
  });
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  element.style.cssText =
    "display:grid;gap:12px;min-width:0;width:100%;align-self:start";
  const controllers = [],
    captions = [],
    menus = [];
  const placements =
    props.placement === "all"
      ? ["header", "navigation-footer", "content"]
      : [props.placement ?? "header"];
  // A catalogue thumbnail stays bounded; full placement comparisons are available in the sandbox.
  status.style.cssText =
    "position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap";
  /** A frame names its actual role; a footer reserves space outside its intentionally long contents list. */
  for (const placement of placements) {
    const frame = document.createElement("section"),
      caption = document.createElement("p");
    frame.dataset.languagePlacement = placement;
    frame.style.cssText =
      "border:1px solid var(--ag-border);border-radius:var(--ag-radius-control,7px);padding:12px;min-width:0;display:grid;gap:12px";
    caption.style.cssText = "font-size:12px;color:var(--ag-muted);margin:0";
    captions.push({ placement, caption });
    frame.append(caption);
    const control = createLanguageSwitcher({
      document,
      i18n: context,
      variant: props.variant ?? (placement === "content" ? "compact" : "auto"),
      appearance:
        props.appearance ?? (placement === "content" ? "outlined" : "quiet"),
      labelVisibility: placement === "header" ? "sr-only" : "visible",
    });
    controllers.push(control);
    if (placement === "navigation-footer") {
      const panel = document.createElement("div"),
        list = document.createElement("div"),
        footer = document.createElement("footer");
      panel.style.cssText =
        "display:flex;flex-direction:column;block-size:180px;min-height:0";
      list.style.cssText =
        "flex:1;min-height:0;overflow:auto;padding-block-end:8px;scrollbar-width:none";
      const text = document.createElement("p");
      text.style.cssText = "margin:0;line-height:1.8;white-space:pre-line";
      text.textContent =
        "01 / Overview\n02 / Typography\n03 / Color\n04 / Data\n05 / Motion\n06 / Accessibility\n07 / Components\n08 / Validation";
      menus.push(text);
      list.append(text);
      footer.style.cssText =
        "flex:none;border-block-start:1px solid var(--ag-border);padding-block-start:10px";
      footer.append(control.element);
      panel.append(list, footer);
      frame.append(panel);
    } else frame.append(control.element);
    element.append(frame);
  }
  const languages = document.createElement("button");
  languages.type = "button";
  languages.dataset.action = "toggle-language-count";
  /** Change only this sample's policy to demonstrate automatic pair/list transitions. */
  function toggleCount() {
    const enabled =
      context.availableLocales.length === 2 ? ["ru", "en", "fr"] : ["ru", "en"];
    const locale = enabled.includes(context.locale) ? context.locale : "en";
    context.configure({ availableLocales: enabled, locale });
  }
  languages.addEventListener("click", toggleCount);
  /** Relabel only owned demonstration prose; examples keep their own locale context. */
  function refresh() {
    const ru = context.locale.startsWith("ru");
    element.lang = ru ? "ru" : "en";
    const pair = context.availableLocales.length === 2;
    const toggleLabels = ru
      ? ["Вернуть два языка", "Пример с тремя языками"]
      : ["Return to two languages", "Try three languages"];
    languages.textContent = toggleLabels[Number(pair)];
    for (const menu of menus)
      menu.textContent = ru
        ? "01 / Обзор\n02 / Типографика\n03 / Цвет\n04 / Данные\n05 / Движение\n06 / Доступность\n07 / Компоненты\n08 / Проверка"
        : "01 / Overview\n02 / Typography\n03 / Color\n04 / Data\n05 / Motion\n06 / Accessibility\n07 / Components\n08 / Validation";
    for (const { placement, caption } of captions)
      caption.textContent = ru
        ? {
            header: "Шапка сайта · служебная навигация",
            content: "У заголовка · язык этой страницы",
            "navigation-footer": "Подвал меню · вне прокрутки глав",
          }[placement]
        : {
            header: "Site header · utility navigation",
            content: "Near the heading · this page's language",
            "navigation-footer":
              "Navigation footer · outside the scrolling list",
          }[placement];
    status.textContent = ru
      ? "Примеры переключаются вместе. Настройки сайта не меняются."
      : "Examples switch together. Website preferences stay unchanged.";
  }
  const off = context.subscribe(refresh);
  refresh();
  element.append(languages, status);
  return {
    element,
    interact: () => context.setLocale(context.locale === "ru" ? "en" : "ru"),
    dispose() {
      off();
      languages.removeEventListener("click", toggleCount);
      for (const control of controllers) control.dispose();
      context.dispose();
    },
  };
}

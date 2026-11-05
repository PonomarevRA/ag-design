import { disposeOnPageExit } from "./demo-page-lifecycle.js";
import { createDemoState, resetDemoState } from "./demo-state.js";
import { mountDemoRecords } from "./demo-records.js";
import { demoConfig } from "./demo-config.js";
import { mountFitnessShell } from "./demo-fitness-shell.js";

/** Create literal demo chrome; no authored or saved text is interpreted as markup. */
function element(doc, tag, text, className) {
  const node = doc.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

/** Attach real local views/settings to an existing scenario without rebuilding its controls or drafts. */
export function mountDemoSystem({ document: doc, onApply, getNewRecord } = {}) {
  doc ||= document;
  const win = doc.defaultView;
  const kind = doc.documentElement.dataset.example;
  const style = doc.documentElement.dataset.style;
  const config = demoConfig(kind);
  const main = doc.querySelector("main");
  if (!config || !main || main.dataset.demoMounted) return null;
  if (style === "amber-circuit") {
    config.title = "Пульт сигналов";
    config.description =
      "Настройте канал, проверьте поток и примените локальную сцену.";
  }
  if (style === "graphite-gold") {
    const channels = ["Освещение", "Звук", "Климат", "Медиа"];
    for (let index = 0; index < channels.length; index++)
      config.records.fields[index + 1].label = `${channels[index]}, %`;
  }
  main.dataset.demoMounted = "true";
  const events = new win.AbortController();
  const store = createDemoState({
    window: win,
    style,
    scope: "preferences",
    initial: {
      name: config.title,
      density: "comfortable",
      motion: "system",
      view: "work",
    },
    validate: (value) =>
      ["comfortable", "compact"].includes(value.density) &&
      ["system", "reduce"].includes(value.motion) &&
      ["work", "records", "settings", "components"].includes(value.view),
  });
  const settings = store.state;
  const original = [...main.children];
  const oldHeader = doc.querySelector(".dashboard-header");
  if (oldHeader) {
    const period = oldHeader
      .querySelector("#analytics-period")
      ?.closest("label");
    if (period) {
      const controls = element(
        doc,
        "section",
        undefined,
        "demo-primary-controls demo-wide",
      );
      controls.setAttribute("aria-label", "Период аналитики");
      controls.append(period);
      main.prepend(controls);
      original.unshift(controls);
    }
    oldHeader.hidden = true;
  }
  for (const link of doc.querySelectorAll('a[href="#overview"]'))
    link.href = "#demo-work";
  const fitnessScreens =
    kind === "fitness"
      ? original.filter((child) => child.classList.contains("screen"))
      : [];
  const externalContext =
    kind === "learning" ? doc.querySelector(".learning-context") : null;
  const heading = element(
    doc,
    "header",
    undefined,
    "demo-system-header demo-wide",
  );
  const breadcrumb = element(
    doc,
    "p",
    "Локальное рабочее пространство",
    "demo-breadcrumb",
  );
  const headingRow = element(doc, "div", undefined, "demo-heading-row");
  const title = element(doc, "h1", settings.name);
  title.tabIndex = -1;
  const badge = element(
    doc,
    "span",
    "Демо · на этом устройстве",
    "demo-local-badge",
  );
  headingRow.append(title, badge);
  const description = element(doc, "p", config.description, "demo-muted");
  const nav = element(doc, "nav", undefined, "demo-system-nav");
  nav.setAttribute("aria-label", "Экраны системы");
  const labels = {
    work: "Рабочая область",
    records: config.records.title,
    settings: "Настройки",
    components: "Компоненты AG",
  };
  for (const [id, label] of Object.entries(labels)) {
    const link = element(doc, "a", label);
    link.href = `#demo-${id}`;
    link.dataset.demoView = id;
    nav.append(link);
  }
  heading.append(breadcrumb, headingRow, description, nav);
  main.prepend(heading);
  const records = mountDemoRecords({
    document: doc,
    style,
    config: config.records,
    onApply,
    getNewRecord,
  });
  main.append(records.element);
  const preferences = element(
    doc,
    "section",
    undefined,
    "demo-preferences demo-wide",
  );
  preferences.id = "demo-settings";
  const form = element(doc, "form", undefined, "demo-preferences-form");
  form.setAttribute("aria-label", "Настройки примера");
  form.append(
    element(doc, "h2", "Настройки пространства"),
    element(
      doc,
      "p",
      "Эти параметры относятся только к текущему примеру.",
      "demo-muted",
    ),
  );
  const fields = element(doc, "div", undefined, "demo-fields");
  const nameLabel = element(doc, "label", "Название пространства");
  const name = element(doc, "input");
  name.required = true;
  name.maxLength = 80;
  name.value = settings.name;
  nameLabel.append(name);
  fields.append(nameLabel);
  const selections = {};
  for (const [key, label, options] of [
    [
      "density",
      "Плотность",
      [
        ["comfortable", "Комфортная"],
        ["compact", "Компактная"],
      ],
    ],
    [
      "motion",
      "Анимация",
      [
        ["system", "Как в системе"],
        ["reduce", "Меньше движения"],
      ],
    ],
  ]) {
    const field = element(doc, "label", label);
    const select = element(doc, "select");
    for (const [value, text] of options) {
      const option = element(doc, "option", text);
      option.value = value;
      select.append(option);
    }
    select.value = settings[key];
    selections[key] = select;
    field.append(select);
    fields.append(field);
  }
  const submit = element(doc, "button", "Сохранить настройки", "demo-primary");
  submit.type = "submit";
  const status = element(
    doc,
    "p",
    "Сохранённые записи остаются после перезагрузки.",
    "demo-save-status",
  );
  status.setAttribute("role", "status");
  form.append(fields, submit, status);
  const reset = element(doc, "button", "Сбросить этот пример", "demo-reset");
  reset.type = "button";
  const confirm = element(doc, "div", undefined, "demo-reset-confirm");
  confirm.hidden = true;
  confirm.append(
    element(
      doc,
      "p",
      "Восстановить исходные демонстрационные данные? Локальные изменения только этого примера будут удалены.",
    ),
  );
  const yes = element(doc, "button", "Восстановить демо");
  yes.type = "button";
  const no = element(doc, "button", "Отмена");
  no.type = "button";
  confirm.append(yes, no);
  preferences.append(
    form,
    element(doc, "hr"),
    element(doc, "h2", "Демонстрационные данные"),
    element(
      doc,
      "p",
      "Данные сохраняются в этом браузере. Внешние сервисы не подключены.",
      "demo-muted",
    ),
    reset,
    confirm,
  );
  main.append(preferences);

  /** Apply user-owned presentation settings without changing host semantic palette or field values. */
  function appearance() {
    doc.documentElement.dataset.demoDensity = settings.density;
    doc.documentElement.dataset.demoMotion = settings.motion;
  }
  let fitnessShell = null;
  /** Switch only declared view groups; arbitrary hashes remain ordinary anchors in the work view. */
  function route(focus = false) {
    const hash = win.location.hash;
    const desired = hash.startsWith("#demo-")
      ? hash.slice(6)
      : hash === "#ag-components"
        ? "components"
        : hash
          ? "work"
          : settings.view;
    const view = Object.hasOwn(labels, desired) ? desired : "work";
    settings.view = view;
    for (const child of original)
      child.hidden =
        view === "components"
          ? child.id !== "ag-components"
          : view !== "work" || child.id === "ag-components";
    const fitnessIndex =
      hash === "#today-title" ? 1 : hash === "#progress-title" ? 2 : 0;
    for (const [index, screen] of fitnessScreens.entries())
      screen.hidden = view !== "work" || index !== fitnessIndex;
    if (externalContext) externalContext.hidden = view !== "work";
    records.element.hidden = view !== "records";
    preferences.hidden = view !== "settings";
    title.textContent = view === "work" ? settings.name : labels[view];
    description.textContent =
      view === "records"
        ? config.records.description
        : view === "settings"
          ? "Ваши предпочтения и локальные данные."
          : config.description;
    for (const link of nav.querySelectorAll("a")) {
      if (link.dataset.demoView === view)
        link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    fitnessShell?.update(hash, view, focus);
    store.save();
    if (focus && hash.startsWith("#demo-"))
      title.focus({ preventScroll: false });
    else if (focus && hash)
      doc.getElementById(hash.slice(1))?.scrollIntoView?.({ block: "start" });
    const sideLinks = [...doc.querySelectorAll('aside nav a[href^="#"]')];
    const currentSide =
      view === "records" || view === "settings"
        ? sideLinks.find((link) => link.hash === `#demo-${view}`)
        : sideLinks.find((link) => link.hash === hash) || sideLinks[0];
    for (const link of sideLinks) {
      if (link === currentSide) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
  }
  form.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      if (!form.reportValidity() || !name.value.trim()) return;
      settings.name = name.value.trim();
      settings.density = selections.density.value;
      settings.motion = selections.motion.value;
      appearance();
      status.textContent = store.save()
        ? "Настройки сохранены в этом браузере."
        : "Хранилище недоступно: настройки действуют до перезагрузки.";
    },
    { signal: events.signal },
  );
  reset.addEventListener(
    "click",
    () => {
      confirm.hidden = false;
      reset.hidden = true;
      yes.focus();
    },
    { signal: events.signal },
  );
  no.addEventListener(
    "click",
    () => {
      confirm.hidden = true;
      reset.hidden = false;
      reset.focus();
    },
    { signal: events.signal },
  );
  yes.addEventListener(
    "click",
    () => {
      if (resetDemoState(win, style)) win.location.reload();
      else
        status.textContent =
          "Не удалось сбросить данные: хранилище недоступно.";
    },
    { signal: events.signal },
  );
  win.addEventListener("hashchange", () => route(true), {
    signal: events.signal,
  });
  const stopExitCleanup = disposeOnPageExit(win, () => {
    events.abort();
    records.dispose();
  });
  doc.documentElement.classList.add("demo-system-ready");
  if (kind === "cms")
    for (const link of doc.querySelectorAll(
      'nav a[href="#cms-media"], nav a[href="#cms-settings"]',
    )) {
      link.href =
        link.hash === "#cms-media" ? "#demo-records" : "#demo-settings";
    }
  const sidebarNav = doc.querySelector("aside nav");
  if (sidebarNav)
    for (const view of ["records", "settings"]) {
      if (sidebarNav.querySelector(`a[href="#demo-${view}"]`)) continue;
      const link = element(doc, "a");
      link.href = `#demo-${view}`;
      link.className = sidebarNav.querySelector("a")?.className || "";
      const icon = element(doc, "span", view === "records" ? "▤" : "⚙");
      icon.setAttribute("aria-hidden", "true");
      link.append(icon, doc.createTextNode(labels[view]));
      sidebarNav.append(link);
    }
  const sideMenu = sidebarNav
    ? element(doc, "details", undefined, "demo-side-menu")
    : null;
  const menuMedia = sideMenu ? win.matchMedia?.("(min-width: 761px)") : null;
  /** Keep ordinary desktop navigation and expose the same links through a native narrow-screen disclosure. */
  function responsiveMenu() {
    if (sideMenu && !sideMenu.contains(doc.activeElement))
      sideMenu.open = menuMedia ? menuMedia.matches : win.innerWidth > 760;
  }
  if (sideMenu) {
    const summary = element(doc, "summary", "Разделы");
    sidebarNav.before(sideMenu);
    sideMenu.append(summary, sidebarNav);
    responsiveMenu();
    menuMedia?.addEventListener("change", responsiveMenu, {
      signal: events.signal,
    });
  }
  if (kind === "fitness")
    fitnessShell = mountFitnessShell({ document: doc, main, heading, title });
  appearance();
  route();
  return {
    records,
    dispose() {
      stopExitCleanup();
      events.abort();
      records.dispose();
    },
  };
}

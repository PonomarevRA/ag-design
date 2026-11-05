/** Give the fitness demo a phone-sized application shell while preserving its native routes and data controls. */
export function mountFitnessShell({ document: doc, main, heading, title }) {
  const scroll = doc.createElement("div");
  scroll.className = "fitness-app-content";
  for (const child of [...main.children]) {
    if (child !== heading) scroll.append(child);
  }
  main.append(scroll);
  const nav = heading.querySelector(".demo-system-nav");
  nav.hidden = true;
  heading.querySelector(".demo-breadcrumb").textContent = "CORAL PULSE";
  heading.querySelector(".demo-local-badge").hidden = true;
  heading.querySelector(".demo-muted").hidden = true;
  const actions = doc.createElement("div");
  actions.className = "fitness-header-actions";
  const settings = doc.createElement("a");
  settings.href = "#demo-settings";
  settings.textContent = "Настройки";
  const about = doc.createElement("details");
  about.className = "fitness-about";
  const summary = doc.createElement("summary");
  summary.textContent = "О демо";
  const menu = doc.createElement("div");
  const notice = doc.createElement("p");
  notice.textContent =
    "Локальное демо. Данные синтетические; устройства и сервисы не подключены.";
  menu.append(notice);
  for (const [href, label] of [
    ["#demo-components", "Компоненты AG"],
    ["/#styles", "Все стили ↗"],
  ]) {
    const link = doc.createElement("a");
    link.href = href;
    link.textContent = label;
    menu.append(link);
  }
  about.append(summary, menu);
  actions.append(settings, about);
  heading.append(actions);
  const tabs = doc.createElement("nav");
  tabs.className = "fitness-app-tabs";
  tabs.setAttribute("aria-label", "Разделы Coral Pulse");
  const destinations = [
    [
      "#activities-title",
      "Обзор",
      ["M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z"],
    ],
    ["#today-title", "Активность", ["M3 12h4l3-7 4 14 3-7h4"]],
    ["#progress-title", "Прогресс", ["M3 18l7-7 4 4 7-10 M15 5h6v6"]],
    ["#demo-records", "Журнал", ["M5 3h14v18H5z M9 7h6 M9 11h6 M9 15h4"]],
  ];
  for (const [href, label, paths] of destinations) {
    const link = doc.createElement("a");
    link.href = href;
    const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    for (const data of paths) {
      const path = doc.createElementNS(svg.namespaceURI, "path");
      path.setAttribute("d", data);
      svg.append(path);
    }
    const text = doc.createElement("span");
    text.textContent = label;
    link.append(svg, text);
    tabs.append(link);
  }
  main.append(tabs);
  /** Keep one current destination and restart the inner viewport only on an explicit route change. */
  function update(hash, view, focus) {
    const destination =
      view === "records"
        ? "#demo-records"
        : hash === "#today-title" || hash === "#progress-title"
          ? hash
          : "#activities-title";
    const names = {
      "#activities-title": "Обзор",
      "#today-title": "Активность",
      "#progress-title": "Прогресс",
      "#demo-records": "Журнал тренировок",
    };
    title.textContent =
      view === "settings"
        ? "Настройки"
        : view === "components"
          ? "Компоненты AG"
          : names[destination];
    for (const link of tabs.querySelectorAll("a")) {
      if ((view === "work" || view === "records") && link.hash === destination)
        link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    if (view === "settings") settings.setAttribute("aria-current", "page");
    else settings.removeAttribute("aria-current");
    if (focus) {
      about.open = false;
      scroll.scrollTop = 0;
    }
  }
  return { update };
}

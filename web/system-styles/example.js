import { mountStyleChoice } from "./vendor/lab/choices.js";
import { disposeOnPageExit } from "./demo-page-lifecycle.js";
import { createDemoState } from "./demo-state.js";
import { mountDemoSystem } from "./demo-shell.js?v=demo-systems-5";
import { createStyleChart } from "./style-chart.js";
import {
  createWorkspace,
  projectSummary,
  visibleProjects,
} from "./example-model.js";

/** Mount a browser-owned project/task workspace; persisted values remain bounded synthetic local data. */
export function mountExample(doc = document) {
  const initial = {
    projects: createWorkspace(),
    selectedId: "account",
    filter: "all",
    nextId: 1,
  };
  const store = createDemoState({
    window: doc.defaultView,
    style: doc.documentElement.dataset.style,
    scope: "workspace",
    initial,
    validate: (value) =>
      value.projects.length > 0 &&
      value.projects.length <= 50 &&
      value.projects.some((project) => project.id === value.selectedId) &&
      ["all", "done", "active", "planned"].includes(value.filter) &&
      Number.isInteger(value.nextId) &&
      value.nextId > 0,
  });
  const projects = store.state.projects;
  let summaryChart = null;
  let selectedId = store.state.selectedId;
  let filter = store.state.filter;
  let nextId = store.state.nextId;
  let editingProject = null;
  let dialogReturn = null;
  const byId = (id) => doc.getElementById(id);
  const dialog = byId("project-dialog");
  const form = byId("project-form");
  const nameInput = byId("project-name");

  /** Persist the host snapshot without recreating form or editor nodes. */
  function persist() {
    Object.assign(store.state, { selectedId, filter, nextId });
    return store.save();
  }

  /** Create only trusted element names and text; typed project names are never parsed as markup. */
  function element(tag, text, className) {
    const node = doc.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  /** Keep visible summary values derived from the same project/task snapshot as the detail pane. */
  function renderMetrics() {
    let done = 0,
      total = 0,
      active = 0;
    for (const project of projects) {
      const summary = projectSummary(project);
      done += summary.done;
      total += summary.total;
      if (summary.state === "active") active++;
    }
    byId("metric-project-total").textContent = projects.length;
    byId("metric-task-total").textContent = total;
    const chartOptions = {
      label: "Завершённые задачи за неделю",
      type: "area",
      labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
      series: [
        { id: "done", label: "Задачи", values: [2, 3, 4, 6, 5, 8, done] },
      ],
    };
    if (summaryChart) summaryChart.update(chartOptions);
    else summaryChart = createStyleChart(byId("workspace-chart"), chartOptions);
    byId("active-count").textContent = active;
    byId("done-count").replaceChildren(
      doc.createTextNode(String(done)),
      element("span", `/ ${total}`),
    );
    byId("project-count").textContent = String(projects.length).padStart(
      2,
      "0",
    );
    byId("nav-count").textContent = projects.length;
  }

  /** Render an accessible project picker inside the first column; row decoration never receives input. */
  function projectRow(project) {
    const summary = projectSummary(project);
    const row = element(
      "tr",
      undefined,
      project.id === selectedId ? "selected" : "",
    );
    const first = element("td");
    const choose = element("button", undefined, "project-select");
    choose.type = "button";
    choose.setAttribute("aria-pressed", String(project.id === selectedId));
    choose.setAttribute("aria-label", `Открыть проект ${project.name}`);
    const symbol = element("span", project.symbol, "project-icon");
    symbol.setAttribute("aria-hidden", "true");
    const label = element("span");
    label.append(
      element("strong", project.name),
      element("small", project.category),
    );
    choose.append(symbol, label);
    choose.addEventListener("click", () => {
      selectedId = project.id;
      // Keep the activated button mounted so keyboard focus does not disappear when details change.
      for (const button of byId("project-rows").querySelectorAll(
        ".project-select",
      )) {
        const selected = button === choose;
        button.setAttribute("aria-pressed", String(selected));
        button.closest("tr").classList.toggle("selected", selected);
      }
      renderDetails();
      byId("announcement").textContent = `Открыт проект ${project.name}`;
    });
    first.append(choose);
    const statusCell = element("td");
    statusCell.append(
      element("span", summary.label, `status-pill ${summary.state}`),
    );
    const progressCell = element("td");
    const progressWrap = element("div", undefined, "row-progress");
    const progress = element("progress");
    progress.max = 100;
    progress.value = summary.percent;
    progress.setAttribute("aria-label", `Готовность: ${project.name}`);
    progressWrap.append(progress, element("span", `${summary.percent}%`));
    progressCell.append(progressWrap);
    const teamCell = element("td");
    const team = element("span", undefined, "team");
    team.setAttribute("aria-label", `Участники: ${project.team.join(", ")}`);
    for (const initials of project.team) {
      const avatar = element("span", initials);
      avatar.setAttribute("aria-hidden", "true");
      team.append(avatar);
    }
    teamCell.append(team);
    row.append(first, statusCell, progressCell, teamCell);
    return row;
  }

  /** Replace the filtered rows without changing the selected project's detail context. */
  function renderProjects() {
    const visible = visibleProjects(
      projects,
      byId("project-search").value,
      filter,
    );
    byId("project-rows").replaceChildren(...visible.map(projectRow));
    byId("empty").hidden = visible.length !== 0;
    byId("result-count").textContent =
      `Показано: ${visible.length} из ${projects.length}`;
  }

  /** Synchronize the detail pane and its task checkboxes, restoring checkbox focus after each update. */
  function renderDetails(focusTask = null) {
    const project = projects.find((item) => item.id === selectedId);
    const summary = projectSummary(project);
    if (doc.documentElement.dataset.style === "midnight-glass") {
      byId("workspace-title").textContent = project.name;
      byId("workspace-description").textContent = project.description;
    }
    for (const [id, value] of Object.entries({
      "detail-title": project.name,
      "detail-category": project.category,
      "detail-description": project.description,
      "detail-owner": project.owner,
      "detail-date": project.date,
      "detail-percent": `${summary.percent}%`,
      "task-context": `${project.name} · задачи проекта`,
    }))
      byId(id).textContent = value;
    byId("detail-status").textContent = summary.label;
    byId("detail-status").className = `status-pill ${summary.state}`;
    byId("detail-progress").value = summary.percent;
    byId("detail-progress").textContent = `${summary.percent}%`;
    byId("detail-progress").setAttribute(
      "aria-label",
      `Готовность: ${project.name}`,
    );
    const tasks = byId("task-list");
    tasks.replaceChildren();
    for (const [index, task] of project.tasks.entries()) {
      const label = element("label", undefined, "task-item");
      const input = element("input");
      input.type = "checkbox";
      input.checked = task.done;
      input.id = `task-${project.id}-${index}`;
      input.addEventListener("change", () => {
        task.done = input.checked;
        renderMetrics();
        renderProjects();
        renderDetails(input.id);
        byId("announcement").textContent =
          `${task.label}: ${task.done ? "готово" : "в работе"}`;
      });
      label.append(
        input,
        element("span", task.label),
        element("small", task.date),
      );
      tasks.append(label);
    }
    if (focusTask) byId(focusTask)?.focus({ preventScroll: true });
    persist();
  }

  const filterChoice = mountStyleChoice({
    document: doc,
    host: doc.querySelector(".filters"),
    attribute: "data-filter",
    value: filter,
    onChange: (value) => {
      filter = value;
      renderProjects();
      byId("announcement").textContent = byId("result-count").textContent;
    },
  });
  byId("project-search").addEventListener("input", renderProjects);
  for (const link of doc.querySelectorAll(".nav-link"))
    link.addEventListener("click", () => {
      for (const item of doc.querySelectorAll(".nav-link"))
        item.removeAttribute("aria-current");
      link.setAttribute("aria-current", "page");
    });
  const editProject = element(
    "button",
    "Изменить проект",
    "demo-inline-action",
  );
  editProject.type = "button";
  doc.querySelector(".detail-panel").append(editProject);
  editProject.addEventListener("click", () => {
    editingProject = selectedId;
    const project = projects.find((item) => item.id === selectedId);
    nameInput.value = project.name;
    byId("project-description").value = project.description;
    byId("dialog-title").textContent = "Изменить проект";
    form.querySelector('[type="submit"]').textContent = "Сохранить проект";
    dialogReturn = editProject;
    dialog.showModal();
    nameInput.focus();
  });
  const taskForm = element("form", undefined, "demo-task-form");
  const taskLabel = element("label", "Следующая задача");
  const taskInput = element("input");
  taskInput.required = true;
  taskInput.maxLength = 160;
  taskInput.id = "new-task-name";
  taskLabel.append(taskInput);
  const addTask = element("button", "Добавить задачу", "demo-inline-action");
  addTask.type = "submit";
  taskForm.append(taskLabel, addTask);
  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const project = projects.find((item) => item.id === selectedId);
    if (!taskInput.value.trim() || project.tasks.length >= 100) return;
    project.tasks.push({
      label: taskInput.value.trim(),
      done: false,
      date: "Без срока",
    });
    taskForm.reset();
    renderMetrics();
    renderProjects();
    renderDetails();
    taskInput.focus();
    byId("announcement").textContent = "Задача добавлена в выбранный проект";
  });
  doc.querySelector(".task-panel").append(taskForm);
  byId("new-project").addEventListener("click", () => {
    if (projects.length >= 50) {
      byId("announcement").textContent = "В примере доступно до 50 проектов";
      return;
    }
    editingProject = null;
    form.reset();
    dialogReturn = byId("new-project");
    byId("dialog-title").textContent = "Новый проект";
    form.querySelector('[type="submit"]').textContent = "Создать проект";
    dialog.showModal();
    nameInput.focus();
  });
  for (const id of ["close-dialog", "cancel-project"])
    byId(id).addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    (dialogReturn || byId("new-project")).focus();
  });
  nameInput.addEventListener("input", () => nameInput.setCustomValidity(""));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.setCustomValidity("Укажите название проекта.");
      nameInput.reportValidity();
      return;
    }
    if (editingProject) {
      const existing = projects.find((item) => item.id === editingProject);
      existing.name = name;
      existing.description = byId("project-description").value.trim();
      renderMetrics();
      renderProjects();
      renderDetails();
      dialog.close();
      form.reset();
      editingProject = null;
      byId("announcement").textContent = "Проект обновлён в этом браузере";
      return;
    }
    const project = {
      id: `new-${nextId++}`,
      name,
      category: "Новый проект",
      description:
        byId("project-description").value.trim() || "Первый шаг к новой идее.",
      owner: "Александра",
      date: "Не назначен",
      team: ["АК"],
      symbol: "✧",
      tasks: [
        { label: "Определить следующий шаг", done: false, date: "Без срока" },
      ],
    };
    projects.push(project);
    selectedId = project.id;
    filter = "all";
    byId("project-search").value = "";
    filterChoice.setValue(filter);
    renderMetrics();
    renderProjects();
    renderDetails();
    dialog.close();
    form.reset();
    byId("announcement").textContent =
      `Создан проект ${name}. Сохранение действует в этом браузере.`;
  });
  const style = doc.documentElement.dataset.style;
  const dark = style === "midnight-glass";
  const styleName = dark ? "Midnight Glass" : "Violet Soft 3D";
  doc.title = `${styleName} · Forma`;
  byId("style-caption").textContent = dark
    ? "02 / MIDNIGHT GLASS"
    : "01 / VIOLET SOFT 3D";
  byId("demo-label").textContent = `${styleName} · пример системы`;
  for (const link of doc.querySelectorAll("[data-style-link]"))
    if (link.dataset.styleLink === style)
      link.setAttribute("aria-current", "page");
  filterChoice.setValue(filter);
  renderMetrics();
  renderProjects();
  renderDetails();
  const system = mountDemoSystem({ document: doc });
  disposeOnPageExit(doc.defaultView, () => {
    persist();
    filterChoice.dispose();
    system?.dispose();
    summaryChart?.dispose();
  });
}

if (typeof document !== "undefined") mountExample();

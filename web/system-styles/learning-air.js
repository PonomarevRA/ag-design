import { mountExampleBento } from "./vendor/lab/bento.js";
import { createDemoState } from "./demo-state.js";
import { mountDemoSystem } from "./demo-shell.js?v=demo-systems-5";
import { bindDashboardNavigation } from "./dashboard-common.js";
import { createLearningState, learningTotals } from "./dashboard-model.js";
import { el, duration } from "./dashboard-common.js";
const store = createDemoState({
  window,
  style: "learning-air",
  scope: "learning",
  initial: createLearningState(),
  validate: (value) =>
    Number.isInteger(value.selected) &&
    value.selected >= 0 &&
    value.selected < value.courses.length &&
    Number.isInteger(value.day) &&
    value.day >= 0 &&
    value.day < 7 &&
    value.courses.length === 3 &&
    value.courses.every(
      (course) =>
        Number.isInteger(course.done) &&
        course.done >= 0 &&
        course.done <= course.chapters &&
        course.minutes.length === 7,
    ),
});
const state = store.state,
  byId = (id) => document.getElementById(id);
const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
/** Render labeled course selectors with proportional study time from the heatmap snapshot. */
function renderCourses(totals, focusIndex = null) {
  const host = byId("course-bars");
  host.replaceChildren();
  for (const [index, course] of state.courses.entries()) {
    if (
      courseSearch.value &&
      !course.name
        .toLocaleLowerCase("ru")
        .includes(courseSearch.value.toLocaleLowerCase("ru"))
    )
      continue;
    const row = el("button", undefined, "course-row");
    row.type = "button";
    row.dataset.courseIndex = String(index);
    row.setAttribute("aria-pressed", String(index === state.selected));
    const label = el("span", course.name),
      track = el("span", undefined, "course-track"),
      fill = el("span");
    fill.style.width = `${(totals.courseMinutes[index] / Math.max(...totals.courseMinutes)) * 100}%`;
    fill.className = course.color;
    track.append(fill);
    row.append(
      label,
      track,
      el("strong", duration(totals.courseMinutes[index])),
    );
    row.addEventListener("click", () => {
      state.selected = index;
      renderCourses(learningTotals(state), index);
      renderSelected();
    });
    host.append(row);
  }
  const empty = byId("demo-course-empty");
  if (empty) empty.hidden = host.children.length > 0;
  if (focusIndex !== null)
    for (const button of host.querySelectorAll("button")) {
      if (button.dataset.courseIndex === String(focusIndex)) button.focus();
    }
}

/** Heatmap cells expose literal minutes and selected day; intensity is only an additional visual encoding. */
function renderHeatmap() {
  const body = byId("study-cells");
  body.replaceChildren();
  for (const course of state.courses) {
    const row = el("tr"),
      label = el("th", course.name);
    label.scope = "row";
    row.append(label);
    for (const [index, value] of course.minutes.entries()) {
      const cell = el("td", String(value));
      cell.dataset.level = value >= 75 ? "3" : value >= 40 ? "2" : "1";
      cell.classList.toggle("selected-day", index === state.day);
      cell.setAttribute(
        "aria-label",
        `${course.name}, ${dayNames[index]}: ${value} минут`,
      );
      row.append(cell);
    }
    body.append(row);
  }
}
/** Keep chapter actions stable and synchronize the selected course, accessible progress and Continue state. */
function renderSelected() {
  store.save();
  const course = state.courses[state.selected];
  byId("selected-course").textContent = course.name;
  byId("course-category").textContent = course.category;
  byId("course-cover").dataset.course = course.id;
  byId("chapter-label").textContent =
    `${course.done} из ${course.chapters} глав завершено`;
  byId("chapter-progress").value = course.done;
  byId("chapter-progress").max = course.chapters;
  byId("continue-course").disabled = course.done === course.chapters;
  byId("continue-course").textContent =
    course.done === course.chapters
      ? "Курс завершён"
      : "Завершить следующую главу";
  const list = byId("chapters");
  list.replaceChildren();
  const start = Math.max(0, course.done - 2),
    end = Math.min(course.chapters, start + 4);
  for (let index = start; index < end; index++) {
    const row = el(
      "li",
      `${String(index + 1).padStart(2, "0")}  ${["Введение и цели", "Исследование", "Основные принципы", "Практика", "Система и детали"][index % 5]}`,
    );
    row.classList.toggle("completed", index < course.done);
    if (index < course.done) row.append(el("span", " ✓"));
    list.append(row);
  }
  byId("course-position").textContent =
    `Курс ${state.selected + 1} / ${state.courses.length}`;
}
/** Calendar changes only the day context, not historical minute totals. */
function mountCalendar() {
  const host = byId("learning-days");
  for (const [index, label] of dayNames.entries()) {
    const button = el("button");
    button.type = "button";
    button.append(el("span", label), el("strong", String(19 + index)));
    button.setAttribute("aria-label", `${label}, ${19 + index} октября`);
    button.setAttribute("aria-pressed", String(index === state.day));
    button.addEventListener("click", () => {
      state.day = index;
      for (const other of host.querySelectorAll("button"))
        other.setAttribute("aria-pressed", String(other === button));
      renderHeatmap();
      renderDay();
    });
    host.append(button);
  }
}
/** Daily minutes are derived from exactly the selected column of the weekly table. */
function renderDay() {
  store.save();
  byId("day-study").textContent =
    `${dayNames[state.day]}, ${19 + state.day} октября · ${duration(learningTotals(state).dayMinutes)}`;
}
const searchRow = el("div", undefined, "demo-course-search-row");
searchRow.dataset.agFormRow = "stack";
const searchLabel = el("label", undefined, "demo-course-search");
searchLabel.dataset.agFormField = "";
const searchCaption = el("span", "Найти курс", "ag-form-track__label");
searchCaption.id = "learning-course-search-label";
searchLabel.append(searchCaption);
const courseSearch = el("input");
courseSearch.type = "search";
courseSearch.setAttribute("aria-labelledby", searchCaption.id);
const courseEmpty = el("p", "Курс не найден. Измените поиск.", "demo-muted");
courseEmpty.id = "demo-course-empty";
courseEmpty.hidden = true;
byId("course-bars").after(courseEmpty);
searchLabel.append(courseSearch);
searchRow.append(searchLabel);
byId("course-bars").before(searchRow);
courseSearch.addEventListener("input", () =>
  renderCourses(learningTotals(state)),
);
const totals = learningTotals(state);
byId("week-total").textContent = duration(totals.minutes);
renderCourses(totals);
renderHeatmap();
mountCalendar();
renderDay();
renderSelected();
byId("continue-course").addEventListener("click", () => {
  const course = state.courses[state.selected];
  if (course.done < course.chapters) course.done++;
  renderSelected();
  byId("learning-announcement").textContent =
    `${course.name}: завершено ${course.done} из ${course.chapters} глав`;
});

bindDashboardNavigation();
mountExampleBento({ document });
mountDemoSystem({ document });

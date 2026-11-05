import { node, surface, button } from "./runtime.js";
import { instant, formatDateTime } from "./time.js";
import {
  dayMs,
  plannerDay,
  validatePlanner,
  plannerRange,
  eventsOnDay,
  timelineSpan,
} from "./planner-model.js";
const dateId = (value) => new Date(value).toISOString().slice(0, 10);
/** Calendar, time grid, agenda and resource timeline from supplied local events; no feed URL, storage or background fetching exists. */
export function createPlanner({
  document = globalThis.document,
  ...initial
} = {}) {
  let controller;
  /** Keep navigation arithmetic in UTC; each view advances by its own visible unit. */
  function navigate(state, direction) {
    const next = new Date(plannerDay(state.date));
    if (state.view === "month") {
      next.setUTCDate(1);
      next.setUTCMonth(next.getUTCMonth() + direction);
    } else
      next.setUTCDate(
        next.getUTCDate() + direction * (state.view === "day" ? 1 : 7),
      );
    controller.update({ date: dateId(next.getTime()) });
  }
  /** Open an inline native form for one event, preserving its supplied duration until the user explicitly edits both endpoints. */
  function editor(event, state, listen) {
    const form = node(document, "form", "ag-vt-planner__editor");
    listen = (target, name, handler) => target.addEventListener(name, handler);
    form.setAttribute("aria-label", "Изменить: " + event.label);
    const start = node(document, "input"),
      end = node(document, "input");
    start.type = end.type = "datetime-local";
    start.step = end.step = "0.001";
    start.value = instant(event.start).toISOString().slice(0, -1);
    end.value = instant(event.end).toISOString().slice(0, -1);
    const startLabel = node(document, "label", "", "Начало (UTC)"),
      endLabel = node(document, "label", "", "Конец (UTC)");
    startLabel.append(start);
    endLabel.append(end);
    const resourceLabel = node(document, "label", "", "Ресурс"),
      resource = node(document, "select");
    resource.append(node(document, "option", "", "Без ресурса"));
    resource.firstChild.value = "";
    for (const item of state.resources) {
      const option = node(document, "option", "", item.label);
      option.value = item.id;
      resource.append(option);
    }
    resource.value = event.resourceId ?? "";
    resourceLabel.append(resource);
    const save = node(document, "button", "ag-vt-button", "Сохранить локально");
    save.type = "button";
    const cancel = button(document, "Отмена", listen, () => form.remove()),
      error = node(document, "p", "ag-vt-muted");
    error.setAttribute("role", "status");
    form.append(startLabel, endLabel, resourceLabel, save, cancel, error);
    /** Validate local UTC inputs before committing. A button callback also works where sandboxed previews prohibit form submission. */
    function applyEdit() {
      let changed, events;
      try {
        changed = {
          ...event,
          start: instant(start.value + "Z").toISOString(),
          end: instant(end.value + "Z").toISOString(),
          resourceId: resource.value || undefined,
        };
        events = state.events.map((item) =>
          item.id === event.id ? changed : item,
        );
        validatePlanner({ ...state, events });
      } catch {
        error.textContent =
          "Проверьте даты: окончание должно быть позже начала.";
        return;
      }
      controller.update({ events });
      state.onEventChange?.({ ...changed });
    }
    listen(save, "click", applyEdit);
    listen(form, "submit", (submit) => {
      submit.preventDefault();
      applyEdit();
    });
    listen(form, "keydown", (key) => {
      if (key.key === "Enter" && key.target.tagName === "INPUT") {
        key.preventDefault();
        applyEdit();
      }
    });
    return form;
  }
  /** Render event titles as native buttons, keeping every action and editing callback local to the owning plan. */
  function eventControl(event, state, listen, host) {
    const start = instant(event.start),
      end = instant(event.end);
    const text = event.allDay
      ? event.label
      : new Intl.DateTimeFormat("ru-RU", {
          timeZone: "UTC",
          hour: "2-digit",
          minute: "2-digit",
        }).format(start) +
        " · " +
        event.label;
    const control = button(document, text, listen, () => {
      state.onEventSelect?.({ ...event });
      if (state.editable) {
        host.querySelector(".ag-vt-planner__editor")?.remove();
        const form = editor(event, state, listen);
        host.append(form);
        form.querySelector("input").focus();
      }
    });
    control.classList.add("ag-vt-planner__event");
    control.dataset.key = event.id;
    control.title =
      event.label + " · " + formatDateTime(start) + " — " + formatDateTime(end);
    return control;
  }
  controller = surface(
    document,
    "ag-vt-planner",
    { view: "month", resources: [], events: [], editable: false, ...initial },
    validatePlanner,
    (state, listen) => {
      const range = plannerRange(state),
        toolbar = node(document, "div", "ag-vt-planner__toolbar"),
        previous = button(document, "Предыдущий период", listen, () =>
          navigate(state, -1),
        ),
        next = button(document, "Следующий период", listen, () =>
          navigate(state, 1),
        );
      toolbar.append(previous, next);
      if (state.today)
        toolbar.append(
          button(document, "Сегодня", listen, () =>
            controller.update({ date: state.today }),
          ),
        );
      toolbar.append(node(document, "h3", "", state.date + " · UTC"));
      const modeLabel = node(document, "label", "", "Вид "),
        mode = node(document, "select");
      for (const [id, label] of [
        ["month", "Месяц"],
        ["week", "Неделя"],
        ["day", "День"],
        ["agenda", "Список"],
        ["timeline", "Ресурсы"],
      ]) {
        const option = node(document, "option", "", label);
        option.value = id;
        mode.append(option);
      }
      mode.value = state.view;
      modeLabel.append(mode);
      listen(mode, "change", () => controller.update({ view: mode.value }));
      toolbar.append(modeLabel);
      const body = node(document, "div", "ag-vt-planner__body"),
        host = node(document, "div", "ag-vt-planner__host");
      host.append(body);
      if (state.view === "timeline") {
        const table = node(document, "div", "ag-vt-timeline");
        const dates = node(document, "div", "ag-vt-timeline__dates");
        dates.append(node(document, "strong", "", "Ресурс"));
        for (let i = 0; i < range.count; i++)
          dates.append(
            node(
              document,
              "span",
              "",
              dateId(range.start + i * dayMs).slice(5),
            ),
          );
        table.append(dates);
        const resources = [
          { id: "", label: "Без ресурса" },
          ...state.resources,
        ];
        for (const resource of resources) {
          const events = state.events.filter(
              (event) => (event.resourceId ?? "") === resource.id,
            ),
            row = node(document, "section", "ag-vt-timeline__row");
          row.append(node(document, "h4", "", resource.label));
          const track = node(document, "div", "ag-vt-timeline__track");
          let eventRow = 1;
          for (const event of events) {
            const span = timelineSpan(event, range);
            if (!span) continue;
            const control = eventControl(event, state, listen, host);
            control.style.gridColumn = `${span.start + 1} / ${span.end + 1}`;
            control.style.gridRow = String(eventRow++);
            track.append(control);
          }
          if (!track.children.length)
            track.append(node(document, "span", "ag-vt-muted", "Нет событий"));
          row.append(track);
          table.append(row);
        }
        body.append(table);
      } else if (state.view === "month") {
        const grid = node(document, "div", "ag-vt-month");
        for (let i = 0; i < range.count; i++) {
          const date = range.start + i * dayMs,
            day = node(document, "section", "ag-vt-month__day"),
            title = button(document, dateId(date), listen, () =>
              state.onDateSelect?.(dateId(date)),
            );
          title.classList.add("ag-vt-month__date");
          day.append(title);
          if (dateId(date).slice(0, 7) !== state.date.slice(0, 7))
            day.classList.add("ag-vt-month__day--outside");
          for (const event of eventsOnDay(state.events, date))
            day.append(eventControl(event, state, listen, host));
          grid.append(day);
        }
        body.append(grid);
      } else if (state.view === "agenda") {
        for (let i = 0; i < range.count; i++) {
          const date = range.start + i * dayMs,
            section = node(document, "section", "ag-vt-agenda__day");
          section.append(node(document, "h4", "", dateId(date)));
          const events = eventsOnDay(state.events, date);
          for (const event of events)
            section.append(eventControl(event, state, listen, host));
          if (!events.length)
            section.append(
              node(document, "span", "ag-vt-muted", "Нет событий"),
            );
          body.append(section);
        }
      } else {
        const grid = node(document, "div", "ag-vt-week");
        grid.style.setProperty("--ag-planner-days", range.count);
        for (let i = 0; i < range.count; i++) {
          const date = range.start + i * dayMs,
            day = node(document, "section", "ag-vt-week__day");
          day.append(node(document, "h4", "", dateId(date)));
          const allDay = node(document, "div", "ag-vt-week__all-day"),
            hours = node(document, "div", "ag-vt-week__hours");
          for (const event of eventsOnDay(state.events, date)) {
            if (event.allDay)
              allDay.append(eventControl(event, state, listen, host));
            else {
              const start = Math.max(date, instant(event.start).getTime()),
                end = Math.min(date + dayMs, instant(event.end).getTime()),
                control = eventControl(event, state, listen, host);
              control.style.gridRow = `${Math.floor((start - date) / 1800000) + 1} / ${Math.max(Math.floor((start - date) / 1800000) + 2, Math.ceil((end - date) / 1800000) + 1)}`;
              hours.append(control);
            }
          }
          for (let hour = 0; hour < 24; hour += 3) {
            const tick = node(
              document,
              "span",
              "ag-vt-week__tick",
              String(hour).padStart(2, "0") + ":00",
            );
            tick.style.gridRow = String(hour * 2 + 1);
            hours.append(tick);
          }
          day.append(allDay, hours);
          grid.append(day);
        }
        body.append(grid);
      }
      return [
        toolbar,
        host,
        node(
          document,
          "p",
          "ag-vt-muted",
          "События и время переданы приложением. Часовой пояс планировщика: UTC.",
        ),
      ];
    },
  );
  return controller;
}

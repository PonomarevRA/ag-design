import { identities } from "./runtime.js";
import { instant } from "./time.js";
export const dayMs = 86400000;
/** Civil planner dates are explicit UTC days; reject rollover and implicit local timezone parsing. */
export function plannerDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\d$/.test(value))
    throw new TypeError("Use YYYY-MM-DD");
  const date = new Date(value + "T00:00:00Z");
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    throw new TypeError("Invalid civil date");
  return date.getTime();
}
/** Validate bounded events and resource references before replacing the previous plan. Intervals use an exclusive end. */
export function validatePlanner(state) {
  plannerDay(state.date);
  if (state.today !== undefined) plannerDay(state.today);
  if (!["month", "week", "day", "agenda", "timeline"].includes(state.view))
    throw new TypeError("Unknown planner view");
  identities(state.resources, 20);
  identities(state.events, 240);
  const ids = new Set(state.resources.map((item) => item.id));
  for (const event of state.events) {
    const start = instant(event.start).getTime(),
      end = instant(event.end).getTime();
    if (end <= start || end - start > 366 * dayMs)
      throw new RangeError("Use positive intervals up to 366 days");
    if (event.resourceId !== undefined && !ids.has(event.resourceId))
      throw new TypeError("Unknown event resource");
  }
}
/** Return the exact visible interval; month uses 42 Monday-first cells while other views show one or seven days. */
export function plannerRange(state) {
  const base = plannerDay(state.date);
  let start = base,
    count = state.view === "day" ? 1 : 7;
  if (state.view === "month") {
    const first = new Date(base);
    first.setUTCDate(1);
    start = first.getTime() - ((first.getUTCDay() + 6) % 7) * dayMs;
    count = 42;
  } else if (state.view !== "day")
    start -= ((new Date(base).getUTCDay() + 6) % 7) * dayMs;
  return { start, end: start + count * dayMs, count };
}
/** Half-open intervals avoid rendering a midnight finish as an additional occupied day. */
export function eventsOnDay(events, start) {
  return events
    .filter(
      (event) =>
        instant(event.start).getTime() < start + dayMs &&
        instant(event.end).getTime() > start,
    )
    .sort((a, b) => instant(a.start) - instant(b.start));
}
/** Clip a timeline interval to visible day columns without changing the original supplied dates. */
export function timelineSpan(event, range) {
  const start = instant(event.start).getTime(),
    end = instant(event.end).getTime();
  if (start >= range.end || end <= range.start) return null;
  return {
    start: Math.max(0, Math.floor((start - range.start) / dayMs)),
    end: Math.min(range.count, Math.ceil((end - range.start) / dayMs)),
  };
}

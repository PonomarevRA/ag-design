/** Immutable synthetic business snapshots; segment allocations sum exactly to each displayed total. */
export function analyticsSnapshot(period = "oct") {
  const october = period !== "sep";
  const active = [
    1950, 2220, 2670, 3020, 3540, 3890, 4300, 4510, 4700, 4820,
  ].slice(0, october ? 10 : 9);
  const paid = [800, 980, 1320, 1710, 2050, 2410, 2750, 3070, 3310, 3540].slice(
    0,
    active.length,
  );
  const mrr = october ? 128450 : 114280;
  const shares = [46, 32, 15, 7];
  const amounts = shares.map((value) => Math.floor((mrr * value) / 100));
  amounts[3] += mrr - amounts.reduce((sum, value) => sum + value, 0);
  const signups = october ? 2450 : 2200;
  const funnel = october
    ? [2450, 1911, 1274, 833, 348]
    : [2200, 1650, 1100, 704, 286];
  return {
    period,
    mrr,
    active,
    paid,
    labels: [
      "Янв",
      "Фев",
      "Мар",
      "Апр",
      "Май",
      "Июн",
      "Июл",
      "Авг",
      "Сен",
      "Окт",
    ].slice(0, active.length),
    shares,
    amounts,
    signups,
    funnel,
    churn: october ? 1.18 : 1.5,
    markets: [49, 17, 13, 12, 9],
  };
}

/** Quarter-end views retain the actual end-of-period count; stocks are never summed across months. */
export function growthSeries(snapshot, grouping) {
  if (grouping !== "quarter")
    return {
      labels: [...snapshot.labels],
      active: [...snapshot.active],
      paid: [...snapshot.paid],
    };
  const result = { labels: [], active: [], paid: [] };
  for (let start = 0; start < snapshot.labels.length; start += 3) {
    const end = Math.min(start + 2, snapshot.labels.length - 1);
    result.labels.push(
      `Q${Math.floor(start / 3) + 1}${end - start < 2 ? "*" : ""}`,
    );
    result.active.push(snapshot.active[end]);
    result.paid.push(snapshot.paid[end]);
  }
  return result;
}

/** One bounded learning snapshot owns course minutes, chapter progress and day totals. */
export function createLearningState() {
  return {
    selected: 0,
    day: 3,
    courses: [
      {
        id: "ui",
        name: "UI-системы",
        category: "Дизайн интерфейсов",
        minutes: [40, 60, 75, 50, 95, 60, 40],
        chapters: 10,
        done: 3,
        color: "violet",
      },
      {
        id: "design",
        name: "Основы дизайна",
        category: "Композиция и типографика",
        minutes: [20, 45, 40, 90, 80, 40, 30],
        chapters: 8,
        done: 5,
        color: "teal",
      },
      {
        id: "code",
        name: "Разработка",
        category: "Интерфейсы в коде",
        minutes: [70, 75, 50, 45, 100, 80, 50],
        chapters: 12,
        done: 2,
        color: "amber",
      },
    ],
  };
}

/** Sum the same literal minute cells shown by the heatmap, not an independent decorative KPI. */
export function learningTotals(state) {
  let minutes = 0,
    dayMinutes = 0;
  const courseMinutes = [];
  for (const course of state.courses) {
    let total = 0;
    for (const value of course.minutes) total += value;
    minutes += total;
    dayMinutes += course.minutes[state.day];
    courseMinutes.push(total);
  }
  return { minutes, dayMinutes, courseMinutes };
}

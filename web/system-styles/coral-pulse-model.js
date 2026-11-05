/** Return fresh synthetic activity records; the sample has no account, health feed or persistence. */
export function activities() {
  return [
    {
      id: "cardio",
      name: "Кардио",
      days: 4,
      percent: 70,
      values: [3, 5, 2, 8, 4, 10, 6, 4],
      path: "M12 20S3 14 3 8.5a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1C21 14 12 20 12 20Z",
    },
    {
      id: "strength",
      name: "Сила",
      days: 3,
      percent: 50,
      values: [0, 5, 2, 6, 3, 8, 4, 2],
      path: "M3 9v6m3-9v12m12-12v12m3-9v6M6 12h12M3 9h3m-3 6h3m12-6h3m-3 6h3",
    },
    {
      id: "jump",
      name: "Прыжки",
      days: 2,
      percent: 40,
      values: [0, 2, 4, 2, 5, 3, 2, 2],
      path: "M5 10V6a7 7 0 0 1 14 0v4M3 10h4v10H3Zm14 0h4v10h-4M8 7v3m8-3v3",
    },
    {
      id: "yoga",
      name: "Йога",
      days: 7,
      percent: 100,
      values: [4, 5, 4, 6, 5, 4, 4, 4],
      path: "M12 20C6 17 7 10 12 4c5 6 6 13 0 16ZM12 20C5 21 2 17 2 10c6 0 9 3 10 10Zm0 0c7 1 10-3 10-10-6 0-9 3-10 10Z",
    },
    {
      id: "cycle",
      name: "Велосипед",
      days: 2,
      percent: 25,
      values: [0, 3, 1, 5, 2, 4, 8, 2],
      path: "M9 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6 16l4-8 4 8H6Zm4-8h6l2 8M8 5h4m3 0h3",
    },
    {
      id: "core",
      name: "Баланс",
      days: 4,
      percent: 70,
      values: [1, 3, 4, 2, 6, 4, 5, 3],
      path: "M12 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 3v7m-7-4 7-3 7 3M12 15l-5 7m5-7 5 7",
    },
  ];
}

/** Choose one bounded period snapshot so the ring, bars and textual equivalent share the same data. */
export function periodSnapshot(period) {
  const records = {
    day: {
      label: "Сегодня",
      steps: 7240,
      goal: 10000,
      walk: 32,
      run: 18,
      values: [5, 10, 7, 6, 15, 8, 12, 22, 9, 18, 12, 6, 9, 11, 8, 4],
    },
    week: {
      label: "Эта неделя",
      steps: 54720,
      goal: 70000,
      walk: 196,
      run: 82,
      values: [28, 44, 36, 52, 31, 48, 40],
    },
    month: {
      label: "Этот месяц",
      steps: 219460,
      goal: 300000,
      walk: 824,
      run: 336,
      values: [22, 29, 31, 24, 38, 27, 41, 36, 30, 45, 39, 48],
    },
  };
  const selected = records[period] || records.day;
  return {
    ...selected,
    values: [...selected.values],
    percent: Math.min(100, Math.round((selected.steps / selected.goal) * 100)),
  };
}

/** Derive exact activity contributions and a capped progress arc while preserving the displayed total. */
export function daySnapshot(index) {
  const minutes = [36, 52, 44, 61, 38, 55, 48][index] ?? 48;
  const walk = Math.round(minutes * 0.5);
  const training = Math.round(minutes * 0.3);
  return {
    minutes,
    percent: Math.min(100, Math.round((minutes / 60) * 100)),
    contributions: [
      { name: "Прогулка", minutes: walk },
      { name: "Тренировка", minutes: training },
      { name: "Растяжка", minutes: minutes - walk - training },
    ],
  };
}

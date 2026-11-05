/** Deterministic signed signal with isolated spikes and explicit null runs, shared by demos and renderer benchmarks. */
export function analyticFixture(count = 1024, seriesCount = 2) {
  const x = new Float64Array(count),
    series = [];
  for (let i = 0; i < count; i++) x[i] = 1700000000000 + i * 1000;
  for (let j = 0; j < seriesCount; j++) {
    const values = new Array(count);
    for (let i = 0; i < count; i++)
      values[i] =
        i % 173 >= 160 && i % 173 <= 164
          ? null
          : Math.sin(i * 0.035 + j) * 20 +
            j * 15 +
            ((i + 37 * j) % 997 === 33 ? 130 : 0);
    series.push({
      id: "s" + j,
      label: j ? "Сравнение " + j : "Текущий период",
      values,
    });
  }
  return { x, series };
}

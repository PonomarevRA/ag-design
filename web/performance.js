import { buildSample } from "./previews.js";

/** Nearest-rank percentiles preserve the original trial evidence. */
export function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}

/** Rate only complete evidence from one environment; failure/cancellation never receives a score. */
export function performanceVerdict(report, budget) {
  if (report.outcome === "failed") return { label: "Проверка с ошибкой", score: null, reason: report.error?.message ?? "Сценарий завершился ошибкой" };
  if (report.outcome === "cancelled") return { label: "Проверка остановлена", score: null, reason: "Пользователь остановил сценарий до завершения" };
  const values = new Map(report.metrics.map((m) => [m.name, m.value]));
  const names = ["mount_p95_ms", "interaction_p95_ms", "retained_bytes_per_instance"];
  const missing = names.filter((name) => !Number.isFinite(values.get(name)));
  if (missing.length) return {
    label: missing.length === 1 && missing[0] === "retained_bytes_per_instance" ? "Время измерено; память не измерена" : "Недостаточно измерений",
    score: null,
    reason: report.memory?.reason || "Для оценки нужны создание, обновление и JS-память на экземпляр из одного окружения. Отсутствие значения не означает ошибку компонента.",
  };
  const ratio = Math.max(values.get(names[0]) / budget.mountP95Ms, values.get(names[1]) / budget.interactionP95Ms, values.get(names[2]) / budget.retainedBytesPerInstance);
  return { label: ratio <= 1 ? "В пределах бюджета" : "Нужна оптимизация", score: Math.round(Math.max(0, Math.min(100, 100 / Math.max(1, ratio)))), reason: "Оценка относится только к указанному сценарию и окружению." };
}

/** Explicit sample lifecycle contract: missing actions are failures, never silently replaced with no-ops. */
export function assertBenchmarkSample(sample, componentId) {
  for (const name of ["interact", "dispose"]) {
    if (typeof sample?.[name] !== "function") throw new TypeError(`${componentId}: пример не реализует ${name}()`);
  }
  if (!sample.element?.nodeType) throw new TypeError(`${componentId}: отсутствует element примера`);
}

/** Wait for asynchronous fixture work with abort/deadline cleanup; late rejections remain observed. */
export async function waitBenchmarkStep(value, signal, timeoutMs = 15000) {
  signal?.throwIfAborted();
  if (!value || typeof value.then !== "function") return value;
  let timer, rejectWait;
  const interrupted = new Promise((_, reject) => { rejectWait = reject; });
  const abort = () => rejectWait(signal.reason || new DOMException("Отменено", "AbortError"));
  signal?.addEventListener("abort", abort, { once:true });
  timer = setTimeout(() => rejectWait(new Error("Превышен лимит ожидания шага проверки")), timeoutMs);
  try { return await Promise.race([value, interrupted]); }
  finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
}

/** Attempt every disposal independently; cap async cleanup and always detach the acquired roots. */
export async function disposeBenchmarkSamples(samples) {
  let firstError = null;
  const pending = [];
  for (const sample of samples) {
    try {
      const cleanup = sample?.dispose?.();
      if (cleanup?.then) pending.push(Promise.resolve(cleanup).catch(error => { firstError ??= error; }));
    } catch (error) { firstError ??= error; }
    finally {
      try { sample?.element?.remove(); }
      catch (error) { firstError ??= error; }
    }
  }
  samples.length = 0;
  try { await waitBenchmarkStep(Promise.all(pending), undefined, 2000); }
  catch (error) { firstError ??= error; }
  if (firstError) throw firstError;
}

/** Describe the browser honestly without claiming its process heap belongs to this component. */
export function browserBenchmarkReport(component, { outcome = "measured", metrics = [], error } = {}) {
  return {
    componentId: component.id, componentVersion: component.version,
    scenario: "browser-batch-mount-update-remove-v3", outcome,
    measuredBy: "browser-harness",
    environment: { browser: navigator.userAgent.slice(0,256), os: navigator.platform, runtime: "DOM + CSS layout", device: `${innerWidth}×${innerHeight}, DPR ${devicePixelRatio}` },
    metrics, ...(error ? { error } : {}), measuredAt: new Date().toISOString(),
    memory: { status: "unavailable", method: "none", reason: "Этот браузерный сценарий не измеряет удерживаемую JS-память отдельного компонента. Замер с GC выполняется отдельно в Node/jsdom; он не является памятью браузера или приложения." },
    notes: "12 пакетов по40 экземпляров после2прогревов. Средние на экземпляр, затем p50/p95; создание/обновление включают DOM и синхронный layout, но не INP или GPU. Async interact/whenIdle ожидаются. Память измеряется отдельным сценарием; результаты разных окружений не объединяются.",
  };
}

/** Run bounded batches, awaiting real async updates and cleaning the acquired set on every exit path. */
export async function benchmarkComponent(component, {
  onProgress = () => {}, signal, createSample = buildSample,
  rounds = 14, warmups = 2, instances = 40,
  frame = () => new Promise((resolve) => requestAnimationFrame(resolve)),
} = {}) {
  if (!Number.isInteger(rounds) || rounds <= warmups || rounds > 30 || !Number.isInteger(instances) || instances < 1 || instances > 100 || !Number.isInteger(warmups) || warmups < 0) throw new RangeError("Invalid benchmark bounds");
  const host = document.createElement("div");
  host.className = "benchmark-host";
  host.setAttribute("aria-hidden", "true"); host.inert = true;
  Object.assign(host.style, { position: "fixed", left: "-10000px", top: "0", width: "800px", opacity: "0", pointerEvents: "none" });
  document.body.append(host);
  const mounts = [], interactions = [], disposals = [];
  let phase = "mount", completed = 0;
  try {
    for (let round = 0; round < rounds; round++) {
      signal?.throwIfAborted();
      const samples = [];
      let failure = null, mounted, updated;
      const begin = performance.now();
      try {
        phase = "mount";
        for (let index = 0; index < instances; index++) {
          const sample = createSample(component.id, { strict: true });
          // Acquire before validation so even a malformed sample can release its resources.
          samples.push(sample);
          phase = "sample-contract"; assertBenchmarkSample(sample, component.id);
          phase = "mount"; host.append(sample.element);
        }
        phase = "readiness";
        for (const sample of samples) await waitBenchmarkStep(sample.whenIdle?.(), signal);
        signal?.throwIfAborted();
        host.getBoundingClientRect(); mounted = performance.now();
        phase = "interaction";
        for (const sample of samples) { signal?.throwIfAborted(); await waitBenchmarkStep(sample.interact(), signal); await waitBenchmarkStep(sample.whenIdle?.(), signal); }
        if (component.id === "board-viewport") await waitBenchmarkStep(frame(), signal);
        host.getBoundingClientRect(); updated = performance.now();
      } catch (error) { failure = error; }
      finally {
        try { await disposeBenchmarkSamples(samples); }
        catch (error) { if (!failure) { phase = "dispose"; failure = error; } }
        host.replaceChildren();
      }
      if (failure) throw failure;
      signal?.throwIfAborted();
      if (round >= warmups) {
        mounts.push((mounted - begin) / instances);
        interactions.push((updated - mounted) / instances);
        disposals.push((performance.now() - updated) / instances);
      }
      completed++;
      onProgress(round + 1, rounds);
      await waitBenchmarkStep(frame(), signal);
    }
    return browserBenchmarkReport(component, { metrics: [
      { name:"mount_p50_ms",value:percentile(mounts,.5),unit:"ms" },
      { name:"mount_p95_ms",value:percentile(mounts,.95),unit:"ms" },
      { name:"interaction_p95_ms",value:percentile(interactions,.95),unit:"ms" },
      { name:"dispose_p95_ms",value:percentile(disposals,.95),unit:"ms" },
      { name:"dom_roots_after_dispose",value:host.children.length,unit:"count" },
      { name:"instances",value:instances,unit:"count" }, { name:"cycles",value:rounds-warmups,unit:"count" },
    ] });
  } catch (cause) {
    const cancelled = signal?.aborted || cause.name === "AbortError";
    return browserBenchmarkReport(component, { outcome: cancelled ? "cancelled" : "failed",
      metrics: [{ name:"cycles",value:completed,unit:"count" }],
      ...(cancelled ? {} : { error: { phase, message: String(cause.message || cause).slice(0,2048) } }),
    });
  } finally { host.remove(); }
}

/** Isolate measurement and persistence per component; ambiguous failed writes are never retried automatically. */
export async function runBenchmarkSuite({ components, measure = benchmarkComponent, save, signal, onProgress = () => {}, onResult = () => {} }) {
  const results = [];
  for (const component of components) {
    if (signal?.aborted) break;
    onProgress(component, 0, 14);
    let report;
    try { report = await measure(component, { signal, onProgress: (step,total) => onProgress(component,step,total) }); }
    catch (cause) {
      report = browserBenchmarkReport(component, { outcome: signal?.aborted || cause.name === "AbortError" ? "cancelled" : "failed", ...(signal?.aborted || cause.name === "AbortError" ? {} : { error: { phase:"setup",message:String(cause.message || cause).slice(0,2048) } }) });
    }
    const result = { report, saved: false, saveError: null };
    try { await save(report); result.saved = true; }
    catch (error) { result.saveError = String(error.message || error).slice(0,2048); }
    results.push(result); onResult(result, results);
    if (report.outcome === "cancelled" || signal?.aborted) break;
  }
  return { results, cancelled: !!signal?.aborted || results.some(r=>r.report.outcome==="cancelled"), failed: results.filter(r=>r.report.outcome==="failed").length, unsaved: results.filter(r=>!r.saved).length };
}

/** Reload before surfacing a view-level failure; component failures belong to their own report rows. */
export async function restorePerformanceView({refresh,isCurrent,showError,failure}) {
  if (!isCurrent()) return;
  await refresh();
  if (failure && isCurrent()) showError(failure);
}

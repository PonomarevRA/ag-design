import { captureUiSnapshot } from "./ui-map-capture.js";
import { createUiMapClient } from "./ui-map-client.js";
import { createUiMapView } from "./ui-map-view.js";

const fixture = document.querySelector("#fixture"),
  host = document.querySelector("#map");
const runButton = document.querySelector("#run"),
  stopButton = document.querySelector("#stop");
const progress = document.querySelector("#progress"),
  output = document.querySelector("#results");
let controller = null,
  currentView = null;

/** Summarize nonempty millisecond samples with nearest-rank p50/p95 and retain their original order for recalculation. */
function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    samples: values,
    p50: sorted[Math.ceil(sorted.length * 0.5) - 1],
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
  };
}

/** Build exactly the requested number of measurable elements, including the explicit root. */
function populate(count) {
  fixture.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (let index = 1; index < count; index++) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `Synthetic ${index}`);
    fragment.append(button);
  }
  fixture.append(fragment);
}

/** Wait for two visible animation frames; cancellation disposes the active map and cancels any pending frame. */
function settledFrame(signal) {
  return new Promise((resolve, reject) => {
    let frame = 0;
    const abort = () => {
      cancelAnimationFrame(frame);
      reject(signal.reason);
    };
    signal.addEventListener("abort", abort, { once: true });
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        signal.removeEventListener("abort", abort);
        host.getBoundingClientRect();
        resolve();
      });
    });
    if (signal.aborted) abort();
  });
}

/** Measure one real capture, fixed-route API load, bounded map render and explicit post-response layout interval. */
async function measure(count, signal) {
  signal.throwIfAborted();
  const started = performance.now();
  const snapshot = await captureUiSnapshot(fixture, {
    signal,
    source: {
      artifactId: "ui-map-benchmark",
      scenarioId: `nodes-${count}`,
      stateId: "grid",
    },
  });
  const capturedAt = performance.now();
  signal.throwIfAborted();
  const client = createUiMapClient();
  let lastResponse = capturedAt,
    graphPage = null;
  const measured = {};
  for (const name of ["importSnapshot", "map", "node", "evaluate", "compare"]) {
    measured[name] = async (...args) => {
      const value = await client[name](...args);
      lastResponse = performance.now();
      if (name === "map" && args[0].collection === "nodes") graphPage = value;
      return value;
    };
  }
  currentView = createUiMapView({
    document,
    client: measured,
    captureRoot: fixture,
  });
  host.replaceChildren(currentView.element);
  await currentView.loadSnapshot(snapshot);
  signal.throwIfAborted();
  const status =
    currentView.element.querySelector(".ui-map__status").textContent;
  if (!status.startsWith("Карта построена:")) throw new Error(status);
  await settledFrame(signal);
  const finished = performance.now();
  const result = {
    requested: count,
    captured: snapshot.nodes.length,
    captureMs: capturedAt - started,
    postResponseLayoutMs: finished - lastResponse,
    totalMs: finished - started,
    drawn: currentView.element.querySelectorAll(".ui-map__mark").length,
    coverage: snapshot.coverage,
    graphCoverage: graphPage?.coverage,
    snapshotBytes: new TextEncoder().encode(JSON.stringify(snapshot)).length,
  };
  currentView.dispose();
  currentView = null;
  host.replaceChildren();
  return result;
}

/** Execute a fixed protocol only after the operator presses Run; never tune or retry failed samples. */
async function run() {
  if (controller) return;
  controller = new AbortController();
  const signal = controller.signal;
  runButton.disabled = true;
  stopButton.disabled = false;
  const result = {
    protocol: "AGT-223-frozen-v1",
    startedAt: new Date().toISOString(),
    environment: {
      userAgent: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight },
      devicePixelRatio,
      visibility: document.visibilityState,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    },
    method:
      "Actual DOM capture; new view per iteration; 2 warmups/20 samples. Post-response-to-two-rAF/layout includes JS/render scheduling, not GPU time. Render has at most 50 nodes; total includes local HTTP, cache lookup/build-if-miss and UI; unchanged snapshots may reuse a graph. Not an uncached build/group benchmark.",
    cases: [],
    nativeRss: "unknown",
    assistiveTechnology: "unknown",
    errors: [],
  };
  try {
    for (const count of [100, 1000, 5000]) {
      populate(count);
      const samples = [];
      for (let index = -2; index < 20; index++) {
        progress.textContent = `${count} элементов · ${index < 0 ? "прогрев" : `измерение ${index + 1}/20`}`;
        await settledFrame(signal);
        const sample = await measure(count, signal);
        if (index >= 0) samples.push(sample);
      }
      result.cases.push({
        requested: count,
        captured: samples.map((x) => x.captured),
        drawn: samples.map((x) => x.drawn),
        captureMs: summarize(samples.map((x) => x.captureMs)),
        postResponseLayoutMs: summarize(
          samples.map((x) => x.postResponseLayoutMs),
        ),
        totalMs: summarize(samples.map((x) => x.totalMs)),
        samples,
      });
      output.textContent = JSON.stringify(result, null, 2);
    }
    result.status = "completed";
  } catch (cause) {
    result.status = signal.aborted ? "cancelled" : "failed";
    result.errors.push({
      name: cause?.name || "Error",
      message: String(cause?.message || cause),
    });
  } finally {
    currentView?.dispose();
    currentView = null;
    host.replaceChildren();
    result.finishedAt = new Date().toISOString();
    result.browserHeap = performance.memory
      ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          method:
            "Browser-reported process heap snapshot; not per-component retained memory",
        }
      : "unknown";
    output.textContent = JSON.stringify(result, null, 2);
    progress.textContent = `Измерение: ${result.status}`;
    controller = null;
    runButton.disabled = false;
    stopButton.disabled = true;
  }
}
runButton.addEventListener("click", run);
stopButton.addEventListener("click", () => {
  controller?.abort();
  currentView?.dispose();
});
window.addEventListener("pagehide", () => {
  controller?.abort();
  currentView?.dispose();
});

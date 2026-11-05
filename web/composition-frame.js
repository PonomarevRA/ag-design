import { createLayoutGridInspection } from "./layout-grid-inspection.js";
import { createGoldenCanonInspection } from "./golden-canon-inspection.js";
import { bindCompositionGestures } from "./composition-gestures.js";
import { COMPOSITION_CLIPPING_METHOD } from "./composition-clipping.js";
import { captureUiSnapshot } from "./ui-map-capture.js";
import { applyCompositionInspection } from "./composition-inspection.js";
import {
  renderComposition,
  measureComposition,
} from "./composition-renderer.js";
const channel = new URLSearchParams(location.hash.slice(1)).get("channel");
const root = document.getElementById("composition-root");
let layoutGrids = null,
  gridCaptureSequence = 0,
  goldenCanon = null,
  mounted = null,
  current = null,
  generation = 0,
  captureTimer = null,
  resizeObserver = null,
  inspection = { enabled: false },
  editing = { enabled: true, selectedId: null, blocked: false },
  gestures = null,
  gestureEpoch = 0;

/** Only the owning same-origin parent and its per-mount channel can address this fixture. */
function send(type, payload = {}) {
  parent.postMessage({ type, channel, ...payload }, location.origin);
}

/** Wait for font readiness with an explicit bound; unavailable or still-loading fonts never become a pass. */
async function readyFonts() {
  if (!document.fonts) return false;
  await Promise.race([
    document.fonts.ready,
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]);
  return document.fonts.status === "loaded";
}
const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

/** Read two consecutive actual layouts. Dynamic or failed renders are reported as incomplete evidence. */
async function capture(requestId) {
  if (!current || !mounted || gestures?.active) return;
  const expected = generation,
    expectedGesture = gestureEpoch;
  const fontsReady = await readyFonts();
  await nextFrame();
  if (
    expected !== generation ||
    expectedGesture !== gestureEpoch ||
    gestures?.active ||
    !mounted ||
    !current
  )
    return;
  const bounds = () =>
    [...mounted.elements.values()].map((element) => {
      const rect = element.getBoundingClientRect();
      return [rect.x, rect.y, rect.width, rect.height];
    });
  const before = bounds();
  await nextFrame();
  if (
    expected !== generation ||
    expectedGesture !== gestureEpoch ||
    gestures?.active
  )
    return;
  const after = bounds();
  const stable = before.every((rect, index) =>
    rect.every((value, axis) => Math.abs(value - after[index][axis]) <= 0.1),
  );
  const environment = {
    userAgent: navigator.userAgent,
    viewportWidth: innerWidth,
    viewportHeight: innerHeight,
    dpr: devicePixelRatio,
    locale: navigator.language,
    theme: current.theme,
    direction: current.document.viewport.direction,
    textScale: current.document.viewport.textScale,
    trust: "caller-reported-browser",
    clippingMethod: COMPOSITION_CLIPPING_METHOD,
    fontStatus: document.fonts?.status || "unavailable",
    textEnlargement: mounted.textScale,
  };
  const facts = measureComposition({
    root,
    model: current.document,
    ...mounted,
    documentHash: current.documentHash,
    scenarioId: current.scenarioId,
    environment,
    fontsReady,
    stable,
  });
  goldenCanon?.setEvidence(facts);
  const gridCapture = layoutGrids?.capture(
    current.document,
    facts,
    `grid-${generation}-${++gridCaptureSequence}`,
    gridCaptureSequence,
  );
  if (gridCapture) send("composition:grid-capture", gridCapture);
  send("composition:facts", { requestId, generation, facts });
}

/** Transfer only redacted explicit-root DOM facts; the parent's editor UI and graph positions are excluded. */
async function captureMap(request) {
  const expected = generation,
    expectedGesture = gestureEpoch;
  let restoreChrome = () => {};
  try {
    if (
      !mounted ||
      !current ||
      gestures?.active ||
      request.documentHash !== current.documentHash ||
      request.scenarioId !== current.scenarioId
    )
      throw new Error("stale capture");
    await readyFonts();
    await nextFrame();
    if (
      expected !== generation ||
      expectedGesture !== gestureEpoch ||
      gestures?.active ||
      !mounted ||
      !current
    )
      throw new Error("stale capture");
    const stableKeys = new Map(),
      annotations = new Map();
    for (const node of current.document.nodes) {
      const element = mounted.elements.get(node.id);
      if (!element) continue;
      stableKeys.set(element, node.id);
      if (node.kind === "frame") annotations.set(element, { boundary: true });
    }
    restoreChrome = gestures?.detachChrome() || restoreChrome;
    const snapshot = await captureUiSnapshot(root, {
      privacyMode: "structural",
      stableKeys,
      annotations,
      environment: {
        theme: document.documentElement.dataset.theme,
        textScale: current.document.viewport.textScale,
      },
      source: {
        artifactId: request.documentId,
        scenarioId: current.scenarioId,
        stateId: `revision-${request.revision}`,
      },
    });
    if (
      expected !== generation ||
      expectedGesture !== gestureEpoch ||
      gestures?.active ||
      request.documentHash !== current.documentHash
    )
      throw new Error("stale capture");
    send("composition:ui-map-snapshot", {
      requestId: request.requestId,
      documentHash: current.documentHash,
      snapshot,
    });
  } catch {
    send("composition:ui-map-error", { requestId: request.requestId });
  } finally {
    restoreChrome();
  }
}

window.addEventListener("message", async (event) => {
  if (
    event.source !== parent ||
    event.origin !== location.origin ||
    event.data?.channel !== channel
  )
    return;
  const data = event.data;
  if (data.type === "composition:render") {
    generation++;
    clearTimeout(captureTimer);
    resizeObserver?.disconnect();
    resizeObserver = null;
    gestures?.dispose();
    layoutGrids?.dispose();
    layoutGrids = null;
    goldenCanon?.dispose();
    goldenCanon = null;
    mounted?.dispose();
    current = data;
    const theme =
      data.theme === "dark" ||
      (data.theme === "auto" &&
        matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark"
        : "light";
    document.documentElement.dataset.theme = theme;
    mounted = renderComposition({
      root,
      document: data.document,
      definitions: data.definitions,
      palette: data.palette,
      profile: data.profile,
      theme,
      onSelect: (id) => send("composition:select", { id }),
    });
    gestures = bindCompositionGestures({
      root,
      model: data.document,
      elements: mounted.elements,
      onSelect: (id) => send("composition:select", { id }),
      onUndo: () =>
        send("composition:undo", {
          documentHash: current.documentHash,
          scenarioId: current.scenarioId,
        }),
      onCommit: (operations) =>
        send("composition:gesture", {
          documentHash: current.documentHash,
          scenarioId: current.scenarioId,
          operations,
        }),
      onActivity: (active) => {
        gestureEpoch++;
        if (active) {
          goldenCanon?.setEvidence(null);
          layoutGrids?.stale();
          if (layoutGrids?.configurationId)
            send("composition:grid-stale", {
              configurationId: layoutGrids.configurationId,
            });
        }
        if (!active) scheduleCapture();
      },
    });
    layoutGrids = createLayoutGridInspection({
      root,
      elements: mounted.elements,
      onActivity: scheduleCapture,
    });
    if (data.layoutGrids) layoutGrids.setConfiguration(data.layoutGrids);
    goldenCanon = createGoldenCanonInspection({
      root,
      elements: mounted.elements,
    });
    if (data.goldenCanon) goldenCanon.setState(data.goldenCanon);
    editing = data.editing || editing;
    gestures.setState(editing);
    applyCompositionInspection(mounted.elements, inspection);
    observeLayout();
    await capture(data.requestId);
  } else if (data.type === "composition:layout-grids") {
    layoutGrids?.setConfiguration(data.configuration);
    scheduleCapture();
  } else if (data.type === "composition:layout-grid-report") {
    try {
      layoutGrids?.apply(data.result);
    } catch {
      layoutGrids?.stale();
    }
  } else if (data.type === "composition:layout-grids-clear") {
    layoutGrids?.stale();
  } else if (data.type === "composition:golden-canon") {
    try {
      goldenCanon?.setState(data.config);
    } catch {
      /* Keep the last validated diagnostic configuration. */
    }
  } else if (data.type === "composition:editing") {
    editing = data.config;
    gestures?.setState(editing);
  } else if (data.type === "composition:inspection") {
    try {
      inspection = applyCompositionInspection(
        mounted?.elements || new Map(),
        data.config,
      );
    } catch {
      // An invalid internal message cannot change the current inspection or execute arbitrary styling.
    }
  } else if (data.type === "composition:measure") await capture(data.requestId);
  else if (data.type === "composition:capture-ui-map") await captureMap(data);
});
/** Re-measure only after real viewport/content activity; no idle animation or polling loop is installed. */
function scheduleCapture() {
  layoutGrids?.stale();
  if (layoutGrids?.configurationId)
    send("composition:grid-stale", {
      configurationId: layoutGrids.configurationId,
    });
  clearTimeout(captureTimer);
  captureTimer = setTimeout(() => capture(`activity-${generation}`), 160);
}
/** Watch only the bounded actual wrappers; outline attributes cannot change their observed layout boxes. */
function observeLayout() {
  if (!window.ResizeObserver) return;
  const expected = generation,
    expectedGesture = gestureEpoch;
  resizeObserver = new window.ResizeObserver(() => {
    if (expected === generation) scheduleCapture();
  });
  let count = 0;
  for (const element of mounted.elements.values()) {
    if (count++ === 200) break;
    resizeObserver.observe(element);
  }
}
/** Release old observation and delayed activity when the owning iframe is removed or navigated. */
function release() {
  generation++;
  clearTimeout(captureTimer);
  resizeObserver?.disconnect();
  resizeObserver = null;
  gestures?.dispose();
  gestures = null;
  layoutGrids?.dispose();
  layoutGrids = null;
  goldenCanon?.dispose();
  goldenCanon = null;
  mounted?.dispose();
  mounted = null;
  current = null;
}
window.addEventListener("scroll", scheduleCapture, true);
window.addEventListener("resize", scheduleCapture);
window.addEventListener("pagehide", release, { once: true });
root.addEventListener("input", scheduleCapture);
root.addEventListener("change", scheduleCapture);
root.addEventListener("click", scheduleCapture);
send("composition:ready");

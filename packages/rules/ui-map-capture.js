/** Explicit-root structural capture. No navigation, field values, full HTML or persistent DOM references. */
const MAX_NODES = 5000,
  MAX_EDGES = 20000,
  MAX_BYTES = 4 * 1024 * 1024;
const KIND_BY_TAG = {
  MAIN: "landmark",
  NAV: "landmark",
  ASIDE: "landmark",
  HEADER: "landmark",
  FOOTER: "landmark",
  SECTION: "section",
  FIELDSET: "group",
  LABEL: "label",
  BUTTON: "action",
  INPUT: "control",
  SELECT: "control",
  TEXTAREA: "control",
  A: "action",
};
const captures = new WeakMap();
let generationCounter = 0;

/** Normalize JSON keys/text and ECMAScript numbers for cross-language hash fixtures. */
export function canonicalUiJson(value) {
  if (value === null || typeof value === "boolean")
    return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Nonfinite JSON number");
    return JSON.stringify(Object.is(value, -0) ? 0 : value);
  }
  if (typeof value === "string") return JSON.stringify(value.normalize("NFC"));
  if (Array.isArray(value))
    return "[" + value.map(canonicalUiJson).join(",") + "]";
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    const normalized = new Map();
    for (const key of Object.keys(value)) {
      const name = key.normalize("NFC");
      if (normalized.has(name)) throw new TypeError("Duplicate normalized key");
      normalized.set(name, value[key]);
    }
    const entries = [];
    for (const key of [...normalized.keys()].sort())
      entries.push(
        JSON.stringify(key) + ":" + canonicalUiJson(normalized.get(key)),
      );
    return "{" + entries.join(",") + "}";
  }
  throw new TypeError("Unsupported JSON value");
}

/** Raise only safe errors; never echo DOM text or a rejected private value. */
function captureError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/** Validate caller options before inspecting the DOM or retaining any text. */
function settings(options) {
  const allowed = new Set([
    "maxNodes",
    "maxBytes",
    "deadlineMs",
    "signal",
    "privacyMode",
    "source",
    "environment",
    "annotations",
    "stableKeys",
    "yieldEvery",
    "clock",
    "yieldControl",
  ]);
  for (const key of Object.keys(options))
    if (!allowed.has(key))
      throw captureError("invalid_snapshot", "Unknown capture option");
  const result = {
    maxNodes: 5000,
    maxBytes: MAX_BYTES,
    deadlineMs: 1000,
    yieldEvery: 100,
    privacyMode: "structural",
    ...options,
  };
  for (const [key, max] of [
    ["maxNodes", MAX_NODES],
    ["maxBytes", MAX_BYTES],
    ["deadlineMs", 1000],
    ["yieldEvery", 100],
  ]) {
    if (!Number.isInteger(result[key]) || result[key] < 1 || result[key] > max)
      throw captureError("limit_exceeded", "Invalid capture limit");
  }
  if (!["structural", "approved-text"].includes(result.privacyMode))
    throw captureError("invalid_snapshot", "Invalid privacy mode");
  validateMetadata(result);
  return result;
}

/** Reject URL-bearing or arbitrary metadata before it can enter an exported structural snapshot. */
function validateMetadata(config) {
  const sourceKeys = new Set([
    "kind",
    "artifactId",
    "scenarioId",
    "stateId",
    "adapter",
    "adapterVersion",
    "provenance",
    "capabilities",
  ]);
  const source = config.source ?? {};
  for (const [key, value] of Object.entries(source)) {
    if (!sourceKeys.has(key))
      throw captureError("invalid_snapshot", "Unknown source metadata");
    if (key === "capabilities") {
      if (
        !Array.isArray(value) ||
        value.length > 32 ||
        value.some(
          (item) =>
            typeof item !== "string" || !/^[A-Za-z0-9_.:-]{1,128}$/.test(item),
        )
      )
        throw captureError("invalid_snapshot", "Invalid capabilities");
    } else if (
      typeof value !== "string" ||
      !/^[A-Za-z0-9_.:-]{1,128}$/.test(value)
    )
      throw captureError(
        "invalid_snapshot",
        "Use opaque local source identifiers",
      );
  }
  if (
    (source.kind && source.kind !== "browser-dom") ||
    (source.provenance && source.provenance !== "caller-reported")
  )
    throw captureError(
      "invalid_snapshot",
      "Capture source kind cannot be overridden",
    );
  const environmentKeys = new Set([
    "viewport",
    "scroll",
    "dpr",
    "browser",
    "browserVersion",
    "theme",
    "contrast",
    "textScale",
    "zoom",
    "direction",
    "writingMode",
  ]);
  for (const key of Object.keys(config.environment ?? {}))
    if (!environmentKeys.has(key))
      throw captureError("invalid_snapshot", "Unknown environment metadata");
}

/** Return rounded browser layout bounds; absent geometry remains unknown. */
function bounds(element) {
  const rectangle = element.getBoundingClientRect();
  const result = {};
  for (const key of ["x", "y", "width", "height"]) {
    const value = rectangle[key];
    if (!Number.isFinite(value)) return null;
    result[key] = Math.round(value * 1000) / 1000;
  }
  return result;
}

/** Inspect at most100 text nodes/256 characters, excluding editable/form contents. */
function boundedLabelText(element) {
  const document = element.ownerDocument,
    window = document.defaultView;
  const walker = document.createTreeWalker(
    element,
    window.NodeFilter.SHOW_TEXT,
  );
  let text = "",
    inspected = 0,
    current;
  while (
    (current = walker.nextNode()) &&
    inspected++ < 100 &&
    text.length < 256
  ) {
    if (
      current.parentElement?.closest("input,textarea,select,[contenteditable]")
    )
      continue;
    text += (current.nodeValue ?? "").slice(0, 256 - text.length);
  }
  return text;
}

/** Resolve safe name metadata without claiming the complete accessible-name computation. */
function nameMetadata(element, mode, root) {
  let present = null,
    source = "unknown",
    content = null;
  if (element.hasAttribute("aria-label")) {
    source = "aria-label";
    const value = (element.getAttribute("aria-label") ?? "").slice(0, 256);
    present = Boolean(value.trim());
    if (mode === "approved-text") content = value;
  } else if (element.hasAttribute("aria-labelledby")) {
    source = "aria-labelledby";
    const tokens = (element.getAttribute("aria-labelledby") ?? "")
      .slice(0, 1024)
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    present = tokens.length ? null : false;
  } else if (element.labels?.length) {
    source = "native-label";
    present = true;
    if (mode === "approved-text") {
      const parts = [];
      for (const label of element.labels)
        if (root.contains(label)) parts.push(boundedLabelText(label));
      content = parts.join(" ");
    }
  } else if (["BUTTON", "A", "LABEL", "LEGEND"].includes(element.tagName)) {
    source = "text";
    // A bounded local text sample establishes presence; structural output never retains it.
    const value = boundedLabelText(element);
    present = Boolean(value.trim());
    if (mode === "approved-text") content = value;
  }
  // Editable content and form values are never an accessible-label source in this adapter.
  if (
    element.isContentEditable ||
    ["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName)
  )
    content = null;
  if (content !== null)
    content = [...content.normalize("NFC")].slice(0, 256).join("");
  return {
    present,
    source,
    text: content,
    redacted: content === null,
    completeness: "approximate",
  };
}

/** Read a nullable programmatic state without confusing an absent attribute with false. */
function stateMetadata(element) {
  const state = {};
  for (const key of [
    "disabled",
    "expanded",
    "selected",
    "invalid",
    "required",
    "checked",
  ]) {
    const aria = element.getAttribute("aria-" + key);
    if (aria !== null) state[key] = aria !== "false";
    else if (
      ["disabled", "required", "checked"].includes(key) &&
      key in element
    )
      state[key] = Boolean(element[key]);
    else state[key] = null;
  }
  return state;
}

/** Read only allowlisted opaque color/spacing styles; gradients and transparency stay unsupported. */
function styleMetadata(style) {
  const output = {};
  for (const [property, key] of [
    ["color", "foreground"],
    ["backgroundColor", "background"],
  ]) {
    const value = style[property];
    if (/^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/.test(value))
      output[key] = value;
  }
  for (const [property, key] of [
    ["fontSize", "fontSize"],
    ["fontWeight", "fontWeight"],
    ["gap", "gap"],
  ]) {
    const value = parseFloat(style[property]);
    if (Number.isFinite(value) && value >= 0) output[key] = value;
  }
  return output;
}

/** Classify clipped layout rectangles within the captured ancestry, without estimating painted ink. */
function clippingState(element, rectangle, root, window) {
  if (!rectangle) return "unknown";
  let current = element.parentElement,
    result = "none";
  for (
    let depth = 0;
    current && root.contains(current) && depth < 128;
    depth++, current = current.parentElement
  ) {
    const style = window.getComputedStyle(current);
    if (
      !/(hidden|clip|scroll|auto)/.test(
        style.overflow + " " + style.overflowX + " " + style.overflowY,
      )
    )
      continue;
    const clip = bounds(current);
    if (!clip) return "unknown";
    const overlapWidth =
      Math.min(rectangle.x + rectangle.width, clip.x + clip.width) -
      Math.max(rectangle.x, clip.x);
    const overlapHeight =
      Math.min(rectangle.y + rectangle.height, clip.y + clip.height) -
      Math.max(rectangle.y, clip.y);
    if (overlapWidth <= 0 || overlapHeight <= 0) return "full";
    if (overlapWidth < rectangle.width || overlapHeight < rectangle.height)
      result = "partial";
  }
  return result;
}

/** Capture one explicitly supplied local root with cooperative cancellation, redaction and bounded traversal. */
/** Observe one node's CSS-pixel AABB, safe semantics and explicitly approved host metadata. */
function captureNode(element, root, config, elements, window, index) {
  const id = "n" + String(index + 1).padStart(6, "0");
  const rectangle = bounds(element),
    style = window.getComputedStyle(element);
  const hidden =
    Boolean(element.closest("[hidden],[inert]")) ||
    style.display === "none" ||
    style.visibility === "hidden";
  let visibility = hidden ? "hidden" : "visible";
  if (!rectangle) visibility = "unknown";
  else if (
    !hidden &&
    (rectangle.x + rectangle.width < 0 ||
      rectangle.y + rectangle.height < 0 ||
      rectangle.x > window.innerWidth ||
      rectangle.y > window.innerHeight)
  )
    visibility = "offscreen";
  const node = {
    id,
    parentId: element === root ? null : elements.get(element.parentElement),
    kind:
      element === root
        ? "page"
        : (KIND_BY_TAG[element.tagName] ?? "decorative"),
    tag: element.tagName.toLowerCase(),
    role: element.getAttribute("role"),
    name: nameMetadata(element, config.privacyMode, root),
    bounds: rectangle,
    visibility,
    clipping: clippingState(element, rectangle, root, window),
    state: stateMetadata(element),
    domOrder: index,
    focusOrder: null,
    focusOrderSource: "unknown",
    style: styleMetadata(style),
  };
  if (["group", "radiogroup", "toolbar"].includes(node.role))
    node.kind = "group";
  if (["main", "navigation", "region", "complementary"].includes(node.role))
    node.kind = "landmark";
  if (config.annotations?.has(element)) {
    const notes = config.annotations.get(element);
    for (const key of Object.keys(notes))
      if (
        ![
          "alignment",
          "corner",
          "intentionalOverlay",
          "boundary",
          "targetException",
        ].includes(key)
      )
        throw captureError("invalid_snapshot", "Unknown host annotation");
    node.annotations = structuredClone(notes);
  }
  if (config.stableKeys?.has(element)) {
    const key = config.stableKeys.get(element);
    if (typeof key !== "string" || !/^[A-Za-z0-9_.:-]{1,128}$/.test(key))
      throw captureError("invalid_snapshot", "Use opaque approved stable keys");
    node.stableKey = key;
  }
  return { node, style };
}

/** Collect bounded factual IDREFs in temporary maps; original identifiers never enter output. */
function collectNodeRelations(
  element,
  node,
  style,
  pending,
  relations,
  nativeIdTargets,
  reasons,
  unsupported,
) {
  const id = node.id;
  // Original DOM IDs exist only in the temporary resolver and never leave this function.
  if (element.id && element.id.length <= 128)
    nativeIdTargets.set(
      element.id,
      nativeIdTargets.has(element.id) ? null : id,
    );
  else if (element.id) reasons.add("relation-limit");
  if (node.parentId)
    relations.push({
      id: "contains:" + node.parentId + ":" + id,
      from: node.parentId,
      to: id,
      type: "contains",
      source: "dom-parent",
      completeness: "exact",
    });
  for (const [attribute, type] of [
    ["aria-labelledby", "labels"],
    ["aria-describedby", "describes"],
    ["aria-controls", "controls"],
  ]) {
    const raw = element.getAttribute(attribute) ?? "";
    if (raw.length > 1024) reasons.add("relation-limit");
    const tokens = raw.slice(0, 1024).trim().split(/\s+/).filter(Boolean);
    for (const token of tokens.slice(0, 100)) {
      if (pending.length >= MAX_EDGES) {
        reasons.add("edge-limit");
        break;
      }
      pending.push({ nodeId: id, token, type });
    }
    if (tokens.length > 100) reasons.add("relation-limit");
  }
  if (
    element.tagName === "LABEL" &&
    element.hasAttribute("for") &&
    (element.getAttribute("for") ?? "").length <= 128 &&
    pending.length < MAX_EDGES
  )
    pending.push({
      nodeId: id,
      token: element.getAttribute("for"),
      type: "labels",
      reverse: true,
    });
  if (element.labels)
    for (const label of element.labels) {
      if (pending.length >= MAX_EDGES) {
        reasons.add("edge-limit");
        break;
      }
      pending.push({ nodeId: id, targetElement: label, type: "labels" });
    }
  if (element.shadowRoot) unsupported.add("shadow-dom");
  if (element.tagName === "IFRAME") unsupported.add("iframe");
  if (element.tagName === "CANVAS") unsupported.add("canvas-content");
  if (element.namespaceURI === "http://www.w3.org/2000/svg")
    unsupported.add("svg-ink");
  if (style.transform && style.transform !== "none")
    unsupported.add("transformed-ink");
  // Pseudo-element ink/accessibility is not measured by this DOM adapter.
  unsupported.add("pseudo-element-ink");
}

/** Resolve only captured targets; outside/truncated references remain safely unresolved facts. */
function resolveRelations(
  pending,
  elements,
  nativeIdTargets,
  relations,
  unresolvedRelations,
  edgeIds,
  reasons,
  checkpoint,
) {
  for (const item of pending) {
    if (!checkpoint()) {
      reasons.add("time-limit");
      return false;
    }
    const target = item.targetElement
      ? elements.get(item.targetElement)
      : nativeIdTargets.get(item.token);
    if (relations.length + unresolvedRelations.length >= MAX_EDGES) {
      reasons.add("edge-limit");
      return false;
    }
    if (!target) {
      unresolvedRelations.push({
        from: item.nodeId,
        type: item.type,
        targetMissing: true,
        source: "dom-idref",
      });
      continue;
    }
    const from = item.type === "labels" && !item.reverse ? target : item.nodeId;
    const to = item.type === "labels" && !item.reverse ? item.nodeId : target;
    const key = item.type + ":" + from + ":" + to;
    if (!edgeIds.has(key)) {
      edgeIds.add(key);
      relations.push({
        id: key,
        from,
        to,
        type: item.type,
        source: "dom-idref",
        completeness: "exact",
      });
    }
  }
  return true;
}

/** Capture one explicitly supplied DOM root; structural privacy and1000ms/5000-node ceilings apply. */
export async function captureUiSnapshot(root, options = {}) {
  if (!root || root.nodeType !== 1 || !root.ownerDocument?.defaultView)
    throw captureError(
      "invalid_snapshot",
      "Supply an explicit DOM element root",
    );
  const config = settings(options),
    document = root.ownerDocument,
    window = document.defaultView;
  const generation = ++generationCounter;
  captures.set(root, generation);
  const clock = config.clock ?? (() => window.performance.now());
  const yieldControl =
    config.yieldControl ??
    (() => new Promise((resolve) => window.setTimeout(resolve, 0)));
  const started = clock(),
    reasons = new Set(),
    unsupported = new Set(),
    nodes = [],
    relations = [],
    unresolvedRelations = [];
  const elements = new Map(),
    nativeIdTargets = new Map(),
    pending = [],
    edgeIds = new Set(),
    bytes = { value: 0 };
  let changed = false,
    omitted = 0;
  const observer = new window.MutationObserver((records) => {
    if (records.length) changed = true;
  });
  observer.observe(root, {
    subtree: true,
    attributes: true,
    childList: true,
    characterData: true,
  });
  /** Check explicit cancellation and prevent an older capture from publishing over a newer generation. */
  const checkpoint = () => {
    if (config.signal?.aborted || captures.get(root) !== generation)
      throw captureError("cancelled", "UI capture cancelled");
    if (clock() - started > config.deadlineMs) return false;
    return true;
  };
  try {
    const walker = document.createTreeWalker(
      root,
      window.NodeFilter.SHOW_ELEMENT,
    );
    let element = root;
    while (element) {
      if (!checkpoint()) {
        reasons.add("time-limit");
        omitted = null;
        break;
      }
      if (nodes.length >= config.maxNodes) {
        reasons.add("node-limit");
        omitted = null;
        break;
      }
      let depth = 0,
        ancestor = element;
      while (ancestor && ancestor !== root) {
        depth++;
        ancestor = ancestor.parentElement;
        if (depth > 128) break;
      }
      if (depth > 128) {
        reasons.add("depth-limit");
        omitted = null;
        break;
      }
      const { node, style } = captureNode(
        element,
        root,
        config,
        elements,
        window,
        nodes.length,
      );
      const id = node.id;
      const estimate = new TextEncoder().encode(
        JSON.stringify(node),
      ).byteLength;
      if (bytes.value + estimate + 2048 > config.maxBytes) {
        reasons.add("byte-limit");
        omitted = null;
        break;
      }
      bytes.value += estimate;
      nodes.push(node);
      elements.set(element, id);
      collectNodeRelations(
        element,
        node,
        style,
        pending,
        relations,
        nativeIdTargets,
        reasons,
        unsupported,
      );
      if (nodes.length % config.yieldEvery === 0) await yieldControl();
      element = walker.nextNode();
    }
    if (!nodes.length) {
      if (reasons.has("time-limit"))
        throw captureError(
          "capture_timeout",
          "Capture deadline expired before root",
        );
      throw captureError(
        "limit_exceeded",
        "Capture budget cannot contain root",
      );
    }
    if (
      !resolveRelations(
        pending,
        elements,
        nativeIdTargets,
        relations,
        unresolvedRelations,
        edgeIds,
        reasons,
        checkpoint,
      )
    )
      omitted = null;
    if (observer.takeRecords().length) changed = true;
    if (changed) reasons.add("dom-mutated");
    if (!checkpoint()) reasons.add("time-limit");
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const environment = {
      viewport,
      scroll: { x: window.scrollX, y: window.scrollY },
      dpr: window.devicePixelRatio ?? null,
      browser: null,
      browserVersion: null,
      theme: "unknown",
      contrast: "unknown",
      textScale: null,
      zoom: null,
      direction:
        window.getComputedStyle(root).direction === "rtl" ? "rtl" : "ltr",
      writingMode: window.getComputedStyle(root).writingMode || null,
      ...config.environment,
    };
    const source = {
      kind: "browser-dom",
      artifactId: "local-root",
      scenarioId: "capture",
      stateId: "current",
      adapter: "ag-dom",
      adapterVersion: "1.0.0",
      provenance: "caller-reported",
      capabilities: ["dom", "bounds", "computed-style"],
      ...config.source,
    };
    let status = "complete";
    if (reasons.size || unsupported.size) status = "partial";
    if (changed) status = "unstable";
    const snapshot = {
      schemaVersion: "ag-design/ui-snapshot-v1",
      capturedAt: new Date().toISOString(),
      captureId: "capture-" + generation,
      source,
      environment,
      scope: {
        rootId: nodes[0].id,
        coordinateSpace: "viewport-css-px",
        selection: "explicit-root",
      },
      nodes,
      relations,
      unresolvedRelations,
      coverage: {
        status,
        inspected: nodes.length,
        omitted,
        reasons: [...reasons].sort(),
        unsupported: [...unsupported].sort(),
        scope: "explicit-root",
      },
      privacy: {
        mode: config.privacyMode,
        redacted: true,
        textRetained: config.privacyMode === "approved-text",
        screenshotsIncluded: false,
      },
    };
    if (
      new TextEncoder().encode(JSON.stringify(snapshot)).byteLength >
      config.maxBytes
    )
      throw captureError("limit_exceeded", "Snapshot exceeds byte budget");
    if (config.signal?.aborted || captures.get(root) !== generation)
      throw captureError("cancelled", "UI capture cancelled");
    return snapshot;
  } finally {
    observer.disconnect();
    elements.clear();
    nativeIdTargets.clear();
    pending.length = 0;
    if (captures.get(root) === generation) captures.delete(root);
  }
}

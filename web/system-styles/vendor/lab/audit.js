// packages/components/width-audit.js
var DECLARED = "[data-ag-width]";
var CONTENT_TAGS = /* @__PURE__ */ new Set(["DIV", "SECTION", "ARTICLE", "MAIN", "ASIDE"]);
var SCHEMA = "ag-design/width-audit-v1";
function auditLayoutWidths(root, { maxNodes = 2e3, maxTargets = 64 } = {}) {
  if (!root?.querySelectorAll || !Number.isInteger(maxNodes) || maxNodes < 1 || maxNodes > 5e3 || !Number.isInteger(maxTargets) || maxTargets < 1 || maxTargets > 64)
    throw new TypeError("Use a local DOM scope,1..5000nodes and1..64targets");
  const document = root.ownerDocument ?? root;
  const view = document.defaultView;
  const walker = document.createTreeWalker(root, 1);
  const targets = [];
  let node = root.nodeType === 1 ? root : walker.nextNode();
  let inspectedNodes = 0, truncated = false;
  while (node) {
    if (inspectedNodes >= maxNodes) {
      truncated = true;
      break;
    }
    inspectedNodes++;
    const style = view.getComputedStyle(node);
    const mode = node.getAttribute("data-ag-width");
    const declared = node.matches(DECLARED);
    const contained = style.containerType?.includes("inline-size");
    const suspect = !declared && !contained && suspectColumn(node, style, view);
    if (declared || contained || suspect || node === root) {
      if (targets.length === maxTargets) {
        truncated = true;
        break;
      }
      targets.push(captureWidth(node, style, view, address(node, root, inspectedNodes), declared, mode));
    }
    node = walker.nextNode();
  }
  const coverage = { declared: 0, inferred: 0, measured: 0, unknown: 0, excluded: 0 };
  for (const target of targets) {
    coverage[target.source]++;
    if (target.status === "unknown") coverage.unknown++;
    else if (target.status === "not-applicable") coverage.excluded++;
    else coverage.measured++;
  }
  let geometryGate = targets.some((target) => target.status === "fail") ? "fail" : "pass";
  if (geometryGate !== "fail" && (truncated || coverage.unknown || !coverage.measured)) geometryGate = "unknown";
  return {
    schemaVersion: SCHEMA,
    targets,
    coverage,
    geometryGate,
    inspectedNodes,
    truncated,
    environment: { viewportWidth: view.innerWidth, scopeWidth: root.nodeType === 1 ? root.getBoundingClientRect().width : null },
    manualRequired: ["purpose-specific minimums", "undeclared candidates", "normal/narrow/text200/narrow-text200", "keyboard/AT/optics"],
    trust: "redacted local DOM geometry; caller-reported evidence, not qualification"
  };
}
function availableWidth(element, view, mode) {
  const parent = element.parentElement;
  if (!parent) return null;
  const style = view.getComputedStyle(parent);
  if (["contents", "none"].includes(style.display)) return null;
  if (mode === "fill" && style.display.includes("grid") && style.gridTemplateColumns.trim().split(/\s+/).length !== 1) return null;
  if (mode === "fill" && style.display.includes("flex") && !style.flexDirection.startsWith("column")) {
    let siblings = 0;
    let visits = 0;
    for (const child of parent.children) {
      if (++visits > 64) return null;
      if (view.getComputedStyle(child).display !== "none" && ++siblings > 1) return null;
    }
    if (siblings !== 1) return null;
  }
  const width = parent.clientWidth - number(style.paddingLeft) - number(style.paddingRight);
  return Number.isFinite(width) && width > 0 ? width : null;
}
function suspectColumn(element, style, view) {
  if (!CONTENT_TAGS.has(element.tagName) || excludedAncestor(element) || element.getAttribute("aria-hidden") === "true" || !element.parentElement) return false;
  const control = element.getAttribute("role") === "textbox" || element.getAttribute("contenteditable") === "true";
  const font = Number.parseFloat(style.fontSize);
  if (control && element.getBoundingClientRect().width >= 2 * font) return false;
  const parent = view.getComputedStyle(element.parentElement);
  if (!parent.display.includes("grid") && !parent.display.includes("flex")) return false;
  const available = element.parentElement.clientWidth - number(parent.paddingLeft) - number(parent.paddingRight);
  return available > 0 && font > 0 && element.getBoundingClientRect().width + 1 < Math.min(12 * font, available) && readableStructure(element);
}
function captureWidth(element, style, view, id, declared, mode) {
  const fontSize = Number.parseFloat(style.fontSize);
  const minEm = element.hasAttribute("data-ag-width-min-em") ? Number(element.getAttribute("data-ag-width-min-em")) : 12;
  const target = {
    id,
    source: declared ? "declared" : "inferred",
    mode: declared ? mode : null,
    width: null,
    availableWidth: null,
    fontSize: Number.isFinite(fontSize) ? fontSize : null,
    minEm: Number.isFinite(minEm) ? minEm : null,
    hidden: false,
    status: "unknown",
    deficitPx: null,
    reason: "unmeasurable"
  };
  if (id.startsWith("unknown-")) {
    target.reason = "identity-limit";
    return target;
  }
  if (!element.isConnected) {
    target.reason = "detached";
    return target;
  }
  let ancestor = element, ancestors = 0;
  while (ancestor) {
    if (++ancestors > 64) {
      target.reason = "ancestor-limit";
      return target;
    }
    const current = view.getComputedStyle(ancestor);
    const inlineZoom = ancestor.style?.zoom;
    if (ancestor.hidden || current.display === "none" || current.visibility === "hidden") {
      target.hidden = true;
      target.status = "not-applicable";
      target.reason = "hidden";
      return target;
    }
    if (current.transform && current.transform !== "none" || [current.scale, current.rotate, current.translate].some((value) => value && value !== "none") || current.zoom && !["1", "normal"].includes(current.zoom) || inlineZoom && !["1", "normal"].includes(String(inlineZoom))) {
      target.reason = "transformed";
      return target;
    }
    ancestor = ancestor.parentElement;
  }
  if (declared && (!["fill", "content"].includes(mode) || !Number.isFinite(minEm) || minEm < 0.5 || minEm > 100)) {
    target.reason = "invalid-declaration";
    return target;
  }
  if (!element.getClientRects().length || style.writingMode && style.writingMode !== "horizontal-tb" || ["absolute", "fixed"].includes(style.position)) return target;
  const available = availableWidth(element, view, mode ?? "content");
  if (available === null) {
    target.reason = "unsupported-slot";
    return target;
  }
  const width = element.getBoundingClientRect().width;
  if (!Number.isFinite(width) || width < 0 || !Number.isFinite(fontSize) || fontSize <= 0) return target;
  target.width = width;
  target.availableWidth = available;
  if (!declared) {
    target.reason = "undeclared-purpose";
    return target;
  }
  const minimum = mode === "fill" ? available : Math.min(minEm * fontSize, available);
  target.deficitPx = Math.max(0, minimum - width);
  target.status = target.deficitPx > 1 ? "fail" : "pass";
  target.reason = target.status === "fail" ? "width-deficit" : "measured";
  return target;
}
function number(value) {
  return Number.parseFloat(value) || 0;
}
function readableStructure(element) {
  if (hasDirectText(element)) return true;
  const pending = [];
  for (const child of element.children) {
    if (pending.length >= 65) return true;
    pending.push(child);
  }
  let visited = 0;
  while (pending.length && visited < 64) {
    const node = pending.pop();
    visited++;
    if (["P", "H1", "H2", "H3", "H4", "ARTICLE"].includes(node.tagName)) return true;
    if (["BUTTON", "SELECT", "TEXTAREA", "INPUT", "SVG", "LABEL"].includes(node.tagName)) continue;
    if (hasDirectText(node)) return true;
    for (const child of node.children) {
      if (pending.length >= 65) return true;
      pending.push(child);
    }
  }
  return pending.length > 0;
}
function hasDirectText(element) {
  let visited = 0;
  for (const node of element.childNodes) {
    if (++visited > 64) return true;
    if (node.nodeType === 3 && node.nodeValue.trim()) return true;
  }
  return false;
}
function address(element, root, fallback) {
  if (root.nodeType === 9) root = root.documentElement;
  const parts = [];
  let node = element;
  while (node !== root) {
    if (!node?.parentElement || parts.length === 16) return `unknown-${fallback}`;
    let index = 1, sibling = node.previousElementSibling;
    while (sibling) {
      if (++index > 128) return `unknown-${fallback}`;
      sibling = sibling.previousElementSibling;
    }
    parts.unshift(index);
    node = node.parentElement;
  }
  return "width-root" + (parts.length ? "-" + parts.join("-") : "");
}
function excludedAncestor(element) {
  let node = element, count = 0;
  while (node && count++ < 64) {
    if (node.getAttribute("aria-hidden") === "true" || node.getAttribute("role") === "toolbar") return true;
    node = node.parentElement;
  }
  return false;
}

// packages/components/form-row-inspection.js
function inspectFormRow({
  container,
  controls,
  layout = "row",
  direction = "ltr",
  tolerance = 1,
  tracks = false
} = {}) {
  if (typeof tracks !== "boolean" || !Array.isArray(controls) || !controls.length || controls.length > 32 || !["row", "stack"].includes(layout) || !["ltr", "rtl"].includes(direction) || !Number.isFinite(tolerance) || tolerance < 0 || tolerance > 4)
    throw new TypeError(
      "Use a declared row/stack, 1\u201332 controls and a 0\u20134 CSS px tolerance"
    );
  const ids = /* @__PURE__ */ new Set();
  for (const item of controls) {
    if (!item || !/^[a-z][a-z0-9_-]{0,80}$/i.test(item.id) || ids.has(item.id))
      throw new TypeError("Control IDs must be unique bounded identifiers");
    ids.add(item.id);
    validateRect(item.rect);
    if (item.comparableHeight !== void 0 && typeof item.comparableHeight !== "boolean")
      throw new TypeError("comparableHeight must be boolean");
    if (tracks) {
      validateRect(item.label);
      if (item.feedback != null && (!Array.isArray(item.feedback) || item.feedback.length > 8))
        throw new TypeError(
          "Use up to eight feedback rectangles, or null for missing evidence"
        );
      for (const rect of item.feedback ?? []) validateRect(rect);
    }
  }
  validateRect(container);
  const measured = controls.filter((item) => item.rect != null);
  const checks = [];
  const complete = measured.length === controls.length;
  const comparable = complete && measured.length > 1;
  if (layout === "row") {
    checks.push(
      check(
        "form-row-control-alignment",
        comparable ? spread(measured, "y") : null,
        tolerance
      )
    );
    const family = measured.filter((item) => item.comparableHeight !== false);
    checks.push(
      check(
        "form-row-common-density",
        complete && family.length > 1 ? spread(family, "height") : null,
        tolerance
      )
    );
  }
  let orderResidual = 0;
  for (let index = 1; index < measured.length; index++) {
    const previous = measured[index - 1].rect, next = measured[index].rect;
    const residual = layout === "stack" ? previous.y + previous.height - next.y : direction === "rtl" ? next.x + next.width - previous.x : previous.x + previous.width - next.x;
    orderResidual = Math.max(orderResidual, residual);
  }
  checks.push(
    check(
      "form-row-reading-order",
      comparable ? orderResidual : null,
      tolerance
    )
  );
  if (tracks)
    checks.push(...inspectTracks(controls, { layout, direction, tolerance }));
  let overflow = 0;
  if (container != null) {
    for (const item of measured) {
      const rectangles = [item.rect];
      if (tracks) rectangles.push(item.label, ...item.feedback ?? []);
      for (const rect of rectangles) {
        if (!rect) continue;
        overflow = Math.max(
          overflow,
          container.x - rect.x,
          container.y - rect.y,
          rect.x + rect.width - container.x - container.width,
          rect.y + rect.height - container.y - container.height
        );
      }
    }
  }
  checks.push(
    check(
      "form-row-containment",
      complete && container != null ? overflow : null,
      tolerance
    )
  );
  const failed = checks.some((item) => item.status === "fail");
  const unknown = checks.some((item) => item.status === "unknown");
  return {
    schemaVersion: "ag-design/form-row-inspection-v1",
    layout,
    direction,
    tracks,
    tolerance,
    measuredControls: measured.length,
    declaredControls: controls.length,
    checks,
    geometryGate: failed ? "fail" : unknown ? "unknown" : "pass",
    manualRequired: [
      "semantic grouping",
      "persistent labels and descriptions",
      "feedback growth",
      "keyboard and assistive technology",
      "narrow and enlarged text scenarios"
    ],
    trust: "caller-measured CSS rectangles; no execution attestation or accessibility certification"
  };
}
function inspectTracks(controls, { layout, direction, tolerance }) {
  const complete = controls.every(
    (item) => item.rect && item.label && Array.isArray(item.feedback) && item.feedback.every(Boolean)
  );
  let edge = 0, overlap = 0;
  if (complete) {
    let previousBottom = null;
    for (const item of controls) {
      const start = (rect) => direction === "rtl" ? rect.x + rect.width : rect.x;
      edge = Math.max(edge, Math.abs(start(item.label) - start(item.rect)));
      overlap = Math.max(
        overlap,
        item.label.y + item.label.height - item.rect.y
      );
      let bottom = item.rect.y + item.rect.height;
      for (const rect of item.feedback) {
        edge = Math.max(edge, Math.abs(start(rect) - start(item.rect)));
        overlap = Math.max(overlap, bottom - rect.y);
        bottom = Math.max(bottom, rect.y + rect.height);
      }
      if (layout === "stack" && previousBottom !== null)
        overlap = Math.max(overlap, previousBottom - item.label.y);
      previousBottom = bottom;
    }
  }
  const labels = controls.map((item) => ({ rect: item.label }));
  const checks = [
    check("form-field-inline-alignment", complete ? edge : null, tolerance),
    check("form-field-track-order", complete ? overlap : null, tolerance)
  ];
  if (layout === "row")
    checks.push(
      check(
        "form-row-label-alignment",
        complete && controls.length > 1 ? spread(labels, "y") : null,
        tolerance
      )
    );
  return checks;
}
function validateRect(rect) {
  if (rect == null) return;
  if (typeof rect !== "object" || Array.isArray(rect))
    throw new TypeError("Rectangle required");
  for (const key of ["x", "y", "width", "height"])
    if (!Number.isFinite(rect[key]) || Math.abs(rect[key]) > 1e7)
      throw new TypeError("Use bounded finite CSS pixel geometry");
  if (rect.width <= 0 || rect.height <= 0)
    throw new TypeError("Use positive visible control bounds");
}
function spread(items, key) {
  let minimum = Infinity, maximum = -Infinity;
  for (const { rect } of items) {
    minimum = Math.min(minimum, rect[key]);
    maximum = Math.max(maximum, rect[key]);
  }
  return maximum - minimum;
}
function check(id, residualPx, tolerance) {
  return {
    id,
    residualPx,
    status: residualPx === null ? "unknown" : residualPx <= tolerance ? "pass" : "fail"
  };
}

// packages/components/form-row-audit.js
var ROW = "[data-ag-form-row]";
function auditFormRows(root, { maxRows = 32, maxNodes = 2e3 } = {}) {
  if (!root?.querySelectorAll || !Number.isInteger(maxRows) || maxRows < 1 || maxRows > 32 || !Number.isInteger(maxNodes) || maxNodes < 1 || maxNodes > 5e3)
    throw new TypeError("Use a local DOM root, 1\u201332 rows and 1\u20135000 nodes");
  const document = root.ownerDocument ?? root;
  const walker = document.createTreeWalker(root, 1);
  const rows = [];
  const capturedRows = /* @__PURE__ */ new Set();
  const visibleControls = [];
  let node = root.nodeType === 1 ? root : walker.nextNode();
  let inspectedNodes = 0, truncated = false;
  while (node) {
    if (inspectedNodes >= maxNodes) {
      truncated = true;
      break;
    }
    inspectedNodes++;
    if (isTextControl(node) && visible(node)) visibleControls.push(node);
    if (node.matches(ROW) && visible(node)) {
      if (rows.length >= maxRows) {
        truncated = true;
        break;
      }
      rows.push(captureRow(node, `row-${rows.length + 1}`));
      capturedRows.add(node);
    }
    node = walker.nextNode();
  }
  let declaredControls = 0;
  for (const control of visibleControls) {
    const field = control.closest("[data-ag-form-field]");
    if (field && capturedRows.has(field.parentElement)) declaredControls++;
  }
  let measuredControls = 0;
  for (const row of rows) {
    for (const field of row.facts?.controls ?? []) {
      if (field.rect !== null) measuredControls++;
    }
  }
  const coverage = {
    visibleControls: visibleControls.length,
    declaredControls,
    undeclaredControls: visibleControls.length - declaredControls,
    measuredControls
  };
  let geometryGate = "pass";
  if (coverage.undeclaredControls > 0 || truncated || rows.length === 0 || rows.some((row) => row.geometryGate === "unknown"))
    geometryGate = "unknown";
  if (rows.some((row) => row.geometryGate === "fail")) geometryGate = "fail";
  return {
    schemaVersion: "ag-design/form-row-audit-v1",
    rows,
    coverage,
    geometryGate,
    truncated,
    inspectedNodes,
    scope: "declared above-control field groups only",
    manualRequired: [
      "undeclared groups and side labels",
      "label meaning and typography",
      "keyboard and AT",
      "narrow and enlarged text scenarios",
      "dynamic feedback growth"
    ],
    trust: "local DOM rectangles; partial evidence, not qualification"
  };
}
function isTextControl(element) {
  if (element.tagName === "SELECT" || element.tagName === "TEXTAREA")
    return true;
  return element.tagName === "INPUT" && [
    "text",
    "email",
    "search",
    "url",
    "tel",
    "password",
    "number",
    "date",
    "time",
    "datetime-local",
    "month",
    "week"
  ].includes(element.type);
}
function captureRow(row, id) {
  const fields = [];
  if (row.children.length > 64)
    return unknownRow(id, "too-many-direct-children");
  for (const child of row.children) {
    if (fields.length >= 32) return unknownRow(id, "too-many-fields");
    if (child.matches("[data-ag-form-field]") && visible(child))
      fields.push(child);
  }
  const view = row.ownerDocument.defaultView;
  const style = view.getComputedStyle(row);
  const layout = resolveLayout(row, fields, style);
  if (!layout || fields.length === 0 || unsupportedGeometry(row))
    return unknownRow(id, "missing-fields-or-unsupported-layout");
  const controls = fields.map(
    (field, index) => captureField(field, `field-${index + 1}`)
  );
  const facts = {
    container: bounds(row),
    controls,
    layout,
    direction: style.direction || "ltr",
    tracks: true
  };
  try {
    return { id, facts, ...inspectFormRow(facts) };
  } catch (error) {
    if (error instanceof TypeError)
      return unknownRow(id, "invalid-or-unbounded-geometry");
    throw error;
  }
}
function resolveLayout(row, fields, style) {
  const declared = row.getAttribute("data-ag-form-row");
  if (["row", "stack"].includes(declared)) return declared;
  if (declared !== "auto") return null;
  if (style.display === "flex" && style.flexWrap === "nowrap") {
    if (style.flexDirection === "row") return "row";
    if (style.flexDirection === "column") return "stack";
  }
  if (style.display !== "grid") return null;
  const tracks = style.gridTemplateColumns.trim().split(/\s+/);
  if (!tracks.every((track) => /^\d+(?:\.\d+)?px$/.test(track))) return null;
  if (tracks.length === 1) return "stack";
  if (tracks.length !== fields.length) return null;
  const tops = fields.map((field) => field.getBoundingClientRect().top);
  if (Math.max(...tops) - Math.min(...tops) > 1) return null;
  return "row";
}
function captureField(field, id) {
  const walker = field.ownerDocument.createTreeWalker(field, 1);
  const candidates = [];
  let node = walker.nextNode(), count = 0;
  while (node && count < 128) {
    count++;
    if (node.matches("input:not([type=hidden]),select,textarea"))
      candidates.push(node);
    node = walker.nextNode();
  }
  const control = !node && candidates.length === 1 ? candidates[0] : null;
  const result = { id, rect: null, label: null, feedback: null };
  if (!control || !visible(control) || unsupportedGeometry(control))
    return result;
  if (control.tagName === "INPUT" && ![
    "text",
    "email",
    "search",
    "url",
    "tel",
    "password",
    "number",
    "date",
    "time",
    "datetime-local",
    "month",
    "week"
  ].includes(control.type))
    return result;
  result.rect = bounds(control);
  result.comparableHeight = control.tagName !== "TEXTAREA" && !control.multiple;
  const labelReferences = control.getAttribute("aria-labelledby") ?? "";
  const descriptionReferences = control.getAttribute("aria-describedby") ?? "";
  if (labelReferences.length > 1024 || descriptionReferences.length > 1024)
    return result;
  const named = labelReferences.trim().split(/\s+/).filter(Boolean);
  let label = named.length === 1 ? field.ownerDocument.getElementById(named[0]) : null;
  if (named.length === 0 && control.labels?.length === 1)
    label = control.labels[0];
  if (label && !label.contains(control) && field.contains(label) && visible(label) && !unsupportedGeometry(label))
    result.label = bounds(label);
  const ids = descriptionReferences.trim().split(/\s+/).filter(Boolean);
  if (ids.length > 8) return result;
  const feedback = [];
  for (const reference of ids) {
    const element = field.ownerDocument.getElementById(reference);
    if (!element || !field.contains(element)) return result;
    if (unsupportedGeometry(element)) return result;
    if (visible(element)) feedback.push(element);
  }
  feedback.sort(
    (a, b) => a === b ? 0 : a.compareDocumentPosition(b) & 4 ? -1 : 1
  );
  result.feedback = feedback.map(bounds);
  return result;
}
function unsupportedGeometry(element) {
  const view = element.ownerDocument.defaultView;
  let depth = 0;
  for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
    if (++depth > 64) return true;
    const style = view.getComputedStyle(ancestor);
    for (const property of ["transform", "scale", "rotate", "translate"]) {
      const value = style[property];
      if (value && value !== "none") return true;
    }
    if (style.writingMode && style.writingMode !== "horizontal-tb") return true;
  }
  return false;
}
function visible(element) {
  if (element.closest("[hidden],[inert]") || element.getClientRects().length === 0)
    return false;
  const visibility = element.ownerDocument.defaultView.getComputedStyle(element).visibility;
  const rect = element.getBoundingClientRect();
  return visibility !== "hidden" && visibility !== "collapse" && rect.width > 0 && rect.height > 0;
}
function bounds(element) {
  const { x, y, width, height } = element.getBoundingClientRect();
  return { x, y, width, height };
}
function unknownRow(id, reason) {
  return { id, reason, geometryGate: "unknown", checks: [] };
}

// packages/components/audit.js
function contrastRatio(first, second) {
  const luminance = (channels) => {
    const linear = channels.map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function auditInterface(root, { maxElements = 500 } = {}) {
  if (!Number.isInteger(maxElements) || maxElements < 1 || maxElements > 2e3)
    throw new RangeError("maxElements must be 1..2000");
  const findings = [], document = root.ownerDocument ?? root;
  const controls = root.querySelectorAll(
    "button,input,select,textarea,a[href]"
  );
  const add = (element, ruleId, summary) => findings.push({
    ruleId,
    componentId: element.dataset.agComponent,
    severity: "warning",
    summary,
    evidence: element.id ? `#${element.id}` : element.tagName.toLowerCase()
  });
  let inspected = 0;
  for (const element of controls) {
    if (inspected >= maxElements) break;
    if (element.closest("[hidden],[inert]") || element.type === "hidden" || element.getClientRects().length === 0)
      continue;
    inspected++;
    const labelledBy = (element.getAttribute("aria-labelledby") ?? "").split(/\s+/).filter(Boolean);
    let name = element.getAttribute("aria-label") ?? "";
    for (const id of labelledBy)
      name += document.getElementById(id)?.textContent ?? "";
    for (const label of element.labels ?? []) name += label.textContent;
    if (["BUTTON", "A"].includes(element.tagName)) name += element.textContent;
    if (!name.trim())
      add(element, "accessible-name", "\u0423 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430 \u043D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0433\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F.");
    const size = element.getBoundingClientRect();
    if (size.width < 24 || size.height < 24)
      add(
        element,
        "target-size",
        "\u041E\u0431\u043B\u0430\u0441\u0442\u044C \u043D\u0430\u0436\u0430\u0442\u0438\u044F \u043C\u0435\u043D\u044C\u0448\u0435 24 CSS px; \u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0438\u0441\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F WCAG \u0438 \u0440\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u044F."
      );
    if (element.hasAttribute("aria-controls") && !document.getElementById(element.getAttribute("aria-controls")))
      add(
        element,
        "disclosure-state",
        "aria-controls \u0441\u0441\u044B\u043B\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0439 \u044D\u043B\u0435\u043C\u0435\u043D\u0442."
      );
  }
  const layoutWidths = auditLayoutWidths(root);
  for (const target of layoutWidths.targets) {
    if (target.status !== "fail" && target.status !== "unknown") continue;
    findings.push({
      ruleId: target.status === "fail" ? "layout-width-integrity" : "layout-width-scenarios",
      severity: "warning",
      evidence: `${target.id}; ${target.reason}; width=${target.width}; available=${target.availableWidth}; deficit=${target.deficitPx}`,
      summary: target.status === "fail" ? "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u0430\u044F \u0448\u0438\u0440\u0438\u043D\u0430 \u043A\u043E\u0440\u043D\u044F \u0438\u043B\u0438 \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0435\u0439 \u043A\u043E\u043B\u043E\u043D\u043A\u0438." : "\u0428\u0438\u0440\u0438\u043D\u0430 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430 \u043E\u0441\u0442\u0430\u043B\u0430\u0441\u044C \u0431\u0435\u0437 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043D\u043D\u043E\u0439 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438."
    });
  }
  const formRows = auditFormRows(root);
  if (formRows.coverage.undeclaredControls > 0) {
    findings.push({
      ruleId: "form-row-semantic-group",
      severity: "warning",
      evidence: `${formRows.coverage.undeclaredControls} visible text controls outside declared field groups`,
      summary: "\u0427\u0430\u0441\u0442\u044C \u0432\u0438\u0434\u0438\u043C\u044B\u0445 \u043F\u043E\u043B\u0435\u0439 \u043D\u0435 \u043E\u0445\u0432\u0430\u0447\u0435\u043D\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u043E\u0439 \u043A\u043E\u043C\u043F\u043E\u043D\u043E\u0432\u043A\u0438."
    });
  }
  for (const row of formRows.rows) {
    for (const check2 of row.checks) {
      if (check2.status !== "fail") continue;
      const ruleId = [
        "form-row-containment",
        "form-row-reading-order"
      ].includes(check2.id) ? "form-row-reflow-order" : check2.id;
      findings.push({
        ruleId,
        severity: "warning",
        evidence: `${row.id}; ${check2.id}: ${check2.residualPx} CSS px; tolerance ${row.tolerance} CSS px`,
        summary: `\u0413\u0435\u043E\u043C\u0435\u0442\u0440\u0438\u044F \u0444\u043E\u0440\u043C\u044B: ${check2.id}, \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u0438\u0435 ${check2.residualPx.toFixed(2)} CSS px (\u0434\u043E\u043F\u0443\u0441\u043A ${row.tolerance}).`
      });
    }
  }
  return {
    schemaVersion: "ag-design/audit-v1",
    inspected,
    truncated: inspected >= maxElements,
    findings,
    formRows,
    layoutWidths,
    manualRequired: [
      "keyboard-flow",
      "contrast",
      "zoom-reflow",
      "native-shell",
      "screen-reader"
    ],
    verdict: findings.length ? "review" : "manual-review-required"
  };
}
export {
  auditFormRows,
  auditInterface,
  auditLayoutWidths,
  contrastRatio
};

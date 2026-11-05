import { mountSandboxComponent } from "./sandbox-components.js";
import { applyColorProfile } from "./vendor/ag-design/index.js";
import { compositionClipping } from "./composition-clipping.js";
export { compositionClipping } from "./composition-clipping.js";

/** Apply the normalized document layout to a real DOM node; no source or arbitrary CSS is executed. */
export function applyCompositionLayout(element, node, parent) {
  const layout = node.layout,
    style = element.style;
  style.position =
    parent?.layout.mode === "free" || !parent ? "absolute" : "relative";
  style.left = style.position === "absolute" ? `${layout.x}px` : "";
  style.top = style.position === "absolute" ? `${layout.y}px` : "";
  const fillsRow = parent?.layout.mode === "row" && layout.width === "fill";
  const fillsColumn =
    parent?.layout.mode === "column" && layout.height === "fill";
  const mainAxisFill = fillsRow || fillsColumn;
  for (const key of ["width", "height"]) {
    const value = layout[key];
    const sharesMainAxis = key === "width" ? fillsRow : fillsColumn;
    let dimension = "100%";
    if (typeof value === "number") dimension = `${value}px`;
    else if (value === "hug") dimension = "max-content";
    else if (sharesMainAxis) dimension = "auto";
    style[key] = dimension;
  }
  for (const key of ["minWidth", "minHeight", "maxWidth", "maxHeight"]) {
    style[key] = typeof layout[key] === "number" ? `${layout[key]}px` : "";
  }
  style.padding = `${layout.padding}px`;
  style.gap = `${layout.gap}px`;
  style.alignItems = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    stretch: "stretch",
  }[layout.align];
  style.display =
    layout.mode === "grid" ? "grid" : layout.mode === "free" ? "block" : "flex";
  style.flexDirection = layout.mode === "row" ? "row" : "column";
  style.gridTemplateColumns =
    layout.mode === "grid" ? `repeat(${layout.columns}, minmax(0, 1fr))` : "";
  // Fill divides the remaining flex main axis; 100% would give every sibling the whole parent.
  style.flexGrow = mainAxisFill ? "1" : "0";
  style.flexBasis = mainAxisFill ? "0px" : "auto";
  style.flexShrink = mainAxisFill ? "1" : "0";
}

/**
 * Simulate text-only enlargement, including fixed-pixel component typography.
 * Read every baseline before writing so inherited text is not enlarged twice. Layout sizes,
 * camera coordinates and non-text SVG shapes are untouched; canvas/image text is unsupported.
 */
export function applyCompositionTextScale(root, scale) {
  const view = root.ownerDocument.defaultView;
  const html = root.ownerDocument.documentElement;
  const baselineRootPx = parseFloat(view.getComputedStyle(html).fontSize);
  const all = [...root.querySelectorAll("*")];
  const records = [];
  let complete = all.length <= 5000 && Number.isFinite(baselineRootPx);
  for (const element of all.slice(0, 5000)) {
    if (element.closest('[aria-hidden="true"]')) continue;
    const svg = element.namespaceURI === "http://www.w3.org/2000/svg";
    if (svg && !["text", "tspan"].includes(element.localName)) continue;
    const control = [
      "BUTTON",
      "INPUT",
      "TEXTAREA",
      "SELECT",
      "OPTION",
    ].includes(element.tagName);
    const directText = [...element.childNodes].some(
      (child) => child.nodeType === 3 && child.textContent.trim(),
    );
    if (!control && !directText) continue;
    const computed = view.getComputedStyle(element);
    const fontSize = parseFloat(computed.fontSize);
    if (!Number.isFinite(fontSize)) {
      complete = false;
      continue;
    }
    const lineHeight = computed.lineHeight.endsWith("px")
      ? parseFloat(computed.lineHeight)
      : null;
    records.push({ element, fontSize, lineHeight });
  }
  if (scale !== 1)
    for (const record of records) {
      record.element.style.fontSize = `${record.fontSize * scale}px`;
      if (record.lineHeight !== null)
        record.element.style.lineHeight = `${record.lineHeight * scale}px`;
    }
  html.style.fontSize = `${scale * 100}%`;
  return {
    method: "computed-dom-text-scale-v1",
    baselineRootPx,
    targetCount: records.length,
    complete,
    limitations:
      "DOM text/control fonts only; canvas, images, native zoom and assistive technology need separate checks.",
  };
}

/** Render trusted local AG factories and keep their disposal independent from the serializable document. */
export function renderComposition({
  root,
  document: model,
  definitions,
  palette,
  profile,
  theme = "light",
  onSelect = () => {},
}) {
  root.replaceChildren();
  root.dir = model.viewport.direction;
  root.ownerDocument.documentElement.style.fontSize = "100%";
  if (profile) applyColorProfile(root, profile, theme);
  const byId = new Map(model.nodes.map((node) => [node.id, node]));
  const elements = new Map(),
    samples = [],
    errors = [];
  for (const node of model.nodes) {
    const element = root.ownerDocument.createElement("div");
    element.dataset.compositionNode = node.id;
    element.className = `composition-node composition-node--${node.kind}`;
    element.setAttribute("aria-label", node.title || node.id);
    applyCompositionLayout(element, node, byId.get(node.parentId));
    if (node.kind === "frame" && node.props.sample === true) {
      element.classList.add("composition-sample");
      const heading = root.ownerDocument.createElement("h3");
      heading.className = "composition-sample-heading";
      heading.textContent = node.title;
      element.append(heading);
    }
    if (node.kind === "component") {
      try {
        const definition = definitions.find(
          (item) => item.id === node.component,
        );
        if (!definition) throw new Error("Определение компонента недоступно");
        const sample = mountSandboxComponent(
          node,
          definition,
          palette,
          profile,
        );
        element.append(sample.element);
        samples.push(sample);
      } catch (error) {
        element.textContent = `${node.title}: ${error.message}`;
        element.dataset.renderError = "true";
        errors.push(node.id);
      }
    }
    elements.set(node.id, element);
  }
  for (const node of model.nodes)
    (elements.get(node.parentId) || root).append(elements.get(node.id));
  const textScale = applyCompositionTextScale(root, model.viewport.textScale);
  if (!textScale.complete) errors.push("text-scale-unsupported");
  const select = (event) => {
    const node = event.target.closest("[data-composition-node]");
    if (node) onSelect(node.dataset.compositionNode);
  };
  root.addEventListener("click", select, true);
  return {
    elements,
    errors,
    textScale,
    dispose() {
      root.removeEventListener("click", select, true);
      for (const sample of samples) sample.dispose?.();
      root.replaceChildren();
    },
  };
}

/** Capture current DOM rectangles. Camera transforms live outside this iframe and do not affect these values. */
export function measureComposition({
  root,
  model,
  elements,
  documentHash,
  scenarioId,
  environment,
  fontsReady,
  stable,
  errors,
  textScale,
}) {
  const nodes = [];
  const view = root.ownerDocument.defaultView;
  for (const node of model.nodes) {
    const element = elements.get(node.id),
      bounds = element.getBoundingClientRect();
    const style = view.getComputedStyle(element);
    const control = element.querySelector(
      "button,input,select,textarea,a[href],[tabindex]",
    );
    const visible =
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      bounds.width > 0 &&
      bounds.height > 0;
    const rect = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
    const clipped = compositionClipping(element, view);
    nodes.push({
      id: node.id,
      rect,
      visible,
      clipped,
      role:
        control?.getAttribute("role") ||
        control?.tagName.toLowerCase() ||
        "group",
      name:
        control?.getAttribute("aria-label") ||
        control?.labels?.[0]?.textContent ||
        control?.textContent?.trim() ||
        "",
      focusable: !!control && !control.disabled && control.tabIndex >= 0,
    });
  }
  const computed = view.getComputedStyle(root.ownerDocument.documentElement);
  const viewport = {
    width: view.innerWidth,
    height: view.innerHeight,
    direction: view.getComputedStyle(root).direction,
    textScale:
      parseFloat(computed.fontSize) / (textScale?.baselineRootPx || 16),
  };
  return {
    documentHash,
    scenarioId,
    environment,
    viewport,
    method: "dom-client-rects-v1",
    scope: "composition",
    complete: stable && errors.length === 0,
    fontsReady,
    nodes,
  };
}

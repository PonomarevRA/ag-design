import { createLayoutGridOverlay } from "./vendor/ag-design/layout-grid-overlay.js";

/** Copy only finite rectangle coordinates; never serialize labels, text, attributes or field values. */
function box(element) {
  const r = element.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}

/** Read meaningful direct HTML blocks, bypassing a bounded chain of single-child factory wrappers. */
function parts(element, onTruncate) {
  let current = element;
  for (let depth = 0; depth < 3; depth++) {
    const children = [];
    let visited = 0;
    for (const node of current.children) {
      if (++visited > 64 || children.length >= 32) {
        onTruncate();
        break;
      }
      if (
        node.namespaceURI === "http://www.w3.org/1999/xhtml" &&
        !["SCRIPT", "STYLE", "TEMPLATE"].includes(node.tagName) &&
        node.getAttribute("aria-hidden") !== "true"
      )
        children.push(node);
    }
    if (children.length !== 1) return children;
    if (
      ["INPUT", "BUTTON", "SELECT", "TEXTAREA", "IMG", "CANVAS"].includes(
        children[0].tagName,
      )
    )
      return [];
    current = children[0];
  }
  return [];
}

/** BCR subtraction is eligible only for untransformed border-box owners and ancestors. */
function eligibility(element, view, fact) {
  const r = box(element);
  if (r.width <= 0 || r.height <= 0) return "zero-size";
  if (fact && (fact.visible === false || fact.clipped))
    return fact.clipped ? "clipped" : "hidden";
  for (
    let node = element;
    node && node !== view.document.body;
    node = node.parentElement
  ) {
    const style = view.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden")
      return "hidden";
    if (
      (style.transform && style.transform !== "none") ||
      (style.perspective && style.perspective !== "none")
    )
      return "unsupported-transform";
    if (
      node !== element &&
      [style.overflowX, style.overflowY].some((value) =>
        ["hidden", "clip", "scroll", "auto"].includes(value),
      )
    ) {
      const parent = box(node);
      if (
        r.x < parent.x - 0.1 ||
        r.y < parent.y - 0.1 ||
        r.x + r.width > parent.x + parent.width + 0.1 ||
        r.y + r.height > parent.y + parent.height + 0.1
      )
        return "clipped";
    }
  }
  if (
    r.x < -0.1 ||
    r.y < -0.1 ||
    r.x + r.width > view.innerWidth + 0.1 ||
    r.y + r.height > view.innerHeight + 0.1
  )
    return "clipped";
  return null;
}

/**
 * Build a numeric-only capture from declared composition wrappers and bounded inner DOM blocks.
 * Generated part IDs are capture-local structural identities, never document patch targets.
 */
export function captureLayoutGridDom({
  root,
  elements,
  model,
  facts,
  settings,
  captureId,
  sequence,
}) {
  const view = root.ownerDocument.defaultView,
    scopes = [],
    scopeById = new Map(),
    owners = new Map(),
    models = new Map(model.nodes.map((node) => [node.id, node])),
    factsById = new Map(facts.nodes.map((node) => [node.id, node]));
  let complete = facts.complete,
    anchorCount = 0,
    partCount = 0;
  /** Preserve unknown coverage when a bounded structural walk cannot inspect every candidate. */
  function truncate() {
    complete = false;
  }
  const overrides = new Map(
    settings.overrides.map((item) => [item.nodeId, item]),
  );
  /** Resolve explicit override before level defaults; the server repeats this choice from owned configuration. */
  function gridFor(scope) {
    return (
      (["viewport", "composition"].includes(scope.boundarySource)
        ? overrides.get(scope.id)?.grid
        : null) ||
      settings[
        { page: "pageGrid", component: "componentGrid", block: "blockGrid" }[
          scope.role
        ]
      ]
    );
  }
  /** Register a positive local carrier; excess structure makes the whole capture partial, never a partial hit. */
  function carrier(id, parentId, rect, role, boundarySource) {
    if (scopes.length >= 32) {
      complete = false;
      return null;
    }
    const parent = scopeById.get(parentId),
      origin = parent ? parent.origin : { x: 0, y: 0 };
    const scope = {
      id,
      parentId,
      rect: {
        x: rect.x - origin.x,
        y: rect.y - origin.y,
        width: rect.width,
        height: rect.height,
      },
      role,
      boundarySource,
      anchors: [],
    };
    scopes.push(scope);
    scopeById.set(id, { scope, origin: { x: rect.x, y: rect.y } });
    return scope;
  }
  carrier(
    "@page",
    null,
    { x: 0, y: 0, width: view.innerWidth, height: view.innerHeight },
    "page",
    "viewport",
  );
  /** Find the nearest retained declared parent even when an unavailable intermediate owner has no carrier. */
  function parentScope(node) {
    let id = node.parentId;
    for (let depth = 0; id && depth < 200; depth++) {
      if (scopeById.has(id)) return id;
      id = models.get(id)?.parentId;
    }
    return "@page";
  }
  /** Choose declared box anchors before comparison, keeping columns, baselines and point grids distinct. */
  function anchors(scope, id, element, fact) {
    if (anchorCount >= 256) {
      truncate();
      return;
    }
    owners.set(id, element);
    const r = box(element),
      origin = scopeById.get(scope.id).origin,
      grid = gridFor(scope),
      reason = eligibility(element, view, fact);
    let points;
    if (grid.type === "columns")
      points = [
        { slot: "left", x: r.x, y: r.y + r.height / 2, kind: "x-line" },
        {
          slot: "right",
          x: r.x + r.width,
          y: r.y + r.height / 2,
          kind: "x-line",
        },
      ];
    else if (grid.type === "baseline")
      points = [
        {
          slot: "baseline",
          x: r.x + r.width / 2,
          kind: "baseline",
          unknownReason: "baseline-unavailable",
        },
      ];
    else if (["golden-canon", "thirds", "edge-balance", "lead-room", "center-perspective", "phi-grid", "golden-triangle", "diagonal-flow", "icon-keylines"].includes(grid.type))
      points = [
        {
          slot: "center",
          x: r.x + r.width / 2,
          y: r.y + r.height / 2,
          kind: "point",
        },
      ];
    else
      points = [
        { slot: "start", x: r.x, y: r.y, kind: "point" },
        { slot: "end", x: r.x + r.width, y: r.y + r.height, kind: "point" },
      ];
    for (const point of points) {
      if (anchorCount >= 256) {
        complete = false;
        return;
      }
      const anchor = {
        id: id + "/" + point.slot,
        ownerId: id,
        kind: point.kind,
      };
      if (point.x !== undefined) anchor.x = point.x - origin.x;
      if (point.y !== undefined) anchor.y = point.y - origin.y;
      if (reason || point.unknownReason)
        anchor.unknownReason = reason || point.unknownReason;
      scope.anchors.push(anchor);
      anchorCount++;
    }
  }
  /** Inspect at most three nested structural block levels without copying their labels or content. */
  function inner(scope, children, depth) {
    for (const child of children) {
      if (anchorCount >= 256 || scopes.length >= 32) {
        truncate();
        return;
      }
      const id = "@part/" + ++partCount,
        r = box(child);
      anchors(scope, id, child);
      if (depth >= 3 || r.width <= 0 || r.height <= 0) continue;
      const descendants = parts(child, truncate);
      if (descendants.length < 2 && !child.hasAttribute("data-ag-grid-scope"))
        continue;
      const nested = carrier(
        id,
        scope.id,
        r,
        "block",
        child.hasAttribute("data-ag-grid-scope")
          ? "annotated-dom"
          : "structural-dom",
      );
      if (nested) inner(nested, descendants, depth + 1);
    }
  }
  // Normalized compositions render parent-before-child; no screen-position or text inference creates ownership.
  for (const node of model.nodes) {
    const element = elements.get(node.id);
    if (!element) {
      complete = false;
      continue;
    }
    const parent = scopeById.get(parentScope(node)).scope;
    anchors(parent, node.id, element, factsById.get(node.id));
    const r = box(element),
      children = node.kind === "component" ? parts(element, truncate) : [];
    if (
      r.width <= 0 ||
      r.height <= 0 ||
      (node.kind !== "frame" && children.length < 2 && !overrides.has(node.id))
    )
      continue;
    const local = carrier(
      node.id,
      parent.id,
      r,
      node.kind === "frame" ? "component" : "block",
      "composition",
    );
    if (local && node.kind === "component") inner(local, children, 0);
  }
  return {
    capture: {
      captureId,
      sequence,
      documentHash: facts.documentHash,
      scenarioId: facts.scenarioId,
      complete,
      fontsReady: facts.fontsReady,
      viewport: { width: view.innerWidth, height: view.innerHeight },
      scopes,
    },
    owners,
  };
}

/** Own a noninteractive viewport layer. Only the acknowledged server report is painted and returned by MCP. */
export function createLayoutGridInspection({
  root,
  elements,
  onActivity = () => {},
}) {
  const document = root.ownerDocument,
    view = document.defaultView;
  let configuration = null,
    current = null,
    layer = null,
    grids = [],
    disposed = false,
    mutationObserver = null,
    ownerObserver = null;
  const events = new view.AbortController();
  /** Retire observers with their capture; no callback may revive a superseded report. */
  function stopWatching() {
    mutationObserver?.disconnect();
    ownerObserver?.disconnect();
    mutationObserver = null;
    ownerObserver = null;
  }
  /** A stable wrapper does not prove stable inner owners; compare every measured border box. */
  function unchanged() {
    if (!current) return false;
    for (const [id, owner] of current.owners) {
      const previous = current.boxes.get(id),
        actual = box(owner);
      if (
        !owner.isConnected ||
        Object.keys(actual).some(
          (key) => Math.abs(actual[key] - previous[key]) > 0.1,
        )
      )
        return false;
    }
    return true;
  }
  /** Clear before notifying the transport, so an awaited response cannot paint retired coordinates. */
  function activity() {
    if (disposed || !current) return;
    current = null;
    stopWatching();
    clear();
    onActivity();
  }
  /** Watch only the bounded capture owners; initial ResizeObserver delivery is ignored if geometry agrees. */
  function watch() {
    stopWatching();
    if (view.MutationObserver) {
      mutationObserver = new view.MutationObserver(activity);
      mutationObserver.observe(root, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
      });
    }
    if (view.ResizeObserver) {
      ownerObserver = new view.ResizeObserver(() => {
        if (!unchanged()) activity();
      });
      for (const owner of current.owners.values()) ownerObserver.observe(owner);
    }
  }
  for (const type of [
    "animationstart",
    "animationend",
    "animationcancel",
    "transitionrun",
    "transitionend",
    "transitioncancel",
    "mouseover",
    "mouseout",
    "focusin",
    "focusout",
  ])
    root.addEventListener(type, activity, { signal: events.signal });
  /** Remove old hits immediately on any real geometry/configuration activity. */
  function clear() {
    for (const grid of grids) grid.dispose();
    grids = [];
    layer?.remove();
    layer = null;
  }
  return {
    setConfiguration(value) {
      if (disposed) return;
      configuration = value;
      current = null;
      stopWatching();
      clear();
    },
    get configurationId() {
      return configuration?.configurationId;
    },
    capture(model, facts, captureId, sequence) {
      if (disposed || !configuration) return null;
      // Moving CSS animation geometry is an incomplete snapshot, never a stable geometric hit.
      const animations = root.getAnimations?.({ subtree: true }) || [];
      const moving = animations.some((animation) =>
        ["running", "pending"].includes(animation.playState),
      );
      current = captureLayoutGridDom({
        root,
        elements,
        model,
        facts: moving ? { ...facts, complete: false } : facts,
        settings: configuration.settings,
        captureId,
        sequence,
      });
      current.boxes = new Map();
      for (const [id, owner] of current.owners)
        current.boxes.set(id, box(owner));
      watch();
      return {
        configurationId: configuration.configurationId,
        capture: current.capture,
      };
    },
    apply(result) {
      if (
        disposed ||
        !current ||
        result.configurationId !== configuration?.configurationId ||
        result.captureId !== current.capture.captureId
      )
        return;
      if (!unchanged()) {
        activity();
        return;
      }
      clear();
      if (!configuration.settings.enabled || result.status !== "current")
        return;
      layer = document.createElement("div");
      layer.className = "layout-grid-inspection-layer";
      layer.setAttribute("aria-hidden", "true");
      const palette = view.getComputedStyle(root);
      for (const name of ["accent", "success", "danger", "muted", "surface"])
        layer.style.setProperty(
          "--ag-" + name,
          palette.getPropertyValue("--ag-" + name),
        );
      const statuses = new Map();
      for (const report of result.report.scopes) {
        const grid = createLayoutGridOverlay({ document, report });
        Object.assign(grid.element.style, {
          position: "absolute",
          left: report.origin.x + "px",
          top: report.origin.y + "px",
          width: report.rect.width + "px",
          height: report.rect.height + "px",
        });
        layer.append(grid.element);
        grids.push(grid);
        for (const item of report.results)
          if (item.ownerId) {
            const old = statuses.get(item.ownerId);
            if (!old || old === "hit" || item.status === "unknown")
              statuses.set(item.ownerId, item.status);
          }
      }
      for (const [id, status] of statuses) {
        const owner = current.owners.get(id);
        if (!owner) continue;
        const r = box(owner),
          outline = document.createElement("div");
        outline.className = "layout-grid-owner";
        outline.dataset.status = status;
        Object.assign(outline.style, {
          left: r.x + "px",
          top: r.y + "px",
          width: r.width + "px",
          height: r.height + "px",
        });
        layer.append(outline);
      }
      document.body.append(layer);
    },
    stale() {
      current = null;
      stopWatching();
      clear();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      current = null;
      configuration = null;
      stopWatching();
      events.abort();
      clear();
    },
  };
}

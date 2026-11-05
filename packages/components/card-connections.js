/**
 * Две опоры на 1/3 и 2/3 пролёта. Боковые порты задают горизонтальные
 * касательные, верхние/нижние — вертикальные, свободные связи следуют прямой.
 * offset смещает обе опоры для общего коридора; промежуточного узла в центре нет.
 */
export function connectionControls(
  from,
  to,
  { axis = "horizontal", offset = { x: 0, y: 0 } } = {},
) {
  const dx = to.x - from.x,
    dy = to.y - from.y;
  const first = { x: from.x + dx / 3, y: from.y + dy / 3 };
  const second = { x: from.x + (2 * dx) / 3, y: from.y + (2 * dy) / 3 };
  if (axis === "horizontal") {
    first.y = from.y;
    second.y = to.y;
  } else if (axis === "vertical") {
    first.x = from.x;
    second.x = to.x;
  }
  for (const point of [first, second]) {
    point.x += offset.x;
    point.y += offset.y;
  }
  return [first, second];
}

/** Одна кубическая связь сохраняет порты и непрерывный изгиб без выравнивания в середине. */
export function connectionCurve(from, to, options) {
  const [first, second] = connectionControls(from, to, options);
  return `M ${from.x} ${from.y} C ${first.x} ${first.y} ${second.x} ${second.y} ${to.x} ${to.y}`;
}

let routingSequence = 0;

/** Connect only supplied real cards, with side ports and Atlas cubic tangents. Call update after layout/pan changes. */
export function createCardConnections({
  container,
  cards,
  edges,
  onSelect = () => {},
} = {}) {
  if (
    !container ||
    !(cards instanceof Map) ||
    !Array.isArray(edges) ||
    edges.length > 200
  )
    throw new TypeError(
      "Container, card map and at most 200 real edges required",
    );
  const document = container.ownerDocument,
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("ag-card-connections");
  svg.setAttribute("aria-hidden", "true");
  const description = document.createElement("div");
  description.className = "ag-card-connections__list";
  description.setAttribute("aria-label", "Связи карточек");
  const id = `ag-card-arrow-${++routingSequence}`;
  const defs = document.createElementNS(svg.namespaceURI, "defs");
  const marker = document.createElementNS(svg.namespaceURI, "marker");
  marker.setAttribute("id", id);
  marker.setAttribute("viewBox", "0 0 10 10");
  marker.setAttribute("refX", "9");
  marker.setAttribute("refY", "5");
  marker.setAttribute("markerWidth", "5");
  marker.setAttribute("markerHeight", "5");
  marker.setAttribute("orient", "auto-start-reverse");
  const tip = document.createElementNS(svg.namespaceURI, "path");
  tip.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
  marker.append(tip);
  defs.append(marker);
  svg.append(defs);
  const known = [],
    unknown = [];
  for (const edge of edges) {
    if (!cards.has(edge.from) || !cards.has(edge.to)) {
      unknown.push(edge);
      continue;
    }
    known.push(edge);
  }
  container.prepend(svg);
  container.append(description);
  for (const edge of known) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ag-button ag-button--quiet";
    button.textContent = edge.label || `${edge.from} → ${edge.to}`;
    button.addEventListener("click", () => onSelect(edge));
    description.append(button);
  }
  /** Convert current card boxes to local CSS coordinates; no invisible nodes or inferred dependencies are inserted. */
  function update() {
    svg
      .querySelectorAll(".ag-card-connection")
      .forEach((node) => node.remove());
    const host = container.getBoundingClientRect();
    svg.setAttribute(
      "viewBox",
      `0 0 ${Math.max(1, host.width)} ${Math.max(1, host.height)}`,
    );
    for (const edge of known) {
      const a = cards.get(edge.from).getBoundingClientRect(),
        b = cards.get(edge.to).getBoundingClientRect();
      const leftToRight = b.left + b.width / 2 >= a.left + a.width / 2;
      const from = {
        x: (leftToRight ? a.right : a.left) - host.left,
        y: a.top + a.height / 2 - host.top,
      };
      const to = {
        x: (leftToRight ? b.left : b.right) - host.left,
        y: b.top + b.height / 2 - host.top,
      };
      const line = document.createElementNS(svg.namespaceURI, "path");
      line.classList.add("ag-card-connection");
      line.dataset.kind = edge.kind || "directed";
      const self = edge.from === edge.to;
      line.setAttribute(
        "d",
        self
          ? `M ${from.x} ${from.y} C ${from.x + 80} ${from.y - 70} ${from.x + 80} ${from.y + 70} ${from.x} ${from.y + 8}`
          : connectionCurve(from, to, { axis: "horizontal" }),
      );
      if (edge.kind !== "related")
        line.setAttribute("marker-end", `url(#${id})`);
      svg.append(line);
    }
  }
  const view = document.defaultView;
  const resize = new (
    view.ResizeObserver ||
    class {
      observe() {}
      disconnect() {}
    }
  )(update);
  resize.observe(container);
  for (const key of new Set(known.flatMap((edge) => [edge.from, edge.to])))
    resize.observe(cards.get(key));
  view.addEventListener("resize", update);
  update();
  return {
    element: svg,
    unknownCount: unknown.length,
    update,
    dispose() {
      resize.disconnect();
      view.removeEventListener("resize", update);
      description.remove();
      svg.remove();
    },
  };
}

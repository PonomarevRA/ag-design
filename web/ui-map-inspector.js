/** Create trusted markup only; captured/imported content always becomes text, never HTML or a URL. */
export function mapElement(document, tag, attributes = {}, text = null) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== null && value !== undefined)
      element.setAttribute(key, String(value));
  }
  if (text !== null) element.textContent = String(text);
  return element;
}

/** Retained names are optional; redaction never becomes a missing-name diagnosis. */
export function mapNodeLabel(node) {
  return node.name?.text || `${node.tag || node.kind || "Узел"} · ${node.id}`;
}

/** Present one graph-bound node/finding with bounded factual provenance and reversible focus. */
export function createUiMapInspector({
  document,
  onSelectNode,
  onSelectFinding,
  returnTarget = () => null,
}) {
  const el = (tag, attributes, text) =>
    mapElement(document, tag, attributes, text);
  const element = el("aside", {
    class: "ui-map-inspector",
    "aria-label": "Свидетельства выбранного узла",
    tabindex: "-1",
    hidden: "",
  });
  let trigger = null,
    disposed = false;
  const close = el(
    "button",
    { type: "button", class: "ag-button ag-button--quiet" },
    "Закрыть детали",
  );
  const body = el("div", { class: "ui-map-inspector__body" });
  element.append(close, body);

  /** Return to the live initiating control, allowing native scrolling when it is outside the viewport. */
  function hide({ returnFocus = true } = {}) {
    element.hidden = true;
    body.replaceChildren();
    if (returnFocus) {
      const target = trigger?.isConnected ? trigger : returnTarget();
      target?.focus();
    }
    trigger = null;
  }
  /** Render key/value evidence explicitly, including unknown values and full immutable identities. */
  function details(title, values) {
    const section = el("section"),
      list = el("dl");
    section.append(el("h3", {}, title), list);
    for (const [name, value] of values) {
      list.append(el("dt", {}, name), el("dd", {}, value ?? "Неизвестно"));
    }
    body.append(section);
  }
  /** Related IDs stay local callbacks; no imported href/src can be followed. */
  function links(title, values, callback) {
    const section = el("section"),
      list = el("ul");
    section.append(el("h3", {}, title), list);
    for (const value of values) {
      const row = el("li"),
        button = el(
          "button",
          { type: "button", class: "ag-button ag-button--quiet" },
          value.label,
        );
      button.addEventListener("click", () => callback(value.id, button));
      row.append(button);
      list.append(row);
    }
    if (!values.length)
      list.append(el("li", {}, "Нет подтверждённых связей в этой выборке"));
    body.append(section);
  }
  /** Replace the previous owned subtree; inspector selection never mutates captured product state. */
  function show(
    { detail, findings = [], finding = null, metadata, source },
    sourceTrigger,
  ) {
    if (disposed) return;
    trigger = sourceTrigger || trigger;
    const node = detail.node;
    element.hidden = false;
    body.replaceChildren(el("h2", {}, mapNodeLabel(node)));
    details("Происхождение", [
      ["Узел", node.id],
      ["Граф", detail.graphId],
      ["Снимок SHA-256", detail.snapshotHash],
      ["Политика SHA-256", detail.policyHash],
      ["Метод", metadata.methodVersion],
      ["Провайдер", metadata.provider],
      ["Достоверность ввода", "caller-reported"],
      ["Источник", source?.kind],
      [
        "Имя",
        node.name?.redacted
          ? "Текст скрыт; это не означает отсутствие имени"
          : node.name?.completeness,
      ],
    ]);
    const bounds = node.bounds;
    details("Измеренная геометрия", [
      [
        "Система координат",
        "viewport-css-px; прямоугольник AABB, не нарисованный контур",
      ],
      ["x / y", bounds ? `${bounds.x} / ${bounds.y} CSS px` : null],
      [
        "Ширина / высота",
        bounds ? `${bounds.width} / ${bounds.height} CSS px` : null,
      ],
      ["Видимость / clipping", `${node.visibility} / ${node.clipping}`],
      [
        "Порядок фокуса",
        node.focusOrder === null
          ? "Не наблюдался"
          : `${node.focusOrder} (${node.focusOrderSource})`,
      ],
    ]);
    const relations = (detail.relations || []).slice(0, 200);
    links(
      "Связи: тип и другой узел",
      relations.map((edge) => ({
        id: edge.from === node.id ? edge.to : edge.from,
        label: `${edge.type} · ${edge.from} → ${edge.to} · ${edge.confidence || edge.completeness || "факт"}`,
      })),
      onSelectNode,
    );
    if (detail.relationsTruncated)
      body.append(
        el(
          "p",
          {},
          "Связи ограничены первыми 200; остальные не объявлены отсутствующими.",
        ),
      );
    details(
      "Группы",
      (detail.groups || [])
        .slice(0, 100)
        .map((group) => [
          group.id,
          `${group.kind}; ${group.source}; confidence: ${group.confidence}`,
        ]),
    );
    links(
      "Замечания этого узла",
      findings.slice(0, 100).map((item) => ({
        id: item.id,
        label: `${item.severity} / ${item.status} · ${item.summary}`,
      })),
      onSelectFinding,
    );
    if (
      detail.findingsTruncated ||
      (detail.findingIds || []).length > findings.length
    )
      body.append(
        el(
          "p",
          {},
          "Часть замечаний ещё не загружена или ограничена. Используйте страницы замечаний.",
        ),
      );
    if (finding) {
      details("Выбранное замечание", [
        ["ID", finding.id],
        ["Правило", finding.ruleId ?? "Не связано с оценкой правила"],
        ["Серьёзность / результат", `${finding.severity} / ${finding.status}`],
        ["Происхождение", finding.provenance],
        ["Объяснение", finding.explanation],
        [
          "Применимость",
          typeof finding.applicability === "string"
            ? finding.applicability
            : JSON.stringify(finding.applicability),
        ],
        [
          "Измерение",
          finding.metric
            ? `${finding.metric.name}: ${finding.metric.value ?? "неизвестно"} ${finding.metric.unit}; ${finding.metric.methodVersion}`
            : "Нет измерения",
        ],
        [
          "Ограничения измерения",
          finding.metric?.limitations
            ? JSON.stringify(finding.metric.limitations)
            : "Не сообщены",
        ],
      ]);
    }
    // Focus the bounded header control: centering a tall pane can leave its title and close action offscreen.
    close.focus();
  }
  /** Escape is local to this inspector and returns to its initiating control. */
  function keydown(event) {
    if (event.key === "Escape" && !element.hidden) {
      event.preventDefault();
      event.stopPropagation();
      hide();
    }
  }
  close.addEventListener("click", hide);
  element.addEventListener("keydown", keydown);
  return {
    element,
    show,
    hide,
    dispose() {
      disposed = true;
      hide({ returnFocus: false });
      close.removeEventListener("click", hide);
      element.removeEventListener("keydown", keydown);
    },
  };
}

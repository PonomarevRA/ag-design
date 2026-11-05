/** Versioned studio helpers. Documents contain data; selection, camera and traversal are transient. */
export const STUDIO_SCHEMA = "ag-design/brand-studio-v1";
export const studioId = (prefix = "item") => `${prefix}-${crypto.randomUUID()}`;

/** Make a usable, editable board without inventing a consumer's brand or research findings. */
export function initialStudio() {
  const object = (
    id,
    type,
    title,
    x,
    y,
    width,
    height,
    color,
    text = "",
    fontSize = 24,
  ) => ({
    id,
    type,
    title,
    x,
    y,
    width,
    height,
    rotation: 0,
    color,
    text,
    fontSize,
    fontWeight: 600,
    hidden: false,
    locked: false,
  });
  return {
    schema: STUDIO_SCHEMA,
    title: "Новый бренд-бук",
    brief: {
      audience: "",
      goal: "",
      positioning: "",
      evidence: "Гипотеза — исследование с аудиторией ещё не проведено",
    },
    board: {
      width: 1200,
      height: 800,
      background: "#f4f4f0",
      objects: [
        object(
          "headline",
          "text",
          "Название и идея",
          64,
          56,
          1060,
          110,
          "#20242b",
          "Название бренда\nОдна ясная идея",
          40,
        ),
        object(
          "voice",
          "text",
          "Голос бренда",
          64,
          204,
          1060,
          100,
          "#4c5460",
          "Характер · обещание · голос\nДля кого мы создаём и какую задачу решаем",
          24,
        ),
        object(
          "primary",
          "swatch",
          "Основной цвет",
          64,
          380,
          240,
          160,
          "#006d77",
        ),
        object("accent", "swatch", "Акцент", 336, 380, 240, 160, "#cb6441"),
        object(
          "neutral",
          "swatch",
          "Нейтральный",
          608,
          380,
          240,
          160,
          "#20242b",
        ),
        object(
          "notes",
          "text",
          "Правила применения",
          64,
          604,
          1060,
          120,
          "#20242b",
          "Палитра — пример, а не готовый бренд.\nУкажите происхождение активов и проверьте контраст в продукте.",
          22,
        ),
      ],
    },
    screens: [],
    transitions: [],
    startScreenId: null,
    testPlan: { purpose: "operations", tasks: [] },
  };
}

/** Bind a copied screen identity to a pinned server composition; fields never contain executable callbacks. */
export function screenFromComposition(source, index = 0) {
  return {
    id: studioId("screen"),
    title: source.document.title,
    state: "Основное состояние",
    x: 48 + (index % 3) * 300,
    y: 48 + Math.floor(index / 3) * 160,
    source: {
      documentId: source.documentId,
      revision: source.revision,
      documentHash: source.documentHash,
    },
  };
}

/** Reconcile traversal after editing: the selected screen must still belong to this exact document. */
export function journeyState(document, current = null) {
  if (document.screens.some((screen) => screen.id === current)) return current;
  return document.startScreenId;
}

/** Follow only an outgoing edge; cycles are valid, history is bounded and no condition is evaluated as code. */
export function followTransition(
  document,
  current,
  transitionId,
  history = [],
) {
  const edge = document.transitions.find(
    (item) => item.id === transitionId && item.from === current,
  );
  if (!edge || !document.screens.some((item) => item.id === edge.to))
    throw new Error("Переход недоступен из текущего экрана");
  return {
    current: edge.to,
    history: [
      ...history.slice(-99),
      { from: current, to: edge.to, transitionId },
    ],
  };
}

/** Delete screen and its incident edges atomically, preserving a valid start node. */
export function removeScreen(document, id) {
  const result = structuredClone(document);
  result.screens = result.screens.filter((screen) => screen.id !== id);
  result.transitions = result.transitions.filter(
    (edge) => edge.from !== id && edge.to !== id,
  );
  if (result.testPlan) {
    const remainingEdges = new Set(result.transitions.map((edge) => edge.id));
    result.testPlan.tasks = result.testPlan.tasks.filter(
      (task) =>
        task.entryScreenId !== id &&
        !task.goalScreenIds.includes(id) &&
        task.requiredTransitionIds.every((edge) => remainingEdges.has(edge)),
    );
  }
  if (result.startScreenId === id)
    result.startScreenId = result.screens[0]?.id || null;
  return result;
}

/** Resize in the rotated object's local axes, retaining its opposite corner until a board boundary clamps it. */
export function resizeBoardObject(item, dx, dy, board) {
  const radians = (item.rotation * Math.PI) / 180;
  const cosine = Math.cos(radians),
    sine = Math.sin(radians);
  const width = Math.max(
    16,
    Math.min(board.width - item.x, item.width + dx * cosine + dy * sine),
  );
  const height = Math.max(
    16,
    Math.min(board.height - item.y, item.height - dx * sine + dy * cosine),
  );
  const dw = (width - item.width) / 2,
    dh = (height - item.height) / 2;
  const x = Math.max(
    0,
    Math.min(board.width - width, item.x + cosine * dw - sine * dh - dw),
  );
  const y = Math.max(
    0,
    Math.min(board.height - height, item.y + sine * dw + cosine * dh - dh),
  );
  return { ...item, x, y, width, height };
}

/** Compact real AG screen fixture for an explicitly requested local demonstration. */
export function exampleComposition(title, label, buttonLabel) {
  return {
    version: 2,
    title,
    viewport: { width: 640, height: 480, direction: "ltr", textScale: 1 },
    nodes: [
      {
        id: "frame",
        parentId: null,
        kind: "frame",
        title,
        component: null,
        props: { sample: true },
        layout: {
          mode: "column",
          x: 24,
          y: 24,
          width: 592,
          height: "hug",
          gap: 20,
          padding: 24,
          align: "start",
        },
      },
      {
        id: "input",
        parentId: "frame",
        kind: "component",
        title: label,
        component: "field",
        props: {
          label,
          placeholder: "Локальный прототип",
          hint: "Данные никуда не отправляются",
        },
        layout: { mode: "free", width: "fill", height: "hug" },
      },
      {
        id: "action",
        parentId: "frame",
        kind: "component",
        title: buttonLabel,
        component: "button",
        props: { label: buttonLabel, variant: "primary" },
        layout: { mode: "free", width: "hug", height: "hug" },
      },
    ],
    constraints: [],
    componentPins: {},
    scenarios: [],
  };
}

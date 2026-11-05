/** Versioned, bounded grid document. Coordinates are columns and 24px rows; runtime DOM never enters history. */
export const STORAGE_KEY = "ag-design-sandbox-v1";
export const COLS = 12;
export const ROW = 24;
export const LIMIT = 40;
const clone = (value) => JSON.parse(JSON.stringify(value));
const integer = (value, min, max) =>
  Number.isInteger(value) && value >= min && value <= max;

/** Copy at most 16 scalar options; reject prototype keys, executable values and excessive text before publication. */
function validateProperties(value) {
  const props = {};
  if (Object.keys(value).length > 16)
    throw new TypeError("Слишком много параметров");
  for (const [key, entry] of Object.entries(value)) {
    if (
      !/^[a-zA-Z][a-zA-Z0-9]{0,39}$/.test(key) ||
      ["constructor", "prototype", "__proto__"].includes(key)
    )
      throw new TypeError("Недопустимый параметр");
    if (
      !(typeof entry === "string" && entry.length <= 4096) &&
      !(
        typeof entry === "number" &&
        Number.isFinite(entry) &&
        Math.abs(entry) <= 10000
      ) &&
      typeof entry !== "boolean"
    )
      throw new TypeError(
        "Параметр должен быть текстом, числом или переключателем",
      );
    props[key] = entry;
  }
  return props;
}

/** Reject malformed records as a whole, including prototype keys and unbounded text. */
export function validateDocument(value, knownIds) {
  if (
    !value ||
    value.version !== 1 ||
    !integer(value.width, 320, 1600) ||
    !Array.isArray(value.items) ||
    value.items.length > LIMIT
  )
    throw new TypeError("Некорректный документ песочницы");
  const seen = new Set();
  const items = [];
  for (const item of value.items) {
    if (
      !item ||
      typeof item.id !== "string" ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(item.id) ||
      seen.has(item.id) ||
      !knownIds.has(item.component)
    )
      throw new TypeError("Неизвестный или повторяющийся компонент");
    if (
      !integer(item.x, 0, 11) ||
      !integer(item.y, 0, 300) ||
      !integer(item.w, 1, 12 - item.x) ||
      !integer(item.h, 2, 40)
    )
      throw new TypeError("Неверная позиция или размер");
    if (
      typeof item.title !== "string" ||
      item.title.length > 180 ||
      !item.props ||
      Array.isArray(item.props) ||
      typeof item.props !== "object"
    )
      throw new TypeError("Неверные параметры");
    const props = validateProperties(item.props);
    seen.add(item.id);
    items.push({
      id: item.id,
      component: item.component,
      title: item.title,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      props,
    });
  }
  return { version: 1, width: value.width, items };
}

/** Two grid rectangles intersect only when their interiors overlap. */
export function intersects(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

/** Find the first free cell in reading order; keep placements stable when the viewport narrows. */
export function freePosition(items, w, h) {
  for (let y = 0; y <= 300; y++) {
    for (let x = 0; x <= COLS - w; x++) {
      const candidate = { x, y, w, h };
      if (!items.some((item) => intersects(item, candidate))) return { x, y };
    }
  }
  throw new RangeError("Сетка заполнена");
}

/** Atomic commands validate before publication; one gesture produces one undo step. Storage failure is explicit. */
export function createSandboxStore({
  knownIds,
  storage,
  onChange = () => {},
  onWarning = () => {},
  onPersistence = () => {},
}) {
  let doc = { version: 1, width: 960, items: [] };
  let editGroup = null;
  let past = [],
    future = [];
  try {
    const saved = storage?.getItem(STORAGE_KEY);
    if (saved) doc = validateDocument(JSON.parse(saved), knownIds);
  } catch {
    onWarning(
      "Сохранённая композиция недоступна или устарела. Исходная запись не загружена.",
    );
  }
  /** Persistence is best effort; a quota/privacy failure never rolls back the usable in-memory document. */
  function publish() {
    try {
      if (!storage?.setItem) throw new Error("Storage unavailable");
      storage.setItem(STORAGE_KEY, JSON.stringify(doc));
      onPersistence(true);
    } catch {
      onPersistence(false);
      onWarning(
        "Не удалось сохранить на этом устройстве. Композиция доступна до закрытия страницы.",
      );
    }
    onChange(clone(doc));
  }
  /** Validate the complete successor before touching history or storage. */
  function commit(next, groupKey = null) {
    const checked = validateDocument(next, knownIds);
    if (JSON.stringify(checked) === JSON.stringify(doc)) return false;
    if (!groupKey || editGroup !== groupKey) past.push(clone(doc));
    editGroup = groupKey;
    if (past.length > 100) past.shift();
    future = [];
    doc = checked;
    publish();
    return true;
  }
  return {
    get document() {
      return clone(doc);
    },
    get canUndo() {
      return past.length > 0;
    },
    get canRedo() {
      return future.length > 0;
    },
    add(item) {
      if (doc.items.length >= LIMIT)
        throw new RangeError("Не более 40 компонентов в композиции");
      return commit({
        ...doc,
        items: [
          ...doc.items,
          { ...item, ...freePosition(doc.items, item.w, item.h) },
        ],
      });
    },
    patch(id, patch, { groupKey = null } = {}) {
      const current = doc.items.find((item) => item.id === id);
      const candidate = { ...current, ...patch };
      const changesGeometry = ["x", "y", "w", "h"].some(
        (key) => candidate[key] !== current[key],
      );
      if (
        changesGeometry &&
        doc.items.some((item) => item.id !== id && intersects(item, candidate))
      )
        throw new RangeError(
          "Это место занято. Выберите свободные ячейки сетки.",
        );
      return commit(
        {
          ...doc,
          items: doc.items.map((item) =>
            item.id === id ? { ...item, ...patch } : item,
          ),
        },
        groupKey,
      );
    },
    remove(id) {
      return commit({
        ...doc,
        items: doc.items.filter((item) => item.id !== id),
      });
    },
    width(width) {
      return commit({ ...doc, width });
    },
    endEdit() {
      editGroup = null;
    },
    undo() {
      editGroup = null;
      if (!past.length) return;
      future.push(doc);
      doc = past.pop();
      publish();
    },
    redo() {
      editGroup = null;
      if (!future.length) return;
      past.push(doc);
      doc = future.pop();
      publish();
    },
  };
}

/** Resize a grid rectangle from any edge while preserving its opposite edge and the document bounds. */
export function resizeRect(item, edge = "se", dx = 0, dy = 0) {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  let left = item.x,
    right = item.x + item.w,
    top = item.y,
    bottom = item.y + item.h;
  if (edge.includes("w")) left = clamp(left + dx, 0, right - 1);
  if (edge.includes("e")) right = clamp(right + dx, left + 1, 12);
  if (edge.includes("n"))
    top = clamp(top + dy, Math.max(0, bottom - 40), Math.min(300, bottom - 2));
  if (edge.includes("s")) bottom = clamp(bottom + dy, top + 2, top + 40);
  return { x: left, y: top, w: right - left, h: bottom - top };
}

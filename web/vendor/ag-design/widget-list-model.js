const identity = /^[A-Za-z0-9_.:-]{1,64}$/;

/** Validate a closed AG data object; ChatKit wire JSON and arbitrary styling are not accepted. */
function fields(value, allowed) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TypeError("Widget data must be an object");
  for (const key of Object.keys(value))
    if (!allowed.includes(key))
      throw new TypeError(`Unsupported widget field: ${key}`);
}

/** Copy bounded literal text; no content is interpreted as HTML, CSS or instructions. */
function text(value, limit, required = false) {
  if (
    typeof value !== "string" ||
    value.length > limit ||
    (required && !value.trim())
  )
    throw new TypeError("Invalid widget text");
  return value;
}

/** Validate a public structural identity, not a path, URL or authorization credential. */
function key(value) {
  if (typeof value !== "string" || !identity.test(value))
    throw new TypeError("Invalid widget key");
  return value;
}

/**
 * Normalize a complete AG list snapshot before touching DOM. At most100items, one action per item.
 * Revisions are host-supplied display fences, not proof of an accepted business transaction.
 */
export function normalizeWidgetList(data) {
  fields(data, ["title", "revision", "items"]);
  const title = text(data.title, 256, true);
  if (!Number.isSafeInteger(data.revision) || data.revision < 0)
    throw new TypeError("Widget revision must be a nonnegative safe integer");
  if (!Array.isArray(data.items) || data.items.length > 100)
    throw new TypeError("At most100 widget items are supported");
  const ids = new Set(),
    items = [];
  for (const item of data.items) {
    fields(item, ["id", "title", "description", "meta", "action"]);
    const id = key(item.id);
    if (ids.has(id)) throw new TypeError("Duplicate widget item key");
    ids.add(id);
    const row = {
      id,
      title: text(item.title, 256, true),
      description: text(item.description ?? "", 1024),
      meta: text(item.meta ?? "", 256),
      action: null,
    };
    if (item.action !== undefined && item.action !== null) {
      fields(item.action, ["id", "type", "label"]);
      row.action = {
        id: key(item.action.id),
        type: key(item.action.type),
        label: text(item.action.label, 256, true),
      };
    }
    items.push(row);
  }
  return { title, revision: data.revision, items };
}

/** Normalize visual pending scope only. No request is started, retried, cancelled or authorized. */
export function normalizeWidgetPending(value, current) {
  fields(value, ["scope", "itemId", "message"]);
  if (!["none", "self", "container"].includes(value.scope))
    throw new TypeError("Unknown widget pending scope");
  const message = text(value.message ?? "", 1024, value.scope !== "none");
  let itemId = null;
  if (value.scope === "self") {
    itemId = key(value.itemId);
    if (!current.items.some((item) => item.id === itemId))
      throw new TypeError("Pending item not in current snapshot");
  } else if (value.itemId !== undefined)
    throw new TypeError("Only self scope accepts itemId");
  return { scope: value.scope, itemId, message };
}

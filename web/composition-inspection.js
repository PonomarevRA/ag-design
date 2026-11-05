const ATTRIBUTE = "data-composition-inspection";
const MAX_NODES = 200;

/** Validate bounded internal inspection state before mutating any mounted wrapper. Unknown node ids are harmless. */
function inspectionState(config) {
  if (!config || typeof config !== "object" || Array.isArray(config))
    throw new TypeError("Invalid composition inspection state");
  const allowed = new Set([
    "enabled",
    "selectedId",
    "ancestorIds",
    "childIds",
    "compareId",
  ]);
  for (const key of Object.keys(config))
    if (!allowed.has(key)) throw new TypeError("Unknown inspection field");
  if (config.enabled !== undefined && typeof config.enabled !== "boolean")
    throw new TypeError("Inspection enabled must be boolean");
  const nodeId = (value) => {
    if (typeof value !== "string" || !value || value.length > 180)
      throw new TypeError("Invalid inspection node id");
    return value;
  };
  const ids = (value = []) => {
    if (!Array.isArray(value) || value.length > MAX_NODES)
      throw new TypeError("Invalid inspection node list");
    return value.map(nodeId);
  };
  return {
    enabled: config.enabled ?? false,
    selectedId: config.selectedId == null ? null : nodeId(config.selectedId),
    ancestorIds: ids(config.ancestorIds),
    childIds: ids(config.childIds),
    compareId: config.compareId == null ? null : nodeId(config.compareId),
  };
}

/**
 * Attach inspection tokens to actual composition wrappers without reading or changing geometry.
 * Native CSS outlines scroll with their owner; no labels, borders, focus changes or sampled overlay DOM exist.
 * Return a copied normalized configuration for reapplying after a trusted renderer remount.
 */
export function applyCompositionInspection(elements, config = {}) {
  if (!(elements instanceof Map) || elements.size > MAX_NODES)
    throw new TypeError("Invalid inspection elements");
  const state = inspectionState(config);
  const ancestors = new Set(state.ancestorIds),
    children = new Set(state.childIds);
  for (const [id, element] of elements) {
    const tokens = [];
    if (state.enabled) {
      if (ancestors.has(id)) tokens.push("ancestor");
      if (children.has(id)) tokens.push("child");
      if (id === state.compareId) tokens.push("compare");
      if (id === state.selectedId) tokens.push("selected");
    }
    const next = tokens.join(" ");
    if (next) {
      if (element.getAttribute(ATTRIBUTE) !== next)
        element.setAttribute(ATTRIBUTE, next);
    } else if (element.hasAttribute(ATTRIBUTE))
      element.removeAttribute(ATTRIBUTE);
  }
  return state;
}

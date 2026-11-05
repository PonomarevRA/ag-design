/** Validate and clone a bounded board so callers cannot mutate committed state by retaining an input reference. */
export function dragLanes(lanes) {
  if (!Array.isArray(lanes) || !lanes.length || lanes.length > 12)
    throw new RangeError("Use 1–12 lanes");
  const ids = new Set(),
    laneIds = new Set();
  let total = 0;
  return lanes.map((lane) => {
    if (
      !lane ||
      typeof lane.id !== "string" ||
      !lane.id ||
      lane.id.length > 80 ||
      laneIds.has(lane.id) ||
      typeof lane.label !== "string" ||
      !lane.label.trim() ||
      !Array.isArray(lane.items)
    )
      throw new TypeError("Unique lane IDs, labels and items are required");
    laneIds.add(lane.id);
    total += lane.items.length;
    if (total > 300) throw new RangeError("Use at most 300 items");
    return {
      id: lane.id,
      label: lane.label.slice(0, 180),
      copyOnly: Boolean(lane.copyOnly),
      items: lane.items.map((item) => {
        if (
          !item ||
          typeof item.id !== "string" ||
          !item.id ||
          item.id.length > 80 ||
          ids.has(item.id) ||
          typeof item.label !== "string" ||
          !item.label.trim()
        )
          throw new TypeError("Unique item IDs and labels are required");
        ids.add(item.id);
        return {
          id: item.id,
          label: item.label.slice(0, 240),
          description: String(item.description ?? "").slice(0, 500),
          disabled: Boolean(item.disabled),
        };
      }),
    };
  });
}
/** Locate identities rather than trusting stale indexes after an application update. */
export function dragItem(lanes, id) {
  for (let lane = 0; lane < lanes.length; lane++) {
    const index = lanes[lane].items.findIndex((item) => item.id === id);
    if (index >= 0) return { lane, index, item: lanes[lane].items[index] };
  }
  return null;
}
/** Produce an atomic move/copy/swap candidate; a rejected policy or duplicate copy ID never changes the old board. */
export function dragCandidate(
  lanes,
  { itemId, toLane, index, mode = "move", copyId },
  canDrop,
) {
  if (!["move", "copy", "swap"].includes(mode))
    throw new TypeError("Unknown transfer mode");
  const from = dragItem(lanes, itemId),
    target = lanes.findIndex((lane) => lane.id === toLane);
  if (
    !from ||
    target < 0 ||
    !Number.isInteger(index) ||
    index < 0 ||
    index > lanes[target].items.length
  )
    throw new RangeError("Unknown item, lane or insertion index");
  if (from.item.disabled) return null;
  if (lanes[from.lane].copyOnly) mode = "copy";
  const action = { itemId, fromLane: lanes[from.lane].id, toLane, index, mode };
  if (canDrop && !canDrop({ ...action }, { ...from.item })) return null;
  const next = dragLanes(lanes),
    destination = next[target].items;
  if (mode === "copy") {
    if (
      typeof copyId !== "string" ||
      !copyId ||
      copyId.length > 80 ||
      dragItem(lanes, copyId)
    )
      throw new TypeError("A fresh copy ID is required");
    destination.splice(index, 0, { ...from.item, id: copyId });
  } else if (mode === "swap") {
    const other = destination[index];
    if (!other || other.disabled) return null;
    next[from.lane].items[from.index] = other;
    destination[index] = { ...from.item };
  } else {
    next[from.lane].items.splice(from.index, 1);
    const insertion =
      target === from.lane && index > from.index ? index - 1 : index;
    destination.splice(insertion, 0, { ...from.item });
  }
  return { lanes: dragLanes(next), action };
}

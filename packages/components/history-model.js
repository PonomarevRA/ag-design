const ID = /^[A-Za-z0-9_.:/-]{1,80}$/;
export const HISTORY_LIMIT = 240;
const LANE_LIMIT = 12;

/** Reject ambiguous identities and unbounded snapshots before changing a mounted history. */
function identifier(value) {
  if (typeof value !== "string" || !ID.test(value))
    throw new TypeError("History IDs must be 1–80 safe characters");
  return value;
}
/** Keep caller text literal and bounded; history never interprets markup. */
function text(value, limit = 240) {
  if (typeof value !== "string" || !value.trim() || value.length > limit)
    throw new TypeError("History requires bounded nonempty text");
  return value;
}
/** Copy and validate unique records so callers cannot mutate topology behind the renderer. */
function records(items) {
  if (!Array.isArray(items) || items.length > HISTORY_LIMIT)
    throw new TypeError(
      "History supports at most 240 records; page in the host",
    );
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const id = identifier(item?.id);
    if (seen.has(id)) throw new TypeError("History IDs must be unique");
    seen.add(id);
    result.push({
      id,
      title: text(item.title),
      author: text(item.author ?? "Не указан"),
      authorMissing: item.author === undefined,
      dateMissing: item.date === undefined,
      date: text(item.date ?? "Без даты"),
      description:
        item.description === undefined || item.description === ""
          ? ""
          : text(item.description, 4000),
    });
  }
  return result;
}
/** Validate newest-first Git DAGs, including explicit missing parents, then allocate reusable lanes. */
export function gitHistoryModel(commits) {
  const nodes = records(commits),
    positions = new Map(nodes.map((n, i) => [n.id, i]));
  const pending = [];
  let laneCount = 1;
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i],
      input = commits[i];
    if (!Array.isArray(input.parents) || input.parents.length > 8)
      throw new TypeError("Git commits require 0–8 explicit parents");
    node.parents = input.parents.map(identifier);
    if (new Set(node.parents).size !== node.parents.length)
      throw new TypeError("Duplicate parent");
    if (!Array.isArray(input.refs ?? []) || (input.refs ?? []).length > 12)
      throw new TypeError("At most 12 refs per commit");
    node.refs = (input.refs ?? []).map((ref) => text(ref, 100));
    if (node.refs.length > 12)
      throw new TypeError("At most 12 refs per commit");
    node.group = node.refs[0] ?? "commits";
    let lane = pending.indexOf(node.id);
    if (lane < 0) {
      lane = pending.indexOf(null);
      if (lane < 0) lane = pending.length;
    }
    node.lane = lane;
    pending[lane] = null;
    for (
      let parentIndex = 0;
      parentIndex < node.parents.length;
      parentIndex++
    ) {
      const parent = node.parents[parentIndex],
        at = positions.get(parent);
      if (at !== undefined && at <= i)
        throw new TypeError(
          "Git parents must follow children in newest-first topological order",
        );
      edges.push({ from: node.id, to: parent, kind: "parent" });
      if (at === undefined || pending.includes(parent)) continue;
      let targetLane =
        parentIndex === 0 && pending[lane] === null
          ? lane
          : pending.indexOf(null);
      if (targetLane < 0) targetLane = pending.length;
      pending[targetLane] = parent;
    }
    laneCount = Math.max(laneCount, lane + 1, pending.length);
    if (laneCount > LANE_LIMIT)
      throw new TypeError(
        "At most 12 simultaneous Git lanes; narrow the host snapshot",
      );
  }
  return { kind: "git", nodes, edges, laneCount, groups: [] };
}
/** A task lane is an entity, not a branch: continuity joins its events; dependencies remain dashed explicit edges. */
export function taskHistoryModel({ tasks, events, dependencies = [] }) {
  if (!Array.isArray(tasks) || tasks.length > LANE_LIMIT)
    throw new TypeError("Task history supports at most 12 task lanes");
  const groups = [],
    known = new Map();
  for (const task of tasks) {
    const id = identifier(task?.id);
    if (known.has(id) || id === "all")
      throw new TypeError(
        "Task IDs must be unique and cannot use the reserved all ID",
      );
    const group = {
      id,
      title: text(task.title),
      status: text(task.status ?? "Запланировано"),
      lane: groups.length,
    };
    known.set(id, group);
    groups.push(group);
  }
  const nodes = records(events),
    last = new Map(),
    edges = [],
    positions = new Set(nodes.map((n) => n.id));
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i],
      group = known.get(events[i].taskId);
    if (!group) throw new TypeError("Every event must name a known task");
    Object.assign(node, {
      lane: group.lane,
      group: group.id,
      refs: [group.id, group.status],
      parents: [],
      status: group.status,
    });
    if (last.has(group.id))
      edges.push({ from: last.get(group.id), to: node.id, kind: "continuity" });
    last.set(group.id, node.id);
  }
  if (!Array.isArray(dependencies) || dependencies.length > HISTORY_LIMIT)
    throw new TypeError("Bounded dependencies required");
  const seen = new Set();
  for (const edge of dependencies) {
    const from = identifier(edge.from),
      to = identifier(edge.to),
      key = from + "→" + to;
    if (
      !positions.has(from) ||
      !positions.has(to) ||
      from === to ||
      seen.has(key)
    )
      throw new TypeError(
        "Dependencies require distinct existing event endpoints",
      );
    seen.add(key);
    edges.push({
      from,
      to,
      kind: "dependency",
      label: text(edge.label ?? "Зависимость"),
    });
  }
  return {
    kind: "tasks",
    nodes,
    edges,
    laneCount: Math.max(1, groups.length),
    groups,
  };
}

/** Keep explicit endpoints when filtering; a hidden parent is never replaced with a visible grandparent. */
export function projectHistory(model, query = "", group = "all") {
  const needle = String(query).trim().toLocaleLowerCase();
  const nodes = model.nodes.filter(
    (n) =>
      (group === "all" || n.group === group) &&
      [n.title, n.id, n.author, ...n.refs]
        .join(" ")
        .toLocaleLowerCase()
        .includes(needle),
  );
  const visible = new Set(nodes.map((n) => n.id));
  const edges = model.edges.filter((e) => visible.has(e.from));
  return {
    nodes,
    edges: edges.map((e) => ({ ...e, boundary: !visible.has(e.to) })),
  };
}

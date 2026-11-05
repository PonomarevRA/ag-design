/** Bounded presentation data only: no transport, command execution or durable deduplication. */
const roles = new Set(["user", "agent", "system"]);
const connections = new Set([
  "connected",
  "disconnected",
  "loading",
  "error",
  "unknown",
]);
const runtimes = new Set(["idle", "running", "waiting", "unknown"]);
const statuses = new Set([
  "pending",
  "running",
  "completed",
  "failed",
  "requested",
  "cancelled",
  "rejected",
  "unknown",
]);

/** Reject oversized data instead of silently losing part of a streamed answer. */
function text(value, max = 16384) {
  if (typeof value !== "string" || value.length > max)
    throw new TypeError("Bounded text required");
  return value;
}
function identity(value) {
  if (!text(value, 128).length)
    throw new TypeError("Nonempty identity required");
  return value;
}
function revision(value) {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new TypeError("Nonnegative safe revision required");
  return value;
}
function choice(value, values) {
  if (!values.has(value)) throw new TypeError("Unknown presentation state");
  return value;
}

/** Stable fingerprints retain only the declared display contract, never opaque source payloads. */
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    const result = {};
    for (const key of Object.keys(value).sort())
      result[key] = canonical(value[key]);
    return result;
  }
  return value;
}

/** Copy only declared display fields. Unknown protocol fields, credentials and callbacks never enter the model. */
function block(value) {
  const result = {
    id: identity(value.id),
    kind: identity(value.kind),
    revision: revision(value.revision),
    status: choice(value.status ?? "unknown", statuses),
  };
  for (const key of ["text", "input", "output"])
    if (value[key] !== undefined) result[key] = text(value[key]);
  for (const key of ["title", "actionId"])
    if (value[key] !== undefined) result[key] = text(value[key], 256);
  return result;
}

/** Require stable scoped block identities so independent tool and message updates cannot collide. */
function message(value) {
  if (!Array.isArray(value.blocks) || value.blocks.length > 32)
    throw new TypeError("At most 32 blocks per message");
  const result = {
    id: identity(value.id),
    revision: revision(value.revision),
    role: choice(value.role, roles),
    author: text(value.author ?? (value.role === "user" ? "Вы" : "Агент"), 256),
    blocks: value.blocks.map(block),
  };
  if (!result.author.trim())
    throw new TypeError("Readable author label required");
  for (const key of ["label", "time"])
    if (value[key] !== undefined) result[key] = text(value[key], 256);
  if (
    new Set(result.blocks.map((item) => item.id)).size !== result.blocks.length
  )
    throw new TypeError("Duplicate block identity");
  return result;
}

/** Enforce an aggregate text budget as well as row counts; valid JSON alone is not a memory bound. */
function bounded(messages, maxText) {
  let size = 0;
  const seen = new Set();
  for (const item of messages) {
    if (seen.has(item.id)) throw new TypeError("Duplicate message identity");
    seen.add(item.id);
    for (const part of item.blocks)
      size +=
        (part.text?.length ?? 0) +
        (part.input?.length ?? 0) +
        (part.output?.length ?? 0);
  }
  if (size > maxText) throw new RangeError("Conversation text budget exceeded");
}

/** Create a versioned, atomic UI reducer. Snapshot is the explicit recovery boundary after a stream gap. */
export function createAgentConversationModel({
  maxMessages = 100,
  maxText = 1048576,
} = {}) {
  if (
    !Number.isInteger(maxMessages) ||
    maxMessages < 1 ||
    maxMessages > 500 ||
    !Number.isInteger(maxText) ||
    maxText < 16384 ||
    maxText > 16777216
  )
    throw new TypeError("Bounded model limits required");
  let state = null;
  let receipts = new Map();
  let eventIds = new Map();
  const copy = (value) => structuredClone(value);

  /** Accept an authoritative window, not a second task store; old session receipts are discarded. */
  function applySnapshot(value) {
    if (value.version !== 1)
      throw new TypeError("Unsupported conversation schema");
    if (!Array.isArray(value.messages) || value.messages.length > maxMessages)
      throw new RangeError("Snapshot window exceeds capacity");
    const next = {
      version: 1,
      sessionId: identity(value.sessionId),
      title: text(value.title ?? "Чат с агентом", 256),
      connection: choice(value.connection ?? "unknown", connections),
      runtime: choice(value.runtime ?? "unknown", runtimes),
      sequence: revision(value.sequence ?? 0),
      messages: value.messages.map(message),
      omitted: revision(value.omitted ?? 0),
    };
    bounded(next.messages, maxText);
    state = next;
    receipts = new Map();
    eventIds = new Map();
    return copy(state);
  }

  /** Apply complete upserts or revision-checked text deltas, committing only after every operation validates. */
  function applyUpdates(value, { retainIds = [] } = {}) {
    if (!state || value.version !== 1)
      throw new TypeError("Initialize a version1 snapshot first");
    if (value.sessionId !== state.sessionId)
      return { applied: false, reason: "other_session" };
    const seq = revision(value.sequence),
      eventId = identity(value.eventId);
    if (!Array.isArray(value.operations) || value.operations.length > 100)
      throw new TypeError("At most100 operations per batch");
    const operations = [];
    let batchSize = 0;
    for (const operation of value.operations) {
      let normalized;
      if (operation.type === "upsert")
        normalized = { type: "upsert", message: message(operation.message) };
      else if (operation.type === "delta")
        normalized = {
          type: "delta",
          messageId: identity(operation.messageId),
          blockId: identity(operation.blockId),
          revision: revision(operation.revision),
          baseRevision: revision(operation.baseRevision),
          text: text(operation.text),
        };
      else throw new TypeError("Unsupported conversation operation");
      batchSize += JSON.stringify(normalized).length;
      if (batchSize > 65536)
        throw new RangeError("Update batch exceeds64Ki characters");
      operations.push(normalized);
    }
    const normalized = {
      sessionId: value.sessionId,
      sequence: seq,
      eventId,
      operations,
    };
    if (value.connection !== undefined)
      normalized.connection = choice(value.connection, connections);
    if (value.runtime !== undefined)
      normalized.runtime = choice(value.runtime, runtimes);
    const fingerprint = JSON.stringify(canonical(normalized));
    if (seq <= state.sequence) {
      const prior = receipts.get(seq);
      if (!prior) return { applied: false, reason: "resync_required" };
      if (prior !== fingerprint)
        throw new TypeError("Conflicting repeated stream sequence");
      return { applied: false, reason: "duplicate" };
    }
    if (seq !== state.sequence + 1) return { applied: false, reason: "gap" };
    if (eventIds.has(eventId))
      throw new TypeError("Stream event identity reused");
    const next = copy(state);
    for (const operation of operations) {
      if (operation.type === "upsert") {
        const item = message(operation.message);
        const index = next.messages.findIndex((old) => old.id === item.id);
        if (index < 0) next.messages.push(item);
        else if (item.revision > next.messages[index].revision) {
          for (const part of item.blocks) {
            const old = next.messages[index].blocks.find(
              (existing) => existing.id === part.id,
            );
            if (old && part.revision < old.revision)
              throw new TypeError("Upsert regresses a block revision");
            if (
              old &&
              part.revision === old.revision &&
              JSON.stringify(part) !== JSON.stringify(old)
            )
              throw new TypeError("Conflicting block revision");
          }
          next.messages[index] = item;
        } else if (
          item.revision === next.messages[index].revision &&
          JSON.stringify(item) !== JSON.stringify(next.messages[index])
        )
          throw new TypeError("Conflicting message revision");
      } else if (operation.type === "delta") {
        const item = next.messages.find(
          (old) => old.id === operation.messageId,
        );
        const part = item?.blocks.find((old) => old.id === operation.blockId);
        if (!part)
          throw new TypeError("Delta target is outside the current window");
        const nextRevision = revision(operation.revision);
        if (nextRevision <= part.revision)
          throw new TypeError("Stale delta requires a fresh snapshot");
        if (revision(operation.baseRevision) !== part.revision)
          throw new TypeError("Delta base revision mismatch");
        part.text = text((part.text ?? "") + text(operation.text));
        part.revision = nextRevision;
        item.revision = Math.max(item.revision, nextRevision);
      } else throw new TypeError("Unsupported conversation operation");
    }
    const excess = Math.max(0, next.messages.length - maxMessages);
    if (
      next.messages.slice(0, excess).some((item) => retainIds.includes(item.id))
    ) {
      const error = new RangeError(
        "Окно заполнено. Завершите чтение или выберите другой снимок истории.",
      );
      error.code = "window_full";
      throw error;
    }
    if (excess) {
      next.messages.splice(0, excess);
      next.omitted = revision(next.omitted + excess);
    }
    bounded(next.messages, maxText);
    if (value.connection !== undefined)
      next.connection = choice(value.connection, connections);
    if (value.runtime !== undefined)
      next.runtime = choice(value.runtime, runtimes);
    next.sequence = seq;
    state = next;
    receipts.set(seq, fingerprint);
    eventIds.set(eventId, seq);
    let receiptSize = 0;
    for (const saved of receipts.values()) receiptSize += saved.length;
    while (receipts.size > 64 || receiptSize > 262144) {
      const oldest = receipts.keys().next().value;
      receiptSize -= receipts.get(oldest).length;
      receipts.delete(oldest);
    }
    if (eventIds.size > 64) eventIds.delete(eventIds.keys().next().value);
    return { applied: true, omitted: excess };
  }

  /** Prepend one already-normalized history page without losing the newer tail or silently evicting focused rows. */
  function prepend(value) {
    if (!state || value.sessionId !== state.sessionId) return false;
    if (!Array.isArray(value.messages) || value.messages.length > maxMessages)
      throw new TypeError("Bounded history page required");
    const next = copy(state),
      additions = [];
    for (const item of value.messages.map(message))
      if (!next.messages.some((old) => old.id === item.id))
        additions.push(item);
    if (next.messages.length + additions.length > maxMessages)
      throw new RangeError(
        "History window full; host must choose another snapshot window",
      );
    next.messages.unshift(...additions);
    next.omitted = Math.max(0, next.omitted - additions.length);
    bounded(next.messages, maxText);
    state = next;
    return true;
  }
  return {
    applySnapshot,
    applyUpdates,
    prepend,
    snapshot: () => state && copy(state),
    clear() {
      state = null;
      receipts.clear();
      eventIds.clear();
    },
  };
}

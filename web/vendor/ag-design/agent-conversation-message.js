import { createConversationBlock } from "./agent-conversation-block.js";

/** Render one turn with stable disclosure groups; failures remain visible in their group summary. */
export function createConversationMessage({
  document,
  initial,
  presentation = "document",
  onAction,
  getLabels,
  canAct,
}) {
  const row = document.createElement("article"),
    meta = document.createElement("h3"),
    body = document.createElement("div");
  row.dataset.messageId = initial.id;
  row.className = "ag-conversation__message";
  row.tabIndex = -1;
  body.className = "ag-conversation__message-body";
  row.append(meta, body);
  let currentRole = initial.role;
  const blocks = new Map();
  const groups = new Map();
  /** Reconcile existing elements without detaching the focused block or changing the chronological order. */
  function order(parent, elements) {
    let previous = null;
    for (const child of elements) {
      const expected = previous
        ? previous.nextElementSibling
        : parent.firstElementChild;
      if (expected !== child) parent.insertBefore(child, expected);
      previous = child;
    }
  }
  /** Reconcile one complete turn without changing existing disclosure state. */
  function update(item) {
    row.dataset.role = item.role;
    currentRole = item.role;
    setPresentation(presentation);
    const caption = [item.author, item.label, item.time]
      .filter(Boolean)
      .join(" · ");
    if (meta.textContent !== caption) meta.textContent = caption;
    const ids = new Set(item.blocks.map((part) => part.id));
    for (const [id, part] of blocks)
      if (!ids.has(id)) {
        part.dispose();
        part.element.remove();
        blocks.delete(id);
      }
    for (const part of item.blocks) {
      let rendered = blocks.get(part.id);
      if (rendered && rendered.element.dataset.kind !== part.kind) {
        rendered.dispose();
        rendered.element.remove();
        blocks.delete(part.id);
        rendered = null;
      }
      if (!rendered) {
        rendered = createConversationBlock({
          document,
          part,
          getLabels,
          canAct,
          onAction: onAction
            ? (intent) =>
                onAction({
                  messageId: item.id,
                  ...intent,
                })
            : null,
        });
        blocks.set(part.id, rendered);
      }
      rendered.update(part);
    }
    const children = [],
      used = new Set();
    let index = 0;
    while (index < item.blocks.length) {
      const run = [],
        start = index;
      const first = item.blocks[index];
      while (
        index < item.blocks.length &&
        ["tool", "terminal", "files"].includes(first.kind) &&
        item.blocks[index].kind === first.kind &&
        item.blocks[index].title === first.title
      )
        run.push(item.blocks[index++]);
      if (run.length > 1) {
        const key = run[0].id;
        used.add(key);
        let group = groups.get(key);
        if (!group) {
          group = document.createElement("details");
          group.className = "ag-conversation__group";
          group.dataset.groupId = key;
          group.append(document.createElement("summary"));
          groups.set(key, group);
        }
        const attention = run.filter((part) =>
          ["failed", "requested", "rejected"].includes(part.status),
        ).length;
        const running = run.some((part) =>
          ["pending", "running"].includes(part.status),
        );
        const name = first.title || "Действия";
        const summaryText = `${name} · ${run.length}${running ? " · выполняются" : ""}${attention ? ` · требуют внимания: ${attention}` : ""}`;
        if (group.firstElementChild.textContent !== summaryText)
          group.firstElementChild.textContent = summaryText;
        // The summary is not a message block and must remain the first child.
        order(group, [
          group.firstElementChild,
          ...run.map((part) => blocks.get(part.id).element),
        ]);
        children.push(group);
      } else if (run.length) children.push(blocks.get(run[0].id).element);
      if (index === start)
        children.push(blocks.get(item.blocks[index++].id).element);
    }
    order(body, children);
    for (const [key, group] of groups)
      if (!used.has(key)) {
        group.remove();
        groups.delete(key);
      }
  }
  /** Reveal author metadata for a work log without replacing its heading or changing disclosure state. */
  function setPresentation(value) {
    presentation = value;
    meta.className =
      currentRole === "user" && value !== "work-log"
        ? "ag-conversation__sr-only"
        : "";
  }
  return {
    element: row,
    setPresentation,
    update,
    dispose() {
      for (const part of blocks.values()) part.dispose();
      blocks.clear();
    },
  };
}

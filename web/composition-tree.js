import { createTree } from "./vendor/ag-design/index.js";

const MAX_DOCUMENTS = 8;

/** Map public composition structure to library tree rows; property values never enter this view-state cache. */
function rowsFor(nodes) {
  return nodes.map((node) => ({
    id: node.id,
    parentId: node.parentId ?? null,
    label: node.title || node.id,
    icon: node.kind === "frame" ? "▤" : "◇",
  }));
}

/** Compare only tree-visible fields so selections, geometry and unrelated props keep the same DOM subtree. */
function sameRows(a, b) {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index++) {
    for (const key of ["id", "parentId", "label", "icon"])
      if (a[index][key] !== b[index][key]) return false;
  }
  return true;
}

/** Adapt one real createTree to composition identity; at most eight document views live in this editor session. */
export function createCompositionTree({
  document = globalThis.document,
  onSelect,
} = {}) {
  const views = new Map();
  let currentId = null,
    rows = [],
    disposed = false;
  const tree = createTree({
    document,
    label: "Объекты композиции",
    density: "compact",
    onSelect(id) {
      const view = views.get(currentId);
      if (view) view.selectedId = id;
      onSelect?.(id);
    },
    onExpand(ids) {
      const view = views.get(currentId);
      if (view) view.expanded = [...ids];
    },
  });
  const element = tree.element;
  element.classList.add("composition-layer-tree");

  /** Remember a view only in memory; never write UI expansion or focus into the measured document. */
  function remember() {
    const view = views.get(currentId);
    if (!view) return;
    view.expanded = tree.expandedIds;
    view.selectedId = tree.selectedId;
    view.scrollTop = element.scrollTop;
    if (element.contains(document.activeElement))
      view.focusedId =
        document.activeElement.closest("[data-tree-node]")?.dataset.treeNode ??
        null;
  }

  /** Scroll only this tree viewport; selecting a canvas object must not scroll the whole application page. */
  function reveal(id) {
    if (!id || !element.isConnected || element.closest("[hidden],[inert]"))
      return;
    const item = [...element.querySelectorAll("[data-tree-node]")].find(
      (node) => node.dataset.treeNode === id,
    );
    if (!item || item.closest("[hidden]")) return;
    const viewport = element.getBoundingClientRect(),
      box = item.firstElementChild.getBoundingClientRect();
    if (viewport.height <= 0 || box.height <= 0) return;
    const top = viewport.top + element.clientTop,
      bottom = top + element.clientHeight;
    if (box.top < top) element.scrollTop += box.top - top;
    else if (box.bottom > bottom) element.scrollTop += box.bottom - bottom;
  }

  /** Synchronize controlled selection; only a changed external selection reveals ancestors, never a normal refresh. */
  function update({
    documentId,
    nodes,
    selectedId = null,
    revealSelection = false,
  }) {
    if (disposed) return null;
    const nextRows = rowsFor(nodes),
      switched = documentId !== currentId;
    const byId = new Map(nextRows.map((node) => [node.id, node]));
    const parents = new Set(
      nextRows.map((node) => node.parentId).filter((id) => id !== null),
    );
    const hadFocus = element.contains(document.activeElement);
    remember();
    let view = views.get(documentId);
    if (!view) {
      view = {
        expanded: nextRows
          .filter((node) => node.parentId === null && parents.has(node.id))
          .map((node) => node.id),
        selectedId,
        focusedId: null,
        renderedSelection: null,
        scrollTop: 0,
      };
    }
    const selection =
      switched && byId.has(view.selectedId) ? view.selectedId : selectedId;
    const nextSelection =
      selection !== null && byId.has(selection) ? selection : null;
    // Validation belongs to createTree and runs before the active model/cache identity changes.
    if (switched || !sameRows(rows, nextRows)) tree.setNodes(nextRows);
    rows = nextRows;
    currentId = documentId;
    views.delete(documentId);
    views.set(documentId, view);
    while (views.size > MAX_DOCUMENTS) views.delete(views.keys().next().value);
    view.expanded = view.expanded.filter((id) => parents.has(id));
    const changedExternal =
      revealSelection && nextSelection !== view.renderedSelection;
    if (changedExternal) {
      let ancestor = byId.get(nextSelection)?.parentId;
      const expanded = new Set(view.expanded);
      while (ancestor !== null && ancestor !== undefined) {
        expanded.add(ancestor);
        ancestor = byId.get(ancestor)?.parentId;
      }
      view.expanded = [...expanded];
    }
    tree.setExpanded(view.expanded);
    tree.setSelection(nextSelection);
    view.selectedId = nextSelection;
    view.renderedSelection = nextSelection;
    if (view.focusedId && !byId.has(view.focusedId)) view.focusedId = null;
    element.scrollTop = view.scrollTop;
    if (switched && hadFocus && view.focusedId) {
      const focused = [...element.querySelectorAll("[data-tree-node]")].find(
        (item) => item.dataset.treeNode === view.focusedId,
      );
      if (focused && !focused.closest("[hidden]")) focused.focus();
    }
    if (changedExternal && nextSelection !== null) reveal(nextSelection);
    view.scrollTop = element.scrollTop;
    return nextSelection;
  }

  return {
    element,
    update,
    dispose() {
      if (disposed) return;
      disposed = true;
      tree.dispose();
      views.clear();
      rows = [];
      onSelect = undefined;
    },
  };
}

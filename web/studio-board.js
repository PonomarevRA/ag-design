import { createBoardViewport } from "./vendor/ag-design/index.js";
import { h } from "./dom.js";
import { resizeBoardObject } from "./studio-model.js";
const NS = "http://www.w3.org/2000/svg";

/** Create a literal SVG primitive; callers supply fixed tag/attribute names and validated document data. */
function svg(tag, attributes = {}, text) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes))
    node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Accessible SVG board shares export geometry. Pointer previews stay transient and commit once per gesture. */
export function createStudioBoard({ onSelect, onCommit }) {
  const scene = h("div", { className: "studio-board-scene" });
  const viewport = h(
    "div",
    { className: "studio-board-viewport", "aria-label": "Доска бренд-бука" },
    scene,
  );
  const root = h("section", { className: "studio-board" }, viewport);
  const camera = createBoardViewport({ viewport, scene });
  const abort = new AbortController();
  let board = null,
    selected = null,
    drag = null,
    drawing = null,
    busy = false;

  /** Draw the exact board primitives and selection chrome; renderer state never enters the saved model. */
  function render() {
    if (!board) return;
    const focusedId = scene.contains(document.activeElement)
      ? document.activeElement.closest("[data-object-id]")?.dataset.objectId
      : null;
    scene.style.width = `${board.width}px`;
    scene.style.height = `${board.height}px`;
    drawing = svg("svg", {
      width: board.width,
      height: board.height,
      viewBox: `0 0 ${board.width} ${board.height}`,
      "aria-label": "Объекты бренд-бука",
    });
    drawing.append(
      svg("rect", {
        width: board.width,
        height: board.height,
        fill: board.background,
      }),
    );
    for (const item of board.objects) {
      if (item.hidden) continue;
      const group = svg("g", {
        "data-object-id": item.id,
        "data-board-no-pan": "",
        tabindex: 0,
        role: "button",
        "aria-label": `${item.title}${item.locked ? ", заблокирован" : ""}`,
        "aria-pressed": String(item.id === selected),
        transform: `translate(${item.x} ${item.y}) rotate(${item.rotation} ${item.width / 2} ${item.height / 2})`,
      });
      group.append(svg("title", {}, item.title));
      // A transparent hit area makes short text and narrow shapes usable without changing the SVG artwork.
      group.append(
        svg("rect", {
          width: item.width,
          height: item.height,
          fill: "transparent",
        }),
      );
      if (item.type === "text") {
        const text = svg("text", {
          x: 0,
          y: item.fontSize,
          fill: item.color,
          "font-family": "sans-serif",
          "font-size": item.fontSize,
          "font-weight": item.fontWeight,
          "xml:space": "preserve",
        });
        for (const [index, line] of item.text.split("\n").entries())
          text.append(
            svg("tspan", { x: 0, dy: index ? item.fontSize * 1.25 : 0 }, line),
          );
        group.append(text);
      } else if (item.type === "ellipse")
        group.append(
          svg("ellipse", {
            cx: item.width / 2,
            cy: item.height / 2,
            rx: item.width / 2,
            ry: item.height / 2,
            fill: item.color,
          }),
        );
      else
        group.append(
          svg("rect", {
            width: item.width,
            height: item.height,
            rx: 8,
            fill: item.color,
          }),
        );
      if (item.id === selected) {
        group.append(
          svg("rect", {
            width: item.width,
            height: item.height,
            fill: "none",
            stroke: "var(--ag-accent)",
            "stroke-width": 1.5,
            "vector-effect": "non-scaling-stroke",
            "pointer-events": "none",
          }),
        );
        if (!item.locked)
          group.append(
            svg("rect", {
              x: item.width - 10,
              y: item.height - 10,
              width: 20,
              height: 20,
              fill: "var(--ag-accent)",
              "data-resize": "",
              "aria-hidden": "true",
            }),
          );
      }
      drawing.append(group);
    }
    scene.replaceChildren(drawing);
    if (focusedId) {
      const replacement = [
        ...drawing.querySelectorAll("[data-object-id]"),
      ].find((node) => node.dataset.objectId === focusedId);
      replacement?.focus({ preventScroll: true });
    }
  }

  /** Start only primary-pointer edits; the camera owns all other viewport gestures. */
  function pointerDown(event) {
    if (busy || event.button !== 0 || !board) return;
    const hit = event.target.closest("[data-object-id]");
    if (!hit) return;
    const item = board.objects.find(
      (value) => value.id === hit.dataset.objectId,
    );
    selected = item.id;
    onSelect(selected);
    if (item.locked) {
      render();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    drag = {
      before: structuredClone(item),
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
      resize: !!event.target.closest("[data-resize]"),
      next: null,
    };
    viewport.setPointerCapture?.(event.pointerId);
  }

  /** Convert screen movement through the camera once and keep the object within the board. */
  function pointerMove(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = (event.clientX - drag.x) / camera.state.scale,
      dy = (event.clientY - drag.y) / camera.state.scale;
    const before = drag.before;
    let next = { ...before };
    if (drag.resize) {
      next = resizeBoardObject(before, dx, dy, board);
    } else {
      next.x = Math.max(0, Math.min(board.width - before.width, before.x + dx));
      next.y = Math.max(
        0,
        Math.min(board.height - before.height, before.y + dy),
      );
    }
    drag.next = next;
    board.objects = board.objects.map((item) =>
      item.id === before.id ? next : item,
    );
    render();
  }

  /** Cancel restores the immutable start; pointer-up contributes one undoable server command. */
  function finish(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const gesture = drag;
    drag = null;
    if (viewport.hasPointerCapture?.(event.pointerId))
      viewport.releasePointerCapture(event.pointerId);
    board.objects = board.objects.map((item) =>
      item.id === gesture.before.id ? gesture.before : item,
    );
    render();
    if (
      event.type === "pointerup" &&
      gesture.next &&
      JSON.stringify(gesture.next) !== JSON.stringify(gesture.before)
    )
      onCommit(gesture.before.id, gesture.next);
  }
  viewport.addEventListener("pointerdown", pointerDown, {
    signal: abort.signal,
  });
  viewport.addEventListener("pointermove", pointerMove, {
    signal: abort.signal,
  });
  viewport.addEventListener("pointerup", finish, { signal: abort.signal });
  viewport.addEventListener("pointercancel", finish, { signal: abort.signal });
  viewport.addEventListener("lostpointercapture", finish, {
    signal: abort.signal,
  });
  viewport.ownerDocument.defaultView.addEventListener(
    "blur",
    () => {
      if (drag) finish({ pointerId: drag.pointerId, type: "pointercancel" });
    },
    { signal: abort.signal },
  );
  viewport.addEventListener(
    "keydown",
    (event) => {
      const hit = event.target.closest("[data-object-id]");
      if (hit && ["Enter", " "].includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        onSelect(hit.dataset.objectId);
      }
      const item = board?.objects.find(
        (item) => item.id === hit?.dataset.objectId,
      );
      const delta = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      }[event.key];
      if (delta && item && !item.locked && !busy) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        const next = {
          ...item,
          x: Math.max(
            0,
            Math.min(board.width - item.width, item.x + delta[0] * step),
          ),
          y: Math.max(
            0,
            Math.min(board.height - item.height, item.y + delta[1] * step),
          ),
        };
        onCommit(item.id, next);
      }
    },
    { signal: abort.signal },
  );
  return {
    element: root,
    update(value, selection, blocked = false) {
      board = structuredClone(value);
      selected = selection;
      busy = blocked;
      render();
    },
    fit: () => camera.fit(),
    dispose() {
      abort.abort();
      drag = null;
      camera.dispose();
      root.replaceChildren();
    },
  };
}

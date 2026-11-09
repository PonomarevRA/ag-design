import { createLayoutDropPreview } from "./vendor/ag-design/layout-drop-preview.js";
import { h } from "./dom.js";

/** Local demo uses the same slot preview as the editor; native buttons offer single-click moves. */
export function buildLayoutDropSample() {
  const view = document.defaultView;
  const abort = new view.AbortController();
  const options = { signal: abort.signal };
  const status = h("p", { role: "status" });
  const list = h("ul", { className: "layout-drop-sample__list" });
  const element = h(
    "section",
    {
      className: "layout-drop-sample",
      "aria-label": "Перестановка блоков",
      "data-ag-width": "fill",
    },
    h("p", {}, "Потяните блок за ручку или переместите кнопками."),
    list,
    status,
  );
  let drag = null;

  /** Publish the new DOM order once and retain focus on the control that moved. */
  function commit(item, before) {
    if (item.nextElementSibling === before) return;
    const focus = item.contains(document.activeElement)
      ? document.activeElement
      : null;
    list.insertBefore(item, before);
    focus?.focus({ preventScroll: true });
    const position = [...list.children].indexOf(item) + 1;
    status.textContent = `${item.dataset.label}. Позиция ${position} из ${list.children.length}.`;
  }

  /** Release transient order on every exit path. */
  function cancel() {
    if (!drag) return;
    const active = drag;
    drag = null;
    active.preview?.clear();
    delete active.item.dataset.lifted;
    if (list.hasPointerCapture?.(active.pointerId))
      list.releasePointerCapture(active.pointerId);
  }

  for (const [label, value, detail] of [
    ["Показатели", "84%", "План на неделю выполнен на 84%."],
    ["Активность", "12 событий", "8 обновлений и 4 комментария за неделю."],
    ["Заметки", "3 записи", "Последняя запись · план следующего обзора."],
  ]) {
    const item = h("li", { "data-label": label, "data-ag-width": "fill" });
    const grip = h(
      "button",
      { type: "button", "data-grip": "", "aria-label": `Перетащить: ${label}` },
      "⠿",
    );
    const up = h(
      "button",
      { type: "button", "aria-label": `Выше: ${label}` },
      "↑",
    );
    const down = h(
      "button",
      { type: "button", "aria-label": `Ниже: ${label}` },
      "↓",
    );
    up.addEventListener(
      "click",
      () => {
        if (!drag && item.previousElementSibling)
          commit(item, item.previousElementSibling);
      },
      options,
    );
    down.addEventListener(
      "click",
      () => {
        if (!drag && item.nextElementSibling)
          commit(item, item.nextElementSibling.nextElementSibling);
      },
      options,
    );
    item.append(
      grip,
      h(
        "div",
        {
          className: "layout-drop-sample__data",
          "data-ag-width": "content",
          "data-ag-width-min-em": "5",
        },
        h("strong", {}, label),
        h("span", {}, value),
      ),
      up,
      down,
      h("small", { className: "layout-drop-sample__detail" }, detail),
    );
    list.append(item);
  }

  list.addEventListener(
    "pointerdown",
    (event) => {
      const grip = event.target.closest("[data-grip]");
      if (drag || !grip || event.button !== 0) return;
      const item = grip.parentElement;
      const peers = [...list.children];
      const centers = new Map();
      for (const peer of peers) {
        if (peer === item) continue;
        const rect = peer.getBoundingClientRect();
        centers.set(peer, rect.y + rect.height / 2 + view.scrollY);
      }
      drag = {
        item,
        peers,
        centers,
        pointerId: event.pointerId,
        x: event.clientX + view.scrollX,
        y: event.clientY + view.scrollY,
      };
      list.setPointerCapture?.(event.pointerId);
    },
    options,
  );
  list.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerId !== drag?.pointerId) return;
      const x = event.clientX + view.scrollX;
      const y = event.clientY + view.scrollY;
      const dx = x - drag.x,
        dy = y - drag.y;
      if (!drag.preview && Math.hypot(dx, dy) < 3) return;
      drag.preview ??= createLayoutDropPreview({
        items: drag.peers,
        source: drag.item,
      });
      drag.item.dataset.lifted = "";
      drag.before = null;
      for (const [peer, center] of drag.centers) {
        if (y >= center) continue;
        drag.before = peer;
        break;
      }
      drag.preview.move(drag.before, dx, dy);
    },
    options,
  );
  list.addEventListener(
    "pointerup",
    (event) => {
      if (event.pointerId !== drag?.pointerId) return;
      const active = drag;
      cancel();
      if (active.preview) commit(active.item, active.before);
    },
    options,
  );
  for (const type of ["pointercancel", "lostpointercapture"])
    list.addEventListener(
      type,
      (event) => {
        if (event.pointerId === drag?.pointerId) cancel();
      },
      options,
    );
  element.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") cancel();
    },
    options,
  );
  view.addEventListener("blur", cancel, options);
  return {
    element,
    interact: () => commit(list.firstElementChild, null),
    dispose() {
      cancel();
      abort.abort();
    },
  };
}

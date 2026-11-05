/** Expose the whole-feed position and explicit marker-list browsing; scrolling this UI never navigates the cards. */
export function createFeedRailProgress({ document, items }) {
  const view = document.defaultView;
  const positions = new Map(items.map((item, index) => [item.id, index]));
  const removeClicks = [];
  const output = document.createElement("output");
  output.className = "ag-vt-feed-rail__position";
  output.setAttribute("aria-live", "off");
  const up = button(-1), down = button(1);
  let list = null, markers = [], frame = 0, disposed = false, resize = null;

  /** Build a quiet, named pointer target with a small SVG glyph and visible remaining count. */
  function button(direction) {
    const control = document.createElement("button");
    control.type = "button";
    control.className = "ag-vt-feed-rail__browse";
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 16 16");
    icon.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(icon.namespaceURI, "path");
    path.setAttribute("d", direction < 0 ? "M4 10 8 6 12 10" : "M4 6 8 10 12 6");
    path.setAttribute("fill", "none"); path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.5"); path.setAttribute("stroke-linecap", "round");
    icon.append(path);
    control.append(icon, document.createElement("span"));
    control.disabled = true;
    control.setAttribute("aria-label", `Прокрутить навигацию ${direction < 0 ? "вверх" : "вниз"}`);
    const click = () => browse(direction);
    control.addEventListener("click", click);
    removeClicks.push(() => control.removeEventListener("click", click));
    return control;
  }

  /** Measure only the bounded marker list; a visible count makes hidden neighbours distinguishable from the end of the feed. */
  function render() {
    frame = 0;
    if (disposed || !list) return;
    const box = list.getBoundingClientRect();
    let above = 0, below = 0;
    for (const marker of markers) {
      const rect = marker.getBoundingClientRect();
      if (rect.top < box.top - 0.5) above++;
      if (rect.bottom > box.bottom + 0.5) below++;
    }
    for (const [control, count, name] of [[up, above, "выше"], [down, below, "ниже"]]) {
      control.lastElementChild.textContent = String(count);
      control.disabled = count === 0;
      const label = `Прокрутить навигацию ${name === "выше" ? "вверх" : "вниз"}; ещё ${count} элементов ${name}`;
      control.setAttribute("aria-label", label); control.title = label;
    }
  }

  /** Coalesce native list scrolling; no timer or animation runs while idle. */
  function schedule() {
    if (!disposed && !frame) frame = view.requestAnimationFrame(render);
  }

  /** Browse markers by a viewport fraction without changing the current card or its selection. */
  function browse(direction) {
    if (!list || disposed) return;
    const maximum = Math.max(0, list.scrollHeight - list.clientHeight);
    list.scrollTop = Math.max(0, Math.min(maximum, list.scrollTop + direction * Math.max(24, list.clientHeight * 0.75)));
    schedule();
  }

  /** Preserve a global item position even when the catalogue exposes a bounded120-item group. */
  function setCurrent({ id, label }) {
    const index = positions.get(id);
    if (disposed || index === undefined) return;
    output.textContent = `${index + 1} / ${items.length}`;
    output.setAttribute("aria-label", `Текущий элемент ${index + 1} из ${items.length}: ${label}`);
    output.title = output.getAttribute("aria-label");
    schedule();
  }

  /** Detach from a replaced range before its old list is removed. */
  function disconnect() {
    if (frame) view.cancelAnimationFrame(frame);
    frame = 0;
    list?.removeEventListener("scroll", schedule);
    resize?.disconnect(); resize = null;
    list = null; markers = [];
  }

  return {
    up, down, output, setCurrent, disconnect,
    /** Bind the current range, replacing every old list subscription before measuring the new one. */
    connect(element) {
      if (disposed) return;
      disconnect();
      list = element.querySelector("ol");
      markers = [...list.querySelectorAll(".ag-vt-rail__item")];
      list.addEventListener("scroll", schedule, { passive: true });
      if (view.ResizeObserver) {
        resize = new view.ResizeObserver(schedule); resize.observe(list);
      }
      schedule();
    },
    dispose() {
      if (disposed) return;
      disconnect(); disposed = true;
      for (const remove of removeClicks) remove();
      items = [];
      up.remove(); down.remove(); output.remove(); positions.clear();
    },
  };
}

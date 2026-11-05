let sequence = 0;

/** Display measured operation progress with a native labelled progress element; null means unknown, not zero. */
export function createProgress({
  document = globalThis.document,
  label,
  value = null,
  max = 100,
  description = "",
} = {}) {
  if (typeof label !== "string" || !label.trim())
    throw new TypeError("A progress label is required");
  const element = document.createElement("div"),
    caption = document.createElement("label"),
    progress = document.createElement("progress"),
    status = document.createElement("span"),
    detail = document.createElement("p");
  element.className = "ag-progress";
  let id;
  do {
    id = `ag-progress-${++sequence}`;
  } while (document.getElementById(id));
  progress.id = id;
  caption.htmlFor = id;
  caption.textContent = label.length > 180 ? label.slice(0, 179) + "…" : label;
  status.className = "ag-progress__value";
  status.setAttribute("aria-hidden", "true");
  detail.className = "ag-progress__description";
  detail.id = id + "-description";
  progress.setAttribute("aria-describedby", detail.id);
  const heading = document.createElement("div");
  heading.className = "ag-progress__heading";
  heading.append(caption, status);
  element.append(heading, progress, detail);
  let currentValue = null,
    currentMax = 100,
    disposed = false;
  /** Validate a complete next state before mutating; progress updates do not force focus or announce every tick. */
  function update({
    value: nextValue = currentValue,
    max: nextMax = currentMax,
    description: nextDescription = detail.textContent,
  } = {}) {
    if (disposed) return;
    if (
      !Number.isFinite(nextMax) ||
      nextMax <= 0 ||
      nextMax > Number.MAX_SAFE_INTEGER ||
      (nextValue !== null &&
        (!Number.isFinite(nextValue) ||
          nextValue < 0 ||
          nextValue > nextMax)) ||
      typeof nextDescription !== "string"
    )
      throw new TypeError(
        "Use finite measured progress within a positive maximum, or null for unknown",
      );
    currentValue = nextValue;
    currentMax = nextMax;
    progress.max = nextMax;
    if (nextValue === null) {
      progress.removeAttribute("value");
      status.textContent = "Выполняется…";
    } else {
      progress.value = nextValue;
      const percent =
        nextValue === nextMax
          ? 100
          : Math.min(99, Math.floor((nextValue / nextMax) * 100));
      status.textContent = `${percent}%`;
    }
    detail.textContent =
      nextDescription.length > 600
        ? nextDescription.slice(0, 599) + "…"
        : nextDescription;
    detail.hidden = !detail.textContent;
    if (detail.hidden) progress.removeAttribute("aria-describedby");
    else progress.setAttribute("aria-describedby", detail.id);
  }
  /** Ignore late operation ticks after the host unmounts the progress view; no internal timer or synthetic progress exists. */
  function dispose() {
    disposed = true;
  }
  update({ value, max, description });
  return { element, progress, update, dispose };
}

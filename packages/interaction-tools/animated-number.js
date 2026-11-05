import { literal, node } from "./runtime.js";

/** Format validated data before replacing current DOM or cancelling an existing effect. */
function format(value, decimals, locale) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    Math.abs(value) > 1e12
  )
    throw new RangeError("Finite number within ±1e12 required");
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 4)
    throw new RangeError("Use 0–4 decimals");
  literal(locale, "locale", 80);
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Roll changed glyphs only; accessible output always contains the exact formatted value, never interpolated business data. */
export function createAnimatedNumber({
  document = globalThis.document,
  value = 0,
  decimals = 0,
  locale = "ru-RU",
  label = "Значение",
  animated = true,
} = {}) {
  literal(label, "label", 180);
  if (typeof animated !== "boolean")
    throw new TypeError("Boolean animated required");
  let text = format(value, decimals, locale),
    disposed = false,
    visible = true;
  const element = node(document, "span", "ag-it ag-it-number"),
    drawing = node(document, "span", "ag-it-number__drawing"),
    accessible = node(document, "span", "ag-it-sr", text);
  element.setAttribute("role", "group");
  element.setAttribute("aria-label", label);
  drawing.setAttribute("aria-hidden", "true");
  element.append(drawing, accessible);
  const view = document.defaultView,
    preference = view.matchMedia?.("(prefers-reduced-motion: reduce)"),
    effects = new Set();
  /** Cancel all owned finite effects, removing obsolete glyphs even if animation promises settle later. */
  function stop() {
    for (const effect of effects) effect.cancel();
    effects.clear();
    for (const old of drawing.querySelectorAll(".ag-it-number__old"))
      old.remove();
  }
  /** Skip motion for hidden/offscreen/reduced-motion content without changing its exact value. */
  function suspend() {
    if (document.hidden || preference?.matches || !visible) stop();
  }
  const observer = view.IntersectionObserver
    ? new view.IntersectionObserver((entries) => {
        visible = entries.at(-1)?.isIntersecting !== false;
        suspend();
      })
    : null;
  observer?.observe(element);
  document.addEventListener("visibilitychange", suspend);
  preference?.addEventListener?.("change", suspend);
  /** Track one short Web Animation; unsupported renderers keep the same static final DOM. */
  function effect(target, keyframes, done) {
    const animation = target.animate(keyframes, {
      duration: 240,
      easing: "cubic-bezier(.2,.7,.2,1)",
    });
    effects.add(animation);
    animation.finished.then(
      () => {
        effects.delete(animation);
        done?.();
      },
      () => {
        effects.delete(animation);
        done?.();
      },
    );
  }
  /** Build final text cells once, then animate only changed code points; old glyphs never enter accessible output. */
  function draw(next, previous, motion) {
    const cells = [],
      chars = Array.from(next),
      oldChars = Array.from(previous);
    for (let i = 0; i < chars.length; i++) {
      const cell = node(document, "span", "ag-it-number__cell"),
        current = node(document, "span", "ag-it-number__new", chars[i]);
      cell.append(current);
      const changed =
        motion &&
        oldChars[i] !== chars[i] &&
        typeof current.animate === "function";
      if (changed)
        cell.append(
          node(document, "span", "ag-it-number__old", oldChars[i] ?? ""),
        );
      cells.push(cell);
    }
    drawing.replaceChildren(...cells);
    if (!motion) return;
    for (const cell of cells) {
      const old = cell.querySelector(".ag-it-number__old");
      if (!old) continue;
      effect(cell.firstElementChild, [
        { transform: "translateY(100%)", opacity: 0.3 },
        { transform: "translateY(0)", opacity: 1 },
      ]);
      effect(
        old,
        [
          { transform: "translateY(0)", opacity: 1 },
          { transform: "translateY(-100%)", opacity: 0 },
        ],
        () => old.remove(),
      );
    }
  }
  draw(text, "", false);
  return {
    element,
    get value() {
      return value;
    },
    get text() {
      return text;
    },
    /** An unchanged value allocates no glyphs; new data atomically replaces the prior formatted result. */
    update(next) {
      if (disposed) return false;
      const nextText = format(next, decimals, locale);
      value = next;
      if (nextText === text) return true;
      const previous = text;
      stop();
      text = nextText;
      accessible.textContent = text;
      draw(
        text,
        previous,
        animated &&
          !preference?.matches &&
          !document.hidden &&
          visible &&
          element.isConnected,
      );
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      observer?.disconnect();
      document.removeEventListener("visibilitychange", suspend);
      preference?.removeEventListener?.("change", suspend);
      element.remove();
    },
  };
}

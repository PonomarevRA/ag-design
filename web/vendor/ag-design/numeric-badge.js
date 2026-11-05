import { createNumericScale } from "./numeric-scale.js";

const UNKNOWN_SCALE = createNumericScale();

/** Render a literal number or normalized score while keeping the exact source value accessible.
 * Color only supplements the number; its intensity follows the unrounded scale ratio.
 * The host owns the semantic palette and scale. No request, timer, or observer is created.
 */
export function createNumericBadge({
  document = globalThis.document,
  value,
  mode = "value",
  scale = UNKNOWN_SCALE,
  label,
  decimals = 1,
} = {}) {
  const element = document.createElement("span");
  element.className = "ag-numeric-badge";
  element.setAttribute("role", "img");
  const dot = document.createElement("span");
  dot.className = "ag-numeric-badge__dot";
  dot.setAttribute("aria-hidden", "true");
  const text = document.createElement("span");
  text.className = "ag-numeric-badge__value";
  text.setAttribute("aria-hidden", "true");
  element.append(dot, text);
  let current, disposed = false, localeContext=null, localeSignature="", defaultLabel=label===undefined;

  /** Validate and format the next complete state before publishing any DOM or state change. */
  function update(patch = {}) {
    if (disposed) return false;
    if (!patch || typeof patch !== "object" || Array.isArray(patch))
      throw new TypeError("Badge updates must be an options object");
    const next = { ...current, ...patch };
    if(current&&Object.hasOwn(patch,"label"))defaultLabel=false;
    if (next.mode !== "value" && next.mode !== "score") throw new TypeError("Unknown badge mode");
    if (typeof next.label !== "string" || !next.label.trim() || next.label.length > 180)
      throw new TypeError("A badge label of at most180characters is required");
    if (!Number.isInteger(next.decimals) || next.decimals < 0 || next.decimals > 4)
      throw new RangeError("decimals must be an integer from0to4");
    if (!next.scale || typeof next.scale.evaluate !== "function" ||
        !Number.isFinite(next.scale.maximum) || next.scale.maximum <= 0)
      throw new TypeError("Use a numeric scale with a positive maximum");
    const result = next.scale.evaluate(next.value);
    if (!result || result.value !== next.value || typeof next.value !== "number" || !Number.isFinite(next.value))
      throw new TypeError("Scale must preserve the finite source value");
    const unknown = result.score === null && result.ratio === null;
    if (!unknown && (!Number.isFinite(result.score) || !Number.isFinite(result.ratio) ||
        result.ratio < 0 || result.ratio > 1 || result.score < 0 || result.score > next.scale.maximum))
      throw new TypeError("Scale must return a bounded score and ratio, or null for both");
    const score = unknown ? "—" : result.score.toFixed(next.decimals);
    let shown = localeContext?localeContext.number(next.value,{maximumFractionDigits:20}):String(next.value);
    if (next.mode === "score") shown = unknown ? "—" : `${score} / ${next.scale.maximum}`;
    let explanation = "шкала не задана";
    if (!unknown) {
      const kind = next.scale.method === "percentile" ? "процентильная шкала" : "нормализованная шкала";
      explanation = `оценка ${score} из ${next.scale.maximum}; ${kind}`;
    }
    if(localeContext){
      if(unknown)explanation=localeContext.t("numeric.noScale");
      else explanation=localeContext.t("numeric.score",{score,maximum:next.scale.maximum,kind:localeContext.t(next.scale.method==="percentile"?"numeric.percentile":"numeric.normalized")});
    }
    const caption=defaultLabel&&localeContext?localeContext.t("grid.value"):next.label;
    const name = `${caption}: ${next.value}; ${explanation}`;
    current = next;
    text.textContent = shown;
    element.dataset.mode = next.mode;
    element.dataset.scaled = String(!unknown);
    element.title = name;
    element.setAttribute("aria-label", name);
    element.style.setProperty("--ag-numeric-intensity", unknown ? "0%" : `${result.ratio * 100}%`);
    return true;
  }
  update({ value, mode, scale, label:label??"Значение", decimals });
  return {
    element, update,
    /** Reformat only presentation; the finite raw value and scale evaluation are preserved. */
    refreshLocaleContent(context){const signature=context.locale+context.t("numeric.noScale")+context.t("numeric.score");if(signature===localeSignature)return;localeSignature=signature;localeContext=context;const wasDefault=defaultLabel;update({});defaultLabel=wasDefault;},
    /** Remove the owned node; later updates remain inert and never recreate subscriptions. */
    dispose() {
      if (disposed) return;
      disposed = true; current = null; element.remove();
    },
  };
}

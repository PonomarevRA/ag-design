import { createChart } from "./vendor/chart.js";
/** Literal construction keeps example data and user selections out of HTML parsing. */
export function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
/** Reuse the existing chart factory with a static SVG default and owned teardown. */
export function mountDashboardChart(host, options) {
  const chart = createChart({
    document,
    renderer: "svg",
    animated: false,
    ...options,
  });
  host.replaceChildren(chart.element);
  return chart;
}
export const number = new Intl.NumberFormat("ru-RU");
export const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
/** Format integer minutes without rounding each cell into inconsistent hour totals. */
export function duration(minutes) {
  return `${Math.floor(minutes / 60)} ч ${String(minutes % 60).padStart(2, "0")} мин`;
}

/** Anchor navigation reports the current section and releases its owned listener when the page leaves. */
export function bindDashboardNavigation() {
  const controller = new window.AbortController();
  const links = [...document.querySelectorAll(".dashboard-sidebar nav a")];
  function updateCurrentSection() {
    const selected =
      links.find((link) => link.hash === window.location.hash) || links[0];
    for (const link of links) {
      if (link === selected) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  }
  window.addEventListener("hashchange", updateCurrentSection, {
    signal: controller.signal,
  });
  window.addEventListener("pagehide", () => controller.abort(), { once: true });
  updateCurrentSection();
}

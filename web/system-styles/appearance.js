// Resolve only the two reviewed local appearances before paint, without applying query text as CSS.
const selectedStyle = new URLSearchParams(location.search).get("style");
document.documentElement.dataset.style =
  selectedStyle === "midnight-glass" ? "midnight-glass" : "violet-soft-3d";

// This fixed local frame gives the example a real desktop viewport for catalogue screenshots.
const style =
  new URLSearchParams(location.search).get("style") === "midnight-glass"
    ? "midnight-glass"
    : "violet-soft-3d";
document.querySelector("iframe").src = `./example.html?style=${style}`;

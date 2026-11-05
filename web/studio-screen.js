import { renderComposition } from "./composition-renderer.js";
import { applyColorProfile } from "./vendor/ag-design/index.js";
const channel = new URLSearchParams(location.hash.slice(1)).get("channel");
let mounted = null,
  generation = null;

/** Accept only the owning same-origin frame, with an unguessable per-mount channel. */
window.addEventListener("message", (event) => {
  if (
    event.source !== parent ||
    event.origin !== location.origin ||
    event.data?.channel !== channel ||
    !["studio:screen", "studio:appearance"].includes(event.data.type)
  )
    return;
  const data = event.data;
  if (data.type === "studio:appearance") {
    document.documentElement.dataset.theme = data.theme;
    if (data.profile)
      applyColorProfile(
        document.getElementById("composition-root"),
        data.profile,
        data.theme,
      );
    return;
  }
  mounted?.dispose();
  generation = data.generation;
  document.documentElement.dataset.theme = data.theme;
  mounted = renderComposition({
    root: document.getElementById("composition-root"),
    document: data.document,
    definitions: data.definitions,
    palette: data.palette,
    profile: data.profile,
    theme: data.theme,
    onSelect(id) {
      parent.postMessage(
        { type: "studio:trigger", channel, generation, nodeId: id },
        location.origin,
      );
    },
  });
});
window.addEventListener("pagehide", () => mounted?.dispose());
parent.postMessage({ type: "studio:ready", channel }, location.origin);

/** Relay genuine input as an empty activity signal; never serialize field names, values or typed keys. */
let lastActivity = -Infinity;
function reportActivity(event) {
  const now = performance.now();
  if (!event.isTrusted || generation === null || now - lastActivity < 1000)
    return;
  lastActivity = now;
  parent.postMessage(
    { type: "studio:activity", channel, generation },
    location.origin,
  );
}
for (const type of ["pointerdown", "keydown", "input"])
  document.addEventListener(type, reportActivity);

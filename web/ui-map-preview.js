import { createUiMapView } from "./ui-map-view.js";
import { get } from "./api.js";

const parameters = new URLSearchParams(location.search);
const frameMode = parameters.get("frame") === "1";
const controls = document.getElementById("preview-controls"),
  content = document.getElementById("preview-content");
let map = null,
  disposed = false;

/** Parse only enumerated local fixture settings; no supplied URL or script can become a frame resource. */
function setting(name, choices, fallback) {
  const value = parameters.get(name);
  return choices.includes(value) ? value : fallback;
}

/** Build a real same-origin viewport using audited product controls, without executing browser-injected CSS or JavaScript. */
function applyEnvironment() {
  const frame = document.getElementById("preview-frame");
  const width = document.getElementById("preview-width").value;
  const query = new URLSearchParams({
    frame: "1",
    text: document.getElementById("preview-text").value,
    theme: document.getElementById("preview-theme").value,
    contrast: document.getElementById("preview-contrast").value,
    palette: document.getElementById("preview-palette").value,
  });
  frame.style.width = `${width}px`;
  frame.src = `/ui-map-preview.html?${query}`;
  document.getElementById("preview-environment").textContent =
    `Запрошен viewport ${width} CSS px; текст ${Number(query.get("text")) * 100}%; ${query.get("theme")}/${query.get("contrast")}. Системный zoom не измеряется.`;
}

/** Load the current source module/client and palette; capture still requires an explicit user button press. */
async function mountFrame() {
  controls.hidden = true;
  content.hidden = false;
  const theme = setting("theme", ["light", "dark"], "light"),
    scale = setting("text", ["1", "2"], "1");
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.textScale = scale;
  document.documentElement.style.fontSize = `${13 * Number(scale)}px`;
  document.documentElement.style.setProperty(
    "--ag-text-size",
    `${13 * Number(scale)}px`,
  );
  document.documentElement.style.setProperty(
    "--ag-font-size",
    `${13 * Number(scale)}px`,
  );
  document.documentElement.style.setProperty(
    "--ag-label-size",
    `${12 * Number(scale)}px`,
  );
  content.textContent = "Загружаем текущую локальную палитру…";
  try {
    const profiles = await get("profiles");
    if (disposed) return;
    map = createUiMapView({
      document,
      captureEnvironment: { textScale: Number(scale) },
      profiles: profiles.items,
      palette: setting(
        "palette",
        ["atlas", "memory", "observer", "tasks", "design"],
        "design",
      ),
    });
    content.replaceChildren(map.element);
    const contrast = map.element.querySelector('[aria-label="Контраст карты"]');
    contrast.value = setting("contrast", ["standard", "increased"], "standard");
    contrast.dispatchEvent(new Event("change"));
  } catch {
    if (!disposed)
      content.textContent =
        "Не удалось загрузить локальный стенд. Перезагрузите после проверки сервиса.";
  }
}

if (frameMode) mountFrame();
else {
  document
    .getElementById("preview-apply")
    .addEventListener("click", applyEnvironment);
  applyEnvironment();
}
window.addEventListener("pagehide", () => {
  disposed = true;
  map?.dispose();
  document
    .getElementById("preview-apply")
    .removeEventListener("click", applyEnvironment);
});

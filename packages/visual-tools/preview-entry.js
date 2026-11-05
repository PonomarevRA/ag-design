import { createSample } from "./samples.js";
/** The opaque local preview runs the exact public package implementation and releases it on page teardown. */
export function render(settings, root) {
  try {
    const sample = createSample(settings.id, root.ownerDocument);
    root.append(sample.element);
    root.ownerDocument.defaultView.addEventListener(
      "pagehide",
      sample.dispose,
      { once: true },
    );
  } catch (error) {
    root.textContent = "Пример недоступен: " + error.message;
  }
}

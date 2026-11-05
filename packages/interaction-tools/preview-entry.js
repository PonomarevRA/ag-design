import { createSample } from "./samples.js";
/** Render only bundled synthetic content; page teardown owns the sample lifecycle. */
export function render(settings, root) {
  const sample = createSample(settings.id, root.ownerDocument);
  root.append(sample.element);
  root.ownerDocument.defaultView.addEventListener("pagehide", sample.dispose, {
    once: true,
  });
}

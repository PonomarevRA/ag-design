/** Group related existing elements with explicit heading and predictable spacing tokens. */
export function createSectionStack({
  document = globalThis.document,
  title,
  description = "",
  items = [],
  density = "comfortable",
} = {}) {
  if (!title || !["compact", "comfortable"].includes(density))
    throw new TypeError("Title and known density are required");
  const element = document.createElement("section");
  element.className = "ag-section-stack";
  element.dataset.density = density;
  const heading = document.createElement("h3");
  heading.textContent = title;
  element.append(heading);
  if (description) {
    const caption = document.createElement("p");
    caption.className = "ag-section-stack__description";
    caption.textContent = description;
    element.append(caption);
  }
  const body = document.createElement("div");
  body.className = "ag-section-stack__items";
  for (const item of items) {
    if (!item || item.nodeType !== 1 || item.ownerDocument !== document)
      throw new TypeError("Items must be elements from the same document");
    body.append(item);
  }
  element.append(body);
  return element;
}

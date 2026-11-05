/** Build only trusted element names/attributes; every dynamic string remains text. */
export function h(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === "className") element.className = value;
    else element.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of children.flat())
    if (child !== undefined && child !== null)
      element.append(
        child instanceof Node ? child : document.createTextNode(String(child)),
      );
  return element;
}

/** Render bounded tabular evidence with one accessible caption and overflow container. */
export function table(caption, headers, rows) {
  const body = h("tbody");
  for (const row of rows)
    body.append(
      h(
        "tr",
        {},
        row.map((value) => h("td", {}, value ?? "Нет данных")),
      ),
    );
  return h(
    "div",
    { className: "table-scroll" },
    h(
      "table",
      { className: "report-table" },
      h("caption", { className: "sr-only" }, caption),
      h(
        "thead",
        {},
        h(
          "tr",
          {},
          headers.map((value) => h("th", { scope: "col" }, value)),
        ),
      ),
      body,
    ),
  );
}

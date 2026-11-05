const variants = new Set(["text", "card", "list", "table", "profile"]);
const shapes = new Set(["line", "heading", "circle", "square", "divider"]);

/** Create one decorative CSS shape; callers provide a bounded pixel width or percentage, never arbitrary CSS. */
export function createSkeletonShape({
  document = globalThis.document,
  shape = "line",
  width,
  size = 40,
} = {}) {
  if (!shapes.has(shape)) throw new TypeError("Unknown skeleton shape");
  if (
    typeof size !== "number" ||
    !Number.isFinite(size) ||
    size < 8 ||
    size > 320
  )
    throw new RangeError("Skeleton size must be 8–320px");
  if (
    width !== undefined &&
    !(
      typeof width === "number" &&
      Number.isFinite(width) &&
      width >= 8 &&
      width <= 1200
    ) &&
    !(typeof width === "string" && /^(?:[1-9][0-9]?|100)%$/.test(width))
  )
    throw new TypeError("Skeleton width must be bounded pixels or percent");
  const element = document.createElement("span");
  element.className = "ag-skeleton-shape ag-skeleton-shape--" + shape;
  element.setAttribute("aria-hidden", "true");
  if (width !== undefined)
    element.style.width = typeof width === "number" ? width + "px" : width;
  if (shape === "circle" || shape === "square") {
    element.style.width = size + "px";
    element.style.height = size + "px";
  }
  return element;
}

/** Show layout placeholders with one loading announcement; the host decides when real content replaces them. */
export function createSkeleton({
  document = globalThis.document,
  variant = "card",
  rows = 3,
  columns = 3,
  animated = true,
  label = "Загрузка содержимого",
} = {}) {
  if (!variants.has(variant))
    throw new TypeError("Unknown skeleton composition");
  if (
    !Number.isInteger(rows) ||
    rows < 1 ||
    rows > 12 ||
    !Number.isInteger(columns) ||
    columns < 1 ||
    columns > 6
  )
    throw new RangeError("Use 1–12 rows and 1–6 columns");
  if (typeof label !== "string" || !label.trim())
    throw new TypeError("Loading label required");
  const element = document.createElement("section");
  element.className = "ag-skeleton";
  element.dataset.variant = variant;
  element.dataset.animated = String(Boolean(animated));
  const status = document.createElement("span");
  status.className = "ag-skeleton__status";
  status.setAttribute("role", "status");
  status.textContent = label.slice(0, 180);
  const drawing = document.createElement("div");
  drawing.className = "ag-skeleton__drawing";
  drawing.setAttribute("aria-hidden", "true");
  const add = (shape, width, size) =>
    drawing.append(createSkeletonShape({ document, shape, width, size }));
  if (variant === "card") add("square", "100%", 120);
  if (variant === "profile") add("circle", undefined, 48);
  add("heading", variant === "table" ? "100%" : "65%");
  for (let index = 0; index < rows; index++) {
    const row = document.createElement("div");
    row.className = "ag-skeleton__row";
    if (variant === "list")
      row.append(createSkeletonShape({ document, shape: "circle", size: 32 }));
    const count = variant === "table" ? columns : 1;
    for (let column = 0; column < count; column++)
      row.append(
        createSkeletonShape({
          document,
          shape: "line",
          width:
            variant === "table" ? "100%" : index === rows - 1 ? "70%" : "100%",
        }),
      );
    drawing.append(row);
  }
  element.append(status, drawing);
  let disposed = false;
  /** Hide only this placeholder, never label unknown data as a successful completed request. */
  function setLoading(loading) {
    if (disposed) return;
    element.hidden = !loading;
    drawing.setAttribute("aria-busy", String(Boolean(loading)));
    status.textContent = loading ? label.slice(0, 180) : "";
  }
  setLoading(true);
  return {
    element,
    setLoading,
    dispose() {
      if (disposed) return;
      setLoading(false);
      disposed = true;
      element.remove();
    },
  };
}

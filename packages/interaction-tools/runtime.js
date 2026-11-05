/** Reject unbounded or interpreted content before changing an existing component. */
export function literal(value, name, max = 240, empty = false) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (!empty && !value.trim())
  )
    throw new TypeError(`${name}: bounded literal text required`);
  return value;
}
/** Build text-only DOM; a caller string is never HTML, an asset URL or executable code. */
export function node(document, tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
/** Optional host effects stay explicit; transport and business state belong to the host. */
export function callback(value, name) {
  if (value !== undefined && typeof value !== "function")
    throw new TypeError(`${name}: function required`);
}

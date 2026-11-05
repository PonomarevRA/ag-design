/** @typedef {{snapshotId?:string,graphId?:string,provider?:'semantic'|'spatial'|'hybrid',parameters?:Object,collection?:'nodes'|'groups'|'edges'|'findings',offset?:number,limit?:number}} UiMapRequest */
/** @typedef {{signal?:AbortSignal}} UiMapRequestOptions */

const routes = Object.freeze({
  importSnapshot: "/api/v1/ui-snapshots",
  map: "/api/v1/ui-map",
  node: "/api/v1/ui-node",
  evaluate: "/api/v1/ui-map-evaluation",
  compare: "/api/v1/ui-map-comparison",
});
const messages = Object.freeze({
  invalid_snapshot: "Некорректный снимок интерфейса.",
  unsupported_schema: "Версия снимка не поддерживается.",
  invalid_reference: "Элемент или ссылка отсутствует.",
  hash_mismatch: "Содержимое снимка изменилось.",
  policy_mismatch: "Политика изменилась. Создайте новую карту явно.",
  invalid_provider: "Неизвестный способ группировки.",
  limit_exceeded: "Превышен лимит операции карты.",
  cancelled: "Операция карты отменена.",
  capture_timeout: "Истекло время операции карты.",
  snapshot_not_found: "Снимок истёк. Импортируйте его снова.",
  graph_not_found: "Карта истекла. Создайте новую карту явно.",
  graph_mismatch: "Страницы относятся к разным картам.",
  too_large: "Превышен лимит размера запроса.",
  invalid_fields: "Некорректные параметры операции.",
  invalid_json: "Некорректный JSON запроса.",
  invalid_response: "Некорректный ответ локального сервиса.",
  ui_map_unavailable: "Локальный сервис карт недоступен.",
  ui_map_request_failed: "Локальный сервис отклонил операцию карты.",
});

/** A fixed public error contract; remote text/HTML and submitted data are never shown as messages. */
export class UiMapRequestError extends Error {
  /** Keep a recognized public code/status; discard any remote error message. */
  constructor(code, httpStatus = 0) {
    const safeCode = Object.hasOwn(messages, code)
      ? code
      : "ui_map_request_failed";
    super(messages[safeCode]);
    this.name = "UiMapRequestError";
    this.code = safeCode;
    this.httpStatus = httpStatus;
  }
}

/** Read at most two million actual UTF-8 response bytes, including chunked/non-JSON error responses. */
async function readResponse(response) {
  const maximum = 2_000_000;
  if (Number(response.headers.get("content-length")) > maximum) {
    await response.body?.cancel();
    throw new UiMapRequestError("limit_exceeded", 413);
  }
  if (!response.body)
    throw new UiMapRequestError("invalid_response", response.status);
  const reader = response.body.getReader();
  const chunks = [];
  let used = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      used += value.byteLength;
      if (used > maximum) {
        await reader.cancel();
        throw new UiMapRequestError("limit_exceeded", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(used);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let value;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new UiMapRequestError("invalid_response", response.status);
  }
  if (!value || Array.isArray(value) || typeof value !== "object")
    throw new UiMapRequestError("invalid_response", response.status);
  return value;
}

/** Create a fixed same-origin client. Inject fetch for tests; there is no configurable URL or automatic retry. */
export function createUiMapClient({
  fetch: fetchImpl = globalThis.fetch,
} = {}) {
  if (typeof fetchImpl !== "function") throw new TypeError("fetch is required");

  /** Submit one bounded operation; AbortSignal cancels only this request and never rebuilds an expired graph. */
  async function request(operation, payload, { signal } = {}) {
    let body;
    try {
      body = JSON.stringify(payload);
    } catch {
      throw new UiMapRequestError("invalid_snapshot", 422);
    }
    const maximum = operation === "importSnapshot" ? 4 * 1024 * 1024 : 65536;
    if (!body || new TextEncoder().encode(body).byteLength > maximum)
      throw new UiMapRequestError("too_large", 413);
    const timeout = AbortSignal.timeout(15000);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    try {
      const response = await fetchImpl(routes[operation], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        redirect: "error",
        credentials: "same-origin",
        cache: "no-store",
        signal: combined,
      });
      const value = await readResponse(response);
      if (!response.ok)
        throw new UiMapRequestError(value.error?.code, response.status);
      return value;
    } catch (error) {
      if (combined.aborted)
        throw new UiMapRequestError(
          signal?.aborted ? "cancelled" : "capture_timeout",
          signal?.aborted ? 409 : 408,
        );
      if (error instanceof UiMapRequestError) throw error;
      throw new UiMapRequestError("ui_map_unavailable");
    }
  }

  return Object.freeze({
    /** Import one sanitized snapshot without navigation. @param {Object} snapshot @param {UiMapRequestOptions} [options] */
    importSnapshot: (snapshot, options) =>
      request("importSnapshot", snapshot, options),
    /** Read one bounded first or graph-pinned page. @param {UiMapRequest} value @param {UiMapRequestOptions} [options] */
    map: (value, options) => request("map", value, options),
    /** Inspect one node in the selected immutable graph. @param {{graphId:string,nodeId:string}} value @param {UiMapRequestOptions} [options] */
    node: (value, options) => request("node", value, options),
    /** Evaluate supported evidence under the current policy. @param {{graphId:string}} value @param {UiMapRequestOptions} [options] */
    evaluate: (value, options) => request("evaluate", value, options),
    /** Compare two immutable graph generations. @param {{beforeId:string,afterId:string}} value Both IDs are graph IDs. @param {UiMapRequestOptions} [options] */
    compare: (value, options) => request("compare", value, options),
  });
}

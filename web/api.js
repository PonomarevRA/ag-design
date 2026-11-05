let uiToken;
/** Read one fixed same-origin API path; an optional owner signal supplements the15second deadline. */
export async function get(path, { signal } = {}) {
  const deadline = AbortSignal.timeout(15000);
  const signals = [signal, deadline].filter(Boolean);
  const requestSignal =
    signals.length === 1 ? signals[0] : AbortSignal.any(signals);
  const response = await fetch(`/api/v1/${path}`, {
    signal: requestSignal,
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(`Локальный сервис вернул HTTP ${response.status}`);
  return response.json();
}

/** Explicit UI writes require the server-issued token and preserve the original failed operation for retry. */
export async function post(path, value) {
  const send = async () => {
    if (!uiToken) uiToken = (await get("ui-session")).token;
    return fetch(`/api/v1/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Ag-Design-UI": uiToken,
      },
      body: JSON.stringify(value),
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  };
  let response = await send();
  // A guard rejection occurs before mutation. Never replay ambiguous network failures.
  if (response.status === 403) {
    uiToken = undefined;
    response = await send();
  }
  if (!response.ok)
    throw new Error(`Не удалось сохранить: HTTP ${response.status}`);
  return response.json();
}

/**
 * Follow bounded source pages within the caller's read lifetime.
 * @param {string} path Same-origin API path, including an optional query.
 * @param {number} maxItems Maximum records to accumulate; defaults to 2000.
 * @param {object} options Optional owner AbortSignal, forwarded to every page.
 * @returns {Promise<object>} Items, total and truncation; abort/read errors propagate unchanged.
 */
export async function getAll(path, maxItems = 2000, { signal } = {}) {
  const items = [];
  let offset = 0;
  let total = 0;
  const discovery = {};
  while (items.length < maxItems) {
    signal?.throwIfAborted();
    const page = await get(
      `${path}${path.includes("?") ? "&" : "?"}limit=${Math.min(100, maxItems - items.length)}&offset=${offset}`,
      { signal },
    );
    signal?.throwIfAborted();
    items.push(...page.items);
    if (offset === 0) {
      for (const key of ["discoveryCandidates", "knowledgeCandidates", "discoveryStatus"])
        if (Object.hasOwn(page, key)) discovery[key] = page[key];
    }
    total = page.total;
    if (!page.hasMore) break;
    if (!Number.isInteger(page.nextOffset) || page.nextOffset <= offset)
      throw new Error("Некорректная пагинация локального каталога");
    offset = page.nextOffset;
  }
  return { items, total, truncated: items.length < total, ...discovery };
}

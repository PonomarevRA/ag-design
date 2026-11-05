const PATH = "/api/v1/composition/";

/** Fixed-route composition client. A transport failure never retries a write automatically. */
export function createCompositionClient({fetcher = globalThis.fetch, signal} = {}) {
  async function call(operation, payload) {
    const response = await fetcher(PATH + operation, {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload), signal,
    });
    const result = await response.json();
    if (!response.ok || result.error) {
      const error = new Error(result.error?.message || `Ошибка композиции: ${response.status}`);
      error.code = result.error?.code || "transport";
      throw error;
    }
    return result;
  }
  return {
    prepare: payload => call("prepare", payload), inspect: payload => call("inspect", payload),
    patch: payload => call("patch", payload), checks: payload => call("checks", payload),
    report: payload => call("report", payload), compare: payload => call("compare", payload),
    undo: payload => call("undo", payload), qualification: payload => call("qualification", payload),
  };
}

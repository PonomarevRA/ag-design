/** Fixed local routes. An ambiguous network failure preserves the command for an explicit exact retry. */
export function createStudioClient({
  fetcher = globalThis.fetch,
  signal,
} = {}) {
  async function call(operation, payload = {}) {
    const response = await fetcher(`/api/v1/studio/${operation}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
      redirect: "error",
    });
    const result = await response.json();
    if (!response.ok || result.error) {
      const error = new Error(
        result.error?.message || `Ошибка студии: ${response.status}`,
      );
      error.code = result.error?.code || "transport";
      throw error;
    }
    return result;
  }
  return {
    create: (value) => call("create", value),
    inspect: (value) => call("inspect", value),
    list: () => call("list"),
    command: (value) => call("command", value),
    export: (value) => call("export", value),
    temporaryCopy: (value) => call("copy-temporary", value),
    extend: (value) => call("extend", value),
    touch: (value) => call("touch", value),
    startTrial: (value) => call("trial-start", value),
    finishTrial: (value) => call("trial-finish", value),
    trialReport: (value) => call("trial-report", value),
  };
}

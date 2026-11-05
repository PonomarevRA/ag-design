/**
 * Own the latest purpose-search read, cancelling superseded transport as well as fencing results.
 * @param {object} options load(query,{signal}), apply(query,result) and current-error fail callbacks.
 * @returns {object} run(query) resolves whether it applied; invalidate aborts only the current read.
 */
export function createCatalogSearch({ load, apply, fail }) {
  let generation = 0,
    controller = null;
  return {
    /** Abort the current read after fencing any synchronous abort listener. */
    invalidate() {
      generation++;
      const previous = controller;
      controller = null;
      previous?.abort();
    },
    /**
     * Run one query; a noncooperative loader can finish but cannot apply an obsolete result.
     * @param {string} query Submitted purpose query, preserved for the apply callback.
     * @returns {Promise<boolean>} True only when this exact request applied successfully.
     */
    async run(query) {
      const request = ++generation;
      const operation = new AbortController();
      const previous = controller;
      controller = operation;
      previous?.abort();
      // An abort listener may synchronously start another search; never overwrite that owner.
      if (request !== generation || controller !== operation) return false;
      try {
        const result = await load(query, { signal: operation.signal });
        if (request !== generation || operation.signal.aborted) return false;
        apply(query, result);
        return true;
      } catch (error) {
        if (request === generation && !operation.signal.aborted) fail(error);
        return false;
      } finally {
        if (controller === operation) controller = null;
      }
    },
  };
}

/** Translate catalog taxonomy for readers without changing stable filter or component identities. */
export function categoryLabel(value) {
  return (
    {
      navigation: "Навигация",
      controls: "Управление",
      feedback: "Состояния",
      overlays: "Окна",
      visualization: "Визуализация",
      planning: "Планирование",
      data: "Карточки",
      layout: "Компоновка",
    }[value] || value
  );
}

/** A lifecycle label describes maturity, not a test pass; current qualification is read in component details. */
export function maturityLabel(value) {
  return (
    { draft: "Черновик", candidate: "Кандидат", stable: "Стабильный" }[value] ||
    "Требует проверки"
  );
}

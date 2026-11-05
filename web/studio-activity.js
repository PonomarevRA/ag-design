/** Slide the addressed board's retention only after real input; an idle mounted tab has no renewal timer. */
export function createStudioActivity({
  element,
  client,
  getDocumentId,
  onTouch,
  now = Date.now,
  delay = 400,
  interval = 60000,
  isUserInput = (event) => event.isTrusted,
}) {
  const abort = new AbortController();
  const touched = new Map();
  let timer = null;
  let disposed = false;
  async function renew(id) {
    timer = null;
    if (disposed || id !== getDocumentId() || element.ownerDocument.hidden)
      return;
    const last = touched.get(id);
    if (last !== undefined && now() - last < interval) return;
    touched.set(id, now());
    try {
      const result = await client.touch({ documentId: id });
      if (!disposed && id === getDocumentId()) onTouch?.(result);
    } catch (error) {
      // A failed touch never restores an expired document or fabricates a new deadline.
      if (!disposed && id === getDocumentId()) onTouch?.(null, error);
    }
  }
  function noteInput() {
    const id = getDocumentId();
    if (!id || !client.touch || element.ownerDocument.hidden) return;
    if (timer === null) timer = setTimeout(() => renew(id), delay);
  }
  function activity(event) {
    if (isUserInput(event)) noteInput();
  }
  for (const type of ["pointerdown", "keydown", "input"])
    element.addEventListener(type, activity, { signal: abort.signal });
  return {
    noteInput,
    dispose() {
      disposed = true;
      abort.abort();
      if (timer !== null) clearTimeout(timer);
      touched.clear();
    },
  };
}

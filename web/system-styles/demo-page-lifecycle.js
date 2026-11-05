/** Keep suspended BFCache pages intact; release resources once only when this document actually exits. */
export function disposeOnPageExit(window, dispose) {
  function release(event) {
    if (event.persisted) return;
    window.removeEventListener("pagehide", release);
    dispose();
  }
  window.addEventListener("pagehide", release);
  return () => window.removeEventListener("pagehide", release);
}

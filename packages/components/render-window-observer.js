// Pools are scoped to a document/root/margin, so a long list has one observer
// and visibility listener rather than one browser subscription per card.
const documents = new WeakMap();

/** Subscribe one lightweight placeholder to shared visibility signals; unsubscribe releases empty pools. */
export function observeRenderWindow(element, root, rootMargin, changed) {
  const document = element.ownerDocument;
  const view = document.defaultView;
  let pools = documents.get(document);
  if (!pools) documents.set(document, (pools = []));
  let pool = pools.find(
    (item) => item.root === root && item.margin === rootMargin,
  );
  if (!pool) {
    const targets = new Map();
    /** Reconcile page visibility with the last intersection without measuring layout. */
    const notify = () => {
      for (const [target, record] of targets)
        record.changed(record.visible && !document.hidden);
    };
    const observer = view.IntersectionObserver
      ? new view.IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              const record = targets.get(entry.target);
              if (!record) continue; // Ignore queued entries after disposal.
              record.visible = entry.isIntersecting;
              record.changed(record.visible && !document.hidden);
            }
          },
          { root, rootMargin },
        )
      : null;
    pool = { root, margin: rootMargin, targets, observer, notify };
    document.addEventListener("visibilitychange", notify);
    pools.push(pool);
  }
  const record = { changed, visible: !pool.observer };
  pool.targets.set(element, record);
  pool.observer?.observe(element);
  changed(record.visible && !document.hidden);
  return () => {
    pool.observer?.unobserve(element);
    pool.targets.delete(element);
    if (pool.targets.size) return;
    pool.observer?.disconnect();
    document.removeEventListener("visibilitychange", pool.notify);
    pools.splice(pools.indexOf(pool), 1);
    if (!pools.length) documents.delete(document);
  };
}

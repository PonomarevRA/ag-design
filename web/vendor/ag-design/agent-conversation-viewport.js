/** Keep follow/read modes distinct. No event token, history page or resize is allowed to steal focus. */
export function bindConversationViewport({ viewport, list, onFollowChange }) {
  let following = true,
    inspecting = false,
    disposed = false;
  const nearEnd = () =>
    viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= 40;
  const scrolled = () => {
    following = !inspecting && nearEnd();
    onFollowChange?.(following);
  };
  viewport.addEventListener("scroll", scrolled, { passive: true });
  /** Inspecting a disclosure/code viewer pauses live following before its default click can resize the log. */
  function inspect(event) {
    const control = event.target?.closest?.("summary,button,pre");
    if (!control || !list.contains(control)) return;
    inspecting = true;
    following = false;
    onFollowChange?.(false);
  }
  viewport.addEventListener("click", inspect, true);
  /** Capture the first intersecting message and its pixel offset before a bounded DOM update. */
  function capture() {
    const top = viewport.getBoundingClientRect().top;
    for (const element of list.children) {
      const box = element.getBoundingClientRect();
      if (box.bottom > top)
        return {
          id: element.dataset.messageId,
          offset: box.top - top,
          scrollTop: viewport.scrollTop,
        };
    }
    return { scrollTop: viewport.scrollTop };
  }
  /** Restore an anchor after prepend/growth. An evicted anchor is explicit rather than an invisible jump to live. */
  function restore(anchor, { forceRead = false } = {}) {
    if (disposed) return;
    if (following && !forceRead) {
      viewport.scrollTop = viewport.scrollHeight;
      return;
    }
    const element = [...list.children].find(
      (item) => item.dataset.messageId === anchor?.id,
    );
    if (element)
      viewport.scrollTop +=
        element.getBoundingClientRect().top -
        viewport.getBoundingClientRect().top -
        anchor.offset;
    else viewport.scrollTop = anchor?.scrollTop ?? 0;
  }
  const Resize = viewport.ownerDocument.defaultView?.ResizeObserver;
  const observer = Resize
    ? new Resize(() => {
        if (following && !disposed) viewport.scrollTop = viewport.scrollHeight;
      })
    : null;
  observer?.observe(list);
  return {
    capture,
    restore,
    get following() {
      return following;
    },
    follow() {
      if (!disposed) {
        following = true;
        inspecting = false;
        viewport.scrollTop = viewport.scrollHeight;
        onFollowChange?.(true);
      }
    },
    read(anchor) {
      following = false;
      restore(anchor, { forceRead: true });
      onFollowChange?.(false);
    },
    dispose() {
      disposed = true;
      viewport.removeEventListener("scroll", scrolled);
      viewport.removeEventListener("click", inspect, true);
      observer?.disconnect();
    },
  };
}

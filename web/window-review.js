/** Own one accessible review dialog and expose only fixed, observed window state. */
export function mountWindowReview(doc, fetchSnapshot) {
  const opener = doc.getElementById("window-history-open");
  const dialog = doc.getElementById("window-history");
  const filter = doc.getElementById("window-history-filter");
  const close = doc.getElementById("window-history-close");
  const status = doc.getElementById("window-history-status");
  const list = doc.getElementById("window-history-list");
  const documentId = doc.defaultView.crypto.randomUUID();
  let revision = 0;
  let generation = 0;
  let load = "idle";
  let rows = [];

  /** Render a bounded metadata list without interpreting journal text as markup. */
  function render() {
    const selected = rows.filter(row => filter.value === "all" || row.status === filter.value);
    list.replaceChildren();
    for (const row of selected) {
      const item = doc.createElement("li");
      item.textContent = `${row.operation} · ${row.status} · ${row.durationMs} ms`;
      list.append(item);
    }
    status.textContent = {
      idle: "", loading: "Загрузка истории…", error: "История недоступна.",
      ready: `Показано ${selected.length} из ${rows.length}`,
    }[load];
    revision++;
  }

  /** Show the same dialog for human and agent commands, then load its current metadata. */
  async function open() {
    if (dialog.open || doc.querySelector("dialog[open]")) return;
    dialog.showModal();
    filter.focus();
    const current = ++generation;
    rows = [];
    load = "loading";
    render();
    try {
      const result = await fetchSnapshot();
      if (current !== generation) return;
      if (result.appId !== "ag-design" || result.schemaVersion !== "ag-desktop/widget-v1" ||
          !Array.isArray(result.requests)) throw new Error("Invalid journal snapshot");
      rows = result.requests.slice(-8).reverse();
      load = "ready";
    } catch {
      if (current !== generation) return;
      load = "error";
    }
    render();
  }

  /** Finish cleanup synchronously for commands and on the native dialog close event. */
  function finishClose() {
    if (dialog.open || load === "idle") return;
    generation++;
    rows = [];
    load = "idle";
    render();
    opener.focus();
  }

  opener.addEventListener("click", open);
  close.addEventListener("click", () => {
    dialog.close();
    finishClose();
  });
  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    close.click();
  });
  dialog.addEventListener("close", finishClose);
  filter.addEventListener("change", render);

  /** Return only named controls and numeric viewport bounds, excluding journal text. */
  function state() {
    const view = doc.querySelector("[data-view][aria-current=page]")?.dataset.view || "unknown";
    const controls = {};
    let focus = "other";
    for (const [key, element] of [["opener", opener], ["filter", filter], ["close", close]]) {
      if (doc.activeElement === element) focus = key;
      if (!element.getClientRects().length) continue;
      const {x,y,width,height} = element.getBoundingClientRect();
      controls[key] = {x,y,width,height};
    }
    return {
      revision: `${documentId}:${revision}:${view}`, view, focus, controls,
      viewport: {width:doc.documentElement.clientWidth,height:doc.documentElement.clientHeight},
      history: {open:dialog.open, load, filter:filter.value, count:list.children.length},
    };
  }

  /** Dispatch allowlisted commands against the current document and return observed state. */
  function command({expectedRevision, action, value}) {
    if (expectedRevision !== state().revision) return {status:"stale", state:state()};
    if (action === "open-history" && !dialog.open && doc.querySelector("dialog[open]"))
      return {status:"busy", state:state()};
    if (action === "open-history") {
      if (!dialog.open) {
        opener.focus();
        opener.click();
      }
    } else if (action === "filter-history" && dialog.open && ["all","ok","error"].includes(value)) {
      filter.value = value;
      filter.dispatchEvent(new doc.defaultView.Event("change", {bubbles:true}));
    } else if (action === "close-history" && dialog.open) {
      close.click();
    } else {
      return {status:"unavailable", state:state()};
    }
    return {status:"applied", state:state()};
  }
  return Object.freeze({state, command});
}

if (typeof document !== "undefined" && document.getElementById("window-history")) {
  window.agDesignWindowReview = mountWindowReview(document, async () => {
    const reply = await fetch("/api/desktop/v1/widget", {redirect:"error", signal:AbortSignal.timeout(4000)});
    if (!reply.ok) throw new Error("Journal unavailable");
    return reply.json();
  });
}

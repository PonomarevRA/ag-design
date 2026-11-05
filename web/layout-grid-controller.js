import { get, post } from "./api.js";
import {
  createLayoutGridPanel,
  downloadGridFile,
} from "./layout-grid-panel.js";
const DEFAULTS = {
  enabled: false,
  pageGrid: { type: "golden-canon" },
  componentGrid: { type: "columns" },
  blockGrid: { type: "spacing" },
  tolerance: 0.008,
  overrides: [],
};

/** Coordinate one addressed editor's transient grid settings and numeric capture transport. */
export function createLayoutGridController({
  document,
  getContext,
  send,
  onEnabled = () => {},
}) {
  let configuration = null,
    contextKey = "",
    sequence = 0,
    disposed = false,
    syncing = false,
    configuring = false,
    recoveryPending = false,
    recoveryUsed = false;
  const lifetime = new document.defaultView.AbortController();
  /** Read the actual current identity before each async operation; replies never switch another document/scenario. */
  function key(context) {
    return context
      ? context.documentId + ":" + context.revision + ":" + context.scenarioId
      : "";
  }
  /** Retain acknowledged configuration and ask the iframe to recapture its real DOM. */
  function accept(value) {
    if (configuration?.configurationId !== value.configurationId) {
      recoveryPending = false;
      recoveryUsed = false;
    }
    configuration = value;
    sequence = value.lastSequence || 0;
    panel.setConfiguration(value);
    send({ type: "composition:layout-grids", configuration: value });
    if (value.settings.enabled) onEnabled();
  }
  /** CAS-save a deliberate user change. Ambiguous failures are read back, never blindly replayed. */
  async function change(settings) {
    const context = getContext();
    if (disposed || !context || configuring) return;
    configuring = true;
    panel.busy(true);
    panel.show({ status: "stale" });
    send({ type: "composition:layout-grids-clear" });
    try {
      const value = await post("layout-grids/configure", {
        documentId: context.documentId,
        expectedRevision: context.revision,
        settings,
        expectedConfigurationId: configuration?.configurationId ?? null,
      });
      if (!disposed && key(getContext()) === key(context)) accept(value);
    } catch {
      if (!disposed) panel.failed();
    } finally {
      configuring = false;
      if (!disposed) panel.busy(false);
    }
  }
  /** Upload local bytes only, using current numeric page options; downloads remain separate editable copies. */
  async function pptx(file, grid) {
    const session = await get("ui-session"),
      options = { ...grid };
    delete options.type;
    const query = new URLSearchParams({
      grid_type: grid.type,
      grid_options: JSON.stringify(options),
      diagnostic: "true",
    });
    const response = await document.defaultView.fetch(
      "/api/v1/layout-grids/pptx?" + query,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "X-Ag-Design-UI": session.token,
        },
        body: file,
        redirect: "error",
        signal: lifetime.signal,
      },
    );
    if (!response.ok) throw new Error("PPTX diagnostic failed");
    const result = await response.json();
    if (disposed) return;
    const binary = document.defaultView.atob(result.diagnosticPptxBase64),
      bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    delete result.diagnosticPptxBase64;
    downloadGridFile(
      document,
      new document.defaultView.Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      }),
      "ag-layout-grid-review.pptx",
    );
    downloadGridFile(
      document,
      new document.defaultView.Blob([JSON.stringify(result, null, 2)], {
        type: "application/json",
      }),
      "ag-layout-grid-pptx.json",
    );
  }
  const panel = createLayoutGridPanel({
    document,
    onChange: change,
    onPptx: pptx,
  });
  return {
    element: panel.element,
    get configuration() {
      return configuration;
    },
    /** Poll settings only as part of the editor's existing addressed poll; reads never renew captures. */
    async sync() {
      const context = getContext();
      if (disposed || !context || syncing || configuring) return;
      if (contextKey !== key(context)) {
        contextKey = key(context);
        panel.show({ status: "stale" });
        send({ type: "composition:layout-grids-clear" });
      }
      syncing = true;
      try {
        let value = await get(
          "layout-grids/configuration?documentId=" +
            encodeURIComponent(context.documentId),
        );
        if (disposed || key(getContext()) !== key(context)) return;
        if (value.status === "unknown" || value.revision !== context.revision) {
          value = await post("layout-grids/configure", {
            documentId: context.documentId,
            expectedRevision: context.revision,
            settings: value.settings || DEFAULTS,
            expectedConfigurationId: value.configurationId ?? null,
          });
        }
        if (disposed || key(getContext()) !== key(context)) return;
        if (value.status === "expired") {
          configuration = value;
          panel.show({ status: "stale" });
          send({ type: "composition:layout-grids-clear" });
          return;
        }
        if (configuration?.configurationId !== value.configurationId)
          accept(value);
        else {
          sequence = Math.max(sequence, value.lastSequence || 0);
          // A previous view's late request may overtake startup readback. Recover once,
          // after a fresh read, rather than keeping evidence alive through idle retries.
          if (recoveryPending && !recoveryUsed) {
            recoveryPending = false;
            recoveryUsed = true;
            send({ type: "composition:layout-grids", configuration: value });
          }
        }
      } catch {
        if (!disposed) panel.failed();
      } finally {
        syncing = false;
      }
    },
    /** Publish only trusted-frame numeric messages for this exact current configuration and scenario. */
    async publish(packet) {
      const context = getContext();
      if (
        disposed ||
        configuring ||
        !context ||
        packet.configurationId !== configuration?.configurationId ||
        packet.capture.documentHash !== context.documentHash ||
        packet.capture.scenarioId !== context.scenarioId
      )
        return;
      const expected = configuration.configurationId,
        capture = { ...packet.capture, sequence: ++sequence };
      try {
        const result = await post("layout-grids/publish", {
          documentId: context.documentId,
          expectedRevision: context.revision,
          configurationId: expected,
          capture,
        });
        if (
          disposed ||
          configuration?.configurationId !== expected ||
          key(getContext()) !== key(context) ||
          result.sequence !== sequence
        )
          return;
        panel.show(result);
        send({ type: "composition:layout-grid-report", result });
      } catch {
        if (
          !disposed &&
          configuration?.configurationId === expected &&
          key(getContext()) === key(context) &&
          capture.sequence === sequence
        ) {
          recoveryPending = !recoveryUsed;
          panel.failed();
          send({ type: "composition:layout-grids-clear" });
        }
      }
    },
    /** Order stale activity and captures on one channel, so late responses cannot resurrect earlier hits. */
    async stale(packet) {
      const context = getContext();
      if (
        disposed ||
        !context ||
        packet.configurationId !== configuration?.configurationId
      )
        return;
      if (configuration.status === "expired") {
        await change(configuration.settings);
        return;
      }
      const expected = configuration.configurationId,
        eventSequence = ++sequence;
      panel.show({ status: "stale" });
      try {
        await post("layout-grids/invalidate", {
          documentId: context.documentId,
          expectedRevision: context.revision,
          configurationId: expected,
          scenarioId: context.scenarioId,
          sequence: eventSequence,
        });
      } catch {
        /* The next capture/configuration read reports failure; no stale hits remain painted. */
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      lifetime.abort();
      configuration = null;
      panel.dispose();
    },
  };
}

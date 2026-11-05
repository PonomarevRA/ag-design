import { createBoardViewport, createButton } from "./vendor/ag-design/index.js";
import { createCompositionPreview } from "./composition-preview.js";
import { currentPreviewTheme } from "./previews.js";
import { h } from "./dom.js";
import { followTransition, journeyState, studioId } from "./studio-model.js";
const NS = "http://www.w3.org/2000/svg";

/** Graph selection and path playback share a current screen, with a real AG-rendered, revision-pinned preview. */
export function createStudioJourney({
  definitions,
  profiles,
  palette,
  onSelect,
  onActivity,
}) {
  const scene = h("div", { className: "studio-journey-scene" });
  const graph = h(
    "div",
    {
      className: "studio-journey-graph",
      "aria-label": "Граф экранов и переходов",
    },
    scene,
  );
  const graphCamera = createBoardViewport({ viewport: graph, scene });
  const name = h("h3"),
    stateLabel = h("p", { className: "muted" });
  const trace = h("p", {
    className: "studio-trace",
    role: "status",
    "aria-live": "polite",
  });
  const actions = h("div", {
    className: "studio-path-actions",
    "aria-label": "Доступные переходы",
  });
  const channel = studioId("preview");
  const frame = h("iframe", {
    title: "Экран клиентского пути",
    src: `/studio-screen.html#channel=${channel}`,
    className: "composition-frame",
  });
  const stage = h("div", { className: "studio-screen-stage" }, frame);
  const previewHost = h("div", { className: "studio-screen-preview" }, stage);
  const preview = createCompositionPreview({
    viewport: previewHost,
    stage,
    frame,
  });
  const back = createButton({
    label: "Назад по пути",
    variant: "quiet",
    onClick: goBack,
  });
  const reset = createButton({
    label: "В начало",
    variant: "quiet",
    onClick: resetPath,
  });
  const root = h(
    "section",
    { className: "studio-journey" },
    graph,
    h(
      "section",
      {
        className: "studio-screen-panel",
        "aria-label": "Проигрывание клиентского пути",
      },
      name,
      stateLabel,
      h("div", { className: "studio-toolbar" }, back, reset),
      trace,
      previewHost,
      actions,
    ),
  );
  const abort = new AbortController();
  let envelope = null,
    current = null,
    history = [],
    ready = false,
    generation = 0,
    disposed = false,
    lastRevision = null,
    active = true,
    testing = null;

  /** Clear traversal on a new authored revision rather than mixing an old path with changed edges. */
  function update(value) {
    if (disposed) return;
    if (value.documentId !== envelope?.documentId) current = null;
    if (
      value.documentId !== envelope?.documentId ||
      value.revision !== lastRevision
    )
      history = [];
    envelope = value;
    lastRevision = value.revision;
    current = journeyState(value.document, current);
    render();
  }

  /** Transfer only the chosen immutable screen; reusing one iframe avoids one live application per graph node. */
  function renderScreen() {
    const screen = envelope.document.screens.find(
      (item) => item.id === current,
    );
    name.textContent = screen?.title || "Добавьте экран из композиции";
    stateLabel.textContent = screen
      ? `${screen.state} · композиция ${screen.source.documentId} · ревизия ${screen.source.revision}`
      : "Соберите экран в песочнице и нажмите «В клиентский путь».";
    previewHost.hidden = !screen;
    back.disabled = history.length === 0;
    reset.disabled = !screen;
    trace.textContent = history.length
      ? `Пройдено переходов: ${history.length}. Последнее действие: ${envelope.document.transitions.find((edge) => edge.id === history.at(-1).transitionId)?.action || "—"}`
      : "Выберите экран на графе или начните с первого. Условия выбираются явно, данные не отправляются.";
    if (!screen || !ready || !active) return;
    if (envelope.screenStatus?.[screen.id] === "stale-artifacts") {
      previewHost.hidden = true;
      trace.textContent =
        "Артефакты компонентов изменились. Снимок сохранён; подготовьте и привяжите актуальную композицию для воспроизведения.";
      return;
    }
    const snapshot = envelope.screenSnapshots[screen.id];
    preview.setViewport(snapshot.document.viewport);
    const profile = profiles.find((item) => item.id === palette) || profiles[0];
    frame.contentWindow.postMessage(
      {
        type: "studio:screen",
        channel,
        generation: ++generation,
        document: snapshot.document,
        definitions,
        palette,
        profile,
        theme: currentPreviewTheme(),
      },
      location.origin,
    );
  }

  /** Outgoing choices preserve all branches and display their declarative condition alongside the action. */
  function renderActions() {
    actions.replaceChildren();
    const outgoing = envelope.document.transitions.filter(
      (edge) => edge.from === current,
    );
    for (const edge of outgoing) {
      const target = envelope.document.screens.find(
        (screen) => screen.id === edge.to,
      );
      const button = createButton({
        label: `${edge.action} → ${target.title}`,
        variant: "secondary",
        onClick: () => follow(edge.id),
      });
      button.dataset.transitionId = edge.id;
      actions.append(
        h(
          "div",
          { className: "studio-path-choice" },
          button,
          h(
            "span",
            { className: "muted" },
            edge.condition ? `Если: ${edge.condition}` : "Без условия",
          ),
        ),
      );
    }
    if (current && !outgoing.length)
      actions.append(
        h(
          "p",
          {},
          "Конец этой ветки. Можно вернуться или выбрать другой экран.",
        ),
      );
  }

  /** Render focusable HTML nodes and literal SVG edges; graph coordinates do not claim to measure actual UI geometry. */
  function renderGraph() {
    scene.replaceChildren();
    const screens = envelope.document.screens;
    const byId = new Map(screens.map((screen) => [screen.id, screen]));
    const width = Math.max(800, ...screens.map((screen) => screen.x + 300));
    const height = Math.max(400, ...screens.map((screen) => screen.y + 180));
    scene.style.width = `${width}px`;
    scene.style.height = `${height}px`;
    const lines = document.createElementNS(NS, "svg");
    lines.setAttribute("width", width);
    lines.setAttribute("height", height);
    lines.setAttribute("aria-hidden", "true");
    lines.classList.add("studio-journey-edges");
    for (const edge of envelope.document.transitions) {
      const from = byId.get(edge.from),
        to = byId.get(edge.to);
      const path = document.createElementNS(NS, "path");
      const x = from.x + 240,
        y = from.y + 52,
        tx = to.x,
        ty = to.y + 52;
      path.setAttribute(
        "d",
        `M ${x} ${y} C ${x + 64} ${y}, ${tx - 64} ${ty}, ${tx} ${ty}`,
      );
      path.dataset.active = String(
        history.some((step) => step.transitionId === edge.id),
      );
      lines.append(path);
      const label = document.createElementNS(NS, "text");
      label.setAttribute("x", (x + tx) / 2);
      label.setAttribute("y", (y + ty) / 2 - 10);
      label.textContent = edge.action.slice(0, 40);
      lines.append(label);
    }
    scene.append(lines);
    for (const screen of screens) {
      const node = createButton({
        label: screen.title,
        variant: "secondary",
        onClick: () => selectScreen(screen.id),
      });
      node.disabled = !!testing;
      node.classList.add("studio-screen-node");
      node.style.left = `${screen.x}px`;
      node.style.top = `${screen.y}px`;
      node.dataset.screenId = screen.id;
      node.setAttribute(
        "aria-current",
        screen.id === current ? "step" : "false",
      );
      node.append(
        h("small", {}, screen.state),
        h(
          "small",
          {},
          screen.id === envelope.document.startScreenId
            ? "Начало пути"
            : `Ревизия ${screen.source.revision}`,
        ),
      );
      scene.append(node);
    }
  }
  function render() {
    renderGraph();
    renderScreen();
    renderActions();
  }

  /** Inspecting a node starts a new branch; explicit follow/back preserve the traversal history. */
  function selectScreen(id) {
    if (testing) return;
    current = id;
    history = [];
    onSelect?.(id);
    render();
  }
  /** Follow one declared outgoing edge; a recorded trial may reject events after its bounded log is full. */
  function follow(id) {
    if (testing?.onEvent({ kind: "edge", transitionId: id }) === false) return;
    const next = followTransition(envelope.document, current, id, history);
    current = next.current;
    history = next.history;
    onSelect?.(current);
    render();
  }
  /** Replay a real history step and record its return without fabricating a new graph edge. */
  function goBack() {
    if (
      history.length &&
      testing?.onEvent({ kind: "back", transitionId: null }) === false
    )
      return;
    const step = history.pop();
    if (step) {
      current = step.from;
      onSelect?.(current);
      render();
    }
  }
  /** Return to the trial entry (or graph start); reset clears traversal criteria on server replay. */
  function resetPath() {
    if (testing?.onEvent({ kind: "reset", transitionId: null }) === false)
      return;
    current = testing?.entryScreenId || envelope.document.startScreenId;
    history = [];
    onSelect?.(current);
    render();
  }

  /** Screen clicks only focus matching choices; conditions always require an explicit branch choice. */
  window.addEventListener(
    "message",
    (event) => {
      if (
        disposed ||
        event.source !== frame.contentWindow ||
        event.origin !== location.origin ||
        event.data?.channel !== channel
      )
        return;
      if (event.data.type === "studio:ready") {
        ready = true;
        if (envelope) renderScreen();
      }
      if (
        event.data.type === "studio:activity" &&
        event.data.generation === generation &&
        active &&
        envelope
      ) {
        onActivity?.();
        return;
      }
      if (
        event.data.type !== "studio:trigger" ||
        event.data.generation !== generation ||
        !envelope
      )
        return;
      const matches = envelope.document.transitions.filter(
        (edge) =>
          edge.from === current && edge.triggerNodeId === event.data.nodeId,
      );
      if (matches.length === 1 && !matches[0].condition) follow(matches[0].id);
      else if (matches.length) {
        const button = [...actions.querySelectorAll("button")].find(
          (button) => button.dataset.transitionId === matches[0].id,
        );
        button?.focus();
        trace.textContent = "Выберите подходящее условие перехода ниже экрана.";
      }
    },
    { signal: abort.signal },
  );
  return {
    element: root,
    update,
    updateAppearance(value) {
      palette = value.palette;
      profiles = value.profiles;
      if (!active || !ready) return;
      frame.contentWindow.postMessage(
        {
          type: "studio:appearance",
          channel,
          profile: profiles.find((item) => item.id === palette) || profiles[0],
          theme: currentPreviewTheme(),
        },
        location.origin,
      );
    },
    get currentScreenId() {
      return current;
    },
    /** Lock free graph selection to the pinned task entry; onEvent false prevents unrecorded navigation. */
    startTesting(entryScreenId, onEvent) {
      if (
        !envelope?.document.screens.some(
          (screen) => screen.id === entryScreenId,
        )
      )
        throw new Error("Начальный экран задания отсутствует");
      testing = { entryScreenId, onEvent };
      current = entryScreenId;
      history = [];
      render();
    },
    /** Release the trial navigation lock after an acknowledged result or disposal. */
    stopTesting() {
      testing = null;
      if (envelope) render();
    },
    setActive(value) {
      if (active === value || disposed) return;
      active = value;
      ready = false;
      generation++;
      frame.src = active
        ? `/studio-screen.html#channel=${channel}`
        : "about:blank";
      if (active) preview.refresh();
    },
    select(id) {
      if (testing) return;
      if (
        id !== current &&
        envelope?.document.screens.some((screen) => screen.id === id)
      ) {
        current = id;
        history = [];
        render();
      }
    },
    fit: () => graphCamera.fit(),
    dispose() {
      disposed = true;
      abort.abort();
      preview.dispose();
      graphCamera.dispose();
      frame.src = "about:blank";
      root.replaceChildren();
    },
  };
}

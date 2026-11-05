import { axisPointLabel } from "./chart-axis.js";
import { ambientOptions, ambientScene } from "./ambient-chart-model.js";
import { ambientClock } from "./ambient-chart-clock.js";
import { createButton } from "./primitives.js";
import {
  node,
  dataTable,
  ambientView,
  bindAmbientTypography,
} from "./ambient-chart-view.js";
let sequence = 0;
/** Cinematic offline chart composition. Decorative mode is labelled; data mode retains a linear scale, gaps and exact values. */
export function createAmbientChart({
  document = globalThis.document,
  ...options
} = {}) {
  let state = ambientOptions(options),
    clock,
    disposed = false,
    selected = 0,
    userPaused = !state.animated,
    parts,
    listenerCleanup = () => {};
  const id = "ag-ambient-" + ++sequence,
    element = node(document, "section", {
      class: "ag-ambient-chart",
      "aria-label": state.title,
    });
  /** Update only mark/readout state. Selection never moves data or restarts background motion. */
  function select(index, notify = true) {
    if (
      disposed ||
      state.mode !== "data" ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= state.values.length
    )
      return false;
    selected = index;
    for (const mark of parts.plot.marks.querySelectorAll("[data-index]"))
      mark.classList.toggle(
        "is-selected",
        Number(mark.dataset.index) === index,
      );
    parts.readout.textContent =
      axisPointLabel(state.labels, index, state.axisDates) +
      ": " +
      (state.values[index] === null
        ? "Нет данных"
        : String(state.values[index]) + (state.unit ? " " + state.unit : ""));
    parts.previous.disabled = index === 0;
    parts.next.disabled = index === state.values.length - 1;
    if (notify)
      state.onSelect?.({
        index,
        label: state.labels[index],
        value: state.values[index],
      });
    return true;
  }
  /** Animated cosmetics use one owner clock. Real-data motion stops once its reveal completes. */
  function paint(time, still) {
    const progress = still ? 1 : Math.min(1, time / 1.15);
    parts.plot.reveal.setAttribute("width", String(875 * progress));
    // Only explicitly decorative marks may breathe; real observations never change coordinates.
    for (const [index, mark] of parts.bars.entries()) {
      const scale = still ? 1 : 0.8 + Math.sin(time * 1.05 + index * 0.7) * 0.2;
      mark.setAttribute(
        "transform",
        `translate(0 ${parts.zero}) scale(1 ${scale}) translate(0 ${-parts.zero})`,
      );
    }
    if (state.mode === "decorative" && state.kind !== "bars")
      parts.plot.marks.setAttribute(
        "transform",
        `translate(0 ${still ? 0 : Math.sin(time * 0.85) * 5})`,
      );
    parts.stage.style.setProperty(
      "--ag-ambient-glint",
      still ? "50%" : `${((time * 9) % 130) - 15}%`,
    );
    if (parts.code) {
      // Real context is readable from the first frame. Only the legacy decorative code types itself.
      const content = state.panelText || state.code;
      const length =
        still || state.panelText || state.mode === "data"
          ? content.length
          : Math.min(content.length, Math.floor((time % 12) * 36));
      parts.code.textContent = content.slice(0, length);
    }
    parts.stage.style.setProperty(
      "--ag-ambient-strength",
      still ? ".62" : String(0.62 + Math.sin(time * 0.8) * 0.12),
    );
  }
  /** Validate first, then replace owned listeners/clock. Invalid updates preserve the previous live composition. */
  function update(next = {}) {
    if (disposed) return false;
    if (
      next.mode === "data" &&
      state.mode !== "data" &&
      (next.labels === undefined || next.values === undefined)
    )
      throw new TypeError(
        "Switching to real data requires explicit labels and values",
      );
    const candidate = ambientOptions({ ...state, ...next });
    const scene = ambientScene(candidate);
    clock?.dispose();
    listenerCleanup();
    state = candidate;
    if (next.animated !== undefined) userPaused = !next.animated;
    selected = Math.min(selected, state.values.length - 1);
    element.dataset.mode = state.mode;
    element.dataset.kind = state.kind;
    element.setAttribute("aria-label", state.title);
    const { heading, stage, caption, code, plot } = ambientView(
      document,
      state,
      scene,
      id,
    );
    const disposers = [];
    // Keep exact listener references: disposed or replaced controls must become inert.
    const action = (settings, onClick) => {
      const button = createButton({ document, ...settings });
      button.addEventListener("click", onClick);
      disposers.push(() => button.removeEventListener("click", onClick));
      return button;
    };
    const controls = node(document, "div", {
      class: "ag-ambient-chart__controls",
    });
    const pause = action({ label: "Пауза анимации", variant: "quiet" }, () => {
      const requested = pause.getAttribute("aria-pressed") !== "true";
      pause.setAttribute("aria-pressed", String(requested));
      userPaused = requested;
      if (requested) clock.pause();
      else clock.play();
    });
    pause.setAttribute("aria-pressed", String(userPaused));
    const replay = action(
      { label: "Повторить анимацию", icon: "refresh", variant: "quiet" },
      () => {
        pause.setAttribute("aria-pressed", "false");
        userPaused = false;
        clock.replay();
      },
    );
    controls.append(pause, replay);
    parts = {
      stage,
      code,
      plot,
      zero: scene.zero,
      bars:
        state.mode === "decorative" && state.kind === "bars"
          ? [...plot.marks.querySelectorAll("rect[data-index]")]
          : [],
    };
    element.replaceChildren(heading, stage, caption, controls);
    if (state.mode === "data") {
      const readout = node(document, "output", {
        class: "ag-ambient-chart__readout",
        "aria-live": "polite",
      });
      const previous = action(
          {
            label: "Предыдущая точка",
            icon: "back",
            iconOnly: true,
            variant: "quiet",
          },
          () => select(selected - 1),
        ),
        next = action(
          {
            label: "Следующая точка",
            icon: "forward",
            iconOnly: true,
            variant: "quiet",
          },
          () => select(selected + 1),
        );
      controls.prepend(previous, readout, next);
      Object.assign(parts, { previous, next, readout });
      stage.tabIndex = 0;
      stage.setAttribute("role", "group");
      stage.setAttribute("aria-label", "График: стрелки выбирают точку");
      const key = (event) => {
        // A focused context panel owns its scroll keys; chart navigation belongs to the stage itself.
        if (event.target !== stage) return;
        const keys = {
          ArrowLeft: selected - 1,
          ArrowRight: selected + 1,
          Home: 0,
          End: state.values.length - 1,
        };
        if (Object.hasOwn(keys, event.key)) {
          event.preventDefault();
          select(
            Math.max(0, Math.min(state.values.length - 1, keys[event.key])),
          );
        }
      };
      const click = (event) => {
        const mark = event.target.closest?.("[data-index]");
        if (mark) select(Number(mark.dataset.index));
      };
      stage.addEventListener("keydown", key);
      plot.svg.addEventListener("click", click);
      disposers.push(
        () => stage.removeEventListener("keydown", key),
        () => plot.svg.removeEventListener("click", click),
      );
      element.append(dataTable(document, state));
      select(selected, false);
    }
    if (state.mode === "data")
      disposers.push(
        bindAmbientTypography(plot.svg, state.labels, state.axisDates),
      );
    listenerCleanup = () => disposers.forEach((dispose) => dispose());
    clock = ambientClock({
      element,
      continuous: state.mode === "decorative",
      animated: !userPaused,
      paint,
    });
    return true;
  }
  update();
  return {
    element,
    get state() {
      return clock?.state ?? "disposed";
    },
    get options() {
      return { ...state, labels: [...state.labels], values: [...state.values] };
    },
    update,
    select,
    play() {
      if (disposed) return;
      element
        .querySelector("[aria-pressed]")
        ?.setAttribute("aria-pressed", "false");
      userPaused = false;
      clock.play();
    },
    pause() {
      if (disposed) return;
      element
        .querySelector("[aria-pressed]")
        ?.setAttribute("aria-pressed", "true");
      userPaused = true;
      clock.pause();
    },
    replay() {
      if (!disposed) {
        userPaused = false;
        element
          .querySelector("[aria-pressed]")
          ?.setAttribute("aria-pressed", "false");
        clock.replay();
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      listenerCleanup();
      clock.dispose();
    },
  };
}

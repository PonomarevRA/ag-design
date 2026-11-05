import { asciiTextScene } from "./ascii-text-scene.js";
import { asciiTextRaster } from "./ascii-text.js";
import {
  asciiOptions,
  asciiGrid,
  proceduralRows,
  animateAsciiRows,
  appendAsciiText,
} from "./ascii-patterns.js";
import { createAsciiSampler, loadAsciiFile } from "./ascii-media.js";

/** Create an offline decorative backdrop. Host text/controls stay outside this aria-hidden, pointer-transparent layer. */
export function createAsciiBackground({
  document = globalThis.document,
  autoplay = true,
  onState,
  ...initial
} = {}) {
  if (
    !document?.createElement ||
    typeof autoplay !== "boolean" ||
    (onState !== undefined && typeof onState !== "function")
  )
    throw new TypeError(
      "A document, boolean autoplay and optional state callback are required",
    );
  let options = asciiOptions(undefined, initial);
  const view = document.defaultView,
    element = document.createElement("div"),
    drawing = document.createElement("pre"),
    ticker = document.createElement("div"),
    track = document.createElement("div");
  element.className = "ag-ascii-background";
  element.setAttribute("aria-hidden", "true");
  drawing.className = "ag-ascii-background__drawing";
  ticker.className = "ag-ascii-background__ticker";
  track.className = "ag-ascii-background__track";
  const first = document.createElement("span"),
    repeat = document.createElement("span");
  track.append(first, repeat);
  ticker.append(track);
  element.append(drawing, ticker);
  ticker.hidden = true;
  const preference = view.matchMedia?.("(prefers-reduced-motion: reduce)"),
    sampler = createAsciiSampler(document),
    listeners = [];
  let requested = autoplay,
    disposed = false,
    visible = !view.IntersectionObserver,
    frame = 0,
    lastTick = null,
    elapsed = 0,
    paintedAt = -Infinity,
    mode = "pattern",
    source = null,
    asset = null,
    pending = null,
    generation = 0,
    error = false,
    text = "",
    raster = asciiTextRaster(""),
    textViewport = 640,
    textHeight = 320,
    measureText = true;
  let grid = asciiGrid(640, 320, options),
    state = "paused";
  /** State callbacks expose actual rendering state, while requested playback remains a separate user intent. */
  function publish(next) {
    if (state === next && element.dataset.state) return;
    state = next;
    element.dataset.state = next;
    onState?.(next);
  }
  function bind(target, name, callback) {
    target.addEventListener(name, callback);
    listeners.push(() => target.removeEventListener(name, callback));
  }
  /** No frame is retained for pause, hidden/offscreen content, reduced motion, or a detached element. */
  function stop() {
    if (frame) view.cancelAnimationFrame(frame);
    frame = 0;
    lastTick = null;
    asset?.source.pause?.();
  }
  function blockReason() {
    if (disposed) return "disposed";
    if (error) return "error";
    if (preference?.matches) return "reduced-motion";
    if (!requested) return "paused";
    if (document.hidden) return "hidden";
    if (!visible) return "offscreen";
    if (!element.isConnected) return "detached";
    return null;
  }
  function needsMotion() {
    if (mode === "pattern") return true;
    if (mode === "text") return true;
    if (options.animation !== "none") return true;
    return source?.tagName === "VIDEO" && !source.paused && !source.ended;
  }
  /** Leave identical text nodes intact: slow noise/static media do not need a new DOM tree each tick. */
  function writeRows(target, rows) {
    const value = rows.join("\n");
    if (target.textContent !== value) target.textContent = value;
  }
  /** Render ASCII rows or a bounded bitmap text viewport; styling reads semantic CSS tokens without polling. */
  function paint() {
    if (disposed) return;
    element.dataset.mode = mode;
    drawing.hidden = false;
    ticker.hidden = mode !== "text";
    if (mode === "text") {
      if (measureText) {
        raster = asciiTextRaster(text);
        measureText = false;
      }
      const time = preference?.matches ? 0 : elapsed;
      const scene = asciiTextScene(
        raster,
        options,
        textViewport,
        textHeight,
        time,
      );
      writeRows(first, scene.foreground);
      writeRows(drawing, scene.background);
      drawing.style.fontSize = ticker.style.fontSize = scene.grid.font + "px";
      repeat.hidden = true;
      element.dataset.cells = String(scene.grid.columns * scene.grid.rows);
      element.dataset.textScale = String(scene.scale);
      element.dataset.unsupportedGlyphs = String(raster.unsupported);
      element.dataset.textEffect = options.textEffect;
      const shift = -(scene.fraction * scene.grid.font * 0.6);
      const lift =
        options.textEffect === "none"
          ? 0
          : Math.sin(time * 0.9) * scene.grid.font * 0.25;
      drawing.style.transform = `translate(${shift}px,0px)`;
      track.style.transform = `translate(${shift}px,${lift}px)`;
      // Ink density and a slow semantic-color highlight shimmer independently of stream length.
      track.style.backgroundPosition = `${time * 28}px 50%`;
      track.style.filter =
        options.textEffect === "none"
          ? "none"
          : `brightness(${1 + Math.sin(time * 1.2) * 0.08})`;
      return;
    }
    drawing.style.transform = "";
    drawing.style.fontSize = grid.font + "px";
    let rows;
    try {
      rows =
        mode === "media"
          ? sampler.sample(source, options, grid)
          : proceduralRows(options, grid, preference?.matches ? 0 : elapsed);
      if (mode === "media" && !preference?.matches)
        rows = animateAsciiRows(
          rows,
          options.animation,
          elapsed * options.speed,
        );
    } catch {
      // Tainted/unsupported media is a visible state for the host, not a retry loop or a network fallback.
      error = true;
      rows = [];
    }
    writeRows(drawing, rows);
    element.dataset.cells = String(grid.columns * grid.rows);
  }
  /** Advance one bounded clock and throttle expensive conversion/DOM writes to the configured frame rate. */
  function tick(now) {
    frame = 0;
    const reason = blockReason();
    if (reason) {
      stop();
      publish(reason);
      return;
    }
    if (lastTick !== null)
      elapsed += Math.min(250, Math.max(0, now - lastTick)) / 1000;
    lastTick = now;
    if (now - paintedAt >= 1000 / options.fps) {
      paintedAt = now;
      paint();
    }
    if (error) {
      stop();
      publish("error");
      return;
    }
    if (needsMotion()) {
      publish("playing");
      frame = view.requestAnimationFrame(tick);
    } else {
      lastTick = null;
      publish("still");
    }
  }
  /** Reconcile user intent with actual visibility; only component-owned local videos have their playback changed. */
  function reconcile() {
    stop();
    paint();
    const reason = blockReason();
    if (reason) {
      publish(reason);
      return;
    }
    if (asset?.source.tagName === "VIDEO") {
      const playGeneration = generation;
      void asset.source.play().catch((playError) => {
        if (playError?.name === "AbortError" || blockReason()) return;
        if (!disposed && generation === playGeneration) {
          requested = false;
          stop();
          publish("playback-blocked");
        }
      });
    }
    if (needsMotion()) {
      publish("playing");
      frame = view.requestAnimationFrame(tick);
    } else publish("still");
  }
  function resize() {
    if (disposed) return;
    // ResizeObserver/window resize owns geometry. Reading height after each instance writes text
    // would force layout repeatedly when several backgrounds share the same animation frame.
    textViewport = element.clientWidth || 640;
    textHeight = element.clientHeight || 320;
    grid = asciiGrid(textViewport, textHeight, options);
    measureText = true;
    sampler.invalidate();
    reconcile();
  }
  function cancelLoad() {
    generation++;
    pending?.abort();
    pending = null;
  }
  const sourceListeners = [];
  /** Detach only our listeners and owned decoder; supplied media and host playback remain untouched. */
  function releaseSource() {
    for (const remove of sourceListeners) remove();
    sourceListeners.length = 0;
    asset?.dispose();
    asset = null;
    source = null;
    sampler.invalidate();
  }
  function attachMedia(next, owned = null) {
    if (!["IMG", "VIDEO", "CANVAS"].includes(next?.tagName))
      throw new TypeError("Use a ready image, video or canvas element");
    releaseSource();
    source = next;
    asset = owned;
    mode = "media";
    elapsed = 0;
    error = false;
    if (owned && next.tagName === "VIDEO") {
      next.className = "ag-ascii-background__decoder";
      next.tabIndex = -1;
      element.append(next);
    }
    for (const event of [
      "play",
      "pause",
      "seeked",
      "loadeddata",
      "load",
      "ended",
    ]) {
      const changed = () => {
        sampler.invalidate();
        reconcile();
      };
      // Owned pause/play events are consequences of reconcile; listening to them would recurse.
      if (owned && (event === "play" || event === "pause")) continue;
      next.addEventListener(event, changed);
      sourceListeners.push(() => next.removeEventListener(event, changed));
    }
    reconcile();
  }
  const resizeObserver = view.ResizeObserver
    ? new view.ResizeObserver(resize)
    : null;
  resizeObserver?.observe(element);
  const intersection = view.IntersectionObserver
    ? new view.IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        reconcile();
      })
    : null;
  intersection?.observe(element);
  bind(document, "visibilitychange", reconcile);
  bind(view, "resize", resize);
  preference?.addEventListener?.("change", reconcile);
  paint();
  publish(preference?.matches ? "reduced-motion" : "paused");
  // One initial frame permits synchronous host mounting; there is no detached polling loop.
  if (requested && !preference?.matches)
    frame = view.requestAnimationFrame(() => {
      frame = 0;
      resize();
    });
  return {
    element,
    get state() {
      return state;
    },
    get playbackRequested() {
      return requested;
    },
    get text() {
      return text;
    },
    get options() {
      return { ...options };
    },
    play() {
      if (!disposed) {
        requested = true;
        reconcile();
      }
    },
    pause() {
      if (!disposed) {
        requested = false;
        reconcile();
      }
    },
    update(patch) {
      if (disposed) return;
      const next = asciiOptions(options, patch);
      if (next.animation !== options.animation) elapsed = 0;
      options = next;
      error = false;
      resize();
    },
    setPattern(pattern) {
      if (disposed) return;
      const next = asciiOptions(options, { pattern });
      cancelLoad();
      releaseSource();
      mode = "pattern";
      options = next;
      error = false;
      elapsed = 0;
      reconcile();
    },
    setSource(next) {
      if (disposed) return;
      cancelLoad();
      attachMedia(next);
    },
    /** Decode asynchronously with a generation fence so replacement/disposal cannot resurrect an old file. */
    async setFile(file) {
      if (disposed) return false;
      cancelLoad();
      const current = generation,
        controller = new view.AbortController();
      pending = controller;
      try {
        const loaded = await loadAsciiFile(document, file, controller.signal);
        if (disposed || generation !== current) {
          loaded.dispose();
          return false;
        }
        pending = null;
        attachMedia(loaded.source, loaded);
        return true;
      } finally {
        if (pending === controller) pending = null;
      }
    },
    setText(value) {
      if (disposed) return;
      const next = appendAsciiText("", value);
      cancelLoad();
      releaseSource();
      mode = "text";
      text = next;
      measureText = true;
      elapsed = 0;
      error = false;
      resize();
    },
    appendText(chunk) {
      if (disposed) return;
      const next = appendAsciiText(text, chunk);
      if (mode !== "text") {
        cancelLoad();
        releaseSource();
        mode = "text";
        elapsed = 0;
      }
      text = next;
      measureText = true;
      error = false;
      if (!frame) resize();
    },
    clearText() {
      if (!disposed) {
        text = "";
        measureText = true;
        reconcile();
      }
    },
    /** Release all frames, observers, event bindings, decoder URLs and bounded converter caches. */
    dispose() {
      if (disposed) return;
      cancelLoad();
      stop();
      disposed = true;
      releaseSource();
      sampler.dispose();
      resizeObserver?.disconnect();
      intersection?.disconnect();
      preference?.removeEventListener?.("change", reconcile);
      for (const remove of listeners) remove();
      text = "";
      raster = asciiTextRaster("");
      first.textContent = "";
      repeat.textContent = "";
      drawing.textContent = "";
      element.remove();
      publish("disposed");
    },
  };
}

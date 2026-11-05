import { createAsciiConverter } from "./asciify-converter.js";
import { asciiCharset } from "./ascii-patterns.js";

/** Resolve ready intrinsic dimensions; never trust CSS display size or attempt a source URL load. */
function sourceDimensions(source) {
  let width, height;
  if (source?.tagName === "VIDEO") {
    if (source.readyState < 2) return { width: 0, height: 0 };
    width = source.videoWidth;
    height = source.videoHeight;
  } else if (source?.tagName === "IMG") {
    width = source.naturalWidth;
    height = source.naturalHeight;
  } else if (source?.tagName === "CANVAS") {
    width = source.width;
    height = source.height;
  } else
    throw new TypeError(
      "Use a ready image, video or canvas element; URLs are not accepted",
    );
  if (width > 8192 || height > 8192)
    throw new RangeError("Media dimensions exceed8192px");
  return { width, height };
}

/** Letterbox in physical character proportions so a recognizable image does not stretch. */
function fitSource(context, source, width, height, grid) {
  const scale = Math.min((grid.columns * 0.48) / width, grid.rows / height);
  const drawWidth = (width * scale) / 0.48,
    drawHeight = height * scale;
  context.clearRect(0, 0, grid.columns, grid.rows);
  context.drawImage(
    source,
    0,
    0,
    width,
    height,
    (grid.columns - drawWidth) / 2,
    (grid.rows - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
}

/** Read only already-decoded image/video/canvas pixels. The caller owns supplied elements and their playback. */
export function createAsciiSampler(document) {
  let converter = null,
    scratch = null,
    context = null,
    cached = null,
    previous = null,
    lastKey = "",
    lastTime = -1;
  return {
    /** Sample one bounded letterboxed frame, reusing decoded image/video rows until their source or grid changes. */
    sample(source, options, grid) {
      const kind = source?.tagName;
      const { width, height } = sourceDimensions(source);
      if (!width || !height) return [];
      const key = [
        grid.columns,
        grid.rows,
        options.charset,
        width,
        height,
      ].join(":");
      // Canvases can change without an event. Images cache only decoded rows; videos compare currentTime.
      const reusable =
        kind === "IMG" || (kind === "VIDEO" && lastTime === source.currentTime);
      if (cached && source === previous && key === lastKey && reusable)
        return cached;
      if (!scratch) {
        scratch = document.createElement("canvas");
        context = scratch.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Canvas2D unavailable");
      }
      scratch.width = grid.columns;
      scratch.height = grid.rows;
      fitSource(context, source, width, height, grid);
      converter ??= createAsciiConverter(document);
      const result = converter.convert(
        scratch,
        {
          ...converter.options,
          fontSize: 1,
          charSpacing: 1,
          charAspect: 1,
          charset: asciiCharset(options.charset),
          colorMode: "accent",
          invert: false,
          normalize: false,
        },
        grid.columns,
        grid.rows,
      );
      cached = result.rows;
      previous = source;
      lastKey = key;
      lastTime = source.currentTime;
      return cached;
    },
    invalidate() {
      cached = null;
      previous = null;
    },
    /** Release this sampler’s scratch pixels and lookup tables without touching host media. */
    dispose() {
      converter?.dispose();
      if (scratch) {
        scratch.width = 1;
        scratch.height = 1;
      }
      converter = null;
      scratch = null;
      context = null;
      cached = null;
      previous = null;
    },
  };
}

/** Decode one bounded local File through an owned blob URL, releasing decoder/events/URL on failure, abort or disposal. */
export function loadAsciiFile(document, file, signal) {
  const image = ["image/png", "image/jpeg", "image/webp"].includes(file?.type);
  const video = ["video/mp4", "video/webm"].includes(file?.type);
  if (!image && !video)
    return Promise.reject(new TypeError("Use PNG, JPEG, WebP, MP4 or WebM"));
  if (
    !Number.isFinite(file.size) ||
    file.size <= 0 ||
    file.size > (image ? 32 : 128) * 1024 * 1024
  )
    return Promise.reject(
      new RangeError("Local media file is empty or too large"),
    );
  const view = document.defaultView,
    source = document.createElement(image ? "img" : "video"),
    url = view.URL.createObjectURL(file);
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (video) source.pause();
    source.removeAttribute("src");
    if (video) source.load();
    source.remove();
    view.URL.revokeObjectURL(url);
  };
  if (video) {
    source.muted = true;
    source.loop = true;
    source.playsInline = true;
    source.preload = "auto";
  }
  return new Promise((resolve, reject) => {
    const readyEvent = image ? "load" : "loadeddata";
    const cleanup = () => {
      view.clearTimeout(timer);
      source.removeEventListener(readyEvent, ready);
      source.removeEventListener("error", failed);
      signal?.removeEventListener("abort", aborted);
    };
    const finish = (error) => {
      cleanup();
      if (error) {
        dispose();
        reject(error);
      } else resolve({ source, dispose, owned: true });
    };
    const ready = () => {
      const width = image ? source.naturalWidth : source.videoWidth,
        height = image ? source.naturalHeight : source.videoHeight;
      finish(
        width > 8192 || height > 8192
          ? new RangeError("Media dimensions exceed 8192px")
          : null,
      );
    };
    const failed = () => finish(new Error("Local media could not be decoded"));
    const aborted = () =>
      finish(new view.DOMException("Local media load cancelled", "AbortError"));
    const timer = view.setTimeout(failed, 10000);
    source.addEventListener(readyEvent, ready);
    source.addEventListener("error", failed);
    signal?.addEventListener("abort", aborted, { once: true });
    if (signal?.aborted) {
      aborted();
      return;
    }
    source.src = url;
    if (video) source.load();
  });
}

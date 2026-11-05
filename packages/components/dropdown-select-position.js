const tokens = [
  "accent",
  "on-accent",
  "surface",
  "surface-alt",
  "text",
  "muted",
  "border",
  "danger",
  "font",
  "text-size",
  "label-size",
  "control-height",
  "radius-control",
  "radius-panel",
  "layer-popup",
];

/**
 * Fit a floating surface to one nonoverlapping side of its trigger in CSS pixels.
 * @param {object} trigger Measured viewport rectangle of the owning control.
 * @param {object} viewport Visible viewport dimensions and optional left/top offsets.
 * @param {number} desiredHeight Height measured at the final constrained width.
 * @param {object} options Minimum width, maximum height and physical right alignment; legacy defaults stay160/280/start.
 * @returns {object|null} Clamped side/position/width/height bound, or null when the owner is outside or space is insufficient.
 */
export function dropdownPlacement(
  trigger,
  viewport,
  desiredHeight,
  { minimumWidth = 160, maximumHeight = 280, alignRight = false } = {},
) {
  const margin = 8,
    gap = 5;
  const left = viewport.left ?? 0,
    top = viewport.top ?? 0;
  const right = left + viewport.width,
    bottom = top + viewport.height;
  if (
    trigger.bottom <= top ||
    trigger.top >= bottom ||
    trigger.right <= left ||
    trigger.left >= right
  )
    return null;
  const below = Math.max(0, bottom - margin - trigger.bottom - gap);
  const above = Math.max(0, trigger.top - gap - top - margin);
  const side =
    below >= Math.min(desiredHeight, 160) || below >= above ? "bottom" : "top";
  const maximum = Math.min(maximumHeight, side === "bottom" ? below : above);
  if (maximum < 24 || viewport.width <= 2 * margin) return null;
  const width = Math.min(
    Math.max(trigger.width, minimumWidth),
    viewport.width - 2 * margin,
  );
  const height = Math.min(desiredHeight, maximum);
  const x = Math.max(
    left + margin,
    Math.min(
      alignRight ? trigger.right - width : trigger.left,
      right - margin - width,
    ),
  );
  return {
    side,
    width,
    maximum,
    x,
    y: side === "bottom" ? trigger.bottom + gap : trigger.top - gap - height,
  };
}

/**
 * Own positioning/listeners only while open, using the native top layer or an owned dialog/layer/body portal.
 * @param {object} options Document, originating element/input, panel, unavailable callback and optional CSS-pixel bounds/logical alignment.
 * An explicit ownedLayer takes precedence over an inferred data-ag-layer-root; native dialog ownership stays first.
 * @returns {object} Idempotent start/stop and a coalesced schedule; stop restores the panel to its originating element.
 */
export function dropdownPositioner({
  document,
  element,
  input,
  panel,
  onUnavailable,
  minimumWidth = 160,
  maximumHeight = 280,
  align = "start",
  ownedLayer = null,
}) {
  const view = document.defaultView;
  const request =
    view.requestAnimationFrame?.bind(view) ||
    ((callback) => view.setTimeout(callback, 0));
  const cancel =
    view.cancelAnimationFrame?.bind(view) || view.clearTimeout.bind(view);
  let active = false,
    ported = false,
    topLayer = false,
    dialog = null,
    frame = 0;
  let resize, mutation;
  const media = [];

  /** Copy the originating local scope when a fallback portal crosses its theme or font ancestors. */
  function copyAppearance() {
    if (!ported || !view?.getComputedStyle) return;
    const style = view.getComputedStyle(element);
    for (const token of tokens) {
      const value = style.getPropertyValue("--ag-" + token);
      if (value) panel.style.setProperty("--ag-" + token, value);
      else panel.style.removeProperty("--ag-" + token);
    }
    panel.style.font = style.font;
    panel.style.direction =
      style.direction || element.closest("[dir]")?.getAttribute("dir") || "ltr";
  }

  /** Resolve logical alignment from the actual originating scope, including RTL. */
  function placementOptions() {
    const rtl = view.getComputedStyle(element).direction === "rtl";
    return {
      minimumWidth,
      maximumHeight,
      alignRight: align === "end" ? !rtl : rtl,
    };
  }

  /** Fix width before measuring wrapped content; one scheduled update must fit even without ResizeObserver. */
  function place() {
    frame = 0;
    if (!active) return;
    copyAppearance();
    const visual = view?.visualViewport;
    const viewport = {
      left: visual?.offsetLeft || 0,
      top: visual?.offsetTop || 0,
      width: visual?.width || view?.innerWidth || 1024,
      height: visual?.height || view?.innerHeight || 768,
    };
    const rect = input.getBoundingClientRect();
    const hidden = element.closest("[hidden], [inert], dialog:not([open])");
    const visibility = view.getComputedStyle(input).visibility;
    const ownerLayer = element.closest("[data-ag-layer-root]");
    const ownerBounds = ownerLayer?.getBoundingClientRect();
    const clippedByOwner =
      ownerBounds &&
      (rect.bottom <= ownerBounds.top ||
        rect.top >= ownerBounds.bottom ||
        rect.right <= ownerBounds.left ||
        rect.left >= ownerBounds.right);
    const outside =
      rect.bottom <= viewport.top ||
      rect.top >= viewport.top + viewport.height ||
      rect.right <= viewport.left ||
      rect.left >= viewport.left + viewport.width;
    if (
      !input.isConnected ||
      clippedByOwner ||
      input.matches(":disabled") ||
      hidden ||
      visibility === "hidden" ||
      visibility === "collapse" ||
      !input.getClientRects().length ||
      rect.width <= 0 ||
      rect.height <= 0 ||
      outside
    ) {
      onUnavailable();
      return;
    }
    const minimum = dropdownPlacement(rect, viewport, 24, placementOptions());
    if (!minimum) {
      onUnavailable();
      return;
    }
    // A narrower final width can make rows wrap. Measuring the old width would place an above-popup over its trigger.
    panel.style.width = minimum.width + "px";
    const measured = Math.max(
      panel.scrollHeight,
      panel.getBoundingClientRect().height,
    );
    const desired = Math.max(
      24,
      Math.min(measured || maximumHeight, maximumHeight),
    );
    const placement = dropdownPlacement(
      rect,
      viewport,
      desired,
      placementOptions(),
    );
    if (!placement) {
      onUnavailable();
      return;
    }
    let { x, y } = placement;
    if (dialog) {
      const bounds = dialog.getBoundingClientRect();
      x -= bounds.left + dialog.clientLeft - dialog.scrollLeft;
      y -= bounds.top + dialog.clientTop - dialog.scrollTop;
    }
    panel.dataset.side = placement.side;
    panel.style.left = x + "px";
    panel.style.top = y + "px";
    panel.style.width = placement.width + "px";
    panel.style.maxHeight = placement.maximum + "px";
  }

  /** Coalesce host scroll/theme/size changes; scrolling the popup itself never repositions its trigger. */
  function schedule(event) {
    if (event?.type === "scroll" && panel.contains(event.target)) return;
    if (active && !frame) frame = request(place);
  }

  /** Open in the owning DOM scope when possible; modal fallback stays inside its dialog to avoid inertness. */
  function start() {
    if (active) return;
    active = true;
    panel.style.position = "fixed";
    if (typeof panel.showPopover === "function" && panel.isConnected) {
      try {
        panel.setAttribute("popover", "manual");
        panel.showPopover();
        topLayer = true;
      } catch {
        panel.removeAttribute("popover");
      }
    }
    if (!topLayer) {
      dialog = element.closest("dialog");
      (
        dialog ||
        ownedLayer ||
        element.closest("[data-ag-layer-root]") ||
        document.body
      ).append(panel);
      panel.style.position = dialog ? "absolute" : "fixed";
      ported = true;
    }
    place();
    if (!active) return;
    view.addEventListener("resize", schedule);
    document.addEventListener("scroll", schedule, true);
    visualListen("addEventListener");
    if (view.ResizeObserver) {
      resize = new view.ResizeObserver(schedule);
      resize.observe(input);
      resize.observe(panel);
    }
    if (view.MutationObserver) {
      mutation = new view.MutationObserver(schedule);
      mutation.observe(input, {
        attributes: true,
        attributeFilter: ["style", "class", "hidden", "disabled", "inert"],
      });
      for (let parent = element; parent; parent = parent.parentElement)
        mutation.observe(parent, {
          childList: true,
          attributes: true,
          attributeFilter: [
            "style",
            "class",
            "dir",
            "hidden",
            "disabled",
            "inert",
            "open",
            "data-theme",
            "data-palette",
          ],
        });
    }
    if (view.matchMedia)
      for (const query of [
        "(prefers-color-scheme: dark)",
        "(prefers-contrast: more)",
      ]) {
        const match = view.matchMedia(query);
        match.addEventListener?.("change", schedule);
        media.push(match);
      }
  }

  /** Register the optional visual viewport without requiring its presence in older renderers. */
  function visualListen(method) {
    view.visualViewport?.[method]("resize", schedule);
    view.visualViewport?.[method]("scroll", schedule);
  }

  /** Remove every open-only subscription and restore DOM ownership before hiding or disposing. */
  function stop() {
    active = false;
    if (frame) cancel(frame);
    frame = 0;
    view.removeEventListener("resize", schedule);
    document.removeEventListener("scroll", schedule, true);
    visualListen("removeEventListener");
    resize?.disconnect();
    mutation?.disconnect();
    resize = mutation = undefined;
    for (const match of media) match.removeEventListener?.("change", schedule);
    media.length = 0;
    if (topLayer) {
      try {
        panel.hidePopover();
      } catch {
        /* The host may already have closed its dialog/top layer. */
      }
    }
    topLayer = false;
    if (ported) element.append(panel);
    ported = false;
    dialog = null;
  }
  return { start, stop, schedule };
}

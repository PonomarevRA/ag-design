import {
  normalizeCatalogCard,
  catalogCardState,
} from "./catalog-card-contract.js";
import { resolveI18n } from "./i18n.js";
import { applyControlGeometry } from "./geometry.js";
let serial = 0;

/** A presentation card with natural height. Host owns borrowed detached media, layout, facts and action effects. */
export function createCatalogCard({
  document = globalThis.document,
  i18n,
  media,
  headingLevel = 3,
  appearance = "framed",
  onError = () => {},
  ...data
} = {}) {
  if (
    !document?.createElement ||
    ![2, 3, 4, 5, 6].includes(headingLevel) ||
    !["framed", "plain"].includes(appearance) ||
    typeof onError !== "function"
  )
    throw new TypeError("Invalid catalog card options");
  if (
    media !== undefined &&
    (media?.nodeType !== 1 ||
      media.ownerDocument !== document ||
      media.isConnected ||
      media.parentNode)
  )
    throw new TypeError(
      "Catalog media must be an explicitly borrowed detached same-document element",
    );
  let current = normalizeCatalogCard(data, document),
    disposed = false,
    publicState = catalogCardState(current);
  const context = resolveI18n(document, i18n),
    prefix = `ag-catalog-card-${++serial}`;
  const node = (tag, className) => {
    const element = document.createElement(tag);
    element.className = className;
    return element;
  };
  const element = node(
      "article",
      `ag-catalog-card ag-catalog-card--${appearance}`,
    ),
    header = node("header", "ag-catalog-card__header"),
    eyebrow = node("p", "ag-catalog-card__eyebrow"),
    heading = node(`h${headingLevel}`, "ag-catalog-card__heading"),
    badges = node("div", "ag-catalog-card__badges"),
    body = node("div", "ag-catalog-card__body"),
    summary = node("p", "ag-catalog-card__summary"),
    price = node("p", "ag-catalog-card__price"),
    rating = node("p", "ag-catalog-card__rating"),
    facts = node("dl", "ag-catalog-card__facts"),
    note = node("p", "ag-catalog-card__note"),
    footer = node("footer", "ag-catalog-card__footer"),
    actions = node("div", "ag-catalog-card__actions");
  heading.id = prefix + "-heading";
  heading.tabIndex = -1;
  element.setAttribute("aria-labelledby", heading.id);
  header.append(eyebrow, heading, badges);
  body.append(summary, price, rating, facts, note, footer);
  footer.append(actions);
  element.append(header);
  if (media) element.append(media);
  element.append(body);
  let titleControl = null;
  const parts = Object.freeze({
    header,
    heading,
    eyebrow,
    badges,
    body,
    summary,
    price,
    rating,
    facts,
    note,
    footer,
    actions,
    media: media ?? null,
  });
  /** Diagnostic failures cannot prevent cleanup or convert a failed operation into success. */
  function report(error) {
    if (disposed) return;
    try {
      onError(error);
    } catch {
      /* Host diagnostics do not own card lifecycle. */
    }
  }
  function invoke(callback) {
    try {
      const returned = callback?.(catalogCardState(current));
      if (returned && typeof returned.then === "function")
        Promise.resolve(returned).catch(report);
    } catch (error) {
      report(error);
    }
  }
  function text(element, value) {
    element.hidden = !value;
    if (element.textContent !== value) element.textContent = value;
  }
  function paint() {
    if (disposed) return;
    const desired = current.href ? "a" : current.onOpen ? "button" : "span";
    const wasFocused = titleControl === document.activeElement;
    if (titleControl?.localName !== desired) {
      const control = document.createElement(desired);
      if (desired === "button") control.type = "button";
      control.className = "ag-catalog-card__title";
      heading.replaceChildren(control);
      titleControl = control;
    }
    titleControl.textContent = current.title;
    if (current.href) titleControl.setAttribute("href", current.href);
    text(eyebrow, current.eyebrow);
    text(summary, current.summary);
    text(price, current.priceText);
    text(note, current.note);
    badges.replaceChildren();
    for (const label of current.badges) {
      const badge = node("span", "ag-status");
      badge.textContent = label;
      badges.append(badge);
    }
    badges.hidden = current.badges.length === 0;
    facts.replaceChildren();
    for (const fact of current.facts) {
      const term = document.createElement("dt"),
        value = document.createElement("dd");
      term.textContent = fact.label;
      value.textContent = fact.value;
      facts.append(term, value);
    }
    facts.hidden = current.facts.length === 0;
    let ratingText = "";
    if (current.rating) {
      const { value, max, count } = current.rating;
      const format = new Intl.NumberFormat(context.locale, {
        maximumFractionDigits: 1,
      });
      ratingText =
        count === 0
          ? context.t("catalog.noReviews")
          : context.t("catalog.rating", {
              value: format.format(value),
              max: format.format(max),
              count: new Intl.NumberFormat(context.locale).format(count),
            });
    }
    text(rating, ratingText);
    const descriptors = [
      ...(current.primaryAction ? [current.primaryAction] : []),
      ...current.secondaryActions,
    ];
    const active = document.activeElement,
      oldIndex = actions.contains(active)
        ? Number(active.dataset.catalogAction)
        : null;
    actions.replaceChildren();
    for (let index = 0; index < descriptors.length; index++) {
      const descriptor = descriptors[index],
        control = document.createElement(descriptor.href ? "a" : "button");
      control.className = `ag-button ag-button--${descriptor.variant}`;
      control.textContent = descriptor.label;
      control.dataset.catalogAction = String(index);
      if (descriptor.href) control.href = descriptor.href;
      else {
        control.type = "button";
        control.disabled = descriptor.disabled;
      }
      applyControlGeometry(control, { density: "comfortable" });
      actions.append(control);
    }
    footer.hidden = descriptors.length === 0;
    publicState = catalogCardState(current);
    // Focus recovery is the last effect: host focus callbacks may re-enter update/dispose.
    if (wasFocused && document.activeElement !== titleControl)
      (titleControl.localName === "span" ? heading : titleControl).focus();
    else if (oldIndex !== null && document.activeElement !== active) {
      const replacement = actions.children[oldIndex];
      if (replacement && !replacement.disabled) replacement.focus();
      else heading.focus();
    }
  }
  function click(event) {
    if (disposed) return;
    const target = event.target.closest?.("button,a");
    if (!target) return;
    if (target === titleControl && current.onOpen) {
      invoke(current.onOpen);
      return;
    }
    if (!actions.contains(target)) return;
    const descriptors = [
        ...(current.primaryAction ? [current.primaryAction] : []),
        ...current.secondaryActions,
      ],
      descriptor = descriptors[Number(target.dataset.catalogAction)];
    if (descriptor && !descriptor.disabled && descriptor.onAction)
      invoke(descriptor.onAction);
  }
  element.addEventListener("click", click);
  const off = context.subscribe(paint);
  paint();
  return Object.freeze({
    element,
    parts,
    get state() {
      return JSON.parse(JSON.stringify({ ...publicState, disposed }));
    },
    update(patch) {
      if (!patch || typeof patch !== "object" || Array.isArray(patch))
        throw new TypeError("Catalog card update required");
      if (disposed) throw new Error("Catalog card disposed");
      const next = normalizeCatalogCard({ ...current, ...patch }, document);
      current = next;
      paint();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      element.removeEventListener("click", click);
      off();
      current = null;
    },
  });
}

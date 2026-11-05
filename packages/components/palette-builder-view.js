import { paletteLabelInk as labelInk } from "./palette-wheel.js";
/** A compact human-readable pair result never turns an advisory score into a WCAG certification. */
export function paletteCheckText(check, t) {
  return `AA ${check.wcag.ratio.toFixed(2)}:1 · ${t(check.wcag.aa ? "pass" : "fail")} | APCA ${check.apca.lc.toFixed(1)} Lc / ${check.apca.target} · ${t(check.apca.meetsAdvisoryTarget ? "pass" : "review")}`;
}
/** Paint result-only nodes; inputs/selects are owned by the controller and preserve focus/selection. */
export function paintPaletteResults({
  document,
  element,
  result,
  scheme,
  t,
  wheel,
  helpId,
}) {
  const create = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const explanation = create("div");
  explanation.append(
    create("h4", t(scheme.id)),
    create("p", t(scheme.id + "Help")),
  );
  if (!result.hueDefined)
    explanation.append(create("p", t("neutral"), "ag-palette-builder__notice"));
  if (scheme.colors.some((color) => color.gamutMapped))
    explanation.append(create("p", t("mapped"), "ag-palette-builder__notice"));
  let intro = element.querySelector(":scope > .ag-palette-builder__intro");
  if (!intro) {
    intro = create("div", undefined, "ag-palette-builder__intro");
    const prose = create("div");
    prose.setAttribute("data-ag-width", "content");
    intro.append(wheel, prose);
    element.append(intro);
  }
  const help = create("p", t("wheelHelp"), "ag-palette-builder__notice");
  help.id = helpId;
  intro.lastElementChild.replaceChildren(...explanation.childNodes, help);
  const compactCheck = (check) =>
    `AA ${check.wcag.ratio.toFixed(2)}:1 ${check.wcag.aa ? "✓" : "×"} · Lc ${check.apca.lc.toFixed(1)}/${check.apca.target} ${check.apca.meetsAdvisoryTarget ? "✓" : "!"}`;
  const cards = create("div", undefined, "ag-palette-builder__swatches");
  for (let index = 0; index < scheme.colors.length; index++) {
    const color = scheme.colors[index],
      card = create("article", undefined, "ag-palette-builder__swatch");
    const sample = create("div", String(index + 1), "ag-palette-builder__chip");
    sample.style.backgroundColor = color.hex;
    sample.style.color = labelInk(color.hex);
    card.append(sample, create("strong", `${index + 1} · ${color.hex}`));
    for (const [title, value] of [
      [t("textSurface"), compactCheck(color.asText)],
      [t("existingText"), compactCheck(color.asFill)],
      [
        `${t("suggestedInk")} ${color.suggestedInk.color}`,
        compactCheck(color.suggestedInk.checks),
      ],
      [
        t("boundary"),
        `${color.nonTextOnSurface.ratio.toFixed(2)}:1 /3 · ${t(color.nonTextOnSurface.pass ? "pass" : "fail")}`,
      ],
    ]) {
      const row = create("p");
      row.append(create("span", title), create("small", value));
      card.append(row);
    }
    cards.append(card);
  }
  const tones = create("div", undefined, "ag-palette-builder__tones");
  for (const color of result.tonalScale) {
    const tone = create("div");
    // Short numeric/hex stamps are intentional compact cells, not prose columns.
    tone.setAttribute("data-ag-width", "content");
    tone.setAttribute("data-ag-width-min-em", "2");
    const chip = create("span");
    chip.style.backgroundColor = color.hex;
    chip.setAttribute("aria-hidden", "true");
    tone.append(
      chip,
      create("small", `${Math.round(color.lightness * 100)} · ${color.hex}`),
    );
    tones.append(tone);
  }
  let details = element.querySelector(":scope > .ag-palette-builder__results");
  if (!details) {
    details = create("div", undefined, "ag-palette-builder__results");
    element.append(details);
  }
  details.replaceChildren(
    cards,
    create("h4", t("tonal")),
    create("p", t("tonalHelp")),
    tones,
  );
}

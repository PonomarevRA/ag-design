import { generatePalette, PALETTE_HARMONIES } from "./palette-model.js";
import { evaluateColorPair } from "./color-profile.js";
import { paletteRatio } from "./palette-color.js";
import {
  paletteCheckText,
  paintPaletteResults,
} from "./palette-builder-view.js";
import { bindChoiceChipRail } from "./choice-chips.js";
import { createPaletteWheel } from "./palette-wheel.js";
import { resolveI18n } from "./i18n.js";
let serial = 0;

/** Local authoring sandbox: outputs are candidates, never an applied host theme. Caller labels/content remain host-owned. */
export function createPaletteBuilder(
  { document = globalThis.document, i18n, ...options } = {
    baseColor: "#176f56",
  },
) {
  if (!document?.createElement)
    throw new TypeError("Palette builder requires a Document");
  let result = generatePalette({ baseColor: "#176f56", ...options }),
    settings = {
      ...result.context,
      baseColor: result.baseColor,
      space: result.colorSpace,
      harmonies: result.schemes.map((s) => s.id),
    };
  const context = resolveI18n(document, i18n),
    prefix = `ag-palette-${++serial}`,
    controls = {},
    labels = {},
    buttons = [];
  const t = (key) => context.t(`palette.${key}`);
  const element = document.createElement("section");
  element.className = "ag-palette-builder";
  element.setAttribute("data-ag-width", "fill");
  const title = document.createElement("h3");
  title.id = prefix + "-title";
  element.setAttribute("aria-labelledby", title.id);
  const fields = document.createElement("div");
  fields.className = "ag-palette-builder__fields";
  const hint = document.createElement("p");
  hint.className = "ag-palette-builder__notice";
  const error = document.createElement("p");
  error.id = prefix + "-error";
  error.className = "ag-palette-builder__error";
  error.setAttribute("role", "status");
  error.setAttribute("aria-live", "polite");
  const choices = document.createElement("div");
  choices.className = "ag-palette-builder__choices";
  choices.setAttribute("role", "group");
  const harmonyRail = bindChoiceChipRail(choices);
  let revealedHarmony = "";
  const output = document.createElement("div");
  output.className = "ag-palette-builder__output";
  const pairTitle = document.createElement("h4"),
    pairFields = document.createElement("div"),
    example = document.createElement("p"),
    pairStatus = document.createElement("p");
  pairFields.className = "ag-palette-builder__pair-fields";
  example.className = "ag-palette-builder__example";
  pairStatus.className = "ag-palette-builder__pair-status";
  const jsonDetails = document.createElement("details"),
    jsonTitle = document.createElement("summary"),
    json = document.createElement("textarea");
  json.readOnly = true;
  json.rows = 5;
  json.className = "ag-palette-builder__json";
  jsonDetails.append(jsonTitle, json);
  element.append(
    title,
    fields,
    error,
    hint,
    choices,
    output,
    pairTitle,
    pairFields,
    example,
    pairStatus,
    jsonDetails,
  );
  let selected = result.schemes[0].id,
    disposed = false,
    stale = false;

  const wheelHelpId = prefix + "-wheel-help";
  const wheel = createPaletteWheel({
    document,
    t,
    helpId: wheelHelpId,
    onColor(baseColor) {
      if (!disposed && !stale)
        commit(generatePalette({ ...settings, baseColor }));
    },
  });

  /** Stable explicitly labelled native controls remain keyboard accessible and locale independent. */
  function field(name, type, parent = fields, values = []) {
    const label = document.createElement("label"),
      caption = document.createElement("span"),
      control = document.createElement(type === "select" ? "select" : "input");
    label.className = "ag-palette-builder__field";
    control.id = prefix + "-" + name;
    control.name = name;
    control.setAttribute("aria-describedby", error.id);
    if (type !== "select") control.type = type;
    for (const value of values) {
      const option = document.createElement("option");
      option.value = String(value);
      option.textContent = String(value);
      control.append(option);
    }
    label.append(caption, control);
    parent.append(label);
    controls[name] = control;
    labels[name] = caption;
    return control;
  }
  field("picker", "color");
  for (const name of ["baseColor", "background", "foreground"]) {
    field(name, "text").spellcheck = false;
    controls[name].maxLength = 7;
  }
  field("space", "select", fields, ["oklch", "hsl"]);
  const size = field("fontSize", "number");
  size.min = "8";
  size.max = "120";
  size.step = "1";
  field(
    "fontWeight",
    "select",
    fields,
    [100, 200, 300, 400, 500, 600, 700, 800, 900],
  );
  field("role", "select", fields, ["body", "label", "large"]);
  field("pairFront", "select", pairFields);
  field("pairBack", "select", pairFields);
  controls.pairFront.value = "color-0";
  controls.pairBack.value = "surface";
  for (const id of PALETTE_HARMONIES) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.harmony = id;
    choices.append(button);
    buttons.push(button);
  }

  function syncFields(preserveActive = false) {
    for (const key of [
      "baseColor",
      "background",
      "foreground",
      "space",
      "fontSize",
      "fontWeight",
      "role",
    ])
      if (
        !(
          preserveActive &&
          controls[key] === document.activeElement &&
          controls[key].type === "text"
        )
      )
        controls[key].value = String(settings[key]);
    controls.picker.value = settings.baseColor;
  }
  /** Pair selectors survive palette changes; unavailable color slots fall back to explicit host surface/base. */
  function refreshPairOptions(scheme) {
    for (const key of ["pairFront", "pairBack"]) {
      const previous = controls[key].value;
      const entries = [
        ["surface", t("surfaceOption")],
        ["text", t("textOption")],
        ...scheme.colors.map((color, index) => [
          color.id,
          `${index + 1} · ${color.hex}`,
        ]),
      ];
      controls[key].replaceChildren();
      for (const [value, text] of entries) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        controls[key].append(option);
      }
      controls[key].value = entries.some(([value]) => value === previous)
        ? previous
        : key === "pairFront"
          ? "color-0"
          : "surface";
    }
  }
  function paintPair() {
    const scheme = result.schemes.find((item) => item.id === selected);
    const color = (key) =>
      controls[key].value === "surface"
        ? settings.background
        : controls[key].value === "text"
          ? settings.foreground
          : scheme.colors.find((item) => item.id === controls[key].value).hex;
    const foreground = color("pairFront"),
      background = color("pairBack"),
      check = evaluateColorPair({ ...settings, foreground, background });
    example.textContent = t("example");
    Object.assign(example.style, {
      color: foreground,
      backgroundColor: background,
      fontSize: `${settings.fontSize}px`,
      fontWeight: String(settings.fontWeight),
    });
    pairStatus.textContent = `${foreground} → ${background} · ${paletteCheckText({ wcag: check.wcag2, apca: check.apca }, t)} · ${t("boundary")} ${paletteRatio(foreground, background).toFixed(2)}:1 /3`;
    pairStatus.dataset.aa = String(check.wcag2.aa);
  }
  /** Reveal a changed selection only after measurable mounting; wheel repaints preserve manual rail scroll. */
  function revealHarmony() {
    if (disposed) return;
    const revealKey = `${selected}|${settings.harmonies.join(",")}|${t(selected)}`;
    if (
      revealKey !== revealedHarmony &&
      harmonyRail.reveal(
        buttons.find((button) => button.dataset.harmony === selected),
      )
    )
      revealedHarmony = revealKey;
  }
  /** Locale repaint only updates owned text and result nodes, never recreating editable controls. */
  function paint() {
    if (disposed) return;
    title.textContent = t("title");
    fields.setAttribute("aria-label", t("controls"));
    choices.setAttribute("aria-label", t("harmonies"));
    for (const [key, label] of Object.entries(labels))
      label.textContent = t(key);
    for (const option of controls.role.options)
      option.textContent = t(option.value);
    hint.textContent = `${t("candidate")} ${t("legend")}`;
    error.textContent = stale ? t("invalid") : "";
    element.dataset.stale = String(stale);
    for (const button of buttons) {
      button.hidden = !settings.harmonies.includes(button.dataset.harmony);
      button.textContent = t(button.dataset.harmony);
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.harmony === selected),
      );
    }
    revealHarmony();
    const scheme = result.schemes.find((item) => item.id === selected);
    wheel.update(result, scheme, stale);
    paintPaletteResults({
      document,
      element: output,
      result,
      scheme,
      t,
      wheel: wheel.element,
      helpId: wheelHelpId,
    });
    refreshPairOptions(scheme);
    pairTitle.textContent = t("pairTitle");
    paintPair();
    jsonTitle.textContent = t("export");
    json.setAttribute("aria-label", t("exportName"));
    const exported = JSON.stringify(result, null, 2);
    if (json.value !== exported) json.value = exported;
  }
  function commit(next, preserveActive = false) {
    result = next;
    settings = {
      ...next.context,
      baseColor: next.baseColor,
      space: next.colorSpace,
      harmonies: next.schemes.map((s) => s.id),
    };
    stale = false;
    for (const control of Object.values(controls))
      control.removeAttribute("aria-invalid");
    syncFields(preserveActive);
    paint();
  }
  /** Invalid drafts remain editable; preserve the last valid result with an explicit stale notice. */
  function input(event) {
    if (disposed || !event.target?.name || !element.contains(event.target))
      return;
    wheel.cancel();
    const name = event.target.name;
    if (name === "pairFront" || name === "pairBack") {
      paintPair();
      return;
    }
    if (name === "picker") controls.baseColor.value = controls.picker.value;
    const draft = { ...settings };
    for (const key of [
      "baseColor",
      "background",
      "foreground",
      "space",
      "role",
    ])
      draft[key] = controls[key].value;
    draft.fontSize = Number(controls.fontSize.value);
    draft.fontWeight = Number(controls.fontWeight.value);
    try {
      commit(generatePalette(draft), true);
    } catch {
      stale = true;
      for (const key of ["baseColor", "background", "foreground"]) {
        const invalid = !/^#[0-9a-f]{6}$/i.test(controls[key].value);
        if (invalid) controls[key].setAttribute("aria-invalid", "true");
        else controls[key].removeAttribute("aria-invalid");
      }
      if (
        !Number.isFinite(draft.fontSize) ||
        draft.fontSize < 8 ||
        draft.fontSize > 120
      )
        controls.fontSize.setAttribute("aria-invalid", "true");
      wheel.update(
        result,
        result.schemes.find((item) => item.id === selected),
        true,
      );
      element.dataset.stale = "true";
      error.textContent = t("invalid");
    }
  }
  function click(event) {
    const button = event.target.closest?.("button[data-harmony]");
    if (disposed || !button || button.hidden || !choices.contains(button))
      return;
    wheel.cancel();
    selected = button.dataset.harmony;
    paint();
  }
  element.addEventListener("input", input);
  element.addEventListener("change", input);
  choices.addEventListener("click", click);
  const off = context.subscribe(paint);
  syncFields();
  paint();
  // Ordinary hosts append synchronously after factory return; focus/update still reveals deferred mounts.
  queueMicrotask(revealHarmony);
  return Object.freeze({
    element,
    get result() {
      return JSON.parse(JSON.stringify(result));
    },
    update(next) {
      if (!next || typeof next !== "object" || Array.isArray(next))
        throw new TypeError("Palette update options required");
      if (disposed) throw new Error("Palette builder disposed");
      const candidate = generatePalette({ ...settings, ...next });
      if (!candidate.schemes.some((s) => s.id === selected))
        selected = candidate.schemes[0].id;
      wheel.cancel();
      commit(candidate);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      wheel.dispose();
      harmonyRail.dispose();
      element.removeEventListener("input", input);
      element.removeEventListener("change", input);
      choices.removeEventListener("click", click);
      off();
    },
  });
}

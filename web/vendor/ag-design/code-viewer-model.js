import { defaultHoverDelayMs, validateHintDelay } from "./hint-timing.js";

/** Public source budgets apply to initial values, setters and editable transactions. */
export const CODE_VIEWER_LIMITS = Object.freeze({
  bytes: 1048576,
  lines: 100000,
  lineLength: 20000,
});

/** Validate a complete literal source before replacing any current value or history. */
export function validateCodeSource(code) {
  if (typeof code !== "string") throw new TypeError("code must be a string");
  if (
    code.length > CODE_VIEWER_LIMITS.bytes ||
    new TextEncoder().encode(code).byteLength > CODE_VIEWER_LIMITS.bytes
  ) {
    throw new RangeError("code exceeds the 1 MiB UTF-8 budget");
  }
  let lines = 1,
    length = 0;
  for (let index = 0; index < code.length; index++) {
    const character = code[index];
    if (character === "\r" || character === "\n") {
      if (character === "\r" && code[index + 1] === "\n") index++;
      lines++;
      length = 0;
      if (lines > CODE_VIEWER_LIMITS.lines)
        throw new RangeError("code exceeds the line-count budget");
    } else {
      length++;
      if (length > CODE_VIEWER_LIMITS.lineLength)
        throw new RangeError("code exceeds the single-line budget");
    }
  }
  return code;
}

/** The first newline convention is retained on edits; untouched mixed endings remain literal. */
export function codeLineSeparator(code) {
  const match = /\r\n|\r|\n/.exec(code);
  return match?.[0] ?? "\n";
}

/** Validate a bounded language hint without requiring the lazy syntax bundle. Unknown names remain plaintext. */
export function validateCodeLanguage(language) {
  if (typeof language !== "string" || language.length > 128)
    throw new TypeError("language must be a bounded string");
  return language;
}

/** Validate local options atomically. Values do not select fonts, profiles or external resources. */
export function checkedCodeOptions(input, previous = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new TypeError("options must be an object");
  const next = {
    label: "Код",
    filename: "",
    readOnly: true,
    lineNumbers: true,
    wrap: false,
    height: 320,
    toolbarMode: "compact",
    tooltipDelayMs: defaultHoverDelayMs,
    ...previous,
  };
  for (const [name, value] of Object.entries(input)) {
    if (
      ![
        "label",
        "filename",
        "readOnly",
        "lineNumbers",
        "wrap",
        "height",
        "toolbarMode",
        "tooltipDelayMs",
      ].includes(name)
    )
      throw new TypeError(`Unknown option ${name}`);
    if (value !== undefined) next[name] = value;
  }
  for (const name of ["label", "filename"]) {
    if (typeof next[name] !== "string" || next[name].length > 256)
      throw new TypeError(`${name} must be a bounded string`);
  }
  if (!next.label.trim())
    throw new TypeError("label must provide an accessible name");
  for (const name of ["readOnly", "lineNumbers", "wrap"])
    if (typeof next[name] !== "boolean")
      throw new TypeError(`${name} must be boolean`);
  if (!Number.isFinite(next.height) || next.height < 120 || next.height > 1600)
    throw new RangeError("height must be 120–1600 CSS pixels");
  if (!["compact", "labeled"].includes(next.toolbarMode))
    throw new TypeError("toolbarMode must be compact or labeled");
  validateHintDelay(next.tooltipDelayMs, "tooltipDelayMs");
  return next;
}

/** Map normalized CodeMirror positions back to the untouched literal source for exact selection copy. */
export function literalCodeOffset(code, position) {
  let logical = 0;
  for (let index = 0; index < code.length; index++) {
    if (logical === position) return index;
    if (code[index] === "\r" && code[index + 1] === "\n") index++;
    logical++;
  }
  return code.length;
}

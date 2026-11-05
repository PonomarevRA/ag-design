/** Bounded browser-owned demo state. No network, executable content or global storage clearing. */
const PREFIX = "ag-design-demo-v2:";
const LIMIT = 262144;

/** Validate a persisted value against an explicit example shape before any UI consumes it. */
export function matchesDemoShape(value, template, depth = 0) {
  if (depth > 8) return false;
  if (Array.isArray(template)) {
    if (!Array.isArray(value) || value.length > 100) return false;
    if (!template.length) return value.length === 0;
    for (const item of value) {
      if (!matchesDemoShape(item, template[0], depth + 1)) return false;
    }
    return true;
  }
  if (template !== null && typeof template === "object") {
    if (value === null || typeof value !== "object" || Array.isArray(value))
      return false;
    const keys = Object.keys(template);
    if (Object.keys(value).length !== keys.length) return false;
    for (const key of keys) {
      if (
        !Object.hasOwn(value, key) ||
        !matchesDemoShape(value[key], template[key], depth + 1)
      )
        return false;
    }
    return true;
  }
  if (typeof template === "number")
    return Number.isFinite(value) && Math.abs(value) <= 1000000000;
  if (typeof template === "string")
    return typeof value === "string" && value.length <= 16384;
  return (
    typeof value === typeof template &&
    (value === null || typeof value === "boolean")
  );
}

/** Read one versioned snapshot with a caller-owned schema; failed or unavailable storage stays usable in memory. */
export function createDemoState({
  window,
  style,
  scope,
  initial,
  template = initial,
  validate = () => true,
}) {
  if (
    !/^[a-z][a-z0-9-]{0,47}$/.test(style) ||
    !/^[a-z][a-z0-9-]{0,31}$/.test(scope)
  )
    throw new TypeError("Invalid demo namespace");
  const key = `${PREFIX}${style}:${scope}`;
  let state = JSON.parse(JSON.stringify(initial));
  let status = "persistent";
  try {
    const raw = window.localStorage.getItem(key);
    if (raw !== null) {
      if (raw.length > LIMIT)
        throw new RangeError("Demo snapshot exceeds limit");
      const saved = JSON.parse(raw);
      if (
        saved.version !== 1 ||
        !matchesDemoShape(saved.data, template) ||
        !validate(saved.data)
      )
        throw new TypeError("Invalid demo snapshot");
      state = saved.data;
    }
  } catch {
    status = "memory";
  }
  /** Persist only the current bounded host snapshot and expose failure without losing in-memory work. */
  function save() {
    try {
      if (!matchesDemoShape(state, template) || !validate(state))
        throw new TypeError("Invalid demo state");
      const raw = JSON.stringify({ version: 1, data: state });
      if (raw.length > LIMIT)
        throw new RangeError("Demo snapshot exceeds limit");
      window.localStorage.setItem(key, raw);
      status = "persistent";
      return true;
    } catch {
      status = "memory";
      return false;
    }
  }
  return {
    state,
    key,
    save,
    get status() {
      return status;
    },
  };
}

/** Reset only the selected example's known v2 namespaces and its prior console snapshot. */
export function resetDemoState(window, style) {
  if (!/^[a-z][a-z0-9-]{0,47}$/.test(style)) return false;
  try {
    for (const scope of [
      "workspace",
      "cms",
      "analytics",
      "learning",
      "console",
      "fitness",
      "records",
      "preferences",
    ])
      window.localStorage.removeItem(`${PREFIX}${style}:${scope}`);
    if (style === "graphite-gold" || style === "amber-circuit")
      window.localStorage.removeItem(`ag-design-demo-${style}-v1`);
    return true;
  } catch {
    return false;
  }
}

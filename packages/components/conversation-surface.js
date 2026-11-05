/**
 * Inspect declared ChatGPT surface facts without reading DOM, content or credentials.
 * Facts are caller-reported, not host/AT attestation. Missing facts stay unknown.
 * Ordinary web applications are outside these host-specific recommendations.
 */
export function inspectConversationSurface(facts = {}) {
  if (!facts || typeof facts !== "object" || Array.isArray(facts))
    throw new TypeError("Surface facts must be an object");
  if (!["chatgpt", "web"].includes(facts.context))
    throw new TypeError("Declare chatgpt or web context");
  if (!["inline", "carousel", "fullscreen", "pip"].includes(facts.mode))
    throw new TypeError("Unknown conversation surface mode");
  const checks = [];
  /** Add one bounded scalar check; unsupported types cannot manufacture a pass. */
  function check(id, value, predicate) {
    const known =
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isSafeInteger(value) && value >= 0);
    checks.push({
      id,
      status: known ? (predicate(value) ? "pass" : "fail") : "unknown",
    });
  }
  if (facts.context === "web") {
    return {
      context: "web",
      mode: facts.mode,
      status: "not-applicable",
      checks,
      trust: "caller-reported",
      manualRequired: ["host policy", "accessibility", "actual layout"],
    };
  }
  if (facts.mode === "inline") {
    check(
      "inline-action-count",
      facts.actionCount,
      (n) => typeof n === "number" && n <= 2,
    );
    check(
      "inline-primary-count",
      facts.primaryActionCount,
      (n) => typeof n === "number" && n <= 1,
    );
    check("inline-no-nested-scroll", facts.nestedScroll, (b) => b === false);
    check(
      "inline-no-deep-navigation",
      facts.deepNavigation,
      (b) => b === false,
    );
  }
  if (facts.mode === "carousel") {
    check(
      "carousel-small-set",
      facts.itemCount,
      (n) => typeof n === "number" && n >= 3 && n <= 8,
    );
    check("carousel-visuals", facts.allItemsHaveVisual, (b) => b === true);
    check(
      "carousel-one-action",
      facts.maxActionsPerItem,
      (n) => typeof n === "number" && n <= 1,
    );
  }
  check("native-composer-only", facts.duplicateComposer, (b) => b === false);
  if (facts.mode === "fullscreen") {
    check("fullscreen-capability", facts.modeSupported, (b) => b === true);
    check("composer-clearance", facts.composerOccluded, (b) => b === false);
  }
  if (facts.mode === "pip") {
    check("pip-capability", facts.modeSupported, (b) => b === true);
    check("pip-session-lifecycle", facts.closedOnSessionEnd, (b) => b === true);
  }
  let status = "pass";
  for (const item of checks) {
    if (item.status === "fail") {
      status = "fail";
      break;
    }
    if (item.status === "unknown") status = "unknown";
  }
  return {
    context: facts.context,
    mode: facts.mode,
    status,
    checks,
    trust: "caller-reported; scoped advisory checks, not qualification",
    manualRequired: [
      "host theme and typography",
      "contrast",
      "keyboard and AT",
      "narrow and enlarged text",
      "server authority",
    ],
  };
}

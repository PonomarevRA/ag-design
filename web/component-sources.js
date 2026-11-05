const documentationHosts = new Set([
  "www.w3.org",
  "w3.org",
  "html.spec.whatwg.org",
  "developer.mozilla.org",
  "developer.apple.com",
  "m3.material.io",
  "developer.android.com",
]);
/** Public component contracts link only standards/platform documentation; archive provenance and licence notices stay intact. */
export function componentSources(sources = []) {
  const result = [];
  for (const value of sources) {
    try {
      const url = new URL(value);
      if (url.protocol === "https:" && documentationHosts.has(url.hostname))
        result.push(value);
    } catch {
      /* Invalid optional metadata never creates a navigation link. */
    }
  }
  return result;
}

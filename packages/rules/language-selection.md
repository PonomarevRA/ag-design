# Language selection · core0.20.1

Use an explicit i18n context. This factory changes that context in place; the host owns routes, content, persistence and layout. It never redirects visitors or positions itself against the viewport.

## Choose the control

| Situation | AG option | Why |
| --- | --- | --- |
| Two enabled languages, names fit | `variant:"inline"` | Both autonyms are discoverable; selected state remains explicit. |
| Three or more, or constrained space | `variant:"compact"` | Native select retains platform keyboard/popup behaviour. |
| Product can enable additional languages | `variant:"auto"` | Two are inline, three or more compact, one static. Count is an AG default; long names may justify explicit compact. |
| Header or secondary navigation | `appearance:"quiet"` | Full names and focus targets remain; permanent field outlines recede. |
| Already clear header context | `labelVisibility:"sr-only"` | Caption remains associated and readable to AT. Globe-only without an accessible name is not supported. |

The default remains compact/outlined/visible for compatibility. Autonyms use their own `lang` and `dir`; country flags and codes alone do not identify a language reliably. Locale count changes transfer focus to the replacement control; ordinary changes retain their existing node. Single-locale hosts may hide the component only after recovering affected focus.

## Choose the location

- **Whole website/service:** keep one predictable location in global navigation. A header utility area near the inline end is a useful LTR starting point; test RTL rather than hardcoding “right”. Keep it discoverable on mobile too.
- **One translated document/page:** put language navigation near its heading and explain its limited scope. Do not imply that the entire product is translated.
- **Persistent application sidebar:** a footer outside the scrolling navigation region is an AG alternative. It must fit in the first viewport at the real zoom/safe-area size and remain reachable by keyboard. A footer after an infinitely growing article is not an equivalent placement.
- **Page footer:** may repeat an existing discoverable selector, but avoid making the remote end of a long page the only way to recover from an unfamiliar language. Avoid two competing preference owners.

```js
// Header utility: quiet visible autonyms, associated caption available to AT.
createLanguageSwitcher({ i18n, variant: "auto", appearance: "quiet", labelVisibility: "sr-only" });
// Sidebar footer: visible caption; host reserves its space outside the scroller.
createLanguageSwitcher({ i18n, variant: "auto", appearance: "quiet" });
```

For equivalent language URLs use real host-owned links (`href`, language-tagged autonym, `hreflang`, `rel="alternate"`) instead of turning a button into simulated navigation. Keep the same document/query context where meaningful. Native selects are suitable for this in-place context API; changing selection should not unexpectedly submit a form or navigate a public site. Language, region, currency and time zone are separate decisions. Do not automatically redirect from IP/browser detection; offer a recoverable preference instead.

## Sources and validation boundary

Reviewed2026-10-27: [USWDS two-language pattern](https://designsystem.digital.gov/patterns/select-a-language/two-languages/), [USWDS multiple-language pattern](https://designsystem.digital.gov/patterns/select-a-language/three-or-more-languages/), [GOV.UK language navigation](https://design-system.service.gov.uk/components/language-navigation/). GOV.UK remains **trial**. These support consistent discoverability, native language names, scope and data retention; auto-count threshold, quiet styling and pinned sidebar footer are authored AG defaults. The [historical W3C article](https://www.w3.org/International/questions/qa-navigation-select) supports visibility/autonyms but its old text-label/alt advice is not adopted.

Verify enabled locales,2↔3↔1 transitions, focus, errors/fallback and same-document state, long names, narrow/200% layout, keyboard/touch, RTL and disposal. A native select, source recommendation or passing DOM suite does not qualify a host for AT or guarantee user recognition.

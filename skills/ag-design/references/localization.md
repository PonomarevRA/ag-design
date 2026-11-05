# Localization and language selection

Declare locale, enabled/fallback locales and ownership of content and formatting. RU/EN dictionaries do not require Russian; intentional English-only is valid. Use explicit i18n for new components. Legacy unconfigured controls retain RU compatibility. Key owned UI/status/error/accessible strings; preserve caller labels and user data/code/Markdown. Dictionaries are literal, never HTML/eval. Use Intl with explicit business units/currency/timezone; declare lang/dir separately. Common RTL detection is not full script/AT support. Preserve current work, focus and async fencing; report storage failure rather than claiming persistence.

## Language controls and placement

Search/read `language-switcher` and `internationalization-localization`. Existing createLanguageSwitcher in core0.20.1 adds opt-in `variant:"auto"` (two inline,three+ native select,one static), `appearance:"quiet"` and `labelVisibility:"sr-only"`; compact/inline defaults remain supported. Count threshold is AG policy, not a universal research result. Keep visible native names and selection; globe supplements names, flags/codes do not substitute for languages. Visually-hidden labels must remain associated; no unnamed icon-only control.

- Service-wide: one consistent, discoverable global header/navigation location; inline-end is an LTR starting point, with actual RTL/mobile validation.
- Page-only translations: place language navigation near that heading and explain scope. Do not imply an entire service is translated.
- Persistent app sidebar: an AG footer recipe reserves visible space outside the scrolling list. It must survive real zoom/short viewport and keyboard access. A distant infinite-page footer is not equivalent. Keep a mobile access point when the sidebar closes.
- A page-footer repeat may share one preference owner. Do not automatically redirect from IP/browser hints or combine language with country/currency/timezone.

Use real host-owned alternate links for equivalent translated URLs (`href`, autonym/lang, `hreflang`, `rel=alternate`), and buttons/select for in-place changes. This factory owns only locale presentation; the host owns navigation, translation and persistence. Single-locale may be static or hidden after deliberate focus recovery.

Reviewed2026-10-27: [USWDS two languages](https://designsystem.digital.gov/patterns/select-a-language/two-languages/), [USWDS three+](https://designsystem.digital.gov/patterns/select-a-language/three-or-more-languages/), [GOV.UK language navigation](https://design-system.service.gov.uk/components/language-navigation/) (**trial**). [Historical W3C navigation article](https://www.w3.org/International/questions/qa-navigation-select) supports visibility/autonyms; do not adopt its outdated text-label/alt omissions. Source patterns support decisions, not measured recognition for AG. Full placement matrix: `@ag-design/rules/language-selection.md` or component `language-switcher.md`; full RU/EN user chapter remains available through MCP audience=user.

Validate enabled/fallback/English-only,2↔3↔1 focus transitions, long autonyms, narrow/200%/short-height layouts, selected/accessibility states, plurals0/1/2/5/21, formatted values and disposal. Claimed RTL, native popup and target AT need separate checks. Native semantics or a dictionary do not qualify a consumer automatically.

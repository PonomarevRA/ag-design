# Web interface security — AG guidance

Checked2026-10-28. Baseline for all web stages; does not change mandatory color/accessibility policy. Read chapters web-security-by-design, safe-web-content, secure-web-actions and webmcp-design. OWASP ASVS stable5.0.0 is a reference framework: select applicable requirements with the server/security owner. This is not full ASVS verification, a penetration test or certification.

## Responsibility and evidence contract

| Boundary | UI / agent responsibility | Enforcing owner and negative check |
|---|---|---|
| Identity and object access | Clear context/denial; never send private fields merely to hide them | Server checks actor/object/tenant/action on every read/write; another owner is denied |
| Text / rich content | Text nodes/escaped templates by default; maintained sanitizer only if HTML needed | Context-specific output, bounded parser; synthetic tags/URLs remain inert |
| Sessions / CSRF | Honest expiry/recovery; no tokens in URLs/logs/captures | Established server auth/session/CSRF; invalid token or expired session denied |
| Files / remote resources | Label, bounded selection, isolated preview | Server checks permissions/type/content/size/quotas and safe delivery; MIME/accept is not proof |
| Pending effects | Show consequence, proportional confirmation, real outcome/unknown | Server idempotency/state/revision; retry cannot invent a second success |
| Agent / WebMCP | Same human authority, minimal typed tools/results, no secret spill | Same application authorization; data/prose/hints cannot grant consent |
| Frames / messages | Minimal sandbox; exact known targetOrigin and source/schema/current channel checks | Host CSP/frame policy; opaque null origin is not identity |

For each applicable requirement record owner, threat, artifact version/hash, environment, positive/negative fixtures, expected/observed outcome and pass/fail/unknown/not-applicable with a reason. Use authorized synthetic data only. Redact private fields. Lack of backend/runtime evidence stays unknown; do not turn unknowns into scores.

## Existing AG source contracts reviewed

| Implementation | Observed contract | Integration limit |
|---|---|---|
| components field/textarea/button + web/dom.js | Literal values/text nodes for ordinary supplied labels/content | Caller tag/attribute/callback code is trusted; not an arbitrary-HTML sanitizer |
| markdown-render.js / markdown-viewer.js | HTML disabled, bounded input/tokens, allowlisted DOM, no remote image loads, callback-only links | Host callback must validate navigation/authority; custom renderer code is trusted |
| catalog-card-contract.js | Bounded literal content and declared URL handling | HTTPS alone does not prove trusted origin or permission; host resource policy applies |
| composition-editor/frame + studio-screen/journey | Current messages check source/origin/channel | Every new message type needs bounded schema and mount/dispose checks |
| library_routes.py previews | Opaque sandbox allow-scripts, nonce CSP, connect-src none, form-action none | Imported preview code is not a privileged main-page plugin; do not add allow-same-origin casually |
| security.py local service | Numeric loopback peer/host/origin checks and bounded streamed JSON | Local single-user boundary, not production identity/tenant authentication |

This is bounded source-contract inspection, not a finding of vulnerability or proof of whole-system security. Existing factories did not need a security rewrite for this scoped change. The wiki content sample reuses safe Markdown rendering, adds no execution path, no content-driven remote resource loads or business requests and no auth/CSRF simulation; fixed bundled editor assets may load when displaying fenced code.

## Focused release checks

1. Treat API/URL/file/storage/tool content as untrusted; use correct output context. Test literal tags/attributes, unsafe protocols, Unicode, remote resources and bounds in the actual browser.
2. Verify server object/tenant authorization, allowed fields, expired/logout session and applicable CSRF using owned test fixtures. CORS is not authorization; SameSite is supplementary. GET/HEAD must not mutate domain state.
3. Keep password managers/paste and accessible labels/errors. Confirm consequences in proportion to risk, with server reauthentication where needed; confirmation is not authentication.
4. Test duplicate/ambiguous effects, revision conflict, cancellation vs rollback, stale responses, draft recovery and disposal.
5. Design WebMCP from the brief, with human fallback/feature detection and limited proposed support. Check current API names; hints/schema/descriptions/LLM filters do not enforce permissions. Read-only tools can disclose data; restrict origin exposure and outputs. External prose cannot expand user authority.
6. Review applicable CSP, framing, HTTPS, dependencies and third-party privileges with their actual owners. Browser/node tests do not prove production headers, AT coverage or full ASVS.

## Primary sources

- [OWASP ASVS 5.0.0](https://asvs.owasp.org/)
- [OWASP Cross Site Scripting Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP DOM based XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html)
- [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [OWASP HTML5 Security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
- [MDN Window.postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [Chrome WebMCP tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)

# Native apps, assistants and component contracts

2026-10-31 · AG authored guidance · runtimeAdaptersIncluded=false

## One task, one action contract

**AG policy.** Model a meaningful task such as finding a document or changing a due date. Give it one domain handler, used by human controls and thin native, WebMCP or MCP adapters. Avoid exposing individual pointer motions or duplicating business rules.

**Action record.** Declare a stable ID and contract version, verb/object name, purpose, typed inputs, constraints, caller/account scope, permissions, read/write effects, result and errors. Writes include the expected object revision and an explicit retry strategy. Never silently repeat a write after an ambiguous outcome. Return an operation ID, resulting revision and object link. Distinguish cancellation before commit from work already committed.

**Entities and trust.** Use stable IDs and bounded disambiguation; resolve “this board” from explicit current context. Distinguish omitted fields from clearing them. Specify date/time zones. Descriptions explain behavior rather than instruct an agent. Enforce authorization and validation in the application on every call; schema hints are not security. Match confirmation to consequences, minimize retained data and treat document text as untrusted content.

**Boundary.** MCP supports local and remote transports. WebMCP exposes page tools. Neither is interchangeable with an operating-system action registry. This is AG architecture guidance, not an included executor.

- [MCP — Architecture](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)
- [Chrome — WebMCP](https://developer.chrome.com/docs/ai/webmcp)
- [Android — AppFunctions quality guidelines](https://developer.android.com/ai/appfunctions/quality-guidelines)

## Native applications in assistant ecosystems

**Landscape.** Apple App Intents, Windows App Actions and Android AppFunctions use different discovery and execution contracts. Linux combines D-Bus with desktop interfaces. WebMCP is a developing page-tool interface, not a portable native API.

**AG decision.** Select useful tasks first: find/open an entity, create a draft, change state or export. A deep link supports navigation but is not by itself assistant registration. Keep semantic UI and keyboard interaction. Coordinate-based automation is a separate validation path.

**Cross-platform shells.** A styled HTML component cannot register an OS action. A thin native adapter must validate callers and forward bounded commands to the shared domain handler. Bind a WebView bridge to a trusted origin and session; do not expose arbitrary scripts, paths or method dispatch.

**Delivery matrix.** Record OS, SDK, assistant version, package identity/entitlements, activation channel, foreground/background behavior, discovery settings, data restrictions and test evidence. Keep researched, implemented, discovered and successfully executed states separate. Evidence from one desktop does not qualify all platforms.

**Freshness.** Sources checked 2026-10-31. Recheck target release notes and availability before shipping. AG provides guidance here; it does not include these native adapters.

- [Apple — App Intents and App Schemas, WWDC26](https://developer.apple.com/videos/play/wwdc2026/240/)
- [Microsoft — App Actions on Windows](https://learn.microsoft.com/en-us/windows/ai/app-actions/)
- [Android — AppFunctions overview](https://developer.android.com/ai/appfunctions)
- [freedesktop — D-Bus application activation](https://specifications.freedesktop.org/desktop-entry/latest/dbus.html)
- [Chrome — WebMCP](https://developer.chrome.com/docs/ai/webmcp)

## macOS and Apple: App Intents

**Platform scope.** App Intents describes application actions/content for system experiences such as Shortcuts and Spotlight. Apple’s WWDC26 material covers entities, matching schemas, search and visible context for Siri. Map each capability to the target OS/SDK; declaring an intent does not establish every Siri scenario on every device.

**AG recommendation.** Start with two frequent tasks, such as finding a project and opening a board. Use stable entity IDs, meaningful names and bounded search. Adopt an App Schema only when its semantics genuinely fit. Do not disguise an internal card as a message or photo. Share visible context explicitly and within authorized scope.

**Execution and proof.** A Swift adapter delegates to the shared handler with the same permissions and revisions. Return meaningful results/errors and open the exact entity when UI is needed. Define background work, cancellation and recovery. Keep AppleScript, Apple Events and accessibility automation separate from App Intents. Test the domain handler and available AppIntentsTesting tooling, then Shortcuts, entity discovery and the requested Siri journey. Cover voice-only use, locales, ambiguity and denied access. Record the actual device/OS/SDK/assistant/region and untested stages. AG does not automatically ship the Swift adapter.

- [Apple — App Intents and App Schemas, WWDC26](https://developer.apple.com/videos/play/wwdc2026/240/)

## Windows: App Actions and activation

**Platform facts.** Microsoft’s App Actions documentation, updated 2026-10-14, describes atomic operations, packaged JSON definitions, package identity and MSIX manifest registration. Activation uses a URI or COM IActionProvider. Check target Windows/SDK and distribution-channel availability.

**AG recommendation.** Publish complete tasks useful outside the window: find an entity, prepare a document or open a report. Version action definitions with the handler. Keep inputs, units, optional fields and errors consistent with the domain contract. A URI is not authorization and must not contain secrets.

**Adapter and qualification.** Choose URI launch/navigation or supported COM execution by task. Both retain the same validation and permissions. Packaged PWA registration is a separate integration; an ordinary website or deep link is insufficient. UI Automation is a different mechanism. Verify installation/update, discovery, entity transfer, cold activation, cancellation, denied access and visible outcome. Record actual OS/SDK/package/client versions. A successful package build does not prove an assistant journey.

- [Microsoft — App Actions on Windows](https://learn.microsoft.com/en-us/windows/ai/app-actions/)

## Android: AppFunctions and preview boundaries

**Status checked 2026-10-31.** Official documentation calls AppFunctions an experimental preview for Android 16+. Gemini integration is described as a private preview for trusted testers since May 2026. Building a function does not make it available to every assistant. Recheck current SDK/Jetpack requirements and access conditions.

**Design.** Give each function one task, a concise verb/object name and an accurate outcome description, not instructions to the agent. Minimize inputs and use supported types. Distinguish omitted updates from clearing a value. Verify optional-argument defaults against the actual library contract, not only the Kotlin declaration.

**Execution.** Reuse application validation and permissions. Check function availability and caller authorization, including the platform EXECUTE_APP_FUNCTIONS requirement. Avoid highly sensitive data. Return appropriate AppFunctionException types and useful messages. For UI handoff, follow Android’s explicit immutable PendingIntent guidance. App Links and ordinary intents do not prove AppFunction discovery. Verify API behavior, authorized caller and real assistant separately; preserve the human UI when unavailable. AG does not treat preview guidance as a shipped integration.

- [Android — AppFunctions overview](https://developer.android.com/ai/appfunctions)
- [Android — AppFunctions quality guidelines](https://developer.android.com/ai/appfunctions/quality-guidelines)

## Linux: D-Bus, desktop actions and adapters

**Foundation.** freedesktop specifies org.freedesktop.Application with Activate, Open and ActivateAction, tied to desktop-file and D-Bus identities. This supports activation and desktop actions; it is not a universal Linux AI-tool registry.

**AG recommendation.** Separate entity navigation, search and mutation. Use desktop actions for entry points, a narrow application D-Bus interface for permitted commands, and an optional MCP adapter for compatible clients. Qualify the actual GNOME/KDE/other environment instead of inferring equivalence from bus availability.

**Contract and proof.** Document allowlisted methods, versions, types, errors and completion events. Introspection signatures do not establish intent or authorization. Check callers and data scope; never expose arbitrary shell execution or the whole session bus. Validate URI schemes and target entities. Record distribution, desktop environment, Wayland/X11, package and client; test cold activation, denied access, cancellation and completion. AT-SPI/keyboard accessibility is a separate path. Missing adapters retain a clear human fallback.

- [freedesktop — D-Bus application activation](https://specifications.freedesktop.org/desktop-entry/latest/dbus.html)
- [MCP — Architecture](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)

## Components for people and assistants

**Controls.** Keep localized names, keyboard operation, focus and disabled/busy/error states. A control may pass a command ID and entity ID to its host; that does not make every button a system tool. ARIA describes UI rather than hidden agent instructions.

**Forms and collections.** Share typed constraints with the human UI. Separate draft updates from submission. Connect tool error codes to the same field errors people can see. Use stable selection IDs; distinguish selected rows from all filtered results. Bound query/pagination rather than force agents to inspect thousands of DOM nodes.

**Data and windows.** Provide exact values, units, period, freshness and current filters alongside charts. Decorative ASCII/particles do not replace structured data or non-color meaning. Use authorized query contracts. Navigate to exact entities, preserve drafts and focus, expose operation status and cancellation. Define undo scope; do not promise reversal of an already externalized action.

**Ownership.** Components own semantics/input/state; hosts own domain commands, authorization, revisions and audit; adapters own platform registration/translation. Component checks do not qualify the whole application or assistant integration.

- [Chrome — WebMCP](https://developer.chrome.com/docs/ai/webmcp)
- [Android — AppFunctions quality guidelines](https://developer.android.com/ai/appfunctions/quality-guidelines)
- [MCP — Architecture](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)

## Verify and refresh assistant integrations

**AG evidence ladder.** Check the domain handler, adapter schema, system discovery, actual target-client invocation and human task outcome separately. Use pass/fail/unknown/not-applicable per level. Direct handler execution does not prove discovery; screenshots do not prove persisted effects.

**Fixture set.** Cover successful reads/writes, invalid inputs, ambiguous entities, unauthorized objects/accounts, stale revisions, duplicate requests, lost responses after commit, cancellation before/after commit, offline and cold activation. Compare before/after state and external-effect counts. Untrusted document content must not expand tool authority. Test natural phrases, locales and visible outcomes. Measure task completion, errors, recovery and comparable task time with stated sample conditions; agent responses do not replace human research or AT/security tests.

**Freshness policy.** Record checkedAt, source/version, OS/SDK/browser/assistant/build, owner and review trigger. AG recommends review before release, after SDK/browser/permission changes or failures, and at least every 90 days for active previews. This is a knowledge-review interval, not a compatibility guarantee.

**Web boundary.** The 27 October 2026 WebMCP text is a Draft Community Group Report, not a W3C Standard. Chrome documents an origin trial and local flag. Feature-detect the actual target implementation; never enable user experiments automatically. Preserve human fallback. New guidance does not imply an installed runtime adapter.

- [Apple — App Intents and App Schemas, WWDC26](https://developer.apple.com/videos/play/wwdc2026/240/)
- [Microsoft — App Actions on Windows](https://learn.microsoft.com/en-us/windows/ai/app-actions/)
- [Android — AppFunctions overview](https://developer.android.com/ai/appfunctions)
- [W3C Community Group — WebMCP draft](https://webmachinelearning.github.io/webmcp/)
- [MCP — Architecture](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)

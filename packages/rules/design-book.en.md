# AG application design book

Read from the human task through interaction, architecture, assistant contracts and verification. Each part produces a design decision; scrolling is not evidence of learning. Use the contents for reference, then complete the chapter practice. Sources have scope and dates; platform guidance is not a shipped adapter.

110 chapters. RU/EN editions; compact agent instructions are separate.

### 1. Task and intent

- [Human task and context](#human-centered) — `human-centered`
- [Information architecture](#information-architecture) — `information-architecture`
- [Creative direction and visual language](#creative-direction) — `creative-direction`
- [Customer journey and screen-linked prototype](#customer-journey-prototype) — `customer-journey-prototype`

### 2. Interaction and visual language

- [Responsive layout](#layout) — `layout`
- [Visual hierarchy](#hierarchy) — `hierarchy`
- [Semantic grouping and separators](#grouping) — `grouping`
- [Spacing and size scale](#spacing) — `spacing`
- [Typography and readability](#typography) — `typography`
- [Semantic color and profiles](#color) — `color`
- [Palette selection: wheels, harmonies and tonal scales](#color-palettes) — `color-palettes`
- [Apple-inspired shapes and color](#apple-shapes-color) — `apple-shapes-color`
- [Composition and optical balance](#composition-optics) — `composition-optics`
- [Golden Canon Grid: construction and composition priority](#golden-canon-grid) — `golden-canon-grid`
- [Layers, surfaces and overlays](#layers) — `layers`
- [Navigation, toolbar and panels](#navigation) — `navigation`
- [Icons and visible labels](#icons) — `icons`
- [Actions and command priority](#actions) — `actions`
- [States and recovery](#feedback) — `feedback`
- [Async components: state and ownership](#async-components) — `async-components`
- [Forms, validation and input](#forms) — `forms`
- [Common form quality](#form-quality-common) — `form-quality-common`
- [CRM and sales forms](#forms-business) — `forms-business`
- [Marketing funnel forms](#form-funnel) — `form-funnel`
- [Operational and technical forms](#form-operations) — `form-operations`
- [Code and task cards](#cards) — `cards`
- [Product and component presentation](#catalog-item-presentation) — `catalog-item-presentation`
- [Catalog search and selection](#catalog-discovery) — `catalog-discovery`
- [Safe text, links and previews](#safe-web-content) — `safe-web-content`
- [Motion and continuity](#motion) — `motion`
- [Icons: from grids to reviewed drafts](#grid-icon-generation) — `grid-icon-generation`
- [Fields and actions in one row](#form-row-layout) — `form-row-layout`
- [GitLab/Pajamas: reusable work patterns](#gitlab-pajamas-patterns) — `gitlab-pajamas-patterns`
- [Compact list sorting and view controls](#list-view-controls) — `list-view-controls`
- [Nonmodal contextual popovers](#nonmodal-popovers) — `nonmodal-popovers`
- [Mesh gradients: background, emphasis and readable content](#mesh-gradients) — `mesh-gradients`
- [Visual interest without losing hierarchy](#visual-interest-techniques) — `visual-interest-techniques`
- [Signup and login: clear and secure journeys](#authentication-ux) — `authentication-ux`
- [Logos: differentiation and small-size robustness](#logo-robustness) — `logo-robustness`
- [Intuitive choices: suitable controls and visible outcomes](#intuitive-control-selection) — `intuitive-control-selection`
- [Action locality: object, list and application](#action-locality) — `action-locality`
- [UI font sizing by task and platform](#ui-font-sizing) — `ui-font-sizing`
- [OpenAI: surfaces inside a conversation](#openai-conversation-surfaces) — `openai-conversation-surfaces`
- [OpenAI: tools, state and UI contracts](#openai-tool-ui-contract) — `openai-tool-ui-contract`
- [OpenAI: embedded UI security boundaries](#openai-embedded-ui-security) — `openai-embedded-ui-security`
- [ChatKit: widget and list composition](#chatkit-widget-composition) — `chatkit-widget-composition`
- [ChatKit: scoped actions and pending state](#chatkit-widget-actions) — `chatkit-widget-actions`
- [ChatKit: compact forms and explicit payloads](#chatkit-widget-forms) — `chatkit-widget-forms`
- [Chat: compact composer and explicit tools](#chat-composer-patterns) — `chat-composer-patterns`
- [Agent chat: recipient, work, drafts and results](#agent-work-presentation) — `agent-work-presentation`
- [Three chat presentations: document, messenger and work log](#chat-presentation-selection) — `chat-presentation-selection`

### 3. Accessibility and languages

- [Accessibility as a required check](#accessibility) — `accessibility`
- [Inclusive visual, auditory and motor access](#inclusive-design) — `inclusive-design`
- [Localization and language adaptation](#internationalization-localization) — `internationalization-localization`

### 4. Architecture and design systems

- [Event bus priorities and lifetime](#event-bus-coordination) — `event-bus-coordination`
- [Shared requests and data routing](#request-routing-data) — `request-routing-data`
- [Web security by design](#web-security-by-design) — `web-security-by-design`
- [Local component marketplace](#marketplace) — `marketplace`
- [Component foundations and priorities](#component-roadmap) — `component-roadmap`
- [Brand book: strategy and application](#brand-book) — `brand-book`
- [Design-system governance](#design-system-governance) — `design-system-governance`
- [Trend research and knowledge freshness](#trend-research) — `trend-research`
- [Choosing a layout grid by component purpose](#layout-grid-selection) — `layout-grid-selection`
- [Local grids, mixed scopes and inherited axes](#nested-layout-grids) — `nested-layout-grids`
- [Numeric grid inspection through MCP before image review](#layout-grid-inspection) — `layout-grid-inspection`
- [Golden Canon Grid — composition and checks](#grid-golden-canon) — `grid-golden-canon`
- [Responsive columns — composition and checks](#grid-columns) — `grid-columns`
- [Modular / Bento — composition and checks](#grid-modular) — `grid-modular`
- [Typography baseline — composition and checks](#grid-baseline) — `grid-baseline`
- [Spacing lattice — composition and checks](#grid-spacing) — `grid-spacing`
- [Rule of thirds — composition and checks](#grid-thirds) — `grid-thirds`
- [Single-column manuscript — composition and checks](#grid-manuscript) — `grid-manuscript`
- [Edge balance — composition and checks](#grid-edge-balance) — `grid-edge-balance`
- [Look / lead room — composition and checks](#grid-lead-room) — `grid-lead-room`
- [Central perspective — composition and checks](#grid-center-perspective) — `grid-center-perspective`
- [Phi grid — composition and checks](#grid-phi-grid) — `grid-phi-grid`
- [Golden triangle — composition and checks](#grid-golden-triangle) — `grid-golden-triangle`
- [Diagonal flow — composition and checks](#grid-diagonal-flow) — `grid-diagonal-flow`
- [Icon keylines — composition and checks](#grid-icon-keylines) — `grid-icon-keylines`

### 5. Assistants and application actions

- [One task, one action contract](#assistant-action-contract) — `assistant-action-contract`
- [Native applications in assistant ecosystems](#native-assistant-overview) — `native-assistant-overview`
- [macOS and Apple: App Intents](#apple-app-intents) — `apple-app-intents`
- [Windows: App Actions and activation](#windows-app-actions) — `windows-app-actions`
- [Android: AppFunctions and preview boundaries](#android-app-functions) — `android-app-functions`
- [Linux: D-Bus, desktop actions and adapters](#linux-assistant-interfaces) — `linux-assistant-interfaces`
- [Agent actions and human control](#agent-control) — `agent-control`
- [Human-first interfaces usable by agents](#human-first-agent-interfaces) — `human-first-agent-interfaces`
- [WebMCP from initial design](#webmcp-design) — `webmcp-design`
- [Components for people and assistants](#assistant-components) — `assistant-components`
- [Verify interfaces through semantic agent tasks](#agent-interface-verification) — `agent-interface-verification`
- [Verify and refresh assistant integrations](#assistant-integration-testing) — `assistant-integration-testing`

### 6. Validation and delivery

- [Hot gestures and interface load](#realtime-ui-load) — `realtime-ui-load`
- [Secure UI, API and WebMCP actions](#secure-web-actions) — `secure-web-actions`
- [Native platform and standalone delivery](#platform) — `platform`
- [Performance and resource ownership](#performance) — `performance`
- [Reproducible interface review](#evaluation) — `evaluation`
- [Measuring originality and quality](#creative-measurement) — `creative-measurement`
- [PPTX: editable and accessible production](#pptx-production) — `pptx-production`
- [Excel production, charts and refresh](#excel-dashboard-production) — `excel-dashboard-production`
- [Board export, JSON and Figma boundaries](#brand-interchange) — `brand-interchange`
- [Journey testing, retention and PPTX export](#journey-testing-retention) — `journey-testing-retention`
- [Validate and hand off presentations and analytical files](#artifact-validation) — `artifact-validation`
- [Golden Canon Grid: sandbox and PPTX verification](#golden-canon-validation) — `golden-canon-validation`

### 7. Data, presentations and documents

- [Choose web, PPTX or Excel](#artifact-format-selection) — `artifact-format-selection`
- [Tables, charts and trustworthy data](#data) — `data`
- [Explain numbers and uncertainty](#data-explanation) — `data-explanation`
- [Presentation narrative: assertion and evidence](#presentation-storytelling) — `presentation-storytelling`
- [Presentations: storyboard and composition recipes](#presentation-layout-recipes) — `presentation-layout-recipes`
- [Excel dashboard visualization levels](#excel-dashboard-levels) — `excel-dashboard-levels`
- [Persuasive copy: benefit, evidence and action](#persuasive-copy) — `persuasive-copy`

<a id="human-centered"></a>

## Human task and context

Define the person, task, environment, platform and success criteria before choosing components. Separate observed needs from assumptions. Prototype the important path, include recovery, and validate with appropriate users. Visual polish does not establish task success.

Rules: `scenario-first`, `human-feedback`.

Sources: [IDEO.org Design Kit — методы](https://www.designkit.org/methods.html), [Microsoft — human-centered agent design](https://learn.microsoft.com/ru-ru/agents/design-guidelines/human-centered-design).

### In practice

**Takeaway.** Design starts with the decision a person needs to make.

A manager opens a report before a meeting. They need to understand a delay, rather than inspect every feature.

**Before.** The screen lists product features without helping someone finish their task.

**After.** Start with the person's question, show relevant evidence and offer the next useful action.

Why the delay? → Dates and events → Choose an action

**Try it yourself**

- Describe one person and their situation
- Write the outcome in one sentence
- Test the path with a realistic task


<a id="information-architecture"></a>

## Information architecture

Group by meaning, give objects clear names and expose the current context. Preserve selection and reading position when navigating. Use progressive disclosure for detail; do not hide the action needed to complete the task. Test navigation without relying on color.

Rules: `information-hierarchy`, `recognition-over-recall`.

Sources: [Art. Lebedev Studio — навигация](https://www.artlebedev.ru/backstage/navigation-rules/), [NN/g — ten-usability-heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).

### In practice

**Takeaway.** Organize content around how people look for answers.

A service contains projects, reports and settings. The developer knows module names, while the visitor wants a project and its status.

**Before.** The menu exposes internal subsystems and scatters related sections.

**After.** Clear categories reduce guessing: choose the task area, then the relevant object.

Projects → Reports → Settings

**Try it yourself**

- Collect user questions
- Group related questions
- Ask someone to find a specific section


<a id="creative-direction"></a>

## Creative direction and visual language

Define brief, audience, tone, promise, content hierarchy and constraints. Explore meaningful alternatives across typography, color, composition and imagery, then explain the chosen direction. Record dated references and asset rights without copying branded graphics. Originality is relative to an explicit comparison corpus; attractiveness cannot waive accessibility or task failures.

**Direction card and scope.** For visual polish of an existing screen, condense the brief into five entries: product and person; 2–3 concrete character traits; domain associations; expressive content moments; one recurring recognizable detail if useful. For a scheduler: a dispatcher assigns shifts; precise and calm; timetables; readable workload; consistent time markers. Preserve approved identity. Let the audit choose local polish, a revised direction or no change; a sound screen needs no redesign. Ask whether replacing the product name leaves the concept equally suitable. This questions generic content and character, not familiar form conventions. See creative-measurement for findings and visual-interest-techniques for content emphasis.

**Attribution.** Adapted from Unslop by Damir Sokolovsky (@heydamir), CC BY4.0. AG replaces the original restrictions with conditional advice and retains approved identity and existing checks.

Rules: .

Sources: [Runco & Jaeger, creativity](https://www.tandfonline.com/doi/abs/10.1080/10400419.2012.650092), [Design Council, Double Diamond](https://www.designcouncil.org.uk/resources/framework-for-innovation/), [IDEO.org, Design Principles](https://www.designkit.org/methods/design-principles.html), [Pentagram, Isomorphic Labs](https://www.pentagram.com/work/isomorphic-labs/story), [Damir Sokolovsky — Unslop (SKILL.md)](https://github.com/heydamir/unslop/blob/main/skills/unslop/SKILL.md).

### In practice

**Takeaway.** Choose a visual idea before selecting expressive effects.

A service should feel current and trustworthy. A random collection of trends does not create a recognizable character.

**Before.** Glass, gradients and depth are added without a connection to the product or content.

**After.** Connect tone, type, material and graphics to one clear concept.

Character → Visual language → Working example

**Try it yourself**

- Describe the character in three words
- Choose relevant references
- Test the concept on a working screen


<a id="customer-journey-prototype"></a>

## Customer journey and screen-linked prototype

Start with a task and meaningful action/condition transitions. Prepare real AG compositions and pin exact document/revision/hash. The Studio command bus is shared by UI/MCP; use expected revisions and stable idempotency keys. Conditions are data, never executable code. Test branches, back/reset and actual screen changes. Release inactive preview resources. A graph walkthrough is not a representative usability study.

Rules: .

Sources: [NN/g — Journey Mapping 101](https://www.nngroup.com/articles/journey-mapping-101/), [Yale — Journey maps](https://usability.yale.edu/ux/discovery/create-user-representations/journey-maps).

### In practice

**Takeaway.** A journey connects a person's question to a screen and an observable outcome.

Someone chooses a service, enters details and receives confirmation. Each transition can include cancellation or failure.

**Before.** The diagram contains abstract stages without screens or transition conditions.

**After.** Link nodes to screens, name branch conditions and verify the outcome.

Choice → Check details → Confirmation

**Try it yourself**

- Define the task's start and end
- Include decline and recovery
- Walk through the exact prototype revision


<a id="layout"></a>

## Responsive layout

Place primary navigation at the leading edge and contextual detail at the opposite edge when needed. Adapt to available width without losing actions, safe areas or user state. Test narrow layouts, long labels, keyboard flow and 200% text. A genuinely two-dimensional table or graph may have its own scrolling; surrounding controls still need to reflow.

For new compositions first consider Golden Canon Grid; read golden-canon-grid and golden-canon-validation. Storyboards, text roles and slide recipes are in presentation-layout-recipes. Preserve readability, accessibility, truthful evidence and required host layouts; explain alternatives.

Rules: `resize-panels`, `layout-grid`, `content-priority`.

Sources: [Apple HIG — layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Android Developers — grids-and-units](https://developer.android.com/design/ui/mobile/guides/layout-and-content/grids-and-units).

### In practice

**Takeaway.** Separate content from navigation and supporting tools.

Someone reads an article on a large screen and continues on a phone. The main material should retain its priority.

**Before.** A narrow window compresses three columns and forces horizontal page scrolling.

**After.** Keep a readable content column and move navigation and tools into accessible disclosures.

Navigation → Content → Tools

**Try it yourself**

- Name the purpose of each region
- Choose narrow-screen priorities
- Check a long heading and enlarged text


<a id="hierarchy"></a>

## Visual hierarchy

Choose the first, second and third reading priorities. Use order, typography and restrained emphasis to express them. Reserve strong accents for a meaningful action or state. Repeated headings and equally loud panels weaken hierarchy. Enlarging text may reveal more detail, but must not hide a critical error or blocker.

Rules: `visual-priority`.

Sources: [Apple HIG — typography](https://developer.apple.com/design/human-interface-guidelines/typography), [Apple HIG — design-principles](https://developer.apple.com/design/human-interface-guidelines/design-principles).

### In practice

**Takeaway.** People should notice the main point before the details.

A report has a title, a result, a period and a detailed explanation. They should not all demand equal attention.

**Before.** Every line is large and bold, so the main conclusion disappears.

**After.** Choose one main statement, support it with explanation and put technical detail at a third level.

Main conclusion → Explanation → Details

**Try it yourself**

- Write the main statement
- Reduce the number of font weights
- Ask someone what they noticed first


<a id="grouping"></a>

## Semantic grouping and separators

Keep related controls closer together than independent groups. Prefer space and shared alignment; add a border only when it communicates membership. AG starts with8px within groups and16–24px between them, adjustable by context. Check grouping in monochrome and with enlarged text; remove redundant nested frames.

Rules: `grouping-proximity`, `avoid-container-noise`.

Sources: [Apple HIG — layout](https://developer.apple.com/design/human-interface-guidelines/layout), [NN/g — ten-usability-heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).

### In practice

**Takeaway.** Proximity explains relationships better than another border.

A screen contains report settings and actions on the finished file. Mixing them into one strip makes every command harder to interpret.

**Before.** Every item has a border, yet settings and actions remain mixed.

**After.** Group related items, name the group and leave a clear pause before another task.

Settings → Result → Actions

**Try it yourself**

- Identify meaningful groups
- Remove borders with no purpose
- Check which field each label belongs to


<a id="spacing"></a>

## Spacing and size scale

Choose a small documented spacing scale and align labels, content and actions to shared slots. Different spacing should explain different relationships. Treat numeric AG defaults as starting points, not platform laws. Allow text growth and retain usable pointer targets.

Rules: `target-size`, `spacing-scale`, `control-geometry`.

Sources: [Android Developers — grids-and-units](https://developer.android.com/design/ui/mobile/guides/layout-and-content/grids-and-units), [Apple HIG — layout](https://developer.apple.com/design/human-interface-guidelines/layout).

### In practice

**Takeaway.** Spacing explains which elements belong together.

A field label, hint and error should read as one group. The next field starts after a clearer pause.

**Before.** Equal gaps between every line hide relationships inside the form.

**After.** Use smaller gaps within a group and larger gaps between groups. The exact scale belongs to your system.

Label → Field → Next group

**Try it yourself**

- Choose a repeatable scale
- Separate inner and outer spacing
- Review neighboring forms together


<a id="typography"></a>

## Typography and readability

Use a coherent scale with restrained weights, readable line length and spacing. Prefer content-based height to clipping. Check long labels, code, digits,200% text and target-device rendering. Numeric sizes are AG defaults; screen and print/projected media need separate measurements.

Rules: `type-scale`, `text-resilience`.

Sources: [Apple HIG — typography](https://developer.apple.com/design/human-interface-guidelines/typography), [WCAG Understanding — resize-text.html](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html).

### In practice

**Takeaway.** Set type for reading as well as for a striking heading.

An article takes several minutes to read. Small type, long lines and tight leading make reading harder despite an attractive cover.

**Before.** Paragraphs span the entire window and headings barely differ from body text.

**After.** Limit line length, give paragraphs a steady rhythm and use a small set of text roles.

Heading → Body text → Caption

**Try it yourself**

- Test a substantial paragraph
- Enlarge text to 200%
- Check wrapping and clipping


<a id="color"></a>

## Semantic color and profiles

Map surface, text, muted text, accent, border, success, warning, error and focus to semantic roles. Test light/dark, increased contrast and interaction states. Evaluate actual text/background pairs with WCAG2 and signed APCA Lc at the real size/weight; AG ranking uses70% APCA and30% WCAG2, but an applicable AA failure remains a separate gate. APCA is advisory beta.

Composite transparency over a known background; measure gradients/images appropriately. Essential nontext control/state/graphic information follows applicable3:1 contrast conditions and exceptions; decorative borders are not all essential and inactive controls have exceptions. State and category meaning must survive without color.

Select colors for task, audience and sustained work. Brand identity is separate from statuses. Blue/information, green/success, amber/warning and red/error are possible product conventions, not universal psychological laws. Do not recolor an existing host merely to follow this list or claim color alone improves trust or conversion.

Rules: `contrast`, `color-profiles`, `apca-preference`, `semantic-color-roles`, `color-state-matrix`.

Sources: [Android Developers — color](https://developer.android.com/design/ui/mobile/guides/styles/color), [Apple HIG — color](https://developer.apple.com/design/human-interface-guidelines/color), [WCAG Understanding — contrast-minimum.html](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [APCA — minimum guidance](https://github.com/Myndex/SAPC-APCA/blob/master/documentation/minimum_compliance.md), [WCAG SC 1.4.11 — non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [Qazaqsoft — цвет в цифровых продуктах](https://qazaqsoft.kz/ru/blog/ui-ux-design/color-psychology).

### In practice

**Takeaway.** Color should express a role, rather than a convenient shade.

A system supports light and dark themes. A confirmation remains an action and an error remains an error.

**Before.** Green is used for success, selection and decoration without distinction.

**After.** Define text, background, accent and error roles. Support important states with words or shape.

Text → Surface → Accent

**Try it yourself**

- Name semantic roles
- Check actual foreground/background pairs
- Remove color-only meaning


<a id="color-palettes"></a>

## Palette selection: wheels, harmonies and tonal scales

**Separate harmony and readability.** A wheel proposes related hues; contrast evaluates an actual text/graphic against an actual adjacent background. Keep the host profile and semantic text/surface/accent/success/warning/danger/focus roles. The builder never applies a theme.

**Wheel approaches.** Monochromatic varies one hue’s lightness/chroma for quiet interfaces and surfaces. Analogous uses neighbors for cohesive groups, but similar tones may merge. Complementary pairs opposite hues for a dominant color plus restrained accent. Split complementary uses the neighbors of the opposite hue for more accent choice. Triadic spreads three hues around the wheel for expressive illustrations or categories after additional checks. Double complementary combines two opposite pairs; square spreads four hues equally. Rich schemes need restraint and hierarchy.

**AG heuristics.** ±30° analogous,180° complementary,150°/210° split,120°/240° triadic,0°/60°/180°/240° tetradic and0°/90°/180°/270° square are declared generator choices, not quality standards or a promise to match Adobe output. Preserve the base HEX. Gray, black and white have undefined hue; rotations remain degenerate rather than inventing chromatic complements. Return unique color counts.

**Choose the model explicitly.** HSL is a familiar RGB wheel, but equal lightness values are not perceptually equal. OKLCH separates perceptual lightness, chroma and hue. The same rotation produces different hues. Neither mode is a pigment RYB wheel. Emit opaque sRGB HEX. Out-of-gamut OKLCH points use bounded chroma reduction at fixed L/h; report gamutMapped. This is AG mapping, not CSS LocalMINDE. Check the actual quantized HEX.

**Tonal approach.** Material derives HCT tonal palettes and semantic roles from key colors. The strategy helps light/dark UI, but a hue rotation does not implement HCT. This tool’s separate tonal scale is always OKLCH, even for an HSL harmony: tonalScaleColorSpace=oklch. L steps10–90 are authored values, not HCT tone or proof of accessibility. Keep roles; test both themes, increased contrast and states. Charts additionally need categorical/sequential/diverging reasoning and non-color labels/shapes; a wheel does not establish CVD distinguishability.

**Concise checks.** Per swatch: as text on the selected surface; existing text on that fill; black/white ink suggestion; significant boundary against that surface. Ink selection keeps AA ahead of ranking. Normal text needs4.5:1, large text3:1 at actual size/weight. Never round a ratio before gating. Numeric nontext3:1 covers only the named adjacent surface, not the whole graphic/state. Decorative palette colors need not contrast with each other. Signed APCA Lc and role targets remain advisory; existing AG70/30 ranking cannot waive AA. fontGuidance explains sentinel999/777/666/5xx/4xx values; they are restrictions, not literal recommended999px fonts.

**Agent workflow.** Read color and this chapter. Call design_palette(base_color,background,foreground,color_space,harmonies,font_size,font_weight,role) for multiple candidate schemes, tonal scale, checks and matrices before screenshot recognition. Select semantic roles, then verify actual pairs through design_contrast/design_color_scheme. No autoapply: a preferred harmony never replaces the established host palette. The builder’s actual-pair controls make the context explicit. JSON export contains inputs/results without profile writes.

**Limits.** No universal harmony-compliance standard exists. Numeric results are candidates, not WCAG/APCA/HIG certification. Transparency, images, states, real fonts, AT, CVD, native, projectors and CMYK print require separate checks. A draft component and arithmetic pass do not qualify an application.

- [Adobe Color — harmony selection](https://color.adobe.com/create/color-wheel)
- [Björn Ottosson — Oklab](https://bottosson.github.io/posts/oklab/)
- [W3C CSS Color4 — color spaces and gamut](https://www.w3.org/TR/css-color-4/)
- [Android Developers — source colors and tonal roles](https://developer.android.com/design/ui/mobile/guides/styles/color)
- [WCAG1.4.3 — text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [WCAG1.4.11 — non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [WCAG1.4.1 — use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
- [APCA — font and contrast guidance](https://github.com/Myndex/SAPC-APCA/blob/master/documentation/minimum_compliance.md)


<a id="apple-shapes-color"></a>

## Apple-inspired shapes and color

For uniform inset circular arcs use max(0,outerRadius−inset), clamped to child size. This does not model every continuous/asymmetric/native shape. Concentricity describes nesting, not every neighboring control. Keep peer controls in a coherent family and choose fixed rounded rectangles, capsules or concentric variants by context. Preserve native geometry and use a fallback outside a suitable container.

Use semantic text/background/separator/accent/status roles and preserve host palettes. Test light/dark and standard/increased-contrast appearances against actual adjacent surfaces. Materials distinguish tools from content and require an opaque readable fallback; do not stack glass on every card. These are contextual AG adaptations, not a replica or complete platform qualification.

Rules: `apple-concentric-corners`, `apple-neighbor-shapes`, `apple-shape-variants`, `apple-semantic-colors`, `apple-color-appearances`, `apple-material-layer`.

Sources: [concentric](https://developer.apple.com/documentation/swiftui/edge/corner/style/concentric), [https://developer.apple.com/videos/play/wwdc2025/356/](https://developer.apple.com/videos/play/wwdc2025/356/), [color](https://developer.apple.com/design/human-interface-guidelines/color), [materials](https://developer.apple.com/design/human-interface-guidelines/materials).

### In practice

**Takeaway.** Shape and color should express a control's role in context.

A button sits in a panel beside a related control. Radii and surfaces should feel related.

**Before.** Arbitrary radii appear beside decorative glass on every layer.

**After.** Choose shape families by role. Use geometric relationships for uniform circular insets, not a universal number.

Surface → Inset control → Related family

**Try it yourself**

- Check each surface's role
- Compare neighboring controls
- Review light and dark appearances


<a id="composition-optics"></a>

## Composition and optical balance

Read design_brief and current applicable requirements. Check real visible geometry and target bounds independently. Use meaningful groups, shared slots and consistent comparable sizes; inferred proximity is advisory, not semantic truth. Optical corrections belong to an icon family with glyph, scale, offsets, reason and tested sizes, not arbitrary container shifts. Do not invent universal circle/triangle enlargement ratios. Use actual snapshots and compatible environments; geometry scores do not establish human perception, AT or complete readiness.

For new compositions first consider Golden Canon Grid; read golden-canon-grid and golden-canon-validation. Storyboards, text roles and slide recipes are in presentation-layout-recipes. Preserve readability, accessibility, truthful evidence and required host layouts; explain alternatives.

Rules: `layout-semantic-groups`, `layout-group-spacing`, `layout-alignment-anchors`, `layout-control-slots`, `layout-primary-flow`, `layout-surface-restraint`, `optical-shape-balance`, `optical-correction-record`, `optical-no-universal-ratio`, `optical-family-consistency`.

Sources: [https://www.nngroup.com/articles/gestalt-proximity/](https://www.nngroup.com/articles/gestalt-proximity/), [forms](https://www.carbondesignsystem.com/building-blocks/core/patterns/forms), [resize-text.html](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [avoid-multi-column-forms](https://baymard.com/research-articles/avoid-multi-column-forms), [https://www.nngroup.com/articles/common-region/](https://www.nngroup.com/articles/common-region/), [iconography](https://atlassian.design/guidelines/product/foundations/iconography).

### In practice

**Takeaway.** Shared alignment and visual weight help a group read as a whole.

A row contains a field, a number and a button. Equal rectangles do not guarantee visual balance.

**Before.** Labels, fields and actions use conflicting axes, and arbitrary tweaks hide the cause.

**After.** Define roles and alignment anchors before checking small optical adjustments across the component family.

Shared axis → Visual weight → Hit target

**Try it yourself**

- Mark geometric bounds
- Compare visual weight
- Record the reason for each adjustment


<a id="golden-canon-grid"></a>
## Golden Canon Grid: construction and composition priority

Golden Canon Grid organizes a carrier through diagonals and their intersections. It is not a phi grid or Fibonacci spiral. AG diagonal core v1 draws both diagonals of the full rectangle and its left/right/top/bottom halves. Sorted endpoint/intersection projections are 0, 1/5, 1/4, 1/3, 2/5, 1/2, 3/5, 2/3, 3/4, 4/5, 1. Crossing the resulting axis guides defines interior control points. A guide intersection need not itself lie on intersecting diagonals. This is an explicitly reduced AG construction, not a reproduction of BONT V3 assets.

By the owner's requested policy, first consider this grid for new UI and PPTX composition. Preselect meaningful anchors for the headline, evidence and image areas. Choose a few power lines rather than filling every cell. Preserve required host layouts, brand, accessibility, readable content and truthful data. Document a specific reason when an alternative composition is more appropriate.

The grid governs large-scale composition; text baselines, inner padding and optical balance need separate inspection. Do not switch anchors after seeing a miss simply to manufacture a hit. Compare alternatives at real dimensions and the intended viewing distance. Matching geometry does not establish beauty, comprehension or conversion.

### In practice

Choose meaningful anchors before measuring grid fit.

A slide contains a title, chart and explanation that need a coherent reading path.

Random positions are followed by a search for convenient matches.

Headline and evidence anchors are chosen first; deviations have reasons.

- Construct carrier and half-rectangle diagonals
- Preselect power lines and meaningful anchors
- Check readability and explain exceptions

Sources: [Obys — Grids](https://grids.obys.agency/), [sfi0zy — Golden canon grid: страшилка для фронтендеров](https://habr.com/ru/articles/479580/)

<a id="layers"></a>

## Layers, surfaces and overlays

Use named layer tokens for content, sticky tools, nonmodal overlays and modal dialogs. Materials are optional: provide an opaque readable fallback for transparency preferences and busy backgrounds. A CSS imitation does not establish native material parity.

Choose dialog dimensions by content: compact confirmation, larger evidence reader with independently scrolling content and reachable actions, or an anchored nonmodal hint. Avoid modal chains; preserve return context, unsaved input and focus. Anchored widgets follow their source during scroll/zoom, flip within available space and close or explicitly lose context when the source disappears. Keep the target and cursor visible; use an in-flow fallback when a hint cannot fit.

A workspace board has one viewport, one transformed scene and separate controls. Blank-space drag and Space+drag pan; wheel pans; Ctrl/Command+wheel zooms around the pointer. Keep card inputs intact, support keyboard pan/zoom/Fit, release gestures on Escape/blur/cancel, and preserve camera on resize/refresh. Board appearance and camera are local preferences with a safe storage failure path. Convert connection geometry using scene scale; coalesce one animation frame and dispose resources. These are AG policies, not platform requirements.

**Carbon / Fluent2 / Spectrum · conditional AG guidance (2026-10-28).** Inspect applicability and exceptions; vendor capability does not prove AG implementation.

**Dialogs · enterprise-dialog-task.** Use modal for a bounded interrupting task and nonmodal for an ongoing helper. Keep title/actions reachable while scrolling and return focus to the trigger. Do not nest dialogs. Vendor dismissal/footer conventions differ; choose safe cancellation explicitly for unsaved input. AG: popup. Check: initial focus and modal trap; Escape/cancel without data loss; focus return; narrow scrolling.

Rules: `layer-contract`, `material-restraint`.

Sources: [Apple HIG — materials](https://developer.apple.com/design/human-interface-guidelines/materials), [Apple HIG — layout](https://developer.apple.com/design/human-interface-guidelines/layout).

### In practice

**Takeaway.** A new layer should represent a distinct task or interaction state.

An object editor opens over a list. Someone should understand their context, the effect of changes and how to return.

**Before.** Several nested panels appear equally important and obscure the way back.

**After.** Tie the surface to its context, provide a clear close action and return focus to its trigger.

Workspace → Context panel → Confirmation

**Try it yourself**

- Explain why the layer exists
- Test keyboard opening and closing
- Remove decorative surfaces


<a id="navigation"></a>

## Navigation, toolbar and panels

### Place commands by scope

AG policy, 2026-10-31. Scope determines location; frequency determines prominence; recognition determines icon-only versus labelled presentation. These are separate decisions. This refines “frequent commands in the native toolbar”; it does not move every frequent component action there.

| Scope | Primary location | Examples and conditions |
|---|---|---|
| Application | Native application menu; stable app navigation | Settings, help, section navigation. An optional frequent shortcut does not justify an otherwise empty row |
| Window/workspace | Real native window toolbar where supported; one web header otherwise | Back/Forward, project/document picker, panel toggles, workspace search; stable unambiguous target |
| Document/view | Its header; native toolbar only for an unambiguous active document | Save document or refresh view; split panes must not silently change the target |
| Component/selected object | Component header, compact toolbar or adjacent object actions | Copy code, local search, wrap, chart zoom, table filter, row actions |
| Rare secondary command | Labelled overflow belonging to the same scope | Keep component and window commands in named groups |
| Consequential confirmation | Near the affected object, with visible wording and consequences | Do not turn deletion or access approval into an unexplained icon |

### Native promotion gate

Promote only when scope/target is clear, persistent access is useful, a real platform toolbar supports the control, and the title/window drag area remains usable. Use one command identity/handler and owner of state. Synchronize required enabled, hidden, selected/toggle, pending and target state. Unsupported semantics keep their web control.

Hide a web action only after the current window/document confirms that exact command is represented and operable. A native-app flag or toolbar presence is insufficient. Invalidate confirmation on reload/bridge loss and restore fallback. Keep browser and unsupported-platform access. Verify keyboard names/states, native/content focus, narrow width,200% text and themes; unknown is not PASS.

### Removing a redundant row

Map every old item: `commandId → scope/target → destination → state → fallback`. Remove the row only when every command remains reachable and no unique context/filter/status belongs there. Move remaining local controls into their component and rare global controls into an accessible menu. Remove leftover height/dividers/margins and hidden focusable duplicates.

A native menu and toolbar may intentionally expose the same command and shortcut. That does not justify an identical second HTML toolbar. A second content row is justified by a distinct task, such as table filters, formatting controls or canvas tools. Preserve their meaningful context.

Apply the icons chapter: named real controls, visible focus, full hit targets, selected states and touch alternatives. Familiar editor actions may default to compact with `toolbarMode: "labeled"` available.250ms pointer dwell is a configurable AG default, not WCAG. Reuse web bindTooltip/inline-help lifecycle; native tooltip timing stays platform-owned unless supported. Keep visible text for ambiguous/consequential commands.

Measure rows/header height, unreachable commands(target0), duplicate same-scope controls and task reachability. Saved pixels do not prove faster task completion. Measure success/time/errors before claiming usability improvement; no universal icon/row count is imposed.

Apple HIG supports frequent, logically grouped toolbar commands without overcrowding; W3C covers names/roles/states and hover/focus conditions. The scope matrix and migration gate are authored AG policy. This is not adapter capability, native/AT qualification or installation evidence.

- [Apple HIG — Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)
- [W3C — Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)
- [W3C — Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)


Use a contextual section/entity title and logical command groups. Preserve a stable leading icon rail and real back/forward availability. Put supported desktop commands in the real native toolbar with a capability-checked browser fallback. Resizable panels have an inner-edge handle and keyboard alternatives. Do not create an unused side panel for symmetry; preserve selection and scroll.

**Carbon / Fluent2 / Spectrum · conditional AG guidance (2026-10-28).** Inspect applicability and exceptions; vendor capability does not prove AG implementation.

**Tabs and activation · enterprise-tab-activation.** Tabs group related sections. Use automatic activation for fast panels and manual activation for slow panels; arrows move focus, Enter/Space activates. Avoid hiding side-by-side comparisons behind tabs. A view-mode toggle may fit segmented-choice; a sequence of required steps is not a tablist. AG: tabs, segmented-choice. Check: manual/automatic behavior; selected versus focused; no clipped labels at narrow width.

**Trees and long labels · enterprise-tree-navigation.** Separate expansion, selection and action. Reveal a truncated label on focus and offer adjustable width for deep hierarchies. Do not claim Spectrum drag/drop or external-drop support for AG; inspect the actual tree API and keyboard alternatives. AG: tree, resizable-panel. Check: expand versus select; full label via focus; deep narrow hierarchy; large-tree loading.

Rules: `leading-sidebar`, `toolbar-hierarchy`, `contextual-window-title`, `predictable-navigation`.

Sources: [Art. Lebedev Studio — навигация](https://www.artlebedev.ru/backstage/navigation-rules/), [Apple HIG — sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars), [Apple HIG — toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars).

### In practice

**Takeaway.** Navigation should explain where someone is and where they can go.

Someone navigates from projects into a report. They need context and a predictable way back.

**Before.** The heading repeats the application name and the current section is unmarked.

**After.** Show the current object, active section and return path. Preserve these on narrow screens.

Projects → Project → Report

**Try it yourself**

- Check the current object's name
- Mark the selected section
- Navigate forward and back with a keyboard


<a id="icons"></a>

## Icons and visible labels

Use icon-only for a familiar action with a clear object in a stable context. Prefer visible text for unfamiliar/domain-specific commands, meaningful permissions and ambiguous consequences; icon+text can improve scanning without hiding meaning. A primary composer Send may use a familiar icon after context checks. Rare secondary commands may become labelled menu items, while essential actions remain available. View choices need visibly selected named options. Density alone is insufficient.

Label form and visual emphasis are separate choices. Quiet auxiliary icons retain hover, focus, pressed/expanded, busy and disabled states. Keep a consistent optical family; do not shrink targets to glyphs or remove group padding. AG starts with20px glyphs,32px compact targets and44px coarse-pointer targets; these are product defaults. Check actual WCAG2.5.8 target size/spacing exceptions separately.

Use a real button/link, a localized action name and decorative SVG hidden from AT. Tooltips supplement names; HTML title alone does not prove keyboard/touch usability. Custom hover/focus content must meet its applicable dismissal, hoverability and persistence conditions. Stable-label toggles use aria-pressed; ordinary commands may instead change their action label. Test RU/EN, touch, keyboard, forced colors,320CSSpx and200% text. Record recognition as unknown until tested; preserve user-approved host choices.

**Carbon / Fluent2 / Spectrum · conditional AG guidance (2026-10-28).** Inspect applicability and exceptions; vendor capability does not prove AG implementation.

**Tooltip and contextual help · enterprise-help-surface.** Offer brief supplemental tooltips on hover and focus. Keep essential requirements visible; long or interactive help needs another surface. A tooltip is not the only button name; hover does not prove touch support. Check placement and the target remain visible. AG: inline-help. Check: focus/Escape/hover; touch alternative; viewport collision; no hidden mandatory instructions.

Rules: `icon-consistency`.

Sources: [Apple HIG — Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars), [W3C APG — Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/), [WCAG2.2 Understanding — Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html), [WCAG2.2 Understanding — Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

### In practice

**Takeaway.** An icon helps familiar actions; a label explains ambiguous ones.

A chat contains search, resume and approval actions. Their familiarity and consequences differ.

**Before.** Every command is replaced with a symbol that requires guessing.

**After.** A familiar search can use an icon with an accessible name. Keep visible text for approval and recovery.

Search → Resume response → Approve

**Try it yourself**

- Check whether the action is recognizable
- Consider the cost of a mistake
- Check name, focus and touch target


<a id="actions"></a>

## Actions and command priority

Give each semantic group at most one primary action. Use a verb and object and prevent duplicate activation while pending. Provide undo or a clear exit where possible; explain irreversible consequences and unavailable commands. Approval does not authorize unrelated actions or merges. Apply the icons decision matrix rather than hiding captions by breakpoint. Test anticipated outcome, Enter/Space, focus and narrow wrapping.

**Carbon / Fluent2 / Spectrum · conditional AG guidance (2026-10-28).** Inspect applicability and exceptions; vendor capability does not prove AG implementation.

**Button emphasis · enterprise-button-emphasis.** AG keeps one leading action per semantic group. Label the outcome, prevent duplicate submission and expose pending status. Do not copy variant names blindly: Spectrum primary is medium emphasis and accent is stronger; Fluent primary marks the leading action. AG: button. Check: relative visual emphasis; Enter/Space and focus; pending duplicate request; icon name and recognition.

**Toolbar and menu · enterprise-toolbar-overflow.** Group toolbar commands by task near their context. Use labelled overflow for constrained toolbars while retaining the leading command. A toolbar non-wrap convention is not a ban on wrapping form controls. Separate destructive actions and preserve keyboard order. AG: menu, button, window-toolbar. Check: narrow overflow reachability; toolbar accessible name; focus after overflow close; destructive grouping.

Rules: `action-outcome`, `undo-recovery`.

Sources: [Apple HIG — buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), [NN/g — ten-usability-heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).

### In practice

**Takeaway.** Within a group, emphasize the action that leads to the outcome.

After editing, someone can save, delete or cancel. Those actions should not all look equally primary.

**Before.** Several strong buttons compete for attention and a destructive action looks routine.

**After.** Emphasize the primary action, quiet secondary ones and explain deletion consequences.

Save → Cancel → Delete

**Try it yourself**

- Name the group's primary action
- Use specific verbs
- Check recovery after a mistake


<a id="feedback"></a>

## States and recovery

Show the current operation and next useful step. Mark waiting honestly; success follows a confirmed response. Explain errors without clearing valuable context or automatically retrying an ambiguous send. Keep unavailable metrics unknown, not zero. Provide accessible status messages without moving focus unnecessarily.

**Carbon / Fluent2 / Spectrum · conditional AG guidance (2026-10-28).** Inspect applicability and exceptions; vendor capability does not prove AG implementation.

**Notifications and errors · enterprise-message-scope.** Keep field errors inline and surface-wide problems in persistent notice/state-panel. Toasts suit noncritical transient outcomes, not mandatory recovery. Wrap important messages and offer recovery. Do not import Fluent toast timers, stack limits or assertive defaults as universal AG rules. AG: notice, state-panel, field. Check: message scope; recovery remains available; wrap at200%; live-region interruption rate.

**Empty states · enterprise-empty-reason.** Distinguish first use, no matches, missing permission and fetch failure. Put an explanation and suitable next step in the empty region. Do not turn every case into zero or the same illustration. In compact regions useful text outranks decoration. AG: empty-state, state-panel. Check: reason-specific copy/action; reset filters versus retry; no fabricated zero; repeated dashboard failures.

**Loading and progress · enterprise-loading-truth.** Use skeleton for expected new content structure and inline busy feedback for an operation. Show percentages only from measured work; otherwise use indeterminate. Preserve existing content during refresh with stale/busy state. Avoid skeletons for toasts/menus and untested vendor timing thresholds. AG: loading-indicator, progress, skeleton, state-panel. Check: slow/error/retry; real measured progress; existing content retained; reduced motion.

Rules: `honest-states`, `state-recovery`.

Sources: [Apple HIG — design-principles](https://developer.apple.com/design/human-interface-guidelines/design-principles), [NN/g — ten-usability-heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/), [WCAG Understanding — status-messages.html](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

### In practice

**Takeaway.** Show what is happening and what someone can do next.

A request takes time, then returns results, an empty list or an error. All of these outcomes belong in the interface.

**Before.** Loading looks like an empty screen and an error merely says something went wrong.

**After.** Distinguish waiting, results and recovery. Do not invent a percentage when progress is unknown.

Loading → Result → Retry

**Try it yourself**

- Sketch every request outcome
- Name the recovery action
- Test retry without losing data


<a id="async-components"></a>

## Async components: state and ownership

**When to use.** Use `async-boundary` / `createAsyncBoundary` (core0.23.0+) when a card, data panel, preview or lazy import asynchronously returns an owned component. Ordinary synchronous UI needs no boundary. This is AG interpretation; React and TanStack document their own mechanisms, not implemented AG capabilities.

**Ownership.** `load({signal,key})` returns a detached same-document `{element,dispose}` or `null`. Until return, the loader owns partial resources: consume signal in fetch and clean partial construction in finally. On return the boundary owns disposal. Abort is cooperative and cannot stop arbitrary promises or CPU computation. Avoid retaining heavy objects in a permanently pending promise.

**Ordering and identity.** Every run gets a fresh AbortController and generation. Late resolve/reject cannot replace current UI; a valid late component is disposed once. Keep the previous DOM only for a refresh with the same key. Change key for another object/user/tenant; the previous content is removed immediately. Hosts protect unsaved forms. Never transfer shared connected DOM or a foreign Document.

**Feedback.** Distinguish initial loading, background refreshing, empty, error, timeout and cancelled. Content becomes aria-busy immediately; a polite status lives outside that subtree. Status never steals focus; removing focused content falls back to the named region. Localized generic errors hide raw server details. Locale switches retain user DOM. Configurable defaults150ms visual delay,15000ms deadline and96px placeholder are AG choices, not source mandates or realtime guarantees. No fake progress or automatic retries.

**Window composition.** A synchronous render-window factory returns the async boundary as `{element,dispose}`. Eviction disposes/aborts; re-entry starts a fresh load. Hosts own data/cache/bounded snapshot/restore and dirty-input protection. Do not double-wrap windowed content. Essential document text, print, SEO and browser Find need eager content or a tested alternative.

**Machine contract.** Read immutable `.state`: status,key,requestId,hasContent,refreshing,stale,errorKind. `run({key?,load?})` returns that operation’s outcome: ready/empty/error/cancelled/superseded/disposed. cancel is quiet; dispose is idempotent; timeout settles waiting even if the loader ignores signal. Retry is explicit and appropriate only for a safe/idempotent load. Hosts own mutations, shared caching, transport, authorization, polling, retries/backoff and SSR.

**Verify.** Slow A then fast B; late fulfillment/rejection after cancel/dispose; ignored signal; deadline and timer cleanup; throwing/reentrant cleanup/error hooks; key change; refresh failure preserving DOM; empty; manual retry; keyboard/focus; RU/EN/custom dictionaries; narrow/200% text; reduced motion; render-window eviction. Inspect actual DOM/timers and state before image review. Draft/test metadata does not qualify native/AT or production performance.

- [MDN AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [React useEffect cleanup](https://react.dev/reference/react/useEffect)
- [TanStack Query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)
- [TanStack background fetching](https://tanstack.com/query/latest/docs/framework/react/guides/background-fetching-indicators)
- [W3C status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)


<a id="forms"></a>

## Forms, validation and input

Use persistent labels, appropriate controls and clear required/optional distinctions. Validate with a specific correction near the relevant field; preserve input after errors. Group related fields and keep keyboard order meaningful. Use the specialized funnel/operational guidance for their different completion and recovery goals.

**Carbon / Fluent2 / Spectrum · conditional AG guidance (2026-10-28).** Inspect applicability and exceptions; vendor capability does not prove AG implementation.

**Text input and textarea · enterprise-text-entry.** Use field for a short value and textarea for paragraphs. Size for expected input; keep a visible label and useful helper text. Avoid redundant placeholder/helper copy. Carbon defaults to resizing while Fluent opts in; AG chooses vertical resize for chart context. AG: field, textarea. Check: label/control association; multiline paste and native reset; narrow and200% text; readonly remains selectable.

**Select or combobox · enterprise-selection.** Use select for a short closed list and combobox for searchable long lists. Filtering does not by itself authorize free-form values. AG dropdown-select is single-choice and closed-value; multiselect/freeform require a separately checked contract. AG: select, dropdown-select. Check: keyboard open/select/Escape; no-match versus server failure; selected value after filtering.

**Checkbox, radio and switch · enterprise-choice-commit.** Use checkboxes for independent choices, radio for one of a group, and a switch for an immediate setting. Make commit timing explicit. This is Fluent guidance, not a ban on immediate preview checkboxes. Do not turn consent into a switch; no standalone AG switch is claimed. AG: segmented-choice, field. Check: commit timing; group name and selected state; mixed parent state; rollback on failed save.

Rules: `form-labels`, `form-error-recovery`.

Sources: [WCAG Understanding — labels-or-instructions.html](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html), [WCAG Understanding — error-identification.html](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html).

### In practice

**Takeaway.** Each field needs a reason, a label and a way to fix mistakes.

Someone fills an application and mistypes an email address. Help them fix it while preserving other answers.

**Before.** A placeholder replaces the label and a submission error offers no correction.

**After.** Keep a visible label, a relevant example and a specific nearby error.

Email address → Example input → Hint

**Try it yourself**

- Justify each field
- Navigate the form with Tab
- Test an error and resubmission


<a id="form-quality-common"></a>

## Common form quality

Use persistent names, sensible defaults, meaningful grouping, keyboard order and corrections near the error. Preserve drafts and provide explicit outcomes and pending states. Request only necessary information. This common baseline complements the specialized funnel and operational patterns; validate accessibility with the actual target controls.

Rules: .

Sources: [W3C WAI Forms](https://www.w3.org/WAI/tutorials/forms/), [GOV.UK Question pages](https://design-system.service.gov.uk/patterns/question-pages/), [Carbon Forms](https://www.carbondesignsystem.com/building-blocks/core/patterns/forms).

### In practice

**Takeaway.** A good form explains input, preserves answers and supports correction.

Someone begins an application, makes a mistake and returns later. Quality depends on the whole path.

**Before.** Only successful submission of ideal data is tested.

**After.** Verify input, errors, waiting, preservation and outcome separately.

Input → Validation → Recovery

**Try it yourself**

- Check required and optional input
- Simulate a server error
- Continue after recovery


<a id="forms-business"></a>

## CRM and sales forms

Read current detailed requirements before implementation. A draft asks for the minimum needed now; important transitions validate the fields needed for that transition. Record each field purpose, necessity, grouping, label and correction. Avoid premature mandatory fields, unexplained disabled actions and data loss.

Main or ambiguous commands retain visible names; familiar icon-only actions require clear scope and recognition evidence. One primary action per semantic group, localized accessible names including the visible label, sufficient target/spacing and supplementary tooltip behavior are separate checks. Validate keyboard, touch and error recovery against the actual current policy; optics do not certify accessibility.

Rules: `form-field-purpose`, `form-label-persistence`, `form-constraints-before-error`, `form-control-task-fit`, `form-error-recovery-extended`, `form-reuse-known-data`, `form-submit-integrity`, `form-draft-stage`, `action-label-choice`, `action-primary-per-group`, `action-name-state`, `action-tooltip-supplement`, `action-target-size`.

Sources: [forms](https://www.carbondesignsystem.com/building-blocks/core/patterns/forms), [https://design-system.service.gov.uk/patterns/question-pages/](https://design-system.service.gov.uk/patterns/question-pages/), [https://www.w3.org/TR/WCAG22/](https://www.w3.org/TR/WCAG22/), [https://www.w3.org/WAI/tutorials/forms/labels/](https://www.w3.org/WAI/tutorials/forms/labels/), [https://www.w3.org/WAI/tutorials/forms/notifications/](https://www.w3.org/WAI/tutorials/forms/notifications/), [redundant-entry.html](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html), [iconography](https://atlassian.design/guidelines/product/foundations/iconography), [https://www.nngroup.com/articles/icon-usability/](https://www.nngroup.com/articles/icon-usability/), [usage](https://atlassian.design/components/button/usage), [usage](https://atlassian.design/components/icon/usage), [content-on-hover-or-focus.html](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html), [target-size-minimum.html](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

### In practice

**Takeaway.** A business form helps someone complete an operation and continue working.

An employee enters customer details and saves a draft. Repeated-entry speed and protection from data loss matter.

**Before.** The form demands unnecessary fields, clears input after errors and hides save.

**After.** Separate required and optional input, preserve context and show the operation's outcome.

Required fields → Optional details → Save

**Try it yourself**

- Justify required fields
- Test drafts and server errors
- Test repeated keyboard entry


<a id="form-funnel"></a>

## Marketing funnel forms

Ask only for the information needed at the current funnel step, explain benefit and why data is requested, and keep a clear next action. Preserve informed consent, fair alternatives and error recovery. Do not invent urgency, testimonials or conversion evidence. Validate with representative task outcomes rather than assuming fewer fields always improves business results.

Rules: .

Sources: [Baymard Checkout UX](https://baymard.com/blog/checkout-flow-ux-optimization), [GOV.UK Question pages](https://design-system.service.gov.uk/patterns/question-pages/), [W3C WAI Forms](https://www.w3.org/WAI/tutorials/forms/).

### In practice

**Takeaway.** Conversion matters when people understand the offer and choose freely.

A visitor leaves contact details for a consultation. They should know what they receive and what happens next.

**Before.** The button promises an immediate result while the form quietly adds unrelated messages.

**After.** Explain the benefit and next step, request necessary information and make consent clear.

Offer → Necessary data → Next step

**Try it yourself**

- Check that the outcome matches the promise
- Remove unjustified fields
- Assess lead quality as well as submissions


<a id="form-operations"></a>

## Operational and technical forms

Expose required context, precise values, safe defaults, validation and visible consequences. Support keyboard-efficient expert workflows without hiding field meanings. Keep destructive actions separated, preserve drafts on failure and distinguish apply, save and execute. Measure accuracy and recoverability as well as speed; technical density is not permission for inaccessible controls.

Rules: .

Sources: [Carbon Forms](https://www.carbondesignsystem.com/building-blocks/core/patterns/forms), [W3C WAI Forms](https://www.w3.org/WAI/tutorials/forms/), [GOV.UK Question pages](https://design-system.service.gov.uk/patterns/question-pages/).

### In practice

**Takeaway.** An operational form should clarify consequences before execution.

An operator changes system settings. A mistake can affect other objects, so speed is not the only criterion.

**Before.** The main command runs without a clear object, scope or recovery path.

**After.** Show context, permissions, change scope and expected result before approval.

Context → Change → Approval

**Try it yourself**

- Name affected objects
- Check access and consequential actions
- Show the result and recovery path


<a id="cards"></a>

## Code and task cards

Lead with object, state and next useful step. Keep IDs and secondary metadata quieter and group related details. Long evidence, history and results belong in deliberate disclosure. A card preview is not its full record. Avoid nested interactive targets; preserve focus, selection and host-owned actions.

Rules: `card-scan-order`, `card-progressive-detail`.

Sources: [Apple HIG — layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Material 3 — cards](https://m3.material.io/components/cards/overview).

### In practice

**Takeaway.** A card groups one object with its immediate actions.

In a task list, someone needs the title, state and next step. Each card should not become a separate control panel.

**Before.** All metadata is equally prominent and secondary commands dominate the content.

**After.** Present object identity, meaningful state and action in a stable order.

Title → State → Action

**Try it yourself**

- Define the card's unit
- Remove repetitive metadata
- Test a list of long titles


<a id="catalog-item-presentation"></a>

## Product and component presentation

**Purpose.** A listing card supports comparison and opening a promising item. Detailed presentation explains use, evidence and limits. Do not squeeze the entire pitch into a tile or treat visual emphasis as trust.

**Decision information.** Give a recognizable name/media or working preview, a concise purpose and a consistent order of decisive facts. Retail may need contextual price/variant/unit, alternatives and a real rating with review count. Components instead need version, package, platform, compatibility and qualification status. Registered usage is not a quality rating. Unknown is not zero and stable metadata is not qualification. These domain mappings are AG interpretation, not user research on our catalogue.

**Presentation recipe.** Adapt a proposed sequence: identity/cover; use and benefit; evidence; scale/specification/compatibility; variants/contents/limits; transparent conditions and next action. Extra media should reveal relevant properties, not meet a universal picture count. A component may need one working preview plus its contract. Keep decisive information accessible as text, not only baked into imagery.

**Marketplace constraints.** The main image should make the actual item understandable; further media can explain details/scale/use. Recheck the selected platform/category’s current primary rules before publishing. Wildberries’ photo/infographic requirements are platform-specific and do not prescribe AG card height, aspect ratio or column count. Moderation/ranking rules change; no sales or admission claim is made.

**Content is separate from layout.** createCatalogCard chooses no grid, height, order or columns. Preserve AG Pinterest/masonry natural heights, DOM order, wide board card, navigation rail and one render-window owner per expensive preview. Consistent facts/actions do not require equal-height tiles or clipped information. Tables can serve strict row comparison, but this guidance does not replace the established catalogue layout.

**Semantics/ownership.** Use article and a context-appropriate heading. The title is a native link or button with separate actions; never nest controls inside a whole-card button. Useful media needs alternatives; interactive media owns names/keyboard behavior. The detached media DOM slot is explicitly borrowed: the host owns resources, async/dispose and removal. Metadata updates do not recreate it. The factory releases only its own handlers/locale subscription.

**Verify.** Compare decisive fields within a category; label fixture data. Check title/link/actions, alt, contextual price, rating/count, unknowns, long text, keyboard/focus, narrow/text2x and both themes. Measure actual contrast. Verify open/back position/filter retention, preview interaction and disposal. A draft/library pass is not consumer qualification, user research, AT/native or whole-WCAG conformance.

- [Baymard — essential listing information](https://baymard.com/research-articles/product-listing-information)
- [Shopify — product media](https://help.shopify.com/en/manual/products/product-media)
- [Wildberries — current photo guidance](https://seller.wildberries.ru/instructions/ru/ru/material/item-photo-rules-recommendations-and-common-mistakes)
- [W3C — semantic content](https://www.w3.org/WAI/tutorials/page-structure/content/)


<a id="catalog-discovery"></a>

## Catalog search and selection

**Search supports choice.** Test exact identity, type, feature, use case, symptom, compatibility, abbreviation/symbol and help intent. Component examples include createTree, tree, multiline input, compare values, release offscreen previews, Web, textarea and contrast guidance. This is an intent test set, not a promise that the existing lexical engine understands every case. Distinguish related recommendations from evidenced compatibility.

**Transparent retrieval.** Index meaningful names/purpose/attributes/IDs as structured data. Add synonyms, spelling and compatibility only with explicit examples and relevance evaluation. Scope suggestions must not silently drop constraints; help queries should reach documentation. The new card/controls do not replace AG indexing, sorting or MCP search semantics.

**Filters/sort.** Use domain-relevant attributes and units. Show applied conditions and individual/all removal even when the panel is collapsed. Separate draft from committed selections. Instant updates fit simple cheap refinement; batch Apply fits several conditions or slower sources. Sorting is not filtering; usage/popularity/advertising is not relevance or quality. Do not invent counts or unsupported backend sort modes.

**States.** Distinguish empty inventory, no matches, loading, error and stale previous results. A valid query with no matches is not an input validation error. Offer specific recovery. Retain old cards during loading/failure only with explicit staleness; fence late results. A concise polite count/status belongs outside busy results, never on the whole grid. Do not steal focus after every reply.

**Contract.** createCatalogSearchControls supplies native search/checkbox/select/submit, submit|instant mode, draft/applied values, chips/reset/sort and revision. onChange(request,reason) delegates debounce/transport/AbortSignal/index to the host. report({revision,status,total}) ignores retired revisions; update(value) silently restores context and invalidates old receipts. IME composition is not submitted early; Enter is explicit. Callback errors use generic feedback. dispose removes owned listeners/locale subscription.

**History/scale.** The host owns URLs/back/scroll/selection/paging; controls never route or rearrange cards. Distinguish server paging, show more and windowed previews, and label partial counts. Preserve AG Pinterest/masonry and its rail. Reset does not change palettes or usage evidence.

**Verify.** Use known positive/negative fixtures per supported intent. Check declared AND/OR filter semantics, draft/apply, chip removal without committing unrelated drafts, reset, unknown/zero counts, offline/retry, rapid A→B, clear then late reply, IME, keyboard/focus, locale, narrow/text2x, disposal and browser back. Evaluate relevance separately from visual polish. Record missing coverage and real user difficulties; no unmeasured conversion claim.

- [Baymard — current search query types](https://baymard.com/research-articles/ecommerce-search-query-types)
- [Carbon — filtering](https://www.carbondesignsystem.com/building-blocks/core/patterns/filtering)
- [Spectrum — current search field](https://spectrum.adobe.com/web/rsp/components/search-field)
- [W3C — status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)


<a id="safe-web-content"></a>

## Safe text, links and previews

**Default to text.** Render card names, search terms, server errors and tool results using textContent/text nodes or framework escaping. Do not concatenate them into innerHTML, event handlers, eval/new Function, script or CSS. Output contexts differ; input validation and a universal escape helper cannot replace contextual handling. When rich HTML is truly required, use a maintained sanitizer with a narrow context-appropriate allowlist and avoid unsafe post-sanitization mutation. Regex is not a sanitizer.

**Markdown and templates.** Disable raw HTML, bound input/depth and use an established parser with safe rendering. Validate links/resource loads independently. AG createMarkdownViewer builds permitted DOM nodes: HTML stays literal, images are placeholders and links reach only a host callback without href. The callback is trusted integration code that still decides permission and navigation. createCodeViewer displays source; it does not authorize execution. This local example has no unsafe execution mode.

**URLs.** Parse with URL and check scheme plus exact origin/route/resource policy as needed. Reject javascript:, unintended data: and unexpected credentials. Server redirects use allowed destinations. HTTPS alone does not make a destination trusted or authorize disclosure. Label external links and isolate opener/referrer appropriately for new contexts. Never put tokens in URLs; remote images/embeds require an explicit loading decision.

**Files.** Client accept/size helps selection; the server owns allowed types, size/content checks, permissions and quotas. MIME/extension alone proves nothing. Display filenames as text; server owns storage and delivery paths. Use isolation, scanning/CDR and safe delivery according to risk, without sending private files to third-party scanners by default. Do not insert uploaded HTML/SVG into privileged DOM.

**Frames and messages.** Use minimal sandbox/CSP for untrusted previews; allow-scripts plus allow-same-origin can defeat isolation for untrusted same-origin frames. For known origins use exact targetOrigin; receivers validate origin, source, type/schema/size and current mount channel. An opaque origin may be null, which is not sender authentication: use an explicitly restricted protocol/source check, not blanket wildcard relaxation for ordinary windows. Disposed mounts reject stale work.

**Test the boundary.** Positive fixtures preserve Unicode, ordinary Markdown and permitted link callbacks. Negative fixtures keep tags/attributes and javascript links inert, avoid remote image requests and preserve accepted output when budgets fail. Test callback/lifecycle and the real browser integration; DOM tests alone cannot prove network isolation. See packages/rules/web-security.md. This is bounded evidence, not a universal sanitizer claim.

- [OWASP Cross Site Scripting Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP DOM based XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html)
- [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [OWASP HTML5 Security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
- [MDN Window.postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)


<a id="motion"></a>

## Motion and continuity

Prefer short interruptible transitions; AG starts at120–200ms, not a platform mandate. Respect reduced motion, preserve reading position and allow frequent actions without waiting for decorative effects. Use transform/opacity when appropriate but measure real input/layout/paint.

Disclosures preserve focus and reading context. A spinner means pending, and success follows a real service response. Errors need text and recovery; shaking, confetti and animated monitoring numbers are unnecessary for operational work. Test rapid repetitions, cancellation, Escape, navigation during loading and resource disposal. Effects do not prove accessibility or performance.

Rules: `reduced-motion`, `motion-purpose`.

Sources: [Apple HIG — motion](https://developer.apple.com/design/human-interface-guidelines/motion).

### In practice

**Takeaway.** Motion should explain change rather than distract from content.

After an action, an object moves or changes state. A short transition helps connect cause and result.

**Before.** An endless animation competes with text and continues offscreen.

**After.** Use motion for feedback and retain a clear static state under reduced motion.

Action → Transition → New state

**Try it yourself**

- Explain the purpose of each motion
- Test reduced-motion behavior
- Stop timers when the component is removed


<a id="grid-icon-generation"></a>

## Icons: from grids to reviewed drafts

**Meaning and family first.** Search existing recognizable icons before drawing another glyph; do not replace text/familiar icons merely for density. UI actions use keylines/spacing, currentColor and the host family. Keep visible captions for unfamiliar/consequential actions. A native named control owns interaction/target size; SVG is its graphic.

**Grid-first pipeline.** Read design_layout_grids and grid-<type>; iconSuitability separates system glyph/illustration/layout. Declare purpose, viewBox, padding, stroke family, symbol and anchors. design_icon_draft/createGridIconDraft returns4original fixed starters(play/focus/image/compass), currentColor SVG, primitives, visible stroke bounds and grid report. This is a bounded recipe helper, not unrestricted text-to-icon AI or arbitrary SVG import. Agents author other symbols separately under the same constraints and review before reuse.

**Coherent draft.** UI viewBox24/defaultstroke1.5 are AG choices, not universal standards. A spacing recipe without explicit step uses2. Illustrative viewBox64 accepts cinema/photo framing and scales glyphs proportionally inside live area. Columns/modular/baseline/manuscript belong to surrounding layout, not one glyph. Literal titles are limited to80UTF-16 units; blank/control/invalidXML characters are rejected. No scripts/arbitrary paths/external resources are accepted.

**Inspect before images.** Read purpose/config/primitives/visibleBounds/withinLiveArea/results. A hit checks construction of a known point; it does not independently assess recognition. Download only the local generated SVG. Host semantic palette owns currentColor; actual background/size is required for contrast evidence.

**Then review actual rendering.** Check16/20/24/32px, light/dark, stroke/negative space and optical centre beside existing glyphs. Illustrative marks may be unsuitable at tiny sizes. Verify keyboard, accessible name, target size, unfamiliar meaning and real integration. Untested optical/semantic/AT/originality/production stays unknown. Mandatory color/accessibility and baseline WebMCP design remain.

- [IBM Design Language — UI icons](https://www.ibm.com/design/language/iconography/ui-icons/design/)
- [Material Design — Icon grid (legacy reference)](https://m1.material.io/style/icons.html)


## Composition grid selection update

**Cinema, photo and icons.** All14profiles have their own grid-<type> chapter and interactive example. Use edge-balance for an off-centre subject and opposing negative space; lead-room for declared gaze/movement space; center-perspective for converging lines; phi-grid, golden-triangle and diagonal-flow for photographic/artistic framing. UI glyphs start with icon-keylines/spacing. Illustrative marks may use framing grids; read grid-icon-generation for four original SVG starters and numeric checks. AG default ratios are authored adaptations, not universal camera standards.


<a id="form-row-layout"></a>

## Fields and actions in one row (`form-row-layout`)

**Anchor the control bottom.** For adjacent single-line input/select fields with different caption lengths, align the actual control bottom borders. Hints, errors, counters and expandable help below the field are excluded. Use a separate shared caption track ending above the control. Avoid fixed caption heights or one-off top margins. With one density both top and bottom borders align; textarea/multiline/listbox controls need not share that height.

**Implementation and measurement.** Opt-in core0.36.2 form-tracks.css shares three subgrid tracks while the host owns columns/breakpoints, palette, data and native semantics. Keep complex actions in a separate host group. Moving a control out of its wrapping label retains the same node and an explicit label/for association. Verify short/wrapped captions, one-field help expansion, narrow/enlarged content. Measure max(control.bottom)-min(control.bottom) per real row excluding feedback height. Existing inspectFormRow measures top and comparable height; equal-height families therefore also establish the bottom line. Intentionally unequal heights require a separate bottom measurement. Without subgrid keep normal flow and mark shared alignment unknown.

Use a row for related short values or a search/filter task; start sequential unrelated questions in one column. Declare the semantic group before choosing columns.

Give labels, controls and feedback separate tracks. Align actual control tops, never the bottom of entire components containing result counts. A wrapped label grows the common label track; an error grows the complete row without moving adjacent controls. The next row starts below the tallest feedback. CSS Grid subgrid is one implementation, not a required framework.

Use one density and compatible heights for comparable single-line inputs, selects and buttons. Width reflects expected content. The catalog comfortable40CSSpx and1CSSpx inspection tolerance are AG choices, not WCAG thresholds or universal Carbon sizes. Textareas or unrelated controls need a different group or an explicit exception.

Search band: query, query actions and frequent facets. Put display/sort settings in a separate disclosure, with count/loading/error/stale feedback below the primary band and outside busy results. Show reset only for meaningful applied restrictions. Respect hidden and closed details even when author CSS uses flex/grid. Preserve the host Pinterest/masonry layout.

Stack by the available container width. Preserve permanent labels, described-by feedback, semantic fieldset/legend where appropriate, DOM/keyboard order, input and focus. Use logical axes for RTL. Do not squeeze fields or reorder with CSS order.

Before screenshots import inspectFormRow from @ag-design/rules/form-row. Supply container and controls:[{id,rect:{x,y,width,height}}] from getBoundingClientRect(), declared layout:row/stack and direction:ltr/rtl; one call represents one semantic row. Never include labels or entered values. Retain residualPx and geometryGate. Missing evidence remains unknown. Geometry cannot infer semantics, labels, feedback correctness or accessibility conformance.

Check short/wrapped labels, one-field errors, loading/empty/error/stale, disclosure open/closed, query/reset, RU/EN,320/390CSSpx, narrow containers,200%text,400%zoom and keyboard/focus. Record untested AT/native/user studies as unknown; grid scores never waive mandatory failures.

**Common form geometry audit.** Import auditInterface or auditFormRows from @ag-design/components/audit. Mark a container data-ag-form-row="auto" (or row/stack) and its direct field groups data-ag-form-field. Each group owns one native input/select/textarea, a persistent label/aria-labelledby caption and aria-describedby messages. A wrapping label needs a separate visible caption referenced by aria-labelledby. Auto supports a single CSS Grid band or nowrap flex row/column; complex wrapping and side labels require separate groups/manual review. Never infer layout from control tops: this can conceal the defect.

auditInterface(root).formRows returns redacted facts, checks with residualPx and geometryGate. form-row-label-alignment compares caption tops; form-field-inline-alignment compares the logical start of each caption/control/hint (right edge in RTL); form-field-track-order detects label→control→feedback overlap and feedback crossing the next stacked caption. Only comparable single-line controls share a height family; textarea/multiple select are excluded. Different hint heights and wrapped caption bottoms are valid. Rectangles do not measure ink baselines or typography quality.

For measured facts use inspectFormRow({container,controls:[{id,rect,label,feedback:[],comparableHeight:true}],layout,direction,tracks:true}). Supply synthetic identifiers and geometry only, never text, values or original DOM IDs. null denotes missing label/feedback evidence; feedback:[] declares no descriptions. Undeclared, hidden, transformed, truncated or unsupported geometry cannot produce automatic admission. Rerun after fonts.ready and settled layout, width/text/state changes. The 1 CSS px tolerance is AG policy, not WCAG.

Submit numeric measurements as requirementObservations to evaluate_interface with the current policyVersion/policyHash; obtain metric names from design_brief. A snapshot cannot attest responsive behavior, feedback growth, keyboard or AT. Test wrapped captions, one-field error,320/390px, narrow panels,actual200%text,zoom and keyboard separately. Empty findings and high grid scores never replace missing evidence.

- IBM Carbon — Form alignment and two-column rows: https://www.carbondesignsystem.com/building-blocks/core/components/form/guidelines
- IBM Carbon — Forms pattern: https://www.carbondesignsystem.com/building-blocks/core/patterns/forms
- W3C WAI — Grouping controls: https://www.w3.org/WAI/tutorials/forms/grouping/
- USWDS — Form order and validation: https://designsystem.digital.gov/components/form/
- W3C WCAG — Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html


<a id="gitlab-pajamas-patterns"></a>

## GitLab/Pajamas: reusable work patterns (`gitlab-pajamas-patterns`)

Pinned GitLab application and GitLab UI/Pajamas source, not screenshots alone, inform12conditional mappings in gitlab-patterns.json. No Vue/Bootstrap/FloatingUI dependency or GitLab branding is imported.

**Choice lists differ from command disclosures.** Listbox changes a value; disclosure triggers an action. Keep a visible selected value and distinct ARIA role; do not put arbitrary forms inside role=menu. AG: dropdown-select / select; menu; reuse.

**Sort criterion and direction.** Keep criterion and direction independent. Relevance-like criteria have no artificial inverse; the host owns actual ordering, URL and paging. AG: sorting-control; implemented.

**Nonmodal contextual settings.** Click opens an optional titled settings surface. No focus trap, forced completion or hover-only controls. Preserve child values and restore focus on explicit dismissal. AG: popover; implemented.

**Owned floating layers.** Fit the visual viewport and own scroll/resize/observer cleanup. Keep nested overlays inside their fallback owner and preserve semantic theme scope. AG: popover / dropdown-select shared positioner; adapted.

**Explicit applied filter state.** Keep free text, structured filters, draft/applied state and result revision distinct. Domain operators, URLs, search history and remote suggestions belong to the host; no new AG token grammar is claimed. AG: catalog-search-controls; reuse.

**Field label and description ownership.** Associate a permanent label with the actual focus target; explain constraints before error and keep adjacent feedback attached. Preserve semantic groups rather than stretching every selector equally. AG: field / textarea / form-row-layout; reuse.

**Feedback scope and announcement.** Choose inline context for persistent errors and a toast only for transient feedback. Politeness follows urgency; do not automatically announce every success as assertive. AG: notice / state-panel / toast-stack; reuse.

**Empty reason and next step.** Distinguish empty inventory, no matches, unavailable permissions and transport failure. Offer a relevant next action and appropriate heading; do not imply zero data after an error. AG: empty-state / async-boundary; reuse.

**Structural loading placeholders.** Reserve meaningful geometry while the host loads. A skeleton is not data, progress or readiness; expose loading once and preserve stale-content semantics. AG: loading / async-boundary; reuse.

**Contextual inspection panels.** Keep related detail near a list when work can continue. Choose modality from the task, define width/scroll/close ownership, and protect unsaved state; AG does not claim a new drawer factory. AG: resizable-panel / popup / sidebar; reuse.

**Status remains meaningful without color.** Use concise literal status/value labels, optionally an icon. Counts, usage and ratings remain different; a colored badge alone does not explain state. AG: status / numeric-badge; reuse.

**Short exclusive choices remain visible.** Use the existing native radio implementation for a small exclusive display choice. Do not replace tabs/routes with cosmetic buttons or copy upstream keyboard claims. AG: segmented-choice; reuse.

Only popover and sorting-control are new factories. Existing primitives cover the remaining cases; new drawer, token grammar, remote suggestions and upstream AT qualification are not claimed. Preserve host palette, masonry, authority and current security/color/accessibility gates.

- GitLab UI — Choice lists differ from command disclosures: https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/blob/0bd5ecb28b58969a0951ec6c6cc9356073718994/packages/gitlab-ui/src/components/base/new_dropdowns/listbox/listbox.vue
- GitLab UI — Sort criterion and direction: https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/blob/0bd5ecb28b58969a0951ec6c6cc9356073718994/packages/gitlab-ui/src/components/base/sorting/sorting.vue
- GitLab UI — Nonmodal contextual settings: https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/blob/0bd5ecb28b58969a0951ec6c6cc9356073718994/packages/gitlab-ui/src/components/base/popover/popover.vue
- GitLab UI — Owned floating layers: https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/blob/0bd5ecb28b58969a0951ec6c6cc9356073718994/packages/gitlab-ui/src/components/base/new_dropdowns/base_dropdown/base_dropdown.vue
- GitLab UI — Explicit applied filter state: https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/blob/0bd5ecb28b58969a0951ec6c6cc9356073718994/packages/gitlab-ui/src/components/base/filtered_search/filtered_search.vue
- GitLab UI — Field label and description ownership: https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/blob/0bd5ecb28b58969a0951ec6c6cc9356073718994/packages/gitlab-ui/src/components/base/form/form_group/form_group.vue
- GitLab UI — Feedback scope and announcement: https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/blob/0bd5ecb28b58969a0951ec6c6cc9356073718994/packages/gitlab-ui/src/components/base/alert/alert.vue
- GitLab UI — Empty reason and next step: https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/blob/0bd5ecb28b58969a0951ec6c6cc9356073718994/packages/gitlab-ui/src/components/regions/empty_state/empty_state.vue
- GitLab UI — Structural loading placeholders: https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/blob/0bd5ecb28b58969a0951ec6c6cc9356073718994/packages/gitlab-ui/src/components/base/skeleton_loader/skeleton_loader.vue
- GitLab UI — Contextual inspection panels: https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/blob/0bd5ecb28b58969a0951ec6c6cc9356073718994/packages/gitlab-ui/src/components/base/drawer/drawer.vue
- GitLab UI — Status remains meaningful without color: https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/blob/0bd5ecb28b58969a0951ec6c6cc9356073718994/packages/gitlab-ui/src/components/base/badge/badge.vue
- GitLab UI — Short exclusive choices remain visible: https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/blob/0bd5ecb28b58969a0951ec6c6cc9356073718994/packages/gitlab-ui/src/components/base/segmented_control/segmented_control.vue
- GitLab application — filtered search and sort composition: https://gitlab.com/gitlab-org/gitlab/-/blob/4a0d285e5e2958702347bb4231f8ba515bf639db/app/assets/javascripts/vue_shared/components/filtered_search_bar/filtered_search_bar_root.vue


<a id="list-view-controls"></a>

## Compact list sorting and view controls (`list-view-controls`)

Keep frequent sort visible; criterion and direction are separate. Relevance-like criteria have direction:null rather than a fictional inverse. createSortingControl emits a copied descriptor; host owns actual ordering, URLs, paging and transport. setValue is silent.

Put occasional palette/density/metric choices behind a labelled View popover. Use existing segmented-choice for a short exclusive choice such as Count/0–5. This is a normal Tab group, not an ARIA toolbar without its keyboard contract. A command menu, choice listbox and settings panel have different roles.

Size to useful content, retain common density/control tracks and put nonessential explanation behind a disclosure. Required field instructions must stay visible. Opening settings must not move the catalog. Direction icon gets a localized current/next-action name; no false aria-pressed. Preserve host palette/masonry and current policies.

Test criterion/direction, relevance, silent restore, external host changes, disabled, rapid changes, RU/EN/RTL,320px/200%text, popup bounds and nested Escape order. Local geometry and callback tests do not prove server performance, user search quality or accessibility certification.

- GitLab UI — Choice lists differ from command disclosures: https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/blob/0bd5ecb28b58969a0951ec6c6cc9356073718994/packages/gitlab-ui/src/components/base/new_dropdowns/listbox/listbox.vue
- GitLab UI — Sort criterion and direction: https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/blob/0bd5ecb28b58969a0951ec6c6cc9356073718994/packages/gitlab-ui/src/components/base/sorting/sorting.vue
- GitLab UI — Nonmodal contextual settings: https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/blob/0bd5ecb28b58969a0951ec6c6cc9356073718994/packages/gitlab-ui/src/components/base/popover/popover.vue
- GitLab UI — Short exclusive choices remain visible: https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/blob/0bd5ecb28b58969a0951ec6c6cc9356073718994/packages/gitlab-ui/src/components/base/segmented_control/segmented_control.vue
- GitLab application — filtered search and sort composition: https://gitlab.com/gitlab-org/gitlab/-/blob/4a0d285e5e2958702347bb4231f8ba515bf639db/app/assets/javascripts/vue_shared/components/filtered_search_bar/filtered_search_bar_root.vue


<a id="nonmodal-popovers"></a>

## Nonmodal contextual popovers (`nonmodal-popovers`)

Use createPopover for optional contextual settings/help while work can continue. It is a click/keyboard-operated named nonmodal dialog, not a hover-only control, modal confirmation or role=menu containing arbitrary inputs. This deliberately differs from GlPopover hover/focus defaults.

Host passes detached same-document content and owns values/listeners/validation/dirty/save/cancel. Content is borrowed, never cloned or disposed; close preserves it. Dispose the surface first, then children and host DOM.

The shared AG positioner uses available top-layer support or an owned dialog/body fallback, viewport bounds and scrolling. Child dropdown fallback remains inside the owning layer. Browser support is not native-WebView qualification.

Give the real trigger expanded/controls/haspopup=dialog and a titled panel. Focus first enabled content or panel; no modal trap. Escape/Close returns focus; outside pointer/focus-out preserves the next target. Nested listbox handles Escape first. Cleanup precedes destructive/reentrant callbacks; retired callback failures stay retired.

Verify open/close/disable/dispose, repeated cycles, removal/reentry in callbacks, rejected callbacks, outside focus, hidden/removed/scrolled owners, small viewports, top-layer/fallback, nested listboxes, themes/increased contrast/RTL and retained input. Missing AT/native/optical/production evidence remains unknown.

- GitLab UI — Nonmodal contextual settings: https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/blob/0bd5ecb28b58969a0951ec6c6cc9356073718994/packages/gitlab-ui/src/components/base/popover/popover.vue
- GitLab UI — Owned floating layers: https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com/-/blob/0bd5ecb28b58969a0951ec6c6cc9356073718994/packages/gitlab-ui/src/components/base/new_dropdowns/base_dropdown/base_dropdown.vue


<a id="mesh-gradients"></a>

## Mesh gradients: background, emphasis and readable content (`mesh-gradients`)

**Source insight.** The author demonstrates color fields for brand identity, sub-brand variation and attention.

**AG application.** Consider mesh for a hero, illustration or restrained emphasis region. Operational tables, errors and statuses retain semantic surfaces/text. Use the approved profile; harmony does not redefine danger/success or contrast gates. Put dense text on a stable opaque surface when the background varies.

**Checks.** Inspect actual composited backgrounds beneath text and necessary outlines across their worst positions/states. An average mesh color or one palette pair is insufficient. The current opaque-pair AG color API cannot certify a gradient; unmeasured regions remain unknown. Check both themes, focus and text enlargement. Static output is sufficient; animation needs a separate reason, reduced-motion and target-device cost evidence. No conversion or FPS claim follows from this article.

**Related chapters.** color, color-palettes, motion, creative-direction.

- [Learn UI Design: Technique Deep Dive #1: Mesh Gradients](https://www.learnui.design/blog/mesh-gradients.html)
- [WCAG2.2: Contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)


<a id="visual-interest-techniques"></a>

## Visual interest without losing hierarchy (`visual-interest-techniques`)

**Source insight.** The guest article offers expressive techniques on top of a sound visual foundation.

**AG application.** Establish task, primary action, semantic groups and grid first. Then choose a small coherent motif set, such as a background shape or boundary treatment, justified by the brand. Golden Canon remains the preferred composition starting point; a visible decorative grid is distinct from exposing diagnostic overlays in production.

**Checks.** Compare restrained and accented alternatives with identical content. Declare the intended attention target and actual observation; novelty is not usability evidence. Decoration cannot replace link underlines, focus rings, input boundaries or error meaning. Check contrast, clipping, reflow and effect cost. Tilts, frame overflow, textures and complex shadows need a resilient fallback; content and accessible names remain text. Do not force equal card heights for decoration.

**Related chapters.** creative-direction, hierarchy, layers, motion.

**Expression through product outcomes.** For visual polish, try moving attention from chrome to useful content: a readable chart, product, document or action result. The task determines the number of accents; quiet chrome is an option, not a color ban. A demo can show one convincing episode instead of a miniature of the entire application. Use existing components, consistent entities and units, and explicitly identify demonstration data. Operational forms and tables often need no illustration. Choose imagery for its explanatory role and composition. Do not turn familiar template signals into bans on gradients, bold type, emoji or equal cards: evaluate purpose, meaning and legibility through color, typography, icons, motion and catalog-item-presentation.

**Attribution.** Adapted from Unslop by Damir Sokolovsky (@heydamir), CC BY4.0. AG replaces the original restrictions with conditional advice and retains approved identity and existing checks.

- [Learn UI Design: 37 Easy Ways to Spice Up Your UI Designs](https://www.learnui.design/blog/spice-up-designs.html)
- [WCAG2.2: Contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [WCAG2.2: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)


<a id="authentication-ux"></a>

## Signup and login: clear and secure journeys (`authentication-ux`)

**Source insight.** The article proposes reducing input friction, clarifying transitions and helping error recovery.

**AG contract.** Read forms and web-security-by-design. Connect a persistent label to the actual control; explicit for/id is preferred and correct implicit association is valid. Use purpose-specific email/tel/url types; type=num does not exist. Quantities may use type=number; digit codes generally use type=text, inputmode=numeric and autocomplete=one-time-code to retain leading zeros. Use username/current-password for login and new-password for creation. Allow paste and password managers.

**Scenarios and errors.** Distinguish login, account creation and recovery. Validate format after interaction without applying new creation policy to existing login credentials. Separate creation hints from generic login failure; do not reveal account existence. Preserve a nonsecret identifier within an explicit current journey, never persist passwords in URL/storage/telemetry/UI maps. Account switch/logout clears sensitive state; password reveal is an accessible user-controlled button.

**Conditional choices.** Autofocus needs intentional task entry and AT/mobile checks. Select SSO/passkeys/codes with the server owner, risk and recovery in mind; email is not a universal trusted factor. Do not copy a 30–60 minute TTL. Server owns expiry, replay protection, throttling, sessions and authorization. The legal owner determines consent requirements; this article cannot authorize checkbox removal. No authenticator or security certification is implemented here.

**Related chapters.** forms, form-quality-common, web-security-by-design, secure-web-actions.

- [Learn UI Design: 15 Tips for Better Signup / Login UX](https://www.learnui.design/blog/tips-signup-login-ux.html)
- [WCAG2.2: Accessible authentication](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html)
- [WAI: Labeling controls](https://www.w3.org/WAI/tutorials/forms/labels/)
- [MDN: HTML input element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input)
- [MDN: inputmode](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)
- [MDN: autocomplete](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)
- [OWASP: Authentication cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST SP800-63B-4: Authentication and authenticator management](https://pages.nist.gov/800-63-4/sp800-63b.html)


<a id="logo-robustness"></a>

## Logos: differentiation and small-size robustness (`logo-robustness`)

**Source insight.** The author recommends differentiated imagery and avoiding excessive small detail.

**AG application.** Follow brand-book and compare alternatives against an explicit relevant corpus. For a new mark, explain its brand relationship; familiar symbols can be justified. Color follows approved strategy/profile. Do not ban brown, blue, green or another hue family, or replace an existing logo without a separate task.

**Checks.** Prepare a vector source and applicable monochrome/inverse variants, minimum actual size and surrounding context. Check header, icon/avatar or favicon only where required, at ordinary and high display density. Resolve fragile detail, tiny lettering and reliance on one hue. The article 70px header example is not a universal size. WCAG logotype-text exceptions do not waive accessible name/focus for a linked/button logo, or contrast for ordinary UI text. Rights, trademarks, recognition and AT need separate evidence.

**Related chapters.** brand-book, creative-measurement, icons, grid-icon-generation.

- [Learn UI Design: The 3 Most Common Logo Design Mistakes (and How to Fix Them)](https://www.learnui.design/blog/3-most-common-logo-design-mistakes.html)
- [WCAG2.2: Contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)


<a id="intuitive-control-selection"></a>

## Intuitive choices: suitable controls and visible outcomes (`intuitive-control-selection`)

**Source insight.** Four heuristics connect locality, control choice, visual priority and concrete examples.

**AG decision.** Independent values use checkboxes; exclusive choices use radio/segmented-choice; distinguish immediate settings from deferred submission. Consider exposed choices for frequent comparison and existing searchable dropdown-select for long lists with honest empty/error states. Native select remains valid for infrequent changes or constrained space: Anything But Dropdowns is not a ban. Two-to-five is an example, not a fixed breakpoint.

**Input follows task.** Birth dates and near-term bookings need different date-finding support; avoid decade-by-decade paging. Quantities differ from digit identifiers. Guidance alone does not implement an AG date picker or stepper.

**Comprehension checks.** With identical content, inspect primary task, selection and outcome. Squint/blur is an attention heuristic, not recognition, accessibility or security evidence. Rare critical recovery may deserve visibility regardless of frequency. Show a concise input-to-outcome example without replacing labels, required instructions or human evaluation.

**Related chapters.** forms, actions, action-locality, human-first-agent-interfaces.

- [Learn UI Design: 4 Rules for Intuitive UX](https://www.learnui.design/blog/4-rules-intuitive-ux.html)
- [WAI: Labeling controls](https://www.w3.org/WAI/tutorials/forms/labels/)


<a id="action-locality"></a>

## Action locality: object, list and application (`action-locality`)

**Source insight.** The author relates command placement to effect scope and the salience of distant controls.

**AG application.** Object actions sit by the object representation, list actions in list context and application actions in the shell. Nested components retain local scope; a shared toolbar is not a dumping ground. Bulk operations distinguish visible rows, selected items and the full collection; filtering/paging cannot silently broaden scope.

**Exceptions.** An above-region toolbar is a useful starting point, not a physical law. Reachability, long scroll, sticky controls, native chrome and RTL may justify alternatives. Distant controls need meaningful names, context and focus without obscuring content; extra saturation alone does not connect a command to its target.

**Checks.** Before activation, target and consequence are clear; afterward, outcome appears in the same context. Check keyboard, touch and zoom; hover cannot be the sole access. Repeated card commands retain contextual accessible names. Host still owns request/event lifetime and authority; visual proximity grants neither.

**Related chapters.** actions, information-architecture, form-row-layout, human-first-agent-interfaces.

- [Learn UI Design: The 3 Laws of Locality](https://www.learnui.design/blog/the-3-laws-of-locality.html)
- [WAI: Labeling controls](https://www.w3.org/WAI/tutorials/forms/labels/)
- [WCAG2.2: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)


<a id="ui-font-sizing"></a>

## UI font sizing by task and platform (`ui-font-sizing`)

**Source insight.** The hub separates platforms; its linked web chapter distinguishes reading from interaction.

**AG application.** Start with typography and approved host tokens. The 2024 web chapter suggests candidates: mobile body 16–20 CSSpx, desktop reading 18–24 CSSpx and interaction 14–20 CSSpx. These are heuristics, not WCAG minima or an override of the existing 13px dense AG desktop profile. Consider sustained reading, actual font/x-height, line length and language; equal CSS sizes can appear different.

**Units and limits.** CSSpx/rem, iOS pt and Android sp are not universally equivalent physical sizes; verify native rules against current platform documentation. The 2024 examples do not establish current OS requirements. Consider 16 CSSpx mobile inputs and test real iOS focus zoom; never disable user zoom to work around it. A golden-ratio type scale is optional and unrelated to Golden Canon composition preference.

**Checks.** Use a restrained role set, appropriate line height, Cyrillic/Latin, font fallback, long labels and tabular numerals. Secondary text still needs readability. Verify 200% text and 320 CSSpx reflow/equivalent 400% zoom with applicable WCAG exceptions and retained content/actions/focus. Web/PPTX/native evidence is separate; numeric tokens alone do not certify reading quality.

**Related chapters.** typography, form-row-layout, platform, golden-canon-grid.

- [Learn UI Design: Font Sizes in UI Design: The Complete Guide](https://www.learnui.design/blog/ultimate-guide-font-sizes-ui-design.html)
- [Learn UI Design: Responsive website font sizes (2024)](https://www.learnui.design/blog/mobile-desktop-website-font-size-guidelines.html)
- [WCAG2.2: Resize text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)
- [WCAG2.2: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- [WCAG2.2: Contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)


<a id="openai-conversation-surfaces"></a>

## OpenAI: surfaces inside a conversation (`openai-conversation-surfaces`)

**Scope.** Apply these recommendations to plugin UI inside ChatGPT. Ordinary websites retain their own design system. Golden Canon composition remains subordinate to available space, meaningful content and host constraints. Do not imply OpenAI endorsement.

**Surface choice.** Return text or structured data when visual interaction adds no value. Use inline for a focused result, fullscreen for a rich task, a carousel for a small visual choice and PiP for an ongoing session. Keep the host composer available.

**Inline composition.** Let content determine height. Avoid nested scrolling and deep navigation. Offer up to two actions with at most one primary. Carousel guidance suggests 3–8 visual items with concise metadata and usually one action each. These are scoped recommendations, not restrictions on every web form.

**Host integration.** In ChatGPT use host typography, semantic colors and geometry, with restrained brand accents. Preserve imagery aspect ratios and meaningful alternatives. The optional Apps SDK UI library is an integration aid, not a required dependency or a replacement for all AG controls. Standalone AG retains its approved profile.

**AG checks.** conversation-card composes existing buttons and literal text. Its inspect method exposes redacted structural facts. inspectConversationSurface evaluates declared facts; it does not measure DOM or provide consumer admission. Test actual host rendering, narrow width, long labels, enlarged text, focus and accessibility separately. ChatGPT checks return not-applicable for web context.

- [OpenAI: UI guidelines](https://developers.openai.com/plugins/concepts/ui-guidelines)
- [OpenAI: Add UI to your MCP server](https://developers.openai.com/plugins/build/chatgpt-ui)
- [OpenAI: optional Apps SDK UI library](https://openai.github.io/apps-sdk-ui/)


<a id="openai-tool-ui-contract"></a>

## OpenAI: tools, state and UI contracts (`openai-tool-ui-contract`)

**Task contract.** Describe the user outcome, explicit identifiers, schema limits, authorization, side effects and recoverable errors. Separate reads and consequential writes. Return structured results useful without UI and declare outputSchema. Tool metadata describes actual use cases; it must not manipulate selection.

**Data before presentation.** Consider separate data and render tools to avoid repeated iframe creation. New integrations prefer MCP Apps fields/bridge; optional window.openai capabilities require feature detection. conversation-card supplies no transport or authorization.

**State ownership.** Server snapshots own business data. UI instances own temporary presentation. Application storage owns cross-session preferences. Widget state is not an authoritative database. Preserve compatible presentation while applying accepted results; attempted activation is not completion.

**AG interpretation.** Reuse async-boundary for request generations, event-bus for scoped intent and request-router for shared requests. Preserve the product's revision/idempotency semantics. An uncertain write is not permission to replay it. Disposal cannot undo a committed server effect.

**Checks.** Exercise headless use, denial, failure, late response, concurrent edits and missing capabilities. Verify composer clearance and PiP session end in the real host. Evaluate tool metadata against direct, indirect and negative prompts. No new transport is installed by this guidance.

- [OpenAI: Add UI to your MCP server](https://developers.openai.com/plugins/build/chatgpt-ui)
- [OpenAI: Define tools](https://developers.openai.com/plugins/plan/tools)
- [OpenAI: Plugin UI reference](https://developers.openai.com/plugins/reference)
- [OpenAI: Optimize Metadata](https://developers.openai.com/plugins/guides/optimize-metadata)


<a id="openai-embedded-ui-security"></a>

## OpenAI: embedded UI security boundaries (`openai-embedded-ui-security`)

**Trust boundary.** UI and model convey intent; every tool call needs server-side input, object and permission checks. Safety annotations describe behavior rather than enforce access. Tool output and document text never grant authority.

**Data minimization.** structuredContent/content reach the model; tool-result _meta reaches the component. Model-hidden metadata is still browser-visible and is not a secret vault. Keep credentials and unnecessary personal data out of props, URLs, structural captures and logs. Use redacted correlation IDs and explicit retention/deletion policies. Client environment hints cannot authorize operations.

**Sandbox.** Declare specific CSP origins for required connections, assets and frames. An embedded page retains its own network/security boundary. Do not rely on blocked privileged dialogs or clipboard APIs. Detect supported host capabilities and provide usable fallback. Verify current reference signatures before integration.

**Actions and evidence.** Explain object and consequences; use host confirmation for irreversible actions and keep enforcement server-owned. Render untrusted results safely. Test permitted/denied access, hostile text, missing capability, auth failure and recovery. Local card checks do not certify OAuth, CSP, publication approval or penetration resistance. Read web-security-by-design, safe-web-content and secure-web-actions.

- [OpenAI: Security & Privacy](https://developers.openai.com/plugins/guides/security-privacy)
- [OpenAI: Plugin UI reference](https://developers.openai.com/plugins/reference)
- [OpenAI: Define tools](https://developers.openai.com/plugins/plan/tools)


<a id="chatkit-widget-composition"></a>

## ChatKit: widget and list composition (`chatkit-widget-composition`)

**Context.** ChatKit lives inside a product and can match its theme. Do not impose ChatGPT plugin styling limits on that embed. Preserve the host palette and mandatory AG gates.

**Description before code.** ChatKit separates root containers and child nodes and offers JSON-producing visual tools. AG uses that idea for structure discussion; it does not accept arbitrary ChatKit JSON. Map supported types/properties and reject unsupported data. Never interpret schema fields as executable markup, CSS, URLs or instructions.

**AG composition.** Reuse conversation-card for a focused result, widget-list for a small keyed list and catalog-card/data-table for comparison. Groups preserve meaningful DOM order and common form tracks. Use explicitly approved media ownership; widget-list does not load arbitrary media.

**AG limits and checks.** widget-list has a100-item cap,1–20 initial batch and progressive disclosure without nested scrolling. These are AG implementation limits. Display revisions fence stale snapshots; keys alone do not prove focus preservation. Inspect redacted counts/revision/scope, then test reorder/removal, long text, RTL, narrow/enlarged text and themes. Use render-window for larger collections with actual focus/draft safeguards. Mapping: @ag-design/rules/chatkit-patterns.json.

- [OpenAI: ChatKit widgets](https://developers.openai.com/api/docs/guides/chatkit-widgets)
- [OpenAI: Theming and customization in ChatKit](https://developers.openai.com/api/docs/guides/chatkit-themes)
- [OpenAI: Advanced integrations with ChatKit](https://developers.openai.com/api/docs/guides/custom-chatkit)


<a id="chatkit-widget-actions"></a>

## ChatKit: scoped actions and pending state (`chatkit-widget-actions`)

**Source contract.** ChatKit supports server actions and explicitly selected client handlers. Action input is untrusted and requires server validation. Activation is not accepted state.

**Pending scope.** ChatKit loadingBehavior supports auto/self/container/none, with auto depending on the binding. AG does not emulate that SDK default. Choose blocked scope by actual operation conflict and retain independent controls. Disabled UI is not deduplication or authorization.

**AG behavior.** widget-list emits type/actionId/itemId/current display revision, without form values or arbitrary payload. setPending explicitly controls none/self/container and a supplied message. The host applies a newer snapshot and releases pending; stale snapshots cannot replace current data. Reuse async-boundary/router/bus for their distinct roles.

**Checks.** Exercise scopes, independent rows, reordered actions, old responses, denial and recovery. Handlers resolve current keyed data. Disposal is not rollback of a server effect. Unknown write outcomes require real host idempotency semantics. Public keys/revisions cannot establish object authority. No ChatKit SDK or MCP Apps bridge is installed by this component.

- [OpenAI: Actions in ChatKit](https://developers.openai.com/api/docs/guides/chatkit-actions)
- [OpenAI: Advanced integrations with ChatKit](https://developers.openai.com/api/docs/guides/custom-chatkit)
- [OpenAI: ChatKit widgets](https://developers.openai.com/api/docs/guides/chatkit-widgets)


<a id="chatkit-widget-forms"></a>

## ChatKit: compact forms and explicit payloads (`chatkit-widget-forms`)

**Source behavior.** ChatKit Form contributes named inputs to actions originating within it; Card can use asForm/confirm. A predefined payload collision is not a supported override mechanism. Dotted field names have their own schema; verify adapter behavior rather than inventing it.

**AG adaptation.** Send only fields needed by the selected action. Keep authoritative identifiers/operation/revision separate from editable data and validate names/types explicitly. Never let a field redefine tenant or permissions. widget-list neither reads adjacent forms nor automatically gathers values. Avoid enclosing secrets or unrelated inputs in a form whose actions collect shared data.

**Validation and layout.** Basic native required/pattern checks do not replace server/domain validation. Reuse field/textarea/select/settings-panel and real submit semantics. Complex validation may need a dedicated form surface. Apply form-row-layout and declared form audit, while keeping geometric evidence separate from payload/AT evidence. Preserve drafts and meaningful error focus.

**Checks.** Cover required/pattern, duplicate/conflicting names, keyboard submit, denied writes, recovery and actual enlarged text. JSON schemas and recommendations never grant action authority.

- [OpenAI: Actions in ChatKit](https://developers.openai.com/api/docs/guides/chatkit-actions)
- [OpenAI: ChatKit widgets](https://developers.openai.com/api/docs/guides/chatkit-widgets)
- [OpenAI: Theming and customization in ChatKit](https://developers.openai.com/api/docs/guides/chatkit-themes)


<a id="chat-composer-patterns"></a>

## Chat: compact composer and explicit tools (`chat-composer-patterns`)

**Observation.** The public Grok marketing demo shows a compact prompt dock and separate mode, attachment, voice and send controls. Its inspected prompt was not an editable textarea. Use the composition idea, not the demo as an accessibility or runtime contract.

**Input.** Keep a native textarea with visible label and real submit button. Placeholder is a hint. AG Enter inserts a newline and adds no keydown shortcut; host-added shortcuts require composition/IME and modifier tests. Preserve product tokens and qualification gates.

**AG option.** createAgentConversation accepts composerAppearance:'compact' and composerLabel; standard remains unchanged. Compact starts at one row. field-sizing:content auto-grows only in supporting engines to a cap; other engines retain manual resize. Toolbars wrap by content. composerActions accepts up to four closed {id,label} declarations and requires onComposerAction, receiving only current {sessionId,actionId}. Only declared capabilities render. AG does not collect draft/files, request microphone access or install transport. The host owns privacy, effects and authorization.

**Bounds and checks.** At most eight unsettled tool intents are retained; same session/action duplicates are locally suppressed. These are AG bounds, not x.ai limits or server idempotency. composerState exposes only redacted availability/appearance/sendBlocked/toolCount/pendingTools. Test keyboard/focus,320px, RTL, enlarged text and themes. Preserve per-recipient drafts; fence stale diagnostics. Offline/resync/uncertain send blocks tool controls; only authoritative host receipts establish accepted sends. Dispose releases UI, not external effects.

- [x.ai: Grok public demonstration](https://x.ai/grok)
- [W3C WAI: Labeling Controls](https://www.w3.org/WAI/tutorials/forms/labels/)
- [MDN: keydown event](https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event)


<a id="agent-work-presentation"></a>

## Agent chat: recipient, work, drafts and results (`agent-work-presentation`)

**Source boundary.** The public Grok Bot demo shows a searchable conversation list, named recipient, contextual computer workspace and a staged flow from connection requirements to work, drafts and handoff. Draft and sent counts are separate. Actual memory, scheduling, latency and effects were not tested.

**Context and facts.** Retain the current recipient/task, meaningful input label and action scope. Preserve separate drafts and fence late errors on switches. Reuse existing list/search/navigation. Show concise observable tool activity, connection/runtime states and artifact links, not private chain of thought or fabricated progress. Running, prepared drafts, accepted sends and completed outcomes are different facts. Stable keyed results must not accept stale task completions.

**Human control.** Separate preparation, approval and execution where task authority requires it, without unnecessary confirmations. Approval has explicit object/scope/consequence and server checks. Opening external workspaces is host-owned. Never copy fake native chrome into web UI. A routine requires a real scheduler/storage/cancellation; a chat card does not implement them.

**AG mapping.** Reuse agent-conversation tool/approval blocks, conversation-card, widget-list, async-boundary and request-router. No new transport or orchestrator is installed. Verify identity, receipts, bounded history, retained focus/scroll/drafts and late completion before optical review. Backend delivery, SLA and memory require separate evidence.

- [x.ai: Grok Bot public demonstration](https://x.ai/bot)
- [x.ai: Grok public demonstration](https://x.ai/grok)


<a id="chat-presentation-selection"></a>

## Three chat presentations: document, messenger and work log (`chat-presentation-selection`)

**Choose by task.** createAgentConversation accepts presentation:document|messenger|work-log. All views share the same bounded message model, chronology, permissions and authoritative receipts. Document is the compatible default; do not create separate transports.

**Document.** Use for explanations, research, search and longer paragraph/list answers. Keep a readable narrative track without a card around every fragment. Tables and complex editors may need a dedicated surface.

**Messenger.** Use for short exchanges with a specific recipient. Position, visible author metadata and semantic surfaces distinguish speakers without relying on color alone. Reuse typed disclosures for longer code/data. This view does not implement delivery/read receipts, mobile messaging or push.

**Work log.** Use for development, diagnostics and longer operations. Keep chronology, authors, statuses, failures and questions explicit. Completed technical detail remains inspectable; narrative prose keeps a readable font. Show observable activity, not private chain of thought or invented progress. Running or a check mark cannot establish task completion.

**Switching and inspection.** setPresentation changes layout in place, preserving keyed nodes, focus/selection, draft, disclosures, pending intents and follow/read anchor. It neither submits nor changes session/generation or acknowledges effects. Changed geometry need not preserve exact pixels. presentationState returns only presentation/available/messageCount/blockCount/technicalCount. Disposal makes switching inert.

**Fair comparison.** /chat-comparison.html feeds the same snapshot into three actual viewers. Shared scenarios cover result/running/question/error. A local send appends the same user turn everywhere and never fabricates an agent response. Check identicalContent and redacted structural facts, then actual layout, keyboard/focus,320px/enlarged text, RTL and themes. Narrow comparisons stack rather than shrink.

**Evidence boundary.** Public Grok/Grok Bot marketing compositions inform document/messenger choices; they are not live backend or accessibility guarantees. Work-log is an AG presentation, not Cursor runtime compatibility. Preserve host palette, native semantics and all qualification gates.

- [Grok public chat demonstration](https://x.ai/grok)
- [Grok Bot public work demonstration](https://x.ai/bot)
- [W3C: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)


<a id="accessibility"></a>

## Accessibility as a required check

Support meaningful reading/focus order, accessible names, keyboard use, noncolor state, sufficient contrast, text growth and applicable motion/media alternatives. Prefer native semantics. Automated checks complement manual target-AT testing and do not certify conformance. Treat untested critical checks as unknown; consult the detailed inclusive-design policy.

Rules: `accessible-name`, `disclosure-state`, `keyboard-flow`, `zoom-reflow`, `manual-accessibility`.

Sources: [Apple HIG — accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [W3C — performance/evaluation](https://www.w3.org/WAI/test-evaluate/preliminary/).

### In practice

**Takeaway.** Accessibility is verified on a real user path, not by a single score.

A visitor fills a form without a mouse. They need to identify labels, find errors and complete the task.

**Before.** Good color contrast hides missing focus treatment and an unassociated label.

**After.** Verify semantics, keyboard access, text growth and target assistive technology separately.

Visible label → Focus order → Recovery

**Try it yourself**

- Complete the main task with a keyboard
- Enlarge text and check wrapping
- Record untested manual checks


<a id="inclusive-design"></a>

## Inclusive visual, auditory and motor access

Read design_brief: mandatory failures and unknown checks cannot qualify a component. State/series/error meaning must survive without color. Applicable WCAG text contrast is4.5:1 or3:1 for large text (24CSSpx or about18.67CSSpx bold); never round a threshold upward. Essential control/state/graphic information needs applicable3:1 contrast, with inactive/UA/essential exceptions; not every decorative border is essential.

Keyboard operation must complete tasks without traps and preserve meaningful focus order, visible focus and no complete author-content obstruction. AG prefers full focus visibility beyond that minimum. Use programmatic headings, groups, tables, reading order, names and states; ARIA alone creates no behavior. Announce meaningful statuses without forcing focus or announcing every animation frame.

Test200% text and320CSSpx reflow as distinct scenarios with applicable exceptions. Genuine two-dimensional content can scroll separately while surrounding controls reflow. Important sound needs an accessible visible message and a usable nonauditory path. Evaluate recorded/live audio/video alternatives per media type, including captions and essential visual information; exceptions are criterion-specific. Meaningful charts need equivalent essential data/conclusions; an accessible table is one option.

Sliders expose name/value/range and keyboard behavior. Dragging also needs an applicable single-pointer alternative; keyboard alone does not close that requirement. Prefer precise numeric input when useful. Authentication must support applicable assistance/alternatives and not obstruct password managers/paste. Verify motion/auto-update controls, flash limits and reduced motion. Manual target-AT and real scenarios remain necessary; generic CAPTCHA, simulations or screenshots do not establish conformance.

Rules: `a11y-noncolor-meaning`, `a11y-text-contrast`, `a11y-control-contrast`, `a11y-keyboard-focus`, `a11y-structure-reading`, `a11y-status-announcement`, `a11y-zoom-reflow-extended`, `a11y-auditory-equivalence`, `a11y-media-alternatives`, `a11y-chart-equivalence`, `a11y-slider-drag-alternative`, `a11y-authentication`, `a11y-motion-control`.

Sources: [use-of-color.html](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), [contrast-minimum.html](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [non-text-contrast.html](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [https://www.w3.org/TR/WCAG22/](https://www.w3.org/TR/WCAG22/), [focus-not-obscured-minimum.html](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html), [usage](https://atlassian.design/components/icon/usage), [status-messages.html](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html), [resize-text.html](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [reflow.html](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [https://www.w3.org/WAI/media/av/planning/](https://www.w3.org/WAI/media/av/planning/), [captions-live.html](https://www.w3.org/WAI/WCAG22/Understanding/captions-live.html), [audio-description-prerecorded.html](https://www.w3.org/WAI/WCAG22/Understanding/audio-description-prerecorded.html), [https://www.w3.org/WAI/tutorials/images/complex/](https://www.w3.org/WAI/tutorials/images/complex/), [https://www.w3.org/WAI/ARIA/apg/patterns/slider/](https://www.w3.org/WAI/ARIA/apg/patterns/slider/), [dragging-movements.html](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html), [accessible-authentication-minimum.html](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html).

### In practice

**Takeaway.** The same meaning should be available through different ways of perceiving and operating.

Someone cannot distinguish some colors or uses only a keyboard. State and action should remain understandable.

**Before.** An error is only a red border and an action appears only on hover.

**After.** Add a written explanation, consistently available action and visible focus.

Written reason → Focus → Available action

**Try it yourself**

- Remove color and check meaning
- Operate without hover
- Test the target assistive technology


<a id="internationalization-localization"></a>

## Localization and language adaptation

New interfaces pass an explicit locale context with availableLocales, fallback and responsibility for content/formatting. Supplied RU/EN dictionaries do not require Russian; intentional English-only or single-locale products are valid. Keep owned UI/status/error/accessible names keyed and literal; caller data, labels, source and Markdown are not heuristically translated.

Use Intl for numbers, dates, lists and plurals with product-owned currency/unit/timezone decisions. Set language/direction explicitly; common RTL auto detection is not complete script detection or RTL certification. Locale changes preserve focus, selection, drafts and async work. Storage failure applies in memory and must not claim persistence.

Test enabled/fallback/English-only,0/1/2/5/21 plurals, long text,200%/narrow layouts, accessible states and disposal. RTL keyboard/mixed-text, target-AT and native need separate evidence. Dictionaries do not qualify a consumer. The design-book uses compact English agent instructions and user RU/EN editions; stale translation lineage must be reported rather than silently used.

### Recognizable language selection

- Show autonyms such as **Русский** and **English**, not codes alone. Mark each name with its language and direction. Flags describe countries rather than languages.
- Expose names directly for a small pair. For constrained space or an expanding set, use a supplemental globe, the full current name and a native select. These are AG variants, not a universally proven best pattern.
- Keep the control near predictable top-level navigation or settings. Retain a visible name and explicit selected state.
- createLanguageSwitcher({i18n,variant:"compact"|"inline"}) follows availableLocales. A single language is a static name; a host may hide it after moving affected focus to a useful neighbor.
- In-place changes retain search, section, drafts and focus. Host code owns persistence. For navigation to equivalent translated pages, use real links. Country, currency and timezone are separate settings.
- Offer supported locales only and disclose content fallbacks. Verify keyboard, long names, narrow layout, direction, disposal and the platform popup. Native controls do not establish AT qualification by themselves.


### Where language selection belongs

Declare scope first: service-wide language belongs in global navigation; a translated page can place language navigation near its heading. Preserve equivalent content and entered work. Region, currency and timezone remain separate settings.

USWDS recommends a consistent header utility location, typically at the inline end for LTR with an RTL adaptation. GOV.UK distinguishes page scope from service scope and consistent placement; its component remains trial. These are source-backed starting points, not evidence that one physical corner wins for every audience.

A visible pinned sidebar footer is an AG application/book alternative: reserve space outside the scrolling contents, keep it in the first viewport and retain keyboard access at real zoom/height. The distant end of a long or continuously growing article is unsuitable as the sole recovery point. Mobile must retain a discoverable equivalent when navigation closes. A repeated page-footer control may share the same preference owner.

### Choose presentation

Expose full native names for a small pair, with explicit selected state. A compact list can fit larger sets or long names. A globe is supplemental; flags and country codes do not define languages. Avoid automatic IP/browser-language redirects.

AG `variant:"auto"` exposes two enabled languages and uses native select for three or more; this threshold is an authored default, and an explicit compact choice may fit long names better. `appearance:"quiet"` reduces permanent field framing in navigation while preserving focus/selection/targets. `labelVisibility:"sr-only"` keeps an associated accessible caption in clear header context. A tooltip does not make an unnamed icon accessible.

For equivalent translated URLs, use real host-owned links with lang/hreflang/rel=alternate. This component's buttons/select update an explicit in-place i18n context; routing, storage and authored content stay with the host.

Validate discoverability in an unfamiliar language, retained chapter/query/draft, non-hover keyboard/touch access, narrow/200%/short-height layout and2↔3↔1 focus transitions. RTL, native popup and target AT remain separate evidence. A source pattern or DOM pass does not qualify the host.

### In practice

**Changing language should preserve a person's current work.**

A reader selects a chapter and enters a query, then changes language. They should not have to find the material again.

Switching reloads the screen, loses a draft and uses flags instead of language names.

Show native language names, use enabled locales and retain search, selection and focus.

- Declare enabled languages and fallback
- Test English-only and long labels
- Switch language while working

### Sources

- [W3C Internationalization](https://www.w3.org/International/questions/qa-i18n) — primary
- [W3C language declarations](https://www.w3.org/International/questions/qa-html-language-declarations) — primary
- [ECMA-4022025](https://tc39.es/ecma402/2025/) — primary
- [USWDS language selector](https://designsystem.digital.gov/components/language-selector/) — primary
- [GOV.UK language navigation (trial)](https://design-system.service.gov.uk/components/language-navigation/) — primary
- [W3C localized-content selection](https://www.w3.org/International/questions/qa-navigation-select) — primary
- [USWDS two-language pattern](https://designsystem.digital.gov/patterns/select-a-language/two-languages/) — primary
- [USWDS multiple-language pattern](https://designsystem.digital.gov/patterns/select-a-language/three-or-more-languages/) — primary

<a id="event-bus-coordination"></a>

## Event bus priorities and lifetime

**Choose the smallest coordination.** Two related controls usually need a callback/parent state; EventTarget fits a simple local event. Use createEventBus when independent widgets in one view/app need named notifications with a shared lifecycle, queue bounds and priority. This headless component is neither a global singleton, state store nor durable delivery broker. Subscribers do not each call an API; use request-router or the host query layer for common reads.

**Declare ownership.** Events describe facts/hints such as selection.changed or catalog.invalidated; consequential commands use explicit application handlers and server authorization. Envelope fields are topic/payload/priority/createdAt/expiresAt. It is shallow frozen; payload is an immutable-by-convention reference. Define schema, object/version and byte budget. Avoid secrets, full forms, DOM and mutable cross-owner objects. TTL does not repair a wrong object revision. Counter snapshots contain no payloads.

**Tier scheduling.** user-blocking is short local input work; user-visible is visible state/data; background is low-priority hints. Each FIFO defaults to1024 entries. Weighted round-robin8:4:1 prevents strict-priority starvation while work remains admitted. These are AG defaults, not standards or optimal benchmark results. The persistent cursor means high priority need not be next; running JS is never preempted. Overflow returns accepted:false/capacity without silently evicting another tier; handle rejection explicitly.

**Frequent state.** Opt-in coalesceKey replaces the pending value for the same tier/topic/key, refreshes timestamp/TTL and retains its position. Use for pointer/selection state, never payments, increments, undo or every-step commands. Default TTL5000ms expires at drain, not through a per-entry timer. A full queue can reject before drain even when it retains expired entries.

**Work budget.** One cancellable macrotask processes up to256events/4ms cooperatively then yields. A long callback can exceed the budget. Subscribers are short synchronous notifications; rejected promises are diagnosed but not admission-controlled. Do not create unbounded async work there. Custom schedule must defer, call each callback at most once and return cancellation. For gestures use autoFlush:false and the host's single rAF flush; hidden documents may pause rAF.

**Lifetime.** subscribe returns idempotent unsubscribe, accepts AbortSignal and defaults to1024total listeners. Removed listeners are skipped, new ones do not join current dispatch and nested flush does not recurse. Unmount/view change/render-window eviction releases subscriptions; the scope owner disposes queues/maps/timers/abort listeners. No delivery or diagnostic callback follows disposal. No replay or persistence is promised. Test actual integration rather than inferring qualification from defaults.

- [MDN EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget)
- [MDN Scheduler.postTask](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/postTask)
- [MDN AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- [MDN BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)


<a id="request-routing-data"></a>

## Shared requests and data routing

**Route operations, not URLs.** createRequestRouter maps explicit query/command names to trusted host handlers. It does not own the address bar, History API, pages or an arbitrary HTTP proxy. Keep navigation in the host router. UI requests catalog.read; host owns transport and server authorization. Adapt an existing mature query framework rather than adding a second cache.

**Separate queries and commands.** A query requires key(input) containing all relevant parameters, locale/revision and permission/session identity. One scopeKey represents a session/tenant/privilege epoch; dispose/recreate when it changes. Scope is declared ownership, not authentication. Never put tokens/private fields in keys. Equal pending route/scope/key reads share one physical handler; a more urgent waiter may promote a queued shared read. It cannot preempt active work or override fairness. Commands have no key/cache and each admitted call is separate, with no automatic retry/replay.

**Bound admission.** Defaults are6physical active,128pending operations,512waiters,128routes and128cache entries. Exhaustion returns overloaded, not an infinite queue. Handlers start in a Promise turn after admission. The same3tier8:4:1 queue applies. Concurrency is not a rate limit: fast handlers can still create high QPS. Host/server quotas and transport backoff are separate; avoid retry loops on rejection.

**Own cancellation.** Each waiter has independent AbortSignal and finite deadline(default5000ms). One cancellation preserves other consumers. Last-consumer loss removes queued work or aborts the active handler. An ignored signal retains its physical slot until actual settlement; abandonedActive exposes the availability problem. Releasing on timeout would bypass real concurrency bounds. Cancelling waiting is not server rollback. Expose recoverable state with async-boundary or host UI.

**Freshness and identity.** Cache TTL0 disables caching; explicit query TTL starts at success. Finite LRU/lazy expiration bounds entry count, not value bytes. Shared results are immutable-by-convention references. A cache hit settles immediately and cannot later be revoked. Errors, commands and cancelled/stale results are not cached. Invalidate clears that route's cache, advances revision, cancels old waiters and prevents late completion from refilling cache/deleting a newer join. This is data-owner authority, not each widget's unmount cleanup. Unregister removes route before abort callbacks reenter. Dispose clears scope resources while cooperative transport still needs to settle.

**Verify.**100same-key consumers should make one handler call; different keys/scopes must stay distinct. Test one/last cancellation, deadline, overflow, TTL/LRU, stale invalidation, reentrant unregister, rejected handler and disposal. Programmatic counters expose actual sharing/admission/lifetime without inputs. Synthetic call reduction proves this matched fixture only, not general backend savings/QPS or production security. Server authority, CSRF, idempotency and observed business success remain host-owned.

- [MDN AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [TanStack Query defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [TanStack query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [TanStack cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)


<a id="web-security-by-design"></a>

## Web security by design

**Map trust before layout.** For a new web system, identify assets, actors, object/tenant ownership, external content, consequences and the authority that decides. Trace source → component → request → server permission check → observed outcome. API, URL, catalog, file, storage and tool output remain untrusted data. Private reads need authorization too.

**Assign responsibilities.** UI explains consequences, exposes accessible state, safely renders data and helps recovery. The server validates identity, object/action/tenant authorization on every request, allowed fields, bounds and state transitions. Hidden/disabled controls, client roles, schemas and validation do not protect APIs. Do not deliver private fields and merely hide them with CSS; opaque identifiers are not access control.

**Support people.** Keep native labels, keyboard access, accessible errors and recovery. Standard login forms support password managers, paste and correct autocomplete. Coordinate authentication, passkeys/MFA and recovery with the server owner. Risk-based reauthentication may be needed for account-access changes; a click confirmation is not authentication. Avoid indiscriminate dialogs. Login/recovery responses, status codes and timing need an account-enumeration review, including the server.

**Minimize exposure.** Exclude passwords, session/access/refresh tokens, private documents and field values from URLs, analytics, shared captures, console and agent reports. Frontend public configuration cannot keep a secret. Ordinary theme preferences differ from session credentials. Choose an established session design; cookie sessions need server-owned HttpOnly, Secure, appropriate SameSite, lifetime, rotation and logout. HttpOnly limits script reads of a cookie but does not neutralize XSS. Origin scripts can read browser storage; do not call it a secret vault.

**Use layers.** Safe contextual output, server permissions, HTTPS and applicable CSP serve different boundaries. CSP, supported Trusted Types and sandboxing supplement safe DOM and authorization. Fit policies to the runtime, test reports/integration and do not copy a preview policy to an entire product or disable CSP to make a preview work. Review third-party script privileges, necessity, pinned dependencies, updates and supply evidence; apply SRI where suitable.

**Agent workflow.** For every web plan/layout/component/review/release read web-security-by-design, safe-web-content and secure-web-actions alongside current design_brief. Retain mandatory color/accessibility gates and baseline WebMCP design. Select applicable current ASVS requirements: stable OWASP ASVS is 5.0.0 as checked2026-10-28. This is a requirements framework, not AG certification. Reuse field/textarea/Markdown/async-boundary with their actual contracts; lifecycle status and quality scores do not prove secure integration.

**Evidence.** Record requirement owner, threat, positive/negative scenario, expected/observed outcome, artifact version, environment and limits. Use pass/fail/unknown/not-applicable with reasons. Use authorized synthetic fixtures. Without server tests, authorization/session/CSRF remains unknown; do not claim full ASVS compliance or a penetration test. A visual design, rule count or green local demo is not a security certificate.

- [OWASP ASVS 5.0.0](https://asvs.owasp.org/)
- [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP HTML5 Security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)


<a id="marketplace"></a>

## Local component marketplace

Search purpose and existing variants before authoring. Draft metadata is discovery, not integration approval. Store user libraries and reports outside replaceable bundles, preserve user edits on managed upgrades and bind evidence to exact versions/hashes. Packages remain offline; consumers own routes/data and need separate validation and usage registration.

Rules: `qualification`, `design-rationale`, `library-external`, `reuse-evidence`.

Sources: [Material 3 — foundations](https://m3.material.io/foundations/), [Apple HIG — design-principles](https://developer.apple.com/design/human-interface-guidelines/design-principles), [Sketch — Apple macOS UI kit organization example](https://www.sketch.com/s/57153a31-3379-4737-8ac6-dbfd6525f052/symbols).

### In practice

**Takeaway.** Look for an existing contract before creating another component.

You need search in a long list. A native select and a searchable dropdown may look similar but solve different tasks.

**Before.** The choice is made from a thumbnail without reading behavior or limitations.

**After.** Search by task, read intended use and test the component in your composition.

Task → Contract → Verification

**Try it yourself**

- State the search task
- Read alternatives and limitations
- Verify the exact package version


<a id="component-roadmap"></a>

## Component foundations and priorities

Read current requirements and inspect existing components before creating another control. Build coherent navigation, input/actions, data/evidence, feedback and workspace groups using host semantic tokens and owned lifecycle. Prioritize repeated needs rather than demo novelty. Describe purpose, anatomy, states, variants, alternatives, limitations and budgets. A registered draft and polished preview do not admit a consumer; verify actual DS and host scenarios before reuse.

Rules: `scenario-first`, `recognition-over-recall`, `reuse-evidence`, `qualification`, `performance-boundaries`.

Sources: [Apple Segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls), [WAI APG Radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/), [WAI APG Breadcrumb](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/), [Apple Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators), [Android Progress](https://developer.android.com/develop/ui/compose/components/progress).

### In practice

**Takeaway.** Add components for recurring tasks rather than catalogue size.

Two products show similar loading and error states. Compare their contracts before extracting shared behavior.

**Before.** Each screen receives a new copy of an almost identical element.

**After.** Identify the recurring responsibility, define host boundaries and verify actual use.

Recurring task → Shared contract → Verified use

**Try it yourself**

- Find repetition across products
- Compare behavior and states
- Define readiness for the shared element

**Mandatory AG workflow after adding or changing a component.** Execute the component’s targeted functional/lifecycle tests, its real preview contract and a relevant performance scenario. Registration, generated tests and an older PASS are not execution. Samples provide element, interact() and dispose(); await asynchronous interact/whenIdle. Cover interaction failure, cleanup after failure and continuing to the next component. Connected libraries use their actual package harness, not a fake core preview.

Record executed results with component ID/version, scenario, environment and limits through design_record_performance, then read design_performance. Qualification separately uses design_report_checks with the current contract/evidence. Failed checks have outcome=failed plus phase/message; cancelled work is cancelled; completed measurement is measured. Storing a report executes no code and grants no qualification. Unavailable execution stays unknown/blocked with a reason, never PASS.

Heap per instance is retained JS memory for a live instance under an explicit method. Browser DOM/CSS timings and Node/jsdom with explicit GC remain separate rows. Process heap, RSS, GPU and component memory are not interchangeable; a negative GC median is not zero. “Time measured; memory not measured” describes missing coverage, not component failure. CLI: node --expose-gc tools/benchmark-memory.mjs --component ID --instances 40 --output /absolute/path/report.json. This is Node/jsdom evidence, not browser or AT acceptance.

<a id="brand-book"></a>

## Brand book: strategy and application

Record audience, value proposition, personality and message hierarchy before visual assets. Define logo/imagery rights, typography, color roles, spacing and examples with allowed variations and constraints. Keep brand recognition separate from semantic statuses and accessibility. Test real screens/artifacts and delivery formats; a mood board alone is not a complete production system.

Rules: .

Sources: [Atlassian — Logos](https://atlassian.design/foundations/logos/), [Atlassian — Color](https://atlassian.design/foundations/color/), [Design Council, Double Diamond](https://www.designcouncil.org.uk/resources/framework-for-innovation/), [Pentagram, Isomorphic Labs](https://www.pentagram.com/work/isomorphic-labs/story).

### In practice

**Takeaway.** A brand book explains how to make consistent visual and verbal decisions.

Different teams create a website, presentation and email. They need a shared character with practical examples.

**Before.** The document shows a palette and logo but offers no help with headlines or data.

**After.** Connect positioning, voice, visual rules and actual formats.

Strategy → Voice and graphics → Formats

**Try it yourself**

- Describe audience and promise
- Show useful and poor examples
- Keep editable sources


<a id="design-system-governance"></a>

## Design-system governance

### Decide component reuse before UI implementation

AG policy,2026-10-31. Applies to products, labs and prototypes. Standard HTML can be correct; an addressed choice and consistent geometry remain required. One broad search or recommendation is not a component decision.

1. Inventory distinct new control kinds in the affected scenario. Group identical repeats; record variants with different requirements separately.
2. Search each purpose and inspect the exact candidate. For forms consider actual select/createSelect, dropdown-select, input/textarea and field containers. Confirm IDs/exports from the current catalog/package. A mixed top3 query returning a table does not prove no select exists; refine by one purpose.
3. Read the contract, platform/exports and exact-version checks. Distinguish missing code, unavailable host/export, unsuitable contract, implemented but missing/stale qualification, and admitted applicable reuse. Draft/readyForConsumer=false is not “absent” or “broken”; old PASS cannot transfer.
4. Before markup, record one bounded row per control kind in the existing task/report: `role/location | exact ID/export/version or addressed no-match | contract/readiness evidence | reuse/adapt/native-fallback/new-in-ag and specific reason | actual checks/unknown/next step`. Update after validation. Do not create a document per button.

Prefer a suitable admitted AG component over a duplicate. Adapt public options/composition/tokens while the host owns data/routes/events. If code fits but qualification is absent, identify missing checks and either qualify/repair in AG within scope or use a permitted native fallback with an explicit limitation. Never invent PASS, enlarge scope silently or treat all drafts as unavailable implementations. For an unsuitable contract name the unmet requirement. Put new reusable behavior in AG before product duplication. If MCP is unavailable, inspect pinned offline artifacts and mark freshness unknown; transport failure is not proof of absence.

### Native fallback obligations

Native HTML, including the native element inside an AG factory, retains platform semantics. Explain the choice of factory separately from styling. A fallback still checks semantic palette/themes, density/targets, label/control/hint tracks, grid and leading/trailing padding. Reserve a separate indicator slot: native select text padding does not position its system arrow. Core0.36.1 offers local shared select-indicator.css for closed single-selects; inspect applicability and do not apply it blindly to multi/size listboxes or third-party controls.

Verify long labels/values, narrow containers, enlarged text, RTL/high contrast, focus and disabled/invalid/required states. Preserve IDs, values, events, reset and drafts; cosmetic changes must not rebuild forms. Prefer verified shared styling/tokens and improve missing common geometry in AG. CSS/token adoption alone does not claim factory qualification or authorize usage-count increments. No external assets or duplicated business logic.

At review, every new distinct control kind has a choice/reason and checks; local/native paths cannot waive geometry/accessibility. “The library did not fit”, “faster to write HTML”, “only a research demo” or a broad empty search is insufficient. Unverified checks stay unknown with an owner/next step. Missing decisions or unresolved basic visual defects cannot be reported as completed UI review.

This is a required agent workflow/manual review rule, not an implemented server-side code-generation blocker, automatic qualification or a guarantee that every model follows it. Existing admission and independent-review gates remain unchanged.


Separate shared principles/tokens/components from host routes, authorization and data. Publish purpose, supported variants, lifecycle, migration guidance and fixed offline artifacts. Preserve custom user records during managed upgrades. Qualify exact versions and real consumers separately; registration or a high score is not admission. Record design debt and ownership rather than silently declaring parity across products.

Rules: .

Sources: [USWDS — Maturity model](https://designsystem.digital.gov/maturity-model/), [USWDS — Key benefits](https://designsystem.digital.gov/about/key-benefits/), [Atlassian — Foundations](https://atlassian.design/foundations/), [DTCG Format 2025.10](https://www.designtokens.org/tr/2025.10/format/).

### In practice

**Takeaway.** Shared behavior can survive across products with different visual identities.

A team has several services. Buttons and errors should behave predictably even when palettes and density differ.

**Before.** The same component is copied into every project and evolves incompatibly.

**After.** Separate behavior contracts, style tokens, versions and evidence of actual use.

Behavior → Tokens → Products

**Try it yourself**

- Identify the contract owner
- Pin versions and migrations
- Distinguish catalogue demos from actual integrations


<a id="trend-research"></a>

## Trend research and knowledge freshness

Use primary materials and current dated examples, distinguish repeated conventions from temporary trends and document the sample selection. Popularity is not evidence of usability or originality. Preserve audience/brand/context and propose alternatives rather than imposing a fashionable effect. Record access/publication dates and uncertainty; screenshots are references, not licenses or qualifications.

Rules: .

Sources: [Adobe Express, Design Trends2026](https://www.adobe.com/express/learn/blog/design-trends-2026), [Webflow, Web Design Trends2026](https://webflow.com/blog/web-design-trends-2026), [Pentagram, Isomorphic Labs](https://www.pentagram.com/work/isomorphic-labs/story).

### In practice

**Takeaway.** A reference is useful when its date, purpose and limitations are clear.

A team notices a new visual technique. Before adopting it, understand where it helps and what it complicates.

**Before.** A popular image is treated as proof of usability for every product.

**After.** Study the original case, identify a relevant principle and test it against your own task.

Original case → Relevant principle → Own task

**Try it yourself**

- Record the source and date
- Separate the principle from branded styling
- Test the task and implementation cost


<a id="layout-grid-selection"></a>

## Choosing a layout grid by component purpose

Choose by purpose, then combine across semantic carriers. Golden Canon is the owner-preferred starting point for free creative composition; use responsive columns for operational forms/settings and comparable vertical alignment. Modular grids suit related cards and deliberate spans; Bento describes a composition of modules, while masonry is a separate arrangement algorithm with reading-order implications. A manuscript region supports sequential reading; constrain line length rather than stretching text across a display. Thirds provide four geometric focal candidates for a large image or a single-focus slide; optical subjects need explicit coordinates. Baseline grids follow body leading and may differ per text frame; require an actual renderer baseline, never a box edge. Spacing lattices check declared coordinate rhythm; they do not automatically measure every gap/padding or justify snapping data values. AG counts, margins and tolerances are authored defaults. Retain host constraints, reading order, minimum content size and actual optical checks.

- [IBM Carbon — 2x Grid](https://www.carbondesignsystem.com/building-blocks/foundations/2x-grid/overview)
- [Atlassian — Grid](https://atlassian.design/foundations/grid)
- [Atlassian — Spacing](https://atlassian.design/foundations/spacing)
- [Adobe — Baseline grid](https://helpx.adobe.com/in/indesign/desktop/layout-and-grid-tools/grids/use-a-baseline-grid.html)
- [Adobe — Document grid](https://helpx.adobe.com/indesign/desktop/layout-and-grid-tools/grids/use-a-document-grid.html)
- [Adobe — Rule of thirds](https://www.adobe.com/creativecloud/photography/technique/rule-of-thirds.html)


<a id="nested-layout-grids"></a>

## Local grids, mixed scopes and inherited axes

Use semantic scopes: page → component → inner block, each with a border-box carrier and local coordinates. Explicit node override wins over the declared per-purpose default; page choice is separate. A local grid recalculates inside its carrier. Inherited axes project the immediate parent guides into the child and clip them; return sourceScopeId/profile for each axis. Mixed inherited x/local y produces explicitly composite targets (ag-inherited-guides-v1), not a claimed pure Canon hit. CSS subgrid additionally inherits actual track sizing; diagnostic guide projection does not assert or mutate CSS subgrid. Stop recursion at meaningful content; retain font size, reading order, minimum content/gaps and reflow exceptions.

Persist overrides only for declared composition node IDs. Capture-local DOM parts (@part/…) use blockGrid and cannot own saved overrides; promote a block to an explicit composition node for individual choice. The synthetic @page carrier cannot collide with the valid declared ID page. Inner-owner activity invalidates evidence; active animations remain partial snapshots.

- [MDN — CSS Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Subgrid)
- [Adobe — Baseline grid](https://helpx.adobe.com/in/indesign/desktop/layout-and-grid-tools/grids/use-a-baseline-grid.html)
- [IBM Carbon — 2x Grid](https://www.carbondesignsystem.com/building-blocks/foundations/2x-grid/overview)


<a id="layout-grid-inspection"></a>

## Numeric grid inspection through MCP before image review

Discover design_layout_grids and find/read layout-grid-selection, nested-layout-grids and layout-grid-inspection. Use check_layout_grids for declarative numeric scopes and inspect_layout_grids for an addressed latest sandbox capture. Report document/revision/hash, scenario, capture identity and gridConfigHash, unit, carrier origins, axis provenance, owner/anchor IDs, nearest targets, dx/dy/distance/tolerance, coverage and reasons. Whitelist numeric fields; never publish node.name, aria labels, text, field values or URLs. Invalidate current findings on settings/revision/scenario/viewport/scroll changes and expiry. Columns default to x-line checks, baseline needs renderer/native baseline provenance, Golden/thirds use 2D point distance. Hidden/clipped/unsupported transforms, missing baseline, incomplete/stale evidence remain unknown. Empty anchors are unknown. Geometric fit cannot qualify aesthetics, comprehension or accessibility. PPTX uses structural OOXML and editable guide copies, not raster recognition.

- [Adobe — Document grid](https://helpx.adobe.com/indesign/desktop/layout-and-grid-tools/grids/use-a-document-grid.html)
- [Adobe — Baseline grid](https://helpx.adobe.com/in/indesign/desktop/layout-and-grid-tools/grids/use-a-baseline-grid.html)
- [MDN — CSS Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Subgrid)


<a id="grid-golden-canon"></a>

## Golden Canon Grid — composition and checks

**Task.** Creative page/slide composition.

**Construction.** AG uses the compatible reduced ag-diagonal-core-v1, not a copied brand template or phi grid. Consider it first for creative page/slide composition; operational forms, reading and controls may need another profile. Geometry is carrier-local and children can choose independently.

**Try the example.** Change frame format, applicable side/reflection and declared X/Y point. The schematic exposes actual template geometry. Hit/miss/unknown and target coordinates use the same engine as MCP/PPTX; no photograph recognition is performed.

**Choose another when needed.** Respect actual content, reading/operational constraints and host layout rather than forcing this profile.

**Nesting and icons.** Page/component/inner block may use different grids. Explicit inherited X/Y projects parent guides, clears local special guides and does not implement CSS subgrid sizing. UI glyphs start with icon-keylines/spacing and the existing family; expressive framing belongs to justified larger illustrative marks. Read machine-readable iconSuitability through design_layout_grids.

**Verify.** Declare carrier, units, anchors and tolerance first. Never mix css-px/pt/emu, object box and optical focus, point/guide targets or unproven baselines. Inspect numbers before actual crop/contrast/recognition/composition. PPTX review copies contain editable guides and preserve the original; nativeOffice, AT and professional/aesthetic qualification remain unknown without separate evidence.

- [Obys — Grids](https://grids.obys.agency/)


<a id="grid-columns"></a>

## Responsive columns — composition and checks

**Task.** Aligned operational forms/catalogs.

**Construction.** Columns are calculated inside margins with separate gutters, with counts responding to carrier width. Measure actual X track edges. Content/minimum widths/wrapping matter more than a column count. This does not replace the catalog’s existing Pinterest/masonry layout.

**Try the example.** Change frame format, applicable side/reflection and declared X/Y point. The schematic exposes actual template geometry. Hit/miss/unknown and target coordinates use the same engine as MCP/PPTX; no photograph recognition is performed.

**Choose another when needed.** Respect actual content, reading/operational constraints and host layout rather than forcing this profile.

**Nesting and icons.** Page/component/inner block may use different grids. Explicit inherited X/Y projects parent guides, clears local special guides and does not implement CSS subgrid sizing. UI glyphs start with icon-keylines/spacing and the existing family; expressive framing belongs to justified larger illustrative marks. Read machine-readable iconSuitability through design_layout_grids.

**Verify.** Declare carrier, units, anchors and tolerance first. Never mix css-px/pt/emu, object box and optical focus, point/guide targets or unproven baselines. Inspect numbers before actual crop/contrast/recognition/composition. PPTX review copies contain editable guides and preserve the original; nativeOffice, AT and professional/aesthetic qualification remain unknown without separate evidence.

- [Atlassian — Grid](https://atlassian.design/foundations/grid)
- [IBM Carbon — 2x Grid](https://www.carbondesignsystem.com/building-blocks/foundations/2x-grid/overview)


<a id="grid-modular"></a>

## Modular / Bento — composition and checks

**Task.** Meaningful modular cards and dashboards.

**Construction.** Rows/columns with margins/gutters support meaningful modules/spans. Bento is a composition technique, not another magic formula. Preserve semantic/keyboard order and importance; never fill gaps at the expense of meaning. Existing catalog layout remains owned by its host.

**Try the example.** Change frame format, applicable side/reflection and declared X/Y point. The schematic exposes actual template geometry. Hit/miss/unknown and target coordinates use the same engine as MCP/PPTX; no photograph recognition is performed.

**Choose another when needed.** Respect actual content, reading/operational constraints and host layout rather than forcing this profile.

**Nesting and icons.** Page/component/inner block may use different grids. Explicit inherited X/Y projects parent guides, clears local special guides and does not implement CSS subgrid sizing. UI glyphs start with icon-keylines/spacing and the existing family; expressive framing belongs to justified larger illustrative marks. Read machine-readable iconSuitability through design_layout_grids.

**Verify.** Declare carrier, units, anchors and tolerance first. Never mix css-px/pt/emu, object box and optical focus, point/guide targets or unproven baselines. Inspect numbers before actual crop/contrast/recognition/composition. PPTX review copies contain editable guides and preserve the original; nativeOffice, AT and professional/aesthetic qualification remain unknown without separate evidence.

**Implemented Bento layout · createBentoGrid / bento-grid.** Use for a product overview, feature presentation or dashboard whose modules have different importance. Spans express hierarchy, not gap filling. Pass a host-localized label and items:{id,content,colSpan,rowSpan}; content is an existing HTMLElement, never HTML text. The host owns headings, actions, data and nested component disposal. Columns adapt to container width; one column resets rowSpan to1 and uses natural content height. Preserve the existing Pinterest catalogue. Prefer masonry-layout for independent natural-height cards, equal cells for peers, and tables/forms for their original tasks.

Keep semantic DOM/Tab order: no dense placement or CSS order. Test320px,200%text, long content, RTL, focus/input preservation, resize and cleanup. update keeps keyed nodes; refresh supports environments without ResizeObserver; dispose releases owned observers. getLayout returns columns/spans and local x/y/width/height without card text or form values; refresh/re-measure stale results. Nested components may choose another local grid; inspect numeric anchors with layout-grid-overlay. Golden Canon remains a creative composition candidate; modular tracks are the explicit choice here. Configurable AG defaults:4max columns,minColumnWidth200px,gap16px,rowMinHeight140px; limits64items,colSpan1..12,rowSpan1..6. These are implementation limits/defaults, not WCAG numbers.

**Card height.** createBentoGrid alignItems:"start" keeps each card at natural height when a short activity module shares a row with a long table; top edges and gutter remain aligned. Default "stretch" preserves existing rowSpan filling for large modules. Learning Air uses start; analytics retains stretch. getLayout().alignItems and actual bounds expose this numerically. This is shared-row alignment, not masonry or CSS reordering.

- [IBM Carbon — 2x Grid](https://www.carbondesignsystem.com/building-blocks/foundations/2x-grid/overview)
- [Adobe — Document grid](https://helpx.adobe.com/indesign/desktop/layout-and-grid-tools/grids/use-a-document-grid.html)
- [MDN — Grid layout and accessibility](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Grid_layout_and_accessibility)
- [W3C — C27 meaningful DOM/visual order](https://www.w3.org/WAI/WCAG22/Techniques/css/C27)


<a id="grid-baseline"></a>

## Typography baseline — composition and checks

**Task.** Actual text baseline rhythm.

**Construction.** Step follows real leading and a declared text ordinate. A box edge is not a baseline. Require y plus renderer-baseline/native-text-engine provenance; the browser schematic stays unknown without measurement. Nested text may use its own step.

**Try the example.** Change frame format, applicable side/reflection and declared X/Y point. The schematic exposes actual template geometry. Hit/miss/unknown and target coordinates use the same engine as MCP/PPTX; no photograph recognition is performed.

**Choose another when needed.** Respect actual content, reading/operational constraints and host layout rather than forcing this profile.

**Nesting and icons.** Page/component/inner block may use different grids. Explicit inherited X/Y projects parent guides, clears local special guides and does not implement CSS subgrid sizing. UI glyphs start with icon-keylines/spacing and the existing family; expressive framing belongs to justified larger illustrative marks. Read machine-readable iconSuitability through design_layout_grids.

**Verify.** Declare carrier, units, anchors and tolerance first. Never mix css-px/pt/emu, object box and optical focus, point/guide targets or unproven baselines. Inspect numbers before actual crop/contrast/recognition/composition. PPTX review copies contain editable guides and preserve the original; nativeOffice, AT and professional/aesthetic qualification remain unknown without separate evidence.

- [Adobe — Baseline grid](https://helpx.adobe.com/in/indesign/desktop/layout-and-grid-tools/grids/use-a-baseline-grid.html)


<a id="grid-spacing"></a>

## Spacing lattice — composition and checks

**Task.** Repeated local coordinates.

**Construction.** A repeated lattice supports coordinate rhythm. The general8CSSpx default is authored reference, not a universal standard. An icon recipe with no explicit spacing step uses2units in a24unit carrier. Hits do not verify every padding/gap or waive optical correction.

**Try the example.** Change frame format, applicable side/reflection and declared X/Y point. The schematic exposes actual template geometry. Hit/miss/unknown and target coordinates use the same engine as MCP/PPTX; no photograph recognition is performed.

**Choose another when needed.** Respect actual content, reading/operational constraints and host layout rather than forcing this profile.

**Nesting and icons.** Page/component/inner block may use different grids. Explicit inherited X/Y projects parent guides, clears local special guides and does not implement CSS subgrid sizing. UI glyphs start with icon-keylines/spacing and the existing family; expressive framing belongs to justified larger illustrative marks. Read machine-readable iconSuitability through design_layout_grids.

**Verify.** Declare carrier, units, anchors and tolerance first. Never mix css-px/pt/emu, object box and optical focus, point/guide targets or unproven baselines. Inspect numbers before actual crop/contrast/recognition/composition. PPTX review copies contain editable guides and preserve the original; nativeOffice, AT and professional/aesthetic qualification remain unknown without separate evidence.

- [Atlassian — Spacing](https://atlassian.design/foundations/spacing)
- [IBM Carbon — 2x Grid](https://www.carbondesignsystem.com/building-blocks/foundations/2x-grid/overview)


<a id="grid-thirds"></a>

## Rule of thirds — composition and checks

**Task.** Explicit photographic/cover focal placement.

**Construction.** Two vertical/horizontal guides provide4intersections for focal placement and space. This is not an operational-form grid. Declare the real optical subject/gaze; image-box centre does not recognize it. Review crops at each aspect ratio.

**Try the example.** Change frame format, applicable side/reflection and declared X/Y point. The schematic exposes actual template geometry. Hit/miss/unknown and target coordinates use the same engine as MCP/PPTX; no photograph recognition is performed.

**Choose another when needed.** Respect actual content, reading/operational constraints and host layout rather than forcing this profile.

**Nesting and icons.** Page/component/inner block may use different grids. Explicit inherited X/Y projects parent guides, clears local special guides and does not implement CSS subgrid sizing. UI glyphs start with icon-keylines/spacing and the existing family; expressive framing belongs to justified larger illustrative marks. Read machine-readable iconSuitability through design_layout_grids.

**Verify.** Declare carrier, units, anchors and tolerance first. Never mix css-px/pt/emu, object box and optical focus, point/guide targets or unproven baselines. Inspect numbers before actual crop/contrast/recognition/composition. PPTX review copies contain editable guides and preserve the original; nativeOffice, AT and professional/aesthetic qualification remain unknown without separate evidence.

- [Adobe — Rule of thirds](https://www.adobe.com/creativecloud/photography/technique/rule-of-thirds.html)


<a id="grid-manuscript"></a>

## Single-column manuscript — composition and checks

**Task.** Sequential reading.

**Construction.** A single reading area with margins supports sequential material. Check actual text/font/line length; matching a border does not establish readability. For icons this is surrounding layout, not the primary internal construction.

**Try the example.** Change frame format, applicable side/reflection and declared X/Y point. The schematic exposes actual template geometry. Hit/miss/unknown and target coordinates use the same engine as MCP/PPTX; no photograph recognition is performed.

**Choose another when needed.** Respect actual content, reading/operational constraints and host layout rather than forcing this profile.

**Nesting and icons.** Page/component/inner block may use different grids. Explicit inherited X/Y projects parent guides, clears local special guides and does not implement CSS subgrid sizing. UI glyphs start with icon-keylines/spacing and the existing family; expressive framing belongs to justified larger illustrative marks. Read machine-readable iconSuitability through design_layout_grids.

**Verify.** Declare carrier, units, anchors and tolerance first. Never mix css-px/pt/emu, object box and optical focus, point/guide targets or unproven baselines. Inspect numbers before actual crop/contrast/recognition/composition. PPTX review copies contain editable guides and preserve the original; nativeOffice, AT and professional/aesthetic qualification remain unknown without separate evidence.

- [Atlassian — Grid](https://atlassian.design/foundations/grid)


<a id="grid-edge-balance"></a>

## Edge balance — composition and checks

**Task.** Single subject near a chosen edge with opposing space/counterweight.

**Construction.** Choose left/right/top/bottom. AG defaults insetRatio0.18/focusRatio0.4 define a subject point; counterweight/negative-space regions are authored suggestions, not recognized image content. Preserve essential content across crops. Suitable for a cover/hero/large illustrative mark, not a tiny action glyph.

**Try the example.** Change frame format, applicable side/reflection and declared X/Y point. The schematic exposes actual template geometry. Hit/miss/unknown and target coordinates use the same engine as MCP/PPTX; no photograph recognition is performed.

**Choose another when needed.** Do not crop essential content or infer psychological impact from a ratio.

**Nesting and icons.** Page/component/inner block may use different grids. Explicit inherited X/Y projects parent guides, clears local special guides and does not implement CSS subgrid sizing. UI glyphs start with icon-keylines/spacing and the existing family; expressive framing belongs to justified larger illustrative marks. Read machine-readable iconSuitability through design_layout_grids.

**Verify.** Declare carrier, units, anchors and tolerance first. Never mix css-px/pt/emu, object box and optical focus, point/guide targets or unproven baselines. Inspect numbers before actual crop/contrast/recognition/composition. PPTX review copies contain editable guides and preserve the original; nativeOffice, AT and professional/aesthetic qualification remain unknown without separate evidence.

- [Smithsonian — Video handbook](https://folklife-media.si.edu/docs/folklife/education_exhibits/resources/English-Video-Handbook.pdf)
- [Fujifilm — Negative space](https://www.fujifilm-x.com/en-gb/learning-centre/using-negative-space/)


<a id="grid-lead-room"></a>

## Look / lead room — composition and checks

**Task.** Portrait/motion framing when gaze/action direction is explicitly known.

**Construction.** The example places the subject on a chosen left/right third with room in front. Adjustable eyeLevel1/3 is an AG template, not a universal headroom requirement. Declare real gaze/motion direction. Reversed/tight framing can be an intentional artistic choice.

**Try the example.** Change frame format, applicable side/reflection and declared X/Y point. The schematic exposes actual template geometry. Hit/miss/unknown and target coordinates use the same engine as MCP/PPTX; no photograph recognition is performed.

**Choose another when needed.** An image box does not reveal gaze; cramped/reversed framing needs explicit intent.

**Nesting and icons.** Page/component/inner block may use different grids. Explicit inherited X/Y projects parent guides, clears local special guides and does not implement CSS subgrid sizing. UI glyphs start with icon-keylines/spacing and the existing family; expressive framing belongs to justified larger illustrative marks. Read machine-readable iconSuitability through design_layout_grids.

**Verify.** Declare carrier, units, anchors and tolerance first. Never mix css-px/pt/emu, object box and optical focus, point/guide targets or unproven baselines. Inspect numbers before actual crop/contrast/recognition/composition. PPTX review copies contain editable guides and preserve the original; nativeOffice, AT and professional/aesthetic qualification remain unknown without separate evidence.

- [Smithsonian — Video handbook](https://folklife-media.si.edu/docs/folklife/education_exhibits/resources/English-Video-Handbook.pdf)
- [Fujifilm — Negative space](https://www.fujifilm-x.com/en-gb/learning-centre/using-negative-space/)


<a id="grid-center-perspective"></a>

## Central perspective — composition and checks

**Task.** Symmetric emphasis/architecture with a declared vanishing point and converging guides.

**Construction.** AG offers a declared vanishing point(0.5,0.45) and8finite segments from corners/edge centres. The point is adjustable; real scene perspective needs separate review. Symmetry is deliberate, not proof that every frame should be centred.

**Try the example.** Change frame format, applicable side/reflection and declared X/Y point. The schematic exposes actual template geometry. Hit/miss/unknown and target coordinates use the same engine as MCP/PPTX; no photograph recognition is performed.

**Choose another when needed.** Not camera calibration, scene reconstruction or automatic perspective inference.

**Nesting and icons.** Page/component/inner block may use different grids. Explicit inherited X/Y projects parent guides, clears local special guides and does not implement CSS subgrid sizing. UI glyphs start with icon-keylines/spacing and the existing family; expressive framing belongs to justified larger illustrative marks. Read machine-readable iconSuitability through design_layout_grids.

**Verify.** Declare carrier, units, anchors and tolerance first. Never mix css-px/pt/emu, object box and optical focus, point/guide targets or unproven baselines. Inspect numbers before actual crop/contrast/recognition/composition. PPTX review copies contain editable guides and preserve the original; nativeOffice, AT and professional/aesthetic qualification remain unknown without separate evidence.

- [Smithsonian — Video handbook](https://folklife-media.si.edu/docs/folklife/education_exhibits/resources/English-Video-Handbook.pdf)
- [Nikon School — Leading lines](https://nikonschool.co.uk/hints-and-tips/using-leading-lines-in-your-compositions)


<a id="grid-phi-grid"></a>

## Phi grid — composition and checks

**Task.** Near-centre intersections around0.382/0.618 for a frame, cover or large mark.

**Construction.** Fractions(3−√5)/2 and its complement produce about0.382/0.618 on X/Y and4interest points. This phi construction differs from diagonal Golden Canon. One ratio proves neither beauty, recognition nor authorship; compare matched alternatives.

**Try the example.** Change frame format, applicable side/reflection and declared X/Y point. The schematic exposes actual template geometry. Hit/miss/unknown and target coordinates use the same engine as MCP/PPTX; no photograph recognition is performed.

**Choose another when needed.** Distinct from Golden Canon; no universal-beauty or historical-proof claim.

**Nesting and icons.** Page/component/inner block may use different grids. Explicit inherited X/Y projects parent guides, clears local special guides and does not implement CSS subgrid sizing. UI glyphs start with icon-keylines/spacing and the existing family; expressive framing belongs to justified larger illustrative marks. Read machine-readable iconSuitability through design_layout_grids.

**Verify.** Declare carrier, units, anchors and tolerance first. Never mix css-px/pt/emu, object box and optical focus, point/guide targets or unproven baselines. Inspect numbers before actual crop/contrast/recognition/composition. PPTX review copies contain editable guides and preserve the original; nativeOffice, AT and professional/aesthetic qualification remain unknown without separate evidence.

- [Martin Evening — Crop overlays](https://www.photoshopforphotographers.com/3101-1901/Help_guide/tp/Crop_tool.html)
- [Fujifilm — Negative space](https://www.fujifilm-x.com/en-gb/learning-centre/using-negative-space/)


<a id="grid-golden-triangle"></a>

## Golden triangle — composition and checks

**Task.** Main diagonal plus perpendiculars from opposite corners, measured in physical carrier coordinates.

**Construction.** Join opposite corners, then physically project perpendiculars from the remaining corners onto that finite segment. The feet are numeric interests. X/Y reflections are physical carrier operations. Recompute after an aspect change instead of stretching square geometry.

**Try the example.** Change frame format, applicable side/reflection and declared X/Y point. The schematic exposes actual template geometry. Hit/miss/unknown and target coordinates use the same engine as MCP/PPTX; no photograph recognition is performed.

**Choose another when needed.** Do not stretch normalized45° lines into assumed perpendiculars; triangles are not universally phi-shaped.

**Nesting and icons.** Page/component/inner block may use different grids. Explicit inherited X/Y projects parent guides, clears local special guides and does not implement CSS subgrid sizing. UI glyphs start with icon-keylines/spacing and the existing family; expressive framing belongs to justified larger illustrative marks. Read machine-readable iconSuitability through design_layout_grids.

**Verify.** Declare carrier, units, anchors and tolerance first. Never mix css-px/pt/emu, object box and optical focus, point/guide targets or unproven baselines. Inspect numbers before actual crop/contrast/recognition/composition. PPTX review copies contain editable guides and preserve the original; nativeOffice, AT and professional/aesthetic qualification remain unknown without separate evidence.

- [CBSE — Introduction to photography](https://cbseacademic.nic.in/web_material/Curriculum24/publication/Photography_Module2.pdf)
- [Martin Evening — Crop overlays](https://www.photoshopforphotographers.com/3101-1901/Help_guide/tp/Crop_tool.html)


<a id="grid-diagonal-flow"></a>

## Diagonal flow — composition and checks

**Task.** A diagonal leading flow, crossing and intermediate interest points for dynamic framing.

**Construction.** Frame diagonals plus1/3,1/2,2/3points suggest attention flow. Angles depend on aspect ratio, not a universal45° rule. Explicit guide anchors measure finite segments; point anchors measure declared interests. Keep these criteria distinct.

**Try the example.** Change frame format, applicable side/reflection and declared X/Y point. The schematic exposes actual template geometry. Hit/miss/unknown and target coordinates use the same engine as MCP/PPTX; no photograph recognition is performed.

**Choose another when needed.** Not a universal45° Diagonal Method; physical angles depend on aspect ratio and motion is not inferred.

**Nesting and icons.** Page/component/inner block may use different grids. Explicit inherited X/Y projects parent guides, clears local special guides and does not implement CSS subgrid sizing. UI glyphs start with icon-keylines/spacing and the existing family; expressive framing belongs to justified larger illustrative marks. Read machine-readable iconSuitability through design_layout_grids.

**Verify.** Declare carrier, units, anchors and tolerance first. Never mix css-px/pt/emu, object box and optical focus, point/guide targets or unproven baselines. Inspect numbers before actual crop/contrast/recognition/composition. PPTX review copies contain editable guides and preserve the original; nativeOffice, AT and professional/aesthetic qualification remain unknown without separate evidence.

- [Nikon School — Leading lines](https://nikonschool.co.uk/hints-and-tips/using-leading-lines-in-your-compositions)
- [Smithsonian — Video handbook](https://folklife-media.si.edu/docs/folklife/education_exhibits/resources/English-Video-Handbook.pdf)


<a id="grid-icon-keylines"></a>

## Icon keylines — composition and checks

**Task.** A coherent UI icon family using live area, square/circle and portrait/landscape keylines.

**Construction.** AG’s24unit square uses live area2..22,18square,20diameter circle and16×20/20×16rectangles to compare a family. These are adapted templates, not new IBM/Material mandates. The square uses the shorter side inside a rectangular carrier, preserving circles. Review visible stroke bounds and actual sizes.

**Try the example.** Change frame format, applicable side/reflection and declared X/Y point. The schematic exposes actual template geometry. Hit/miss/unknown and target coordinates use the same engine as MCP/PPTX; no photograph recognition is performed.

**Choose another when needed.** A geometric box does not establish optical centring, recognition or stroke quality at actual sizes.

**Nesting and icons.** Page/component/inner block may use different grids. Explicit inherited X/Y projects parent guides, clears local special guides and does not implement CSS subgrid sizing. UI glyphs start with icon-keylines/spacing and the existing family; expressive framing belongs to justified larger illustrative marks. Read machine-readable iconSuitability through design_layout_grids.

**Verify.** Declare carrier, units, anchors and tolerance first. Never mix css-px/pt/emu, object box and optical focus, point/guide targets or unproven baselines. Inspect numbers before actual crop/contrast/recognition/composition. PPTX review copies contain editable guides and preserve the original; nativeOffice, AT and professional/aesthetic qualification remain unknown without separate evidence.

- [IBM Design Language — UI icons](https://www.ibm.com/design/language/iconography/ui-icons/design/)
- [Material Design — Icon grid (legacy reference)](https://m1.material.io/style/icons.html)


<a id="assistant-action-contract"></a>

## One task, one action contract

**AG policy.** Model a meaningful task such as finding a document or changing a due date. Give it one domain handler, used by human controls and thin native, WebMCP or MCP adapters. Avoid exposing individual pointer motions or duplicating business rules.

**Action record.** Declare a stable ID and contract version, verb/object name, purpose, typed inputs, constraints, caller/account scope, permissions, read/write effects, result and errors. Writes include the expected object revision and an explicit retry strategy. Never silently repeat a write after an ambiguous outcome. Return an operation ID, resulting revision and object link. Distinguish cancellation before commit from work already committed.

**Entities and trust.** Use stable IDs and bounded disambiguation; resolve “this board” from explicit current context. Distinguish omitted fields from clearing them. Specify date/time zones. Descriptions explain behavior rather than instruct an agent. Enforce authorization and validation in the application on every call; schema hints are not security. Match confirmation to consequences, minimize retained data and treat document text as untrusted content.

**Boundary.** MCP supports local and remote transports. WebMCP exposes page tools. Neither is interchangeable with an operating-system action registry. This is AG architecture guidance, not an included executor.

Practice:

- Write one action and entity record
- Test ambiguous entity names
- Retry an ambiguous response without duplicating a write

- [MCP — Architecture](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)
- [Chrome — WebMCP](https://developer.chrome.com/docs/ai/webmcp)
- [Android — AppFunctions quality guidelines](https://developer.android.com/ai/appfunctions/quality-guidelines)


<a id="native-assistant-overview"></a>

## Native applications in assistant ecosystems

**Landscape.** Apple App Intents, Windows App Actions and Android AppFunctions use different discovery and execution contracts. Linux combines D-Bus with desktop interfaces. WebMCP is a developing page-tool interface, not a portable native API.

**AG decision.** Select useful tasks first: find/open an entity, create a draft, change state or export. A deep link supports navigation but is not by itself assistant registration. Keep semantic UI and keyboard interaction. Coordinate-based automation is a separate validation path.

**Cross-platform shells.** A styled HTML component cannot register an OS action. A thin native adapter must validate callers and forward bounded commands to the shared domain handler. Bind a WebView bridge to a trusted origin and session; do not expose arbitrary scripts, paths or method dispatch.

**Delivery matrix.** Record OS, SDK, assistant version, package identity/entitlements, activation channel, foreground/background behavior, discovery settings, data restrictions and test evidence. Keep researched, implemented, discovered and successfully executed states separate. Evidence from one desktop does not qualify all platforms.

**Freshness.** Sources checked 2026-10-31. Recheck target release notes and availability before shipping. AG provides guidance here; it does not include these native adapters.

Practice:

- Choose two useful application tasks
- Map them to platform adapters
- Record actual qualification states

- [Apple — App Intents and App Schemas, WWDC26](https://developer.apple.com/videos/play/wwdc2026/240/)
- [Microsoft — App Actions on Windows](https://learn.microsoft.com/en-us/windows/ai/app-actions/)
- [Android — AppFunctions overview](https://developer.android.com/ai/appfunctions)
- [freedesktop — D-Bus application activation](https://specifications.freedesktop.org/desktop-entry/latest/dbus.html)
- [Chrome — WebMCP](https://developer.chrome.com/docs/ai/webmcp)


<a id="apple-app-intents"></a>

## macOS and Apple: App Intents

**Platform scope.** App Intents describes application actions/content for system experiences such as Shortcuts and Spotlight. Apple’s WWDC26 material covers entities, matching schemas, search and visible context for Siri. Map each capability to the target OS/SDK; declaring an intent does not establish every Siri scenario on every device.

**AG recommendation.** Start with two frequent tasks, such as finding a project and opening a board. Use stable entity IDs, meaningful names and bounded search. Adopt an App Schema only when its semantics genuinely fit. Do not disguise an internal card as a message or photo. Share visible context explicitly and within authorized scope.

**Execution and proof.** A Swift adapter delegates to the shared handler with the same permissions and revisions. Return meaningful results/errors and open the exact entity when UI is needed. Define background work, cancellation and recovery. Keep AppleScript, Apple Events and accessibility automation separate from App Intents. Test the domain handler and available AppIntentsTesting tooling, then Shortcuts, entity discovery and the requested Siri journey. Cover voice-only use, locales, ambiguity and denied access. Record the actual device/OS/SDK/assistant/region and untested stages. AG does not automatically ship the Swift adapter.

Practice:

- Model a board entity and its query
- Test the action in Shortcuts on the target macOS
- Verify Siri discovery and execution separately

- [Apple — App Intents and App Schemas, WWDC26](https://developer.apple.com/videos/play/wwdc2026/240/)


<a id="windows-app-actions"></a>

## Windows: App Actions and activation

**Platform facts.** Microsoft’s App Actions documentation, updated 2026-10-14, describes atomic operations, packaged JSON definitions, package identity and MSIX manifest registration. Activation uses a URI or COM IActionProvider. Check target Windows/SDK and distribution-channel availability.

**AG recommendation.** Publish complete tasks useful outside the window: find an entity, prepare a document or open a report. Version action definitions with the handler. Keep inputs, units, optional fields and errors consistent with the domain contract. A URI is not authorization and must not contain secrets.

**Adapter and qualification.** Choose URI launch/navigation or supported COM execution by task. Both retain the same validation and permissions. Packaged PWA registration is a separate integration; an ordinary website or deep link is insufficient. UI Automation is a different mechanism. Verify installation/update, discovery, entity transfer, cold activation, cancellation, denied access and visible outcome. Record actual OS/SDK/package/client versions. A successful package build does not prove an assistant journey.

Practice:

- Choose a task and URI/COM activation
- Compare the action definition with its handler contract
- Verify discovery after installation and update

- [Microsoft — App Actions on Windows](https://learn.microsoft.com/en-us/windows/ai/app-actions/)


<a id="android-app-functions"></a>

## Android: AppFunctions and preview boundaries

**Status checked 2026-10-31.** Official documentation calls AppFunctions an experimental preview for Android 16+. Gemini integration is described as a private preview for trusted testers since May 2026. Building a function does not make it available to every assistant. Recheck current SDK/Jetpack requirements and access conditions.

**Design.** Give each function one task, a concise verb/object name and an accurate outcome description, not instructions to the agent. Minimize inputs and use supported types. Distinguish omitted updates from clearing a value. Verify optional-argument defaults against the actual library contract, not only the Kotlin declaration.

**Execution.** Reuse application validation and permissions. Check function availability and caller authorization, including the platform EXECUTE_APP_FUNCTIONS requirement. Avoid highly sensitive data. Return appropriate AppFunctionException types and useful messages. For UI handoff, follow Android’s explicit immutable PendingIntent guidance. App Links and ordinary intents do not prove AppFunction discovery. Verify API behavior, authorized caller and real assistant separately; preserve the human UI when unavailable. AG does not treat preview guidance as a shipped integration.

Practice:

- Describe one function without agent instructions
- Test omitted versus cleared update fields
- Record API and assistant tests separately

- [Android — AppFunctions overview](https://developer.android.com/ai/appfunctions)
- [Android — AppFunctions quality guidelines](https://developer.android.com/ai/appfunctions/quality-guidelines)


<a id="linux-assistant-interfaces"></a>

## Linux: D-Bus, desktop actions and adapters

**Foundation.** freedesktop specifies org.freedesktop.Application with Activate, Open and ActivateAction, tied to desktop-file and D-Bus identities. This supports activation and desktop actions; it is not a universal Linux AI-tool registry.

**AG recommendation.** Separate entity navigation, search and mutation. Use desktop actions for entry points, a narrow application D-Bus interface for permitted commands, and an optional MCP adapter for compatible clients. Qualify the actual GNOME/KDE/other environment instead of inferring equivalence from bus availability.

**Contract and proof.** Document allowlisted methods, versions, types, errors and completion events. Introspection signatures do not establish intent or authorization. Check callers and data scope; never expose arbitrary shell execution or the whole session bus. Validate URI schemes and target entities. Record distribution, desktop environment, Wayland/X11, package and client; test cold activation, denied access, cancellation and completion. AT-SPI/keyboard accessibility is a separate path. Missing adapters retain a clear human fallback.

Practice:

- Separate activation, search and mutation
- Document allowed methods and callers
- Complete one task in the target desktop environment

- [freedesktop — D-Bus application activation](https://specifications.freedesktop.org/desktop-entry/latest/dbus.html)
- [MCP — Architecture](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)


<a id="agent-control"></a>

## Agent actions and human control

Keep request, response, current state and boundaries visible. Host capabilities and explicit user authorization govern actions. An observed operation or success message is not permission to execute. Unknown sends require reconciliation, not automatic replay. Approval, implementation review and merge permission remain distinct. Keep source text and commands inert when presenting them.

Rules: `agent-transparency`, `agent-log-bounds`.

Sources: [Microsoft — human-centered agent design](https://learn.microsoft.com/ru-ru/agents/design-guidelines/human-centered-design), [NN/g — ten-usability-heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).

### In practice

**Takeaway.** People should understand agent actions and retain control over consequences.

An agent prepares a change and requests approval. The user needs the object, expected effect and a way to decline.

**Before.** The approval button is detached from its operation and a sent status looks like unverified success.

**After.** Tie the decision to a specific operation and distinguish waiting, results and uncertain delivery.

Operation → Approval → Result

**Try it yourself**

- Identify the operation's object
- Explain effects before approval
- Test decline and recovery


<a id="human-first-agent-interfaces"></a>

## Human-first interfaces usable by agents

**People first.** Start with a clear task, ordinary navigation, meaningful labels and visible object/action/state/result. Agents benefit from the same semantics; do not overload the screen or replace approved palettes, Pinterest/masonry or hierarchy for automation. Accessibility serves people independently; it does not guarantee every agent can finish a task.

**One meaning across interaction methods.** Use native buttons for actions, href links for navigation, associated labels/inputs, radios/checkboxes/selects and real headings/lists/tables. An ARIA role promises keyboard behavior but does not implement it. Accessible names contain visible label words; disambiguate repeated actions by a named card/region and meaningful object context. Never replace labels with UUIDs or embed agent instructions in ARIA. Placeholder/tooltip is supplementary. Preserve full semantic text; wrap layout and edit copy deliberately rather than truncating stored names.

**Observable structure and state.** Reflect actual checked/selected/expanded/disabled/invalid and relationships. Connect tabs/panels, fields/errors and row/actions. Meaningful DOM/focus order and truly inactive panels matter. Avoid duplicate hidden agent-only controls and unjustified menu/grid roles. Structural snapshots can be stale; they are evidence, not a current live handle.

**Pending work and recovery.** Scope busy to updating results and place concise status outside that busy subtree; an outer busy ancestor can still defer announcements. Do not make the entire feed live. Errors explain recovery; cancel/retry/back preserve drafts and sensible focus. Distinguish attempted activation, accepted request and observed outcome. Unknown completion is not success; naive replay can duplicate effects. Existing async-boundary and catalog controls support state, while business meaning/idempotency remain host-owned.

**Graphics and performance.** Give task-relevant alternatives for canvas/charts/drag: data tables, named movement actions, descriptions and selected-object state. Essential text must not exist only in a bitmap. Windowing retains focus/drafts, exposes partial counts and provides a path to the target; agents cannot assume all offscreen nodes exist. Inspect structure/numeric evidence first, then visual rendering where it matters.

**Structured actions and baseline WebMCP design.** API/MCP/WebMCP adapters may express intent through the same application contract: typed inputs, validation, current object revision, observable results/errors and identical permission/domain checks. Effects remain visible to the person. Adapters do not bypass restrictions or turn page text into authority. Show consequences and provide correction/undo where appropriate; ordinary actions do not all need another confirmation. The product owns authority and significant decisions. Keep page/user content inert; do not export secrets or private form values in structural snapshots.

**WebMCP status.** Chrome documentation checked2026-10-28 describes a proposed standard/progressive enhancement with limited support/testing modes. By owner AG policy, consider WebMCP by default when designing new websites/web systems, with feature detection and human fallback; see webmcp-design. It differs from an external MCP server. Do not enable flags automatically or claim universal browser support; preserve the human fallback. This AG change adds guidance, not a WebMCP runtime.

**AG application.** Read current briefs and accessibility/forms/actions/feedback, then inspect existing components. Core0.26 retains full segmented-choice names and fixes loading-indicator/state-panel status placement. Verify actual role/name/state within named context, keyboard/focus, narrow/text200, locale, loading/error/retry and disposal. Agent usefulness, automated tests and aggregate scores do not replace target-AT/manual checks. See agent-interface-verification for the protocol and agent-control for operation transparency. AG mapping/audit/defaults are interpretations, not a new W3C standard.

- [W3C — Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)
- [W3C — Label in Name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html)
- [W3C APG — roles and native behavior](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)
- [W3C — Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)
- [W3C — Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
- [W3C — Form Notifications](https://www.w3.org/WAI/tutorials/forms/notifications/)
- [Playwright — semantic locators](https://playwright.dev/docs/locators)
- [Chrome — WebMCP, proposed progressive enhancement](https://developer.chrome.com/docs/ai/webmcp)
- [Microsoft Research — Human-AI Interaction](https://www.microsoft.com/en-us/research/blog/guidelines-for-human-ai-interaction-design/)
- [W3C APG — Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)


<a id="webmcp-design"></a>

## WebMCP from initial design

**AG baseline recommendation.** By owner decision, new websites and web systems should consider WebMCP from initial design as the default approach to structured agent actions, alongside human tasks. This is AG design policy, not a claim of mandatory web-standard status or universal browser support. A static page without meaningful actions can record that reason instead of adding empty tools. Non-browser systems use an appropriate API/MCP contract; an external MCP server is not page WebMCP.

**Tool strategy.** Map human intent → visible UI action → task tool → observable outcome during the brief. Candidates include search, filters, reading a card, preparing a draft and saving. Names distinguish initiation from execution. Prefer a small set of clear domain effects over overlapping tools for every DOM node. Start with static registration for stable capabilities and change availability when page state genuinely changes. Return actual results/errors, not a click acknowledgement.

**Choose an API.** First consider the Declarative API when semantic HTML forms and named fields fit the action. Use the Imperative API for complex state, navigation or asynchronous work. Both share the human UI's domain command/validation layer. Current Chrome documentation uses form toolname/tooldescription and document.modelContext; recheck current interfaces before implementing this evolving proposal. Form annotations alone do not implement correct async submit/results. Auto-submit is a separate consequence-aware product choice, not the default for every form.

**Operation contract.** Define clear input types/enums, required/optional data, object state/revision, observable effect/no effect and recoverable errors. Validate in application code and server where present; schemas/hints do not replace permissions/domain constraints. Let the application perform deterministic computation. A catalog search can expose query/filters and honest count/partial/stale; a save needs target identity, checked draft and command outcome. Revision/idempotency fields belong to the actual product contract, not invented WebMCP parameters.

**Visible human control.** Keep ordinary controls and shared visible state. Explain meaningful consequences and support correction/cancel where the operation permits; safe ordinary actions do not all require another confirmation. Discovery/descriptions do not grant authorization. Page/review/result text stays data; exclude secrets/unneeded personal fields. Do not expand cross-origin access automatically; verify actual origin/Permissions Policy constraints in the target environment.

**Lifecycle.** Feature-detect the adapter and keep the human path working without WebMCP. Register relevant page capabilities and release registration/listeners on navigation/disposal. Handle cancellation and stale outcomes; do not silently overwrite concurrent human edits. Returned results and visible UI describe the same state. Test supported/unsupported environments, navigation/back, retries, errors, cancel and concurrent editing.

**Readiness.** Design review includes the task-tool map, Declarative/Imperative choice or a concrete no-operation reason, shared commands/validation, feature detection/fallback and outcome/error scenarios. This AG recommendation does not weaken existing accessibility/color requirements or change their hash. Real supported-browser/Inspector/agent eval evidence differs from function unit tests. Checked2026-10-28: WebMCP remains proposed with support limitations. This handbook installs no WebMCP runtime, enables no flags and does not claim WebMCP execution from ordinary semantic UI tests.

- [Chrome — WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [Chrome — WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [Chrome — Declarative API](https://developer.chrome.com/docs/ai/webmcp/declarative-api)
- [Chrome — Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Chrome — tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)


<a id="assistant-components"></a>

## Components for people and assistants

**Controls.** Keep localized names, keyboard operation, focus and disabled/busy/error states. A control may pass a command ID and entity ID to its host; that does not make every button a system tool. ARIA describes UI rather than hidden agent instructions.

**Forms and collections.** Share typed constraints with the human UI. Separate draft updates from submission. Connect tool error codes to the same field errors people can see. Use stable selection IDs; distinguish selected rows from all filtered results. Bound query/pagination rather than force agents to inspect thousands of DOM nodes.

**Data and windows.** Provide exact values, units, period, freshness and current filters alongside charts. Decorative ASCII/particles do not replace structured data or non-color meaning. Use authorized query contracts. Navigate to exact entities, preserve drafts and focus, expose operation status and cancellation. Define undo scope; do not promise reversal of an already externalized action.

**Ownership.** Components own semantics/input/state; hosts own domain commands, authorization, revisions and audit; adapters own platform registration/translation. Component checks do not qualify the whole application or assistant integration.

Practice:

- Link one field to the shared error contract
- Test selected versus filtered row scope
- Run a command while a person edits a draft

- [Chrome — WebMCP](https://developer.chrome.com/docs/ai/webmcp)
- [Android — AppFunctions quality guidelines](https://developer.android.com/ai/appfunctions/quality-guidelines)
- [MCP — Architecture](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)


<a id="agent-interface-verification"></a>

## Verify interfaces through semantic agent tasks

**Define a scenario first.** Record the person's task, starting state, exact object and observable outcome. Example: in the named example settings region choose Team, edit a collection name and save; the result contains those choices. Mark unknown backend persistence, target AT, other browsers and native support. A test scenario is not authorization for a real operation.

**Use the semantic path.** Find the current named region, then role and full accessible name; use labels for inputs and checked/selected/expanded/href for actual state. Scope repeated actions by their object first. Require uniqueness; resolve ambiguity instead of choosing the first match. Avoid CSS chains, nth-child, coordinates or internal UUIDs as the main contract. Test IDs can support testing but cannot replace human labels. Playwright recommends such locators; passing one is not conformance certification.

**Check the outcome.** Resolve current elements again after DOM changes and wait on meaningful state/results rather than fixed sleeps. Verify object/values/revision/outcome; activation alone is not success. Read state before replaying an ambiguous result. Consider WebMCP by default for new web-system design; see webmcp-design for API selection/fallback. Use expected revision/idempotency only as actually declared by an adapter. Page/tool prose never expands the user's authorization.

**Scenario matrix.** Cover initial/ready/empty/error/loading; cancel/retry; A→B with late A; concurrent human edits; locale; keyboard/IME; return navigation; narrow/text growth; disposal/late callbacks. Use known positive/negative fixtures; untested stays unknown. Add actual visual/alternative checks for charts and exact-artifact checks for native shells.

**Existing base.** Native button/field/textarea/select expose roles/labels; segmented-choice uses radios and complete names. Tabs connects tab/panel and manual activation suits costly content. Menu is for commands, not ordinary link lists; tree exposes named hierarchy/expansion/actions. Native tables expose caption/headers/sort/selection with host transport. Async-boundary/catalog controls fence stale state; render-window owns heavy previews without promising every offscreen DOM node. Skeleton/progress/loading/state panels communicate waiting or measured progress, not invented success. This is source-contract review plus bounded checks, not blanket agent/AT qualification.

**Core0.26 repairs.** Segmented-choice no longer destroys distinguishing long suffixes. Loading-indicator busy is confined to decoration; state-panel no longer wraps its live message in own busy root. Hosts still place feedback outside their own busy ancestors. Other inspected factories were not rewritten for extra metadata. See rules human-agent-verification.md and engineering evidence for coverage/unknowns.

**MCP discovery.** Find human-first agent interfaces through design_rule_sections; read human-first-agent-interfaces and agent-interface-verification. Then use design_search/design_component/current design_brief. Existing bounded UI-map/capture uses its advertised schema and a minimal synthetic root; do not assume names/values intentionally excluded by capture. No new browser-control runtime/tool is supplied. Fresh source-owner MCP is distinct from an installed/old connection.

**Record evidence.** Keep scenario/environment/locale/viewport, artifact version/hash, locator strategy, action, observed result, failures/unknowns and checked retry. Do not retain private field values/full DOM. Reliability or speed comparisons need a separate matched experiment; no universal percentage is claimed.

- [W3C — Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)
- [W3C APG — roles and native behavior](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)
- [W3C — Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
- [W3C — Form Notifications](https://www.w3.org/WAI/tutorials/forms/notifications/)
- [Playwright — semantic locators](https://playwright.dev/docs/locators)
- [Chrome — WebMCP, proposed progressive enhancement](https://developer.chrome.com/docs/ai/webmcp)
- [W3C APG — Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)


<a id="assistant-integration-testing"></a>

## Verify and refresh assistant integrations

**AG evidence ladder.** Check the domain handler, adapter schema, system discovery, actual target-client invocation and human task outcome separately. Use pass/fail/unknown/not-applicable per level. Direct handler execution does not prove discovery; screenshots do not prove persisted effects.

**Fixture set.** Cover successful reads/writes, invalid inputs, ambiguous entities, unauthorized objects/accounts, stale revisions, duplicate requests, lost responses after commit, cancellation before/after commit, offline and cold activation. Compare before/after state and external-effect counts. Untrusted document content must not expand tool authority. Test natural phrases, locales and visible outcomes. Measure task completion, errors, recovery and comparable task time with stated sample conditions; agent responses do not replace human research or AT/security tests.

**Freshness policy.** Record checkedAt, source/version, OS/SDK/browser/assistant/build, owner and review trigger. AG recommends review before release, after SDK/browser/permission changes or failures, and at least every 90 days for active previews. This is a knowledge-review interval, not a compatibility guarantee.

**Web boundary.** The 27 October 2026 WebMCP text is a Draft Community Group Report, not a W3C Standard. Chrome documents an origin trial and local flag. Feature-detect the actual target implementation; never enable user experiments automatically. Preserve human fallback. New guidance does not imply an installed runtime adapter.

Practice:

- Complete the evidence ladder for one task
- Test conflict and denied access
- Assign an owner and refresh trigger

- [Apple — App Intents and App Schemas, WWDC26](https://developer.apple.com/videos/play/wwdc2026/240/)
- [Microsoft — App Actions on Windows](https://learn.microsoft.com/en-us/windows/ai/app-actions/)
- [Android — AppFunctions overview](https://developer.android.com/ai/appfunctions)
- [W3C Community Group — WebMCP draft](https://webmachinelearning.github.io/webmcp/)
- [MCP — Architecture](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)


WebMCP status checked 2026-10-31: the 27 October draft is not a W3C Standard. Recheck the target browser API and origin-trial availability; preserve human fallback.
<a id="realtime-ui-load"></a>

## Hot gestures and interface load

**Keep input local.** Pointer movement, selection, dragging and game-object preview first update local state and visible feedback. Do not call an API for every pointermove to obtain local feedback. Separate preview, settled intent and server-confirmed result; retain keyboard alternatives and cancellation.

**One frame owner.** Explicitly coalesce replaceable samples and consume the latest in one rAF instead of independent widget loops. Use bus autoFlush:false to avoid a second loop; TTL still rejects stale work after a hidden-page pause. Do not coalesce undo, simulation ticks or relative increments when every step matters. Move heavy CPU/parsing to a Worker with schema, bounded messaging and lifetime. A bus cannot speed up a long JS callback or provide hard real-time.

**Choose by responsibility.** Callback/parent state fits small coupled UI. EventTarget is a simple local signal. Scoped bus adds independent subscribers/tier/budget/TTL. Request-router owns shared query/cache/dedup/concurrency; preserve an existing mature query framework. BroadcastChannel is optional same-origin cross-context transport, not this in-process bus or a trust boundary. Workers address CPU, not backend fan-out. Navigation owns URL/focus/history; request routing owns operations/data.

**Games.** These primitives can coordinate HUD/settings/selection/shared resource loads. Simulation, physics, multiplayer authority/reconciliation, rollback netcode and cheat resistance require a specialized layer. Server remains authoritative for consequential competitive/value state. A UI demo establishes no60/120FPS, native engine or production capacity.

**Matched load evidence.** Compare physical calls, sharing/cache/expiration/rejections/abandoned slots, active/pending high-water, p50/p95 input/delivery/paint, frame gaps, long tasks and resources after disposal. INP is useful for discrete interactions, not a complete continuous-gesture/game smoothness metric. Record device/browser, data sizes, callback cost, duration and caps. Synthetic counts are not production QPS/FPS or universal savings.

**Qualification.** Flood each tier under explicit limits; verify fairness/overflow, latest sample/outcome, late completion after abort/invalidate/dispose and timer/listener cleanup on unmount. Commands/different scopes must not merge. Numeric counters precede image review but cannot replace real paint, keyboard, narrow/text200/profiles/AT and target-host checks. Untested production/physical-device/AT remains unknown.

- [MDN Scheduler.postTask](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/postTask)
- [MDN AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- [MDN BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)
- [MDN Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [web.dev INP](https://web.dev/articles/inp)


<a id="secure-web-actions"></a>

## Secure UI, API and WebMCP actions

**One protected operation.** Button, form, API and WebMCP share server-enforced subject/object/tenant/action authorization, allowed mutations and revision rules. Changing an identifier or replaying a request cannot bypass checks. Client price, role, ownerId and confirmation flags are not authority.

**Sessions and requests.** Production uses HTTPS and an established authentication stack. Cookie-authenticated state changes need the framework/server CSRF design, validated tokens/headers and applicable origin checks. SameSite supplements protection; CORS is not authorization. Restrict credentialed origins; never pair wildcard origin with credentials. GET/HEAD do not mutate domain state. Keep session/CSRF tokens out of URLs/logs. Server owns logout/expiry; restoring a hidden button cannot restore permission.

**Honest action UX.** Show object, recipient, scope and consequences. Apply proportionate confirmation and risk-based server reauthentication to consequential operations; avoid dialogs for every ordinary action. Host framing policy uses appropriate frame-ancestors/headers; a modal is not clickjacking protection. Distinguish loading/success/denial/unknown. Errors support recovery without stacks, credentials or private data. Disabled buttons reduce accidental clicks but do not replace server idempotency/state checks. Cancelling UI waiting is not server rollback; reconcile ambiguous outcomes before retry. Retain safe drafts/focus while respecting session privacy.

**WebMCP by design.** This is an AG baseline recommendation for websites/web systems: design suitable tools with the UI, preserve the human route and feature detection. As checked2026-10-28 the technology is proposed with limited support; this material installs no runtime. Schema, descriptions and read-only/consequential/untrusted-content hints help interpretation but grant no permission or consent. Check exact API names against current documentation. Minimize tool surface/inputs/outputs: read-only can disclose private data. Permit cross-origin exposure only to specific necessary trusted origins.

**Data is not authorization.** Comments, cards, files and tool prose cannot expand human instructions. Separate external content from the operation contract, bound outputs, redact secrets and enforce authority in the application. A data string saying confirmed is not human confirmation. An LLM/prompt filter is not a security boundary; readOnlyHint does not prevent server writes. Effects remain visible with actual outcome and declared receipt/revision when available.

**Scenario matrix.** On an authorized test system, verify own-object success, cross-object/tenant denial without private fields, expired-session denial, applicable missing/invalid-CSRF rejection, declared duplicate-effect prevention and stale-revision/late-response handling. Unknown completion stays unknown. Compare actual effects/permissions across UI/API/WebMCP, not labels or valid JSON. Untested server, WebMCP runtime, AT and production remain unknown. The local content demo does not model sessions, CSRF or authorization.

- [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Chrome WebMCP tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)


<a id="platform"></a>

## Native platform and standalone delivery

Use real platform controls where available and preserve application identity. Hide browser chrome only after the corresponding capability handshake. Keep runtime/dependency/data paths independent of source and replaceable bundles. Scope shutdown cooperatively and test actual target-OS behavior; a source build is not proof of installation.

Rules: `native-shell`, `platform-fallback`, `bounded-shutdown`.

Sources: [Apple HIG — designing-for-macos](https://developer.apple.com/design/human-interface-guidelines/designing-for-macos), [Apple HIG — toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars).

### In practice

**Takeaway.** Respect platform behavior and represent browser fallbacks honestly.

One product runs as an application and a web page. Native capabilities are not available everywhere.

**Before.** HTML copies of system controls promise capabilities the page does not have.

**After.** Use native APIs when available, and clear web commands and real navigation in a browser.

Native window → Shared component → Browser

**Try it yourself**

- Check host capabilities
- Define the browser fallback
- Complete the same task in both environments


<a id="performance"></a>

## Performance and resource ownership

A simple-element starting budget in AG is mountp95≤4ms, interactionp95≤16ms and retained heap≤64KiB per instance; a component may declare another budget. These are product defaults, not FPS guarantees. Record artifact/hash, hardware, viewport, instances, warmup, rounds, p50/p95 and create/dispose cycles.

Node/jsdom heap, rendered browser interaction/layout and native RSS are different evidence. Missing memory measurements stay unknown; component timing is not field INP. Release listeners, observers, timers and media.

Consider render-window for long feeds/galleries and expensive offscreen previews with explicit bounded snapshot/restore and focus/drag/unsaved-state protection. Do not double-window already windowed content. Small/static essential content, print, SEO and browser Find need eager access unless a tested alternative exists. Huge datasets also need data pagination/virtualization. Placeholder ownership and host data remain separate. Compare actual visible DOM/resources and target-browser behavior; synthetic counts are not a percentage CPU/RSS improvement.

Rules: `performance-evidence`, `performance-protocol`, `performance-boundaries`, `offscreen-lifecycle`.

Sources: [W3C — performance/evaluation](https://www.w3.org/TR/performance-timeline/), [web.dev — INP](https://web.dev/articles/optimize-inp), [MDN — Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), [Google — content-visibility](https://web.dev/articles/content-visibility).

### In practice

**Takeaway.** Measure interface cost at the volume the product needs.

A small catalogue is fast, but a thousand heavy previews can slow scrolling and retain memory.

**Before.** Every expensive item mounts immediately and removed items keep subscriptions.

**After.** Create only necessary work, release resources and measure in the actual browser.

Needed data → Visible work → Disposal

**Try it yourself**

- Choose a realistic volume
- Measure mount, interaction and disposal
- Check focus under virtualization

**Mandatory AG workflow after adding or changing a component.** Execute the component’s targeted functional/lifecycle tests, its real preview contract and a relevant performance scenario. Registration, generated tests and an older PASS are not execution. Samples provide element, interact() and dispose(); await asynchronous interact/whenIdle. Cover interaction failure, cleanup after failure and continuing to the next component. Connected libraries use their actual package harness, not a fake core preview.

Record executed results with component ID/version, scenario, environment and limits through design_record_performance, then read design_performance. Qualification separately uses design_report_checks with the current contract/evidence. Failed checks have outcome=failed plus phase/message; cancelled work is cancelled; completed measurement is measured. Storing a report executes no code and grants no qualification. Unavailable execution stays unknown/blocked with a reason, never PASS.

Heap per instance is retained JS memory for a live instance under an explicit method. Browser DOM/CSS timings and Node/jsdom with explicit GC remain separate rows. Process heap, RSS, GPU and component memory are not interchangeable; a negative GC median is not zero. “Time measured; memory not measured” describes missing coverage, not component failure. CLI: node --expose-gc tools/benchmark-memory.mjs --component ID --instances 40 --output /absolute/path/report.json. This is Node/jsdom evidence, not browser or AT acceptance.

<a id="evaluation"></a>

## Reproducible interface review

Use the current v2 rubric and detailed requirements. Explicit observations are pass/fail/unknown or justified not-applicable; unknown earns no credit. Report score, coverage, excluded weights, critical gate and decision together. A high average cannot waive critical failure or missing evidence. Scores are AG policy, not universal usability or HIG/WCAG certification. Separate geometry, recognition, user-task success, AT, browser performance and native installation evidence.

Rules: `evaluation-evidence`, `evaluation-unknown`.

Sources: [NN/g — ten-usability-heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/), [NN/g — how-to-rate-the-severity-of-usability-problems](https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/), [W3C — performance/evaluation](https://www.w3.org/WAI/test-evaluate/preliminary/), [W3C WCAG-EM — scope and evaluation](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/).

### In practice

**Takeaway.** A review should connect an observation, its consequence and a verification step.

A team discusses a confusing form. Asking to make it prettier does not identify a useful change.

**Before.** An overall score hides a specific barrier and untested scenarios.

**After.** Name the location, reproducible fact and smallest repair. Do not turn unknown into pass.

Observation → Consequence → Recheck

**Try it yourself**

- Describe one specific barrier
- Attach an observation
- Repeat the same scenario after the fix


<a id="creative-measurement"></a>

## Measuring originality and quality

Define what is being measured, the comparison set, participants, tasks and limitations. Keep structural/visual distinctiveness, recognition, preference, comprehension and business outcomes separate. Never invent global uniqueness percentages or convert a critic opinion into user-study evidence. Report uncertainty and dated provenance; creative scores cannot waive mandatory failures.

**Practical visual-polish audit.** Record each finding as location → observed signal → task impact → smallest correction → recheck. Example: revenue card → +12% without a period → ambiguous comparison → add the period → check comprehension and narrow width. Separate required failures from hypotheses and taste preferences. Review a chosen property across the whole screen to keep neighbors consistent; pass order follows content, typography and layout dependencies. Compare before/after with identical content and state, explicitly identifying intentional copy or structure changes. Screenshot count does not limit necessary repairs; visual comparison does not replace the functional and accessibility checks above. Keep the change-scope rationale in creative-direction.

**Attribution.** Adapted from Unslop by Damir Sokolovsky (@heydamir), CC BY4.0. AG replaces the original restrictions with conditional advice and retains approved identity and existing checks.

Rules: .

Sources: [Runco & Jaeger, creativity](https://www.tandfonline.com/doi/abs/10.1080/10400419.2012.650092), [Amabile, Componential Theory of Creativity](https://www.hbs.edu/ris/Publication%20Files/12-085_eb9ecda0-ec0a-4a32-8747-884303f8b4dd.pdf), [Thielsch, VisAWI](https://meinald.de/forschung/visawi/), [UEQ](https://www.ueq-online.org/), [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Web Vitals](https://web.dev/articles/vitals), [Damir Sokolovsky — Unslop (references/signs.md)](https://github.com/heydamir/unslop/blob/main/skills/unslop/references/signs.md).

### In practice

**Takeaway.** Expression and usability require different evidence.

Two concepts look striking, but one hides the primary action. Visual preference alone is insufficient.

**Before.** Originality, accessibility and speed are merged into one opaque score.

**After.** Review character, task clarity and technical constraints separately, preserving unknowns.

Expression → Clarity → Constraints

**Try it yourself**

- Define an expression criterion
- Compare using the same task
- Record study limitations


<a id="pptx-production"></a>

## PPTX: editable and accessible production

**AG file contract.** Declare aspect ratio, target PowerPoint/version, required editable objects and permitted external links.16:9 is a possible starting layout. Keep text, simple diagrams and appropriate tables as objects when editing is required; a full-slide image is not a fully editable deck.

Choose native chart/SVG/raster by producer capability and editability needs. Inspect embedded/linked data, relocated dependencies and unintentionally embedded private sheets. Do not transfer user files to third parties without authorization.

Use consistent masters/layouts, alignment and space for evidence.32–44pt titles and24–32pt body are AG presentation starting points, not readability guarantees. Keep material caveats legible; move detail to an appendix without concealing qualifications. Test font fallback and RU/EN expansion.

Provide meaningful slide titles, reading order and alternatives for important graphics. Run the relevant accessibility checker and then target reading scenarios; a checker is not full certification. Reopen/render every slide, check clipping, numbers, sources/notes and a real edit cycle. OOXML validity does not replace target rendering; unrun native/AT remains unknown.

For new compositions first consider Golden Canon Grid; read golden-canon-grid and golden-canon-validation. Storyboards, text roles and slide recipes are in presentation-layout-recipes. Preserve readability, accessibility, truthful evidence and required host layouts; explain alternatives.

Rules: `data-provenance`, `design-rationale`, `a11y-chart-equivalence`, `qualification`.

Sources: [Microsoft: Accessible PowerPoint presentations](https://support.microsoft.com/en-us/accessibility/powerpoint/make-your-powerpoint-presentations-accessible-to-people-with-disabilities), [Microsoft Learn: PowerPoint ChartData.IsLinked](https://learn.microsoft.com/en-us/office/vba/api/powerpoint.chartdata.islinked), [Microsoft: Available chart types in Office](https://support.microsoft.com/en-au/excel/available-chart-types-in-office).

### In practice

**Takeaway.** Verify the actual presentation, including editing and reading order.

A recipient must edit a number and title in PowerPoint. A screenshot of an attractive slide cannot support that task.

**Before.** The slide is a single image, labels cannot be edited and fonts change when opened.

**After.** Use editable elements, define reading order and inspect the file in its target environment.

Editable text → Data → Reading order

**Try it yourself**

- Open the final PPTX
- Edit a number and label
- Check overflow, fonts and accessibility


<a id="excel-dashboard-production"></a>

## Excel production, charts and refresh

**AG structure.** Separate README/metric definitions, source records, calculations and Dashboard; scenario models also isolate Inputs/assumptions. Declare grain, types, keys and missingness. Store dates/numbers as values and locale formatting as presentation. Retain formulas when recalculation is required; hardcoded totals must not masquerade as formulas.

Start chart choice from the question: bar/category comparison, line/time with real dates, scatter/relationship, histogram or box/distribution where supported, waterfall/change contribution, table/exact lookup. These are AG starting choices. Heatmaps/data bars retain legends/values. Justify decorative3D or dual axes; do not exaggerate bars through an undisclosed truncated baseline.

Declare source, data freshness and refresh. Verify real pivot/slicer connections, range growth, row additions and recalculation in the target Excel/producer. A drawn filter is not an implemented feature; static exports retain selection context.

Use meaningful sheets/A1, simple header tables and alternatives for essential charts; avoid merged data cells. Reconcile source/aggregate totals, denominators and units. Change an input, append a record and check recalculation/chart refresh, no-data, RU/EN, print area and external links. If the tool cannot calculate formulas, target-app recalculation stays unverified; cached values are not proof.

Rules: `data-provenance`, `design-rationale`, `a11y-chart-equivalence`, `qualification`.

Sources: [Microsoft: Create and share a Dashboard with Excel](https://support.microsoft.com/en-us/excel/create-and-share-a-dashboard-with-excel-and-microsoft-groups), [Microsoft: Available chart types in Office](https://support.microsoft.com/en-au/excel/available-chart-types-in-office), [Microsoft: Accessible Excel spreadsheets](https://support.microsoft.com/en-us/accessibility/excel/accessibility-best-practices-with-excel-spreadsheets), [Heer and Bostock: Crowdsourcing Graphical Perception](https://idl.uw.edu/papers/crowdsourcing-graphical-perception).

### In practice

**Takeaway.** Separate source data, calculations and presentation.

A colleague adds rows for a new month. The dashboard should refresh through clear rules without breaking formulas.

**Before.** Manual values are mixed with formulas and new rows are omitted from the chart.

**After.** Separate workbook layers, preserve value types and test calculation and refresh by changing real input.

Source data → Calculations → Dashboard

**Try it yourself**

- Check source and units
- Add a test row
- Verify recalculation and chart ranges


<a id="brand-interchange"></a>

## Board export, JSON and Figma boundaries

SVG exports escaped board primitives; AG JSON archives the model and pinned snapshots; DTCG JSON carries supported color tokens. Inspect actual import/editability and asset/font rights. SVG compatibility is not native .fig, Auto Layout, variables or verified Figma roundtrip. Keep unknown format/host capabilities explicit and preserve source artifacts.

Rules: .

Sources: [Figma — Add images and videos to designs](https://help.figma.com/hc/en-us/articles/360040028034-Add-images-and-videos-to-designs), [Figma — Export formats](https://help.figma.com/hc/en-us/articles/13402894554519-Export-formats-and-settings-for-static-designs), [DTCG Format 2025.10](https://www.designtokens.org/tr/2025.10/format/).

### In practice

**Takeaway.** Export preserves a model only within the chosen format's capabilities.

A board is shared as SVG, JSON or through a design tool. Appearance and editability may survive differently.

**Before.** A similar-looking image is mistaken for preserved components and relationships.

**After.** Define what the recipient must edit, then verify the actual import and source model.

Source model → Exchange format → Target editor

**Try it yourself**

- Define required editability
- Check fonts and connections
- Open the export in its target tool


<a id="journey-testing-retention"></a>

## Journey testing, retention and PPTX export

Prefer explicit temporary boards/copies for short tests:24h AG default,1h–7d sliding retention; permanent boards remain permanent. Addressed work renews retention, but background keepalives and incidental lists must not. Expired IDs cannot be revived. Keep bounded route observations without form values or participant identifiers.

Use neutral goals, exact graph hashes and reported outcomes separate from replayed criteria and manual pass/fail/unknown. Agent walkthroughs are not representative studies. PPTX export contains native editable graph and schematic cards/current-hash results, not preserved live forms or browser screenshots. Downloaded files are outside cache expiry. Record target-host rendering and editability checks separately.

Rules: .

Sources: [NN/g Task scenarios](https://www.nngroup.com/articles/task-scenarios-usability-testing/), [W3C WAI Forms](https://www.w3.org/WAI/tutorials/forms/).

### In practice

**Takeaway.** Test a pinned journey and retain only useful evidence.

A team reviews a temporary prototype. Once a screen changes, older results no longer describe the same test.

**Before.** The report is not tied to a screen version and temporary material is kept indefinitely.

**After.** Pin the revision, task and retention period. Distinguish an agent walkthrough from a study with people.

Task → Screen revision → Evidence

**Try it yourself**

- Name the tested task
- Record revision and observation
- Check retention and shared evidence


<a id="artifact-validation"></a>

## Validate and hand off presentations and analytical files

**Four AG checks.**1)data/calculation;2)conclusion/caveat/action;3)render/accessibility;4)editing/refresh/portability. Passing one does not close the others. A web-qualified component does not automatically qualify a PPTX/XLSX artifact.

For PPTX inspect every saved slide, viewing conditions, fonts, overlap, reading order, alternatives, links, notes, sources and a required edit. PDF preview does not prove editability or screen-reader behavior. For XLSX reconcile totals, formulas/cache, units/dates/errors, filters/refresh, row growth, print area, chart ranges and external links. Without a calculating engine, recalculation remains unknown.

Deliver the editable original, a concise README/sources and a preview when useful. Identify producer/target versions, tested scenarios and limits; label synthetic data. ZIP validity is not full Office compatibility. Use a suitable format-specific skill/producer, create, reopen/render, repair observed failures, then hand off. Report unavailable tests honestly; static checks do not certify usability or business impact.

For new compositions first consider Golden Canon Grid; read golden-canon-grid and golden-canon-validation. Storyboards, text roles and slide recipes are in presentation-layout-recipes. Preserve readability, accessibility, truthful evidence and required host layouts; explain alternatives.

Rules: `data-provenance`, `design-rationale`, `a11y-chart-equivalence`, `qualification`.

Sources: [Microsoft: Accessible PowerPoint presentations](https://support.microsoft.com/en-us/accessibility/powerpoint/make-your-powerpoint-presentations-accessible-to-people-with-disabilities), [Microsoft: Accessible Excel spreadsheets](https://support.microsoft.com/en-us/accessibility/excel/accessibility-best-practices-with-excel-spreadsheets), [Microsoft Learn: PowerPoint ChartData.IsLinked](https://learn.microsoft.com/en-us/office/vba/api/powerpoint.chartdata.islinked).

### In practice

**Takeaway.** A file is ready when its data, meaning and handoff all work.

A report looks polished, but the recipient must verify values, open the file and continue working in their environment.

**Before.** Visual inspection is treated as proof of formulas, accessibility and editability.

**After.** Check data, claims, rendering and editability separately. State what remains untested.

Data → Meaning and rendering → Handoff

**Try it yourself**

- Compare values with the source
- Open the result in its target program
- Test editing and another refresh

<a id="golden-canon-validation"></a>
## Golden Canon Grid: sandbox and PPTX verification

Record profile, carrier dimensions, artifact/revision, object ID, box anchor and tolerance before comparing. Supported anchors are four corners and box center. Text baselines, glyph ink and optical mass remain unknown. Nearest geometry is not evidence of the author's intended composition target.

AG defaults to 0.8% of the shorter carrier side, configurable from 0 to 5%. A hit requires an in-carrier anchor and Euclidean distance within tolerance. Retain dx/dy, distance and units. An empty anchor set stays unknown. Tolerance is AG policy, not a researched aesthetic threshold.

The sandbox overlays the actual iframe viewport. External camera scaling does not alter measurements. Squares mark anchors, circles mark control points, and dashed residuals connect them. Text reports hit/miss and numbers. Hidden/clipped objects and incomplete captures cannot receive a positive panel finding.

Upload a PPTX up to 12 MiB. Direct axis-aligned shapes with explicit transforms receive slide/shape identities and EMU residuals. Groups, rotation/flips, inherited geometry, masters/layouts and optical ink remain unknown. External links are never fetched. The optional diagnostic copy retains editable native guide shapes; the original is untouched. Reopen the copy in the target application and test editing, rendering and reading separately. Native PowerPoint and AT stay unknown without actual tests.

### In practice

A point hit measures one declared geometric anchor.

Compare the same composition anchors in a browser and a saved PPTX.

A green marker is treated as proof of overall quality.

The report binds anchor and target, retains residuals and names unknowns.

- Declare profile, anchor and tolerance
- Compare markers with numerical evidence
- Reopen PPTX and test reading separately

Sources: [Obys — Grids](https://grids.obys.agency/), [Microsoft — Accessible PowerPoint](https://support.microsoft.com/en-us/accessibility/powerpoint/make-your-powerpoint-presentations-accessible-to-people-with-disabilities)

<a id="artifact-format-selection"></a>

## Choose web, PPTX or Excel

**AG decision.** Declare audience, question/decision, source, period, data volume, refresh, reading mode and required editability. A dataset may need several views.

Use PPTX for a guided explanation/discussion; a read-alone deck needs more context. Use Excel for auditable calculations, refreshed tables, filters and scenarios. Use web for shared interactive workflows. PDF is a snapshot, not formulas or live interaction. These are authored choices, not a causal ranking.

Transfer semantic color, hierarchy and density, adapting to the medium. CSSpx and points are not interchangeable numeric tokens. Do not copy glass/particles/hover into print blindly. Generate quantitative charts from data; use generated art only for appropriate nondata imagery.

Record format, audience, decision, live-or-read, editability, refresh, units/currency/timezone, locale, target software/version, sources and limits. Select a portable baseline when capabilities are unknown. Verify conclusion, next action, source lookup and intended update path separately from appearance.

Rules: `data-provenance`, `design-rationale`, `a11y-chart-equivalence`, `qualification`.

Sources: [Segel and Heer: Narrative Visualization](https://idl.uw.edu/papers/narrative), [Sarikaya et al.: What Do We Talk About When We Talk About Dashboards?](https://alper.datav.is/publications/dashboards/), [Microsoft Learn: PowerPoint ChartData.IsLinked](https://learn.microsoft.com/en-us/office/vba/api/powerpoint.chartdata.islinked).

### In practice

**Takeaway.** Choose a format based on how the material will be used after handoff.

You need to explain results in a meeting and let the team update calculations later. One image cannot do both jobs.

**Before.** A format is chosen for an attractive template without considering editing or refresh.

**After.** A website supports exploration, a deck supports sequential explanation and a workbook supports calculation and refresh.

Web: explore → PPTX: explain → Excel: refresh

**Try it yourself**

- Name the audience's decision
- Clarify editing and refresh needs
- Choose the simplest sufficient format


<a id="data"></a>

## Tables, charts and trustworthy data

Declare units, period, source, aggregation, missingness and comparison baseline. Tables support exact lookup; charts support patterns and comparisons. Preserve raw values and accessible equivalents. Do not turn missing data into zero or use decoration to imply evidence. Format dates/numbers for the selected locale and label synthetic data.

**Carbon / Fluent2 / Spectrum · conditional AG guidance (2026-10-28).** Inspect applicability and exceptions; vendor capability does not prove AG implementation.

**Tables and batch actions · enterprise-table-actions.** Separate table-wide, row and batch actions. Expose selected count and scope before acting on a selected set. A table is not a spreadsheet. Do not silently extend page selection across all pages; cell editing requires the data-grid contract. AG: data-table, data-grid. Check: sort announcement; page/filter selection scope; batch cancel; keyboard row/cell semantics.

Rules: `data-provenance`, `graph-truth`.

Sources: [NN/g — ten-usability-heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/), [WCAG Understanding — use-of-color.html](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).

### In practice

**Takeaway.** A chart shows relationships; labels explain what they mean.

You need to compare monthly requests. A good-looking line is insufficient without the period, unit and missing-data policy.

**Before.** A chart without a scale or units turns numbers into decoration.

**After.** Show scale and labels, explain the conclusion and provide exact values.

April → May → June

**Try it yourself**

- Name the chart's question
- Choose an honest scale
- Compare the chart with its table


<a id="data-explanation"></a>

## Explain numbers and uncertainty

**AG meaning contract.** Declare metric, unit, period, population/sample, denominator, source, baseline and freshness. Pair a change with the comparison and decision implication. Association is not causation; an estimate is not an observed fact and missing is not zero.

**Synthetic example.** Conversion20%→25% is+5 percentage points and+25% relative growth for comparable populations. A bare “+5%” is ambiguous. With100 observations in each group this means20 and25 cases, but sample size/comparability still matters. Do not attribute the change to a product intervention without an appropriate causal design.

Emphasize one useful number while keeping unit/baseline visible. Direct labels and annotations explain the comparison. Display rounding does not alter raw precision; scientific tasks may need more detail. Show relevant intervals, sample size, assumptions and observed-versus-estimated status. “Good/bad/normal” needs a declared criterion and owner.

Readers should reconstruct the comparison from source values. Reconcile totals/percentages and retain material caveats in export/print/RU/EN. A beautiful chart is not evidence that the conclusion was understood.

Rules: `data-provenance`, `design-rationale`, `a11y-chart-equivalence`, `qualification`.

Sources: [CDC Clear Communication Index](https://www.cdc.gov/ccindex/widget.html/1000), [UNECE: Making Data Meaningful, Part1](https://unece.org/statistics/publications/making-data-meaningful-part-1), [Heer and Bostock: Crowdsourcing Graphical Perception](https://idl.uw.edu/papers/crowdsourcing-graphical-perception).

### In practice

**Takeaway.** A number becomes useful when its baseline and meaning are clear.

Conversion rises from 4% to 5%. That is 1 percentage point and 25% relative growth, but not evidence of causation.

**Before.** A slide says growth of 1% without a baseline, period or denominator.

**After.** Show previous and current values, name the difference and separate observation from causal explanation.

Baseline → Observation → Limitation

**Try it yourself**

- State the period and denominator
- Distinguish percent from percentage points
- Check that the claim does not exceed the evidence


<a id="presentation-storytelling"></a>

## Presentation narrative: assertion and evidence

**Evidence scope.** Technical-presentation studies motivate testing assertion–evidence structure; they do not prove universal sales gains or ban lists.

**AG workflow.** Audience/decision → situation/question → defensible assertion → relevant comparison/evidence → limitations/alternatives → next step. Adapt the sequence to teaching, board review, pitch or research reporting.

Give a slide a useful message headline and a visual that actually supports it. Label unit, period, baseline and source; add a short interpretation. Separate observed change from causal explanation. Use a question or uncertainty statement when evidence cannot support a firm assertion.

For a live talk, notes/appendix may hold detail. A read-alone deck must carry enough context without a speaker. Avoid both document-sized text walls and unexplained minimalist pictures.6×6,10/20/30 and fixed slide counts are heuristics, not empirical laws. Test conclusion, evidence, caveat and requested action at the actual viewing size.

For new compositions first consider Golden Canon Grid; read golden-canon-grid and golden-canon-validation. Storyboards, text roles and slide recipes are in presentation-layout-recipes. Preserve readability, accessibility, truthful evidence and required host layouts; explain alternatives.

Rules: `data-provenance`, `design-rationale`, `a11y-chart-equivalence`, `qualification`.

Sources: [Assertion–evidence slide research](https://www.writing.engr.psu.edu/research.html), [Segel and Heer: Narrative Visualization](https://idl.uw.edu/papers/narrative), [CDC Clear Communication Index](https://www.cdc.gov/ccindex/widget.html/1000).

### In practice

**Takeaway.** A slide explains one claim and shows evidence for it.

A meeting needs to understand a change in requests. A title such as quarterly results names the topic without stating the conclusion.

**Before.** The slide contains several charts and a generic title, leaving the audience to infer the connection.

**After.** State a supported claim in the title, show the relevant comparison and explain its decision relevance.

Claim → Evidence → Decision

**Try it yourself**

- State the audience's question
- Check that the claim follows from data
- Remove details that do not support the claim


<a id="presentation-layout-recipes"></a>
## Presentations: storyboard and composition recipes

Before styling, define audience, decision, live/read-alone mode, sources and target application. Storyboard each slide with its question, purpose, title, evidence/source, material caveat, visual form, declared Golden Canon anchors and speaker notes. Compare two visual alternatives for complex slides.

Use a supported takeaway for a result slide; use a clear topic title for a definition, process or setup. Questions/uncertainty are appropriate when evidence is insufficient. Distinguish slide title, chart title, direct labels, annotations and source notes. Remove redundant words without deleting needed context. No universal 290-character or bullet ban applies.

Recipes: compare variants with matching parameters/scales; show trends with dates and a baseline; pair a large KPI with unit/period/denominator; use diagrams for real process dependencies; retain tables for precise lookup; use relevant product/context imagery; connect recommendations to evidence, caveats and action. Preserve palette, typography, spacing and image language while changing layouts by message. Prefer selected Golden Canon anchors without forcing content into every cell.

Live slides may move secondary detail into notes. Read-alone versions must carry enough visible explanation. Animation should explain a sequence and retain meaning in a static version. Provocation, humor and dark backgrounds are optional contextual techniques.

Read titles alone to check sequence, then title/evidence/caveat together. Render every saved slide, verify sources and values, reopen PPTX, change a needed number/label and test reading order/alt text. Geometry, meaning, accessibility and portability are independent checks.

### In practice

Choose composition from the audience question and available evidence.

A meeting must select a launch option using comparable costs and timelines.

Identical cards list every project detail.

A comparison exposes matching parameters, the key difference and caveats.

- Write question, evidence and caveat
- Compare two suitable layout alternatives
- Check titles, rendering and saved-file editing

Sources: [Bonnie&Slide — Сильная презентация](https://bonnieandslide.com/blog/strong-presentation), [VisualMethod / Skillbox — 17 советов](https://skillbox.ru/media/management/kak-nauchitsya-delat-krasivye-prezentatsii-17-sovetov-ot-ekspertov/), [Bonnie&Slide — Как сделать красивую презентацию](https://bonnieandslide.com/blog/kak-sdelat-krasivuyu-prezentaciyu-v-powerpoint), [Storytelling with Data — The right words make the slide](https://www.storytellingwithdata.com/blog/the-right-words-make-the-slide), [Storytelling with Data — SWD + AI: choose an appropriate visual](https://www.storytellingwithdata.com/blog/swd-ai-choose-an-appropriate-visual), [Duarte — Projected slides and Slidedoc](https://www.duarte.com/blog/the-slides-you-deliver-versus-the-slidedoc-you-leave-behind/), [Microsoft — Accessible PowerPoint](https://support.microsoft.com/en-us/accessibility/powerpoint/make-your-powerpoint-presentations-accessible-to-people-with-disabilities)


<a id="excel-dashboard-levels"></a>

## Excel dashboard visualization levels

**Authored AG tiers, not a research-derived maturity scale.** Dashboard research distinguishes purposes and interaction; these levels describe artifact composition, not company quality.

- L0 audited table: records, headers, units, filtering and reconciliation; charts optional.
- L1 overview: defined KPIs with comparisons, a trend/ranking and a short interpretation.
- L2 operational monitoring: thresholds/exceptions, owner, freshness and useful filters, with noncolor state cues.
- L3 analytical investigation: connected slices/pivots, segment comparisons, drill-down and auditable source values.
- L4 scenario model: separate assumptions/inputs, calculations and outputs with sensitivity/alternatives; conditional analysis is not a promised forecast.

Ask which decision the preceding level cannot support. Add interaction only for that need. If the authoring tool cannot create a real slicer, use a tested filter/parameter/static alternative and disclose the limit rather than drawing a fake control.

Choose density from task and viewing area; keep detail/source values accessible. Print/export includes period and active filters. Test empty/single/many categories, missing data, refresh and post-filter denominators. More charts do not automatically create a better dashboard.

Rules: `data-provenance`, `design-rationale`, `a11y-chart-equivalence`, `qualification`.

Sources: [Sarikaya et al.: What Do We Talk About When We Talk About Dashboards?](https://alper.datav.is/publications/dashboards/), [Microsoft: Create and share a Dashboard with Excel](https://support.microsoft.com/en-us/excel/create-and-share-a-dashboard-with-excel-and-microsoft-groups).

### In practice

**Takeaway.** Add visualization when it makes a specific decision easier.

An analyst checks exact values, a manager spots deviations and an operator filters the current period. They need different visualization levels.

**Before.** Every table becomes a complex dashboard even when highlighting a deviation would suffice.

**After.** Start with a readable table, add deviation cues and then introduce charts or filters when needed.

Exact values → Deviations → Exploration

**Try it yourself**

- Name the decision and refresh frequency
- Choose a sufficient level
- Test the task without unnecessary decoration


<a id="persuasive-copy"></a>

## Persuasive copy: benefit, evidence and action

**AG structure.** Audience/task → concrete benefit → mechanism/evidence → material limitation → clear next step. This is an authoring aid, not a universal conversion formula. Prefer relevant specificity to piles of adjectives.

**Original example, no promised effect.** Replace “Revolutionary analytics for maximum efficiency” with “Compare sales plan and actuals by region in one workbook. Refresh from your table; check source and period before deciding.” Add a measured time saving only with a real method and conditions.

Research on linguistic concreteness concerns customer/service interactions; it motivates testing specific wording, not transferring an effect size to every deck or website. Do not invent testimonials, scarcity, urgency, research, success rates or guaranteed sales uplift.

For numeric claims, explain audience relevance, unit, period and comparison; distinguish fact from interpretation. Keep price, data dependencies and caveats legible. RU/EN translation preserves benefit/evidence/limits/CTA, not literal length. Define unfamiliar terms. Test whether readers can identify benefit, basis and next step; agent review does not establish conversion or comprehension.

Rules: `data-provenance`, `design-rationale`, `a11y-chart-equivalence`, `qualification`.

Sources: [Packard and Berger: How Concrete Language Shapes Customer Satisfaction](https://doi.org/10.1093/jcr/ucaa038), [CDC Clear Communication Index](https://www.cdc.gov/ccindex/widget.html/1000).

### In practice

**Takeaway.** Persuasive copy connects a benefit, evidence and a clear next step.

A visitor decides whether to try a product. They need a specific benefit and a reason to trust the promise.

**Before.** A revolutionary solution for maximum efficiency explains nothing and cannot be checked.

**After.** Describe the task and useful outcome, support the promise with available evidence and name the action.

Benefit → Evidence → Action

**Try it yourself**

- Replace abstract promises with concrete benefits
- Check every piece of evidence
- Name the next step without pressure


# Component and inner-column width audit

Measure the allocated root AND meaningful inner text columns. Use auditInterface(localRoot).layoutWidths / auditLayoutWidths from @ag-design/components/audit after fonts and layout settle. Declare data-ag-width="fill" on roots filling an allocated wrapper; data-ag-width="content" on meaningful prose columns. Optional data-ag-width-min-em=0.5..100 expresses a purpose-specific minimum.12em is AG diagnostic guidance, not a universal WCAG width. Intentionally narrow rails/icons need their own purpose, not a prose rule.

Contained undeclared roots and suspicious undeclared text columns remain inferred/unknown. Numeric deficit>1CSSpx fails. Hidden is excluded with a reason; visible disabled controls remain eligible. Detached, unsupported multi-track fill slots, transforms/individual transforms/zoom, vertical writing, unmeasurable and truncated capture remain unknown. Reports retain anonymous positions/dimensions/font sizes, never literal text/private IDs/field values.

Before completion preserve revision/expected targets and run normal,narrow(actualviewport<=320CSSpx),text200 and narrow-text200. This AG matrix uses measured CSS font growth>=1.99relative to normal; a textScale label or browser zoom alone does not prove this particular mechanism. WCAG permits multiple scaling methods; this contract is not accessibility certification. Use the same declaration/minimum across scenarios and all visible changed nested elements. Resolve discovered candidates, then recapture. Missing/stale/hidden-only/truncated/unsupported scopes are not PASS.

Pass layout_width_review={revision,blocks:[{blockId,targets:[...],samples:[{scenarioId,revision,report:audit.layoutWidths},...]}],exclusions?:[{blockId,reason}]} to design_evaluate_interface with changed_block_review. Cover every changed block or state a precise nonvisual exclusion. The server recomputes width results and four-scenario coverage; inspect layoutWidthReview.cases/unchecked and require gatepass plus completionGatepass.128widthcases maximum; partition larger declared scopes explicitly. For design_report_checks put the same bundle in designReview.layoutWidthReview. Manual width0/pass cannot bypass missing structured evidence. Re-read current policyHash; older policy passes remain historical.

Keep host palette, actions, data, semantic order and Pinterest catalogue. Fix allocated inline sizing, local container queries and nested selector specificity. A long real tool may keep a reachable top-aligned catalogue scroller; do not conceal a collapsed column with more height. Numeric geometry remains separate from optics, keyboard/AT/native and load qualification.

## Linked color-wheel handles

`createPaletteBuilder` lets users drag any numbered hue handle. Base hue is the requested handle angle minus that color's harmony offset; the other colors retain their offsets (square: 0/90/180/270 degrees). Anchor lightness/chroma or saturation at gesture start. Keep the shared sRGB mapping and separate AA/APCA checks; candidates do not apply a host theme.

Keep wheel/handle DOM identity, single primary-pointer capture and focus. Coalesce moves to one animation frame and flush the final release coordinate. Escape, pointercancel, capture loss or window blur restores the starting color. Harmony changes, external updates and disposal end old gestures/queued work. Limit touch-action to colored ring/handle targets, preserving scrolling in the centre and elsewhere.

Each handle is a named hue slider: arrows1degree, Shift/arrows or Page10degrees, Home/End. Retain a mathematical keyboard anchor across repeated keys; repeatedly converting quantized HEX can stall near-neutral hues or desaturate them. Skip intermediate HEX values that quantize to undefined neutral hue until a representable hue returns, retaining handles/focus. Explicitly entered neutral base colors have no hue handles; the HEX/native color picker remains available.

Agent recommendation: reuse linked handles when the user wants to preserve harmony, rather than moving colors independently. Test every handle, HSL/OKLCH, hue wrap, cancellation, external updates, locale and disposal; run current root/column normal/narrow/200% width checks. Real touch/assistive-technology scenarios remain separate qualification; ARIA roles and numeric contrast do not prove them.

### Direct color-ring selection

Clicking a painted sector selects that displayed ring color as the base in the current HSL/OKLCH space, including from an explicitly neutral HEX. Linked points then follow the selected harmony. Ring lightness/chroma belongs to its own display definition; dragging a numbered point still preserves the current base L/C. Keep these two intents distinct.

Ignore the centre/exterior. Freeze the ring gesture's coordinate projection so notice reflow cannot change a click on release. Cancel restores the starting HEX and native input focus when neutral rollback removes handles. The HEX/native picker remains the keyboard alternative for full base-color selection. Ring selection never applies a host theme or waives separate AA/APCA failures.

# Atomic Design: components in a working screen

## Source and AG adaptation

Brad Frost describes five concurrent perspectives: functional elements, small groups, distinct sections, content structures and populated screens. It is a flexible mental model, not a prescribed bottom-up sequence. Pattern Lab demonstrates shared includes, data variations and forward/reverse pattern lineage. AG already has factories, pinned compositions, nested grids and review gates. Add purpose, composition and context evidence rather than another component framework.

| Perspective | AG example | Review scope |
| --- | --- | --- |
| Atom / element | button, field, select; shared tokens are foundations | Semantics, label, states, focus and target size |
| Molecule / compound control | catalog-search-controls, a labelled field with feedback | One task, label/control/hint association and control-track alignment |
| Organism / section | Search/results/cards or agent-conversation with its owned composer | Child interaction, async states, ownership and disposal |
| Template | Named catalog/workspace regions | Reading order, local grids and container adaptation |
| Page | The template with representative content and state | End-to-end task, long text, result cardinality and focus recovery |

These are AG interpretations, not canonical component classifications. Read the actual field anatomy; it may already be compound. Skip unhelpful levels and retain purpose-based names. Do not create one wrapper, folder or factory per level.

## Agent workflow

Start with the user's screen/task and inventory repeated controls. Move between whole and parts. Read design_brief, search and inspect actual definitions before choosing reuse/adapt/native-fallback/new-in-ag; record exact pins and qualification limits. Separate reusable structure from synthetic fixture data, without cloning markup for each state.

Record a pattern card: purpose, named slots, actual child IDs/versions, required/optional/repeated content, state/events/data owner, local grid, known dependencies and scenarios. It is documentation, not new prepare_composition arguments. Use the existing prepare/inspect/apply/check composition operations with explicit groups and revisions. Template structure and page data should be independently inspectable. Camera zoom is not container width. Host palette, native semantics and reading order remain authoritative.

## Existing AG recipes

Catalog: catalog-search-controls + catalog-card in the existing host. Slots cover search/filters, results count, cards, state and detail. Fixtures cover zero/one/many results, long titles, missing images and filter reset. Preserve the host Pinterest feed and DOM order. Atomic Design does not mandate masonry or bento.

Settings: settings-panel + field + select + button, after exact-contract inspection. Slots cover title, field groups, feedback and actions. Test long labels, unequal hints, one-field errors and read-only values. Align actual control tracks; unequal hint bottoms can be valid.

Chat: agent-conversation already owns a composer; add choice-chips only when the host needs an external view selector. Do not nest another composer. Compare document/messenger/work-log using identical messages; test long responses, streaming, errors, drafts and pending actions. The host owns transport/data; a new presentation needs no new backend API.

Portable, non-executable pattern-card fields and recipes: @ag-design/rules/atomic-design.json. They are advisory references, not prepared sandbox documents, callable factory arguments or component admission.

## Impact and contextual review

Record direct children and known reverse usage with exact version/source. Verify code through Code Atlas and source files, composition pins and registered usage. Usage is not a complete dependency graph; an absent registration proves no absence of consumers. Do not claim generated lineage or complete impact coverage.

For a changed element, inspect affected compound patterns and representative templates/pages, including a constrained container. Keep unknown consumers explicit. Fix the responsible shared component when appropriate rather than hiding its defect with page-specific CSS.

Reconcile changed-block inventory with diff and rendered DOM, including nested affected elements and contexts. Use changed_block_review; missing observations stay unchecked. Read form-row-layout and component-width-audit. Measure roots AND inner text columns after fonts settle. Run normal/narrow/text200/narrow-text200 with actual viewport<=320CSSpx and measured font growth for width evidence. Additional content fixtures are report context, not replacement width scenario IDs. Retain artifact revision, fixture/environment and precise observations.

Require current detailed requirements, layoutWidthReview.gate=pass, changedBlockReview.unchecked=[] and completionGate=pass when applicable. A child PASS never certifies its section or screen. Role-dependent visibility is not server authorization; numeric geometry is not AT, optical, security or host qualification. Reuse current palette/grid/accessibility policies; no new mandatory gate or fixed taxonomy is introduced.

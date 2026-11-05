// web/system-styles/component-lab.js
import {
  getLocaleRuntime,
  createLocaleSettings
} from "./locale.js";

// packages/components/i18n-messages.js
var builtinMessages = {
  en: {
    "code.findShort": "Find",
    "field.characters.remaining": "Remaining {remaining} / {max}",
    "field.characters.over": "Over limit by {remaining} / {max}",
    "textBlock.copy": "Copy text",
    "textBlock.copied": "Copied",
    "textBlock.manualCopy": "Text selected. Copy it with your browser\u2019s copy command.",
    "conversation.kind.tool": "Tool",
    "conversation.kind.terminal": "Command",
    "conversation.kind.files": "File changes",
    "conversation.kind.plan": "Plan",
    "conversation.kind.thinking": "Work activity",
    "conversation.kind.progress": "Progress",
    "conversation.kind.question": "Question",
    "conversation.kind.permission": "Permission request",
    "conversation.kind.result": "Result",
    "conversation.kind.error": "Error",
    "conversation.status.pending": "Pending",
    "conversation.status.running": "Running",
    "conversation.status.completed": "Completed",
    "conversation.status.failed": "Failed",
    "conversation.status.requested": "Requested",
    "conversation.status.cancelled": "Cancellation confirmed",
    "conversation.status.rejected": "Rejected",
    "conversation.status.unknown": "Status unknown",
    "conversation.connection.connected": "Connected",
    "conversation.connection.disconnected": "Disconnected",
    "conversation.connection.loading": "Loading",
    "conversation.connection.error": "Source unavailable",
    "conversation.connection.unknown": "Connection unconfirmed",
    "conversation.runtime.idle": "No active response",
    "conversation.runtime.running": "Agent working",
    "conversation.runtime.waiting": "Waiting for your response",
    "conversation.runtime.unknown": "Agent activity unknown",
    "viewControls.sort": "Sort by",
    "viewControls.relevance": "Relevance",
    "viewControls.usage": "Usage",
    "viewControls.name": "Name",
    "viewControls.palette": "Preview palette",
    "viewControls.metric": "Usage badge",
    "viewControls.count": "Count",
    "viewControls.score": "0\u20135",
    "viewControls.about": "About this metric",
    "viewControls.timing": "Changes apply immediately.",
    "viewControls.view": "View",
    "viewControls.title": "Card appearance",
    "viewControls.group": "Catalog order and appearance",
    "viewControls.help": "Count shows registered integration locations. The 0\u20135 scale is relative frequency in this catalog, not a quality rating.",
    "viewControls.unavailable": "Usage summary is unavailable. Refresh the catalog; unknown values appear as \u2014.",
    "popover.close": "Close panel",
    "sorting.asc": "ascending",
    "sorting.desc": "descending",
    "sorting.none": "fixed relevance",
    "sorting.changeDirection": "Current order: {current}. Change to {next}",
    "catalog.noReviews": "No reviews yet",
    "catalog.rating": "Rating: {value} / {max} \xB7 reviews: {count}",
    "catalog.clearQuery": "Clear query",
    "catalog.search": "Search",
    "catalog.resetFilters": "Reset search and filters",
    "catalog.retrySearch": "Retry search",
    "catalog.any": "Any",
    "catalog.sort": "Sort by",
    "catalog.unappliedFilters": "There are unapplied changes. Select Search to apply.",
    "catalog.searching": "Searching\u2026",
    "catalog.searchFailed": "Search could not complete. Keep the query and try again.",
    "catalog.noResults": "No results. Try another term or remove a filter.",
    "catalog.resultCount": "{count} results",
    "catalog.previousCount": "Previous result count: {count}; results are not current.",
    "catalog.queryChip": "Query: {query}",
    "catalog.removeFilter": "Remove {name}",
    "palette.legend": "\u2713 meets the stated threshold \xB7 \xD7 fails \xB7 ! review APCA target. Lc is signed; the target is advisory.",
    "palette.title": "Palette workshop",
    "palette.wheelLabel": "Linked harmony hue controls",
    "palette.wheelColor": "Color",
    "palette.wheelHelp": "Click the colored ring to choose its base color. Drag any numbered point: the other hues follow the selected harmony. Keyboard: arrows 1\xB0, Shift or Page 10\xB0, Home/End; Escape cancels a drag. HEX input remains available.",
    "palette.baseColor": "Base HEX",
    "palette.picker": "Choose base color",
    "palette.background": "Checked surface HEX",
    "palette.foreground": "Existing text HEX",
    "palette.space": "Color wheel",
    "palette.fontSize": "Text size, px",
    "palette.fontWeight": "Font weight",
    "palette.role": "Text role",
    "palette.body": "Body",
    "palette.label": "Label",
    "palette.large": "Large display",
    "palette.harmonies": "Harmony candidates",
    "palette.monochromatic": "Monochromatic",
    "palette.analogous": "Analogous",
    "palette.complementary": "Complementary",
    "palette.split-complementary": "Split complementary",
    "palette.triadic": "Triadic",
    "palette.tetradic": "Double complementary",
    "palette.square": "Square",
    "palette.monochromaticHelp": "One hue, several lightness/chroma values: quiet surfaces and states. Check every text pair.",
    "palette.analogousHelp": "Nearby hues (\xB130\xB0): cohesive groups. Similar tones can merge.",
    "palette.complementaryHelp": "Opposite hues (180\xB0): a main color and restrained accent. Hue opposition does not ensure text contrast.",
    "palette.split-complementaryHelp": "Two neighbors of the opposite hue (150\xB0/210\xB0): more accent choice.",
    "palette.triadicHelp": "Three hues 120\xB0 apart: varied categories or illustrations; keep one dominant.",
    "palette.tetradicHelp": "Two complementary pairs (0\xB0/60\xB0/180\xB0/240\xB0): rich combinations requiring restraint.",
    "palette.squareHelp": "Four hues 90\xB0 apart: balanced hue coverage; reduce competing accents.",
    "palette.invalid": "Use opaque #RRGGBB colors and valid typography. The previous result below is stale.",
    "palette.neutral": "This base has no defined hue; wheel rotations cannot create distinct hues. Try a chromatic base.",
    "palette.mapped": "Some colors had chroma reduced to fit sRGB. Checks use the emitted HEX.",
    "palette.candidate": "Candidates only. Keep the host palette and semantic roles. AA checks apply to named pairs; APCA is advisory.",
    "palette.textSurface": "As text on surface",
    "palette.existingText": "Existing text on color",
    "palette.suggestedInk": "Suggested ink",
    "palette.boundary": "Significant boundary",
    "palette.pass": "pass",
    "palette.fail": "fail",
    "palette.review": "review",
    "palette.pairFront": "Example text",
    "palette.pairBack": "Example background",
    "palette.surfaceOption": "Existing surface",
    "palette.textOption": "Existing text",
    "palette.example": "A readable idea starts with a clear contrast.",
    "palette.pairTitle": "Check your actual pair",
    "palette.tonal": "OKLCH tonal scale",
    "palette.tonalHelp": "Derived lightness steps, not Material HCT. For interface roles, verify each chosen pair.",
    "palette.export": "Palette JSON",
    "palette.exportName": "Palette result JSON",
    "palette.controls": "Palette settings",
    "palette.wheel": "Hue wheel; numbered swatches below identify the proposals.",
    "async.idle": "Ready to load",
    "async.loading": "Loading\u2026",
    "async.refreshing": "Updating\u2026",
    "async.empty": "No content to show",
    "async.error": "Could not load content. Try again.",
    "async.timeout": "Loading took too long. Try again.",
    "async.cancelled": "Loading cancelled",
    "async.stale": "Previously loaded content is shown.",
    "async.retry": "Load again",
    "common.cancel": "Cancel",
    "common.close": "Close",
    "common.save": "Save",
    "common.saveChanges": "Save changes",
    "common.saving": "Saving\u2026",
    "common.saved": "Saved",
    "common.undo": "Undo",
    "common.redo": "Redo",
    "common.find": "Find",
    "common.copy": "Copy",
    "common.copied": "Copied",
    "common.loading": "Loading\u2026",
    "common.loadingData": "Loading data\u2026",
    "common.empty": "No data",
    "common.loadError": "Could not load data",
    "common.saveError": "Could not save",
    "common.running": "In progress\u2026",
    "common.confirm": "Confirm",
    "common.previous": "Previous",
    "common.next": "Next",
    "common.yes": "Yes",
    "common.no": "No",
    "common.search": "Search",
    "common.refresh": "Refresh",
    "common.reset": "Reset",
    "common.select": "Choose\u2026",
    "common.searchPlaceholder": "Search\u2026",
    "common.noResults": "No results",
    "common.unknownAuthor": "Not specified",
    "common.noDate": "No date",
    "code.actions": "Code actions",
    "code.find": "Find in code",
    "code.copy": "Copy selection or all code",
    "code.wrapLabel": "Wrap long lines",
    "code.wrap": "Wrap",
    "code.linesLabel": "Show line numbers",
    "code.lines": "Lines",
    "code.copyError": "Could not copy",
    "code.readonly": "Source code",
    "code.view": "Code viewer",
    "code.processError": "The change was applied, but its handler failed.",
    "code.tooLarge": "The change is too large. Shorten the text or line.",
    "md.editor": "Markdown editor",
    "md.edit": "Edit",
    "md.split": "Side by side",
    "md.preview": "Preview",
    "md.source": "Source",
    "md.open": "Open .md",
    "md.download": "Download .md",
    "md.replaceQuestion": "Replace the unsaved draft with the selected file?",
    "md.replace": "Replace draft",
    "md.previewError": "Could not build preview",
    "md.changeError": "Change handler failed",
    "md.saveHint": "Connect a save handler or download the .md file",
    "md.opened": "File opened",
    "md.openError": "Could not open file",
    "md.readError": "Could not read file",
    "md.downloadUnavailable": "Downloads are unavailable in this environment",
    "md.waitDownload": "Wait for previous downloads to finish",
    "md.downloadError": "Could not prepare download",
    "md.linkError": "Could not open link",
    "history.git": "Git history",
    "history.tasks": "Task history",
    "history.search": "Search history",
    "history.placeholder": "Message, author or ID\u2026",
    "history.lane": "Lane",
    "history.all": "All lanes",
    "history.gitLegend": "Solid lines connect commit parents. Dashed lines leave the visible snapshot.",
    "history.taskLegend": "Solid lines connect events of one task. Dashed lines show explicit dependencies or hidden context.",
    "history.details": "Selected record details",
    "history.choose": "Select a history record.",
    "history.commit": "COMMIT",
    "history.event": "TASK EVENT",
    "history.parent": "Parent",
    "history.previousEvent": "Previous event",
    "history.outside": "outside the supplied snapshot",
    "history.hidden": "hidden",
    "history.hostAction": "The application that owns the task applies changes.",
    "history.changeStatus": "Change task status",
    "history.empty": "No records found. Change the search or lane.",
    "history.selectedHidden": "the selected record is hidden by the filter",
    "table.pager": "Table pages",
    "table.selectPage": "Select all available rows on this page",
    "table.loadError": "Loading failed. Retry through the application.",
    "dropdown.open": "Open options",
    "dropdown.close": "Close options",
    "dropdown.choose": "Choose a value",
    "grid.controls": "Table controls",
    "grid.search": "Search table",
    "grid.filter": "Filter",
    "grid.column": "Column",
    "grid.condition": "Condition",
    "grid.value": "Value",
    "grid.to": "To",
    "grid.options": "Options",
    "grid.apply": "Apply",
    "grid.clearFilter": "Clear filter",
    "grid.columns": "Columns",
    "grid.show": "Show",
    "grid.width": "Width, px",
    "grid.position": "Position",
    "grid.frozen": "Pinned at start",
    "grid.autosize": "Fit width",
    "grid.selectVisible": "Select visible",
    "grid.selectAll": "Select all results",
    "grid.clearSelection": "Clear selection",
    "grid.pages": "Pages",
    "grid.first": "First page",
    "grid.previous": "Previous page",
    "grid.next": "Next page",
    "grid.last": "Last page",
    "grid.page": "Page",
    "grid.pageSize": "Rows per page",
    "grid.closeDetails": "Close details",
    "grid.closeActions": "Close actions",
    "grid.number": "Enter a number",
    "grid.finiteNumber": "Enter a finite number",
    "grid.check": "Check the value",
    "filter.eq": "Equals",
    "filter.ne": "Does not equal",
    "filter.contains": "Contains",
    "filter.notContains": "Does not contain",
    "filter.starts": "Starts with",
    "filter.notStarts": "Does not start with",
    "filter.ends": "Ends with",
    "filter.notEnds": "Does not end with",
    "filter.lt": "Less than",
    "filter.le": "At most",
    "filter.gt": "Greater than",
    "filter.ge": "At least",
    "filter.between": "Between",
    "filter.in": "In list",
    "filter.empty": "Empty",
    "filter.notEmpty": "Not empty",
    "window.back": "Back",
    "window.forward": "Forward",
    "window.left": "Left panel",
    "window.right": "Right panel",
    "window.toolbar": "Window toolbar",
    "window.content": "Window content",
    "window.overview": "Overview",
    "tree.collapse": "Collapse",
    "tree.expand": "Expand",
    "board.controls": "Board controls",
    "board.zoomOut": "Zoom out (\u2212)",
    "board.reset": "Zoom 100% (1)",
    "board.zoomIn": "Zoom in (+)",
    "board.fitLabel": "Fit graph (0)",
    "board.fit": "Fit",
    "board.backgroundSettings": "Background settings",
    "board.background": "Background color",
    "board.theme": "Theme color",
    "board.fill": "Pattern",
    "board.none": "No pattern",
    "board.dots": "Dots",
    "board.grid": "Grid",
    "board.help": "Controls and keyboard shortcuts",
    "chat.agents": "Agents",
    "chat.open": "Open agent activity",
    "chat.close": "Close activity feed",
    "chat.collapse": "Collapse activity feed",
    "chat.expand": "Expand chat",
    "chat.restore": "Restore size",
    "chat.settings": "Feed settings",
    "chat.markers": "Show agent activity on the map",
    "chat.map": "Show agents on the map",
    "chat.view": "Conversation / operations",
    "chat.mode": "Conversation mode",
    "chat.log": "Requests and responses",
    "chat.empty": "No observed operations in this window.",
    "chat.older": "Earlier operations",
    "chat.newer": "Go to latest events",
    "chat.clear": "Clear visible log",
    "chat.request": "Request",
    "chat.response": "Response",
    "chat.send": "Send",
    "chat.message": "Message the agent",
    "chat.placeholder": "Describe the task \xB7 Enter inserts a new line",
    "chat.observer": "Actions are unavailable in observer mode.",
    "chat.unresolved": "Resolve the previous send attempts first.",
    "chat.tooLong": "The message exceeds the16384-character limit.",
    "ui.language": "Interface language",
    "ui.languages": "Available languages",
    "ui.fallback": "Fallback language",
    "ui.settings": "Language and region",
    "ui.english": "English",
    "ui.russian": "Russian",
    "ui.apply": "Apply settings",
    "ui.localSaved": "Settings saved on this device",
    "ui.localUnsaved": "Settings applied; browser storage is unavailable",
    "ui.atLeastOne": "Choose at least one language",
    "ui.hint": "You can enable English only. Material content is not translated automatically.",
    "ui.enableEnglish": "Offer English",
    "ui.enableRussian": "Offer Russian",
    "table.sort": "Sort: {name}",
    "table.row": "Select row: {name}",
    "tree.toggleCollapse": "Collapse: {name}",
    "tree.toggleExpand": "Expand: {name}",
    "md.controls": "{name}: controls",
    "md.viewLabel": "{name}: view",
    "md.previewLabel": "{name}: preview",
    "md.sourceLabel": "{name}: source",
    "grid.dataArea": "{name}: data area",
    "grid.actions": "Actions: {name}",
    "history.boundary": "{count} connections outside the visible snapshot",
    "history.count": "Showing {count} of {total}",
    "table.rows": "{count} rows on this page",
    "grid.pageTotal": "of {count} \xB7 {total} rows",
    "grid.selected": "Selected: {count}",
    "grid.excluded": "All results, excluding: {count}",
    "chat.operations": "Operations: {count}",
    "chat.inWindow": "In window: {count}.",
    "chat.omitted": "Older records hidden: {count}. In window: {total}.",
    "window.identity": "{name}: window toolbar",
    "common.items": {
      one: "{count} item",
      other: "{count} items"
    },
    "shell.catalog": "Components",
    "shell.styles": "System styles",
    "shell.rules": "Design book",
    "shell.usage": "Projects and debt",
    "shell.performance": "Performance",
    "shell.recommendations": "Recommendations",
    "shell.sandbox": "Sandbox",
    "shell.libraries": "Element libraries",
    "shell.map": "Interface map",
    "shell.studio": "Brand book and customer journeys",
    "shell.audit": "Interface review",
    "shell.identity": "Interface library",
    "shell.skip": "Skip to content",
    "shell.local": "Local library",
    "shell.refresh": "Refresh catalog",
    "shell.theme": "Change theme",
    "shell.collapse": "Collapse menu",
    "shell.expand": "Expand menu",
    "shell.search": "Find a component",
    "shell.searchHint": "Navigation, button, popup\u2026",
    "shell.library": "Element library",
    "shell.allLibraries": "All libraries",
    "shell.view": "View and sorting",
    "shell.palette": "Preview palette",
    "shell.sort": "Sort order",
    "shell.relevance": "Relevance",
    "shell.frequent": "Most used",
    "shell.infrequent": "Least used",
    "shell.az": "Name: A\u2013Z",
    "shell.za": "Name: Z\u2013A",
    "shell.usageLabel": "Usage label",
    "shell.count": "{count} components",
    "shell.frequency": "Frequency: 0\u20135",
    "shell.usageTitle": "Projects and design debt",
    "shell.localeDescription": "Interface language and enabled locales on this device.",
    "lab.eyebrow": "AG DESIGN / IN USE",
    "lab.title": "One toolkit. Nine personalities.",
    "lab.description": "Library components in a working scenario: change history, tasks, data and editing.",
    "lab.live": "Live components",
    "lab.compare": "Compare component styles",
    "lab.synthetic": "Synthetic data \xB7 changes last until the page reloads.",
    "lab.tokens": "Show tokens",
    "lab.tabs": "Components in context",
    "lab.tasks": "Tasks",
    "lab.table": "Table",
    "lab.form": "Form",
    "lab.editor": "Editor",
    "lab.tableCaption": "Release plan \xB7 local table",
    "lab.selectRows": "Select rows for a bulk action.",
    "lab.task": "Task",
    "lab.name": "Name",
    "lab.status": "Status",
    "lab.owner": "Owner",
    "lab.project": "Project name",
    "lab.example": "For example, a new edition",
    "lab.hint": "The change is kept in this demo session.",
    "lab.visibility": "Visibility",
    "lab.team": "Team only",
    "lab.workspace": "Entire workspace",
    "lab.ready": "Release readiness",
    "lab.readyHint": "Two of three stages are checked in the synthetic plan.",
    "lab.save": "Save settings",
    "lab.unsaved": "Unsaved changes",
    "lab.localProject": "Local project",
    "lab.localSettings": "Settings updated in this example only.",
    "lab.editorLoading": "Loading the editor\u2026",
    "lab.note": "Release note",
    "lab.selected": "Selected tasks: {count}",
    "lab.saved": "\u201C{name}\u201D \xB7 saved locally",
    "lab.changed": "{name}: {status}. Updated in this example only.",
    "chat.messages": "Chat messages",
    "chat.noMessages": "No messages yet. The application supplies history.",
    "chat.load": "Load history",
    "chat.latest": "Go to latest",
    "chat.clearVisible": "Clear visible messages",
    "chat.historyLoading": "Loading history\u2026",
    "chat.new": "New updates: {count} \xB7 Go to latest",
    "chart.pause": "Pause animation",
    "chart.replay": "Replay animation",
    "chart.previous": "Previous point",
    "chart.next": "Next point",
    "chart.data": "Supplied data",
    "chart.decorative": "Decorative graphic \xB7 synthetic data",
    "chart.context": "Chart context",
    "chart.empty": "No observations",
    "loading.label": "Loading",
    "code.searchPanel": "Find",
    "code.replacePanel": "Replace",
    "code.replaceAll": "Replace all",
    "code.nextMatch": "next",
    "code.previousMatch": "previous",
    "code.matchCase": "match case",
    "code.regexp": "regexp",
    "code.wholeWord": "by word",
    "code.closeSearch": "close",
    "code.searchLabel": "Search",
    "code.replaceWith": "Replace with",
    "code.prepare": "Preparing viewer\u2026",
    "code.loadError": "Could not open the editor. The source remains readable.",
    "history.countHidden": "Showing {count} of {total} \xB7 the selected record is hidden by the filter",
    "breadcrumbs.label": "Section path",
    "skeleton.label": "Loading content",
    "render.label": "Content",
    "resize.left": "Resize left panel",
    "resize.right": "Resize right panel",
    "issue.evidence": "Result and issues",
    "issue.noNumber": "No number",
    "issue.noStatus": "No status",
    "issue.untitled": "Untitled task",
    "issue.noRole": "No role assigned",
    "issue.noNext": "No next step defined",
    "issue.noResult": "Not recorded yet",
    "issue.noProblems": "None recorded",
    "issue.next": "Next: {name}",
    "issue.result": "Result: {name}",
    "issue.problems": "Issues: {name}",
    "card.connections": "Card connections",
    "numeric.noScale": "scale not set",
    "numeric.percentile": "percentile scale",
    "numeric.normalized": "normalized scale",
    "numeric.score": "score {score} of {maximum}; {kind}",
    "board.helpText": "Drag the background, or hold Space and drag. Wheel pans; Ctrl/\u2318 + wheel zooms. With the canvas focused: arrows pan, Shift moves faster, +/\u2212 zoom, 0 fits, 1 resets to100%. Tab visits cards. Esc cancels a gesture.",
    "shell.sections": "Sections",
    "shell.studioShort": "Brand book and journeys",
    "shell.librariesShort": "Libraries",
    "shell.collapseShortcut": "Collapse menu (\u2318\u21E7S)",
    "shell.expandShortcut": "Expand menu (\u2318\u21E7S)",
    "resize.help": "Drag the edge or use arrow keys; Home / End set the minimum / maximum width"
  },
  ru: {
    "code.findShort": "\u041D\u0430\u0439\u0442\u0438",
    "field.characters.remaining": "\u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C {remaining} / {max}",
    "field.characters.over": "\u0421\u0432\u0435\u0440\u0445 \u043B\u0438\u043C\u0438\u0442\u0430: {remaining} / {max}",
    "textBlock.copy": "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0442\u0435\u043A\u0441\u0442",
    "textBlock.copied": "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E",
    "textBlock.manualCopy": "\u0422\u0435\u043A\u0441\u0442 \u0432\u044B\u0434\u0435\u043B\u0435\u043D. \u0421\u043A\u043E\u043F\u0438\u0440\u0443\u0439\u0442\u0435 \u0435\u0433\u043E \u0441\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u043E\u0439 \u043A\u043E\u043C\u0430\u043D\u0434\u043E\u0439 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430.",
    "conversation.kind.tool": "\u0418\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442",
    "conversation.kind.terminal": "\u041A\u043E\u043C\u0430\u043D\u0434\u0430",
    "conversation.kind.files": "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0444\u0430\u0439\u043B\u043E\u0432",
    "conversation.kind.plan": "\u041F\u043B\u0430\u043D",
    "conversation.kind.thinking": "\u0425\u043E\u0434 \u0440\u0430\u0431\u043E\u0442\u044B",
    "conversation.kind.progress": "\u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441",
    "conversation.kind.question": "\u0412\u043E\u043F\u0440\u043E\u0441",
    "conversation.kind.permission": "\u0417\u0430\u043F\u0440\u043E\u0441 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F",
    "conversation.kind.result": "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442",
    "conversation.kind.error": "\u041E\u0448\u0438\u0431\u043A\u0430",
    "conversation.status.pending": "\u041E\u0436\u0438\u0434\u0430\u0435\u0442",
    "conversation.status.running": "\u0412\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F",
    "conversation.status.completed": "\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E",
    "conversation.status.failed": "\u041E\u0448\u0438\u0431\u043A\u0430",
    "conversation.status.requested": "\u0417\u0430\u043F\u0440\u043E\u0448\u0435\u043D\u043E",
    "conversation.status.cancelled": "\u041E\u0442\u043C\u0435\u043D\u0430 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0430",
    "conversation.status.rejected": "\u041E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u043E",
    "conversation.status.unknown": "\u0421\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E",
    "conversation.connection.connected": "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u043E",
    "conversation.connection.disconnected": "\u0421\u0432\u044F\u0437\u044C \u043F\u0440\u0435\u0440\u0432\u0430\u043D\u0430",
    "conversation.connection.loading": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430",
    "conversation.connection.error": "\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D",
    "conversation.connection.unknown": "\u0421\u0432\u044F\u0437\u044C \u043D\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0430",
    "conversation.runtime.idle": "\u041D\u0435\u0442 \u0442\u0435\u043A\u0443\u0449\u0435\u0433\u043E \u043E\u0442\u0432\u0435\u0442\u0430",
    "conversation.runtime.running": "\u0410\u0433\u0435\u043D\u0442 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442",
    "conversation.runtime.waiting": "\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u0432\u0430\u0448\u0435\u0433\u043E \u043E\u0442\u0432\u0435\u0442\u0430",
    "conversation.runtime.unknown": "\u0410\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C \u0430\u0433\u0435\u043D\u0442\u0430 \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430",
    "viewControls.sort": "\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430",
    "viewControls.relevance": "\u041F\u043E \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u044E",
    "viewControls.usage": "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435",
    "viewControls.name": "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435",
    "viewControls.palette": "\u041F\u0430\u043B\u0438\u0442\u0440\u0430 \u043F\u0440\u0435\u0432\u044C\u044E",
    "viewControls.metric": "\u041C\u0435\u0442\u043A\u0430 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F",
    "viewControls.count": "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E",
    "viewControls.score": "0\u20135",
    "viewControls.about": "\u041E \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u0435",
    "viewControls.timing": "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043F\u0440\u0438\u043C\u0435\u043D\u044F\u044E\u0442\u0441\u044F \u0441\u0440\u0430\u0437\u0443.",
    "viewControls.view": "\u0412\u0438\u0434",
    "viewControls.title": "\u0412\u0438\u0434 \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A",
    "viewControls.group": "\u041F\u043E\u0440\u044F\u0434\u043E\u043A \u0438 \u0432\u0438\u0434 \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0430",
    "viewControls.help": "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u2014 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u043C\u0435\u0441\u0442\u0430 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F. \u0428\u043A\u0430\u043B\u0430 0\u20135 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u043E\u0442\u043D\u043E\u0441\u0438\u0442\u0435\u043B\u044C\u043D\u0443\u044E \u0447\u0430\u0441\u0442\u043E\u0442\u0443 \u0432 \u044D\u0442\u043E\u043C \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0435, \u0430 \u043D\u0435 \u043E\u0446\u0435\u043D\u043A\u0443 \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0430.",
    "viewControls.unavailable": "\u0421\u0432\u043E\u0434\u043A\u0430 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0439 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430. \u041E\u0431\u043D\u043E\u0432\u0438\u0442\u0435 \u043A\u0430\u0442\u0430\u043B\u043E\u0433; \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u043F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u043A\u0430\u043A \u2014.",
    "popover.close": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u043F\u0430\u043D\u0435\u043B\u044C",
    "sorting.asc": "\u043F\u043E \u0432\u043E\u0437\u0440\u0430\u0441\u0442\u0430\u043D\u0438\u044E",
    "sorting.desc": "\u043F\u043E \u0443\u0431\u044B\u0432\u0430\u043D\u0438\u044E",
    "sorting.none": "\u043F\u043E \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u044E",
    "sorting.changeDirection": "\u0421\u0435\u0439\u0447\u0430\u0441: {current}. \u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C {next}",
    "catalog.noReviews": "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043E\u0442\u0437\u044B\u0432\u043E\u0432",
    "catalog.rating": "\u041E\u0446\u0435\u043D\u043A\u0430: {value} / {max} \xB7 \u043E\u0442\u0437\u044B\u0432\u044B: {count}",
    "catalog.clearQuery": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u0437\u0430\u043F\u0440\u043E\u0441",
    "catalog.search": "\u041D\u0430\u0439\u0442\u0438",
    "catalog.resetFilters": "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043F\u043E\u0438\u0441\u043A \u0438 \u0444\u0438\u043B\u044C\u0442\u0440\u044B",
    "catalog.retrySearch": "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u043F\u043E\u0438\u0441\u043A",
    "catalog.any": "\u041B\u044E\u0431\u043E\u0435",
    "catalog.sort": "\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430",
    "catalog.unappliedFilters": "\u0415\u0441\u0442\u044C \u043D\u0435\u043F\u0440\u0438\u043C\u0435\u043D\u0451\u043D\u043D\u044B\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F. \u041D\u0430\u0436\u043C\u0438\u0442\u0435 \xAB\u041D\u0430\u0439\u0442\u0438\xBB.",
    "catalog.searching": "\u0418\u0449\u0435\u043C\u2026",
    "catalog.searchFailed": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u044C \u043F\u043E\u0438\u0441\u043A. \u0417\u0430\u043F\u0440\u043E\u0441 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D \u2014 \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.",
    "catalog.noResults": "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E. \u0418\u0437\u043C\u0435\u043D\u0438\u0442\u0435 \u0437\u0430\u043F\u0440\u043E\u0441 \u0438\u043B\u0438 \u0441\u043D\u0438\u043C\u0438\u0442\u0435 \u0444\u0438\u043B\u044C\u0442\u0440.",
    "catalog.resultCount": "\u041D\u0430\u0439\u0434\u0435\u043D\u043E: {count}",
    "catalog.previousCount": "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0435 \u0447\u0438\u0441\u043B\u043E \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u043E\u0432: {count}; \u0432\u044B\u0434\u0430\u0447\u0430 \u043D\u0435 \u0430\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u0430.",
    "catalog.queryChip": "\u0417\u0430\u043F\u0440\u043E\u0441: {query}",
    "catalog.removeFilter": "\u0421\u043D\u044F\u0442\u044C {name}",
    "palette.legend": "\u2713 \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u0442 \u0443\u043A\u0430\u0437\u0430\u043D\u043D\u044B\u0439 \u043F\u043E\u0440\u043E\u0433 \xB7 \xD7 \u043D\u0435 \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u0442 \xB7 ! \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0446\u0435\u043B\u044C APCA. Lc \u0441\u043E \u0437\u043D\u0430\u043A\u043E\u043C; \u0446\u0435\u043B\u044C \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0442\u0435\u043B\u044C\u043D\u0430\u044F.",
    "palette.title": "\u041A\u043E\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u043F\u0430\u043B\u0438\u0442\u0440\u044B",
    "palette.wheelLabel": "\u0421\u0432\u044F\u0437\u0430\u043D\u043D\u044B\u0435 \u0442\u043E\u0447\u043A\u0438 \u0446\u0432\u0435\u0442\u043E\u0432\u043E\u0439 \u0433\u0430\u0440\u043C\u043E\u043D\u0438\u0438",
    "palette.wheelColor": "\u0426\u0432\u0435\u0442",
    "palette.wheelHelp": "\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u043D\u0430 \u0446\u0432\u0435\u0442\u043D\u043E\u0435 \u043A\u043E\u043B\u044C\u0446\u043E, \u0447\u0442\u043E\u0431\u044B \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0431\u0430\u0437\u043E\u0432\u044B\u0439 \u0446\u0432\u0435\u0442. \u041F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u043B\u044E\u0431\u0443\u044E \u0442\u043E\u0447\u043A\u0443: \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u044B\u0435 \u0441\u043B\u0435\u0434\u0443\u044E\u0442 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0439 \u0433\u0430\u0440\u043C\u043E\u043D\u0438\u0438. \u041A\u043B\u0430\u0432\u0438\u0430\u0442\u0443\u0440\u0430: \u0441\u0442\u0440\u0435\u043B\u043A\u0438 1\xB0, Shift \u0438\u043B\u0438 Page 10\xB0, Home/End; Escape \u043E\u0442\u043C\u0435\u043D\u044F\u0435\u0442 \u043F\u0435\u0440\u0435\u0442\u0430\u0441\u043A\u0438\u0432\u0430\u043D\u0438\u0435. \u041C\u043E\u0436\u043D\u043E \u0442\u0430\u043A\u0436\u0435 \u0432\u0432\u0435\u0441\u0442\u0438 HEX.",
    "palette.baseColor": "\u0411\u0430\u0437\u043E\u0432\u044B\u0439 HEX",
    "palette.picker": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0431\u0430\u0437\u043E\u0432\u044B\u0439 \u0446\u0432\u0435\u0442",
    "palette.background": "\u041F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C\u044B\u0439 \u0444\u043E\u043D HEX",
    "palette.foreground": "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u0442\u0435\u043A\u0441\u0442 HEX",
    "palette.space": "\u0426\u0432\u0435\u0442\u043E\u0432\u043E\u0439 \u043A\u0440\u0443\u0433",
    "palette.fontSize": "\u0420\u0430\u0437\u043C\u0435\u0440 \u0442\u0435\u043A\u0441\u0442\u0430, px",
    "palette.fontWeight": "\u0422\u043E\u043B\u0449\u0438\u043D\u0430 \u0448\u0440\u0438\u0444\u0442\u0430",
    "palette.role": "\u041D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0442\u0435\u043A\u0441\u0442\u0430",
    "palette.body": "\u041E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 \u0442\u0435\u043A\u0441\u0442",
    "palette.label": "\u041F\u043E\u0434\u043F\u0438\u0441\u044C",
    "palette.large": "\u041A\u0440\u0443\u043F\u043D\u044B\u0439 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A",
    "palette.harmonies": "\u0412\u0430\u0440\u0438\u0430\u043D\u0442\u044B \u0433\u0430\u0440\u043C\u043E\u043D\u0438\u0439",
    "palette.monochromatic": "\u041C\u043E\u043D\u043E\u0445\u0440\u043E\u043C\u043D\u0430\u044F",
    "palette.analogous": "\u0410\u043D\u0430\u043B\u043E\u0433\u043E\u0432\u0430\u044F",
    "palette.complementary": "\u041A\u043E\u043C\u043F\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u0440\u043D\u0430\u044F",
    "palette.split-complementary": "\u0420\u0430\u0437\u0434\u0435\u043B\u044C\u043D\u0430\u044F \u043A\u043E\u043C\u043F\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u0440\u043D\u0430\u044F",
    "palette.triadic": "\u0422\u0440\u0438\u0430\u0434\u0430",
    "palette.tetradic": "\u0414\u0432\u043E\u0439\u043D\u0430\u044F \u043A\u043E\u043C\u043F\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u0440\u043D\u0430\u044F",
    "palette.square": "\u041A\u0432\u0430\u0434\u0440\u0430\u0442",
    "palette.monochromaticHelp": "\u041E\u0434\u0438\u043D \u043E\u0442\u0442\u0435\u043D\u043E\u043A, \u0440\u0430\u0437\u043D\u0430\u044F \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0430 \u0438 \u043D\u0430\u0441\u044B\u0449\u0435\u043D\u043D\u043E\u0441\u0442\u044C: \u0441\u043F\u043E\u043A\u043E\u0439\u043D\u044B\u0435 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438 \u0438 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F. \u041F\u0440\u043E\u0432\u0435\u0440\u044F\u0439\u0442\u0435 \u043A\u0430\u0436\u0434\u0443\u044E \u0442\u0435\u043A\u0441\u0442\u043E\u0432\u0443\u044E \u043F\u0430\u0440\u0443.",
    "palette.analogousHelp": "\u0421\u043E\u0441\u0435\u0434\u043D\u0438\u0435 \u043E\u0442\u0442\u0435\u043D\u043A\u0438 (\xB130\xB0): \u0441\u0432\u044F\u0437\u043D\u044B\u0435 \u0433\u0440\u0443\u043F\u043F\u044B. \u0411\u043B\u0438\u0437\u043A\u0438\u0435 \u0442\u043E\u043D\u0430 \u043C\u043E\u0433\u0443\u0442 \u0441\u043B\u0438\u0432\u0430\u0442\u044C\u0441\u044F.",
    "palette.complementaryHelp": "\u041F\u0440\u043E\u0442\u0438\u0432\u043E\u043F\u043E\u043B\u043E\u0436\u043D\u044B\u0435 \u043E\u0442\u0442\u0435\u043D\u043A\u0438 (180\xB0): \u043E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 \u0446\u0432\u0435\u0442 \u0438 \u0441\u0434\u0435\u0440\u0436\u0430\u043D\u043D\u044B\u0439 \u0430\u043A\u0446\u0435\u043D\u0442. \u041F\u0440\u043E\u0442\u0438\u0432\u043E\u043F\u043E\u043B\u043E\u0436\u043D\u043E\u0441\u0442\u044C \u043D\u0435 \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u0440\u0443\u0435\u0442 \u043A\u043E\u043D\u0442\u0440\u0430\u0441\u0442 \u0442\u0435\u043A\u0441\u0442\u0430.",
    "palette.split-complementaryHelp": "\u0414\u0432\u0430 \u0441\u043E\u0441\u0435\u0434\u0430 \u043F\u0440\u043E\u0442\u0438\u0432\u043E\u043F\u043E\u043B\u043E\u0436\u043D\u043E\u0433\u043E \u043E\u0442\u0442\u0435\u043D\u043A\u0430 (150\xB0/210\xB0): \u0431\u043E\u043B\u044C\u0448\u0435 \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u043E\u0432 \u0430\u043A\u0446\u0435\u043D\u0442\u0430.",
    "palette.triadicHelp": "\u0422\u0440\u0438 \u043E\u0442\u0442\u0435\u043D\u043A\u0430 \u0447\u0435\u0440\u0435\u0437 120\xB0: \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 \u0438 \u0438\u043B\u043B\u044E\u0441\u0442\u0440\u0430\u0446\u0438\u0438; \u043E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043E\u0434\u0438\u043D \u0432\u0435\u0434\u0443\u0449\u0438\u0439 \u0446\u0432\u0435\u0442.",
    "palette.tetradicHelp": "\u0414\u0432\u0435 \u043A\u043E\u043C\u043F\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u0440\u043D\u044B\u0435 \u043F\u0430\u0440\u044B (0\xB0/60\xB0/180\xB0/240\xB0): \u0431\u043E\u0433\u0430\u0442\u043E\u0435 \u0441\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u0435, \u0442\u0440\u0435\u0431\u0443\u044E\u0449\u0435\u0435 \u0441\u0434\u0435\u0440\u0436\u0430\u043D\u043D\u043E\u0441\u0442\u0438.",
    "palette.squareHelp": "\u0427\u0435\u0442\u044B\u0440\u0435 \u043E\u0442\u0442\u0435\u043D\u043A\u0430 \u0447\u0435\u0440\u0435\u0437 90\xB0: \u0448\u0438\u0440\u043E\u043A\u0438\u0439 \u043E\u0445\u0432\u0430\u0442 \u043A\u0440\u0443\u0433\u0430; \u0443\u043C\u0435\u043D\u044C\u0448\u0430\u0439\u0442\u0435 \u043A\u043E\u043D\u043A\u0443\u0440\u0435\u043D\u0446\u0438\u044E \u0430\u043A\u0446\u0435\u043D\u0442\u043E\u0432.",
    "palette.invalid": "\u041D\u0443\u0436\u043D\u044B \u043D\u0435\u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u0435 #RRGGBB \u0438 \u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0448\u0440\u0438\u0444\u0442\u0430. \u041D\u0438\u0436\u0435 \u043F\u043E\u043A\u0430\u0437\u0430\u043D \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0439 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442.",
    "palette.neutral": "\u0423 \u044D\u0442\u043E\u0433\u043E \u0446\u0432\u0435\u0442\u0430 \u043D\u0435\u0442 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0451\u043D\u043D\u043E\u0433\u043E \u043E\u0442\u0442\u0435\u043D\u043A\u0430: \u043F\u043E\u0432\u043E\u0440\u043E\u0442\u044B \u043A\u0440\u0443\u0433\u0430 \u043D\u0435 \u0434\u0430\u0434\u0443\u0442 \u0440\u0430\u0437\u043D\u044B\u0435 \u043E\u0442\u0442\u0435\u043D\u043A\u0438. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0446\u0432\u0435\u0442\u043D\u0443\u044E \u043E\u0441\u043D\u043E\u0432\u0443.",
    "palette.mapped": "\u0423 \u0447\u0430\u0441\u0442\u0438 \u0446\u0432\u0435\u0442\u043E\u0432 \u0441\u043D\u0438\u0436\u0435\u043D\u0430 \u043D\u0430\u0441\u044B\u0449\u0435\u043D\u043D\u043E\u0441\u0442\u044C \u0434\u043B\u044F sRGB. \u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u0440\u0430\u0441\u0441\u0447\u0438\u0442\u0430\u043D\u044B \u043F\u043E \u0438\u0442\u043E\u0433\u043E\u0432\u043E\u043C\u0443 HEX.",
    "palette.candidate": "\u042D\u0442\u043E \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u044B. \u0421\u043E\u0445\u0440\u0430\u043D\u044F\u0439\u0442\u0435 \u043F\u0430\u043B\u0438\u0442\u0440\u0443 \u0438 \u0441\u0435\u043C\u0430\u043D\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0440\u043E\u043B\u0438 \u043F\u0440\u043E\u0435\u043A\u0442\u0430. AA \u043E\u0442\u043D\u043E\u0441\u0438\u0442\u0441\u044F \u043A \u0443\u043A\u0430\u0437\u0430\u043D\u043D\u044B\u043C \u043F\u0430\u0440\u0430\u043C; APCA \u2014 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u044F.",
    "palette.textSurface": "\u0422\u0435\u043A\u0441\u0442 \u043D\u0430 \u0444\u043E\u043D\u0435",
    "palette.existingText": "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u0442\u0435\u043A\u0441\u0442 \u043D\u0430 \u0446\u0432\u0435\u0442\u0435",
    "palette.suggestedInk": "\u041F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0438\u0439 \u0446\u0432\u0435\u0442 \u0442\u0435\u043A\u0441\u0442\u0430",
    "palette.boundary": "\u0417\u043D\u0430\u0447\u0438\u043C\u044B\u0439 \u043A\u043E\u043D\u0442\u0443\u0440",
    "palette.pass": "\u043F\u0440\u043E\u0445\u043E\u0434\u0438\u0442",
    "palette.fail": "\u043D\u0435 \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u0442",
    "palette.review": "\u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C",
    "palette.pairFront": "\u0422\u0435\u043A\u0441\u0442 \u043F\u0440\u0438\u043C\u0435\u0440\u0430",
    "palette.pairBack": "\u0424\u043E\u043D \u043F\u0440\u0438\u043C\u0435\u0440\u0430",
    "palette.surfaceOption": "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u0444\u043E\u043D",
    "palette.textOption": "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u0442\u0435\u043A\u0441\u0442",
    "palette.example": "\u041F\u043E\u043D\u044F\u0442\u043D\u0430\u044F \u0438\u0434\u0435\u044F \u043D\u0430\u0447\u0438\u043D\u0430\u0435\u0442\u0441\u044F \u0441 \u0440\u0430\u0437\u043B\u0438\u0447\u0438\u043C\u043E\u0433\u043E \u0442\u0435\u043A\u0441\u0442\u0430.",
    "palette.pairTitle": "\u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0441\u0432\u043E\u044E \u043F\u0430\u0440\u0443",
    "palette.tonal": "\u0422\u043E\u043D\u0430\u043B\u044C\u043D\u0430\u044F \u0448\u043A\u0430\u043B\u0430 OKLCH",
    "palette.tonalHelp": "\u0421\u0442\u0443\u043F\u0435\u043D\u0438 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u044B, \u0430 \u043D\u0435 \u0430\u043B\u0433\u043E\u0440\u0438\u0442\u043C Material HCT. \u0414\u043B\u044F \u0440\u043E\u043B\u0435\u0439 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0439\u0442\u0435 \u043A\u0430\u0436\u0434\u0443\u044E \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u0443\u044E \u043F\u0430\u0440\u0443.",
    "palette.export": "JSON \u043F\u0430\u043B\u0438\u0442\u0440\u044B",
    "palette.exportName": "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u043F\u0430\u043B\u0438\u0442\u0440\u044B JSON",
    "palette.controls": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043F\u0430\u043B\u0438\u0442\u0440\u044B",
    "palette.wheel": "\u0426\u0432\u0435\u0442\u043E\u0432\u043E\u0439 \u043A\u0440\u0443\u0433; \u043D\u043E\u043C\u0435\u0440\u0430 \u043F\u043E\u0434 \u043D\u0438\u043C \u043E\u0431\u043E\u0437\u043D\u0430\u0447\u0430\u044E\u0442 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0435 \u0446\u0432\u0435\u0442\u0430.",
    "async.idle": "\u0413\u043E\u0442\u043E\u0432\u043E \u043A \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435",
    "async.loading": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026",
    "async.refreshing": "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435\u2026",
    "async.empty": "\u041D\u0435\u0442 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0433\u043E \u0434\u043B\u044F \u043F\u043E\u043A\u0430\u0437\u0430",
    "async.error": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.",
    "async.timeout": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0437\u0430\u043D\u044F\u043B\u0430 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.",
    "async.cancelled": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043E\u0442\u043C\u0435\u043D\u0435\u043D\u0430",
    "async.stale": "\u041F\u043E\u043A\u0430\u0437\u0430\u043D\u043E \u0440\u0430\u043D\u0435\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043D\u043E\u0435 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435.",
    "async.retry": "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0441\u043D\u043E\u0432\u0430",
    "common.cancel": "\u041E\u0442\u043C\u0435\u043D\u0430",
    "common.close": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
    "common.save": "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C",
    "common.saveChanges": "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F",
    "common.saving": "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435\u2026",
    "common.saved": "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E",
    "common.undo": "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C",
    "common.redo": "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C",
    "common.find": "\u041D\u0430\u0439\u0442\u0438",
    "common.copy": "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
    "common.copied": "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E",
    "common.loading": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026",
    "common.loadingData": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0434\u0430\u043D\u043D\u044B\u0445\u2026",
    "common.empty": "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445",
    "common.loadError": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435",
    "common.saveError": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C",
    "common.running": "\u0412\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F\u2026",
    "common.confirm": "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C",
    "common.previous": "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F",
    "common.next": "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F",
    "common.yes": "\u0414\u0430",
    "common.no": "\u041D\u0435\u0442",
    "common.search": "\u041F\u043E\u0438\u0441\u043A",
    "common.refresh": "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C",
    "common.reset": "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C",
    "common.select": "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435...",
    "common.searchPlaceholder": "\u041F\u043E\u0438\u0441\u043A\u2026",
    "common.noResults": "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E",
    "common.unknownAuthor": "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D",
    "common.noDate": "\u0411\u0435\u0437 \u0434\u0430\u0442\u044B",
    "code.actions": "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0441 \u043A\u043E\u0434\u043E\u043C",
    "code.find": "\u041D\u0430\u0439\u0442\u0438 \u0432 \u043A\u043E\u0434\u0435",
    "code.copy": "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u0438\u043B\u0438 \u0432\u0435\u0441\u044C \u043A\u043E\u0434",
    "code.wrapLabel": "\u041F\u0435\u0440\u0435\u043D\u043E\u0441\u0438\u0442\u044C \u0434\u043B\u0438\u043D\u043D\u044B\u0435 \u0441\u0442\u0440\u043E\u043A\u0438",
    "code.wrap": "\u041F\u0435\u0440\u0435\u043D\u043E\u0441",
    "code.linesLabel": "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043D\u043E\u043C\u0435\u0440\u0430 \u0441\u0442\u0440\u043E\u043A",
    "code.lines": "\u0421\u0442\u0440\u043E\u043A\u0438",
    "code.copyError": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
    "code.readonly": "\u0418\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u043A\u043E\u0434",
    "code.view": "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u043A\u043E\u0434\u0430",
    "code.processError": "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0432\u043D\u0435\u0441\u0435\u043D\u043E. \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044C \u0435\u0433\u043E \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0443.",
    "code.tooLarge": "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0435. \u0421\u043E\u043A\u0440\u0430\u0442\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u0438\u043B\u0438 \u0434\u043B\u0438\u043D\u0443 \u0441\u0442\u0440\u043E\u043A\u0438.",
    "md.editor": "\u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440 Markdown",
    "md.edit": "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435",
    "md.split": "\u0420\u044F\u0434\u043E\u043C",
    "md.preview": "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440",
    "md.source": "\u0418\u0441\u0445\u043E\u0434\u043D\u0438\u043A",
    "md.open": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C .md",
    "md.download": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C .md",
    "md.replaceQuestion": "\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u043D\u0435\u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0439 \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u043C \u0444\u0430\u0439\u043B\u043E\u043C?",
    "md.replace": "\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A",
    "md.previewError": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u0441\u0442\u0440\u043E\u0438\u0442\u044C \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440",
    "md.changeError": "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0447\u0438\u043A\u0430 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439",
    "md.saveHint": "\u0414\u043B\u044F \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0447\u0438\u043A \u0438\u043B\u0438 \u0441\u043A\u0430\u0447\u0430\u0439\u0442\u0435 .md",
    "md.opened": "\u0424\u0430\u0439\u043B \u043E\u0442\u043A\u0440\u044B\u0442",
    "md.openError": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0444\u0430\u0439\u043B",
    "md.readError": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u0444\u0430\u0439\u043B",
    "md.downloadUnavailable": "\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E \u0432 \u044D\u0442\u043E\u043C \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u0438",
    "md.waitDownload": "\u0414\u043E\u0436\u0434\u0438\u0442\u0435\u0441\u044C \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u044F \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0445 \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0439",
    "md.downloadError": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435",
    "md.linkError": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443",
    "history.git": "\u0418\u0441\u0442\u043E\u0440\u0438\u044F Git",
    "history.tasks": "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0437\u0430\u0434\u0430\u0447",
    "history.search": "\u041F\u043E\u0438\u0441\u043A \u0432 \u0438\u0441\u0442\u043E\u0440\u0438\u0438",
    "history.placeholder": "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435, \u0430\u0432\u0442\u043E\u0440 \u0438\u043B\u0438 ID\u2026",
    "history.lane": "\u0414\u043E\u0440\u043E\u0436\u043A\u0430",
    "history.all": "\u0412\u0441\u0435 \u0434\u043E\u0440\u043E\u0436\u043A\u0438",
    "history.gitLegend": "\u0421\u043F\u043B\u043E\u0448\u043D\u0430\u044F \u043B\u0438\u043D\u0438\u044F \u2014 \u0440\u043E\u0434\u0438\u0442\u0435\u043B\u044C \u043A\u043E\u043C\u043C\u0438\u0442\u0430. \u041F\u0443\u043D\u043A\u0442\u0438\u0440 \u2014 \u0441\u0432\u044F\u0437\u044C \u0437\u0430 \u043F\u0440\u0435\u0434\u0435\u043B\u0430\u043C\u0438 \u0432\u044B\u0431\u043E\u0440\u043A\u0438.",
    "history.taskLegend": "\u0421\u043F\u043B\u043E\u0448\u043D\u0430\u044F \u043B\u0438\u043D\u0438\u044F \u2014 \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u043E\u0434\u043D\u043E\u0439 \u0437\u0430\u0434\u0430\u0447\u0438. \u041F\u0443\u043D\u043A\u0442\u0438\u0440 \u2014 \u044F\u0432\u043D\u0430\u044F \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u044C \u0438\u043B\u0438 \u0441\u043A\u0440\u044B\u0442\u044B\u0439 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442.",
    "history.details": "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0441\u0442\u0438 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0439 \u0437\u0430\u043F\u0438\u0441\u0438",
    "history.choose": "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0437\u0430\u043F\u0438\u0441\u044C \u0432 \u0438\u0441\u0442\u043E\u0440\u0438\u0438.",
    "history.commit": "\u041A\u041E\u041C\u041C\u0418\u0422",
    "history.event": "\u0421\u041E\u0411\u042B\u0422\u0418\u0415 \u0417\u0410\u0414\u0410\u0427\u0418",
    "history.parent": "\u0420\u043E\u0434\u0438\u0442\u0435\u043B\u044C",
    "history.previousEvent": "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0435 \u0441\u043E\u0431\u044B\u0442\u0438\u0435",
    "history.outside": "\u0432\u043D\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u043D\u043D\u043E\u0433\u043E \u0441\u043D\u0438\u043C\u043A\u0430",
    "history.hidden": "\u0441\u043A\u0440\u044B\u0442\u043E",
    "history.hostAction": "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043F\u0440\u0438\u043C\u0435\u043D\u044F\u0435\u0442 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435, \u043A\u043E\u0442\u043E\u0440\u043E\u043C\u0443 \u043F\u0440\u0438\u043D\u0430\u0434\u043B\u0435\u0436\u0438\u0442 \u0437\u0430\u0434\u0430\u0447\u0430.",
    "history.changeStatus": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u0434\u0430\u0447\u0438",
    "history.empty": "\u0417\u0430\u043F\u0438\u0441\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B. \u0418\u0437\u043C\u0435\u043D\u0438\u0442\u0435 \u043F\u043E\u0438\u0441\u043A \u0438\u043B\u0438 \u0434\u043E\u0440\u043E\u0436\u043A\u0443.",
    "history.selectedHidden": "\u0432\u044B\u0431\u0440\u0430\u043D\u043D\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C \u0441\u043A\u0440\u044B\u0442\u0430 \u0444\u0438\u043B\u044C\u0442\u0440\u043E\u043C",
    "table.pager": "\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u0442\u0430\u0431\u043B\u0438\u0446\u044B",
    "table.selectPage": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0432\u0441\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u0441\u0442\u0440\u043E\u043A\u0438 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B",
    "table.loadError": "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438. \u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u0447\u0435\u0440\u0435\u0437 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435.",
    "dropdown.open": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u044B",
    "dropdown.close": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u044B",
    "dropdown.choose": "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435",
    "grid.controls": "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0442\u0430\u0431\u043B\u0438\u0446\u0435\u0439",
    "grid.search": "\u041D\u0430\u0439\u0442\u0438 \u0432 \u0442\u0430\u0431\u043B\u0438\u0446\u0435",
    "grid.filter": "\u0424\u0438\u043B\u044C\u0442\u0440",
    "grid.column": "\u041A\u043E\u043B\u043E\u043D\u043A\u0430",
    "grid.condition": "\u0423\u0441\u043B\u043E\u0432\u0438\u0435",
    "grid.value": "\u0417\u043D\u0430\u0447\u0435\u043D\u0438\u0435",
    "grid.to": "\u0414\u043E",
    "grid.options": "\u0412\u0430\u0440\u0438\u0430\u043D\u0442\u044B",
    "grid.apply": "\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C",
    "grid.clearFilter": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u0444\u0438\u043B\u044C\u0442\u0440",
    "grid.columns": "\u041A\u043E\u043B\u043E\u043D\u043A\u0438",
    "grid.show": "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C",
    "grid.width": "\u0428\u0438\u0440\u0438\u043D\u0430, px",
    "grid.position": "\u041F\u043E\u0437\u0438\u0446\u0438\u044F",
    "grid.frozen": "\u0417\u0430\u043A\u0440\u0435\u043F\u043B\u0435\u043D\u043E \u0441\u043B\u0435\u0432\u0430",
    "grid.autosize": "\u041F\u043E\u0434\u043E\u0431\u0440\u0430\u0442\u044C \u0448\u0438\u0440\u0438\u043D\u0443",
    "grid.selectVisible": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0432\u0438\u0434\u0438\u043C\u044B\u0435",
    "grid.selectAll": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0432\u0441\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043D\u044B\u0435",
    "grid.clearSelection": "\u0421\u043D\u044F\u0442\u044C \u0432\u044B\u0431\u043E\u0440",
    "grid.pages": "\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u044B",
    "grid.first": "\u041F\u0435\u0440\u0432\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430",
    "grid.previous": "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430",
    "grid.next": "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430",
    "grid.last": "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430",
    "grid.page": "\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430",
    "grid.pageSize": "\u0421\u0442\u0440\u043E\u043A \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435",
    "grid.closeDetails": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u043F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0441\u0442\u0438",
    "grid.closeActions": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F",
    "grid.number": "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0447\u0438\u0441\u043B\u043E",
    "grid.finiteNumber": "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u043D\u0435\u0447\u043D\u043E\u0435 \u0447\u0438\u0441\u043B\u043E",
    "grid.check": "\u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435",
    "filter.eq": "\u0420\u0430\u0432\u043D\u043E",
    "filter.ne": "\u041D\u0435 \u0440\u0430\u0432\u043D\u043E",
    "filter.contains": "\u0421\u043E\u0434\u0435\u0440\u0436\u0438\u0442",
    "filter.notContains": "\u041D\u0435 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u0442",
    "filter.starts": "\u041D\u0430\u0447\u0438\u043D\u0430\u0435\u0442\u0441\u044F",
    "filter.notStarts": "\u041D\u0435 \u043D\u0430\u0447\u0438\u043D\u0430\u0435\u0442\u0441\u044F",
    "filter.ends": "\u0417\u0430\u043A\u0430\u043D\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F",
    "filter.notEnds": "\u041D\u0435 \u0437\u0430\u043A\u0430\u043D\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F",
    "filter.lt": "\u041C\u0435\u043D\u044C\u0448\u0435",
    "filter.le": "\u041D\u0435 \u0431\u043E\u043B\u044C\u0448\u0435",
    "filter.gt": "\u0411\u043E\u043B\u044C\u0448\u0435",
    "filter.ge": "\u041D\u0435 \u043C\u0435\u043D\u044C\u0448\u0435",
    "filter.between": "\u041C\u0435\u0436\u0434\u0443",
    "filter.in": "\u0412 \u0441\u043F\u0438\u0441\u043A\u0435",
    "filter.empty": "\u041F\u0443\u0441\u0442\u043E",
    "filter.notEmpty": "\u041D\u0435 \u043F\u0443\u0441\u0442\u043E",
    "window.back": "\u041D\u0430\u0437\u0430\u0434",
    "window.forward": "\u0412\u043F\u0435\u0440\u0451\u0434",
    "window.left": "\u041B\u0435\u0432\u0430\u044F \u043F\u0430\u043D\u0435\u043B\u044C",
    "window.right": "\u041F\u0440\u0430\u0432\u0430\u044F \u043F\u0430\u043D\u0435\u043B\u044C",
    "window.toolbar": "\u041F\u0430\u043D\u0435\u043B\u044C \u043E\u043A\u043D\u0430",
    "window.content": "\u0421\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435 \u043E\u043A\u043D\u0430",
    "window.overview": "\u041E\u0431\u0437\u043E\u0440",
    "tree.collapse": "\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C",
    "tree.expand": "\u0420\u0430\u0437\u0432\u0435\u0440\u043D\u0443\u0442\u044C",
    "board.controls": "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0434\u043E\u0441\u043A\u043E\u0439",
    "board.zoomOut": "\u0423\u043C\u0435\u043D\u044C\u0448\u0438\u0442\u044C \u043C\u0430\u0441\u0448\u0442\u0430\u0431 (\u2212)",
    "board.reset": "\u041C\u0430\u0441\u0448\u0442\u0430\u0431 100% (1)",
    "board.zoomIn": "\u0423\u0432\u0435\u043B\u0438\u0447\u0438\u0442\u044C \u043C\u0430\u0441\u0448\u0442\u0430\u0431 (+)",
    "board.fitLabel": "\u0412\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u0433\u0440\u0430\u0444 (0)",
    "board.fit": "\u0412\u043C\u0435\u0441\u0442\u0438\u0442\u044C",
    "board.backgroundSettings": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0444\u043E\u043D\u0430",
    "board.background": "\u0426\u0432\u0435\u0442 \u0444\u043E\u043D\u0430",
    "board.theme": "\u0426\u0432\u0435\u0442 \u0442\u0435\u043C\u044B",
    "board.fill": "\u0417\u0430\u043B\u0438\u0432\u043A\u0430",
    "board.none": "\u0411\u0435\u0437 \u0443\u0437\u043E\u0440\u0430",
    "board.dots": "\u0422\u043E\u0447\u043A\u0438",
    "board.grid": "\u0421\u0435\u0442\u043A\u0430",
    "board.help": "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0438 \u0433\u043E\u0440\u044F\u0447\u0438\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0438",
    "chat.agents": "\u0410\u0433\u0435\u043D\u0442\u044B",
    "chat.open": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0430\u0433\u0435\u043D\u0442\u043E\u0432",
    "chat.close": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u043B\u0435\u043D\u0442\u0443",
    "chat.collapse": "\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u043B\u0435\u043D\u0442\u0443",
    "chat.expand": "\u0420\u0430\u0437\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u0447\u0430\u0442",
    "chat.restore": "\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u0440\u0430\u0437\u043C\u0435\u0440",
    "chat.settings": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043B\u0435\u043D\u0442\u044B",
    "chat.markers": "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0440\u0430\u0431\u043E\u0442\u0443 \u0430\u0433\u0435\u043D\u0442\u043E\u0432 \u043D\u0430 \u043A\u0430\u0440\u0442\u0435",
    "chat.map": "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0430\u0433\u0435\u043D\u0442\u043E\u0432 \u043D\u0430 \u043A\u0430\u0440\u0442\u0435",
    "chat.view": "\u0414\u0438\u0430\u043B\u043E\u0433 / \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u0438",
    "chat.mode": "\u0420\u0435\u0436\u0438\u043C \u0434\u0438\u0430\u043B\u043E\u0433\u0430",
    "chat.log": "\u0417\u0430\u043F\u0440\u043E\u0441\u044B \u0438 \u043E\u0442\u0432\u0435\u0442\u044B",
    "chat.empty": "\u041D\u0435\u0442 \u043D\u0430\u0431\u043B\u044E\u0434\u0430\u0435\u043C\u044B\u0445 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u0439 \u0432 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u043C \u043E\u043A\u043D\u0435.",
    "chat.older": "\u0411\u043E\u043B\u0435\u0435 \u0440\u0430\u043D\u043D\u0438\u0435 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u0438",
    "chat.newer": "\u041A \u043D\u043E\u0432\u044B\u043C \u0441\u043E\u0431\u044B\u0442\u0438\u044F\u043C",
    "chat.clear": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u0432\u0438\u0434\u0438\u043C\u044B\u0439 \u0436\u0443\u0440\u043D\u0430\u043B",
    "chat.request": "\u0417\u0430\u043F\u0440\u043E\u0441",
    "chat.response": "\u041E\u0442\u0432\u0435\u0442",
    "chat.send": "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C",
    "chat.message": "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0430\u0433\u0435\u043D\u0442\u0443",
    "chat.placeholder": "\u041E\u043F\u0438\u0448\u0438\u0442\u0435 \u0437\u0430\u0434\u0430\u0447\u0443 \xB7 Enter \u2014 \u043D\u043E\u0432\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430",
    "chat.observer": "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B \u0432 \u0440\u0435\u0436\u0438\u043C\u0435 \u043D\u0430\u0431\u043B\u044E\u0434\u0435\u043D\u0438\u044F.",
    "chat.unresolved": "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0443\u0442\u043E\u0447\u043D\u0438\u0442\u0435 \u0438\u0441\u0445\u043E\u0434 \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0445 \u043E\u0442\u043F\u0440\u0430\u0432\u043E\u043A.",
    "chat.tooLong": "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043F\u0440\u0435\u0432\u044B\u0448\u0430\u0435\u0442 \u043B\u0438\u043C\u0438\u044216384 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432.",
    "ui.language": "\u042F\u0437\u044B\u043A \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430",
    "ui.languages": "\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u044F\u0437\u044B\u043A\u0438",
    "ui.fallback": "\u0417\u0430\u043F\u0430\u0441\u043D\u043E\u0439 \u044F\u0437\u044B\u043A",
    "ui.settings": "\u042F\u0437\u044B\u043A \u0438 \u0440\u0435\u0433\u0438\u043E\u043D",
    "ui.english": "\u0410\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439",
    "ui.russian": "\u0420\u0443\u0441\u0441\u043A\u0438\u0439",
    "ui.apply": "\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    "ui.localSaved": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B \u043D\u0430 \u044D\u0442\u043E\u043C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435",
    "ui.localUnsaved": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043F\u0440\u0438\u043C\u0435\u043D\u0435\u043D\u044B; \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E",
    "ui.atLeastOne": "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u0438\u043D \u044F\u0437\u044B\u043A",
    "ui.hint": "\u041C\u043E\u0436\u043D\u043E \u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439. \u0421\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u043E\u0432 \u043D\u0435 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438.",
    "ui.enableEnglish": "\u041F\u0440\u0435\u0434\u043B\u0430\u0433\u0430\u0442\u044C \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439",
    "ui.enableRussian": "\u041F\u0440\u0435\u0434\u043B\u0430\u0433\u0430\u0442\u044C \u0440\u0443\u0441\u0441\u043A\u0438\u0439",
    "table.sort": "\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C: {name}",
    "table.row": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0441\u0442\u0440\u043E\u043A\u0443: {name}",
    "tree.toggleCollapse": "\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C: {name}",
    "tree.toggleExpand": "\u0420\u0430\u0437\u0432\u0435\u0440\u043D\u0443\u0442\u044C: {name}",
    "md.controls": "{name}: \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435",
    "md.viewLabel": "{name}: \u0432\u0438\u0434",
    "md.previewLabel": "{name}: \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440",
    "md.sourceLabel": "{name}: \u0438\u0441\u0445\u043E\u0434\u043D\u0438\u043A",
    "grid.dataArea": "{name}: \u043E\u0431\u043B\u0430\u0441\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0445",
    "grid.actions": "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F: {name}",
    "history.boundary": "{count} \u0441\u0432\u044F\u0437\u0435\u0439 \u0432\u043D\u0435 \u0432\u0438\u0434\u0438\u043C\u043E\u0439 \u0432\u044B\u0431\u043E\u0440\u043A\u0438",
    "history.count": "\u041F\u043E\u043A\u0430\u0437\u0430\u043D\u043E {count} \u0438\u0437 {total}",
    "table.rows": "{count} \u0441\u0442\u0440\u043E\u043A \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435",
    "grid.pageTotal": "\u0438\u0437 {count} \xB7 {total} \u0441\u0442\u0440\u043E\u043A",
    "grid.selected": "\u0412\u044B\u0431\u0440\u0430\u043D\u043E: {count}",
    "grid.excluded": "\u0412\u0441\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043D\u044B\u0435, \u0438\u0441\u043A\u043B\u044E\u0447\u0435\u043D\u043E: {count}",
    "chat.operations": "\u041E\u043F\u0435\u0440\u0430\u0446\u0438\u0439: {count}",
    "chat.inWindow": "\u0412 \u043E\u043A\u043D\u0435: {count}.",
    "chat.omitted": "\u0421\u0442\u0430\u0440\u044B\u0445 \u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u0441\u043A\u0440\u044B\u0442\u043E: {count}. \u0412 \u043E\u043A\u043D\u0435: {total}.",
    "window.identity": "{name}: \u043F\u0430\u043D\u0435\u043B\u044C \u043E\u043A\u043D\u0430",
    "common.items": {
      one: "{count} \u044D\u043B\u0435\u043C\u0435\u043D\u0442",
      few: "{count} \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430",
      many: "{count} \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432",
      other: "{count} \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430"
    },
    "shell.catalog": "\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B",
    "shell.styles": "\u0421\u0442\u0438\u043B\u0438 \u0441\u0438\u0441\u0442\u0435\u043C",
    "shell.rules": "\u0414\u0438\u0437\u0430\u0439\u043D-\u0431\u0443\u043A",
    "shell.usage": "\u041F\u0440\u043E\u0435\u043A\u0442\u044B \u0438 \u0434\u043E\u043B\u0433",
    "shell.performance": "\u041F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C",
    "shell.recommendations": "\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438",
    "shell.sandbox": "\u041F\u0435\u0441\u043E\u0447\u043D\u0438\u0446\u0430",
    "shell.libraries": "\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0438 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432",
    "shell.map": "\u041A\u0430\u0440\u0442\u0430 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430",
    "shell.studio": "\u0411\u0440\u0435\u043D\u0434-\u0431\u0443\u043A \u0438 \u043A\u043B\u0438\u0435\u043D\u0442\u0441\u043A\u0438\u0435 \u043F\u0443\u0442\u0438",
    "shell.audit": "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430",
    "shell.identity": "\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u043E\u0432",
    "shell.skip": "\u041A \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u043C\u0443",
    "shell.local": "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u0430\u044F \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430",
    "shell.refresh": "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u043A\u0430\u0442\u0430\u043B\u043E\u0433",
    "shell.theme": "\u0421\u043C\u0435\u043D\u0438\u0442\u044C \u0442\u0435\u043C\u0443",
    "shell.collapse": "\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u043C\u0435\u043D\u044E",
    "shell.expand": "\u0420\u0430\u0437\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u043C\u0435\u043D\u044E",
    "shell.search": "\u041D\u0430\u0439\u0442\u0438 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442",
    "shell.searchHint": "\u041D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044F, \u043A\u043D\u043E\u043F\u043A\u0430, popup\u2026",
    "shell.library": "\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432",
    "shell.allLibraries": "\u0412\u0441\u0435 \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0438",
    "shell.view": "\u0412\u0438\u0434 \u0438 \u0441\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430",
    "shell.palette": "\u041F\u0430\u043B\u0438\u0442\u0440\u0430 \u043F\u0440\u0435\u0432\u044C\u044E",
    "shell.sort": "\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430",
    "shell.relevance": "\u041F\u043E \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u044E",
    "shell.frequent": "\u0427\u0430\u0449\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442\u0441\u044F",
    "shell.infrequent": "\u0420\u0435\u0436\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442\u0441\u044F",
    "shell.az": "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435: \u0410\u2013\u042F",
    "shell.za": "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435: \u042F\u2013\u0410",
    "shell.usageLabel": "\u041C\u0435\u0442\u043A\u0430 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F",
    "shell.count": "{count} \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u043E\u0432",
    "shell.frequency": "\u0427\u0430\u0441\u0442\u043E\u0442\u0430: 0\u20135",
    "shell.usageTitle": "\u041F\u0440\u043E\u0435\u043A\u0442\u044B \u0438 \u0434\u0438\u0437\u0430\u0439\u043D-\u0434\u043E\u043B\u0433",
    "shell.localeDescription": "\u042F\u0437\u044B\u043A \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430 \u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u043B\u043E\u043A\u0430\u043B\u0438 \u043D\u0430 \u044D\u0442\u043E\u043C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435.",
    "lab.eyebrow": "AG DESIGN / \u0412 \u0420\u0410\u0411\u041E\u0422\u0415",
    "lab.title": "\u041E\u0434\u0438\u043D \u043D\u0430\u0431\u043E\u0440. \u0414\u0435\u0432\u044F\u0442\u044C \u0445\u0430\u0440\u0430\u043A\u0442\u0435\u0440\u043E\u0432.",
    "lab.description": "\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0438 \u0432 \u0440\u0430\u0431\u043E\u0447\u0435\u043C \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0438: \u0438\u0441\u0442\u043E\u0440\u0438\u044F \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439, \u0437\u0430\u0434\u0430\u0447\u0438, \u0434\u0430\u043D\u043D\u044B\u0435 \u0438 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440.",
    "lab.live": "\u0416\u0438\u0432\u044B\u0435 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B",
    "lab.compare": "\u0421\u0440\u0430\u0432\u043D\u0438\u0442\u044C \u043E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0435 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u043E\u0432",
    "lab.synthetic": "\u0421\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \xB7 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044E\u0442 \u0434\u043E \u043F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B.",
    "lab.tokens": "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0442\u043E\u043A\u0435\u043D\u044B",
    "lab.tabs": "\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0435",
    "lab.tasks": "\u0417\u0430\u0434\u0430\u0447\u0438",
    "lab.table": "\u0422\u0430\u0431\u043B\u0438\u0446\u0430",
    "lab.form": "\u0424\u043E\u0440\u043C\u0430",
    "lab.editor": "\u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440",
    "lab.tableCaption": "\u041F\u043B\u0430\u043D \u0432\u044B\u043F\u0443\u0441\u043A\u0430 \xB7 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0430\u044F \u0442\u0430\u0431\u043B\u0438\u0446\u0430",
    "lab.selectRows": "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0442\u0440\u043E\u043A\u0438 \u0434\u043B\u044F \u0433\u0440\u0443\u043F\u043F\u043E\u0432\u043E\u0433\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F.",
    "lab.task": "\u0417\u0430\u0434\u0430\u0447\u0430",
    "lab.name": "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435",
    "lab.status": "\u0421\u0442\u0430\u0442\u0443\u0441",
    "lab.owner": "\u041E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439",
    "lab.project": "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0435\u043A\u0442\u0430",
    "lab.example": "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, \u043D\u043E\u0432\u0430\u044F \u0440\u0435\u0434\u0430\u043A\u0446\u0438\u044F",
    "lab.hint": "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u0432 \u0442\u0435\u043A\u0443\u0449\u0435\u043C \u0434\u0435\u043C\u043E-\u0441\u0435\u0430\u043D\u0441\u0435.",
    "lab.visibility": "\u0412\u0438\u0434\u0438\u043C\u043E\u0441\u0442\u044C",
    "lab.team": "\u0422\u043E\u043B\u044C\u043A\u043E \u043A\u043E\u043C\u0430\u043D\u0434\u0430",
    "lab.workspace": "\u0412\u0441\u0451 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E",
    "lab.ready": "\u0413\u043E\u0442\u043E\u0432\u043D\u043E\u0441\u0442\u044C \u0432\u044B\u043F\u0443\u0441\u043A\u0430",
    "lab.readyHint": "\u0414\u0432\u0430 \u0438\u0437 \u0442\u0440\u0451\u0445 \u044D\u0442\u0430\u043F\u043E\u0432 \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u044B \u0432 \u0441\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u043C \u043F\u043B\u0430\u043D\u0435.",
    "lab.save": "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    "lab.unsaved": "\u0415\u0441\u0442\u044C \u043D\u0435\u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F",
    "lab.localProject": "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u0440\u043E\u0435\u043A\u0442",
    "lab.localSettings": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u044B \u0442\u043E\u043B\u044C\u043A\u043E \u0432 \u0442\u0435\u043A\u0443\u0449\u0435\u043C \u043F\u0440\u0438\u043C\u0435\u0440\u0435.",
    "lab.editorLoading": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430\u2026",
    "lab.note": "\u0417\u0430\u043C\u0435\u0442\u043A\u0430 \u043A \u0432\u044B\u043F\u0443\u0441\u043A\u0443",
    "lab.selected": "\u0412\u044B\u0431\u0440\u0430\u043D\u043E \u0437\u0430\u0434\u0430\u0447: {count}",
    "lab.saved": "\xAB{name}\xBB \xB7 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E",
    "lab.changed": "{name}: {status}. \u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u0432 \u044D\u0442\u043E\u043C \u043F\u0440\u0438\u043C\u0435\u0440\u0435.",
    "chat.messages": "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0447\u0430\u0442\u0430",
    "chat.noMessages": "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442. \u0418\u0441\u0442\u043E\u0440\u0438\u044E \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435.",
    "chat.load": "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0438\u0441\u0442\u043E\u0440\u0438\u044E",
    "chat.latest": "\u041A \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u043C",
    "chat.clearVisible": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u0432\u0438\u0434\u0438\u043C\u043E\u0435",
    "chat.historyLoading": "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C \u0438\u0441\u0442\u043E\u0440\u0438\u044E\u2026",
    "chat.new": "\u041D\u043E\u0432\u044B\u0445 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0439: {count} \xB7 \u041A \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u043C",
    "chart.pause": "\u041F\u0430\u0443\u0437\u0430 \u0430\u043D\u0438\u043C\u0430\u0446\u0438\u0438",
    "chart.replay": "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u0430\u043D\u0438\u043C\u0430\u0446\u0438\u044E",
    "chart.previous": "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u0442\u043E\u0447\u043A\u0430",
    "chart.next": "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u0442\u043E\u0447\u043A\u0430",
    "chart.data": "\u041F\u0435\u0440\u0435\u0434\u0430\u043D\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435",
    "chart.decorative": "\u0414\u0435\u043A\u043E\u0440\u0430\u0442\u0438\u0432\u043D\u0430\u044F \u0433\u0440\u0430\u0444\u0438\u043A\u0430 \xB7 \u0443\u0441\u043B\u043E\u0432\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435",
    "chart.context": "\u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442 \u0433\u0440\u0430\u0444\u0438\u043A\u0430",
    "chart.empty": "\u041D\u0435\u0442 \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u0439",
    "loading.label": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430",
    "code.searchPanel": "\u041D\u0430\u0439\u0442\u0438",
    "code.replacePanel": "\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C",
    "code.replaceAll": "\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u0432\u0441\u0451",
    "code.nextMatch": "\u0434\u0430\u043B\u0435\u0435",
    "code.previousMatch": "\u043D\u0430\u0437\u0430\u0434",
    "code.matchCase": "\u0443\u0447\u0438\u0442\u044B\u0432\u0430\u0442\u044C \u0440\u0435\u0433\u0438\u0441\u0442\u0440",
    "code.regexp": "\u0440\u0435\u0433\u0443\u043B\u044F\u0440\u043D\u043E\u0435 \u0432\u044B\u0440\u0430\u0436\u0435\u043D\u0438\u0435",
    "code.wholeWord": "\u0446\u0435\u043B\u043E\u0435 \u0441\u043B\u043E\u0432\u043E",
    "code.closeSearch": "\u0437\u0430\u043A\u0440\u044B\u0442\u044C",
    "code.searchLabel": "\u041F\u043E\u0438\u0441\u043A",
    "code.replaceWith": "\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u043D\u0430",
    "code.prepare": "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430\u2026",
    "code.loadError": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440. \u0418\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u0434\u043B\u044F \u0447\u0442\u0435\u043D\u0438\u044F.",
    "history.countHidden": "\u041F\u043E\u043A\u0430\u0437\u0430\u043D\u043E {count} \u0438\u0437 {total} \xB7 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C \u0441\u043A\u0440\u044B\u0442\u0430 \u0444\u0438\u043B\u044C\u0442\u0440\u043E\u043C",
    "breadcrumbs.label": "\u041F\u0443\u0442\u044C \u0440\u0430\u0437\u0434\u0435\u043B\u0430",
    "skeleton.label": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0433\u043E",
    "render.label": "\u0421\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435",
    "resize.left": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0448\u0438\u0440\u0438\u043D\u0443 \u043B\u0435\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u0438",
    "resize.right": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0448\u0438\u0440\u0438\u043D\u0443 \u043F\u0440\u0430\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u0438",
    "issue.evidence": "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0438 \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u044B",
    "issue.noNumber": "\u0411\u0435\u0437 \u043D\u043E\u043C\u0435\u0440\u0430",
    "issue.noStatus": "\u0421\u0442\u0430\u0442\u0443\u0441 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D",
    "issue.untitled": "\u0417\u0430\u0434\u0430\u0447\u0430 \u0431\u0435\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F",
    "issue.noRole": "\u0420\u043E\u043B\u044C \u043D\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0430",
    "issue.noNext": "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0448\u0430\u0433 \u043D\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0451\u043D",
    "issue.noResult": "\u0415\u0449\u0451 \u043D\u0435 \u0437\u0430\u0444\u0438\u043A\u0441\u0438\u0440\u043E\u0432\u0430\u043D",
    "issue.noProblems": "\u041D\u0435 \u0437\u0430\u0444\u0438\u043A\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u044B",
    "issue.next": "\u0414\u0430\u043B\u0435\u0435: {name}",
    "issue.result": "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442: {name}",
    "issue.problems": "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u044B: {name}",
    "card.connections": "\u0421\u0432\u044F\u0437\u0438 \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A",
    "numeric.noScale": "\u0448\u043A\u0430\u043B\u0430 \u043D\u0435 \u0437\u0430\u0434\u0430\u043D\u0430",
    "numeric.percentile": "\u043F\u0440\u043E\u0446\u0435\u043D\u0442\u0438\u043B\u044C\u043D\u0430\u044F \u0448\u043A\u0430\u043B\u0430",
    "numeric.normalized": "\u043D\u043E\u0440\u043C\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u0448\u043A\u0430\u043B\u0430",
    "numeric.score": "\u043E\u0446\u0435\u043D\u043A\u0430 {score} \u0438\u0437 {maximum}; {kind}",
    "board.helpText": "\u041F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0444\u043E\u043D, \u043B\u0438\u0431\u043E \u0443\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0439\u0442\u0435 \u043F\u0440\u043E\u0431\u0435\u043B \u0438 \u0442\u044F\u043D\u0438\u0442\u0435. \u041A\u043E\u043B\u0435\u0441\u043E \u2014 \u043F\u0435\u0440\u0435\u043C\u0435\u0449\u0435\u043D\u0438\u0435; Ctrl/\u2318 + \u043A\u043E\u043B\u0435\u0441\u043E \u2014 \u043C\u0430\u0441\u0448\u0442\u0430\u0431. \u041F\u0440\u0438 \u0444\u043E\u043A\u0443\u0441\u0435 \u043D\u0430 \u043F\u043E\u043B\u0435: \u0441\u0442\u0440\u0435\u043B\u043A\u0438 \u2014 \u043E\u0431\u0437\u043E\u0440, Shift \u2014 \u0431\u044B\u0441\u0442\u0440\u0435\u0435, +/\u2212 \u2014 \u043C\u0430\u0441\u0448\u0442\u0430\u0431, 0 \u2014 \u0432\u043C\u0435\u0441\u0442\u0438\u0442\u044C, 1 \u2014 100%. Tab \u2014 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438. Esc \u2014 \u043E\u0442\u043C\u0435\u043D\u0438\u0442\u044C \u0436\u0435\u0441\u0442.",
    "shell.sections": "\u0420\u0430\u0437\u0434\u0435\u043B\u044B",
    "shell.studioShort": "\u0411\u0440\u0435\u043D\u0434-\u0431\u0443\u043A \u0438 \u043F\u0443\u0442\u0438",
    "shell.librariesShort": "\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0438",
    "shell.collapseShortcut": "\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u043C\u0435\u043D\u044E (\u2318\u21E7S)",
    "shell.expandShortcut": "\u0420\u0430\u0437\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u043C\u0435\u043D\u044E (\u2318\u21E7S)",
    "resize.help": "\u041F\u043E\u0442\u044F\u043D\u0438\u0442\u0435 \u0433\u0440\u0430\u043D\u0438\u0446\u0443 \u0438\u043B\u0438 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u0441\u0442\u0440\u0435\u043B\u043A\u0438; Home / End \u2014 \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u0430\u044F / \u043C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u0430\u044F \u0448\u0438\u0440\u0438\u043D\u0430"
  }
};
for (const entries of Object.values(builtinMessages)) {
  for (const value of Object.values(entries))
    if (typeof value === "object") Object.freeze(value);
  Object.freeze(entries);
}
Object.freeze(builtinMessages);

// packages/components/i18n.js
var documents = /* @__PURE__ */ new WeakMap();
var categories = /* @__PURE__ */ new Set(["zero", "one", "two", "few", "many", "other"]);
function tag(value) {
  if (typeof value !== "string" || value.length > 80)
    throw new TypeError("A bounded BCP47 locale is required");
  return Intl.getCanonicalLocales(value)[0] ?? (() => {
    throw new TypeError("Locale required");
  })();
}
function dictionaries(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new TypeError("Message dictionaries required");
  const result = {};
  if (Object.keys(input).length > 32)
    throw new RangeError("At most32 locale dictionaries");
  for (const [locale, entries] of Object.entries(input)) {
    const canonical = tag(locale);
    if (!entries || typeof entries !== "object" || Array.isArray(entries) || Object.keys(entries).length > 1e3)
      throw new TypeError("At most1000 messages per locale");
    const copied = /* @__PURE__ */ Object.create(null);
    for (const [key, value] of Object.entries(entries)) {
      if (!/^[A-Za-z0-9_.-]{1,160}$/.test(key))
        throw new TypeError("Stable message key required");
      if (typeof value === "string" && value.length <= 6e3)
        copied[key] = value;
      else if (value && typeof value === "object" && !Array.isArray(value) && typeof value.other === "string") {
        const forms = /* @__PURE__ */ Object.create(null);
        for (const [form, message] of Object.entries(value)) {
          if (!categories.has(form) || typeof message !== "string" || message.length > 6e3)
            throw new TypeError("Literal plural forms required");
          forms[form] = message;
        }
        copied[key] = Object.freeze(forms);
      } else throw new TypeError("Literal string or plural message required");
    }
    result[canonical] = Object.freeze(copied);
  }
  return result;
}
function matchLocale(requested, available) {
  if (!requested) return null;
  const canonical = tag(requested);
  if (available.includes(canonical)) return canonical;
  const language = canonical.split("-")[0];
  return available.find((item) => item.split("-")[0] === language) ?? null;
}
function createI18n(options = {}) {
  let state, disposed = false;
  const listeners = /* @__PURE__ */ new Set();
  function nextState(patch) {
    if (!patch || typeof patch !== "object" || Array.isArray(patch) || Object.keys(patch).some(
      (key) => ![
        "locale",
        "fallbackLocale",
        "availableLocales",
        "messages",
        "direction"
      ].includes(key)
    ))
      throw new TypeError("Unknown locale configuration field");
    const raw = patch.availableLocales ?? state?.availableLocales ?? ["en", "ru"];
    if (!Array.isArray(raw) || !raw.length || raw.length > 32)
      throw new TypeError("Enable1\u201332 locales");
    const available = raw.map(tag);
    if (new Set(available).size !== available.length)
      throw new TypeError("Locale IDs must be unique");
    let fallback = patch.fallbackLocale !== void 0 ? tag(patch.fallbackLocale) : state?.fallbackLocale;
    if (patch.fallbackLocale !== void 0 && !available.includes(fallback))
      throw new TypeError("Fallback must be enabled");
    if (!available.includes(fallback))
      fallback = available.includes("en") ? "en" : available[0];
    const requested = patch.locale ?? state?.locale ?? fallback;
    const locale = matchLocale(requested, available) ?? fallback;
    const custom = patch.messages === void 0 ? state?.messages ?? {} : dictionaries(patch.messages);
    const direction = patch.direction ?? state?.direction ?? "auto";
    if (!["auto", "ltr", "rtl"].includes(direction))
      throw new TypeError("direction must be auto/ltr/rtl");
    return Object.freeze({
      locale,
      fallbackLocale: fallback,
      availableLocales: Object.freeze(available),
      messages: custom,
      direction
    });
  }
  state = nextState(options);
  function value(key) {
    const locales = [
      state.locale,
      state.locale.split("-")[0],
      state.fallbackLocale,
      state.fallbackLocale.split("-")[0]
    ];
    for (const locale of locales) {
      if (Object.hasOwn(state.messages[locale] ?? {}, key))
        return state.messages[locale][key];
      if (Object.hasOwn(builtinMessages[locale] ?? {}, key))
        return builtinMessages[locale][key];
    }
    return key;
  }
  function t(key, params = {}) {
    let message = value(key);
    if (typeof message !== "string") {
      if (typeof params.count !== "number" || !Number.isFinite(params.count))
        throw new TypeError("Plural messages need a finite count");
      const form = new Intl.PluralRules(state.locale).select(params.count);
      message = message[form] ?? message.other;
    }
    return message.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (token, name) => {
      if (!Object.hasOwn(params, name)) return token;
      const item = params[name];
      if (typeof item === "number" && Number.isFinite(item))
        return new Intl.NumberFormat(state.locale).format(item);
      if (typeof item === "string" || typeof item === "boolean")
        return String(item);
      throw new TypeError("Message values must be finite scalars");
    });
  }
  function configure(patch = {}) {
    if (disposed) throw new Error("Locale context disposed");
    const next = nextState(patch);
    state = next;
    let firstError;
    for (const listener of [...listeners])
      try {
        listener(api);
      } catch (error) {
        firstError ??= error;
      }
    if (firstError) throw firstError;
    return api.locale;
  }
  const api = {
    t,
    configure,
    get locale() {
      return state.locale;
    },
    get fallbackLocale() {
      return state.fallbackLocale;
    },
    get availableLocales() {
      return [...state.availableLocales];
    },
    get direction() {
      return state.direction !== "auto" ? state.direction : /^(ar|fa|he|ur)(-|$)/.test(state.locale) ? "rtl" : "ltr";
    },
    setLocale(locale) {
      if (!matchLocale(locale, state.availableLocales))
        throw new TypeError("Locale is not enabled");
      return configure({ locale });
    },
    number(value2, options2) {
      return new Intl.NumberFormat(state.locale, options2).format(value2);
    },
    date(value2, options2) {
      return new Intl.DateTimeFormat(state.locale, options2).format(value2);
    },
    list(values, options2) {
      return new Intl.ListFormat(state.locale, options2).format(values);
    },
    subscribe(listener) {
      if (disposed || typeof listener !== "function")
        throw new TypeError("Active locale listener required");
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      disposed = true;
      listeners.clear();
    }
  };
  return Object.freeze(api);
}
function resolveI18n(document2, explicit) {
  if (explicit !== void 0) {
    if (!explicit || typeof explicit.t !== "function" || typeof explicit.subscribe !== "function")
      throw new TypeError("I18n context required");
    return explicit;
  }
  const existing = documents.get(document2);
  if (existing) return existing;
  const locale = document2?.documentElement?.lang || "ru";
  const context = createI18n({ locale, availableLocales: ["en", "ru"] });
  if (document2) documents.set(document2, context);
  return context;
}

// packages/components/i18n-component.js
var selectors = {
  breadcrumbs: [".ag-breadcrumbs"],
  skeleton: [".ag-skeleton__status"],
  "render-window": [".ag-render-window"],
  "resizable-panel": [".ag-panel-resizer"],
  "issue-summary": [".ag-issue-summary summary"],
  "application-shell": [
    ".skip",
    ".title-context",
    ".title-actions button",
    "#sidebar nav",
    "#sidebar [data-view]",
    "#sidebar .ag-nav__label",
    ".footer-label",
    "#connection",
    "#heading",
    "#description",
    "#catalog-tools .ag-field__label",
    "#catalog-tools summary",
    "#catalog-tools option",
    "#search",
    "#sidebar-toggle"
  ],
  "style-lab-shell": [
    ".lab-heading p",
    ".lab-heading h2",
    ".lab-marker",
    ".lab-styles",
    ".lab-status",
    ".lab-footer button .ag-nav__label",
    ".ag-tabs__list",
    ".ag-tabs__tab",
    ".lab-form .ag-field__label",
    ".lab-form .ag-field__hint",
    ".lab-form input",
    ".lab-form .ag-select>label",
    ".lab-form .ag-select option",
    ".lab-form .ag-button .ag-nav__label",
    ".lab-form .ag-status",
    ".lab-form .ag-progress label",
    ".lab-form .ag-progress__description",
    ".lab-table caption",
    ".lab-table th",
    ".lab-table th button"
  ],
  "loading-indicator": [".ag-skeleton__status"],
  "code-viewer": [
    ".ag-code-viewer",
    ".ag-code-viewer__title",
    ".ag-code-viewer__toolbar",
    ".ag-code-viewer__action",
    ".ag-code-viewer__status",
    ".ag-code-viewer .cm-content"
  ],
  "markdown-viewer": [
    ".ag-code-viewer .cm-content",
    ".ag-markdown-viewer__toolbar",
    ".ag-markdown-viewer__toolbar button",
    ".ag-markdown-viewer__status",
    ".ag-markdown-viewer"
  ],
  "markdown-editor": [
    ".ag-code-viewer .cm-content",
    ".ag-markdown-editor__toolbar",
    ".ag-markdown-editor__toolbar button",
    ".ag-markdown-editor__status",
    ".ag-markdown-editor__preview-status",
    ".ag-markdown-editor__file-choice p",
    ".ag-markdown-editor__file-choice button",
    ".ag-code-viewer",
    ".ag-code-viewer__title",
    ".ag-code-viewer__toolbar",
    ".ag-code-viewer__action",
    ".ag-code-viewer__status",
    ".ag-markdown-viewer__toolbar",
    ".ag-markdown-viewer__toolbar button",
    ".ag-markdown-viewer__status",
    ".ag-markdown-viewer"
  ],
  history: [
    ".ag-history",
    ".ag-history__title",
    ".ag-history__search > span",
    ".ag-history__search input",
    ".ag-history__toolbar .ag-select > label",
    ".ag-history__toolbar option[value=all]",
    ".ag-history__legend",
    ".ag-history__details",
    ".ag-history__eyebrow",
    ".ag-history__action",
    ".ag-history__boundary",
    ".ag-history__empty",
    ".ag-history__count"
  ],
  "data-table": [
    ".ag-data-table__pager",
    ".ag-data-table__pager button",
    ".ag-data-table__pager span",
    ".ag-data-table__status",
    ".ag-data-table__empty",
    ".ag-data-table__sort",
    ".ag-data-table input[type=checkbox]"
  ],
  "data-grid": [
    ".ag-data-grid__toolbar",
    ".ag-data-grid__toolbar button",
    ".ag-data-grid__toolbar label",
    ".ag-data-grid__toolbar summary",
    ".ag-data-grid__toolbar option",
    ".ag-data-grid__pager",
    ".ag-data-grid__pager label",
    ".ag-data-grid__pager button",
    ".ag-data-grid__pager span",
    ".ag-data-grid__status",
    ".ag-data-grid__status button",
    ".ag-data-grid__button",
    ".ag-data-grid__viewport"
  ],
  "dropdown-select": [
    ".ag-dropdown-select__toggle",
    ".ag-dropdown-select__input",
    ".ag-dropdown-select__empty"
  ],
  progress: [".ag-progress__value"],
  "window-toolbar": [
    ".ag-window-toolbar",
    ".ag-window-toolbar__navigation button",
    ".ag-window-toolbar__navigation .ag-nav__label",
    ".ag-window-toolbar__actions button"
  ],
  "agent-conversation": [
    ".ag-conversation__viewport",
    ".ag-conversation__empty",
    ".ag-conversation__notice",
    ".ag-conversation__footer button",
    ".ag-conversation__composer label",
    ".ag-conversation__composer textarea",
    ".ag-conversation__composer button",
    ".ag-conversation__actions button",
    ".ag-conversation__muted"
  ],
  "agent-activity-chat": [
    ".ag-agent-chat__control",
    ".ag-agent-chat__control .ag-nav__label",
    ".ag-agent-chat__markers",
    ".ag-agent-chat__empty",
    ".ag-agent-chat__footer span",
    ".ag-agent-chat__log",
    ".ag-agent-chat__options > button"
  ],
  tree: [".ag-tree button[aria-expanded]"],
  "settings-panel": [".ag-settings-panel nav"],
  "inline-help": [".ag-inline-help__trigger"],
  "numeric-badge": [".ag-numeric-badge"],
  "card-connections": [".ag-card-connections__list"],
  "ambient-chart": [
    ".ag-ambient-chart__tag",
    ".ag-ambient-chart__empty",
    ".ag-ambient-chart__controls button",
    ".ag-ambient-chart__controls .ag-nav__label"
  ],
  "board-viewport": [
    ".ag-board__controls",
    ".ag-board__controls button",
    ".ag-board__preferences label",
    ".ag-board__preferences select",
    ".ag-board__preferences option",
    ".ag-board__settings summary",
    ".ag-board__help summary",
    ".ag-board__help-text"
  ]
};
var attributes = ["aria-label", "title", "placeholder"];
var patterns = [];
function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
for (const [key, message] of Object.entries(builtinMessages.ru)) {
  if (typeof message !== "string") continue;
  const names = [];
  let source = "", offset = 0;
  for (const token of message.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)) {
    source += escaped(message.slice(offset, token.index)) + "([\\s\\S]*?)";
    names.push(token[1]);
    offset = token.index + token[0].length;
  }
  source += escaped(message.slice(offset));
  patterns.push({ key, message, names, regex: new RegExp("^" + source + "$") });
}
patterns.sort(
  (a, b) => b.message.replace(/\{[^}]*\}/g, "").length - a.message.replace(/\{[^}]*\}/g, "").length
);
function translateBuiltin(context, source, protectedStrings = /* @__PURE__ */ new Set()) {
  if (source.length > 12e3 || protectedStrings.has(source)) return source;
  for (const pattern of patterns) {
    const match = pattern.regex.exec(source);
    if (!match) continue;
    const params = {};
    for (let i = 0; i < pattern.names.length; i++) {
      const name = pattern.names[i], raw = match[i + 1];
      params[name] = ["count", "total"].includes(name) && /^\d{1,12}$/.test(raw) ? Number(raw) : raw;
      if (name === "name" && pattern.key.startsWith("md.") && !protectedStrings.has(raw))
        params[name] = translateBuiltin(context, raw, protectedStrings);
    }
    return context.t(pattern.key, params);
  }
  return source;
}
function localizeComponent(handle, kind, options = {}) {
  const element = options.localizationRoot ?? handle.element ?? handle.root ?? handle.handle ?? options.element;
  if (!element) return handle;
  const rules = selectors[kind] ?? [];
  if (!rules.length) return handle;
  const doc = element.ownerDocument;
  const ownContext = options.locale !== void 0 && !options.i18n;
  const localeContext = ownContext ? createI18n({ locale: options.locale }) : resolveI18n(doc, options.i18n);
  const originalLanguage = element.getAttribute("lang"), originalDirection = element.getAttribute("dir");
  const protectedStrings = /* @__PURE__ */ new Set();
  let currentOptions = {};
  for (const key of [
    "label",
    "title",
    "placeholder",
    "searchPlaceholder",
    "emptyText",
    "hint",
    "message",
    "description",
    "status",
    "filename",
    "labels",
    "columns",
    "actions",
    "bulkActions"
  ])
    if (options[key] !== void 0) currentOptions[key] = options[key];
  function rememberLabels(patch) {
    currentOptions = { ...currentOptions, ...patch };
    protectedStrings.clear();
    for (const key of [
      "label",
      "title",
      "placeholder",
      "searchPlaceholder",
      "emptyText",
      "hint",
      "message",
      "description",
      "status",
      "filename"
    ])
      if (typeof currentOptions[key] === "string")
        protectedStrings.add(currentOptions[key]);
    for (const value of Object.values(currentOptions.labels ?? {}))
      if (typeof value === "string") protectedStrings.add(value);
    for (const action of [
      ...currentOptions.actions ?? [],
      ...currentOptions.bulkActions ?? []
    ])
      if (typeof action.label === "string") protectedStrings.add(action.label);
    for (const item of currentOptions.columns ?? [])
      if (typeof item.label === "string") protectedStrings.add(item.label);
  }
  rememberLabels({});
  let disposed = false, queued = false, applying = false;
  const original = /* @__PURE__ */ new WeakMap();
  function update(target, field, value, write) {
    let fields = original.get(target);
    if (!fields) {
      fields = /* @__PURE__ */ new Map();
      original.set(target, fields);
    }
    let record = fields.get(field);
    if (!record || record.rendered !== value) {
      record = { source: value, rendered: value };
      fields.set(field, record);
    }
    const next = translateBuiltin(
      localeContext,
      record.source,
      protectedStrings
    );
    record.rendered = next;
    if (next !== value) write(next);
  }
  function refresh() {
    if (disposed || applying) return;
    applying = true;
    try {
      handle.refreshLocaleContent?.(localeContext);
      element.lang = localeContext.locale;
      element.dir = localeContext.direction;
      const targets = /* @__PURE__ */ new Set();
      for (const selector of rules) {
        if (element.matches(selector)) targets.add(element);
        for (const node of element.querySelectorAll(selector))
          targets.add(node);
      }
      for (const node of targets) {
        for (const attr of attributes) {
          const value = node.getAttribute(attr);
          if (value !== null)
            update(node, attr, value, (next) => node.setAttribute(attr, next));
        }
        if (node.matches(".cm-content")) continue;
        for (const child of node.childNodes)
          if (child.nodeType === 3)
            update(child, "text", child.nodeValue, (next) => {
              child.nodeValue = next;
            });
      }
    } finally {
      applying = false;
    }
  }
  const off = localeContext.subscribe(refresh);
  const Observer = doc.defaultView?.MutationObserver;
  const observer = Observer ? new Observer(() => {
    if (disposed || queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      refresh();
    });
  }) : null;
  observer?.observe(element, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: attributes
  });
  const oldDispose = handle.dispose;
  function dispose() {
    if (disposed) return;
    disposed = true;
    off();
    observer?.disconnect();
    if (element.getAttribute("lang") === localeContext.locale) {
      if (originalLanguage === null) element.removeAttribute("lang");
      else element.setAttribute("lang", originalLanguage);
    }
    if (element.getAttribute("dir") === localeContext.direction) {
      if (originalDirection === null) element.removeAttribute("dir");
      else element.setAttribute("dir", originalDirection);
    }
    currentOptions = {};
    protectedStrings.clear();
    if (ownContext) localeContext.dispose();
    oldDispose?.call(handle);
  }
  refresh();
  const result = {};
  for (const key of Reflect.ownKeys(handle)) {
    const descriptor = Object.getOwnPropertyDescriptor(handle, key);
    if (key === "dispose") continue;
    if (typeof descriptor.value === "function") {
      const method = descriptor.value;
      Object.defineProperty(result, key, {
        ...descriptor,
        value(...args) {
          const value = method.apply(handle, args);
          if (["setOptions", "update", "setContext"].includes(key) && args[0] && typeof args[0] === "object" && !Array.isArray(args[0]))
            rememberLabels(args[0]);
          if (key === "setColumns") rememberLabels({ columns: args[0] });
          refresh();
          return value;
        }
      });
    } else Object.defineProperty(result, key, descriptor);
  }
  result.dispose = dispose;
  result.refreshLocale = refresh;
  return result;
}

// packages/components/geometry.js
function resolveCornerRadius({
  shape = "fixed",
  radius = 7,
  parentRadius,
  inset = 0,
  fallbackRadius = 7,
  width,
  height
} = {}) {
  if (!["fixed", "capsule", "concentric"].includes(shape))
    throw new TypeError("Unknown shape family");
  for (const value of [
    radius,
    parentRadius,
    inset,
    fallbackRadius,
    width,
    height
  ]) {
    if (value !== void 0 && (!Number.isFinite(value) || value < 0))
      throw new TypeError("Corner geometry must use finite nonnegative CSS px");
  }
  if (shape === "capsule" && (width === void 0 || height === void 0))
    throw new TypeError("Capsule geometry needs width and height");
  let resolved = radius;
  if (shape === "capsule") resolved = Math.min(width, height) / 2;
  if (shape === "concentric") {
    resolved = parentRadius === void 0 ? fallbackRadius : Math.max(0, parentRadius - inset);
  }
  if (width !== void 0) resolved = Math.min(resolved, width / 2);
  if (height !== void 0) resolved = Math.min(resolved, height / 2);
  return resolved;
}
function applyControlGeometry(element, { density = "compact", shape, ...geometry } = {}) {
  const heights = { compact: 32, comfortable: 40, touch: 44 };
  if (!Object.hasOwn(heights, density))
    throw new TypeError("Unknown control density");
  const resolved = resolveCornerRadius({
    shape: shape ?? "fixed",
    ...shape === "capsule" ? { width: 1, height: 1 } : {},
    ...geometry
  });
  const radius = shape === "capsule" ? "9999px" : `${resolved}px`;
  const previous = {
    height: element.style.minHeight,
    radius: element.style.borderRadius,
    density: element.getAttribute("data-ag-density"),
    shape: element.getAttribute("data-ag-shape")
  };
  element.style.minHeight = `max(var(--ag-control-height, 32px), ${heights[density]}px)`;
  if (shape !== void 0) element.style.borderRadius = radius;
  element.setAttribute("data-ag-density", density);
  element.setAttribute("data-ag-shape", shape ?? "inherited");
  return () => {
    element.style.minHeight = previous.height;
    element.style.borderRadius = previous.radius;
    for (const key of ["density", "shape"]) {
      if (previous[key] === null) element.removeAttribute(`data-ag-${key}`);
      else element.setAttribute(`data-ag-${key}`, previous[key]);
    }
  };
}

// packages/components/field-counter.js
var resets = /* @__PURE__ */ new WeakMap();
function validateMaxLength(maxLength) {
  if (maxLength !== void 0 && (!Number.isInteger(maxLength) || maxLength < 0 || maxLength > 2147483647))
    throw new TypeError("maxLength must be a native nonnegative32-bit integer");
}
function registerReset(control, sync) {
  const document2 = control.ownerDocument;
  let state = resets.get(document2);
  if (!state) {
    const fields = /* @__PURE__ */ new WeakMap();
    const listener = (event) => {
      const controls = Array.from(event.target.elements ?? []);
      queueMicrotask(() => {
        for (const field of controls) fields.get(field)?.();
      });
    };
    state = { fields, listener, count: 0 };
    document2.addEventListener("reset", listener, true);
    resets.set(document2, state);
  }
  state.count++;
  state.fields.set(control, sync);
  return () => {
    state.fields.delete(control);
    if (--state.count === 0) {
      document2.removeEventListener("reset", state.listener, true);
      resets.delete(document2);
    }
  };
}
function attachFieldCounter(element, control, { i18n } = {}) {
  let disposed = false;
  let timer;
  let offLocale = () => {
  };
  let offReset = () => {
  };
  let counter, announcement, context;
  function describe(enabled) {
    const references = (control.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
    const retained = references.filter((id) => id !== counter.id);
    if (enabled) retained.push(counter.id);
    if (retained.length)
      control.setAttribute("aria-describedby", retained.join(" "));
    else control.removeAttribute("aria-describedby");
  }
  function sync() {
    if (disposed || !counter) return;
    announcement.textContent = "";
    const max = control.maxLength;
    counter.hidden = max < 0;
    describe(max >= 0);
    if (max < 0) {
      counter.textContent = "";
      announcement.textContent = "";
      return;
    }
    counter.lang = context.locale;
    announcement.lang = context.locale;
    const remaining = max - control.value.length;
    const key = remaining < 0 ? "field.characters.over" : "field.characters.remaining";
    counter.textContent = context.t(key, {
      remaining: Math.abs(remaining),
      max
    });
    counter.dataset.state = remaining < 0 ? "over" : remaining === 0 ? "limit" : "available";
  }
  function edited(event) {
    sync();
    clearTimeout(timer);
    if (!event.isComposing && !control.disabled)
      timer = setTimeout(() => {
        if (!disposed && control.isConnected)
          announcement.textContent = counter.hidden ? "" : counter.textContent;
      }, 700);
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    clearTimeout(timer);
    control.removeEventListener("input", edited);
    control.removeEventListener("compositionend", edited);
    control.removeEventListener("change", sync);
    control.removeEventListener("focus", sync);
    offLocale();
    offReset();
  }
  if (control.hasAttribute("maxlength")) {
    context = resolveI18n(control.ownerDocument, i18n);
    const document2 = control.ownerDocument;
    const footer = document2.createElement("span");
    footer.className = "ag-field__feedback";
    const messages = document2.createElement("span");
    messages.className = "ag-field__messages";
    for (const message of element.querySelectorAll(
      ".ag-field__hint,.ag-field__error"
    ))
      messages.append(message);
    counter = document2.createElement("span");
    counter.className = "ag-field__counter";
    counter.id = `${control.id}-count`;
    announcement = document2.createElement("span");
    announcement.className = "ag-text-feedback__sr";
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    footer.append(messages, counter);
    element.append(footer, announcement);
    sync();
    control.addEventListener("input", edited);
    control.addEventListener("compositionend", edited);
    control.addEventListener("change", sync);
    control.addEventListener("focus", sync);
    offLocale = context.subscribe(sync);
    offReset = registerReset(control, sync);
  }
  Object.assign(element, { sync, dispose });
  return element;
}

// packages/components/button-icons.js
var paths = Object.freeze({
  search: "M17 17l4 4M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z",
  "wrap-text": "M3 6h18M3 12h15a3 3 0 0 1 0 6h-4m2-2-2 2 2 2M3 18h4",
  "list-ordered": "M9 6h12M9 12h12M9 18h12M3 4h1v4M3 10h2v2H3v2h2M3 16h2v4H3m2-2H3",
  copy: "M9 5V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-1M5 8h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z",
  close: "M6 6l12 12M18 6 6 18",
  minimize: "M5 12h14",
  expand: "M6 18 18 6M8 6h10v10",
  restore: "M18 6 6 18M6 8v10h10",
  "arrow-up": "M12 19V5m-6 6 6-6 6 6",
  "arrow-down": "M12 5v14m-6-6 6 6 6-6",
  dot: "M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  back: "M19 12H5m6-6-6 6 6 6",
  forward: "M5 12h14m-6-6 6 6-6 6",
  "panel-left": "M9 4v16M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z",
  "panel-right": "M15 4v16M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z",
  refresh: "M20 5v5h-5m5 0a8 8 0 1 0 0 5",
  plus: "M12 5v14M5 12h14"
});
var aliases = Object.freeze({
  "\xD7": "close",
  "\u2212": "minimize",
  "\u2197": "expand",
  "\u2199": "restore",
  "\u2191": "arrow-up",
  "\u2193": "arrow-down",
  "\u25CF": "dot"
});
function createButtonIcon(document2, name) {
  const key = Object.hasOwn(aliases, name) ? aliases[name] : name;
  if (!Object.hasOwn(paths, key)) return null;
  const svg = document2.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("fill", key === "dot" ? "currentColor" : "none");
  svg.setAttribute("stroke", key === "dot" ? "none" : "currentColor");
  svg.setAttribute("stroke-width", "1.75");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const path = document2.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", paths[key]);
  svg.append(path);
  return svg;
}

// packages/components/primitives.js
var variants = /* @__PURE__ */ new Set(["primary", "secondary", "quiet", "danger"]);
var tones = /* @__PURE__ */ new Set(["neutral", "accent", "success", "danger"]);
function createButton({
  document: document2 = globalThis.document,
  label,
  variant = "secondary",
  icon,
  iconOnly = false,
  disabled = false,
  onClick,
  density = "compact",
  shape,
  parentRadius,
  inset = 0
} = {}) {
  if (typeof label !== "string" || !label.trim())
    throw new TypeError("Button label is required");
  if (!variants.has(variant)) throw new TypeError("Unknown button variant");
  const button = document2.createElement("button");
  button.type = "button";
  button.className = `ag-button ag-button--${variant}`;
  button.disabled = disabled;
  applyControlGeometry(button, { density, shape, parentRadius, inset });
  if (icon) {
    const symbol = document2.createElement("span");
    symbol.className = "ag-button__icon";
    const graphic = createButtonIcon(document2, icon);
    if (graphic) symbol.append(graphic);
    else symbol.textContent = icon;
    symbol.setAttribute("aria-hidden", "true");
    button.append(symbol);
  }
  if (iconOnly) {
    button.setAttribute("aria-label", label);
    button.title = label;
  }
  if (iconOnly && icon) {
    button.classList.add("ag-icon-button");
    button.style.minWidth = button.style.minHeight;
  } else {
    const text3 = document2.createElement("span");
    text3.className = "ag-nav__label";
    text3.textContent = label;
    button.append(text3);
  }
  if (onClick) button.addEventListener("click", onClick);
  return button;
}
function createField({
  document: document2 = globalThis.document,
  id,
  label,
  placeholder = "",
  hint = "",
  type = "text",
  value = "",
  maxLength,
  disabled = false,
  i18n,
  density = "compact",
  readOnly = false,
  required = false,
  error = ""
} = {}) {
  if (!id || !label) throw new TypeError("Field id and label are required");
  validateMaxLength(maxLength);
  if (typeof value !== "string")
    throw new TypeError("Field value must be literal text");
  if (maxLength !== void 0 && !["text", "search", "url", "tel", "email", "password"].includes(type))
    throw new TypeError("maxLength requires a native text input type");
  const wrapper = document2.createElement("label");
  wrapper.className = "ag-field";
  wrapper.htmlFor = id;
  const caption = document2.createElement("span");
  caption.className = "ag-field__label";
  caption.textContent = label;
  caption.id = `${id}-label`;
  const input = document2.createElement("input");
  input.id = id;
  input.name = id;
  input.type = type;
  input.placeholder = placeholder;
  input.value = value;
  input.defaultValue = value;
  input.disabled = disabled;
  if (maxLength !== void 0) input.maxLength = maxLength;
  input.readOnly = readOnly;
  input.required = required;
  input.setAttribute("aria-labelledby", caption.id);
  applyControlGeometry(input, { density });
  wrapper.append(caption, input);
  if (hint) {
    const help = document2.createElement("span");
    help.className = "ag-field__hint";
    help.id = `${id}-hint`;
    help.textContent = hint;
    input.setAttribute("aria-describedby", help.id);
    wrapper.append(help);
  }
  if (error) {
    const message = document2.createElement("span");
    message.id = `${id}-error`;
    message.className = "ag-field__error";
    message.textContent = error;
    input.setAttribute("aria-invalid", "true");
    input.setAttribute(
      "aria-describedby",
      [input.getAttribute("aria-describedby"), message.id].filter(Boolean).join(" ")
    );
    wrapper.append(message);
  }
  return attachFieldCounter(wrapper, input, { i18n });
}
function createStatus({
  document: document2 = globalThis.document,
  label,
  tone = "neutral"
} = {}) {
  if (!tones.has(tone)) throw new TypeError("Unknown status tone");
  const status = document2.createElement("span");
  status.className = "ag-status";
  status.dataset.tone = tone;
  status.textContent = label;
  return status;
}

// packages/components/card-connections.js
function connectionControls(from, to, { axis = "horizontal", offset = { x: 0, y: 0 } } = {}) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const first = { x: from.x + dx / 3, y: from.y + dy / 3 };
  const second = { x: from.x + 2 * dx / 3, y: from.y + 2 * dy / 3 };
  if (axis === "horizontal") {
    first.y = from.y;
    second.y = to.y;
  } else if (axis === "vertical") {
    first.x = from.x;
    second.x = to.x;
  }
  for (const point of [first, second]) {
    point.x += offset.x;
    point.y += offset.y;
  }
  return [first, second];
}
function connectionCurve(from, to, options) {
  const [first, second] = connectionControls(from, to, options);
  return `M ${from.x} ${from.y} C ${first.x} ${first.y} ${second.x} ${second.y} ${to.x} ${to.y}`;
}

// packages/components/progress.js
var sequence = 0;
function createProgress({
  document: document2 = globalThis.document,
  label,
  value = null,
  max = 100,
  description = ""
} = {}) {
  if (typeof label !== "string" || !label.trim())
    throw new TypeError("A progress label is required");
  const element = document2.createElement("div"), caption = document2.createElement("label"), progress = document2.createElement("progress"), status = document2.createElement("span"), detail = document2.createElement("p");
  element.className = "ag-progress";
  let id;
  do {
    id = `ag-progress-${++sequence}`;
  } while (document2.getElementById(id));
  progress.id = id;
  caption.htmlFor = id;
  caption.textContent = label.length > 180 ? label.slice(0, 179) + "\u2026" : label;
  status.className = "ag-progress__value";
  status.setAttribute("aria-hidden", "true");
  detail.className = "ag-progress__description";
  detail.id = id + "-description";
  progress.setAttribute("aria-describedby", detail.id);
  const heading = document2.createElement("div");
  heading.className = "ag-progress__heading";
  heading.append(caption, status);
  element.append(heading, progress, detail);
  let currentValue = null, currentMax = 100, disposed = false;
  function update({
    value: nextValue = currentValue,
    max: nextMax = currentMax,
    description: nextDescription = detail.textContent
  } = {}) {
    if (disposed) return;
    if (!Number.isFinite(nextMax) || nextMax <= 0 || nextMax > Number.MAX_SAFE_INTEGER || nextValue !== null && (!Number.isFinite(nextValue) || nextValue < 0 || nextValue > nextMax) || typeof nextDescription !== "string")
      throw new TypeError(
        "Use finite measured progress within a positive maximum, or null for unknown"
      );
    currentValue = nextValue;
    currentMax = nextMax;
    progress.max = nextMax;
    if (nextValue === null) {
      progress.removeAttribute("value");
      status.textContent = "\u0412\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F\u2026";
    } else {
      progress.value = nextValue;
      const percent = nextValue === nextMax ? 100 : Math.min(99, Math.floor(nextValue / nextMax * 100));
      status.textContent = `${percent}%`;
    }
    detail.textContent = nextDescription.length > 600 ? nextDescription.slice(0, 599) + "\u2026" : nextDescription;
    detail.hidden = !detail.textContent;
    if (detail.hidden) progress.removeAttribute("aria-describedby");
    else progress.setAttribute("aria-describedby", detail.id);
  }
  function dispose() {
    disposed = true;
  }
  update({ value, max, description });
  return { element, progress, update, dispose };
}

// packages/components/progress-localized.js
function createProgress2(options = {}) {
  return localizeComponent(createProgress(options), "progress", options);
}

// packages/components/select.js
var sequence2 = 0;
function createSelect({
  document: document2 = globalThis.document,
  label,
  options,
  value,
  placeholder,
  hint = "",
  error = "",
  disabled = false,
  required = false,
  density = "compact",
  onChange
} = {}) {
  const text3 = (item, maximum) => typeof item === "string" && item.length <= maximum;
  if (!text3(label, 180) || !label.trim() || !Array.isArray(options) || options.length > 500 || !text3(hint, 2048) || !text3(error, 2048) || placeholder !== void 0 && !text3(placeholder, 180) || typeof disabled !== "boolean" || typeof required !== "boolean" || onChange !== void 0 && typeof onChange !== "function")
    throw new TypeError("A labelled bounded native select is required");
  const known = /* @__PURE__ */ new Map();
  for (const item of options) {
    if (!item || !text3(item.value, 80) || !item.value || known.has(item.value) || !text3(item.label, 180) || !item.label.trim() || item.disabled !== void 0 && typeof item.disabled !== "boolean" || item.group !== void 0 && (!text3(item.group, 180) || !item.group.trim()))
      throw new TypeError("Options need distinct values and literal labels");
    known.set(item.value, { ...item });
  }
  let current = value === void 0 ? placeholder !== void 0 ? "" : options.find((item) => !item.disabled)?.value ?? "" : value;
  function valid(next) {
    return typeof next === "string" && (next === "" && placeholder !== void 0 || known.has(next) && !known.get(next).disabled);
  }
  if (!valid(current))
    throw new TypeError(
      "Select an enabled known option or explicit placeholder"
    );
  const element = document2.createElement("div"), title = document2.createElement("label"), select = document2.createElement("select"), hintElement = document2.createElement("span"), errorElement = document2.createElement("span");
  element.className = "ag-select";
  select.className = "ag-select__control";
  select.id = `ag-select-${++sequence2}`;
  title.htmlFor = select.id;
  title.textContent = label;
  hintElement.id = `${select.id}-hint`;
  hintElement.className = "ag-select__hint";
  hintElement.textContent = hint;
  errorElement.id = `${select.id}-error`;
  errorElement.className = "ag-select__error";
  errorElement.setAttribute("aria-live", "polite");
  if (placeholder !== void 0) {
    const option = document2.createElement("option");
    option.value = "";
    option.textContent = placeholder;
    select.append(option);
  }
  let group = null, groupName = null;
  for (const item of options) {
    if (item.group !== groupName) {
      groupName = item.group;
      group = item.group ? document2.createElement("optgroup") : null;
      if (group) {
        group.label = item.group;
        select.append(group);
      }
    }
    const option = document2.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    option.disabled = !!item.disabled;
    (group || select).append(option);
  }
  for (const option of select.options)
    option.defaultSelected = option.value === current;
  select.value = current;
  select.disabled = disabled;
  select.required = required;
  const restoreGeometry = applyControlGeometry(select, { density });
  let disposed = false;
  function setError(next) {
    if (disposed) return;
    if (!text3(next, 2048))
      throw new TypeError("Error must be bounded literal text");
    errorElement.textContent = next;
    errorElement.hidden = !next;
    hintElement.hidden = !hint;
    select.setAttribute("aria-invalid", String(!!next));
    const references = [];
    if (hint) references.push(hintElement.id);
    if (next) references.push(errorElement.id);
    if (references.length)
      select.setAttribute("aria-describedby", references.join(" "));
    else select.removeAttribute("aria-describedby");
  }
  function setValue(next) {
    if (disposed) return;
    if (!valid(next)) throw new TypeError("Select an enabled known value");
    current = next;
    select.value = next;
  }
  function changed() {
    if (disposed) return;
    if (select.disabled) {
      select.value = current;
      return;
    }
    const next = select.value;
    if (!valid(next)) {
      select.value = current;
      return;
    }
    if (next === current) return;
    current = next;
    onChange?.(next);
  }
  function reset(event) {
    if (event.target !== select.form) return;
    Promise.resolve().then(() => {
      if (!disposed && !event.defaultPrevented) current = select.value;
    });
  }
  select.addEventListener("change", changed);
  document2.addEventListener("reset", reset, true);
  setError(error);
  element.append(title, select, hintElement, errorElement);
  return {
    element,
    select,
    setValue,
    setError,
    setDisabled(next) {
      if (typeof next !== "boolean")
        throw new TypeError("disabled must be boolean");
      if (!disposed) select.disabled = next;
    },
    get value() {
      return select.value;
    },
    dispose() {
      if (!disposed) {
        disposed = true;
        select.removeEventListener("change", changed);
        document2.removeEventListener("reset", reset, true);
        onChange = void 0;
        restoreGeometry();
      }
    }
  };
}

// packages/components/tabs.js
var sequence3 = 0;
var policies = /* @__PURE__ */ new Set(["preserve", "destroy", "offscreen"]);
function createTabs({
  document: document2 = globalThis.document,
  label,
  tabs,
  value,
  orientation = "horizontal",
  activation = "manual",
  onChange
} = {}) {
  if (typeof label !== "string" || !label.trim() || label.length > 180 || !Array.isArray(tabs) || tabs.length < 1 || tabs.length > 40 || !["horizontal", "vertical"].includes(orientation) || !["manual", "automatic"].includes(activation) || onChange !== void 0 && typeof onChange !== "function")
    throw new TypeError("A labelled bounded tabs contract is required");
  const records2 = /* @__PURE__ */ new Map();
  for (const tab of tabs) {
    if (!tab || typeof tab.id !== "string" || !/^[A-Za-z0-9_.:-]{1,80}$/.test(tab.id) || records2.has(tab.id) || typeof tab.label !== "string" || !tab.label.trim() || tab.label.length > 180 || tab.disabled !== void 0 && typeof tab.disabled !== "boolean" || typeof tab.mount !== "function" || !policies.has(tab.lifecycle ?? "preserve"))
      throw new TypeError(
        "Tabs need distinct IDs, labels, lifecycle and mount functions"
      );
    records2.set(tab.id, {
      ...tab,
      lifecycle: tab.lifecycle ?? "preserve",
      mounted: null
    });
  }
  let current = value === void 0 ? tabs.find((tab) => !tab.disabled)?.id : value, disposed = false;
  if (!records2.has(current) || records2.get(current).disabled)
    throw new TypeError("Choose an enabled initial tab");
  const element = document2.createElement("section"), tablist = document2.createElement("div"), panels = document2.createElement("div");
  element.className = "ag-tabs";
  element.dataset.orientation = orientation;
  tablist.className = "ag-tabs__list";
  tablist.setAttribute("role", "tablist");
  tablist.setAttribute("aria-label", label);
  tablist.setAttribute("aria-orientation", orientation);
  panels.className = "ag-tabs__panels";
  const prefix = `ag-tabs-${++sequence3}`;
  for (const [id, record] of records2) {
    const button = document2.createElement("button"), panel = document2.createElement("section");
    button.type = "button";
    button.id = `${prefix}-tab-${id}`;
    button.className = "ag-tabs__tab";
    button.textContent = record.label;
    button.dataset.tabId = id;
    button.disabled = !!record.disabled;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", `${prefix}-panel-${id}`);
    panel.id = `${prefix}-panel-${id}`;
    panel.className = "ag-tabs__panel";
    panel.tabIndex = 0;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", button.id);
    record.button = button;
    record.panel = panel;
    tablist.append(button);
    panels.append(panel);
  }
  element.append(tablist, panels);
  function ensureMounted(record) {
    if (record.mounted) return;
    const result = record.mount();
    const node = result?.nodeType === 1 ? result : result?.element;
    if (!node || node.nodeType !== 1 || node.ownerDocument !== document2 || node.parentNode || result?.dispose !== void 0 && typeof result.dispose !== "function")
      throw new TypeError(
        "Tab mount must return one unparented same-document element"
      );
    record.mounted = {
      element: node,
      dispose: result?.nodeType === 1 ? null : result.dispose
    };
    record.panel.append(node);
  }
  function synchronize() {
    for (const [id, record] of records2) {
      const active = id === current;
      record.button.tabIndex = active ? 0 : -1;
      record.button.setAttribute("aria-selected", String(active));
      record.panel.classList.toggle(
        "ag-tabs__panel--offscreen",
        !active && record.lifecycle === "offscreen"
      );
      record.panel.hidden = !active && record.lifecycle !== "offscreen";
      record.panel.setAttribute("aria-hidden", String(!active));
      record.panel.inert = !active;
      if (active) record.panel.removeAttribute("inert");
      else record.panel.setAttribute("inert", "");
      record.panel.tabIndex = active ? 0 : -1;
    }
  }
  function setValue(next, { focus = false, emit = false } = {}) {
    if (disposed) return;
    const record = records2.get(next);
    if (!record || record.disabled || typeof focus !== "boolean" || typeof emit !== "boolean")
      throw new TypeError("Choose an enabled known tab");
    if (next !== current) {
      ensureMounted(record);
      const previous = records2.get(current);
      const moveFocus = focus || previous.panel.contains(document2.activeElement);
      current = next;
      synchronize();
      if (previous.lifecycle === "destroy" && previous.mounted) {
        const old = previous.mounted;
        previous.mounted = null;
        previous.panel.replaceChildren();
        old.dispose?.();
      }
      if (moveFocus) record.button.focus();
      if (emit) onChange?.(next);
    } else if (focus) record.button.focus();
  }
  function clicked(event) {
    const button = event.target.closest?.("[data-tab-id]");
    if (button && tablist.contains(button))
      setValue(button.dataset.tabId, { emit: true });
  }
  function keydown(event) {
    const button = event.target.closest?.("[data-tab-id]");
    if (!button || !tablist.contains(button) || event.altKey || event.ctrlKey || event.metaKey)
      return;
    const enabled = [...records2.values()].filter((record) => !record.disabled), index = enabled.findIndex((record) => record.button === button);
    const direction = document2.defaultView.getComputedStyle(tablist).direction;
    const rtl = direction === "rtl" || direction !== "ltr" && tablist.closest("[dir]")?.dir === "rtl";
    let offset = 0, target;
    if (orientation === "horizontal") {
      if (event.key === "ArrowRight") offset = rtl ? -1 : 1;
      if (event.key === "ArrowLeft") offset = rtl ? 1 : -1;
    } else {
      if (event.key === "ArrowDown") offset = 1;
      if (event.key === "ArrowUp") offset = -1;
    }
    if (offset)
      target = enabled[(index + offset + enabled.length) % enabled.length];
    if (event.key === "Home") target = enabled[0];
    if (event.key === "End") target = enabled.at(-1);
    if (target) {
      event.preventDefault();
      event.stopPropagation();
      target.button.focus();
      if (activation === "automatic") setValue(target.id, { emit: true });
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      setValue(button.dataset.tabId, { emit: true });
    }
  }
  ensureMounted(records2.get(current));
  synchronize();
  tablist.addEventListener("click", clicked);
  tablist.addEventListener("keydown", keydown);
  return {
    element,
    tablist,
    setValue,
    get value() {
      return current;
    },
    getPanel(id) {
      return records2.get(id)?.panel ?? null;
    },
    /** Disabling the current tab selects another enabled panel, without emitting a user action. */
    setDisabled(id, disabled) {
      if (disposed) return;
      const record = records2.get(id);
      if (!record || typeof disabled !== "boolean")
        throw new TypeError("Known tab and boolean disabled required");
      if (disabled && id === current) {
        const next = [...records2.values()].find(
          (other) => other.id !== id && !other.disabled
        );
        if (!next) throw new TypeError("At least one enabled tab must remain");
        const moveFocus = record.button === document2.activeElement || record.panel.contains(document2.activeElement);
        setValue(next.id, { focus: moveFocus });
      }
      record.disabled = disabled;
      record.button.disabled = disabled;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      tablist.removeEventListener("click", clicked);
      tablist.removeEventListener("keydown", keydown);
      const errors = [];
      for (const record of records2.values()) {
        const mounted = record.mounted;
        record.mounted = null;
        record.panel.replaceChildren();
        try {
          mounted?.dispose?.();
        } catch (error) {
          errors.push(error);
        }
      }
      records2.clear();
      onChange = void 0;
      if (errors.length)
        throw new AggregateError(
          errors,
          "Tab content cleanup failed after all panels were released"
        );
    }
  };
}

// packages/components/data-table.js
var sequence4 = 0;
var ROW_LIMIT = 1e3;
var COLUMN_LIMIT = 32;
var identifier = (value) => typeof value === "string" && /^[A-Za-z0-9_.:-]{1,80}$/.test(value);
function text(value, maximum = 180) {
  if (typeof value !== "string" || !value.trim() || value.length > maximum)
    throw new TypeError("Bounded non-empty text required");
  return value;
}
function rowsValue(rows, columns) {
  if (!Array.isArray(rows) || rows.length > ROW_LIMIT)
    throw new TypeError("At most 1000 rows are supported");
  const ids = /* @__PURE__ */ new Set(), result = [];
  for (const row of rows) {
    if (!row || !identifier(row.id) || ids.has(row.id) || typeof row.cells !== "object" || !row.cells || Array.isArray(row.cells) || row.disabled !== void 0 && typeof row.disabled !== "boolean" || row.label !== void 0 && (typeof row.label !== "string" || !row.label.trim() || row.label.length > 180))
      throw new TypeError("Rows require unique IDs and scalar cells");
    ids.add(row.id);
    const cells = {};
    for (const column of columns) {
      const value = row.cells[column.id] ?? null;
      if (!(value === null || typeof value === "boolean" || typeof value === "string" && value.length <= 4096 || typeof value === "number" && Number.isFinite(value)))
        throw new TypeError("Cells must be finite scalar values");
      cells[column.id] = value;
    }
    result.push({
      id: row.id,
      cells,
      label: row.label,
      disabled: row.disabled === true
    });
  }
  return result;
}
function createDataTable({
  document: document2 = globalThis.document,
  caption,
  columns,
  rows = [],
  sort = null,
  selectedIds = [],
  selectable = false,
  status = "ready",
  message = "",
  page = null,
  onSort,
  onSelectionChange,
  onPageChange
} = {}) {
  text(caption);
  if (!Array.isArray(columns) || !columns.length || columns.length > COLUMN_LIMIT || typeof selectable !== "boolean")
    throw new TypeError("A table requires 1\u201332 columns and boolean selection");
  for (const callback of [onSort, onSelectionChange, onPageChange])
    if (callback !== void 0 && typeof callback !== "function")
      throw new TypeError("Callbacks must be functions");
  const columnIds = /* @__PURE__ */ new Set();
  const definitions = columns.map((column) => {
    if (!column || !identifier(column.id) || columnIds.has(column.id) || column.sortable !== void 0 && typeof column.sortable !== "boolean" || column.render !== void 0 && typeof column.render !== "function")
      throw new TypeError("Columns require unique IDs and optional callbacks");
    columnIds.add(column.id);
    text(column.label);
    if (column.align !== void 0 && !["start", "center", "end"].includes(column.align))
      throw new TypeError("Unsupported cell alignment");
    return { ...column };
  });
  const abort = new document2.defaultView.AbortController(), listeners = { signal: abort.signal };
  const element = document2.createElement("section"), scroll = document2.createElement("div"), table = document2.createElement("table");
  element.className = "ag-data-table";
  scroll.className = "ag-data-table__scroll";
  scroll.tabIndex = 0;
  scroll.setAttribute("role", "region");
  const captionNode = document2.createElement("caption");
  captionNode.id = `ag-data-table-${++sequence4}`;
  captionNode.textContent = caption;
  scroll.setAttribute("aria-labelledby", captionNode.id);
  const head = document2.createElement("thead"), headerRow = document2.createElement("tr"), body = document2.createElement("tbody");
  const headers = /* @__PURE__ */ new Map(), headerButtons = /* @__PURE__ */ new Map(), sortMarks = /* @__PURE__ */ new Map();
  const announcement = document2.createElement("p");
  announcement.className = "ag-data-table__status";
  announcement.setAttribute("role", "status");
  const pager = document2.createElement("nav");
  pager.className = "ag-data-table__pager";
  pager.setAttribute("aria-label", "\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u0442\u0430\u0431\u043B\u0438\u0446\u044B");
  const previous = document2.createElement("button"), next = document2.createElement("button"), pageText = document2.createElement("span");
  for (const button of [previous, next]) {
    button.type = "button";
    button.className = "ag-button ag-button--quiet";
  }
  previous.textContent = "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F";
  next.textContent = "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F";
  pager.append(previous, pageText, next);
  let currentRows = rowsValue(rows, definitions), currentSort = null, selected = /* @__PURE__ */ new Set(), currentStatus = "ready", currentMessage = "", currentPage = null, disposed = false;
  let bodyRows = /* @__PURE__ */ new Map(), rowBoxes = /* @__PURE__ */ new Map();
  let allBox = null;
  if (selectable) {
    const th = document2.createElement("th");
    th.scope = "col";
    allBox = document2.createElement("input");
    allBox.type = "checkbox";
    allBox.setAttribute("aria-label", "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0432\u0441\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u0441\u0442\u0440\u043E\u043A\u0438 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B");
    const target = document2.createElement("label");
    target.className = "ag-data-table__selection-target";
    target.append(allBox);
    th.append(target);
    headerRow.append(th);
  }
  for (const column of definitions) {
    const th = document2.createElement("th");
    th.scope = "col";
    th.dataset.columnId = column.id;
    th.style.textAlign = column.align || "start";
    headers.set(column.id, th);
    if (column.sortable) {
      const button = document2.createElement("button"), label = document2.createElement("span"), mark = document2.createElement("span");
      button.type = "button";
      button.className = "ag-data-table__sort";
      button.disabled = !onSort;
      button.setAttribute("aria-label", `\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C: ${column.label}`);
      label.textContent = column.label;
      mark.setAttribute("aria-hidden", "true");
      button.append(label, mark);
      th.append(button);
      sortMarks.set(column.id, mark);
      headerButtons.set(column.id, button);
      button.addEventListener(
        "click",
        () => {
          if (disposed || button.disabled) return;
          const direction = currentSort?.columnId !== column.id ? "ascending" : currentSort.direction === "ascending" ? "descending" : null;
          onSort?.(direction ? { columnId: column.id, direction } : null);
        },
        listeners
      );
    } else th.textContent = column.label;
    headerRow.append(th);
  }
  head.append(headerRow);
  table.append(captionNode, head, body);
  scroll.append(table);
  element.append(scroll, announcement, pager);
  function selectionValue(ids, candidateRows = currentRows) {
    if (!Array.isArray(ids) || ids.length > ROW_LIMIT)
      throw new TypeError("Selection must be a bounded ID list");
    const eligible = new Set(
      candidateRows.filter((row) => !row.disabled).map((row) => row.id)
    ), result = /* @__PURE__ */ new Set();
    for (const id of ids) {
      if (!selectable || !eligible.has(id) || result.has(id))
        throw new TypeError("Select distinct enabled rows on this page");
      result.add(id);
    }
    return result;
  }
  function updateSelection() {
    for (const [id, checkbox] of rowBoxes) checkbox.checked = selected.has(id);
    if (allBox) {
      const enabled = currentRows.filter((row) => !row.disabled), count = enabled.filter((row) => selected.has(row.id)).length;
      allBox.checked = enabled.length > 0 && count === enabled.length;
      allBox.indeterminate = count > 0 && count < enabled.length;
      allBox.disabled = enabled.length === 0 || currentStatus !== "ready";
    }
  }
  function cellContent(cell, value) {
    if (value?.nodeType === 1) {
      if (value.ownerDocument !== document2 || value.parentNode)
        throw new TypeError(
          "Cell renderers must return a detached local element"
        );
      cell.append(value);
    } else {
      if (!(value == null || typeof value === "boolean" || typeof value === "string" && value.length <= 4096 || typeof value === "number" && Number.isFinite(value)))
        throw new TypeError(
          "Cell renderers return a scalar or detached local element"
        );
      cell.textContent = value == null ? "\u2014" : String(value);
    }
  }
  function buildBody(candidateRows, candidateStatus) {
    const fragment = document2.createDocumentFragment(), rowsMap = /* @__PURE__ */ new Map(), boxes = /* @__PURE__ */ new Map();
    if (candidateStatus !== "ready" || !candidateRows.length) {
      const row = document2.createElement("tr"), cell = document2.createElement("td");
      cell.colSpan = definitions.length + Number(selectable);
      cell.className = "ag-data-table__empty";
      cell.textContent = candidateStatus === "loading" ? "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0434\u0430\u043D\u043D\u044B\u0445\u2026" : candidateStatus === "error" ? "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435" : "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445";
      row.append(cell);
      fragment.append(row);
    } else
      for (const row of candidateRows) {
        const tr = document2.createElement("tr");
        tr.dataset.rowId = row.id;
        if (selectable) {
          const td = document2.createElement("td"), checkbox = document2.createElement("input");
          checkbox.type = "checkbox";
          checkbox.disabled = row.disabled;
          const firstValue = row.cells[definitions[0].id], rowLabel = row.label || (typeof firstValue === "string" && firstValue.trim() ? firstValue.slice(0, 180) : row.id);
          checkbox.setAttribute("aria-label", `\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0441\u0442\u0440\u043E\u043A\u0443: ${rowLabel}`);
          checkbox.dataset.rowSelect = row.id;
          boxes.set(row.id, checkbox);
          const target = document2.createElement("label");
          target.className = "ag-data-table__selection-target";
          target.append(checkbox);
          td.append(target);
          tr.append(td);
        }
        for (const column of definitions) {
          const td = document2.createElement("td");
          td.dataset.columnId = column.id;
          td.dataset.align = column.align || "start";
          td.style.textAlign = column.align || "start";
          cellContent(
            td,
            column.render ? column.render(row) : row.cells[column.id]
          );
          tr.append(td);
        }
        rowsMap.set(row.id, tr);
        fragment.append(tr);
      }
    return { fragment, rowsMap, boxes };
  }
  function commitBody(candidateRows, candidateStatus) {
    const active = document2.activeElement, focusedRow = body.contains(active) ? active.closest("[data-row-id]")?.dataset.rowId : null;
    const focusedColumn = focusedRow ? active.closest("[data-column-id]")?.dataset.columnId : null;
    const replacement = buildBody(candidateRows, candidateStatus);
    body.replaceChildren(replacement.fragment);
    bodyRows = replacement.rowsMap;
    rowBoxes = replacement.boxes;
    if (focusedRow) {
      const row = bodyRows.get(focusedRow);
      const cell = focusedColumn && [...row?.cells || []].find(
        (item) => item.dataset.columnId === focusedColumn
      );
      const target = focusedColumn ? cell?.querySelector("button,input,select,textarea,a[href],[tabindex]") : rowBoxes.get(focusedRow);
      (target || scroll).focus();
    }
  }
  function updateStatus() {
    const effective = currentStatus === "ready" && !currentRows.length ? "empty" : currentStatus;
    element.dataset.state = effective;
    table.setAttribute("aria-busy", String(currentStatus === "loading"));
    announcement.setAttribute(
      "role",
      currentStatus === "error" ? "alert" : "status"
    );
    announcement.textContent = currentMessage || (effective === "loading" ? "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0434\u0430\u043D\u043D\u044B\u0445\u2026" : effective === "error" ? "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438. \u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u0447\u0435\u0440\u0435\u0437 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435." : effective === "empty" ? "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445" : `${currentRows.length} \u0441\u0442\u0440\u043E\u043A \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435`);
    for (const button of headerButtons.values())
      button.disabled = !onSort || currentStatus !== "ready";
    updateSelection();
    updatePager();
  }
  function setRows(nextRows) {
    if (disposed) return;
    const candidate = rowsValue(nextRows, definitions), eligible = new Set(
      candidate.filter((row) => !row.disabled).map((row) => row.id)
    );
    commitBody(candidate, currentStatus);
    currentRows = candidate;
    selected = new Set([...selected].filter((id) => eligible.has(id)));
    updateStatus();
  }
  function setSelection(ids) {
    if (!disposed) {
      selected = selectionValue(ids);
      updateSelection();
    }
  }
  function setSort(value) {
    if (disposed) return;
    if (value !== null && (!value || !definitions.some(
      (column) => column.id === value.columnId && column.sortable
    ) || !["ascending", "descending"].includes(value.direction)))
      throw new TypeError(
        "Sort requires a sortable column and known direction"
      );
    currentSort = value ? { ...value } : null;
    for (const [id, th] of headers) {
      if (value?.columnId === id) th.setAttribute("aria-sort", value.direction);
      else th.removeAttribute("aria-sort");
    }
    for (const [id, mark] of sortMarks)
      mark.textContent = value?.columnId === id ? value.direction === "ascending" ? " \u2191" : " \u2193" : " \u2195";
  }
  function setStatus(value, note = "") {
    if (disposed) return;
    if (!["ready", "loading", "empty", "error"].includes(value) || typeof note !== "string" || note.length > 2048)
      throw new TypeError("Known status and bounded message required");
    commitBody(currentRows, value);
    currentStatus = value;
    currentMessage = note;
    updateStatus();
  }
  function updatePager() {
    pager.hidden = currentPage === null;
    pageText.textContent = currentPage ? `${currentPage.index + 1} / ${currentPage.count}` : "";
    previous.disabled = !currentPage || !onPageChange || currentPage.index === 0 || currentStatus !== "ready";
    next.disabled = !currentPage || !onPageChange || currentPage.index + 1 >= currentPage.count || currentStatus !== "ready";
  }
  function setPage(value) {
    if (disposed) return;
    if (value !== null && (!value || !Number.isInteger(value.index) || !Number.isInteger(value.count) || value.count < 1 || value.count > 1e6 || value.index < 0 || value.index >= value.count))
      throw new TypeError("Page index must be inside a bounded positive count");
    currentPage = value ? { ...value } : null;
    updatePager();
  }
  body.addEventListener(
    "change",
    (event) => {
      const checkbox = event.target, id = checkbox.dataset?.rowSelect;
      if (disposed || currentStatus !== "ready" || rowBoxes.get(id) !== checkbox || checkbox.disabled)
        return;
      if (checkbox.checked) selected.add(id);
      else selected.delete(id);
      updateSelection();
      onSelectionChange?.([...selected]);
    },
    listeners
  );
  allBox?.addEventListener(
    "change",
    () => {
      if (disposed || allBox.disabled) return;
      selected = allBox.checked ? new Set(
        currentRows.filter((row) => !row.disabled).map((row) => row.id)
      ) : /* @__PURE__ */ new Set();
      updateSelection();
      onSelectionChange?.([...selected]);
    },
    listeners
  );
  previous.addEventListener(
    "click",
    () => {
      if (!disposed && !previous.disabled)
        onPageChange?.(currentPage.index - 1);
    },
    listeners
  );
  next.addEventListener(
    "click",
    () => {
      if (!disposed && !next.disabled) onPageChange?.(currentPage.index + 1);
    },
    listeners
  );
  setSort(sort);
  selected = selectionValue(selectedIds);
  setPage(page);
  setStatus(status, message);
  return {
    element,
    table,
    setRows,
    setSort,
    setSelection,
    setStatus,
    setPage,
    get selectedIds() {
      return [...selected];
    },
    get sort() {
      return currentSort ? { ...currentSort } : null;
    },
    dispose() {
      if (!disposed) {
        disposed = true;
        abort.abort();
        currentRows = [];
        selected.clear();
        bodyRows.clear();
        rowBoxes.clear();
        body.replaceChildren();
        onSort = void 0;
        onSelectionChange = void 0;
        onPageChange = void 0;
      }
    }
  };
}

// packages/components/data-table-localized.js
function createDataTable2(options = {}) {
  return localizeComponent(createDataTable(options), "data-table", options);
}

// packages/components/history-model.js
var ID = /^[A-Za-z0-9_.:/-]{1,80}$/;
var HISTORY_LIMIT = 240;
var LANE_LIMIT = 12;
function identifier2(value) {
  if (typeof value !== "string" || !ID.test(value))
    throw new TypeError("History IDs must be 1\u201380 safe characters");
  return value;
}
function text2(value, limit = 240) {
  if (typeof value !== "string" || !value.trim() || value.length > limit)
    throw new TypeError("History requires bounded nonempty text");
  return value;
}
function records(items) {
  if (!Array.isArray(items) || items.length > HISTORY_LIMIT)
    throw new TypeError(
      "History supports at most 240 records; page in the host"
    );
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const item of items) {
    const id = identifier2(item?.id);
    if (seen.has(id)) throw new TypeError("History IDs must be unique");
    seen.add(id);
    result.push({
      id,
      title: text2(item.title),
      author: text2(item.author ?? "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"),
      authorMissing: item.author === void 0,
      dateMissing: item.date === void 0,
      date: text2(item.date ?? "\u0411\u0435\u0437 \u0434\u0430\u0442\u044B"),
      description: item.description === void 0 || item.description === "" ? "" : text2(item.description, 4e3)
    });
  }
  return result;
}
function gitHistoryModel(commits) {
  const nodes = records(commits), positions = new Map(nodes.map((n, i) => [n.id, i]));
  const pending = [];
  let laneCount = 1;
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i], input = commits[i];
    if (!Array.isArray(input.parents) || input.parents.length > 8)
      throw new TypeError("Git commits require 0\u20138 explicit parents");
    node.parents = input.parents.map(identifier2);
    if (new Set(node.parents).size !== node.parents.length)
      throw new TypeError("Duplicate parent");
    if (!Array.isArray(input.refs ?? []) || (input.refs ?? []).length > 12)
      throw new TypeError("At most 12 refs per commit");
    node.refs = (input.refs ?? []).map((ref) => text2(ref, 100));
    if (node.refs.length > 12)
      throw new TypeError("At most 12 refs per commit");
    node.group = node.refs[0] ?? "commits";
    let lane = pending.indexOf(node.id);
    if (lane < 0) {
      lane = pending.indexOf(null);
      if (lane < 0) lane = pending.length;
    }
    node.lane = lane;
    pending[lane] = null;
    for (let parentIndex = 0; parentIndex < node.parents.length; parentIndex++) {
      const parent = node.parents[parentIndex], at = positions.get(parent);
      if (at !== void 0 && at <= i)
        throw new TypeError(
          "Git parents must follow children in newest-first topological order"
        );
      edges.push({ from: node.id, to: parent, kind: "parent" });
      if (at === void 0 || pending.includes(parent)) continue;
      let targetLane = parentIndex === 0 && pending[lane] === null ? lane : pending.indexOf(null);
      if (targetLane < 0) targetLane = pending.length;
      pending[targetLane] = parent;
    }
    laneCount = Math.max(laneCount, lane + 1, pending.length);
    if (laneCount > LANE_LIMIT)
      throw new TypeError(
        "At most 12 simultaneous Git lanes; narrow the host snapshot"
      );
  }
  return { kind: "git", nodes, edges, laneCount, groups: [] };
}
function taskHistoryModel({ tasks, events, dependencies = [] }) {
  if (!Array.isArray(tasks) || tasks.length > LANE_LIMIT)
    throw new TypeError("Task history supports at most 12 task lanes");
  const groups = [], known = /* @__PURE__ */ new Map();
  for (const task of tasks) {
    const id = identifier2(task?.id);
    if (known.has(id) || id === "all")
      throw new TypeError(
        "Task IDs must be unique and cannot use the reserved all ID"
      );
    const group = {
      id,
      title: text2(task.title),
      status: text2(task.status ?? "\u0417\u0430\u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043E"),
      lane: groups.length
    };
    known.set(id, group);
    groups.push(group);
  }
  const nodes = records(events), last = /* @__PURE__ */ new Map(), edges = [], positions = new Set(nodes.map((n) => n.id));
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i], group = known.get(events[i].taskId);
    if (!group) throw new TypeError("Every event must name a known task");
    Object.assign(node, {
      lane: group.lane,
      group: group.id,
      refs: [group.id, group.status],
      parents: [],
      status: group.status
    });
    if (last.has(group.id))
      edges.push({ from: last.get(group.id), to: node.id, kind: "continuity" });
    last.set(group.id, node.id);
  }
  if (!Array.isArray(dependencies) || dependencies.length > HISTORY_LIMIT)
    throw new TypeError("Bounded dependencies required");
  const seen = /* @__PURE__ */ new Set();
  for (const edge of dependencies) {
    const from = identifier2(edge.from), to = identifier2(edge.to), key = from + "\u2192" + to;
    if (!positions.has(from) || !positions.has(to) || from === to || seen.has(key))
      throw new TypeError(
        "Dependencies require distinct existing event endpoints"
      );
    seen.add(key);
    edges.push({
      from,
      to,
      kind: "dependency",
      label: text2(edge.label ?? "\u0417\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u044C")
    });
  }
  return {
    kind: "tasks",
    nodes,
    edges,
    laneCount: Math.max(1, groups.length),
    groups
  };
}
function projectHistory(model, query = "", group = "all") {
  const needle = String(query).trim().toLocaleLowerCase();
  const nodes = model.nodes.filter(
    (n) => (group === "all" || n.group === group) && [n.title, n.id, n.author, ...n.refs].join(" ").toLocaleLowerCase().includes(needle)
  );
  const visible = new Set(nodes.map((n) => n.id));
  const edges = model.edges.filter((e) => visible.has(e.from));
  return {
    nodes,
    edges: edges.map((e) => ({ ...e, boundary: !visible.has(e.to) }))
  };
}

// packages/components/history-view.js
var sequence5 = 0;
var SVG = "http://www.w3.org/2000/svg";
function createHistoryView({
  document: document2 = globalThis.document,
  label,
  model,
  buildModel,
  onSelect,
  onAction,
  i18n
}) {
  if (typeof label !== "string" || !label.trim() || label.length > 180)
    throw new TypeError("History needs a bounded accessible label");
  for (const callback of [onSelect, onAction])
    if (callback !== void 0 && typeof callback !== "function")
      throw new TypeError("Callbacks must be functions");
  const win = document2.defaultView;
  let localeContext = resolveI18n(document2, i18n);
  let disposed = false, frame = null, selectedId = model.nodes[0]?.id ?? null;
  let projection, rowNodes = /* @__PURE__ */ new Map();
  const abort = new win.AbortController();
  function node(tag2, text3, className) {
    const el = document2.createElement(tag2);
    if (text3 !== void 0) el.textContent = text3;
    if (className) el.className = className;
    return el;
  }
  const element = node("section", void 0, "ag-history"), heading = node("h3", label, "ag-history__title"), toolbar = node("div", void 0, "ag-history__toolbar ag-form-tracks");
  toolbar.dataset.agFormRow = "auto";
  element.setAttribute("aria-label", label);
  const prefix = `ag-history-${++sequence5}`;
  const searchLabel = node("label", void 0, "ag-history__search"), searchCaption = node("span", "\u041F\u043E\u0438\u0441\u043A \u0432 \u0438\u0441\u0442\u043E\u0440\u0438\u0438"), search = node("input");
  searchLabel.dataset.agFormField = "";
  searchCaption.id = `${prefix}-search-caption`;
  searchCaption.className = "ag-form-track__label";
  search.className = "ag-form-track__control";
  search.setAttribute("aria-labelledby", searchCaption.id);
  search.type = "search";
  search.placeholder = "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435, \u0430\u0432\u0442\u043E\u0440 \u0438\u043B\u0438 ID\u2026";
  search.maxLength = 240;
  searchLabel.append(
    searchCaption,
    search,
    node("div", void 0, "ag-form-track__feedback")
  );
  const filter = createSelect({
    document: document2,
    label: "\u0414\u043E\u0440\u043E\u0436\u043A\u0430",
    options: [
      { value: "all", label: "\u0412\u0441\u0435 \u0434\u043E\u0440\u043E\u0436\u043A\u0438" },
      ...model.groups.map((g) => ({
        value: g.id,
        label: (g.id + " \xB7 " + g.title).slice(0, 180)
      }))
    ],
    value: "all",
    onChange: () => renderRows()
  });
  filter.element.dataset.agFormField = "";
  filter.element.querySelector("label").classList.add("ag-form-track__label");
  filter.select.classList.add("ag-form-track__control");
  const feedback = node("div", void 0, "ag-form-track__feedback");
  feedback.append(
    ...filter.element.querySelectorAll(".ag-select__hint,.ag-select__error")
  );
  filter.element.append(feedback);
  filter.element.hidden = model.kind === "git";
  toolbar.dataset.historyFilter = String(!filter.element.hidden);
  toolbar.append(searchLabel, filter.element);
  const legend = node(
    "p",
    model.kind === "git" ? "\u0421\u043F\u043B\u043E\u0448\u043D\u0430\u044F \u043B\u0438\u043D\u0438\u044F \u2014 \u0440\u043E\u0434\u0438\u0442\u0435\u043B\u044C \u043A\u043E\u043C\u043C\u0438\u0442\u0430. \u041F\u0443\u043D\u043A\u0442\u0438\u0440 \u2014 \u0441\u0432\u044F\u0437\u044C \u0437\u0430 \u043F\u0440\u0435\u0434\u0435\u043B\u0430\u043C\u0438 \u0432\u044B\u0431\u043E\u0440\u043A\u0438." : "\u0421\u043F\u043B\u043E\u0448\u043D\u0430\u044F \u043B\u0438\u043D\u0438\u044F \u2014 \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u043E\u0434\u043D\u043E\u0439 \u0437\u0430\u0434\u0430\u0447\u0438. \u041F\u0443\u043D\u043A\u0442\u0438\u0440 \u2014 \u044F\u0432\u043D\u0430\u044F \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u044C \u0438\u043B\u0438 \u0441\u043A\u0440\u044B\u0442\u044B\u0439 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442.",
    "ag-history__legend"
  );
  const layout = node("div", void 0, "ag-history__layout"), scroll = node("div", void 0, "ag-history__scroll"), graph = node("div", void 0, "ag-history__graph"), list = node("ol", void 0, "ag-history__list");
  const svg = document2.createElementNS(SVG, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("ag-history__svg");
  const details = node("aside", void 0, "ag-history__details");
  details.setAttribute("aria-label", "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0441\u0442\u0438 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0439 \u0437\u0430\u043F\u0438\u0441\u0438");
  const count = node("p", void 0, "ag-history__count");
  count.setAttribute("role", "status");
  graph.append(svg, list);
  scroll.append(graph);
  layout.append(scroll, details);
  element.append(heading, toolbar, legend, layout, count);
  function schedule() {
    if (disposed || frame !== null) return;
    if (win.requestAnimationFrame)
      frame = win.requestAnimationFrame(() => {
        frame = null;
        draw();
      });
    else draw();
  }
  const observer = win.ResizeObserver ? new win.ResizeObserver(schedule) : null;
  observer?.observe(graph);
  function draw() {
    if (disposed) return;
    const base = graph.getBoundingClientRect(), positions = /* @__PURE__ */ new Map();
    const height = Math.max(graph.scrollHeight, 1), width = 28 + model.laneCount * 18;
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.replaceChildren();
    for (const entry of projection.nodes) {
      const rect = rowNodes.get(entry.id).getBoundingClientRect();
      positions.set(entry.id, {
        x: 18 + entry.lane * 18,
        y: rect.top - base.top + rect.height / 2
      });
    }
    for (const edge of projection.edges) {
      const from = positions.get(edge.from), target = positions.get(edge.to);
      if (!from) continue;
      const to = target ?? { x: from.x, y: Math.min(height - 5, from.y + 22) };
      const path = document2.createElementNS(SVG, "path");
      path.setAttribute("d", connectionCurve(from, to, { axis: "vertical" }));
      path.setAttribute(
        "class",
        `ag-history__edge${edge.boundary || edge.kind === "dependency" ? " ag-history__edge--dashed" : ""}`
      );
      path.dataset.from = edge.from;
      path.dataset.to = edge.to;
      path.style.setProperty(
        "--ag-history-lane",
        `var(--ag-history-lane-${model.nodes.find((n) => n.id === edge.from).lane % 4}, var(--ag-accent))`
      );
      svg.append(path);
    }
    for (const entry of projection.nodes) {
      const pos = positions.get(entry.id), circle = document2.createElementNS(SVG, "circle");
      circle.setAttribute("cx", String(pos.x));
      circle.setAttribute("cy", String(pos.y));
      circle.setAttribute("r", entry.id === selectedId ? "6" : "4");
      circle.dataset.nodeId = entry.id;
      circle.style.setProperty(
        "--ag-history-lane",
        `var(--ag-history-lane-${entry.lane % 4}, var(--ag-accent))`
      );
      svg.append(circle);
    }
  }
  function renderDetails() {
    const restoreActionFocus = details.contains(document2.activeElement) && document2.activeElement?.classList.contains("ag-history__action");
    details.replaceChildren();
    const entry = model.nodes.find((n) => n.id === selectedId);
    if (!entry) {
      details.append(node("p", "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0437\u0430\u043F\u0438\u0441\u044C \u0432 \u0438\u0441\u0442\u043E\u0440\u0438\u0438."));
      return;
    }
    details.append(
      node(
        "p",
        model.kind === "git" ? "\u041A\u041E\u041C\u041C\u0418\u0422" : "\u0421\u041E\u0411\u042B\u0422\u0418\u0415 \u0417\u0410\u0414\u0410\u0427\u0418",
        "ag-history__eyebrow"
      ),
      node("h4", entry.title),
      node("code", entry.id),
      node(
        "p",
        (entry.authorMissing ? localeContext.t("common.unknownAuthor") : entry.author) + " \xB7 " + (entry.dateMissing ? localeContext.t("common.noDate") : entry.date),
        "ag-history__meta"
      )
    );
    if (entry.description) details.append(node("p", entry.description));
    const relations = node("ul", void 0, "ag-history__relations");
    for (const edge of model.edges) {
      if (edge.from !== entry.id) continue;
      const target = model.nodes.find((n) => n.id === edge.to);
      const kind = edge.kind === "parent" ? localeContext.t("history.parent") : edge.kind === "dependency" ? edge.label : localeContext.t("history.previousEvent");
      relations.append(
        node(
          "li",
          `${kind}: ${edge.to}${target ? " \xB7 " + target.title : " \xB7 " + localeContext.t("history.outside")}${projection.nodes.some((n) => n.id === edge.to) ? "" : " \xB7 " + localeContext.t("history.hidden")}`
        )
      );
    }
    if (relations.childElementCount) details.append(relations);
    if (model.kind === "tasks" && onAction) {
      details.append(
        node(
          "p",
          "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043F\u0440\u0438\u043C\u0435\u043D\u044F\u0435\u0442 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435, \u043A\u043E\u0442\u043E\u0440\u043E\u043C\u0443 \u043F\u0440\u0438\u043D\u0430\u0434\u043B\u0435\u0436\u0438\u0442 \u0437\u0430\u0434\u0430\u0447\u0430.",
          "ag-history__meta"
        )
      );
      const button = node(
        "button",
        "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u0434\u0430\u0447\u0438",
        "ag-history__action"
      );
      button.type = "button";
      details.append(button);
      if (restoreActionFocus) button.focus();
    }
  }
  function select(id, notify = false) {
    if (disposed) return;
    const entry = model.nodes.find((n) => n.id === id);
    if (!entry) throw new TypeError("Select a known history ID");
    selectedId = id;
    for (const [key, button] of rowNodes)
      button.setAttribute("aria-pressed", String(key === id));
    renderDetails();
    schedule();
    if (notify && onSelect) onSelect(structuredClone(entry));
  }
  function renderRows() {
    projection = projectHistory(model, search.value, filter.value);
    observer?.disconnect();
    observer?.observe(graph);
    list.replaceChildren();
    rowNodes = /* @__PURE__ */ new Map();
    graph.style.setProperty(
      "--ag-history-gutter",
      `${28 + model.laneCount * 18}px`
    );
    for (const entry of projection.nodes) {
      const li = node("li"), button = node("button", void 0, "ag-history__row"), copy = node("span", void 0, "ag-history__copy");
      button.type = "button";
      button.dataset.historyId = entry.id;
      button.id = prefix + "-row-" + rowNodes.size;
      button.setAttribute("aria-pressed", String(entry.id === selectedId));
      const refs = node("span", void 0, "ag-history__refs");
      for (const ref of entry.refs) refs.append(node("span", ref));
      copy.append(
        node("strong", entry.title),
        refs,
        node(
          "span",
          `${entry.authorMissing ? localeContext.t("common.unknownAuthor") : entry.author} \xB7 ${entry.dateMissing ? localeContext.t("common.noDate") : entry.date} \xB7 ${entry.id}`,
          "ag-history__meta"
        )
      );
      const missing = projection.edges.filter(
        (e) => e.from === entry.id && e.boundary
      ).length;
      if (missing)
        copy.append(
          node(
            "span",
            `${missing} \u0441\u0432\u044F\u0437\u0435\u0439 \u0432\u043D\u0435 \u0432\u0438\u0434\u0438\u043C\u043E\u0439 \u0432\u044B\u0431\u043E\u0440\u043A\u0438`,
            "ag-history__boundary"
          )
        );
      button.append(copy);
      li.append(button);
      list.append(li);
      rowNodes.set(entry.id, button);
      observer?.observe(button);
    }
    if (!projection.nodes.length)
      list.append(
        node(
          "li",
          "\u0417\u0430\u043F\u0438\u0441\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B. \u0418\u0437\u043C\u0435\u043D\u0438\u0442\u0435 \u043F\u043E\u0438\u0441\u043A \u0438\u043B\u0438 \u0434\u043E\u0440\u043E\u0436\u043A\u0443.",
          "ag-history__empty"
        )
      );
    count.textContent = `\u041F\u043E\u043A\u0430\u0437\u0430\u043D\u043E ${projection.nodes.length} \u0438\u0437 ${model.nodes.length}${selectedId && !rowNodes.has(selectedId) ? " \xB7 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C \u0441\u043A\u0440\u044B\u0442\u0430 \u0444\u0438\u043B\u044C\u0442\u0440\u043E\u043C" : ""}`;
    renderDetails();
    schedule();
  }
  details.addEventListener(
    "click",
    (event) => {
      if (!event.target.closest(".ag-history__action") || disposed) return;
      const entry = model.nodes.find((n) => n.id === selectedId);
      if (entry && onAction)
        onAction({
          taskId: entry.group,
          eventId: entry.id,
          action: "change-status"
        });
    },
    { signal: abort.signal }
  );
  search.addEventListener("input", renderRows, { signal: abort.signal });
  list.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest("button[data-history-id]");
      if (button && list.contains(button))
        select(button.dataset.historyId, true);
    },
    { signal: abort.signal }
  );
  list.addEventListener(
    "keydown",
    (event) => {
      if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      const buttons = Array.from(rowNodes.values()), at = buttons.indexOf(document2.activeElement);
      if (at < 0) return;
      event.preventDefault();
      let next = at;
      if (event.key === "Home") next = 0;
      else if (event.key === "End") next = buttons.length - 1;
      else {
        const direction = event.key === "ArrowDown" ? 1 : -1;
        next = Math.max(0, Math.min(buttons.length - 1, at + direction));
      }
      buttons[next].focus();
    },
    { signal: abort.signal }
  );
  win.addEventListener("resize", schedule, { signal: abort.signal });
  function setData(data) {
    if (disposed) return;
    const next = buildModel(data);
    if (next.groups.map((g) => g.id).join("|") !== model.groups.map((g) => g.id).join("|"))
      throw new TypeError("Remount to change task lane identities");
    const focused = document2.activeElement?.dataset?.historyId;
    model = next;
    for (const group of model.groups) {
      const option = Array.from(filter.select.options).find(
        (item) => item.value === group.id
      );
      option.textContent = (group.id + " \xB7 " + group.title).slice(0, 180);
    }
    if (!model.nodes.some((n) => n.id === selectedId))
      selectedId = model.nodes[0]?.id ?? null;
    renderRows();
    if (focused) (rowNodes.get(focused) ?? search).focus();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    observer?.disconnect();
    abort.abort();
    filter.dispose();
    onSelect = void 0;
    onAction = void 0;
    if (frame !== null) win.cancelAnimationFrame?.(frame);
    frame = null;
  }
  renderRows();
  return {
    element,
    search,
    select,
    setData,
    dispose,
    get selectedId() {
      return selectedId;
    },
    refresh: schedule,
    /** Update only owned details on a provider change; user text and the graph snapshot remain intact. */
    refreshLocaleContent(context) {
      if (context === localeContext && element.lang === context.locale) return;
      localeContext = context;
      renderDetails();
    }
  };
}

// packages/components/git-history.js
function createGitHistory({
  commits = [],
  label = "\u0418\u0441\u0442\u043E\u0440\u0438\u044F Git",
  ...options
} = {}) {
  return createHistoryView({
    ...options,
    label,
    model: gitHistoryModel(commits),
    buildModel: gitHistoryModel
  });
}

// packages/components/git-history-localized.js
function createGitHistory2(options = {}) {
  return localizeComponent(createGitHistory(options), "history", options);
}

// packages/components/task-history.js
function createTaskHistory({
  tasks = [],
  events = [],
  dependencies = [],
  label = "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0437\u0430\u0434\u0430\u0447",
  ...options
} = {}) {
  return createHistoryView({
    ...options,
    label,
    model: taskHistoryModel({ tasks, events, dependencies }),
    buildModel: taskHistoryModel
  });
}

// packages/components/task-history-localized.js
function createTaskHistory2(options = {}) {
  return localizeComponent(createTaskHistory(options), "history", options);
}

// web/system-styles/demo-editor-toolbar.js
function compactDemoEditorToolbar(editor, doc) {
  const toolbar = editor.element.querySelector(".ag-markdown-editor__toolbar");
  if (!toolbar) return { dispose() {
  } };
  const commands = [...toolbar.children].filter(
    (node) => node.tagName === "BUTTON"
  );
  if (commands.length !== 8) return { dispose() {
  } };
  const win = doc.defaultView;
  const events = new win.AbortController();
  const save = commands.pop();
  const details = doc.createElement("details");
  details.className = "demo-editor-actions";
  const summary = doc.createElement("summary");
  summary.textContent = "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F";
  summary.setAttribute("aria-label", "\u0420\u0435\u0436\u0438\u043C \u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430");
  const menu = doc.createElement("div");
  menu.className = "demo-editor-actions-list";
  menu.append(...commands);
  details.append(summary, menu);
  toolbar.insertBefore(details, save);
  const media = win.matchMedia?.("(min-width: 761px)");
  function respond() {
    const width = toolbar.getBoundingClientRect().width;
    const compact = width > 0 ? width < 680 : doc.documentElement.dataset.example === "fitness" || !(media ? media.matches : win.innerWidth > 760);
    toolbar.dataset.demoToolbarCompact = String(compact);
    if (!details.contains(doc.activeElement)) details.open = !compact;
  }
  function dismiss() {
    if (toolbar.dataset.demoToolbarCompact !== "true") return;
    details.open = false;
    summary.focus();
  }
  menu.addEventListener(
    "click",
    (event) => {
      if (event.target.closest("button")) dismiss();
    },
    { signal: events.signal }
  );
  details.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && details.open) {
        event.preventDefault();
        dismiss();
      }
    },
    { signal: events.signal }
  );
  doc.addEventListener(
    "pointerdown",
    (event) => {
      if (toolbar.dataset.demoToolbarCompact === "true" && !details.contains(event.target))
        details.open = false;
    },
    { signal: events.signal }
  );
  const observer = win.ResizeObserver ? new win.ResizeObserver(respond) : null;
  observer?.observe(toolbar);
  media?.addEventListener("change", respond, { signal: events.signal });
  respond();
  return {
    dispose() {
      events.abort();
      observer?.disconnect();
    }
  };
}

// web/system-styles/component-lab-data.js
function historyDemoData() {
  return {
    commits: [
      {
        id: "e9f4a12",
        title: "\u041E\u0431\u044A\u0435\u0434\u0438\u043D\u0438\u0442\u044C \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0438 \u0440\u0430\u0431\u043E\u0447\u0435\u0435 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E",
        parents: ["d71bc90", "c82a41f"],
        refs: ["main", "HEAD"],
        author: "\u0410\u043D\u043D\u0430 \u041A.",
        date: "26 \u043E\u043A\u0442 \xB7 14:32",
        description: "\u041E\u0431\u0449\u0438\u0439 \u0440\u0435\u043B\u0438\u0437: \u043D\u043E\u0432\u044B\u0439 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440, \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043D\u044B\u0435 \u0442\u043E\u043A\u0435\u043D\u044B \u0438 \u043D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044F."
      },
      {
        id: "d71bc90",
        title: "\u0421\u043E\u0433\u043B\u0430\u0441\u043E\u0432\u0430\u0442\u044C \u0442\u043E\u043A\u0435\u043D\u044B \u0432\u0441\u0435\u0445 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0435\u0439",
        parents: ["b630f21"],
        refs: ["design/tokens"],
        author: "\u041C\u0430\u0440\u043A \u0421.",
        date: "26 \u043E\u043A\u0442 \xB7 13:48"
      },
      {
        id: "c82a41f",
        title: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 Markdown",
        parents: ["a580cd1"],
        refs: ["feature/editor"],
        author: "\u0410\u043D\u043D\u0430 \u041A.",
        date: "26 \u043E\u043A\u0442 \xB7 13:12"
      },
      {
        id: "b630f21",
        title: "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u043A\u043E\u043D\u0442\u0440\u0430\u0441\u0442 \u0438 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F \u0444\u043E\u043A\u0443\u0441\u0430",
        parents: ["a580cd1"],
        author: "\u041B\u0435\u043D\u0430 \u041C.",
        date: "26 \u043E\u043A\u0442 \xB7 12:40"
      },
      {
        id: "a580cd1",
        title: "\u041E\u0431\u044A\u0435\u0434\u0438\u043D\u0438\u0442\u044C \u043D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044E \u0438 \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0443 \u0444\u043E\u0440\u043C",
        parents: ["91a0ee2", "802bce4"],
        author: "\u041C\u0430\u0440\u043A \u0421.",
        date: "26 \u043E\u043A\u0442 \xB7 11:24"
      },
      {
        id: "91a0ee2",
        title: "\u041D\u0430\u0441\u0442\u0440\u043E\u0438\u0442\u044C \u0442\u0430\u0431\u043B\u0438\u0446\u0443 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u043E\u0432",
        parents: ["714ad80"],
        refs: ["feature/content"],
        author: "\u041B\u0435\u043D\u0430 \u041C.",
        date: "25 \u043E\u043A\u0442 \xB7 17:35"
      },
      {
        id: "802bce4",
        title: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u043E\u0438\u0441\u043A \u043F\u043E \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0443",
        parents: ["714ad80"],
        author: "\u0410\u043D\u043D\u0430 \u041A.",
        date: "25 \u043E\u043A\u0442 \xB7 16:18"
      },
      {
        id: "714ad80",
        title: "\u0421\u043E\u0431\u0440\u0430\u0442\u044C \u043A\u0430\u0440\u043A\u0430\u0441 \u0441\u0438\u0441\u0442\u0435\u043C\u044B",
        parents: ["6a9be33"],
        refs: ["v0.1"],
        author: "\u041C\u0430\u0440\u043A \u0421.",
        date: "25 \u043E\u043A\u0442 \xB7 10:00"
      }
    ],
    tasks: [
      { id: "DS-24", title: "\u0420\u0430\u0431\u043E\u0447\u0435\u0435 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E", status: "\u041D\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0435" },
      { id: "DS-25", title: "\u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u043E\u0432", status: "\u0412 \u0440\u0430\u0431\u043E\u0442\u0435" },
      { id: "DS-26", title: "\u041A\u043E\u043D\u0442\u0440\u0430\u0441\u0442 \u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0441\u0442\u044C", status: "\u0417\u0430\u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043E" }
    ],
    events: [
      {
        id: "ev9",
        taskId: "DS-24",
        title: "\u041F\u0435\u0440\u0435\u0434\u0430\u043D\u043E \u043D\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0443",
        author: "\u041C\u0430\u0440\u043A \u0421.",
        date: "26 \u043E\u043A\u0442 \xB7 14:32",
        description: "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u043D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044E, \u0443\u0437\u043A\u0438\u0439 \u044D\u043A\u0440\u0430\u043D \u0438 \u0442\u043E\u043A\u0435\u043D\u044B \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u0441\u0442\u0438\u043B\u044F."
      },
      {
        id: "ev8",
        taskId: "DS-25",
        title: "\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 Markdown",
        author: "\u0410\u043D\u043D\u0430 \u041A.",
        date: "26 \u043E\u043A\u0442 \xB7 13:12"
      },
      {
        id: "ev7",
        taskId: "DS-26",
        title: "\u0421\u043E\u0433\u043B\u0430\u0441\u043E\u0432\u0430\u043D \u0441\u043F\u0438\u0441\u043E\u043A \u043F\u0440\u043E\u0432\u0435\u0440\u043E\u043A",
        author: "\u041B\u0435\u043D\u0430 \u041C.",
        date: "26 \u043E\u043A\u0442 \xB7 12:40"
      },
      {
        id: "ev6",
        taskId: "DS-24",
        title: "\u0421\u043E\u0431\u0440\u0430\u043D \u044D\u043A\u0440\u0430\u043D \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0430",
        author: "\u041C\u0430\u0440\u043A \u0421.",
        date: "26 \u043E\u043A\u0442 \xB7 11:24"
      },
      {
        id: "ev5",
        taskId: "DS-25",
        title: "\u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0432\u0437\u044F\u0442 \u0432 \u0440\u0430\u0431\u043E\u0442\u0443",
        author: "\u0410\u043D\u043D\u0430 \u041A.",
        date: "25 \u043E\u043A\u0442 \xB7 17:35"
      },
      {
        id: "ev4",
        taskId: "DS-26",
        title: "\u0421\u043E\u0437\u0434\u0430\u043D\u0430 \u0437\u0430\u0434\u0430\u0447\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438",
        author: "\u041B\u0435\u043D\u0430 \u041C.",
        date: "25 \u043E\u043A\u0442 \xB7 16:18"
      },
      {
        id: "ev3",
        taskId: "DS-24",
        title: "\u0421\u043E\u0433\u043B\u0430\u0441\u043E\u0432\u0430\u043D\u0430 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 \u0440\u0430\u0437\u0434\u0435\u043B\u043E\u0432",
        author: "\u041C\u0430\u0440\u043A \u0421.",
        date: "25 \u043E\u043A\u0442 \xB7 12:00"
      },
      {
        id: "ev2",
        taskId: "DS-25",
        title: "\u0421\u043E\u0437\u0434\u0430\u043D\u0430 \u0437\u0430\u0434\u0430\u0447\u0430 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430",
        author: "\u0410\u043D\u043D\u0430 \u041A.",
        date: "25 \u043E\u043A\u0442 \xB7 11:20"
      },
      {
        id: "ev1",
        taskId: "DS-24",
        title: "\u0421\u043E\u0437\u0434\u0430\u043D\u043E \u0440\u0430\u0431\u043E\u0447\u0435\u0435 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E",
        author: "\u041C\u0430\u0440\u043A \u0421.",
        date: "25 \u043E\u043A\u0442 \xB7 10:00"
      }
    ],
    dependencies: [
      { from: "ev7", to: "ev8", label: "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u043E\u0436\u0438\u0434\u0430\u0435\u0442 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440" }
    ]
  };
}
var styleDemoLinks = [
  ["violet-soft-3d", "Soft 3D", "example.html?style=violet-soft-3d"],
  ["midnight-glass", "Glass", "example.html?style=midnight-glass"],
  ["coral-pulse", "Coral", "coral-pulse.html"],
  ["graphite-gold", "Gold", "gold-console.html"],
  ["amber-circuit", "Amber", "amber-circuit.html"],
  ["saas-clarity", "SaaS", "saas-clarity.html"],
  ["learning-air", "Learning", "learning-air.html"],
  ["orchid-studio", "Orchid", "orchid-studio.html"],
  ["periwinkle-cms", "Periwinkle", "periwinkle-cms.html"]
];

// web/system-styles/component-lab.js
var sequence6 = 0;
function mountComponentLab(host) {
  const doc = host.ownerDocument, win = doc.defaultView, data = historyDemoData(), owned = [];
  let disposed = false, actionCount = 0;
  const abort = new win.AbortController();
  function node(tag2, text3, className) {
    const el = doc.createElement(tag2);
    if (text3 !== void 0) el.textContent = text3;
    if (className) el.className = className;
    return el;
  }
  const localeRuntime = getLocaleRuntime(doc), i18n = localeRuntime.context;
  host.classList.add("ag-style-lab");
  const style = doc.documentElement.dataset.style;
  const header = node("header", void 0, "lab-heading"), intro = node("div");
  intro.append(
    node("p", "AG DESIGN / \u0412 \u0420\u0410\u0411\u041E\u0422\u0415", "lab-eyebrow"),
    node("h2", "\u041E\u0434\u0438\u043D \u043D\u0430\u0431\u043E\u0440. \u0414\u0435\u0432\u044F\u0442\u044C \u0445\u0430\u0440\u0430\u043A\u0442\u0435\u0440\u043E\u0432."),
    node(
      "p",
      "\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0438 \u0432 \u0440\u0430\u0431\u043E\u0447\u0435\u043C \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0438: \u0438\u0441\u0442\u043E\u0440\u0438\u044F \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439, \u0437\u0430\u0434\u0430\u0447\u0438, \u0434\u0430\u043D\u043D\u044B\u0435 \u0438 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440."
    )
  );
  const marker = node("span", "\u0416\u0438\u0432\u044B\u0435 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B", "lab-marker");
  header.append(intro, marker);
  const navigation = node("nav", void 0, "lab-styles");
  navigation.setAttribute("aria-label", "\u0421\u0440\u0430\u0432\u043D\u0438\u0442\u044C \u043E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0435 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u043E\u0432");
  for (const [id, title, url] of styleDemoLinks) {
    const a = node("a", title);
    a.href = url + "#ag-components";
    if (id === style) a.setAttribute("aria-current", "page");
    navigation.append(a);
  }
  const status = node(
    "p",
    "\u0421\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \xB7 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044E\u0442 \u0434\u043E \u043F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B.",
    "lab-status"
  );
  status.setAttribute("role", "status");
  const tokens = node("div", void 0, "lab-tokens");
  tokens.hidden = true;
  const tokenButton = createButton({
    document: doc,
    i18n,
    label: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0442\u043E\u043A\u0435\u043D\u044B",
    variant: "quiet",
    onClick: () => {
      tokens.hidden = !tokens.hidden;
      tokenButton.setAttribute("aria-expanded", String(!tokens.hidden));
      if (tokens.hidden) return;
      tokens.replaceChildren();
      const computed = win.getComputedStyle(host);
      for (const name of [
        "--ag-accent",
        "--ag-surface",
        "--ag-text",
        "--ag-radius-control",
        "--ag-radius-panel",
        "--ag-control-height",
        "--ag-text-size"
      ]) {
        const value = computed.getPropertyValue(name).trim();
        const item = node("div");
        item.append(node("code", name), node("strong", value));
        tokens.append(item);
      }
    }
  });
  tokenButton.setAttribute("aria-expanded", "false");
  tokenButton.setAttribute("aria-controls", `lab-tokens-${++sequence6}`);
  tokens.id = tokenButton.getAttribute("aria-controls");
  const tabViews = /* @__PURE__ */ new Map();
  function gitView() {
    const view = createGitHistory2({ document: doc, commits: data.commits });
    tabViews.set("git", view);
    return view;
  }
  function taskView() {
    const view = createTaskHistory2({
      document: doc,
      i18n,
      ...data,
      onAction: ({ taskId }) => {
        if (data.events.length >= 240) {
          status.textContent = "\u041B\u0438\u043C\u0438\u0442 \u043F\u0440\u0438\u043C\u0435\u0440\u0430 \u0434\u043E\u0441\u0442\u0438\u0433\u043D\u0443\u0442. \u041F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443 \u0434\u043B\u044F \u043D\u043E\u0432\u043E\u0433\u043E \u0441\u0435\u0430\u043D\u0441\u0430.";
          return;
        }
        const task = data.tasks.find((t) => t.id === taskId), states = ["\u0417\u0430\u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043E", "\u0412 \u0440\u0430\u0431\u043E\u0442\u0435", "\u041D\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0435", "\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E"];
        task.status = states[(states.indexOf(task.status) + 1) % states.length];
        const id = `local-${++actionCount}`;
        data.events.unshift({
          id,
          taskId,
          title: "\u0421\u0442\u0430\u0442\u0443\u0441 \u0438\u0437\u043C\u0435\u043D\u0451\u043D: " + task.status,
          author: "\u0412\u044B",
          date: "\u0421\u0435\u0439\u0447\u0430\u0441 \xB7 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u0440\u0438\u043C\u0435\u0440"
        });
        view.setData(data);
        view.select(id);
        status.textContent = `${taskId}: ${task.status}. \u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u0432 \u044D\u0442\u043E\u043C \u043F\u0440\u0438\u043C\u0435\u0440\u0435.`;
      }
    });
    tabViews.set("tasks", view);
    return view;
  }
  function tableView() {
    const element = node("section", void 0, "lab-table"), selected = node(
      "p",
      "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0442\u0440\u043E\u043A\u0438 \u0434\u043B\u044F \u0433\u0440\u0443\u043F\u043F\u043E\u0432\u043E\u0433\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F.",
      "lab-status"
    );
    const rows = data.tasks.map((t) => ({
      id: t.id,
      cells: {
        id: t.id,
        title: t.title,
        status: t.status,
        owner: t.id === "DS-25" ? "\u0410\u043D\u043D\u0430 \u041A." : "\u041C\u0430\u0440\u043A \u0421."
      }
    }));
    let table;
    table = createDataTable2({
      document: doc,
      i18n,
      caption: "\u041F\u043B\u0430\u043D \u0432\u044B\u043F\u0443\u0441\u043A\u0430 \xB7 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0430\u044F \u0442\u0430\u0431\u043B\u0438\u0446\u0430",
      columns: [
        { id: "id", label: "\u0417\u0430\u0434\u0430\u0447\u0430", sortable: true },
        { id: "title", label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", sortable: true },
        { id: "status", label: "\u0421\u0442\u0430\u0442\u0443\u0441" },
        { id: "owner", label: "\u041E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439" }
      ],
      rows,
      selectable: true,
      onSelectionChange: (ids) => {
        selected.textContent = `\u0412\u044B\u0431\u0440\u0430\u043D\u043E \u0437\u0430\u0434\u0430\u0447: ${ids.length}`;
      },
      onSort: (sort) => {
        const sorted = sort ? [...rows].sort(
          (a, b) => String(a.cells[sort.columnId]).localeCompare(
            String(b.cells[sort.columnId]),
            "ru"
          ) * (sort.direction === "descending" ? -1 : 1)
        ) : [...rows];
        table.setRows(sorted);
        table.setSort(sort);
      }
    });
    element.append(table.element, selected);
    return { element, dispose: table.dispose };
  }
  function settingsView() {
    const element = node("form", void 0, "lab-form"), section = node("div", void 0, "lab-form-fields");
    section.dataset.agFormRow = "auto";
    section.classList.add("ag-form-tracks");
    const field = createField({
      document: doc,
      i18n,
      id: `lab-project-${++sequence6}`,
      label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0435\u043A\u0442\u0430",
      placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, \u043D\u043E\u0432\u0430\u044F \u0440\u0435\u0434\u0430\u043A\u0446\u0438\u044F",
      required: true,
      hint: "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u0432 \u0442\u0435\u043A\u0443\u0449\u0435\u043C \u0434\u0435\u043C\u043E-\u0441\u0435\u0430\u043D\u0441\u0435."
    });
    field.dataset.agFormField = "";
    field.querySelector(".ag-field__label").classList.add("ag-form-track__label");
    field.querySelector("input").classList.add("ag-form-track__control");
    const fieldFeedback = node("div", void 0, "ag-form-track__feedback");
    fieldFeedback.append(
      ...field.querySelectorAll(".ag-field__hint,.ag-field__error")
    );
    field.append(fieldFeedback);
    field.querySelector("input").value = "\u0420\u0435\u0434\u0438\u0437\u0430\u0439\u043D \u0440\u0430\u0431\u043E\u0447\u0435\u0433\u043E \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0430";
    const select = createSelect({
      document: doc,
      i18n,
      label: "\u0412\u0438\u0434\u0438\u043C\u043E\u0441\u0442\u044C",
      options: [
        { value: "team", label: "\u0422\u043E\u043B\u044C\u043A\u043E \u043A\u043E\u043C\u0430\u043D\u0434\u0430" },
        { value: "workspace", label: "\u0412\u0441\u0451 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E" }
      ],
      value: "team"
    });
    select.element.dataset.agFormField = "";
    select.element.querySelector("label").classList.add("ag-form-track__label");
    select.select.classList.add("ag-form-track__control");
    const selectFeedback = node("div", void 0, "ag-form-track__feedback");
    selectFeedback.append(
      ...select.element.querySelectorAll(".ag-select__hint,.ag-select__error")
    );
    select.element.append(selectFeedback);
    const progress = createProgress2({
      document: doc,
      i18n,
      label: "\u0413\u043E\u0442\u043E\u0432\u043D\u043E\u0441\u0442\u044C \u0432\u044B\u043F\u0443\u0441\u043A\u0430",
      value: 2,
      max: 3,
      description: "\u0414\u0432\u0430 \u0438\u0437 \u0442\u0440\u0451\u0445 \u044D\u0442\u0430\u043F\u043E\u0432 \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u044B \u0432 \u0441\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u043C \u043F\u043B\u0430\u043D\u0435."
    });
    const save = createButton({
      document: doc,
      i18n,
      label: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
      variant: "primary"
    });
    save.type = "submit";
    const feedback = node("p", "\u0415\u0441\u0442\u044C \u043D\u0435\u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F", "lab-status");
    feedback.setAttribute("role", "status");
    const projectInput = field.querySelector("input");
    function markUnsaved() {
      feedback.textContent = "\u0415\u0441\u0442\u044C \u043D\u0435\u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F";
    }
    projectInput.addEventListener("input", markUnsaved, {
      signal: abort.signal
    });
    select.select.addEventListener("change", markUnsaved, {
      signal: abort.signal
    });
    element.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        if (!element.reportValidity()) return;
        feedback.textContent = `\xAB${field.querySelector("input").value}\xBB \xB7 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E`;
        status.textContent = "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u044B \u0442\u043E\u043B\u044C\u043A\u043E \u0432 \u0442\u0435\u043A\u0443\u0449\u0435\u043C \u043F\u0440\u0438\u043C\u0435\u0440\u0435.";
      },
      { signal: abort.signal }
    );
    section.append(field, select.element);
    element.append(
      section,
      createStatus({
        document: doc,
        i18n,
        label: "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u0440\u043E\u0435\u043A\u0442",
        tone: "success"
      }),
      progress.element,
      save,
      feedback
    );
    return {
      element,
      dispose: () => {
        select.dispose();
        progress.dispose();
      }
    };
  }
  function markdownView() {
    const element = node("section", void 0, "lab-editor"), loading = node("p", "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430\u2026");
    element.append(loading);
    let current = null, editorToolbar = null, closed = false;
    import("../cms/editor.js").then(({ createMarkdownEditor }) => {
      if (closed || disposed) return;
      current = createMarkdownEditor({
        document: doc,
        i18n,
        label: "\u0417\u0430\u043C\u0435\u0442\u043A\u0430 \u043A \u0432\u044B\u043F\u0443\u0441\u043A\u0443",
        markdown: "# \u041F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E \u0434\u043B\u044F \u0432\u0430\u0448\u0435\u0439 \u0438\u0434\u0435\u0438\n\n\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B \u043F\u043E\u043B\u0443\u0447\u0430\u044E\u0442 \u043E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0435 \u0438\u0437 \u0442\u043E\u043A\u0435\u043D\u043E\u0432 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u0441\u0442\u0438\u043B\u044F.\n\n## \u041F\u0435\u0440\u0435\u0434 \u0432\u044B\u043F\u0443\u0441\u043A\u043E\u043C\n\n- \u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u043A\u043E\u043D\u0442\u0440\u0430\u0441\u0442\n- \u041F\u0440\u043E\u0439\u0442\u0438 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0439 \u0441 \u043A\u043B\u0430\u0432\u0438\u0430\u0442\u0443\u0440\u044B\n- \u0421\u0432\u0435\u0440\u0438\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435 \u0438 \u043F\u043E\u0434\u043F\u0438\u0441\u0438\n\n**\u0425\u043E\u0440\u043E\u0448\u0438\u0439 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441 \u043F\u043E\u043C\u043E\u0433\u0430\u0435\u0442 \u0434\u0435\u0439\u0441\u0442\u0432\u043E\u0432\u0430\u0442\u044C.**",
        mode: doc.documentElement.dataset.example === "fitness" || win.innerWidth <= 760 ? "edit" : "split",
        height: 340
      });
      element.replaceChildren(current.element);
      editorToolbar = compactDemoEditorToolbar(current, doc);
    }).catch(() => {
      if (!closed && !disposed)
        loading.textContent = "\u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D. \u041F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443 \u0434\u043B\u044F \u043F\u043E\u0432\u0442\u043E\u0440\u043D\u043E\u0439 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438.";
    });
    return {
      element,
      dispose: () => {
        closed = true;
        editorToolbar?.dispose();
        current?.dispose();
      }
    };
  }
  function revealSelectedTab() {
    const selected = host.querySelector('[role="tab"][aria-selected="true"]');
    if (selected?.getClientRects().length)
      selected.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }
  const tabs = createTabs({
    document: doc,
    i18n,
    label: "\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0435",
    value: "git",
    activation: "automatic",
    tabs: [
      {
        id: "language",
        label: "\u042F\u0437\u044B\u043A \u0438 \u0440\u0435\u0433\u0438\u043E\u043D",
        mount: () => createLocaleSettings({
          document: doc,
          runtime: localeRuntime,
          compact: true
        })
      },
      { id: "git", label: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F Git", mount: gitView },
      { id: "tasks", label: "\u0417\u0430\u0434\u0430\u0447\u0438", mount: taskView },
      { id: "table", label: "\u0422\u0430\u0431\u043B\u0438\u0446\u0430", mount: tableView, lifecycle: "destroy" },
      { id: "settings", label: "\u0424\u043E\u0440\u043C\u0430", mount: settingsView },
      { id: "markdown", label: "\u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440", mount: markdownView }
    ],
    onChange: (id) => {
      tabViews.get(id)?.refresh();
      revealSelectedTab();
    }
  });
  tabs.tablist.addEventListener("focusin", revealSelectedTab, {
    signal: abort.signal
  });
  owned.push(tabs);
  const localeShell = localizeComponent(
    { element: host, dispose() {
    } },
    "style-lab-shell",
    { i18n }
  );
  owned.push(localeShell);
  const footer = node("div", void 0, "lab-footer");
  footer.append(status, tokenButton);
  host.append(header, navigation, tabs.element, footer, tokens);
  localeShell.refreshLocale();
  function dispose() {
    if (disposed) return;
    disposed = true;
    abort.abort();
    for (const view of owned) view.dispose();
    host.replaceChildren();
  }
  return { element: host, dispose };
}
if (typeof document !== "undefined") {
  const mounted = [];
  for (const host of document.querySelectorAll("[data-ag-component-lab]"))
    mounted.push(mountComponentLab(host));
  globalThis.addEventListener("pagehide", (event) => {
    if (!event.persisted) for (const view of mounted) view.dispose();
  });
}
export {
  mountComponentLab
};

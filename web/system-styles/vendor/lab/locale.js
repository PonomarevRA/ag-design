// web/vendor/ag-design/geometry.js
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

// web/vendor/ag-design/i18n-messages.js
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

// web/vendor/ag-design/i18n.js
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
function resolveI18n(document, explicit) {
  if (explicit !== void 0) {
    if (!explicit || typeof explicit.t !== "function" || typeof explicit.subscribe !== "function")
      throw new TypeError("I18n context required");
    return explicit;
  }
  const existing = documents.get(document);
  if (existing) return existing;
  const locale = document?.documentElement?.lang || "ru";
  const context = createI18n({ locale, availableLocales: ["en", "ru"] });
  if (document) documents.set(document, context);
  return context;
}
function setDocumentI18n(document, context) {
  resolveI18n(document, context);
  const previous = documents.get(document), root = document.documentElement, lang = root.getAttribute("lang"), dir = root.getAttribute("dir");
  documents.set(document, context);
  const apply = () => {
    root.lang = context.locale;
    root.dir = context.direction;
  };
  apply();
  const off = context.subscribe(apply);
  return () => {
    off();
    if (documents.get(document) !== context) return;
    if (previous) documents.set(document, previous);
    else documents.delete(document);
    if (lang === null) root.removeAttribute("lang");
    else root.setAttribute("lang", lang);
    if (dir === null) root.removeAttribute("dir");
    else root.setAttribute("dir", dir);
  };
}
function createI18nBindings(context) {
  const bindings = /* @__PURE__ */ new Set();
  let disposed = false;
  const off = context.subscribe(() => {
    for (const binding of bindings) binding();
  });
  function bind(node2, key, params = {}, attribute = null) {
    if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED"].includes(node2.nodeName))
      throw new TypeError("Text binding requires a UI node");
    if (attribute && ![
      "title",
      "placeholder",
      "alt",
      "aria-label",
      "aria-description",
      "aria-valuetext",
      "aria-roledescription"
    ].includes(attribute))
      throw new TypeError(
        "Only non-executable UI attributes may be translated"
      );
    if (disposed) throw new Error("Bindings disposed");
    const update = () => {
      const value = context.t(
        key,
        typeof params === "function" ? params() : params
      );
      if (attribute) {
        if (node2.getAttribute(attribute) !== value)
          node2.setAttribute(attribute, value);
      } else if (node2.textContent !== value) node2.textContent = value;
    };
    bindings.add(update);
    update();
    return () => bindings.delete(update);
  }
  return {
    text: (node2, key, params) => bind(node2, key, params),
    attribute: (node2, name, key, params) => bind(node2, key, params, name),
    dispose() {
      if (disposed) return;
      disposed = true;
      off();
      bindings.clear();
    }
  };
}

// web/vendor/ag-design/button-icons.js
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
function createButtonIcon(document, name) {
  const key = Object.hasOwn(aliases, name) ? aliases[name] : name;
  if (!Object.hasOwn(paths, key)) return null;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
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
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", paths[key]);
  svg.append(path);
  return svg;
}

// web/vendor/ag-design/primitives.js
var variants = /* @__PURE__ */ new Set(["primary", "secondary", "quiet", "danger"]);
function createButton({
  document = globalThis.document,
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
  const button = document.createElement("button");
  button.type = "button";
  button.className = `ag-button ag-button--${variant}`;
  button.disabled = disabled;
  applyControlGeometry(button, { density, shape, parentRadius, inset });
  if (icon) {
    const symbol = document.createElement("span");
    symbol.className = "ag-button__icon";
    const graphic = createButtonIcon(document, icon);
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
    const text = document.createElement("span");
    text.className = "ag-nav__label";
    text.textContent = label;
    button.append(text);
  }
  if (onClick) button.addEventListener("click", onClick);
  return button;
}

// web/vendor/ag-design/color-profile.js
var contrastPolicy = Object.freeze({
  apcaWeight: 0.7,
  wcagWeight: 0.3,
  apcaVersion: "apca-w3@0.1.9",
  status: "APCA beta, advisory; WCAG2 AA is a separate gate"
});

// web/vendor/ag-design/i18n-component.js
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

// web/vendor/ag-design/motion.js
var motionPresets = Object.freeze([
  "fade-in",
  "slide-up",
  "slide-down",
  "slide-left",
  "slide-right",
  "scale-in",
  "pulse",
  "shake",
  "bounce"
]);

// web/vendor/ag-design/ascii-patterns.js
var asciiPatterns = Object.freeze(["flow", "rain", "noise"]);
var asciiAnimations = Object.freeze([
  "none",
  "wave",
  "scan",
  "reveal"
]);
var ramps = Object.freeze({
  classic: " .:-=+*#%@",
  binary: " 01",
  detailed: " .,:;irsXA253hMHGS#9B&@"
});
var defaults = Object.freeze({
  pattern: "flow",
  animation: "none",
  textEffect: "shimmer",
  textWeight: "auto",
  textGap: 3,
  textRoughness: 0.3,
  textEdgeRoughness: 0,
  charset: "classic",
  seed: 42,
  fontSize: 14,
  density: 1,
  speed: 0.6,
  fps: 18,
  maxCells: 4800
});

// web/vendor/ag-design/loading-indicator.js
var loadingVariants = Object.freeze([
  "spinner",
  "dots",
  "progress",
  "skeleton"
]);

// web/vendor/ag-design/numeric-scale.js
var PERCENTILES = Object.freeze([1, 5, 10, 30, 45, 65, 80, 90, 99, 100]);
var MAX_VALUES = 1e4;
function finite(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new TypeError(`${name} must be a finite number`);
  return value;
}
function numericValues(values, name, maximum) {
  if (!Array.isArray(values) || values.length > maximum)
    throw new TypeError(`${name} must be an array with at most ${maximum} numbers`);
  const copy = [];
  for (const value of values) copy.push(finite(value, name));
  return copy;
}
function fraction(value, low, high) {
  if (value <= low) return 0;
  if (value >= high) return 1;
  const distance = high - low;
  if (Number.isFinite(distance)) return (value - low) / distance;
  return (value / 2 - low / 2) / (high / 2 - low / 2);
}
function createNumericScale(options = {}) {
  if (!options || typeof options !== "object" || Array.isArray(options))
    throw new TypeError("Scale options must be an object");
  const { values, boundaries, min, max, maximum = 5 } = options;
  finite(maximum, "maximum");
  if (maximum <= 0) throw new RangeError("maximum must be positive");
  const hasData = values !== void 0 || boundaries !== void 0;
  const hasRange = min !== void 0 || max !== void 0;
  if (values !== void 0 && boundaries !== void 0 || hasData && hasRange)
    throw new TypeError("Choose values, boundaries, or a min/max pair");
  let method = "none", anchors = [];
  let low = null, high = null;
  if (hasData) {
    if (boundaries !== void 0) {
      anchors = numericValues(boundaries, "boundaries", PERCENTILES.length);
      if (anchors.length !== PERCENTILES.length)
        throw new RangeError("boundaries must contain the ten percentile anchors");
      for (let index = 1; index < anchors.length; index++) {
        if (anchors[index] < anchors[index - 1])
          throw new RangeError("boundaries must be nondecreasing");
      }
    } else {
      const ordered = numericValues(values, "values", MAX_VALUES);
      ordered.sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
      if (ordered.length) {
        for (const percentile of PERCENTILES)
          anchors.push(ordered[Math.max(0, Math.ceil(percentile * ordered.length / 100) - 1)]);
      }
    }
    if (anchors.length) {
      method = "percentile";
      low = anchors[0];
      high = anchors[anchors.length - 1];
    }
  } else if (hasRange) {
    low = finite(min, "min");
    high = finite(max, "max");
    if (high < low) throw new RangeError("max must be at least min");
    method = "linear";
  }
  const frozenAnchors = Object.freeze(anchors);
  function evaluate(value) {
    finite(value, "value");
    if (method === "none") return Object.freeze({ value, score: null, ratio: null });
    let ratio = 0;
    if (high !== low) {
      if (method === "linear" || value <= low || value >= high) {
        ratio = fraction(value, low, high);
      } else {
        let lower = 0;
        while (lower + 1 < frozenAnchors.length && value >= frozenAnchors[lower + 1]) lower++;
        const local = fraction(value, frozenAnchors[lower], frozenAnchors[lower + 1]);
        ratio = (lower + local) / (frozenAnchors.length - 1);
      }
    }
    return Object.freeze({ value, score: maximum * ratio, ratio });
  }
  return Object.freeze({ method, min: low, max: high, maximum, boundaries: frozenAnchors, evaluate });
}

// web/vendor/ag-design/numeric-badge.js
var UNKNOWN_SCALE = createNumericScale();

// web/vendor/ag-design/select.js
var sequence = 0;
function createSelect({
  document = globalThis.document,
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
  const text = (item, maximum) => typeof item === "string" && item.length <= maximum;
  if (!text(label, 180) || !label.trim() || !Array.isArray(options) || options.length > 500 || !text(hint, 2048) || !text(error, 2048) || placeholder !== void 0 && !text(placeholder, 180) || typeof disabled !== "boolean" || typeof required !== "boolean" || onChange !== void 0 && typeof onChange !== "function")
    throw new TypeError("A labelled bounded native select is required");
  const known = /* @__PURE__ */ new Map();
  for (const item of options) {
    if (!item || !text(item.value, 80) || !item.value || known.has(item.value) || !text(item.label, 180) || !item.label.trim() || item.disabled !== void 0 && typeof item.disabled !== "boolean" || item.group !== void 0 && (!text(item.group, 180) || !item.group.trim()))
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
  const element = document.createElement("div"), title = document.createElement("label"), select = document.createElement("select"), hintElement = document.createElement("span"), errorElement = document.createElement("span");
  element.className = "ag-select";
  select.className = "ag-select__control";
  select.id = `ag-select-${++sequence}`;
  title.htmlFor = select.id;
  title.textContent = label;
  hintElement.id = `${select.id}-hint`;
  hintElement.className = "ag-select__hint";
  hintElement.textContent = hint;
  errorElement.id = `${select.id}-error`;
  errorElement.className = "ag-select__error";
  errorElement.setAttribute("aria-live", "polite");
  if (placeholder !== void 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = placeholder;
    select.append(option);
  }
  let group = null, groupName = null;
  for (const item of options) {
    if (item.group !== groupName) {
      groupName = item.group;
      group = item.group ? document.createElement("optgroup") : null;
      if (group) {
        group.label = item.group;
        select.append(group);
      }
    }
    const option = document.createElement("option");
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
    if (!text(next, 2048))
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
  document.addEventListener("reset", reset, true);
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
        document.removeEventListener("reset", reset, true);
        onChange = void 0;
        restoreGeometry();
      }
    }
  };
}

// web/vendor/ag-design/masonry-layout.js
var defaults2 = Object.freeze({
  minColumnWidth: 280,
  columns: "auto",
  gap: 16,
  rowHeight: 4
});

// web/vendor/ag-design/data-grid-model.js
var GRID_LIMITS = Object.freeze({ columns: 1e3, rows: 1e5, cells: 1e6, text: 4096, selection: 1e4, windowCells: 16384, logicalRows: 1e9 });
var FILTER_OPERATORS = Object.freeze(["eq", "neq", "contains", "notContains", "startsWith", "notStartsWith", "endsWith", "notEndsWith", "lt", "lte", "gt", "gte", "between", "in", "empty", "notEmpty"]);

// web/vendor/ag-design/data-grid-source.js
var collator = new Intl.Collator(void 0, { sensitivity: "base" });

// web/vendor/ag-design/code-viewer-model.js
var CODE_VIEWER_LIMITS = Object.freeze({
  bytes: 1048576,
  lines: 1e5,
  lineLength: 2e4
});

// web/vendor/ag-design/code-viewer-theme.js
var CODE_VIEWER_HIGHLIGHT_FILL = Object.freeze({
  accentRatio: 0.04,
  coverage: 1
});

// web/vendor/ag-design/markdown-parser.js
var Lt = Object.defineProperty;
var Ie = (e, t) => {
  for (var n in t) Lt(e, n, { get: t[n], enumerable: true });
};
var de = {};
Ie(de, { decode: () => X, encode: () => P, format: () => Z, parse: () => H });
var Se = {};
function Jt(e) {
  let t = Se[e];
  if (t) return t;
  t = Se[e] = [];
  for (let n = 0; n < 128; n++) {
    let s = String.fromCharCode(n);
    t.push(s);
  }
  for (let n = 0; n < e.length; n++) {
    let s = e.charCodeAt(n);
    t[s] = "%" + ("0" + s.toString(16).toUpperCase()).slice(-2);
  }
  return t;
}
function re(e, t) {
  typeof t != "string" && (t = re.defaultChars);
  let n = Jt(t);
  return e.replace(/(%[a-f0-9]{2})+/gi, function(s) {
    let r = "";
    for (let i = 0, o = s.length; i < o; i += 3) {
      let u = parseInt(s.slice(i + 1, i + 3), 16);
      if (u < 128) {
        r += n[u];
        continue;
      }
      if ((u & 224) === 192 && i + 3 < o) {
        let c = parseInt(s.slice(i + 4, i + 6), 16);
        if ((c & 192) === 128) {
          let a = u << 6 & 1984 | c & 63;
          a < 128 ? r += "\uFFFD\uFFFD" : r += String.fromCharCode(a), i += 3;
          continue;
        }
      }
      if ((u & 240) === 224 && i + 6 < o) {
        let c = parseInt(s.slice(i + 4, i + 6), 16), a = parseInt(s.slice(i + 7, i + 9), 16);
        if ((c & 192) === 128 && (a & 192) === 128) {
          let f = u << 12 & 61440 | c << 6 & 4032 | a & 63;
          f < 2048 || f >= 55296 && f <= 57343 ? r += "\uFFFD\uFFFD\uFFFD" : r += String.fromCharCode(f), i += 6;
          continue;
        }
      }
      if ((u & 248) === 240 && i + 9 < o) {
        let c = parseInt(s.slice(i + 4, i + 6), 16), a = parseInt(s.slice(i + 7, i + 9), 16), f = parseInt(s.slice(i + 10, i + 12), 16);
        if ((c & 192) === 128 && (a & 192) === 128 && (f & 192) === 128) {
          let h = u << 18 & 1835008 | c << 12 & 258048 | a << 6 & 4032 | f & 63;
          h < 65536 || h > 1114111 ? r += "\uFFFD\uFFFD\uFFFD\uFFFD" : (h -= 65536, r += String.fromCharCode(55296 + (h >> 10), 56320 + (h & 1023))), i += 9;
          continue;
        }
      }
      r += "\uFFFD";
    }
    return r;
  });
}
re.defaultChars = ";/?:@&=+$,#";
re.componentChars = "";
var X = re;
var ze = {};
function Nt(e) {
  let t = ze[e];
  if (t) return t;
  t = ze[e] = [];
  for (let n = 0; n < 128; n++) {
    let s = String.fromCharCode(n);
    /^[0-9a-z]$/i.test(s) ? t.push(s) : t.push("%" + ("0" + n.toString(16).toUpperCase()).slice(-2));
  }
  for (let n = 0; n < e.length; n++) t[e.charCodeAt(n)] = e[n];
  return t;
}
function ie(e, t, n) {
  typeof t != "string" && (n = t, t = ie.defaultChars), typeof n > "u" && (n = true);
  let s = Nt(t), r = "";
  for (let i = 0, o = e.length; i < o; i++) {
    let u = e.charCodeAt(i);
    if (n && u === 37 && i + 2 < o && /^[0-9a-f]{2}$/i.test(e.slice(i + 1, i + 3))) {
      r += e.slice(i, i + 3), i += 2;
      continue;
    }
    if (u < 128) {
      r += s[u];
      continue;
    }
    if (u >= 55296 && u <= 57343) {
      if (u >= 55296 && u <= 56319 && i + 1 < o) {
        let c = e.charCodeAt(i + 1);
        if (c >= 56320 && c <= 57343) {
          r += encodeURIComponent(e[i] + e[i + 1]), i++;
          continue;
        }
      }
      r += "%EF%BF%BD";
      continue;
    }
    r += encodeURIComponent(e[i]);
  }
  return r;
}
ie.defaultChars = ";/?:@&=+$,-_.!~*'()#";
ie.componentChars = "-_.!~*'()";
var P = ie;
function Z(e) {
  let t = "";
  return t += e.protocol || "", t += e.slashes ? "//" : "", t += e.auth ? e.auth + "@" : "", e.hostname && e.hostname.indexOf(":") !== -1 ? t += "[" + e.hostname + "]" : t += e.hostname || "", t += e.port ? ":" + e.port : "", t += e.pathname || "", t += e.search || "", t += e.hash || "", t;
}
function se() {
  this.protocol = null, this.slashes = null, this.auth = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.pathname = null;
}
var Pt = /^([a-z0-9.+-]+:)/i;
var Ot = /:[0-9]*$/;
var Ut = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/;
var Wt = ["<", ">", '"', "`", " ", "\r", `
`, "	"];
var qt = ["{", "}", "|", "\\", "^", "`"].concat(Wt);
var Zt = ["'"].concat(qt);
var Me = ["%", "/", "?", ";", "#"].concat(Zt);
var je = ["/", "?", "#"];
var $t = 255;
var Le = /^[+a-z0-9A-Z_-]{0,63}$/;
var Xt = /^([+a-z0-9A-Z_-]{0,63})(.*)$/;
var Je = { javascript: true, "javascript:": true };
var Ne = { http: true, https: true, ftp: true, gopher: true, file: true, "http:": true, "https:": true, "ftp:": true, "gopher:": true, "file:": true };
function Ht(e, t) {
  if (e && e instanceof se) return e;
  let n = new se();
  return n.parse(e, t), n;
}
se.prototype.parse = function(e, t) {
  let n, s, r, i = e;
  if (i = i.trim(), !t && e.split("#").length === 1) {
    let a = Ut.exec(i);
    if (a) return this.pathname = a[1], a[2] && (this.search = a[2]), this;
  }
  let o = Pt.exec(i);
  if (o && (o = o[0], n = o.toLowerCase(), this.protocol = o, i = i.substr(o.length)), (t || o || i.match(/^\/\/[^@\/]+@[^@\/]+/)) && (r = i.substr(0, 2) === "//", r && !(o && Je[o]) && (i = i.substr(2), this.slashes = true)), !Je[o] && (r || o && !Ne[o])) {
    let a = -1;
    for (let l = 0; l < je.length; l++) s = i.indexOf(je[l]), s !== -1 && (a === -1 || s < a) && (a = s);
    let f, h;
    a === -1 ? h = i.lastIndexOf("@") : h = i.lastIndexOf("@", a), h !== -1 && (f = i.slice(0, h), i = i.slice(h + 1), this.auth = f), a = -1;
    for (let l = 0; l < Me.length; l++) s = i.indexOf(Me[l]), s !== -1 && (a === -1 || s < a) && (a = s);
    a === -1 && (a = i.length), i[a - 1] === ":" && a--;
    let p = i.slice(0, a);
    i = i.slice(a), this.parseHost(p), this.hostname = this.hostname || "";
    let d = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
    if (!d) {
      let l = this.hostname.split(/\./);
      for (let D = 0, _ = l.length; D < _; D++) {
        let x = l[D];
        if (x && !x.match(Le)) {
          let b = "";
          for (let g = 0, m = x.length; g < m; g++) x.charCodeAt(g) > 127 ? b += "x" : b += x[g];
          if (!b.match(Le)) {
            let g = l.slice(0, D), m = l.slice(D + 1), R = x.match(Xt);
            R && (g.push(R[1]), m.unshift(R[2])), m.length && (i = m.join(".") + i), this.hostname = g.join(".");
            break;
          }
        }
      }
    }
    this.hostname.length > $t && (this.hostname = ""), d && (this.hostname = this.hostname.substr(1, this.hostname.length - 2));
  }
  let u = i.indexOf("#");
  u !== -1 && (this.hash = i.substr(u), i = i.slice(0, u));
  let c = i.indexOf("?");
  return c !== -1 && (this.search = i.substr(c), i = i.slice(0, c)), i && (this.pathname = i), Ne[n] && this.hostname && !this.pathname && (this.pathname = ""), this;
};
se.prototype.parseHost = function(e) {
  let t = Ot.exec(e);
  t && (t = t[0], t !== ":" && (this.port = t.substr(1)), e = e.substr(0, e.length - t.length)), e && (this.hostname = e);
};
var H = Ht;
var ke = {};
Ie(ke, { Any: () => pe, Cc: () => me, Cf: () => Yt, P: () => Y, S: () => _e, Z: () => ge });
var pe = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var me = /[\0-\x1F\x7F-\x9F]/;
var Yt = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/;
var Y = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B4E\u1B4F\u1B5A-\u1B60\u1B7D-\u1B7F\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDD6E\uDEAD\uDED0\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9\uDFD4\uDFD5\uDFD7\uDFD8]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09\uDFE1]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDD6D-\uDD6F\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD839\uDDFF|\uD83A[\uDD5E\uDD5F]/;
var _e = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C1\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2429\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E5\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD803[\uDD8E\uDD8F\uDED1-\uDED8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDC00-\uDCEF\uDCFA-\uDCFC\uDD00-\uDEB3\uDEBA-\uDED0\uDEE0-\uDEF0\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED8\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0-\uDCBB\uDCC0\uDCC1\uDCD0-\uDCD8\uDD00-\uDE57\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF-\uDEF8\uDF00-\uDF92\uDF94-\uDFEF\uDFFA]/;
var ge = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;
var Gt = [8364, 0, 8218, 402, 8222, 8230, 8224, 8225, 710, 8240, 352, 8249, 338, 0, 381, 0, 0, 8216, 8217, 8220, 8221, 8226, 8211, 8212, 732, 8482, 353, 8250, 339, 0, 382, 376];
function Kt(e) {
  return e === 0 || e >= 55296 && e <= 57343 || e > 1114111;
}
function Pe(e) {
  return Kt(e) ? 65533 : e >= 128 && e <= 159 && Gt[e - 128] || e;
}
function Oe(e) {
  return e - 1 >>> 0 < 127 || e - 160 >>> 0 < 55136 ? String.fromCharCode(e) : String.fromCodePoint(Pe(e));
}
var j = (() => {
  let e = new Uint8Array(127), t = 0;
  for (let n = 33; n <= 126; n++) n !== 34 && n !== 36 && n !== 92 && (e[n] = t++);
  return e;
})();
function Ue(e, t, n, s, r, i) {
  let u = e.length, c = i * 90, a = 0, f = () => {
    let A = j[e.charCodeAt(a++)];
    return A < i ? A : A * 91 - c + j[e.charCodeAt(a++)];
  }, h = n - s, p = n + r, d = new Int32Array(p);
  d.fill(-1, s, i), d.fill(-1, i + h, p);
  let l = new Int32Array(p), D = new Int32Array(p);
  function _(A, B) {
    let w = 0, T = B, M = B + A;
    for (; T < M; ) {
      let z = j[e.charCodeAt(a++)];
      if (z < 89) w += z, d[T++] = w;
      else if (z === 89) {
        let S = j[e.charCodeAt(a++)] + 2;
        for (; S--; ) d[T++] = ++w;
      } else {
        let S = j[e.charCodeAt(a++)];
        w += 89 + (S < 90 ? S * 91 + j[e.charCodeAt(a++)] : j[e.charCodeAt(a++)] * 8281 + j[e.charCodeAt(a++)] * 91 + j[e.charCodeAt(a++)]), d[T++] = w;
      }
    }
  }
  _(s, 0), _(h, i);
  let x = new Int32Array(r * 2), b = 0, g = 0;
  function m(A, B) {
    for (let w = 0; w < A; w++) {
      let T = B + w, M = f(), z = f();
      x[g * 2] = M, x[g * 2 + 1] = z, g += 1, l[T] = b;
      let S = (d[M] < 0 ? D[M] : 1) + (d[z] < 0 ? D[z] : 1);
      D[T] = S, b += S;
    }
  }
  m(r - i + s, i + h), m(i - s, s);
  let R = new Uint16Array(b), C = 0;
  for (let A = 0; A < g; A++) for (let B = 0; B < 2; B++) {
    let w = x[A * 2 + B], T = d[w];
    if (T < 0) {
      let M = l[w], z = M + D[w];
      for (; M < z; ) R[C++] = R[M++];
    } else R[C++] = T;
  }
  let v = new Uint16Array(t), F = 0;
  for (; a < u; ) {
    let A = j[e.charCodeAt(a++)];
    A >= i && (A = A * 91 - c + j[e.charCodeAt(a++)]);
    let B = d[A];
    if (B < 0) {
      let w = l[A], T = w + D[A];
      for (; w < T; ) v[F++] = R[w++];
    } else v[F++] = B;
  }
  return v;
}
var We = Ue("!}.&u%}'&}*'~!6*)%&,~!J~!J~%L~y<~!R,~~%Lu~~#GD~~#|)1#%}^%}2%+#.##%##%}&%##%'#%##&%#%#'%#&#%#&#'#%%#&#%##%#)%''%&%#%#'%#%%#%%}%%%#%#&(23#%%#&-%0%('1#(##%#'##+%'*.:1}#%#6-+(%'%%#%%%}#L'2351&('%}&/N'(0(/*-%(%%}#'+&T%7.2}#&%&#%#36/5##%&%%#&#%%#))2%%##%&&'0~!#*+&'%1~!%).'3q?&%'1~!.##%6(~!+%%%(Gw'rT~!E#<nA%#jZ~!H%(~!42##~!*31&~!G%U~#)5~#`3~!J~!Z~%]~%Y~%C~!q~!u~#kz~%#~!6'~!D~!U~!?~#T~!c%~!G#'~%7|~!G~!J~!G&~#pb~(Df}#%}*&}#%##%##%##&#-}&'#'&%#.++}%mI,#,@&(}*%}*'%&##&#%##%}&0}#.},U},%}+%}&%}#%##&}B%(}(%}+%)})%##%#&}&%##%&}<%}>%#%&}*%}(%}9%}/%})%}*%}*%}?&}&%}3%}&*#%})%#%#)}#&#-#+*%E%%'%'#%}#*V##&##I}#&&##%&%#&&Qf%%))w/0+&%#(#.%-''''++++7}>%4'',##1,#%#&%##&#'##&#*#9)%&%}#*}%,#+P(%A&%#'&##wSD',9E00#y#@}(+}&%&>~!#~!X}#*}(&&}(&}(,%}%&#+&}#&}I%#%}%)#(},'%#*}4%%#%}(''}#/##(##),%-##%%)#&}(.}&%#&}%%}*&#%},&&}&%}#%*'#%})%}D&}&%}-&}6&#&}-,%}#%})-(~+`~,=?~I9'9%~!,#%})%})%}@%}?%}(~!?~#<~#pP~#BG~#=1#%K+~#?#~%;)~#A~#mF1~#A'~'X%'~#lR~#N~'N~#r~#m#-~#i'?%#'%~#B%##%,%#~#_%#0%~#]732~,w~2+#:&#%&'0%&>%}#>##F+)#%&&#(+_}4&}-%}(&}@&}O7Fdf0@+/v4}&WU##&/0#&'('B#%}.%}'+#%}#%%&#&%#%##+#&#)#6#'#.},%}c%},%#%##%&#&%#&~#>'*-.%##%##%}#%%}%'~#)D1}#%*&~#_%%'(~#S2%'.}#~#=##*'*-%}&'%'##&&~'E%.#&~#M4}%%##&'%#~#O1##%&#'+~#<B%##%%'%+~#;#@%}#&%#&&%#(~#H1}'%'##&&~#?A}&'~#D#%32}'&&&&~#[}'(#%}'~#;C})&}%%#%~#=&%,3}%'(#%%~#^'#&&)#%'~#Y%-~#d-%'~#^%%&#&&&}#~#b~2t*&'~&(~&@~0%~e~3}%*''0})&}+~!9##-}#%-hD*)1fC#%/&/fB#40~!+#)*4~!+~!K'&:~!/*7~!.#~!H~!L':~%x&~!H#~!*~%1~!I#~!+A~#p'~!F~~#-#~,,(~.Z~!V~%;'B'mq-W~!N~%I%#&&#&}#%},%%}'%}+X#%}#&}(%}'%}<%}#%}%%'}'%}:~![)9@~%>~#UA%-%##&~!C%~!-.9:~!1~!-^2/:a~!y,D*J#-5)/4~%23,~#G~!L1~!0X3`~!2+~!!0-~&E~!W~!o,>Y&]~%cZx_&~#O*9#A#'#+I'%#)~!0B*-5A+-((F&*M#)(-7-5+'-3a5Vi~!Y~!?+[)%3),ERHm~!+:D,VG.+)?fB%%*(%)'(#&80%1'8`K8?`+'Z#&O&'H5#*9)A%%5&3))0%39+.*7#()&&*=4@**L)<'_&*+..;(#*+)./&0#3)%')-8(4ixD(&.}%,('aI:,)%,k2231T)I'#/-W7,/'Q#.'Y24+h')37</31&83##&0#),H(?'&?/1##%#&&#%''-%&&&#(&''&#.-'%#%%(,')*'&#&#'##%(%(#%('#&##%%%%('%#%#%%#%#&%##h>w+v<ayvyvcg.uuhKr}g/v|g>u9i[~>g5uI~=RvdwEg;v/g;uk!!TTSx]@RT!U!#!@VBRUU!'UTe-d0c`e&gSdicedFcrdTaqb.kYcAohdYd@a3e+d}dMdtd.aJ#bqcK`dle/e.e'dwdPdodddjbEb}ogd^ofdpduc6j?l%d{drdqc)d7bacOdQ%T#Y)X.sR[yH>6Vyv3[xwLu>vo'!*.[yBacahoj>6Rew3[xqdZa#!a&#^(X-[yG>6Vyu3[xvg3sEr|g.u/Ri9db0T#^(Xa)!-[y;>6Vylg4wKs{JwNZt3@3r=c4Z([xlg;wKt!cpq's@v7A'*a(a+!-a#[y<3Dt?3Dt'>6Vym3[xmg9rxsNJwLZt4~?r?db1T#`-!(Xa,!0[yS>6Vz%NuQs.g4wKtnJwNZtS@3r>c4Z([y%g;wKtrdga8!a(!#&T*Y-Xa#!a0<or[yc3Dtq>6Vz43[y3JwNZtf@3s!Ju}!%Dti:pm3c_%X#tjB5pkd6q!r]u?voC'*-a.a2!0a&a+[yI3DtI3Ds~3DtH>6Vyw3[xx;:s#~<5pKJwNZtE@3r~d`a)!a2T#a.(!+U.X1[yT3Dt`3Dtv>6Vz&3[y&g9rxwzcxstPu.<rAJwLZtT~?r@dZa%!a.&^*Za(/Reu[ya>6Vz23[y1g3sEr}wkg{NuQRg{ci(U#5@b`~,cg#U(2WnH5wugcRh7dX#T(Y,a'Ta!!a,[yZ<]mj>6Vz,3[y+Pv#5ReZKu+=,%!H}7ABwkaS?Rh:BcW(X#<]mrj:ubv/ARekdg%!(!a.*Ta(Y.X1!#sP>Rl*Dt6[y>>6Vyo3Wf*jOvuumvuRgRJuq*!:9<B@bX~3jVv&v@s@5Re[d/rQt{uAvo&a&a*)a2!,0Wf!3Dt0=Bs'>6Re}3[xy~<5s%JwJZt1~Gs)c;&!#2sJkNuXvzq7rxu,Re8dka4!a8(aEZ+a@Y.X1Xa)[yd=Bs(3DtP>6Vz53[y4cX#X&Re:avRe9~<5s&JwJZtQ~Gs*i^rzvdRg+Jv{%!2sbB@bX}kdga,!Za?&^*T1/!a'Dt+[y6>6Vyf3Wf%g/u;s4hGu6?Rh-JvZ,!c%#&RoX54Rivj7uyvf8RgTKvZB%*!2sGh<vu5Rgq<=C::9bb~#dZ#T&Ta6Y.X*Dt>[y93Wf)coZ(T,6VyifluvRgC@95@B@bX~/hFu34cC#T,k/unq8w8Q5RkUklwQuzunq8w8Q5Rk8d/rJu?v8w9)-&!a0a;a&aIWejg3sEr/h1s<DtDJvyZqY5aws3Jvy!&Wei~Hr1:au5@Bag>23E~5c:Z&bX};kKv?w&unuVu5Rjc;>bs)#~@:Rh.=ay<a]C;b`}Vd6s/t{uAvoaxa()!a,a7%-a#a2Dt,[yF2Wo[>6Vyt3[xuNuPRi&NuPwpi#RoWh?vf8Ri%Jv]!%Ri:KvxD!.'2WeAjZu`q9rxu,Re7woeAg-unLq(qA_/*2Wg_g3u5q^9:4E}/jTrxrzv=Wkkd~0UX#^^Xa-a1a5T&a=U1a'*aEa]!a*aPaA-adok[y54Rn>;:p3~Dp5g9rpsFNvZqjg3uJp4~<5p0Pw;5qlJwNZt*@3p1Pw:5p/Ou!5p2JvG'!6Vye=<qnJvh_[xhg3v,Rh3kOwOw-sDuev/Re^dha[a%!%!a+#Ta7)-5TaCaO!aka!a)sf[yb2>Rl!9ARiq5E}Qg=ucRkBE|oJrJ_@Wk~@Wk{JrJ_@Wk|@WkyJrJ_@Wk}@WkzJvO_[y2g-vMRmiKuYC!)&>Ri;>Ri<@3RkNc](X#@9Rk=g5vuRmhKvDB!+'=]meg3u4Rmgd)#Y'Vz3CARmfd`a+!%T'!+#Ta1Ta6TaM-sTDt9[yA9sYd'%Y#s[[xpj:ueunaXRgEjRq,v-vuqdd2'`#6Rev<32@5>:2<E}5xIo9a*X#Y(;5RePJvD_g>vyRgNj8w)v8<wggs:RgXiZt|vjx,hSq3ah!-(~@:Ro/Ou!5RhWj^v(pyw8unRhUdx-UY#^Ua.a3a70!)%UX1TaDa)'omRiRRhE[y:3Dsz=Br,>6Vyj3[xkg6ruwjcqsrPw;5r*Ku]D'Zt-@3r(~?r.i[vwv]dU1a--U#`a4(g/vsRhPOu!5RhLj:rmu9Wo!~@:wdh@g/vsRiTjXuvvNr}:RhBj^v(pyw8unRn]dz1UYa'a+^Y(!aETZalaRY.Ta?a4[yDJw1!#qLsW>6Vyrfzq-pLflpwRe|Js>%!Dt@3Dt&Jvy_[xs~HrnjMuwpsw'RecKu+D#'!t<~Grl~?rjg5u-x,gwp{ah!-(~@:Rg~Ou!5Rh'jXuvvNr}:Rh#cW#X/c;&!#2sLi[v7u7RgpJv)(!iLrxu,Re6j7v@s@5Se[e7d`aW!Za(a`T.a#!a3!&aDa-!9)Dt_=6s+3[x~~DR|h~DS6avhGun5RkZj3w)v-]mkKunB!&*]kb97R|i<ARk<c:Z(6Vy}Juh'!wziMRoS:F|vkLuauJv5vtvQRh1d='T+Y#VyO~DR|jcF#T'7R|g97R|kJv3'!ay<Rj,Jvh&!:ReXcsa6*a+#a#_aIRf9aLRf?c,Z&Rf5Rf7c.Z&Rf;Rf>cQ#%T'p-Rf8Rf=ct#%'(*!,p,Rf4p+Rf6Rf:Rf<d~'Ua%U*^UYa(!a,-!#a4YaTalaEX0a8a<Weo3Dt/3Dsx=Br93Wen~Dr;~<5p<JwNZt2@3p=Pw:5p;Ou!5r3c7&!#:p>3Ds}KvGB)_6Vyk2sM=<r7x'eovA(!hFu1ARf}cV#X&@r5j6rvwQa^Rf3c=Za'wkghJv__g;unRggA53B9=b^}%j6uduo5Jq;!(hIv%2Re`Ou4ARe_e%a#^^^Xa&!a*a2!&a6YaP!*ad!#a:aE/5Rn?[y@>6Vyp;:pE~DrY~<5pBJwNZt8@3pCh=rt3rWPw:5pAJup_[xoNuPpF9c!#'45pD5ARn)d8#X'X*3@rU72s]h>v<<sSjJpqvewOJq/(!hNw'5ReBk0s2u3w/w'5ReE5@Jq.!a+JQ!&WeU23d(#Y&RjG5]jBk!u7w&u0udARjEe#+^^^Ub#!a2/a`Z(agT1!a-a;|@TaG!aS[yV=Re~fow'RguNuPRe?bz#'>RoUWeL>:Cbb|?JwPZtVg6ruRmzJvD'!6Vz(g/vmRh~Jvy_[y(g9voRgyx*cy(#2>Ri2B9b]~9kIw9u7rluJu3Rg]dI#a%UY'@=p%CAx.gQZ&RhwwygtRm{x5g_Z'+ABqR9Woa=Bp&dV#^*Xa'!&@o{g4v]Rk;Jv{!%Rk[wkkiA5RkiwwfUB=x,fUuqC&*!>RfTg8v0RfV~ARfSd;rJsAuAv9wR'ae+/aO!a@aza/a#[yQ@Wg!2Wemg3sEr0JvB_g>uvReWg2v+Re=KupB_+[y!2AbY~-~Hr2AJwD!(h<~El>h<~El?Kun@+_:9b`}Kg-v/Ri3g;vtwyk_9]k_d=&T#*U.6qh@Ab`|K9:H|CJv[!&3Dtex'fDwC%!Rf[9WlMd[(^X,!a%Z06Vz!@WgBg=v~Rgvg,QRe@awd,#Y+jTv|Q~EfWj]uNr|~FRfXdy#Y&^Ua%!aO.!(a)Ua;=!a@aKap!a-,a!Ta]a[rSa]p?[y82sK=Bq~;:p:~<5p8Pw:5p7d'#Y'Wf(;RnRi[u4w&RgJJvG'!6Vyh=<r#ijuuv/sIKuYD'ZtG@3p9~Gr&d2#`(g<vtRgFj`u5w&rqpxRf2CJuY!+:wfnTOu!5Rg}jNs1ucv&RfwJvA!&3@q|BDcC#T,k/unq8w8Q5RkTklwQuzunq8w8Q5Rk9dga#!a'!a=#a0!:+Tb*b@aO.a4!aba8aFJv^}?!VyR~Dr<g;u%Rn.~<5p[x'e`wNZtR@3p]Pw:5pZhNvjBp.woe_g5u-r4JwF!%DtO3:ooc7&!#:p^3DtpLuGw(!+%)Dtk6Vz#2sd=<r8d'#Y([y#<x3gJt`w@!)%}MRiowzikRij=]ilxAf3,U(#B2Rf#g0v-Rm[ck{`U#]giKv3>)!&6Ri154s,KuGB_%@r68r:dJ|t`#X(9<E|u2@H|rx3gJu?w'!+'1Nu7Reg4=H~+9<wxgY95Rm]xLggZ-`(X}U2:Ri4h<uOawRmsJv__5@bb{jbV~3dka#a'a]!,#a+U=a>b6a3b%!/aKa/)!arwve^VyJ;:pR~DpTg3uJpS~<5pOPw;5qmPw:5pNOu!5pQJvG'!6Vyx=<qoJvA!{~Jup!%@qk7Rn/KvyD!}''[xz;>wkh'?Rh,x8gyt`w5D!&),(SgyccRgztJ@3pPB5p#d'(Y#<]mmifubw&RgoJvE&!82s^JvF&!8Rf,ADb]~;x=h'rNu]vK!,%'*0RnORh)4Rh*AqQg-vaRnNg;wHwkh'ba~4cE#Ta*x3gctyw@'!+%RnFRnD<4Rn@hFvK5RnCxWg[#`&a0Ua()`1Rm75Rg[c]%X#qi8Rg^NvdRj>BwzgZauwji7Rm6A4wgg]d1#&(*,.0a#Rm;Rm<Rm=Rm>Rm?Rm@RmARmBe%#^^^Xaea?aC/b+(,!a+a#!a/!>a&Ta<aKbD!2wphBRnk[yPw}hE|.=Br-3Dtm>6Vy~g6urRf.x,hPrNav!%'RnqRo%Ro#Nu;q[Pw;5r+JwNZtM@3r)d'#Y'Weh;xChL#`&RnmRnoKu}>%(!Rne~Bs-;2wjcussJv+'!aYSO}6@B<5?ba~8LrNvj!.%*ROwungw~ng~:9;Ri^>wtnig;wHRnixDh@|(UZ.x1h@|)!#:2<H|*xHn]#-UX'3Ro)z=iT}6ARns=Bwsn_wpnaRncw]aR(#UXa&Ua*a/=]iPd'#Y&Ro'WnXf{QRm2hNvj]nZd`'T~&1`{|`#9b]{}c:'!#Wl{>@=be}]?cl{{U#:5Abb}Jds#^YaF!a*b4a#a3aPa>&Tb!bH!*a_!Eau?/a&RjY<]gj>6Vz*;:pe~DrZg,QRj1JwNZtX@wihspcJvZ&!VyX9WmOJu|!|N2WmHJvh&!]ht~Bpbcn&T(!#RmQ<s7Nu;padH#X'`+WmJ@>RmKCARhnKup=!)&Wf+:RhqNuPpf9c!#'45pd5AwghpARn(Ls@w!%,)!RmP@Wfe<E|IJva!&WmNg8vsRmLd`*.`#Y'Xa!axRn*]hrA8Rhug5s@rXg8u!RmMd8#X'X*3@rV72smdI*#UY&RmICARho~GsgxVgd)Ta'U-Y&Xa!T#RnEWnA@Wffg1uDRi0hFvK5RnBxGnG&#`%owp)@wsf+bX}Ze-*1!a*^^^Ua|!#a.aq&Ya2!a>.a6!a:aO`aJDtL[y`@Wg#>6Vz12@wzoYRoZNuPRi!NuPRhzg=ucRi,@=b`{Yg=ucRi-ACJvB!&Sh[ebSh]ebi`wUuFRm4Jw2_[y0JvB!.<Ju(!&SoG}6Shd}6<Ju(!&SoH}6She}6Kur@._g5vHRieJvx!{L2G{Kx6gd'T#?Rh82Wi5cZ#X(g1w)Rm5dW-Y(Ta#!a)!#aYa=wnfE=su2>>bU{0j9udv:<svj8uQv-7RgHdE%#^'sq9sp=>Bb_{TJv`!&g/r|snj6v(us5d,#Y(56H}[978H}]Jw5!&g1rushJvB!+j;v{u5?zDhd}6}bj;v{u5?zDhe}6}ce*#`(^^^a[aea!=!a6a*aoXb1a.!aAbL!b>,b'aL!aV@Wf|2Wlg3[y/JwNZt^@3piPw:5pgJunZou3@rsJva&!Vy_g<v~Rm#JvG'!6Vz0=<r{Ju{%!:pj@WfsiXuJu3Rm:JvZ&!WfA~Bph@c4Z&Dtwax5rubx(#:awRk1@d,#Y&RfjRfid1#,Y(@Wfp2Wlrg5s@ryKu[@!,'=]ig9wlk?Rk>g5u-rqJvy'!@9RkQcH(T#=>Ri~@<wkj(Wj(KuZB*!&<7rw@9RkRcH(T#=>Ri}@<wkj)Wj)dg(Ta2Xa9X#`-!a*CARhg@@=I}d9x;c~#X%so=<sj>2@@=aybb}XjWv0Q~EfEj3vLv;<d,#Y(56H}`978H}_dgaPaFa'a/!#a3Y0a_a;a|!1(a7-[yE3[xt;:pJNvZrrg3uJrvJwNZt=@3pIh=rt3rxPw:5pGOu!5rpJvG'!6Vys=<rz@c4Z&Dt(ax5rtJvZ!&~BpH@wsfNg-vaRlNci*U#=<wei<F}a5@Jq.!a*JQ!%@qZ23d(#Y&RjH5]jCk!u7w&u0udARjFd/prq=tyvpaEa(a:.!a1aZ(@@=I}:9wpd%=<sX55w_h}@@=I{t=ay<aU@@=I}T=ay<2@@=I})?C9:9au@9Cb]}DP~=x-fAZ(2Wl1=ay<aU@@=I}>5@d##Y+jTv|vV~EfFj]uNpn~FRfGdgaK!Z2&!a8a-Tb({E!acTbM*!a(DtY[yYd'%Y#sl[y*hHvh>Re5x2c{Z}.j4uCvcawRiMd+#X+_x&d!},<5RkX;2Hzw@x,gavfB-!{CcF&T#Roe;RodwWbBg5urRgaKvHC*_6Vz+<4opieuew&Rmq@d]&Y)X,T#X0Rh}<BqP=4qS9:ReMg/ujReNJw0!/<Jui%!bd{kawwnemRelAxUa?a3#*.&UX(Ya+a/RhvRnQ<o}9Wmtd-#Y&RgSRmw9;Rmxay=Rmyg-vaRmuxEhSrNu,v-voC!%(aR.a(a7+1Ro1>Ro5CE{A9b]{@;5x#eO{:g;urRi+KrNA!%(Ro3>Ro79;Ri_Ku@>{;&!x%gX|{KunA_+g5QRj/g3u5Rj#g>uERj%wio/xRhS&!,!#^1U}wba{8>>@=be}qC@:D5ba{7Ku+A&!}x?ba}t>>@=be}se(aA^^^Uat!b0#{pa+awUazbGa#aLb9bgaWac'a5TbS=Br!d1#`%scp_Jvl!#rT>Re0JvX&!VyN=H{Fcm#U&:pY=ReaJv2&!]h0=]nUJvG'!6Vy|=<r%JrM_=]h2@Wlud'#)U'Wf'b]{i=]h/Jvh!&~BpWg=v]RnMx+ny#'Nu;pVwjnu=]nwxJnx,T#`&Reqwjnt=]nvieu9vrRjLLuYwP(#+!th@wih5pX~Gr'g5v/Rh4KunA'!-CARnP@wwiN:Rm_9x'cvw>!|l=<saKvAA!0&3@q}>w^e1bp#&Re2Re3BDx7gH#T|f5H|eKuZ>!%(:qNAH{]Jv6!+3B2B9=b^{X<5<B92:E{ZLvhwA(a;a%!igQuyRmad+#Y}m@3Rh5d8#X'X*:AqUAHzmaxwbh<aXRnVcF}RT#Nw&cj#U(BWnug/vsRntdka)(a3+.Zb7aYYan1!bVa@Xa}[y^@b[{G=H{+hFu73Rj&Pv#5ReQcK%T#sig1v{Rj'Ku+D#'!t]~Grm~?rkKuMB!01d5#`'Vy.ta3Dtu~Hroc8#'{^45s85AwZbP&!#Rn!wghxWn#KvEA!)&2RlA2RlBx:h|#(T,=]j09Wobz>x]z/@awRoTd+#Y(az]hFhCrm4d,#Y+jTv|Q~EfMj]uNr|~FRfOdCa!Xa9_X#@<plJvf!%b`{(9;Rgwc;.!#2x7cw#T|UDb]|T5Ju={(!=@E{&Jv)&!Ab`{'awJvf!~*>>@=be{#KuY>!+&4Ezyi[ugv&RjIdea+T)#UXa&T-T&a!Rh9auRmW=]kLg5vuRn+g3u4Rn-Ow6ARn,hHus5xNk?#UX(U~)/g8v0RkD~AwkkF?Ri.OuNBwkkA?Ri/d|a2`a*^UYa.!aBTZaTa'Xa;!(!2!-a#b2[yC>6Vyq3[xr2Wi?g1rusVh%s?DtF~<5rbJs;%!DtBfswKtCj[uvuSsEu3RgVx3o:u+wN'*Zt;@3rd~Grh~?rfg8w)Lq)qE&-a%!>bI|`jWv0vV~EfCjTv|vV~Ef@j]uNpn~FRfBcK#T']gWNu7x,k7q4ai(0!hHv8<RhmkMu9vrsBuev/RhlCJvB!,g<v{wchh~@:Rhji[vrv{wchi~@:RhkdS&a5UY#Ta!RgPwwiI5BwciI~@:Rh`x'iJvj'!5]iJPu8Bwch]~@:Rhach)U#h3rp]gLh@t|Ax,hTq3ah!-(~@:Ro0Ou!5RhXj^v(pyw8unRhVd|)`,^UYas!a?/a2Z'a^Ta{Tb7Ta(a#!a,Wf&9sZ3DtAadamov=Bqt3[xig8vsRm~>waiL2b`{QJv*_Ouv2qgj<v]v2BqfdR'X*X#Y-@3qr~Gqv~?p6hHv-]glPup5Lq+q?_%*b_{qF{n9b^{rOu4ARhpKvCD!+&~Bqp:5Dbb}nwoiKl&unuTuBv]v+ueunaXRf0=Jvh!0nKufu8v1w&w7q%w&uHrz:Rgnj5w,uxDJq/(!hNw'5ReCk0s2u3w/w'5ReFd>Za&!*UaA=<wkgsRnSJv^!%Refifw3vyRgOKu_B'!,<]gkiiu:w&Rh<=C@a^<B57@2F{[<B5@aW:=3away9A5aW=<B=C@a^<B57@2F{Ie-#`(^^^bCara.b8aza6!/bZ,!adTbnTbOb+aFaS!aAT9@Wf~2Wli3Dtl2@d,#Y&RfnRfmJwJZtN~GqyJva&!VyMg<v~Rm%iXuJu3Rm9Jv[_=]ih9wlkDRkCd1#`(@Wg>2Wls3cH#T(@<Rj*=>Ri|b~'#23s9h<~El.d'#Y&Dtxi^rzvdRl#d*#U%(o|B2s`hJwSaxRmDKv4B&!1:Rmdd5#`'Vx}to~Hq{x'f1v3(!BA5ba|bJv_&!Wfug1v]ReIdO+U/Y#&G}-8wze=Rh{g1v]ReHg/uQRf/by#)ibQwERl/cH#T(@<Rj+=>Ri{cNu+vlax-!(#a0qa9<Rii2;;bU{H;x<i=&X#Rk`<4wwi=C9H~8xAI(Y#<azRi@45wXI<B9;5bb~7dL(X#Xa(+!aL6Vy{g5QqOau:5au2@ay547EzbxOcU(UX-T#Ta#:Cbb|A?wjh/b_|SOw6ARgtihr}u7Rhy<d1#T)X1@@=I|~=ay<2@@=aybb}Sj3vLv;<d,#Y(56H}A978H}@dGpvs@uAu`vcw9*!aFa+ai%(b!aXa8.a?a[ozWey=sU2@G}Nch&U#Rf_WexKu+D#'!t:~Gr`~?r^j]uNr|~FRg*j^psurwJt|RmcKv)@&!)7Rkv~Br[@wxfO:Rl3co#U'6Rezj_q#vIuavjRltwzeyh@vr5JqD0!>aY?C9:9au@9Cb]}9cl#U*5;5<H||jbuus1ucv&Rfvg1v~d/pppzqFr^a--a~!aMat1(hFv;Wiz@@=Izoj5uuv-7Rix~Cw`fk2WlVcZ#X,k)u3vWs@u2]ktg;wEx'fBq(_2Wg/jTv|vV~EfoJv]!15x'hzqG!(P~EfU~CRl_j6v(us5x4i-#T(2WmZ?C2F|d>Kq<aj1!*jTqIsBv=Wl`~Cw`fi2WlWj`v0u*~>RlR=c>Z,k#u3vWs@u2]kr<c1Z+jTqIsBv=Wla~Cw`fm2WlXdmb3!a{(arZa`bkTa%TbQTa-a9+c'!aM!/[yL=Bqug.w'RifhFvyDRj.g>vgwyk^9]k^Jv3_@WfbAARkhJw2_[x|JvB_wkoIRoKwkoJRoLd'(Y#<]gm=<9<H|yd'%_X#skDtb3awwqkgNulRkgdB#^',9:p'hJwSaxRmEBwVb8@4=H|qLu+w50&!)@3qs~?pU>Awwn;;Rn=c:Z'ARn<=<qwKvC@!/&~BqqJv6!&]eVb^z^xRge'/a%+^`#Sge}6<4Rn3=]n0Pw2>Rn8Jw0!&>Rn:>Rn6cY#a7+!a&=<wkaNw~h3z_c5Z{=wjh#=]nLKv^D!&)Vyz=bW|swYb<WetcG#T(2wxa@qVx@gD#Y&b^|V5JwG&!5bb|pg/w&RgD@x=kHs=uAvn!a%%/'+RmSRh694Ro`g-vaRmRhHv-]mlxCcS#`&ba~.5cD#Ta)P~=d,#Y(56H{>978H{Dd_#{2^Y%_+qbbb{6g3sERhsbU{?dfa.,`a(Xa<!aiX#(55RiG54RiHcI#T'WiU3RiVNvdwtfcRlKNvdd,#Y&RlHRlExQgf.1*^T'X#Sgf}6Wn4=]hfPrk>Rn7Jw0!&>Rn5>Rn9Lunw?&a2!,5<oq@@wqfdRlJj5Q~=d,#Y(~ARfcOuN]fdDKw;ay(}i!547E}j?cI#T(@5bV}iCbV}hdv(^^Tb?a40,b##Tbo!a*bR!a<b|a/!aKai!aU[yK=]o^g:v>ReGJwPZtK<7Rh+h<~El,Pv#5ReR@awwxjCg,ulRjDJv6&!]j!z?aQeeg>w=Sh<eeJw;!&axEzOg,Qosc!#*:wkeJ]eJ>x'h-u(!%Ro.w~h.zPdNZ(X,Ya![x{;9ReY;wkgxRiF:x?ap#Y&RmUg<s2Rkod]+UY0TZ'!a&A9sw<=bczLNvuw{gqzNhJwSaxRmCKuLay!#&s_Rf-55b^{uJvZa!!c%#(55Ri654wmiu5RiuawLu,vp!+}^%b_}Y9;wkgxba}o>A9:=b^}zKuh=a''!3awRk3c*'!#aHRk6c+Z&Rk5Rk4Jv)&!awRjSawd9*`#0?C2@EzMj8u<uJ5RmbjQrquJu3x,k>uq@_+=ayb^|W~ARkEOuN]k@7dhzV^X/X&a-#zRzSb`zXcJzTT#2WkVKvDBzW!%FzY9;5bbzWjQrquJu3Jw3%!b`zU=ayb^zQd:#X(T-a!6Vyywxh}=b]{Jg=u1RiAdGp~qHtzv!w(wA+a+a;<!aJaYai'anasb(=azRmV:Cbb{MLq2vb!%')RjuRjrRjtRjqx3jnqCw3!%')Rk(Rk+Rk&Rk)Lq2vb!%')Rj{RjxRjzRjwLq2vb!%')RjsRjpRjfRjex3jcqCw3!%')Rk'Rk*RjkRjl9<CbbzfOu4ARhxLq2vb!%')RjyRjvRjhRjgx=joq*uKvb!%')+-Rk.Rk%Rj~Rk-Rk#Rj}x=jdq*uKvb!%')+-Rk,Rk!Rj|RjmRjjRjidAq&qKs@uAv8Aa.'*-a@a&0!aM@a5[y73Dsy3Ds|3Dt):wxgI2sHJwJZt.~Gqxwsf0ikrzt}Rl0Jvy_[xj~HqzKv_A|D!&WfP8axRoVcf,U#k(v]v+ueunaXRf1Ju}'!g8u#Ri=jQw!sCunLprq>!,')~<5qeGzq9F{W=c##%s5au:5aU3CBE|;d4#X(D!a&6Vygx(b;#(=]ed?C2F{N<capoq2r[a&!aPa9,'Pw;5s:@@=I|,55w_h|@@=IzcP~=x'fCqB_2Wl2>aU@@=I|1OuNBc1Z+jTqIsBv=Wlc~Cw`fl2WlZ~AcTa%!Z+jTqIsBv=Wlb~Cw`fh2WlYk+uNqJsBv=WlSg,u3dca3#UXaMYa)TaB-=cM|7T#<bI}l5@B932:aV2G{BOuNBJq:|M!5Ezt=<B=C@a^<B57@2F{v>cB{/T#=ay<bI{3Jv6!a.6BKq0ah&+!5E}HP~Ef{978BaU@@=Iza<7d#.Y#978BaU@@=IzH~AJq0!(@@=IzG978BaU@@=IzFe,aU*Y&^^^bvJb,b:bFad!a,c2Ta>aL.bo6!a#CbTa'T#Re{2Wlh2@G{yg6t~Ro_NvdRfticuRQRllJv3&!x&c|zs@Jw3!%RflwpfkRlpKuL;%(!Re<@G|C2GzdhIvuBwgjAg-u0RjAKQB%!(GzZ@G|5NuuRl7d='T+Y#Vy[g<v~Rm!==G|>JvA!)@wma=]m1ifuaw&RmnLs@vT'!|/+[y,g:v>ReTJw1!#qX=x!eC{bLu+wT&)ZtZauq_~Graci&U#F|89:r_Lupvq!.)&2RlG8RfaC=x!eF{_h?rpWlmd&'!#X|&]k::xJey#`'T|+<E|&2@H|%dE#(^,g;u.RiEg6vjRiC9xCkA{O|zY#g=ucRmXKs0@!&*@G|m@awRknJuh!,3d(}gY}eJvj!%Rm):Jw3!%Rm+Rm-Ls0w(&!a(a#@b[|6cZ#X'7RkxWgAOu4ARn'dH'U#Y*Vz-Wm'CARm}d]*#a%^a*T'aK!a<9bV{PC=p*Jw4!&SgxcbB5r]idw(wBRmF7xFkt#&`(Rm/Rm8E|!JuY_9:Rl5=wrgr2:bbxd@xXfB(a*#T+!.X0X1Ta/a'T&RlDRfL>RlyARl9b[z[>RfZ:RlL:RfRwlg/ARl;9;RlxKv,A/!%7s69<74=BA5ba{-8Bde#`a<XaKYa1,a'P~=wxfB2bZ}}?C972@@=I}r8@55B9;5bb}G978B2@@=aybb}3j3vLv;<Jw3&!>Rfk=ayb^}4~Ad1#`*@@=aybb{w2@>==<bbz]dx+UY#^UaF!a9!bB'Ya1.!ajXa#%olRhD[y=3Dt#Ov5BrHKuMB%!(Rf^Wep~HrJwkiQjKr|~FRg)Ku+D#'!t5~GrF~?rDdV)UY,Z/_7RkuG{<~BrBg,rlsO:235B@bX}|d?a1!#`(6Vyn5@d##Y+jTv|vV~EfIj]uNpn~FRfH7Lq2vb1!a9-978BaU@@=Iz9978BbU}#~AJq0!(@@=Iz8978BaU@@=Iz7~AJQ|}!978BbU}!JvkaK!AdUa21-U#`a+(g/vsRn~Ou!5RPj:rmu9WhOjXuvvNr}:RhAj^v(pyw8unRn[kPr}p|u7vwv]RiSBd;pppzq@qHQa?(b.!a.a`@.|xa(hFv;Wiyj5uuv-7Riw~Cw`fg2WlU978BbU|wOuNBJqG!(P~EfD~CRlQcZ#X,k)u3vWs@u2]ksg;wEx'f@q1_2Wg.j]uNpn~FRfqJv]!15x'h{qG!(@@=IzK~CRl^j6v(us5x4i,#T(2WmY?C2F{1>Kq<aj1!*jTqIsBv=Wld~Cw`fj2Wl[j`v0u*~>RlT=c>Z,k#u3vWs@u2]kq<c1Z+jTqIsBv=Wle~Cw`fn2Wl]dn1#c(a(b^a2!b/bAT(bj!aDa7bu,a_a{c0!2T0g:v>ReD2@G{42@G{5~DpM~<5rc=Bx6i>{RT#RnI@zCx]y]z:2Jv[!zr5Awyk]9]k]dD(Y+X#6Vz.g=wKtgwhaCwgmTWj2Lu,w%_+/[y-B;b^xeg3u3Rj-2@bX{*KrJ<!+'@Wg(g?QRlC@Jv`!%b[zIwsfII}8JQ_@w|kW|=Jv(%!AqcOuNBJvEzh!bYzjLs@wP#(0!oy@>RkdJwMZtc3Dtd@BcG#T'9bWxg2@2Fznd*#Y+;2x'c}w<zizixNgwa#Z'U+!/!a'!a+w~g~z6wcn{Rn}wcnzRn|5Rh%=]nJg5vuRmvNvdRlvcprJu}w*az*a#!%.a.'Bot9qT]kj@Wg'ay2Gzv@Jv`!%b[zEwsfHI}1;ck#Ux`<Cbbx_Lu+w!a&0*!wko*wwo,So,}6Juqxf!E}PigQuyRm`d3(`#8>Rn%:A5B;bZ~%KvhCa!a2!x>k7#Uxb@b{#xaRk7Jw0!)>wwhlShl}6>wwhmShm}6CJvB!.x'hhvj{!!5Bwkhhbaz}x'hivjz~!5Bwkhibaz|xEhTrNu,v-vpD!a%&/)a3a.,%Ro2t[CE{)@3re9b]{%wjo09:rgc:Z&Ro6=<riifuaw&RmoKrNA!%(Ro4>Ro89;Ri`dSaL'UYzxZb)7Rka3xRhT&!,!#^1U}vbaz{>>@=be}yC@:D5bazzKu+A&!}{?ba}y>>@=be}wxBh[t`u~vJvr!%a!a()a,a0a4RoC=]o;Ju(!%RoGRhdwjh`=]oAg>w#Ro?g5vuRo=NvdRl|Ku]C.!&;RoEJvB!%RoORoMBx'h[v+_?w~h`}~5?w~hd~!xKh]oiptu-utv.vp!#%&a30a@a'a+(a/aOp(o~p!RoDJu(!%RoHRhewjha=]oBNvdRl}g>w#Ro@g5vuRo>c[#X']o<CauRoRAd-#Y':RkpauRoQKu]C.!&;RoFJvB!%RoNRoPBx'h]v+_?w~ha}t5?w~he}ue!/UbhYacXaW^Tc&a;b:a-c/#b&aja1(!cL+!bKbt!bmcRc9aIc?8[yW3Dtt94Rg`Jv}!&SiRMzBhEebShEMNuPRe>x7gL#TzuwjirRipc<Z&>on;>z=h-MSh.Mwqczx'a7vj&!>Re4@=ResJt__NuPRi*NuPRi)j]uNr|~FRfzKrJ>_+@Wfy@Wf]2WocKrJ<!+'@Wg%g/QRl@@Jv`!&awRl<wsfFIzgLu(w*!.*&ShBMwvhIRhI9;RhNx1hK'!#Sn]Mx1hK~0!#:2<H~7cNu+w7D*'1ZtW>Rn1~?rOc:Z&Rn2=<rQ<7wjh&=BSnLMc]#X(6Vz)w[b=a!U#9wzgMc3#&(RgMRitRis<x,gKt`ax!&+SioM=BSilMc3#&(RgKRinRimKurB,!&SiQMzBhDebShDM6BJQ!(P~Efx978B2@@=I}WLrJw!!,a*&@G}O@9wkibRid@@x'fKwC!&SlDMSfLMjUv~Q~EfKKv3@a+!(hFv-]mpx/hYZ(C5RiWz<o/MwkhY?So/M@x,gbvfB*&!SgEM:SoeeehFu3:Rgbda(,^TZa)X/7Sg[eb:2RgI~BrMC@wgkc:wwkcRerx3h(uUvK!&*,SnOM4Sh*MArRg;wHRh(x=h;rJvPwI!a4',a'0@Wg&=BSh/Mg>w=Rh=g3w*wwgGRgGcW(X#;Sg}M2Gzk@Jv`!&awRl=wsfGIz`dKZ*T'Y-:RhR7RhQg5u-p`j6v(us5d,#Y+~Awkia?RicOuNBwkibba}Ld6p~tyu_vbAa'a+!a/'a3aEa8a!>Sh,ebJv{!&Sh@ebSaReb9;SgwebNuPRi(NvdRl)NuPRi'hHu^<Rm^Jvv_@Wl(g;u1Si/ebKu'B&!*Sh?eb@Wl'z@aPeb95Si.ebcpputyvjB)!,&a+0a%ShAMWeK@G}C@WfJ9;RhMwvhH9w{ia}ix,hJvRA1(!zAn[MRhHx1hJ~*!#hFv(BSn[MBJQ!(@@=I~'978B2@@=I}2db.Ua<'X}+T#a0XaG2G}E;wkg|wuh!Rh!x,hZu,@)!&So0MVy)C5RiXACJvB!&5RiY5RiZg8w)cG}*T#2@bU}=KsA>(!a.3wkhZba~(x,h^u(A!&(SoCMRhb5Bz=h[eb?w~hb~6x,h_u(A!&(SoDMRhc5Bz=h]eb?w~hc~6e)aA1T#T,^^^c-bMb&blcPaP(a/!0!bA=b5c@a(!bfbrc#2afwmhARnjwchORnp2Wlf3DtsNvdRl-2@wpa<]m0bx(#:awRk2@Jw3!%RfhwpfgRlnKQB%!(G{V@G|'NuuRl6d='T+Y#VyUg<v~Rl~==G|<Jv+'!aYShC}6@B<5?ba~8@Jw3'!g2QRljhLrpWlOd+#Y'g.w'rIg>w*wgj@g-u0Rj@Lu+wT&)ZtUauq]~GrGci&U#F|39:rELrNvj!.%*RhCwunfw~nf~:9;Ri]>wtnhg;wHRnhx3hDs@v~!/+'@Wfr@9RkSNu&Rlo=@<5GzoKs0@_+@Wl+@awRkmJuh!-3d(}pY#qWJvj!%Rm(:Jw3!%Rm,Rm*de&!1U-U#`)Re;@G|.@9Ri82@wjfvRlq=@<5GzpLvOvr!).&2RlF8Rf`C=x!eE{.Jw3_g2QRlkhLrpWlPde(!#U{s,UXa*Ta'[y'g:v>ReS;x0PZ&RnlRnn~HrKJw1}f!=x!eB|2w]aP(#Xa&a*Ta.Ua2a7=]iOd'#Y&Ro&WnWg;u.RiDg6vjRiBNvdRlzhNvj]nYJuW_2Wm3x)kFze{9d])!a.!,Y01!#&aC!a3RndC=ox~BrC@2b^{pg,rlse7x'ksuq!%Rm.E{xidw(wBRmGx9o+)X#wwo-So-}69:Rl4@xSf@a#XZ'X)X,Ta(/ARl8b[xc>RfY:RlI:RfQwlg.ARl:9;Rlwdn'#^XafaQa1X1TaHTa)@b[{zcZ#X'7RkwWg@Ou4ARn&x)kG#{,g7u/RkGdH'U#Y*Vz'Wm&CARm|bx#(A]gUbUzJj9Q~=d,#Y(56H}l978H{U7d,0#U*2>ABb_xZ978BbU{e~AJQ{g!978BbU{hxMh?ad{oUYZ.x1h?{l!#:2<H{mx3n[t{vl!,&a%3Ro(z=iS}6ARnr=Bwsn^wvn`Rnbd`*T}B0!#^X'BG{c9b]{a>>@=be}F?JvS!&BG{d7BG}(Bde#`a1X,Ya@!a'P~=wxf@2bZ}I56B2@@=aybb}08@55B9;5bb}<j3vLv;<Jw3&!>Rfg=ayb^}&OuNBKuLA!)a!P~=x#fD{f2@>==<bbzl?C972@@=Ix^d6rSu,v7w*C(0a)a6#B+a%!sQ[y?3Dt%3[xn~<5rLOu!5p@Ku+D#'!t7~GrP~?rNKvlaya7'!h+v-5qMg=t|cd,U#5AAaa5Abb{S@52B5@a[@52B5Gx[iXueu;d<#`a(!/549C;ag>23ExY5@Dah89b^~689Jv)!~2b[~1Lv'w(%*!a#bX|aPrmawRe]keu7uhv-q6rxu,q`xTo]/a5aU!bNaDXbi!b-!ao!b<bwA!#5@B932:aV2G|:d-)Y#hJrL>RhG<7@C5<H|_=Cau:5aj5@B932:bJ|ng>vIbs)#?C2F|9jPv0w.vISh-MKvUaz(.!9ABbb|[5;5<H|Eg>unwfh;9:4E|YjQsBt|vjx'hYq3!(?C2F|J:2<BaY?C2F|GOu!5x,g|p{ah!-(?C2F|c9:4E|OjXuvvNr}:Rh&i[w*t|cd+U#jJvsu)vsSn~Mkfrmu9p}u7vwv]So!McW#Xa!ax5@A5aY:5;5<H|>kJv~vYrquJu3x4ib#T)2@SmZM?C2F|Bj:rmu9@xPhI(a*a#U#`a3-5Abb|L~@:RhK9:4E|0@52B5G|#C::aY?C2F|-:2<BaY?C2F|.5Jvk!a)javYrquJu3x4ia#T)2@SmYM?C2F|HAxPhH(!a#U#`a*-5Abb|4~@:RhJ9:4E|R@52B5G|F:2<BaY?C2F|Sc^#Xa2j=Qq5CJvB!-g<v{z;hhM?C2F|Zi[vrv{z;hiM?C2F|XKsA>!a)-g<v{z;h[eb?C2F|]i[vrv{z;h]eb?C2F|^iZu.vix,hZq3ah!.(?C2F|QOu!5ShXM:2<BaY?C2F|P", 13494, 2713, 49, 25, 61);
var y;
(function(e) {
  e[e.VALUE_LENGTH = 49152] = "VALUE_LENGTH", e[e.FLAG13 = 8192] = "FLAG13", e[e.BRANCH_LENGTH = 8064] = "BRANCH_LENGTH", e[e.JUMP_TABLE = 127] = "JUMP_TABLE", e[e.VALUE_MASK = 8191] = "VALUE_MASK";
})(y || (y = {}));
var I;
(function(e) {
  e[e.AMP = 38] = "AMP", e[e.NUM = 35] = "NUM", e[e.SEMI = 59] = "SEMI", e[e.EQUALS = 61] = "EQUALS", e[e.ZERO = 48] = "ZERO", e[e.NINE = 57] = "NINE", e[e.LOWER_A = 97] = "LOWER_A", e[e.LOWER_X = 120] = "LOWER_X";
})(I || (I = {}));
var oe = 32;
var $e = 21;
var Vt = 2097151;
var Re = 2047;
var Xe = 0;
function Qt(e) {
  let t = e >>> $e;
  return t === Re ? Xe : t;
}
function He(e) {
  return e - I.ZERO >>> 0 <= 9;
}
function en(e) {
  return (e | oe) - I.LOWER_A >>> 0 <= 5;
}
function Ye(e) {
  return (e | oe) - I.LOWER_A >>> 0 <= 25;
}
function tn(e) {
  return e === I.EQUALS || Ye(e) || He(e);
}
var qe;
(function(e) {
  e[e.EntityStart = 0] = "EntityStart", e[e.NumericStart = 1] = "NumericStart", e[e.NumericDecimal = 2] = "NumericDecimal", e[e.NumericHex = 3] = "NumericHex", e[e.NamedEntity = 4] = "NamedEntity";
})(qe || (qe = {}));
var xe;
(function(e) {
  e[e.Legacy = 0] = "Legacy", e[e.Strict = 1] = "Strict", e[e.Attribute = 2] = "Attribute";
})(xe || (xe = {}));
function nn(e, t, n, s) {
  let r = (t & y.BRANCH_LENGTH) >> 7, i = t & y.JUMP_TABLE;
  if (i) {
    if (r === 0) return s === i ? n : -1;
    let c = s - i;
    if (c >>> 0 >= r) return -1;
    let a = e[n + c];
    return a === 0 ? -1 : n + r + a - 1 & 65535;
  }
  if (r === 0) return -1;
  let o = r + 1 >> 1, u = n + o + r;
  for (let c = 0; c < r; c++) {
    let f = e[n + (c >> 1)] >> ((c & 1) << 3) & 255;
    if (f === s) {
      let h = n + o + c;
      return u + e[h] & 65535;
    }
    if (f > s) return -1;
  }
  return -1;
}
function Ze(e, t, n) {
  return n === 1 ? String.fromCharCode(e[t] & y.VALUE_MASK) : n === 2 ? String.fromCharCode(e[t + 1]) : String.fromCharCode(e[t + 1], e[t + 2]);
}
function rn(e, t, n) {
  let s = t + 1, r = 0, i = s;
  if (s < n && (e.charCodeAt(s) | oe) === I.LOWER_X) for (s += 1, i = s; s < n; ) {
    let u = e.charCodeAt(s);
    if (He(u)) r = r * 16 + (u - I.ZERO);
    else if (en(u)) r = r * 16 + ((u | oe) - I.LOWER_A + 10);
    else break;
    s += 1;
  }
  else for (; s < n; ) {
    let u = e.charCodeAt(s) - I.ZERO;
    if (u >>> 0 > 9) break;
    r = r * 10 + u, s += 1;
  }
  if (s === i) return 0;
  s < n && e.charCodeAt(s) === I.SEMI && (s += 1), r > 1114111 && (r = 1114112);
  let o = s - t;
  return o >= Re && (Xe = o, o = Re), o << $e | r;
}
function sn(e, t, n) {
  let s = We, r = e.indexOf("&");
  if (r < 0) return e;
  let i = e.length, o = 0, u = "", c = s[0], a = c & y.JUMP_TABLE, f = (c & y.BRANCH_LENGTH) >> 7;
  do {
    let h = r + 1, p = e.charCodeAt(h), d, l;
    if (p === I.NUM) {
      let D = rn(e, h, i);
      d = Qt(D), t && d > 0 && e.charCodeAt(h + d - 1) !== I.SEMI && (d = 0), l = d === 0 ? "" : Oe(D & Vt);
    } else if (Ye(p)) {
      d = 0, l = "";
      let D = p - a, _;
      if (D >>> 0 < f) {
        let R = s[1 + D];
        _ = R === 0 ? -1 : f + R & 65535;
      } else _ = -1;
      let x = 0, b = 0, g = _ < 0 ? 0 : s[_], m = h + 1;
      e: for (; m < i; ) {
        for (; (g & (y.VALUE_LENGTH | y.FLAG13)) === 0 && (g & y.JUMP_TABLE) !== 0; ) {
          let F = g & y.JUMP_TABLE, A = (g & y.BRANCH_LENGTH) >> 7;
          if (A === 0) {
            if (e.charCodeAt(m) !== F) break e;
            _ += 1;
          } else {
            let B = e.charCodeAt(m) - F;
            if (B >>> 0 >= A) break e;
            let w = s[_ + 1 + B];
            if (w === 0) break e;
            _ = _ + A + w & 65535;
          }
          if (g = s[_], m += 1, m >= i) break e;
        }
        if ((g & (y.VALUE_LENGTH | y.FLAG13)) === y.FLAG13) {
          let F = (g & y.BRANCH_LENGTH) >> 7;
          if (e.charCodeAt(m) !== (g & y.JUMP_TABLE)) break;
          m += 1;
          let A = F - 1, B = _ + 1, w = 0;
          for (; w + 1 < A; w += 2) {
            let T = s[B];
            if (e.charCodeAt(m) !== (T & 255) || (m += 1, e.charCodeAt(m) !== (T >> 8 & 255))) break e;
            m += 1, B += 1;
          }
          if (w < A) {
            if (e.charCodeAt(m) !== (s[B] & 255)) break;
            m += 1;
          }
          _ += 1 + (F >> 1), g = s[_];
          continue;
        }
        let R = g >>> 14, C = e.charCodeAt(m);
        if (R !== 0) {
          if (C === I.SEMI) {
            d = m - h + 1, l = R === 1 ? String.fromCharCode(g & y.VALUE_MASK) : Ze(s, _, R);
            break;
          }
          if (!t && (g & y.FLAG13) === 0 && (d = m - h, x = _, b = R), R === 1) break;
        }
        let v = nn(s, g, _ + (R || 1), C);
        if (v < 0) break;
        _ = v, g = s[_], m += 1;
      }
      if (l === "") {
        let R = g >>> 14;
        R !== 0 && !t && (g & y.FLAG13) === 0 && (d = m - h, x = _, b = R), d > 0 && (l = Ze(s, x, b));
      }
    } else d = 0, l = "";
    d === 0 || n && p !== I.NUM && e.charCodeAt(h + d - 1) !== I.SEMI && h + d < i && tn(e.charCodeAt(h + d)) ? r = h : (o < r && (u += e.slice(o, r)), u += l, r = o = h + d), e.charCodeAt(r) !== I.AMP && (r = e.indexOf("&", r));
  } while (r >= 0);
  return u + e.slice(o);
}
function ue(e) {
  return sn(e, true, false);
}
var Ge;
(function(e) {
  e[e.XML = 0] = "XML", e[e.HTML = 1] = "HTML";
})(Ge || (Ge = {}));
var Ke;
(function(e) {
  e[e.UTF8 = 0] = "UTF8", e[e.ASCII = 1] = "ASCII", e[e.Extensive = 2] = "Extensive", e[e.Attribute = 3] = "Attribute", e[e.Text = 4] = "Text";
})(Ke || (Ke = {}));
var un = class {
  src_Any = pe.source;
  src_Cc = me.source;
  src_Z = ge.source;
  src_P = Y.source;
  src_ZPCc = [this.src_Z, this.src_P, this.src_Cc].join("|");
  src_ZCc = [this.src_Z, this.src_Cc].join("|");
  cache = {};
  opts = { maxLength: 1e4, urlAuth: false, schema_names: [] };
  constructor(e = {}) {
    this.opts = { ...this.opts, ...e };
  }
  set(e = {}) {
    return this.opts = { ...this.opts, ...e }, this.cache = {}, this;
  }
  escapeRE(e) {
    return e.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
  }
  nestedPairRE(e, t, n = 4) {
    let s = this.escapeRE(e), r = this.escapeRE(t), i = `(?:(?!${this.src_ZCc}|${s}|${r}).)`, o = `${s}${i}{0,1000}${r}`;
    for (let u = 2; u <= n; u++) o = `${s}(?:${i}|${o}){0,1000}${r}`;
    return o;
  }
  get_text_separators() {
    return this.cache.text_separators ??= /[><\uff5c]/;
  }
  get_pseudo_letter() {
    return this.cache.src_pseudo_letter ??= new RegExp(`(?:(?!${this.get_text_separators().source}|${this.src_ZPCc})${this.src_Any})`);
  }
  get_ipv4_addr() {
    return this.cache.src_ip4 ??= new RegExp("(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])[.]){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])");
  }
  get_ipv6_addr() {
    let e = "[0-9A-Fa-f]{1,4}", t = `(?:(?:${e}:${e})|${this.get_ipv4_addr().source})`;
    return this.cache.src_ip6_addr ??= new RegExp(`(?:(?:${e}:){6}${t}|::(?:${e}:){5}${t}|(?:${e})?::(?:${e}:){4}${t}|(?:(?:${e}:){0,1}${e})?::(?:${e}:){3}${t}|(?:(?:${e}:){0,2}${e})?::(?:${e}:){2}${t}|(?:(?:${e}:){0,3}${e})?::${e}:${t}|(?:(?:${e}:){0,4}${e})?::${t}|(?:(?:${e}:){0,5}${e})?::${e}|(?:(?:${e}:){0,6}${e})?::)`);
  }
  get_ipv6_url_host() {
    return this.cache.src_ip6_host ??= new RegExp(`\\[${this.get_ipv6_addr().source}\\]`);
  }
  get_ipv6_mail_host() {
    return this.cache.src_ipv6_mail_host ??= new RegExp(`\\[IPv6:${this.get_ipv6_addr().source}\\]`);
  }
  get_auth() {
    return this.cache.src_auth ??= new RegExp(`(?:(?:(?!${this.src_ZCc}|[@/\\[\\]()]).){1,50}@)?`);
  }
  get_port() {
    return this.cache.src_port ??= new RegExp("(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?");
  }
  get_host_terminator() {
    return this.cache.src_host_terminator ??= new RegExp(`(?=$|${this.get_text_separators().source}|${this.src_ZPCc})(?!${this.opts["---"] ? "-(?!--)|" : "-|"}_|:\\d|\\.-|\\.(?!$|${this.src_ZPCc}))`);
  }
  get_path_terminator() {
    return this.cache.src_path_terminator ??= new RegExp(`${this.src_ZPCc}|${this.get_text_separators().source}`);
  }
  get_path() {
    return this.cache.src_path ??= new RegExp(`(?:[/?#](?:${this.nestedPairRE("[", "]")}|${this.nestedPairRE("(", ")")}|${this.nestedPairRE("{", "}")}|\\"(?:(?!${this.src_ZCc}|["]).){1,100}\\"|\\'(?:(?!${this.src_ZCc}|[']).){1,100}\\'|\\'(?=${this.get_pseudo_letter().source}|[-])|\\.{2,20}[:]?[a-zA-Z0-9%/&]|\\.(?!${this.src_ZCc}|[.]|$)|` + (this.opts["---"] ? "\\-(?!--(?:[^-]|$))(?:-{0,19})|" : "\\-{1,20}|") + `,(?!${this.src_ZCc}|$)|;(?!${this.src_ZCc}|$)|\\!{1,20}(?!${this.src_ZCc}|[!]|$)|\\?(?!${this.src_ZCc}|[?]|$)|` + this.get_path_extra().source + `[\\\\/:%@#&=_~*]|(?!${this.get_path_terminator().source}).){1,${this.opts.maxLength}}|\\/)?`);
  }
  get_mail_name() {
    return this.cache.src_mail_name ??= new RegExp("[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9](?:[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9]|[.](?=[-!#$%&'*+/=?^_`{|}~a-zA-Z0-9])){0,63}");
  }
  get_xn() {
    return this.cache.src_xn ??= new RegExp("xn--[a-z0-9\\-]{1,59}");
  }
  get_tld() {
    if (this.cache.tld) return this.cache.tld;
    let e = [...new Set(this.opts.tlds || [])].sort().reverse().join("|");
    return this.cache.tld = new RegExp(`${e || "$#none#$"}|${this.get_xn().source}`), this.cache.tld;
  }
  get_domain_root() {
    return this.cache.src_domain_root ??= new RegExp("(?:" + this.get_xn().source + `|${this.get_pseudo_letter().source}{1,63})`);
  }
  get_domain() {
    return this.cache.src_domain ??= new RegExp("(?:" + this.get_xn().source + `|(?:${this.get_pseudo_letter().source})|(?:${this.get_pseudo_letter().source}(?:-|${this.get_pseudo_letter().source}){0,61}${this.get_pseudo_letter().source}))`);
  }
  get_url_host_port() {
    return this.cache.url_host_port ??= new RegExp("(?:" + this.get_ipv6_url_host().source + `|(?:(?:(?:${this.get_domain().source})\\.){0,10}${this.get_domain().source}))` + this.get_port().source + this.get_host_terminator().source);
  }
  get_fuzzy_url_host_port() {
    return this.cache.fuzzy_url_host_port ??= new RegExp("(?:" + (this.opts.fuzzyIP ? this.get_ipv4_addr().source + "|" : "") + `(?:(?:(?:${this.get_domain().source})\\.){1,10}(?:${this.get_tld().source})))` + this.get_host_terminator().source);
  }
  get_mail_host() {
    return this.cache.src_mail_host ??= new RegExp("(?:" + this.get_ipv6_mail_host().source + `|(?:(?:(?:${this.get_domain().source})\\.){0,4}${this.get_domain().source}))` + this.get_host_terminator().source);
  }
  get_fuzzy_mail_host() {
    return this.cache.src_fuzzy_mail_host ??= new RegExp("(?:" + this.get_ipv6_mail_host().source + `|(?:(?:(?:${this.get_domain().source})[.]){1,4}${this.get_domain_root().source}))` + this.get_host_terminator().source);
  }
  get_path_extra() {
    return this.cache.src_path_extra ??= new RegExp("");
  }
  get_fuzzy_mail_host_search() {
    return this.cache.mail_fuzzy_host_search ??= new RegExp(`@${this.get_fuzzy_mail_host().source}`, "ig");
  }
  get_fuzzy_link_search() {
    return this.cache.link_fuzzy_search ??= new RegExp(`(^|(?![.:/\\-_@])(?:[$+<=>^\`|\uFF5C]|${this.src_ZPCc}))(?:(?![$+<=>^\`|\uFF5C])${this.get_fuzzy_url_host_port().source}${this.get_path().source})`, "ig");
  }
  get_http_validator() {
    return this.cache.http_validator ??= new RegExp("\\/\\/" + (this.opts.urlAuth ? this.get_auth().source : "") + this.get_url_host_port().source + this.get_path().source, "iy");
  }
  get_relative_proto_validator() {
    return this.cache.relative_proto_validator ??= new RegExp((this.opts.urlAuth ? this.get_auth().source : "") + `(?:localhost|${this.get_ipv6_url_host().source}|(?:(?:${this.get_domain().source})[.]){1,10}${this.get_domain_root().source})` + this.get_port().source + this.get_host_terminator().source + this.get_path().source, "iy");
  }
  get_mail_name_validator() {
    return this.cache.mail_name_validator ??= new RegExp(`(?:^|${this.get_text_separators().source}|"|\\(|${this.src_ZCc})(${this.get_mail_name().source})$`);
  }
  get_mailto_validator() {
    return this.cache.mailto_validator ??= new RegExp(`${this.get_mail_name().source}@${this.get_mail_host().source}`, "iy");
  }
  get_schema_names() {
    return this.cache.schema_names ??= new RegExp((this.opts.schema_names || []).map((e) => this.escapeRE(e)).join("|"));
  }
  get_schema_search() {
    return this.cache.schema_search ??= new RegExp(`(^|(?!_)(?:[><\uFF5C]|${this.src_ZPCc}))(${this.get_schema_names().source})`, "ig");
  }
  get_schema_at_start() {
    return this.cache.schema_at_start ??= new RegExp(`^${this.get_schema_search().source}`, "i");
  }
};
var be = { validate: (e, t, n) => {
  let s = n.re.get_http_validator();
  s.lastIndex = t;
  let r = s.exec(e);
  return r ? r[0].length : 0;
}, normalize: (e, t) => t.normalize(e) };
var cn = { "http:": be, "https:": be, "ftp:": be, "//": { validate: function(e, t, n) {
  let s = n.re.get_relative_proto_validator();
  s.lastIndex = t;
  let r = s.exec(e);
  return r ? t >= 3 && e[t - 3] === ":" || t >= 3 && e[t - 3] === "/" ? 0 : r[0].length : 0;
}, normalize: (e, t) => t.normalize(e) }, "mailto:": { validate: function(e, t, n) {
  let s = n.re.get_mailto_validator();
  s.lastIndex = t;
  let r = s.exec(e);
  return r ? r[0].length : 0;
}, normalize: (e, t) => t.normalize(e) } };
var an = "a:cdefgilmnoqrstuwxz|b:abdefghijmnorstvwyz|c:acdfghiklmnoruvwxyz|d:ejkmoz|e:cegrstu|f:ijkmor|g:abdefghilmnpqrstuwy|h:kmnrtu|i:delmnoqrst|j:emop|k:eghimnprwyz|l:abcikrstuvy|m:acdeghklmnopqrstuvwxyz|n:acefgilopruz|o:m|p:aefghklmnrstwy|q:a|r:eosuw|s:abcdeghijklmnortuvxyz|t:cdfghjklmnortvwz|u:agksyz|v:aceginu|w:fs|y:et|z:amw";
var ln = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|\u0440\u0444";
function hn() {
  let e = ln.split("|");
  return an.split("|").forEach((t) => {
    let n = t.indexOf(":"), s = t.slice(0, n);
    for (let r of t.slice(n + 1)) e.push(s + r);
  }), e;
}
var fn = { fuzzyLink: false, fuzzyEmail: true, fuzzyIP: false, "---": false, tlds: hn(), urlAuth: false, maxLength: 1e4 };
var Ve = class {
  schema;
  index;
  lastIndex;
  raw;
  text;
  url;
  constructor(e, t, n, s) {
    let r = e.slice(n, s);
    this.schema = t.toLowerCase(), this.index = n, this.lastIndex = s, this.raw = r, this.text = r, this.url = r;
  }
};
var Qe = class {
  __opts__;
  __schemas__;
  re;
  constructor(e = {}) {
    let { rebuilder: t, ...n } = e;
    this.__opts__ = { ...fn, ...n }, this.__schemas__ = { ...cn }, this.re = t || new un(), this.re.set({ ...this.__opts__, schema_names: Object.keys(this.__schemas__) });
  }
  add(e, t = null) {
    if (!t) delete this.__schemas__[e];
    else {
      let n = { normalize: (s, r) => r.normalize(s), ...t };
      this.__schemas__[e] = n;
    }
    return this.re.set({ ...this.__opts__, schema_names: Object.keys(this.__schemas__) }), this;
  }
  set(e = {}) {
    return this.__opts__ = { ...this.__opts__, ...e }, this.re.set({ ...this.__opts__, schema_names: Object.keys(this.__schemas__) }), this;
  }
  test(e) {
    if (!e.length) return false;
    let t, n;
    for (n = this.re.get_schema_search(), n.lastIndex = 0; (t = n.exec(e)) !== null; ) if (this.testSchemaAt(e, t[2], n.lastIndex)) return true;
    if (this.__opts__.fuzzyLink && this.__schemas__["http:"] && (n = this.re.get_fuzzy_link_search(), n.lastIndex = 0, n.exec(e) !== null)) return true;
    if (this.__opts__.fuzzyEmail && this.__schemas__["mailto:"] && e.indexOf("@") >= 0) {
      let s = this.re.get_fuzzy_mail_host_search(), r = this.re.get_mail_name_validator();
      for (s.lastIndex = 0; (t = s.exec(e)) !== null; ) {
        let i = e.slice(Math.max(0, t.index - 65), t.index);
        if (r.test(i)) return true;
      }
    }
    return false;
  }
  testSchemaAt(e, t, n) {
    return this.__schemas__[t.toLowerCase()] ? this.__schemas__[t.toLowerCase()].validate(e.slice(0, n + this.__opts__.maxLength), n, this) : 0;
  }
  match(e) {
    let t = [], n = this.re.get_schema_search(), s, r, i, o, u, c, a = false, f = false, h = false, p = 0;
    if (!e.length) return null;
    for (n.lastIndex = 0, this.__opts__.fuzzyLink && this.__schemas__["http:"] && (s = this.re.get_fuzzy_link_search(), s.lastIndex = 0), this.__opts__.fuzzyEmail && this.__schemas__["mailto:"] && (r = this.re.get_fuzzy_mail_host_search(), r.lastIndex = 0, i = this.re.get_mail_name_validator()); ; ) {
      let d = Math.max(p - 1, 0);
      if (r && i && !h && (!u || u.index < p)) for (r.lastIndex < d && (r.lastIndex = d); ; ) {
        let b = r.exec(e);
        if (!b) {
          h = true, u = void 0;
          break;
        }
        let g = i.exec(e.slice(Math.max(0, b.index - 65), b.index));
        if (g) {
          if (u = { schema: "mailto:", index: b.index - g[1].length, lastIndex: b.index + b[0].length }, u.index >= p) break;
          r.lastIndex < d && (r.lastIndex = d);
        }
      }
      if (s && !f && (!o || o.index < p)) for (s.lastIndex < d && (s.lastIndex = d); ; ) {
        let b = s.exec(e);
        if (!b) {
          f = true, o = void 0;
          break;
        }
        if (o = { schema: "", index: b.index + b[1].length, lastIndex: b.index + b[0].length }, o.index >= p) break;
        s.lastIndex < d && (s.lastIndex = d);
      }
      let l = u;
      (!l || o && (o.index < l.index || o.index === l.index && o.lastIndex > l.lastIndex)) && (l = o);
      let D;
      if (!a) for (; ; ) {
        if (!c) {
          n.lastIndex < d && (n.lastIndex = d);
          let m = n.exec(e);
          if (!m) {
            a = true;
            break;
          }
          c = { schema: m[2], index: m.index + m[1].length, lastIndex: m.index + m[0].length };
        }
        if (c.index < p) {
          c = void 0;
          continue;
        }
        if (l && c.index > l.index) break;
        let b = c;
        c = void 0;
        let g = this.testSchemaAt(e, b.schema, b.lastIndex);
        if (g) {
          D = { schema: b.schema, index: b.index, lastIndex: b.lastIndex + g };
          break;
        }
      }
      let _ = D;
      if ((!_ || u && (u.index < _.index || u.index === _.index && u.lastIndex > _.lastIndex)) && (_ = u), (!_ || o && (o.index < _.index || o.index === _.index && o.lastIndex > _.lastIndex)) && (_ = o), !_) break;
      _ === u ? u = void 0 : _ === o && (o = void 0);
      let x = new Ve(e, _.schema, _.index, _.lastIndex);
      x.schema ? this.__schemas__[x.schema].normalize(x, this) : this.normalize(x), t.push(x), p = _.lastIndex;
    }
    return t.length ? t : null;
  }
  matchAtStart(e) {
    if (!e.length) return null;
    let t = this.re.get_schema_at_start().exec(e);
    if (!t) return null;
    let n = this.testSchemaAt(e, t[2], t[0].length);
    if (!n) return null;
    let s = new Ve(e, t[2], t.index + t[1].length, t.index + t[0].length + n);
    return this.__schemas__[s.schema].normalize(s, this), s;
  }
  tlds(e, t = false) {
    return e = Array.isArray(e) ? e : [e], t ? this.__opts__.tlds = this.__opts__.tlds.concat(e) : this.__opts__.tlds = e, this.re.set({ ...this.__opts__, schema_names: Object.keys(this.__schemas__) }), this;
  }
  normalize(e) {
    e.schema || (e.url = `http://${e.url}`), e.schema === "mailto:" && !/^mailto:/i.test(e.url) && (e.url = `mailto:${e.url}`);
  }
};
var dn = /^xn--/;
var pn = /[^\0-\x7F]/;
var mn = /[\x2E\u3002\uFF0E\uFF61]/g;
var _n = { overflow: "Overflow: input needs wider integers to process", "not-basic": "Illegal input >= 0x80 (not a basic code point)", "invalid-input": "Invalid input" };
var Ce = 35;
var L = Math.floor;
var De = String.fromCharCode;
function O(e) {
  throw new RangeError(_n[e]);
}
function gn(e, t) {
  let n = [], s = e.length;
  for (; s--; ) n[s] = t(e[s]);
  return n;
}
function tt(e, t) {
  let n = e.split("@"), s = "";
  n.length > 1 && (s = n[0] + "@", e = n[1]), e = e.replace(mn, ".");
  let r = e.split("."), i = gn(r, t).join(".");
  return s + i;
}
function nt(e) {
  let t = [], n = 0, s = e.length;
  for (; n < s; ) {
    let r = e.charCodeAt(n++);
    if (r >= 55296 && r <= 56319 && n < s) {
      let i = e.charCodeAt(n++);
      (i & 64512) == 56320 ? t.push(((r & 1023) << 10) + (i & 1023) + 65536) : (t.push(r), n--);
    } else t.push(r);
  }
  return t;
}
var kn = (e) => String.fromCodePoint(...e);
var Rn = function(e) {
  return e >= 48 && e < 58 ? 26 + (e - 48) : e >= 65 && e < 91 ? e - 65 : e >= 97 && e < 123 ? e - 97 : 36;
};
var et = function(e, t) {
  return e + 22 + 75 * (e < 26) - ((t != 0) << 5);
};
var rt = function(e, t, n) {
  let s = 0;
  for (e = n ? L(e / 700) : e >> 1, e += L(e / t); e > Ce * 26 >> 1; s += 36) e = L(e / Ce);
  return L(s + (Ce + 1) * e / (e + 38));
};
var it = function(e) {
  let t = [], n = e.length, s = 0, r = 128, i = 72, o = e.lastIndexOf("-");
  o < 0 && (o = 0);
  for (let u = 0; u < o; ++u) e.charCodeAt(u) >= 128 && O("not-basic"), t.push(e.charCodeAt(u));
  for (let u = o > 0 ? o + 1 : 0; u < n; ) {
    let c = s;
    for (let f = 1, h = 36; ; h += 36) {
      u >= n && O("invalid-input");
      let p = Rn(e.charCodeAt(u++));
      p >= 36 && O("invalid-input"), p > L((2147483647 - s) / f) && O("overflow"), s += p * f;
      let d = h <= i ? 1 : h >= i + 26 ? 26 : h - i;
      if (p < d) break;
      let l = 36 - d;
      f > L(2147483647 / l) && O("overflow"), f *= l;
    }
    let a = t.length + 1;
    i = rt(s - c, a, c == 0), L(s / a) > 2147483647 - r && O("overflow"), r += L(s / a), s %= a, t.splice(s++, 0, r);
  }
  return String.fromCodePoint(...t);
};
var st = function(e) {
  let t = [];
  e = nt(e);
  let n = e.length, s = 128, r = 0, i = 72;
  for (let c of e) c < 128 && t.push(De(c));
  let o = t.length, u = o;
  for (o && t.push("-"); u < n; ) {
    let c = 2147483647;
    for (let f of e) f >= s && f < c && (c = f);
    let a = u + 1;
    c - s > L((2147483647 - r) / a) && O("overflow"), r += (c - s) * a, s = c;
    for (let f of e) if (f < s && ++r > 2147483647 && O("overflow"), f === s) {
      let h = r;
      for (let p = 36; ; p += 36) {
        let d = p <= i ? 1 : p >= i + 26 ? 26 : p - i;
        if (h < d) break;
        let l = h - d, D = 36 - d;
        t.push(De(et(d + l % D, 0))), h = L(l / D);
      }
      t.push(De(et(h, 0))), i = rt(r, a, u === o), r = 0, ++u;
    }
    ++r, ++s;
  }
  return t.join("");
};
var xn = function(e) {
  return tt(e, function(t) {
    return dn.test(t) ? it(t.slice(4).toLowerCase()) : t;
  });
};
var bn = function(e) {
  return tt(e, function(t) {
    return pn.test(t) ? "xn--" + st(t) : t;
  });
};
var Cn = { version: "2.3.1", ucs2: { decode: nt, encode: kn }, decode: it, encode: st, toASCII: bn, toUnicode: xn };
var ve = Cn;
var ot = Object.defineProperty;
var kt = (e, t) => {
  let n = {};
  for (var s in e) ot(n, s, { get: e[s], enumerable: true });
  return t || ot(n, Symbol.toStringTag, { value: "Module" }), n;
};
var Dn = kt({ arrayReplaceAt: () => vn, asciiTrim: () => fe, callable: () => Rt, escapeHtml: () => U, escapeRE: () => zn, fromCodePoint: () => K, isMdAsciiPunct: () => ee, isPunctChar: () => bt, isPunctCharCode: () => Q, isSpace: () => E, isValidEntityCode: () => Be, isWhiteSpace: () => V, lib: () => Mn, normalizeReference: () => he, unescapeAll: () => $, unescapeMd: () => Fn });
function Rt(e) {
  let t = function(...n) {
    return Reflect.construct(e, n, new.target && new.target !== t ? new.target : e);
  };
  return Object.defineProperty(t, "name", { value: e.name }), Object.setPrototypeOf(t, e), t.prototype = e.prototype, t;
}
function vn(e, t, n) {
  return [].concat(e.slice(0, t), n, e.slice(t + 1));
}
function Be(e) {
  return !(e >= 55296 && e <= 57343 || e >= 64976 && e <= 65007 || (e & 65535) === 65535 || (e & 65535) === 65534 || e >= 0 && e <= 8 || e === 11 || e >= 14 && e <= 31 || e >= 127 && e <= 159 || e > 1114111);
}
function K(e) {
  if (e > 65535) {
    e -= 65536;
    let t = 55296 + (e >> 10), n = 56320 + (e & 1023);
    return String.fromCharCode(t, n);
  }
  return String.fromCharCode(e);
}
var xt = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g;
var An = new RegExp(`${xt.source}|${/&([a-z#][a-z0-9]{1,31});/gi.source}`, "gi");
var wn = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
function En(e, t) {
  if (t.charCodeAt(0) === 35 && wn.test(t)) {
    let s = t[1].toLowerCase() === "x" ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10);
    return Be(s) ? K(s) : e;
  }
  let n = ue(e);
  return n !== e ? n : e;
}
function Fn(e) {
  return e.indexOf("\\") < 0 ? e : e.replace(xt, "$1");
}
function $(e) {
  return e.indexOf("\\") < 0 && e.indexOf("&") < 0 ? e : e.replace(An, function(t, n, s) {
    return n || En(t, s);
  });
}
var yn = /[&<>"]/;
var Bn = /[&<>"]/g;
var Tn = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
function In(e) {
  return Tn[e];
}
function U(e) {
  return yn.test(e) ? e.replace(Bn, In) : e;
}
var Sn = /[.?*+^$[\]\\(){}|-]/g;
function zn(e) {
  return e.replace(Sn, "\\$&");
}
function E(e) {
  switch (e) {
    case 9:
    case 32:
      return true;
  }
  return false;
}
function V(e) {
  if (e >= 8192 && e <= 8202) return true;
  switch (e) {
    case 9:
    case 10:
    case 11:
    case 12:
    case 13:
    case 32:
    case 160:
    case 5760:
    case 8239:
    case 8287:
    case 12288:
      return true;
  }
  return false;
}
function bt(e) {
  return Y.test(e) || _e.test(e);
}
function Q(e) {
  return bt(K(e));
}
function ee(e) {
  switch (e) {
    case 33:
    case 34:
    case 35:
    case 36:
    case 37:
    case 38:
    case 39:
    case 40:
    case 41:
    case 42:
    case 43:
    case 44:
    case 45:
    case 46:
    case 47:
    case 58:
    case 59:
    case 60:
    case 61:
    case 62:
    case 63:
    case 64:
    case 91:
    case 92:
    case 93:
    case 94:
    case 95:
    case 96:
    case 123:
    case 124:
    case 125:
    case 126:
      return true;
    default:
      return false;
  }
}
function he(e) {
  return e = e.trim().replace(/\s+/g, " "), e.toLowerCase().toUpperCase();
}
function ut(e) {
  return e === 32 || e === 9 || e === 10 || e === 13;
}
function fe(e) {
  let t = 0;
  for (; t < e.length && ut(e.charCodeAt(t)); t++) ;
  let n = e.length - 1;
  for (; n >= t && ut(e.charCodeAt(n)); n--) ;
  return e.slice(t, n + 1);
}
var Mn = { mdurl: de, ucmicro: ke };
function jn(e, t, n) {
  let s, r, i, o, u = e.posMax, c = e.pos;
  for (e.pos = t + 1, s = 1; e.pos < u; ) {
    if (i = e.src.charCodeAt(e.pos), i === 93 && (s--, s === 0)) {
      r = true;
      break;
    }
    if (o = e.pos, e.md.inline.skipToken(e), i === 91) {
      if (o === e.pos - 1) s++;
      else if (n) return e.pos = c, -1;
    }
  }
  let a = -1;
  return r && (a = e.pos), e.pos = c, a;
}
function Ln(e, t, n) {
  let s, r = t, i = { ok: false, pos: 0, str: "" };
  if (e.charCodeAt(r) === 60) {
    for (r++; r < n; ) {
      if (s = e.charCodeAt(r), s === 10 || s === 60) return i;
      if (s === 62) return i.pos = r + 1, i.str = $(e.slice(t + 1, r)), i.ok = true, i;
      if (s === 92 && r + 1 < n) {
        r += 2;
        continue;
      }
      r++;
    }
    return i;
  }
  let o = 0;
  for (; r < n && (s = e.charCodeAt(r), !(s === 32 || s < 32 || s === 127)); ) {
    if (s === 92 && r + 1 < n) {
      if (e.charCodeAt(r + 1) === 32) {
        r++;
        continue;
      }
      r += 2;
      continue;
    }
    if (s === 40 && (o++, o > 32)) return i;
    if (s === 41) {
      if (o === 0) break;
      o--;
    }
    r++;
  }
  return t === r || o !== 0 || (i.str = $(e.slice(t, r)), i.pos = r, i.ok = true), i;
}
function Jn(e, t, n, s) {
  let r, i = t, o = { ok: false, can_continue: false, pos: 0, str: "", marker: 0 };
  if (s) o.str = s.str, o.marker = s.marker;
  else {
    if (i >= n) return o;
    let u = e.charCodeAt(i);
    if (u !== 34 && u !== 39 && u !== 40) return o;
    t++, i++, u === 40 && (u = 41), o.marker = u;
  }
  for (; i < n; ) {
    if (r = e.charCodeAt(i), r === o.marker) return o.pos = i + 1, o.str += $(e.slice(t, i)), o.ok = true, o;
    if (r === 40 && o.marker === 41) return o;
    r === 92 && i + 1 < n && i++, i++;
  }
  return o.can_continue = true, o.str += $(e.slice(t, i)), o;
}
var Nn = kt({ parseLinkDestination: () => Ln, parseLinkLabel: () => jn, parseLinkTitle: () => Jn });
function te(e) {
  "@babel/helpers - typeof";
  return te = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, te(e);
}
function Pn(e, t) {
  if (te(e) != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var s = n.call(e, t || "default");
    if (te(s) != "object") return s;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function On(e) {
  var t = Pn(e, "string");
  return te(t) == "symbol" ? t : t + "";
}
function k(e, t, n) {
  return (t = On(t)) in e ? Object.defineProperty(e, t, { value: n, enumerable: true, configurable: true, writable: true }) : e[t] = n, e;
}
var q = class {
  constructor(e, t, n) {
    k(this, "map", null), k(this, "level", 0), k(this, "children", null), k(this, "content", ""), k(this, "markup", ""), k(this, "info", ""), k(this, "block", false), k(this, "hidden", false), this.type = e, this.tag = t, this.attrs = null, this.nesting = n, this.meta = null;
  }
  attrIndex(e) {
    if (!this.attrs) return -1;
    let t = this.attrs;
    for (let n = 0, s = t.length; n < s; n++) if (t[n][0] === e) return n;
    return -1;
  }
  attrPush(e) {
    this.attrs ? this.attrs.push(e) : this.attrs = [e];
  }
  attrSet(e, t) {
    let n = this.attrIndex(e), s = [e, t];
    n < 0 ? this.attrPush(s) : this.attrs[n] = s;
  }
  attrGet(e) {
    let t = this.attrIndex(e), n = null;
    return t >= 0 && (n = this.attrs[t][1]), n;
  }
  attrJoin(e, t) {
    let n = this.attrIndex(e);
    n < 0 ? this.attrPush([e, t]) : this.attrs[n][1] = `${this.attrs[n][1]} ${t}`;
  }
};
var ne = class {
  constructor() {
    k(this, "__rules__", []), k(this, "__cache__", null);
  }
  __find__(e) {
    for (let t = 0; t < this.__rules__.length; t++) if (this.__rules__[t].name === e) return t;
    return -1;
  }
  __compile__() {
    let e = /* @__PURE__ */ new Set();
    this.__rules__.forEach((t) => {
      t.enabled && t.alt.forEach((n) => {
        n && e.add(n);
      });
    }), this.__cache__ = /* @__PURE__ */ Object.create(null), this.__cache__[""] = [], this.__rules__.forEach((t) => {
      t.enabled && this.__cache__[""].push(t.fn);
    }), e.forEach((t) => {
      this.__cache__[t] = [], this.__rules__.forEach((n) => {
        n.enabled && n.alt.indexOf(t) >= 0 && this.__cache__[t].push(n.fn);
      });
    });
  }
  at(e, t, n = {}) {
    let s = this.__find__(e);
    if (s === -1) throw new Error(`Parser rule not found: ${e}`);
    this.__rules__[s].fn = t, this.__rules__[s].alt = n.alt || [], this.__cache__ = null;
  }
  before(e, t, n, s = {}) {
    let r = this.__find__(e);
    if (r === -1) throw new Error(`Parser rule not found: ${e}`);
    this.__rules__.splice(r, 0, { name: t, enabled: true, fn: n, alt: s.alt || [] }), this.__cache__ = null;
  }
  after(e, t, n, s = {}) {
    let r = this.__find__(e);
    if (r === -1) throw new Error(`Parser rule not found: ${e}`);
    this.__rules__.splice(r + 1, 0, { name: t, enabled: true, fn: n, alt: s.alt || [] }), this.__cache__ = null;
  }
  push(e, t, n = {}) {
    this.__rules__.push({ name: e, enabled: true, fn: t, alt: n.alt || [] }), this.__cache__ = null;
  }
  enable(e, t = false) {
    Array.isArray(e) || (e = [e]);
    let n = [];
    return e.forEach((s) => {
      let r = this.__find__(s);
      if (r < 0) {
        if (t) return;
        throw new Error(`Rules manager: invalid rule name ${s}`);
      }
      this.__rules__[r].enabled = true, n.push(s);
    }), this.__cache__ = null, n;
  }
  enableOnly(e, t = false) {
    Array.isArray(e) || (e = [e]), this.__rules__.forEach((n) => {
      n.enabled = false;
    }), this.enable(e, t);
  }
  disable(e, t = false) {
    Array.isArray(e) || (e = [e]);
    let n = [];
    return e.forEach((s) => {
      let r = this.__find__(s);
      if (r < 0) {
        if (t) return;
        throw new Error(`Rules manager: invalid rule name ${s}`);
      }
      this.__rules__[r].enabled = false, n.push(s);
    }), this.__cache__ = null, n;
  }
  getRules(e) {
    return this.__cache__ || this.__compile__(), this.__cache__[e] || [];
  }
};
var J = {};
J.code_inline = function(e, t, n, s, r) {
  let i = e[t];
  return `<code${r.renderAttrs(i)}>${U(i.content)}</code>`;
};
J.code_block = function(e, t, n, s, r) {
  let i = e[t];
  return `<pre${r.renderAttrs(i)}><code>${U(e[t].content)}</code></pre>
`;
};
J.fence = function(e, t, n, s, r) {
  let i = e[t], o = i.info ? $(i.info).trim() : "", u = "", c = "";
  if (o) {
    let f = o.split(/(\s+)/g);
    u = f[0], c = f.slice(2).join("");
  }
  let a;
  if (n.highlight ? a = n.highlight(i.content, u, c) || U(i.content) : a = U(i.content), a.indexOf("<pre") === 0) return a + `
`;
  if (o) {
    let f = i.attrIndex("class"), h = i.attrs ? i.attrs.slice() : [];
    f < 0 ? h.push(["class", `${n.langPrefix}${u}`]) : (h[f] = [h[f][0], h[f][1]], h[f][1] += ` ${n.langPrefix}${u}`);
    let p = { attrs: h };
    return `<pre><code${r.renderAttrs(p)}>${a}</code></pre>
`;
  }
  return `<pre><code${r.renderAttrs(i)}>${a}</code></pre>
`;
};
J.image = function(e, t, n, s, r) {
  let i = e[t];
  return i.attrs[i.attrIndex("alt")][1] = r.renderInlineAsText(i.children, n, s), r.renderToken(e, t, n);
};
J.hardbreak = function(e, t, n) {
  return n.xhtmlOut ? `<br />
` : `<br>
`;
};
J.softbreak = function(e, t, n) {
  return n.breaks ? n.xhtmlOut ? `<br />
` : `<br>
` : `
`;
};
J.text = function(e, t) {
  return U(e[t].content);
};
J.html_block = function(e, t) {
  return e[t].content;
};
J.html_inline = function(e, t) {
  return e[t].content;
};
var Ct = class {
  constructor() {
    k(this, "rules", Object.assign({}, J));
  }
  renderAttrs(e) {
    let t, n, s;
    if (!e.attrs) return "";
    for (s = "", t = 0, n = e.attrs.length; t < n; t++) s += ` ${U(e.attrs[t][0])}="${U(String(e.attrs[t][1]))}"`;
    return s;
  }
  renderToken(e, t, n) {
    let s = e[t], r = "";
    if (s.hidden) return "";
    let i = t - 1;
    for (; i >= 0 && e[i].hidden && e[i].nesting === 0; ) i--;
    s.block && s.nesting !== -1 && i >= 0 && e[i].hidden && e[i].nesting === -1 && (r += `
`), r += (s.nesting === -1 ? "</" : "<") + s.tag, r += this.renderAttrs(s), s.nesting === 0 && n.xhtmlOut && (r += " /");
    let o = false;
    if (s.block && (o = true, s.nesting === 1)) {
      let u = t + 1;
      for (; u < e.length && e[u].hidden && e[u].nesting === 0; ) u++;
      if (u < e.length) {
        let c = e[u];
        (c.type === "inline" || c.hidden || c.nesting === -1 && c.tag === s.tag) && (o = false);
      }
    }
    return r += o ? `>
` : ">", r;
  }
  renderInline(e, t, n) {
    let s = "", r = this.rules;
    for (let i = 0, o = e.length; i < o; i++) {
      let u = e[i].type;
      typeof r[u] < "u" ? s += r[u](e, i, t, n, this) : s += this.renderToken(e, i, t);
    }
    return s;
  }
  renderInlineAsText(e, t, n) {
    let s = "";
    for (let r = 0, i = e.length; r < i; r++) switch (e[r].type) {
      case "text":
      case "code_inline":
        s += e[r].content;
        break;
      case "image":
        s += this.renderInlineAsText(e[r].children, t, n);
        break;
      case "html_inline":
      case "html_block":
        s += e[r].content;
        break;
      case "softbreak":
      case "hardbreak":
        s += `
`;
    }
    return s;
  }
  render(e, t, n) {
    let s = "", r = this.rules;
    for (let i = 0, o = e.length; i < o; i++) {
      let u = e[i].type;
      u === "inline" ? s += this.renderInline(e[i].children, t, n) : typeof r[u] < "u" ? s += r[u](e, i, t, n, this) : s += this.renderToken(e, i, t);
    }
    return s;
  }
};
var Dt = class {
  constructor(e, t, n) {
    k(this, "tokens", []), k(this, "inlineMode", false), k(this, "Token", q), this.src = e, this.env = n, this.md = t;
  }
};
var Un = /\r\n?/g;
var Wn = /\0/g;
function qn(e) {
  let t;
  t = e.src.replace(Un, `
`), t = t.replace(Wn, "\uFFFD"), e.src = t;
}
function Zn(e) {
  let t;
  e.inlineMode ? (t = new e.Token("inline", "", 0), t.content = e.src, t.map = [0, 1], t.children = [], e.tokens.push(t)) : e.md.block.parse(e.src, e.md, e.env, e.tokens);
}
function $n(e) {
  let t = e.tokens, n = 0;
  for (let s = 0; s < t.length; s++) t[s].type !== "reference_definition" && (s !== n && (t[n] = t[s]), n++);
  t.length !== n && (t.length = n);
}
function Xn(e) {
  let t = e.tokens;
  for (let n = 0, s = t.length; n < s; n++) {
    let r = t[n];
    r.type === "inline" && e.md.inline.parse(r.content, e.md, e.env, r.children);
  }
}
function Hn(e) {
  return /^<a[>\s]/i.test(e);
}
function Yn(e) {
  return /^<\/a\s*>/i.test(e);
}
function Gn(e) {
  let t = e.tokens;
  if (e.md.options.linkify) for (let n = 0, s = t.length; n < s; n++) {
    if (t[n].type !== "inline" || !e.md.linkify.test(t[n].content)) continue;
    let r = t[n].children, i = [], o = 0;
    for (let u = r.length - 1; u >= 0; u--) {
      let c = r[u];
      if (c.type === "link_close") {
        for (u--; r[u].level !== c.level && r[u].type !== "link_open"; ) u--;
        continue;
      }
      if (c.type === "html_inline" && (Hn(c.content) && o > 0 && o--, Yn(c.content) && o++), !(o > 0) && c.type === "text" && e.md.linkify.test(c.content)) {
        let a = c.content, f = e.md.linkify.match(a), h = [], p = c.level, d = 0;
        f.length > 0 && f[0].index === 0 && u > 0 && r[u - 1].type === "text_special" && (f = f.slice(1));
        for (let l = 0; l < f.length; l++) {
          let D = f[l].url, _ = e.md.normalizeLink(D);
          if (!e.md.validateLink(_)) continue;
          let x = f[l].text;
          f[l].schema ? f[l].schema === "mailto:" && !/^mailto:/i.test(x) ? x = e.md.normalizeLinkText(`mailto:${x}`).replace(/^mailto:/, "") : x = e.md.normalizeLinkText(x) : x = e.md.normalizeLinkText(`http://${x}`).replace(/^http:\/\//, "");
          let b = f[l].index;
          if (b > d) {
            let C = new e.Token("text", "", 0);
            C.content = a.slice(d, b), C.level = p, h.push(C);
          }
          let g = new e.Token("link_open", "a", 1);
          g.attrs = [["href", _]], g.level = p++, g.markup = "linkify", g.info = "auto", h.push(g);
          let m = new e.Token("text", "", 0);
          m.content = x, m.level = p, h.push(m);
          let R = new e.Token("link_close", "a", -1);
          R.level = --p, R.markup = "linkify", R.info = "auto", h.push(R), d = f[l].lastIndex;
        }
        if (d < a.length) {
          let l = new e.Token("text", "", 0);
          l.content = a.slice(d), l.level = p, h.push(l);
        }
        i.push({ index: u, nodes: h });
      }
    }
    if (i.length > 0) {
      let u = r.length;
      for (let h of i) u += h.nodes.length - 1;
      let c = new Array(u), a = 0, f = 0;
      i.reverse();
      for (let h = 0; h < r.length; h++) {
        let p = i[a];
        if (p?.index === h) {
          for (let d of p.nodes) c[f++] = d;
          a++;
        } else c[f++] = r[h];
      }
      t[n].children = c;
    }
  }
}
var vt = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/;
var Kn = /\((c|tm|r)\)/i;
var Vn = /\((c|tm|r)\)/gi;
var Qn = { c: "\xA9", r: "\xAE", tm: "\u2122" };
function er(e, t) {
  return Qn[t.toLowerCase()];
}
function tr(e) {
  let t = 0;
  for (let n = e.length - 1; n >= 0; n--) {
    let s = e[n];
    s.type === "text" && !t && (s.content = s.content.replace(Vn, er)), s.type === "link_open" && s.info === "auto" && t--, s.type === "link_close" && s.info === "auto" && t++;
  }
}
function nr(e) {
  let t = 0;
  for (let n = e.length - 1; n >= 0; n--) {
    let s = e[n];
    s.type === "text" && !t && vt.test(s.content) && (s.content = s.content.replace(/\+-/g, "\xB1").replace(/\.{2,}/g, "\u2026").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/gm, "$1\u2014").replace(/(^|\s)--(?=\s|$)/gm, "$1\u2013").replace(/(^|[^-\s])--(?=[^-\s]|$)/gm, "$1\u2013")), s.type === "link_open" && s.info === "auto" && t--, s.type === "link_close" && s.info === "auto" && t++;
  }
}
function rr(e) {
  let t;
  if (e.md.options.typographer) for (t = e.tokens.length - 1; t >= 0; t--) e.tokens[t].type === "inline" && (Kn.test(e.tokens[t].content) && tr(e.tokens[t].children), vt.test(e.tokens[t].content) && nr(e.tokens[t].children));
}
var ir = /['"]/;
var ct = /['"]/g;
var at = "\u2019";
var sr = 1e3;
function lt(e, t, n) {
  for (; e.length > n; ) {
    let s = e.pop();
    s.isSingleQuote ? t.single = s.prevSameQuoteIdx : t.double = s.prevSameQuoteIdx;
  }
}
function ce(e, t, n, s) {
  e[t] || (e[t] = []), e[t].push({ pos: n, ch: s });
}
function or(e, t) {
  let n = "", s = 0;
  t.sort((r, i) => r.pos - i.pos);
  for (let r = 0; r < t.length; r++) {
    let i = t[r];
    n += e.slice(s, i.pos) + i.ch, s = i.pos + 1;
  }
  return n + e.slice(s);
}
function ur(e, t) {
  let n, s = [], r = { single: -1, double: -1 }, i = {};
  for (let o = 0; o < e.length; o++) {
    let u = e[o], c = e[o].level;
    for (n = s.length - 1; n >= 0 && !(s[n].level <= c); n--) ;
    if (lt(s, r, n + 1), u.type !== "text") continue;
    let a = u.content, f = 0, h = a.length;
    e: for (; f < h; ) {
      ct.lastIndex = f;
      let p = ct.exec(a);
      if (!p) break;
      let d = true, l = true;
      f = p.index + 1;
      let D = p[0] === "'", _ = 32;
      if (p.index - 1 >= 0) _ = a.charCodeAt(p.index - 1);
      else for (n = o - 1; n >= 0 && !(e[n].type === "softbreak" || e[n].type === "hardbreak"); n--) if (e[n].content) {
        _ = e[n].content.charCodeAt(e[n].content.length - 1);
        break;
      }
      let x = 32;
      if (f < h) x = a.charCodeAt(f);
      else for (n = o + 1; n < e.length && !(e[n].type === "softbreak" || e[n].type === "hardbreak"); n++) if (e[n].content) {
        x = e[n].content.charCodeAt(0);
        break;
      }
      let b = ee(_) || Q(_), g = ee(x) || Q(x), m = V(_), R = V(x);
      if (R ? d = false : g && (m || b || (d = false)), m ? l = false : b && (R || g || (l = false)), x === 34 && p[0] === '"' && _ >= 48 && _ <= 57 && (l = d = false), d && l && (d = b, l = g), !d && !l) {
        D && ce(i, o, p.index, at);
        continue;
      }
      if (l && (n = D ? r.single : r.double, n >= 0 && s[n].level === c)) {
        let C = s[n], v, F;
        D ? (v = t.md.options.quotes[2], F = t.md.options.quotes[3]) : (v = t.md.options.quotes[0], F = t.md.options.quotes[1]), ce(i, o, p.index, F), ce(i, C.tokenIdx, C.contentPos, v), lt(s, r, n);
        continue e;
      }
      if (d) {
        if (s.length >= sr) return;
        s.push({ tokenIdx: o, contentPos: p.index, isSingleQuote: D, level: c, prevSameQuoteIdx: D ? r.single : r.double }), D ? r.single = s.length - 1 : r.double = s.length - 1;
      } else l && D && ce(i, o, p.index, at);
    }
  }
  Object.keys(i).forEach(function(o) {
    let u = Number(o);
    e[u].content = or(e[u].content, i[o]);
  });
}
function cr(e) {
  if (e.md.options.typographer) for (let t = e.tokens.length - 1; t >= 0; t--) e.tokens[t].type !== "inline" || !ir.test(e.tokens[t].content) || ur(e.tokens[t].children, e);
}
function ar(e) {
  let t, n, s = e.length;
  for (t = 0; t < s; t++) e[t].type === "text_special" && (e[t].type = "text");
  for (t = n = 0; t < s; t++) e[t].type === "text" && t + 1 < s && e[t + 1].type === "text" ? e[t + 1].content = e[t].content + e[t + 1].content : (t !== n && (e[n] = e[t]), n++);
  t !== n && (e.length = n);
}
function lr(e) {
  let t, n, s = e.tokens, r = s.length;
  for (let i = 0; i < r; i++) {
    if (s[i].type !== "inline") continue;
    let o = s[i].children, u = o.length;
    for (t = 0; t < u; t++) o[t].type === "text_special" && (o[t].type = "text"), o[t].children && ar(o[t].children);
    for (t = n = 0; t < u; t++) o[t].type === "text" && t + 1 < u && o[t + 1].type === "text" ? o[t + 1].content = o[t].content + o[t + 1].content : (t !== n && (o[n] = o[t]), n++);
    t !== n && (o.length = n);
  }
}
var Ae = [["normalize", qn], ["block", Zn], ["strip_references", $n], ["inline", Xn], ["linkify", Gn], ["replacements", rr], ["smartquotes", cr], ["text_join", lr]];
var At = class {
  constructor() {
    k(this, "ruler", new ne()), k(this, "State", Dt);
    for (let e = 0; e < Ae.length; e++) this.ruler.push(Ae[e][0], Ae[e][1]);
  }
  process(e) {
    let t = this.ruler.getRules("");
    for (let n = 0, s = t.length; n < s; n++) t[n](e);
  }
};
var wt = class {
  constructor(e, t, n, s) {
    k(this, "bMarks", []), k(this, "eMarks", []), k(this, "tShift", []), k(this, "sCount", []), k(this, "bsCount", []), k(this, "blkIndent", 0), k(this, "line", 0), k(this, "lineMax", 0), k(this, "tight", false), k(this, "listIndent", -1), k(this, "parentType", "root"), k(this, "level", 0), k(this, "Token", q), this.src = e, this.md = t, this.env = n, this.tokens = s;
    let r = this.src;
    for (let i = 0, o = 0, u = 0, c = 0, a = r.length, f = false; o < a; o++) {
      let h = r.charCodeAt(o);
      if (!f) if (E(h)) {
        u++, h === 9 ? c += 4 - c % 4 : c++;
        continue;
      } else f = true;
      (h === 10 || o === a - 1) && (h !== 10 && o++, this.bMarks.push(i), this.eMarks.push(o), this.tShift.push(u), this.sCount.push(c), this.bsCount.push(0), f = false, u = 0, c = 0, i = o + 1);
    }
    this.bMarks.push(r.length), this.eMarks.push(r.length), this.tShift.push(0), this.sCount.push(0), this.bsCount.push(0), this.lineMax = this.bMarks.length - 1;
  }
  push(e, t, n) {
    let s = new q(e, t, n);
    return s.block = true, n < 0 && this.level--, s.level = this.level, n > 0 && this.level++, this.tokens.push(s), s;
  }
  isEmpty(e) {
    return this.bMarks[e] + this.tShift[e] >= this.eMarks[e];
  }
  skipEmptyLines(e) {
    for (let t = this.lineMax; e < t && !(this.bMarks[e] + this.tShift[e] < this.eMarks[e]); e++) ;
    return e;
  }
  skipSpaces(e) {
    for (let t = this.src.length; e < t && E(this.src.charCodeAt(e)); e++) ;
    return e;
  }
  skipSpacesBack(e, t) {
    if (e <= t) return e;
    for (; e > t; ) if (!E(this.src.charCodeAt(--e))) return e + 1;
    return e;
  }
  skipChars(e, t) {
    for (let n = this.src.length; e < n && this.src.charCodeAt(e) === t; e++) ;
    return e;
  }
  skipCharsBack(e, t, n) {
    if (e <= n) return e;
    for (; e > n; ) if (t !== this.src.charCodeAt(--e)) return e + 1;
    return e;
  }
  getLines(e, t, n, s) {
    if (e >= t) return "";
    let r = new Array(t - e);
    for (let i = 0, o = e; o < t; o++, i++) {
      let u = 0, c = this.bMarks[o], a = c, f;
      for (o + 1 < t || s ? f = this.eMarks[o] + 1 : f = this.eMarks[o]; a < f && u < n; ) {
        let h = this.src.charCodeAt(a);
        if (E(h)) h === 9 ? u += 4 - (u + this.bsCount[o]) % 4 : u++;
        else if (a - c < this.tShift[o]) u++;
        else break;
        a++;
      }
      u > n ? r[i] = new Array(u - n + 1).join(" ") + this.src.slice(a, f) : r[i] = this.src.slice(a, f);
    }
    return r.join("");
  }
};
var hr = 65536;
function we(e, t) {
  let n = e.bMarks[t] + e.tShift[t], s = e.eMarks[t];
  return e.src.slice(n, s);
}
function ht(e) {
  let t = [], n = e.length, s = 0, r = e.charCodeAt(s), i = false, o = 0, u = "";
  for (; s < n; ) r === 124 && (i ? (u += e.substring(o, s - 1), o = s) : (t.push(u + e.substring(o, s)), u = "", o = s + 1)), i = r === 92, s++, r = e.charCodeAt(s);
  return t.push(u + e.substring(o)), t;
}
function fr(e, t, n, s) {
  if (t + 2 > n) return false;
  let r = t + 1;
  if (e.sCount[r] < e.blkIndent || e.sCount[r] - e.blkIndent >= 4) return false;
  let i = e.bMarks[r] + e.tShift[r];
  if (i >= e.eMarks[r]) return false;
  let o = e.src.charCodeAt(i++);
  if (o !== 124 && o !== 45 && o !== 58 || i >= e.eMarks[r]) return false;
  let u = e.src.charCodeAt(i++);
  if (u !== 124 && u !== 45 && u !== 58 && !E(u) || o === 45 && E(u)) return false;
  for (; i < e.eMarks[r]; ) {
    let m = e.src.charCodeAt(i);
    if (m !== 124 && m !== 45 && m !== 58 && !E(m)) return false;
    i++;
  }
  let c = we(e, t + 1), a = c.split("|"), f = [];
  for (let m = 0; m < a.length; m++) {
    let R = a[m].trim();
    if (!R) {
      if (m === 0 || m === a.length - 1) continue;
      return false;
    }
    if (!/^:?-+:?$/.test(R)) return false;
    R.charCodeAt(R.length - 1) === 58 ? f.push(R.charCodeAt(0) === 58 ? "center" : "right") : R.charCodeAt(0) === 58 ? f.push("left") : f.push("");
  }
  if (c = we(e, t).trim(), c.indexOf("|") === -1 || e.sCount[t] - e.blkIndent >= 4) return false;
  a = ht(c), a.length && a[0] === "" && a.shift(), a.length && a[a.length - 1] === "" && a.pop();
  let h = a.length;
  if (h === 0 || h !== f.length) return false;
  if (s) return true;
  let p = e.parentType;
  e.parentType = "table";
  let d = e.md.block.ruler.getRules("blockquote"), l = e.push("table_open", "table", 1), D = [t, 0];
  l.map = D;
  let _ = e.push("thead_open", "thead", 1);
  _.map = [t, t + 1];
  let x = e.push("tr_open", "tr", 1);
  x.map = [t, t + 1];
  for (let m = 0; m < a.length; m++) {
    let R = e.push("th_open", "th", 1);
    f[m] && (R.attrs = [["style", `text-align:${f[m]}`]]);
    let C = e.push("inline", "", 0);
    C.content = a[m].trim(), C.children = [], e.push("th_close", "th", -1);
  }
  e.push("tr_close", "tr", -1), e.push("thead_close", "thead", -1);
  let b, g = 0;
  for (r = t + 2; r < n && !(e.sCount[r] < e.blkIndent); r++) {
    let m = false;
    for (let C = 0, v = d.length; C < v; C++) if (d[C](e, r, n, true)) {
      m = true;
      break;
    }
    if (m || (c = we(e, r).trim(), !c) || e.sCount[r] - e.blkIndent >= 4 || (a = ht(c), a.length && a[0] === "" && a.shift(), a.length && a[a.length - 1] === "" && a.pop(), g += h - a.length, g > hr)) break;
    if (r === t + 2) {
      let C = e.push("tbody_open", "tbody", 1);
      C.map = b = [t + 2, 0];
    }
    let R = e.push("tr_open", "tr", 1);
    R.map = [r, r + 1];
    for (let C = 0; C < h; C++) {
      let v = e.push("td_open", "td", 1);
      f[C] && (v.attrs = [["style", `text-align:${f[C]}`]]);
      let F = e.push("inline", "", 0);
      F.content = a[C] ? a[C].trim() : "", F.children = [], e.push("td_close", "td", -1);
    }
    e.push("tr_close", "tr", -1);
  }
  return b && (e.push("tbody_close", "tbody", -1), b[1] = r), e.push("table_close", "table", -1), D[1] = r, e.parentType = p, e.line = r, true;
}
function dr(e, t, n) {
  if (e.sCount[t] - e.blkIndent < 4) return false;
  let s = t + 1, r = s;
  for (; s < n; ) {
    if (e.isEmpty(s)) {
      s++;
      continue;
    }
    if (e.sCount[s] - e.blkIndent >= 4) {
      s++, r = s;
      continue;
    }
    break;
  }
  e.line = r;
  let i = e.push("code_block", "code", 0);
  return i.content = e.getLines(t, r, 4 + e.blkIndent, false) + `
`, i.map = [t, e.line], true;
}
function pr(e, t, n, s) {
  let r = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4 || r + 3 > i) return false;
  let o = e.src.charCodeAt(r);
  if (o !== 126 && o !== 96) return false;
  let u = r;
  r = e.skipChars(r, o);
  let c = r - u;
  if (c < 3) return false;
  let a = e.src.slice(u, r), f = e.src.slice(r, i);
  if (o === 96 && f.indexOf(String.fromCharCode(o)) >= 0) return false;
  if (s) return true;
  let h = t, p = false;
  for (; h++, !(h >= n || (r = u = e.bMarks[h] + e.tShift[h], i = e.eMarks[h], r < i && e.sCount[h] < e.blkIndent)); ) if (e.src.charCodeAt(r) === o && !(e.sCount[h] - e.blkIndent >= 4) && (r = e.skipChars(r, o), !(r - u < c) && (r = e.skipSpaces(r), !(r < i)))) {
    p = true;
    break;
  }
  c = e.sCount[t], e.line = h + (p ? 1 : 0);
  let d = e.push("fence", "code", 0);
  return d.info = f, d.content = e.getLines(t + 1, h, c, true), d.markup = a, d.map = [t, e.line], true;
}
function mr(e, t, n, s) {
  let r = e.bMarks[t] + e.tShift[t], i = e.eMarks[t], o = e.lineMax;
  if (e.sCount[t] - e.blkIndent >= 4 || e.src.charCodeAt(r) !== 62) return false;
  if (s) return true;
  let u = [], c = [], a = [], f = [], h = e.md.block.ruler.getRules("blockquote"), p = e.parentType;
  e.parentType = "blockquote";
  let d = false, l;
  for (l = t; l < n; l++) {
    let g = e.sCount[l] < e.blkIndent;
    if (r = e.bMarks[l] + e.tShift[l], i = e.eMarks[l], r >= i) break;
    if (e.src.charCodeAt(r++) === 62 && !g) {
      let R = e.sCount[l] + 1, C, v;
      e.src.charCodeAt(r) === 32 ? (r++, R++, v = false, C = true) : e.src.charCodeAt(r) === 9 ? (C = true, (e.bsCount[l] + R) % 4 === 3 ? (r++, R++, v = false) : v = true) : C = false;
      let F = R;
      for (u.push(e.bMarks[l]), e.bMarks[l] = r; r < i; ) {
        let A = e.src.charCodeAt(r);
        if (E(A)) A === 9 ? F += 4 - (F + e.bsCount[l] + (v ? 1 : 0)) % 4 : F++;
        else break;
        r++;
      }
      d = r >= i, c.push(e.bsCount[l]), e.bsCount[l] = e.sCount[l] + 1 + (C ? 1 : 0), a.push(e.sCount[l]), e.sCount[l] = F - R, f.push(e.tShift[l]), e.tShift[l] = r - e.bMarks[l];
      continue;
    }
    if (d) break;
    let m = false;
    for (let R = 0, C = h.length; R < C; R++) if (h[R](e, l, n, true)) {
      m = true;
      break;
    }
    if (m) {
      e.lineMax = l, e.blkIndent !== 0 && (u.push(e.bMarks[l]), c.push(e.bsCount[l]), f.push(e.tShift[l]), a.push(e.sCount[l]), e.sCount[l] -= e.blkIndent);
      break;
    }
    u.push(e.bMarks[l]), c.push(e.bsCount[l]), f.push(e.tShift[l]), a.push(e.sCount[l]), e.sCount[l] = -1;
  }
  let D = e.blkIndent;
  e.blkIndent = 0;
  let _ = e.push("blockquote_open", "blockquote", 1);
  _.markup = ">";
  let x = [t, 0];
  _.map = x, e.md.block.tokenize(e, t, l);
  let b = e.push("blockquote_close", "blockquote", -1);
  b.markup = ">", e.lineMax = o, e.parentType = p, x[1] = e.line;
  for (let g = 0; g < f.length; g++) e.bMarks[g + t] = u[g], e.tShift[g + t] = f[g], e.sCount[g + t] = a[g], e.bsCount[g + t] = c[g];
  return e.blkIndent = D, true;
}
function _r(e, t, n, s) {
  let r = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4) return false;
  let i = e.bMarks[t] + e.tShift[t], o = e.src.charCodeAt(i++);
  if (o !== 42 && o !== 45 && o !== 95) return false;
  let u = 1;
  for (; i < r; ) {
    let a = e.src.charCodeAt(i++);
    if (a !== o && !E(a)) return false;
    a === o && u++;
  }
  if (u < 3) return false;
  if (s) return true;
  e.line = t + 1;
  let c = e.push("hr", "hr", 0);
  return c.map = [t, e.line], c.markup = Array(u + 1).join(String.fromCharCode(o)), true;
}
function ft(e, t) {
  let n = e.eMarks[t], s = e.bMarks[t] + e.tShift[t], r = e.src.charCodeAt(s++);
  return r !== 42 && r !== 45 && r !== 43 || s < n && !E(e.src.charCodeAt(s)) ? -1 : s;
}
function dt(e, t) {
  let n = e.bMarks[t] + e.tShift[t], s = e.eMarks[t], r = n;
  if (r + 1 >= s) return -1;
  let i = e.src.charCodeAt(r++);
  if (i < 48 || i > 57) return -1;
  for (; ; ) {
    if (r >= s) return -1;
    if (i = e.src.charCodeAt(r++), i >= 48 && i <= 57) {
      if (r - n >= 10) return -1;
      continue;
    }
    if (i === 41 || i === 46) break;
    return -1;
  }
  return r < s && (i = e.src.charCodeAt(r), !E(i)) ? -1 : r;
}
function gr(e, t) {
  let n = e.level + 2;
  for (let s = t + 2, r = e.tokens.length - 2; s < r; s++) e.tokens[s].level === n && e.tokens[s].type === "paragraph_open" && (e.tokens[s + 2].hidden = true, e.tokens[s].hidden = true, s += 2);
}
function kr(e, t, n, s) {
  let r, i, o, u, c = t, a = true;
  if (e.sCount[c] - e.blkIndent >= 4 || e.listIndent >= 0 && e.sCount[c] - e.listIndent >= 4 && e.sCount[c] < e.blkIndent) return false;
  let f = false;
  s && e.parentType === "paragraph" && e.sCount[c] >= e.blkIndent && (f = true);
  let h, p, d;
  if ((d = dt(e, c)) >= 0) {
    if (h = true, o = e.bMarks[c] + e.tShift[c], p = Number(e.src.slice(o, d - 1)), f && p !== 1) return false;
  } else if ((d = ft(e, c)) >= 0) h = false;
  else return false;
  if (f && e.skipSpaces(d) >= e.eMarks[c]) return false;
  if (s) return true;
  let l = e.src.charCodeAt(d - 1), D = e.tokens.length;
  h ? (u = e.push("ordered_list_open", "ol", 1), p !== 1 && (u.attrs = [["start", p]])) : u = e.push("bullet_list_open", "ul", 1);
  let _ = [c, 0];
  u.map = _, u.markup = String.fromCharCode(l);
  let x = false, b = e.md.block.ruler.getRules("list"), g = e.parentType;
  for (e.parentType = "list"; c < n; ) {
    i = d, r = e.eMarks[c];
    let m = e.sCount[c] + d - (e.bMarks[c] + e.tShift[c]), R = m;
    for (; i < r; ) {
      let S = e.src.charCodeAt(i);
      if (S === 9) R += 4 - (R + e.bsCount[c]) % 4;
      else if (S === 32) R++;
      else break;
      i++;
    }
    let C = i, v;
    C >= r ? v = 1 : v = R - m, v > 4 && (v = 1);
    let F = m + v;
    u = e.push("list_item_open", "li", 1), u.markup = String.fromCharCode(l);
    let A = [c, 0];
    u.map = A, h && (u.info = e.src.slice(o, d - 1));
    let B = e.tight, w = e.tShift[c], T = e.sCount[c], M = e.listIndent;
    if (e.listIndent = e.blkIndent, e.blkIndent = F, e.tight = true, e.tShift[c] = C - e.bMarks[c], e.sCount[c] = R, C >= r && e.isEmpty(c + 1) ? e.line = Math.min(e.line + 2, n) : e.md.block.tokenize(e, c, n), (!e.tight || x) && (a = false), x = e.line - c > 1 && e.isEmpty(e.line - 1), e.blkIndent = e.listIndent, e.listIndent = M, e.tShift[c] = w, e.sCount[c] = T, e.tight = B, u = e.push("list_item_close", "li", -1), u.markup = String.fromCharCode(l), c = e.line, A[1] = c, c >= n || e.sCount[c] < e.blkIndent || e.sCount[c] - e.blkIndent >= 4) break;
    let z = false;
    for (let S = 0, jt = b.length; S < jt; S++) if (b[S](e, c, n, true)) {
      z = true;
      break;
    }
    if (z) break;
    if (h) {
      if (d = dt(e, c), d < 0) break;
      o = e.bMarks[c] + e.tShift[c];
    } else if (d = ft(e, c), d < 0) break;
    if (l !== e.src.charCodeAt(d - 1)) break;
  }
  return h ? u = e.push("ordered_list_close", "ol", -1) : u = e.push("bullet_list_close", "ul", -1), u.markup = String.fromCharCode(l), _[1] = c, e.line = c, e.parentType = g, a && gr(e, D), true;
}
var Ee = 999;
function Rr(e) {
  let t = e.length;
  for (let n = 0; n < e.length - 1; n++) {
    let s = e.charCodeAt(n);
    if (s < 55296 || s > 56319) continue;
    let r = e.charCodeAt(n + 1);
    r >= 56320 && r <= 57343 && (t--, n++);
  }
  return t;
}
function G(e, t) {
  return Math.min(e.eMarks[t] + 1, e.src.length);
}
function ae(e, t) {
  let n = e.lineMax;
  if (t >= n || e.isEmpty(t)) return -1;
  let s = false;
  if (e.sCount[t] - e.blkIndent > 3 && (s = true), e.sCount[t] < 0 && (s = true), !s) {
    let r = e.md.block.ruler.getRules("reference"), i = e.parentType;
    e.parentType = "reference";
    let o = false;
    for (let u = 0, c = r.length; u < c; u++) if (r[u](e, t, n, true)) {
      o = true;
      break;
    }
    if (e.parentType = i, o) return -1;
  }
  return e.bMarks[t] + e.tShift[t];
}
function xr(e, t, n, s) {
  let r = e.src, i = e.bMarks[t] + e.tShift[t], o = t + 1;
  if (e.sCount[t] - e.blkIndent >= 4 || r.charCodeAt(i) !== 91) return false;
  let u = G(e, t), c = "", a = -1, f = ++i;
  for (; i < u; ) {
    if (c.length + i - f > Ee * 2) return false;
    let C = r.charCodeAt(i);
    if (C === 91) return false;
    if (C === 93) {
      a = i;
      break;
    }
    if (C === 92 && (C = r.charCodeAt(++i)), C === 10 && i < u) {
      let v = ae(e, o);
      if (v < 0) return false;
      c += r.slice(f, u), i = f = v, u = G(e, o++);
      continue;
    }
    i++;
  }
  if (a < 0 || r.charCodeAt(a + 1) !== 58 || (c += r.slice(f, a), c.length > Ee && Rr(c) > Ee)) return false;
  for (i = a + 2; i < u; ) {
    let C = r.charCodeAt(i);
    if (C === 10) {
      let v = ae(e, o);
      if (v < 0) break;
      i = v, u = G(e, o++);
    } else if (E(C)) i++;
    else break;
  }
  let h = e.md.helpers.parseLinkDestination(r, i, u);
  if (!h.ok) return false;
  let p = e.md.normalizeLink(h.str);
  if (!e.md.validateLink(p)) return false;
  i = h.pos;
  let d = i, l = u, D = o;
  for (; i < u; ) {
    let C = r.charCodeAt(i);
    if (C === 10) {
      let v = ae(e, o);
      if (v < 0) break;
      i = v, u = G(e, o++);
    } else if (E(C)) i++;
    else break;
  }
  let _ = i, x = e.md.helpers.parseLinkTitle(r, i, u);
  for (; x.can_continue; ) {
    let C = ae(e, o);
    if (C < 0) break;
    i = C, u = G(e, o++), x = e.md.helpers.parseLinkTitle(r, i, u, x);
  }
  let b;
  for (_ !== d && x.ok ? (b = x.str, i = x.pos) : (b = "", i = d, u = l, o = D); i < u && E(r.charCodeAt(i)); ) i++;
  if (i < u && r.charCodeAt(i) !== 10 && b) for (b = "", i = d, u = l, o = D; i < u && E(r.charCodeAt(i)); ) i++;
  if (i < u && r.charCodeAt(i) !== 10) return false;
  let g = he(c);
  if (!g) return false;
  if (s) return true;
  typeof e.env.references > "u" && (e.env.references = {}), typeof e.env.references[g] > "u" && (e.env.references[g] = { title: b, href: p });
  let m = e.push("reference_definition", "", 0);
  m.map = [t, o], m.hidden = true;
  let R = /* @__PURE__ */ Object.create(null);
  return R.label = g, m.meta = R, e.line = o, true;
}
var br = ["address", "article", "aside", "base", "basefont", "blockquote", "body", "caption", "center", "col", "colgroup", "dd", "details", "dialog", "dir", "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hr", "html", "iframe", "legend", "li", "link", "main", "menu", "menuitem", "nav", "noframes", "ol", "optgroup", "option", "p", "param", "search", "section", "summary", "table", "tbody", "td", "tfoot", "th", "thead", "title", "tr", "track", "ul"];
var Et = `<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?)*\\s*\\/?>`;
var Ft = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>";
new RegExp(`^(?:${Et}|${Ft}|<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->|<[?][\\s\\S]*?[?]>|<![A-Za-z][^>]*>|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>)`);
var yt = new RegExp(`^(?:${Et}|${Ft})`);
var W = [[/^<(script|pre|style|textarea)(?=(\s|>|$))/i, /<\/(script|pre|style|textarea)>/i, true], [/^<!--/, /-->/, true], [/^<\?/, /\?>/, true], [/^<![A-Za-z]/, />/, true], [/^<!\[CDATA\[/, /\]\]>/, true], [new RegExp(`^</?(${br.join("|")})(?=(\\s|/?>|$))`, "i"), /^$/, true], [new RegExp(`${yt.source}\\s*$`), /^$/, false]];
function Cr(e, t, n, s) {
  let r = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4 || !e.md.options.html || e.src.charCodeAt(r) !== 60) return false;
  let o = e.src.slice(r, i), u = 0;
  for (; u < W.length && !W[u][0].test(o); u++) ;
  if (u === W.length) return false;
  if (s) return W[u][2];
  let c = t + 1, a = W[u][1].test("");
  if (!W[u][1].test(o)) {
    for (; c < n && !(e.sCount[c] < e.blkIndent && (a || !e.isEmpty(c))); c++) if (r = e.bMarks[c] + e.tShift[c], i = e.eMarks[c], o = e.src.slice(r, i), W[u][1].test(o)) {
      o.length !== 0 && c++;
      break;
    }
  }
  e.line = c;
  let f = e.push("html_block", "", 0);
  return f.map = [t, c], f.content = e.getLines(t, c, e.blkIndent, true), true;
}
function Dr(e, t, n, s) {
  let r = e.bMarks[t] + e.tShift[t], i = e.eMarks[t];
  if (e.sCount[t] - e.blkIndent >= 4) return false;
  let o = e.src.charCodeAt(r);
  if (o !== 35 || r >= i) return false;
  let u = 1;
  for (o = e.src.charCodeAt(++r); o === 35 && r < i && u <= 6; ) u++, o = e.src.charCodeAt(++r);
  if (u > 6 || r < i && !E(o)) return false;
  if (s) return true;
  i = e.skipSpacesBack(i, r);
  let c = e.skipCharsBack(i, 35, r);
  c > r && E(e.src.charCodeAt(c - 1)) && (i = c), e.line = t + 1;
  let a = e.push("heading_open", `h${u}`, 1);
  a.markup = "########".slice(0, u), a.map = [t, e.line];
  let f = e.push("inline", "", 0);
  f.content = fe(e.src.slice(r, i)), f.map = [t, e.line], f.children = [];
  let h = e.push("heading_close", `h${u}`, -1);
  return h.markup = "########".slice(0, u), true;
}
function vr(e, t, n) {
  let s = e.md.block.ruler.getRules("paragraph");
  if (e.sCount[t] - e.blkIndent >= 4) return false;
  let r = e.parentType;
  e.parentType = "paragraph";
  let i = 0, o, u = t + 1;
  for (; u < n && !e.isEmpty(u); u++) {
    if (e.sCount[u] - e.blkIndent > 3) continue;
    if (e.sCount[u] >= e.blkIndent) {
      let d = e.bMarks[u] + e.tShift[u], l = e.eMarks[u];
      if (d < l && (o = e.src.charCodeAt(d), (o === 45 || o === 61) && (d = e.skipChars(d, o), d = e.skipSpaces(d), d >= l))) {
        i = o === 61 ? 1 : 2;
        break;
      }
    }
    if (e.sCount[u] < 0) continue;
    let p = false;
    for (let d = 0, l = s.length; d < l; d++) if (s[d](e, u, n, true)) {
      p = true;
      break;
    }
    if (p) break;
  }
  if (!i) return e.parentType = r, false;
  let c = fe(e.getLines(t, u, e.blkIndent, false));
  e.line = u + 1;
  let a = e.push("heading_open", `h${i}`, 1);
  a.markup = String.fromCharCode(o), a.map = [t, e.line];
  let f = e.push("inline", "", 0);
  f.content = c, f.map = [t, e.line - 1], f.children = [];
  let h = e.push("heading_close", `h${i}`, -1);
  return h.markup = String.fromCharCode(o), e.parentType = r, true;
}
function Ar(e, t, n) {
  let s = e.md.block.ruler.getRules("paragraph"), r = e.parentType, i = t + 1;
  for (e.parentType = "paragraph"; i < n && !e.isEmpty(i); i++) {
    if (e.sCount[i] - e.blkIndent > 3 || e.sCount[i] < 0) continue;
    let a = false;
    for (let f = 0, h = s.length; f < h; f++) if (s[f](e, i, n, true)) {
      a = true;
      break;
    }
    if (a) break;
  }
  let o = fe(e.getLines(t, i, e.blkIndent, false));
  e.line = i;
  let u = e.push("paragraph_open", "p", 1);
  u.map = [t, e.line];
  let c = e.push("inline", "", 0);
  return c.content = o, c.map = [t, e.line], c.children = [], e.push("paragraph_close", "p", -1), e.parentType = r, true;
}
var le = [["table", fr, ["paragraph", "reference"]], ["code", dr], ["fence", pr, ["paragraph", "reference", "blockquote", "list"]], ["blockquote", mr, ["paragraph", "reference", "blockquote", "list"]], ["hr", _r, ["paragraph", "reference", "blockquote", "list"]], ["list", kr, ["paragraph", "reference", "blockquote"]], ["reference", xr], ["html_block", Cr, ["paragraph", "reference", "blockquote"]], ["heading", Dr, ["paragraph", "reference", "blockquote"]], ["lheading", vr], ["paragraph", Ar]];
var Bt = class {
  constructor() {
    k(this, "ruler", new ne()), k(this, "State", wt);
    for (let e = 0; e < le.length; e++) this.ruler.push(le[e][0], le[e][1], { alt: (le[e][2] || []).slice() });
  }
  tokenize(e, t, n) {
    let s = this.ruler.getRules(""), r = s.length, i = e.md.options.maxNesting, o = t, u = false;
    for (; o < n && (e.line = o = e.skipEmptyLines(o), !(o >= n || e.sCount[o] < e.blkIndent)); ) {
      if (e.level >= i) {
        e.line = n;
        break;
      }
      let c = e.line, a = false;
      for (let f = 0; f < r; f++) if (a = s[f](e, o, n, false), a) {
        if (c >= e.line) throw new Error("block rule didn't increment state.line");
        break;
      }
      if (!a) throw new Error("none of the block rules matched");
      e.tight = !u, e.isEmpty(e.line - 1) && (u = true), o = e.line, o < n && e.isEmpty(o) && (u = true, o++, e.line = o);
    }
  }
  parse(e, t, n, s) {
    if (!e) return;
    let r = new this.State(e, t, n, s);
    this.tokenize(r, r.line, r.lineMax);
  }
};
var Tt = class {
  constructor(e, t, n, s) {
    k(this, "pos", 0), k(this, "level", 0), k(this, "pending", ""), k(this, "pendingLevel", 0), k(this, "cache", {}), k(this, "backticks", {}), k(this, "backticksScanned", false), k(this, "skipHtmlSpecial", false), k(this, "linkLevel", 0), k(this, "delimiters", []), k(this, "_prev_delimiters", []), k(this, "Token", q), this.src = e, this.env = n, this.md = t, this.tokens = s, this.tokens_meta = Array(s.length), this.posMax = this.src.length;
  }
  pushPending() {
    let e = new q("text", "", 0);
    return e.content = this.pending, e.level = this.pendingLevel, this.tokens.push(e), this.pending = "", e;
  }
  push(e, t, n) {
    this.pending && this.pushPending();
    let s = new q(e, t, n), r;
    return n < 0 && (this.level--, this.delimiters = this._prev_delimiters.pop()), s.level = this.level, n > 0 && (this.level++, this._prev_delimiters.push(this.delimiters), this.delimiters = [], r = { delimiters: this.delimiters }), this.pendingLevel = this.level, this.tokens.push(s), this.tokens_meta.push(r), s;
  }
  scanDelims(e, t) {
    let n = this.posMax, s = this.src.charCodeAt(e), r;
    if (e === 0) r = 32;
    else if (e === 1) r = this.src.charCodeAt(0), (r & 63488) === 55296 && (r = 65533);
    else if (r = this.src.charCodeAt(e - 1), (r & 64512) === 56320) {
      let l = this.src.charCodeAt(e - 2);
      r = (l & 64512) === 55296 ? 65536 + (l - 55296 << 10) + (r - 56320) : 65533;
    } else (r & 64512) === 55296 && (r = 65533);
    let i = e;
    for (; i < n && this.src.charCodeAt(i) === s; ) i++;
    let o = i - e, u = i < n ? this.src.charCodeAt(i) : 32;
    if ((u & 64512) === 55296) {
      let l = this.src.charCodeAt(i + 1);
      u = (l & 64512) === 56320 ? 65536 + (u - 55296 << 10) + (l - 56320) : 65533;
    } else (u & 64512) === 56320 && (u = 65533);
    let c = ee(r) || Q(r), a = ee(u) || Q(u), f = V(r), h = V(u), p = !h && (!a || f || c), d = !f && (!c || h || a);
    return { can_open: p && (t || !d || c), can_close: d && (t || !p || a), length: o };
  }
};
function wr(e) {
  switch (e) {
    case 10:
    case 33:
    case 35:
    case 36:
    case 37:
    case 38:
    case 42:
    case 43:
    case 45:
    case 58:
    case 60:
    case 61:
    case 62:
    case 64:
    case 91:
    case 92:
    case 93:
    case 94:
    case 95:
    case 96:
    case 123:
    case 125:
    case 126:
      return true;
    default:
      return false;
  }
}
function Er(e, t) {
  let n = e.pos;
  for (; n < e.posMax && !wr(e.src.charCodeAt(n)); ) n++;
  return n === e.pos ? false : (t || (e.pending += e.src.slice(e.pos, n)), e.pos = n, true);
}
function Fr(e) {
  return e >= 65 && e <= 90 || e >= 97 && e <= 122;
}
function yr(e) {
  return e >= 65 && e <= 90 || e >= 97 && e <= 122 || e >= 48 && e <= 57 || e === 43 || e === 45 || e === 46;
}
function Br(e, t) {
  if (!e.md.options.linkify || e.linkLevel > 0) return false;
  let n = e.pos, s = e.posMax;
  if (n + 3 > s || e.src.charCodeAt(n) !== 58 || e.src.charCodeAt(n + 1) !== 47 || e.src.charCodeAt(n + 2) !== 47) return false;
  let r = n - Math.min(10, e.pending.length, n), i = n;
  for (; i > r && yr(e.src.charCodeAt(i - 1)); ) i--;
  if (i === n || !Fr(e.src.charCodeAt(i))) return false;
  let o = n - i, u = e.md.linkify.matchAtStart(e.src.slice(i));
  if (!u) return false;
  let c = u.url;
  if (c.length <= o) return false;
  let a = c.length;
  for (; a > 0 && c.charCodeAt(a - 1) === 42; ) a--;
  a !== c.length && (c = c.slice(0, a));
  let f = e.md.normalizeLink(c);
  if (!e.md.validateLink(f)) return false;
  if (!t) {
    e.pending = e.pending.slice(0, -o);
    let h = e.push("link_open", "a", 1);
    h.attrs = [["href", f]], h.markup = "linkify", h.info = "auto";
    let p = e.push("text", "", 0);
    p.content = e.md.normalizeLinkText(c);
    let d = e.push("link_close", "a", -1);
    d.markup = "linkify", d.info = "auto";
  }
  return e.pos += c.length - o, true;
}
function Tr(e, t) {
  let n = e.pos;
  if (e.src.charCodeAt(n) !== 10) return false;
  let s = e.pending.length - 1, r = e.posMax;
  if (!t) if (s >= 0 && e.pending.charCodeAt(s) === 32) if (s >= 1 && e.pending.charCodeAt(s - 1) === 32) {
    let i = s - 1;
    for (; i >= 1 && e.pending.charCodeAt(i - 1) === 32; ) i--;
    e.pending = e.pending.slice(0, i), e.push("hardbreak", "br", 0);
  } else e.pending = e.pending.slice(0, -1), e.push("softbreak", "br", 0);
  else e.push("softbreak", "br", 0);
  for (n++; n < r && E(e.src.charCodeAt(n)); ) n++;
  return e.pos = n, true;
}
var Te = [];
for (let e = 0; e < 256; e++) Te.push(0);
"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(e) {
  Te[e.charCodeAt(0)] = 1;
});
function Ir(e, t) {
  let n = e.pos, s = e.posMax;
  if (e.src.charCodeAt(n) !== 92 || (n++, n >= s)) return false;
  let r = e.src.charCodeAt(n);
  if (r === 10) {
    for (t || e.push("hardbreak", "br", 0), n++; n < s && (r = e.src.charCodeAt(n), !!E(r)); ) n++;
    return e.pos = n, true;
  }
  if (r === 32) {
    if (!t) {
      let u = e.push("text_special", "", 0);
      u.content = "\\", u.markup = "\\", u.info = "escape";
    }
    return e.pos = n, true;
  }
  let i = e.src[n];
  if (r >= 55296 && r <= 56319 && n + 1 < s) {
    let u = e.src.charCodeAt(n + 1);
    u >= 56320 && u <= 57343 && (i += e.src[n + 1], n++);
  }
  let o = "\\" + i;
  if (!t) {
    let u = e.push("text_special", "", 0);
    r < 256 && Te[r] !== 0 ? u.content = i : u.content = o, u.markup = o, u.info = "escape";
  }
  return e.pos = n + 1, true;
}
function Sr(e) {
  let t = {}, n = 0;
  for (; (n = e.indexOf("`", n)) !== -1; ) {
    let s = n;
    for (; e.charCodeAt(++n) === 96; ) ;
    t[n - s] = s;
  }
  return t;
}
function zr(e, t) {
  var n;
  let s = e.pos;
  if (e.src.charCodeAt(s) !== 96) return false;
  let r = e.posMax, i = s + 1;
  for (; i < r && e.src.charCodeAt(i) === 96; ) i++;
  let o = e.src.slice(s, i), u = o.length;
  if (e.backticksScanned || (e.backticks = Sr(e.src), e.backticksScanned = true), ((n = e.backticks[u]) !== null && n !== void 0 ? n : -1) >= i) {
    let c = i, a;
    for (; (a = e.src.indexOf("`", c)) !== -1 && a < r; ) {
      for (c = a + 1; e.src.charCodeAt(c) === 96; ) c++;
      if (c > r) break;
      if (c - a === u) {
        if (!t) {
          let f = e.push("code_inline", "code", 0);
          f.markup = o;
          let h = e.src.slice(i, a).replace(/\n/g, " ");
          h.startsWith(" ") && h.endsWith(" ") && /[^ ]/.test(h) && (h = h.slice(1, -1)), f.content = h;
        }
        return e.pos = c, true;
      }
    }
  }
  return t || (e.pending += o), e.pos = i, true;
}
function Mr(e, t) {
  let n = e.pos, s = e.src.charCodeAt(n);
  if (t || s !== 126) return false;
  let r = e.scanDelims(e.pos, true), i = r.length, o = String.fromCharCode(s);
  if (i < 2) return false;
  let u;
  i % 2 && (u = e.push("text", "", 0), u.content = o, i--);
  for (let c = 0; c < i; c += 2) u = e.push("text", "", 0), u.content = o + o, e.delimiters.push({ marker: s, length: 0, token: e.tokens.length - 1, end: -1, open: r.can_open, close: r.can_close });
  return e.pos += r.length, true;
}
function pt(e, t) {
  let n, s = [], r = t.length;
  for (let i = 0; i < r; i++) {
    let o = t[i];
    if (o.marker !== 126 || o.end === -1) continue;
    let u = t[o.end];
    n = e.tokens[o.token], n.type = "s_open", n.tag = "s", n.nesting = 1, n.markup = "~~", n.content = "", n = e.tokens[u.token], n.type = "s_close", n.tag = "s", n.nesting = -1, n.markup = "~~", n.content = "", e.tokens[u.token - 1].type === "text" && e.tokens[u.token - 1].content === "~" && s.push(u.token - 1);
  }
  for (; s.length; ) {
    let i = s.pop(), o = i + 1;
    for (; o < e.tokens.length && e.tokens[o].type === "s_close"; ) o++;
    o--, i !== o && (n = e.tokens[o], e.tokens[o] = e.tokens[i], e.tokens[i] = n);
  }
}
function jr(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  pt(e, e.delimiters);
  for (let r = 0; r < n; r++) {
    var s;
    let i = (s = t[r]) === null || s === void 0 ? void 0 : s.delimiters;
    i && pt(e, i);
  }
}
var It = { tokenize: Mr, postProcess: jr };
function Lr(e, t) {
  let n = e.pos, s = e.src.charCodeAt(n);
  if (t || s !== 95 && s !== 42) return false;
  let r = e.scanDelims(e.pos, s === 42);
  for (let i = 0; i < r.length; i++) {
    let o = e.push("text", "", 0);
    o.content = String.fromCharCode(s), e.delimiters.push({ marker: s, length: r.length, token: e.tokens.length - 1, end: -1, open: r.can_open, close: r.can_close });
  }
  return e.pos += r.length, true;
}
function mt(e, t) {
  let n = t.length;
  for (let s = n - 1; s >= 0; s--) {
    let r = t[s];
    if (r.marker !== 95 && r.marker !== 42 || r.end === -1) continue;
    let i = t[r.end], o = s > 0 && t[s - 1].end === r.end + 1 && t[s - 1].marker === r.marker && t[s - 1].token === r.token - 1 && t[r.end + 1].token === i.token + 1, u = String.fromCharCode(r.marker), c = e.tokens[r.token];
    c.type = o ? "strong_open" : "em_open", c.tag = o ? "strong" : "em", c.nesting = 1, c.markup = o ? u + u : u, c.content = "";
    let a = e.tokens[i.token];
    a.type = o ? "strong_close" : "em_close", a.tag = o ? "strong" : "em", a.nesting = -1, a.markup = o ? u + u : u, a.content = "", o && (e.tokens[t[s - 1].token].content = "", e.tokens[t[r.end + 1].token].content = "", s--);
  }
}
function Jr(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  mt(e, e.delimiters);
  for (let r = 0; r < n; r++) {
    var s;
    let i = (s = t[r]) === null || s === void 0 ? void 0 : s.delimiters;
    i && mt(e, i);
  }
}
var St = { tokenize: Lr, postProcess: Jr };
function Nr(e, t) {
  let n, s, r, i, o = "", u = "", c = e.pos, a = true;
  if (e.src.charCodeAt(e.pos) !== 91) return false;
  let f = e.pos, h = e.posMax, p = e.pos + 1, d = e.md.helpers.parseLinkLabel(e, e.pos, true);
  if (d < 0) return false;
  let l = d + 1;
  if (l < h && e.src.charCodeAt(l) === 40) {
    for (a = false, l++; l < h && (n = e.src.charCodeAt(l), !(!E(n) && n !== 10)); l++) ;
    if (l >= h) return false;
    if (c = l, r = e.md.helpers.parseLinkDestination(e.src, l, e.posMax), r.ok) {
      for (o = e.md.normalizeLink(r.str), e.md.validateLink(o) ? l = r.pos : o = "", c = l; l < h && (n = e.src.charCodeAt(l), !(!E(n) && n !== 10)); l++) ;
      if (r = e.md.helpers.parseLinkTitle(e.src, l, e.posMax), l < h && c !== l && r.ok) for (u = r.str, l = r.pos; l < h && (n = e.src.charCodeAt(l), !(!E(n) && n !== 10)); l++) ;
    }
    (l >= h || e.src.charCodeAt(l) !== 41) && (a = true), l++;
  }
  if (a) {
    if (typeof e.env.references > "u") return false;
    if (l < h && e.src.charCodeAt(l) === 91 ? (c = l + 1, l = e.md.helpers.parseLinkLabel(e, l), l >= 0 ? s = e.src.slice(c, l++) : l = d + 1) : l = d + 1, s || (s = e.src.slice(p, d)), s = he(s), i = e.env.references[s], !i) return e.pos = f, false;
    o = i.href, u = i.title;
  }
  if (!t) {
    e.pos = p, e.posMax = d;
    let D = e.push("link_open", "a", 1), _ = [["href", o]];
    if (D.attrs = _, u && _.push(["title", u]), s) {
      let x = /* @__PURE__ */ Object.create(null);
      x.label = s, D.meta = x;
    }
    e.linkLevel++, e.md.inline.tokenize(e), e.linkLevel--, e.push("link_close", "a", -1);
  }
  return e.pos = l, e.posMax = h, true;
}
function Pr(e, t) {
  let n, s, r, i, o, u, c, a, f = "", h = e.pos, p = e.posMax;
  if (e.src.charCodeAt(e.pos) !== 33 || e.src.charCodeAt(e.pos + 1) !== 91) return false;
  let d = e.pos + 2, l = e.md.helpers.parseLinkLabel(e, e.pos + 1, false);
  if (l < 0) return false;
  if (i = l + 1, i < p && e.src.charCodeAt(i) === 40) {
    for (i++; i < p && (n = e.src.charCodeAt(i), !(!E(n) && n !== 10)); i++) ;
    if (i >= p) return false;
    for (a = i, u = e.md.helpers.parseLinkDestination(e.src, i, e.posMax), u.ok && (f = e.md.normalizeLink(u.str), e.md.validateLink(f) ? i = u.pos : f = ""), a = i; i < p && (n = e.src.charCodeAt(i), !(!E(n) && n !== 10)); i++) ;
    if (u = e.md.helpers.parseLinkTitle(e.src, i, e.posMax), i < p && a !== i && u.ok) for (c = u.str, i = u.pos; i < p && (n = e.src.charCodeAt(i), !(!E(n) && n !== 10)); i++) ;
    else c = "";
    if (i >= p || e.src.charCodeAt(i) !== 41) return e.pos = h, false;
    i++;
  } else {
    if (typeof e.env.references > "u") return false;
    if (i < p && e.src.charCodeAt(i) === 91 ? (a = i + 1, i = e.md.helpers.parseLinkLabel(e, i), i >= 0 ? r = e.src.slice(a, i++) : i = l + 1) : i = l + 1, r || (r = e.src.slice(d, l)), r = he(r), o = e.env.references[r], !o) return e.pos = h, false;
    f = o.href, c = o.title;
  }
  if (!t) {
    s = e.src.slice(d, l);
    let D = [];
    e.md.inline.parse(s, e.md, e.env, D);
    let _ = e.push("image", "img", 0), x = [["src", f], ["alt", ""]];
    if (_.attrs = x, _.children = D, _.content = s, c && x.push(["title", c]), r) {
      let b = /* @__PURE__ */ Object.create(null);
      b.label = r, _.meta = b;
    }
  }
  return e.pos = i, e.posMax = p, true;
}
var Or = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/;
var Ur = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
function Wr(e, t) {
  let n = e.pos;
  if (e.src.charCodeAt(n) !== 60) return false;
  let s = e.pos, r = e.posMax;
  for (; ; ) {
    if (++n >= r) return false;
    let o = e.src.charCodeAt(n);
    if (o === 60) return false;
    if (o === 62) break;
  }
  let i = e.src.slice(s + 1, n);
  if (Ur.test(i)) {
    let o = e.md.normalizeLink(i);
    if (!e.md.validateLink(o)) return false;
    if (!t) {
      let u = e.push("link_open", "a", 1);
      u.attrs = [["href", o]], u.markup = "autolink", u.info = "auto";
      let c = e.push("text", "", 0);
      c.content = e.md.normalizeLinkText(i);
      let a = e.push("link_close", "a", -1);
      a.markup = "autolink", a.info = "auto";
    }
    return e.pos += i.length + 2, true;
  }
  if (Or.test(i)) {
    let o = e.md.normalizeLink(`mailto:${i}`);
    if (!e.md.validateLink(o)) return false;
    if (!t) {
      let u = e.push("link_open", "a", 1);
      u.attrs = [["href", o]], u.markup = "autolink", u.info = "auto";
      let c = e.push("text", "", 0);
      c.content = e.md.normalizeLinkText(i);
      let a = e.push("link_close", "a", -1);
      a.markup = "autolink", a.info = "auto";
    }
    return e.pos += i.length + 2, true;
  }
  return false;
}
function qr(e) {
  return /^<a[>\s]/i.test(e);
}
function Zr(e) {
  return /^<\/a\s*>/i.test(e);
}
function zt(e) {
  let t = e | 32;
  return t >= 97 && t <= 122;
}
function $r(e, t) {
  let n = e.src, s, r;
  if (n.startsWith("<!--", t)) {
    if (n.startsWith(">", t + 4)) return t + 5;
    if (n.startsWith("->", t + 4)) return t + 6;
    s = t + 4, r = "-->";
  } else if (n.startsWith("<![CDATA[", t)) s = t + 9, r = "]]>";
  else if (n.charCodeAt(t + 1) === 63) s = t + 2, r = "?>";
  else if (zt(n.charCodeAt(t + 2))) s = t + 3, r = ">";
  else return -1;
  if (e.skipHtmlSpecial) return -1;
  let i = n.indexOf(r, s);
  return i < 0 ? (e.skipHtmlSpecial = true, -1) : i + r.length;
}
function Xr(e, t) {
  if (!e.md.options.html) return false;
  let n = e.posMax, s = e.pos;
  if (e.src.charCodeAt(s) !== 60 || s + 2 >= n) return false;
  let r, i = e.src.charCodeAt(s + 1);
  if (i === 33 || i === 63) r = $r(e, s);
  else if (i === 47 || zt(i)) {
    let o = e.src.slice(s).match(yt);
    r = o ? s + o[0].length : -1;
  } else return false;
  if (r < 0) return false;
  if (!t) {
    let o = e.push("html_inline", "", 0);
    o.content = e.src.slice(s, r), qr(o.content) && e.linkLevel++, Zr(o.content) && e.linkLevel--;
  }
  return e.pos = r, true;
}
var Hr = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i;
var Yr = /^&([a-z][a-z0-9]{1,31});/i;
function Gr(e, t) {
  let n = e.pos, s = e.posMax;
  if (e.src.charCodeAt(n) !== 38 || n + 1 >= s) return false;
  if (e.src.charCodeAt(n + 1) === 35) {
    let r = e.src.slice(n).match(Hr);
    if (r) {
      if (!t) {
        let i = r[1][0].toLowerCase() === "x" ? parseInt(r[1].slice(1), 16) : parseInt(r[1], 10), o = e.push("text_special", "", 0);
        o.content = Be(i) ? K(i) : K(65533), o.markup = r[0], o.info = "entity";
      }
      return e.pos += r[0].length, true;
    }
  } else {
    let r = e.src.slice(n).match(Yr);
    if (r) {
      let i = ue(r[0]);
      if (i !== r[0]) {
        if (!t) {
          let o = e.push("text_special", "", 0);
          o.content = i, o.markup = r[0], o.info = "entity";
        }
        return e.pos += r[0].length, true;
      }
    }
  }
  return false;
}
function _t(e) {
  let t = {}, n = e.length;
  if (!n) return;
  let s = 0, r = -2, i = [];
  for (let o = 0; o < n; o++) {
    let u = e[o];
    if (i.push(0), (e[s].marker !== u.marker || r !== u.token - 1) && (s = o), r = u.token, u.length = u.length || 0, !u.close) continue;
    t.hasOwnProperty(u.marker) || (t[u.marker] = [-1, -1, -1, -1, -1, -1]);
    let c = t[u.marker][(u.open ? 3 : 0) + u.length % 3], a = s - i[s] - 1, f = a;
    for (; a > c; a -= i[a] + 1) {
      let h = e[a];
      if (h.marker === u.marker && h.open && h.end < 0) {
        let p = false;
        if ((h.close || u.open) && (h.length + u.length) % 3 === 0 && (h.length % 3 !== 0 || u.length % 3 !== 0) && (p = true), !p) {
          let d = a > 0 && !e[a - 1].open ? i[a - 1] + 1 : 0;
          i[o] = o - a + d, i[a] = d, u.open = false, h.end = o, h.close = false, f = -1, r = -2;
          break;
        }
      }
    }
    f !== -1 && (t[u.marker][(u.open ? 3 : 0) + (u.length || 0) % 3] = f);
  }
}
function Kr(e) {
  let t = e.tokens_meta, n = e.tokens_meta.length;
  _t(e.delimiters);
  for (let r = 0; r < n; r++) {
    var s;
    let i = (s = t[r]) === null || s === void 0 ? void 0 : s.delimiters;
    i && _t(i);
  }
}
function Vr(e) {
  let t, n, s = 0, r = e.tokens, i = e.tokens.length;
  for (t = n = 0; t < i; t++) r[t].nesting < 0 && s--, r[t].level = s, r[t].nesting > 0 && s++, r[t].type === "text" && t + 1 < i && r[t + 1].type === "text" ? r[t + 1].content = r[t].content + r[t + 1].content : (t !== n && (r[n] = r[t]), n++);
  t !== n && (r.length = n);
}
var Fe = [["text", Er], ["linkify", Br], ["newline", Tr], ["escape", Ir], ["backticks", zr], ["strikethrough", It.tokenize], ["emphasis", St.tokenize], ["link", Nr], ["image", Pr], ["autolink", Wr], ["html_inline", Xr], ["entity", Gr]];
var ye = [["balance_pairs", Kr], ["strikethrough", It.postProcess], ["emphasis", St.postProcess], ["fragments_join", Vr]];
var Mt = class {
  constructor() {
    k(this, "ruler", new ne()), k(this, "ruler2", new ne()), k(this, "State", Tt);
    for (let e = 0; e < Fe.length; e++) this.ruler.push(Fe[e][0], Fe[e][1]);
    for (let e = 0; e < ye.length; e++) this.ruler2.push(ye[e][0], ye[e][1]);
  }
  skipToken(e) {
    let t = e.pos, n = this.ruler.getRules(""), s = n.length, r = e.md.options.maxNesting, i = e.cache;
    if (typeof i[t] < "u") {
      e.pos = i[t];
      return;
    }
    let o = false;
    if (e.level < r) {
      for (let u = 0; u < s; u++) if (e.level++, o = n[u](e, true), e.level--, o) {
        if (t >= e.pos) throw new Error("inline rule didn't increment state.pos");
        break;
      }
    } else e.pos = e.posMax;
    o || e.pos++, i[t] = e.pos;
  }
  tokenize(e) {
    let t = this.ruler.getRules(""), n = t.length, s = e.posMax, r = e.md.options.maxNesting;
    for (; e.pos < s; ) {
      let i = e.pos, o = false;
      if (e.level < r) {
        for (let u = 0; u < n; u++) if (o = t[u](e, false), o) {
          if (i >= e.pos) throw new Error("inline rule didn't increment state.pos");
          break;
        }
      }
      if (o) {
        if (e.pos >= s) break;
        continue;
      }
      e.pending += e.src[e.pos++];
    }
    e.pending && e.pushPending();
  }
  parse(e, t, n, s) {
    let r = new this.State(e, t, n, s);
    this.tokenize(r);
    let i = this.ruler2.getRules(""), o = i.length;
    for (let u = 0; u < o; u++) i[u](r);
  }
};
var Qr = { default: { options: { html: false, xhtmlOut: false, breaks: false, langPrefix: "language-", linkify: false, typographer: false, quotes: "\u201C\u201D\u2018\u2019", highlight: null, maxNesting: 100 }, components: { core: {}, block: {}, inline: {} } }, zero: { options: { html: false, xhtmlOut: false, breaks: false, langPrefix: "language-", linkify: false, typographer: false, quotes: "\u201C\u201D\u2018\u2019", highlight: null, maxNesting: 20 }, components: { core: { rules: ["normalize", "block", "strip_references", "inline", "text_join"] }, block: { rules: ["paragraph"] }, inline: { rules: ["text"], rules2: ["balance_pairs", "fragments_join"] } } }, commonmark: { options: { html: true, xhtmlOut: true, breaks: false, langPrefix: "language-", linkify: false, typographer: false, quotes: "\u201C\u201D\u2018\u2019", highlight: null, maxNesting: 20 }, components: { core: { rules: ["normalize", "block", "strip_references", "inline", "text_join"] }, block: { rules: ["blockquote", "code", "fence", "heading", "hr", "html_block", "lheading", "list", "reference", "paragraph"] }, inline: { rules: ["autolink", "backticks", "emphasis", "entity", "escape", "html_inline", "image", "link", "newline", "text"], rules2: ["balance_pairs", "emphasis", "fragments_join"] } } } };
var ei = /^(vbscript|javascript|file|data):/;
var ti = /^data:image\/(gif|png|jpeg|webp);/;
var gt = ["http:", "https:", "mailto:"];
var N = class {
  validateLink(e) {
    let t = e.trim().toLowerCase();
    return ei.test(t) ? ti.test(t) : true;
  }
  normalizeLink(e) {
    let t = H(e, true);
    if (t.hostname && (!t.protocol || gt.indexOf(t.protocol) >= 0)) try {
      t.hostname = ve.toASCII(t.hostname);
    } catch {
    }
    return t.auth && (t.auth = P(t.auth)), t.hostname && (t.hostname = P(t.hostname)), t.pathname && (t.pathname = P(t.pathname)), t.search && (t.search = P(t.search)), t.hash && (t.hash = P(t.hash)), Z(t);
  }
  normalizeLinkText(e) {
    let t = H(e, true);
    if (t.hostname && (!t.protocol || gt.indexOf(t.protocol) >= 0)) try {
      t.hostname = ve.toUnicode(t.hostname);
    } catch {
    }
    return X(Z(t), X.defaultChars + "%");
  }
  constructor(...e) {
    k(this, "inline", new Mt()), k(this, "block", new Bt()), k(this, "core", new At()), k(this, "renderer", new Ct()), k(this, "linkify", new Qe()), k(this, "utils", Dn), k(this, "helpers", Object.assign({}, Nn));
    let [t, n] = e;
    typeof t == "string" ? (this.configure(t), n && this.set(n)) : (this.configure("default"), this.set(t || {}));
  }
  set(e) {
    return Object.assign(this.options, e), this;
  }
  configure(e) {
    let t;
    if (typeof e == "string") {
      let r = e;
      if (t = Qr[r], !t) throw new Error(`Wrong 'markdown-it' preset "${r}", check name`);
    } else t = e;
    if (!t) throw new Error("Wrong `markdown-it` preset, can't be empty");
    t.options && (this.options = { ...t.options });
    let n = t.components;
    if (n) {
      var s;
      ["core", "block", "inline"].forEach((i) => {
        var o;
        let u = (o = n[i]) === null || o === void 0 ? void 0 : o.rules;
        u && this[i].ruler.enableOnly(u);
      });
      let r = (s = n.inline) === null || s === void 0 ? void 0 : s.rules2;
      r && this.inline.ruler2.enableOnly(r);
    }
    return this;
  }
  enable(e, t = false) {
    let n = [];
    Array.isArray(e) || (e = [e]), ["core", "block", "inline"].forEach((r) => {
      n = n.concat(this[r].ruler.enable(e, true));
    }), n = n.concat(this.inline.ruler2.enable(e, true));
    let s = e.filter((r) => n.indexOf(r) < 0);
    if (s.length && !t) throw new Error(`MarkdownIt. Failed to enable unknown rule(s): ${s}`);
    return this;
  }
  disable(e, t = false) {
    let n = [];
    Array.isArray(e) || (e = [e]), ["core", "block", "inline"].forEach((r) => {
      n = n.concat(this[r].ruler.disable(e, true));
    }), n = n.concat(this.inline.ruler2.disable(e, true));
    let s = e.filter((r) => n.indexOf(r) < 0);
    if (s.length && !t) throw new Error(`MarkdownIt. Failed to disable unknown rule(s): ${s}`);
    return this;
  }
  use(e, ...t) {
    return e.apply(e, [this, ...t]), this;
  }
  parse(e, t) {
    if (typeof e != "string") throw new Error("Input data should be a String");
    let n = new this.core.State(e, this, t);
    return this.core.process(n), n.tokens;
  }
  render(e, t = {}) {
    return this.renderer.render(this.parse(e, t), this.options, t);
  }
  parseInline(e, t) {
    let n = new this.core.State(e, this, t);
    return n.inlineMode = true, this.core.process(n), n.tokens;
  }
  renderInline(e, t = {}) {
    return this.renderer.render(this.parseInline(e, t), this.options, t);
  }
};
k(N, "Token", q);
k(N, "Ruler", ne);
k(N, "Renderer", Ct);
k(N, "ParserCore", At);
k(N, "StateCore", Dt);
k(N, "ParserBlock", Bt);
k(N, "StateBlock", wt);
k(N, "ParserInline", Mt);
k(N, "StateInline", Tt);
var ni = Rt(N);

// web/vendor/ag-design/markdown-render.js
var MARKDOWN_LIMITS = Object.freeze({
  ...CODE_VIEWER_LIMITS,
  tokens: 2e4,
  nodes: 2e4,
  fences: 32,
  nesting: 32
});
var parser = new ni({
  html: false,
  linkify: false,
  typographer: false,
  maxNesting: MARKDOWN_LIMITS.nesting
});
var OPEN_TAGS = Object.freeze({
  paragraph_open: "p",
  blockquote_open: "blockquote",
  bullet_list_open: "ul",
  ordered_list_open: "ol",
  list_item_open: "li",
  table_open: "table",
  thead_open: "thead",
  tbody_open: "tbody",
  tr_open: "tr",
  th_open: "th",
  td_open: "td",
  em_open: "em",
  strong_open: "strong",
  s_open: "s"
});

// web/vendor/ag-design/language-switcher.js
var sequence2 = 0;
function languageName(locale) {
  const canonical = Intl.getCanonicalLocales(locale)[0];
  if (!canonical) throw new TypeError("A language tag is required");
  if (canonical === "en") return "English";
  if (canonical === "ru") return "\u0420\u0443\u0441\u0441\u043A\u0438\u0439";
  try {
    return new Intl.DisplayNames([canonical], { type: "language" }).of(canonical) || canonical;
  } catch {
    return canonical;
  }
}
function createLanguageSwitcher({
  document = globalThis.document,
  i18n,
  variant = "compact",
  appearance = "outlined",
  labelVisibility = "visible",
  label,
  names = {},
  density = "comfortable",
  onChange
} = {}) {
  if (!["compact", "inline", "auto"].includes(variant) || !["outlined", "quiet"].includes(appearance) || !["visible", "sr-only"].includes(labelVisibility) || !["compact", "comfortable", "touch"].includes(density) || label !== void 0 && (typeof label !== "string" || !label.trim() || label.length > 180) || !names || typeof names !== "object" || Array.isArray(names) || Object.keys(names).length > 32 || onChange !== void 0 && typeof onChange !== "function")
    throw new TypeError(
      "A bounded language switcher configuration is required"
    );
  const customNames = /* @__PURE__ */ new Map();
  for (const [locale, name] of Object.entries(names)) {
    if (typeof name !== "string" || !name.trim() || name.length > 180)
      throw new TypeError("Language names must be bounded literal text");
    customNames.set(Intl.getCanonicalLocales(locale)[0], name);
  }
  const context = resolveI18n(document, i18n), element = document.createElement("div"), caption = document.createElement("label"), row = document.createElement("div"), single = document.createElement("span"), select = document.createElement("select"), choices = document.createElement("div");
  const id = `ag-language-${++sequence2}`;
  element.className = `ag-language-switcher ag-language-switcher--${appearance}`;
  caption.id = `${id}-label`;
  caption.className = "ag-language-switcher__label";
  caption.classList.toggle(
    "ag-language-switcher__label--sr-only",
    labelVisibility === "sr-only"
  );
  row.className = "ag-language-switcher__row";
  single.className = "ag-language-switcher__single";
  select.className = "ag-language-switcher__select";
  select.id = id;
  caption.htmlFor = id;
  choices.className = "ag-language-switcher__choices";
  choices.setAttribute("role", "group");
  choices.setAttribute("aria-labelledby", caption.id);
  const globe = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  globe.setAttribute("viewBox", "0 0 24 24");
  globe.setAttribute("aria-hidden", "true");
  globe.setAttribute("focusable", "false");
  const path = document.createElementNS(globe.namespaceURI, "path");
  path.setAttribute(
    "d",
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c4 5 4 13 0 18-4-5-4-13 0-18Z"
  );
  globe.append(path);
  row.append(globe);
  if (variant !== "inline") row.append(select);
  if (variant !== "compact") row.append(choices);
  row.append(single);
  element.append(caption, row);
  let disposed = false, resolvedVariant = variant === "auto" ? "inline" : variant;
  const controls = /* @__PURE__ */ new Map(), restores = [];
  restores.push(applyControlGeometry(select, { density }));
  const nameOf = (locale) => customNames.get(locale) ?? languageName(locale);
  function choose(locale) {
    if (disposed || !context.availableLocales.includes(locale) || context.locale === locale)
      return;
    context.setLocale(locale);
    onChange?.(context.locale, context);
  }
  function changed() {
    choose(select.value);
  }
  select.addEventListener("change", changed);
  function refresh() {
    if (disposed) return;
    const focused = element.contains(document.activeElement) ? document.activeElement : null;
    const locales = context.availableLocales, only = locales.length === 1;
    resolvedVariant = variant;
    if (variant === "auto")
      resolvedVariant = locales.length > 2 ? "compact" : "inline";
    element.dataset.variant = resolvedVariant;
    element.classList.toggle(
      "ag-language-switcher--compact",
      resolvedVariant === "compact"
    );
    element.classList.toggle(
      "ag-language-switcher--inline",
      resolvedVariant === "inline"
    );
    element.lang = context.locale;
    element.dir = context.direction;
    caption.textContent = label ?? context.t("ui.language");
    element.dataset.singleLocale = String(only);
    single.hidden = !only;
    single.textContent = nameOf(context.locale);
    single.lang = context.locale;
    single.dir = "auto";
    select.hidden = only || resolvedVariant !== "compact";
    select.disabled = only;
    choices.hidden = only || resolvedVariant !== "inline";
    for (const option of [...select.options])
      if (!locales.includes(option.value)) option.remove();
    for (const locale of locales) {
      let option = [...select.options].find((node2) => node2.value === locale);
      if (!option) {
        option = document.createElement("option");
        option.value = locale;
        select.append(option);
      }
      option.textContent = nameOf(locale);
      option.lang = locale;
      option.dir = "auto";
    }
    select.value = context.locale;
    select.lang = context.locale;
    if (resolvedVariant === "compact") {
      caption.htmlFor = id;
      for (const control of controls.values()) {
        control.button.removeEventListener("click", control.click);
        control.restore();
        control.button.remove();
      }
      controls.clear();
    } else {
      caption.removeAttribute("for");
      for (const [locale, control] of controls) {
        if (!locales.includes(locale)) {
          control.button.removeEventListener("click", control.click);
          control.restore();
          control.button.remove();
          controls.delete(locale);
        }
      }
      for (const locale of locales) {
        let control = controls.get(locale);
        if (!control) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "ag-language-switcher__choice";
          button.lang = locale;
          button.dir = "auto";
          const click = () => choose(locale);
          button.addEventListener("click", click);
          control = {
            button,
            click,
            restore: applyControlGeometry(button, { density })
          };
          controls.set(locale, control);
          choices.append(button);
        }
        control.button.textContent = nameOf(locale);
        control.button.setAttribute(
          "aria-pressed",
          String(locale === context.locale)
        );
      }
    }
    if (element.hasAttribute("tabindex") || focused)
      element.setAttribute(
        "aria-label",
        `${caption.textContent}: ${nameOf(context.locale)}`
      );
    if (focused && (only || !element.contains(focused) || focused === select && select.hidden)) {
      if (!only && resolvedVariant === "compact")
        select.focus({ preventScroll: true });
      else if (!only && controls.has(context.locale))
        controls.get(context.locale).button.focus({ preventScroll: true });
      else {
        element.tabIndex = -1;
        element.focus({ preventScroll: true });
      }
    }
  }
  const off = context.subscribe(refresh);
  refresh();
  return {
    element,
    get select() {
      return resolvedVariant === "compact" ? select : null;
    },
    get value() {
      return context.locale;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      off();
      select.removeEventListener("change", changed);
      for (const control of controls.values()) {
        control.button.removeEventListener("click", control.click);
        control.restore();
      }
      controls.clear();
      for (const restore of restores) restore();
      onChange = void 0;
    }
  };
}

// web/vendor/ag-design/golden-canon-model.js
var GOLDEN_CANON_FRACTIONS = Object.freeze([
  0,
  1 / 5,
  1 / 4,
  1 / 3,
  2 / 5,
  1 / 2,
  3 / 5,
  2 / 3,
  3 / 4,
  4 / 5,
  1
]);

// web/vendor/ag-design/composition-grid-profiles.js
var COMPOSITION_GRID_FIELDS = Object.freeze({
  "edge-balance": ["type", "edge", "insetRatio", "focusRatio"],
  "lead-room": ["type", "edge", "eyeLevel"],
  "center-perspective": ["type", "vanishX", "vanishY"],
  "phi-grid": ["type"],
  "golden-triangle": ["type", "flipX", "flipY"],
  "diagonal-flow": ["type", "flipX", "flipY"],
  "icon-keylines": ["type"]
});
var COMPOSITION_GRID_TYPES = Object.freeze(
  Object.keys(COMPOSITION_GRID_FIELDS)
);

// web/vendor/ag-design/layout-grid-model.js
var LAYOUT_GRID_TYPES = Object.freeze([
  "golden-canon",
  "columns",
  "modular",
  "baseline",
  "spacing",
  "thirds",
  "manuscript",
  ...COMPOSITION_GRID_TYPES
]);

// web/vendor/ag-design/palette-model.js
var PALETTE_HARMONIES = Object.freeze([
  "monochromatic",
  "analogous",
  "complementary",
  "split-complementary",
  "triadic",
  "tetradic",
  "square"
]);

// web/vendor/ag-design/runtime-queue.js
var PRIORITIES = Object.freeze([
  "user-blocking",
  "user-visible",
  "background"
]);

// web/vendor/ag-design/grid-icon-draft.js
var GRID_ICON_SYMBOLS = Object.freeze([
  "play",
  "focus",
  "image",
  "compass"
]);

// web/locale-preferences.js
var KEY = "ag-design:locale:v1";
var runtimes = /* @__PURE__ */ new WeakMap();
function readLocalePreferences(storage) {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return null;
    if (raw.length > 4096) return null;
    const value = JSON.parse(raw);
    if (value.version !== 1 || Object.keys(value).some(
      (k2) => !["version", "locale", "fallbackLocale", "availableLocales"].includes(
        k2
      )
    ))
      return null;
    const context = createI18n({
      locale: value.locale,
      fallbackLocale: value.fallbackLocale,
      availableLocales: value.availableLocales
    });
    const result = {
      locale: context.locale,
      fallbackLocale: context.fallbackLocale,
      availableLocales: context.availableLocales
    };
    context.dispose();
    return result;
  } catch {
    return null;
  }
}
function writeLocalePreferences(storage, context) {
  try {
    storage?.setItem(
      KEY,
      JSON.stringify({
        version: 1,
        locale: context.locale,
        fallbackLocale: context.fallbackLocale,
        availableLocales: context.availableLocales
      })
    );
    return Boolean(storage);
  } catch {
    return false;
  }
}
function getLocaleRuntime(document = globalThis.document) {
  if (runtimes.has(document)) return runtimes.get(document);
  let storage;
  try {
    storage = document.defaultView.localStorage;
  } catch {
  }
  const preference = readLocalePreferences(storage);
  const context = createI18n(
    preference ?? {
      locale: document.documentElement.lang || document.defaultView.navigator.language,
      availableLocales: ["en", "ru"],
      fallbackLocale: "en"
    }
  );
  const detach = setDocumentI18n(document, context);
  const runtime = {
    context,
    save: () => writeLocalePreferences(storage, context),
    dispose() {
      detach();
      context.dispose();
      runtimes.delete(document);
    }
  };
  runtimes.set(document, runtime);
  return runtime;
}
function createLocaleSettings({
  document = globalThis.document,
  runtime = getLocaleRuntime(document),
  compact = false,
  supportedLocales
} = {}) {
  const context = runtime.context, bind = createI18nBindings(context), element = document.createElement("section");
  element.className = "ag-locale-settings";
  const title = document.createElement("h3"), hint = document.createElement("p"), status = document.createElement("p");
  hint.className = "muted";
  status.setAttribute("role", "status");
  bind.text(title, "ui.settings");
  bind.text(hint, "ui.hint");
  const choices = [
    ...new Set(supportedLocales ?? ["en", "ru", ...context.availableLocales])
  ];
  if (!choices.length || choices.length > 32 || context.availableLocales.some((locale) => !choices.includes(locale)))
    throw new TypeError(
      "Settings locale policy must include every active locale"
    );
  const name = (locale) => locale === "en" ? context.t("ui.english") : locale === "ru" ? context.t("ui.russian") : locale;
  const language = createLanguageSwitcher({
    document,
    i18n: context,
    variant: "inline",
    onChange() {
      notify(runtime.save());
    }
  });
  const fallback = createSelect({
    document,
    label: context.t("ui.fallback"),
    options: choices.map((value) => ({ value, label: name(value) })),
    value: context.fallbackLocale
  });
  const group = document.createElement("fieldset"), legend = document.createElement("legend");
  bind.text(legend, "ui.languages");
  group.append(legend);
  const boxes = /* @__PURE__ */ new Map();
  for (const locale of choices) {
    const label = document.createElement("label"), input = document.createElement("input"), text = document.createElement("span");
    input.type = "checkbox";
    input.value = locale;
    input.checked = context.availableLocales.includes(locale);
    text.textContent = name(locale);
    label.append(input, text);
    group.append(label);
    boxes.set(locale, { input, text });
  }
  let unbindStatus;
  function notify(persisted) {
    unbindStatus?.();
    unbindStatus = bind.text(
      status,
      persisted ? "ui.localSaved" : "ui.localUnsaved"
    );
  }
  const apply = createButton({
    document,
    label: context.t("ui.apply"),
    variant: "primary",
    onClick: () => {
      const availableLocales = choices.filter(
        (locale) => boxes.get(locale).input.checked
      );
      if (!availableLocales.length) {
        unbindStatus?.();
        unbindStatus = bind.text(status, "ui.atLeastOne");
        return;
      }
      const fallbackLocale = availableLocales.includes(fallback.value) ? fallback.value : availableLocales.includes("en") ? "en" : availableLocales[0];
      context.configure({
        availableLocales,
        fallbackLocale,
        locale: language.value
      });
      notify(runtime.save());
    }
  });
  let previousPolicy = "";
  function refresh() {
    fallback.element.querySelector("label").textContent = context.t("ui.fallback");
    for (const control of [fallback])
      for (const option of control.select.options) {
        option.textContent = name(option.value);
        option.disabled = !context.availableLocales.includes(option.value);
        option.hidden = option.disabled;
      }
    const policy = JSON.stringify([
      context.availableLocales,
      context.fallbackLocale
    ]);
    const policyChanged = policy !== previousPolicy;
    previousPolicy = policy;
    if (policyChanged) fallback.setValue(context.fallbackLocale);
    language.element.hidden = context.availableLocales.length < 2;
    fallback.element.hidden = context.availableLocales.length < 2;
    for (const [locale, box] of boxes) {
      if (policyChanged)
        box.input.checked = context.availableLocales.includes(locale);
      box.text.textContent = name(locale);
    }
    apply.querySelector(".ag-nav__label").textContent = context.t("ui.apply");
  }
  const off = context.subscribe(refresh);
  refresh();
  const form = document.createElement("div");
  form.className = "ag-locale-settings__fields";
  form.dataset.agFormRow = "auto";
  fallback.element.dataset.agFormField = "";
  form.append(language.element, fallback.element);
  element.append(title, hint, form, group, apply, status);
  if (compact) element.classList.add("ag-locale-settings--compact");
  return {
    element,
    dispose() {
      off();
      bind.dispose();
      language.dispose();
      fallback.dispose();
    }
  };
}
export {
  createLocaleSettings,
  getLocaleRuntime,
  readLocalePreferences,
  writeLocalePreferences
};
/** @preserve
/////    CoLoR PaRsLeY  a simple set of color parsing thingies!
/////           Beta 0.1.8   Revision date: June 04, 2022
/////
/////    Functions to parse color values and return array
/////    Copyright (c) 2019-2022 by Andrew Somers. All Rights Reserved.
/////    LICENSE: AGPL 3
/////    CONTACT: Please use the ISSUES or DISCUSSIONS tab at:
/////    https://github.com/Myndex/colorparsley/
/////
///////////////////////////////////////////////////////////////////////////////
/////
/////    IMPORT:
/////    import { colorParsley } from 'colorparsley';
/////
/////    let rgbaArray = colorParsley('#abcdef');
/////
/////    Output as array:  [r,g,b,a,isValid,colorspace]
/////    Example: [123,123,123,1.0,true,'sRGB']
// */
/** @preserve
/////    SAPC APCA - Advanced Perceptual Contrast Algorithm
/////           Beta 0.1.9 W3 • contrast function only
/////           DIST: W3 • Revision date: July 3, 2022
/////    Function to parse color values and determine Lc contrast
/////    Copyright © 2019-2022 by Andrew Somers. All Rights Reserved.
/////    LICENSE: W3 LICENSE
/////    CONTACT: Please use the ISSUES or DISCUSSIONS tab at:
/////    https://github.com/Myndex/SAPC-APCA/
/////
///////////////////////////////////////////////////////////////////////////////
/////
/////    MINIMAL IMPORTS:
/////      import { APCAcontrast, sRGBtoY, displayP3toY,
/////               calcAPCA, fontLookupAPCA } from 'apca-w3';
/////      import { colorParsley } from 'colorparsley';
/////
/////    FORWARD CONTRAST USAGE:
/////      Lc = APCAcontrast( sRGBtoY( TEXTcolor ) , sRGBtoY( BACKGNDcolor ) );
/////    Where the colors are sent as an rgba array [255,255,255,1]
/////
/////    Retrieving an array of font sizes for the contrast:
/////      fontArray = fontLookupAPCA(Lc);
/////
/////    Live Demonstrator at https://www.myndex.com/APCA/
// */
/*! Bundled license information:

markdown-it/dist/markdown-it.mjs:
  (*! markdown-it 15.0.3 https://github.com/markdown-it/markdown-it @license MIT *)
*/

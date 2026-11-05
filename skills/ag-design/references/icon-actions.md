# Icon-only, icon+text, text or overflow

Read the current `icons` and `actions` design-book sections. Offline use `@ag-design/rules/icon-action-guidance.md` (rules0.9.1+) and `sections.json`; it contains the decision table, source boundaries and chat examples.

Select a representation by audience recognition, clear target, context, consequences and frequency. A familiar frequent toolbar command can be icon-only; an unfamiliar/domain-specific action, meaningful permission or irreversible consequence needs visible text. Icon+text preserves meaning when a symbol only helps scanning. A rare secondary command may become a labelled menu item; do not hide essential actions merely for density. Primary/secondary emphasis and label form are independent. A familiar composer Send can use an icon when its meaning is established.

Use real button/link semantics, localized action names, focus, sufficient hit targets and visible selected/busy/disabled states. Hiding captions does not shrink hit targets or remove padding. Tooltip is supplementary; HTML title alone does not establish keyboard/touch usability. Custom tooltip behavior follows applicable hover/focus conditions. Stable-label toggle + aria-pressed differs from an ordinary command whose action label changes.

For chats, Jump to latest is a reasonable icon candidate. Load history differs from scroll up; clear visible differs from deleting durable history. Prefer text for approval/rejection, resume, reconnect, session changes and mode selection unless a concrete alternate pattern has been validated. Keep demo controls grouped separately. Preserve user-approved circles and host styling choices. New guidance is advisory, not recognition evidence or component qualification; record unknowns.

Choose location before icon representation: read [window/component command placement](window-command-placement.md). Scope, frequency and recognition are independent.

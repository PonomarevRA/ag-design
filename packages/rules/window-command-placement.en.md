# Place commands by scope

AG policy, 2026-10-31. Scope determines location; frequency determines prominence; recognition determines icon-only versus labelled presentation. These are separate decisions. This refines “frequent commands in the native toolbar”; it does not move every frequent component action there.

| Scope | Primary location | Examples and conditions |
|---|---|---|
| Application | Native application menu; stable app navigation | Settings, help, section navigation. An optional frequent shortcut does not justify an otherwise empty row |
| Window/workspace | Real native window toolbar where supported; one web header otherwise | Back/Forward, project/document picker, panel toggles, workspace search; stable unambiguous target |
| Document/view | Its header; native toolbar only for an unambiguous active document | Save document or refresh view; split panes must not silently change the target |
| Component/selected object | Component header, compact toolbar or adjacent object actions | Copy code, local search, wrap, chart zoom, table filter, row actions |
| Rare secondary command | Labelled overflow belonging to the same scope | Keep component and window commands in named groups |
| Consequential confirmation | Near the affected object, with visible wording and consequences | Do not turn deletion or access approval into an unexplained icon |

## Native promotion gate

Promote only when scope/target is clear, persistent access is useful, a real platform toolbar supports the control, and the title/window drag area remains usable. Use one command identity/handler and owner of state. Synchronize required enabled, hidden, selected/toggle, pending and target state. Unsupported semantics keep their web control.

Hide a web action only after the current window/document confirms that exact command is represented and operable. A native-app flag or toolbar presence is insufficient. Invalidate confirmation on reload/bridge loss and restore fallback. Keep browser and unsupported-platform access. Verify keyboard names/states, native/content focus, narrow width,200% text and themes; unknown is not PASS.

## Removing a redundant row

Map every old item: `commandId → scope/target → destination → state → fallback`. Remove the row only when every command remains reachable and no unique context/filter/status belongs there. Move remaining local controls into their component and rare global controls into an accessible menu. Remove leftover height/dividers/margins and hidden focusable duplicates.

A native menu and toolbar may intentionally expose the same command and shortcut. That does not justify an identical second HTML toolbar. A second content row is justified by a distinct task, such as table filters, formatting controls or canvas tools. Preserve their meaningful context.

Apply the icons chapter: named real controls, visible focus, full hit targets, selected states and touch alternatives. Familiar editor actions may default to compact with `toolbarMode: "labeled"` available.250ms pointer dwell is a configurable AG default, not WCAG. Reuse web bindTooltip/inline-help lifecycle; native tooltip timing stays platform-owned unless supported. Keep visible text for ambiguous/consequential commands.

Measure rows/header height, unreachable commands(target0), duplicate same-scope controls and task reachability. Saved pixels do not prove faster task completion. Measure success/time/errors before claiming usability improvement; no universal icon/row count is imposed.

Apple HIG supports frequent, logically grouped toolbar commands without overcrowding; W3C covers names/roles/states and hover/focus conditions. The scope matrix and migration gate are authored AG policy. This is not adapter capability, native/AT qualification or installation evidence.

- [Apple HIG — Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)
- [W3C — Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)
- [W3C — Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)

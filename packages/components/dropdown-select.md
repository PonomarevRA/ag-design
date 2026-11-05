# Searchable single-choice dropdown

`createDropdownSelect` combines a literal, bounded local option list with one editable `role=combobox` input. Include the ordinary AG tokens and `dropdown-select.css`. Options have unique nonempty string values (at most80characters), labels/groups at most180characters and optional disabled states; at most500options are rendered. Search uses Unicode NFKC normalization and case-insensitive label matching. No supplied HTML, remote data, request or dependency is used.

```js
import { createDropdownSelect } from '@ag-design/components';
const chooser = createDropdownSelect({document, label:'Раздел', name:'section', required:true,
  options:[{value:'overview',label:'Обзор',group:'Работа'},{value:'settings',label:'Настройки',group:'Работа'}],
  onChange(value) { console.log(value); }});
form.append(chooser.element);
```

The initial selection is the empty placeholder unless `value` specifies an enabled option. `setValue` and `setOptions(options, value?)` are silent. A replacement is fully validated before changing DOM/defaults. Without an explicit replacement value, retain the current enabled choice or use the placeholder. Native reset restores the constructor value when it still exists/enabled, otherwise the placeholder. Reintroducing that option restores its original reset default. Search text is separate from committed selection; cancelling, Tab or an outside pointer/focus restores the committed label without a callback. Programmatic setters and native reset do not emit user events.

Arrow keys open/navigate enabled results; Home/End choose the first/last active result while open. Enter commits only an enabled active option and emits one callback plus native input/change events. Enter while closed retains form behavior. Escape only cancels/stops propagation while the popup is open; a closed field leaves dialog Escape handling intact. Tab closes without trapping focus or implicitly accepting a query. IME/composition keys remain owned by the input method. `searchable:false` uses a read-only combobox with `aria-autocomplete=none`; ordinary arrow/Enter navigation still works.

The backing `select` preserves name, FormData, required validity, default options and reset. It is excluded from the accessibility/focus order while enhanced. Invalid native submission is cancelled at that hidden control, its actual validation message appears at the visible combobox, and focus moves there. A manual `error`/`setError` is descriptive, matching the basic AG select; it is not a server validation service or a manufactured passing result.

The borderless disclosure arrow uses logical inline positioning and does not add another Tab stop. Essential placeholder, hint, group, empty-state and error text use the host `--ag-text`; error meaning also remains visible in its actual message, border and `aria-invalid`. Disabled options and the decorative arrow may use `--ag-muted`.

The popup prefers manual popover top-layer rendering. The fallback stays inside the closest dialog (or body) and copies the source semantic tokens, font and direction while open. Vertical placement keeps a gap from the trigger, chooses an available side, clamps to the viewport and scrolls its own list. An unavailable, hidden, removed or fully offscreen trigger closes its popup without stealing focus. Open-only resize/scroll/theme observers are released on close. A transformed body or nonstandard unpositioned dialog in an older renderer still needs host/browser verification; prefer top-layer support for such layouts.

`dispose` removes the popup, callbacks, global subscriptions and enhancement handlers. If the root remains in a form, the native select becomes visible/focusable and retains its value/name/required state; later controller mutation/open calls are inert. The host may remove the root normally. No browser raster, manual AT, full profile/font contrast, physical touch or native-performance qualification is implied by Node/jsdom contract checks.

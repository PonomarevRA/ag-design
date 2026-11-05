# Compact list controls (core0.29.0)

These are original framework-independent AG factories informed by pinned GitLab/Pajamas source. No GitLab assets, Vue, Bootstrap or FloatingUI dependency is included. Both catalog entries remain **draft**: automated DOM/browser coverage is not manual assistive-technology or consumer qualification.

## Sorting

```js
import {createSortingControl} from '@ag-design/components';
const sorting = createSortingControl({document, i18n, label: 'Sort by',
  options: [{value:'relevance',label:'Relevance',directional:false},
    {value:'name',label:'Name',defaultDirection:'asc'}],
  value: {by:'relevance',direction:null},
  onChange(value) { host.applySort(value); }
});
container.append(sorting.element);
// Host restore is silent; caller owns actual sorting, requests, URL and persistence.
sorting.setValue({by:'name',direction:'desc'});
// Remove subscriptions before removing the DOM.
sorting.dispose();
sorting.element.remove();
```

Use 1–32 unique criteria; IDs are 1–80 characters and labels 1–180 characters. Direction is `asc`/`desc` for directional criteria, exactly `null` otherwise. Selecting a new criterion uses its declared default direction. Relevance has no artificial reverse. The second button names current and next direction; it is an action, not an `aria-pressed` mode. `setValue` validates atomically, emits no user callback and returns a copied value through the getter. Disabled state closes the child listbox. Late rejected callbacks are reported only in their current generation; dispose isolates callbacks/listeners. A host native change during criterion commit wins over the retired callback.

## Nonmodal popover

```js
import {createPopover} from '@ag-design/components';
const content = document.createElement('div'); // detached, same document
content.append(existingControl.element);
const view = createPopover({document,i18n,label:'View',title:'Card appearance',
  content,width:340,maxHeight:480,align:'end'});
container.append(view.element);
view.open();
view.close({restoreFocus:true});
view.dispose(); // releases its own listeners only
existingControl.dispose(); // caller still owns borrowed component cleanup
view.element.remove();
```

Content must be a detached same-document HTMLElement. Width 240–640 and maximum height 120–720 are CSS-pixel AG bounds, not WCAG requirements. Logical start/end alignment follows the originating direction. Native popover/manual top layer is preferred; fallback portals preserve owning dialog or nearest AG layer, theme and nested-listbox containment. The surface is a named `role=dialog` without `aria-modal` or a focus trap. Open focuses a content control; Escape and Close return focus to an available trigger. Outside click/focus closes while preserving the next external focus target. A nested listbox consumes its own Escape first. Trigger removal, disabled/hidden/offscreen owners close the surface. Listeners and observers exist only while open. A failed placement emits no fictitious open/close pair.

Borrowed controls retain values across close/open. This factory does not invent draft/save, validation, network or transaction behavior. Use a modal popup for blocking tasks or explicit confirmation. Do not put a multi-field form into an ARIA menu or tooltip. Host-owned labels/title/content remain caller translations; AG supplies close/direction strings through explicit i18n. `onOpenChange` fires after cleanup/focus work; reentrant state changes win. `onError` isolates thrown/rejected host callbacks; it is not a backend error boundary.

## Catalog composition

`web/catalog-view-controls.js` composes these factories with existing dropdown-select and native segmented-choice. Query/category/order remain visible; appearance settings move behind a labelled View trigger. Changes apply immediately. Palette remains host/library-owned, metric distinguishes unknown counts from zero, and a help disclosure explains the relative 0–5 score. Existing hidden native models preserve host change-event contracts and are excluded from the accessible tree. No sorting transport or product-specific token-query language was added. Opening View overlays cards without reflow; masonry and detail routes remain host-owned.

See `docs/engineering/gitlab-patterns.md` and source-backed chapters `gitlab-pajamas-patterns`, `list-view-controls`, `nonmodal-popovers`. Qualify target consumer scenarios and manual AT separately before non-demo reuse.

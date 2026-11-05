# Masonry layout

Natural-height Pinterest-style cards in an ordinary CSS Grid. Both public entry points
use the same row-span implementation. No remote resources or runtime dependencies.

```js
import { createMasonryLayout, bindMasonryLayout } from '@ag-design/components';
import '@ag-design/components/styles.css';
const grid = createMasonryLayout({ document, items: cards, minColumnWidth: 280, gap: 16 });
container.append(grid.element);
grid.element.append(newCard); // automatically observed
grid.update({ columns: 3 }); // 'auto' restores responsive columns
grid.refresh(); // explicit fallback when observers are unavailable
grid.dispose();
// bindMasonryLayout(container).dispose() keeps an existing container and its DOM.
```

Options are atomic finite CSS-pixel values: minColumnWidth and rowHeight 1–10000,
gap 0–10000, columns 'auto' or an integer 1–24. Defaults are 280/4/16/auto.
Unknown options throw. Calls after disposal do nothing. A second simultaneous binding
of the same container throws. Restore checks preserve later host style edits.

Cards remain in DOM/Tab order. No dense filling or balancing that changes CSS order.
Host can set grid-column: 1 / -1 for wide cards. Cards need intrinsic height and zero
block margins; put margins inside wrappers. Spans quantize height to rowHeight + gap,
so visual spacing can exceed the requested gap by less than that amount.
This is the existing catalogue layout made reusable, not a shortest-column packer.

ResizeObserver observes container width and individual card sizes; MutationObserver
tracks direct additions/removals. Image load and window resize are event fallbacks.
Without observers call refresh after content/visibility changes. Hidden/disconnected
roots defer height measurement until a later refresh/resize. No polling, animations,
DOM recycling, data loading or content interpretation. Add render-window to expensive
card contents separately; keep stable shells and do not wrap windowed previews twice.

Layout itself has no colors or new tab stops; cards inherit the local profile and
semantics. Fixed columns can become too narrow; use auto at small widths. Full manual
assistive-technology qualification and browser CPU/RSS budgets remain unverified.

Measure in an untransformed layout: a CSS scale/rotation on the grid or its ancestors is not supported by this row-span version. Use an unscaled iframe/document for editor previews.

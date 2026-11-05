# Data Grid

`createDataGrid` combines bounded two-dimensional viewport rendering with a paged native table. It uses local styles and semantic `--ag-*` tokens. It never fetches URLs, registers global custom elements or imports remote code. `createDataTable` remains a separate primitive.

```js
const grid = createDataGrid({
  document,
  label: 'Заявки',
  columns: [
    { id: 'name', label: 'Название', editable: true, width: 200 },
    { id: 'amount', label: 'Сумма', type: 'number', format: 'number', editable: true }
  ],
  rows: [{ id: 'order-1', cells: { name: 'Проект', amount: 125 } }],
  mode: 'virtual',
  height: 360,
  selectable: true,
  onEdit: async (edit, { signal }) => {
    // Save through the application's own local/service adapter. Throw or return a
    // string/false on failure. The grid retains the draft until save or cancel.
  }
});
container.append(grid.element);
await grid.whenIdle();
```

`DataGridOptions`, `DataGridController` and provider contracts are declared in `data-grid.d.ts`. All cells are finite numbers, booleans, strings or null. Literal content uses `textContent`. Explicit host renderers may return detached elements or `{element, dispose}`; their own resources remain their responsibility. Rendered rows and callback snapshots are immutable copies. A remote callback receives projected cells unless its response supplies full `rows`.

## Query and local adapter

`query.page` is **zero-based**; the pager displays `page + 1`. `setQuery` validates the complete proposed snapshot atomically. The local adapter searches all declared scalar columns with case/accent folding, applies all structured filters, then applies one stable sort. Empty values sort last in both directions. It caches row indices once per matching query/data revision; scrolling never filters or sorts the full local array again. `createGridArrayDataSource` can also back an application-owned delayed provider.

Filters: `eq`, `neq`, `contains`, `notContains`, `startsWith`, `notStartsWith`, `endsWith`, `notEndsWith`, `lt`, `lte`, `gt`, `gte`, `between`, `in`, `empty`, `notEmpty`. Boolean equality recognizes true/false and conventional boolean strings. Other equality uses folded scalar text, so `"001"` differs from `1`, and `false` differs from `0` unless the filter operand is boolean. Empty filter values and `in:[]` mean no filter; `0` and `false` are nonempty. Numeric comparisons exclude booleans/null/blank from numeric coercion. Dates are scalar ISO strings: choose explicit equality or `between` bounds; there is no implicit date/timezone parser in query execution.

The structured filter panel supports operators, typed number/date input, enum single/multiple choice and boolean choice. Column settings expose visibility, numeric width, order, frozen prefix and sample autosize. These are keyboard alternatives to pointer resizing and header drag/drop. Global search is debounced and waits for IME composition. Filters apply explicitly; optional `filterDelay` enables debounced value changes. Percent-formatted fields still use raw numeric filter values. Initial `autosize` samples widthless requested columns once; explicit widths remain authoritative. Runtime labels may be overridden through `labels`.

## Window provider

```js
const source = {
  getWindow(request, { signal }) {
    const length = Math.max(0, Math.min(request.y1, 200000000) - request.y0);
    return {
      num_rows: 200000000,
      num_columns: 1000,
      data: request.columnIndices.map(x =>
        Array.from({length}, (_, i) => x + request.y0 + i)),
      rowIds: Array.from({length}, (_, i) => `row-${request.y0 + i}`),
      revision: request.revision
    };
  }
};
```

Ranges `x0/x1/y0/y1` are half-open. **`data` is column-major in `request.columnIndices` order**, not necessarily every integer between `x0` and `x1`: hidden, reordered and frozen columns can form a noncontiguous projection. `columnIds` gives the corresponding schema identities. The provider returns the number of all matching rows and the declared schema column count. It implements sorting/filtering/search itself; the grid never enumerates remote rows. Grouped `row_headers` and `column_headers` contain one bounded string path per requested row/column. Adjacent equal prefixes merge through native spans in paged mode and logical ARIA spans in virtual mode; the grid does not calculate aggregations/pivots.

Stable `rowIds` are required for selection, editing and actions. Read-only windows may omit them and receive query-local generated identities. Full immutable `rows` may accompany a window for actions/details requiring unloaded fields. Otherwise callback rows contain requested projected cells only. Remote editing requires an explicit `onEdit` adapter; the host updates its provider on successful save.

Every new matching query/data revision invalidates the sole retained window. Obsolete signals are aborted and their public waiters settle immediately, even if an application provider ignores cancellation. Late resolve/reject cannot change current data, errors or selection. The component releases its reference to obsolete requests; it cannot terminate work/resources deliberately retained by the host provider.

`refresh()` explicitly reloads data. `scrollTo({row,column})` and scroll/resize use a one-window cache. `whenIdle()` waits for the latest owned scheduled frame/request, including query replacement. There is no idle frame loop. The browser scroll surface is capped at five million CSS pixels and maps to logical row fractions; exact jumps and keyboard navigation remain available for distant rows.

## Interaction, recovery and persistence

- Arrow keys/Home/End/PageUp/PageDown move the active cell. Ctrl+Home/End go to dataset boundaries. Enter/F2 opens an editable cell. Header Alt+Left/Right reorders; Shift+Left/Right resizes. Pointer resize listeners exist only during the gesture and are removed on cancel/dispose. Double-click a resize handle to autosize the current sample.
- Selection uses stable IDs or an all-matching descriptor with bounded exclusions. Pages, widths and order preserve selection; a changed matching query/data revision clears all-matching selection. The component never materializes millions of selected IDs. Single selection rejects all-matching/multiple IDs.
- Editing uses a panel independent of recycled cells. Scrolling preserves a draft. Query/schema/view mutations require Save or Cancel first. Validation/save failure retains the exact draft and focuses the editor; Escape cancels. Cancellation/disposal settles even an abort-ignoring async save. IME composition does not trigger keyboard commit. Confirmed local edits update only the intended stable row/column identity.
- Row and bulk actions enforce disabled/restricted states and explicit confirmation. Contextual action panels stay outside the viewport clip so controls remain reachable on compact rows. Host callbacks own business work; no built-in unbounded export or URL invocation exists.
- Responsive priority hides lower-priority columns while protecting sorted/filtered fields. Details show hidden values and optional host content. On narrow viewports grouped auxiliary headers scroll horizontally instead of covering data. Frozen columns progressively release on narrow viewports to leave a reachable scrolling area. Paged mode supports wrapped rows and optional `autoheight`; virtual mode keeps fixed row/column geometry within each window; `rowHeight` is a minimum and one inherited line-height read per draw expands rows for larger text and uses details for expanded content.
- Persistence is opt-in through `load/save`. Version1 snapshots whitelist schema IDs, order, visibility, width, frozen prefix, page size and sort. They exclude rows, search/filter content, drafts and selection. Invalid/incompatible snapshots are ignored atomically. Nothing writes to browser storage by default.
- `readDataGridTable(table)` returns a scalar/schema snapshot from existing markup. It copies only whitelisted structure and `data-value`; it never moves markup, copies event handlers or executes HTML. Host plugin behavior is composed through documented callbacks rather than a global plugin registry.

## Bounds and qualification

Schema: 1–1000 columns; virtual logical rows: 0–1,000,000,000. Resident arrays: at most100,000 rows and1,000,000 scalar cells. Virtual windows: at most128 rows,128 projected columns and16,384 scalar cells; overscan3rows/1column. Paged mode: at most128 declared columns and16,384 cells per page, page size1–500. Selection/exclusions:10,000 IDs; frozen prefix:32 columns maximum, further limited by available viewport width. String values:4096 UTF-16 code units; identities:256; group depth:4; actions:32 definitions and64 per-row restrictions. Every retained provider window has a conservative4MiB UTF-16 scalar/metadata budget, including row/header identities, labels and action restrictions. The requested virtual height must fit declared headers and one minimum-height data row. Larger inherited text or deeper provider headers can expand the viewport to preserve a readable data row; extreme typography above10,000px viewport fails visibly and should use paged mode. These are component guards, not claimed service capacity.

The public diagnostics expose current revision/status/window, rendered row/column/cell counts, requested cells/calls, current pending count, one-cache count and abandoned request count. They contain no private dataset values. Synthetic generated200M×1000 data tests establish windowing/correctness, not resident200billion-cell capacity. Browser frame/heap results, assistive-technology behavior, actual text metrics and full theme/RTL/zoom matrices require separate runtime qualification. Unit tests alone are not accessibility or performance certification.

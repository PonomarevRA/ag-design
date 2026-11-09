# Layout drop preview

Use `createLayoutDropPreview({items, source})` for a user-editable row, column or grid where the insertion position affects sibling order. Supply relatively positioned DOM siblings in semantic order with the same initial CSS order. Import `@ag-design/components/styles.css` for the drop outline.

Call `move(before, dx, dy)` with the destination sibling (or `null` to append) and the pointer delta in CSS pixels. The lifted block follows the pointer while its reserved slot takes part in layout. The host chooses valid destinations, captures the pointer and handles keyboard, touch and single-click alternatives. At gesture start, record the original slot geometry for stable hit testing. Call `clear()` before committing the new semantic order and on Escape, pointer loss and disposal. Publish one undoable command per drop.

Use free positioning for deliberate overlap and `createDragDrop` for moving, copying or exchanging items between lists. This controller covers one parent and leaves storage, permissions and reparenting to the host.

Interaction reference: [Parrilla by Moxen](https://moxen.cl/recursos/parrilla/).

For resizable widgets, adapt secondary content to the available container width. Keep the name, key value and action at every size. The catalogue demo adds a breakdown in wider blocks with a container query and retains the same DOM while resizing.

# Просмотр кода

`createCodeViewer` показывает исходник с локальной подсветкой, выделением, поиском, копированием, переносом и номерами строк. По умолчанию текст доступен только для чтения. `readOnly:false` включает тот же движок для редактирования, истории и интеграции MarkdownEditor.

```js
const viewer = createCodeViewer({ document, label: "Конфигурация", filename: "settings.json", language: "json", code: '{"enabled":true}' });
container.append(viewer.element);
await viewer.whenIdle();
viewer.setCode('{"enabled":false}');
```

Бандл CodeMirror загружается локальным ESM import только при первом создании. Общий индекс библиотеки не импортирует его заранее. До готовности доступен буквальный текст; после `dispose` поздняя загрузка не создаёт редактор. Подсветка не использует CDN, workers, WASM, язык-сервер или сетевое определение языка.

JavaScript/TypeScript/JSX/TSX, JSON, Python, HTML, CSS, SQL, Markdown поддержаны локальными парсерами. C# и shell используют локальные stream modes; YAML также доступен. Неизвестный язык остаётся обычным текстом. Точность синтаксической подсветки не равна семантическому анализу VS Code.

`value` сразу отражает `setCode`. Обычный setter молчит и сбрасывает базу undo; `{addToHistory:true,emitChange:true}` создаёт программное изменение с событием `origin:"api"`. История доступна после `whenIdle()`. Пользовательские изменения сообщают `input`, `undo`, `redo`. Изменения `setOptions` сохраняют текст и выделение. Read-only запрещает изменение через `undo`/`redo` и пользовательский ввод; setter остаётся действием владельца.

Лимиты: 1 MiB UTF-8, 100000 строк и 20000 UTF-16 единиц в одной строке. Начальное значение, setters и транзакции ввода проверяются до замены предыдущего корректного текста. Ошибка setter бросает исключение; слишком большой пользовательский ввод отклоняется с видимым сообщением. Текст никогда не исполняется и не становится HTML.

Untouched source and copy preserve exact line endings. Homogeneous CRLF, LF and CR survive editing through the editor line-separator facet. A document with mixed newline conventions adopts its first separator after an actual edit; its untouched value remains literal. Copy uses the selected source range, or the whole source. Clipboard denial leaves text selectable and reports the manual-copy path; there is no deprecated execCommand fallback.

Semantic `--ag-*` variables resolve in each host; optional `--ag-code-keyword/string/literal/comment/type/property` tokens override syntax roles locally. Components do not call a global theme setter. Check actual text/background pairs, increased contrast and 200% text in the host; Node/DOM tests are not an accessibility certificate.

`whenIdle` waits for local engine initialization and one owned measurement checkpoint. It does not promise complete background parsing, painted pixels or measured frame rate. The text model is bounded but retained while mounted; viewport rendering limits DOM, not the size of the source string. Use `render-window` around offscreen component instances where ownership, focus and unsaved state permit disposal. Do not add a second viewport window around the editor's own lines.

`dispose()` идемпотентен: удаляет редактор, освобождает собственный текст и callback, завершает ожидающие checkpoints. У сохранённого controller `value` становится пустой строкой, последующие setters ничего не меняют. Объект настроек вызывающей стороны не изменяется. Для скрытого или ещё не имеющего layout элемента `whenIdle()` ограничивается инициализацией; измерение нулевой области не выдаётся за видимую отрисовку.

Selection, native selection and search highlights use an opaque mix of 4% local accent with the local surface. Search contours remain 1px, with a 2px active contour. Opaque fills prevent overlapping selection/search layers from accumulating tint. Canonical palette tests cover normal/increased light/dark appearances and report WCAG text contrast separately from advisory APCA; caller-defined syntax overrides still need their own contrast check. Toolbar physical arrows follow computed text direction, with the nearest declared direction used only when computed direction is unavailable.


The public styles.css includes a scoped external CodeMirror base layout and semantic theme.
The gutter and source remain side by side under a self-only style CSP; geometry no longer
depends on runtime-injected styles or generated class names. Syntax tokens use stable
AG classes. When copying individual assets, include code-viewer-base.css before
code-viewer.css; its tooltip.css import must also be copied. The pinned base can be regenerated with
`node tools/text-engine/export-code-viewer-css.mjs`; engine source/licenses remain unchanged.

## Compact and labeled command bar

`toolbarMode:"compact"` is now the default for both readonly and editable views. Four native square buttons show consistent SVG search/copy/wrap/line-number icons; their localized names and toggle aria-pressed states remain available. `toolbarMode:"labeled"` restores visible text. Use `setOptions({toolbarMode:"labeled",tooltipDelayMs:250})` without replacing text, selection, undo state or the live editor. Markdown source editors/viewers accept the same initial options.

Pointer descriptions use shared `bindTooltip`, with `tooltipDelayMs` default250 and valid integers0..5000. Keyboard focus reveals the label immediately. No native title duplicates are generated. The helper supports hoverable text, Escape, outside interaction, cancellation and disposal; closed hints do not poll. Density and label style are separate from command meaning. Physical touch/keyboard, screenshots and assistive technology need actual host validation.

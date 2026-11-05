# Primitive integration examples

Import factories from `@ag-design/components`; import `@ag-design/components/styles.css`. Call the returned disposer when replacing an owned subtree.

CSS imports must precede other style rules: `@import "./select.css";`, `@import "./tabs.css";`, `@import "./menu.css";`.

## Native select

```js
createSelect({document, label:"Язык интерфейса", value:"ru", hint:"Пример — выбор сохраняет приложение", options:[
  {value:"ru",label:"Русский",group:"Доступные"},
  {value:"en",label:"English",group:"Доступные"},
  {value:"preview",label:"Предварительная локализация",disabled:true,group:"Другие"},
], onChange:value=>host.setLocale(value)});
```

The explicit `placeholder` reserves the empty value; otherwise a nonempty enabled option is required. Native label, validation, optgroups, required/disabled and form-reset behavior are preserved. A searchable combobox is a separate pattern, not claimed by this component.

## Workspace tabs

```js
createTabs({document,label:"Рабочая область",value:"editor",tabs:[
  {id:"editor",label:"Редактор",lifecycle:"offscreen",mount:()=>editorController},
  {id:"map",label:"Карта и метрики",lifecycle:"preserve",mount:()=>mapController},
  {id:"review",label:"Проверка",lifecycle:"preserve",mount:()=>reviewController},
]});
```

`setValue(id)` is silent and preserves focus outside the old panel. Leaving a focused hidden panel recovers focus to the new tab. `setValue(id,{emit:true})` reports a deliberate activation. Lazy mount is synchronous; an asynchronous host can mount a loading shell. Default manual activation uses Enter/Space after arrow focus, appropriate for costly panels. Local settings may choose vertical/automatic activation and `destroy` on sensitive categories. No live credentials are serialized or retained by the component itself.

## Command menu

```js
createMenu({document,label:"Вид",onAction:id=>host.command(id),items:[
  {id:"fit",label:"Вписать в экран",shortcut:"⇧1",group:"zoom"},
  {id:"rulers",label:"Линейки",checked:true,group:"visibility"},
  {id:"grid",label:"Пиксельная сетка",checked:false,group:"visibility"},
  {id:"theme",label:"Тема",group:"settings",children:[
    {id:"light",label:"Светлая"},{id:"dark",label:"Тёмная"},
  ]},
  {id:"redo",label:"Повторить",disabled:true,shortcut:"⇧⌘Z",group:"history"},
]});
```

Menu checked state is host-controlled: activating a command closes first, returns focus, then invokes callbacks; `setItems` can supply new checks. Shortcuts do not create global listeners or execute code from strings. Every item reserves check/label/shortcut/submenu slots. Disabled commands are discoverable by arrows but guarded against execution. Escape returns through submenu parents then the trigger; Tab closes and allows normal document navigation; handled keys stop propagation to a surrounding canvas.

Primary references verified25October2026: WAI APG [tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), [menu-button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/), [menus](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/). These patterns and source review are not AT/browser conformance certification. Root owns real browser, themes, narrow layout, package qualification and catalog metadata.

## Table, tree and settings

```js
import {createDataTable, createTree, createSettingsPanel} from '@ag-design/components';
const table = createDataTable({caption:'Устройства',columns:[{id:'name',label:'Имя'}],rows:[{id:'one',cells:{name:'Контроллер'}}]});
const tree = createTree({label:'Объекты',nodes:[{id:'system',label:'Система'},{id:'device',parentId:'system',label:'Контроллер'}],expandedIds:['system']});
const settings = createSettingsPanel({title:'Настройки',categories:[{id:'general',label:'Основные',groups:[{id:'profile',title:'Профиль',rows:[{id:'name',label:'Имя',mount:()=>document.createElement('input')}]}]}]});
```

DataTable is a native table with caption and header scopes, no grid or virtualization claim. The host supplies sorting and pagination. onSort returns a descriptor or null on reset; setters are silent. Keep stable row IDs. Tree accepts at most1000 nodes/depth32 and rejects cycles/orphans. Selection and expansion are host-controllable; action buttons do not implicitly select the row. Settings categories default to preserved state except sensitive categories, which destroy controls when leaving. A mounted field may return `{element,dispose}`. For a modal compose with createPopup and append its dialog under the owned view root. Data loading, settings persistence, network and credentials remain host responsibilities.

### Tree density

`createTree({label:'Слои',density:'compact',nodes,expandedIds,onSelect})` opts into a dense desktop tree. The only accepted density values are `comfortable` (default, existing wrapped labels and minimum 32 px rows/controls) and `compact`; unknown values throw. It changes presentation only: selection/expansion, IDs, typeahead, arrows/Home/End, RTL, row actions, silent setters and disposal keep the same contracts.

Compact uses a normal-text 13 px label, minimum 24 px border-box rows and 24 px disclosure/action slots, 16 px indentation per level, a reserved decorative icon column and a reserved action region sized to the maximum supplied row action count. Long labels ellipsize in the available label column, while the full literal DOM label remains the accessible name and the treeitem title. An iconless action retains its full accessible name/title; supply a meaningful short literal icon when a dense action needs a recognizable glyph. Hover, focus and selection have distinct feedback; disabled rows remain labelled and inert. No problem/visibility/change state is invented by this option.

The 24 px value is an authored density at normal text, not a forced height: unitless line height and minimum heights allow enlarged text to grow rows and control slots. On coarse pointers compact rows, disclosure and actions have at least 44 px targets. Default comfortable wrapping remains available when reading complete long names directly is preferable. Real browser light/dark, 200% text, narrow/deep hierarchy, RTL and coarse-pointer verification remain required; Node/DOM checks alone do not establish AT or WCAG conformance.

## Composition discipline

Reserve shared columns for labels, controls and auxiliary actions. Use semantic AG colours, common minimum control heights and logical alignment. Keep within-group spacing distinct from spacing between explicit groups. Do not turn a collection of unrelated samples into one form: each sample needs a visible name and independent container; insert into a real group only deliberately. At narrow width or200% text allow labels to wrap and rows to stack. Inspect wide/narrow, light/dark and RTL in the actual host. Demo20/40px values are authored OpenPencil examples, not general requirements.

Inspection chrome must not cover text or alter layout. Native outlines can follow objects without delayed rectangle repaint; expensive measurements remain explicit or settled activity captures. Names, heights and numeric deltas belong in an inspector. Preserve unknown coverage for unsupported geometry, AT and untested scenarios. Functional test PASS does not qualify a new component for production reuse.


## Native select indicator geometry (core0.36.1)

The closed single-select uses the shared `select-indicator.css`:12CSSpx inset from the inner trailing edge,12px glyph and12px text gap (36px trailing reservation),12px leading text inset. These are AG4px-grid defaults, not WCAG minima. Override inherited `--ag-select-indicator-inset` and `--ag-select-indicator-gap` per host. CurrentColor follows text, disabled and theme colors. RTL mirrors the indicator with logical text padding.

The element remains a native select: no custom popup, extra focus target, handlers or data changes. Multiple/explicit-size listboxes keep native appearance. Forced-colors restores the system indicator when gradients may be suppressed. `select.css` imports the shared geometry; an existing native-select host can load the exported stylesheet after host styles and add class `ag-select-indicator` to individual selects or opt in a scoped ancestor with `data-ag-select-indicators`. Do not opt in third-party controls blindly. Verify actual narrow/zoom/RTL and native popup behavior before qualification.

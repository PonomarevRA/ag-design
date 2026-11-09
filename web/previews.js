import { buildLayoutDropSample } from "./layout-drop-sample.js";
import { buildBentoSample } from "./bento-grid-sample.js";
import {buildWidgetListSample} from "./widget-list-sample.js";
import {buildConversationCardSample} from "./conversation-card-sample.js";
import {buildGitlabPatternsSample} from "./gitlab-patterns-sample.js";
import {buildGridIconWorkshop} from "./grid-icon-workshop.js";
import {buildAppRuntimeSample} from "./app-runtime-sample.js";
import {buildCatalogPresentationSample} from "./catalog-presentation-sample.js";
import {buildAsyncBoundarySample} from "./async-boundary-sample.js";
import {buildLayoutGridSample} from "./layout-grid-sample.js";
import {buildGoldenCanonSample} from "./golden-canon-sample.js";
import {buildLanguageSwitcherSample} from "./language-switcher-sample.js";
import { buildHistorySample } from "./history-sample.js";
import { buildCodeMarkdownSample, codeMarkdownIds } from "./code-markdown-sample.js";
import { buildDataGridSample } from "./data-grid-sample.js";
import { buildDropdownSelectSample } from "./dropdown-select-sample.js";
import { buildMasonrySample } from "./masonry-sample.js";
import {createManagementSample, managementIds} from "./management-sample.js";
import { buildAgentConversationSample } from "./agent-conversation-sample.js";
import { buildRenderWindowSample } from "./render-window-sample.js";
import {buildLoadingSample} from "./loading-sample.js";
import {buildAmbientChartSample} from "./ambient-chart-sample.js";
import {createLibraryPreview, updateLibraryPreview} from "./element-libraries.js";
import {
  createBoardViewport,
  createButton,
  createNumericBadge,
  createNumericScale,
  createField,
  createTextarea,
  createTextBlock,
  createPaletteBuilder,
  createStatus,
  createEmptyState,
  createNotice,
  createPopup,
  createSidebarController,
  bindNavigation,
  createAgentActivityChat,
  bindResizablePanel,
  createWindowToolbar,
  createCardConnections,
  createIssueSummary,
  createSectionStack,
  createStatePanel,
  createInlineHelp,
  createSkeleton,
  createMotion,
  createDragDrop,
  createSegmentedChoice,
  createChoiceChips,
  createBreadcrumbs,
  createProgress,
  applyColorProfile,
} from "./vendor/ag-design/index.js";
import { buildAsciiSample } from "./ascii-sample.js";
import { h } from "./dom.js";
let serial = 0;

/** Real package controls power both the showcase and load tests; disposing never touches another preview. */
export function buildSample(id, {strict = false} = {}) {
  if (id === "layout-drop-preview") return buildLayoutDropSample();
  if (id === "widget-list") return buildWidgetListSample();
  if (id === "conversation-card") return buildConversationCardSample();
  if (id === "grid-icon-draft") return buildGridIconWorkshop({locale:document.documentElement.lang||"ru"});
  if (["event-bus","request-router"].includes(id)) return buildAppRuntimeSample({mode:id==="event-bus"?"bus":"router"});
  if (id === "catalog-card") return buildCatalogPresentationSample();
  if (id === "popover" || id === "sorting-control") return buildGitlabPatternsSample(id);
  if (id === "catalog-search-controls") return buildCatalogPresentationSample({mode:"search"});
  if (id === "palette-builder") {const builder=createPaletteBuilder({document,baseColor:"#176f56"});return {element:builder.element,dispose:builder.dispose,interact:()=>builder.update({baseColor:builder.result.baseColor==="#176f56"?"#4f46e5":"#176f56"})};}
  if (id === "language-switcher") return buildLanguageSwitcherSample();
  if (["git-history","task-history"].includes(id)) return buildHistorySample(id);
  if (codeMarkdownIds.has(id)) return buildCodeMarkdownSample(id);
  if (id === "layout-grid-overlay") return buildLayoutGridSample();
  if (id === "golden-canon-grid") return buildGoldenCanonSample();
  if (id === "data-grid") return buildDataGridSample();
  if (managementIds.has(id)) return createManagementSample(id);
  if (id === "agent-conversation") return buildAgentConversationSample();
  if (id === "dropdown-select") return buildDropdownSelectSample();
  if (id === "bento-grid") return buildBentoSample();
  if (id === "masonry-layout") return buildMasonrySample();
  if (id === "async-boundary") return buildAsyncBoundarySample();
  if (id === "render-window") return buildRenderWindowSample();
  if (id === "loading-indicator") return buildLoadingSample();
  if (id === "ambient-chart") return buildAmbientChartSample();
  if (id === "ascii-background") return buildAsciiSample();
  const key = `sample-${++serial}`;
  let element,
    dispose = () => {},
    interact = () => {};
  if (id === "board-viewport") {
    const viewport = h('div', {className:'board-sample', 'aria-label':'Пример рабочей доски'});
    const scene = h('div', {className:'board-sample-scene'});
    for (const title of ['Исследовать запрос','Реализовать изменение','Проверить результат']) {
      scene.append(h('article',{className:'routing-sample-card'},h('strong',{},title),h('p',{},'Пример карточки · перетащите свободное поле')));
    }
    viewport.append(scene);
    const board = createBoardViewport({viewport,scene});
    element=viewport;dispose=board.dispose;interact=()=>board.zoom(board.state.scale===1?1.2:1/1.2);
  } else if (id === "button") {
    const button = createButton({ label: "Сохранить", variant: "primary" });
    element = h(
      "div",
      { className: "sample-actions" },
      button,
      createButton({ label: "Отмена" }),
    );
    interact = () => {
      button.disabled = !button.disabled;
    };
  } else if (id === "field") {
    element = createField({
      id: key,
      label: "Название",
      placeholder: "Новый компонент",
      hint: "Коротко и по делу",
      maxLength: 80,
    });
    element.classList.add("preview-field");
    dispose = element.dispose;
    interact = () => {
      element.querySelector("input").value = "Обновлено";
      element.sync();
    };
  } else if (id === "textarea") {
    element = createTextarea({id:key,label:"Комментарий",hint:"Поясните важные детали",placeholder:"Напишите несколько строк",rows:3,maxLength:1200});
    element.classList.add("preview-field");
    dispose = element.dispose;
    interact = () => { element.querySelector("textarea").value = "Первая строка\nВторая строка"; element.sync(); };
  } else if (id === "text-block") {
    const block = createTextBlock({document,label:"Результат",text:"Текст для чтения и копирования.\nНажмите Ctrl/Cmd+A для выделения блока, быстро повторите для всей страницы.",copyable:true});
    element=block.element; dispose=block.dispose; interact=()=>block.selectAll();
  } else if (id === "numeric-badge") {
    const scale = createNumericScale({values:[0,0,1,2,3,5,8,13,21,34]});
    const raw = createNumericBadge({value:13,label:"Использований",scale});
    const scored = createNumericBadge({value:13,label:"Частота",mode:"score",scale});
    element = h("div",{className:"sample-actions"},h("span",{},"Количество: ",raw.element),h("span",{},"Частота: ",scored.element));
    interact=()=>{raw.update({value:21});scored.update({value:21});};
    dispose=()=>{raw.dispose();scored.dispose();};
  } else if (id === "status") {
    const status = createStatus({ label: "Подключено", tone: "success" });
    element = h(
      "div",
      {},
      status,
      " ",
      createStatus({ label: "Ожидает проверки" }),
    );
    interact = () => {
      status.textContent =
        status.textContent === "Подключено" ? "Обновлено" : "Подключено";
    };
  } else if (id === "empty-state") {
    element = createEmptyState({
      title: "Пока нет элементов",
      description: "Добавьте компонент в библиотеку.",
    });
    interact = () => {
      element.querySelector("h2").textContent = "Ничего не найдено";
    };
  } else if (id === "notice") {
    element = createNotice({
      text: "Не удалось обновить данные. Повторите запрос.",
      tone: "danger",
    });
    interact = () => {
      element.textContent = "Повторный запрос отправлен";
    };
  } else if (id === "popup") {
    const dialog = createPopup({
      id: key,
      title: "Подробности",
      content: h(
        "p",
        {},
        "Контекст выбранного элемента. Escape закрывает окно.",
      ),
    });
    const button = createButton({
      label: "Открыть окно",
      onClick: () => dialog.showModal(),
    });
    element = h("div", {}, button, dialog);
    interact = () => {
      dialog.querySelector("h2").textContent = "Обновлённые подробности";
    };
    dispose = () => {
      if (dialog.open) dialog.close();
    };
  } else if (id === "sidebar") {
    const toggle = createButton({
      label: "Свернуть или развернуть меню",
      icon: "◧",
      iconOnly: true,
      variant: "quiet",
    });
    const nav = h("nav", {
      className: "ag-nav",
      "aria-label": "Пример навигации",
    });
    const first = createButton({ label: "Обзор", icon: "▦" }),
      second = createButton({ label: "Настройки", icon: "⚙" });
    first.setAttribute("aria-current", "page");
    first.title = "Обзор";
    second.title = "Настройки";
    first.setAttribute("aria-label", "Обзор");
    second.setAttribute("aria-label", "Настройки");
    nav.append(first, second);
    const panel = h(
      "aside",
      { className: "ag-sidebar", id: key },
      h("div", { className: "ag-sidebar__header" }, toggle),
      nav,
    );
    const controller = createSidebarController({ panel, toggle });
    const unbind = bindNavigation(nav);
    element = h(
      "div",
      { className: "preview-sidebar" },
      panel,
      h("span", { className: "preview-content" }, "Рабочая область"),
    );
    interact = () => {
      toggle.click();
    };
    dispose = () => {
      controller.dispose();
      unbind();
    };
  } else if (id === "agent-activity-chat") {
    const chat = createAgentActivityChat({
      maxEntries: 50,
      mode: "inline",
      status: "MCP · пример ленты",
      view: "conversation",
    });
    chat.setOpen(true);
    element = h(
      "div",
      { className: "agent-chat-sample" },
      chat.element,
      createButton({
        label: "Пример запроса и ответа",
        onClick: () =>
          chat.append({
            agent: "Агент-разработчик",
            task: "DS-12",
            request: "Найти обработчик запроса",
            response: "Найден метод handleRequest · 2 ссылки",
            status: "готово",
          }),
      }),
    );
    dispose = chat.dispose;
    interact = () =>
      chat.append({
        agent: "Критик",
        task: "DS-12",
        request: "Проверить изменения",
        response: "Проверка сохранена",
      });
  } else if (id === "resizable-panel") {
    const left = h(
        "aside",
        { className: "splitter-sample-panel" },
        "Навигация",
      ),
      right = h("aside", { className: "splitter-sample-panel" }, "Инспектор");
    element = h(
      "div",
      { className: "splitter-sample" },
      left,
      h("span", { className: "splitter-sample-content" }, "Контент"),
      right,
    );
    const first = bindResizablePanel({
        panel: left,
        edge: "right",
        minWidth: 64,
        maxWidth: 240,
        initialWidth: 80,
      }),
      second = bindResizablePanel({
        panel: right,
        edge: "left",
        minWidth: 64,
        maxWidth: 240,
        initialWidth: 80,
      });
    dispose = () => {
      first.dispose();
      second.dispose();
    };
    interact = () => first.setWidth(first.width === 80 ? 96 : 80);
  } else if (id === "window-toolbar") {
    const toolbar = createWindowToolbar({
      title: "Канбан",
      identity: "Tasks",
      onBack: () => {},
      onForward: () => {},
      onToggleLeft: () => {},
      actions: [
        { label: "Обновить", icon: "refresh", onClick: () => {} },
        { label: "Создать задачу", icon: "plus", onClick: () => {} },
      ],
    });
    element = toolbar.element;
    dispose = toolbar.dispose;
    interact = () =>
      toolbar.setContext({ title: "DS-12 · Ревью компонента", canBack: true });
  } else if (id === "card-connections") {
    const first = h("article", { className: "routing-sample-card" }, "Запрос"),
      second = h("article", { className: "routing-sample-card" }, "Обработчик");
    element = h("div", { className: "routing-sample" }, first, second);
    const controller = createCardConnections({
      container: element,
      cards: new Map([
        ["request", first],
        ["handler", second],
      ]),
      edges: [
        {
          from: "request",
          to: "handler",
          label: "Запрос → обработчик",
          kind: "directed",
        },
      ],
    });
    dispose = controller.dispose;
    interact = controller.update;
  } else if (id === "choice-chips") {
    const choice = createChoiceChips({
      label: "Представление",
      options: [
        { value: "document", label: "Документ" },
        { value: "messenger", label: "Переписка" },
        { value: "work-log", label: "Журнал работы" },
      ],
      value: "document",
    });
    element = choice.element;
    dispose = choice.dispose;
    interact = () => choice.setValue(choice.value === "document" ? "messenger" : "document");
  } else if (id === "segmented-choice") {
    const choice=createSegmentedChoice({label:"Плотность карточек",options:[{value:"comfortable",label:"Обычная"},{value:"compact",label:"Компактная"}],value:"comfortable"});
    element=choice.element;dispose=choice.dispose;interact=()=>choice.setValue(choice.value==="comfortable"?"compact":"comfortable");
  } else if (id === "breadcrumbs") {
    const crumb=createBreadcrumbs({items:[{label:"Пространства",onSelect:()=>{}},{label:"Дизайн-система",onSelect:()=>{}},{label:"Компоненты"}]});
    element=crumb.element;dispose=crumb.dispose;interact=()=>element.querySelector("button").click();
  } else if (id === "progress") {
    const work=createProgress({label:"Проверка компонентов",value:6,max:18,description:"Обработано 6 из 18 известных элементов"});
    element=work.element;dispose=work.dispose;let unknown=false;
    interact=()=>{unknown=!unknown;work.update({value:unknown?null:6,description:unknown?"Ожидаем ответ сервиса; объём работы неизвестен":"Обработано 6 из 18 известных элементов"});};
  } else if (id === "skeleton") {
    const sample=createSkeleton({variant:"list",rows:3});element=sample.element;dispose=sample.dispose;interact=()=>sample.setLoading(true);
  } else if (id === "motion") {
    const tile=h("p",{className:"ag-notice"},"Анимация по запросу");const motion=createMotion(tile);element=h("div",{},tile,createButton({label:"Повторить",onClick:()=>motion.play("slide-up")}));dispose=motion.dispose;interact=()=>{void motion.play("fade-in");};
  } else if (id === "drag-drop") {
    const board=createDragDrop({lanes:[{id:"todo",label:"План",items:[{id:"first",label:"Исследовать"},{id:"second",label:"Проверить"}]},{id:"done",label:"Готово",items:[]}]});element=board.element;dispose=board.dispose;interact=()=>board.move({itemId:"first",toLane:board.lanes[0].items.length?"done":"todo",index:0});
  } else if (id === "inline-help") {
    const help = createInlineHelp({label:"Хранить историю запросов",text:"История помогает разобрать, что запрашивал агент и какой ответ получил. Срок хранения задаётся в настройках; подсказка не меняет параметры."});
    element = help.element;
    dispose = help.dispose;
    interact = () => help.setOpen(!help.isOpen);
  } else if (id === "issue-summary") {
    const issue = {key:"DS-42",title:"Показать следующий шаг задачи",status:"На ревью",tone:"accent",role:"Разработчик",systems:["ag-tasks"],nextAction:"Критик проверяет результат",result:"Компонент готов; проверки и ограничения записаны",problems:"Длинные названия сохраняют перенос строк"};
    const card = createIssueSummary({issue,onOpen:()=>{}});
    element = h("div",{className:"issue-summary-sample"},h("p",{className:"preview-caption"},"Пример данных · не живая задача"),card.element);
    dispose = card.dispose;
    let attention = false;
    interact = () => { attention = !attention; card.update({...issue,tone:attention?"danger":"accent",status:attention?"Нужна доработка":"На ревью",nextAction:attention?"Уточнить причину ошибки":"Критик проверяет результат"}); };
  } else if (id === "section-stack") {
    const first = createStatus({label:"DoR подтверждён",tone:"success"}), second = createStatus({label:"DoD ожидает проверки"});
    element = createSectionStack({title:"Критерии готовности",description:"Связанные условия ближе друг к другу",items:[first,second]});
    interact = () => { second.textContent = second.textContent === "DoD ожидает проверки" ? "DoD подтверждён" : "DoD ожидает проверки"; };
  } else if (id === "state-panel") {
    const sample = createStatePanel({state:"error",title:"Каталог недоступен",description:"Проверьте подключение к локальному сервису.",actionLabel:"Повторить запрос",onAction:()=>{}});
    element = sample.element;
    dispose = sample.dispose;
    interact = () => element.querySelector("button").click();
  } else {
    if (strict) throw new RangeError("Нет встроенного сценария компонента: " + id);
    element = h(
      "p",
      { className: "muted" },
      "Реализация не встроена в этот выпуск. Метаданные доступны; загрузка стороннего кода не выполняется.",
    );
  }
  element.dataset.agComponent = id;
  return { element, dispose, interact };
}

/** Resolve automatic appearance once for both retained shells and newly mounted samples. */
export function currentPreviewTheme() {
  const selected = document.documentElement.dataset.theme;
  const dark = selected === "dark" || (selected === "auto" && globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches);
  return dark ? "dark" : "light";
}

/** Build an isolated palette scope and expose the sample cleanup to its owning view. */
export function preview(id, palette, profile, definition, { presentation = "interactive" } = {}) {
  const activeTheme = currentPreviewTheme();
  const sample = definition?.libraryId ? createLibraryPreview(definition,palette,activeTheme) : buildSample(id);
  const element = h(
    "div",
    { className: "preview", "data-palette": palette },
    sample.element,
  );
  const theme = activeTheme;
  if (definition?.libraryId) element.classList.add("preview--library");
  if (presentation === "catalog") {
    // Keep compact catalogue geometry while exposing the same working controls as the detail view.
    element.classList.add("preview--catalog");
  }
  const restore = profile ? applyColorProfile(element, profile, theme) : () => {};
  return { element, dispose: () => { sample.dispose(); restore(); } };
}

/** Replace complete token scopes after a palette or appearance change, without losing preview focus/state. */
export function updatePreviewProfiles(scopes, profiles, theme = "light") {
  const updatedFrames = new Set();
  for (const element of scopes) {
    const profile = profiles.find(item => item.id === element.dataset.palette);
    if (profile) applyColorProfile(element, profile, theme);
    for (const frame of element.querySelectorAll("iframe.library-preview")) {
      if (updatedFrames.has(frame)) continue;
      // The nearest scope owns local overrides even when a retained outer shell is updated first.
      const palette = frame.closest("[data-palette]")?.dataset.palette ?? element.dataset.palette;
      updateLibraryPreview(frame,palette,theme);
      updatedFrames.add(frame);
    }
  }
}

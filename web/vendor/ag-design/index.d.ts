import type { I18nContext } from "./i18n.js";
export const version: string;
export type Variant = "primary" | "secondary" | "quiet" | "danger";
export type Tone = "neutral" | "accent" | "success" | "danger";
export function createButton(options: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  label: string;
  variant?: Variant;
  icon?: string;
  iconOnly?: boolean;
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
  density?: ControlDensity;
  shape?: CornerShape;
  parentRadius?: number;
  inset?: number;
}): HTMLButtonElement;
export function createField(options: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  id: string;
  label: string;
  placeholder?: string;
  hint?: string;
  type?: string;
  value?: string;
  maxLength?: number;
  disabled?: boolean;
  density?: ControlDensity;
  readOnly?: boolean;
  required?: boolean;
  error?: string;
}): HTMLLabelElement & { sync(): void; dispose(): void };
export function createStatus(options: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  label: string;
  tone?: Tone;
}): HTMLSpanElement;
export function createEmptyState(options: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  title: string;
  description?: string;
  action?: HTMLElement;
}): HTMLElement;
export function createNotice(options: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  text: string;
  tone?: Tone;
}): HTMLParagraphElement;
export function bindNavigation(
  nav: HTMLElement,
  options?: { selector?: string },
): () => void;
export function createSidebarController(options: {
  panel: HTMLElement;
  toggle: HTMLElement;
  storageKey?: string;
  storage?: Storage;
  onChange?: (collapsed: boolean) => void;
}): { setCollapsed(value: boolean): void; dispose(): void };
export function createPopup(options: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  id: string;
  title: string;
  content?: HTMLElement;
}): HTMLDialogElement;

export type ColorTokens = Record<
  | "accent"
  | "onAccent"
  | "surface"
  | "surfaceAlt"
  | "text"
  | "muted"
  | "border"
  | "danger"
  | "success",
  string
>;
export interface ColorProfile {
  id: string;
  light: ColorTokens;
  dark: ColorTokens;
  highContrast?: { light: ColorTokens; dark: ColorTokens };
}
export function applyColorProfile(
  element: HTMLElement,
  profile: ColorProfile,
  theme?: "light" | "dark",
  contrast?: "standard" | "increased",
): () => void;
export function evaluateColorPair(value: {
  foreground: string;
  background: string;
  fontSize?: number;
  fontWeight?: number;
  role?: "body" | "label" | "large";
}): {
  wcag2: { ratio: number; minimum: number; aa: boolean; largeText: boolean };
  apca: {
    lc: number;
    target: number;
    meetsAdvisoryTarget: boolean;
    minimumReferenceFontPx: number;
    fontTable: (number | string)[];
    fontGuidance: string;
  };
  weightedScore: number;
  verdict: string;
  policy: typeof contrastPolicy;
  limitations: string[];
};
export const contrastPolicy: {
  apcaWeight: number;
  wcagWeight: number;
  apcaVersion: string;
  status: string;
};
export function createAgentActivityChat(options?: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  title?: string;
  maxEntries?: number;
  mode?: "floating" | "inline";
  view?: "activity" | "conversation";
  status?: string;
  onHistory?: (() => void) | null;
  onMarkersChange?: (enabled: boolean) => void;
}): {
  element: HTMLElement;
  append: (entry: {
    agent?: string;
    task?: string;
    request?: string;
    response?: string;
    status?: string;
  }) => void;
  setOpen: (open: boolean) => void;
  setStatus: (status: string) => void;
  setView: (view: "activity" | "conversation") => void;
  clear: () => void;
  readonly count: number;
  readonly markersEnabled: boolean;
  dispose: () => void;
};
export function bindResizablePanel(options: {
  panel: HTMLElement;
  edge?: "left" | "right";
  minWidth?: number;
  maxWidth?: number;
  initialWidth?: number;
  storageKey?: string;
  storage?: Storage;
  reservedWidth?: () => number;
  onResize?: (width: number) => void;
}): {
  handle: HTMLElement;
  setWidth: (width: number, options?: { remember?: boolean }) => void;
  readonly width: number;
  dispose: () => void;
};
export interface ToolbarAction {
  label: string;
  /** Fixed SVG keys: refresh, plus, back, forward, panel-left, panel-right; other strings render as text. */
  icon?: string;
  /** Defaults to true when an icon exists. Without an icon the visible label is preserved. */
  iconOnly?: boolean;
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
}
export interface ToolbarContext {
  title?: string;
  canBack?: boolean;
  canForward?: boolean;
  actions?: ToolbarAction[];
}
export function createWindowToolbar(options?: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  title?: string;
  identity?: string;
  onBack?: () => void;
  onForward?: () => void;
  onToggleLeft?: () => void;
  onToggleRight?: () => void;
  actions?: ToolbarAction[];
}): {
  element: HTMLElement;
  setContext: (context: ToolbarContext) => void;
  dispose: () => void;
};
export interface CardEdge {
  from: string;
  to: string;
  label?: string;
  kind?: string;
}
export interface Point {
  x: number;
  y: number;
}
export function connectionControls(
  from: Point,
  to: Point,
  options?: { axis?: "horizontal" | "vertical" | "direct"; offset?: Point },
): Point[];
export function connectionCurve(
  from: Point,
  to: Point,
  options?: { axis?: "horizontal" | "vertical" | "direct"; offset?: Point },
): string;
export function createCardConnections(options: {
  container: HTMLElement;
  cards: Map<string, HTMLElement>;
  edges: CardEdge[];
  onSelect?: (edge: CardEdge) => void;
}): {
  element: SVGElement;
  unknownCount: number;
  update: () => void;
  dispose: () => void;
};

export function bindWindowShell(options: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  identity?: string;
  header: string | HTMLElement;
  titleSource?: string;
  detailTitleSource?: string;
  detailSelector?: string;
  navigation?: string;
  actions?: {
    selector: string;
    id: "primary" | "refresh" | "settings" | "theme" | "search";
  }[];
  panels?: {
    selector: string;
    edge: "left" | "right";
    variable?: string;
    layout?: string;
    minWidth?: number;
    maxWidth?: number;
    storage?: Storage;
    reservedWidth?: () => number;
    onResize?: (width: number) => void;
  }[];
  existingBack?: string;
  existingForward?: string;
  notifyNative?: () => void;
}): { refresh: () => void; dispose: () => void };

export interface IssueSummary {
  key?: string;
  title?: string;
  status?: string;
  tone?: Tone;
  role?: string;
  systems?: string[];
  nextAction?: string;
  result?: string;
  problems?: string;
}
export function createIssueSummary(options?: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  issue?: IssueSummary;
  onOpen?: (issue: IssueSummary) => void;
}): {
  element: HTMLElement;
  update: (issue: IssueSummary) => void;
  dispose: () => void;
};
export function createSectionStack(options: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  title: string;
  description?: string;
  items?: HTMLElement[];
  density?: "compact" | "comfortable";
}): HTMLElement;
export function createStatePanel(options: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  state?: "empty" | "loading" | "error";
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}): { element: HTMLElement; dispose: () => void };

export function createInlineHelp(options: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  icon?: "info" | "question";
  placement?: "auto" | "right" | "bottom";
  hoverDelayMs?: number;
  focusDelayMs?: number;
  label: string;
  text: string;
}): {
  element: HTMLElement;
  trigger: HTMLButtonElement;
  panel: HTMLElement;
  setOpen: (open: boolean, options?: { restoreFocus?: boolean }) => void;
  setDelays: (delays?: import("./tooltip.js").HintDelays) => void;
  readonly isOpen: boolean;
  dispose: () => void;
};

export function createSegmentedChoice(options: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  label: string;
  options: { value: string; label: string; disabled?: boolean }[];
  value: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}): {
  element: HTMLFieldSetElement;
  setValue: (value: string) => void;
  readonly value: string;
  dispose: () => void;
};
/** A single scrollable row of 2–6 radio choices. Labels/translations belong to the host. */
export function createChoiceChips(
  options: Parameters<typeof createSegmentedChoice>[0],
): ReturnType<typeof createSegmentedChoice>;
export function createBreadcrumbs(options: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  label?: string;
  items: { label: string; href?: string; onSelect?: () => void }[];
}): { element: HTMLElement; dispose: () => void };
export function createProgress(options: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  label: string;
  value?: number | null;
  max?: number;
  description?: string;
}): {
  element: HTMLElement;
  progress: HTMLProgressElement;
  update: (value?: {
    value?: number | null;
    max?: number;
    description?: string;
  }) => void;
  dispose: () => void;
};

export interface BoardState {
  x: number;
  y: number;
  scale: number;
  color: string;
  pattern: "none" | "dots" | "grid";
}
export function createBoardViewport(options: {
  viewport: HTMLElement;
  scene: HTMLElement;
  storageKey?: string;
  storage?: Storage;
  initialState?: Partial<BoardState>;
  onChange?: (state: BoardState) => void;
}): {
  readonly state: BoardState;
  setState(state: Partial<BoardState>): void;
  zoom(factor: number, point?: { x: number; y: number }): void;
  fit(): void;
  reset(): void;
  dispose(): void;
};

export type SkeletonShape =
  | "line"
  | "heading"
  | "circle"
  | "square"
  | "divider";
export function createSkeletonShape(options?: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  shape?: SkeletonShape;
  width?: number | string;
  size?: number;
}): HTMLElement;
export function createSkeleton(options?: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  variant?: "text" | "card" | "list" | "table" | "profile";
  rows?: number;
  columns?: number;
  animated?: boolean;
  label?: string;
}): { element: HTMLElement; setLoading(value: boolean): void; dispose(): void };
export type MotionPreset =
  | "fade-in"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "scale-in"
  | "pulse"
  | "shake"
  | "bounce";
export const motionPresets: readonly MotionPreset[];
export function createMotion(
  element: HTMLElement,
  options?: { duration?: number; distance?: number; iterations?: number },
): {
  play(
    preset?: MotionPreset,
  ): Promise<
    "finished" | "cancelled" | "reduced-motion" | "unsupported" | "disposed"
  >;
  cancel(): void;
  dispose(): void;
};
export interface DragItem {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
}
export interface DragLane {
  id: string;
  label: string;
  copyOnly?: boolean;
  items: DragItem[];
}
export interface DragAction {
  itemId: string;
  fromLane: string;
  toLane: string;
  index: number;
  mode: "move" | "copy" | "swap";
}
export function createDragDrop(options: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  lanes: DragLane[];
  mode?: DragAction["mode"];
  onChange?: (lanes: DragLane[], action: DragAction) => void;
  canDrop?: (action: DragAction, item: DragItem) => boolean;
}): {
  element: HTMLElement;
  readonly lanes: DragLane[];
  move(action: {
    itemId: string;
    toLane: string;
    index: number;
    mode?: DragAction["mode"];
  }): boolean;
  update(lanes: DragLane[]): boolean;
  cancel(): void;
  dispose(): void;
};

export type AsciiPattern = "flow" | "rain" | "noise";
export type AsciiAnimation = "none" | "wave" | "scan" | "reveal";
export type AsciiState =
  | "playing"
  | "paused"
  | "still"
  | "reduced-motion"
  | "hidden"
  | "offscreen"
  | "detached"
  | "error"
  | "playback-blocked"
  | "disposed";
export interface AsciiOptions {
  pattern?: AsciiPattern;
  animation?: AsciiAnimation;
  textEffect?: "none" | "shimmer" | "wave";
  textWeight?: "auto" | "thin" | "regular" | "bold";
  /** Empty cells around each letter stroke, from2 through6. */
  textGap?: number;
  /** Irregular background clearance boundary, from0 to1; default0.3. */
  textRoughness?: number;
  /** Independent sparse fringe on letter edges,0–1; disabled by default. */
  textEdgeRoughness?: number;
  charset?: "classic" | "binary" | "detailed";
  seed?: number;
  fontSize?: number;
  density?: number;
  speed?: number;
  fps?: number;
  maxCells?: number;
}
export const asciiPatterns: readonly AsciiPattern[];
export const asciiAnimations: readonly AsciiAnimation[];
/** Decorative only. Host owns any meaningful text equivalent and the visible pause action. */
export function createAsciiBackground(
  options?: AsciiOptions & {
    document?: Document;
    i18n?: I18nContext;
    locale?: string;
    autoplay?: boolean;
    onState?: (state: AsciiState) => void;
  },
): {
  element: HTMLDivElement;
  readonly state: AsciiState;
  readonly playbackRequested: boolean;
  readonly text: string;
  readonly options: Required<AsciiOptions>;
  play(): void;
  pause(): void;
  update(options: AsciiOptions): void;
  setPattern(pattern: AsciiPattern): void;
  setSource(
    source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  ): void;
  setFile(file: File): Promise<boolean>;
  setText(text: string): void;
  appendText(chunk: string): void;
  clearText(): void;
  dispose(): void;
};

export interface AmbientChartOptions {
  mode?: "decorative" | "data";
  kind?: "bars" | "line" | "area";
  title?: string;
  caption?: string;
  /** Decorative code is shown literally, never executed; omitted in data mode. */
  code?: string;
  /** Hide/show the mini-window. Empty data context omits it; decorative code remains a fallback only in decorative mode. */
  showPanel?: boolean;
  /** Literal mini-window heading, at most100 characters. */
  panelTitle?: string;
  /** Accessible context, at most1200 characters; shown immediately in both modes, never executed. */
  panelText?: string;
  /** Decorative label only. Data mode never presents it as a real measurement. */
  metric?: string;
  unit?: string;
  labels?: string[];
  /** Explicit epoch milliseconds per category; false disables strict ISO date autodetection. Does not change categorical spacing. */
  axisDates?: number[] | false;
  /**1–96 finite values within ±1e12; null preserves a missing observation. */
  values?: (number | null)[];
  animated?: boolean;
  onSelect?: (point: {
    index: number;
    label: string;
    value: number | null;
  }) => void;
}
/** Offline atmospheric charts: decorative labels or honest linear data with exact accessible table. */
export function createAmbientChart(
  options?: AmbientChartOptions & { document?: Document },
): {
  element: HTMLElement;
  readonly state: string;
  readonly options: Required<Omit<AmbientChartOptions, "onSelect">> &
    Pick<AmbientChartOptions, "onSelect">;
  update(options: AmbientChartOptions): boolean;
  select(index: number): boolean;
  play(): void;
  pause(): void;
  replay(): void;
  dispose(): void;
};

export type LoadingVariant = "spinner" | "dots" | "progress" | "skeleton";
export const loadingVariants: readonly LoadingVariant[];
/** Indeterminate waiting; host owns loading completion and a visible pause control. */
export function createLoadingIndicator(options?: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  variant?: LoadingVariant;
  label?: string;
  animated?: boolean;
}): {
  element: HTMLDivElement;
  readonly state: string;
  pause(): void;
  play(): void;
  setLoading(value: boolean): void;
  dispose(): void;
};

/** Owned synchronous subtree. snapshot must return bounded state without DOM references; render restores it. */
export interface RenderWindowContent<State = unknown> {
  element: HTMLElement;
  dispose(): void;
  snapshot?(): State;
}
export interface RenderWindowOptions<State = unknown> {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  /** Return a fresh detached same-document subtree; existing/retired DOM never transfers ownership. */
  render(state: State | undefined): RenderWindowContent<State>;
  initialState?: State;
  root?: HTMLElement | null;
  rootMargin?: string;
  estimatedHeight?: number;
  unmountDelay?: number;
  label?: string;
  /** Diagnostic callbacks may return thenables; rejected diagnostics never change lifecycle. */
  onError?(error: unknown): void;
}
/** Lazy mount/eviction with explicit state, stable placeholder and focus/pointer retention. No observer uses eager fallback. */
export function createRenderWindow<State = unknown>(
  options: RenderWindowOptions<State>,
): {
  element: HTMLDivElement;
  readonly state: "idle" | "mounted" | "suspended" | "error" | "disposed";
  readonly mounted: boolean;
  setPinned(value: boolean): void;
  refresh(): void;
  dispose(): void;
};

export type ControlDensity = "compact" | "comfortable" | "touch";
export type CornerShape = "fixed" | "capsule" | "concentric";
/** Uniform-inset circular web geometry, not Apple's general native corner algorithm. */
export function resolveCornerRadius(options?: {
  shape?: CornerShape;
  radius?: number;
  parentRadius?: number;
  inset?: number;
  fallbackRadius?: number;
  width?: number;
  height?: number;
}): number;
/** Apply AG density and shape, returning restoration of prior inline styles. */
export function applyControlGeometry(
  element: HTMLElement,
  options?: {
    density?: ControlDensity;
    shape?: CornerShape;
    radius?: number;
    parentRadius?: number;
    inset?: number;
    fallbackRadius?: number;
    width?: number;
    height?: number;
  },
): () => void;

export type AgentConnectionState =
  | "connected"
  | "disconnected"
  | "loading"
  | "error"
  | "unknown";
export type AgentRuntimeState = "idle" | "running" | "waiting" | "unknown";
export type AgentBlockStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "requested"
  | "cancelled"
  | "rejected"
  | "unknown";
/** Bounded display-only block; unknown kinds render literal content without importing a renderer or loading media. */
export interface AgentConversationBlock {
  id: string;
  revision: number;
  kind: string;
  status?: AgentBlockStatus;
  title?: string;
  text?: string;
  input?: string;
  output?: string;
  actionId?: string;
}
export interface AgentConversationMessage {
  id: string;
  revision: number;
  role: "user" | "agent" | "system";
  author?: string;
  label?: string;
  time?: string;
  blocks: AgentConversationBlock[];
}
export interface AgentConversationSnapshot {
  version: 1;
  sessionId: string;
  title?: string;
  connection?: AgentConnectionState;
  runtime?: AgentRuntimeState;
  sequence?: number;
  omitted?: number;
  messages: AgentConversationMessage[];
}
/** Sequence is contiguous within one snapshot window. Event IDs are UI receipts, not durable command idempotency keys. */
export interface AgentConversationUpdate {
  version: 1;
  sessionId: string;
  eventId: string;
  sequence: number;
  connection?: AgentConnectionState;
  runtime?: AgentRuntimeState;
  operations: Array<
    | { type: "upsert"; message: AgentConversationMessage }
    | {
        type: "delta";
        messageId: string;
        blockId: string;
        baseRevision: number;
        revision: number;
        text: string;
      }
  >;
}
export interface AgentConversationHistoryPage {
  sessionId: string;
  messages: AgentConversationMessage[];
  hasMore?: boolean;
}
export interface AgentConversationUpdateResult {
  applied: boolean;
  reason?:
    | "duplicate"
    | "gap"
    | "resync_required"
    | "other_session"
    | "window_full";
  omitted?: number;
}
export function createAgentConversationModel(options?: {
  maxMessages?: number;
  maxText?: number;
}): {
  applySnapshot(value: AgentConversationSnapshot): AgentConversationSnapshot;
  applyUpdates(
    value: AgentConversationUpdate,
    options?: { retainIds?: string[] },
  ): AgentConversationUpdateResult;
  prepend(value: AgentConversationHistoryPage): boolean;
  snapshot(): AgentConversationSnapshot | null;
  clear(): void;
};
export interface AgentConversationSendResolution {
  sessionId: string;
  requestId: string;
  status: "accepted" | "rejected" | "unknown";
}
/** Host persists/correlates outgoing intents before dispatch. This controller performs no transport or process operations. */
export function createAgentConversation(options?: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  title?: string;
  /** Presentation changes geometry only; transport, receipts and source blocks are shared. */
  presentation?: "document" | "messenger" | "work-log";
  maxMessages?: number;
  maxText?: number;
  capabilities?: string[];
  onHistory?:
    | ((request: {
        sessionId: string;
        beforeMessageId?: string;
        signal: AbortSignal;
      }) => Promise<AgentConversationHistoryPage>)
    | null;
  onAction?:
    | ((intent: {
        sessionId: string;
        messageId: string;
        blockId: string;
        blockRevision: number;
        actionId: string;
        decision: "inspect" | "approve" | "deny" | "reply";
      }) => void)
    | null;
  onSend?:
    | ((intent: {
        sessionId: string;
        requestId: string;
        text: string;
      }) => Promise<{ status: "accepted" | "rejected" | "unknown" }>)
    | null;
  /** Compact is an opt-in one-row input; CSS content sizing has a manual resize fallback. */
  composerAppearance?: "standard" | "compact";
  composerLabel?: string;
  /** Up to four host-owned tools; only IDs in capabilities are rendered. */
  composerActions?: { id: string; label: string }[];
  onComposerAction?:
    | ((intent: { sessionId: string; actionId: string }) => unknown)
    | null;
}): {
  element: HTMLElement;
  applySnapshot(value: AgentConversationSnapshot): boolean;
  applyUpdates(
    value: AgentConversationUpdate,
  ): AgentConversationUpdateResult | false;
  snapshot(): AgentConversationSnapshot | null;
  clear(): void;
  follow(): void;
  loadHistory(): Promise<void>;
  resolveSend(value: AgentConversationSendResolution): boolean;
  /** Redacted structural facts, never draft text, target IDs or qualification. */
  composerState(): {
    available: boolean;
    appearance: "standard" | "compact";
    sendBlocked: boolean;
    toolCount: number;
    pendingTools: number;
  };
  /** In-place switch preserves owned DOM, drafts, pending commands and read position. */
  setPresentation(value: "document" | "messenger" | "work-log"): boolean;
  presentationState(): {
    presentation: "document" | "messenger" | "work-log";
    available: boolean;
    messageCount: number;
    blockCount: number;
    technicalCount: number;
  };
  dispose(): void;
};

/** Offline score over ten discrete percentile anchors, an explicit linear range, or unknown. */
export interface NumericScale {
  readonly method: "percentile" | "linear" | "none";
  readonly min: number | null;
  readonly max: number | null;
  readonly maximum: number;
  readonly boundaries: readonly number[];
  evaluate(
    value: number,
  ): Readonly<{ value: number; score: number | null; ratio: number | null }>;
}
export function createNumericScale(options?: {
  values?: number[];
  boundaries?: number[];
  min?: number;
  max?: number;
  maximum?: number;
}): NumericScale;
export interface NumericBadgeOptions {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  value: number;
  mode?: "value" | "score";
  scale?: NumericScale;
  label?: string;
  decimals?: number;
}
export function createNumericBadge(options: NumericBadgeOptions): {
  element: HTMLSpanElement;
  update(patch?: Partial<Omit<NumericBadgeOptions, "document">>): boolean;
  dispose(): void;
};

/** A native option; groups retain the supplied order, including repeated group boundaries. */
export interface AGSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}
export interface AGSelectController {
  element: HTMLElement;
  select: HTMLSelectElement;
  readonly value: string;
  setValue(value: string): void;
  setDisabled(disabled: boolean): void;
  setError(error: string): void;
  dispose(): void;
}
/** Native select, up to500 options. Setters/form reset are silent; onChange reports enabled user choices. */
export function createSelect(options: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  label: string;
  options: AGSelectOption[];
  value?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  density?: "compact" | "comfortable" | "touch";
  onChange?: (value: string) => void;
}): AGSelectController;

export type AGTabLifecycle = "preserve" | "destroy" | "offscreen";
export interface AGTabDefinition {
  id: string;
  label: string;
  disabled?: boolean;
  lifecycle?: AGTabLifecycle;
  /** Synchronous, lazy mount returning one unparented same-document element. Mount a loading shell for async work. */
  mount: () => HTMLElement | { element: HTMLElement; dispose?: () => void };
}
export interface AGTabsController {
  element: HTMLElement;
  tablist: HTMLElement;
  readonly value: string;
  setValue(id: string, options?: { focus?: boolean; emit?: boolean }): void;
  setDisabled(id: string, disabled: boolean): void;
  getPanel(id: string): HTMLElement | null;
  /** Releases every mounted panel; aggregates host disposer failures after all cleanup. */
  dispose(): void;
}
/** Up to40 ARIA tabs. Preserve retains drafts; destroy clears sensitive panels; offscreen retains canvas layout. */
export function createTabs(options: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  label: string;
  tabs: AGTabDefinition[];
  value?: string;
  orientation?: "horizontal" | "vertical";
  activation?: "manual" | "automatic";
  onChange?: (id: string) => void;
}): AGTabsController;

/** Checked state and shortcut execution belong to the host; shortcut is a literal display hint only. */
export interface AGMenuItem {
  id: string;
  label: string;
  disabled?: boolean;
  checked?: boolean;
  shortcut?: string;
  group?: string;
  onSelect?: (id: string) => void;
  children?: AGMenuItem[];
}
export interface AGMenuController {
  element: HTMLElement;
  trigger: HTMLButtonElement;
  readonly isOpen: boolean;
  open(options?: { focus?: "first" | "last" }): void;
  close(options?: { restoreFocus?: boolean }): void;
  setItems(items: AGMenuItem[]): void;
  dispose(): void;
}
/** At most200 commands, root plus two submenu levels. Disabled commands remain focusable but cannot run. */
export function createMenu(options: {
  document?: Document;
  i18n?: I18nContext;
  locale?: string;
  label: string;
  items: AGMenuItem[];
  density?: "compact" | "comfortable" | "touch";
  onAction?: (id: string) => void;
}): AGMenuController;

/** Native data presentation, not an editable ARIA grid. Sort/page callbacks request host-owned changes. */
export type DataTableScalar = string | number | boolean | null;
export interface DataTableRow {
  id: string;
  cells: Record<string, DataTableScalar>;
  label?: string;
  disabled?: boolean;
}
export interface DataTableSort {
  columnId: string;
  direction: "ascending" | "descending";
}
export interface DataTableColumn {
  id: string;
  label: string;
  sortable?: boolean;
  align?: "start" | "center" | "end";
  render?: (row: DataTableRow) => DataTableScalar | HTMLElement;
}
export interface DataTablePage {
  index: number;
  count: number;
}
export interface DataTableController {
  element: HTMLElement;
  table: HTMLTableElement;
  setRows(rows: DataTableRow[]): void;
  setSort(sort: DataTableSort | null): void;
  setSelection(ids: string[]): void;
  setStatus(
    status: "ready" | "loading" | "empty" | "error",
    message?: string,
  ): void;
  setPage(page: DataTablePage | null): void;
  readonly selectedIds: string[];
  readonly sort: DataTableSort | null;
  dispose(): void;
}
export function createDataTable(options: {
  document?: Document;
  caption: string;
  columns: DataTableColumn[];
  rows?: DataTableRow[];
  sort?: DataTableSort | null;
  selectable?: boolean;
  selectedIds?: string[];
  status?: "ready" | "loading" | "empty" | "error";
  message?: string;
  page?: DataTablePage | null;
  onSort?: (sort: DataTableSort | null) => void;
  onSelectionChange?: (ids: string[]) => void;
  onPageChange?: (index: number) => void;
}): DataTableController;

/** A single-select hierarchy. Arrows move focus; Enter/Space select. Row actions have independent accessible names. */
export interface TreeAction {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  pressed?: boolean;
  onAction?: (action: { nodeId: string; actionId: string }) => void;
}
export interface TreeNode {
  id: string;
  parentId?: string | null;
  label: string;
  icon?: string;
  disabled?: boolean;
  actions?: TreeAction[];
}
export interface TreeController {
  element: HTMLUListElement;
  setNodes(nodes: TreeNode[]): void;
  setSelection(id: string | null): void;
  setExpanded(ids: string[]): void;
  readonly selectedId: string | null;
  readonly expandedIds: string[];
  dispose(): void;
}
export function createTree(options: {
  document?: Document;
  label: string;
  density?: "comfortable" | "compact";
  nodes?: TreeNode[];
  selectedId?: string | null;
  expandedIds?: string[];
  onSelect?: (id: string | null) => void;
  onExpand?: (ids: string[]) => void;
}): TreeController;

/** Each mount returns fresh local DOM. A sensitive category defaults to destroy and resets field values on leave. */
export interface SettingsRow {
  id: string;
  label: string;
  description?: string;
  mount: () => HTMLElement | { element: HTMLElement; dispose?: () => void };
}
export interface SettingsGroup {
  id: string;
  title?: string;
  description?: string;
  rows: SettingsRow[];
}
export interface SettingsCategory {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  sensitive?: boolean;
  lifecycle?: "preserve" | "destroy";
  groups?: SettingsGroup[];
}
export interface SettingsPanelController {
  element: HTMLElement;
  readonly value: string;
  setValue(id: string, options?: { focus?: boolean; emit?: boolean }): void;
  dispose(): void;
}
export function createSettingsPanel(options: {
  document?: Document;
  title: string;
  description?: string;
  categories: SettingsCategory[];
  value?: string;
  footer?: HTMLElement | null;
  activation?: "automatic" | "manual";
  onChange?: (id: string) => void;
}): SettingsPanelController;

export {
  createMasonryLayout,
  bindMasonryLayout,
  MasonryLayoutOptions,
  MasonryLayoutController,
} from "./masonry-layout.js";

export { createDropdownSelect } from "./dropdown-select.js";
export {
  createDataGrid,
  createGridArrayDataSource,
  readDataGridTable,
} from "./data-grid.js";
export type * from "./data-grid.js";
export type {
  DropdownSelectOption,
  DropdownSelectOptions,
  DropdownSelectController,
} from "./dropdown-select.js";

export { createCodeViewer } from "./code-viewer.js";
export type * from "./code-viewer.js";
export { createMarkdownViewer } from "./markdown-viewer.js";
export type * from "./markdown-viewer.js";
export { createMarkdownEditor } from "./markdown-editor.js";
export type * from "./markdown-editor.js";

export * from "./history.js";

export * from "./i18n.js";

export { createLanguageSwitcher, languageName } from "./language-switcher.js";

/** Carrier-local declared point, using one unit consistently. */
export interface GoldenCanonAnchor {
  id: string;
  x: number;
  y: number;
}
export interface GoldenCanonOptions {
  width?: number;
  height?: number;
  anchors?: GoldenCanonAnchor[];
  tolerance?: number;
  showDiagonals?: boolean;
  provisional?: boolean;
}
export interface GoldenCanonResult extends GoldenCanonAnchor {
  target: string;
  targetX: number;
  targetY: number;
  dx: number;
  dy: number;
  distance: number;
  normalizedDistance: number;
  status: "hit" | "miss";
}
export interface GoldenCanonReport {
  profile: string;
  width: number;
  height: number;
  tolerance: number;
  threshold: number;
  results: GoldenCanonResult[];
  coverage: { measured: number; hit: number };
  status: "measured" | "unknown";
  trust: "geometric-only";
}
export const GOLDEN_CANON_PROFILE: string;
export function goldenCanonGeometry(
  width: number,
  height: number,
): {
  profile: string;
  width: number;
  height: number;
  points: GoldenCanonAnchor[];
  vertical: number[];
  horizontal: number[];
};
export function goldenCanonRectAnchor(
  rect: { x: number; y: number; width: number; height: number },
  anchor?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center",
): { x: number; y: number };
export function checkGoldenCanon(
  options: GoldenCanonOptions & { width: number; height: number },
): GoldenCanonReport;
export function createGoldenCanonGrid(
  options?: GoldenCanonOptions & { document?: Document },
): {
  element: SVGSVGElement;
  update(patch?: GoldenCanonOptions): void;
  readonly report: GoldenCanonReport;
  dispose(): void;
};

export * from "./layout-grid.js";

export { createTextarea, type TextareaOptions, type TextareaElement } from "./textarea.js";

export { createAsyncBoundary } from "./async-boundary.js";
export type {
  AsyncBoundary,
  AsyncBoundaryOptions,
  AsyncBoundaryState,
  AsyncLoad,
  AsyncOwnedComponent,
  AsyncRunResult,
  AsyncErrorKind,
} from "./async-boundary.js";

export { generatePalette, PALETTE_HARMONIES } from "./palette-model.js";
export type {
  PaletteHarmony,
  PaletteOptions,
  PaletteResult,
  PalettePairCheck,
  PaletteSwatch,
  PaletteScheme,
} from "./palette-model.js";

export { createPaletteBuilder } from "./palette-builder.js";
export type {
  PaletteBuilder,
  PaletteBuilderOptions,
} from "./palette-builder.js";

export { createCatalogCard } from "./catalog-card.js";
export type {
  CatalogCard,
  CatalogCardOptions,
  CatalogCardData,
  CatalogCardState,
  CatalogCardAction,
} from "./catalog-card.js";

export { createCatalogSearchControls } from "./catalog-search-controls.js";
export type {
  CatalogSearchControls,
  CatalogSearchOptions,
  CatalogSearchState,
  CatalogSearchValue,
  CatalogSearchRequest,
  CatalogSearchFacet,
} from "./catalog-search-controls.js";

export * from "./app-runtime.js";

export * from "./grid-icon-draft.js";

export { createPopover } from "./popover.js";
export type { PopoverOptions, PopoverController } from "./popover.js";
export { createSortingControl } from "./sorting-control.js";
export type {
  SortingValue,
  SortingCriterion,
  SortingControlOptions,
  SortingControlController,
} from "./sorting-control.js";

export * from "./conversation-card.js";

export * from "./widget-list.js";

export { createTextBlock, type TextBlockOptions, type TextBlockController } from "./text-block.js";

export { bindTooltip, type HintDelays, type TooltipOptions, type TooltipController } from "./tooltip.js";

/** Compact ordered visible time ticks. UTC by default; values are epoch milliseconds. */
export interface TimeAxisTick {
  value: number; label: string; context: string; lines: string[]; fullLabel: string;
}
export interface TimeAxisFormat {
  locale?: string; timeZone?: string;
  unit?: "auto" | "year" | "month" | "day" | "minute" | "second" | "millisecond";
}
export function formatTimeAxisTicks(values: readonly number[], options?: TimeAxisFormat): TimeAxisTick[];
/** Returned positions retain the tick with an explicit text anchor; start/end include context width. Skipping labels leaves raw data untouched. */
export function layoutAxisTicks(options: TimeAxisFormat & {
  values?: readonly number[] | null; labels?: readonly string[]; positions: readonly number[];
  left: number; right: number; gap?: number; singleLine?: boolean; measure?: (text: string) => number;
}): Array<Partial<TimeAxisTick> & { index: number; x: number; contextX: number; position: number; anchor: "start" | "middle" | "end"; start: number; end: number; label: string; context: string; lines: string[]; fullLabel: string }>;

export { createBentoGrid } from "./bento-grid.js";
export type { BentoItem, BentoGridOptions, BentoGridController } from "./bento-grid.js";
export { createLayoutDropPreview } from "./layout-drop-preview.js";

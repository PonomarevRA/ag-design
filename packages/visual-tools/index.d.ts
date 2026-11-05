export type ChartType =
  | "composed"
  | "line"
  | "area"
  | "bar"
  | "pie"
  | "donut"
  | "scatter"
  | "bubble"
  | "radar";
export interface ChartPoint {
  x: number;
  y: number;
  size?: number;
}
export interface ChartSeries {
  /** Required for composed charts; all series share one numeric scale. */
  type?: "line" | "area" | "bar";
  id: string;
  label: string;
  values: (number | ChartPoint | null)[];
}
export interface ChartOptions {
  document?: Document;
  label: string;
  type?: ChartType;
  renderer?: "svg" | "particles" | "ascii";
  asciiCharset?: "classic" | "binary" | "braille";
  asciiFontSize?: number; // 6..14 logical pixels, default10
  asciiMaxCells?: number; // integer128..4000, default2400
  asciiSpeed?: number; //0..2, default.6; zero disables idle shimmer
  asciiGlow?: number; //0..1, default.25
  arrangement?: "grouped" | "stacked" | "horizontal";
  labels: string[];
  /** Explicit epoch milliseconds per category; false disables strict ISO date autodetection. Does not change categorical spacing. */
  axisDates?: number[] | false;
  series: ChartSeries[];
  min?: number;
  max?: number;
  animated?: boolean;
  /** Dust amount .25..3, bounded by particleCount. Default 1 (8000 targets). */
  particleDensity?: number;
  /** Hard ceiling 100..16000. Default 12000. */
  particleCount?: number;
  /** Logical radius .3..2. Default .7. */
  particleSize?: number;
  particleBloom?: number; // 0..1, default .65
  particleJitter?: number; // 0..3 logical pixels, default .75; 0 stops after settling
  /** Cache15incremental strips by default (two small atlases). Optional4–20adaptive phases. */
  particleCache?: boolean;
  particleFrames?: number;
  /** Raw cache ceiling in bytes, integer256KiB..4MiB; default1MiB. Excludes main canvas/GPU copies. */
  particleCacheBudget?: number;
  /** Compare15incrementally refreshed strips (default) with adaptive frames. */
  particleCacheMode?: "frames" | "strips";
  paused?: boolean;
  showTooltip?: boolean;
  onSelect?: (selection: { index: number; label: string }) => void;
}
export interface Controller<T> {
  element: HTMLElement;
  update(next: Partial<T>): boolean;
  dispose(): void;
}
export function createChart(options: ChartOptions): Controller<ChartOptions> & {
  select(
    index: number,
    options?: { animate?: boolean; notify?: boolean },
  ): boolean;
  replay(): boolean;
};
export const chartTypes: readonly ChartType[];
export interface ContentRailItem {
  id: string;
  label: string;
  target: HTMLElement;
  /** Bounded literal card text; no HTML, URLs or media loading. */
  preview?: string;
  context?: string;
  bookmarked?: boolean;
}
export interface ContentRailOptions {
  document?: Document;
  items: ContentRailItem[];
  scrollRoot?: HTMLElement | null;
  label?: string;
  compact?: boolean;
  /** Disable automatic content tracking when a host composes its own global tracker. */
  trackScroll?: boolean;
  onSelect?: (item: { id: string; label: string }) => void;
  /** Passive current-location changes, including the initial position; never an activation intent. */
  onCurrentChange?: (item: { id: string; label: string; index: number; total: number }) => void;
  onBookmarkChange?: (item: { id: string; bookmarked: boolean }) => void;
}
export interface ContentRailController {
  element: HTMLElement;
  readonly activeId: string | null;
  /** Update only the current marker; null clears a range whose current item is elsewhere. */
  setCurrent(index: number | null, options?: {reveal?: boolean}): boolean;
  select(index: number, options?: { focusTarget?: boolean }): void;
  showPreview(index: number): boolean;
  hidePreview(): void;
  setBookmarked(id: string, value: boolean): boolean;
  dispose(): void;
}
export function createContentRail(
  options: ContentRailOptions,
): ContentRailController;
export function createConversationRail(
  options: Omit<ContentRailOptions, "compact">,
): ContentRailController;
export interface DurationOptions {
  style?: "short" | "long" | "clock" | "compact";
  maxUnits?: number;
  locale?: string;
}
export function formatDuration(
  milliseconds: number | bigint,
  options?: DurationOptions,
): string;
export type Instant = Date | number | string;
export interface DateTimeOptions {
  locale?: string;
  timeZone?: string;
  dateStyle?: "full" | "long" | "medium" | "short";
  timeStyle?: "full" | "long" | "medium" | "short";
}
export function formatDateTime(
  value: Instant,
  options?: DateTimeOptions,
): string;
export interface TimeOptions extends DurationOptions, DateTimeOptions {
  document?: Document;
  label?: string;
  kind?: "duration" | "datetime";
  value: number | bigint | Date | string;
}
export function createTimeDisplay(
  options: TimeOptions,
): Controller<TimeOptions>;
export interface PlannerResource {
  id: string;
  label: string;
}
export interface PlannerEvent {
  id: string;
  label: string;
  start: Instant;
  end: Instant;
  resourceId?: string;
  allDay?: boolean;
}
export interface PlannerOptions {
  document?: Document;
  date: string;
  today?: string;
  view?: "month" | "week" | "day" | "agenda" | "timeline";
  resources?: PlannerResource[];
  events?: PlannerEvent[];
  editable?: boolean;
  onEventSelect?: (event: PlannerEvent) => void;
  onDateSelect?: (date: string) => void;
  onEventChange?: (event: PlannerEvent) => void;
}
export function createPlanner(
  options: PlannerOptions,
): Controller<PlannerOptions>;
export const version: string;

/** Numeric or epoch-millisecond X, finite strictly increasing; values retain explicit null gaps. */
export interface AnalyticData {
  x: ArrayLike<number>;
  series: Array<{
    id: string;
    label: string;
    values: ArrayLike<number | null>;
  }>;
}
export type AnalyticToken =
  | "accent"
  | "success"
  | "danger"
  | "text"
  | "muted"
  | "border";
export interface AnalyticField {
  unit?: "number" | "percent" | "bytes" | "ms" | "s";
  decimals?: number;
  axis?: "left" | "right";
  color?: AnalyticToken | "auto";
  visible?: boolean;
  fill?: number;
  lineWidth?: number;
  interpolation?: "linear" | "step";
  connectNulls?: boolean;
}
export interface AnalyticOptions {
  label?: string;
  time?: boolean;
  tooltip?: "all" | "selected" | "hidden";
  defaults?: AnalyticField;
  overrides?: Record<string, AnalyticField>;
  axes?: {
    left?: { min?: number; max?: number };
    right?: { min?: number; max?: number };
  };
  thresholds?: Array<{
    value: number;
    color: AnalyticToken;
    axis?: "left" | "right";
  }>;
}
export interface ChartSync {
  subscribe(
    callback: (
      value: { x?: number; range?: [number, number] },
      source: HTMLElement,
    ) => void,
  ): () => void;
  publish(
    value: { x?: number; range?: [number, number] },
    source: HTMLElement,
  ): void;
  readonly size: number;
}
export interface AnalyticChartController {
  getAxisTicks(): Array<Partial<TimeAxisTick> & { index: number; x: number; contextX: number; position: number; anchor: "start" | "middle" | "end"; start: number; end: number; lines: string[] }>;
  element: HTMLElement;
  setData(data: AnalyticData): boolean;
  appendData(
    data: AnalyticData,
    options?: { maxPoints?: number; follow?: boolean },
  ): boolean;
  setSize(width: number, height: number): boolean;
  setRange(range: [number, number], options?: { notify?: boolean }): boolean;
  setOptions(options: AnalyticOptions): boolean;
  select(
    index: number,
    options?: { notify?: boolean; seriesId?: string },
  ): boolean;
  reset(): boolean;
  flush(): boolean;
  setVisible(value: boolean): void;
  readonly options: AnalyticOptions;
  readonly range: [number, number];
  readonly stats: Record<string, number | boolean>;
  getPoint(index?: number): {
    index: number;
    x: number;
    values: Array<{ id: string; label: string; value: number | null }>;
  };
  dispose(): void;
}
export function createAnalyticChart(options: {
  document?: Document;
  data: AnalyticData;
  options?: AnalyticOptions;
  width?: number;
  height?: number;
  syncGroup?: ChartSync;
  autoResize?: boolean;
  pixelRatio?: number;
}): AnalyticChartController;
export function createChartSync(): ChartSync;
export interface PanelOptions {
  renderer?: "svg" | "ascii";
  label?: string;
  unit?: "number" | "percent" | "bytes" | "ms" | "s";
  decimals?: number;
  color?: AnalyticToken;
  showLabels?: boolean;
  scale?: "linear" | "log";
  mergeAdjacent?: boolean;
  thresholds?: Array<{ value: number; color: AnalyticToken }>;
}
export interface StatData {
  value: number | null;
  sparkline?: AnalyticData;
}
export interface HeatmapData {
  xEdges: number[];
  yEdges: number[];
  values: Array<Array<number | null>>;
}
export interface StateTimelineData {
  lanes: Array<{
    id: string;
    label: string;
    intervals: Array<{
      start: number;
      end: number;
      state: string | null;
      color?: AnalyticToken;
    }>;
  }>;
}
export interface PanelController<T> {
  element: HTMLElement;
  readonly kind: "stat" | "heatmap" | "state-timeline";
  setData(data: T): boolean;
  setOptions(options: PanelOptions): boolean;
  setSize(width: number, height: number): boolean;
  select(index: number): boolean;
  readonly options: PanelOptions;
  readonly stats: { cells: number; glyphs: number; disposed: boolean };
  dispose(): void;
}
export function createStat(options: {
  document?: Document;
  data: StatData;
  options?: PanelOptions;
  width?: number;
  height?: number;
}): PanelController<StatData>;
export function createHeatmap(options: {
  document?: Document;
  data: HeatmapData;
  options?: PanelOptions;
  width?: number;
  height?: number;
}): PanelController<HeatmapData>;
export function createStateTimeline(options: {
  document?: Document;
  data: StateTimelineData;
  options?: PanelOptions;
  width?: number;
  height?: number;
}): PanelController<StateTimelineData>;
export function createChartSettings(options: {
  document?: Document;
  chart: AnalyticChartController | PanelController<unknown>;
  series?: Array<{ id: string; label: string }>;
}): { element: HTMLElement; refresh(): void; dispose(): void };

/** Bounded visible navigation with one global current position across all local item shells. */
export interface FeedRailOptions {
  document?: Document;
  items: ContentRailItem[];
  scrollRoot?: HTMLElement | null;
  boundsElement?: HTMLElement | null;
  header?: HTMLElement | null;
  label?: string;
  onSelect?: (item: {id: string; label: string}) => void;
  onCurrentChange?: (item: {id: string; label: string; index: number; total: number}) => void;
}
export interface FeedRailController {
  element: HTMLElement;
  readonly activeId: string | null;
  dispose(): void;
}
export function createFeedRail(options: FeedRailOptions): FeedRailController;

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

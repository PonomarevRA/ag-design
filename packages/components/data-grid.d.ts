import type {I18nContext} from "./i18n.js";
/** Cells remain finite scalars; formatting never changes the source value. */
export type DataGridScalar = string | number | boolean | null;
export type DataGridDirection = "ascending" | "descending";
export type DataGridFilterOperator = "eq" | "neq" | "contains" | "notContains" |
  "startsWith" | "notStartsWith" | "endsWith" | "notEndsWith" | "lt" | "lte" |
  "gt" | "gte" | "between" | "in" | "empty" | "notEmpty";
export interface DataGridFilter { operator: DataGridFilterOperator; value?: DataGridScalar | DataGridScalar[]; }
export interface DataGridQuery {
  /** Zero-based page; UI displays page + 1. */
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly sort: readonly Readonly<{ columnId: string; direction: DataGridDirection }>[];
  readonly filters: Readonly<Record<string, Readonly<DataGridFilter>>>;
}
export interface DataGridRow {
  id: string;
  cells: Record<string, DataGridScalar>;
  label?: string;
  disabled?: boolean;
  /** Omit to use all declared row actions; an explicit list restricts this row. */
  actions?: string[];
}
export interface DataGridCellContext {
  readonly value: DataGridScalar;
  readonly rowId: string;
  readonly columnId: string;
  readonly rowIndex: number;
  readonly columnIndex: number;
  readonly row: Readonly<DataGridRow>;
}
export type DataGridContent = DataGridScalar | HTMLElement | { element: HTMLElement; dispose?: () => void };
export interface DataGridColumn {
  id: string;
  label: string;
  type?: "text" | "number" | "boolean" | "date" | "datetime";
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  hidden?: boolean;
  sortable?: boolean;
  align?: "start" | "center" | "end";
  group?: string[];
  wrap?: boolean;
  responsivePriority?: number;
  editable?: boolean;
  editableType?: "text" | "number" | "email" | "date";
  filter?: { type: "text" | "number" | "date" | "boolean" | "select"; multiple?: boolean;
    options?: { value: DataGridScalar; label: string }[]; placeholder?: string };
  format?: "text" | "number" | "boolean" | "date" | "datetime";
  formatOptions?: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions;
  renderCell?: (context: DataGridCellContext) => DataGridContent;
  validate?: (value: DataGridScalar, context: DataGridCellContext) => boolean | string;
}
/** Coordinates are half-open. Projection avoids fetching every hidden/intervening column. */
export interface DataGridWindowRequest {
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
  readonly columnIds: readonly string[];
  readonly columnIndices: readonly number[];
  readonly query: DataGridQuery;
  readonly revision: number;
}
/** Column-major data follows request.columnIndices, including noncontiguous frozen columns. */
export interface DataGridWindowResult {
  num_rows: number;
  num_columns: number;
  data: DataGridScalar[][];
  rowIds?: string[];
  row_headers?: string[][];
  column_headers?: string[][];
  rows?: DataGridRow[];
  revision?: number;
}
export interface DataGridDataSource {
  getWindow(request: DataGridWindowRequest, context: { signal: AbortSignal }): DataGridWindowResult | Promise<DataGridWindowResult>;
}
export interface DataGridArraySource extends DataGridDataSource {
  setRows(rows: DataGridRow[]): void;
  setColumns(columns: DataGridColumn[]): void;
  readonly rowCount: number;
  getRow(rowId: string): Readonly<DataGridRow> | null;
}
export interface DataGridAction {
  id: string;
  label: string;
  intent?: "neutral" | "primary" | "danger";
  confirm?: string;
  disabled?: boolean | ((row: Readonly<DataGridRow> | null) => boolean);
}
export type DataGridSelection = { mode: "explicit"; ids: string[] } |
  { mode: "all-matching"; except: string[]; queryRevision: number };
export interface DataGridEdit {
  readonly rowId: string;
  readonly columnId: string;
  readonly previous: DataGridScalar;
  readonly value: DataGridScalar;
  readonly queryRevision: number;
}
/** Preference snapshots deliberately omit rows, drafts, search text and filter values. */
export interface DataGridViewState {
  version: 1;
  columnIds: string[];
  columns: { id: string; width: number; hidden: boolean }[];
  frozenStart: number;
  pageSize: number;
  sort: { columnId: string; direction: DataGridDirection }[];
}
export interface DataGridOptions {
  document?: Document;
  i18n?:I18nContext;
  label: string;
  columns: DataGridColumn[];
  rows?: DataGridRow[];
  dataSource?: DataGridDataSource;
  rowCount?: number;
  mode?: "paged" | "virtual";
  rowHeight?: number;
  columnWidth?: number;
  height?: number;
  density?: "compact" | "comfortable" | "touch";
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  selectable?: boolean;
  singleSelect?: boolean;
  resizable?: boolean;
  reorder?: boolean;
  responsive?: boolean;
  autosize?: boolean;
  autoheight?: boolean;
  frozenStart?: number;
  pageSize?: number;
  pageSizes?: number[];
  initialQuery?: Partial<DataGridQuery>;
  initialSelection?: DataGridSelection;
  initialResult?: DataGridWindowResult;
  loading?: "eager" | "lazy";
  actions?: DataGridAction[];
  bulkActions?: DataGridAction[];
  collapseActions?: boolean;
  rowDetails?: (row: Readonly<DataGridRow>) => DataGridContent;
  searchDelay?: number;
  filterDelay?: number;
  locale?: string;
  labels?: Partial<Record<string, string>>;
  persistence?: { load?: () => unknown | Promise<unknown>; save: (state: DataGridViewState) => void | Promise<void> };
  onQueryChange?: (query: DataGridQuery) => void;
  onSelectionChange?: (selection: DataGridSelection) => void;
  onEdit?: (edit: DataGridEdit, context: { signal: AbortSignal }) => void | boolean | string | Promise<void | boolean | string>;
  onAction?: (action: { actionId: string; row: Readonly<DataGridRow> | null; selection: DataGridSelection }) => void | Promise<void>;
  onColumnChange?: (state: DataGridViewState) => void;
  onRowDetailsChange?: (event: { rowId: string; expanded: boolean }) => void;
}
export interface DataGridDiagnostics {
  readonly queryRevision: number;
  readonly status: "loading" | "ready" | "empty" | "error" | "disposed";
  readonly window: Readonly<{ x0: number; x1: number; y0: number; y1: number }> | null;
  /** Owned resident-array rows; zero for remote providers and after disposal. */
  readonly residentRowCount: number;
  readonly renderedRows: number;
  readonly renderedColumns: number;
  readonly renderedCells: number;
  readonly requestCount: number;
  readonly requestedCells: number;
  readonly pendingOwned: number;
  readonly cacheEntries: number;
  readonly abandonedRequests: number;
}
export interface DataGridController {
  readonly element: HTMLElement;
  readonly viewport: HTMLElement;
  readonly query: DataGridQuery;
  readonly selection: DataGridSelection;
  readonly diagnostics: DataGridDiagnostics;
  refresh(): Promise<void>;
  whenIdle(): Promise<void>;
  scrollTo(position: { row?: number; column?: number }): Promise<void>;
  setRows(rows: DataGridRow[]): Promise<void>;
  setColumns(columns: DataGridColumn[]): Promise<void>;
  setQuery(query: Partial<DataGridQuery>): Promise<void>;
  setSelection(selection: DataGridSelection): void;
  clearSelection(): void;
  setColumnVisibility(id: string, visible: boolean): Promise<void>;
  setColumnWidth(id: string, width: number): Promise<void>;
  reorderColumn(id: string, to: number): Promise<void>;
  setFrozenStart(count: number): Promise<void>;
  autosizeColumn(id: string): Promise<void>;
  showDetails(rowId: string, expanded?: boolean): void;
  editCell(rowId: string, columnId: string): void;
  commitEdit(value?: DataGridScalar): Promise<boolean>;
  cancelEdit(): void;
  getViewState(): DataGridViewState;
  restoreViewState(state: DataGridViewState): Promise<boolean>;
  resetView(): Promise<void>;
  dispose(): void;
}
export declare function createDataGrid(options: DataGridOptions): DataGridController;
export declare function createGridArrayDataSource(options: { columns: DataGridColumn[]; rows: DataGridRow[] }): DataGridArraySource;
/** Read scalar data/whitelisted structure from an existing table, without moving or executing its markup. */
export declare function readDataGridTable(table: HTMLTableElement): { label: string; columns: DataGridColumn[]; rows: DataGridRow[] };

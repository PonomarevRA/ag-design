import type {I18nContext} from "./i18n.js";
export interface HistoryRecord {
  id: string;
  title: string;
  author?: string;
  date?: string;
  description?: string;
}
export interface GitCommit extends HistoryRecord {
  parents: string[];
  refs?: string[];
}
export interface HistoryTask {
  id: string;
  title: string;
  status?: string;
}
export interface TaskEvent extends HistoryRecord {
  taskId: string;
}
export interface TaskDependency {
  from: string;
  to: string;
  label?: string;
}
export interface TaskHistoryData {
  tasks: HistoryTask[];
  events: TaskEvent[];
  dependencies?: TaskDependency[];
}
export interface HistoryHandle<T> {
  element: HTMLElement;
  search: HTMLInputElement;
  readonly selectedId: string | null;
  select(id: string): void;
  setData(data: T): void;
  refresh(): void;
  dispose(): void;
}
export interface HistoryOptions {
  document?: Document;
  i18n?:I18nContext;
  locale?:string;
  label?: string;
  onSelect?: (record: HistoryRecord) => void;
}
export declare function createGitHistory(
  options?: HistoryOptions & { commits?: GitCommit[] },
): HistoryHandle<GitCommit[]>;
export declare function createTaskHistory(
  options?: HistoryOptions &
    Partial<TaskHistoryData> & {
      onAction?: (request: {
        taskId: string;
        eventId: string;
        action: "change-status";
      }) => void;
    },
): HistoryHandle<TaskHistoryData>;

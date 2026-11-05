import type { I18nContext } from "./i18n.js";
export interface AsyncOwnedComponent {
  element: HTMLElement;
  dispose(): void;
}
export type AsyncLoad = (context: {
  signal: AbortSignal;
  key: string;
}) => PromiseLike<AsyncOwnedComponent | null> | AsyncOwnedComponent | null;
export type AsyncErrorKind = "load" | "contract" | "timeout" | "cleanup";
export interface AsyncBoundaryState {
  readonly status:
    | "idle"
    | "loading"
    | "ready"
    | "empty"
    | "error"
    | "cancelled"
    | "disposed";
  readonly key: string;
  readonly requestId: number;
  readonly hasContent: boolean;
  readonly refreshing: boolean;
  readonly stale: boolean;
  readonly errorKind: Exclude<AsyncErrorKind, "cleanup"> | null;
}
export interface AsyncRunResult {
  readonly outcome:
    | "ready"
    | "empty"
    | "error"
    | "cancelled"
    | "superseded"
    | "disposed";
  readonly key: string;
  readonly requestId: number;
  readonly errorKind: Exclude<AsyncErrorKind, "cleanup"> | null;
}
export interface AsyncBoundaryOptions {
  document?: Document;
  label: string;
  load: AsyncLoad;
  key?: string;
  autoStart?: boolean;
  keepPrevious?: boolean;
  loadingDelayMs?: number;
  timeoutMs?: number;
  minHeight?: number;
  i18n?: I18nContext;
  /** Diagnostic thenables are observed and contained; the operation result stays authoritative. */
  onError?: (error: unknown, kind: AsyncErrorKind) => void;
}
export interface AsyncBoundary {
  readonly element: HTMLElement;
  readonly state: Readonly<AsyncBoundaryState>;
  run(options?: {
    key?: string;
    load?: AsyncLoad;
  }): Promise<Readonly<AsyncRunResult>>;
  cancel(): void;
  dispose(): void;
}
export function createAsyncBoundary(
  options: AsyncBoundaryOptions,
): AsyncBoundary;

import type { I18nContext } from "./i18n.js";
export interface CatalogSearchValue {
  query: string;
  filters: Record<string, string[]>;
  sort: string;
}
export interface CatalogSearchRequest extends CatalogSearchValue {
  readonly revision: number;
}
export interface CatalogSearchFacet {
  id: string;
  label: string;
  multiple?: boolean;
  options: Array<{ value: string; label: string }>;
}
export interface CatalogSearchOptions {
  document?: Document;
  i18n?: I18nContext;
  label: string;
  query?: string;
  queryId?: string;
  /** Host-owned native labels moved into shared label/control tracks; maximum four. */
  adjacentFields?: HTMLLabelElement[];
  filters?: Record<string, string[]>;
  sort?: string;
  facets?: CatalogSearchFacet[];
  sortOptions?: Array<{ value: string; label: string }>;
  mode?: "submit" | "instant";
  onChange?: (
    request: CatalogSearchRequest,
    detail: { reason: string },
  ) => void | Promise<void>;
  onError?: (error: unknown) => void;
}
export interface CatalogSearchState {
  revision: number;
  draft: CatalogSearchValue;
  applied: CatalogSearchValue;
  dirty: boolean;
  results: {
    status: "idle" | "loading" | "ready" | "error";
    total: number | null;
    revision: number | null;
    stale: boolean;
  };
  disposed: boolean;
}
export interface CatalogSearchControls {
  readonly element: HTMLElement;
  readonly input: HTMLInputElement;
  readonly state: CatalogSearchState;
  update(value: Partial<CatalogSearchValue>): void;
  report(value: {
    revision: number;
    status: "idle" | "loading" | "ready" | "error";
    total?: number;
  }): boolean;
  dispose(): void;
}
export function createCatalogSearchControls(
  options: CatalogSearchOptions,
): CatalogSearchControls;

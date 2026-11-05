import type { I18nContext } from "./i18n.js";
import type { DropdownSelectController } from "./dropdown-select.js";
export interface SortingValue {
  by: string;
  direction: "asc" | "desc" | null;
}
export interface SortingCriterion {
  value: string;
  label: string;
  directional?: boolean;
  defaultDirection?: "asc" | "desc";
}
export interface SortingControlOptions {
  document?: Document;
  i18n?: I18nContext;
  label: string;
  options: SortingCriterion[];
  value: SortingValue;
  disabled?: boolean;
  density?: "compact" | "comfortable" | "touch";
  onChange?: (value: SortingValue) => void | Promise<void>;
  onError?: (error: unknown) => void;
}
export interface SortingControlController {
  readonly element: HTMLElement;
  readonly dropdown: DropdownSelectController;
  readonly directionButton: HTMLButtonElement;
  readonly value: SortingValue;
  setValue(value: SortingValue): boolean;
  setDisabled(value: boolean): boolean;
  dispose(): void;
}
export function createSortingControl(
  options: SortingControlOptions,
): SortingControlController;

import type {I18nContext} from "./i18n.js";
export interface DropdownSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}
export interface DropdownSelectOptions {
  document?: Document;
  i18n?:I18nContext;
  locale?:string;
  label: string;
  options: DropdownSelectOption[];
  value?: string;
  placeholder?: string;
  searchable?: boolean;
  hint?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  density?: "compact" | "comfortable" | "touch";
  searchPlaceholder?: string;
  emptyText?: string;
  onChange?: (value: string) => void;
}
export interface DropdownSelectController {
  readonly element: HTMLDivElement;
  readonly input: HTMLInputElement;
  readonly select: HTMLSelectElement;
  readonly value: string;
  open(): boolean;
  close(): boolean;
  setValue(value: string): boolean;
  setOptions(options: DropdownSelectOption[], value?: string): boolean;
  setDisabled(disabled: boolean): boolean;
  setError(error: string): boolean;
  dispose(): void;
}
export declare function createDropdownSelect(options: DropdownSelectOptions): DropdownSelectController;

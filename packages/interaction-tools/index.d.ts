export const version: string;
export interface FilterChoice {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}
export interface FilterChipsOptions {
  document?: Document;
  items?: FilterChoice[];
  selectedId?: string | null;
  label?: string;
  onChange?: (event: { id: string }) => void;
}
export interface FilterChipsController {
  element: HTMLElement;
  readonly selectedId: string | null;
  update(next: Pick<FilterChipsOptions, "items" | "selectedId">): boolean;
  dispose(): void;
}
export function createFilterChips(
  options?: FilterChipsOptions,
): FilterChipsController;
export interface ToastOptions {
  id?: string;
  message: string;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}
export type ToastDismissReason =
  | "close"
  | "action"
  | "timeout"
  | "programmatic"
  | "clear";
export interface ToastStackOptions {
  document?: Document;
  label?: string;
  onDismiss?: (event: { id: string; reason: ToastDismissReason }) => void;
}
export interface ToastStackController {
  element: HTMLElement;
  readonly size: number;
  push(options: ToastOptions): string | null;
  dismiss(id: string): boolean;
  clear(): void;
  dispose(): void;
}
export function createToastStack(
  options?: ToastStackOptions,
): ToastStackController;
export interface AnimatedNumberOptions {
  document?: Document;
  value?: number;
  decimals?: number;
  locale?: string;
  label?: string;
  animated?: boolean;
}
export interface AnimatedNumberController {
  element: HTMLElement;
  readonly value: number;
  readonly text: string;
  update(value: number): boolean;
  dispose(): void;
}
export function createAnimatedNumber(
  options?: AnimatedNumberOptions,
): AnimatedNumberController;

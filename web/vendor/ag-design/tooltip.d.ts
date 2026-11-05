export interface HintDelays {
  /** Pointer dwell in milliseconds,0..5000. Default250;0 is immediate. */
  hoverDelayMs?: number;
  /** Keyboard focus delay in milliseconds,0..5000. Default0. */
  focusDelayMs?: number;
}
export interface TooltipOptions extends HintDelays {
  trigger: HTMLElement;
  text: string;
  container?: HTMLElement;
  placement?: "auto" | "right" | "bottom";
}
export interface TooltipController {
  readonly panel: HTMLElement;
  readonly trigger: HTMLElement;
  readonly isOpen: boolean;
  setOpen(open: boolean): void;
  setText(text: string): void;
  setDelays(delays?: HintDelays): void;
  dispose(): void;
}
/** Supplemental hover/focus hint for an existing named control; title is deliberately not generated. */
export function bindTooltip(options: TooltipOptions): TooltipController;

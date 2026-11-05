import type { I18nContext } from "./i18n.js";
export interface TextareaOptions {
  document?: Document;
  i18n?: I18nContext;
  /** Caller-owned unique ID; associated label, hint and error IDs derive from it. */
  id: string;
  label: string;
  name?: string;
  value?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  /** AG authored range1..50; expected height remains manually resizable. */
  rows?: number;
  /** Native UTF-16 limit; adds remaining/max feedback below the control. */
  maxLength?: number;
  density?: "compact" | "comfortable" | "touch";
  readOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  resize?: "vertical" | "none";
}
/** Native textarea inside an associated label; the caller owns value, events, validation and removal. */
export type TextareaElement = HTMLLabelElement & {
  /** Refresh feedback after programmatic value or maxlength assignment. */
  sync(): void;
  /** Remove counter subscriptions and pending announcements on unmount. */
  dispose(): void;
};
export function createTextarea(options: TextareaOptions): TextareaElement;

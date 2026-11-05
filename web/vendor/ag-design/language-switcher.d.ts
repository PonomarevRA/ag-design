import type { I18nContext } from "./i18n.js";
/** Enabled-language UI only; host persistence, page routing and translation stay external. */
export declare function createLanguageSwitcher(options?: {
  document?: Document;
  i18n?: I18nContext;
  /** Auto exposes two enabled languages and uses a native select for three or more; one remains static. */
  variant?: "compact" | "inline" | "auto";
  /** Quiet keeps focus/selection but removes the permanent field outline; host owns placement. */
  appearance?: "outlined" | "quiet";
  /** An associated label always remains available to assistive technology. */
  labelVisibility?: "visible" | "sr-only";
  label?: string;
  names?: Record<string, string>;
  density?: "compact" | "comfortable" | "touch";
  onChange?: (locale: string, context: I18nContext) => void;
}): {
  element: HTMLDivElement;
  select: HTMLSelectElement | null;
  readonly value: string;
  dispose(): void;
};
/** Native name for a valid language tag, falling back to the tag if Intl data is unavailable. */
export declare function languageName(locale: string): string;

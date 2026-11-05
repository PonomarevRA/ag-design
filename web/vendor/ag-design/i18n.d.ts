export type LocaleMessage =
  | string
  | (Partial<Record<"zero" | "one" | "two" | "few" | "many", string>> & {
      other: string;
    });
export interface I18nConfiguration {
  locale?: string;
  availableLocales?: string[];
  fallbackLocale?: string;
  messages?: Record<string, Record<string, LocaleMessage>>;
  direction?: "auto" | "ltr" | "rtl";
}
export interface I18nContext {
  readonly locale: string;
  readonly fallbackLocale: string;
  readonly availableLocales: string[];
  readonly direction: "ltr" | "rtl";
  t(key: string, params?: Record<string, string | number | boolean>): string;
  configure(configuration: I18nConfiguration): string;
  setLocale(locale: string): string;
  number(value: number | bigint, options?: Intl.NumberFormatOptions): string;
  date(value: Date | number, options?: Intl.DateTimeFormatOptions): string;
  list(values: string[], options?: Intl.ListFormatOptions): string;
  subscribe(listener: (context: I18nContext) => void): () => void;
  dispose(): void;
}
export interface I18nOptions {
  i18n?: I18nContext;
  locale?: string;
}
export declare function createI18n(
  configuration?: I18nConfiguration,
): I18nContext;
export declare function resolveI18n(
  document: Document,
  context?: I18nContext,
): I18nContext;
export declare function setDocumentI18n(
  document: Document,
  context: I18nContext,
): () => void;
export declare function createI18nBindings(context: I18nContext): {
  text(
    node: Node,
    key: string,
    params?:
      | Record<string, string | number | boolean>
      | (() => Record<string, string | number | boolean>),
  ): () => void;
  attribute(
    node: Element,
    name: string,
    key: string,
    params?: Record<string, string | number | boolean>,
  ): () => void;
  dispose(): void;
};
export declare const builtinMessages: Record<
  string,
  Record<string, LocaleMessage>
>;

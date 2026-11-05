import type { I18nContext } from "./i18n.js";
export interface CatalogCardAction {
  label: string;
  href?: string;
  onAction?: (state: CatalogCardState) => void | Promise<void>;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "quiet";
}
export interface CatalogCardData {
  title: string;
  summary?: string;
  eyebrow?: string;
  note?: string;
  facts?: Array<{ label: string; value: string }>;
  badges?: string[];
  priceText?: string;
  rating?: { value?: number; max?: number; count: number } | null;
  href?: string;
  onOpen?: (state: CatalogCardState) => void | Promise<void>;
  primaryAction?: CatalogCardAction;
  secondaryActions?: CatalogCardAction[];
}
export interface CatalogCardOptions extends CatalogCardData {
  document?: Document;
  i18n?: I18nContext;
  media?: HTMLElement;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  appearance?: "framed" | "plain";
  onError?: (error: unknown) => void;
}
export interface CatalogCardState {
  title: string;
  summary: string;
  eyebrow: string;
  note: string;
  priceText: string;
  facts: Array<{ label: string; value: string }>;
  badges: string[];
  rating: { value?: number; max: number; count: number } | null;
  href: string | null;
  hasOpenAction: boolean;
  primaryAction: Omit<CatalogCardAction, "onAction"> | null;
  secondaryActions: Array<Omit<CatalogCardAction, "onAction">>;
  disposed: boolean;
}
export interface CatalogCard {
  readonly element: HTMLElement;
  readonly state: CatalogCardState;
  readonly parts: Readonly<
    Record<
      | "header"
      | "heading"
      | "eyebrow"
      | "badges"
      | "body"
      | "summary"
      | "price"
      | "rating"
      | "facts"
      | "note"
      | "footer"
      | "actions",
      HTMLElement
    > & { media: HTMLElement | null }
  >;
  update(patch: Partial<CatalogCardData>): void;
  dispose(): void;
}
export function createCatalogCard(options: CatalogCardOptions): CatalogCard;

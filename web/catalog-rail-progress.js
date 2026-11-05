import { createFeedRailProgress } from "./vendor/content-rail/feed-rail-progress.js";
/** Compatibility adapter; generic progress owns all marker measurement and subscriptions. */
export function createCatalogRailProgress({document,entries}) {
  return createFeedRailProgress({document,items:entries.map(({component})=>({id:component.id}))});
}

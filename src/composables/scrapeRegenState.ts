// src/composables/scrapeRegenState.ts
//
// AI-scrape-triggers spec (2026-07-02), Fix C. A single in-flight website
// scan can be "consumed" by exactly one of two paths:
//
//   1. useCampaignDraftStore.generateCardsForDraft() notices a scrape is
//      already running and awaits brandKitStore.waitForScrapeSettled()
//      before generating — the fresh kit is already reflected in the
//      cards it produces.
//   2. useScrapeRegenWatcher sees the SAME scrape's "scraping" → terminal
//      transition and would otherwise auto-refresh (or prompt to refresh)
//      cards that were generated from a stale kit.
//
// Without coordination both fire for one scrape run: a double regenerate,
// or a regenerate followed by a redundant "refresh designs?" banner. This
// tiny module is a plain (non-Pinia) singleton so the store — which must
// not import a composable — and the composable can share one flag without
// a circular dependency.
let armed = false;

/** Call when a scrape run starts (or is about to be waited on) — arms the
 * watcher to act on that run's eventual settle transition. */
export function armScrapeRegenWatcher(): void {
  armed = true;
}

/** Call when a run's settle transition has been (or is about to be)
 * consumed by someone else — the watcher must skip it. Idempotent. */
export function disarmScrapeRegenWatcher(): void {
  armed = false;
}

export function isScrapeRegenWatcherArmed(): boolean {
  return armed;
}

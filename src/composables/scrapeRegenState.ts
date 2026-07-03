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

// S90: a flow that OWNS a scrape run end-to-end (the "Generate with AI"
// button scans and then regenerates itself) must keep the watcher out of
// that run entirely. A pre-scan disarm alone is not enough: the watcher
// RE-ARMS on the → "scraping" transition the owned rescan itself causes,
// and its settle handler runs on the Vue watch (synchronously with the
// status write) — before the owner's 300ms waitForScrapeSettled poll can
// observe the settle and disarm again. The claim is checked at arm time,
// so the watcher never arms for a claimed run, and is released by the
// watcher itself when that run settles (or by the owner on error).
let claimed = false;

/** Claim the NEXT scrape run for the calling flow — the watcher will not
 * arm on its start transition. Call immediately before kicking the scan. */
export function claimScrapeRun(): void {
  claimed = true;
}

/** Release an unconsumed claim (owner errored before/without a scan, or
 * the run settled). Idempotent. */
export function releaseScrapeRunClaim(): void {
  claimed = false;
}

export function isScrapeRunClaimed(): boolean {
  return claimed;
}

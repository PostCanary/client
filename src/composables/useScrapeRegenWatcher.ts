// src/composables/useScrapeRegenWatcher.ts
//
// AI-scrape-triggers spec (2026-07-02), Fix C: when a website scan
// completes AFTER the customer already has generated cards, decide
// whether to refresh them automatically (pristine — nothing to lose) or
// ask first (edited — never silently clobber a hand-made change). Mounted
// once from WizardShell.vue so it stays alive across every wizard step —
// the banner can surface even while the customer is back on Steps 1-2.
import { computed, ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import {
  armScrapeRegenWatcher,
  disarmScrapeRegenWatcher,
  isScrapeRegenWatcherArmed,
  isScrapeRunClaimed,
  releaseScrapeRunClaim,
} from "@/composables/scrapeRegenState";

const TOAST_MS = 6000;
const REFRESH_WAIT_MS = 30_000;

export function useScrapeRegenWatcher() {
  const auth = useAuthStore();
  const brandKitStore = useBrandKitStore();
  const draftStore = useCampaignDraftStore();

  // Silent-refresh toast (pristine path).
  const toastMessage = ref<string | null>(null);
  let toastTimer: ReturnType<typeof setTimeout> | null = null;
  function showToast(message: string) {
    toastMessage.value = message;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMessage.value = null;
    }, TOAST_MS);
  }
  function dismissToast() {
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage.value = null;
  }

  // Non-blocking "refresh my designs?" banner (edited path).
  const bannerVisible = ref(false);
  const bannerRefreshing = ref(false);
  function resetBanner() {
    bannerVisible.value = false;
    bannerRefreshing.value = false;
  }

  function preconditionsMet(): boolean {
    const draft = draftStore.draft;
    return (
      !!draft &&
      (draft.design?.sequenceCards?.length ?? 0) > 0 &&
      auth.hasPostcards &&
      !draftStore.isGeneratingCards()
    );
  }

  async function maybeTrigger() {
    if (!preconditionsMet()) return;
    const draft = draftStore.draft!;
    if (!draft.designUserEdited) {
      await draftStore.generateCardsForDraft();
      showToast("Designs updated with your website's branding.");
    } else {
      bannerVisible.value = true;
    }
  }

  // A scan can already be in flight when this composable mounts: SPA
  // navigation into the wizard after the kit hydrated as "scraping"
  // elsewhere means the watch below never sees a → "scraping" transition
  // for that run, so its settle would be silently ignored. Arm now.
  // (Reload-into-wizard is different — the kit hydrates after mount, so
  // undefined → "scraping" fires the watch normally. And if generation
  // later consumes this run via waitForScrapeSettled, it disarms first,
  // so this can't double-fire.)
  if (brandKitStore.brandKit?.scrapeStatus === "scraping") {
    armScrapeRegenWatcher();
  }

  watch(
    () => brandKitStore.brandKit?.scrapeStatus,
    (next, prev) => {
      if (next === "scraping" && prev !== "scraping") {
        // S90: a claimed run is owned end-to-end by another flow (the
        // Generate-with-AI button) — never arm for it, or this watcher
        // races the owner at settle (its handler runs on the status write,
        // before the owner's poll can observe it).
        if (!isScrapeRunClaimed()) {
          armScrapeRegenWatcher();
        }
        resetBanner();
        dismissToast();
        return;
      }
      if (prev === "scraping" && next !== "scraping") {
        const wasArmed = isScrapeRegenWatcherArmed();
        // A claim wins over armed state: the run may have STARTED before
        // the owner claimed it (button clicked into an already-in-flight
        // scan — its rescan 409s and just waits), in which case armed is
        // stale truth from the pre-claim start transition. One-shot per
        // run either way: leaving "scraping" always disarms and releases.
        const wasClaimed = isScrapeRunClaimed();
        disarmScrapeRegenWatcher();
        releaseScrapeRunClaim();
        if (wasClaimed) return; // an owning flow consumes this settle
        if (!wasArmed) return; // consumed by an owning flow's own wait
        if (next !== "complete" && next !== "partial") return; // failed/skipped → no regen, no banner
        void maybeTrigger();
      }
    },
  );

  // Edge case #10: an org switch must never carry armed/banner state over
  // to the new org's kit. useBrandKitStore.setupOrgWatcher() re-fetches
  // the kit for the new org (which will re-arm cleanly off ITS OWN
  // "scraping" transition if one is in flight) — this just drops whatever
  // was pending for the org being left.
  watch(
    () => auth.orgId,
    () => {
      disarmScrapeRegenWatcher();
      resetBanner();
      dismissToast();
    },
  );

  async function refresh() {
    if (bannerRefreshing.value) return; // guard double-click on the same action
    bannerRefreshing.value = true;
    try {
      // Edge case #12: never silently drop the click. The button is ALSO
      // disabled in the template while isGeneratingCards is true — this
      // wait is a race backstop, not the primary UX.
      const startedAt = Date.now();
      while (
        draftStore.isGeneratingCards() &&
        Date.now() - startedAt < REFRESH_WAIT_MS
      ) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      if (draftStore.isGeneratingCards()) {
        // Still busy after the whole wait — generateCardsForDraft() would
        // no-op on its single-flight guard, i.e. the click WOULD be
        // dropped. Leave the banner up so the customer can act once the
        // in-flight generation settles, and say nothing false.
        bannerRefreshing.value = false;
        return;
      }
      await draftStore.generateCardsForDraft();
      bannerVisible.value = false;
    } finally {
      bannerRefreshing.value = false;
    }
  }

  function keep() {
    // One-shot arming means a later reload can't resurrect this banner —
    // there's no new "scraping" → terminal transition to re-fire it.
    resetBanner();
  }

  return {
    bannerVisible: computed(() => bannerVisible.value),
    bannerRefreshing: computed(() => bannerRefreshing.value),
    toastMessage: computed(() => toastMessage.value),
    refresh,
    keep,
    dismissToast,
  };
}

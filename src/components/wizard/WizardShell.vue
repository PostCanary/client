<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { useAuthStore } from "@/stores/auth";
import { useScrapeRegenWatcher } from "@/composables/useScrapeRegenWatcher";
import StepGoal from "./StepGoal.vue";
import StepTargeting from "./StepTargeting.vue";
import StepUploadDesign from "./StepUploadDesign.vue";
import StepReview from "./StepReview.vue";
import type { WizardStep } from "@/types/campaign";

const draftStore = useCampaignDraftStore();
const auth = useAuthStore();
const brandKitStore = useBrandKitStore();

// S89 Fix C — mounted once here (not in StepDesign) so the silent-refresh
// toast / edited-design banner can surface on any wizard step, matching
// Fix D's strip below.
const {
  bannerVisible: scrapeBannerVisible,
  bannerRefreshing: scrapeBannerRefreshing,
  toastMessage: scrapeToastMessage,
  refresh: refreshScrapedDesigns,
  keep: keepScrapedDesigns,
  dismissToast: dismissScrapeToast,
} = useScrapeRegenWatcher();

// --- S89 Fix D — website-scan visibility strip (visible on any step) -------
const scrapeStripDismissed = ref(false);
watch(
  () => brandKitStore.brandKit?.scrapeStatus,
  (next, prev) => {
    // A fresh scan (this rescan, or one kicked off elsewhere) un-dismisses
    // the strip so a new run's status is never hidden by a stale dismiss.
    if (next === "scraping" && prev !== "scraping") {
      scrapeStripDismissed.value = false;
    }
  },
);
const scrapeWebsiteLabel = computed(
  () => brandKitStore.brandKit?.websiteUrl || "your website",
);
const showScrapingStrip = computed(
  () =>
    auth.hasPostcards &&
    !scrapeStripDismissed.value &&
    brandKitStore.brandKit?.scrapeStatus === "scraping",
);
const showScrapeFailedStrip = computed(
  () =>
    auth.hasPostcards &&
    !scrapeStripDismissed.value &&
    brandKitStore.brandKit?.scrapeStatus === "failed",
);
function dismissScrapeStrip() {
  scrapeStripDismissed.value = true;
}
function retryScrape() {
  scrapeStripDismissed.value = false;
  void brandKitStore.rescan(brandKitStore.brandKit?.websiteUrl ?? "");
}

const step = computed(() => draftStore.currentStep);
const completedSteps = computed(() => draftStore.draft?.completedSteps ?? []);

// POS-147/148 (Flow v2): step 3 is now Upload Your Design — advance once
// the customer has either uploaded artwork or requested a paid design.
// The legacy "cards exist" fallback applies ONLY to drafts that already
// completed step 3 in the pre-Flow-v2 studio: background generation
// populates sequenceCards on every new draft, so cards alone must not
// open the gate (cross-phase review finding). Every other step still
// gates on its real completion flag.
const canAdvance = computed(() => {
  if (step.value === 3) {
    const design = draftStore.draft?.design;
    const source = design?.designSource;
    if (source === "uploaded" || source === "requested") return true;
    return (
      completedSteps.value.includes(3) &&
      (design?.sequenceCards?.length ?? 0) > 0
    );
  }
  return draftStore.isStepComplete(step.value as WizardStep);
});

function goBack() {
  if (step.value > 1) {
    draftStore.goToStep((step.value - 1) as WizardStep);
  }
}

function goNext() {
  if (step.value < 4 && canAdvance.value) {
    // POS-138: leaving step 3 forward is the explicit "reviewed" signal —
    // auto-generated cards never complete the step on their own (see
    // setDesign in useCampaignDraftStore), so this is what checks it off
    // for a user who never touched a card.
    if (step.value === 3) {
      draftStore.markDesignReviewed();
    }
    draftStore.goToStep((step.value + 1) as WizardStep);
  }
}

// Force-save on browser close/refresh using keepalive fetch (survives tab close)
function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (draftStore.draft && draftStore.draft.completedSteps.length > 0) {
    e.preventDefault();
  }
  // Use beaconSave (fetch+keepalive) instead of async saveNow — browsers don't
  // wait for async requests during unload. beaconSave only fires if dirty.
  draftStore.beaconSave();
}

// Intercept browser back — go to previous wizard step instead of leaving
function handlePopstate() {
  if (step.value > 1) {
    // Push state back so we stay in the wizard
    window.history.pushState(null, "", window.location.href);
    goBack();
  }
}

window.addEventListener("beforeunload", handleBeforeUnload);
window.addEventListener("popstate", handlePopstate);
// Push initial state so first back press triggers popstate instead of leaving
window.history.pushState(null, "", window.location.href);

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
  window.removeEventListener("popstate", handlePopstate);
});

// Save on route leave
onBeforeRouteLeave(async () => {
  await draftStore.saveNow();
  return true;
});
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Always-mounted at fixed height so save/error state doesn't cause layout shift. -->
    <div
      class="h-7 shrink-0 text-xs flex items-center justify-center px-4 transition-colors"
      :class="
        draftStore.error
          ? 'bg-red-50 text-red-600'
          : draftStore.saving
            ? 'bg-gray-50 text-gray-400'
            : 'bg-transparent text-transparent pointer-events-none'
      "
      aria-live="polite"
    >
      {{ draftStore.error || (draftStore.saving ? 'Saving...' : '\u00A0') }}
    </div>

    <!-- S89 Fix D: website-scan progress / failure strip (any step) -->
    <div
      v-if="showScrapingStrip"
      class="shrink-0 flex items-center gap-3 px-4 sm:px-6 py-2 text-xs bg-blue-50 text-blue-700 border-b border-blue-100"
      role="status"
      data-testid="scrape-progress-strip"
    >
      <span
        class="inline-block w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0"
      />
      <span class="flex-1">
        Reading {{ scrapeWebsiteLabel }} — {{ brandKitStore.scrapeMessage || "pulling your logo, colors and photos" }}… {{ brandKitStore.scrapeProgressPercent }}%
      </span>
      <button
        type="button"
        class="opacity-60 hover:opacity-100"
        aria-label="Dismiss"
        data-testid="scrape-strip-dismiss"
        @click="dismissScrapeStrip"
      >
        ✕
      </button>
    </div>
    <div
      v-else-if="showScrapeFailedStrip"
      class="shrink-0 flex items-center gap-3 px-4 sm:px-6 py-2 text-xs bg-amber-50 text-amber-700 border-b border-amber-100"
      role="alert"
      data-testid="scrape-failed-strip"
    >
      <span class="flex-1">We couldn't read your website — your cards will use standard content.</span>
      <button
        type="button"
        class="font-semibold underline"
        data-testid="scrape-strip-retry"
        @click="retryScrape"
      >
        Try again
      </button>
      <button
        type="button"
        class="opacity-60 hover:opacity-100"
        aria-label="Dismiss"
        data-testid="scrape-strip-dismiss"
        @click="dismissScrapeStrip"
      >
        ✕
      </button>
    </div>

    <!-- S89 Fix C: silent pristine-refresh confirmation toast -->
    <div
      v-if="scrapeToastMessage"
      class="shrink-0 flex items-center justify-between px-4 sm:px-6 py-2 text-xs bg-emerald-50 text-emerald-700 border-b border-emerald-100"
      role="status"
      data-testid="scrape-regen-toast"
    >
      <span>{{ scrapeToastMessage }}</span>
      <button
        type="button"
        class="opacity-60 hover:opacity-100"
        aria-label="Dismiss"
        @click="dismissScrapeToast"
      >
        ✕
      </button>
    </div>

    <!-- S89 Fix C: edited-design refresh prompt (never auto-clobbers) -->
    <div
      v-if="scrapeBannerVisible"
      class="shrink-0 flex items-center gap-3 px-4 sm:px-6 py-2 text-xs bg-amber-50 text-amber-700 border-b border-amber-100"
      role="alert"
      data-testid="scrape-regen-banner"
    >
      <span class="flex-1">Your website scan finished — refresh your card designs with the new brand info?</span>
      <button
        type="button"
        class="font-semibold px-2.5 py-1 rounded bg-amber-600 text-white disabled:opacity-50"
        data-testid="scrape-regen-refresh"
        :disabled="scrapeBannerRefreshing || draftStore.isGeneratingCards()"
        @click="refreshScrapedDesigns"
      >
        {{ scrapeBannerRefreshing ? "Refreshing…" : "Refresh designs" }}
      </button>
      <button
        type="button"
        class="font-semibold underline"
        data-testid="scrape-regen-keep"
        @click="keepScrapedDesigns"
      >
        Keep my edits
      </button>
    </div>

    <!-- Step content -->
    <div class="flex-1 overflow-y-auto">
      <StepGoal v-if="step === 1" />
      <StepTargeting v-else-if="step === 2" />
      <StepUploadDesign v-else-if="step === 3" />
      <StepReview v-else-if="step === 4" />
    </div>

    <!-- Navigation buttons — sticky so they stay thumb-reachable on mobile -->
    <div class="sticky bottom-0 z-10 bg-white border-t border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between">
      <button
        v-if="step > 1"
        class="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
        @click="goBack"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        Back
      </button>
      <div v-else />

      <button
        v-if="step < 4"
        class="text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
        :class="
          canAdvance
            ? 'bg-[#47bfa9] text-white hover:bg-[#3aa893]'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        "
        :disabled="!canAdvance"
        @click="goNext"
      >
        Next
      </button>
    </div>
  </div>
</template>

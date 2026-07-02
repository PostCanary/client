<script setup lang="ts">
/**
 * Dev-only harness for the S89 AI-scrape-triggers wizard-shell surfaces:
 * the scan progress/failure strips (Fix D) and the post-scrape regen
 * toast/banner (Fix C). Seeds the auth + brand-kit + draft stores, mounts
 * the REAL WizardShell (so the real useScrapeRegenWatcher instance reacts
 * to real store transitions), and exposes buttons that drive the brand
 * kit through the same scrapeStatus transitions the poller produces —
 * NO backend needed. generateCardsForDraft's network calls fail and are
 * swallowed by its own catch; only the strip/toast/banner visuals matter
 * here.
 *
 * Not linked from navigation. Visual-verification only.
 */
import { onMounted, ref } from "vue";
import WizardShell from "@/components/wizard/WizardShell.vue";
import { useAuthStore } from "@/stores/auth";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import type { CampaignDraft } from "@/types/campaign";

const auth = useAuthStore();
const brandKitStore = useBrandKitStore();
const draftStore = useCampaignDraftStore();
const now = new Date().toISOString();

auth.me = {
  authenticated: true,
  org_id: "dev-org",
  features: ["postcards"],
} as any;

brandKitStore.hydrated = true;
brandKitStore.brandKit = {
  businessName: "Total Comfort Heating & Cooling",
  websiteUrl: "https://totalcomfort.example",
  scrapeStatus: "complete",
  scrapeProgress: {
    step: "reading",
    message: "Reading your homepage",
    completedSteps: 3,
    totalSteps: 5,
  },
} as any;

draftStore.draft = {
  id: "dev-draft",
  campaignType: "targeted",
  currentStep: 1,
  completedSteps: [1],
  needsReviewSteps: [],
  goal: { goalType: "neighbor_marketing", sequenceLength: 3 },
  targeting: null,
  audience: null,
  review: null,
  design: {
    templateId: "hac-1000-offer",
    templateLayoutType: "full-bleed",
    isCustomUpload: false,
    customUploadUrl: null,
    sequenceCards: [{ cardNumber: 1 } as any],
  },
  designUserEdited: false,
  createdAt: now,
  updatedAt: now,
} as unknown as CampaignDraft;

function setStatus(status: string) {
  brandKitStore.brandKit = {
    ...brandKitStore.brandKit,
    scrapeStatus: status,
  } as any;
}

function setEdited(edited: boolean) {
  if (draftStore.draft) draftStore.draft.designUserEdited = edited;
}

// WizardShell teleports its progress bar to #wizard-progress-slot
// (normally provided by WizardLayout). A teleport target must be in the
// DOCUMENT before the teleporting component mounts — siblings in this
// same page component are still detached during the initial patch, so
// mount the shell one tick later.
const shellReady = ref(false);
onMounted(() => {
  shellReady.value = true;
});
</script>

<template>
  <div class="h-screen flex flex-col">
    <div
      class="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs"
      data-testid="strips-harness-controls"
    >
      <span class="font-bold">dev harness:</span>
      <button class="px-2 py-1 bg-gray-700 rounded" data-testid="h-scraping" @click="setStatus('scraping')">start scan</button>
      <button class="px-2 py-1 bg-gray-700 rounded" data-testid="h-complete" @click="setStatus('complete')">settle complete</button>
      <button class="px-2 py-1 bg-gray-700 rounded" data-testid="h-failed" @click="setStatus('failed')">settle failed</button>
      <button class="px-2 py-1 bg-gray-700 rounded" data-testid="h-pristine" @click="setEdited(false)">mark pristine</button>
      <button class="px-2 py-1 bg-gray-700 rounded" data-testid="h-edited" @click="setEdited(true)">mark edited</button>
      <span class="opacity-70" data-testid="h-state">
        status={{ brandKitStore.brandKit?.scrapeStatus ?? "none" }} postcards={{ auth.hasPostcards }} draft={{ !!draftStore.draft }} edited={{ draftStore.draft?.designUserEdited ?? "n/a" }}
      </span>
    </div>
    <div id="wizard-progress-slot" class="shrink-0"></div>
    <div class="flex-1 min-h-0">
      <WizardShell v-if="shellReady" />
    </div>
  </div>
</template>

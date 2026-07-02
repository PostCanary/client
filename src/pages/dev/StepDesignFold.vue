<script setup lang="ts">
/**
 * Dev-only harness for S79 Phase-1 fold verification of StepDesign.
 * Seeds the draft + brand-kit stores with a 3-card sequence and mounts
 * StepDesign inside a viewport-pinned shell that mirrors WizardShell's
 * `flex-1` step region (fixed header + footer, flex-1 body). Playwright
 * mocks the preview-card / preview-back blob endpoints so the canvas
 * renders a real 3:2 PNG with NO backend. Used to prove the design step
 * never scrolls as a page at 1280×800 / 1440×900 (front + back).
 *
 * Not linked from navigation. Visual-verification only.
 */
import { onMounted } from "vue";
import StepDesign from "@/components/wizard/StepDesign.vue";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import type { CampaignDraft, CardDesign, CardPurpose } from "@/types/campaign";

const draftStore = useCampaignDraftStore();
const brandKitStore = useBrandKitStore();
const now = new Date().toISOString();

function makeCard(cardNumber: number, purpose: CardPurpose): CardDesign {
  return {
    cardNumber,
    cardPurpose: purpose,
    templateId: "hac-1000-" + purpose,
    // hac-1000 has a real zone map (headline / photo / offer / review), so the
    // S79 Phase-2 hotspots + popover/drawer are exercisable in the harness.
    renderTemplateId: "hac-1000-front-v1",
    previewImageUrl: "",
    overrides: {},
    resolvedContent: {
      headline: "Comfort you can count on",
      offerText: "$50 OFF a Tune-Up",
      offerTeaser: "$50 OFF",
      offerItems: [],
      // S81: seed a real photo so the on-canvas Adjust-position overlay is
      // exercisable in the harness. /dev-photo.jpg is served from /public so
      // the overlay loads it with NO backend (Playwright can also route it).
      photoUrl: "/dev-photo.jpg",
      reviewQuote: "Great service, on time and tidy.",
      reviewerName: "J. Smith",
      phoneNumber: "(612) 887-2109",
      urgencyText: "",
      riskReversal: "",
      trustSignals: [],
      mapImageUrl: "",
    },
    backContent: {
      guarantee: "100% satisfaction guaranteed",
      certifications: [],
      licenseNumber: "",
      companyAddress: "123 Comfort Way, Golden Valley, MN 55422",
      websiteUrl: "https://totalcomfort.example",
      qrCodeUrl: "",
      subhead: "Why neighbors choose us",
      benefits: ["Licensed & insured", "Upfront pricing", "Same-day service"],
      testimonial: "Best HVAC company in town!",
      services: ["Tune-ups", "Repairs", "Installs"],
      hours: "Mon–Fri 8–6",
    } as CardDesign["backContent"],
    headlineCandidates: [],
    offerReason: "",
    reviewReason: "",
    templateReason: "",
  };
}

brandKitStore.brandKit = {
  industry: "hvac",
  location: "Golden Valley, MN",
  businessName: "Total Comfort Heating & Cooling",
  websiteUrl: "https://totalcomfort.example",
  phone: "(612) 887-2109",
  address: "123 Comfort Way, Golden Valley, MN 55422",
  brandColors: ["#0b2d50", "#47bfa9"],
  logoUrl: null,
  googleRating: 4.9,
  reviewCount: 212,
  trustBadges: [],
  yearsInBusiness: 12,
  reviews: [],
  certifications: [],
  completenessPercent: 90,
} as any;
brandKitStore.hydrated = true;

draftStore.draft = {
  id: "11111111-1111-4111-8111-111111111111",
  orgId: "22222222-2222-4222-8222-222222222222",
  currentStep: 3,
  completedSteps: [1, 2],
  needsReviewSteps: [],
  campaignType: "targeted",
  goal: {
    goalType: "neighbor_marketing",
    goalLabel: "Neighbor Marketing",
    serviceType: "HVAC Tune-Up",
    sequenceLength: 3,
    sequenceSpacingDays: 14,
    otherGoalText: null,
  },
  targeting: null,
  audience: null,
  design: {
    templateId: "full-bleed-offer",
    templateLayoutType: "full-bleed",
    isCustomUpload: false,
    customUploadUrl: null,
    sequenceCards: [
      makeCard(1, "offer"),
      makeCard(2, "proof"),
      makeCard(3, "last_chance"),
    ],
  },
  review: null,
  createdAt: now,
  updatedAt: now,
  schemaVersion: 1,
} as unknown as CampaignDraft;

// Neuter persistence side-effects so the harness never hits the network.
draftStore.saveNow = (async () => {}) as typeof draftStore.saveNow;
draftStore.setDesign = (() => {}) as typeof draftStore.setDesign;

onMounted(() => {
  // Surface the seeded viewport size for the screenshot annotation.
  document.title = `StepDesign fold ${window.innerWidth}x${window.innerHeight}`;
});
</script>

<template>
  <!-- Mirrors WizardLayout/WizardShell: full-viewport flex column with a
       fixed faux header + a flex-1 step region (overflow hidden so any
       page-level scroll would be a real bug) + a sticky footer. -->
  <div class="flex flex-col h-screen bg-white">
    <div class="shrink-0 h-12 border-b border-gray-100 flex items-center px-6 text-sm font-semibold text-[#0b2d50]">
      ① Goal ▸ ② Neighborhood ▸ ●③ Your Postcard ▸ ④ Review
    </div>
    <div class="h-7 shrink-0" />
    <div class="flex-1 min-h-0 overflow-hidden" data-testid="step-viewport">
      <StepDesign />
    </div>
    <div class="sticky bottom-0 shrink-0 border-t border-gray-100 px-6 py-4 flex justify-between">
      <button class="text-sm text-gray-500">Back</button>
      <button class="text-sm font-semibold px-6 py-2.5 rounded-lg bg-[#47bfa9] text-white">Next</button>
    </div>
  </div>
</template>

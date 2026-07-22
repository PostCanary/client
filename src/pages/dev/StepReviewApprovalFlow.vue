<script setup lang="ts">
/**
 * Dev-only harness for StepReview approval side-effect verification.
 * Playwright mocks the API and verifies proof creation happens before purchase.
 */
import StepReview from "@/components/wizard/StepReview.vue";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import type { CampaignDraft, DesignSelection } from "@/types/campaign";

const now = new Date().toISOString();
const draftStore = useCampaignDraftStore();
const brandKitStore = useBrandKitStore();
const params = new URLSearchParams(window.location.search);
const emptyDraft = params.get("emptyDraft") === "1";

// POS-149: drives ReviewSummary/CostBreakdown through the Flow v2
// designSource states from a plain URL param, so Playwright can seed
// requested/uploaded/absent without a real Step 3 build.
const designSourceParam = params.get("designSource");
const uploadedPreviewParam = params.get("uploadedPreview");
// POS-161: seed a campaign-level return-address override without going
// through Step 3. When absent, Review falls back to the org default
// (mocked via GET /api/organizations/return-address).
const draftReturnAddressParam = params.get("draftReturnAddress");
// POS-156: uploaded designs store server media URLs, not base64 data URLs.
const SAMPLE_UPLOADED_FRONT =
  uploadedPreviewParam === "missing"
    ? ""
    : "/media/design-uploads/mock-org/sample-front.png";

const designSourceExtras: Partial<DesignSelection> =
  designSourceParam === "requested"
    ? {
        designSource: "requested",
        designRequest: {
          fullName: "Alex Owner",
          email: "alex@example.test",
          phone: "(612) 887-2109",
          websiteAddress: "totalcomfort.example",
          template: 1,
          notes: "Keep it teal, match our van wrap.",
          submittedAt: now,
        },
      }
    : designSourceParam === "uploaded"
      ? {
          designSource: "uploaded",
          uploadedAsset: {
            fileName: "front.png",
            mimeType: "image/png",
            fileSizeBytes: 2048,
            widthPx: 1875,
            heightPx: 1275,
            frontUrl: SAMPLE_UPLOADED_FRONT,
            backUrl: null,
          },
        }
      : {};

const draftReturnExtras: Partial<DesignSelection> =
  draftReturnAddressParam === "1"
    ? {
        returnAddress: {
          name: "Draft Override HVAC",
          address: "999 Override Lane",
          city: "Minneapolis",
          state: "MN",
          zip: "55401",
        },
      }
    : {};

const designExtras: Partial<DesignSelection> = {
  ...designSourceExtras,
  ...draftReturnExtras,
};

brandKitStore.brandKit = {
  industry: "hvac",
  location: "Golden Valley, MN",
  businessName: "Total Comfort Heating & Cooling",
  websiteUrl: "https://totalcomfort.example",
  phone: "(612) 887-2109",
  address: "123 Comfort Way, Golden Valley, MN 55422",
  logo: null,
  photos: [],
  reviews: [],
  certifications: [],
  completenessPercent: 90,
} as any;

draftStore.draft = emptyDraft
  ? null
  : ({
      id: "11111111-1111-4111-8111-111111111111",
      orgId: "22222222-2222-4222-8222-222222222222",
      currentStep: 4,
      completedSteps: [1, 2, 3],
      needsReviewSteps: [],
      campaignType: "targeted",
      goal: {
        goalType: "neighbor_marketing",
        goalLabel: "Neighbor Marketing",
        serviceType: "HVAC Tune-Up",
        sequenceLength: 1,
        sequenceSpacingDays: 14,
        otherGoalText: null,
      },
      targeting: {
        campaignGoal: "neighbor_marketing",
        serviceType: "HVAC Tune-Up",
        sequenceLength: 1,
        sequenceSpacingDays: 14,
        areas: [{ type: "zip", coordinates: [], zipCode: "55422" }],
        method: "zip",
        filters: {
          homeowner: "homeowner",
          homeValueMin: null,
          homeValueMax: null,
          yearBuiltMin: null,
          yearBuiltMax: null,
          propertyTypes: [],
          hhageMin: null,
          hhageMax: null,
          incomeMin: null,
          loresMin: null,
          loresMax: null,
        },
        jobsUsed: null,
        jobRadiusMiles: null,
        excludePastCustomers: false,
        excludeMailedWithinDays: 30,
        doNotMailCount: 0,
        totalHouseholds: 10,
        excludedPastCustomers: 0,
        excludedRecentlyMailed: 0,
        excludedDoNotMail: 0,
        finalHouseholdCount: 10,
        pastCustomersInArea: 0,
        recipientBreakdown: {
          newProspects: 10,
          pastCustomers: 0,
          pastCustomersIncluded: false,
        },
        estimatedCostSingle: 7.9,
        estimatedCostSequence: 7.9,
        countSource: "mock",
        savedAudienceName: null,
        eddmSelection: null,
      },
      audience: null,
      design: {
        templateId: "HAC-1000",
        templateLayoutType: "full-bleed",
        isCustomUpload: false,
        customUploadUrl: null,
        sequenceCards: [],
        ...designExtras,
      },
      review: null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    } satisfies CampaignDraft);
</script>

<template>
  <main class="min-h-screen bg-gray-50">
    <StepReview />
  </main>
</template>

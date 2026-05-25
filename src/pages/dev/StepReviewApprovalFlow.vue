<script setup lang="ts">
/**
 * Dev-only harness for StepReview approval side-effect verification.
 * Playwright mocks the API and verifies proof creation happens before purchase.
 */
import StepReview from "@/components/wizard/StepReview.vue";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import type { CampaignDraft } from "@/types/campaign";

const now = new Date().toISOString();
const draftStore = useCampaignDraftStore();
const brandKitStore = useBrandKitStore();
const emptyDraft = new URLSearchParams(window.location.search).get("emptyDraft") === "1";

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

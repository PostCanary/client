<script setup lang="ts">
import { ref } from "vue";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { PRICING } from "@/types/campaign";
import type { TargetingSelection } from "@/types/campaign";

const draftStore = useCampaignDraftStore();

const householdCount = ref(
  draftStore.draft?.targeting?.finalHouseholdCount ?? 500,
);

function apply() {
  const perCard = PRICING.payPerSend;
  const seqLen = draftStore.draft?.goal?.sequenceLength ?? 3;
  const targeting: TargetingSelection = {
    campaignGoal: draftStore.draft?.goal?.goalType ?? "neighbor_marketing",
    serviceType: draftStore.draft?.goal?.serviceType ?? null,
    sequenceLength: seqLen,
    sequenceSpacingDays: draftStore.draft?.goal?.sequenceSpacingDays ?? 14,
    areas: [],
    method: "draw",
    filters: {
      homeowner: null,
      homeValueMin: null,
      homeValueMax: null,
      yearBuiltMin: null,
      yearBuiltMax: null,
      propertyTypes: [],
    },
    jobsUsed: null,
    jobRadiusMiles: null,
    excludePastCustomers: true,
    excludeMailedWithinDays: 30,
    doNotMailCount: 7,
    totalHouseholds: householdCount.value + 50,
    excludedPastCustomers: 30,
    excludedRecentlyMailed: 13,
    excludedDoNotMail: 7,
    finalHouseholdCount: householdCount.value,
    pastCustomersInArea: 30,
    recipientBreakdown: {
      newProspects: householdCount.value - 30,
      pastCustomers: 30,
      pastCustomersIncluded: false,
    },
    estimatedCostSingle: householdCount.value * perCard,
    estimatedCostSequence: householdCount.value * perCard * seqLen,
    savedAudienceName: null,
  };
  draftStore.setTargeting(targeting);
}
</script>

<template>
  <div class="max-w-lg mx-auto py-8 px-4">
    <h2 class="text-xl font-semibold text-[#0b2d50] mb-4">
      Pick Your Neighborhood
    </h2>
    <p class="text-sm text-gray-500 mb-6">
      Stub — Terminal 1 replaces this with the real targeting map
    </p>

    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Estimated households
      </label>
      <input
        v-model.number="householdCount"
        type="number"
        min="50"
        max="10000"
        class="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full"
      />
      <p class="text-xs text-gray-400 mt-1">
        Est. cost: ${{ (householdCount * PRICING.payPerSend).toFixed(2) }} per card
      </p>
    </div>

    <button
      class="bg-[#47bfa9] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#3aa893] transition-colors w-full"
      @click="apply"
    >
      Set Targeting
    </button>
  </div>
</template>

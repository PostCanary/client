<script setup lang="ts">
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { PRICING } from "@/types/campaign";
import type { ReviewSelection } from "@/types/campaign";

const draftStore = useCampaignDraftStore();

const householdCount =
  draftStore.draft?.targeting?.finalHouseholdCount ?? 500;
const seqLen = draftStore.draft?.goal?.sequenceLength ?? 3;
const perCardCost = householdCount * PRICING.payPerSend;

function approve() {
  const today = new Date();
  const review: ReviewSelection = {
    campaignName: `${draftStore.draft?.goal?.goalLabel ?? "Campaign"} — ${today.toLocaleDateString()}`,
    schedules: Array.from({ length: seqLen }, (_, i) => {
      const send = new Date(today);
      send.setDate(send.getDate() + 5 + i * 14);
      const deliver = new Date(send);
      deliver.setDate(deliver.getDate() + 5);
      return {
        cardNumber: i + 1,
        scheduledDate: send.toISOString().split("T")[0] ?? "",
        estimatedDeliveryDate: deliver.toISOString().split("T")[0] ?? "",
      };
    }),
    sendSeedCopy: true,
    seedAddress: "",
    additionalSeeds: [],
    paymentMethodId: null,
    paymentMethodLabel: null,
    totalCost: perCardCost * seqLen,
    perCardCosts: Array(seqLen).fill(perCardCost),
    agreedToTerms: true,
  };
  draftStore.setReview(review);
}
</script>

<template>
  <div class="max-w-lg mx-auto py-8 px-4">
    <h2 class="text-xl font-semibold text-[#0b2d50] mb-4">Review & Send</h2>
    <p class="text-sm text-gray-500 mb-6">
      Stub — Terminal 3 replaces this with real review UI
    </p>

    <div class="bg-gray-50 rounded-lg p-4 space-y-2 mb-6 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-500">Goal</span>
        <span class="font-medium text-[#0b2d50]">
          {{ draftStore.draft?.goal?.goalLabel ?? "—" }}
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-500">Households</span>
        <span class="font-medium text-[#0b2d50]">
          {{ householdCount.toLocaleString() }}
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-500">Cards</span>
        <span class="font-medium text-[#0b2d50]">{{ seqLen }}</span>
      </div>
      <div class="flex justify-between border-t pt-2">
        <span class="text-gray-500 font-semibold">Estimated total</span>
        <span class="font-bold text-[#0b2d50]">
          ${{ (perCardCost * seqLen).toFixed(2) }}
        </span>
      </div>
    </div>

    <button
      class="bg-[#47bfa9] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#3aa893] transition-colors w-full"
      @click="approve"
    >
      Approve & Send
    </button>
  </div>
</template>

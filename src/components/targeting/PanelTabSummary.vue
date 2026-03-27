<script setup lang="ts">
import { computed } from "vue";
import { PRICING } from "@/types/campaign";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";

const props = defineProps<{
  totalHouseholds: number;
  excludedPastCustomers: number;
  excludedRecentlyMailed: number;
  excludedDoNotMail: number;
  finalHouseholdCount: number;
}>();

const draftStore = useCampaignDraftStore();
const seqLen = computed(() => draftStore.draft?.goal?.sequenceLength ?? 3);
const perCard = PRICING.payPerSend;

const perCardCost = computed(() => props.finalHouseholdCount * perCard);
const totalCost = computed(() => perCardCost.value * seqLen.value);
const isSmall = computed(() => props.finalHouseholdCount < 100);
</script>

<template>
  <div class="space-y-4 p-4">
    <h4 class="text-sm font-semibold text-[#0b2d50]">Count & Cost</h4>

    <!-- Household breakdown -->
    <div class="space-y-1.5 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-500">Total in area</span>
        <span class="text-[#0b2d50]">{{ totalHouseholds.toLocaleString() }}</span>
      </div>
      <div v-if="excludedPastCustomers > 0" class="flex justify-between">
        <span class="text-gray-500">- Past customers</span>
        <span class="text-red-400">-{{ excludedPastCustomers.toLocaleString() }}</span>
      </div>
      <div v-if="excludedRecentlyMailed > 0" class="flex justify-between">
        <span class="text-gray-500">- Recently mailed</span>
        <span class="text-red-400">-{{ excludedRecentlyMailed.toLocaleString() }}</span>
      </div>
      <div v-if="excludedDoNotMail > 0" class="flex justify-between">
        <span class="text-gray-500">- Do not mail</span>
        <span class="text-red-400">-{{ excludedDoNotMail.toLocaleString() }}</span>
      </div>
      <hr class="border-gray-200" />
      <div class="flex justify-between font-semibold">
        <span class="text-[#0b2d50]">Final count</span>
        <span class="text-[#0b2d50]">{{ finalHouseholdCount.toLocaleString() }}</span>
      </div>
    </div>

    <!-- Cost estimate -->
    <div class="bg-gray-50 rounded-lg p-3 space-y-1.5">
      <div
        v-for="n in seqLen"
        :key="n"
        class="flex justify-between text-sm"
      >
        <span class="text-gray-500">
          Card {{ n }}: {{ finalHouseholdCount.toLocaleString() }} &times;
          ${{ perCard.toFixed(2) }}
        </span>
        <span class="text-[#0b2d50] font-medium">
          ${{ perCardCost.toFixed(2) }}
        </span>
      </div>
      <hr class="border-gray-200" />
      <div class="flex justify-between font-semibold text-sm">
        <span class="text-[#0b2d50]">Total</span>
        <span class="text-[#0b2d50]">${{ totalCost.toFixed(2) }}</span>
      </div>
    </div>

    <!-- Small campaign encouragement -->
    <p v-if="isSmall && finalHouseholdCount > 0" class="text-xs text-[#47bfa9]">
      Great start! Even small campaigns drive results.
    </p>
  </div>
</template>

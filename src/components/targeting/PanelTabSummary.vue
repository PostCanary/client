<script setup lang="ts">
import { computed, inject } from "vue";
import { PRICING } from "@/types/campaign";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { formatCurrency, formatNumber } from "@/utils/format";
import { HOUSEHOLD_COUNT_KEY } from "@/injection-keys";

const props = defineProps<{
  excludedPastCustomers: number;
  excludedRecentlyMailed: number;
  excludedDoNotMail: number;
  finalHouseholdCount: number;
}>();

const hc = inject(HOUSEHOLD_COUNT_KEY)!;

const draftStore = useCampaignDraftStore();
const seqLen = computed(() => draftStore.draft?.goal?.sequenceLength ?? 3);
const perCard = PRICING.payPerSend;

const perCardCost = computed(() => props.finalHouseholdCount * perCard);
const totalCost = computed(() => perCardCost.value * seqLen.value);
const isSmall = computed(() => props.finalHouseholdCount < 100);
const hasExclusions = computed(() =>
  props.excludedPastCustomers > 0 ||
  props.excludedRecentlyMailed > 0 ||
  props.excludedDoNotMail > 0
);
</script>

<template>
  <div class="space-y-4 p-4">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-semibold text-[#0b2d50]">Count & Cost</h4>
      <span
        v-if="hc.source.value === 'mock'"
        class="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium"
      >Estimated</span>
    </div>

    <!-- Error warning -->
    <div
      v-if="hc.error.value"
      class="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2"
    >
      {{ hc.error.value }}
    </div>

    <!-- Loading skeleton -->
    <div v-if="hc.loading.value" class="space-y-2">
      <div class="h-4 bg-gray-100 rounded animate-pulse w-full" />
      <div class="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
      <div class="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
    </div>

    <!-- Household breakdown.
         S131 Bug B fix: removed "Total in area" (unfiltered lazy-fetch) and
         "Filter reductions" rows — they caused a perceived discrepancy because
         the lazy fetchTotalIfNeeded call returned an unfiltered count higher than
         the summary bar's filtered finalHouseholdCount. Now top-line matches bar. -->
    <div v-else class="space-y-1.5 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-500">Qualifying households</span>
        <span class="text-[#0b2d50]">{{ formatNumber(finalHouseholdCount) }}</span>
      </div>
      <div v-if="excludedPastCustomers > 0" class="flex justify-between">
        <span class="text-gray-500">- Past customers</span>
        <span class="text-red-400">-{{ formatNumber(excludedPastCustomers) }}</span>
      </div>
      <div v-if="excludedRecentlyMailed > 0" class="flex justify-between">
        <span class="text-gray-500">- Recently mailed</span>
        <span class="text-red-400">-{{ formatNumber(excludedRecentlyMailed) }}</span>
      </div>
      <div v-if="excludedDoNotMail > 0" class="flex justify-between">
        <span class="text-gray-500">- Do not mail</span>
        <span class="text-red-400">-{{ formatNumber(excludedDoNotMail) }}</span>
      </div>
      <template v-if="hasExclusions">
        <hr class="border-gray-200" />
        <div class="flex justify-between font-semibold">
          <span class="text-[#0b2d50]">Final count</span>
          <span class="text-[#0b2d50]">{{ formatNumber(finalHouseholdCount) }}</span>
        </div>
      </template>
    </div>

    <!-- Cost estimate -->
    <div v-if="!hc.loading.value" class="bg-gray-50 rounded-lg p-3 space-y-1.5">
      <div
        v-for="n in seqLen"
        :key="n"
        class="flex justify-between text-sm"
      >
        <span class="text-gray-500">
          Card {{ n }}: {{ formatNumber(finalHouseholdCount) }} &times;
          ${{ perCard.toFixed(2) }}
        </span>
        <span class="text-[#0b2d50] font-medium">
          {{ formatCurrency(perCardCost) }}
        </span>
      </div>
      <hr class="border-gray-200" />
      <div class="flex justify-between font-semibold text-sm">
        <span class="text-[#0b2d50]">Total</span>
        <span class="text-[#0b2d50]">{{ formatCurrency(totalCost) }}</span>
      </div>
    </div>

    <!-- Small campaign encouragement -->
    <p v-if="isSmall && finalHouseholdCount > 0 && !hc.loading.value" class="text-xs text-[#47bfa9]">
      Great start! Even small campaigns drive results.
    </p>
  </div>
</template>

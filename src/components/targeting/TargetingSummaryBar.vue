<script setup lang="ts">
import { computed, inject } from "vue";
import { formatCurrency, formatNumber } from "@/utils/format";
import { HOUSEHOLD_COUNT_KEY } from "@/injection-keys";

const props = defineProps<{
  finalHouseholdCount: number;
  estimatedCostSequence: number;
  sequenceLength: number;
}>();

const hc = inject(HOUSEHOLD_COUNT_KEY)!;
const hasTargeting = computed(() => props.finalHouseholdCount > 0 || hc.loading.value);
</script>

<template>
  <div class="bg-[#f8fafb] border-t border-gray-200 px-4 py-3 shrink-0">
    <template v-if="hc.loading.value">
      <div class="text-sm font-semibold text-[#0b2d50] animate-pulse">
        Counting households...
      </div>
    </template>
    <template v-else-if="hasTargeting">
      <div class="text-sm font-semibold text-[#0b2d50]">
        {{ formatNumber(finalHouseholdCount) }} households
      </div>
      <div class="text-xs text-gray-500 mt-0.5">
        Est. {{ formatCurrency(estimatedCostSequence) }} · {{ sequenceLength }} {{ sequenceLength === 1 ? 'card' : 'cards' }}
      </div>
    </template>
    <div v-else class="text-xs text-gray-400">
      Select an area to see targeting estimates
    </div>
  </div>
</template>

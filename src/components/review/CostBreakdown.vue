<script setup lang="ts">
import { computed } from "vue";
import { PRICING } from "@/types/campaign";
import type { PlanCode } from "@/api/billing";

const props = defineProps<{
  householdCount: number;
  sequenceLength: number;
  planCode?: PlanCode | null;
}>();

const perCardRate = computed(() => {
  if (!props.planCode) return PRICING.payPerSend;
  return PRICING[props.planCode] ?? PRICING.payPerSend;
});

const cards = computed(() =>
  Array.from({ length: props.sequenceLength }, (_, i) => ({
    cardNumber: i + 1,
    cost: props.householdCount * perCardRate.value,
  })),
);

const totalCost = computed(() =>
  cards.value.reduce((sum, c) => sum + c.cost, 0),
);
</script>

<template>
  <div class="bg-gray-50 rounded-xl p-5">
    <h4 class="text-sm font-semibold text-[#0b2d50] mb-3">Cost</h4>
    <div class="space-y-2">
      <div
        v-for="card in cards"
        :key="card.cardNumber"
        class="flex justify-between text-sm"
      >
        <span class="text-gray-500">
          Card {{ card.cardNumber }}:
          {{ householdCount.toLocaleString() }} &times;
          ${{ perCardRate.toFixed(2) }}
        </span>
        <span class="font-medium text-[#0b2d50]">
          ${{ card.cost.toFixed(2) }}
        </span>
      </div>
      <hr class="border-gray-200" />
      <div class="flex justify-between text-sm font-semibold">
        <span class="text-[#0b2d50]">Total</span>
        <span class="text-[#0b2d50]">${{ totalCost.toFixed(2) }}</span>
      </div>
    </div>
    <p class="text-xs text-gray-400 mt-2">
      Charged per card when it goes to print — not all upfront.
    </p>
  </div>
</template>

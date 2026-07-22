<script setup lang="ts">
import { computed } from "vue";
import { usePricing } from "@/composables/usePricing";
import type { PlanCode } from "@/api/billing";
import { formatCurrency, formatNumber } from "@/utils/format";

const props = defineProps<{
  householdCount: number;
  sequenceLength: number;
  planCode?: PlanCode | null;
  // POS-149: true when the customer bought a professional design from
  // PostCanary's team ($199, Flow v2 "Postcard Design Request" brief).
  // Rate comes from PRICING.customDesignFee via usePricing() — never
  // hardcode the amount here.
  includeCustomDesignFee?: boolean;
}>();

const pricing = usePricing();

const perCardRate = computed(() => {
  if (!props.planCode) return pricing.payPerSend;
  return pricing[props.planCode] ?? pricing.payPerSend;
});

const cards = computed(() =>
  Array.from({ length: props.sequenceLength }, (_, i) => ({
    cardNumber: i + 1,
    cost: props.householdCount * perCardRate.value,
  })),
);

const customDesignFee = computed(() =>
  props.includeCustomDesignFee ? pricing.customDesignFee : 0,
);

const totalCost = computed(() =>
  cards.value.reduce((sum, c) => sum + c.cost, 0) + customDesignFee.value,
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
          Mailing:
          {{ formatNumber(householdCount) }} &times;
          ${{ perCardRate.toFixed(2) }}
        </span>
        <span class="font-medium text-[#0b2d50]">
          {{ formatCurrency(card.cost) }}
        </span>
      </div>
      <div
        v-if="includeCustomDesignFee"
        data-testid="custom-design-fee-line"
        class="flex justify-between text-sm"
      >
        <span class="text-gray-500">Custom design</span>
        <span class="font-medium text-[#0b2d50]">
          {{ formatCurrency(customDesignFee) }}
        </span>
      </div>
      <hr class="border-gray-200" />
      <div class="flex justify-between text-sm font-semibold">
        <span class="text-[#0b2d50]">Total</span>
        <span class="text-[#0b2d50]">{{ formatCurrency(totalCost) }}</span>
      </div>
    </div>
    <p class="text-xs text-gray-400 mt-2">
      Charged when this mailing goes to print — not all upfront.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PaymentMethodSummary } from "@/api/billing";
import { formatCurrency, formatNumber } from "@/utils/format";

const props = defineProps<{
  householdCount: number;
  sequenceLength: number;
  billingSummary: PaymentMethodSummary | null;
  // POS-149: true when the customer bought a professional design from
  // PostCanary's team ($199, Flow v2 "Postcard Design Request" brief).
  includeCustomDesignFee?: boolean;
}>();

const perCardRate = computed(() =>
  props.billingSummary ? props.billingSummary.unit_rate_cents / 100 : null,
);
const usageCost = computed(() =>
  perCardRate.value === null
    ? null
    : props.householdCount * props.sequenceLength * perCardRate.value,
);
const isCovered = computed(
  () => props.billingSummary?.billing_type !== "pay_per_send",
);
const coveredLabel = computed(() =>
  props.billingSummary?.billing_type === "subscription_included"
    ? `Covered by your ${props.billingSummary.plan_code} plan`
    : "Covered by your account",
);
</script>

<template>
  <div class="bg-gray-50 rounded-xl p-5">
    <h4 class="text-sm font-semibold text-[#0b2d50] mb-3">Cost</h4>
    <div v-if="!billingSummary" class="text-sm text-gray-500" data-testid="cost-unavailable">
      Confirming server pricing…
    </div>
    <div v-else class="space-y-2">
      <div
        class="flex justify-between text-sm"
      >
        <span class="text-gray-500">
          Mailing:
          {{ formatNumber(householdCount) }} &times;
          ${{ perCardRate!.toFixed(2) }}
        </span>
        <span class="font-medium text-[#0b2d50]">
          {{ isCovered ? "Covered" : formatCurrency(usageCost!) }}
        </span>
      </div>
      <div
        v-if="includeCustomDesignFee"
        data-testid="custom-design-fee-line"
        class="flex justify-between text-sm"
      >
        <span class="text-gray-500">Custom design</span>
        <span class="font-medium text-[#0b2d50]">Confirmed separately</span>
      </div>
      <hr class="border-gray-200" />
      <div class="flex justify-between text-sm font-semibold">
        <span class="text-[#0b2d50]">{{ isCovered ? "Per-send charge" : "Total" }}</span>
        <span class="text-[#0b2d50]" data-testid="server-cost-total">
          {{ isCovered ? formatCurrency(0) : formatCurrency(usageCost!) }}
        </span>
      </div>
    </div>
    <p v-if="billingSummary" class="text-xs text-gray-400 mt-2" data-testid="billing-cost-semantics">
      <template v-if="isCovered">
        {{ coveredLabel }}. The server records this mailing as covered usage at
        ${{ perCardRate!.toFixed(2) }} per recipient; no per-send card charge.
      </template>
      <template v-else>
        Server-confirmed pay-per-send rate. Charged when this mailing goes to print.
      </template>
    </p>
  </div>
</template>

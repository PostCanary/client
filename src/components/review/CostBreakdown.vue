<script setup lang="ts">
import { computed } from "vue";
import type { PaymentMethodSummary } from "@/api/billing";
import { usePricing } from "@/composables/usePricing";
import { formatCurrency, formatNumber } from "@/utils/format";

const props = defineProps<{
  householdCount: number;
  sequenceLength: number;
  billingSummary: PaymentMethodSummary | null;
  // POS-149: true when the customer bought a professional design from
  // PostCanary's team ($199, Flow v2 "Postcard Design Request" brief).
  includeCustomDesignFee?: boolean;
}>();
const pricing = usePricing();
// The server prices and fulfills one approved mailing at household_count.
// sequenceLength can remain on a legacy draft, but must not multiply this quote.
const pieceCount = computed(() => props.householdCount);

const perCardRate = computed(() =>
  props.billingSummary ? props.billingSummary.unit_rate_cents / 100 : null,
);
const usageCost = computed(() =>
  perCardRate.value === null
    ? null
    : pieceCount.value * perCardRate.value,
);
const isCovered = computed(
  () => props.billingSummary?.billing_type === "internal",
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
          {{ formatNumber(pieceCount) }} physical postcards &times;
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
        <span class="text-gray-500">Custom postcard design service</span>
        <span class="font-medium text-[#0b2d50]">
          {{ formatCurrency(pricing.customDesignFee) }} paid when requested
        </span>
      </div>
      <hr class="border-gray-200" />
      <div class="flex justify-between text-sm font-semibold">
        <span class="text-[#0b2d50]">{{ isCovered ? "Credit-adjusted total" : "Due for mailing" }}</span>
        <span class="text-[#0b2d50]" data-testid="server-cost-total">
          {{ isCovered ? formatCurrency(0) : formatCurrency(usageCost!) }}
        </span>
      </div>
    </div>
    <p v-if="billingSummary" class="text-xs text-gray-400 mt-2" data-testid="billing-cost-semantics">
      <template v-if="isCovered">
        An explicit internal credit offsets this mailing. The quote still records
        ${{ perCardRate!.toFixed(2) }} per physical postcard.
      </template>
      <template v-else>
        Server-confirmed pay-as-you-go rate. The subscription fee is $0, and no
        plan or legacy subscription status offsets this send. This amount is
        authorized before recipient data is purchased and captured before
        fulfillment.
      </template>
    </p>
  </div>
</template>

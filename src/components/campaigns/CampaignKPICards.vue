<script setup lang="ts">
import type { MailCampaign } from "@/types/campaign";
import { formatOrderAmount } from "@/utils/campaignDisplay";

const props = defineProps<{
  campaign: MailCampaign;
}>();

const orderCountKeys = [
  { key: "purchased", label: "Purchased" },
  { key: "submitted", label: "Submitted" },
  { key: "delivered", label: "Delivered" },
  { key: "failed", label: "Failed" },
] as const;

function count(key: keyof NonNullable<MailCampaign["order"]>["counts"]): string {
  const value = props.campaign.order?.counts[key];
  return typeof value === "number" ? value.toLocaleString() : "—";
}
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
    <template v-if="campaign.order || campaign.orderContractPresent">
    <div
      v-for="kpi in orderCountKeys"
      :key="kpi.key"
      class="bg-white rounded-[2px] border border-gray-200 p-4"
    >
      <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">
        {{ kpi.label }}
      </div>
      <div class="text-2xl font-bold text-[var(--pc-navy,#1c2430)]">
        {{ campaign.order ? count(kpi.key) : "—" }}
      </div>
    </div>
    <div class="bg-white rounded-[2px] border border-gray-200 p-4">
      <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">Net charged</div>
      <div class="text-2xl font-bold text-[var(--pc-navy,#1c2430)]" data-testid="kpi-net-charged">
        {{ campaign.order
          ? formatOrderAmount(campaign.order.amounts.net_cents, campaign.order.amounts.currency)
          : "—" }}
      </div>
    </div>
    </template>
    <template v-else>
      <div class="bg-white rounded-[2px] border border-gray-200 p-4">
        <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">Households mailed</div>
        <div class="text-2xl font-bold text-[var(--pc-navy,#1c2430)]">
          {{ typeof campaign.householdCount === "number" ? campaign.householdCount.toLocaleString() : "—" }}
        </div>
      </div>
      <div class="bg-white rounded-[2px] border border-gray-200 p-4">
        <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">Calls received</div>
        <div class="text-2xl font-bold text-[var(--pc-navy,#1c2430)]">0</div>
      </div>
      <div class="bg-white rounded-[2px] border border-gray-200 p-4">
        <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">Revenue</div>
        <div class="text-2xl font-bold text-[var(--pc-navy,#1c2430)]">$0</div>
      </div>
      <div class="bg-white rounded-[2px] border border-gray-200 p-4">
        <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">Total spent</div>
        <div class="text-2xl font-bold text-[var(--pc-navy,#1c2430)]">{{ formatOrderAmount(Math.round((campaign.totalSpent ?? 0) * 100), "usd") }}</div>
      </div>
    </template>
  </div>
</template>

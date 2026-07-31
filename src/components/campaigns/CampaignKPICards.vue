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
    <div
      v-for="kpi in orderCountKeys"
      :key="kpi.key"
      class="bg-white rounded-xl border border-gray-200 p-4"
    >
      <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">
        {{ kpi.label }}
      </div>
      <div class="text-2xl font-bold text-[#0b2d50]">
        {{ count(kpi.key) }}
      </div>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">Net charged</div>
      <div class="text-2xl font-bold text-[#0b2d50]" data-testid="kpi-net-charged">
        {{ campaign.order
          ? formatOrderAmount(campaign.order.amounts.net_cents, campaign.order.amounts.currency)
          : "—" }}
      </div>
    </div>
  </div>
</template>

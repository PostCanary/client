<script setup lang="ts">
import type { MailCampaign } from "@/types/campaign";

defineProps<{
  campaign: MailCampaign;
}>();

const kpis = [
  { key: "households", label: "Households Mailed" },
  { key: "calls", label: "Calls Received" },
  { key: "revenue", label: "Revenue" },
  { key: "spent", label: "Total Spent" },
] as const;
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div
      v-for="kpi in kpis"
      :key="kpi.key"
      class="bg-white rounded-xl border border-gray-200 p-4"
    >
      <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">
        {{ kpi.label }}
      </div>
      <div class="text-2xl font-bold text-[#0b2d50]">
        <template v-if="kpi.key === 'households'">
          {{ campaign.householdCount.toLocaleString() }}
        </template>
        <template v-else-if="kpi.key === 'calls'">0</template>
        <template v-else-if="kpi.key === 'revenue'">$0</template>
        <template v-else-if="kpi.key === 'spent'">
          ${{ campaign.totalSpent.toFixed(2) }}
        </template>
      </div>
      <div class="text-xs text-gray-400 mt-1">
        <template v-if="kpi.key === 'calls'">
          Results come in after delivery
        </template>
        <template v-else-if="kpi.key === 'revenue'">
          Connect CRM for revenue tracking
        </template>
      </div>
    </div>
  </div>
</template>

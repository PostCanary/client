<script setup lang="ts">
import { computed } from "vue";
import type { MailCampaignOrder, MailCampaignStatus } from "@/types/campaign";
import { campaignStatusPresentation } from "@/utils/campaignDisplay";

const props = defineProps<{
  status: MailCampaignStatus;
  order?: MailCampaignOrder | null;
  orderContractPresent?: boolean;
}>();

// Prefer POS-197's durable order lifecycle; fall back to the legacy campaign
// status only when no order exists.
const config = computed(() =>
  campaignStatusPresentation({
    status: props.status,
    order: props.order ?? null,
    orderContractPresent: props.orderContractPresent,
  }),
);
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
    :class="config.color"
  >
    <span class="w-1.5 h-1.5 rounded-full" :class="config.dot" />
    {{ config.label }}
  </span>
</template>

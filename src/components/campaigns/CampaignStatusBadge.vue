<script setup lang="ts">
import { computed } from "vue";
import type { MailCampaignStatus } from "@/types/campaign";

const props = defineProps<{
  status: MailCampaignStatus;
}>();

// POS-162: map the full server status machine to short friendly labels.
// approved / records_purchased → Preparing; partner states → In production;
// in_transit → Mailed. Keep distinct labels for terminal / held / failed.
const config = computed(() => {
  switch (props.status) {
    case "approved":
    case "records_purchased":
    case "purchasing_records":
      return { label: "Preparing", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" };
    case "pending_moderation":
      return { label: "Under Review", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
    case "submitted_to_partner":
    case "in_production":
    case "printing":
      return { label: "In production", color: "bg-teal-100 text-teal-700", dot: "bg-teal-500" };
    case "in_transit":
      return { label: "Mailed", color: "bg-teal-100 text-teal-700", dot: "bg-teal-500" };
    case "delivered":
      return { label: "Delivered", color: "bg-green-100 text-green-700", dot: "bg-green-500" };
    case "returned":
      return { label: "Returned", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
    case "failed":
      return { label: "Failed", color: "bg-red-100 text-red-700", dot: "bg-red-500" };
    case "held":
      return { label: "Held", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
    case "cancelled":
      return { label: "Cancelled", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
    case "results_ready":
      return { label: "Results Ready", color: "bg-green-100 text-green-700", dot: "bg-green-500" };
    case "completed":
      return { label: "Completed", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
    case "paused":
      return { label: "Paused", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
    case "draft":
      return { label: "Draft", color: "bg-gray-100 text-gray-500", dot: "bg-gray-400" };
    default:
      return {
        label: props.status ? String(props.status).replace(/_/g, " ") : "Unknown",
        color: "bg-gray-100 text-gray-500",
        dot: "bg-gray-400",
      };
  }
});
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

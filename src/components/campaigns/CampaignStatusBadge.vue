<script setup lang="ts">
import { computed } from "vue";
import type { MailCampaignStatus } from "@/types/campaign";

const props = defineProps<{
  status: MailCampaignStatus;
}>();

const config = computed(() => {
  switch (props.status) {
    case "approved":
      return { label: "Approved", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" };
    case "printing":
      return { label: "Printing", color: "bg-teal-100 text-teal-700", dot: "bg-teal-500" };
    case "in_transit":
      return { label: "In Mail", color: "bg-teal-100 text-teal-700", dot: "bg-teal-500" };
    case "delivered":
      return { label: "Delivered", color: "bg-green-100 text-green-700", dot: "bg-green-500" };
    case "results_ready":
      return { label: "Results Ready", color: "bg-green-100 text-green-700", dot: "bg-green-500" };
    case "completed":
      return { label: "Completed", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
    case "paused":
      return { label: "Paused", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
    case "draft":
      return { label: "Draft", color: "bg-gray-100 text-gray-500", dot: "bg-gray-400" };
    default:
      return { label: props.status, color: "bg-gray-100 text-gray-500", dot: "bg-gray-400" };
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

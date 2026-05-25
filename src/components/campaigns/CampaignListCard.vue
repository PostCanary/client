<script setup lang="ts">
import { useRouter } from "vue-router";
import type { MailCampaign } from "@/types/campaign";
import CampaignStatusBadge from "./CampaignStatusBadge.vue";

const props = defineProps<{
  campaign: MailCampaign;
}>();

const emit = defineEmits<{
  (e: "pause", id: string): void;
  (e: "resume", id: string): void;
}>();

const router = useRouter();

const isPausable = ["approved", "printing", "in_transit"].includes(
  props.campaign.status,
);
const isResumable = props.campaign.status === "paused";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
</script>

<template>
  <div
    class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
    @click="router.push(`/app/campaigns/${campaign.id}`)"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <h3 class="font-semibold text-[#0b2d50] truncate">
            {{ campaign.name }}
          </h3>
          <CampaignStatusBadge :status="campaign.status" />
        </div>
        <div class="flex items-center gap-4 text-sm text-gray-500">
          <span>{{ campaign.householdCount.toLocaleString() }} households</span>
          <span>{{ campaign.sequenceLength }} card{{ campaign.sequenceLength > 1 ? "s" : "" }}</span>
          <span>${{ campaign.totalCost.toFixed(2) }}</span>
        </div>
        <div class="text-xs text-gray-400 mt-1">
          Created {{ formatDate(campaign.createdAt) }}
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 ml-4 shrink-0" @click.stop>
        <button
          class="text-sm font-medium text-[#47bfa9] hover:underline"
          @click="router.push(`/app/campaigns/${campaign.id}`)"
        >
          View
        </button>
        <button
          v-if="isPausable"
          class="text-sm font-medium text-amber-600 hover:underline"
          @click="emit('pause', campaign.id)"
        >
          Pause
        </button>
        <button
          v-if="isResumable"
          class="text-sm font-medium text-[#47bfa9] hover:underline"
          @click="emit('resume', campaign.id)"
        >
          Resume
        </button>
      </div>
    </div>
  </div>
</template>

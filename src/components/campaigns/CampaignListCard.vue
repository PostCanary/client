<script setup lang="ts">
// POS-151: campaign history card — design preview, Campaign Date, Audience
// Type, Number of Pieces Sent per the Dashboard Flow Flow-3 wireframe.
// Click anywhere on the card (outside actions) opens the "Your Campaign"
// modal; pause/resume stay inline since they're time-sensitive actions.
import type { MailCampaign } from "@/types/campaign";
import {
  campaignAudienceType,
  campaignDesignPreviewUrl,
  campaignPiecesSent,
} from "@/utils/campaignDisplay";
import CampaignStatusBadge from "./CampaignStatusBadge.vue";

const props = defineProps<{
  campaign: MailCampaign;
}>();

const emit = defineEmits<{
  (e: "open", id: string): void;
  (e: "pause", id: string): void;
  (e: "resume", id: string): void;
}>();

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
    class="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer flex gap-4"
    @click="emit('open', campaign.id)"
  >
    <!-- Design preview -->
    <div
      class="shrink-0 w-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
      style="aspect-ratio: 3 / 2"
    >
      <img
        v-if="campaignDesignPreviewUrl(campaign)"
        :src="campaignDesignPreviewUrl(campaign) as string"
        alt="Campaign design preview"
        class="h-full w-full object-cover"
        draggable="false"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center px-2 text-center"
        data-testid="campaign-list-card-preview-placeholder"
      >
        <span class="text-[10px] font-medium text-gray-400">Preview pending</span>
      </div>
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-2 mb-1 min-w-0">
          <h3 class="font-semibold text-[#0b2d50] truncate">
            {{ campaign.name }}
          </h3>
          <CampaignStatusBadge :status="campaign.status" />
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 shrink-0" @click.stop>
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

      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
        <span>{{ formatDate(campaign.createdAt) }}</span>
        <span class="capitalize">{{ campaignAudienceType(campaign) }}</span>
        <span>{{ campaignPiecesSent(campaign).toLocaleString() }} sent</span>
      </div>
    </div>
  </div>
</template>

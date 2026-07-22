<script setup lang="ts">
import { computed, ref, watch } from "vue";
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
const previewUrl = computed(() => campaignDesignPreviewUrl(props.campaign));
const previewFailed = ref(false);

watch(previewUrl, () => {
  previewFailed.value = false;
});

function handlePreviewError() {
  previewFailed.value = true;
}

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
    class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col"
    @click="emit('open', campaign.id)"
  >
    <!-- Design preview — full card width, postcard aspect -->
    <div class="w-full bg-gray-100 border-b border-gray-200" style="aspect-ratio: 3 / 2">
      <img
        v-if="previewUrl && !previewFailed"
        :src="previewUrl"
        alt="Campaign design preview"
        class="h-full w-full object-cover"
        draggable="false"
        @error="handlePreviewError"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center px-2 text-center"
        data-testid="campaign-list-card-preview-placeholder"
      >
        <span class="text-sm font-medium text-gray-400">
          {{ previewUrl ? "Preview unavailable" : "Preview pending" }}
        </span>
      </div>
    </div>

    <div class="p-4 flex-1 flex flex-col gap-2">
      <div class="flex items-start justify-between gap-3">
        <h3 class="font-semibold text-[#0b2d50] leading-snug">
          {{ campaign.name }}
        </h3>
        <CampaignStatusBadge :status="campaign.status" class="shrink-0" />
      </div>

      <div class="text-sm text-gray-500 space-y-1">
        <div class="flex justify-between">
          <span>Campaign Date</span>
          <span class="text-[#0b2d50] font-medium">{{ formatDate(campaign.createdAt) }}</span>
        </div>
        <div class="flex justify-between">
          <span>Audience Type</span>
          <span class="text-[#0b2d50] font-medium capitalize">{{ campaignAudienceType(campaign) }}</span>
        </div>
        <div class="flex justify-between">
          <span>Pieces Sent</span>
          <span class="text-[#0b2d50] font-medium">{{ campaignPiecesSent(campaign).toLocaleString() }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div
        v-if="isPausable || isResumable"
        class="mt-auto pt-2 flex justify-end"
        @click.stop
      >
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

<script setup lang="ts">
import type { MailCampaignCard, MailCampaignStatus } from "@/types/campaign";

defineProps<{
  cards: MailCampaignCard[];
  brandColors?: string[];
  campaignStatus?: MailCampaignStatus;
}>();

const steps = ["approved", "printing", "in_transit", "delivered"] as const;

const stepLabels: Record<string, string> = {
  approved: "Approved",
  printing: "Printing",
  in_transit: "In Mail",
  delivered: "Delivered",
  pending: "Scheduled",
};

function stepIndex(status: string): number {
  return steps.indexOf(status as (typeof steps)[number]);
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function previewUrl(card: MailCampaignCard): string | null {
  const url = card.previewImageUrl?.trim();
  return url && url.length > 0 ? url : null;
}
</script>

<template>
  <div class="space-y-6">
    <h3 class="text-sm font-semibold text-[#0b2d50]">Sequence Progress</h3>

    <!-- Under Review banner — shown when campaign is pending content moderation -->
    <div
      v-if="campaignStatus === 'pending_moderation'"
      class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
      role="status"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 text-amber-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      <div>
        <p class="text-sm font-semibold text-amber-800">Under Review</p>
        <p class="text-xs text-amber-700 mt-0.5">Typically within 24 hours</p>
      </div>
    </div>

    <div
      v-for="card in cards"
      :key="card.cardNumber"
      class="flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-4"
    >
      <!-- Thumbnail -->
      <div class="shrink-0 w-20">
        <div
          class="w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
          style="aspect-ratio: 3 / 2;"
        >
          <img
            v-if="previewUrl(card)"
            :src="previewUrl(card) as string"
            :alt="`Card ${card.cardNumber} preview`"
            class="h-full w-full object-cover"
            draggable="false"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center px-2 text-center"
            data-testid="campaign-card-preview-placeholder"
          >
            <span class="text-[10px] font-medium text-gray-400">Preview pending</span>
          </div>
        </div>
      </div>

      <!-- Status progression -->
      <div class="flex-1">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-[#0b2d50]">
            Card {{ card.cardNumber }}
          </span>
          <span class="text-xs text-gray-400">
            {{ card.status === "pending"
              ? `Scheduled: ${formatDate(card.scheduledDate)}`
              : card.actualSentDate
                ? `Sent: ${formatDate(card.actualSentDate)}`
                : `Est. delivery: ${formatDate(card.estimatedDeliveryDate)}`
            }}
          </span>
        </div>

        <!-- Progress steps -->
        <div class="flex items-center gap-1">
          <template v-for="(step, idx) in steps" :key="step">
            <div
              class="h-2 flex-1 rounded-full transition-colors"
              :class="
                stepIndex(card.status) >= idx
                  ? 'bg-[#47bfa9]'
                  : 'bg-gray-200'
              "
            />
          </template>
        </div>
        <div class="flex justify-between mt-1">
          <span
            v-for="step in steps"
            :key="step"
            class="text-[10px]"
            :class="
              stepIndex(card.status) >= stepIndex(step)
                ? 'text-[#47bfa9] font-medium'
                : 'text-gray-300'
            "
          >
            {{ stepLabels[step] }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// vue imports not needed — no computed/ref used in this component
import type { MailCampaignCard } from "@/types/campaign";
import PostcardPreview from "@/components/postcard/PostcardPreview.vue";

const props = defineProps<{
  cards: MailCampaignCard[];
  brandColors?: string[];
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
</script>

<template>
  <div class="space-y-6">
    <h3 class="text-sm font-semibold text-[#0b2d50]">Sequence Progress</h3>
    <div
      v-for="card in cards"
      :key="card.cardNumber"
      class="flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-4"
    >
      <!-- Thumbnail -->
      <div class="shrink-0 w-20">
        <PostcardPreview :brand-colors="brandColors" size="thumbnail" />
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

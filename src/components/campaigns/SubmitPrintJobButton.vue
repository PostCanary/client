<script setup lang="ts">
import { computed } from "vue";
import type { MailCampaign } from "@/types/campaign";

const props = defineProps<{
  campaign: MailCampaign;
  recipientCount: number;
  hasDesign: boolean;
  activePrintJobStatus?: string | null;
}>();

const emit = defineEmits<{
  (e: "open-modal"): void;
}>();

const isActiveJobBlocking = computed(() => {
  const s = props.activePrintJobStatus;
  if (!s) return false;
  return s !== "failed" && s !== "returned";
});

const disabledReason = computed<string | null>(() => {
  if (props.recipientCount === 0) {
    return "Add recipients to this campaign before submitting a print job.";
  }
  if (!props.hasDesign) {
    return "Attach a design to this campaign before submitting a print job.";
  }
  if (isActiveJobBlocking.value) {
    return "A print job is already in progress for this campaign.";
  }
  return null;
});

const isDisabled = computed(() => disabledReason.value !== null);

function onClick() {
  if (isDisabled.value) return;
  emit("open-modal");
}
</script>

<template>
  <div class="flex items-center gap-3">
    <button
      type="button"
      :disabled="isDisabled"
      :title="disabledReason ?? undefined"
      :aria-disabled="isDisabled"
      :class="[
        'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
        isDisabled
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
          : 'bg-[#47bfa9] text-white hover:bg-[#3aa893]',
      ]"
      @click="onClick"
    >
      Submit Print Job
    </button>
    <p
      v-if="disabledReason"
      class="text-xs text-gray-500"
    >
      {{ disabledReason }}
    </p>
  </div>
</template>

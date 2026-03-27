<script setup lang="ts">
import { useRouter } from "vue-router";
import type { MailCampaign } from "@/types/campaign";

const props = defineProps<{
  campaign: MailCampaign;
}>();

const emit = defineEmits<{
  (e: "pause"): void;
  (e: "resume"): void;
}>();

const router = useRouter();

const isPausable = ["approved", "printing", "in_transit"].includes(
  props.campaign.status,
);
const isResumable = props.campaign.status === "paused";
const isCompleted =
  props.campaign.status === "completed" ||
  props.campaign.status === "results_ready";

function runAgain() {
  // Create a new wizard pre-filled from this campaign
  // For Round 1: just start a new wizard
  router.push("/app/send");
}
</script>

<template>
  <div class="flex items-center gap-3">
    <button
      v-if="isPausable"
      class="px-4 py-2 text-sm font-medium border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
      @click="emit('pause')"
    >
      Pause Campaign
    </button>
    <button
      v-if="isResumable"
      class="px-4 py-2 text-sm font-medium bg-[#47bfa9] text-white rounded-lg hover:bg-[#3aa893] transition-colors"
      @click="emit('resume')"
    >
      Resume Campaign
    </button>
    <button
      v-if="isCompleted"
      class="px-4 py-2 text-sm font-medium border border-gray-200 text-[#0b2d50] rounded-lg hover:bg-gray-50 transition-colors"
      @click="runAgain"
    >
      Run Again
    </button>
  </div>
</template>

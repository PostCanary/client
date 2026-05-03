<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCampaignDetail } from "@/composables/useCampaignDetail";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import CampaignStatusBadge from "@/components/campaigns/CampaignStatusBadge.vue";
import CampaignKPICards from "@/components/campaigns/CampaignKPICards.vue";
import SequenceTimeline from "@/components/campaigns/SequenceTimeline.vue";
import CampaignActions from "@/components/campaigns/CampaignActions.vue";
import SubmitPrintJobButton from "@/components/campaigns/SubmitPrintJobButton.vue";
import PrintJobConfirmModal, {
  type PrintJobConfirmPayload,
} from "@/components/campaigns/PrintJobConfirmModal.vue";
import { usePrintJob } from "@/composables/usePrintJob";
import type { PrintJobSubmitInputs } from "@/api/printJobs";

const route = useRoute();
const router = useRouter();
const brandKitStore = useBrandKitStore();
const campaignId = route.params.id as string;
const { campaign, loading, error, fetch, pause, resume } =
  useCampaignDetail(campaignId);

const printJob = usePrintJob();
const showPrintModal = ref(false);
const printJobError = ref<string | null>(null);

const hasDesign = computed(
  () => campaign.value?.cards.every((c) => !!c.previewImageUrl) ?? false,
);
const recipientCount = computed(() => campaign.value?.householdCount ?? 0);

async function onPrintJobSubmit(payload: PrintJobConfirmPayload) {
  if (!campaign.value) return;
  printJobError.value = null;
  const inputs: PrintJobSubmitInputs = {
    campaign_id: campaign.value.id,
    design_template_id:
      campaign.value.cards[payload.cardNumber - 1]?.previewImageUrl ?? "",
    partner_id: "mock",
    return_address: payload.returnAddress,
    front_request_body: {},
    back_request_body: {},
    has_merge_fields: false,
  };
  const resultPhase = await printJob.submit(inputs);
  if (resultPhase === "failed") {
    if (printJob.existingJobId.value) {
      showPrintModal.value = false;
      router.push(`/app/print-jobs/${printJob.existingJobId.value}`);
      return;
    }
    printJobError.value =
      printJob.error.value?.message ?? "Submission failed. Please try again.";
    return;
  }
  showPrintModal.value = false;
  router.push(`/app/print-jobs/${printJob.jobId.value}`);
}

onMounted(() => {
  fetch();
  if (!brandKitStore.hydrated) brandKitStore.fetch();
});
</script>

<template>
  <!-- Loading -->
  <div v-if="loading" class="flex justify-center py-20">
    <div
      class="w-8 h-8 border-2 border-[#47bfa9] border-t-transparent rounded-full animate-spin"
    />
  </div>

  <!-- Error -->
  <div
    v-else-if="error || !campaign"
    class="text-center py-20"
  >
    <p class="text-gray-500">{{ error ?? "Campaign not found" }}</p>
    <button
      class="mt-3 text-sm text-[#47bfa9] font-medium hover:underline"
      @click="router.push('/app/campaigns')"
    >
      ← All Campaigns
    </button>
  </div>

  <!-- Campaign detail -->
  <div v-else class="max-w-5xl mx-auto py-8 px-4">
    <!-- Back link -->
    <button
      class="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
      @click="router.push('/app/campaigns')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
      </svg>
      All Campaigns
    </button>

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold text-[#0b2d50]">
          {{ campaign.name }}
        </h1>
        <CampaignStatusBadge :status="campaign.status" />
      </div>
      <div class="flex items-center gap-3">
        <SubmitPrintJobButton
          :campaign="campaign"
          :recipient-count="recipientCount"
          :has-design="hasDesign"
          :active-print-job-status="null"
          @open-modal="showPrintModal = true"
        />
        <CampaignActions
          :campaign="campaign"
          @pause="pause"
          @resume="resume"
        />
      </div>
    </div>

    <!-- Print job submission error banner -->
    <div
      v-if="printJobError"
      class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between"
      role="alert"
    >
      <span>{{ printJobError }}</span>
      <button
        class="ml-3 text-red-500 hover:text-red-700 font-medium shrink-0"
        @click="printJobError = null"
      >
        Dismiss
      </button>
    </div>

    <!-- KPI cards -->
    <CampaignKPICards :campaign="campaign" class="mb-8" />

    <!-- Sequence timeline -->
    <SequenceTimeline
      :cards="campaign.cards"
      :brand-colors="brandKitStore.brandKit?.brandColors"
      :campaign-status="campaign.status"
      class="mb-8"
    />

    <!-- Targeting summary -->
    <div class="bg-white rounded-xl border border-gray-200 p-5 mb-8">
      <h3 class="text-sm font-semibold text-[#0b2d50] mb-3">
        Targeting Summary
      </h3>
      <div class="flex items-start gap-4">
        <!-- Placeholder map rectangle -->
        <div
          class="w-48 h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center shrink-0"
        >
          <span class="text-xs text-gray-400">Map preview</span>
        </div>
        <div class="space-y-2 text-sm">
          <div>
            <span class="text-gray-500">Goal:</span>
            <span class="ml-2 text-[#0b2d50] font-medium">
              {{ campaign.goalType.replace(/_/g, " ") }}
            </span>
          </div>
          <div>
            <span class="text-gray-500">Households:</span>
            <span class="ml-2 text-[#0b2d50] font-medium">
              {{ campaign.householdCount.toLocaleString() }}
            </span>
          </div>
          <div>
            <span class="text-gray-500">Sequence:</span>
            <span class="ml-2 text-[#0b2d50] font-medium">
              {{ campaign.sequenceLength }} card{{ campaign.sequenceLength > 1 ? "s" : "" }}
            </span>
          </div>
          <div>
            <span class="text-gray-500">Total cost:</span>
            <span class="ml-2 text-[#0b2d50] font-medium">
              ${{ campaign.totalCost.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Print job confirm modal -->
    <PrintJobConfirmModal
      :open="showPrintModal"
      :org-id="campaign.orgId"
      :recipient-count="recipientCount"
      :card-count="campaign.cards.length"
      :front-preview-url="campaign.cards[0]?.previewImageUrl ?? null"
      :submitting="printJob.phase.value === 'submitting'"
      @submit="onPrintJobSubmit"
      @close="showPrintModal = false; printJobError = null"
    />
  </div>
</template>

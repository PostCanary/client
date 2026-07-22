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
import { purchaseCampaignRecords } from "@/api/mailCampaigns";
import type { PrintJobSubmitInputs } from "@/api/printJobs";
import { campaignDesignPreviewUrl } from "@/utils/campaignDisplay";
import { mediaSrc } from "@/utils/mediaSrc";

const route = useRoute();
const router = useRouter();
const brandKitStore = useBrandKitStore();
const campaignId = route.params.id as string;
const { campaign, loading, error, fetch, pause, resume } =
  useCampaignDetail(campaignId);

const printJob = usePrintJob();
const showPrintModal = ref(false);
const printJobError = ref<string | null>(null);

// Legacy sequence cards with previews (template/AI path). Empty for Flow
// v2 designSource='uploaded' — never call .every on a missing array.
const hasLegacyCards = computed(() => {
  const cards = campaign.value?.cards;
  return Array.isArray(cards) && cards.length > 0;
});
const hasDesign = computed(() => {
  const cards = campaign.value?.cards;
  if (!Array.isArray(cards) || cards.length === 0) {
    // Uploaded artwork counts as a design for print-job readiness.
    if (campaign.value?.designSource === "uploaded") {
      return !!campaign.value.uploadedAsset?.frontUrl;
    }
    return false;
  }
  return cards.every((c) => !!c.previewImageUrl);
});
const recipientCount = computed(() => {
  const n = campaign.value?.householdCount;
  return typeof n === "number" ? n : 0;
});
const hasRecipientCount = computed(
  () => typeof campaign.value?.householdCount === "number",
);

// Preview: uploaded front via design snapshot, else first card preview.
const designPreviewUrl = computed(() => {
  if (!campaign.value) return null;
  return campaignDesignPreviewUrl(campaign.value);
});
const isUploadedDesign = computed(
  () => campaign.value?.designSource === "uploaded",
);

// Ops print path only makes sense when there is a design surface to submit.
// Legacy ops path only: the modal submits /api/print_jobs with a template
// UUID, which uploaded-design campaigns don't have (their sanctioned retry
// is replaying purchase-records — see retryPrintSubmission below).
const showPrintJobControls = computed(() => hasLegacyCards.value);

// Flow v2 recovery: purchase-records replay is idempotent and re-runs the
// print bridge for a campaign held at records_purchased (e.g. the bridge
// failed after billing settled).
const showRetryPrintSubmission = computed(
  () =>
    isUploadedDesign.value && campaign.value?.status === "records_purchased",
);
const retryingPrint = ref(false);
const retryPrintError = ref<string | null>(null);

async function retryPrintSubmission() {
  if (!campaign.value || retryingPrint.value) return;
  retryingPrint.value = true;
  retryPrintError.value = null;
  try {
    await purchaseCampaignRecords(campaign.value.id, 1);
    await fetch();
  } catch (e: any) {
    retryPrintError.value =
      e?.message ?? "Retry failed — the campaign is unchanged. Try again.";
  } finally {
    retryingPrint.value = false;
  }
}

// Targeting / map block is only meaningful for area campaigns with data.
const showTargetingSummary = computed(() => {
  const c = campaign.value;
  if (!c) return false;
  if (c.targetingData && Object.keys(c.targetingData).length > 0) return true;
  // Keep a compact summary for campaigns that still have sequence/cost stats.
  return (
    typeof c.sequenceLength === "number" ||
    typeof c.totalCost === "number" ||
    typeof c.householdCount === "number"
  );
});

function formatCreatedAt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatGoal(goalType: string | null | undefined): string {
  if (!goalType) return "—";
  return String(goalType).replace(/_/g, " ");
}

async function onPrintJobSubmit(payload: PrintJobConfirmPayload) {
  if (!campaign.value) return;
  printJobError.value = null;
  const cards = campaign.value.cards ?? [];
  const inputs: PrintJobSubmitInputs = {
    campaign_id: campaign.value.id,
    design_template_id: cards[payload.cardNumber - 1]?.previewImageUrl ?? "",
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

  <!-- Campaign detail — safe for every campaign shape (legacy + Flow v2) -->
  <div v-else class="max-w-5xl mx-auto py-8 px-4" data-testid="campaign-detail">
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

    <!-- Header: name + status always present -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3 flex-wrap">
        <h1 class="text-2xl font-bold text-[#0b2d50]" data-testid="campaign-detail-name">
          {{ campaign.name }}
        </h1>
        <CampaignStatusBadge :status="campaign.status" />
      </div>
      <div class="flex items-center gap-3">
        <button
          v-if="showRetryPrintSubmission"
          type="button"
          class="bg-[#47bfa9] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#3aa893] transition-colors disabled:opacity-50"
          :disabled="retryingPrint"
          data-testid="retry-print-submission"
          @click="retryPrintSubmission"
        >
          {{ retryingPrint ? "Retrying…" : "Retry print submission" }}
        </button>
        <SubmitPrintJobButton
          v-if="showPrintJobControls"
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

    <p
      v-if="retryPrintError"
      class="mb-4 text-sm text-red-600"
      data-testid="retry-print-error"
    >
      {{ retryPrintError }}
    </p>

    <!-- Core meta: created date + recipients when available -->
    <div
      class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mb-6"
      data-testid="campaign-detail-meta"
    >
      <div>
        <span class="text-gray-500">Created:</span>
        <span class="ml-2 text-[#0b2d50] font-medium">
          {{ formatCreatedAt(campaign.createdAt) }}
        </span>
      </div>
      <div v-if="hasRecipientCount">
        <span class="text-gray-500">Recipients:</span>
        <span class="ml-2 text-[#0b2d50] font-medium" data-testid="campaign-detail-recipients">
          {{ recipientCount.toLocaleString() }}
        </span>
      </div>
      <div v-if="campaign.goalType">
        <span class="text-gray-500">Goal:</span>
        <span class="ml-2 text-[#0b2d50] font-medium capitalize">
          {{ formatGoal(campaign.goalType) }}
        </span>
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

    <!-- Design preview: uploaded front artwork or first card thumbnail -->
    <div
      v-if="designPreviewUrl || isUploadedDesign"
      class="bg-white rounded-xl border border-gray-200 p-5 mb-8"
      data-testid="campaign-detail-design"
    >
      <h3 class="text-sm font-semibold text-[#0b2d50] mb-3">Design</h3>
      <div
        class="w-full max-w-sm overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
        style="aspect-ratio: 3 / 2;"
      >
        <img
          v-if="designPreviewUrl"
          :src="designPreviewUrl"
          :alt="isUploadedDesign ? 'Uploaded design preview' : 'Campaign design preview'"
          class="h-full w-full object-cover"
          draggable="false"
          data-testid="campaign-detail-design-preview"
        />
        <div
          v-else
          class="flex h-full w-full items-center justify-center"
          data-testid="campaign-detail-design-placeholder"
        >
          <span class="text-xs font-medium text-gray-400">Preview pending</span>
        </div>
      </div>
    </div>

    <!-- KPI cards (defensive inside component for null counts) -->
    <CampaignKPICards :campaign="campaign" class="mb-8" />

    <!-- Sequence timeline — legacy card list only when cards exist -->
    <SequenceTimeline
      v-if="hasLegacyCards"
      :cards="campaign.cards"
      :brand-colors="brandKitStore.brandKit?.brandColors"
      :campaign-status="campaign.status"
      class="mb-8"
    />

    <!-- Targeting / stats summary — only when at least one field is present -->
    <div
      v-if="showTargetingSummary"
      class="bg-white rounded-xl border border-gray-200 p-5 mb-8"
    >
      <h3 class="text-sm font-semibold text-[#0b2d50] mb-3">
        {{ campaign.targetingData ? "Targeting Summary" : "Campaign Summary" }}
      </h3>
      <div class="flex items-start gap-4">
        <!-- Map placeholder only when targeting geometry exists -->
        <div
          v-if="campaign.targetingData"
          class="w-48 h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center shrink-0"
        >
          <span class="text-xs text-gray-400">Map preview</span>
        </div>
        <div class="space-y-2 text-sm">
          <div v-if="campaign.goalType">
            <span class="text-gray-500">Goal:</span>
            <span class="ml-2 text-[#0b2d50] font-medium capitalize">
              {{ formatGoal(campaign.goalType) }}
            </span>
          </div>
          <div v-if="hasRecipientCount">
            <span class="text-gray-500">Households:</span>
            <span class="ml-2 text-[#0b2d50] font-medium">
              {{ recipientCount.toLocaleString() }}
            </span>
          </div>
          <div v-if="typeof campaign.sequenceLength === 'number'">
            <span class="text-gray-500">Sequence:</span>
            <span class="ml-2 text-[#0b2d50] font-medium">
              {{ campaign.sequenceLength }} card{{ campaign.sequenceLength > 1 ? "s" : "" }}
            </span>
          </div>
          <div v-if="typeof campaign.totalCost === 'number'">
            <span class="text-gray-500">Total cost:</span>
            <span class="ml-2 text-[#0b2d50] font-medium">
              ${{ campaign.totalCost.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Print job confirm modal — only when print controls are available -->
    <PrintJobConfirmModal
      v-if="showPrintJobControls"
      :open="showPrintModal"
      :org-id="campaign.orgId"
      :recipient-count="recipientCount"
      :card-count="hasLegacyCards ? campaign.cards.length : 1"
      :front-preview-url="
        campaign.cards[0]?.previewImageUrl
          ? mediaSrc(campaign.cards[0].previewImageUrl)
          : designPreviewUrl
      "
      :submitting="printJob.phase.value === 'submitting'"
      @submit="onPrintJobSubmit"
      @close="showPrintModal = false; printJobError = null"
    />
  </div>
</template>

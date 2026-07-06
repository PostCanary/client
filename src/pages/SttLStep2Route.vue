<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import SttLStep2 from "@/components/wizard/strategies/SttLStep2.vue";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import type { AudienceCostPreview, AudienceSuppressionResult } from "@/types/audiences";

const route = useRoute();
const router = useRouter();
const draftStore = useCampaignDraftStore();

const selectedFile = ref<File | null>(null);
const approvedAudienceId = ref<string | null>(null);

const existingAudienceId = computed(() => {
  const fromParam = route.params.audienceId;
  if (typeof fromParam === "string" && fromParam.trim()) return fromParam;
  const value = route.query.audienceId;
  return typeof value === "string" && value.trim() ? value : null;
});

const audienceSource = computed<"csv" | "existing">(() =>
  existingAudienceId.value ? "existing" : "csv",
);

const campaignId = computed(() => {
  const fromQuery = route.query.campaignId;
  if (typeof fromQuery === "string" && fromQuery.trim()) return fromQuery;
  const fromParam = route.params.draftId;
  if (typeof fromParam === "string" && fromParam.trim()) return fromParam;
  return draftStore.draft?.id ?? null;
});

function ensureDraft() {
  if (draftStore.draft) return;
  draftStore.$patch({
    draft: {
      id: campaignId.value || "mock-draft-001",
      orgId: "mock-org",
      currentStep: 2,
      completedSteps: [1],
      needsReviewSteps: [],
      campaignType: "targeted",
      goal: null,
      targeting: null,
      audience: null,
      design: null,
      review: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
    loading: false,
    error: null,
  });
}

async function loadDraftIfNeeded() {
  const draftId = route.params.draftId;
  if (
    typeof draftId === "string" &&
    draftId &&
    import.meta.env.VITE_SKIP_AUTH !== "true"
  ) {
    try {
      await draftStore.resume(draftId);
      return;
    } catch {
      ensureDraft();
      return;
    }
  }
  ensureDraft();
}

function onFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  selectedFile.value = files?.[0] ?? null;
  if (selectedFile.value) {
    draftStore.setAudienceState({
      audienceSource: "csv",
      audienceId: null,
      suppressionResult: null,
      costPreview: null,
    });
  }
}

function onStateChange(state: {
  audienceId: string | null;
  audienceSource: "csv" | "existing";
  suppressionResult?: AudienceSuppressionResult | null;
  costPreview?: AudienceCostPreview | null;
}) {
  draftStore.setAudienceState(state);
}

async function onApproved(audienceId: string) {
  approvedAudienceId.value = audienceId;
  draftStore.approveAudienceState({
    audienceId,
    audienceSource: audienceSource.value,
  });

  // Resume the wizard on the design step — approveAudienceState only marks
  // step 2 complete, it doesn't move draft.currentStep (that's an explicit
  // action everywhere else in the wizard, e.g. WizardShell's Next button).
  // Persist before navigating: SendWizard re-resumes the draft from the
  // server on mount, so an unsaved currentStep would be lost on the hop.
  draftStore.goToStep(3);
  await draftStore.saveNow();

  const targetDraftId = campaignId.value;
  router.push(targetDraftId ? `/app/send/${targetDraftId}` : "/app/send");
}

function goBack() {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  router.push("/app/send");
}

onMounted(async () => {
  await loadDraftIfNeeded();
  draftStore.setAudienceState({
    audienceSource: audienceSource.value,
    audienceId: existingAudienceId.value,
  });
});
</script>

<template>
  <div class="min-h-full bg-slate-50 px-4 py-6 sm:px-6">
    <div class="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white shadow-sm">
      <div
        v-if="audienceSource === 'csv' && !selectedFile"
        class="space-y-4 p-6"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-[#47bfa9]">
            Send to a List
          </p>
          <h1 class="mt-2 text-2xl font-semibold text-[#0b2d50]">
            Upload your audience CSV
          </h1>
          <p class="mt-2 max-w-2xl text-sm text-slate-600">
            Choose the customer list you want to suppress, preview, and approve for this campaign.
          </p>
        </div>

        <label
          class="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center transition-colors hover:border-[#47bfa9] hover:bg-[#47bfa9]/5"
          data-testid="sttl-upload-dropzone"
        >
          <span class="text-sm font-medium text-[#0b2d50]">
            Drop CSV here or choose a file
          </span>
          <span class="mt-1 text-xs text-slate-500">CSV files only</span>
          <input
            class="sr-only"
            type="file"
            accept=".csv,text/csv"
            data-testid="sttl-file-input"
            @change="onFileChange"
          >
        </label>
      </div>

      <SttLStep2
        v-else
        :key="selectedFile?.name || existingAudienceId || 'sttl-step2'"
        :audience-source="audienceSource"
        :file="selectedFile || undefined"
        :existing-audience-id="existingAudienceId || undefined"
        :campaign-id="campaignId || undefined"
        @state-change="onStateChange"
        @approved="onApproved"
        @back="goBack"
      />

      <div
        v-if="approvedAudienceId"
        class="border-t border-emerald-100 bg-emerald-50 px-6 py-3 text-sm text-emerald-800"
        data-testid="sttl-approved-banner"
      >
        Audience approved for this campaign.
      </div>
    </div>
  </div>
</template>

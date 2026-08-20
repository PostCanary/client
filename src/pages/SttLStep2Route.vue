<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import SttLStep2 from "@/components/wizard/strategies/SttLStep2.vue";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useAuthStore } from "@/stores/auth";
import type { AudienceCostPreview, AudienceSuppressionResult } from "@/types/audiences";

const route = useRoute();
const router = useRouter();
const draftStore = useCampaignDraftStore();
const auth = useAuthStore();

const selectedFile = ref<File | null>(null);
const fileSelectionError = ref<string | null>(null);
const approvedAudienceId = ref<string | null>(null);
const loadError = ref(false);

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
      loadError.value = true;
      return;
    }
  }
  if (!draftStore.draft) {
    await draftStore.startNew(auth.orgId || "mock-org");
    // This route is itself the Send-to-a-List audience step. Preserve the
    // existing direct-entry convention that Step 1 is already behind it,
    // while keeping all of that state local until approval enters Step 3.
    draftStore.draft!.currentStep = 2;
    draftStore.draft!.completedSteps = [1];
  }
}

function selectCsvFile(file: File | null) {
  fileSelectionError.value = null;
  if (!file) {
    selectedFile.value = null;
    return;
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    selectedFile.value = null;
    fileSelectionError.value = "Choose a CSV file.";
    return;
  }
  selectedFile.value = file;
  draftStore.setAudienceState({
    audienceSource: "csv",
    audienceId: null,
    suppressionResult: null,
    costPreview: null,
  });
}

function onFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  selectCsvFile(files?.[0] ?? null);
}

function onFileDrop(event: DragEvent) {
  selectCsvFile(event.dataTransfer?.files?.[0] ?? null);
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

  // Step 3 is the persistence boundary. enterStepThree creates the server
  // draft, saves the approved audience state, and only then lets us navigate.
  const targetDraftId = await draftStore.enterStepThree();

  router.push(`/app/send/${targetDraftId}`);
}

async function goBack() {
  // POS-183: do not use router.back(). The dedicated STTL route is a
  // sibling of SendWizard; history back lands on /app/send with
  // currentStep still 2, and WizardShell immediately redirects here.
  const returned = await draftStore.returnToGoalSelection();
  if (!returned) return;
  await router.push(draftStore.mainWizardPath());
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
  <div
    v-if="loadError"
    class="flex min-h-full flex-col items-center justify-center px-6 text-center"
  >
    <h1 class="text-xl font-semibold text-[var(--pc-navy,#1c2430)]">Something went wrong</h1>
    <p class="mt-2 text-sm text-slate-600">We couldn't load this campaign draft.</p>
  </div>
  <div v-else class="min-h-full bg-slate-50 px-4 py-6 sm:px-6">
    <div class="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white">
      <div
        v-if="audienceSource === 'csv' && !selectedFile"
        class="space-y-4 p-6"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-[var(--pc-navy,#1c2430)]">
            Send to a List
          </p>
          <h1 class="mt-2 text-2xl font-semibold text-[var(--pc-navy,#1c2430)]">
            Upload your audience CSV
          </h1>
          <p class="mt-2 max-w-2xl text-sm text-slate-600">
            Choose the customer list you want to suppress, preview, and approve for this campaign.
          </p>
        </div>

        <label
          class="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center transition-colors hover:border-[var(--pc-canary,#facf41)] hover:bg-[rgba(250,207,65,0.10)]"
          data-testid="sttl-upload-dropzone"
          @dragenter.prevent
          @dragover.prevent
          @drop.prevent="onFileDrop"
        >
          <span class="text-sm font-medium text-[var(--pc-navy,#1c2430)]">
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
        <p
          v-if="fileSelectionError"
          class="text-sm text-red-600"
          role="alert"
          data-testid="sttl-file-error"
        >
          {{ fileSelectionError }}
        </p>

        <button
          type="button"
          class="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
          data-testid="sttl-back-btn"
          @click="goBack"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          Back
        </button>
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

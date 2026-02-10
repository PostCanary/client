<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useMessage } from "naive-ui";
import { useRoute, useRouter } from "vue-router";
import { getBatches, deleteBatch, type Batch } from "@/api/uploads";
import { useRunData } from "@/composables/useRunData";
import { useBilling } from "@/composables/useBilling";

const batches = ref<Batch[]>([]);
const loading = ref(false);
const deletingIds = ref<Set<string>>(new Set());
const refreshingDashboard = ref(false);
const message = useMessage();
const route = useRoute();
const router = useRouter();

const {
  isBillingOverlayActive,
  showBillingSuccess,
} = useBilling(route, router);

const { runResult, refreshOnce: refreshRunData, pollUntilTerminal } = useRunData();

const isPreviewMode = ref(false);

watch(
  () => runResult.value,
  (result) => {
    if (result) {
      const previewMode = result.preview_mode === true;
      if (previewMode !== isPreviewMode.value) {
        isPreviewMode.value = previewMode;
      }
    }
  },
  { immediate: true, deep: true }
);

const shouldBlur = computed(() => {
  return isBillingOverlayActive.value || (isPreviewMode.value && !showBillingSuccess.value);
});

onMounted(async () => {
  await refreshRunData();
  loadBatches();
});

async function loadBatches() {
  loading.value = true;
  try {
    batches.value = await getBatches();
  } catch (err: any) {
    console.error("[History] Failed to load batches:", err);
    message.error("Failed to load upload history. Please try again.");
  } finally {
    loading.value = false;
  }
}

async function handleDelete(batch: Batch) {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${batch.filename || batch.source}"? This will remove it from analytics and cannot be undone.`
  );
  if (!confirmed) return;

  deletingIds.value.add(batch.id);

  try {
    await deleteBatch(batch.id);
    message.success("File deleted successfully.");
    batches.value = batches.value.filter((b) => b.id !== batch.id);
  } catch (err: any) {
    console.error("[History] Failed to delete batch:", err);
    message.error(
      err?.data?.message || "Failed to delete file. Please try again."
    );
  } finally {
    deletingIds.value.delete(batch.id);
  }
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDisplayName(batch: Batch): string {
  const sourceLabel = batch.source === "mail" ? "mail" : "crm";
  const dateStr = batch.created_at ? formatDate(batch.created_at) : "";
  return `${sourceLabel} - ${dateStr}`;
}

const isEmpty = computed(() => !loading.value && batches.value.length === 0);

async function handleRefreshDashboard() {
  refreshingDashboard.value = true;
  try {
    // First refresh to get latest status
    await refreshRunData();
    
    // Check if there's a run in progress and wait for it to complete
    const finalStatus = await pollUntilTerminal({
      maxTicks: 120, // Wait up to 2 minutes
      intervalMs: 1000,
      showLoader: false, // Don't show the main loader, we have our own button
    });
    
    if (finalStatus) {
      // Run completed, refresh data one more time to get final results
      await refreshRunData();
      message.success("Dashboard refreshed successfully.");
    } else {
      // No active run or timeout, just refresh current data
      await refreshRunData();
      message.success("Dashboard refreshed.");
    }
    
    // Navigate to dashboard to show updated results
    router.push("/dashboard");
  } catch (err: any) {
    console.error("[History] Failed to refresh dashboard:", err);
    message.error("Failed to refresh dashboard. Please try again.");
  } finally {
    refreshingDashboard.value = false;
  }
}
</script>

<template>
  <div 
    class="min-h-dvh px-4 py-6 sm:px-6"
    :class="{ 'history-blurred': shouldBlur }"
  >
    <div class="mx-auto w-full max-w-3xl space-y-4">
      <header
        class="mb-2 flex items-center justify-between gap-4 border-b border-slate-200 pb-3"
      >
        <div>
          <h1 class="text-xl font-semibold text-slate-900">Upload History</h1>
          <p class="text-xs text-slate-500">
            View and manage uploaded files
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          :disabled="refreshingDashboard"
          @click="handleRefreshDashboard"
        >
          <svg
            v-if="refreshingDashboard"
            class="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <svg
            v-else
            class="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span v-if="refreshingDashboard">Refreshing...</span>
          <span v-else>Refresh Dashboard</span>
        </button>
      </header>

      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-sm text-slate-500">Loading...</div>
      </div>

      <div
        v-else-if="isEmpty"
        class="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm"
      >
        <p class="text-slate-500">No files uploaded yet.</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="batch in batches"
          :key="batch.id"
          class="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="
                  batch.source === 'mail'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                "
              >
                {{ batch.source }}
              </span>
              <span class="text-sm font-medium text-slate-900">
                {{ formatDisplayName(batch) }}
              </span>
            </div>
            <div class="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span v-if="batch.filename">{{ batch.filename }}</span>
              <span v-if="batch.raw_count !== null">
                {{ batch.raw_count.toLocaleString() }} rows
              </span>
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                :class="
                  batch.status === 'normalized'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                "
              >
                {{ batch.status }}
              </span>
            </div>
          </div>

          <button
            type="button"
            class="inline-flex items-center rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            :disabled="deletingIds.has(batch.id)"
            @click="handleDelete(batch)"
          >
            <span v-if="deletingIds.has(batch.id)">Deleting...</span>
            <span v-else>Delete</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-blurred {
  filter: blur(3px);
  opacity: 0.6;
  pointer-events: none;
  user-select: none;
  transition: filter 0.18s ease, opacity 0.18s ease;
}
</style>

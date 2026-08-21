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

function crmDuplicateCount(batch: Batch): number | null {
  if (
    batch.source !== "crm" ||
    batch.raw_count === null ||
    batch.deduped_count === null
  ) {
    return null;
  }

  return Math.max(batch.raw_count - batch.deduped_count, 0);
}

function crmDuplicateLabel(batch: Batch): string | null {
  const duplicateCount = crmDuplicateCount(batch);
  if (!duplicateCount) return null;
  return `${duplicateCount.toLocaleString()} duplicate ${
    duplicateCount === 1 ? "row" : "rows"
  } removed`;
}

const isEmpty = computed(() => !loading.value && batches.value.length === 0);

async function handleRefreshDashboard() {
  refreshingDashboard.value = true;
  try {
    await refreshRunData();

    const finalStatus = await pollUntilTerminal({
      maxTicks: 120,
      intervalMs: 1000,
      showLoader: false,
    });

    if (finalStatus) {
      await refreshRunData();
      message.success("Dashboard refreshed successfully.");
    } else {
      await refreshRunData();
      message.success("Dashboard refreshed.");
    }

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
  <div class="history-page" :class="{ 'history-blurred': shouldBlur }">
    <div class="history-inner">
      <header class="history-header">
        <div>
          <p class="history-eyebrow">Proof</p>
          <h1>Upload History</h1>
          <p class="history-lede">Mail and CRM files that power your match run.</p>
        </div>
        <button
          type="button"
          class="btn-primary"
          :disabled="refreshingDashboard"
          @click="handleRefreshDashboard"
        >
          <svg
            v-if="refreshingDashboard"
            class="btn-icon spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              class="spin-track"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="spin-head"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <svg
            v-else
            class="btn-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
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

      <div v-if="loading" class="loading-state">Loading...</div>

      <div v-else-if="isEmpty" class="empty-panel">
        <h2>No files uploaded yet</h2>
        <p>Upload mail and CRM CSVs from Dashboard or Analytics to build match proof.</p>
      </div>

      <div v-else class="batch-list">
        <article
          v-for="batch in batches"
          :key="batch.id"
          :data-testid="`history-batch-${batch.id}`"
          class="batch-card"
        >
          <div class="batch-main">
            <div class="batch-title-row">
              <span
                class="source-badge"
                :class="batch.source === 'mail' ? 'is-mail' : 'is-crm'"
              >
                {{ batch.source }}
              </span>
              <span class="batch-name">{{ formatDisplayName(batch) }}</span>
            </div>

            <div class="batch-meta">
              <span v-if="batch.filename">{{ batch.filename }}</span>
              <span
                v-if="
                  batch.source === 'crm' &&
                  batch.raw_count !== null &&
                  batch.deduped_count !== null
                "
              >
                {{ batch.raw_count.toLocaleString() }} rows uploaded
              </span>
              <span v-else-if="batch.raw_count !== null">
                {{ batch.raw_count.toLocaleString() }} rows
              </span>
              <span
                v-if="batch.source === 'crm' && batch.deduped_count !== null"
                class="meta-strong"
              >
                {{ batch.deduped_count.toLocaleString() }} unique jobs
              </span>
              <span
                v-if="crmDuplicateLabel(batch)"
                class="meta-warn"
              >
                {{ crmDuplicateLabel(batch) }}
              </span>
              <span
                class="status-badge"
                :class="
                  batch.status === 'normalized' ? 'is-ready' : 'is-pending'
                "
              >
                {{ batch.status }}
              </span>
            </div>
          </div>

          <button
            type="button"
            class="btn-danger"
            :disabled="deletingIds.has(batch.id)"
            @click="handleDelete(batch)"
          >
            <span v-if="deletingIds.has(batch.id)">Deleting...</span>
            <span v-else>Delete</span>
          </button>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-page {
  padding: 24px 16px 48px;
  transition: filter 0.18s ease, opacity 0.18s ease;
}

.history-blurred {
  filter: blur(10px);
  opacity: 0.4;
  pointer-events: none;
  user-select: none;
}

.history-inner {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--app-border, #c8d0db);
}

.history-eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--pc-canary-deep, #e5b820);
}

.history-header h1 {
  margin: 0;
  font-family: var(--pc-font-display, "Oswald", sans-serif);
  font-size: clamp(26px, 3.5vw, 32px);
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--app-text, #1c2430);
}

.history-lede {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--app-text-secondary, #5a6b7d);
}

.loading-state {
  padding: 48px 16px;
  text-align: center;
  font-size: 14px;
  color: var(--app-text-muted, #8a97a8);
}

.empty-panel {
  text-align: center;
  padding: 48px 20px;
  border: 1px solid var(--app-border, #c8d0db);
  background: var(--app-card-bg, #f7f9fb);
  border-radius: var(--app-card-radius, 2px);
  border-left: 3px solid var(--pc-canary, #facf41);
}

.empty-panel h2 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text, #1c2430);
}

.empty-panel p {
  margin: 0;
  font-size: 14px;
  color: var(--app-text-muted, #8a97a8);
}

.batch-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.batch-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  background: var(--app-card-bg, #f7f9fb);
  border: 1px solid var(--app-border, #c8d0db);
  border-radius: var(--app-card-radius, 2px);
  border-left: 3px solid var(--pc-canary, #facf41);
}

.batch-main {
  flex: 1;
  min-width: 0;
}

.batch-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.batch-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text, #1c2430);
}

.batch-meta {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  font-size: 12px;
  color: var(--app-text-muted, #8a97a8);
}

.meta-strong {
  color: var(--app-text-body, #3d4a5c);
  font-weight: 600;
}

.meta-warn {
  color: #92400e;
}

.source-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  border-radius: var(--app-card-radius, 2px);
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.source-badge.is-mail {
  background: rgba(28, 36, 48, 0.08);
  color: var(--pc-navy, #1c2430);
}

.source-badge.is-crm {
  background: rgba(250, 207, 65, 0.22);
  color: var(--pc-navy, #1c2430);
}

.status-badge.is-ready {
  background: rgba(250, 207, 65, 0.18);
  color: var(--pc-navy, #1c2430);
}

.status-badge.is-pending {
  background: #fffbeb;
  color: #92400e;
}

.btn-primary,
.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--app-card-radius, 2px);
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  white-space: nowrap;
}

.btn-primary {
  border: none;
  background: var(--app-btn-bg, #1c2430);
  color: var(--app-btn-fg, #ffffff);
}

.btn-primary:hover:not(:disabled) {
  background: var(--app-btn-bg-hover, #2a3544);
}

.btn-danger {
  border: 1px solid #fecdd3;
  background: #fff1f2;
  color: #9f1239;
}

.btn-danger:hover:not(:disabled) {
  background: #ffe4e6;
}

.btn-primary:disabled,
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.spin {
  animation: spin 0.8s linear infinite;
}

.spin-track {
  opacity: 0.25;
}

.spin-head {
  opacity: 0.75;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .batch-card {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-danger {
    width: 100%;
  }
}
</style>

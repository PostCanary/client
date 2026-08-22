<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useMessage } from "naive-ui";
import {
  approveDesignUpload,
  listPendingDesignUploads,
  rejectDesignUpload,
  type DesignModerationUpload,
} from "@/api/designModeration";
import { mediaSrc } from "@/utils/mediaSrc";
import { formatRelativeTime } from "@/utils/format";

const message = useMessage();
const uploads = ref<DesignModerationUpload[]>([]);
const page = ref(1);
const perPage = 25;
const loading = ref(false);
const loadError = ref<string | null>(null);
const busyId = ref<string | null>(null);
const rejectingId = ref<string | null>(null);
const rejectReason = ref("");
const previewFailedIds = ref<Set<string>>(new Set());
const hasNextPage = ref(false);

const isEmpty = computed(
  () => !loading.value && !loadError.value && uploads.value.length === 0,
);

async function load(nextPage = 1) {
  loading.value = true;
  loadError.value = null;
  try {
    const res = await listPendingDesignUploads({
      page: nextPage,
      per_page: perPage,
    });
    uploads.value = res.uploads;
    page.value = res.page;
    // POS-252 P2-8: prefer the server's has_next/total once it serializes
    // them — an exactly-full last page otherwise looks like it has more.
    // Fall back to the full-page heuristic until that lands.
    if (typeof res.has_next === "boolean") {
      hasNextPage.value = res.has_next;
    } else if (typeof res.total === "number") {
      hasNextPage.value = res.page * res.per_page < res.total;
    } else {
      hasNextPage.value = res.uploads.length >= res.per_page;
    }
    previewFailedIds.value = new Set();
    rejectingId.value = null;
    rejectReason.value = "";
  } catch (err: any) {
    if (err?.status === 401 || err?.status === 403) {
      loadError.value = "Not authorized";
    } else {
      loadError.value = "Could not load the moderation queue.";
    }
  } finally {
    loading.value = false;
  }
}

function markPreviewFailed(id: string) {
  const next = new Set(previewFailedIds.value);
  next.add(id);
  previewFailedIds.value = next;
}

function isImage(upload: DesignModerationUpload): boolean {
  return (upload.mime_type ?? "").startsWith("image/");
}

function removeRow(id: string) {
  uploads.value = uploads.value.filter((item) => item.id !== id);
  if (rejectingId.value === id) {
    rejectingId.value = null;
    rejectReason.value = "";
  }
}

function startReject(upload: DesignModerationUpload) {
  rejectingId.value = upload.id;
  rejectReason.value = "";
}

function cancelReject() {
  rejectingId.value = null;
  rejectReason.value = "";
}

async function approve(upload: DesignModerationUpload) {
  if (busyId.value) return;
  busyId.value = upload.id;
  try {
    await approveDesignUpload(upload.id);
    removeRow(upload.id);
    message.success(`Approved ${upload.filename}`);
  } catch (err: any) {
    if (err?.status === 409) {
      removeRow(upload.id);
      message.info("That upload is no longer pending.");
    } else if (err?.status === 404) {
      removeRow(upload.id);
      message.info("That upload is no longer in the queue.");
    } else {
      message.error(err?.message || "Could not approve that design.");
    }
  } finally {
    busyId.value = null;
  }
}

async function submitReject(upload: DesignModerationUpload) {
  if (busyId.value) return;
  const reason = rejectReason.value.trim();
  if (!reason) {
    message.error("Enter a rejection reason.");
    return;
  }
  busyId.value = upload.id;
  try {
    await rejectDesignUpload(upload.id, reason);
    removeRow(upload.id);
    message.success(`Rejected ${upload.filename}`);
  } catch (err: any) {
    if (err?.status === 409 || err?.status === 404) {
      removeRow(upload.id);
      message.info("That upload is no longer pending.");
    } else {
      message.error(err?.message || "Could not reject that design.");
    }
  } finally {
    busyId.value = null;
  }
}

onMounted(() => {
  void load(1);
});
</script>

<template>
  <div class="moderation-page" data-testid="admin-design-moderation">
    <header class="moderation-header">
      <div>
        <h1 class="moderation-title">Design moderation</h1>
        <p class="moderation-sub">
          Review customer uploads. Approve or reject each one.
        </p>
      </div>
      <button
        type="button"
        class="btn-secondary"
        :disabled="loading"
        data-testid="moderation-refresh"
        @click="load(page)"
      >
        Refresh
      </button>
    </header>

    <p v-if="loading && uploads.length === 0" class="moderation-status">
      Loading queue…
    </p>
    <p
      v-else-if="loadError"
      class="moderation-error"
      role="alert"
      data-testid="moderation-unauthorized"
    >
      {{ loadError }}
    </p>
    <p v-else-if="isEmpty" class="moderation-status" data-testid="moderation-empty">
      No designs waiting for review.
    </p>

    <ul v-else class="moderation-list">
      <li
        v-for="upload in uploads"
        :key="upload.id"
        class="moderation-row"
        :data-testid="`moderation-row-${upload.id}`"
      >
        <div class="moderation-preview">
          <img
            v-if="isImage(upload) && !previewFailedIds.has(upload.id)"
            :src="mediaSrc(upload.asset_url)"
            :alt="upload.filename"
            class="moderation-img"
            @error="markPreviewFailed(upload.id)"
          />
          <div v-else class="moderation-img-fallback">
            Preview unavailable
          </div>
        </div>

        <div class="moderation-meta">
          <p class="moderation-org">{{ upload.org_name || "Unknown org" }}</p>
          <p class="moderation-file">{{ upload.filename }}</p>
          <p class="moderation-details">
            <span>{{ upload.mime_type || "unknown type" }}</span>
            <span aria-hidden="true"> · </span>
            <span>{{ formatRelativeTime(upload.uploaded_at) }}</span>
          </p>
        </div>

        <div class="moderation-actions">
          <template v-if="rejectingId === upload.id">
            <label class="reject-label" :for="`reject-reason-${upload.id}`">
              Rejection reason
            </label>
            <textarea
              :id="`reject-reason-${upload.id}`"
              v-model="rejectReason"
              class="reject-reason"
              rows="3"
              data-testid="moderation-reject-reason"
            />
            <div class="action-row">
              <button
                type="button"
                class="btn-danger"
                :disabled="busyId === upload.id || !rejectReason.trim()"
                data-testid="moderation-reject-submit"
                @click="submitReject(upload)"
              >
                {{ busyId === upload.id ? "Rejecting…" : "Submit rejection" }}
              </button>
              <button
                type="button"
                class="btn-secondary"
                :disabled="busyId === upload.id"
                @click="cancelReject"
              >
                Cancel
              </button>
            </div>
          </template>
          <template v-else>
            <div class="action-row">
              <button
                type="button"
                class="btn-approve"
                :disabled="!!busyId"
                data-testid="moderation-approve"
                @click="approve(upload)"
              >
                {{ busyId === upload.id ? "Approving…" : "Approve" }}
              </button>
              <button
                type="button"
                class="btn-reject"
                :disabled="!!busyId"
                data-testid="moderation-reject"
                @click="startReject(upload)"
              >
                Reject
              </button>
            </div>
          </template>
        </div>
      </li>
    </ul>

    <div v-if="hasNextPage && !loadError" class="moderation-pager">
      <button
        type="button"
        class="btn-secondary"
        :disabled="loading"
        @click="load(page + 1)"
      >
        Next page
      </button>
    </div>
  </div>
</template>

<style scoped>
.moderation-page {
  max-width: 56rem;
  margin: 0 auto;
  padding: 2rem 1rem 3rem;
}

.moderation-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.moderation-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--pc-navy, #1c2430);
}

.moderation-sub {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.moderation-status,
.moderation-error {
  font-size: 0.875rem;
  color: #6b7280;
}

.moderation-error {
  color: #b91c1c;
}

.moderation-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0;
  margin: 0;
  list-style: none;
}

.moderation-row {
  display: grid;
  grid-template-columns: 7.5rem minmax(0, 1fr);
  gap: 1rem;
  padding: 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 2px;
}

@media (min-width: 640px) {
  .moderation-row {
    grid-template-columns: 7.5rem minmax(0, 1fr) 16rem;
    align-items: start;
  }
}

.moderation-preview {
  width: 7.5rem;
  height: 10rem;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #f3f4f6;
}

.moderation-img,
.moderation-img-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.moderation-img-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.75rem;
  color: #9ca3af;
}

.moderation-org {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--pc-navy, #1c2430);
}

.moderation-file {
  margin-top: 0.15rem;
  font-size: 0.875rem;
  color: #374151;
  overflow-wrap: anywhere;
}

.moderation-details {
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.moderation-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn-approve,
.btn-reject,
.btn-danger,
.btn-secondary {
  min-height: 2.75rem;
  padding: 0.5rem 1rem;
  border-radius: 2px;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-approve {
  flex: 1;
  color: #fff;
  background: var(--app-btn-bg, #1c2430);
  border: 0;
}

.btn-approve:hover:not(:disabled) {
  background: var(--app-btn-bg-hover, #2a3544);
}

.btn-reject,
.btn-secondary {
  color: var(--pc-navy, #1c2430);
  background: #fff;
  border: 1px solid #d1d5db;
}

.btn-danger {
  flex: 1;
  color: #fff;
  background: #b91c1c;
  border: 0;
}

.btn-approve:disabled,
.btn-reject:disabled,
.btn-danger:disabled,
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reject-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--pc-navy, #1c2430);
}

.reject-reason {
  width: 100%;
  padding: 0.5rem 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 2px;
  font-size: 0.875rem;
}

.moderation-pager {
  margin-top: 1rem;
}
</style>

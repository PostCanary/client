<!-- src/components/dashboard/UploadCard.vue -->
<script setup lang="ts">
import { ref, watch } from "vue";

import UploadIconUrl from "@/assets/upload.svg?url";
import { uploadBatch, type Source } from "@/api/uploads";
import { log } from "@/utils/logger";

const props = defineProps<{
  resetKey?: number;
  /**
   * When true, the Upload button should be visually disabled and
   * should not emit upload-commit (mapping must be fixed first).
   */
  mappingBlocked?: boolean;
}>();

const emit = defineEmits<{
  (
    e: "need-both-files",
    payload: { mailMissing: boolean; crmMissing: boolean }
  ): void;
  (e: "edit-mapping"): void;
  (
    e: "batch-ids",
    payload: { mailBatchId?: string | null; crmBatchId?: string | null }
  ): void;
  (
    e: "upload-commit",
    payload: { mailBatchId: string | null; crmBatchId: string | null }
  ): void;
  (
    e: "mapping-required",
    payload: {
      source: Source;
      batchId: string | null;
      errors?: Record<string, string>;
      missing?: Record<string, string> | string[];
      sampleHeaders?: string[];
      sampleRows?: Record<string, any>[];
    }
  ): void;
}>();

/* ---- state --------------------------------------- */

const mailInput = ref<HTMLInputElement | null>(null);
const crmInput = ref<HTMLInputElement | null>(null);

// Track batch IDs created by /upload/<source>/start
const mailBatchId = ref<string | null>(null);
const crmBatchId = ref<string | null>(null);

const mailDrag = ref(false);
const crmDrag = ref(false);

const isUploading = ref(false);
const uploadProgress = ref<number | null>(null);
const uploadingSource = ref<Source | null>(null);

const lastMailFile = ref<string | null>(null);
const lastCrmFile = ref<string | null>(null);

/**
 * Reset drop-zones when Dashboard bumps resetKey (after successful normalize/run).
 */
watch(
  () => props.resetKey,
  () => {
    mailBatchId.value = null;
    crmBatchId.value = null;
    lastMailFile.value = null;
    lastCrmFile.value = null;

    mailDrag.value = false;
    crmDrag.value = false;
    isUploading.value = false;
    uploadProgress.value = null;
    uploadingSource.value = null;

    if (mailInput.value) mailInput.value.value = "";
    if (crmInput.value) crmInput.value.value = "";
  }
);

/* ---- helpers ------------------------------------------------------------ */

function csvGuard(file: File): boolean {
  const ok =
    file.type?.includes("csv") || file.name.toLowerCase().endsWith(".csv");
  if (!ok) alert("Please select a CSV file.");
  return ok;
}

function clearFileInput(source: Source) {
  const el = source === "mail" ? mailInput.value : crmInput.value;
  if (el) el.value = "";
}

/**
 * Handle a file being chosen or dropped for a given source.
 * - Calls /upload/<source>/start via uploadBatch()
 * - Stores batch_id so Dashboard can later normalize/commit.
 * - If backend returns 409 mapping_required, emits mapping-required to Dashboard.
 */
async function handleFile(source: Source, file: File) {
  if (!file) return;
  if (!csvGuard(file)) return;

  isUploading.value = true;
  uploadingSource.value = source;
  uploadProgress.value = 30;

  try {
    log.info("UI ▶ upload start", {
      source,
      name: file.name,
      size: file.size,
    });

    // uploadBatch returns { status, data }
    const { status, data } = await uploadBatch(source, file);

    log.info("UI ▶ upload done", { source, status, data });

    const batchId = (data as any)?.batch_id as string | undefined;
    const filename = (data as any)?.filename as string | undefined;

    if (!batchId) {
      log.warn("UI ▶ upload response missing batch_id", {
        source,
        status,
        data,
      });
    }

    // 409 mapping_required
    if (status === 409 && (data as any)?.error === "mapping_required") {
      log.info("UI ▶ upload mapping_required", { source, status, data });

      if (source === "mail") {
        mailBatchId.value = batchId ?? null;
        lastMailFile.value = filename || file.name;
      } else {
        crmBatchId.value = batchId ?? null;
        lastCrmFile.value = filename || file.name;
      }

      emit("batch-ids", {
        mailBatchId: mailBatchId.value,
        crmBatchId: crmBatchId.value,
      });

      emit("mapping-required", {
        source,
        batchId: batchId ?? null,
        // backend: field_errors (keep fallback to errors for safety)
        errors: (data as any)?.field_errors || (data as any)?.errors || {},
        // backend: missing can be list or object depending on service
        missing: (data as any)?.missing || {},
        // backend: snake_case
        sampleHeaders:
          (data as any)?.sample_headers || (data as any)?.sampleHeaders || [],
        sampleRows:
          (data as any)?.sample_rows || (data as any)?.sampleRows || [],
      });

      // keep “uploading” UX from sticking at 100%
      uploadProgress.value = null;
      return;
    }

    // Happy path (201)
    if (source === "mail") {
      mailBatchId.value = batchId ?? null;
      lastMailFile.value = filename || file.name;
    } else {
      crmBatchId.value = batchId ?? null;
      lastCrmFile.value = filename || file.name;
    }

    emit("batch-ids", {
      mailBatchId: mailBatchId.value,
      crmBatchId: crmBatchId.value,
    });

    uploadProgress.value = 100;
  } catch (e: any) {
    log.error("UI ▶ upload failed", e);
    alert(`Upload failed: ${e?.message || "unknown error"}`);
    clearFileInput(source);
  } finally {
    isUploading.value = false;
    uploadingSource.value = null;
  }
}

/* ---- file input -------------------------------------------------- */
function onPick(source: Source) {
  const el = source === "mail" ? mailInput.value : crmInput.value;
  const f = el?.files?.[0];
  if (f) void handleFile(source, f);
}

/* ---- drag & drop (drop-zone) ------------------------------------------- */
function onDragOverMail(e: DragEvent) {
  e.preventDefault();
  mailDrag.value = true;
}
function onDragLeaveMail() {
  mailDrag.value = false;
}
function onDropMail(e: DragEvent) {
  e.preventDefault();
  mailDrag.value = false;
  const f = e.dataTransfer?.files?.[0];
  if (f) void handleFile("mail", f);
}

function onDragOverCrm(e: DragEvent) {
  e.preventDefault();
  crmDrag.value = true;
}
function onDragLeaveCrm() {
  crmDrag.value = false;
}
function onDropCrm(e: DragEvent) {
  e.preventDefault();
  crmDrag.value = false;
  const f = e.dataTransfer?.files?.[0];
  if (f) void handleFile("crm", f);
}

/* ---- mapper ------------------------------- */
function openMapper() {
  log.info("UI ▶ open mapper clicked", {
    mailBatchId: mailBatchId.value,
    crmBatchId: crmBatchId.value,
  });

  emit("batch-ids", {
    mailBatchId: mailBatchId.value,
    crmBatchId: crmBatchId.value,
  });

  emit("edit-mapping");
}

/* ---- Upload button ------------------------------- */
function onUpload(ev?: Event) {
  ev?.preventDefault?.();

  if (props.mappingBlocked) {
    log.info("UI ▶ upload blocked due to mapping issues");
    return;
  }

  const hasMail = !!mailBatchId.value;
  const hasCrm = !!crmBatchId.value;

  // IMPORTANT: emit correct missing flags even when only one is missing
  if (!hasMail || !hasCrm) {
    emit("need-both-files", {
      mailMissing: !hasMail,
      crmMissing: !hasCrm,
    });
    return;
  }

  emit("upload-commit", {
    mailBatchId: mailBatchId.value,
    crmBatchId: crmBatchId.value,
  });
}

/* ---- browse buttons ------------------------------------------- */
function browseMail() {
  mailInput.value?.click();
}
function browseCrm() {
  crmInput.value?.click();
}
</script>

<template>
  <section class="upload-card card">
    <!-- MAIL -->
    <div class="row">
      <h3 class="row-title">Mail CSV</h3>

      <div
        class="drop-zone"
        :class="{ 'is-drag': mailDrag }"
        role="button"
        tabindex="0"
        @click="browseMail"
        @dragover="onDragOverMail"
        @dragleave="onDragLeaveMail"
        @drop="onDropMail"
      >
        <div class="drop-zone-inner">
          <img :src="UploadIconUrl" alt="" class="icon" />

          <p class="drop-zone-text">
            Drag &amp; drop your mail CSV here<br />
            <span class="drop-zone-text-muted">or click to browse</span>
          </p>

          <p v-if="lastMailFile" class="last-file">
            Selected: <strong>{{ lastMailFile }}</strong>
          </p>
        </div>
      </div>

      <input
        id="mailCsv"
        ref="mailInput"
        class="sr-only"
        type="file"
        accept=".csv,text/csv"
        @change="onPick('mail')"
      />
    </div>

    <!-- CRM -->
    <div class="row">
      <h3 class="row-title">CRM CSV</h3>

      <div
        class="drop-zone"
        :class="{ 'is-drag': crmDrag }"
        role="button"
        tabindex="0"
        @click="browseCrm"
        @dragover="onDragOverCrm"
        @dragleave="onDragLeaveCrm"
        @drop="onDropCrm"
      >
        <div class="drop-zone-inner">
          <img :src="UploadIconUrl" alt="" class="icon" />

          <p class="drop-zone-text">
            Drag &amp; drop your CRM CSV here<br />
            <span class="drop-zone-text-muted">or click to browse</span>
          </p>

          <p v-if="lastCrmFile" class="last-file">
            Selected: <strong>{{ lastCrmFile }}</strong>
          </p>
        </div>
      </div>

      <input
        id="crmCsv"
        ref="crmInput"
        class="sr-only"
        type="file"
        accept=".csv,text/csv"
        @change="onPick('crm')"
      />
    </div>

    <!-- PROGRESS -->
    <div class="mt-2 text-sm text-slate-300" v-if="isUploading">
      <div class="h-2 bg-slate-800 rounded">
        <div
          class="h-2 bg-emerald-500 rounded transition-all"
          :style="{ width: (uploadProgress ?? 30) + '%' }"
        ></div>
      </div>
      <p class="mt-1">
        Uploading
        <span v-if="uploadingSource === 'mail'">Mail CSV</span>
        <span v-else-if="uploadingSource === 'crm'">CRM CSV</span>
        <span v-else>CSV</span>
        … this may take a moment for large files.
      </p>
    </div>

    <!-- ACTIONS -->
    <div class="row row-actions">
      <!-- Edit Mapping button hidden - mapping popup opens automatically when required -->
      <button
        v-if="false"
        type="button"
        class="btn btn-secondary"
        :disabled="isUploading"
        @click="openMapper"
      >
        Edit Mapping
      </button>

      <button
        type="button"
        class="btn btn-primary"
        :disabled="isUploading || !!props.mappingBlocked"
        :title="
          props.mappingBlocked
            ? 'Please fix column mapping before attempting an upload'
            : ''
        "
        @click="onUpload"
      >
        Upload
      </button>
    </div>
  </section>
</template>

<style scoped>
.upload-card {
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(12, 45, 80, 0.08),
    0 10px 24px rgba(12, 45, 80, 0.06);
  background: #fff;
  padding: 16px 16px 14px;
}

.row {
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: center;
  gap: 16px;
  padding: 8px 4px;
}
.row + .row {
  margin-top: 10px;
}

.row-title {
  color: #0c2d50;
  font-weight: 600;
  font-size: 18px;
  justify-self: center;
}

.drop-zone {
  position: relative;
  background: #f4f5f7;
  border-radius: 10px;
  box-shadow: inset 0 1px 0 rgba(12, 45, 80, 0.06);
  min-height: 128px;
  padding: 18px 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
}

.drop-zone.is-drag {
  outline: 2px dashed #47bfa9;
  background: #eef7f5;
}

.drop-zone-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.icon {
  width: 32px;
  height: 32px;
  opacity: 0.9;
}

.drop-zone-text {
  font-size: 13px;
  color: #243b53;
  line-height: 1.3;
}

.drop-zone-text-muted {
  color: #829ab1;
  font-size: 12px;
}

.last-file {
  margin-top: 4px;
  font-size: 12px;
  color: #52606d;
}

.row-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  align-items: center;
  margin-top: 12px;
}

.btn {
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 16px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: #47bfa9;
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: default;
}

.btn-secondary {
  background: #e4e7eb;
  color: #243b53;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: default;
}

/* screen-reader only input */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>

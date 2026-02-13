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
    log.info("UI > upload start", {
      source,
      name: file.name,
      size: file.size,
    });

    // uploadBatch returns { status, data }
    const { status, data } = await uploadBatch(source, file);

    log.info("UI > upload done", { source, status, data });

    const batchId = (data as any)?.batch_id as string | undefined;
    const filename = (data as any)?.filename as string | undefined;

    if (!batchId) {
      log.warn("UI > upload response missing batch_id", {
        source,
        status,
        data,
      });
    }

    // 409 mapping_required
    if (status === 409 && (data as any)?.error === "mapping_required") {
      log.info("UI > upload mapping_required", { source, status, data });

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

      // keep "uploading" UX from sticking at 100%
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
    log.error("UI > upload failed", e);
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

/* ---- clear file ------------------------------------------- */
function clearMail() {
  mailBatchId.value = null;
  lastMailFile.value = null;
  if (mailInput.value) mailInput.value.value = "";
  emit("batch-ids", {
    mailBatchId: null,
    crmBatchId: crmBatchId.value,
  });
}

function clearCrm() {
  crmBatchId.value = null;
  lastCrmFile.value = null;
  if (crmInput.value) crmInput.value.value = "";
  emit("batch-ids", {
    mailBatchId: mailBatchId.value,
    crmBatchId: null,
  });
}

/* ---- mapper ------------------------------- */
function openMapper() {
  log.info("UI > open mapper clicked", {
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
    log.info("UI > upload blocked due to mapping issues");
    return;
  }

  const hasMail = !!mailBatchId.value;
  const hasCrm = !!crmBatchId.value;

  // Allow upload with at least one file (single-file uploads are now supported)
  if (!hasMail && !hasCrm) {
    // This shouldn't happen since button would be disabled, but handle gracefully
    log.warn("UI > upload attempted with no files");
    return;
  }

  // Emit upload-commit even with single file (backend will handle incremental matching)
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
  <section class="upload-card">
    <div class="upload-header">
      <span class="upload-title">Upload Files</span>
    </div>

    <div class="drop-zones">
      <!-- MAIL zone -->
      <div class="drop-col">
        <span class="drop-label">Mail CSV</span>

        <div
          v-if="!lastMailFile"
          class="drop-zone"
          :class="{ 'is-drag': mailDrag }"
          role="button"
          tabindex="0"
          @click="browseMail"
          @dragover="onDragOverMail"
          @dragleave="onDragLeaveMail"
          @drop="onDropMail"
        >
          <img :src="UploadIconUrl" alt="" class="drop-icon" />
          <span class="drop-text">
            Drop CSV here or <span class="drop-link">browse</span>
          </span>
        </div>

        <!-- File selected chip -->
        <div v-else class="file-chip">
          <svg class="file-chip-icon" viewBox="0 0 16 16" fill="none">
            <path d="M4 8l3 3 5-6" stroke="#47bfa9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="file-chip-name">{{ lastMailFile }}</span>
          <button class="file-chip-x" @click.stop="clearMail" title="Remove file">&times;</button>
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

      <!-- Divider -->
      <div class="drop-divider"></div>

      <!-- CRM zone -->
      <div class="drop-col">
        <span class="drop-label">CRM CSV</span>

        <div
          v-if="!lastCrmFile"
          class="drop-zone"
          :class="{ 'is-drag': crmDrag }"
          role="button"
          tabindex="0"
          @click="browseCrm"
          @dragover="onDragOverCrm"
          @dragleave="onDragLeaveCrm"
          @drop="onDropCrm"
        >
          <img :src="UploadIconUrl" alt="" class="drop-icon" />
          <span class="drop-text">
            Drop CSV here or <span class="drop-link">browse</span>
          </span>
        </div>

        <!-- File selected chip -->
        <div v-else class="file-chip">
          <svg class="file-chip-icon" viewBox="0 0 16 16" fill="none">
            <path d="M4 8l3 3 5-6" stroke="#47bfa9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="file-chip-name">{{ lastCrmFile }}</span>
          <button class="file-chip-x" @click.stop="clearCrm" title="Remove file">&times;</button>
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
    </div>

    <!-- PROGRESS -->
    <div class="upload-progress" v-if="isUploading">
      <div class="progress-track">
        <div
          class="progress-fill"
          :style="{ width: (uploadProgress ?? 30) + '%' }"
        ></div>
      </div>
      <p class="progress-text">
        Uploading
        <span v-if="uploadingSource === 'mail'">Mail CSV</span>
        <span v-else-if="uploadingSource === 'crm'">CRM CSV</span>
        <span v-else>CSV</span>
        ...
      </p>
    </div>

    <!-- ACTIONS -->
    <div class="upload-actions">
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
        Upload &amp; Match
      </button>
    </div>
  </section>
</template>

<style scoped>
.upload-card {
  background: var(--app-card-bg, #fff);
  border-radius: var(--app-card-radius, 12px);
  box-shadow: var(--app-card-shadow, 0 1px 3px rgba(12,45,80,.06), 0 8px 24px rgba(12,45,80,.04));
  padding: 0;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.upload-header {
  padding: 14px 20px 10px;
}

.upload-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
}

/* Drop zones container */
.drop-zones {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0;
  padding: 0 16px;
  flex: 1;
  align-items: stretch;
}

.drop-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 4px 12px;
}

.drop-divider {
  width: 1px;
  background: var(--app-border, #e2e8f0);
  margin: 8px 12px;
}

.drop-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text-secondary, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.drop-zone {
  border: 2px dashed rgba(12, 45, 80, 0.15);
  border-radius: 10px;
  min-height: 72px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
  flex: 1;
}

.drop-zone:hover {
  border-color: rgba(12, 45, 80, 0.25);
  background: rgba(12, 45, 80, 0.02);
}

.drop-zone.is-drag {
  border-color: var(--app-teal, #47bfa9);
  background: rgba(71, 191, 169, 0.06);
}

.drop-icon {
  width: 24px;
  height: 24px;
  opacity: 0.5;
}

.drop-text {
  font-size: 12px;
  color: var(--app-text-body, #475569);
  text-align: center;
  line-height: 1.3;
}

.drop-link {
  color: var(--app-teal, #47bfa9);
  font-weight: 500;
}

/* File selected chip */
.file-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(71, 191, 169, 0.08);
  border: 1px solid rgba(71, 191, 169, 0.2);
  border-radius: 8px;
  padding: 10px 12px;
  flex: 1;
}

.file-chip-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.file-chip-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text, #0c2d50);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.file-chip-x {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: var(--app-text-muted, #94a3b8);
  padding: 0 2px;
  flex-shrink: 0;
}

.file-chip-x:hover {
  color: var(--app-text, #0c2d50);
}

/* Progress */
.upload-progress {
  padding: 8px 20px;
}

.progress-track {
  height: 4px;
  background: var(--app-border, #e2e8f0);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--app-teal, #47bfa9);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--app-text-muted, #94a3b8);
  margin-top: 4px;
}

/* Actions */
.upload-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--app-border, #e2e8f0);
}

.btn {
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 20px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.btn-primary {
  background: var(--app-teal, #47bfa9);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--app-teal-hover, #3aa893);
}

.btn-primary:disabled {
  opacity: 0.5;
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

@media (max-width: 640px) {
  .drop-zones {
    grid-template-columns: 1fr;
  }

  .drop-divider {
    width: auto;
    height: 1px;
    margin: 4px 0;
  }
}
</style>

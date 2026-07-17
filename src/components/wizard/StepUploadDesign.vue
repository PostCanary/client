<!--
  Flow v2 (POS-147/148): wizard step 3, "Upload Your Design". Replaces the
  StepDesign studio in the funnel — StepDesign.vue itself is untouched and
  still lives at src/components/wizard/StepDesign.vue for its dev-route
  harness (/dev/step-design-fold).

  Two paths, mutually exclusive on the draft (setting one clears the other,
  see useCampaignDraftStore setUploadedDesign / setDesignRequest):
    1. Upload your own front/back artwork (PDF/PNG/JPEG, print-spec gated).
    2. Pay $199 for a professional design — opens a request modal, the
       brief is stored on the draft and POSTed to /api/design-requests.
-->
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useMessage } from "naive-ui";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useAuthStore } from "@/stores/auth";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { usePricing } from "@/composables/usePricing";
import { postJson } from "@/api/http";
import type { UploadedDesignAsset, DesignRequestBrief } from "@/types/campaign";

const draftStore = useCampaignDraftStore();
const auth = useAuthStore();
const brandKitStore = useBrandKitStore();
const pricing = usePricing();
const message = useMessage();

// --- Print-spec gate ---------------------------------------------------
// 6x9in postcard, 0.125in bleed/side -> full-bleed artwork is 6.25x9.25in.
// At 300dpi that's 1875x2775px (portrait) or 2775x1875px (landscape/back
// design flipped sideways) — either orientation is accepted, aspect ratio
// must be within 2% of 9.25:6.25.
const TARGET_W = 1875;
const TARGET_H = 2775;
const RATIO_TOLERANCE = 0.02;
const ACCEPTED_MIME = ["application/pdf", "image/png", "image/jpeg"];
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB

type FileCheck = { ok: true } | { ok: false; message: string };

function validateFileTypeAndSize(file: File): FileCheck {
  if (!ACCEPTED_MIME.includes(file.type)) {
    return {
      ok: false,
      message: `"${file.name}" isn't a supported file type. Please upload a PDF, PNG, or JPEG.`,
    };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      message: `"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)}MB — please upload a file under 20MB.`,
    };
  }
  return { ok: true };
}

function validateImageDimensions(width: number, height: number): FileCheck {
  const portraitRatio = TARGET_W / TARGET_H;
  const landscapeRatio = TARGET_H / TARGET_W;
  const actualRatio = width / height;
  const matchesPortrait = Math.abs(actualRatio - portraitRatio) / portraitRatio <= RATIO_TOLERANCE;
  const matchesLandscape = Math.abs(actualRatio - landscapeRatio) / landscapeRatio <= RATIO_TOLERANCE;

  if (!matchesPortrait && !matchesLandscape) {
    return {
      ok: false,
      message: `Your image is ${width}x${height} — postcards print at ${TARGET_W}x${TARGET_H} pixels (300 DPI) for a full-bleed 6x9 postcard. Please upload artwork matching the postcard's aspect ratio.`,
    };
  }

  const meetsMinSize = matchesPortrait
    ? width >= TARGET_W && height >= TARGET_H
    : width >= TARGET_H && height >= TARGET_W;

  if (!meetsMinSize) {
    return {
      ok: false,
      message: `Your image is ${width}x${height} — postcards print at ${TARGET_W}x${TARGET_H} pixels (300 DPI) for a full-bleed 6x9 postcard. Please upload a higher-resolution file.`,
    };
  }

  return { ok: true };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

function readImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = dataUrl;
  });
}

// --- Dropzones -----------------------------------------------------------
interface LocalFileState {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  widthPx: number | null;
  heightPx: number | null;
  dataUrl: string | null;
}

const frontFile = ref<LocalFileState | null>(null);
const backFile = ref<LocalFileState | null>(null);
const frontError = ref<string | null>(null);
const backError = ref<string | null>(null);
const frontDragging = ref(false);
const backDragging = ref(false);
const frontProcessing = ref(false);
const backProcessing = ref(false);
const frontInputEl = ref<HTMLInputElement | null>(null);
const backInputEl = ref<HTMLInputElement | null>(null);

function commitUpload() {
  if (!frontFile.value) return;
  const asset: UploadedDesignAsset = {
    fileName: frontFile.value.fileName,
    mimeType: frontFile.value.mimeType,
    fileSizeBytes: frontFile.value.fileSizeBytes,
    widthPx: frontFile.value.widthPx,
    heightPx: frontFile.value.heightPx,
    frontDataUrl: frontFile.value.dataUrl,
    backDataUrl: backFile.value?.dataUrl ?? null,
  };
  draftStore.setUploadedDesign(asset);
}

async function handleFile(file: File, side: "front" | "back") {
  const errorRef = side === "front" ? frontError : backError;
  const processingRef = side === "front" ? frontProcessing : backProcessing;
  errorRef.value = null;

  const typeCheck = validateFileTypeAndSize(file);
  if (!typeCheck.ok) {
    errorRef.value = typeCheck.message;
    return;
  }

  processingRef.value = true;
  try {
    const isPdf = file.type === "application/pdf";
    let dataUrl: string;
    try {
      dataUrl = await readFileAsDataUrl(file);
    } catch {
      errorRef.value = `Couldn't read "${file.name}". Please try again.`;
      return;
    }

    let widthPx: number | null = null;
    let heightPx: number | null = null;
    if (isPdf) {
      // TODO: PDF dimension parsing isn't implemented (would need a pdf.js
      // dependency) — accepted on type/size alone, dimensions recorded as
      // null. Print-spec compliance for PDFs is assumed for now.
    } else {
      let dims: { width: number; height: number };
      try {
        dims = await readImageDimensions(dataUrl);
      } catch {
        errorRef.value = `Couldn't read "${file.name}" as an image. Please try a different file.`;
        return;
      }
      const dimCheck = validateImageDimensions(dims.width, dims.height);
      if (!dimCheck.ok) {
        errorRef.value = dimCheck.message;
        return;
      }
      widthPx = dims.width;
      heightPx = dims.height;
    }

    const state: LocalFileState = {
      fileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
      widthPx,
      heightPx,
      dataUrl,
    };
    if (side === "front") {
      frontFile.value = state;
    } else {
      backFile.value = state;
    }
    commitUpload();
  } finally {
    processingRef.value = false;
  }
}

function onFileInputChange(e: Event, side: "front" | "back") {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) void handleFile(file, side);
}

function onDrop(e: DragEvent, side: "front" | "back") {
  if (side === "front") frontDragging.value = false;
  else backDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) void handleFile(file, side);
}

function replaceFront() {
  frontFile.value = null;
  frontError.value = null;
  if (frontInputEl.value) frontInputEl.value.value = "";
}

function replaceBack() {
  backFile.value = null;
  backError.value = null;
  if (backInputEl.value) backInputEl.value.value = "";
}

// --- Design request modal --------------------------------------------
const showDesignRequestModal = ref(false);
const submittingRequest = ref(false);
const requestForm = reactive({
  fullName: "",
  email: "",
  phone: "",
  websiteAddress: "",
  template: null as 1 | 2 | 3 | 4 | null,
  notes: "",
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const canSubmitDesignRequest = computed(() => {
  return (
    requestForm.fullName.trim().length > 0 &&
    EMAIL_RE.test(requestForm.email.trim()) &&
    requestForm.template !== null
  );
});

function openDesignRequestModal() {
  const existingRequest = draftStore.draft?.design?.designRequest;
  if (!existingRequest) {
    if (!requestForm.fullName) {
      requestForm.fullName = auth.userName && auth.userName !== "User" ? auth.userName : "";
    }
    if (!requestForm.email) {
      requestForm.email = auth.userEmail ?? "";
    }
    if (!requestForm.websiteAddress) {
      requestForm.websiteAddress = brandKitStore.brandKit?.websiteUrl ?? "";
    }
  }
  showDesignRequestModal.value = true;
}

function closeDesignRequestModal() {
  showDesignRequestModal.value = false;
}

function selectTemplate(id: 1 | 2 | 3 | 4) {
  requestForm.template = id;
}

async function submitDesignRequest() {
  if (!canSubmitDesignRequest.value || submittingRequest.value) return;
  submittingRequest.value = true;
  try {
    const brief: DesignRequestBrief = {
      fullName: requestForm.fullName.trim(),
      email: requestForm.email.trim(),
      phone: requestForm.phone.trim(),
      websiteAddress: requestForm.websiteAddress.trim(),
      template: requestForm.template as 1 | 2 | 3 | 4,
      notes: requestForm.notes.trim(),
      submittedAt: new Date().toISOString(),
    };
    // Completes step 3 immediately — the network call below is
    // fire-and-forget and must not gate the wizard on server availability.
    draftStore.setDesignRequest(brief);
    showDesignRequestModal.value = false;

    postJson("/api/design-requests", {
      ...brief,
      draftId: draftStore.draft?.id ?? null,
    }).catch(() => {
      message.error(
        "Your design request was saved, but we couldn't notify our design team yet. We'll retry automatically.",
      );
    });
  } finally {
    submittingRequest.value = false;
  }
}

// --- Hydration (resuming a draft that already has a choice made) -----
onMounted(() => {
  const design = draftStore.draft?.design;
  const asset = design?.uploadedAsset;
  if (asset) {
    frontFile.value = {
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      fileSizeBytes: asset.fileSizeBytes,
      widthPx: asset.widthPx,
      heightPx: asset.heightPx,
      dataUrl: asset.frontDataUrl,
    };
    if (asset.backDataUrl) {
      backFile.value = {
        fileName: "Back design",
        mimeType: "",
        fileSizeBytes: 0,
        widthPx: null,
        heightPx: null,
        dataUrl: asset.backDataUrl,
      };
    }
  }
  const request = design?.designRequest;
  if (request) {
    requestForm.fullName = request.fullName;
    requestForm.email = request.email;
    requestForm.phone = request.phone;
    requestForm.websiteAddress = request.websiteAddress;
    requestForm.template = request.template;
    requestForm.notes = request.notes;
  }
});

const designSource = computed(() => draftStore.draft?.design?.designSource ?? null);
const designRequestSummary = computed(() => draftStore.draft?.design?.designRequest ?? null);
</script>

<template>
  <div class="px-4 sm:px-6 py-6 max-w-2xl mx-auto">
    <!-- Background content — blurs/dims while the design-request modal is open -->
    <div
      data-testid="upload-design-content"
      :class="showDesignRequestModal ? 'upload-design-content--blurred' : ''"
    >
      <h1 class="text-xl font-semibold text-[#0b2d50] mb-1">Upload Your Design</h1>
      <p class="text-sm text-gray-500 mb-6">
        Upload print-ready artwork for your postcard, or have our team design one for you.
      </p>

      <!-- Front dropzone (required) -->
      <div class="mb-5">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-[#0b2d50]">Front design</span>
          <span class="text-xs text-gray-400">Required</span>
        </div>

        <div v-if="frontFile" class="border border-gray-200 rounded-xl p-4 flex items-center gap-4" data-testid="upload-front-preview">
          <img
            v-if="frontFile.dataUrl && frontFile.mimeType.startsWith('image/')"
            :src="frontFile.dataUrl"
            alt="Front design preview"
            class="w-20 h-28 object-cover rounded-lg border border-gray-100 shrink-0"
          />
          <div v-else class="w-20 h-28 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0 text-gray-400 text-xs">
            PDF
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-[#0b2d50] truncate">{{ frontFile.fileName }}</p>
            <p class="text-xs text-gray-400">
              {{ frontFile.widthPx && frontFile.heightPx ? `${frontFile.widthPx}x${frontFile.heightPx}px` : 'PDF file' }}
            </p>
          </div>
          <button
            type="button"
            class="text-sm font-semibold text-[#47bfa9] hover:text-[#3aa893] shrink-0"
            data-testid="upload-front-replace"
            @click="replaceFront"
          >
            Replace
          </button>
        </div>

        <label
          v-else
          class="block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
          :class="frontDragging ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
          data-testid="upload-front-dropzone"
          @dragover.prevent="frontDragging = true"
          @dragleave.prevent="frontDragging = false"
          @drop.prevent="onDrop($event, 'front')"
        >
          <input
            ref="frontInputEl"
            type="file"
            class="sr-only"
            accept="application/pdf,image/png,image/jpeg"
            data-testid="upload-front-input"
            @change="onFileInputChange($event, 'front')"
          />
          <p class="text-sm text-gray-500">
            {{ frontProcessing ? 'Checking your file…' : 'Drag & drop your front design, or click to browse' }}
          </p>
          <p class="text-xs text-gray-400 mt-1">PDF, PNG, or JPEG — 1875x2775px minimum (300 DPI, full bleed)</p>
        </label>
        <p v-if="frontError" class="text-xs text-red-600 mt-2" data-testid="upload-front-error">{{ frontError }}</p>
      </div>

      <!-- Back dropzone (optional) -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-[#0b2d50]">Back design</span>
          <span class="text-xs text-gray-400">Optional</span>
        </div>

        <div v-if="backFile" class="border border-gray-200 rounded-xl p-4 flex items-center gap-4" data-testid="upload-back-preview">
          <img
            v-if="backFile.dataUrl && backFile.mimeType.startsWith('image/')"
            :src="backFile.dataUrl"
            alt="Back design preview"
            class="w-20 h-28 object-cover rounded-lg border border-gray-100 shrink-0"
          />
          <div v-else class="w-20 h-28 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0 text-gray-400 text-xs">
            {{ backFile.mimeType === 'application/pdf' ? 'PDF' : 'File' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-[#0b2d50] truncate">{{ backFile.fileName }}</p>
            <p class="text-xs text-gray-400">
              {{ backFile.widthPx && backFile.heightPx ? `${backFile.widthPx}x${backFile.heightPx}px` : '' }}
            </p>
          </div>
          <button
            type="button"
            class="text-sm font-semibold text-[#47bfa9] hover:text-[#3aa893] shrink-0"
            data-testid="upload-back-replace"
            @click="replaceBack"
          >
            Replace
          </button>
        </div>

        <label
          v-else
          class="block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
          :class="backDragging ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
          data-testid="upload-back-dropzone"
          @dragover.prevent="backDragging = true"
          @dragleave.prevent="backDragging = false"
          @drop.prevent="onDrop($event, 'back')"
        >
          <input
            ref="backInputEl"
            type="file"
            class="sr-only"
            accept="application/pdf,image/png,image/jpeg"
            data-testid="upload-back-input"
            @change="onFileInputChange($event, 'back')"
          />
          <p class="text-sm text-gray-500">
            {{ backProcessing ? 'Checking your file…' : 'Drag & drop your back design, or click to browse (optional)' }}
          </p>
          <p class="text-xs text-gray-400 mt-1">Leave blank for a blank back</p>
        </label>
        <p v-if="backError" class="text-xs text-red-600 mt-2" data-testid="upload-back-error">{{ backError }}</p>
      </div>

      <!-- Requested-design summary -->
      <div
        v-if="designSource === 'requested' && designRequestSummary"
        class="mb-4 rounded-xl border border-[#47bfa9]/30 bg-[#47bfa9]/5 p-4"
        data-testid="design-request-summary"
      >
        <p class="text-sm font-semibold text-[#0b2d50]">Design request submitted</p>
        <p class="text-xs text-gray-500 mt-1">
          Our team will reach out to {{ designRequestSummary.email }} to design your postcard (Template {{ designRequestSummary.template }}).
        </p>
      </div>

      <div class="text-center pt-2 border-t border-gray-100">
        <button
          type="button"
          class="text-sm text-gray-500 hover:text-[#47bfa9] transition-colors mt-4"
          data-testid="buy-design-link"
          @click="openDesignRequestModal"
        >
          Or buy a design from our team of professional designers (${{ pricing.customDesignFee }})
        </button>
      </div>
    </div>

    <!-- Postcard Design Request modal -->
    <div v-if="showDesignRequestModal" class="design-request-overlay" data-testid="design-request-modal">
      <div class="design-request-backdrop" data-testid="design-request-backdrop" @click="closeDesignRequestModal"></div>

      <div class="design-request-modal">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-[#0b2d50]">Postcard Design Request</h2>
            <p class="text-xs text-gray-500 mt-1">${{ pricing.customDesignFee }} — our team designs your postcard for you.</p>
          </div>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600"
            aria-label="Close"
            data-testid="design-request-close"
            @click="closeDesignRequestModal"
          >
            ✕
          </button>
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="submitDesignRequest">
          <div class="field">
            <label>Full Name</label>
            <input v-model="requestForm.fullName" type="text" placeholder="Joe Martinez" data-testid="design-request-fullname" />
          </div>
          <div class="field">
            <label>Email</label>
            <input v-model="requestForm.email" type="email" placeholder="joe@example.com" data-testid="design-request-email" />
          </div>
          <div class="field">
            <label>Phone Number</label>
            <input v-model="requestForm.phone" type="tel" placeholder="(555) 555-5555" data-testid="design-request-phone" />
          </div>
          <div class="field">
            <label>Website Address</label>
            <input v-model="requestForm.websiteAddress" type="text" placeholder="joesplumbing.com" data-testid="design-request-website" />
          </div>
          <div class="field">
            <label>Pick a Template</label>
            <div class="grid grid-cols-4 gap-2 mt-1">
              <button
                v-for="id in [1, 2, 3, 4] as const"
                :key="id"
                type="button"
                class="template-btn"
                :class="requestForm.template === id ? 'template-btn--active' : ''"
                :data-testid="`design-request-template-${id}`"
                @click="selectTemplate(id)"
              >
                Template {{ id }}
              </button>
            </div>
          </div>
          <div class="field">
            <label>Notes for the Designer</label>
            <textarea
              v-model="requestForm.notes"
              rows="3"
              placeholder="Anything our designers should know?"
              data-testid="design-request-notes"
            />
          </div>

          <button
            type="submit"
            class="submit-btn"
            :disabled="!canSubmitDesignRequest || submittingRequest"
            data-testid="design-request-submit"
          >
            {{ submittingRequest ? 'Submitting…' : 'Submit' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-design-content--blurred {
  filter: blur(10px);
  opacity: 0.4;
  pointer-events: none;
}

.design-request-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
}

.design-request-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(6px);
}

.design-request-modal {
  position: relative;
  z-index: 61;
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  margin: 0 16px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.04);
  padding: 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
}

.field input,
.field textarea {
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 10px 12px;
  font-size: 14px;
  color: #1e293b;
  font-family: inherit;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: #47bfa9;
  box-shadow: 0 0 0 2px rgba(71, 191, 169, 0.15);
}

.template-btn {
  padding: 10px 8px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
}

.template-btn:hover {
  border-color: #47bfa9;
}

.template-btn--active {
  border-color: #47bfa9;
  background: rgba(71, 191, 169, 0.08);
  color: #0f172a;
}

.submit-btn {
  border-radius: 999px;
  border: none;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  background: #47bfa9;
  color: #ffffff;
  cursor: pointer;
  transition: background 0.15s;
}

.submit-btn:hover:not(:disabled) {
  background: #3aa893;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>

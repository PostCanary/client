<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type {
  CardDesign,
  BrandKit,
  BrandKitPhoto,
  BrandKitReview,
  ColorOverride,
  HeadlineLines,
} from "@/types/campaign";
import { hasAnyLine, splitHeadline } from "@/utils/headlineSplit";
import { COLOR_PALETTES, isCompleteOverride, isValidHex } from "@/data/colorPalettes";
import { getPhotosForIndustry } from "@/data/stockPhotos";
import { editZonesFor } from "@/data/templateEditZones";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import {
  getMediaFeatures,
  searchStockPhotos,
  type StockPhotoResult,
} from "@/api/brandKit";
import { onMounted } from "vue";
import { API_BASE } from "@/api/http";

/**
 * Brand-kit photos store relative /media/... URLs; the API host serves
 * them. On same-origin deployments API_BASE is "" and this is a no-op; on
 * cross-origin deployments (Vercel preview + Railway API) the browser
 * would otherwise resolve them against the SPA host and 404 — which is
 * why picker thumbnails showed alt text while the rendered card (whose
 * URLs the server absolutizes) was fine.
 */
function mediaSrc(url: string): string {
  return url && url.startsWith("/") ? `${API_BASE}${url}` : url;
}

const props = defineProps<{
  card: CardDesign;
  brandKit: BrandKit | null;
  /** Click-to-edit: set by StepDesign when a card hotspot is clicked. */
  requestedEditor?: { editor: "headline" | "offer" | "photo" | "review"; ts: number } | null;
}>();

const emit = defineEmits<{
  (e: "update-field", field: string, value: string): void;
  (e: "update-headline-lines", lines: HeadlineLines): void;
  (e: "update-colors", colors: ColorOverride | null): void;
  (e: "update-photo", url: string): void;
  (e: "open-template-browser"): void;
  (e: "reset"): void;
  (e: "info-saved"): void;
}>();

type EditorType = "headline" | "offer" | "review" | "photo" | "colors" | null;
const activeEditor = ref<EditorType>(null);

// --- Color profiles (S72) --------------------------------------------------
const customColors = ref<ColorOverride>({
  primary: props.card.colorOverride?.primary ?? "#d63a2f",
  secondary: props.card.colorOverride?.secondary ?? "#2a7de1",
  accent: props.card.colorOverride?.accent ?? "#f5b50a",
});

watch(
  () => props.card.colorOverride,
  (next) => {
    if (next) customColors.value = { ...next };
  },
);

function isActivePalette(palette: ColorOverride): boolean {
  const o = props.card.colorOverride;
  return Boolean(
    o &&
      o.primary === palette.primary &&
      o.secondary === palette.secondary &&
      o.accent === palette.accent,
  );
}

// --- Brand color editing (S72: edit org colors from the designer) ----------
// Saves to the brand kit (PUT /api/brand-kit), so EVERY card that uses
// "my brand colors" picks the change up — unlike palettes, which are
// per-card overrides.
const editingBrandColors = ref(false);
const savingBrandColors = ref(false);
const brandColorError = ref<string | null>(null);
const brandColorDraft = ref<ColorOverride>({
  primary: "#d63a2f",
  secondary: "#2a7de1",
  accent: "#f5b50a",
});

function toggleBrandColorEditor() {
  if (!editingBrandColors.value) {
    const bc = props.brandKit?.brandColors ?? [];
    brandColorDraft.value = {
      primary: bc[0] && isValidHex(bc[0]) ? bc[0] : "#d63a2f",
      secondary: bc[1] && isValidHex(bc[1]) ? bc[1] : "#2a7de1",
      accent: bc[2] && isValidHex(bc[2]) ? bc[2] : "#f5b50a",
    };
    brandColorError.value = null;
  }
  editingBrandColors.value = !editingBrandColors.value;
}

async function saveBrandColors() {
  if (savingBrandColors.value) return;
  savingBrandColors.value = true;
  brandColorError.value = null;
  try {
    await brandKitStore.update({
      brandColors: [
        brandColorDraft.value.primary,
        brandColorDraft.value.secondary,
        brandColorDraft.value.accent,
      ],
    });
    if (brandKitStore.error) {
      brandColorError.value = brandKitStore.error;
      return;
    }
    editingBrandColors.value = false;
    // Put the active card on brand colors so the change shows right away,
    // and refresh the authoritative render.
    emit("update-colors", null);
    emit("info-saved");
  } finally {
    savingBrandColors.value = false;
  }
}

function applyPalette(palette: ColorOverride | null) {
  emit(
    "update-colors",
    palette ? { primary: palette.primary, secondary: palette.secondary, accent: palette.accent } : null,
  );
}

function onCustomColor(slot: keyof ColorOverride, value: string) {
  customColors.value = { ...customColors.value, [slot]: value };
  if (isCompleteOverride(customColors.value)) {
    emit("update-colors", { ...customColors.value });
  }
}

// Photo-free layouts (bold-graphic, review-forward) have no photo slot —
// the zone map is the single source of truth for which surfaces exist.
const layoutUsesPhoto = computed(() =>
  editZonesFor(props.card.renderTemplateId ?? null, props.card.cardPurpose).some(
    (z) => z.editor === "photo",
  ),
);

function toggleEditor(editor: EditorType) {
  activeEditor.value = activeEditor.value === editor ? null : editor;
}

// Click-to-edit: open the editor the card hotspot asked for. The ts field
// retriggers the watcher when the same zone is clicked twice.
watch(
  () => props.requestedEditor,
  (req) => {
    if (req?.editor) activeEditor.value = req.editor;
  },
);

// Line-level editing (S72): the headline editor exposes the card's five
// text slots directly — what you click is what you edit, empty slots stay
// empty on the print (no template filler). Legacy cards that predate
// headlineLines get their slots derived once from the joined headline.
function linesForCard(): HeadlineLines {
  const stored = props.card.resolvedContent.headlineLines;
  if (hasAnyLine(stored)) return { ...(stored as HeadlineLines) };
  return splitHeadline(props.card.resolvedContent.headline);
}

const editableLines = ref<HeadlineLines>(linesForCard());
const editableOffer = ref(props.card.resolvedContent.offerText);

const HEADLINE_LINE_FIELDS: {
  key: keyof HeadlineLines;
  label: string;
  max: number;
}[] = [
  { key: "red1", label: "Top line", max: 26 },
  { key: "red2", label: "Top line 2", max: 26 },
  { key: "bridge", label: "Connector (small text)", max: 32 },
  { key: "blue1", label: "Main line", max: 24 },
  { key: "blue2", label: "Main line 2", max: 24 },
];

// Re-sync inline editor buffers when the active card changes OR when
// the server-derived resolvedContent for the active card is replaced
// (Reset to Original does this without bumping cardNumber). S60 Bug
// #1+#2: before this fix, watch only fired on cardNumber change, so
// Reset to Original cleared the preview PNG but left editableHeadline/
// editableOffer holding stale typed text; typing one character after
// Reset replayed the stale buffer and re-corrupted the card silently.
// Typing-loop safety: when user types, applyHeadline emits update-field,
// parent mutates override, computed resolvedContent updates to the same
// string the user typed, watch fires, ref is assigned the same value
// (no-op for Vue reactivity, does not disrupt caret). See Codex S61
// LOW 7 trace verification + S60 Codex Session 57 HIGH 1 (Card 2 switch
// sync) still covered via cardNumber in the key.
watch(
  () => [
    props.card.cardNumber,
    props.card.resolvedContent.headline,
    JSON.stringify(props.card.resolvedContent.headlineLines ?? null),
    props.card.resolvedContent.offerText,
  ],
  () => {
    editableLines.value = linesForCard();
    editableOffer.value = props.card.resolvedContent.offerText;
  },
);

function applyLines() {
  emit("update-headline-lines", { ...editableLines.value });
}

function applyOffer() {
  emit("update-field", "offerText", editableOffer.value);
}

// --- Photo picker ---------------------------------------------------------
// Brand photos first (mirrors the printReady filter from usePostcardGenerator
// so operators never see low-quality scraped icons as pickable options).
// Stock photos from the industry fallback are appended so customers with a
// photo-poor brand kit still have options beyond their own library.
type PickerPhoto = { url: string; alt: string; source: "brand" | "stock" };

const pickerPhotos = computed<PickerPhoto[]>(() => {
  const bk = props.brandKit;
  if (!bk) return [];
  const brand: PickerPhoto[] = (bk.photos ?? [])
    .filter((p: BrandKitPhoto) => p.printReady !== false)
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .map((p) => ({ url: p.url, alt: p.alt, source: "brand" as const }));
  const stock: PickerPhoto[] = getPhotosForIndustry(bk.industry).map((p) => ({
    url: p.url,
    alt: p.description,
    source: "stock" as const,
  }));
  return [...brand, ...stock];
});

const currentPhotoUrl = computed(
  () =>
    (props.card.overrides.photoUrl as string | undefined) ??
    props.card.resolvedContent.photoUrl ??
    "",
);

function applyPhoto(url: string) {
  emit("update-photo", url);
}

// --- Stock photo search (Pexels; S72) ---------------------------------------
const stockQuery = ref("");
const stockResults = ref<StockPhotoResult[]>([]);
const stockSearching = ref(false);
const stockImportingId = ref<number | null>(null);
const stockError = ref<string | null>(null);
const stockConfigured = ref(false);
const stockSearched = ref(false);

// --- AI image generation (fal.ai; S72) --------------------------------------
const aiConfigured = ref(false);
const aiPrompt = ref("");
const aiGenerating = ref(false);
const aiError = ref<string | null>(null);

onMounted(async () => {
  try {
    const features = await getMediaFeatures();
    stockConfigured.value = features.stockConfigured;
    aiConfigured.value = features.aiConfigured;
  } catch {
    // Feature probe failing should never break the panel — both sections
    // simply stay hidden.
  }
});

async function generateAiPhoto() {
  const prompt = aiPrompt.value.trim();
  if (!prompt || aiGenerating.value) return;
  aiGenerating.value = true;
  aiError.value = null;
  try {
    const url = await brandKitStore.generateAiPhoto(prompt);
    if (url) {
      applyPhoto(url);
      aiPrompt.value = "";
    } else {
      aiError.value = brandKitStore.error || "Image generation failed";
    }
  } finally {
    aiGenerating.value = false;
  }
}

async function searchStock() {
  const q = stockQuery.value.trim();
  if (!q || stockSearching.value) return;
  stockSearching.value = true;
  stockError.value = null;
  try {
    const res = await searchStockPhotos(q);
    stockConfigured.value = res.configured;
    stockResults.value = res.photos;
    stockSearched.value = true;
  } catch (e: any) {
    stockError.value = e?.data?.error || e?.message || "Search failed";
  } finally {
    stockSearching.value = false;
  }
}

async function importStock(photo: StockPhotoResult) {
  if (stockImportingId.value !== null) return;
  stockImportingId.value = photo.id;
  stockError.value = null;
  try {
    const url = await brandKitStore.importStockPhoto(photo.fullUrl, photo.alt);
    if (url) {
      applyPhoto(url);
    } else {
      stockError.value = brandKitStore.error || "Import failed";
    }
  } finally {
    stockImportingId.value = null;
  }
}

// --- Photo upload (designer-side; Phase 0.2a) ------------------------------
const brandKitStore = useBrandKitStore();
const photoInput = ref<HTMLInputElement | null>(null);
const uploadingPhoto = ref(false);
const photoUploadError = ref<string | null>(null);

function pickPhotoFile() {
  photoInput.value?.click();
}

async function onPhotoFilePicked(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  photoUploadError.value = null;
  uploadingPhoto.value = true;
  try {
    const url = await brandKitStore.uploadPhoto(file);
    if (url) {
      // Select the fresh upload for this card right away.
      applyPhoto(url);
    } else {
      photoUploadError.value =
        brandKitStore.error || "Upload failed — try a JPG, PNG, or WebP.";
    }
  } finally {
    uploadingPhoto.value = false;
  }
}

// --- Review picker --------------------------------------------------------
const pickerReviews = computed<BrandKitReview[]>(
  () => props.brandKit?.reviews ?? [],
);

const currentReviewQuote = computed(
  () => props.card.resolvedContent.reviewQuote ?? "",
);

function applyReview(review: BrandKitReview) {
  emit("update-field", "reviewQuote", review.quote);
  emit("update-field", "reviewerName", review.reviewerName);
}

// --- Business info completion (skipped-onboarding rescue) ------------------
// The card PRINTS the phone number and a QR code derived from phone/website.
// A brand kit fresh out of a skipped onboarding has neither; instead of an
// unexplained "Preview unavailable", collect it right here. Saving goes
// through the normal brand-kit update path, which regenerates the QR.
const missingPhone = computed(() => !(props.brandKit?.phone ?? "").trim());
const infoPhone = ref("");
const savingInfo = ref(false);
const infoError = ref<string | null>(null);

async function saveBusinessInfo() {
  const phone = infoPhone.value.trim();
  if (!phone) return;
  infoError.value = null;
  savingInfo.value = true;
  try {
    await brandKitStore.update({ phone });
    if (brandKitStore.error) {
      infoError.value = brandKitStore.error;
      return;
    }
    emit("info-saved");
  } finally {
    savingInfo.value = false;
  }
}

// --- Review add (designer-side; Phase 0.2b) --------------------------------
const addingReview = ref(false);
const newReviewText = ref("");
const newReviewName = ref("");
const newReviewRating = ref(5);
const savingReview = ref(false);
const reviewAddError = ref<string | null>(null);

async function saveNewReview() {
  const text = newReviewText.value.trim();
  if (!text) return;
  reviewAddError.value = null;
  savingReview.value = true;
  const countBefore = pickerReviews.value.length;
  try {
    await brandKitStore.addReview(
      text,
      newReviewName.value.trim(),
      newReviewRating.value,
    );
    if (brandKitStore.error) {
      reviewAddError.value = brandKitStore.error;
      return;
    }
    // Apply the just-added review to the card and reset the form.
    const added =
      pickerReviews.value[countBefore] ??
      pickerReviews.value[pickerReviews.value.length - 1];
    if (added) applyReview(added);
    newReviewText.value = "";
    newReviewName.value = "";
    newReviewRating.value = 5;
    addingReview.value = false;
  } finally {
    savingReview.value = false;
  }
}
</script>

<template>
  <div class="w-80 border-l border-gray-200 p-4 overflow-y-auto bg-white">
    <h3 class="text-sm font-semibold text-[#0b2d50] mb-4">Edit Card</h3>

    <!-- Business-info completion: the phone prints on the card; collect it
         here when onboarding was skipped instead of failing the preview. -->
    <div
      v-if="missingPhone"
      data-testid="business-info-prompt"
      class="mb-3 p-3 rounded-lg border border-amber-300 bg-amber-50 space-y-2"
    >
      <div class="text-xs font-medium text-amber-800">
        Your phone number appears on the postcard — add it to finish your design.
      </div>
      <input
        v-model="infoPhone"
        data-testid="business-info-phone"
        type="tel"
        maxlength="20"
        placeholder="(555) 555-0123"
        class="w-full border border-amber-200 rounded-lg px-2 py-1.5 text-xs bg-white"
      />
      <div v-if="infoError" class="text-[11px] text-red-500">{{ infoError }}</div>
      <button
        type="button"
        data-testid="business-info-save"
        class="w-full px-3 py-1.5 rounded-lg bg-[#47bfa9] text-white text-xs font-medium hover:bg-[#3aa893] transition-colors disabled:opacity-60"
        :disabled="savingInfo || !infoPhone.trim()"
        @click="saveBusinessInfo"
      >
        {{ savingInfo ? "Saving…" : "Save & update preview" }}
      </button>
    </div>

    <div class="space-y-2">
      <!-- Edit Headline -->
      <button
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'headline' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('headline')"
      >
        Edit Headline
      </button>
      <div v-if="activeEditor === 'headline'" class="px-3 pb-3 space-y-2">
        <p class="text-[11px] text-gray-500">
          Each line below is one line on the card. Leave a line blank to
          remove it from the card.
        </p>
        <div v-for="field in HEADLINE_LINE_FIELDS" :key="field.key">
          <label class="text-[10px] uppercase tracking-wide text-gray-400">
            {{ field.label }}
          </label>
          <input
            v-model="editableLines[field.key]"
            type="text"
            :maxlength="field.max"
            :data-testid="`headline-line-${field.key}`"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            @input="applyLines"
          />
        </div>
      </div>

      <!-- Edit Offer -->
      <button
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'offer' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('offer')"
      >
        Edit Offer
      </button>
      <div v-if="activeEditor === 'offer'" class="px-3 pb-3">
        <textarea
          v-model="editableOffer"
          maxlength="200"
          rows="3"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
          @input="applyOffer"
        />
        <div class="text-[10px] text-gray-400 mt-1 text-right">
          {{ editableOffer.length }}/200
        </div>
      </div>

      <!-- Change Photo (hidden on layouts with no photo slot —
           bold-graphic / review-forward) -->
      <button
        v-if="layoutUsesPhoto"
        data-testid="edit-photo-toggle"
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'photo' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('photo')"
      >
        Change Photo
      </button>
      <div v-if="layoutUsesPhoto && activeEditor === 'photo'" class="px-3 pb-3 space-y-2">
        <input
          ref="photoInput"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          class="hidden"
          data-testid="photo-upload-input"
          @change="onPhotoFilePicked"
        />
        <button
          type="button"
          data-testid="photo-upload-button"
          class="w-full text-center px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-600 hover:border-[#47bfa9] hover:text-[#0b2d50] transition-colors disabled:opacity-60"
          :disabled="uploadingPhoto"
          @click="pickPhotoFile"
        >
          {{ uploadingPhoto ? "Uploading…" : "Upload a photo (JPG, PNG, WebP)" }}
        </button>
        <div v-if="photoUploadError" class="text-[11px] text-red-500">
          {{ photoUploadError }}
        </div>
        <div v-if="pickerPhotos.length === 0" class="text-xs text-gray-400 py-1">
          No photos yet — upload one above, or add brand photos in onboarding.
        </div>
        <div v-else class="grid grid-cols-3 gap-2">
          <button
            v-for="(photo, i) in pickerPhotos"
            :key="photo.url"
            :data-testid="`photo-option-${i}`"
            :data-source="photo.source"
            :data-active="photo.url === currentPhotoUrl ? 'true' : 'false'"
            class="relative aspect-square rounded-md overflow-hidden border-2 transition-colors"
            :class="photo.url === currentPhotoUrl ? 'border-[#47bfa9]' : 'border-transparent hover:border-gray-300'"
            :title="photo.alt"
            @click="applyPhoto(photo.url)"
          >
            <img :src="mediaSrc(photo.url)" :alt="photo.alt" class="w-full h-full object-cover" />
            <span
              v-if="photo.source === 'stock'"
              class="absolute bottom-0 right-0 text-[8px] font-medium bg-gray-900/70 text-white px-1 rounded-tl"
            >Stock</span>
          </button>
        </div>

        <!-- Stock photo search (Pexels; S72) -->
        <div v-if="stockConfigured" class="pt-2 border-t border-gray-100">
          <p class="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
            Search stock photos
          </p>
          <div class="flex gap-1">
            <input
              v-model="stockQuery"
              type="text"
              placeholder="e.g. AC technician, cozy living room"
              data-testid="stock-search-input"
              class="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
              @keydown.enter.prevent="searchStock"
            />
            <button
              type="button"
              data-testid="stock-search-button"
              class="px-3 py-1.5 rounded-lg bg-[#0b2d50] text-white text-xs disabled:opacity-50"
              :disabled="stockSearching || !stockQuery.trim()"
              @click="searchStock"
            >
              {{ stockSearching ? "…" : "Search" }}
            </button>
          </div>
          <div v-if="stockError" class="text-[11px] text-red-500 mt-1">
            {{ stockError }}
          </div>
          <div
            v-if="stockSearched && stockResults.length === 0 && !stockSearching"
            class="text-xs text-gray-400 mt-2"
          >
            No results — try a different search.
          </div>
          <div v-if="stockResults.length" class="grid grid-cols-3 gap-1.5 mt-2 max-h-56 overflow-y-auto">
            <button
              v-for="photo in stockResults"
              :key="photo.id"
              type="button"
              :data-testid="`stock-result-${photo.id}`"
              class="relative aspect-square rounded-md overflow-hidden border-2 border-transparent hover:border-[#47bfa9] transition-colors disabled:opacity-60"
              :disabled="stockImportingId !== null"
              :title="photo.alt || photo.photographer"
              @click="importStock(photo)"
            >
              <img :src="photo.thumbUrl" :alt="photo.alt" class="w-full h-full object-cover" loading="lazy" />
              <span
                v-if="stockImportingId === photo.id"
                class="absolute inset-0 grid place-items-center bg-white/70 text-[10px] font-medium text-gray-700"
              >Adding…</span>
            </button>
          </div>
        </div>

        <!-- AI image generation (fal.ai; S72) -->
        <div v-if="aiConfigured" class="pt-2 border-t border-gray-100">
          <p class="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
            Generate a photo with AI
          </p>
          <textarea
            v-model="aiPrompt"
            rows="2"
            maxlength="400"
            placeholder="Describe the photo — e.g. technician installing an AC unit outside a sunny suburban home"
            data-testid="ai-image-prompt"
            class="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs resize-none"
          />
          <button
            type="button"
            data-testid="ai-image-generate"
            class="w-full mt-1 px-3 py-2 rounded-lg bg-[#0b2d50] text-white text-xs disabled:opacity-50"
            :disabled="aiGenerating || !aiPrompt.trim()"
            @click="generateAiPhoto"
          >
            {{ aiGenerating ? "Generating… (can take ~20s)" : "Generate photo" }}
          </button>
          <div v-if="aiError" class="text-[11px] text-red-500 mt-1">
            {{ aiError }}
          </div>
        </div>
      </div>

      <!-- Colors (S72 color profiles) -->
      <button
        data-testid="edit-colors-toggle"
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'colors' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('colors')"
      >
        Colors
      </button>
      <div v-if="activeEditor === 'colors'" class="px-3 pb-3 space-y-2">
        <button
          data-testid="palette-brand"
          class="w-full text-left p-2 rounded-md border text-xs transition-colors"
          :class="!card.colorOverride ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
          @click="applyPalette(null)"
        >
          <span class="font-medium">My brand colors</span>
          <span class="text-gray-400 ml-1">(default)</span>
        </button>
        <button
          type="button"
          data-testid="edit-brand-colors-toggle"
          class="w-full text-left text-[11px] text-gray-500 hover:text-[#0b2d50] px-2"
          @click="toggleBrandColorEditor"
        >
          {{ editingBrandColors ? "Close brand color editor" : "Edit my brand colors" }}
        </button>
        <div
          v-if="editingBrandColors"
          class="p-2 rounded-md border border-gray-200 space-y-2"
        >
          <p class="text-[10px] text-gray-500">
            These are your organization's colors — saving updates every card
            that uses "My brand colors".
          </p>
          <div class="flex gap-2">
            <label
              v-for="slot in (['primary', 'secondary', 'accent'] as const)"
              :key="slot"
              class="flex-1"
            >
              <span class="block text-[10px] text-gray-400 capitalize">{{ slot }}</span>
              <input
                type="color"
                v-model="brandColorDraft[slot]"
                :data-testid="`brand-color-${slot}`"
                class="w-full h-8 rounded border border-gray-200 cursor-pointer"
              />
            </label>
          </div>
          <button
            type="button"
            data-testid="brand-colors-save"
            class="w-full px-3 py-2 rounded-lg bg-[#0b2d50] text-white text-xs disabled:opacity-50"
            :disabled="savingBrandColors"
            @click="saveBrandColors"
          >
            {{ savingBrandColors ? "Saving…" : "Save brand colors" }}
          </button>
          <div v-if="brandColorError" class="text-[11px] text-red-500">
            {{ brandColorError }}
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="palette in COLOR_PALETTES"
            :key="palette.id"
            :data-testid="`palette-${palette.id}`"
            :data-active="isActivePalette(palette) ? 'true' : 'false'"
            class="text-left p-2 rounded-md border text-xs transition-colors"
            :class="isActivePalette(palette) ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
            @click="applyPalette(palette)"
          >
            <span class="flex gap-1 mb-1">
              <span class="w-4 h-4 rounded-sm" :style="{ backgroundColor: palette.primary }" />
              <span class="w-4 h-4 rounded-sm" :style="{ backgroundColor: palette.secondary }" />
              <span class="w-4 h-4 rounded-sm" :style="{ backgroundColor: palette.accent }" />
            </span>
            {{ palette.name }}
          </button>
        </div>
        <div class="pt-1">
          <p class="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Custom</p>
          <div class="flex gap-2">
            <label
              v-for="slot in (['primary', 'secondary', 'accent'] as const)"
              :key="slot"
              class="flex-1"
            >
              <span class="block text-[10px] text-gray-400 capitalize">{{ slot }}</span>
              <input
                type="color"
                :value="customColors[slot]"
                :data-testid="`custom-color-${slot}`"
                class="w-full h-8 rounded border border-gray-200 cursor-pointer"
                @input="onCustomColor(slot, ($event.target as HTMLInputElement).value)"
              />
            </label>
          </div>
        </div>
      </div>

      <!-- Change Review -->
      <button
        data-testid="edit-review-toggle"
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'review' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('review')"
      >
        Change Review
      </button>
      <div v-if="activeEditor === 'review'" class="px-3 pb-3 space-y-2">
        <div v-if="pickerReviews.length === 0 && !addingReview" class="text-xs text-gray-400 py-1">
          No reviews yet — add one below.
        </div>
        <div v-if="pickerReviews.length > 0" class="space-y-2">
          <button
            v-for="(review, i) in pickerReviews"
            :key="i"
            :data-testid="`review-option-${i}`"
            :data-active="review.quote === currentReviewQuote ? 'true' : 'false'"
            class="w-full text-left p-2 rounded-md border text-xs transition-colors"
            :class="review.quote === currentReviewQuote ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
            @click="applyReview(review)"
          >
            <div class="font-medium text-[#0b2d50] mb-0.5">
              {{ "★".repeat(Math.max(0, Math.min(5, Math.round(review.rating ?? 5)))) }}
              <span class="text-gray-500 font-normal">— {{ review.reviewerName || "Anon" }}</span>
            </div>
            <div class="text-gray-600 line-clamp-2">"{{ review.quote }}"</div>
          </button>
        </div>

        <button
          v-if="!addingReview"
          type="button"
          data-testid="review-add-button"
          class="w-full text-center px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-600 hover:border-[#47bfa9] hover:text-[#0b2d50] transition-colors"
          @click="addingReview = true"
        >
          ＋ Add a customer review
        </button>
        <div v-else class="space-y-2 border border-gray-200 rounded-lg p-2">
          <textarea
            v-model="newReviewText"
            data-testid="review-add-text"
            maxlength="500"
            rows="3"
            placeholder="Paste the customer's review…"
            class="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs resize-none"
          />
          <input
            v-model="newReviewName"
            data-testid="review-add-name"
            type="text"
            maxlength="60"
            placeholder="Customer name (e.g. Maria S.)"
            class="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
          />
          <select
            v-model.number="newReviewRating"
            data-testid="review-add-rating"
            class="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
          >
            <option v-for="n in [5, 4, 3, 2, 1]" :key="n" :value="n">
              {{ "★".repeat(n) }} ({{ n }}/5)
            </option>
          </select>
          <div v-if="reviewAddError" class="text-[11px] text-red-500">
            {{ reviewAddError }}
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              data-testid="review-add-save"
              class="flex-1 px-3 py-1.5 rounded-lg bg-[#47bfa9] text-white text-xs font-medium hover:bg-[#3aa893] transition-colors disabled:opacity-60"
              :disabled="savingReview || !newReviewText.trim()"
              @click="saveNewReview"
            >
              {{ savingReview ? "Saving…" : "Save review" }}
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-gray-300"
              @click="addingReview = false; reviewAddError = null"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Template browser -->
      <button
        class="w-full text-center px-3 py-2.5 rounded-lg bg-[#47bfa9] text-white text-sm font-medium hover:bg-[#3aa893] transition-colors mt-4"
        @click="emit('open-template-browser')"
      >
        Try Different Template
      </button>

      <!-- Reset -->
      <button
        data-testid="reset-to-original"
        class="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-2"
        @click="emit('reset')"
      >
        Reset to Original
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type {
  CardDesign,
  BrandKit,
  BrandKitPhoto,
  BrandKitReview,
} from "@/types/campaign";
import { getPhotosForIndustry } from "@/data/stockPhotos";
import { useBrandKitStore } from "@/stores/useBrandKitStore";

const props = defineProps<{
  card: CardDesign;
  brandKit: BrandKit | null;
}>();

const emit = defineEmits<{
  (e: "update-field", field: string, value: string): void;
  (e: "update-photo", url: string): void;
  (e: "open-template-browser"): void;
  (e: "reset"): void;
}>();

type EditorType = "headline" | "offer" | "review" | "photo" | null;
const activeEditor = ref<EditorType>(null);

function toggleEditor(editor: EditorType) {
  activeEditor.value = activeEditor.value === editor ? null : editor;
}

const editableHeadline = ref(props.card.resolvedContent.headline);
const editableOffer = ref(props.card.resolvedContent.offerText);

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
    props.card.resolvedContent.offerText,
  ],
  () => {
    editableHeadline.value = props.card.resolvedContent.headline;
    editableOffer.value = props.card.resolvedContent.offerText;
  },
);

function applyHeadline() {
  emit("update-field", "headline", editableHeadline.value);
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

    <div class="space-y-2">
      <!-- Edit Headline -->
      <button
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'headline' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('headline')"
      >
        ✏️ Edit Headline
      </button>
      <div v-if="activeEditor === 'headline'" class="px-3 pb-3">
        <input
          v-model="editableHeadline"
          type="text"
          maxlength="50"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          @input="applyHeadline"
        />
        <div class="text-[10px] text-gray-400 mt-1 text-right">
          {{ editableHeadline.length }}/50
        </div>
      </div>

      <!-- Edit Offer -->
      <button
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'offer' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('offer')"
      >
        🏷️ Edit Offer
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

      <!-- Change Photo -->
      <button
        data-testid="edit-photo-toggle"
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'photo' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('photo')"
      >
        📷 Change Photo
      </button>
      <div v-if="activeEditor === 'photo'" class="px-3 pb-3 space-y-2">
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
          {{ uploadingPhoto ? "Uploading…" : "⬆️ Upload a photo (JPG, PNG, WebP)" }}
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
            <img :src="photo.url" :alt="photo.alt" class="w-full h-full object-cover" />
            <span
              v-if="photo.source === 'stock'"
              class="absolute bottom-0 right-0 text-[8px] font-medium bg-gray-900/70 text-white px-1 rounded-tl"
            >Stock</span>
          </button>
        </div>
      </div>

      <!-- Change Review -->
      <button
        data-testid="edit-review-toggle"
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'review' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('review')"
      >
        ⭐ Change Review
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

<script setup lang="ts">
// BackEditPanel — the right-column editor for the postcard BACK.
//
// S76 Phase-5 shipped guarantee-only. S77 BACK v2 makes the back richly
// editable: a back-style selector (Standard / Testimonial / Service Area), a
// recap subhead, a benefits editor (3-5 rows), a testimonial picker (chosen
// from the SAME brand-kit reviews the front review picker uses, plus a
// "none — show rating chip" option), services + hours editors, and the
// existing guarantee. Return address / license / website / certifications stay
// sourced from Business Info (read-only here) — single source of truth.
//
// One back is printed for every card in the campaign, so everything here
// persists onto card 1's backContent (the parent owns persistence + render).

import { ref, watch, computed } from "vue";
import type {
  BrandKit,
  BrandKitPhoto,
  BackTemplateId,
  BackTestimonial,
  CardDesign,
} from "@/types/campaign";
import { getPhotosForIndustry } from "@/data/stockPhotos";
import { API_BASE } from "@/api/http";

// Brand-kit photos store relative /media/... URLs; resolve cross-origin (mirrors
// EditPanel's Change Photo gallery so thumbnails load on Vercel previews).
function mediaSrc(url: string): string {
  return url && url.startsWith("/") ? `${API_BASE}${url}` : url;
}

// The editable slice of card 1's backContent.
type BackPatch = Partial<CardDesign["backContent"]>;

// S79 Phase-2 section keys — which slice of the back to render in section mode.
export type BackSection =
  | "back-style"
  | "back-subhead"
  | "back-benefits"
  | "back-testimonial"
  | "back-services"
  | "back-hours"
  | "back-guarantee"
  | "back-photo";

const props = defineProps<{
  backContent: CardDesign["backContent"];
  brandKit: BrandKit | null;
  /**
   * S79 Phase-2: "panel" = the full stacked editor (specs + fallback). "section"
   * = render only the `section` slice (for the ContextDrawer / zone popovers).
   * Editor internals/emits are reused verbatim.
   */
  mode?: "panel" | "section";
  section?: BackSection;
}>();

const isSectionMode = computed(() => props.mode === "section");
// In section mode a slice is visible only when it's the requested section.
// In panel mode every slice is visible (the legacy flat stack).
function showSlice(name: BackSection): boolean {
  return !isSectionMode.value || props.section === name;
}

const emit = defineEmits<{
  // A single merge-patch onto card 1's backContent (the parent persists +
  // re-renders the back).
  (e: "update-back", patch: BackPatch): void;
}>();

// --- Back style selector ----------------------------------------------------
// S78 grew this to 5 styles; a 5-up segmented control is cramped, so it renders
// as a 2-column pill grid instead.
const BACK_STYLES: Array<{ id: BackTemplateId; label: string }> = [
  { id: "standard-back-v2", label: "Standard" },
  { id: "testimonial-back-v1", label: "Testimonial" },
  { id: "service-area-back-v1", label: "Service Area" },
  { id: "photo-back-v1", label: "Photo" },
  { id: "brand-bold-back-v1", label: "Bold" },
];
const activeStyle = computed<BackTemplateId>(
  () => (props.backContent.backTemplateId as BackTemplateId) || "standard-back-v2",
);
function selectStyle(id: BackTemplateId) {
  if (id !== activeStyle.value) emit("update-back", { backTemplateId: id });
}
// The back-photo picker is only relevant when the Photo style is selected.
const isPhotoStyle = computed(() => activeStyle.value === "photo-back-v1");

// --- Back photo picker (S78) — reuses the Change Photo gallery pattern -------
type PickerPhoto = {
  url: string;
  alt: string;
  source: "brand" | "stock";
  lowRes?: boolean;
};
// Customer-deliberate sources are never filtered out of the gallery (mirrors
// EditPanel: AI/stock/upload images must always remain selectable).
const DELIBERATE_PHOTO_SOURCES = new Set(["ai", "stock", "upload"]);
const backPickerPhotos = computed<PickerPhoto[]>(() => {
  const bk = props.brandKit;
  if (!bk) return [];
  const brand: PickerPhoto[] = (bk.photos ?? [])
    .filter(
      (p: BrandKitPhoto) =>
        p.printReady !== false ||
        DELIBERATE_PHOTO_SOURCES.has((p as unknown as { source?: string }).source ?? ""),
    )
    .sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0))
    .map((p) => ({
      url: p.url,
      alt: p.alt,
      source: "brand" as const,
      lowRes: p.printReady === false,
    }));
  const stock: PickerPhoto[] = getPhotosForIndustry(bk.industry).map((p) => ({
    url: p.url,
    alt: p.description,
    source: "stock" as const,
  }));
  return [...brand, ...stock];
});
const currentBackPhotoUrl = computed(() => props.backContent.backPhotoUrl ?? "");
function applyBackPhoto(url: string) {
  // Toggle off when re-clicking the active photo → falls back to the card
  // photo / industry pack (the worker's fallback chain fills it, never empty).
  emit("update-back", {
    backPhotoUrl: url === currentBackPhotoUrl.value ? "" : url,
  });
}

// --- Subhead (char counter) -------------------------------------------------
const SUBHEAD_MAX = 70;
const localSubhead = ref(props.backContent.backSubhead ?? "");
watch(
  () => props.backContent.backSubhead,
  (val) => {
    if ((val ?? "") !== localSubhead.value) localSubhead.value = val ?? "";
  },
);
function onSubheadInput(e: Event) {
  const value = (e.target as HTMLTextAreaElement).value.slice(0, SUBHEAD_MAX);
  localSubhead.value = value;
  emit("update-back", { backSubhead: value });
}
const subheadRemaining = computed(() => SUBHEAD_MAX - localSubhead.value.length);

// --- Benefits editor (3-5 rows, 5 max) --------------------------------------
const BENEFIT_MAX = 48;
const BENEFITS_MAX_ROWS = 5;
const benefits = ref<string[]>([...(props.backContent.backBenefits ?? [])]);
watch(
  () => JSON.stringify(props.backContent.backBenefits ?? []),
  () => {
    benefits.value = [...(props.backContent.backBenefits ?? [])];
  },
);
function applyBenefits() {
  emit("update-back", {
    backBenefits: benefits.value.map((b) => b.slice(0, BENEFIT_MAX)),
  });
}
function addBenefit() {
  if (benefits.value.length >= BENEFITS_MAX_ROWS) return;
  benefits.value.push("");
}
function removeBenefit(i: number) {
  benefits.value.splice(i, 1);
  applyBenefits();
}

// --- Testimonial picker -----------------------------------------------------
// Same review list the front review picker uses + a "none (rating chip)" opt.
const reviews = computed(() => props.brandKit?.reviews ?? []);
const selectedTestimonial = computed<BackTestimonial | null>(
  () => props.backContent.backTestimonial ?? null,
);
function isSelectedReview(quote: string): boolean {
  return (selectedTestimonial.value?.quote ?? "") === quote;
}
function pickReview(r: { quote: string; reviewerName: string; rating: number }) {
  emit("update-back", {
    backTestimonial: {
      quote: r.quote,
      reviewerName: r.reviewerName,
      rating: r.rating ?? 5,
    },
  });
}
function clearTestimonial() {
  // "none — show rating chip": an empty quote tells the renderer to render the
  // rating-chip fallback rather than a fabricated quote.
  emit("update-back", {
    backTestimonial: { quote: "", reviewerName: "", rating: 0 },
  });
}
const testimonialIsNone = computed(
  () => !(selectedTestimonial.value?.quote ?? "").trim(),
);

// --- Services editor (6 max) ------------------------------------------------
const SERVICE_MAX = 18;
const SERVICES_MAX_ROWS = 6;
const services = ref<string[]>([...(props.backContent.backServices ?? [])]);
watch(
  () => JSON.stringify(props.backContent.backServices ?? []),
  () => {
    services.value = [...(props.backContent.backServices ?? [])];
  },
);
function applyServices() {
  emit("update-back", {
    backServices: services.value.map((s) => s.slice(0, SERVICE_MAX)),
  });
}
function addService() {
  if (services.value.length >= SERVICES_MAX_ROWS) return;
  services.value.push("");
}
function removeService(i: number) {
  services.value.splice(i, 1);
  applyServices();
}

// --- Hours ------------------------------------------------------------------
const HOURS_MAX = 60;
const localHours = ref(props.backContent.backHours ?? "");
watch(
  () => props.backContent.backHours,
  (val) => {
    if ((val ?? "") !== localHours.value) localHours.value = val ?? "";
  },
);
function onHoursInput(e: Event) {
  const value = (e.target as HTMLInputElement).value.slice(0, HOURS_MAX);
  localHours.value = value;
  emit("update-back", { backHours: value });
}

// --- Guarantee (existing) ---------------------------------------------------
const GUARANTEE_MAX = 180;
const localGuarantee = ref(props.backContent.guarantee ?? "");
watch(
  () => props.backContent.guarantee,
  (val) => {
    if ((val ?? "") !== localGuarantee.value) localGuarantee.value = val ?? "";
  },
);
function onGuaranteeInput(e: Event) {
  const value = (e.target as HTMLTextAreaElement).value.slice(0, GUARANTEE_MAX);
  localGuarantee.value = value;
  emit("update-back", { guarantee: value });
}
const guaranteeRemaining = computed(
  () => GUARANTEE_MAX - localGuarantee.value.length,
);

// --- Read-only Business-Info-sourced fields ---------------------------------
const companyAddress = computed(() => props.brandKit?.address || "");
const licenseNumber = computed(() => props.brandKit?.licenseNumber || "");
const websiteUrl = computed(() => props.brandKit?.websiteUrl || "");
const certifications = computed(() => props.brandKit?.certifications ?? []);
</script>

<template>
  <div :class="isSectionMode ? '' : 'w-80 border-l border-gray-200 p-4 overflow-y-auto bg-white'">
    <template v-if="!isSectionMode">
      <h3 class="text-sm font-semibold text-[#0b2d50] mb-1">Edit Back</h3>
      <p class="text-[11px] text-gray-500 mb-4">
        One back is printed for every card in this campaign.
      </p>
    </template>

    <!-- Back style selector (pill grid — 5 styles, segmented gets cramped) -->
    <div v-if="showSlice('back-style')" class="mb-5">
      <label class="text-[10px] uppercase tracking-wide text-gray-400 block mb-1">
        Back Style
      </label>
      <div
        class="grid grid-cols-2 gap-2"
        data-testid="back-style-selector"
        role="tablist"
      >
        <button
          v-for="style in BACK_STYLES"
          :key="style.id"
          type="button"
          :data-testid="`back-style-${style.id}`"
          :aria-selected="activeStyle === style.id"
          role="tab"
          class="px-2 py-1.5 text-xs font-medium rounded-lg border transition-colors"
          :class="
            activeStyle === style.id
              ? 'bg-[#47bfa9] text-white border-[#47bfa9]'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          "
          @click="selectStyle(style.id)"
        >
          {{ style.label }}
        </button>
      </div>
    </div>

    <!-- Back photo picker (S78) — only when the Photo style is selected.
         Reuses the Change Photo gallery grid (brand + stock, Low-res badge). -->
    <div
      v-if="isPhotoStyle && (showSlice('back-style') || showSlice('back-photo'))"
      class="mb-5"
      data-testid="back-photo-section"
    >
      <label class="text-[10px] uppercase tracking-wide text-gray-400 block mb-1">
        Back Photo
      </label>
      <p class="text-[11px] text-gray-500 mb-2">
        Fills the left side of the back. Leave unset to reuse this campaign's
        front photo.
      </p>
      <div
        v-if="backPickerPhotos.length === 0"
        class="text-xs text-gray-400 py-1"
      >
        No photos yet — add brand photos in onboarding, or pick a card photo on
        the front.
      </div>
      <div v-else class="grid grid-cols-3 gap-2" data-testid="back-photo-grid">
        <button
          v-for="(photo, i) in backPickerPhotos"
          :key="photo.url"
          type="button"
          :data-testid="`back-photo-option-${i}`"
          :data-source="photo.source"
          :data-active="photo.url === currentBackPhotoUrl ? 'true' : 'false'"
          class="relative aspect-square rounded-md overflow-hidden border-2 transition-colors"
          :class="
            photo.url === currentBackPhotoUrl
              ? 'border-[#47bfa9]'
              : 'border-transparent hover:border-gray-300'
          "
          :title="photo.alt"
          @click="applyBackPhoto(photo.url)"
        >
          <img
            :src="mediaSrc(photo.url)"
            :alt="photo.alt"
            class="w-full h-full object-cover"
          />
          <span
            v-if="photo.source === 'stock'"
            class="absolute bottom-0 right-0 text-[8px] font-medium bg-gray-900/70 text-white px-1 rounded-tl"
            >Stock</span
          >
          <span
            v-if="photo.lowRes"
            data-testid="back-photo-lowres-badge"
            class="absolute top-0 left-0 text-[8px] font-medium bg-amber-500/90 text-white px-1 rounded-br"
            title="Below print resolution — may look soft when printed"
            >Low res</span
          >
        </button>
      </div>
    </div>

    <!-- Subhead -->
    <div v-if="showSlice('back-subhead')" class="mb-5">
      <label
        class="text-[10px] uppercase tracking-wide text-gray-400 block mb-1"
        for="back-subhead"
      >
        Subheadline
      </label>
      <textarea
        id="back-subhead"
        data-testid="back-subhead-input"
        :value="localSubhead"
        rows="2"
        :maxlength="SUBHEAD_MAX"
        placeholder="Still on the fence? Here's why neighbors choose us."
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#47bfa9]"
        @input="onSubheadInput"
      />
      <div class="text-[10px] text-gray-400 mt-1 text-right">
        {{ subheadRemaining }} characters left
      </div>
    </div>

    <!-- Benefits editor -->
    <div v-if="showSlice('back-benefits')" class="mb-5">
      <label class="text-[10px] uppercase tracking-wide text-gray-400 block mb-1">
        Benefits
      </label>
      <div class="space-y-2">
        <div
          v-for="(_b, i) in benefits"
          :key="i"
          class="flex items-center gap-2"
        >
          <input
            v-model="benefits[i]"
            type="text"
            :maxlength="BENEFIT_MAX"
            :data-testid="`back-benefit-${i}`"
            class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            @input="applyBenefits"
          />
          <button
            type="button"
            :data-testid="`back-benefit-remove-${i}`"
            class="text-gray-400 hover:text-red-500 text-lg leading-none px-1"
            aria-label="Remove benefit"
            @click="removeBenefit(i)"
          >
            &times;
          </button>
        </div>
        <button
          v-if="benefits.length < BENEFITS_MAX_ROWS"
          type="button"
          data-testid="back-benefit-add"
          class="w-full px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-600 hover:border-[#47bfa9] hover:text-[#0b2d50] transition-colors"
          @click="addBenefit"
        >
          + Add benefit
        </button>
      </div>
      <p class="text-[10px] text-gray-400 mt-1">3-5 short why-us benefits.</p>
    </div>

    <!-- Testimonial picker -->
    <div v-if="showSlice('back-testimonial')" class="mb-5">
      <label class="text-[10px] uppercase tracking-wide text-gray-400 block mb-1">
        Testimonial
      </label>
      <div class="space-y-1.5" data-testid="back-testimonial-picker">
        <button
          type="button"
          data-testid="back-testimonial-none"
          class="w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors"
          :class="
            testimonialIsNone
              ? 'border-[#47bfa9] bg-[#47bfa9]/5'
              : 'border-gray-200 hover:border-gray-300'
          "
          @click="clearTestimonial"
        >
          None — show rating chip
        </button>
        <button
          v-for="(review, i) in reviews"
          :key="i"
          type="button"
          :data-testid="`back-testimonial-${i}`"
          class="w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors"
          :class="
            isSelectedReview(review.quote)
              ? 'border-[#47bfa9] bg-[#47bfa9]/5'
              : 'border-gray-200 hover:border-gray-300'
          "
          @click="pickReview(review)"
        >
          <span class="line-clamp-2">{{ review.quote }}</span>
          <span class="text-gray-500 font-normal">
            — {{ review.reviewerName || "Anon" }}</span
          >
        </button>
        <p v-if="reviews.length === 0" class="text-[10px] text-gray-400 px-1">
          No reviews yet — the back shows a rating chip. Add reviews in Business
          Info.
        </p>
      </div>
    </div>

    <!-- Services editor -->
    <div v-if="showSlice('back-services')" class="mb-5">
      <label class="text-[10px] uppercase tracking-wide text-gray-400 block mb-1">
        Services ("We also do")
      </label>
      <div class="space-y-2">
        <div
          v-for="(_s, i) in services"
          :key="i"
          class="flex items-center gap-2"
        >
          <input
            v-model="services[i]"
            type="text"
            :maxlength="SERVICE_MAX"
            :data-testid="`back-service-${i}`"
            class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            @input="applyServices"
          />
          <button
            type="button"
            :data-testid="`back-service-remove-${i}`"
            class="text-gray-400 hover:text-red-500 text-lg leading-none px-1"
            aria-label="Remove service"
            @click="removeService(i)"
          >
            &times;
          </button>
        </div>
        <button
          v-if="services.length < SERVICES_MAX_ROWS"
          type="button"
          data-testid="back-service-add"
          class="w-full px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-600 hover:border-[#47bfa9] hover:text-[#0b2d50] transition-colors"
          @click="addService"
        >
          + Add service
        </button>
      </div>
    </div>

    <!-- Hours -->
    <div v-if="showSlice('back-hours') || showSlice('back-services')" class="mb-5">
      <label
        class="text-[10px] uppercase tracking-wide text-gray-400 block mb-1"
        for="back-hours"
      >
        Hours
      </label>
      <input
        id="back-hours"
        data-testid="back-hours-input"
        :value="localHours"
        type="text"
        :maxlength="HOURS_MAX"
        placeholder="Mon-Sat 7am-7pm • 24/7 Emergency"
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#47bfa9]"
        @input="onHoursInput"
      />
    </div>

    <!-- Guarantee -->
    <div v-if="showSlice('back-guarantee')" class="mb-5">
      <label
        class="text-[10px] uppercase tracking-wide text-gray-400 block mb-1"
        for="back-guarantee"
      >
        Guarantee
      </label>
      <textarea
        id="back-guarantee"
        data-testid="back-guarantee-input"
        :value="localGuarantee"
        rows="3"
        :maxlength="GUARANTEE_MAX"
        placeholder="100% Satisfaction Guaranteed"
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#47bfa9]"
        @input="onGuaranteeInput"
      />
      <div class="text-[10px] text-gray-400 mt-1 text-right">
        {{ guaranteeRemaining }} characters left
      </div>
    </div>

    <!-- Read-only Business Info block -->
    <div
      v-if="!isSectionMode || showSlice('back-style')"
      class="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2"
    >
      <div class="flex items-center justify-between">
        <span class="text-[10px] uppercase tracking-wide text-gray-400">
          From Business Info
        </span>
        <RouterLink
          :to="{ name: 'Settings' }"
          data-testid="back-edit-in-business-info"
          class="text-[11px] text-[#47bfa9] underline hover:text-[#3aa893]"
        >
          Edit in Business Info
        </RouterLink>
      </div>

      <div class="space-y-1.5 text-xs text-gray-700">
        <div data-testid="back-info-address">
          <span class="text-gray-400">Return address: </span>
          <span v-if="companyAddress">{{ companyAddress }}</span>
          <span v-else class="text-amber-600">Add your business address</span>
        </div>
        <div data-testid="back-info-website">
          <span class="text-gray-400">Website: </span>
          <span v-if="websiteUrl">{{ websiteUrl }}</span>
          <span v-else class="text-gray-400">—</span>
        </div>
        <div data-testid="back-info-license">
          <span class="text-gray-400">License: </span>
          <span v-if="licenseNumber">{{ licenseNumber }}</span>
          <span v-else class="text-gray-400">—</span>
        </div>
        <div data-testid="back-info-certs">
          <span class="text-gray-400">Certifications: </span>
          <span v-if="certifications.length">{{ certifications.join(", ") }}</span>
          <span v-else class="text-gray-400">—</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { CardDesign, TemplateLayoutType, TrustBadge } from "@/types/campaign";
import PostcardFront from "./PostcardFront.vue";
import PostcardBack from "./PostcardBack.vue";
import PostcardFrontStub from "./PostcardFrontStub.vue";
import PostcardBackStub from "./PostcardBackStub.vue";

const props = defineProps<{
  brandColors?: string[];
  size?: "thumbnail" | "large";
  card?: CardDesign;
  layoutType?: TemplateLayoutType;
  businessName?: string;
  businessAddress?: string;
  logoUrl?: string | null;
  // Brief #6 Phase 2 props (added here 2026-04-09 after Codex Pass 1 on
  // P0 #2 caught that StepDesign/ReviewSummary/StepReview never threaded
  // these through to PostcardBack — rating, reviewCount, trustBadges,
  // yearsInBusiness, city were dead props in the wizard/review flow).
  rating?: number | null;
  reviewCount?: number | null;
  trustBadges?: TrustBadge[];
  yearsInBusiness?: number | null;
  city?: string;
  // P0 #4 credibility line prop (threaded through to PostcardFront so
  // the truncation fix is actually exercised in the real wizard flow,
  // not just the dev /dev/postcard-preview route).
  credibilityLine?: string;
  // P1-A 2026-04-10: hide the "John Doe / 123 Main Street" mock address
  // placeholder in contexts where the placeholder is distracting (wizard
  // preview, review summary, sequence thumbnails). Threaded through from
  // callers like StepDesign.vue, ReviewSummary.vue, SequenceView.vue to
  // PostcardBack. Defaults to undefined (PostcardBack shows placeholder),
  // which preserves existing behavior for any caller that doesn't set it.
  hideAddressPlaceholder?: boolean;
}>();

const showBack = ref(false);
const hasCardData = !!props.card;

function flip() {
  showBack.value = !showBack.value;
}

// P0 #5 — transform-scale wrapper for correct preview sizing.
//
// The postcard components use pt-based type scale for print fidelity
// (print-scale.css). pt units are absolute and do not shrink with a
// CSS max-width container, which meant at any preview size smaller
// than the natural 9×6 card (864×576px at 96dpi), the content would
// overflow visually even though container-fit rules reported "fits."
//
// Fix: render the card at its natural 864×576 inside an inner div,
// then apply `transform: scale()` to shrink it visually. The outer
// wrapper uses the scaled dimensions so layout flows correctly around
// the preview.
//
// Codex Pass 1 caught that a FIXED target width would overflow in
// smaller containers like SequenceView's 100px-wide thumbnails or
// StepDesign's max-w-lg. Fix: use ResizeObserver to measure the
// actual container width at runtime and scale to fit.
const CARD_NATURAL_W = 864; // 9in × 96dpi
const CARD_NATURAL_H = 576; // 6in × 96dpi

// Default width (in px) per `size` when we can't measure yet.
const defaultWidth = computed(() =>
  props.size === "thumbnail" ? 240 : 480,
);

const containerRef = ref<HTMLElement | null>(null);
const measuredWidth = ref(defaultWidth.value);
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (!containerRef.value) return;
  const initial = containerRef.value.clientWidth;
  if (initial > 0) measuredWidth.value = initial;

  if (typeof ResizeObserver === "function") {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) measuredWidth.value = w;
      }
    });
    resizeObserver.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

const scale = computed(() => measuredWidth.value / CARD_NATURAL_W);
const scaledHeight = computed(() => CARD_NATURAL_H * scale.value);
</script>

<template>
  <!-- Outer wrapper: keeps Tailwind max-w responsive sizing so the
       component flows inside narrower parents (SequenceView 100px
       thumbnails, StepDesign max-w-lg). Height is derived from the
       dynamic scale computed via ResizeObserver. -->
  <div
    ref="containerRef"
    class="relative cursor-pointer"
    :class="size === 'thumbnail' ? 'max-w-[240px]' : 'max-w-[480px]'"
    :style="{ height: `${scaledHeight}px` }"
    @click="flip"
  >
    <!-- Physical-size card wrapper. Inner div renders at natural 864×576
         so pt-based typography is correct; transform: scale() shrinks it
         to whatever width the outer container reports. -->
    <div
      :style="{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${CARD_NATURAL_W}px`,
        height: `${CARD_NATURAL_H}px`,
      }"
    >
      <!-- Real postcard (when card data is provided) -->
      <template v-if="hasCardData && card">
        <PostcardFront
          v-if="!showBack"
          :card="card"
          :layout-type="layoutType ?? 'full-bleed'"
          :brand-colors="brandColors"
          :business-name="businessName"
          :logo-url="logoUrl"
          :credibility-line="credibilityLine"
        />
        <PostcardBack
          v-else
          :card="card"
          :brand-colors="brandColors"
          :business-name="businessName"
          :business-address="businessAddress"
          :rating="rating"
          :review-count="reviewCount"
          :trust-badges="trustBadges"
          :years-in-business="yearsInBusiness"
          :city="city"
          :hide-address-placeholder="hideAddressPlaceholder"
        />
      </template>

      <!-- Stub fallback (no card data) -->
      <template v-else>
        <PostcardFrontStub v-if="!showBack" :brand-colors="brandColors" />
        <PostcardBackStub v-else :brand-colors="brandColors" />
      </template>
    </div>

    <button
      class="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded shadow hover:bg-white transition-colors z-30"
      @click.stop="flip"
    >
      {{ showBack ? "Show front" : "Flip card" }}
    </button>
  </div>
</template>

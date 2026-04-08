<script setup lang="ts">
import { computed } from "vue";
import type { CardDesign, TemplateLayoutType } from "@/types/campaign";
import { ensureContrast, safeTextColor } from "@/utils/contrast";

// Brief #6 Task 7 — PostcardFront rewrite.
//
// Design principles (from expert panel review + plan v2):
// - Lob-style: absolute positioning, safe-zone aware, pt-based type scale
// - Hero photo 60%+ of card area, edge-to-edge with bleed
// - Headline in high-contrast overlay bar (Gendusa/Draplin)
// - Logo top-left (0.75-1.5" wide), "Licensed & Insured" top-right
// - Phone in a contrast bar at the bottom, 18-24pt bold
// - Credibility line under headline, 12-14pt
// - NO offer text on front — offer belongs on back (Gendusa fix)
// - Headline must include city/neighborhood (AI prompt enforces — Halbert fix)
// - All 6 layoutTypes share the SAME type scale + spacing. Variety comes from
//   photo placement only (Draplin fix — unified visual language).
// - All text-on-color pairs go through ensureContrast() so brand colors that
//   fail 4.5:1 fall back to black/white (Draplin fix).

const props = defineProps<{
  card: CardDesign;
  layoutType: TemplateLayoutType;
  brandColors?: string[];
  businessName?: string;
  logoUrl?: string | null;
  // Credibility line — passed from parent or derived from brandKit.
  // "Licensed & Insured" | "Serving Phoenix since 2014" | "24/7 Emergency Service"
  credibilityLine?: string;
}>();

// Brand color defaults (muted teal + navy). These are only used when the
// customer has no extracted brand colors. Once Firecrawl lands, this is the
// fallback, not the norm.
const primary = computed(() => props.brandColors?.[0] ?? "#47bfa9");
const dark = computed(() => props.brandColors?.[1] ?? "#0b2d50");

// Safe text colors for each surface, computed once per render.
// On a white/light card area (photo-top content zone, review-forward body),
// text is black unless the brand primary passes contrast against white.
const textOnLight = computed(() => ensureContrast(dark.value, "#FFFFFF"));
const textOnDark = computed(() => ensureContrast("#FFFFFF", dark.value));
const textOnPrimary = computed(() => safeTextColor(primary.value));

const credibility = computed(
  () => props.credibilityLine ?? "Licensed & Insured"
);

const hasPhoto = computed(() => !!props.card.resolvedContent.photoUrl);
</script>

<template>
  <!-- .pc-card enforces bleed/trim frame + safe-zone inset from print-scale.css.
       The aspectRatio inline style is the on-screen preview; print output uses
       the physical pt dimensions from .pc-card. -->
  <div
    class="pc-card relative rounded-lg overflow-hidden bg-white"
    :style="{ aspectRatio: '9 / 6' }"
  >
    <!-- ============================================================
         FULL-BLEED: photo fills the card, overlay bar at bottom holds
         headline + credibility + phone. The most common layout.
         ============================================================ -->
    <template v-if="layoutType === 'full-bleed'">
      <!-- Hero photo, edge-to-edge -->
      <img
        v-if="hasPhoto"
        :src="card.resolvedContent.photoUrl"
        class="absolute inset-0 w-full h-full object-cover"
        alt=""
      />
      <!-- Gradient so bottom overlay bar stays readable on any photo -->
      <div
        class="absolute inset-x-0 bottom-0 h-3/5 pointer-events-none"
        style="background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)"
      />
      <!-- Top row: logo left, badge right -->
      <div class="absolute top-0 inset-x-0 flex justify-between items-start px-3 py-3">
        <img
          v-if="logoUrl"
          :src="logoUrl"
          class="object-contain"
          style="max-width: var(--pc-logo-max-w); min-width: var(--pc-logo-min-w); height: auto"
          alt=""
        />
        <span v-else class="pc-badge text-white/80">{{ businessName }}</span>
        <span class="pc-badge text-white/90">{{ credibility }}</span>
      </div>
      <!-- Bottom overlay bar: headline + phone -->
      <div class="absolute inset-x-0 bottom-0 px-4 pb-4 pt-5 text-white">
        <h3 class="pc-headline">{{ card.resolvedContent.headline }}</h3>
        <div class="pc-phone-front mt-2">{{ card.resolvedContent.phoneNumber }}</div>
      </div>
    </template>

    <!-- ============================================================
         SIDE-SPLIT: photo left half, content right half on brand color.
         ============================================================ -->
    <template v-else-if="layoutType === 'side-split'">
      <div class="flex h-full">
        <div class="w-1/2 relative">
          <img
            v-if="hasPhoto"
            :src="card.resolvedContent.photoUrl"
            class="w-full h-full object-cover"
            alt=""
          />
        </div>
        <div
          class="w-1/2 flex flex-col justify-between px-4 py-4"
          :style="{ backgroundColor: dark, color: textOnDark }"
        >
          <div class="flex justify-between items-start">
            <img
              v-if="logoUrl"
              :src="logoUrl"
              class="object-contain bg-white/10 rounded p-1"
              style="max-width: var(--pc-logo-max-w); min-width: var(--pc-logo-min-w); height: auto"
              alt=""
            />
            <span v-else class="pc-badge opacity-80">{{ businessName }}</span>
            <span class="pc-badge opacity-80">{{ credibility }}</span>
          </div>
          <div>
            <h3 class="pc-headline">{{ card.resolvedContent.headline }}</h3>
            <div class="pc-phone-front mt-3">{{ card.resolvedContent.phoneNumber }}</div>
          </div>
        </div>
      </div>
    </template>

    <!-- ============================================================
         PHOTO-TOP: photo 60% top, content 40% bottom on light brand tint.
         ============================================================ -->
    <template v-else-if="layoutType === 'photo-top'">
      <div class="flex flex-col h-full">
        <div class="relative" style="height: 60%">
          <img
            v-if="hasPhoto"
            :src="card.resolvedContent.photoUrl"
            class="w-full h-full object-cover"
            alt=""
          />
          <div class="absolute top-0 inset-x-0 flex justify-between items-start px-3 py-3">
            <img
              v-if="logoUrl"
              :src="logoUrl"
              class="object-contain bg-white/90 rounded p-1"
              style="max-width: var(--pc-logo-max-w); min-width: var(--pc-logo-min-w); height: auto"
              alt=""
            />
            <span v-else class="pc-badge text-white drop-shadow">{{ businessName }}</span>
            <span class="pc-badge text-white drop-shadow">{{ credibility }}</span>
          </div>
        </div>
        <div
          class="flex flex-col justify-between px-4 py-4"
          style="height: 40%"
          :style="{ backgroundColor: '#FFFFFF', color: textOnLight }"
        >
          <h3 class="pc-headline">{{ card.resolvedContent.headline }}</h3>
          <div
            class="pc-phone-front self-start px-3 py-1 rounded"
            :style="{ backgroundColor: primary, color: textOnPrimary }"
          >
            {{ card.resolvedContent.phoneNumber }}
          </div>
        </div>
      </div>
    </template>

    <!-- ============================================================
         BOLD-GRAPHIC: no photo (last resort per Draplin). Solid color
         background, centered content.
         ============================================================ -->
    <template v-else-if="layoutType === 'bold-graphic'">
      <div
        class="h-full flex flex-col justify-between px-4 py-4"
        :style="{ backgroundColor: dark, color: textOnDark }"
      >
        <div class="flex justify-between items-start">
          <img
            v-if="logoUrl"
            :src="logoUrl"
            class="object-contain bg-white/10 rounded p-1"
            style="max-width: var(--pc-logo-max-w); min-width: var(--pc-logo-min-w); height: auto"
            alt=""
          />
          <span v-else class="pc-badge opacity-80">{{ businessName }}</span>
          <span class="pc-badge opacity-80">{{ credibility }}</span>
        </div>
        <div class="text-center">
          <h3 class="pc-headline">{{ card.resolvedContent.headline }}</h3>
        </div>
        <div class="text-center">
          <div
            class="pc-phone-front inline-block px-4 py-1 rounded"
            :style="{ backgroundColor: primary, color: textOnPrimary }"
          >
            {{ card.resolvedContent.phoneNumber }}
          </div>
        </div>
      </div>
    </template>

    <!-- ============================================================
         BEFORE-AFTER: two photo slots, overlay bar spans full width
         at bottom with headline + phone.
         ============================================================ -->
    <template v-else-if="layoutType === 'before-after'">
      <div class="flex h-full">
        <div class="w-1/2 bg-gray-200 flex items-center justify-center">
          <span class="pc-badge text-gray-400">BEFORE</span>
        </div>
        <div class="w-1/2 relative">
          <img
            v-if="hasPhoto"
            :src="card.resolvedContent.photoUrl"
            class="w-full h-full object-cover"
            alt=""
          />
          <div class="absolute top-2 right-2">
            <span class="pc-badge bg-white/90 px-2 py-0.5 rounded">AFTER</span>
          </div>
        </div>
      </div>
      <!-- Shared overlay bar at bottom — same styling as full-bleed -->
      <div
        class="absolute inset-x-0 bottom-0 px-4 pb-4 pt-5"
        style="background: linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)"
      >
        <div class="flex justify-between items-end text-white">
          <h3 class="pc-headline flex-1">{{ card.resolvedContent.headline }}</h3>
          <div class="pc-phone-front ml-4">{{ card.resolvedContent.phoneNumber }}</div>
        </div>
      </div>
      <!-- Top row: logo + credibility, above the photo split -->
      <div class="absolute top-0 inset-x-0 flex justify-between items-start px-3 py-2 pointer-events-none">
        <img
          v-if="logoUrl"
          :src="logoUrl"
          class="object-contain bg-white/95 rounded p-1"
          style="max-width: var(--pc-logo-max-w); min-width: var(--pc-logo-min-w); height: auto"
          alt=""
        />
        <span v-else class="pc-badge text-gray-700 bg-white/85 px-2 rounded">{{ businessName }}</span>
        <span class="pc-badge text-gray-700 bg-white/85 px-2 rounded">{{ credibility }}</span>
      </div>
    </template>

    <!-- ============================================================
         REVIEW-FORWARD: photo 60%, review quote in overlay bar
         replaces the credibility line under the headline.
         ============================================================ -->
    <template v-else>
      <img
        v-if="hasPhoto"
        :src="card.resolvedContent.photoUrl"
        class="absolute inset-0 w-full h-full object-cover"
        alt=""
      />
      <div
        class="absolute inset-x-0 bottom-0 h-3/5 pointer-events-none"
        style="background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)"
      />
      <div class="absolute top-0 inset-x-0 flex justify-between items-start px-3 py-3">
        <img
          v-if="logoUrl"
          :src="logoUrl"
          class="object-contain"
          style="max-width: var(--pc-logo-max-w); min-width: var(--pc-logo-min-w); height: auto"
          alt=""
        />
        <span v-else class="pc-badge text-white/80">{{ businessName }}</span>
        <span class="pc-badge text-white/90">★★★★★</span>
      </div>
      <div class="absolute inset-x-0 bottom-0 px-4 pb-4 pt-5 text-white">
        <h3 class="pc-headline">{{ card.resolvedContent.headline }}</h3>
        <p class="pc-review-quote mt-2 opacity-95">
          "{{ card.resolvedContent.reviewQuote }}"
          <span class="pc-credibility ml-1 opacity-80">— {{ card.resolvedContent.reviewerName }}</span>
        </p>
        <div class="pc-phone-front mt-2">{{ card.resolvedContent.phoneNumber }}</div>
      </div>
    </template>
  </div>
</template>

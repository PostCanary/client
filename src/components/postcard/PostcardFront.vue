<script setup lang="ts">
import { computed } from "vue";
import type { CardDesign, TemplateLayoutType } from "@/types/campaign";
import { ensureContrast, safeTextColor } from "@/utils/contrast";
import OfferBadge from "@/components/design/OfferBadge.vue";

// Brief #6 Task 7 — PostcardFront rewrite.
//
// Design principles (from expert panel review + plan v2):
// - Lob-style: absolute positioning, safe-zone aware, pt-based type scale
// - Hero photo 60%+ of card area, edge-to-edge with bleed
// - Headline in high-contrast overlay bar (Gendusa/Draplin)
// - Logo top-left (0.75-1.5" wide), "Licensed & Insured" top-right
// - Phone in a contrast bar at the bottom, 18-24pt bold
// - Credibility line under headline, 12-14pt
// - Single short offer teaser on front (OfferBadge — ribbon by default).
//   The STACKED value-stack offer still lives on the back OfferBox.
//   (Reverses the 2026-04-03 "no offer on front" decision per visual taste
//   audit 2026-04-09 — reference corpus showed front-offer teaser in ~100%
//   of PostcardMania HVAC / ~90% of Mail Shark oversized samples.)
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
  // OfferBadge variant — "ribbon" by default for all layouts with a photo
  // (ribbon sits diagonally across the top-right corner, doesn't fight
  // the top-row content). "burst" works better on bold-graphic which has
  // no photo to compete with. Override per-layout via template picker.
  offerBadgeVariant?: "burst" | "ribbon";
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

// Offer teaser — empty string / whitespace-only hides the badge entirely.
const offerTeaser = computed(
  () => props.card.resolvedContent.offerTeaser ?? ""
);
const hasOfferTeaser = computed(() => offerTeaser.value.trim().length > 0);

// Badge variant: explicit prop wins; otherwise bold-graphic (no photo) gets
// burst (centered, eye-catching), every other layout gets ribbon (doesn't
// fight existing top-row content).
const badgeVariant = computed<"burst" | "ribbon">(() => {
  if (props.offerBadgeVariant) return props.offerBadgeVariant;
  return props.layoutType === "bold-graphic" ? "burst" : "ribbon";
});

// P0-A fix 2026-04-10: when the ribbon variant is active, it self-positions
// in the top-right corner — the same zone where most layouts put the
// credibility badge (or the star rating on review-forward). They collide,
// and the ribbon has z-index priority, so the credibility becomes invisible
// to the customer. Drake caught this at end of session 32 ("credibility
// hidden behind ribbon"). Fix: hide the top-right slot on layouts where it
// collides. The burst variant positions mid-right and does NOT collide, so
// bold-graphic keeps its credibility badge. The business-name/logo slot on
// the top-LEFT is untouched (it doesn't collide with the ribbon).
const hideTopRightBadge = computed(
  () => hasOfferTeaser.value && badgeVariant.value === "ribbon"
);
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
         OFFER BADGE — single shared element, rendered above all layout
         content via absolute positioning + z-index 5. Ribbon variant
         self-positions in the top-right corner. Burst variant needs
         a wrapper to control its position on the card.
         ============================================================ -->
    <template v-if="hasOfferTeaser">
      <OfferBadge
        v-if="badgeVariant === 'ribbon'"
        :text="offerTeaser"
        variant="ribbon"
        :primary-color="primary"
        :dark-color="dark"
      />
      <div
        v-else
        class="absolute z-10"
        :style="{ top: '1.6in', right: '0.5in' }"
      >
        <OfferBadge
          :text="offerTeaser"
          variant="burst"
          :primary-color="primary"
          :dark-color="dark"
        />
      </div>
    </template>

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
      <!-- Top row: logo left, badge right. Credibility truncates with
           ellipsis when the extracted string is too long for the space
           (P0 #4 fix — was clipping at the card edge). Top-right badge
           hides when OfferBadge ribbon is rendered to avoid z-order
           collision (P0-A fix 2026-04-10). -->
      <div class="absolute top-0 inset-x-0 flex justify-between items-start px-3 py-3 gap-2">
        <img
          v-if="logoUrl"
          :src="logoUrl"
          class="object-contain flex-none"
          style="max-width: var(--pc-logo-max-w); min-width: var(--pc-logo-min-w); height: auto"
          alt=""
        />
        <span v-else class="pc-badge text-white/80 flex-none">{{ businessName }}</span>
        <span
          v-if="!hideTopRightBadge"
          class="pc-badge text-white/90 truncate"
          :style="{ maxWidth: '45%', display: 'inline-block' }"
        >
          {{ credibility }}
        </span>
      </div>
      <!-- Bottom overlay bar: headline + phone in contrasting container.
           Phone sits in a brand-primary pill (P0 #3 fix — was bare text
           on gradient, no visual weight). -->
      <div class="absolute inset-x-0 bottom-0 px-4 pb-4 pt-5 text-white">
        <h3 class="pc-headline">{{ card.resolvedContent.headline }}</h3>
        <div
          class="pc-phone-front inline-block mt-2 px-3 py-1 rounded"
          :style="{ backgroundColor: primary, color: textOnPrimary }"
        >
          {{ card.resolvedContent.phoneNumber }}
        </div>
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
          <div class="flex justify-between items-start gap-2">
            <img
              v-if="logoUrl"
              :src="logoUrl"
              class="object-contain bg-white/10 rounded p-1 flex-none"
              style="max-width: var(--pc-logo-max-w); min-width: var(--pc-logo-min-w); height: auto"
              alt=""
            />
            <span v-else class="pc-badge opacity-80 flex-none">{{ businessName }}</span>
            <span
              v-if="!hideTopRightBadge"
              class="pc-badge opacity-80 truncate"
              :style="{ maxWidth: '55%', display: 'inline-block' }"
            >
              {{ credibility }}
            </span>
          </div>
          <div>
            <h3 class="pc-headline">{{ card.resolvedContent.headline }}</h3>
            <div
              class="pc-phone-front inline-block mt-3 px-3 py-1 rounded"
              :style="{ backgroundColor: primary, color: textOnPrimary }"
            >
              {{ card.resolvedContent.phoneNumber }}
            </div>
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
          <div class="absolute top-0 inset-x-0 flex justify-between items-start px-3 py-3 gap-2">
            <img
              v-if="logoUrl"
              :src="logoUrl"
              class="object-contain bg-white/90 rounded p-1 flex-none"
              style="max-width: var(--pc-logo-max-w); min-width: var(--pc-logo-min-w); height: auto"
              alt=""
            />
            <span v-else class="pc-badge text-white drop-shadow flex-none">{{ businessName }}</span>
            <span
              v-if="!hideTopRightBadge"
              class="pc-badge text-white drop-shadow truncate"
              :style="{ maxWidth: '45%', display: 'inline-block' }"
            >
              {{ credibility }}
            </span>
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
        <div class="flex justify-between items-start gap-2">
          <img
            v-if="logoUrl"
            :src="logoUrl"
            class="object-contain bg-white/10 rounded p-1 flex-none"
            style="max-width: var(--pc-logo-max-w); min-width: var(--pc-logo-min-w); height: auto"
            alt=""
          />
          <span v-else class="pc-badge opacity-80 flex-none">{{ businessName }}</span>
          <span
            class="pc-badge opacity-80 truncate"
            :style="{ maxWidth: '45%', display: 'inline-block' }"
          >
            {{ credibility }}
          </span>
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
      <!-- Shared overlay bar at bottom — same styling as full-bleed. Phone
           wrapped in brand-primary pill for visual weight (P0 #3). -->
      <div
        class="absolute inset-x-0 bottom-0 px-4 pb-4 pt-5"
        style="background: linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)"
      >
        <div class="flex justify-between items-end text-white gap-3">
          <h3 class="pc-headline flex-1">{{ card.resolvedContent.headline }}</h3>
          <div
            class="pc-phone-front px-3 py-1 rounded flex-none"
            :style="{ backgroundColor: primary, color: textOnPrimary }"
          >
            {{ card.resolvedContent.phoneNumber }}
          </div>
        </div>
      </div>
      <!-- Top row: logo + credibility, above the photo split -->
      <div class="absolute top-0 inset-x-0 flex justify-between items-start px-3 py-2 pointer-events-none gap-2">
        <img
          v-if="logoUrl"
          :src="logoUrl"
          class="object-contain bg-white/95 rounded p-1 flex-none"
          style="max-width: var(--pc-logo-max-w); min-width: var(--pc-logo-min-w); height: auto"
          alt=""
        />
        <span v-else class="pc-badge text-gray-700 bg-white/85 px-2 rounded flex-none">{{ businessName }}</span>
        <span
          v-if="!hideTopRightBadge"
          class="pc-badge text-gray-700 bg-white/85 px-2 rounded truncate"
          :style="{ maxWidth: '45%', display: 'inline-block' }"
        >
          {{ credibility }}
        </span>
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
      <div class="absolute top-0 inset-x-0 flex justify-between items-start px-3 py-3 gap-2">
        <img
          v-if="logoUrl"
          :src="logoUrl"
          class="object-contain flex-none"
          style="max-width: var(--pc-logo-max-w); min-width: var(--pc-logo-min-w); height: auto"
          alt=""
        />
        <span v-else class="pc-badge text-white/80 flex-none">{{ businessName }}</span>
        <span
          v-if="!hideTopRightBadge"
          class="pc-badge text-white/90 flex-none"
        >★★★★★</span>
      </div>
      <div class="absolute inset-x-0 bottom-0 px-4 pb-4 pt-5 text-white">
        <h3 class="pc-headline">{{ card.resolvedContent.headline }}</h3>
        <p class="pc-review-quote mt-2 opacity-95">
          "{{ card.resolvedContent.reviewQuote }}"
          <span class="pc-credibility ml-1 opacity-80">— {{ card.resolvedContent.reviewerName }}</span>
        </p>
        <div
          class="pc-phone-front inline-block mt-2 px-3 py-1 rounded"
          :style="{ backgroundColor: primary, color: textOnPrimary }"
        >
          {{ card.resolvedContent.phoneNumber }}
        </div>
      </div>
    </template>
  </div>
</template>

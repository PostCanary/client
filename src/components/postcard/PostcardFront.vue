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

// D-09 wordmark fallback: when logoUrl is null (Firecrawl missed, empty
// brand kit, or scraping error), render the business name in a solid
// brand-color filled rectangle instead of a raw text span. The filled
// pill gives the wordmark the visual weight of a logo without depending
// on image assets.
const showWordmarkFallback = computed(() => !props.logoUrl);
</script>

<template>
  <!-- .pc-card enforces bleed/trim frame + safe-zone inset from print-scale.css.
       The aspectRatio inline style is the on-screen preview; print output uses
       the physical pt dimensions from .pc-card. -->
  <div
    class="pc-card relative overflow-hidden bg-white"
    :style="{ aspectRatio: '9 / 6', borderRadius: 'var(--pc-radius)' }"
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
         FULL-BLEED: Phase 2 rewrite (2026-04-09). Draplin gate pass.
         ============================================================
         Pattern references (02-RESEARCH.md):
         - P-01: photo 55-75% of card area, edge-to-edge bleed
         - P-02: text overlays sit ON the photo
         - P-03: solid color bar bottom 25-35%, not a gradient
         - P-05: logo top-left, small (0.75-1.25in)
         - P-07: phone in solid full-width container at bottom
         - P-09: headline 800-900 weight
         - P-27: wordmark fallback is a filled solid-color rectangle
         - P-29: front phone spans or nearly spans card width
         - P-36: border-radius 0 on every element
         - P-38: no soft grey shadows
         - Z-pattern (D-08): logo TL → [credibility suppressed when
                 ribbon active] → headline BL → phone BR (full width bar).
         ============================================================ -->
    <template v-if="layoutType === 'full-bleed'">
      <!-- Hero photo, edge-to-edge. No insets, no borders, no radius. -->
      <img
        v-if="hasPhoto"
        :src="card.resolvedContent.photoUrl"
        class="absolute inset-0 w-full h-full object-cover"
        alt=""
      />

      <!-- Solid color bottom bar (P-03). Height from --pc-overlay-bar-h.
           Hard-edged top border via a narrow 0.4in gradient ABOVE the bar
           that blends photo pixels into the bar color — the bar itself
           is solid. The bar is dark (using `dark` brand color) so white
           text on it always reads. -->
      <div
        class="absolute inset-x-0 bottom-0 pointer-events-none"
        :style="{
          height: 'var(--pc-overlay-bar-h)',
          backgroundColor: dark,
        }"
      />
      <!-- Photo→bar blend: a 0.4in gradient strip sitting just above the
           bar so photo edges don't pop against the hard bar top. -->
      <div
        class="absolute inset-x-0 pointer-events-none"
        :style="{
          bottom: 'var(--pc-overlay-bar-h)',
          height: '0.4in',
          background: `linear-gradient(to top, ${dark} 0%, rgba(0,0,0,0) 100%)`,
        }"
      />

      <!-- TOP ROW: logo top-left (P-05), credibility top-right (P-06).
           Credibility suppressed when ribbon badge is active (hideTopRightBadge). -->
      <div
        class="absolute top-0 inset-x-0 flex justify-between items-start"
        :style="{
          padding: '0.15in 0.2in',
          gap: '0.1in',
        }"
      >
        <!-- Logo OR wordmark fallback (D-09, P-27) -->
        <img
          v-if="!showWordmarkFallback"
          :src="logoUrl!"
          class="object-contain flex-none"
          :style="{
            maxWidth: 'var(--pc-logo-max-w)',
            minWidth: 'var(--pc-logo-min-w)',
            height: 'auto',
            borderRadius: 'var(--pc-radius)',
          }"
          alt=""
        />
        <div
          v-else
          class="flex-none"
          :style="{
            backgroundColor: primary,
            color: textOnPrimary,
            padding: '0.06in 0.14in',
            minWidth: 'var(--pc-logo-min-w)',
            maxWidth: 'var(--pc-logo-max-w)',
            borderRadius: 'var(--pc-radius)',
            fontFamily: 'inherit',
            fontSize: '14pt',
            fontWeight: 900,
            lineHeight: 1.05,
            textTransform: 'uppercase',
            letterSpacing: '0.01em',
            textAlign: 'center',
          }"
        >
          {{ businessName }}
        </div>

        <!-- Credibility top-right (P-06) — suppressed when ribbon active -->
        <div
          v-if="!hideTopRightBadge"
          class="pc-badge flex-none"
          :style="{
            backgroundColor: dark,
            color: '#FFFFFF',
            padding: '0.05in 0.1in',
            maxWidth: '45%',
            borderRadius: 'var(--pc-radius)',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }"
        >
          {{ credibility }}
        </div>
      </div>

      <!-- BOTTOM BAR: headline + full-width phone (P-07, P-08, P-29, P-09).
           The bar height is --pc-overlay-bar-h (36%). Headline fills the
           top ~65% of the bar; phone is the bottom full-width band. -->
      <div
        class="absolute inset-x-0 bottom-0 flex flex-col justify-end"
        :style="{
          height: 'var(--pc-overlay-bar-h)',
          padding: '0.15in 0.2in 0 0.2in',
          color: '#FFFFFF',
        }"
      >
        <h3
          class="pc-headline"
          :style="{
            color: '#FFFFFF',
            marginBottom: '0.1in',
          }"
        >
          {{ card.resolvedContent.headline }}
        </h3>
      </div>

      <!-- Full-width phone band (P-29): spans the full card width at the
           very bottom. Brand primary background, contrasting text. No
           rounded corners. No shadows. -->
      <div
        class="absolute inset-x-0 bottom-0"
        :style="{
          backgroundColor: primary,
          color: textOnPrimary,
          padding: '0.12in 0.2in',
          borderRadius: 'var(--pc-radius)',
          textAlign: 'center',
        }"
      >
        <span
          class="pc-phone-front"
          :style="{
            fontWeight: 800,
            letterSpacing: '0.02em',
          }"
        >
          {{ card.resolvedContent.phoneNumber }}
        </span>
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

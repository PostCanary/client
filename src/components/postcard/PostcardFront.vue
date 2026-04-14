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
    <template v-if="hasOfferTeaser && layoutType !== 'full-bleed'">
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
         FULL-BLEED: Phase 2 Session 35 — 3-zone layout.
         ============================================================
         Expert rules applied:
         - Gendusa: 3 distinct color zones, headline 15-25% of card,
           CTA in non-matching color, offer teaser on front
         - Draplin: border-radius 0, no soft shadows, color blocks
           dominate, thick type, physical-object DNA
         - Whitman: Z-pattern (logo TL → ribbon TR → headline on photo
           left → phone at bottom-right exit point), Ogilvy 2/3-1/3
         - Halbert: multi-color headline (RED attention + bridge +
           brand-color action = problem→solution), value stack anchor
         - Caples: self-interest headline with location, specific numbers
         - Wathan: all values from CSS custom properties, zero magic numbers
         - Drasner: all zones absolute-positioned (one layout mode),
           flex inside each zone for internal alignment
         ============================================================
         3-zone structure (HAC-1000 reference):
         Zone 1: Photo + headline text  — top 60%
         Zone 2: Offer strip            — middle 14%, bright GREEN
         Zone 3: Info bar (phone/brand) — bottom 26%, deep NAVY
         ============================================================ -->
    <template v-if="layoutType === 'full-bleed'">
      <!-- ZONE 1: Hero photo, edge-to-edge bleed (P-01, P-02) -->
      <img
        v-if="hasPhoto"
        :src="card.resolvedContent.photoUrl"
        class="absolute inset-0 w-full h-full object-cover"
        alt=""
      />

      <!-- Photo→offer blend: gradient strip above Zone 2 -->
      <div
        class="absolute inset-x-0 pointer-events-none"
        :style="{
          bottom: `calc(var(--pc-front-offer-h) + var(--pc-front-info-h))`,
          height: 'var(--pc-front-blend-h)',
          background: `linear-gradient(to top, var(--pc-front-offer-bg) 0%, rgba(0,0,0,0) 100%)`,
          borderRadius: 'var(--pc-radius)',
        }"
      />

      <!-- TOP ROW: logo top-left (P-05, Whitman Z-pattern start) -->
      <div
        class="absolute top-0 inset-x-0 flex justify-between items-start"
        :style="{ padding: '0.15in 0.2in', gap: '0.1in' }"
      >
        <img
          v-if="!showWordmarkFallback"
          :src="logoUrl!"
          class="object-contain flex-none"
          :style="{
            maxWidth: '1.8in',
            minWidth: '1.0in',
            height: 'auto',
            borderRadius: 'var(--pc-radius)',
          }"
          alt=""
        />
        <div
          v-else
          class="flex-none"
          :style="{
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: '#FFFFFF',
            padding: '0.08in 0.14in',
            borderRadius: 'var(--pc-radius)',
            fontFamily: 'var(--pc-headline-family)',
            lineHeight: 1.0,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            fontSize: '14pt',
            fontWeight: 700,
          }"
        >
          {{ businessName }}
        </div>
      </div>

      <!-- ZONE 2: Offer strip — bright GREEN, non-matching color (Gendusa)
           Full width, bold text, scannable at arm's length -->
      <div
        class="absolute inset-x-0 flex items-center justify-center"
        :style="{
          bottom: 'var(--pc-front-info-h)',
          height: 'var(--pc-front-offer-h)',
          backgroundColor: 'var(--pc-front-offer-bg)',
          padding: '0 0.25in',
          color: '#FFFFFF',
          textAlign: 'center',
          borderRadius: 'var(--pc-radius)',
        }"
      >
        <div class="flex items-center justify-center" :style="{ gap: '0.06in' }">
          <span :style="{
            fontSize: '14pt',
            fontWeight: 400,
          }">
            Get
          </span>
          <span :style="{
            fontFamily: 'var(--pc-headline-family)',
            fontSize: '22pt',
            fontWeight: 800,
            textTransform: 'uppercase',
          }">
            {{ offerTeaser }}
          </span>
          <span :style="{
            fontSize: '13pt',
            fontWeight: 400,
          }">
            — Call Today!
          </span>
        </div>
        <div
          :style="{
            fontSize: '8pt',
            fontWeight: 400,
            opacity: 0.8,
            position: 'absolute',
            bottom: '0.03in',
            left: 0,
            right: 0,
            textAlign: 'center',
          }"
        >
          With this card. Limited time offer.
        </div>
      </div>

      <!-- ZONE 3: Info bar — deep NAVY, brand + phone + services
           Whitman: CTA at Z-pattern exit point (bottom-right) -->
      <div
        class="absolute inset-x-0 bottom-0 flex items-center justify-between"
        :style="{
          height: 'var(--pc-front-info-h)',
          backgroundColor: 'var(--pc-front-info-bg)',
          padding: '0.08in 0.25in',
          color: '#FFFFFF',
          borderRadius: 'var(--pc-radius)',
        }"
      >
        <!-- Left: brand identity in info bar -->
        <div class="flex flex-col flex-none" :style="{ maxWidth: '3in' }">
          <!-- Services strip (Gendusa: services in scannable line) -->
          <div :style="{
            fontSize: '8pt',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: 0.75,
            marginBottom: '0.03in',
          }">
            AC · HEATING · REPAIR · MAINTENANCE
          </div>
          <!-- Wordmark — thick, bold, impossible to miss (Draplin) -->
          <div :style="{
            fontFamily: 'var(--pc-headline-family)',
            fontSize: '28pt',
            fontWeight: 800,
            lineHeight: 0.95,
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
          }">
            {{ businessName?.replace(/\s+(HVAC|LLC|INC|CO)\.?$/i, '') }}
          </div>
          <div
            v-if="businessName && /\s+(HVAC|LLC|INC|CO)\.?$/i.test(businessName)"
            :style="{
              fontFamily: 'var(--pc-headline-family)',
              fontSize: '16pt',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              opacity: 0.9,
            }"
          >
            {{ businessName.match(/\s+(HVAC|LLC|INC|CO)\.?$/i)?.[1]?.toUpperCase() }}
          </div>
        </div>

        <!-- Right: phone number (Whitman: Z-pattern exit = CTA) -->
        <div :style="{ textAlign: 'right' }">
          <div :style="{
            fontSize: '10pt',
            fontWeight: 600,
            opacity: 0.85,
            marginBottom: '0.02in',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }">
            Call Now!
          </div>
          <div :style="{
            fontFamily: 'var(--pc-headline-family)',
            fontSize: '28pt',
            fontWeight: 800,
            letterSpacing: '0.02em',
          }">
            {{ card.resolvedContent.phoneNumber }}
          </div>
        </div>
      </div>

      <!-- HEADLINE on the photo zone — multi-color, multi-tier
           Halbert: RED = attention/problem, bridge = transition,
           brand-color = action/solution -->
      <div
        class="absolute flex flex-col justify-end"
        :style="{
          top: '12%',
          left: '4%',
          bottom: `calc(var(--pc-front-offer-h) + var(--pc-front-info-h) + 3%)`,
          maxWidth: '58%',
        }"
      >
        <!-- RED attention line — the HOOK -->
        <div
          v-if="card.resolvedContent.headline.includes(':')"
          :style="{
            fontFamily: 'var(--pc-headline-family)',
            fontSize: 'var(--pc-headline-hero-size)',
            fontWeight: 800,
            color: 'var(--pc-front-headline-color)',
            lineHeight: 1.0,
            textTransform: 'uppercase',
          }"
        >
          {{ card.resolvedContent.headline.split(':')[0] + ':' }}
        </div>
        <!-- Bridge line with stakes (Halbert) -->
        <div :style="{
          fontSize: '15pt',
          fontWeight: 500,
          color: '#FFFFFF',
          lineHeight: 1.2,
          marginTop: '0.03in',
          marginBottom: '0.03in',
        }">
          — don't wait until it breaks —
        </div>
        <!-- Brand-color ACTION line — the SOLUTION -->
        <h3 :style="{
          fontFamily: 'var(--pc-headline-family)',
          fontSize: 'var(--pc-headline-action-size)',
          fontWeight: 800,
          color: primary,
          lineHeight: 0.92,
          textTransform: 'uppercase',
          margin: 0,
        }">
          {{ card.resolvedContent.headline.includes(':')
            ? card.resolvedContent.headline.split(':').slice(1).join(':').trim()
            : card.resolvedContent.headline }}
        </h3>
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

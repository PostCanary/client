<script setup lang="ts">
import { computed } from "vue";
import type { CardDesign, TrustBadge } from "@/types/campaign";
import LockedZoneOverlay from "@/components/design/LockedZoneOverlay.vue";
import OfferBox from "@/components/design/OfferBox.vue";
import CTABox from "@/components/design/CTABox.vue";
import RatingBadge from "@/components/design/RatingBadge.vue";
import TrustBadges from "@/components/design/TrustBadges.vue";
import { ensureContrast } from "@/utils/contrast";

// Brief #6 Task 9 — PostcardBack rewrite with 6-block layout.
//
// Left column (content, ~4.25"):
//   Return address strip
//   1. OfferBox           (Johnson Box — offer leads, Halbert fix)
//   2. CTABox             (phone biggest element, Gendusa fix §3)
//   3. RatingBadge + quote (social proof supporting the offer)
//   4. TrustBadges        (row — supportive, not dominant)
//   5. Risk reversal      (one line)
//   6. Local proof        (serving since YEAR)
//
// Right column (~4.25", USPS locked):
//   Permit indicia
//   Recipient address block
//   IMb barcode
//   LockedZoneOverlay visual cue
//
// (Gendusa fix §3: max 6 visual blocks, each scannable in 1 second.)

const props = defineProps<{
  card: CardDesign;
  brandColors?: string[];
  businessName?: string;
  businessAddress?: string;
  // --- New props from Brief #6 extraction pipeline ---
  rating?: number | null;        // Google rating (business's own claim on print)
  reviewCount?: number | null;
  trustBadges?: TrustBadge[];
  yearsInBusiness?: number | null;
  city?: string;                 // For "Serving {city} since {year}" local proof
}>();

// Brand color defaults — muted teal + navy — same fallback as PostcardFront.
const primary = computed(() => props.brandColors?.[1] ?? "#0b2d50");
const accent = computed(() => props.brandColors?.[0] ?? "#47bfa9");

const textOnWhite = computed(() => ensureContrast("#333333", "#FFFFFF"));

// Offer items: V1 ships without structured item breakdowns because the
// existing CardDesign shape doesn't have them. Task 10 (AI generation
// updates) will populate structured items on the server. For V1, we pass
// an empty items list and the OfferBox just renders the headline + deadline.
const offerItems = computed(() => [] as { label: string; value?: string }[]);

// Local proof line — "Serving {city} since {year}" when we have both,
// otherwise fall back to whichever we have.
const localProof = computed(() => {
  const year =
    props.yearsInBusiness && props.yearsInBusiness > 0
      ? new Date().getFullYear() - props.yearsInBusiness
      : null;
  if (props.city && year) return `Serving ${props.city} since ${year}`;
  if (props.city) return `Proudly serving ${props.city}`;
  if (year) return `In business since ${year}`;
  return "";
});

const hasRating = computed(
  () => typeof props.rating === "number" && props.rating > 0
);
</script>

<template>
  <div
    class="pc-card relative rounded-lg overflow-hidden bg-white border border-gray-200"
    :style="{ aspectRatio: '9 / 6' }"
  >
    <!-- Top strip: return address (left) + indicia (right) -->
    <div
      class="absolute top-0 inset-x-0 flex justify-between items-start px-3 pt-2 pb-1 border-b border-gray-100 z-20"
      :style="{ color: textOnWhite }"
    >
      <div class="pc-body" :style="{ lineHeight: 1.2 }">
        <div :style="{ fontWeight: 600 }">{{ businessName }}</div>
        <div :style="{ opacity: 0.75 }">{{ businessAddress }}</div>
      </div>
      <div
        class="pc-badge text-right"
        :style="{
          border: '0.5pt solid #999',
          padding: '0.03in 0.08in',
          color: '#666',
          lineHeight: 1.25,
        }"
      >
        PRSRT STD<br />
        U.S. POSTAGE<br />
        PAID
      </div>
    </div>

    <div class="flex h-full pt-10">
      <!-- LEFT: 6-block content column -->
      <div
        class="flex flex-col"
        :style="{
          width: 'var(--pc-content-col-w)',
          padding: 'var(--pc-section-gap)',
          gap: 'var(--pc-gutter)',
        }"
      >
        <!-- Block 1: Offer (Johnson Box) -->
        <OfferBox
          :headline="card.resolvedContent.offerText"
          :items="offerItems"
          :deadline="card.resolvedContent.urgencyText || undefined"
          :primary-color="primary"
        />

        <!-- Block 2: CTA -->
        <CTABox
          :phone="card.resolvedContent.phoneNumber"
          :website="card.backContent.websiteUrl"
          :qr-code-url="card.backContent.qrCodeUrl || undefined"
          :primary-color="primary"
        />

        <!-- Block 3: Rating + one review quote -->
        <div v-if="hasRating || card.resolvedContent.reviewQuote" class="flex flex-col" :style="{ gap: 'var(--pc-gutter)' }">
          <RatingBadge
            v-if="hasRating && reviewCount"
            :rating="rating as number"
            :review-count="reviewCount as number"
            :primary-color="accent"
          />
          <p
            v-if="card.resolvedContent.reviewQuote"
            class="pc-review-quote"
            :style="{ color: textOnWhite }"
          >
            "{{ card.resolvedContent.reviewQuote }}"
            <span
              class="pc-credibility"
              :style="{ fontStyle: 'normal', marginLeft: '0.06in', opacity: 0.8 }"
            >
              — {{ card.resolvedContent.reviewerName }}
            </span>
          </p>
        </div>

        <!-- Block 4: Trust badges row -->
        <TrustBadges
          v-if="(trustBadges && trustBadges.length) || true"
          :badges="trustBadges ?? []"
          :show-licensed-insured="true"
          :primary-color="primary"
        />

        <!-- Block 5: Risk reversal -->
        <p
          v-if="card.resolvedContent.riskReversal"
          class="pc-body"
          :style="{ color: textOnWhite, fontWeight: 600 }"
        >
          {{ card.resolvedContent.riskReversal }}
        </p>

        <!-- Block 6: Local proof -->
        <p
          v-if="localProof"
          class="pc-body"
          :style="{ color: textOnWhite, opacity: 0.75, marginTop: 'auto' }"
        >
          {{ localProof }}
        </p>
      </div>

      <!-- RIGHT: USPS locked zone (preserved) -->
      <div
        class="relative flex-1"
        :style="{ width: 'var(--pc-usps-col-w)' }"
      >
        <LockedZoneOverlay />
        <div class="p-3 flex flex-col justify-between h-full">
          <!-- Recipient address block — centered vertically per USPS -->
          <div
            class="pc-body text-gray-500 mt-auto"
            :style="{ lineHeight: 1.35, marginTop: '0.8in' }"
          >
            <div>John Doe</div>
            <div>123 Main Street</div>
            <div>Scottsdale, AZ 85251</div>
          </div>
          <!-- IMb barcode placeholder — bottom-aligned -->
          <div class="mt-2">
            <div class="h-3 bg-gray-200 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

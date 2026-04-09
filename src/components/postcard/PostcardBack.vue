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
  // P1-A fix 2026-04-10: hide the "John Doe / 123 Main Street" placeholder
  // in the address block when previewing (dev route + wizard preview). In
  // production the address block is populated at mail-merge time by the
  // print partner's automation from the Melissa Data list, so the preview
  // placeholder is meaningless — and Drake flagged it as distracting
  // during session 32 visual review. Defaults to showing the placeholder
  // (real/print mode) to preserve existing behavior.
  hideAddressPlaceholder?: boolean;
}>();

// Brand color defaults — muted teal + navy — same fallback as PostcardFront.
const primary = computed(() => props.brandColors?.[1] ?? "#0b2d50");
const accent = computed(() => props.brandColors?.[0] ?? "#47bfa9");

const textOnWhite = computed(() => ensureContrast("#333333", "#FFFFFF"));

// Offer items: pulled directly from `card.resolvedContent.offerItems`,
// which is populated by:
//   1. Server AI generator (usePostcardGenerator.ts path) — TODO Task 10
//   2. Dev route's mock CardDesign (for P0-F visual verification)
//   3. Customer overrides via the Design Studio editor (V1.1)
// Back-compat: if offerItems is missing or empty, the OfferBox renders
// just the headline + deadline — same as before 2026-04-10.
const offerItems = computed(
  () => props.card.resolvedContent.offerItems ?? []
);

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
    <!-- Top strip: absolute-positioned along top edge. Natural flex-flow was
         tried in an earlier pass but made the content column shrink by ~35px
         (PRSRT STD indicia forces the strip to ~75px tall), causing Block 5
         (risk reversal) to fall off the bottom of the 6" card at default.
         Absolute positioning with `pt-14` clearance on the main content flex
         lets the content col use the full card height minus a fixed 56px
         strip allowance. Long businessName is truncated via nowrap + ellipsis
         below so the strip never actually wraps. -->
    <div
      class="absolute top-0 inset-x-0 flex justify-between items-start px-3 pt-2 pb-1 border-b border-gray-100 z-20"
      :style="{ color: textOnWhite }"
    >
        <!-- Return address block — constrained to 2 lines via nowrap +
             max-width so a long businessName truncates with ellipsis
             instead of wrapping and pushing content below down off the
             6" card height (Codex Pass 2 HIGH finding). -->
        <div
          class="pc-body"
          :style="{
            lineHeight: 1.2,
            maxWidth: '5.5in',
            overflow: 'hidden',
          }"
        >
          <div
            :style="{
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }"
          >
            {{ businessName }}
            <span
              v-if="localProof"
              :style="{
                opacity: 0.65,
                fontStyle: 'italic',
                fontWeight: 400,
                marginLeft: '0.1in',
              }"
            >
              · {{ localProof }}
            </span>
          </div>
          <div
            :style="{
              opacity: 0.75,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }"
          >
            {{ businessAddress }}
          </div>
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

    <!-- Main 2-col layout. pt-14 = 56px clears the absolute top strip
         (typically ~50px tall: 2 lines of pc-body + border + padding,
         plus the 3-line PRSRT STD indicia on the right — items-start
         means both sides are top-aligned so the strip as a whole takes
         the max child height, but content only needs to clear the
         visible strip area ~50px). -->
    <div class="flex h-full pt-14">
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
          :qr-code-url="card.backContent.qrCodeUrl"
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

        <!-- Block 6 (local proof) removed 2026-04-09 — merged into the
             top-strip return address as "Serving [city] since [year]" per
             visual audit P1 #6. Keeping it as a separate block overflowed
             the 6" card height at 1.0 scale. -->
      </div>

      <!-- RIGHT: USPS locked zone. Width reclaimed from 4.25in → 3.0in in
           session 32 (P0 #2). A further reclaim to 2.25in was attempted in
           session 33 as part of the §202.5.3 in-block IMb pivot but
           reverted — OCR requires ≥2.75in for long addresses at 11pt, and
           true 2.25in requires an absolute-layout refactor (see
           print-scale.css comment). The §202.5.3 pivot DID land for the
           barcode itself: the standalone bottom-right 4.75"×0.625" clear
           zone is gone, replaced by an in-block IMb simulation directly
           under the address lines (drake-memory ID 116). -->
      <div
        class="relative flex-1"
        :style="{ width: 'var(--pc-usps-col-w)' }"
      >
        <LockedZoneOverlay />
        <div class="p-3 flex flex-col justify-between h-full">
          <!-- Recipient address block — centered vertically. Includes a
               single-line IMb barcode placeholder inside the block
               (§202.5.3 in-block IMb). The 2pt horizontal rule simulates
               the printed barcode bars for preview purposes; production
               rendering uses an actual font-based or SVG IMb glyph. -->
          <!-- Recipient address block + in-block IMb. The address text
               placeholder hides via v-if under hideAddressPlaceholder (P1-A
               fix — Drake flagged distracting mock names in preview mode).
               The IMb bar block stays rendered either way so the §202.5.3
               in-block barcode location is always visually present, which
               is the point of the §202.5.3 pivot (drake-memory ID 116). -->
          <div
            class="pc-body text-gray-500 mt-auto"
            :style="{ lineHeight: 1.35, marginTop: '0.8in' }"
          >
            <template v-if="!hideAddressPlaceholder">
              <div>John Doe</div>
              <div>123 Main Street</div>
              <div>Scottsdale, AZ 85251</div>
            </template>
            <!-- Reserved vertical space for the real address when the
                 placeholder is hidden, so the IMb bar position and the
                 column height budget don't shift between dev preview and
                 production render. -->
            <div
              v-else
              :style="{ height: '0.6in' }"
              aria-hidden="true"
            />
            <!-- In-block IMb (simulated): bars under the address line.
                 Real IMb glyph is rendered at print time by the print
                 partner's automation. DMM §202.5.3(d): bars ≥0.028"
                 below the info lines, rightmost bar ≥0.5" from piece
                 right edge, total barcode ≤10.5" from right edge. -->
            <div
              class="mt-1"
              :style="{
                height: '0.15in',
                backgroundImage: 'repeating-linear-gradient(to right, #333 0, #333 1pt, transparent 1pt, transparent 3pt)',
              }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ensureContrast, safeTextColor } from "@/utils/contrast";

// Brief #6 Task 8 — OfferBox.
//
// The Johnson Box (Halbert fix): bordered, highlighted area at the top of
// the back content column that contains the main offer. First thing the eye
// hits when the recipient flips the card. Offer leads; stars support.
//
// Mandatory anchored value stack (Halbert fix §4):
//   Original price + itemized breakdown + customer price + savings + deadline
// Unanchored offers ("$50 off") don't convert. Every prop here is required
// except savings (derivable).

const props = defineProps<{
  headline: string; // e.g., "$277 VALUE FOR JUST $79"
  items: { label: string; value?: string }[]; // Itemized breakdown
  customerPrice?: string; // Optional — often embedded in headline
  savings?: string; // e.g., "You save $198"
  deadline?: string; // e.g., "Offer expires May 15, 2026" — inside the box
  primaryColor?: string; // Brand accent for border + headline bg
}>();

const primary = computed(() => props.primaryColor ?? "#0b2d50");
const textOnPrimary = computed(() => safeTextColor(primary.value));
const textOnWhite = computed(() => ensureContrast(primary.value, "#FFFFFF"));
</script>

<template>
  <div
    class="pc-offer-box"
    :style="{
      border: `var(--pc-border-offer) ${primary}`,
      padding: 'var(--pc-block-padding)',
      backgroundColor: '#FFFFFF',
    }"
  >
    <!-- Headline bar — strong visual anchor, brand color background -->
    <div
      class="pc-offer-headline text-center"
      :style="{
        backgroundColor: primary,
        color: textOnPrimary,
        padding: '0.1in 0.125in',
        marginLeft: 'calc(-1 * var(--pc-block-padding))',
        marginRight: 'calc(-1 * var(--pc-block-padding))',
        marginTop: 'calc(-1 * var(--pc-block-padding))',
        marginBottom: 'var(--pc-gutter)',
      }"
    >
      {{ headline }}
    </div>

    <!-- Itemized value stack — checkmark list -->
    <ul class="pc-offer-items" :style="{ listStyle: 'none', padding: 0, margin: 0 }">
      <li
        v-for="(item, i) in items"
        :key="i"
        class="pc-offer-item"
        :style="{ color: textOnWhite, display: 'flex', justifyContent: 'space-between', gap: 'var(--pc-gutter)' }"
      >
        <span>
          <span :style="{ color: primary, fontWeight: 700, marginRight: '0.06in' }">✓</span>
          {{ item.label }}
        </span>
        <span v-if="item.value" class="pc-offer-item-value" :style="{ fontWeight: 600 }">
          {{ item.value }}
        </span>
      </li>
    </ul>

    <!-- Savings callout — right-aligned, brand color text -->
    <div
      v-if="savings"
      class="pc-offer-item text-right"
      :style="{
        marginTop: 'var(--pc-gutter)',
        color: primary,
        fontWeight: 700,
      }"
    >
      {{ savings }}
    </div>

    <!-- Customer price (optional, if not already in headline) -->
    <div
      v-if="customerPrice"
      class="pc-offer-headline text-center"
      :style="{
        marginTop: 'var(--pc-gutter)',
        color: primary,
      }"
    >
      {{ customerPrice }}
    </div>

    <!-- Deadline — inside the box (Halbert fix §4), not a footnote -->
    <div
      v-if="deadline"
      class="pc-body text-center"
      :style="{
        marginTop: 'var(--pc-gutter)',
        paddingTop: 'var(--pc-gutter)',
        borderTop: `1pt dashed ${primary}`,
        color: textOnWhite,
        fontWeight: 600,
      }"
    >
      {{ deadline }}
    </div>
  </div>
</template>

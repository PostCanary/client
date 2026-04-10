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
  accentColor?: string; // P-43 urgency color for deadline (defaults to primary)
}>();

const primary = computed(() => props.primaryColor ?? "#0b2d50");
const accent = computed(() => props.accentColor ?? primary.value);
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
      borderRadius: 'var(--pc-radius)',
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

    <!-- Deadline — P-13/P-43 urgency treatment: bold accent-color bar,
         not italic fine print. Full-width inside the Johnson Box. -->
    <div
      v-if="deadline"
      class="pc-badge text-center"
      :style="{
        marginTop: 'var(--pc-gutter)',
        padding: '0.05in 0.08in',
        backgroundColor: accent,
        color: '#FFFFFF',
        fontWeight: 800,
        fontSize: '12pt',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        borderRadius: 'var(--pc-radius)',
        marginLeft: 'calc(-1 * var(--pc-block-padding))',
        marginRight: 'calc(-1 * var(--pc-block-padding))',
        marginBottom: 'calc(-1 * var(--pc-block-padding))',
      }"
    >
      {{ deadline }}
    </div>
  </div>
</template>

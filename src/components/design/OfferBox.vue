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
// B-01: when on a dark background, items and text are white
const itemColor = computed(() => "#FFFFFF");
</script>

<template>
  <div
    class="pc-offer-box"
    :style="{
      padding: 'var(--pc-block-padding)',
      borderRadius: 'var(--pc-radius)',
    }"
  >
    <!-- Headline bar — DOMINANT, brand color background, biggest text
         in the offer box. Pro postcards: this bar is impossible to miss. -->
    <div
      class="text-center"
      :style="{
        backgroundColor: primary,
        color: textOnPrimary,
        padding: '0.12in 0.15in',
        marginLeft: 'calc(-1 * var(--pc-block-padding))',
        marginRight: 'calc(-1 * var(--pc-block-padding))',
        marginTop: 'calc(-1 * var(--pc-block-padding))',
        marginBottom: 'var(--pc-gutter)',
        fontFamily: `'Oswald', 'Impact', 'Arial Narrow', sans-serif`,
        fontSize: '22pt',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
        lineHeight: 1.1,
        borderRadius: 'var(--pc-radius)',
      }"
    >
      {{ headline }}
    </div>

    <!-- Itemized value stack — checkmark list, BOLD values right-aligned -->
    <ul :style="{ listStyle: 'none', padding: 0, margin: 0 }">
      <li
        v-for="(item, i) in items"
        :key="i"
        :style="{
          color: itemColor,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 'var(--pc-gutter)',
          fontSize: '12pt',
          fontWeight: 500,
          lineHeight: 1.5,
        }"
      >
        <span>
          <span :style="{ color: accent, fontWeight: 800, marginRight: '0.06in' }">✓</span>
          {{ item.label }}
        </span>
        <span v-if="item.value" :style="{ fontWeight: 700, whiteSpace: 'nowrap' }">
          {{ item.value }}
        </span>
      </li>
    </ul>

    <!-- Savings callout — right-aligned, brand color, bold -->
    <div
      v-if="savings"
      class="text-right"
      :style="{
        marginTop: 'var(--pc-gutter)',
        color: accent,
        fontWeight: 800,
        fontSize: '13pt',
      }"
    >
      {{ savings }}
    </div>

    <!-- Customer price (optional, if not already in headline) -->
    <div
      v-if="customerPrice"
      class="text-center"
      :style="{
        marginTop: 'var(--pc-gutter)',
        color: accent,
        fontFamily: `'Oswald', 'Impact', 'Arial Narrow', sans-serif`,
        fontSize: '18pt',
        fontWeight: 700,
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

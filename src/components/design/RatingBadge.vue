<script setup lang="ts">
import { computed } from "vue";
import { ensureContrast } from "@/utils/contrast";

// Phase 2 (Draplin gate): audited — no rounded corners, no shadows,
// inline flex rendering in the back content column. No changes needed.
//
// Brief #6 Task 8 — RatingBadge.
//
// Google Places TOS workaround (Hunt fix §6, plan v2 §Security):
// Google's Places API TOS prohibits displaying their star-rating format on
// printed mail. We display the rating as the business's own claim:
//
//     ★★★★★ 4.9/5 — 127 customers
//
// with our OWN star icons, no Google branding, no Google logo, no "Google"
// word adjacent. The rating value is still sourced from Google Places — we
// just don't render it with Google's trade dress on print.
//
// Web app rendering (permitted Customer Application use) can still say
// "4.9 ★★★★★ on Google — 127 reviews" with attribution, but that's a
// different component.

const props = defineProps<{
  rating: number;      // 1.0 - 5.0
  reviewCount: number;
  label?: string;      // e.g., "customers" | "reviews" | "homeowners"
  primaryColor?: string;
}>();

const primary = computed(() => props.primaryColor ?? "#F59E0B"); // amber default for stars
const textColor = computed(() => ensureContrast("#333333", "#FFFFFF"));
const label = computed(() => props.label ?? "customers");

// Render 5 star chars based on rating (half-stars via a single ½ character
// would require a custom SVG; for V1 we round to the nearest integer which
// is visually indistinguishable at postcard scale).
const filled = computed(() => Math.round(props.rating));
</script>

<template>
  <div class="pc-rating-badge" :style="{ display: 'flex', alignItems: 'center', gap: 'var(--pc-gutter)', color: textColor }">
    <!-- Custom non-Google stars. Five Unicode black stars with brand color
         fill for the filled count, muted for the rest. -->
    <span
      class="pc-offer-headline"
      :style="{ color: primary, letterSpacing: '0.02em', lineHeight: 1 }"
      aria-hidden="true"
    >
      <span v-for="i in 5" :key="i" :style="{ opacity: i <= filled ? 1 : 0.25 }">★</span>
    </span>
    <!-- Numeric rating -->
    <span
      class="pc-offer-headline"
      :style="{ fontWeight: 800 }"
    >
      {{ rating.toFixed(1) }}/5
    </span>
    <!-- Review count + label -->
    <span class="pc-body" :style="{ opacity: 0.85 }">
      — {{ reviewCount }} {{ label }}
    </span>
  </div>
</template>

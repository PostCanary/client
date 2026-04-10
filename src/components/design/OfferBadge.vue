<script setup lang="ts">
import { computed } from "vue";
import { ensureContrast, safeTextColor } from "@/utils/contrast";

// Visual taste audit 2026-04-09 — front-of-card offer teaser.
//
// Reverses the earlier "no offer on front" decision from Brief #6 Task 7.
// The reference corpus (PostcardMania HVAC gallery, Wise Pelican roofing,
// Mail Shark oversized samples) showed 100% of PostcardMania HVAC and ~90%
// of Mail Shark samples include a front-offer teaser — a burst, ribbon, or
// badge. The Gendusa rule against "offer on front" was misread in Brief #6:
// the actual rule is "no STACKED offer on front" (the 3-5 item value stack
// belongs on the back). A SINGLE short teaser on the front is the norm.
//
// Two variants:
//
//  - "burst": a round "stamp"-style badge with a bright bg and a contrasting
//    ring. Classic direct-mail price-circle vocabulary. Positioned absolute
//    by the parent (usually top-right over the hero photo).
//
//  - "ribbon": a diagonal corner banner rotated 45deg, pinned to the top-right
//    corner. Relies on the parent having overflow-hidden (.pc-card does).
//    Cleaner / more minimal than burst. Works well on photo-top and bold-
//    graphic layouts where a burst would feel too loud.
//
// Both variants expect ≤4 words of text. Enforcement of that length lives at
// AI generation time (scraper prompt), NOT here — this component renders
// whatever text it's given. Consumers can truncate upstream if needed.
//
// Print notes:
//  - All sizes in physical units (pt / in) so print output matches preview.
//  - High-contrast color pairs routed through ensureContrast() — brand
//    colors that fail WCAG against their background fall back to black /
//    white automatically.
//  - No SVG / no animations — print-safe plain CSS only.

const props = defineProps<{
  text: string;                    // "$79 TUNE-UP", "$50 OFF", "FREE ESTIMATE"
  variant?: "burst" | "ribbon";    // default "burst"
  primaryColor?: string;           // accent color (amber, red, yellow typical)
  darkColor?: string;              // brand dark (for ribbon bg)
}>();

const variant = computed(() => props.variant ?? "burst");
const primary = computed(() => props.primaryColor ?? "#F59E0B"); // amber default
const dark = computed(() => props.darkColor ?? "#0b2d50");       // navy default

// Burst: bright bg (primary), contrasting text, dark ring border.
const burstBg = computed(() => primary.value);
const burstText = computed(() => safeTextColor(burstBg.value));
const burstRing = computed(() => dark.value);

// Ribbon: dark bg, light text. Contrast-checked.
const ribbonBg = computed(() => dark.value);
const ribbonText = computed(() => ensureContrast("#FFFFFF", ribbonBg.value));

// Empty text → render nothing. Consumers should guard with v-if when the
// offer teaser is unknown, but we also no-op defensively here.
const hasText = computed(() => !!(props.text && props.text.trim().length > 0));
</script>

<template>
  <!-- BURST: round stamp. Parent positions via absolute. -->
  <div
    v-if="hasText && variant === 'burst'"
    class="pc-offer-badge pc-offer-badge--burst"
    :style="{
      width: '1.35in',
      height: '1.35in',
      borderRadius: '50%',
      backgroundColor: burstBg,
      color: burstText,
      border: `3pt solid ${burstRing}`,
      boxShadow: 'var(--pc-shadow-brand)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '0.15in',
      lineHeight: 1.05,
      transform: 'rotate(-8deg)',
      transformOrigin: 'center',
    }"
  >
    <span
      :style="{
        fontSize: '18pt',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '0.015em',
      }"
    >
      {{ text }}
    </span>
  </div>

  <!-- RIBBON: diagonal corner banner. Parent must be overflow-hidden.
       Positioned absolute by this component itself (top-right corner). -->
  <div
    v-else-if="hasText && variant === 'ribbon'"
    class="pc-offer-badge pc-offer-badge--ribbon"
    :style="{
      position: 'absolute',
      top: '0.55in',
      right: '-1.1in',
      width: '4in',
      transform: 'rotate(45deg)',
      transformOrigin: 'center',
      backgroundColor: ribbonBg,
      color: ribbonText,
      textAlign: 'center',
      padding: '0.08in 0',
      boxShadow: 'var(--pc-shadow-brand)',
      pointerEvents: 'none',
      zIndex: 5,
    }"
  >
    <span
      :style="{
        fontSize: '14pt',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        whiteSpace: 'nowrap',
      }"
    >
      {{ text }}
    </span>
  </div>
</template>

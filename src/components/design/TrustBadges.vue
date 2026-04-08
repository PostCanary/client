<script setup lang="ts">
import { computed } from "vue";
import type { TrustBadge } from "@/types/campaign";
import { ensureContrast } from "@/utils/contrast";

// Brief #6 Task 8 — TrustBadges.
//
// Horizontal row of trust indicators (BBB, Angi, HomeAdvisor, Yelp,
// "Licensed & Insured", etc). Small and supportive — NOT dominant. The
// offer leads, stars support, trust badges reinforce. (Gendusa fix §3:
// trust badges are block #4, not block #1.)
//
// Each badge renders as a small pill with a text label. Image-based
// badges (BBB emblem, Angi A+ badge) will come in a future pass when we
// have a badge SVG asset library; for V1 we use text pills.

const props = defineProps<{
  badges: TrustBadge[]; // From BrandKit.trustBadges
  // Whether to include the generic "Licensed & Insured" chip when it's
  // not in the badges list (defaults to true — Gendusa said this is
  // non-negotiable for home services).
  showLicensedInsured?: boolean;
  licensedInsuredText?: string;
  primaryColor?: string;
}>();

const primary = computed(() => props.primaryColor ?? "#0b2d50");
const textColor = computed(() => ensureContrast(primary.value, "#FFFFFF"));
const showLI = computed(() => props.showLicensedInsured !== false);
const liText = computed(() => props.licensedInsuredText ?? "Licensed & Insured");

// Deduplicate: don't show the L&I chip if the badges list already has
// a similar one (e.g., type === 'custom' with label containing "licensed").
const needsLI = computed(() => {
  if (!showLI.value) return false;
  return !props.badges.some((b) => /licen[sc]ed/i.test(b.label));
});
</script>

<template>
  <div
    class="pc-trust-badges"
    :style="{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--pc-gutter)',
      alignItems: 'center',
    }"
  >
    <!-- Explicit brand badges from extraction -->
    <span
      v-for="(badge, i) in badges"
      :key="`b-${i}`"
      class="pc-badge pc-trust-pill"
      :style="{
        border: `1pt solid ${primary}`,
        color: textColor,
        padding: '0.04in 0.08in',
        borderRadius: '2pt',
        whiteSpace: 'nowrap',
      }"
    >
      {{ badge.label }}
    </span>

    <!-- Generic Licensed & Insured chip -->
    <span
      v-if="needsLI"
      class="pc-badge pc-trust-pill"
      :style="{
        border: `1pt solid ${primary}`,
        color: textColor,
        padding: '0.04in 0.08in',
        borderRadius: '2pt',
        whiteSpace: 'nowrap',
      }"
    >
      {{ liText }}
    </span>
  </div>
</template>

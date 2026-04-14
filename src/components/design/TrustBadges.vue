<script setup lang="ts">
import { computed } from "vue";
import type { TrustBadge } from "@/types/campaign";
import bbbBadge from "@/assets/trust-badges/bbb.svg";
import angiBadge from "@/assets/trust-badges/angi.svg";
import hoaBadge from "@/assets/trust-badges/homeadvisor.svg";

// Phase 2 rewrite (D-13, D-14) — real brand artwork, filled color blocks,
// border-radius: 0 per D-04. Replaces the outlined text pills from Brief #6
// which failed patterns P-14 (filled not outlined), P-30 (real brand colors),
// P-36 (border-radius 0).
//
// Nominative fair use rationale: src/assets/trust-badges/README.md.
// Badges only render for businesses that actually hold the credential
// (enforced at scrape time — BrandKit.trustBadges[] is sourced from the
// business's own website / Google Business Profile).

type BadgeKind = "bbb" | "angi" | "homeadvisor" | "generic";

const props = defineProps<{
  badges: TrustBadge[];
  showLicensedInsured?: boolean;
  licensedInsuredText?: string;
  primaryColor?: string;
}>();

function classifyBadge(label: string): BadgeKind {
  if (/bbb/i.test(label)) return "bbb";
  if (/angi/i.test(label)) return "angi";
  if (/home\s*advisor/i.test(label)) return "homeadvisor";
  return "generic";
}

function badgeAsset(kind: BadgeKind): string | null {
  if (kind === "bbb") return bbbBadge;
  if (kind === "angi") return angiBadge;
  if (kind === "homeadvisor") return hoaBadge;
  return null;
}

function badgeFill(kind: BadgeKind, primary: string): string {
  if (kind === "bbb") return "var(--pc-trust-badge-fill-bbb)";
  if (kind === "angi") return "var(--pc-trust-badge-fill-angi)";
  if (kind === "homeadvisor") return "var(--pc-trust-badge-fill-ha)";
  return primary;
}

const primary = computed(() => props.primaryColor ?? "#0b2d50");
const showLI = computed(() => props.showLicensedInsured !== false);
const liText = computed(() => props.licensedInsuredText ?? "LIC. & INS.");

const needsLI = computed(() => {
  if (!showLI.value) return false;
  return !props.badges.some((b) => /licen[sc]ed/i.test(b.label));
});

interface RenderBadge {
  key: string;
  kind: BadgeKind;
  label: string;
}

const renderBadges = computed<RenderBadge[]>(() => {
  const list: RenderBadge[] = props.badges.map((b, i) => ({
    key: `b-${i}`,
    kind: classifyBadge(b.label),
    label: b.label,
  }));
  if (needsLI.value) {
    list.push({ key: "li", kind: "generic", label: liText.value });
  }
  return list;
});
</script>

<template>
  <div
    class="pc-trust-badges"
    :style="{
      display: 'flex',
      flexWrap: 'nowrap',
      gap: 'var(--pc-gutter)',
      alignItems: 'stretch',
      width: '100%',
    }"
  >
    <div
      v-for="b in renderBadges"
      :key="b.key"
      class="pc-trust-badge"
      :style="{
        flex: '1 1 0',
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.04in',
        backgroundColor: badgeFill(b.kind, primary),
        color: 'var(--pc-trust-badge-text)',
        padding: '0.05in 0.08in',
        borderRadius: 'var(--pc-radius)',
        border: '1pt solid rgba(255,255,255,0.5)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }"
    >
      <img
        v-if="badgeAsset(b.kind)"
        :src="badgeAsset(b.kind) as string"
        alt=""
        :style="{
          height: '70%',
          width: 'auto',
          objectFit: 'contain',
          flexShrink: 0,
        }"
      />
      <span
        class="pc-badge"
        :style="{
          color: 'var(--pc-trust-badge-text)',
          fontSize: '10pt',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
        }"
      >
        {{ b.label }}
      </span>
    </div>
  </div>
</template>

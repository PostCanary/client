<script setup lang="ts">
import { computed } from "vue";
import { safeTextColor } from "@/utils/contrast";

// Brief #6 Task 8 + P0 #3 — CTABox.
//
// High-contrast "THIS IS HOW YOU RESPOND" block (Gendusa fix §3). Phone
// number is the biggest element on the back at --pc-phone-back-size (32pt
// after session-33 P0-G upsize from 26pt — pro postcards run 32-40pt on
// the back phone). Website is secondary.
//
// Phase 2 (02-03-04): P-28 CTA label integration — "CALL NOW" is part of
// the phone block, not a separate floating element. Label + phone read as
// one integrated CTA unit. border-radius: var(--pc-radius) = 0.

const props = defineProps<{
  phone: string;
  website?: string;
  qrCodeUrl: string; // Server-rendered QR image URL — required, empty string allowed
  ctaLabel?: string; // e.g., "CALL NOW" — defaults below
  primaryColor?: string; // Brand accent for bg
}>();

const primary = computed(() => props.primaryColor ?? "#0b2d50");
const textOnPrimary = computed(() => safeTextColor(primary.value));
const label = computed(() => props.ctaLabel ?? "CALL NOW");
const hasQrCode = computed(() => !!props.qrCodeUrl && props.qrCodeUrl.length > 0);
</script>

<template>
  <div
    class="pc-cta-box"
    :style="{
      backgroundColor: primary,
      color: textOnPrimary,
      border: `var(--pc-border-cta) ${primary}`,
      padding: 'var(--pc-block-padding)',
      borderRadius: 'var(--pc-radius)',
    }"
  >
    <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--pc-section-gap)' }">
      <!-- Left column: label + phone integrated (P-28) + website (secondary) -->
      <div :style="{ flex: 1, minWidth: 0 }">
        <div
          class="pc-badge"
          :style="{
            opacity: 1,
            marginBottom: 0,
            paddingBottom: '0.02in',
            borderBottom: `1pt solid ${textOnPrimary}`,
            display: 'inline-block',
            fontWeight: 700,
          }"
        >
          {{ label }}
        </div>
        <div class="pc-phone-back" :style="{ marginTop: '0.03in' }">{{ phone }}</div>
        <div
          v-if="website"
          class="pc-credibility"
          :style="{ opacity: 0.9, marginTop: '0.04in' }"
        >
          {{ website }}
        </div>
      </div>

      <!-- Right column: small QR, hidden when server couldn't generate one -->
      <div
        v-if="hasQrCode"
        :style="{
          flexShrink: 0,
          width: '0.85in',
          height: '0.85in',
          backgroundColor: '#FFFFFF',
          padding: '0.05in',
          borderRadius: 'var(--pc-radius)',
        }"
      >
        <img
          :src="qrCodeUrl"
          alt=""
          :style="{ width: '100%', height: '100%', objectFit: 'contain' }"
        />
      </div>
    </div>
  </div>
</template>

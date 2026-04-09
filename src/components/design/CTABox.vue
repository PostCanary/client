<script setup lang="ts">
import { computed } from "vue";
import { safeTextColor } from "@/utils/contrast";

// Brief #6 Task 8 + P0 #3 — CTABox.
//
// High-contrast "THIS IS HOW YOU RESPOND" block (Gendusa fix §3). Phone
// number is the biggest element on the back at --pc-phone-back-size (26pt).
// Website is secondary.
//
// qrCodeUrl is REQUIRED (P0 #3, V1 spec line 1008: "QR code minimum: 0.75"
// × 0.75" on printed card. Enforced by template."). The server generates
// the image from brand kit data at scrape/update time. Callers must pass
// a string — empty string is allowed for the rare case where neither a
// website URL nor a phone number is available, in which case the QR block
// is hidden rather than shown as a broken image.

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
    }"
  >
    <div :style="{ display: 'flex', alignItems: 'center', gap: 'var(--pc-section-gap)' }">
      <!-- Left column: label + phone (primary) + website (secondary) -->
      <div :style="{ flex: 1, minWidth: 0 }">
        <div class="pc-badge" :style="{ opacity: 0.85, marginBottom: '0.04in' }">
          {{ label }}
        </div>
        <div class="pc-phone-back">{{ phone }}</div>
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
          borderRadius: '2pt',
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

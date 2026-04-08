<script setup lang="ts">
import { computed } from "vue";
import { safeTextColor } from "@/utils/contrast";

// Brief #6 Task 8 — CTABox.
//
// High-contrast "THIS IS HOW YOU RESPOND" block (Gendusa fix §3). Phone
// number is the biggest element on the back at --pc-phone-back-size (26pt).
// Website is secondary. QR is optional, small, beside the phone — not a
// standalone element (Gendusa fix §7: QR scan rate on postcards is 1-3%).

const props = defineProps<{
  phone: string;
  website?: string;
  qrCodeUrl?: string; // Pre-rendered QR image URL — optional
  ctaLabel?: string; // e.g., "CALL NOW" — defaults below
  primaryColor?: string; // Brand accent for bg
}>();

const primary = computed(() => props.primaryColor ?? "#0b2d50");
const textOnPrimary = computed(() => safeTextColor(primary.value));
const label = computed(() => props.ctaLabel ?? "CALL NOW");
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

      <!-- Right column: small QR, only if provided -->
      <div
        v-if="qrCodeUrl"
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

<script setup lang="ts">
import type { ConfidenceTier } from "@/api/demographics";

defineProps<{
  tier: ConfidenceTier;
  matchCount: number;
}>();
</script>

<template>
  <div v-if="tier === 'insufficient'" class="confidence-banner insufficient">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
    <div class="banner-text">
      <strong>Not enough matched data to generate reliable insights.</strong>
      You currently have {{ matchCount }} match{{ matchCount === 1 ? '' : 'es' }}.
      Upload more mail and CRM data to unlock demographic recommendations.
    </div>
  </div>

  <div v-else-if="tier === 'low'" class="confidence-banner low">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
    <div class="banner-text">
      <strong>Limited data</strong> — insights will become more accurate as you upload more campaigns.
      Based on {{ matchCount }} match{{ matchCount === 1 ? '' : 'es' }}.
    </div>
  </div>
</template>

<style scoped>
.confidence-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 20px;
  border-radius: var(--app-card-radius, 12px);
  font-size: 13px;
  line-height: 1.5;
}

.confidence-banner svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.confidence-banner.insufficient {
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #b91c1c;
}

.confidence-banner.insufficient svg {
  color: #ef4444;
}

.confidence-banner.low {
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.2);
  color: #92400e;
}

.confidence-banner.low svg {
  color: #f59e0b;
}

.banner-text strong {
  font-weight: 600;
}

@media (max-width: 640px) {
  .confidence-banner {
    font-size: 14px;
    padding: 12px 16px;
  }
}
</style>

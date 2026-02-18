<!-- src/components/analytics/AnalyticsHeroCards.vue -->
<script setup lang="ts">
import type { KPIs } from "@/api/runs";

const props = defineProps<{
  kpis: KPIs | null;
}>();

const fmtInt = (n: number) =>
  Number.isFinite(n)
    ? n.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : "0";

const fmtMoney = (n: number) =>
  Number.isFinite(n)
    ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
    : "$0.00";

const fmtPct = (n: number) => {
  const raw = Number.isFinite(n) ? n : 0;
  const v = raw <= 1 ? raw * 100 : raw;
  return `${v.toFixed(1)}%`;
};
</script>

<template>
  <div class="hero-grid" v-if="kpis">
    <!-- Match Rate -->
    <div class="hero-card">
      <div class="hero-card-accent"></div>
      <div class="hero-card-body">
        <div class="hero-value">{{ fmtPct(kpis.match_rate) }}</div>
        <div class="hero-label">Match Rate</div>
      </div>
    </div>

    <!-- Revenue -->
    <div class="hero-card">
      <div class="hero-card-accent"></div>
      <div class="hero-card-body">
        <div class="hero-value">{{ fmtMoney(kpis.match_revenue) }}</div>
        <div class="hero-label">Match Revenue</div>
      </div>
    </div>

    <!-- Total Matches -->
    <div class="hero-card">
      <div class="hero-card-accent"></div>
      <div class="hero-card-body">
        <div class="hero-value">{{ fmtInt(kpis.matches) }}</div>
        <div class="hero-label">Total Matches</div>
      </div>
    </div>

    <!-- Median Days to Convert -->
    <div class="hero-card">
      <div class="hero-card-accent"></div>
      <div class="hero-card-body">
        <div class="hero-value">{{ fmtInt(kpis.median_days_to_convert) }}</div>
        <div class="hero-label">Median Days to Convert</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.hero-card {
  background: var(--app-card-bg, #fff);
  border-radius: var(--app-card-radius, 12px);
  box-shadow: var(--app-card-shadow, 0 1px 3px rgba(12,45,80,.06), 0 8px 24px rgba(12,45,80,.04));
  overflow: hidden;
}

.hero-card-accent {
  height: 4px;
  background: linear-gradient(90deg, var(--app-navy, #0b2d50), var(--app-navy-light, #163b69));
}

.hero-card-body {
  padding: 20px;
}

.hero-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--app-text, #0c2d50);
  letter-spacing: -0.5px;
  line-height: 1.1;
}

.hero-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-secondary, #64748b);
  margin-top: 6px;
  letter-spacing: 0.01em;
}

@media (max-width: 1024px) {
  .hero-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .hero-grid { grid-template-columns: 1fr 1fr; }
  .hero-value { font-size: 22px; }
}
</style>

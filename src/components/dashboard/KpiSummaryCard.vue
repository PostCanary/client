<!-- src/components/dashboard/KpiSummaryCard.vue -->
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { KPIs } from "@/api/runs";

type BasicStats = {
  total_mail: number;
  unique_mail_addresses: number;
  total_jobs: number;
  matches: number;
  match_rate: number;
  match_revenue: number;
};

type AdvancedStats = {
  revenue_per_mailer: number;
  avg_ticket_per_match: number;
  median_days_to_convert: number;
  convert_30: number; // %
  convert_60: number; // %
  convert_90: number; // %
};

const props = withDefaults(
  defineProps<{
    kpis: KPIs | null;
    loading?: boolean;
    variant?: "hero" | "advanced";
  }>(),
  { variant: "hero" }
);

// --- data state ---
const basic = ref<BasicStats>({
  total_mail: 0,
  unique_mail_addresses: 0,
  total_jobs: 0,
  matches: 0,
  match_rate: 0,
  match_revenue: 0,
});

const adv = ref<AdvancedStats>({
  revenue_per_mailer: 0,
  avg_ticket_per_match: 0,
  median_days_to_convert: 0,
  convert_30: 0,
  convert_60: 0,
  convert_90: 0,
});

// --- helpers ---
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

const matchRateText = computed(() => fmtPct(basic.value.match_rate));

/** Match rate as 0–100 for the progress ring */
const matchRateValue = computed(() => {
  const raw = basic.value.match_rate;
  if (!Number.isFinite(raw) || raw === 0) return 0;
  return raw <= 1 ? raw * 100 : raw;
});

/** SVG circle dash offset for the progress ring */
const ringCircumference = 2 * Math.PI * 36; // r=36
const ringOffset = computed(
  () => ringCircumference - (matchRateValue.value / 100) * ringCircumference
);

// --- react to incoming KPIs ---
watch(
  () => props.kpis,
  (kpis) => {
    const k = (kpis ?? {}) as Partial<KPIs>;

    basic.value = {
      total_mail: Number(k.total_mail ?? 0),
      unique_mail_addresses: Number(k.unique_mail_addresses ?? 0),
      total_jobs: Number(k.total_jobs ?? 0),
      matches: Number(k.matches ?? 0),
      match_rate: Number(k.match_rate ?? 0),
      match_revenue: Number(k.match_revenue ?? 0),
    };

    adv.value = {
      revenue_per_mailer: Number(k.revenue_per_mailer ?? 0),
      avg_ticket_per_match: Number(k.avg_ticket_per_match ?? 0),
      median_days_to_convert: Number(k.median_days_to_convert ?? 0),
      convert_30: Number(k.conv_30d_rate ?? 0),
      convert_60: Number(k.conv_60d_rate ?? 0),
      convert_90: Number(k.conv_90d_rate ?? 0),
    };
  },
  { immediate: true }
);
</script>

<template>
  <!-- ===== HERO VARIANT: 4 prominent stat cards ===== -->
  <div v-if="variant === 'hero'" class="hero-grid" :class="{ 'is-loading': loading }">
    <!-- Match Rate with ring -->
    <div class="hero-card">
      <div class="hero-card-accent"></div>
      <div class="hero-card-body">
        <div class="hero-card-ring-row">
          <svg class="ring-svg" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke="#e2e8f0"
              stroke-width="5"
            />
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke="#47bfa9"
              stroke-width="5"
              stroke-linecap="round"
              :stroke-dasharray="ringCircumference"
              :stroke-dashoffset="ringOffset"
              class="ring-progress"
            />
          </svg>
          <span class="hero-value ring-value">{{ matchRateText }}</span>
        </div>
        <span class="hero-label">Match Rate</span>
      </div>
    </div>

    <!-- Match Revenue -->
    <div class="hero-card">
      <div class="hero-card-accent"></div>
      <div class="hero-card-body">
        <span class="hero-value">{{ fmtMoney(basic.match_revenue) }}</span>
        <span class="hero-label">Match Revenue</span>
      </div>
    </div>

    <!-- Total Matches -->
    <div class="hero-card">
      <div class="hero-card-accent"></div>
      <div class="hero-card-body">
        <span class="hero-value">{{ fmtInt(basic.matches) }}</span>
        <span class="hero-label">Total Matches</span>
      </div>
    </div>

    <!-- Median Days to Convert -->
    <div class="hero-card">
      <div class="hero-card-accent"></div>
      <div class="hero-card-body">
        <span class="hero-value">{{ fmtInt(adv.median_days_to_convert) }}</span>
        <span class="hero-label">Days to Convert</span>
      </div>
    </div>
  </div>

  <!-- ===== ADVANCED VARIANT: secondary metrics panel ===== -->
  <section v-else class="adv-panel" :class="{ 'is-loading': loading }">
    <div class="adv-header">
      <span class="adv-title">Detailed Metrics</span>
      <span v-if="loading" class="adv-loading">Loading...</span>
    </div>

    <div class="adv-grid">
      <div class="adv-stat">
        <span class="adv-stat-label">Total Mail</span>
        <span class="adv-stat-value">{{ fmtInt(basic.total_mail) }}</span>
      </div>
      <div class="adv-stat">
        <span class="adv-stat-label">Unique Addresses</span>
        <span class="adv-stat-value">{{ fmtInt(basic.unique_mail_addresses) }}</span>
      </div>
      <div class="adv-stat">
        <span class="adv-stat-label">Total Jobs</span>
        <span class="adv-stat-value">{{ fmtInt(basic.total_jobs) }}</span>
      </div>
      <div class="adv-stat">
        <span class="adv-stat-label">Revenue / Mailer</span>
        <span class="adv-stat-value">{{ fmtMoney(adv.revenue_per_mailer) }}</span>
      </div>
      <div class="adv-stat">
        <span class="adv-stat-label">Avg Ticket / Match</span>
        <span class="adv-stat-value">{{ fmtMoney(adv.avg_ticket_per_match) }}</span>
      </div>
      <div class="adv-stat">
        <span class="adv-stat-label">Match Rate</span>
        <span class="adv-stat-value">{{ matchRateText }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* =========================================
   HERO VARIANT
   ========================================= */

.hero-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  transition: opacity 0.18s ease;
}

.hero-grid.is-loading {
  opacity: 0.6;
}

.hero-card {
  background: var(--app-card-bg, #fff);
  border-radius: var(--app-card-radius, 12px);
  box-shadow: var(--app-card-shadow, 0 1px 3px rgba(12,45,80,.06), 0 8px 24px rgba(12,45,80,.04));
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.hero-card-accent {
  height: 4px;
  background: linear-gradient(90deg, var(--app-navy, #0b2d50), var(--app-navy-light, #163b69));
}

.hero-card-body {
  padding: 20px 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hero-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--app-text, #0c2d50);
  letter-spacing: -0.5px;
  line-height: 1.1;
}

.hero-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-secondary, #64748b);
  letter-spacing: 0.01em;
}

/* Match Rate ring */
.hero-card-ring-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
}

.ring-svg {
  position: absolute;
  inset: 0;
  width: 80px;
  height: 80px;
  transform: rotate(-90deg);
}

.ring-progress {
  transition: stroke-dashoffset 0.6s ease;
}

.ring-value {
  position: relative;
  font-size: 20px;
  z-index: 1;
}

/* =========================================
   ADVANCED VARIANT
   ========================================= */

.adv-panel {
  background: var(--app-card-bg, #fff);
  border-radius: var(--app-card-radius, 12px);
  box-shadow: var(--app-card-shadow, 0 1px 3px rgba(12,45,80,.06), 0 8px 24px rgba(12,45,80,.04));
  border-left: 4px solid var(--app-navy, #0b2d50);
  overflow: hidden;
  transition: opacity 0.18s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.adv-panel.is-loading {
  opacity: 0.6;
}

.adv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
}

.adv-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
}

.adv-loading {
  font-size: 12px;
  color: var(--app-text-muted, #94a3b8);
}

.adv-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  flex: 1;
}

.adv-stat {
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-top: 1px solid var(--app-border, #e2e8f0);
}

.adv-stat:nth-child(odd) {
  border-right: 1px solid var(--app-border, #e2e8f0);
}

.adv-stat-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--app-text-muted, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.adv-stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
  font-variant-numeric: tabular-nums;
}

/* =========================================
   RESPONSIVE
   ========================================= */

@media (max-width: 1024px) {
  .hero-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .hero-grid {
    grid-template-columns: 1fr 1fr;
  }

  .hero-value {
    font-size: 24px;
  }

  .adv-grid {
    grid-template-columns: 1fr;
  }

  .adv-stat:nth-child(odd) {
    border-right: none;
  }
}
</style>

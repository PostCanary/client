<script setup lang="ts">
import type { DemoHeroKPIs, DemographicView, ConfidenceTier } from "@/api/demographics";

const props = defineProps<{
  hero: DemoHeroKPIs | null;
  view: DemographicView;
  confidenceTier: ConfidenceTier;
}>();

function formatNumber(val: number): string {
  return val.toLocaleString();
}
</script>

<template>
  <div class="hero-grid">
    <div class="hero-card" v-if="view === 'matches'">
      <div class="hero-card-body">
        <div class="hero-label">Your Best Audience</div>
        <template v-if="confidenceTier === 'insufficient'">
          <div class="hero-value small muted">Insufficient data</div>
        </template>
        <template v-else-if="hero?.best_audience">
          <div class="hero-value small">{{ hero.best_audience.label }}</div>
          <div
            class="hero-change"
            :class="hero.best_audience.multiplier > 0 ? 'up' : ''"
            v-if="hero.best_audience.multiplier > 0"
          >
            {{ hero.best_audience.multiplier_text }}
          </div>
          <div class="hero-sub" v-else>
            {{ hero.best_audience.multiplier_text }}
          </div>
        </template>
        <template v-else>
          <div class="hero-value small muted">—</div>
        </template>
      </div>
    </div>

    <div class="hero-card" v-if="view === 'all_customers'">
      <div class="hero-card-body">
        <div class="hero-label">Total Customers</div>
        <div class="hero-value">{{ hero?.total_customers ? formatNumber(hero.total_customers) : "—" }}</div>
        <div class="hero-sub">unique addresses in CRM</div>
      </div>
    </div>

    <div class="hero-card">
      <div class="hero-card-body">
        <div class="hero-label">Top Home Value</div>
        <div class="hero-value small">{{ hero?.top_home_value?.label || "—" }}</div>
        <div class="hero-change up" v-if="hero?.top_home_value?.pct">
          {{ hero.top_home_value.pct_text }}
        </div>
      </div>
    </div>

    <div class="hero-card">
      <div class="hero-card-body">
        <div class="hero-label">Top Income Range</div>
        <div class="hero-value small">{{ hero?.top_income_range?.label || "—" }}</div>
        <div class="hero-change up" v-if="hero?.top_income_range?.pct">
          {{ hero.top_income_range.pct_text }}
        </div>
      </div>
    </div>

    <div class="hero-card">
      <div class="hero-card-body">
        <div class="hero-label">Homeowner Rate</div>
        <div class="hero-value">{{ hero?.homeowner_rate?.value ?? "—" }}%</div>
        <div
          v-if="view === 'matches' && hero?.homeowner_rate?.diff_text"
          class="hero-change"
          :class="(hero?.homeowner_rate?.diff ?? 0) >= 0 ? 'up' : 'down'"
        >
          {{ hero.homeowner_rate.diff_text }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.hero-card {
  background: var(--app-card-bg, #f7f9fb);
  border: 1px solid var(--app-border, #c8d0db);
  border-radius: var(--app-card-radius, 2px);
  border-left: 3px solid var(--pc-canary, #facf41);
  box-shadow: none;
  overflow: hidden;
}

.hero-card-body {
  padding: 16px 18px 14px;
}

.hero-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--app-text-secondary, #5a6b7d);
}

.hero-value {
  font-family: var(--pc-font-display, "Oswald", sans-serif);
  font-size: 28px;
  font-weight: 600;
  color: var(--app-text, #1c2430);
  letter-spacing: 0.02em;
  line-height: 1.1;
  margin-top: 8px;
  font-variant-numeric: tabular-nums;
}

.hero-value.small {
  font-size: 18px;
  letter-spacing: 0.01em;
}

.hero-value.muted {
  color: var(--app-text-muted, #8a97a8);
  font-weight: 500;
  font-family: var(--pc-font-body, "Instrument Sans", sans-serif);
  font-size: 15px;
}

.hero-sub {
  font-size: 12px;
  color: var(--app-text-muted, #8a97a8);
  margin-top: 4px;
  font-weight: 400;
}

.hero-change {
  font-size: 12px;
  font-weight: 600;
  margin-top: 6px;
  color: var(--app-text-body, #3d4a5c);
}

.hero-change.up {
  color: var(--pc-navy, #1c2430);
}

.hero-change.down {
  color: #9f1239;
}

@media (max-width: 1024px) {
  .hero-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }
}
</style>

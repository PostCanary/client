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
    <!-- Matches tab: Best Audience -->
    <div class="hero-card" v-if="view === 'matches'">
      <div class="hero-card-accent"></div>
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

    <!-- All Customers tab: Total Customers -->
    <div class="hero-card" v-if="view === 'all_customers'">
      <div class="hero-card-accent"></div>
      <div class="hero-card-body">
        <div class="hero-label">Total Customers</div>
        <div class="hero-value">{{ hero?.total_customers ? formatNumber(hero.total_customers) : "—" }}</div>
        <div class="hero-sub">unique addresses in CRM</div>
      </div>
    </div>

    <!-- Top Home Value (both tabs) -->
    <div class="hero-card">
      <div class="hero-card-accent"></div>
      <div class="hero-card-body">
        <div class="hero-label">Top Home Value</div>
        <div class="hero-value small">{{ hero?.top_home_value?.label || "—" }}</div>
        <div class="hero-change up" v-if="hero?.top_home_value?.pct">
          {{ hero.top_home_value.pct_text }}
        </div>
      </div>
    </div>

    <!-- Top Income Range (both tabs) -->
    <div class="hero-card">
      <div class="hero-card-accent"></div>
      <div class="hero-card-body">
        <div class="hero-label">Top Income Range</div>
        <div class="hero-value small">{{ hero?.top_income_range?.label || "—" }}</div>
        <div class="hero-change up" v-if="hero?.top_income_range?.pct">
          {{ hero.top_income_range.pct_text }}
        </div>
      </div>
    </div>

    <!-- Homeowner Rate (both tabs, delta only on Matches) -->
    <div class="hero-card">
      <div class="hero-card-accent"></div>
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
  gap: 16px;
}

.hero-card {
  background: var(--app-card-bg, #fff);
  border-radius: var(--app-card-radius, 12px);
  box-shadow: var(--app-card-shadow);
  overflow: hidden;
}

.hero-card-accent {
  height: 4px;
  background: linear-gradient(90deg, var(--app-navy, #0b2d50), #163b69);
}

.hero-card-body { padding: 20px 20px 18px; }

.hero-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-secondary, #64748b);
}

.hero-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--app-text, #0c2d50);
  letter-spacing: -0.5px;
  line-height: 1.1;
  margin-top: 8px;
  font-variant-numeric: tabular-nums;
}

.hero-value.small { font-size: 20px; letter-spacing: 0; }

.hero-value.muted {
  color: var(--app-text-muted, #94a3b8);
  font-weight: 500;
}

.hero-sub {
  font-size: 12px;
  color: var(--app-text-muted, #94a3b8);
  margin-top: 4px;
  font-weight: 400;
}

.hero-change {
  font-size: 12px;
  font-weight: 600;
  margin-top: 6px;
}

.hero-change.up { color: #10b981; }
.hero-change.down { color: #ef4444; }

@media (max-width: 1024px) {
  .hero-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .hero-grid { grid-template-columns: 1fr; }
}
</style>

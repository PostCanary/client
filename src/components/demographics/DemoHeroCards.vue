<script setup lang="ts">
import type { DemoHeroKPIs } from "@/api/demographics";

const props = defineProps<{
  hero: DemoHeroKPIs | null;
}>();

function formatCurrency(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${Math.round(val / 1_000)}K`;
  return `$${val.toLocaleString()}`;
}
</script>

<template>
  <div class="hero-grid">
    <!-- Best Audience -->
    <div class="hero-card">
      <div class="hero-card-accent"></div>
      <div class="hero-card-body">
        <div class="hero-label">Your Best Audience</div>
        <div class="hero-value small">{{ hero?.best_audience?.label || "—" }}</div>
        <div class="hero-change up" v-if="hero?.best_audience?.multiplier">
          {{ hero.best_audience.multiplier_text }}
        </div>
      </div>
    </div>

    <!-- Typical Home Value -->
    <div class="hero-card">
      <div class="hero-card-accent"></div>
      <div class="hero-card-body">
        <div class="hero-label">Typical Home Value</div>
        <div class="hero-value">{{ hero ? formatCurrency(hero.typical_home_value) : "—" }}</div>
        <div class="hero-sub">among customers who responded</div>
      </div>
    </div>

    <!-- Top Income Range -->
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

    <!-- Homeowner Rate -->
    <div class="hero-card">
      <div class="hero-card-accent"></div>
      <div class="hero-card-body">
        <div class="hero-label">Homeowner Rate</div>
        <div class="hero-value">{{ hero?.homeowner_rate?.value ?? "—" }}%</div>
        <div
          class="hero-change"
          :class="(hero?.homeowner_rate?.diff ?? 0) >= 0 ? 'up' : 'down'"
          v-if="hero?.homeowner_rate"
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

@media (max-width: 640px) {
  .hero-grid { grid-template-columns: 1fr 1fr; }
}
</style>

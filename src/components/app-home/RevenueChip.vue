<!-- src/components/app-home/RevenueChip.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import type { KPIs } from "@/api/runs";
import { fmtInt, fmtMoney, fmtPct } from "@/utils/formatMetrics";

const props = defineProps<{
  kpis: KPIs;
}>();

const router = useRouter();

const revenue = computed(() => Number(props.kpis.match_revenue ?? 0));
const matchRate = computed(() => Number(props.kpis.match_rate ?? 0));
const days = computed(() => Number(props.kpis.median_days_to_convert ?? 0));
const matches = computed(() => Number(props.kpis.matches ?? 0));

function openDashboard() {
  router.push({ name: "Dashboard" });
}
</script>

<template>
  <section class="revenue-chip" aria-label="Matched revenue summary">
    <div>
      <div class="chip-label">Revenue from mail</div>
      <div class="chip-value">{{ fmtMoney(revenue) }}</div>
      <div class="chip-foot">
        <div class="chip-stat">
          <strong>{{ fmtPct(matchRate) }}</strong>
          <span>Match rate</span>
        </div>
        <div class="chip-stat">
          <strong>{{ fmtInt(days) }}</strong>
          <span>Days to convert</span>
        </div>
        <div class="chip-stat">
          <strong>{{ fmtInt(matches) }}</strong>
          <span>Matched jobs</span>
        </div>
      </div>
    </div>
    <button class="chip-cta" type="button" @click="openDashboard">
      Open dashboard
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 8h9M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.6" />
      </svg>
    </button>
  </section>
</template>

<style scoped>
.revenue-chip {
  position: relative;
  background: var(--pc-navy, #1c2430);
  color: #fff;
  padding: 22px 26px;
  overflow: hidden;
  isolation: isolate;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px 24px;
  align-items: end;
  border-radius: var(--app-card-radius, 2px);
  margin-bottom: 22px;
}

.revenue-chip::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 50% 120% at 18% 50%,
    rgba(250, 207, 65, 0.16),
    transparent 70%
  );
  z-index: -1;
  pointer-events: none;
}

.chip-label {
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--pc-canary, #facf41);
  font-weight: 600;
  margin-bottom: 8px;
}

.chip-value {
  font-family: var(--pc-font-display, "Oswald", sans-serif);
  font-size: clamp(40px, 5vw, 56px);
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1;
  color: var(--pc-canary, #facf41);
}

.chip-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  margin-top: 14px;
}

.chip-stat {
  display: flex;
  align-items: baseline;
  gap: 7px;
}

.chip-stat strong {
  font-family: var(--pc-font-display, "Oswald", sans-serif);
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.chip-stat span {
  font-size: 11px;
  color: #8a96a8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.chip-cta {
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  background: transparent;
  border: 1px solid rgba(250, 207, 65, 0.45);
  color: var(--pc-canary, #facf41);
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  border-radius: var(--app-card-radius, 2px);
}

.chip-cta:hover {
  background: rgba(250, 207, 65, 0.12);
}

.chip-cta:focus-visible {
  outline: 2px solid var(--pc-canary, #facf41);
  outline-offset: 2px;
}

.chip-cta svg {
  width: 14px;
  height: 14px;
}

@media (max-width: 640px) {
  .revenue-chip {
    grid-template-columns: 1fr;
  }

  .chip-cta {
    justify-self: start;
  }
}
</style>

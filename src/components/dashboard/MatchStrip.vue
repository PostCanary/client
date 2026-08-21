<!-- src/components/dashboard/MatchStrip.vue -->
<script setup lang="ts">
import { computed } from "vue";
import type { KPIs } from "@/api/runs";
import { fmtInt, fmtMoney, fmtMoneyPrecise, fmtPct } from "@/utils/formatMetrics";

const props = defineProps<{
  kpis: KPIs | null;
  loading?: boolean;
  refreshedAt?: string | null;
}>();

const mail = computed(() => Number(props.kpis?.total_mail ?? 0));
const matches = computed(() => Number(props.kpis?.matches ?? 0));
const revenue = computed(() => Number(props.kpis?.match_revenue ?? 0));
const matchRate = computed(() => Number(props.kpis?.match_rate ?? 0));
const days = computed(() => Number(props.kpis?.median_days_to_convert ?? 0));
const perMailer = computed(() => Number(props.kpis?.revenue_per_mailer ?? 0));
const avgTicket = computed(() => Number(props.kpis?.avg_ticket_per_match ?? 0));

const refreshedLabel = computed(() => {
  if (!props.refreshedAt) return null;
  const d = new Date(props.refreshedAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
});
</script>

<template>
  <section
    class="match-strip"
    :class="{ 'is-loading': loading }"
    aria-label="Mail to revenue pipeline"
  >
    <div class="strip-eyebrow">
      <span class="strip-eyebrow-label">Matched revenue</span>
      <span v-if="refreshedLabel" class="strip-refreshed">Last run · {{ refreshedLabel }}</span>
    </div>

    <div class="pipeline">
      <div class="pipe-node">
        <span class="pipe-label">Mail sent</span>
        <span class="pipe-value">{{ fmtInt(mail) }}</span>
      </div>
      <div class="pipe-connector" aria-hidden="true">
        <svg viewBox="0 0 40 12" fill="none">
          <path d="M0 6h32M28 1l8 5-8 5" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </div>
      <div class="pipe-node">
        <span class="pipe-label">Matched jobs</span>
        <span class="pipe-value">{{ fmtInt(matches) }}</span>
      </div>
      <div class="pipe-connector pipe-connector--hot" aria-hidden="true">
        <span class="pulse" />
        <svg viewBox="0 0 40 12" fill="none">
          <path d="M0 6h32M28 1l8 5-8 5" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </div>
      <div class="pipe-node pipe-node--money">
        <span class="pipe-label">Revenue from mail</span>
        <span class="pipe-value">{{ fmtMoney(revenue) }}</span>
        <span class="pipe-sub">Jobs that matched your mail list</span>
      </div>
    </div>

    <div class="strip-foot">
      <div class="foot-stat">
        <strong>{{ fmtPct(matchRate) }}</strong>
        <span>Match rate</span>
      </div>
      <div class="foot-stat">
        <strong>{{ fmtInt(days) }}</strong>
        <span>Days to convert</span>
      </div>
      <div class="foot-stat">
        <strong>{{ fmtMoneyPrecise(perMailer) }}</strong>
        <span>Per mailer</span>
      </div>
      <div class="foot-stat">
        <strong>{{ fmtMoneyPrecise(avgTicket) }}</strong>
        <span>Avg ticket</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.match-strip {
  position: relative;
  background: var(--pc-navy, #1c2430);
  color: #fff;
  padding: 28px 32px 26px;
  overflow: hidden;
  isolation: isolate;
  border-radius: var(--app-card-radius, 2px);
  transition: opacity 0.18s ease;
}

.match-strip.is-loading {
  opacity: 0.65;
}

.match-strip::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 55% 90% at 78% 45%, rgba(250, 207, 65, 0.18), transparent 72%),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 47px,
      rgba(255, 255, 255, 0.025) 47px,
      rgba(255, 255, 255, 0.025) 48px
    );
  z-index: -1;
  pointer-events: none;
}

.strip-eyebrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 22px;
}

.strip-eyebrow-label {
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--pc-canary, #facf41);
  font-weight: 600;
}

.strip-refreshed {
  font-size: 12px;
  color: #8a96a8;
}

.pipeline {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) auto minmax(0, 0.85fr) auto minmax(0, 1.6fr);
  align-items: end;
  gap: 10px;
  margin-bottom: 22px;
}

.pipe-node {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.pipe-label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8a96a8;
  font-weight: 600;
}

.pipe-value {
  font-family: var(--pc-font-display, "Oswald", sans-serif);
  font-weight: 600;
  font-size: clamp(26px, 3vw, 36px);
  letter-spacing: 0.02em;
  line-height: 1;
  color: #b8c2d0;
}

.pipe-node--money .pipe-label {
  color: var(--pc-canary, #facf41);
}

.pipe-node--money .pipe-value {
  color: var(--pc-canary, #facf41);
  font-size: clamp(44px, 5.4vw, 64px);
  letter-spacing: 0.01em;
}

.pipe-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #8a96a8;
}

.pipe-connector {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 14px;
  color: #5a677a;
  position: relative;
  width: 48px;
}

.pipe-connector svg {
  width: 40px;
  height: 12px;
}

.pipe-connector--hot {
  color: var(--pc-canary, #facf41);
}

.pulse {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--pc-canary, #facf41);
  left: 50%;
  top: 42%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 0 rgba(250, 207, 65, 0.55);
  animation: match-pulse 2.2s ease-out infinite;
}

@keyframes match-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(250, 207, 65, 0.5);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(250, 207, 65, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(250, 207, 65, 0);
  }
}

.strip-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 28px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.foot-stat {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.foot-stat strong {
  font-family: var(--pc-font-display, "Oswald", sans-serif);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #fff;
}

.foot-stat span {
  font-size: 12px;
  color: #8a96a8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

@media (prefers-reduced-motion: reduce) {
  .pulse {
    animation: none;
  }
}

@media (max-width: 960px) {
  .pipeline {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .pipe-connector {
    display: none;
  }

  .match-strip {
    padding: 22px 18px 20px;
  }
}
</style>

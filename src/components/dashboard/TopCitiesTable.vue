<template>
  <section class="table-card">
    <header class="table-head">
      <h3 class="table-title">Top Cities</h3>
    </header>

    <div class="table-cols">
      <span class="col col-city">City</span>
      <span class="col col-total">Matches</span>
      <span class="col col-rate">Match Rate</span>
    </div>

    <ul class="rows">
      <li
        v-for="(r, i) in rowsToShow"
        :key="i"
        class="row"
      >
        <span class="cell city">{{ r.city }}</span>
        <span class="cell total">{{ r.total.toLocaleString() }}</span>
        <span class="cell rate">
          <span class="rate-bar">
            <span class="rate-fill" :style="{ width: ratePercent(r.rate) + '%' }"></span>
          </span>
          <span class="rate-text">{{ r.rate }}</span>
        </span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

export type Row = { city: string; total: number; rate: string };

const props = defineProps<{ rows?: Row[] }>();

const rowsToShow = computed<Row[]>(() => props.rows ?? []);

function ratePercent(rate: string): number {
  const n = parseFloat(rate);
  return Number.isFinite(n) ? Math.min(n, 100) : 0;
}
</script>

<style scoped>
.table-card {
  background: var(--app-card-bg, #fff);
  border-radius: var(--app-card-radius, 12px);
  box-shadow: var(--app-card-shadow, 0 1px 3px rgba(12,45,80,.06), 0 8px 24px rgba(12,45,80,.04));
  overflow: hidden;
  color: var(--app-text, #0c2d50);
}

.table-head {
  background: var(--app-navy, #0b2d50);
  padding: 12px 20px;
}

.table-title {
  margin: 0;
  font-weight: 600;
  font-size: 15px;
  line-height: 1.4;
  color: #fff;
}

.table-cols {
  display: grid;
  grid-template-columns: 1fr 100px 140px;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--app-border, #e2e8f0);
}

.col {
  font-weight: 600;
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.05em;
  color: var(--app-text-muted, #94a3b8);
  text-transform: uppercase;
}

.col-total,
.col-rate {
  text-align: right;
}

/* body */
.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;

  max-height: 280px;
  overflow-y: auto;

  scrollbar-color: #cbd5f5 #e2e8f0;
  scrollbar-width: thin;
}

.rows::-webkit-scrollbar { width: 6px; }
.rows::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 999px; }
.rows::-webkit-scrollbar-thumb { background: #cbd5f5; border-radius: 999px; }

.row {
  display: grid;
  grid-template-columns: 1fr 100px 140px;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  font-size: 14px;
  color: var(--app-text-body, #475569);
  transition: background 0.1s ease;
}

.row:last-child {
  border-bottom: none;
}

.row:hover {
  background: rgba(71, 191, 169, 0.04);
}

.total {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.rate {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.rate-bar {
  width: 40px;
  height: 4px;
  background: var(--app-border, #e2e8f0);
  border-radius: 2px;
  overflow: hidden;
  flex-shrink: 0;
}

.rate-fill {
  display: block;
  height: 100%;
  background: var(--app-teal, #47bfa9);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.rate-text {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  min-width: 48px;
  text-align: right;
}
</style>

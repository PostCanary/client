<template>
  <section class="table-card">
    <header class="table-head">
      <h3 class="table-title">Top ZIPs</h3>
    </header>

    <div class="table-cols">
      <span class="col col-zip">ZIP</span>
      <button
        type="button"
        class="col col-total col-sortable"
        :aria-sort="ariaSortFor('total')"
        @click="toggleSort('total')"
      >
        Matches
        <span
          v-if="sortKey === 'total'"
          class="sort-indicator"
          aria-hidden="true"
        >{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
      </button>
      <button
        type="button"
        class="col col-rate col-sortable"
        :aria-sort="ariaSortFor('rate')"
        @click="toggleSort('rate')"
      >
        Match Rate
        <span
          v-if="sortKey === 'rate'"
          class="sort-indicator"
          aria-hidden="true"
        >{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
      </button>
    </div>

    <ul class="rows">
      <li
        v-for="(r, i) in sortedRows"
        :key="i"
        class="row"
      >
        <span class="cell zip">{{ r.zip }}</span>
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
import { computed, ref } from "vue";

export type Row = { zip: string; total: number; rate: string };

type SortKey = "total" | "rate";

const props = defineProps<{ rows?: Row[] }>();

const sortKey = ref<SortKey | null>(null);
const sortDirection = ref<"asc" | "desc">("desc");

const rowsToShow = computed<Row[]>(() => props.rows ?? []);

function parseRateValue(rate: string): number {
  const n = parseFloat(rate);
  return Number.isFinite(n) ? n : 0;
}

function ratePercent(rate: string): number {
  const n = parseRateValue(rate);
  return Math.min(n, 100);
}

function toggleSort(key: SortKey): void {
  if (sortKey.value !== key) {
    sortKey.value = key;
    sortDirection.value = "desc";
    return;
  }
  sortDirection.value = sortDirection.value === "desc" ? "asc" : "desc";
}

function ariaSortFor(key: SortKey): "ascending" | "descending" | "none" {
  if (sortKey.value !== key) return "none";
  return sortDirection.value === "asc" ? "ascending" : "descending";
}

const sortedRows = computed<Row[]>(() => {
  const base = rowsToShow.value;
  if (!sortKey.value) return base;

  const dir = sortDirection.value === "asc" ? 1 : -1;
  const key = sortKey.value;

  return [...base].sort((a, b) => {
    const aVal = key === "total" ? a.total : parseRateValue(a.rate);
    const bVal = key === "total" ? b.total : parseRateValue(b.rate);
    if (aVal === bVal) return 0;
    return (aVal - bVal) * dir;
  });
});
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

.col-sortable {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  cursor: pointer;
  transition: color 0.1s ease;
}

.col-sortable:hover,
.col-sortable:focus-visible {
  color: var(--app-teal, #47bfa9);
  outline: none;
}

.sort-indicator {
  font-size: 8px;
  line-height: 1;
  color: var(--app-teal, #47bfa9);
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

.zip {
  font-variant-numeric: tabular-nums;
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

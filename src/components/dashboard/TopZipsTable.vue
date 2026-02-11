<template>
  <section class="top-zips-card">
    <header class="card-head">
      <h3 class="title">Top ZIPs</h3>
      <div class="cols">
        <span class="col col-zip">ZIP</span>
        <span class="col col-total">TOTAL MATCHES</span>
        <span class="col col-rate">MATCH RATE</span>
      </div>
      <div class="rule"></div>
    </header>

    <ul class="rows">
      <li
        v-for="(r, i) in rowsToShow"
        :key="i"
        class="row"
        :class="{ shaded: i % 2 === 0 }"
      >
        <span class="cell zip">{{ r.zip }}</span>
        <span class="cell total">{{ r.total.toLocaleString() }}</span>
        <span class="cell rate">{{ r.rate }}</span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

export type Row = { zip: string; total: number; rate: string };

const props = defineProps<{ rows?: Row[] }>();

const rowsToShow = computed<Row[]>(() => props.rows ?? []);
</script>

<style scoped>
.top-zips-card {
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  width: 100%;
  padding: 16px 20px;
  box-sizing: border-box;
  color: #0c2d50;
  font-family: var(
    --font-sans,
    "Instrument Sans",
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    sans-serif
  );
}

.card-head .title {
  font-weight: 600;
  font-size: 18px;
  line-height: 22px;
  letter-spacing: -0.36px;
  margin: 0 0 12px 0;
  color: #0c2d50;
}

.cols {
  display: grid;
  grid-template-columns: 120px 1fr 140px;
  align-items: center;
  gap: 12px;
}

.col {
  font-weight: 600;
  font-size: 14px;
  line-height: 17px;
  letter-spacing: -0.28px;
  color: #47bfa9;
  text-transform: uppercase;
}

.rule {
  margin-top: 10px;
  border-top: 1px solid rgba(109, 129, 150, 0.3);
}

/* body */
.rows {
  list-style: none;
  margin: 12px 0 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  max-height: 260px; /* ≈ 5 rows visible, rest scroll */
  overflow-y: auto;

  scrollbar-color: #cbd5f5 #e2e8f0;
  scrollbar-width: thin;
}

.rows::-webkit-scrollbar { width: 8px; }
.rows::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 999px; }
.rows::-webkit-scrollbar-thumb { background: #cbd5f5; border-radius: 999px; }

.row {
  display: grid;
  grid-template-columns: 120px 1fr 140px;
  align-items: center;
  min-height: 47px;
  padding: 0 12px;
  border-radius: 10px;
  color: #6b6b6b;
  font-size: 14px;
  line-height: 17px;
  letter-spacing: -0.28px;
  font-weight: 400;
}

.row.shaded {
  background: #f4f5f7;
}

.col-total,
.col-rate,
.total,
.rate {
  justify-self: center;
  text-align: center;
}
</style>

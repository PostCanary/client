<template>
  <section class="summary-card">
    <header class="summary-head">
      <h3 class="summary-title">Summary</h3>
    </header>

    <!-- Header row -->
    <div class="cols head">
      <span class="col col-mail-addr">Mail Address</span>
      <span class="col col-crm-addr">CRM Address</span>
      <span class="col col-city">City</span>
      <span class="col col-state">State</span>
      <span class="col col-zip">ZIP</span>
      <span class="col col-mail-dates">Mail Dates</span>
      <span class="col col-crm-date">CRM Date</span>
      <span class="col col-job-value">Job Value</span>
    </div>

    <!-- Body rows -->
    <ul class="srows">
      <li
        v-for="(r, i) in rowsToShow"
        :key="i"
        class="srow"
      >
        <span class="t col-mail-addr">
          {{ r.mail_address1 }}
        </span>

        <span class="t col-crm-addr">
          {{ r.crm_address1 }}
        </span>

        <span class="t col-city">
          {{ r.city }}
        </span>

        <span class="t col-state">
          {{ r.state }}
        </span>

        <span class="t mono col-zip">
          {{ r.zip }}
        </span>

        <!-- scrollable MAIL DATES cell -->
        <span class="t mono col-mail-dates mail-dates">
          {{ r.mail_dates }}
        </span>

        <span class="t mono col-crm-date">
          {{ r.crm_date }}
        </span>

        <span class="t mono col-job-value" :class="{ 'has-value': r.job_value != null && r.job_value > 0 }">
          {{ formatJobValue(r.job_value) }}
        </span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

export type Row = {
  mail_address1: string;
  crm_address1: string;
  city: string;
  state: string;
  zip: string;
  mail_dates: string;
  crm_date: string;
  job_value: number | null;
};

const props = defineProps<{ rows?: Row[]; loading?: boolean }>();

const rowsToShow = computed<Row[]>(() => props.rows ?? []);

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatJobValue(v: number | null): string {
  if (v == null || Number.isNaN(v)) return "";
  return currencyFormatter.format(v);
}
</script>

<style scoped>
.summary-card {
  background: var(--app-card-bg, #fff);
  border-radius: var(--app-card-radius, 12px);
  box-shadow: var(--app-card-shadow, 0 1px 3px rgba(12,45,80,.06), 0 8px 24px rgba(12,45,80,.04));
  overflow: hidden;
  color: var(--app-text, #0c2d50);
}

.summary-head {
  background: var(--app-navy, #0b2d50);
  padding: 12px 20px;
}

.summary-title {
  margin: 0;
  font-weight: 600;
  font-size: 15px;
  line-height: 1.4;
  color: #fff;
}

/* Header row */
.cols {
  display: flex;
  gap: 12px;
  align-items: center;
}

.cols.head {
  padding: 10px 20px;
  border-bottom: 1px solid var(--app-border, #e2e8f0);
  position: sticky;
  top: 0;
  background: var(--app-card-bg, #fff);
  z-index: 1;
}

.head .col {
  font-weight: 600;
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.05em;
  color: var(--app-text-muted, #94a3b8);
  text-transform: uppercase;
}

/* Body list */
.srows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;

  max-height: 520px;
  overflow-y: auto;

  scrollbar-color: #cbd5f5 #e2e8f0;
  scrollbar-width: thin;
}

.srows::-webkit-scrollbar { width: 6px; }
.srows::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 999px; }
.srows::-webkit-scrollbar-thumb { background: #cbd5f5; border-radius: 999px; }

/* Body row */
.srow {
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 52px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  color: var(--app-text-body, #475569);
  font-size: 13px;
  line-height: 1.3;
  transition: background 0.1s ease;
}

.srow:last-child {
  border-bottom: none;
}

.srow:hover {
  background: rgba(71, 191, 169, 0.04);
}

.t.mono {
  font-variant-numeric: tabular-nums;
}

/* Job value highlight */
.col-job-value.has-value {
  color: var(--app-teal, #47bfa9);
  font-weight: 600;
}

/* --- Column flex weights (header + body share these classes) --- */

.col-mail-addr {
  flex: 2.4 1 200px;
}

.col-crm-addr {
  flex: 2.4 1 200px;
}

.col-city {
  flex: 1.1 1 100px;
}

.col-state {
  flex: 0 0 50px;
}

.col-zip {
  flex: 0 0 70px;
}

.col-mail-dates {
  flex: 1.6 1 140px;
}

.col-crm-date {
  flex: 1 0 100px;
}

/* MAIL DATES column scrolls independently if super long */
.mail-dates {
  max-height: 48px;
  overflow-y: auto;
  white-space: pre-line;

  scrollbar-color: #cbd5f5 #e2e8f0;
  scrollbar-width: thin;
}

.mail-dates::-webkit-scrollbar { width: 4px; }
.mail-dates::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 999px; }
.mail-dates::-webkit-scrollbar-thumb { background: #cbd5f5; border-radius: 999px; }

.col-job-value {
  flex: 1 0 100px;
  text-align: right;
}
</style>

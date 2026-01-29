<template>
  <section class="summary-card">
    <h3 class="title">Summary</h3>

    <!-- Header row -->
    <div class="cols head">
      <span class="col-mail-addr">MAIL STREET ADDRESS</span>
      <span class="col-crm-addr">CRM STREET ADDRESS</span>
      <span class="col-city">CITY</span>
      <span class="col-state">STATE</span>
      <span class="col-zip">ZIP</span>
      <span class="col-mail-dates">MAIL DATES</span>
      <span class="col-crm-date">CRM DATE</span>
      <span class="col-job-value">JOB VALUE</span>
    </div>

    <div class="rule"></div>

    <!-- Body rows -->
    <ul class="srows">
      <li
        v-for="(r, i) in rowsToShow"
        :key="i"
        class="srow"
        :class="{ shaded: i % 2 === 0 }"
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

        <span class="t mono col-job-value">
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

const props = defineProps<{ rows?: Row[] }>();

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
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  padding: 16px 16px 12px;
  box-sizing: border-box;
  width: 100%;
  color: #0c2d50;
  font-family: var(
    --font-sans,
    "Instrument Sans",
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    sans-serif
  );
}

.title {
  margin: 0 0 12px;
  font-weight: 600;
  font-size: 18px;
  line-height: 22px;
  letter-spacing: -0.36px;
}

/* Header row */
.cols {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* give header same side padding as body rows so columns line up */
.cols.head {
  padding: 0 12px;
}

.head span {
  color: #47bfa9;
  font-weight: 600;
  font-size: 14px;
  line-height: 17px;
  letter-spacing: -0.28px;
  text-transform: uppercase;
}

.rule {
  margin: 10px 0 6px;
  border-top: 1px solid rgba(109, 129, 150, 0.3);
}

/* Body list */
.srows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  max-height: 520px;
  overflow-y: auto;
}

/* Body row */
.srow {
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 67px;
  padding: 0 12px;
  border-radius: 10px;
  color: #6b6b6b;
  font-size: 14px;
  line-height: 17px;
  letter-spacing: -0.28px;
  font-weight: 400;
}

.srow.shaded {
  background: #f4f5f7;
}

.t.mono {
  font-variant-numeric: tabular-nums;
}

/* --- Column flex weights (header + body share these classes) --- */

.col-mail-addr {
  flex: 2.4 1 220px;
}

.col-crm-addr {
  flex: 2.4 1 220px;
}

.col-city {
  flex: 1.1 1 120px;
}

.col-state {
  flex: 0 0 60px;
}

.col-zip {
  flex: 0 0 90px;
}

.col-mail-dates {
  flex: 1.6 1 160px;
}

.col-crm-date {
  flex: 1 0 110px;
}

/* MAIL DATES column scrolls independently if super long */
.mail-dates {
  max-height: 60px;
  overflow-y: auto;
  white-space: pre-line;
}

.col-job-value {
  flex: 1 0 120px;
  text-align: left;
}
</style>

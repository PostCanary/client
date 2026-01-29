<!-- src/components/dashboard/KpiSummaryCard.vue -->
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { KPIs } from "@/api/runs";

type BasicStats = {
  total_mail: number;
  unique_mail_addresses: number;
  total_jobs: number;
  matches: number;
  match_rate: number;
  match_revenue: number;
};

type AdvancedStats = {
  revenue_per_mailer: number;
  avg_ticket_per_match: number;
  median_days_to_convert: number;
  convert_30: number; // %
  convert_60: number; // %
  convert_90: number; // %
};

const props = defineProps<{
  kpis: KPIs | null;
  loading?: boolean;
}>();

// --- UI state ---
const showAdvanced = ref(true);

// --- data state ---
const basic = ref<BasicStats>({
  total_mail: 0,
  unique_mail_addresses: 0,
  total_jobs: 0,
  matches: 0,
  match_rate: 0,
  match_revenue: 0,
});

const adv = ref<AdvancedStats>({
  revenue_per_mailer: 0,
  avg_ticket_per_match: 0,
  median_days_to_convert: 0,
  convert_30: 0,
  convert_60: 0,
  convert_90: 0,
});

// --- helpers ---
const fmtInt = (n: number) =>
  Number.isFinite(n)
    ? n.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : "0";

const fmtMoney = (n: number) =>
  Number.isFinite(n)
    ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
    : "$0.00";

const fmtPct = (n: number) => {
  const raw = Number.isFinite(n) ? n : 0;
  const v = raw <= 1 ? raw * 100 : raw;
  return `${v.toFixed(1)}%`;
};

const matchRateText = computed(() => fmtPct(basic.value.match_rate));

// --- react to incoming KPIs ---
watch(
  () => props.kpis,
  (kpis) => {
    const k = (kpis ?? {}) as Partial<KPIs>;

    basic.value = {
      total_mail: Number(k.total_mail ?? 0),
      unique_mail_addresses: Number(k.unique_mail_addresses ?? 0),
      total_jobs: Number(k.total_jobs ?? 0),
      matches: Number(k.matches ?? 0),
      match_rate: Number(k.match_rate ?? 0),
      match_revenue: Number(k.match_revenue ?? 0),
    };

    adv.value = {
      revenue_per_mailer: Number(k.revenue_per_mailer ?? 0),
      avg_ticket_per_match: Number(k.avg_ticket_per_match ?? 0),
      median_days_to_convert: Number(k.median_days_to_convert ?? 0),
      convert_30: Number(k.conv_30d_rate ?? 0),
      convert_60: Number(k.conv_60d_rate ?? 0),
      convert_90: Number(k.conv_90d_rate ?? 0),
    };
  },
  { immediate: true }
);
</script>

<template>
  <section class="card border border-[#0c2d50]/10 rounded-xl bg-white">
    <!-- Header row -->
    <div class="flex items-center bg-[#f4f5f7] rounded-t-xl px-4 py-3">
      <div class="flex items-center gap-4 flex-1">
        <span class="text-[18px] font-semibold text-[#0c2d50]">Results:</span>
        <span v-if="loading" class="text-xs text-slate-500">Loading…</span>
      </div>

      <span class="h-6 w-px bg-[#47bfa9]"></span>

      <div class="flex items-center gap-3 flex-1 justify-end">
        <span class="text-[18px] font-semibold text-[#0c2d50]">
          Hide Advanced KPIs
        </span>

        <!-- pill switch -->
        <button
          class="relative h-4 w-12 rounded-full border border-black/20 bg-white shadow-inner"
          role="switch"
          :aria-checked="!showAdvanced"
          @click="showAdvanced = !showAdvanced"
          title="Hide/Show Advanced KPIs"
          :disabled="!!loading"
        >
          <span
            class="absolute -top-1.5 left-0 h-6 w-6 rounded-full bg-[#47bfa9] transition-all"
            :style="{
              transform: showAdvanced ? 'translateX(24px)' : 'translateX(2px)',
              opacity: loading ? 0.6 : 1,
            }"
          />
        </button>
      </div>
    </div>

    <!-- Two columns -->
    <div class="grid md:grid-cols-2 gap-0" :class="{ 'opacity-70': loading }">
      <!-- Left: Basic KPIs -->
      <div class="px-4 divide-y divide-[#6d8196]/30">
        <div class="flex items-center justify-between py-3">
          <span class="text-[20px] text-[#0c2d50]">Total Mail</span>
          <span class="text-[18px] font-semibold">
            {{ fmtInt(basic.total_mail) }}
          </span>
        </div>

        <div class="flex items-center justify-between py-3">
          <span class="text-[20px] text-[#0c2d50]">Unique Mail Addresses</span>
          <span class="text-[18px] font-semibold">
            {{ fmtInt(basic.unique_mail_addresses) }}
          </span>
        </div>

        <div class="flex items-center justify-between py-3">
          <span class="text-[20px] text-[#0c2d50]">Total Jobs</span>
          <span class="text-[18px] font-semibold">
            {{ fmtInt(basic.total_jobs) }}
          </span>
        </div>

        <div class="flex items-center justify-between py-3">
          <span class="text-[20px] text-[#0c2d50]">Matches</span>
          <span class="text-[18px] font-semibold">
            {{ fmtInt(basic.matches) }}
          </span>
        </div>

        <div class="flex items-center justify-between py-3">
          <span class="text-[20px] text-[#0c2d50]">Match Rate</span>
          <span class="text-[18px] font-semibold">
            {{ matchRateText }}
          </span>
        </div>

        <div class="flex items-center justify-between py-3">
          <span class="text-[20px] text-[#0c2d50]">Match Revenue</span>
          <span class="text-[18px] font-semibold">
            {{ fmtMoney(basic.match_revenue) }}
          </span>
        </div>
      </div>

      <!-- Right: Advanced KPIs -->
      <div class="relative px-4 border-l border-[#6d8196]/30">
        <transition name="fade">
          <div v-show="showAdvanced" class="divide-y divide-[#6d8196]/30">
            <div class="flex items-center justify-between py-3">
              <span class="text-[20px] text-[#0c2d50]">
                Revenue Per Mailer
              </span>
              <span class="text-[18px] font-semibold">
                {{ fmtMoney(adv.revenue_per_mailer) }}
              </span>
            </div>

            <div class="flex items-center justify-between py-3">
              <span class="text-[20px] text-[#0c2d50]">
                Avg Ticket (Per Match)
              </span>
              <span class="text-[18px] font-semibold">
                {{ fmtMoney(adv.avg_ticket_per_match) }}
              </span>
            </div>

            <div class="flex items-center justify-between py-3">
              <span class="text-[20px] text-[#0c2d50]">
                Median Days To Convert
              </span>
              <span class="text-[18px] font-semibold">
                {{ fmtInt(adv.median_days_to_convert) }}
              </span>
            </div>

            <!-- If you re-enable these later, format them with fmtPct(...) -->
            <!--
            <div class="flex items-center justify-between py-3">
              <span class="text-[20px] text-[#0c2d50]">Convert ≤ 30 Days</span>
              <span class="text-[18px] font-semibold">{{ fmtPct(adv.convert_30) }}</span>
            </div>
            -->
          </div>
        </transition>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card {
  box-shadow: 0 1px 3px rgba(12, 45, 80, 0.08),
    0 10px 24px rgba(12, 45, 80, 0.06);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

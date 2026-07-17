<!-- src/pages/Dashboard.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import MappingRequiredModal from "@/components/dashboard/MappingRequiredModal.vue";
import MapperModal from "@/components/dashboard/MapperModal.vue";
import PaywallModal from "@/components/dashboard/PaywallModal.vue";
import PaymentFailedModal from "@/components/dashboard/PaymentFailedModal.vue";
import FirstUploadRunMatchingModal from "@/components/dashboard/FirstUploadRunMatchingModal.vue";
import CampaignPromptModal from "@/components/dashboard/CampaignPromptModal.vue";

import UploadCard from "@/components/dashboard/UploadCard.vue";
import KpiSummaryCard from "@/components/dashboard/KpiSummaryCard.vue";
import YoyChart from "@/components/dashboard/YoyChart.vue";
import TopCitiesTable from "@/components/dashboard/TopCitiesTable.vue";
import TopZipsTable from "@/components/dashboard/TopZipsTable.vue";
import TopAreaRankingToggle from "@/components/dashboard/TopAreaRankingToggle.vue";
import SummaryTable from "@/components/dashboard/SummaryTable.vue";
import DemoFilterBar from "@/components/demographics/DemoFilterBar.vue";
import PreviewUpgradeBanner from "@/components/billing/PreviewUpgradeBanner.vue";

import type { TopAreaRanking } from "@/composables/useRunData";
import { useUploadAndMatch } from "@/composables/useUploadAndMatch";
import { BRAND } from "@/config/brand";

declare global {
  interface Window {
    MT_CONTEXT?: any;
  }
}

const route = useRoute();
const router = useRouter();

// POS-155: Dashboard.vue now consumes the shared upload → mapping →
// normalize → match-run wiring extracted to useUploadAndMatch (POS-152,
// originally built for Analytics.vue). refreshingLoaderMessage preserves
// Dashboard's pre-extraction wording — the one genuine copy divergence
// found between the two inline copies; see useUploadAndMatch.ts.
const {
  runResult,
  runResultLoading,
  matchesLoading,
  runDataError,
  refreshRunData,
  setDateRange,

  graphLabels,
  graphMailNow,
  graphCrmNow,
  graphMatchNow,
  mailPrev,
  crmPrev,
  matchPrev,
  graphRawMonths,
  topCityRowsByMatches,
  topCityRowsByRate,
  topZipRowsByMatches,
  topZipRowsByRate,
  summaryRows,

  showMapping,
  missing,
  mappingBlocked,
  showMapper,
  mailHeaders,
  crmHeaders,
  mailHeaderTypes,
  crmHeaderTypes,
  mailSamples,
  crmSamples,
  requiredMail,
  requiredCrm,
  initialMapping,
  mailFields,
  crmFields,
  mailLabels,
  crmLabels,
  mapperErrors,
  mapperSaving,
  uploadResetKey,
  showFirstUploadModal,
  firstUploadRunLoading,
  showCampaignPrompt,
  pendingNormalize,
  billingReadOnly,

  onBatchIdsUpdated,
  onUploadMappingRequired,
  onUploadCommit,
  openMapper,
  onMappingConfirm,
  onCampaignPromptConfirm,
  onCampaignPromptSkip,
  handleFirstUploadRunMatching,

  showPaywall,
  paywallBusy,
  showPaymentFailed,
  paymentFailedBusy,
  effectivePaywallConfig,
  shouldBlur,
  showPreviewUpgradeBanner,
  showBillingSuccess,
  dismissBillingSuccess,
  onRequireSubscription,
  onPaywallPrimary,
  handlePaywallSecondary,
  onPaymentFixPrimary,
  onPaymentFailedSecondary,
} = useUploadAndMatch(route, router, {
  refreshingLoaderMessage: "Refreshing dashboard…",
});

/* ------------------------------------------------------------------
 * Dashboard-only: date filter + top-area ranking toggle
 * ------------------------------------------------------------------ */

const dashboardStart = ref<string | undefined>(undefined);
const dashboardEnd = ref<string | undefined>(undefined);
const topAreaRanking = ref<TopAreaRanking>("matches");

const topCityRows = computed(() =>
  topAreaRanking.value === "match_rate" ? topCityRowsByRate.value : topCityRowsByMatches.value,
);
const topZipRows = computed(() =>
  topAreaRanking.value === "match_rate" ? topZipRowsByRate.value : topZipRowsByMatches.value,
);

async function onDashboardDateRangeApply(payload: { start?: string; end?: string }) {
  dashboardStart.value = payload.start;
  dashboardEnd.value = payload.end;
  setDateRange(payload);
  await refreshRunData();
}
</script>

<template>
  <PreviewUpgradeBanner
    v-if="showPreviewUpgradeBanner"
    @select-plan="onRequireSubscription"
  />

  <div
    class="dash-main-inner"
    :class="{ 'dash-main-inner--blurred': shouldBlur }"
  >
    <div
      v-if="showBillingSuccess"
      class="mb-4 flex items-start justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
    >
      <p class="mr-2">
        Your {{ BRAND.name }} subscription is now active. Go ahead and upload your CSVs
        – we’ll keep your history in sync and match automatically.
      </p>

      <button
        type="button"
        class="ml-auto text-xs font-medium text-emerald-900/70 hover:text-emerald-900 hover:underline"
        @click="dismissBillingSuccess"
      >
        Dismiss
      </button>
    </div>

    <div
      v-if="runDataError"
      class="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"
    >
      {{ runDataError }}
    </div>

    <div class="mb-4">
      <DemoFilterBar
        :start="dashboardStart"
        :end="dashboardEnd"
        @update:start="dashboardStart = $event"
        @update:end="dashboardEnd = $event"
        @apply="onDashboardDateRangeApply"
      />
    </div>

    <!-- Row 1: Hero KPI cards -->
    <KpiSummaryCard
      id="cmp-kpis"
      variant="hero"
      :kpis="runResult?.kpis || null"
      :loading="runResultLoading"
    />

    <!-- Row 2: Upload + Advanced Metrics side-by-side -->
    <div id="cmp-action-row">
      <UploadCard
        :reset-key="uploadResetKey"
        :mapping-blocked="mappingBlocked"
        :billing-blocked="billingReadOnly"
        @edit-mapping="openMapper"
        @batch-ids="onBatchIdsUpdated"
        @upload-commit="onUploadCommit"
        @mapping-required="onUploadMappingRequired"
      />

      <KpiSummaryCard
        variant="advanced"
        :kpis="runResult?.kpis || null"
        :loading="runResultLoading"
      />
    </div>

    <!-- Row 3: Trend Chart -->
    <div id="cmp-graph">
      <YoyChart
        :labels="graphLabels"
        :mail-now="graphMailNow"
        :crm-now="graphCrmNow"
        :match-now="graphMatchNow"
        :mail-prev="mailPrev"
        :crm-prev="crmPrev"
        :match-prev="matchPrev"
        :raw-months="graphRawMonths"
      />
    </div>

    <!-- Row 4: Top Cities + Top ZIPs -->
    <div class="top-ranking-toolbar">
      <div class="top-ranking-copy">
        <h3 class="top-ranking-title">Top Areas</h3>
        <p class="top-ranking-subtitle">Switch between highest total matches and highest conversion rate.</p>
      </div>
      <TopAreaRankingToggle v-model="topAreaRanking" />
    </div>
    <div id="cmp-top">
      <TopCitiesTable :rows="topCityRows" />
      <TopZipsTable :rows="topZipRows" />
    </div>

    <!-- Row 5: Summary Table -->
    <div id="cmp-summary">
      <SummaryTable
        :rows="summaryRows.length ? summaryRows : undefined"
        :loading="matchesLoading"
      />
    </div>
  </div>

  <MappingRequiredModal
    v-model="showMapping"
    v-model:missing="missing"
    @edit-mapping="openMapper"
  />

  <MapperModal
    :open="showMapper"
    :mail-headers="mailHeaders"
    :crm-headers="crmHeaders"
    :mail-header-types="mailHeaderTypes"
    :crm-header-types="crmHeaderTypes"
    :mail-samples="mailSamples"
    :crm-samples="crmSamples"
    :mail-fields="mailFields"
    :crm-fields="crmFields"
    :mail-labels="mailLabels"
    :crm-labels="crmLabels"
    :initial-mapping="initialMapping"
    :required-mail="requiredMail"
    :required-crm="requiredCrm"
    :errors="mapperErrors || null"
    :saving="mapperSaving"
    :confirm-label="pendingNormalize ? 'Confirm & Run' : undefined"
    @close="showMapper = false"
    @confirm="onMappingConfirm"
  />

  <CampaignPromptModal
    :open="showCampaignPrompt"
    @confirm="onCampaignPromptConfirm"
    @skip="onCampaignPromptSkip"
  />

  <PaywallModal
    v-model="showPaywall"
    :config="effectivePaywallConfig"
    :loading="paywallBusy"
    @primary="onPaywallPrimary"
    @secondary="handlePaywallSecondary"
  />

  <PaymentFailedModal
    v-model="showPaymentFailed"
    :loading="paymentFailedBusy"
    title="Payment issue"
    message="We couldn't charge your card. Update your payment method to resume matching runs."
    primary-label="Fix payment"
    secondary-label="Not now"
    @primary="onPaymentFixPrimary"
    @secondary="onPaymentFailedSecondary"
  />

  <FirstUploadRunMatchingModal
    :open="showFirstUploadModal"
    :loading="firstUploadRunLoading"
    @close="showFirstUploadModal = false"
    @run-matching="handleFirstUploadRunMatching"
  />
</template>

<style scoped>
.dash-main-inner {
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: filter 0.18s ease, opacity 0.18s ease;
}

.dash-main-inner--blurred {
  filter: blur(10px);
  opacity: 0.4;
  pointer-events: none;
  user-select: none;
}

#cmp-action-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: stretch;
}

#cmp-top {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.top-ranking-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.top-ranking-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.top-ranking-title {
  margin: 0;
  color: var(--app-text, #0c2d50);
  font-size: 18px;
  font-weight: 700;
}

.top-ranking-subtitle {
  margin: 0;
  color: var(--app-text-muted, #64748b);
  font-size: 14px;
}

@media (max-width: 1024px) {
  #cmp-action-row {
    grid-template-columns: 1fr;
  }
  #cmp-top {
    grid-template-columns: 1fr;
  }
  .top-ranking-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  #cmp-action-row {
    grid-template-columns: 1fr;
  }
  #cmp-top {
    grid-template-columns: 1fr;
  }
  .top-ranking-toolbar {
    align-items: stretch;
  }
  #cmp-summary {
    display: none;
  }
}
</style>

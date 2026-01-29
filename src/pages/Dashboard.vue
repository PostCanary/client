<!-- src/pages/Dashboard.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";

import MappingRequiredModal from "@/components/dashboard/MappingRequiredModal.vue";
import MapperModal from "@/components/dashboard/MapperModal.vue";
import PaywallModal from "@/components/dashboard/PaywallModal.vue";
import PaymentFailedModal from "@/components/dashboard/PaymentFailedModal.vue";

import UploadCard from "@/components/dashboard/UploadCard.vue";
import KpiSummaryCard from "@/components/dashboard/KpiSummaryCard.vue";
import YoyChart from "@/components/dashboard/YoyChart.vue";
import TopCitiesTable from "@/components/dashboard/TopCitiesTable.vue";
import TopZipsTable from "@/components/dashboard/TopZipsTable.vue";
import SummaryTable from "@/components/dashboard/SummaryTable.vue";

import {
  normalizeBatch,
  type NormalizeBatchRes,
  type Source,
} from "@/api/uploads";
import {
  fetchHeaders as fetchMapperHeaders,
  fetchMapping as fetchMapperMapping,
  saveMapping as saveMapperMapping,
  type Mapping as MapperMapping,
  type MappingBundle,
} from "@/api/mapper";

import { useRunData } from "@/composables/useRunData";
import { useLoader } from "@/stores/loader";
import { useBilling } from "@/composables/useBilling";

declare global {
  interface Window {
    MT_CONTEXT?: any;
  }
}

const route = useRoute();
const router = useRouter();
const loader = useLoader();

/* ------------------------------------------------------------------
 * Loader policy helpers
 * ------------------------------------------------------------------ */

function loaderShowLocked(message: string, progress = 5) {
  loader.lock();
  loader.show({ progress, message });
}

function loaderSet(message: string, progress?: number) {
  if (typeof progress === "number") loader.setProgress(progress);
  loader.setMessage(message);
}

function loaderFinish(message: string) {
  try {
    loader.setProgress(100);
    loader.setMessage(message);
  } finally {
    loader.unlock();
    // intentionally NO hide() here
  }
}

function loaderCloseForModal() {
  try {
    loader.unlock();
  } catch {}
  loader.hide(true);
}

/* ------------------------------------------------------------------
 * Billing (subscription-only model)
 * ------------------------------------------------------------------ */

const {
  showPaywall,
  paywallBusy,
  showPaymentFailed,
  paymentFailedBusy,
  paywallConfig,
  isBillingOverlayActive,
  showBillingSuccess,
  dismissBillingSuccess,
  onRequireSubscription,
  onPaywallPrimary,
  onPaywallSecondary,
  onPaymentFixPrimary,
  onPaymentFailedSecondary,
  maybeStartCheckoutFromQuery,
} = useBilling(route, router);

/* ------------------------------------------------------------------
 * Mapping / mapper state
 * ------------------------------------------------------------------ */

const showMapping = ref(false);

/** Shape expected by MappingRequiredModal: { mail?: string[]; crm?: string[] } */
const missing = ref<Record<string, string[]>>({});

const mappingBlocked = computed(() => {
  const m = missing.value || {};
  return !!((m.mail && m.mail.length) || (m.crm && m.crm.length));
});

const showMapper = ref(false);
const mailHeaders = ref<string[]>([]);
const crmHeaders = ref<string[]>([]);
const mailHeaderTypes = ref<
  Record<string, "string" | "number" | "date" | "unknown">
>({});
const crmHeaderTypes = ref<
  Record<string, "string" | "number" | "date" | "unknown">
>({});
const mailSamples = ref<Record<string, any>[]>([]);
const crmSamples = ref<Record<string, any>[]>([]);
const requiredMail = ref<string[]>([]);
const requiredCrm = ref<string[]>([]);
const initialMapping = ref<MapperMapping | undefined>(undefined);
const mailFields = ref<string[]>([]);
const crmFields = ref<string[]>([]);
const mailLabels = ref<Record<string, string>>({});
const crmLabels = ref<Record<string, string>>({});

const mapperErrors = ref<{
  mail: Record<string, string>;
  crm: Record<string, string>;
} | null>(null);

const mapperSaving = ref(false);

const uploadResetKey = ref(0);

const mailBatchId = ref<string | null>(null);
const crmBatchId = ref<string | null>(null);

function onBatchIdsUpdated(payload: {
  mailBatchId?: string | null;
  crmBatchId?: string | null;
}) {
  if ("mailBatchId" in payload) mailBatchId.value = payload.mailBatchId ?? null;
  if ("crmBatchId" in payload) crmBatchId.value = payload.crmBatchId ?? null;
}

function onUploadMappingRequired(payload: {
  source: Source;
  batchId: string | null;
  errors?: Record<string, string>;
  missing?: Record<string, string> | string[];
  sampleHeaders?: string[];
  sampleRows?: Record<string, any>[];
}) {
  const { source, batchId } = payload;

  if (source === "mail" && batchId) mailBatchId.value = batchId;
  if (source === "crm" && batchId) crmBatchId.value = batchId;

  const rawMissing = payload.missing || payload.errors || {};
  missing.value =
    source === "mail"
      ? { mail: labelsFromMissing(rawMissing) }
      : { crm: labelsFromMissing(rawMissing) };

  loaderCloseForModal();
  showMapping.value = true;
}

/* ------------------------------------------------------------------
 * Run data + polling
 * ------------------------------------------------------------------ */

const {
  runResult,
  runResultLoading,
  matchesLoading,
  error: runDataError,

  refreshOnce: refreshRunData,
  pollUntilTerminal,
  setActiveRunId,

  graphLabels,
  graphMailNow,
  graphCrmNow,
  graphMatchNow,
  mailPrev,
  crmPrev,
  matchPrev,
  graphRawMonths,
  topCityRows,
  topZipRows,
  summaryRows,
} = useRunData();

/* ------------------------------------------------------------------
 * Helpers (missing labels + normalize response guards)
 * ------------------------------------------------------------------ */

function labelsFromMissing(rawMissing: any): string[] {
  if (Array.isArray(rawMissing)) return rawMissing;

  if (rawMissing && typeof rawMissing === "object") {
    const values = Object.values(rawMissing);
    const first = values[0];
    if (typeof first === "string") return values as string[];
    return Object.keys(rawMissing);
  }

  return [];
}

function normalizeReason(data: any): string {
  return data?.reason ?? data?.code ?? data?.error ?? data?.error_code ?? "";
}

function isNormalizeAccepted(r: NormalizeBatchRes): boolean {
  return r.status === 202 && (r.data as any)?.ok === true;
}

function isNormalizeMappingRequired(r: NormalizeBatchRes): boolean {
  const d: any = r.data || {};
  return (
    r.status === 409 &&
    (d.error === "mapping_required" || d.code === "mapping_required")
  );
}

function isNormalizeGateDenied(r: NormalizeBatchRes): boolean {
  if (!(r.status === 402 || r.status === 400)) return false;
  const d: any = r.data || {};
  const reason = normalizeReason(d);
  return reason === "subscription_required" || reason === "upgrade_required";
}

/* ------------------------------------------------------------------
 * Mapping / mapper flows
 * ------------------------------------------------------------------ */

async function openMapper() {
  try {
    if (!mailBatchId.value && !crmBatchId.value) {
      console.warn("[Dashboard] No batch IDs available for mapper", {
        mailBatchId: mailBatchId.value,
        crmBatchId: crmBatchId.value,
      });
      return;
    }

    mapperErrors.value = null;

    loaderShowLocked("Loading your mapping…", 8);
    await nextTick();

    const params = {
      mailBatchId: mailBatchId.value || undefined,
      crmBatchId: crmBatchId.value || undefined,
    } as const;

    const [headersRes, mappingBundle] = await Promise.all([
      fetchMapperHeaders(params),
      fetchMapperMapping(params),
    ]);

    mailHeaders.value = headersRes.mailHeaders || [];
    crmHeaders.value = headersRes.crmHeaders || [];
    mailHeaderTypes.value = headersRes.mailHeaderTypes || {};
    crmHeaderTypes.value = headersRes.crmHeaderTypes || {};
    mailSamples.value = headersRes.mailSamples || [];
    crmSamples.value = headersRes.crmSamples || [];

    const mb: MappingBundle = mappingBundle;

    initialMapping.value = { mail: mb.mail.mapping, crm: mb.crm.mapping };
    requiredMail.value = mb.mail.required || [];
    requiredCrm.value = mb.crm.required || [];
    mailFields.value = mb.mail.fields || [];
    crmFields.value = mb.crm.fields || [];
    mailLabels.value = mb.mail.labels ?? {};
    crmLabels.value = mb.crm.labels ?? {};

    loaderCloseForModal();
    showMapping.value = false;
    showMapper.value = true;
  } catch (err) {
    console.error("[Dashboard] Failed to open mapper", err);
    loaderFinish("Could not load mapping (close this and try again).");
  }
}

async function onMappingConfirm(mapping: MapperMapping) {
  mapperErrors.value = null;
  mapperSaving.value = true;

  try {
    if (!mailBatchId.value && !crmBatchId.value) {
      console.warn("[Dashboard] No batch IDs available for onMappingConfirm");
      return;
    }

    await saveMapperMapping({
      mailBatchId: mailBatchId.value || undefined,
      crmBatchId: crmBatchId.value || undefined,
      mapping,
    });

    showMapper.value = false;
    mapperErrors.value = null;
    missing.value = {};
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status;
    const data = err?.data ?? err?.response?.data ?? {};
    const errorObj = data?.error ?? data;

    if (
      (status === 409 || status === 422) &&
      (errorObj?.type === "MappingValidationError" ||
        errorObj?.code === "mapping_required" ||
        data?.code === "mapping_required")
    ) {
      const fields =
        errorObj.fields || errorObj.details?.fields || data?.fields || {};
      const mailFieldErrors: Record<string, string> = {};
      const crmFieldErrors: Record<string, string> = {};

      if (fields.mail) {
        for (const [canonField, meta] of Object.entries<any>(fields.mail)) {
          mailFieldErrors[canonField] =
            meta?.message || "Please adjust this field’s mapping.";
        }
      }

      if (fields.crm) {
        for (const [canonField, meta] of Object.entries<any>(fields.crm)) {
          crmFieldErrors[canonField] =
            meta?.message || "Please adjust this field’s mapping.";
        }
      }

      mapperErrors.value = { mail: mailFieldErrors, crm: crmFieldErrors };
      console.warn("[Dashboard] Mapping validation failed", mapperErrors.value);
      return;
    }

    console.error("[Dashboard] Saving mapping failed", err);
  } finally {
    mapperSaving.value = false;
  }
}

/* ------------------------------------------------------------------
 * Upload commit → normalize + poll run + auto-populate results
 * ------------------------------------------------------------------ */

const foregroundBusy = ref(false);

async function onUploadCommit(payload: {
  mailBatchId: string | null;
  crmBatchId: string | null;
}) {
  const { mailBatchId: mailId, crmBatchId: crmId } = payload;

  const batchIds: string[] = [];
  if (mailId) batchIds.push(mailId);
  if (crmId) batchIds.push(crmId);

  if (!batchIds.length) {
    console.info("[Dashboard] Upload commit skipped: no batch IDs");
    return;
  }

  foregroundBusy.value = true;

  loaderShowLocked("Normalizing your data…", 5);
  await nextTick();

  try {
    let startedRunId: string | null = null;

    for (const [i, id] of batchIds.entries()) {
      loaderSet(`Normalizing ${i + 1}/${batchIds.length}…`, 5 + i * 5);

      const res = await normalizeBatch(id);
      const data: any = res.data || {};

      // ✅ Mapping required surfaced from /normalize (409)
      if (isNormalizeMappingRequired(res)) {
        const src = (data.source as Source | undefined) ?? undefined;
        const labelList = labelsFromMissing(
          data.missing || data.field_errors || {}
        );

        if (src === "mail") missing.value = { mail: labelList };
        else if (src === "crm") missing.value = { crm: labelList };

        loaderCloseForModal();
        showMapping.value = true;
        return;
      }

      // ✅ Tier gate (402/400) — this is where paywall MUST be triggered
      if (isNormalizeGateDenied(res)) {
        // If your billing composable supports using the checkout URL, pass it or store it.
        // If not, still open the paywall and let the modal "Get Started" button call the API.
        loaderCloseForModal();
        onRequireSubscription();
        return;
      }

      // ✅ Accepted (202) -> capture run id
      if (!startedRunId && isNormalizeAccepted(res) && data.run_id) {
        startedRunId = String(data.run_id);
      }
    }

    const shouldPoll = batchIds.length >= 2;

    if (startedRunId) setActiveRunId(startedRunId);

    if (shouldPoll) {
      loaderSet("Running matches & geocoding…", 20);

      const finalStatus = await pollUntilTerminal({
        runId: startedRunId ?? null,
        showLoader: true,
        initialMessage: "Running matches & geocoding…",
        intervalMs: 1000,
        maxTicks: 240,
      });

      if (!finalStatus) {
        loaderFinish(
          "Run finished, but status is unavailable — close this and refresh."
        );
      }
    } else {
      loaderSet("Refreshing dashboard…", 25);
      await refreshRunData();
      loaderFinish("Upload complete — close this when you’re ready.");
    }

    uploadResetKey.value++;
  } catch (err: any) {
    // ✅ Keep your old block — but it now only applies to NON-normalize failures
    // (polling failures, mapper, unexpected errors, etc.)
    const status = err?.status ?? err?.response?.status;
    const data = err?.data ?? err?.response?.data ?? {};

    const code =
      data?.code ??
      data?.error ??
      data?.error_code ??
      data?.reason ??
      (data?.type === "MappingValidationError" ? "mapping_required" : "");

    if ((status === 409 || status === 422) && code === "mapping_required") {
      const src = data?.source as Source | undefined;
      const labelList = labelsFromMissing(
        data?.missing || data?.field_errors || data?.fields || {}
      );

      if (src === "mail") missing.value = { mail: labelList };
      else if (src === "crm") missing.value = { crm: labelList };

      loaderCloseForModal();
      showMapping.value = true;
      return;
    }

    if (
      (status === 402 || status === 400) &&
      (code === "subscription_required" || code === "upgrade_required")
    ) {
      loaderCloseForModal();
      onRequireSubscription();
      return;
    }

    console.error("[Dashboard] Upload commit failed", err);
    loaderFinish("Upload failed — close this and try again.");
  } finally {
    foregroundBusy.value = false;
  }
}

/* ------------------------------------------------------------------
 * Initialisation
 * ------------------------------------------------------------------ */

function onRunCompleted() {
  if (foregroundBusy.value) return;
  void refreshRunData();
}

onMounted(() => {
  const init = async () => {
    await maybeStartCheckoutFromQuery();
    await refreshRunData();
  };

  window.addEventListener("mt:run-completed", onRunCompleted);
  void init();
});

onBeforeUnmount(() => {
  window.removeEventListener("mt:run-completed", onRunCompleted);
});
</script>

<template>
  <div
    class="dash-main-inner"
    :class="{ 'dash-main-inner--blurred': isBillingOverlayActive }"
  >
    <div
      v-if="showBillingSuccess"
      class="mb-4 flex items-start justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
    >
      <p class="mr-2">
        Your MailTrace subscription is now active. Go ahead and upload your CSVs
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

    <div id="cmp-hero">
      <UploadCard
        class="card"
        :reset-key="uploadResetKey"
        :mapping-blocked="mappingBlocked"
        @edit-mapping="openMapper"
        @batch-ids="onBatchIdsUpdated"
        @upload-commit="onUploadCommit"
        @mapping-required="onUploadMappingRequired"
      />

      <KpiSummaryCard
        id="cmp-kpis"
        class="card kpi-card"
        :kpis="runResult?.kpis || null"
        :loading="runResultLoading"
      />
    </div>

    <div class="section card" id="cmp-graph">
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

    <div class="section" id="cmp-top">
      <div class="top-card">
        <TopCitiesTable :rows="topCityRows" />
      </div>
      <div class="top-card">
        <TopZipsTable :rows="topZipRows" />
      </div>
    </div>

    <div class="section card" id="cmp-summary">
      <SummaryTable
        class="section"
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
    @close="showMapper = false"
    @confirm="onMappingConfirm"
  />

  <PaywallModal
    v-model="showPaywall"
    :config="paywallConfig"
    :loading="paywallBusy"
    @primary="onPaywallPrimary"
    @secondary="onPaywallSecondary"
  />

  <PaymentFailedModal
    v-model="showPaymentFailed"
    :loading="paymentFailedBusy"
    title="Payment issue"
    message="We couldn’t charge your card. Update your payment method to resume matching runs."
    primary-label="Fix payment"
    secondary-label="Not now"
    @primary="onPaymentFixPrimary"
    @secondary="onPaymentFailedSecondary"
  />
</template>

<style scoped>
.dash-main-inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: filter 0.18s ease, opacity 0.18s ease;
}

.dash-main-inner--blurred {
  filter: blur(3px);
  opacity: 0.6;
  pointer-events: none;
  user-select: none;
}

#cmp-hero {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
}

#cmp-hero .card {
  width: 100%;
  height: 100%;
}

.kpi-card {
  display: flex;
  flex-direction: column;
}

#cmp-top {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.top-card {
  width: 100%;
  height: 100%;
}

.top-card :deep(.card) {
  width: 100%;
}

@media (max-width: 1024px) {
  #cmp-hero {
    grid-template-columns: 1fr;
  }
  #cmp-top {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  #cmp-hero {
    grid-template-columns: 1fr;
  }
  #cmp-top {
    grid-template-columns: 1fr;
  }
  #cmp-summary {
    display: none;
  }
}
</style>

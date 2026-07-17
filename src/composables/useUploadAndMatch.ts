// Shared upload → mapping → normalize → match-run wiring.
// Ported from Dashboard.vue so Analytics (and future callers) can reuse
// the same flow without duplicating ~500 lines.
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from "vue";
import { useMessage } from "naive-ui";

import {
  normalizeBatch,
  getBatches,
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
import { useBilling, type PaywallConfig as BillingPaywallConfig } from "@/composables/useBilling";
import { useLoader } from "@/stores/loader";
import { useRunStore } from "@/stores/useRunStore";
import { useAuthStore } from "@/stores/auth";
import { useCampaignStore } from "@/stores/useCampaignStore";
import type { RouteLocationNormalizedLoaded, Router } from "vue-router";

const PREVIEW_RUN_ID_KEY = "mt_preview_run_id";

export function useUploadAndMatch(
  route: RouteLocationNormalizedLoaded,
  router: Router,
) {
  const message = useMessage();
  const loader = useLoader();
  const runStore = useRunStore();
  const auth = useAuthStore();
  const campaignStore = useCampaignStore();
  campaignStore.hydrate();

  /* ------------------------------------------------------------------
   * Loader policy helpers
   * ------------------------------------------------------------------ */

  function loaderShowLocked(msg: string, progress = 5) {
    loader.lock();
    loader.show({ progress, message: msg });
  }

  function loaderSet(msg: string, progress?: number) {
    if (typeof progress === "number") loader.setProgress(progress);
    loader.setMessage(msg);
  }

  function loaderFinish(msg: string) {
    try {
      loader.setProgress(100);
      loader.setMessage(msg);
    } finally {
      loader.unlock();
    }
  }

  function loaderCloseForModal() {
    try {
      loader.unlock();
    } catch {}
    loader.hide(true);
  }

  /* ------------------------------------------------------------------
   * Billing
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

  const isPreviewMode = ref(false);
  const billingReadOnly = computed(
    () => String(auth.billing?.subscription_status || "").toLowerCase() === "paused",
  );

  const paywallConfigOverride = ref<BillingPaywallConfig | null>(null);

  const effectivePaywallConfig = computed(
    () => paywallConfigOverride.value ?? paywallConfig.value,
  );

  function showSubscriptionPaywall() {
    paywallConfigOverride.value = null;
    onRequireSubscription();
  }

  function handlePaywallSecondary() {
    paywallConfigOverride.value = null;
    onPaywallSecondary();
  }

  function normalizePaywallConfig(
    config: Record<string, any> | null | undefined,
  ): BillingPaywallConfig | null {
    if (!config) return null;

    return {
      title: config.title,
      body: config.body,
      priceSummary: config.priceSummary ?? config.price_summary,
      primaryLabel: config.primaryLabel ?? config.primary_label,
      secondaryLabel: config.secondaryLabel ?? config.secondary_label,
      bullets: Array.isArray(config.bullets) ? config.bullets : [],
      tierPicker: Boolean(config.tierPicker ?? config.tier_picker),
      defaultPlanCode: config.defaultPlanCode ?? config.default_plan_code,
      tierHint: config.tierHint ?? config.tier_hint,
    };
  }

  /* ------------------------------------------------------------------
   * Mapping / mapper state
   * ------------------------------------------------------------------ */

  const showMapping = ref(false);
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
  const showFirstUploadModal = ref(false);
  const isFirstUpload = ref(false);
  const firstUploadRunLoading = ref(false);

  const mailBatchId = ref<string | null>(null);
  const crmBatchId = ref<string | null>(null);
  const pendingNormalize = ref<{
    mailBatchId: string | null;
    crmBatchId: string | null;
  } | null>(null);

  const showCampaignPrompt = ref(false);
  const pendingCampaignNormalize = ref<{
    mailBatchId: string | null;
    crmBatchId: string | null;
  } | null>(null);

  /* ------------------------------------------------------------------
   * Run data
   * ------------------------------------------------------------------ */

  const {
    runResult,
    runResultLoading,
    error: runDataError,
    refreshOnce: refreshRunData,
    pollUntilTerminal,
    setActiveRunId,
  } = useRunData();

  /** True when a completed match run with KPI payload is available. */
  const hasMatchData = computed(() => {
    const result = runResult.value as any;
    return result != null && result.kpis != null;
  });

  /* ------------------------------------------------------------------
   * Helpers
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
    return (
      reason === "usage_limit_exceeded" ||
      reason === "subscription_required" ||
      reason === "upgrade_required" ||
      reason === "paused_subscription"
    );
  }

  function openNormalizeGatePaywall(data: Record<string, any>) {
    paywallConfigOverride.value = normalizePaywallConfig(data?.paywall_config);

    const reason = normalizeReason(data);
    if (reason === "usage_limit_exceeded") {
      message.warning(
        data?.message ||
          "This upload would put you over your plan's mail limit. Upgrade to normalize and match these files.",
      );
    } else if (reason === "paused_subscription") {
      message.warning(
        data?.message || "Uploads are paused until you resume a paid plan.",
      );
    }

    onRequireSubscription();
  }

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
   * Mapping / mapper flows
   * ------------------------------------------------------------------ */

  async function openMapper() {
    try {
      if (!mailBatchId.value && !crmBatchId.value) {
        console.warn("[useUploadAndMatch] No batch IDs available for mapper", {
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
      console.error("[useUploadAndMatch] Failed to open mapper", err);
      loaderFinish("Could not load mapping (close this and try again).");
    }
  }

  async function onMappingConfirm(mapping: MapperMapping) {
    mapperErrors.value = null;
    mapperSaving.value = true;

    try {
      if (!mailBatchId.value && !crmBatchId.value) {
        console.warn("[useUploadAndMatch] No batch IDs available for onMappingConfirm");
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

      if (pendingNormalize.value) {
        const pending = pendingNormalize.value;
        pendingNormalize.value = null;
        showCampaignPromptBeforeNormalize(pending);
      }
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
        console.warn("[useUploadAndMatch] Mapping validation failed", mapperErrors.value);
        return;
      }

      console.error("[useUploadAndMatch] Saving mapping failed", err);
    } finally {
      mapperSaving.value = false;
    }
  }

  function autoMappingNeedsReview(
    side: MappingBundle["mail"] | MappingBundle["crm"] | null | undefined,
    batchId: string | null,
  ): boolean {
    if (!batchId || !side?.from_auto) return false;
    return Array.isArray(side.missing) && side.missing.length > 0;
  }

  /* ------------------------------------------------------------------
   * Upload commit → normalize + poll run
   * ------------------------------------------------------------------ */

  const foregroundBusy = ref(false);

  async function onUploadCommit(payload: {
    mailBatchId: string | null;
    crmBatchId: string | null;
  }) {
    const { mailBatchId: mailId, crmBatchId: crmId } = payload;

    if (!mailId && !crmId) {
      console.info("[useUploadAndMatch] Upload commit skipped: no batch IDs");
      return;
    }

    try {
      const mappingBundle = await fetchMapperMapping({
        mailBatchId: mailId || undefined,
        crmBatchId: crmId || undefined,
      });

      const hasAutoMappingReview =
        autoMappingNeedsReview(mappingBundle.mail, mailId) ||
        autoMappingNeedsReview(mappingBundle.crm, crmId);

      if (hasAutoMappingReview) {
        pendingNormalize.value = { mailBatchId: mailId, crmBatchId: crmId };
        await openMapper();
        return;
      }
    } catch (err) {
      console.warn(
        "[useUploadAndMatch] Failed to check mapping, proceeding to normalize",
        err,
      );
    }

    showCampaignPromptBeforeNormalize(payload);
  }

  function showCampaignPromptBeforeNormalize(payload: {
    mailBatchId: string | null;
    crmBatchId: string | null;
  }) {
    pendingCampaignNormalize.value = payload;
    showCampaignPrompt.value = true;
  }

  function onCampaignPromptConfirm(_campaignId: string | null) {
    showCampaignPrompt.value = false;
    const pending = pendingCampaignNormalize.value;
    pendingCampaignNormalize.value = null;
    if (pending) void onUploadCommitNormalize(pending);
  }

  function onCampaignPromptSkip() {
    showCampaignPrompt.value = false;
    const pending = pendingCampaignNormalize.value;
    pendingCampaignNormalize.value = null;
    if (pending) void onUploadCommitNormalize(pending);
  }

  async function assignMailBatchToActiveCampaign(batchId: string | null) {
    const campaignId = campaignStore.activeCampaignId;
    if (!batchId || !campaignId) return;

    try {
      await campaignStore.assignBatches(campaignId, [batchId]);
    } catch (err) {
      console.warn("[useUploadAndMatch] Failed to assign batch to campaign", err);
    }
  }

  async function onUploadCommitNormalize(payload: {
    mailBatchId: string | null;
    crmBatchId: string | null;
  }) {
    const { mailBatchId: mailId, crmBatchId: crmId } = payload;

    const batchIds: string[] = [];
    if (mailId) batchIds.push(mailId);
    if (crmId) batchIds.push(crmId);

    if (!batchIds.length) {
      console.info("[useUploadAndMatch] Upload commit skipped: no batch IDs");
      return;
    }

    await assignMailBatchToActiveCampaign(mailId);

    foregroundBusy.value = true;

    try {
      const existingBatches = await getBatches();
      isFirstUpload.value = existingBatches.length === 0;
    } catch (err) {
      console.warn("[useUploadAndMatch] Failed to check existing batches:", err);
      isFirstUpload.value = false;
    }

    loaderShowLocked("Normalizing your data…", 5);
    await nextTick();

    try {
      let startedRunId: string | null = null;

      for (const [i, id] of batchIds.entries()) {
        loaderSet(`Normalizing ${i + 1}/${batchIds.length}…`, 5 + i * 5);

        const res = await normalizeBatch(id);
        const data: any = res.data || {};

        if (isNormalizeMappingRequired(res)) {
          const src = (data.source as Source | undefined) ?? undefined;
          const labelList = labelsFromMissing(
            data.missing || data.field_errors || {},
          );

          if (src === "mail") missing.value = { mail: labelList };
          else if (src === "crm") missing.value = { crm: labelList };

          loaderCloseForModal();
          showMapping.value = true;
          return;
        }

        const batchPreviewMode =
          data.preview_mode === true ||
          (res.status === 202 && data.reason === "subscription_required");

        if (isNormalizeGateDenied(res) && !batchPreviewMode) {
          loaderCloseForModal();
          openNormalizeGatePaywall(data);
          return;
        }

        if (
          !startedRunId &&
          (isNormalizeAccepted(res) || batchPreviewMode) &&
          data.run_id
        ) {
          startedRunId = String(data.run_id);

          if (batchPreviewMode) {
            localStorage.setItem(PREVIEW_RUN_ID_KEY, startedRunId);
          }
        }

        if (batchPreviewMode) {
          isPreviewMode.value = true;
          loaderCloseForModal();
          showSubscriptionPaywall();
        }
      }

      const shouldPoll = !!startedRunId;

      if (startedRunId) setActiveRunId(startedRunId);

      if (isFirstUpload.value && batchIds.length >= 2) {
        loaderCloseForModal();
        showFirstUploadModal.value = true;
        return;
      }

      if (shouldPoll && startedRunId) {
        loaderSet("Running matches & geocoding…", 20);

        const finalStatus = await pollUntilTerminal({
          runId: startedRunId,
          showLoader: true,
          initialMessage: "Running matches & geocoding…",
          intervalMs: 1000,
          maxTicks: 240,
        });

        if (!finalStatus) {
          loaderFinish(
            "Run finished, but status is unavailable — close this and refresh.",
          );
        } else {
          await refreshRunData();
          loaderFinish("Processing complete — results are ready!");
          loader.show({
            progress: 100,
            message: "Processing complete — results are ready!",
          });
          setTimeout(() => {
            loader.hide(true);
          }, 5000);
        }
      } else {
        loaderSet("Refreshing results…", 25);
        await refreshRunData();
        loaderFinish("Upload complete — close this when you're ready.");
        loader.show({
          progress: 100,
          message: "Upload complete — close this when you're ready.",
        });
        setTimeout(() => {
          loader.hide(true);
        }, 5000);
      }

      uploadResetKey.value++;
    } catch (err: any) {
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
          data?.missing || data?.field_errors || data?.fields || {},
        );

        if (src === "mail") missing.value = { mail: labelList };
        else if (src === "crm") missing.value = { crm: labelList };

        loaderCloseForModal();
        showMapping.value = true;
        return;
      }

      if (
        (status === 402 || status === 400) &&
        (code === "usage_limit_exceeded" ||
          code === "subscription_required" ||
          code === "upgrade_required" ||
          code === "paused_subscription")
      ) {
        loaderCloseForModal();
        openNormalizeGatePaywall(data);
        return;
      }

      console.error("[useUploadAndMatch] Upload commit failed", err);
      loaderFinish("Upload failed — close this and try again.");
    } finally {
      foregroundBusy.value = false;
    }
  }

  function onRunCompleted() {
    if (foregroundBusy.value) return;
    void refreshRunData();
  }

  async function handleFirstUploadRunMatching() {
    firstUploadRunLoading.value = true;
    showFirstUploadModal.value = false;

    try {
      loaderShowLocked("Starting matching run…", 10);
      await nextTick();

      await refreshRunData();

      const runId = runStore.status?.run_id;

      if (runId) {
        setActiveRunId(String(runId));
        loaderSet("Running matches & geocoding…", 20);

        const finalStatus = await pollUntilTerminal({
          runId: String(runId),
          showLoader: true,
          initialMessage: "Running matches & geocoding…",
          intervalMs: 1000,
          maxTicks: 240,
        });

        if (!finalStatus) {
          loaderFinish(
            "Run finished, but status is unavailable — close this and refresh.",
          );
        } else {
          await refreshRunData();
          loaderFinish("Matching complete!");
          loader.show({ progress: 100, message: "Matching complete!" });
          setTimeout(() => {
            loader.hide(true);
          }, 5000);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await refreshRunData();
        loaderFinish("Matching run started. Results will appear shortly.");
        loader.show({
          progress: 100,
          message: "Matching run started. Results will appear shortly.",
        });
        setTimeout(() => {
          loader.hide(true);
        }, 5000);
      }
    } catch (err: any) {
      console.error("[useUploadAndMatch] Failed to start matching run:", err);
      loaderFinish("Failed to start matching run. Please try again.");
    } finally {
      firstUploadRunLoading.value = false;
    }
  }

  /* ------------------------------------------------------------------
   * Preview / billing watches + lifecycle
   * ------------------------------------------------------------------ */

  watch(
    () => showBillingSuccess.value,
    async (isSuccess) => {
      if (isSuccess) {
        isPreviewMode.value = false;
        await new Promise((resolve) => setTimeout(resolve, 500));
        await refreshRunData();
        if (showPaywall.value) {
          paywallConfigOverride.value = null;
          showPaywall.value = false;
        }
      }
    },
    { immediate: false },
  );

  watch(
    () => showPaywall.value,
    (open) => {
      if (!open) {
        paywallConfigOverride.value = null;
      }
    },
  );

  watch(
    () => runResult.value,
    (result) => {
      if (result) {
        const previewMode = (result as any).preview_mode === true;
        if (previewMode !== isPreviewMode.value) {
          isPreviewMode.value = previewMode;
          if (previewMode && !showPaywall.value) {
            showSubscriptionPaywall();
          }
        }
      }
    },
    { immediate: true, deep: true },
  );

  const shouldBlur = computed(() => {
    return (
      isBillingOverlayActive.value ||
      (isPreviewMode.value && !showBillingSuccess.value)
    );
  });

  const showPreviewUpgradeBanner = computed(() => {
    return isPreviewMode.value && !showBillingSuccess.value;
  });

  const initialLoadDone = ref(false);

  onMounted(() => {
    const init = async () => {
      await maybeStartCheckoutFromQuery();
      await auth.fetchMe();
      await refreshRunData();

      const result = runResult.value as any;
      if (result) {
        const backendPreviewMode = result.preview_mode === true;
        isPreviewMode.value = backendPreviewMode;
        if (backendPreviewMode && !showPaywall.value) {
          showSubscriptionPaywall();
        }
      }

      if (route.query.billing === "success") {
        isPreviewMode.value = false;

        const redirectRunId = route.query.run ? String(route.query.run) : null;
        const storedPreviewRunId = localStorage.getItem(PREVIEW_RUN_ID_KEY);
        const expectedRunId = redirectRunId || storedPreviewRunId;

        if (expectedRunId) {
          setActiveRunId(expectedRunId);
        }

        await auth.fetchMe();
        await new Promise((resolve) => setTimeout(resolve, 500));
        await refreshRunData();

        if (storedPreviewRunId) {
          localStorage.removeItem(PREVIEW_RUN_ID_KEY);
        }

        if (showPaywall.value) {
          paywallConfigOverride.value = null;
          showPaywall.value = false;
        }
      }

      initialLoadDone.value = true;
    };

    window.addEventListener("mt:run-completed", onRunCompleted);
    void init();
  });

  function onCampaignChanged() {
    void refreshRunData();
  }

  window.addEventListener("mt:campaign-changed", onCampaignChanged);

  onBeforeUnmount(() => {
    window.removeEventListener("mt:run-completed", onRunCompleted);
    window.removeEventListener("mt:campaign-changed", onCampaignChanged);
  });

  return {
    // Run data
    runResult,
    runResultLoading,
    runDataError,
    hasMatchData,
    refreshRunData,
    initialLoadDone,

    // Upload / mapping state
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

    // Upload / mapping actions
    onBatchIdsUpdated,
    onUploadMappingRequired,
    onUploadCommit,
    openMapper,
    onMappingConfirm,
    onCampaignPromptConfirm,
    onCampaignPromptSkip,
    handleFirstUploadRunMatching,

    // Billing
    showPaywall,
    paywallBusy,
    showPaymentFailed,
    paymentFailedBusy,
    effectivePaywallConfig,
    isPreviewMode,
    shouldBlur,
    showPreviewUpgradeBanner,
    showBillingSuccess,
    dismissBillingSuccess,
    onRequireSubscription,
    onPaywallPrimary,
    handlePaywallSecondary,
    onPaymentFixPrimary,
    onPaymentFailedSecondary,
  };
}

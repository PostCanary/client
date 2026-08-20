<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { CreateOutline } from "@vicons/ionicons5";
import { useRoute, useRouter } from "vue-router";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { approveCampaignDraft } from "@/composables/approveCampaignDraft";
import type {
  CardSchedule,
  DesignReturnAddress,
  DesignSource,
  MailCampaign,
  MailCampaignOrder,
  MailScheduleInvalidDetails,
  ReviewSelection,
} from "@/types/campaign";
import ReviewSummary from "@/components/review/ReviewSummary.vue";
import ScheduleEditor from "@/components/review/ScheduleEditor.vue";
import CostBreakdown from "@/components/review/CostBreakdown.vue";
import {
  createApprovalArtifact,
  isKnownPreProviderPurchaseError,
  normalizeOrderProjection,
  purchaseCampaignRecords,
} from "@/api/mailCampaigns";
import {
  createSetupSession,
  fetchPaymentMethodSummary,
  type PaymentMethodSummary,
} from "@/api/billing";
import {
  isSelectedMailingDateValid,
  isValidIsoDate,
  isWeekendIsoDate,
  scheduleForDate,
  useMailScheduleAvailability,
} from "@/composables/useMailScheduleAvailability";
import {
  getReturnAddress,
  type OrgReturnAddress,
} from "@/api/orgs";
import { useRenderJob } from "@/composables/useRenderJob";
import { mediaSrc } from "@/utils/mediaSrc";
import {
  campaignOrderNeedsAttention,
  formatOrderAmount,
} from "@/utils/campaignDisplay";
import { loadTargetingCapabilities } from "@/composables/useTargetingCapabilities";
import {
  extractOverRecipientCapError,
  formatOverRecipientCapPurchaseError,
  formatRecipientCapWarning,
  isOverRecipientCap,
  parsePurchaseRecordsMaxQty,
} from "@/utils/recipientCap";
import { resolveCampaignName } from "@/utils/defaultCampaignName";
import { usePermissions } from "@/composables/usePermissions";

const router = useRouter();
const route = useRoute();
const draftStore = useCampaignDraftStore();
const brandKitStore = useBrandKitStore();
const { canPurchase } = usePermissions();

// Phase 4D task 29: print-ready PDF preview at the final review step.
// Customer clicks "View Print Proof" to see the actual rendered output
// before approval. NOT auto-triggered on mount — every render burns a
// rate-limit slot (10/hr/org) and may collide with a job customer
// kicked off in StepDesign that's still in flight.
const { phase: renderPhase, progress: renderProgress, cards: renderedCards,
        error: renderError, start: startRender } = useRenderJob();
const showProofPanel = ref(false);

async function handleGenerateProof() {
  if (!draftStore.draft) return;
  showProofPanel.value = true;
  await draftStore.saveNow();
  await startRender(draftStore.draft.id);
}

const approving = ref(false);
const savingForAdminApproval = ref(false);
const approved = ref(false);
const approvedCampaign = ref<MailCampaign | null>(null);
const approvedOrder = ref<MailCampaignOrder | null>(null);
const APPROVAL_TERMS_VERSION = "accuracy-rights-v1";
const paymentMethod = ref<PaymentMethodSummary | null>(null);
const paymentMethodLoading = ref(true);
const paymentMethodError = ref<string | null>(null);
const paymentMethodBusy = ref(false);
const paymentStatusMessage = ref<string | null>(null);
const reconciliationBlocked = ref(false);
const purchaseRecordsMaxQty = ref<number | null>(null);
const recipientCapResolved = ref(false);

const paymentReady = computed(
  () =>
    paymentMethod.value !== null &&
    (!paymentMethod.value.required || paymentMethod.value.has_payment_method),
);

async function loadPaymentMethod() {
  paymentMethodLoading.value = true;
  paymentMethodError.value = null;
  try {
    paymentMethod.value = await fetchPaymentMethodSummary(householdCount.value);
  } catch (err) {
    console.error("[StepReview] Failed to load payment method:", err);
    paymentMethod.value = null;
    paymentMethodError.value =
      "We couldn't verify your payment method. Retry before approving.";
  } finally {
    paymentMethodLoading.value = false;
  }
}

async function managePaymentMethod() {
  if (paymentMethodBusy.value) return;
  paymentMethodBusy.value = true;
  paymentMethodError.value = null;
  try {
    const { url } = await createSetupSession(route.fullPath);
    if (!url) throw new Error("No card setup URL returned");
    window.location.href = url;
  } catch (err) {
    console.error("[StepReview] Failed to open card setup:", err);
    paymentMethodError.value =
      "We couldn't open secure card setup. Please try again.";
  } finally {
    paymentMethodBusy.value = false;
  }
}

// Brief #6 P0 #4: Consolidated accuracy + rights confirmation before
// Approve is enabled. V1 spec line 989: "Mandatory confirmation checkboxes
// before approval: accuracy of info, image rights, PostCanary not
// responsible for accuracy". Consolidated into one checkbox per Krug —
// multiple checkboxes fragment attention and users click them without
// reading. One checkbox with a clear combined statement has more weight.
//
// INTENTIONAL: this ref is NOT hydrated from draftStore.draft.review on
// mount, even though every other Step 4 field is. An acknowledgement is
// a point-in-time act, not persisted state. If the customer resumes a
// draft 3 days later they should re-read and re-check. `agreedToTerms`
// in the persisted review schema remains the value captured at the
// moment the customer actually clicks Approve.
//
// SPEC DEVIATION: V1 spec also has per-asset checkboxes (lines 763-764:
// "Confirm you have rights to use this image in print" and "Confirm this
// is a real customer review") near the photo/review pickers. Drake's
// explicit direction for P0 #4 was consolidation per Krug. Per-asset
// confirmations are deferred to V1.1 — tracked in postcanary-todo.md.
const acknowledgedAccuracy = ref(false);

// Data from earlier steps
const goal = computed(() => draftStore.draft?.goal);
const targeting = computed(() => draftStore.draft?.targeting);
const designCards = computed(() => draftStore.draft?.design?.sequenceCards ?? []);
// POS-149: Flow v2 checkout deltas. Absent designSource (pre-Flow-v2 drafts,
// or a draft that never touched the new design-request/upload paths) keeps
// today's generated-cards behavior exactly — see DesignSelection.designSource.
const designSource = computed<DesignSource | undefined>(
  () => draftStore.draft?.design?.designSource,
);
const uploadedFrontUrl = computed(() => {
  const url = draftStore.draft?.design?.uploadedAsset?.frontUrl ?? null;
  // Server returns root-relative /media/... paths — resolve against API_BASE.
  return url ? mediaSrc(url) : null;
});
const uploadedFrontMimeType = computed(
  () => draftStore.draft?.design?.uploadedAsset?.mimeType ?? null,
);
const isCustomDesignRequest = computed(() => designSource.value === "requested");
// Send-to-a-list campaigns have no targeting slice — their recipient count
// is the uploaded audience's post-suppression deliverable count (dry-run
// find 2026-07-18: review showed "0 households" and blocked approval).
const householdCount = computed(() => {
  if (goal.value?.goalType === "send_to_list") {
    return (
      draftStore.draft?.audience?.suppressionResult?.deliverable_count ?? 0
    );
  }
  return targeting.value?.finalHouseholdCount ?? 0;
});
const audienceNoun = computed(() =>
  targeting.value?.audienceType === 'business' ? 'businesses' : 'households',
);
const overRecipientCap = computed(() =>
  isOverRecipientCap(householdCount.value, purchaseRecordsMaxQty.value),
);
const recipientCapWarning = computed(() =>
  overRecipientCap.value && purchaseRecordsMaxQty.value != null
    ? formatRecipientCapWarning(purchaseRecordsMaxQty.value)
    : null,
);

async function resolveRecipientCap() {
  recipientCapResolved.value = false;
  const result = await loadTargetingCapabilities();
  purchaseRecordsMaxQty.value = parsePurchaseRecordsMaxQty(
    result.capabilities?.purchase_records_max_qty,
  );
  recipientCapResolved.value = true;
}
const seqLen = computed(() => 1);
// Campaign name — auto-generated, editable. A typed name is persisted with
// campaignNameIsCustom so a later generate / reload / resume cannot replace it.
const campaignName = ref("");
const campaignNameIsCustom = ref(false);

function applyResolvedCampaignName() {
  const review = draftStore.draft?.review;
  const resolved = resolveCampaignName({
    savedName: review?.campaignName,
    isCustom: review?.campaignNameIsCustom,
    goalLabel: goal.value?.goalLabel,
    staleTokens: [
      brandKitStore.brandKit?.location,
      targeting.value?.areas?.[0]?.zipCode,
    ],
  });
  campaignName.value = resolved;
  campaignNameIsCustom.value =
    review?.campaignNameIsCustom === true && Boolean(review.campaignName?.trim());
  if (!campaignNameIsCustom.value) {
    draftStore.setCampaignName(resolved, false);
  }
}

function onCampaignNameInput() {
  campaignNameIsCustom.value = true;
  draftStore.setCampaignName(campaignName.value, true);
}

onMounted(() => {
  applyResolvedCampaignName();
  void loadOrgReturnAddress();
  void loadPaymentMethod();
  void resolveRecipientCap();
  if (route.query.billing === "card_saved") {
    paymentStatusMessage.value = "Payment method saved.";
  } else if (route.query.billing === "card_setup_cancelled") {
    paymentStatusMessage.value = "Payment method setup was canceled.";
  }
});

watch(
  () => goal.value?.goalLabel,
  () => {
    if (campaignNameIsCustom.value) return;
    applyResolvedCampaignName();
  },
);

// Targeting method label
const targetingMethodLabel = computed(() => {
  const method = targeting.value?.method;
  if (method === "around_jobs") return "Around recent jobs";
  if (method === "zip") return "By ZIP code";
  if (method === "draw") return "Custom area on map";
  return "Custom targeting";
});

// Schedule — pre-fill from Step 1 spacing
const schedules = ref<CardSchedule[]>([]);
const scheduleAvailability = useMailScheduleAvailability();
const scheduleActionMessage = ref<string | null>(null);

async function loadScheduleAvailability() {
  scheduleActionMessage.value = null;
  const result = await scheduleAvailability.load();
  if (!result) {
    schedules.value = [];
    return;
  }

  const saved = draftStore.draft?.review?.schedules?.[0]?.scheduledDate ?? "";
  const initialDate = isSelectedMailingDateValid(saved, result)
    ? saved
    : result.earliest_mailing_date;
  schedules.value = [scheduleForDate(initialDate)];
}

onMounted(() => {
  // Requested professional design is not schedule-ready until a future final
  // customer proof approval exists. Do not show or calculate a guaranteed date.
  if (!isCustomDesignRequest.value) {
    void loadScheduleAvailability();
  }
});

function updateSchedule(updated: CardSchedule[]) {
  schedules.value = updated.slice(0, 1);
  scheduleActionMessage.value = null;
}

const selectedMailingDate = computed(
  () => schedules.value[0]?.scheduledDate ?? "",
);
const selectedMailingDateValid = computed(() =>
  isSelectedMailingDateValid(
    selectedMailingDate.value,
    scheduleAvailability.availability.value,
  ),
);
const scheduleValidityMessage = computed(() => {
  const selected = selectedMailingDate.value;
  const availability = scheduleAvailability.availability.value;
  if (!availability || !selected) return null;
  if (!isValidIsoDate(selected)) return "Choose a valid mailing date.";
  if (selected < availability.earliest_mailing_date) {
    return `Choose ${availability.earliest_mailing_date} or a later eligible date.`;
  }
  if (isWeekendIsoDate(selected)) {
    return "Mailing dates must fall on a weekday. Holidays are confirmed by the server when you approve.";
  }
  return null;
});

const approvalOutcomeTitle = computed(() => {
  const order = approvedOrder.value;
  if (!order) return "Campaign approved";
  if (campaignOrderNeedsAttention(order)) return "Campaign needs attention";
  const fulfillment = order.fulfillment_state?.toLowerCase() ?? "";
  if (["submitted", "accepted", "in_production", "printing", "printed"].includes(fulfillment)) {
    return "Mailing submitted";
  }
  if (["mailed", "in_transit", "delivered", "completed"].includes(fulfillment)) {
    return "Mailing underway";
  }
  return "Campaign approved";
});

const approvalOutcomeCopy = computed(() => {
  const order = approvedOrder.value;
  if (!order) return "Your order status could not be confirmed yet.";
  if (order.recovery_action === "retry_purchase") {
    return "Your campaign is approved, but fulfillment did not start. Open the campaign to safely retry.";
  }
  if (order.recovery_action === "contact_support" || campaignOrderNeedsAttention(order)) {
    return "Your campaign is approved, but the order needs reconciliation. Contact support and do not retry this order.";
  }
  const fulfillment = order.fulfillment_state?.toLowerCase() ?? "";
  if (["submitted", "accepted", "in_production", "printing", "printed"].includes(fulfillment)) {
    return "The server confirmed your mailing was submitted for fulfillment.";
  }
  if (["mailed", "in_transit", "delivered", "completed"].includes(fulfillment)) {
    return "The server confirmed your mailing has progressed through fulfillment.";
  }
  return "Your campaign is approved. We’ll show fulfillment progress as it is confirmed.";
});

const approvalAmount = computed(() => {
  const amounts = approvedOrder.value?.amounts;
  if (!amounts) return null;
  const cents = amounts.charged_cents ?? amounts.authorized_cents ?? amounts.quoted_cents;
  return typeof cents === "number"
    ? formatOrderAmount(cents, amounts.currency)
    : null;
});

// Seeding
const sendSeedCopy = ref(draftStore.draft?.review?.sendSeedCopy ?? true);
const seedAddress = computed(
  () => brandKitStore.brandKit?.address ?? "Your address on file",
);

// POS-161 — effective return address: draft override, else org default.
// Approval fails closed client-side as well as server-side when neither exists.
const orgReturnAddress = ref<OrgReturnAddress | null>(null);
const orgReturnAddressLoaded = ref(false);
const editingReturnAddress = ref(false);
const returnAddressForm = ref({
  name: "",
  address: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
});
const returnAddressFormError = ref<string | null>(null);

const ZIP_RE = /^\d{5}(-\d{4})?$/;
const STATE_RE = /^[A-Za-z]{2}$/;

function orgToDesignAddress(
  addr: OrgReturnAddress | null,
): DesignReturnAddress | null {
  if (!addr?.address || !addr.city || !addr.state || !addr.zip) return null;
  return {
    ...(addr.name ? { name: addr.name } : {}),
    address: addr.address,
    ...(addr.address2 ? { address2: addr.address2 } : {}),
    city: addr.city,
    state: addr.state,
    zip: addr.zip,
  };
}

const draftReturnAddress = computed(
  () => draftStore.draft?.design?.returnAddress ?? null,
);

function validReturnAddress(
  addr: DesignReturnAddress | null,
): DesignReturnAddress | null {
  if (!addr) return null;
  if (
    !addr.address?.trim() ||
    !addr.city?.trim() ||
    !STATE_RE.test(addr.state?.trim() ?? "") ||
    !ZIP_RE.test(addr.zip?.trim() ?? "")
  ) {
    return null;
  }
  return {
    ...(addr.name?.trim() ? { name: addr.name.trim() } : {}),
    address: addr.address.trim(),
    ...(addr.address2?.trim() ? { address2: addr.address2.trim() } : {}),
    city: addr.city.trim(),
    state: addr.state.trim().toUpperCase(),
    zip: addr.zip.trim(),
  };
}

const effectiveReturnAddress = computed<DesignReturnAddress | null>(() => {
  return (
    validReturnAddress(draftReturnAddress.value) ??
    validReturnAddress(orgToDesignAddress(orgReturnAddress.value))
  );
});

const returnAddressIsOverride = computed(
  () => validReturnAddress(draftReturnAddress.value) !== null,
);

const returnAddressLines = computed(() => {
  const a = effectiveReturnAddress.value;
  if (!a) return null;
  const lines: string[] = [];
  if (a.name) lines.push(a.name);
  lines.push(a.address);
  if (a.address2) lines.push(a.address2);
  lines.push(`${a.city}, ${a.state} ${a.zip}`);
  return lines;
});

function fillReturnAddressForm(addr: DesignReturnAddress | null) {
  returnAddressForm.value = {
    name: addr?.name ?? "",
    address: addr?.address ?? "",
    address2: addr?.address2 ?? "",
    city: addr?.city ?? "",
    state: addr?.state ?? "",
    zip: addr?.zip ?? "",
  };
  returnAddressFormError.value = null;
}

function startEditReturnAddress() {
  fillReturnAddressForm(effectiveReturnAddress.value);
  editingReturnAddress.value = true;
}

function cancelEditReturnAddress() {
  editingReturnAddress.value = false;
  returnAddressFormError.value = null;
}

function validateReturnAddressForm(): string | null {
  const f = returnAddressForm.value;
  if (!f.address.trim()) return "Street address is required.";
  if (!f.city.trim()) return "City is required.";
  if (!STATE_RE.test(f.state.trim())) return "State must be a 2-letter code.";
  if (!ZIP_RE.test(f.zip.trim())) {
    return "ZIP must be 5 digits or ZIP+4 (12345 or 12345-6789).";
  }
  return null;
}

function saveReturnAddressOverride() {
  const err = validateReturnAddressForm();
  if (err) {
    returnAddressFormError.value = err;
    return;
  }
  const f = returnAddressForm.value;
  const next: DesignReturnAddress = {
    address: f.address.trim(),
    city: f.city.trim(),
    state: f.state.trim().toUpperCase(),
    zip: f.zip.trim(),
  };
  if (f.name.trim()) next.name = f.name.trim();
  if (f.address2.trim()) next.address2 = f.address2.trim();
  draftStore.setReturnAddress(next);
  editingReturnAddress.value = false;
  returnAddressFormError.value = null;
}

async function loadOrgReturnAddress() {
  try {
    orgReturnAddress.value = await getReturnAddress();
  } catch (e) {
    // Route may not exist yet (parallel server work) — treat as missing.
    console.warn("[StepReview] getReturnAddress failed", e);
    orgReturnAddress.value = null;
  } finally {
    orgReturnAddressLoaded.value = true;
  }
}

// Approve — gated on P0 #4 consolidated confirmation, AND on a non-empty
// audience: an empty custom-area draw used to sail through to an active
// Approve at "0 households / $0.00" (S82 QA fleet — 2 of 7 walks hit it
// independently). A campaign to nobody is never approvable; the free
// send-to-yourself copy alone doesn't make it one.
const campaignReadyForApproval = computed(
  () =>
    Boolean(draftStore.draft?.id) &&
    campaignName.value.trim() &&
    hasSingleMailingIntent.value &&
    !legacyDraftNeedsDesignReview.value &&
    !staleMultiMailingDraft.value &&
    !reconciliationBlocked.value &&
    householdCount.value > 0 &&
    recipientCapResolved.value &&
    !overRecipientCap.value &&
    effectiveReturnAddress.value !== null &&
    acknowledgedAccuracy.value &&
    !isCustomDesignRequest.value &&
    !scheduleAvailability.loading.value &&
    !scheduleAvailability.error.value &&
    selectedMailingDateValid.value,
);
const canApprove = computed(
  () =>
    canPurchase.value &&
    !approving.value &&
    campaignReadyForApproval.value &&
    paymentReady.value,
);
const canSaveForAdminApproval = computed(
  () =>
    !canPurchase.value &&
    !savingForAdminApproval.value &&
    campaignReadyForApproval.value,
);

const isCustomerSuppliedDesign = computed(
  () => designSource.value === "uploaded" || designSource.value === "requested",
);
const hasSingleMailingIntent = computed(() => {
  const draft = draftStore.draft;
  if (!draft || draft.goal?.sequenceLength !== 1 || schedules.value.length !== 1) {
    return false;
  }
  if (draft.targeting && draft.targeting.sequenceLength !== 1) return false;
  return isCustomerSuppliedDesign.value
    ? designCards.value.length === 0
    : designCards.value.length === 1;
});
const legacyDraftNeedsDesignReview = computed(
  () =>
    draftStore.singleMailingReviewRequired && draftStore.needsReview(3),
);
const staleMultiMailingDraft = computed(() => {
  const draft = draftStore.draft;
  if (!draft) return false;
  return (
    (draft.design?.sequenceCards.length ?? 0) > 1 ||
    (draft.review?.schedules.length ?? 0) > 1 ||
    (draft.goal?.sequenceLength ?? 1) > 1 ||
    (draft.targeting?.sequenceLength ?? 1) > 1
  );
});

function buildReviewSelection(): ReviewSelection {
  return {
    campaignName: campaignName.value.trim(),
    campaignNameIsCustom: campaignNameIsCustom.value,
    schedules: schedules.value,
    sendSeedCopy: sendSeedCopy.value,
    seedAddress: seedAddress.value,
    additionalSeeds: [],
    paymentMethodId: null,
    paymentMethodLabel: paymentMethod.value?.label ?? null,
    agreedToTerms: acknowledgedAccuracy.value,
  };
}

async function saveForAdminApproval() {
  if (!canSaveForAdminApproval.value || savingForAdminApproval.value) return;
  savingForAdminApproval.value = true;
  draftStore.error = null;
  try {
    draftStore.setReview(buildReviewSelection());
    await draftStore.saveNow(true);
    await router.push("/app/campaigns");
  } catch {
    if (!draftStore.error) {
      draftStore.error = "Unable to save. Please try again.";
    }
  } finally {
    savingForAdminApproval.value = false;
  }
}

async function approve() {
  if (!canPurchase.value || !canApprove.value || approving.value) return;
  approving.value = true;
  draftStore.error = null;

  const review = buildReviewSelection();

  try {
    // Create MailCampaign from draft once; the server deletes the draft on success,
    // so same-screen retries after artifact/purchase errors must reuse this id.
    let campaign = approvedCampaign.value;
    if (!campaign) {
      // Commit review data to the draft only before the first approval. After
      // the campaign exists, retry clicks must not dirty a draft the server
      // has already consumed and deleted.
      draftStore.setReview(review);
      await draftStore.saveNow();
      campaign = await approveCampaignDraft(draftStore.draft!.id);
    }
    approvedCampaign.value = campaign;

    try {
      await createApprovalArtifact(campaign.id, {
        acknowledgedAt: new Date().toISOString(),
        termsVersion: APPROVAL_TERMS_VERSION,
      });
    } catch (artifactErr: any) {
      draftStore.error =
        "Campaign approved, but we couldn't save the approval proof. " +
        "Tap Approve again to retry before the mailing list is purchased.";
      approving.value = false;
      return;
    }

    try {
      const purchase = await purchaseCampaignRecords(campaign.id);
      if (!purchase.order) {
        reconciliationBlocked.value = true;
        draftStore.error =
          "Campaign approved, but the server did not return a confirmed order state. " +
          "Contact support and do not approve or retry this campaign again.";
        approving.value = false;
        return;
      }
      approvedOrder.value = purchase.order;
    } catch (purchaseErr: any) {
      // Retry only known pre-provider failures. Reconciliation responses are
      // terminal in this screen even when their projection is malformed.
      const reconciliationOrder = normalizeOrderProjection(
        purchaseErr?.data?.order,
      );
      if (
        purchaseErr?.status === 409 &&
        purchaseErr?.data?.error === "reconciliation_required"
      ) {
        reconciliationBlocked.value = true;
        if (reconciliationOrder?.recovery_action === "contact_support") {
          approvedOrder.value = reconciliationOrder;
          approved.value = true;
        } else {
          draftStore.error =
            "This campaign requires reconciliation, but its order details could not be confirmed. Contact support and do not approve or retry it again.";
        }
        approving.value = false;
        return;
      }
      const overCapError = extractOverRecipientCapError(purchaseErr);
      if (overCapError) {
        draftStore.error = formatOverRecipientCapPurchaseError(overCapError);
        approving.value = false;
        return;
      }
      const knownPreProviderFailure =
        isKnownPreProviderPurchaseError(purchaseErr);
      if (
        knownPreProviderFailure &&
        purchaseErr?.status === 402 &&
        purchaseErr?.data?.error === "payment_method_required"
      ) {
        if (paymentMethod.value) {
          paymentMethod.value = {
            ...paymentMethod.value,
            required: true,
            has_payment_method: false,
            brand: null,
            last4: null,
            exp_month: null,
            exp_year: null,
            label: null,
          };
        }
        draftStore.error =
          "Your campaign is approved, but it hasn't been sent because a valid payment method is required. Add a card, then tap Approve again.";
      } else if (
        knownPreProviderFailure &&
        purchaseErr?.status === 402 &&
        purchaseErr?.data?.error === "authentication_required"
      ) {
        draftStore.error =
          "Your bank requires authentication. No recipient purchase started. Use secure card setup to verify or replace your card, then tap Approve again.";
      } else if (knownPreProviderFailure) {
        draftStore.error =
          "Campaign approved and proof saved. The server confirmed no provider purchase started. " +
          "Resolve the reported payment or budget issue, then tap Approve again.";
      } else {
        reconciliationBlocked.value = true;
        draftStore.error =
          "Campaign approved and proof saved, but the purchase outcome could not be safely confirmed. " +
          "Contact support and do not approve or retry this campaign again.";
      }
      approving.value = false;
      return;
    }

    approved.value = true;
  } catch (e: any) {
    const details = e?.data?.error?.details;
    if (e?.status === 400 && details?.code === "mail_schedule_invalid") {
      const invalidDetails = details as MailScheduleInvalidDetails;
      scheduleAvailability.applyInvalidDetails(invalidDetails);
      const refreshedSchedules = [
        scheduleForDate(invalidDetails.earliest_mailing_date),
      ];
      schedules.value = refreshedSchedules;
      // Keep the refreshed date with the otherwise unchanged draft so leaving
      // and returning to Review cannot resurrect the rejected selection.
      draftStore.setReview({ ...review, schedules: refreshedSchedules });
      scheduleActionMessage.value =
        `Mailing availability changed. We updated your mailing date to ` +
        `${invalidDetails.earliest_mailing_date}. Review it and approve again; ` +
        `the rest of your draft is unchanged.`;
      draftStore.error = null;
    } else if (
      e?.status === 400 &&
      details?.code === "proof_approval_required"
    ) {
      draftStore.error =
        "Final customer proof approval is required before a guaranteed mailing date can be calculated.";
    } else if (e?.status === 400 && details?.code === "single_mailing_required") {
      draftStore.error =
        "This draft needs a one-mailing review before it can be approved. " +
        "Review the design and schedule, then try again.";
    } else {
      draftStore.error = "Failed to approve campaign. Please try again.";
    }
  } finally {
    approving.value = false;
  }
}
</script>

<template>
  <!-- Confirmation screen -->
  <div
    v-if="approved"
    class="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
  >
        <h2 class="text-2xl font-bold text-[#0b2d50] mb-2">
      {{ approvalOutcomeTitle }}
    </h2>
    <p class="text-gray-500 mb-6 max-w-md">
      {{ approvalOutcomeCopy }}
    </p>
    <p v-if="approvalAmount" class="text-xs text-gray-500 mb-6" data-testid="approved-order-amount">
      Server-confirmed amount: {{ approvalAmount }}
    </p>
    <div class="flex gap-3">
      <button
        class="bg-[#47bfa9] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#3aa893] transition-colors"
        @click="router.push('/app/campaigns')"
      >
        View Campaign
      </button>
      <button
        class="border border-gray-200 text-[#0b2d50] font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        @click="router.push('/app/send')"
      >
        Send More Mail
      </button>
    </div>
  </div>

  <!-- Review screen -->
  <div v-else class="flex min-w-0 flex-col lg:h-full lg:min-h-0 lg:flex-row">
    <!-- Left: Postcard previews + print-proof panel -->
    <div class="min-w-0 flex-1 flex flex-col bg-gray-50 lg:overflow-y-auto">
      <div class="flex-1 flex items-center justify-center p-4 sm:p-8">
        <ReviewSummary
          :draft-id="draftStore.draft?.id"
          :cards="designCards"
          :design-source="designSource"
          :uploaded-front-url="uploadedFrontUrl"
          :uploaded-front-mime-type="uploadedFrontMimeType"
        />
      </div>

      <!-- Print proof bar — Phase 4D task 29. Same flow as StepDesign's
           Generate Proof but framed as final pre-approval verification.
           Hidden for uploaded/requested designs: the render pipeline only
           knows sequenceCards, so a proof here would show AI cards that
           contradict the preview above (cross-phase review finding). -->
      <div
        v-if="designSource !== 'uploaded' && designSource !== 'requested'"
        class="border-t border-gray-200 bg-white px-6 py-3 flex items-center justify-between"
      >
        <div class="text-sm text-gray-500">
          <template v-if="renderPhase === 'idle'">
            Want to see exactly what the printer will produce?
          </template>
          <template v-else-if="renderPhase === 'starting' || renderPhase === 'queued'">
            Queueing render…
          </template>
          <template v-else-if="renderPhase === 'rendering'">
            Rendering print-ready PDF…
            <span v-if="renderProgress" class="text-gray-400">
              ({{ renderProgress.completed }}/{{ renderProgress.total }})
            </span>
          </template>
          <template v-else-if="renderPhase === 'done'">
            Print proof ready below.
          </template>
          <template v-else-if="renderPhase === 'failed'">
            <span class="text-red-600">
              {{ renderError?.message }}
            </span>
          </template>
        </div>
        <button
          class="border border-[#47bfa9] text-[#47bfa9] font-semibold px-4 py-2 rounded-lg hover:bg-[#47bfa9] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          :disabled="
            renderPhase === 'starting' ||
            renderPhase === 'queued' ||
            renderPhase === 'rendering' ||
            !draftStore.draft
          "
          @click="handleGenerateProof"
        >
          <template v-if="renderPhase === 'starting' || renderPhase === 'queued' || renderPhase === 'rendering'">
            Generating…
          </template>
          <template v-else-if="renderPhase === 'done'">
            Regenerate Print Proof
          </template>
          <template v-else>
            View Print Proof
          </template>
        </button>
      </div>

      <div
        v-if="showProofPanel"
        class="border-t border-gray-200 bg-gray-50 px-6 py-4"
      >
        <div v-if="renderPhase === 'done' && renderedCards.length > 0" class="space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="card in renderedCards"
              :key="card.cardNumber"
              class="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              <div class="text-xs text-gray-400 px-3 pt-2">
                Card {{ card.cardNumber }} — print PDF
              </div>
              <iframe
                :src="mediaSrc(card.downloadUrl)"
                class="w-full"
                style="height: 380px; border: 0;"
                :title="`Print proof for card ${card.cardNumber}`"
              />
            </div>
          </div>
        </div>
        <div v-else-if="renderPhase === 'failed'" class="text-sm text-red-600">
          {{ renderError?.message }}
          <button
            class="ml-2 text-[#47bfa9] underline"
            @click="handleGenerateProof"
          >
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- Right: Details panel -->
    <div class="w-full shrink-0 border-t border-gray-200 p-4 sm:p-6 lg:w-96 lg:border-l lg:border-t-0 lg:overflow-y-auto">
      <!-- Campaign name -->
      <div class="mb-5">
        <label
          class="text-xs text-gray-400 uppercase tracking-wider"
          for="review-campaign-name"
        >
          Campaign Name
        </label>
        <div class="relative mt-1">
          <input
            id="review-campaign-name"
            v-model="campaignName"
            data-testid="review-campaign-name"
            class="w-full text-lg font-semibold border-b border-gray-200 pb-1 pr-8 focus:border-[#47bfa9] outline-none"
            :class="
              campaignNameIsCustom ? 'text-[#0b2d50]' : 'text-gray-400'
            "
            aria-describedby="review-campaign-name-hint"
            @input="onCampaignNameInput"
          />
          <CreateOutline
            class="pointer-events-none absolute right-0 top-1.5 h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </div>
        <p id="review-campaign-name-hint" class="mt-1 text-xs text-gray-400">
          This is a default name. You can change it.
        </p>
      </div>

      <!-- Targeting summary -->
      <div class="mb-5 p-3 bg-white rounded-lg border border-gray-200">
        <div class="text-sm text-gray-500">Sending to</div>
        <div class="text-lg font-semibold text-[#0b2d50]">
          {{ householdCount.toLocaleString() }} {{ audienceNoun }}
        </div>
        <div class="text-xs text-gray-400">
          {{ targetingMethodLabel }}
        </div>
        <!-- Empty-audience rescue: explains WHY Approve is disabled and
             points back at Step 2 (an empty custom draw is easy to do
             without noticing). -->
        <div
          v-if="householdCount === 0"
          data-testid="zero-households-warning"
          class="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800"
        >
          <template v-if="goal?.goalType === 'send_to_list'">
            Your list has no deliverable addresses, so this campaign can't be
            approved yet.
            <button
              class="font-semibold underline"
              @click="draftStore.goToStep(2)"
            >
              Go back to your list
            </button>
            and upload at least one deliverable address.
          </template>
          <template v-else>
            Your target area has no {{ audienceNoun }}, so this campaign can't be
            approved yet.
            <button
              class="font-semibold underline"
              @click="draftStore.goToStep(2)"
            >
              Go back to Pick Your Neighborhood
            </button>
            and choose an area with at least one {{ audienceNoun === 'businesses' ? 'business' : 'household' }}.
          </template>
        </div>
        <div
          v-else-if="recipientCapWarning"
          data-testid="over-recipient-cap-warning"
          class="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800"
        >
          {{ recipientCapWarning }}.
          <button
            class="font-semibold underline"
            @click="draftStore.goToStep(2)"
          >
            Go back to Pick Your Neighborhood
          </button>
        </div>
      </div>

      <!-- Schedule -->
      <div
        v-if="isCustomDesignRequest"
        class="rounded-lg border border-amber-200 bg-amber-50 p-3"
        data-testid="professional-design-schedule-block"
      >
        <h4 class="text-sm font-semibold text-[#0b2d50]">
          Final proof approval required
        </h4>
        <p class="mt-1 text-xs leading-relaxed text-amber-800">
          Your professional design request is not ready to schedule yet. Your
          guaranteed mailing date will be calculated after you approve the
          final customer proof.
        </p>
      </div>
      <ScheduleEditor
        v-else
        :schedules="schedules"
        :availability="scheduleAvailability.availability.value"
        :loading="scheduleAvailability.loading.value"
        :error="scheduleAvailability.error.value"
        :validity-message="scheduleValidityMessage"
        :action-message="scheduleActionMessage"
        @update="updateSchedule"
        @retry="loadScheduleAvailability"
      />

      <div
        v-if="
          !isCustomDesignRequest &&
          (legacyDraftNeedsDesignReview || staleMultiMailingDraft || !hasSingleMailingIntent)
        "
        data-testid="single-mailing-warning"
        class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800"
      >
        <template v-if="staleMultiMailingDraft">
          This stale draft still contains multiple mailing instructions and
          cannot be approved. Return to the design step and review it as one
          mailing.
        </template>
        <template v-else>
          This draft was previously configured for multiple mailings. It has
          been updated to one mailing; review the design and schedule before
          approving it.
        </template>
        <button
          v-if="legacyDraftNeedsDesignReview || staleMultiMailingDraft"
          class="ml-1 font-semibold underline"
          @click="draftStore.goToStep(3)"
        >
          Review design
        </button>
      </div>

      <!-- Cost -->
      <CostBreakdown
        :household-count="householdCount"
        :sequence-length="seqLen"
        :billing-summary="paymentMethod"
        :include-custom-design-fee="isCustomDesignRequest"
        class="mt-5"
      />

      <!-- Campaign seeding -->
      <div class="mt-5 flex items-center gap-2">
        <input
          id="seed"
          v-model="sendSeedCopy"
          type="checkbox"
          class="accent-[#47bfa9]"
        />
        <label for="seed" class="text-sm text-gray-500">
          Send a copy to yourself (free)
        </label>
      </div>
      <p v-if="sendSeedCopy" class="text-xs text-gray-400 ml-6">
        Mailing to: {{ seedAddress }}
      </p>

      <!-- POS-161: business return address (org default or campaign override) -->
      <div
        class="mt-5 p-3 bg-white rounded-lg border border-gray-200"
        data-testid="return-address-summary"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="text-xs text-gray-400 uppercase tracking-wider">
            Return address
          </div>
          <button
            v-if="!editingReturnAddress"
            type="button"
            class="text-xs text-[#47bfa9] hover:text-[#3aa893]"
            data-testid="return-address-edit"
            @click="startEditReturnAddress"
          >
            Edit
          </button>
        </div>

        <div
          v-if="!orgReturnAddressLoaded && !effectiveReturnAddress"
          class="mt-1 text-sm text-gray-400"
        >
          Loading…
        </div>

        <div
          v-else-if="!editingReturnAddress && returnAddressLines"
          class="mt-1"
          data-testid="return-address-display"
        >
          <p
            v-for="(line, i) in returnAddressLines"
            :key="i"
            class="text-sm text-[#0b2d50] leading-snug"
          >
            {{ line }}
          </p>
          <p
            v-if="returnAddressIsOverride"
            class="mt-1 text-xs text-gray-400"
            data-testid="return-address-override-badge"
          >
            Campaign override
          </p>
          <p
            v-else
            class="mt-1 text-xs text-gray-400"
            data-testid="return-address-org-default-badge"
          >
            Account default
          </p>
        </div>

        <div
          v-else-if="!editingReturnAddress && orgReturnAddressLoaded"
          class="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800"
          data-testid="return-address-missing-warning"
        >
          <router-link
            to="/app/settings"
            class="font-semibold underline"
            data-testid="return-address-settings-link"
          >
            Add your business mailing address — approval is blocked until it is complete
          </router-link>
        </div>

        <div
          v-if="editingReturnAddress"
          class="mt-3 space-y-2"
          data-testid="return-address-edit-form"
        >
          <div>
            <label
              for="review-return-name"
              class="block text-xs text-gray-500"
            >
              Name (optional)
            </label>
            <input
              id="review-return-name"
              v-model="returnAddressForm.name"
              type="text"
              data-testid="review-return-name"
              class="mt-0.5 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-[#0b2d50] focus:border-[#47bfa9] outline-none"
            />
          </div>
          <div>
            <label
              for="review-return-address"
              class="block text-xs text-gray-500"
            >
              Street address
            </label>
            <input
              id="review-return-address"
              v-model="returnAddressForm.address"
              type="text"
              data-testid="review-return-address"
              class="mt-0.5 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-[#0b2d50] focus:border-[#47bfa9] outline-none"
            />
          </div>
          <div>
            <label
              for="review-return-address2"
              class="block text-xs text-gray-500"
            >
              Apt/Suite (optional)
            </label>
            <input
              id="review-return-address2"
              v-model="returnAddressForm.address2"
              type="text"
              data-testid="review-return-address2"
              class="mt-0.5 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-[#0b2d50] focus:border-[#47bfa9] outline-none"
            />
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div class="col-span-1">
              <label
                for="review-return-city"
                class="block text-xs text-gray-500"
              >
                City
              </label>
              <input
                id="review-return-city"
                v-model="returnAddressForm.city"
                type="text"
                data-testid="review-return-city"
                class="mt-0.5 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-[#0b2d50] focus:border-[#47bfa9] outline-none"
              />
            </div>
            <div>
              <label
                for="review-return-state"
                class="block text-xs text-gray-500"
              >
                State
              </label>
              <input
                id="review-return-state"
                v-model="returnAddressForm.state"
                type="text"
                maxlength="2"
                data-testid="review-return-state"
                class="mt-0.5 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm uppercase text-[#0b2d50] focus:border-[#47bfa9] outline-none"
              />
            </div>
            <div>
              <label
                for="review-return-zip"
                class="block text-xs text-gray-500"
              >
                ZIP
              </label>
              <input
                id="review-return-zip"
                v-model="returnAddressForm.zip"
                type="text"
                data-testid="review-return-zip"
                class="mt-0.5 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-[#0b2d50] focus:border-[#47bfa9] outline-none"
              />
            </div>
          </div>
          <p
            v-if="returnAddressFormError"
            class="text-xs text-red-600"
            data-testid="return-address-form-error"
          >
            {{ returnAddressFormError }}
          </p>
          <div class="flex justify-end gap-2 pt-1">
            <button
              type="button"
              class="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
              data-testid="return-address-cancel"
              @click="cancelEditReturnAddress"
            >
              Cancel
            </button>
            <button
              type="button"
              class="text-xs font-semibold text-white bg-[#47bfa9] hover:bg-[#3aa893] rounded-md px-3 py-1.5"
              data-testid="return-address-save"
              @click="saveReturnAddressOverride"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <!-- Real Stripe payment readiness. Approval fails closed until checked. -->
      <div
        class="mt-5 p-3 bg-white rounded-lg border border-gray-200"
        data-testid="payment-method-summary"
      >
        <div class="text-xs text-gray-400">Payment method</div>
        <div
          v-if="paymentMethodLoading"
          class="text-sm text-gray-500"
        >
          Checking payment method…
        </div>
        <div
          v-else-if="paymentMethod?.has_payment_method"
          class="text-sm text-[#0b2d50]"
          data-testid="payment-method-label"
        >
          {{ paymentMethod.label || "Card on file" }}
        </div>
        <div
          v-else-if="paymentMethod && !paymentMethod.required"
          class="text-sm text-[#0b2d50]"
          data-testid="payment-method-covered"
        >
          Covered by an explicit internal credit
        </div>
        <div
          v-else
          class="text-sm text-amber-700"
          data-testid="payment-method-missing"
        >
          No payment method on file
        </div>
        <button
          type="button"
          class="text-xs text-[#47bfa9] mt-1 disabled:opacity-50"
          data-testid="payment-method-change"
          :disabled="paymentMethodBusy"
          @click="managePaymentMethod"
        >
          {{
            paymentMethod?.has_payment_method
              ? "Change"
              : paymentMethodBusy
                ? "Opening secure setup…"
                : "Add payment method"
          }}
        </button>
        <button
          v-if="paymentMethodError"
          type="button"
          class="ml-3 text-xs font-medium text-red-600 underline"
          data-testid="payment-method-retry"
          @click="loadPaymentMethod"
        >
          Retry
        </button>
        <p
          v-if="paymentMethodError"
          class="mt-1 text-xs text-red-600"
          role="alert"
        >
          {{ paymentMethodError }}
        </p>
        <p
          v-if="paymentStatusMessage"
          class="mt-1 text-xs text-emerald-700"
        >
          {{ paymentStatusMessage }}
        </p>
      </div>

      <!-- P0 #4: consolidated accuracy + rights acknowledgement.
           Blocks Approve until checked. Single combined statement per Krug —
           multiple checkboxes fragment attention; one high-weight checkbox
           is more likely to be read. -->
      <div
        class="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg"
      >
        <label class="flex items-start gap-2 cursor-pointer">
          <input
            id="accuracy-ack"
            v-model="acknowledgedAccuracy"
            type="checkbox"
            class="accent-[#47bfa9] mt-0.5 flex-shrink-0"
          />
          <span class="text-xs text-[#0b2d50] leading-snug">
            I confirm all information on this postcard is accurate and
            I have the rights to use the photos, logos, and reviews
            shown. PostCanary is not responsible for the accuracy of
            customer-supplied content.
          </span>
        </label>
      </div>

      <p
        v-if="draftStore.error"
        class="mt-3 text-sm text-red-600"
        role="alert"
      >
        {{ draftStore.error }}
      </p>

      <p
        v-if="!canPurchase"
        class="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        data-testid="review-purchase-permission-copy"
      >
        Purchasing permission is for admin only. They can give you that permission
        or they'll have to log in to complete the campaign order.
      </p>

      <button
        v-if="!canPurchase"
        data-testid="review-save-for-admin"
        class="mt-3 w-full py-3 bg-[#47bfa9] text-white font-semibold rounded-xl hover:bg-[#3aa893] disabled:opacity-50 disabled:cursor-not-allowed text-lg transition-colors"
        :disabled="!canSaveForAdminApproval"
        @click="saveForAdminApproval"
      >
        {{
          savingForAdminApproval
            ? "Saving..."
            : "Save for admin approval"
        }}
      </button>

      <button
        v-else
        data-testid="review-approve"
        class="mt-3 w-full py-3 bg-[#47bfa9] text-white font-semibold rounded-xl hover:bg-[#3aa893] disabled:opacity-50 disabled:cursor-not-allowed text-lg transition-colors"
        :disabled="!canApprove"
        @click="approve"
      >
        <template v-if="approving">
          <span
            class="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin align-middle mr-2"
          />
          Approving...
        </template>
        <template v-else-if="isCustomDesignRequest">
          Awaiting Final Proof Approval
        </template>
        <template v-else> Approve & Send Mailing </template>
      </button>
      <p v-if="canPurchase" class="text-xs text-gray-400 text-center mt-2">
        You can cancel within 1 hour.
      </p>
    </div>
  </div>
</template>

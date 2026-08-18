// src/api/mailCampaigns.ts
// SEPARATE from campaigns.ts — that's for analytics campaigns
import { get, postJson, api } from "@/api/http";
import type {
  MailCampaign,
  MailCampaignOrder,
  MailCampaignOrderAmounts,
  MailCampaignOrderArtwork,
  MailCampaignOrderCounts,
  MailCampaignRecoveryAction,
  MailScheduleAvailability,
} from "@/types/campaign";

interface MailCampaignResponse {
  ok: boolean;
  id: string;
  org_id: string;
  created_by: string | null;
  name: string;
  status: string;
  goal_type: string;
  service_type: string | null;
  sequence_length: number | null;
  household_count: number | null;
  total_cost: number | null;
  total_spent: number | null;
  targeting_data: Record<string, any> | null;
  design_data: Record<string, any> | null;
  schedule_data: any;
  cards_data: any;
  approved_at: string | null;
  draft_id: string | null;
  created_at: string;
  updated_at: string;
  // POS-154 / server PR #132: present once the server's mail-campaigns
  // serializer ships; absent on older server builds pre-deploy, so treat
  // it as optional rather than required.
  audience_id?: string | null;
  order?: unknown;
}

interface ListResponse {
  ok: boolean;
  campaigns: MailCampaignResponse[];
}

const ORDER_COUNT_KEYS = [
  "approved",
  "requested",
  "purchased",
  "printable",
  "billed",
  "submitted",
  "accepted",
  "mailed",
  "delivered",
  "returned",
  "failed",
  "refunded",
] as const satisfies readonly (keyof MailCampaignOrderCounts)[];

const ORDER_AMOUNT_KEYS = [
  "unit_rate_cents",
  "quoted_cents",
  "authorized_cents",
  "charged_cents",
  "refunded_cents",
  "net_cents",
] as const satisfies readonly Exclude<keyof MailCampaignOrderAmounts, "currency">[];

const ORDER_PAYMENT_STATES = new Set([
  "authorization_pending",
  "pending",
  "covered",
  "authorized",
  "authorization_ambiguous",
  "authorization_cancelled",
  "authorization_release_pending",
  "captured",
  "subscription_applied",
  "refunded",
  "failed",
  "voided",
  "reconciliation_required",
]);

const ORDER_FULFILLMENT_STATES = new Set([
  "not_started",
  "vendor_started",
  "pre_vendor_failed",
  "reconciliation_required",
  "draft",
  "submitted",
  "accepted",
  "partially_accepted",
  "in_production",
  "printed",
  "mailed",
  "delivered",
  "returned",
  "failed",
]);

const ORDER_RECONCILIATION_STATES = new Set(["not_required", "required"]);
const SHA256_RE = /^[a-f0-9]{64}$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function nullableNonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

function normalizeCounts(value: unknown): MailCampaignOrderCounts {
  const raw = isObject(value) ? value : {};
  return Object.fromEntries(
    ORDER_COUNT_KEYS.map((key) => [key, nullableNonNegativeInteger(raw[key])]),
  ) as unknown as MailCampaignOrderCounts;
}

function normalizeAmounts(value: unknown): MailCampaignOrderAmounts {
  const raw = isObject(value) ? value : {};
  const amounts = Object.fromEntries(
    ORDER_AMOUNT_KEYS.map((key) => [key, nullableNonNegativeInteger(raw[key])]),
  ) as unknown as Omit<MailCampaignOrderAmounts, "currency">;
  return {
    currency: nullableString(raw.currency),
    ...amounts,
  };
}

function normalizeArtwork(value: unknown): MailCampaignOrderArtwork | null {
  if (!isObject(value)) return null;
  return {
    front_sha256: nullableString(value.front_sha256),
    back_sha256: nullableString(value.back_sha256),
  };
}

function normalizeRecoveryAction(value: unknown): MailCampaignRecoveryAction | null {
  return value === "none" ||
    value === "retry_purchase" ||
    value === "contact_support"
    ? value
    : null;
}

function requiredState(value: unknown, allowed: ReadonlySet<string>): string | null {
  return typeof value === "string" && allowed.has(value) ? value : null;
}

function hasStableOrderShape(value: Record<string, unknown>): boolean {
  const counts = value.counts;
  const amounts = value.amounts;
  const artwork = value.artwork;
  if (!isObject(counts) || !isObject(amounts) || !isObject(artwork)) {
    return false;
  }
  const countsAreValid = ORDER_COUNT_KEYS.every(
    (key) =>
      key in counts &&
      (counts[key] === null ||
        (typeof counts[key] === "number" &&
          Number.isSafeInteger(counts[key]) &&
          (counts[key] as number) >= 0)),
  );
  const amountsAreValid = ORDER_AMOUNT_KEYS.every(
    (key) =>
      key in amounts &&
      typeof amounts[key] === "number" &&
      Number.isSafeInteger(amounts[key]) &&
      (amounts[key] as number) >= 0,
  );
  return (
    countsAreValid &&
    amountsAreValid &&
    amounts.currency === "usd" &&
    typeof artwork.front_sha256 === "string" &&
    typeof artwork.back_sha256 === "string" &&
    (value.reconciliation_reason === null ||
      (typeof value.reconciliation_reason === "string" &&
        value.reconciliation_reason.trim().length > 0))
  );
}

function isValidOrderFacts(
  counts: MailCampaignOrderCounts,
  amounts: MailCampaignOrderAmounts,
  artwork: MailCampaignOrderArtwork | null,
): boolean {
  if (
    counts.approved === null ||
    counts.approved < 1 ||
    counts.requested === null ||
    counts.requested < 1 ||
    counts.requested > counts.approved ||
    amounts.currency === null ||
    amounts.currency !== "usd" ||
    amounts.unit_rate_cents === null ||
    amounts.quoted_cents === null ||
    amounts.authorized_cents === null ||
    amounts.charged_cents === null ||
    amounts.refunded_cents === null ||
    amounts.net_cents === null ||
    amounts.quoted_cents !== counts.approved * amounts.unit_rate_cents ||
    amounts.authorized_cents > amounts.quoted_cents ||
    amounts.charged_cents > amounts.quoted_cents ||
    amounts.refunded_cents > amounts.charged_cents ||
    amounts.net_cents !== amounts.charged_cents - amounts.refunded_cents ||
    !artwork?.front_sha256 ||
    !SHA256_RE.test(artwork.front_sha256) ||
    !artwork.back_sha256 ||
    !SHA256_RE.test(artwork.back_sha256)
  ) {
    return false;
  }

  return true;
}

export function normalizeOrderProjection(value: unknown): MailCampaignOrder | null {
  if (
    !isObject(value) ||
    value.contract_version !== 1 ||
    value.mailing_count !== 1 ||
    !hasStableOrderShape(value)
  ) {
    return null;
  }
  const counts = normalizeCounts(value.counts);
  const amounts = normalizeAmounts(value.amounts);
  const artwork = normalizeArtwork(value.artwork);
  const paymentState = requiredState(value.payment_state, ORDER_PAYMENT_STATES);
  const fulfillmentState = requiredState(
    value.fulfillment_state,
    ORDER_FULFILLMENT_STATES,
  );
  const reconciliationState = requiredState(
    value.reconciliation_state,
    ORDER_RECONCILIATION_STATES,
  );
  const recoveryAction = normalizeRecoveryAction(value.recovery_action);
  const reconciliationReason = nullableString(value.reconciliation_reason);
  if (
    !paymentState ||
    !fulfillmentState ||
    !reconciliationState ||
    !recoveryAction ||
    !isValidOrderFacts(counts, amounts, artwork) ||
    (reconciliationState === "required" && !reconciliationReason) ||
    (reconciliationState === "required" && recoveryAction !== "contact_support") ||
    (recoveryAction === "retry_purchase" && fulfillmentState !== "pre_vendor_failed") ||
    (fulfillmentState === "pre_vendor_failed" &&
      reconciliationState === "not_required" &&
      recoveryAction !== "retry_purchase") ||
    (["pending", "failed", "voided"].includes(paymentState) &&
      recoveryAction !== "contact_support")
  ) {
    return null;
  }
  return {
    contract_version: 1,
    mailing_count: 1,
    counts,
    amounts,
    artwork,
    payment_state: paymentState,
    fulfillment_state: fulfillmentState,
    reconciliation_state: reconciliationState,
    reconciliation_reason: reconciliationReason,
    recovery_action: recoveryAction,
  };
}

export function toMailCampaign(r: MailCampaignResponse): MailCampaign {
  // Flow v2 uploaded/request designs store sequenceCards as [] (or omit
  // cards entirely). Never leave `cards` non-array — detail page and
  // list helpers call .every / .filter / .length without further guards.
  const rawCards = r.cards_data;
  const cards = Array.isArray(rawCards) ? rawCards : [];
  const design = r.design_data && typeof r.design_data === "object"
    ? r.design_data
    : null;

  return {
    id: r.id,
    orgId: r.org_id,
    name: r.name,
    status: r.status as MailCampaign["status"],
    goalType: r.goal_type as MailCampaign["goalType"],
    serviceType: r.service_type,
    // send_to_list Flow v2: server may serialize null for counts/cost when
    // the draft had no targeting slice (households live on the audience).
    sequenceLength:
      typeof r.sequence_length === "number" ? r.sequence_length : null,
    householdCount:
      typeof r.household_count === "number" ? r.household_count : null,
    totalCost: typeof r.total_cost === "number" ? r.total_cost : null,
    totalSpent: typeof r.total_spent === "number" ? r.total_spent : 0,
    cards,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    targetingData: r.targeting_data ?? null,
    audienceId: r.audience_id ?? null,
    // POS-162: surface design snapshot so detail can render uploaded
    // front artwork when cards_data is empty.
    designSource: design?.designSource as MailCampaign["designSource"],
    uploadedAsset: (design?.uploadedAsset as MailCampaign["uploadedAsset"]) ?? null,
    order: normalizeOrderProjection(r.order),
    orderContractPresent: r.order !== null && r.order !== undefined,
  };
}

export async function listMailCampaigns(): Promise<MailCampaign[]> {
  const res = await get<ListResponse>("/api/mail-campaigns");
  return (res.campaigns || []).map(toMailCampaign);
}

export async function getMailCampaign(id: string): Promise<MailCampaign> {
  const res = await get<MailCampaignResponse>(`/api/mail-campaigns/${id}`);
  return toMailCampaign(res);
}

export async function approveMailCampaign(
  draftId: string,
): Promise<MailCampaign> {
  const res = await postJson<MailCampaignResponse>("/api/mail-campaigns", {
    draft_id: draftId,
  });
  return toMailCampaign(res);
}

export async function getMailScheduleAvailability(): Promise<MailScheduleAvailability> {
  return get<MailScheduleAvailability>(
    "/api/mail-campaigns/schedule-availability",
  );
}

export interface ApprovalArtifactResponse {
  ok: boolean;
  id: string;
  org_id: string;
  mail_campaign_id: string;
  created_by: string | null;
  source_draft_id: string | null;
  artifact_type: "approval_proof";
  storage_backend: string;
  storage_key: string;
  manifest: Record<string, any>;
  manifest_sha256: string;
  terms_version: string | null;
  acknowledged_at: string | null;
  created_at: string | null;
}

export async function createApprovalArtifact(
  campaignId: string,
  payload: { acknowledgedAt: string; termsVersion?: string },
): Promise<ApprovalArtifactResponse> {
  return postJson<ApprovalArtifactResponse>(
    `/api/mail-campaigns/${campaignId}/approval-artifact`,
    {
      acknowledged_at: payload.acknowledgedAt,
      terms_version: payload.termsVersion,
    },
  );
}

export interface PurchaseRecordsResponse {
  order: MailCampaignOrder | null;
  // Legacy response fields remain optional for rollout compatibility. They
  // are never used as authority for quantity, price, or fulfillment state.
  order_id?: string | null;
  record_count?: number | null;
  sample?: Array<{
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    state: string;
    zip5: string;
    zip4: string | null;
  }>;
  source?: string | null;
  print_submit_status?: string | null;
}

/**
 * The server emits these exact status/error pairs only after confirming that
 * no Melissa or print-provider operation started. Everything else—including
 * an unstructured 5xx or a network timeout—must be treated as ambiguous.
 */
export function isKnownPreProviderPurchaseError(value: unknown): boolean {
  if (
    !isObject(value) ||
    typeof value.status !== "number" ||
    !isObject(value.data)
  ) {
    return false;
  }
  const data = value.data;
  if (
    "order" in data ||
    typeof data.error !== "string" ||
    typeof data.message !== "string" ||
    !data.message.trim()
  ) {
    return false;
  }
  const nonNegativeInteger = (field: unknown) =>
    typeof field === "number" && Number.isSafeInteger(field) && field >= 0;
  if (value.status === 402 && data.error === "payment_method_required") {
    return (
      nonNegativeInteger(data.estimated_cost_cents) &&
      nonNegativeInteger(data.per_postcard_rate_cents)
    );
  }
  if (value.status === 402 && data.error === "budget_exceeded") {
    return (
      nonNegativeInteger(data.cap_cents) &&
      nonNegativeInteger(data.remaining_cents) &&
      nonNegativeInteger(data.estimated_cost_cents)
    );
  }
  if (
    value.status === 402 &&
    (data.error === "card_declined" ||
      data.error === "authentication_required")
  ) {
    return typeof data.reason === "string" && data.reason.trim().length > 0;
  }
  return value.status === 503 && data.error === "budget_unavailable";
}

// Buy-on-Approve wiring (S132 2026-05-05): triggers synchronous data-partner
// list purchase for an approved campaign. Idempotent — repeat calls after
// a successful purchase return the existing records without burning credits.
export async function purchaseCampaignRecords(
  campaignId: string,
): Promise<PurchaseRecordsResponse> {
  const response = await api<unknown>(
    `/api/mail-campaigns/${campaignId}/purchase-records`,
    { method: "POST" },
  );
  const raw = isObject(response) ? response : {};
  return {
    order: normalizeOrderProjection(raw.order),
    order_id: nullableString(raw.order_id),
    record_count: nullableNonNegativeInteger(raw.record_count),
    sample: Array.isArray(raw.sample)
      ? (raw.sample as PurchaseRecordsResponse["sample"])
      : [],
    source: nullableString(raw.source),
    print_submit_status: nullableString(raw.print_submit_status),
  };
}

// POS-154: streams the real per-recipient CSV for a send_to_list campaign
// (server PR #132, GET /api/mail-campaigns/<id>/audience-csv). 404s when
// the campaign has no linked audience (area campaigns, or list campaigns
// approved before the audience_id migration) — callers must catch that
// and fall back to the client-generated summary CSV.
export async function getAudienceCsv(campaignId: string): Promise<Blob> {
  return get<Blob>(`/api/mail-campaigns/${campaignId}/audience-csv`, {
    responseType: "blob",
  });
}

export async function pauseMailCampaign(id: string): Promise<MailCampaign> {
  const res = await api<MailCampaignResponse>(
    `/api/mail-campaigns/${id}/pause`,
    { method: "PATCH" },
  );
  return toMailCampaign(res);
}

export async function resumeMailCampaign(id: string): Promise<MailCampaign> {
  const res = await api<MailCampaignResponse>(
    `/api/mail-campaigns/${id}/resume`,
    { method: "PATCH" },
  );
  return toMailCampaign(res);
}

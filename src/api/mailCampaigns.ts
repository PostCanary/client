// src/api/mailCampaigns.ts
// SEPARATE from campaigns.ts — that's for analytics campaigns
import { get, postJson, api } from "@/api/http";
import type { MailCampaign } from "@/types/campaign";

interface MailCampaignResponse {
  ok: boolean;
  id: string;
  org_id: string;
  created_by: string | null;
  name: string;
  status: string;
  goal_type: string;
  service_type: string | null;
  sequence_length: number;
  household_count: number;
  total_cost: number;
  total_spent: number;
  targeting_data: Record<string, any> | null;
  design_data: Record<string, any> | null;
  schedule_data: any;
  cards_data: any;
  approved_at: string | null;
  draft_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ListResponse {
  ok: boolean;
  campaigns: MailCampaignResponse[];
}

function toMailCampaign(r: MailCampaignResponse): MailCampaign {
  return {
    id: r.id,
    orgId: r.org_id,
    name: r.name,
    status: r.status as MailCampaign["status"],
    goalType: r.goal_type as MailCampaign["goalType"],
    serviceType: r.service_type,
    sequenceLength: r.sequence_length,
    householdCount: r.household_count,
    totalCost: r.total_cost,
    totalSpent: r.total_spent,
    cards: r.cards_data ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    targetingData: r.targeting_data ?? null,
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
  order_id: string | null;
  record_count: number;
  sample: Array<{
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    state: string;
    zip5: string;
    zip4: string | null;
  }>;
  source: string;
}

// Buy-on-Approve wiring (S132 2026-05-05): triggers synchronous data-partner
// list purchase for an approved campaign. Idempotent — repeat calls after
// a successful purchase return the existing records without burning credits.
export async function purchaseCampaignRecords(
  campaignId: string,
  qty: number = 10,
): Promise<PurchaseRecordsResponse> {
  return postJson<PurchaseRecordsResponse>(
    `/api/mail-campaigns/${campaignId}/purchase-records`,
    { qty },
  );
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

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

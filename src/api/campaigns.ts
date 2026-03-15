// src/api/campaigns.ts
import { get, postJson, del_ } from "@/api/http";
import { http } from "@/api/http";

export type Campaign = {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CampaignsResponse = {
  campaigns: Campaign[];
};

export async function getCampaigns(): Promise<Campaign[]> {
  const res = await get<CampaignsResponse>("/api/campaigns/");
  return res.campaigns;
}

export async function createCampaign(
  name: string,
  description?: string,
): Promise<Campaign> {
  return postJson<Campaign>("/api/campaigns/", { name, description });
}

export async function updateCampaign(
  id: string,
  data: { name?: string; description?: string },
): Promise<Campaign> {
  const res = await http.patch<Campaign>(`/api/campaigns/${id}`, data, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
}

export async function deleteCampaign(id: string): Promise<void> {
  await del_(`/api/campaigns/${id}`);
}

export async function assignBatches(
  campaignId: string,
  batchIds: string[],
): Promise<{ updated: number }> {
  return postJson<{ updated: number }>(
    `/api/campaigns/${campaignId}/batches`,
    { batch_ids: batchIds },
  );
}

export async function removeBatch(
  campaignId: string,
  batchId: string,
): Promise<void> {
  await del_(`/api/campaigns/${campaignId}/batches/${batchId}`);
}

// src/api/campaignDrafts.ts
import { get, postJson, putJson, del_ } from "@/api/http";
import type { CampaignDraft } from "@/types/campaign";

interface DraftResponse {
  ok: boolean;
  id: string;
  org_id: string;
  created_by: string | null;
  current_step: number;
  completed_steps: number[];
  needs_review_steps: number[];
  data: Record<string, any>;
  schema_version: number;
  created_at: string;
  updated_at: string;
}

interface DraftListResponse {
  ok: boolean;
  drafts: DraftResponse[];
}

function toDraft(r: DraftResponse): CampaignDraft {
  const data = r.data || {};
  return {
    id: r.id,
    orgId: r.org_id,
    currentStep: (r.current_step || 1) as 1 | 2 | 3 | 4,
    completedSteps: (r.completed_steps || []) as (1 | 2 | 3 | 4)[],
    needsReviewSteps: (r.needs_review_steps || []) as (1 | 2 | 3 | 4)[],
    goal: data.goal ?? null,
    targeting: data.targeting ?? null,
    design: data.design ?? null,
    review: data.review ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    schemaVersion: r.schema_version,
  };
}

export async function createDraft(): Promise<CampaignDraft> {
  const res = await postJson<DraftResponse>("/api/campaign-drafts");
  return toDraft(res);
}

export async function loadDraft(draftId: string): Promise<CampaignDraft> {
  const res = await get<DraftResponse>(`/api/campaign-drafts/${draftId}`);
  return toDraft(res);
}

export async function saveDraft(draft: CampaignDraft): Promise<CampaignDraft> {
  const res = await putJson<DraftResponse>(
    `/api/campaign-drafts/${draft.id}`,
    {
      current_step: draft.currentStep,
      completed_steps: draft.completedSteps,
      needs_review_steps: draft.needsReviewSteps,
      data: {
        goal: draft.goal,
        targeting: draft.targeting,
        design: draft.design,
        review: draft.review,
      },
    },
  );
  return toDraft(res);
}

export async function deleteDraft(draftId: string): Promise<void> {
  await del_(`/api/campaign-drafts/${draftId}`);
}

export async function listDrafts(): Promise<CampaignDraft[]> {
  const res = await get<DraftListResponse>("/api/campaign-drafts");
  return (res.drafts || []).map(toDraft);
}

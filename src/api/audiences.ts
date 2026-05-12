// client/src/api/audiences.ts
// Typed HTTP wrappers for SttL (Send to a List) audience-source endpoints.
// Phase 0c carve — written interactively S164 to unlock POS-88 for autonomy.
// Backend endpoints implemented in POS-86 (server/app/blueprints/audiences.py).

import { get, post } from "@/api/http";
import type { ApiResponse } from "@/api/uploads";
import type {
  Audience,
  AudienceApprovalRequest,
  AudienceApprovalResponse,
  AudienceCostPreview,
  AudienceCreateData,
  AudienceListResponse,
  AudienceSuppressionResult,
} from "@/types/audiences";

/* ============================================================
 * Create: POST /api/audiences (multipart — same shape as uploadBatch)
 * ============================================================
 * Server response variants (handled inline):
 *   - 201 + AudienceCreateOk            → new audience created
 *   - 200 + AudienceCreateExistingMatch → idempotency hit, re-upload prompt
 *   - 409 + AudienceCreateMappingRequired → mapper needs columns
 *   - 4xx/5xx → caller branches on res.status
 */

export type CreateAudienceParams = {
  file: File;
  name?: string;
  workspace_id?: string;
};

export type CreateAudienceRes = ApiResponse<AudienceCreateData>;

/**
 * Upload a CSV and create an Audience.
 * Accepts 409 mapping_required + 200 existing-match without throwing.
 */
export async function createAudience(
  params: CreateAudienceParams
): Promise<CreateAudienceRes> {
  const { file, name, workspace_id } = params;

  const fd = new FormData();
  fd.append("file", file);
  if (name) fd.append("name", name);
  if (workspace_id) fd.append("workspace_id", workspace_id);

  const res = await post<any>("/api/audiences", fd, {
    validateStatus: (s) => (s >= 200 && s < 300) || s === 409,
  });

  return { status: res.status, data: res.data ?? {} };
}

/* ============================================================
 * List: GET /api/audiences?page=1&per_page=50
 * ============================================================
 * Org-scoped (tenant-isolation per mem 1043+). Cross-org reads → 404.
 */

export type ListAudiencesParams = {
  page?: number;
  per_page?: number;
  workspace_id?: string; // optional filter — Lisa's per-client workspace
};

export async function listAudiences(
  params: ListAudiencesParams = {}
): Promise<AudienceListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.per_page) query.set("per_page", String(params.per_page));
  if (params.workspace_id) query.set("workspace_id", params.workspace_id);

  const qs = query.toString();
  const url = qs ? `/api/audiences?${qs}` : "/api/audiences";

  const data = await get<AudienceListResponse>(url);
  return {
    audiences: data.audiences ?? [],
    page: data.page ?? 1,
    per_page: data.per_page ?? 50,
    total: data.total ?? 0,
    has_more: Boolean(data.has_more),
  };
}

/* ============================================================
 * Get one: GET /api/audiences/:id
 * ============================================================
 */

export async function getAudience(audienceId: string): Promise<Audience> {
  return await get<Audience>(
    `/api/audiences/${encodeURIComponent(audienceId)}`
  );
}

/* ============================================================
 * Suppress: POST /api/audiences/:id/suppress
 * ============================================================
 * Runs DNM > Past > Recent suppression. Each row attributed to highest-
 * priority hit (no double-count). Returns counts + deliverable total.
 */

export async function suppressAudience(
  audienceId: string
): Promise<AudienceSuppressionResult> {
  const data = await post<AudienceSuppressionResult>(
    `/api/audiences/${encodeURIComponent(audienceId)}/suppress`,
    {}
  );
  return data;
}

/* ============================================================
 * Cost preview: GET /api/audiences/:id/cost
 * ============================================================
 * Phase 1 returns per-card only (enrich_enabled=false, melissa_enrich_estimate_cents=null).
 * Phase 2 will populate enrich fields when the toggle flips on.
 */

export async function getAudienceCost(
  audienceId: string
): Promise<AudienceCostPreview> {
  return await get<AudienceCostPreview>(
    `/api/audiences/${encodeURIComponent(audienceId)}/cost`
  );
}

/* ============================================================
 * Approve: POST /api/audiences/:id/approve
 * ============================================================
 * Flips Audience.status → 'approved'. Optionally attaches to a campaign
 * via campaign_id. Worker uses this to gate the wizard's Approve CTA.
 */

export async function approveAudience(
  req: AudienceApprovalRequest
): Promise<AudienceApprovalResponse> {
  const { audience_id, campaign_id } = req;
  const body: Record<string, string> = {};
  if (campaign_id) body.campaign_id = campaign_id;

  return await post<AudienceApprovalResponse>(
    `/api/audiences/${encodeURIComponent(audience_id)}/approve`,
    body
  );
}

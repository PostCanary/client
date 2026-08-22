import { get, postJson } from "@/api/http";
import type { DesignModerationStatus } from "@/utils/designModeration";

export interface DesignModerationUpload {
  id: string;
  org_id: string;
  org_name?: string;
  asset_id: string;
  asset_url: string;
  filename: string;
  mime_type: string | null;
  moderation_status: DesignModerationStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  uploaded_at: string | null;
}

export interface PendingDesignModerationResponse {
  uploads: DesignModerationUpload[];
  page: number;
  per_page: number;
}

export async function listPendingDesignUploads(params: {
  page?: number;
  per_page?: number;
} = {}): Promise<PendingDesignModerationResponse> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.per_page !== undefined) query.set("per_page", String(params.per_page));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await get<PendingDesignModerationResponse>(
    `/api/admin/design-moderation/pending${suffix}`,
  );
  return {
    uploads: Array.isArray(res.uploads) ? res.uploads : [],
    page: typeof res.page === "number" ? res.page : params.page ?? 1,
    per_page: typeof res.per_page === "number" ? res.per_page : params.per_page ?? 25,
  };
}

export async function approveDesignUpload(
  uploadId: string,
): Promise<DesignModerationUpload> {
  return postJson<DesignModerationUpload>(
    `/api/admin/design-moderation/${encodeURIComponent(uploadId)}/approve`,
  );
}

export async function rejectDesignUpload(
  uploadId: string,
  reason: string,
): Promise<DesignModerationUpload> {
  return postJson<DesignModerationUpload>(
    `/api/admin/design-moderation/${encodeURIComponent(uploadId)}/reject`,
    { reason },
  );
}

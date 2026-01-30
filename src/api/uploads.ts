// src/api/uploads.ts
import { post, get, del_ } from "@/api/http";

export type Source = "mail" | "crm";

/** Uniform response wrapper: ALWAYS return { status, data } */
export type ApiResponse<T = any> = {
  status: number;
  data: T;
};

/* ============================================================
 * Upload: POST /upload/<source>/start
 * ============================================================ */

export type UploadBatchOk = {
  batch_id: string;
  source: Source;
  raw_count?: number;
  filename?: string;
  [key: string]: any;
};

export type UploadBatchMappingRequired = {
  ok: false;
  error: "mapping_required";
  message?: string;
  batch_id: string | null;
  source?: Source;

  missing?: string[];
  field_errors?: Record<string, string>;
  sample_headers?: string[];
  sample_rows?: Record<string, any>[];

  [key: string]: any;
};

export type UploadBatchData =
  | UploadBatchOk
  | UploadBatchMappingRequired
  | Record<string, any>;

export type UploadBatchRes = ApiResponse<UploadBatchData>;

/**
 * Upload a CSV and create a Batch.
 * Accepts 409 mapping_required without throwing.
 */
export async function uploadBatch(
  source: Source,
  file: File
): Promise<UploadBatchRes> {
  const fd = new FormData();
  fd.append("file", file);

  const res = await post<any>(
    `/api/upload/${encodeURIComponent(source)}/start`,
    fd,
    {
      validateStatus: (s) => (s >= 200 && s < 300) || s === 409,
    }
  );

  return { status: res.status, data: res.data ?? {} };
}

/* ============================================================
 * Normalize: POST /upload/<batch_id>/normalize
 * ============================================================ */

export type NormalizeBatchAccepted = {
  ok: true;
  batch_id: string;
  source: Source;
  deduped_count: number;
  run_id: string | null;
  [key: string]: any;
};

export type NormalizeBatchAlreadyNormalized = {
  error: "already_normalized";
  message: string;
  batch_id: string;
  [key: string]: any;
};

export type NormalizeBatchMappingRequired = {
  ok: false;
  error: "mapping_required";
  message?: string;
  batch_id: string | null;
  source?: Source;

  missing?: string[];
  field_errors?: Record<string, string>;
  sample_headers?: string[];
  sample_rows?: Record<string, any>[];

  [key: string]: any;
};

export type NormalizeBatchGateDenied = {
  ok: false;
  batch_id: string;
  source: Source;
  deduped_count: number;

  allowed?: boolean;
  reason?: string; // subscription_required, usage_limit_exceeded
  checkout_url?: string;

  message?: string;
  [key: string]: any;
};

export type NormalizeBatchServerError = {
  ok: false;
  error: "normalize_failed" | "commit_failed";
  message?: string;
  batch_id: string;
  source: Source;
  [key: string]: any;
};

export type NormalizeBatchData =
  | NormalizeBatchAccepted
  | NormalizeBatchAlreadyNormalized
  | NormalizeBatchMappingRequired
  | NormalizeBatchGateDenied
  | NormalizeBatchServerError
  | Record<string, any>;

export type NormalizeBatchRes = ApiResponse<NormalizeBatchData>;

/**
 * Normalize + dedupe a batch.
 * Accept 409 without throwing so callers can branch on status.
 * IMPORTANT: Do NOT accept 402/400/500 — let axios throw, then catch and return {status,data}.
 */
export async function normalizeBatch(batchId: string): Promise<NormalizeBatchRes> {
  try {
    const res = await post<any>(
      `/api/upload/${encodeURIComponent(batchId)}/normalize`,
      {},
      {
        validateStatus: (s) => (s >= 200 && s < 300) || s === 409,
      }
    );

    return { status: res.status, data: res.data ?? {} };
  } catch (err: any) {
    // Your http.ts normalizes thrown errors into { status, data }
    const status = err?.status ?? 0;
    const data = err?.data ?? {};
    return { status, data };
  }
}

export type Batch = {
  id: string;
  source: Source;
  filename: string;
  created_at: string;
  status: string;
  raw_count: number | null;
  normalized_count: number | null;
  deduped_count: number | null;
};

export type ListBatchesResponse = {
  ok: true;
  batches: Batch[];
};

export type DeleteBatchResponse = {
  ok: true;
  batch_id: string;
  source: Source;
  deleted_matches: number;
  deleted_mappings: number;
};

export type DeleteBatchError = {
  ok: false;
  error: string;
  message?: string;
  batch_id: string;
};

export async function getBatches(): Promise<Batch[]> {
  const data = await get<ListBatchesResponse>("/api/batches");
  return data.batches || [];
}

export async function deleteBatch(batchId: string): Promise<DeleteBatchResponse> {
  const data = await del_<DeleteBatchResponse>(
    `/api/batches/${encodeURIComponent(batchId)}`
  );
  return data;
}
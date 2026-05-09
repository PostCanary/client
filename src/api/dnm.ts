// src/api/dnm.ts — Sprint 1.5 #4 — DNM (Do Not Mail) suppression list management.
// Pairs with backend `app/blueprints/dnm.py`: list / manual add / delete / CSV upload / count.
import { get, postJson, postForm, del_ } from "@/api/http";

export type DnmEntry = {
  id: string;
  address1: string;
  city: string;
  state: string;
  zip5: string;
  full_name: string | null;
  source: string;
  reason: string | null;
  created_at: string | null;
};

export type DnmListResponse = {
  ok: boolean;
  items: DnmEntry[];
  total: number;
  page: number;
  per_page: number;
};

export type DnmCreatePayload = {
  address1: string;
  city: string;
  state: string;
  zip5: string;
  full_name?: string | null;
  reason?: string | null;
};

export type DnmCreateResponse = {
  ok: true;
  item: DnmEntry;
  deduped?: boolean;
};

export type DnmCreateValidationError = {
  error: "validation_failed";
  details: Record<string, string>;
};

export async function listDnm(params: { page?: number; per_page?: number } = {}): Promise<DnmListResponse> {
  const q = new URLSearchParams();
  if (params.page !== undefined) q.set("page", String(params.page));
  if (params.per_page !== undefined) q.set("per_page", String(params.per_page));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return await get<DnmListResponse>(`/api/dnm/list${suffix}`);
}

export async function createDnm(payload: DnmCreatePayload): Promise<DnmCreateResponse> {
  return await postJson<DnmCreateResponse>(`/api/dnm`, payload);
}

export async function deleteDnm(id: string): Promise<{ ok: true }> {
  return await del_<{ ok: true }>(`/api/dnm/${id}`);
}

export async function uploadDnmCsv(file: File): Promise<{ ok: boolean; inserted: number; skipped: number }> {
  const fd = new FormData();
  fd.append("file", file);
  return await postForm(`/api/dnm/upload-csv`, fd);
}

export async function getDnmCount(): Promise<{ count: number }> {
  return await get<{ count: number }>(`/api/dnm/count`);
}

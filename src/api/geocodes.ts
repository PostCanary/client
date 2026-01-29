// src/api/geocodes.ts
import { http, API_BASE } from "@/api/http";

export type HeatmapKind = "mail" | "crm" | "matched";

export type HeatmapPoint = {
  lat: number | null;
  lon: number | null;
  label?: string | null;
  address?: string | null;
  kind: HeatmapKind;
  event_date?: string | null;
  event_count?: number; // optional but useful if you want weight later
};

export type HeatmapResponse = {
  ok: boolean;
  count: number;
  points: HeatmapPoint[];
};

export type HeatmapParams = {
  kind?: HeatmapKind; // optional (backend allows omitted => all kinds)
  start?: string;     // YYYY-MM-DD
  end?: string;       // YYYY-MM-DD
  limit?: number;     // 1..200000 (backend enforces)
};

export async function getHeatmapPoints(params: HeatmapParams): Promise<HeatmapResponse> {
  const q = new URLSearchParams();

  if (params.kind) q.set("kind", params.kind);
  if (params.start) q.set("start", params.start);
  if (params.end) q.set("end", params.end);

  const limit = params.limit ?? 20000;
  if (limit < 1 || limit > 200000) {
    throw new Error("limit must be between 1 and 200000");
  }
  q.set("limit", String(limit));

  const url = `/api/geocodes/heatmap?${q.toString()}`;

  const res = await http.get(url, { headers: { Accept: "application/json" } });

  if (res.status === 204 || !res.data) {
    return { ok: true, count: 0, points: [] };
  }

  const ct = String(res.headers?.["content-type"] || "");
  if (!ct.includes("application/json")) {
    throw new Error(`Heatmap endpoint returned non-JSON (check API base). url=${API_BASE}${url}`);
  }

  const data = res.data as Partial<HeatmapResponse>;
  return {
    ok: data.ok ?? true,
    count: data.count ?? (data.points?.length ?? 0),
    points: (data.points ?? []) as HeatmapPoint[],
  };
}
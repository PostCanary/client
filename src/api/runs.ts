// src/api/runs.ts
import { getRaw } from "@/api/http";

/**
 * Backend run model:
 * - status = lifecycle: queued | running | done | failed
 * - step   = UI progress: starting | matching | aggregating | done | failed
 */
export type RunLifecycle = "queued" | "running" | "done" | "failed";
export type RunStep =
  | "starting"
  | "matching"
  | "aggregating"
  | "done"
  | "failed"
  | null
  // allow backend to add new step labels without breaking FE
  | (string & {});

export type RunRequirement = "done" | "any";

/** Convert require option to query string */
function asQuery(requirement: RunRequirement): string {
  return requirement === "done" ? "?require=done" : "";
}

/**
 * Optional geocoding decoration returned by runs.get_status()
 */
export type GeocodingStatus = {
  status?: "missing" | "partial" | "complete" | "unknown";
  kinds?: string[];
  overall_pct?: number;
  last_updated_at?: string | null;
  by_kind?: Record<
    string,
    { buckets: number; geocoded: number; pct: number; last_updated_at?: string | null }
  >;
  activity?: "active" | "idle" | "unknown";
  message?: string;
};

/** Status payload returned by /runs/latest/status */
export type RunStatus = {
  run_id: string;
  user_id?: string;

  status: RunLifecycle;
  step?: RunStep;
  message?: string;
  pct?: number;

  started_at?: string;
  updated_at?: string;
  finished_at?: string | null;

  mail_count?: number | null;
  crm_count?: number | null;
  match_count?: number | null;

  geocoding?: GeocodingStatus;
};

// ---------------------------
// Result payloads
// ---------------------------

export type KPIs = {
  total_mail: number;
  unique_mail_addresses: number;
  total_jobs: number;
  matches: number;
  match_rate: number;

  conv_30d_rate: number;
  conv_60d_rate: number;
  conv_90d_rate: number;

  match_revenue: number;
  revenue_per_mailer: number;
  avg_ticket_per_match: number;
  median_days_to_convert: number;

  first_job_date?: string | null;
  last_job_date?: string | null;
};

export type RunGraph = {
  months: string[];
  labels?: string[];
  mailers: number[];
  jobs: number[];
  matches: number[];
  yoy?: {
    mailers?: { months: string[]; current: number[]; prev: number[] };
    jobs?: { months: string[]; current: number[]; prev: number[] };
    matches?: { months: string[]; current: number[]; prev: number[] };
  };
};

export type TopCity = { city: string; matches: number; match_rate: number };
export type TopZip = { zip5: string; matches: number; match_rate: number };

export type RunResult = {
  run_id: string;
  user_id?: string;

  kpis: KPIs;
  graph: RunGraph;
  top_cities: TopCity[];
  top_zips: TopZip[];
};

// ---------------------------
// Matches payloads
// ---------------------------

export type MatchRow = {
  id: number;

  run_id: string;
  user_id: string;

  crm_batch_id: string | null;
  mail_batch_ids: string[] | null;

  crm_line_no: number;
  job_index: string | null;

  mail_ids: string[] | null;
  matched_mail_dates: string[] | null;

  crm_job_date: string | null;
  job_value: number | null;

  crm_city: string | null;
  crm_state: string | null;
  crm_zip: string | null;
  crm_full_address: string | null;

  mail_full_address: string | null;
  mail_city: string | null;
  mail_state: string | null;
  mail_zip: string | null;

  confidence_percent: number | null;
  match_notes: string | null;

  zip5: string | null;
  state: string | null;
};

export type RunMatchesResponse = {
  run_id: string;
  total: number;
  matches: MatchRow[];
};

// ---------------------------
// Latest-for-user endpoints (ONLY)
// ---------------------------

export async function getLatestRunStatus(): Promise<RunStatus | null> {
  const res = await getRaw<RunStatus>("/api/runs/latest/status");
  if (res.status === 204) return null;
  return res.data ?? null;
}

export async function getLatestRunResult(
  requirement: RunRequirement = "any"
): Promise<RunResult | null> {
  const res = await getRaw<RunResult>(`/api/runs/latest/result${asQuery(requirement)}`);
  if (res.status === 204) return null;
  return res.data ?? null;
}

export async function getLatestRunMatches(
  requirement: RunRequirement = "any"
): Promise<RunMatchesResponse | null> {
  const res = await getRaw<RunMatchesResponse>(`/api/runs/latest/matches${asQuery(requirement)}`);
  if (res.status === 204) return null;
  return res.data ?? null;
}

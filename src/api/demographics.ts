// src/api/demographics.ts
import { get } from "@/api/http";

export type DemographicView = "matches" | "all_customers";

export type DemoDistribution = {
  labels: string[];
  values: number[];
};

export type DemoHeroKPIs = {
  // Matches tab only
  best_audience?: {
    label: string;
    multiplier: number;
    multiplier_text: string;
  } | null;
  // All Customers tab only
  total_customers?: number;
  // Both tabs
  top_home_value: {
    label: string;
    pct: number;
    pct_text: string;
  };
  top_income_range: {
    label: string;
    pct: number;
    pct_text: string;
  };
  homeowner_rate: {
    value: number;
    diff?: number;
    diff_text?: string;
  };
};

export type DemoCharts = {
  home_value: DemoDistribution;
  age_range: DemoDistribution;
  income: DemoDistribution;
  property_type: DemoDistribution;
  comparison?: {
    labels: string[];
    mailed: number[];
    matched: number[];
  };
};

export type DemoInsightMessage = {
  text: string;
  qualifier?: string | null;
} | null;

export type DemoRecommendation = {
  segment: string;
  pct_mailers: number;
  pct_matches: number;
  segment_match_rate: number | null;
  lift: number | null;
  lift_text: string;
  response_strength: string;
  recommendation: string;
  insufficient: boolean;
};

export type DemoCoverage = {
  total_zips: number;
  enriched_zips: number;
  pct: number;
};

export type ConfidenceTier = "insufficient" | "low" | "sufficient";

export type DemographicsPayload = {
  view: DemographicView;
  match_count: number;
  confidence_tier: ConfidenceTier;
  hero: DemoHeroKPIs | null;
  charts: DemoCharts | null;
  insight_message: DemoInsightMessage;
  recommendations: DemoRecommendation[];
  coverage: DemoCoverage;
  data_note: string;
};

export type DemoParams = {
  view?: DemographicView;
  start?: string;
  end?: string;
};

export async function getDemographicsPayload(
  params: DemoParams = {},
): Promise<DemographicsPayload> {
  const q = new URLSearchParams();
  if (params.view) q.set("view", params.view);
  if (params.start) q.set("start", params.start);
  if (params.end) q.set("end", params.end);

  const qs = q.toString();
  return get<DemographicsPayload>(
    `/api/demographics/payload${qs ? `?${qs}` : ""}`,
  );
}

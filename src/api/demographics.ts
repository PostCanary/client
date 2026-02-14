// src/api/demographics.ts
import { get } from "@/api/http";

export type DemographicView = "responded" | "mailed" | "comparison";

export type DemoDistribution = {
  labels: string[];
  values: number[];
};

export type DemoHeroKPIs = {
  best_audience: {
    label: string;
    multiplier: number;
    multiplier_text: string;
  };
  typical_home_value: number;
  top_income_range: {
    label: string;
    pct: number;
    pct_text: string;
  };
  homeowner_rate: {
    value: number;
    diff: number;
    diff_text: string;
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
    responded: number[];
  };
};

export type DemoInsight = {
  type: "sweet_spot" | "untapped" | "low_return" | "consider_cutting";
  title: string;
  description: string;
  stat: string;
};

export type DemoRecommendation = {
  segment: string;
  pct_mailers: number;
  pct_responses: number;
  response_strength: number;
  strength_label: string;
  recommendation: "send_more" | "keep" | "send_less" | "stop";
};

export type DemoCoverage = {
  total_zips: number;
  enriched_zips: number;
  pct: number;
};

export type DemographicsPayload = {
  view: DemographicView;
  hero: DemoHeroKPIs | null;
  charts: DemoCharts | null;
  insights: DemoInsight[];
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

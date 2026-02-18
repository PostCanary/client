// src/api/analytics.ts
import { get, postJson } from "@/api/http";

// --- Insight Section ---
export type InsightSection = {
  title: string;
  icon: string;
  body: string;
  highlights: string[];
  recommendation: string;
};

// --- Recommendation ---
export type Recommendation = {
  priority: "high" | "medium" | "low";
  action: string;
  rationale: string;
};

// --- Data Context (transparency / sufficiency) ---
export type DataContext = {
  total_matches: number;
  total_mail: number;
  unique_addresses: number;
  total_jobs: number;
  date_range: { earliest_mail: string; latest_job: string; months_span: number } | null;
  sufficiency: "high" | "moderate" | "limited";
  warnings: string[];
};

// --- Full Insights ---
export type AnalyticsInsights = {
  executive_summary: string;
  sections: InsightSection[];
  top_recommendations: Recommendation[];
  data_context?: DataContext;
};

// --- API Response ---
export type AnalyticsResponse = {
  run_id: string;
  insights: AnalyticsInsights;
  model_used: string;
  generated_at: string;
} | {
  data: null;
  message: string;
};

export async function getAnalyticsInsights(): Promise<AnalyticsResponse> {
  return get<AnalyticsResponse>("/api/analytics/insights");
}

export async function regenerateInsights(): Promise<AnalyticsResponse> {
  return postJson<AnalyticsResponse>("/api/analytics/regenerate");
}

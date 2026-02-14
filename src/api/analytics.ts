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

// --- Full Insights ---
export type AnalyticsInsights = {
  executive_summary: string;
  sections: InsightSection[];
  top_recommendations: Recommendation[];
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

// src/config/tourSteps.ts
export interface TourStepDef {
  id: string;
  title: string;
  text: string;
  attachTo: { element: string; on: string };
  page: string;
}

export const tourSteps: TourStepDef[] = [
  {
    id: "welcome",
    title: "Welcome to PostCanary!",
    text: "Let\u2019s take a quick tour of your dashboard and key features. You can skip anytime or replay this tour later from Settings.",
    attachTo: { element: "[data-tour=\"navbar\"]", on: "bottom" },
    page: "/dashboard",
  },
  {
    id: "nav-links",
    title: "Navigation",
    text: "Use these links to jump between your Dashboard, AI Insights, Demographics, Heatmap, and History pages.",
    attachTo: { element: "[data-tour=\"navbar\"]", on: "bottom" },
    page: "/dashboard",
  },
  {
    id: "kpi-cards",
    title: "KPI Summary",
    text: "These cards show your key performance indicators at a glance \u2014 conversion rate, match count, revenue, and more.",
    attachTo: { element: "#cmp-kpis", on: "bottom" },
    page: "/dashboard",
  },
  {
    id: "upload-card",
    title: "Upload Your Data",
    text: "Upload your mail list and CRM data here. Once both files are mapped, we\u2019ll match them and generate your analytics.",
    attachTo: { element: "#cmp-action-row", on: "bottom" },
    page: "/dashboard",
  },
  {
    id: "trend-chart",
    title: "Trend Chart",
    text: "This chart shows your year-over-year conversion trends so you can track performance over time.",
    attachTo: { element: "#cmp-graph", on: "top" },
    page: "/dashboard",
  },
  {
    id: "ai-insights",
    title: "AI Insights",
    text: "Get AI-powered analysis of your campaign performance with actionable recommendations after each match run.",
    attachTo: { element: ".app-main", on: "top" },
    page: "/analytics",
  },
  {
    id: "demographics",
    title: "Demographics",
    text: "See Census-based audience profiling for your customers \u2014 income, home value, age, and property type breakdowns.",
    attachTo: { element: ".app-main", on: "top" },
    page: "/demographics",
  },
  {
    id: "heatmap",
    title: "Heatmap",
    text: "Visualize where your mail recipients and conversions are located on an interactive geographic map.",
    attachTo: { element: ".app-main", on: "top" },
    page: "/map",
  },
  {
    id: "history",
    title: "History",
    text: "View all your past uploads, column mappings, and matching runs in one place.",
    attachTo: { element: ".app-main", on: "top" },
    page: "/history",
  },
  {
    id: "tour-complete",
    title: "You're All Set!",
    text: "You\u2019re ready to go. Upload your first mail list and CRM file to see your direct-mail ROI in action.",
    attachTo: { element: "#cmp-action-row", on: "bottom" },
    page: "/dashboard",
  },
];

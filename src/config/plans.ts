import type { PlanCode } from "@/api/billing";

export type PlanDisplay = {
  code: PlanCode;
  name: string;
  price: string;
  monthlyPrice: number;
  limit: number;
  limitLabel: string;
  includedLabel: string;
};

export const PLAN_DISPLAY_DETAILS: Record<PlanCode, PlanDisplay> = {
  INSIGHT: {
    code: "INSIGHT",
    name: "Starter",
    price: "$49/mo",
    monthlyPrice: 49,
    limit: 1_000,
    limitLabel: "Up to 1,000 mailers / month",
    includedLabel: "Up to 1,000 mailers / month",
  },
  PERFORMANCE: {
    code: "PERFORMANCE",
    name: "Basic",
    price: "$99/mo",
    monthlyPrice: 99,
    limit: 5_000,
    limitLabel: "Up to 5,000 mailers / month",
    includedLabel: "Up to 5,000 mailers / month",
  },
  PRECISION: {
    code: "PRECISION",
    name: "Pro",
    price: "$199/mo",
    monthlyPrice: 199,
    limit: 25_000,
    limitLabel: "Up to 25,000 mailers / month",
    includedLabel: "Up to 25,000 mailers / month",
  },
  ELITE: {
    code: "ELITE",
    name: "Ultimate",
    price: "$499/mo",
    monthlyPrice: 499,
    limit: 100_000,
    limitLabel: "Up to 100,000 mailers / month",
    includedLabel: "Up to 100,000 mailers / month",
  },
};

export const PLAN_DISPLAY_ORDER: PlanCode[] = [
  "INSIGHT",
  "PERFORMANCE",
  "PRECISION",
  "ELITE",
];

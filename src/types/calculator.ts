import { PLAN_DISPLAY_DETAILS, PLAN_DISPLAY_ORDER } from "@/config/plans";

export interface CalculatorHeroContent {
  headline: string;
  subheadline: string;
  ctaText?: string;
}

export type IndustryType = "hvac" | "plumbing" | "real_estate" | "other";

export type MatchingFrequency = "weekly" | "biweekly" | "monthly";

export interface RoiCalculatorInputs {
  monthlyMailVolume: number;
  costPerMailer: number;
  averageTicketValue: number;
  trackedConversionRate: number;
  industry: IndustryType;
}

export interface RoiCalculatorResults {
  monthlyMailSpend: number;
  trackedRevenue: number;
  trackedConversions: number;
  estimatedTrueConversionRate: number;
  estimatedTrueRevenue: number;
  estimatedTrueConversions: number;
  hiddenRevenue: number;
  hiddenConversions: number;
  trackedRoi: number;
  trueRoi: number;
  annualHiddenRevenue: number;
  trackingCaptureRate: number;
}

export interface AttributionGapInputs {
  monthlyMailersSent: number;
  trackedConversions: number;
  totalNewCustomers: number;
  averageRevenuePerCustomer: number;
}

export interface AttributionGapResults {
  trackingCaptureRate: number;
  untrackedConversions: number;
  attributionGapPercentage: number;
  unattributedRevenue: number;
  attributedRevenue: number;
  totalActualRevenue: number;
  conversionRate: number;
  revenuePerMailer: number;
}

export interface SavingsCalculatorInputs {
  monthlyMailVolume: number;
  hoursSpentMatching: number;
  matchingFrequency: MatchingFrequency;
  hourlyLaborCost: number;
  currentMatchAccuracy: number;
}

export interface PricingTier {
  name: string;
  maxVolume: number;
  monthlyPrice: number;
  isEnterprise?: boolean;
}

export interface SavingsCalculatorResults {
  annualLaborCost: number;
  monthlyLaborCost: number;
  recommendedTier: PricingTier;
  annualPostCanaryCost: number;
  monthlyPostCanaryCost: number;
  netAnnualSavings: number;
  netMonthlySavings: number;
  accuracyImprovement: number;
  hoursPerYear: number;
  hoursSavedPerYear: number;
  roiPercentage: number;
}

export interface CalculatorFAQItem {
  question: string;
  answer: string;
}

export interface CalculatorFAQContent {
  heading?: string;
  faqs: CalculatorFAQItem[];
}

export interface IndustryBenchmark {
  label: string;
  value: string;
  source?: string;
}

export const PRICING_TIERS: PricingTier[] = PLAN_DISPLAY_ORDER.map((code) => ({
  name: PLAN_DISPLAY_DETAILS[code].name,
  maxVolume: PLAN_DISPLAY_DETAILS[code].limit,
  monthlyPrice: PLAN_DISPLAY_DETAILS[code].monthlyPrice,
}));

export const INDUSTRY_DEFAULTS: Record<IndustryType, { ticketValue: number; conversionRate: number }> = {
  hvac: { ticketValue: 350, conversionRate: 3.1 },
  plumbing: { ticketValue: 300, conversionRate: 3.1 },
  real_estate: { ticketValue: 10000, conversionRate: 2.0 },
  other: { ticketValue: 250, conversionRate: 2.5 },
};

export const FREQUENCY_MULTIPLIERS: Record<MatchingFrequency, number> = {
  weekly: 52,
  biweekly: 26,
  monthly: 12,
};

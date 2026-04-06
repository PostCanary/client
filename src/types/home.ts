// src/types/home.ts
// Home page data structures — all mock data for Phase A (rules-based, no real API calls)

import type { CampaignGoalType, MailCampaignStatus, Industry } from './campaign'

// ============================================================
// USER TYPE DETECTION
// ============================================================

export type HomeUserType = 'new' | 'returning' | 'analytics_only' | 'dormant'

export interface HomeUserContext {
  userType: HomeUserType
  firstName: string
  lastActivityDate: string | null
  campaignCount: number
  activeCampaignCount: number
  totalMailedCount: number
  hasBudgetSet: boolean
  hasFirstResult: boolean
  industry: Industry | null
  batchCount: number
  daysSinceLastActivity: number | null
}

// ============================================================
// BEST-PRACTICE RECOMMENDATION (Phase A — rules-based)
// ============================================================

export interface BestPracticeRecommendation {
  id: string
  title: string
  description: string
  why: string
  goalType: CampaignGoalType
  estimatedCount: number
  estimatedCost: number
  previewImageUrl: string | null
  seasonalTag: string | null
  urgency: 'low' | 'medium' | 'high'
}

// ============================================================
// ACTIVE CAMPAIGN CARD
// ============================================================

export interface HomeCampaignSummary {
  id: string
  name: string
  status: MailCampaignStatus
  statusLabel: string
  goalType: CampaignGoalType
  householdCount: number
  cardsSent: number
  totalCards: number
  nextCardDate: string | null
  estimatedDeliveryDate: string | null
  matchCount: number
  createdAt: string
}

export const CAMPAIGN_STATUS_LABELS: Record<MailCampaignStatus, string> = {
  draft: 'Draft',
  approved: 'Approved',
  printing: 'Sent to Printer',
  in_transit: 'Mailed (Estimated)',
  delivered: 'Estimated Delivered',
  results_ready: 'Tracking Results',
  completed: 'Completed',
  paused: 'Paused',
}

// ============================================================
// BUDGET TRACKER
// ============================================================

export interface BudgetSummary {
  monthlyBudget: number
  spent: number
  remaining: number
  campaignsSentThisMonth: number
  nextRecommendedSpend: number
  canAffordRecommendation: boolean
}

// ============================================================
// MILESTONE TRACKER (Autopilot progress)
// ============================================================

export interface MilestoneProgress {
  campaignsCompleted: number
  campaignsRequired: number
  progressPercent: number
  isEligible: boolean
  nextMilestoneLabel: string
}

// ============================================================
// GETTING STARTED CHECKLIST (new users)
// ============================================================

export interface ChecklistStep {
  id: string
  label: string
  description: string
  timeEstimate: string
  completed: boolean
  actionLabel: string
  actionRoute: string
  icon: string
}

// ============================================================
// COMMUNITY PROOF
// ============================================================

export interface CommunityStats {
  totalPostcardsSentThisMonth: number
  activeBusinesses: number
  averageMatchRate: number
}

// ============================================================
// FIRST RESULT CELEBRATION
// ============================================================

export interface FirstResultData {
  campaignId: string
  matchCount: number
  campaignName: string
  detectedDate: string
}

// ============================================================
// QUICK ACTIONS
// ============================================================

export interface QuickAction {
  id: string
  label: string
  description: string
  icon: string
  route: string
  variant: 'primary' | 'secondary'
}

// ============================================================
// DATA FRESHNESS
// ============================================================

export interface DataFreshness {
  lastCrmUpload: string | null
  lastMatchRun: string | null
  isStale: boolean
  staleMessage: string | null
}

// ============================================================
// MOCK DATA (Phase A — replace with real API calls in Phase B)
// ============================================================

export const MOCK_HOME_CONTEXT: HomeUserContext = {
  userType: 'returning',
  firstName: 'Drake',
  lastActivityDate: '2026-03-28T14:30:00Z',
  campaignCount: 3,
  activeCampaignCount: 1,
  totalMailedCount: 924,
  hasBudgetSet: true,
  hasFirstResult: true,
  industry: 'hvac',
  batchCount: 5,
  daysSinceLastActivity: 3,
}

export const MOCK_RECOMMENDATION: BestPracticeRecommendation = {
  id: 'rec-spring-ac',
  title: 'Spring AC Tune-Up Campaign',
  description: 'Your past AC customers are prime targets for spring tune-ups before the heat hits. Neighbor marketing around recent jobs gets you the highest ROI.',
  why: 'Spring cooling season starts in 3 weeks. Best time to mail is now.',
  goalType: 'seasonal_tuneup',
  estimatedCount: 312,
  estimatedCost: 215,
  previewImageUrl: null,
  seasonalTag: 'Spring 2026',
  urgency: 'medium',
}

export const MOCK_CAMPAIGNS: HomeCampaignSummary[] = [
  {
    id: 'camp-001',
    name: 'Spring AC Tune-Up',
    status: 'in_transit',
    statusLabel: 'Mailed (Estimated)',
    goalType: 'seasonal_tuneup',
    householdCount: 312,
    cardsSent: 2,
    totalCards: 3,
    nextCardDate: '2026-04-05T00:00:00Z',
    estimatedDeliveryDate: '2026-04-02T00:00:00Z',
    matchCount: 12,
    createdAt: '2026-03-15T10:00:00Z',
  },
  {
    id: 'camp-002',
    name: 'Neighbor Marketing - Oak Park',
    status: 'completed',
    statusLabel: 'Completed',
    goalType: 'neighbor_marketing',
    householdCount: 189,
    cardsSent: 3,
    totalCards: 3,
    nextCardDate: null,
    estimatedDeliveryDate: null,
    matchCount: 8,
    createdAt: '2026-02-20T10:00:00Z',
  },
]

export const MOCK_BUDGET: BudgetSummary = {
  monthlyBudget: 500,
  spent: 215,
  remaining: 285,
  campaignsSentThisMonth: 1,
  nextRecommendedSpend: 180,
  canAffordRecommendation: true,
}

export const MOCK_MILESTONE: MilestoneProgress = {
  campaignsCompleted: 3,
  campaignsRequired: 5,
  progressPercent: 60,
  isEligible: false,
  nextMilestoneLabel: '2 more campaigns until Autopilot eligibility',
}

export const MOCK_COMMUNITY: CommunityStats = {
  totalPostcardsSentThisMonth: 14200,
  activeBusinesses: 156,
  averageMatchRate: 4.2,
}

export const MOCK_FIRST_RESULT: FirstResultData = {
  campaignId: 'camp-001',
  matchCount: 12,
  campaignName: 'Spring AC Tune-Up',
  detectedDate: '2026-03-28T09:15:00Z',
}

export const MOCK_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'qa-send',
    label: 'Send Postcards',
    description: 'Launch a new campaign',
    icon: 'MailOutline',
    route: '/app/send',
    variant: 'primary',
  },
  {
    id: 'qa-results',
    label: 'View Results',
    description: 'See your campaign performance',
    icon: 'BarChartOutline',
    route: '/app/dashboard',
    variant: 'secondary',
  },
  {
    id: 'qa-upload',
    label: 'Upload CRM Data',
    description: 'Update your customer list',
    icon: 'CloudUploadOutline',
    route: '/app/dashboard',
    variant: 'secondary',
  },
  {
    id: 'qa-designs',
    label: 'Browse Designs',
    description: 'View your templates',
    icon: 'ColorPaletteOutline',
    route: '/app/designs',
    variant: 'secondary',
  },
]

export const MOCK_CHECKLIST: ChecklistStep[] = [
  {
    id: 'step-1',
    label: 'Tell us about your business',
    description: 'Industry, location, and website so we can build your brand kit.',
    timeEstimate: '30 seconds',
    completed: true,
    actionLabel: 'Done',
    actionRoute: '',
    icon: 'BusinessOutline',
  },
  {
    id: 'step-2',
    label: 'Send your first postcards',
    description: 'Pick a goal, choose your area, and we handle the rest.',
    timeEstimate: '5 minutes',
    completed: false,
    actionLabel: 'Get Started',
    actionRoute: '/app/send',
    icon: 'MailOutline',
  },
  {
    id: 'step-3',
    label: 'Upload your customer list',
    description: 'Match your CRM data to see which postcards drove calls.',
    timeEstimate: '2 minutes',
    completed: false,
    actionLabel: 'Upload Now',
    actionRoute: '/app/dashboard',
    icon: 'CloudUploadOutline',
  },
  {
    id: 'step-4',
    label: 'See your results',
    description: 'We match your customer calls to the postcards we sent.',
    timeEstimate: "We'll notify you",
    completed: false,
    actionLabel: 'Coming Soon',
    actionRoute: '/app/dashboard',
    icon: 'CheckmarkCircleOutline',
  },
]

export const MOCK_DATA_FRESHNESS: DataFreshness = {
  lastCrmUpload: '2026-03-25T10:00:00Z',
  lastMatchRun: '2026-03-26T08:00:00Z',
  isStale: false,
  staleMessage: null,
}

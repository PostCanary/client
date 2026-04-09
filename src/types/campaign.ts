// ============================================================
// PostCanary V1 Campaign Types — shared across all terminals
// ============================================================
// API CONVENTION: The codebase uses snake_case directly in TypeScript
// (no camelCase transformation). New API files should follow this same
// pattern — use snake_case field names to match the server response.
// The JSONB `data` blob uses camelCase since only the client reads/writes it.
// ============================================================

// ============================================================
// INDUSTRY (structured enum, not free text)
// ============================================================

export type Industry =
  | 'hvac'
  | 'plumbing'
  | 'roofing'
  | 'cleaning'
  | 'electrical'
  | 'pest_control'
  | 'landscaping'
  | 'other'

export const INDUSTRY_LABELS: Record<Industry, string> = {
  hvac: 'HVAC',
  plumbing: 'Plumbing',
  roofing: 'Roofing',
  cleaning: 'Cleaning',
  electrical: 'Electrical',
  pest_control: 'Pest Control',
  landscaping: 'Landscaping',
  other: 'Other',
}

// ============================================================
// INDUSTRY NORMALIZATION
// ============================================================
// Existing users have free-text `industry` values (e.g., 'plumbing',
// 'HVAC', 'carpet cleaning'). The brand kit's photo selection and
// targeting smart defaults expect enum values. This helper maps common
// free-text values to the enum. Returns null for unrecognized values
// (use generic defaults in that case).

const INDUSTRY_ALIASES: Record<string, Industry> = {
  hvac: 'hvac',
  'heating and cooling': 'hvac',
  'air conditioning': 'hvac',
  ac: 'hvac',
  'ac repair': 'hvac',
  plumbing: 'plumbing',
  plumber: 'plumbing',
  roofing: 'roofing',
  roofer: 'roofing',
  cleaning: 'cleaning',
  'carpet cleaning': 'cleaning',
  'house cleaning': 'cleaning',
  'pressure washing': 'cleaning',
  electrical: 'electrical',
  electrician: 'electrical',
  'pest control': 'pest_control',
  'pest_control': 'pest_control',
  exterminator: 'pest_control',
  landscaping: 'landscaping',
  'lawn care': 'landscaping',
  'lawn service': 'landscaping',
}

export function normalizeIndustry(raw: string | null): Industry | null {
  if (!raw) return null
  const normalized = raw.toLowerCase().trim()
  return INDUSTRY_ALIASES[normalized] ?? null
}

// ============================================================
// CAMPAIGN GOALS
// ============================================================

export type CampaignGoalType =
  | 'neighbor_marketing'
  | 'seasonal_tuneup'
  | 'target_area'
  | 'storm_response'
  | 'win_back'
  | 'cross_service_promo'
  | 'new_mover'
  | 'other'

export interface CampaignGoalDefaults {
  includePastCustomers: boolean
  frequencyExclusionDays: number | null  // null = no exclusion (storm)
  defaultPostcards: number
  spacingWeeks: number
}

// Maps goal type to its defaults (auto-applied in Step 2)
export const GOAL_DEFAULTS: Record<CampaignGoalType, CampaignGoalDefaults> = {
  neighbor_marketing:  { includePastCustomers: false, frequencyExclusionDays: 30, defaultPostcards: 3, spacingWeeks: 2 },
  seasonal_tuneup:     { includePastCustomers: true,  frequencyExclusionDays: 30, defaultPostcards: 3, spacingWeeks: 2 },
  target_area:         { includePastCustomers: false, frequencyExclusionDays: 30, defaultPostcards: 3, spacingWeeks: 2 },
  storm_response:      { includePastCustomers: true,  frequencyExclusionDays: null, defaultPostcards: 2, spacingWeeks: 1 },
  win_back:            { includePastCustomers: true,  frequencyExclusionDays: 30, defaultPostcards: 3, spacingWeeks: 3 },
  cross_service_promo: { includePastCustomers: true,  frequencyExclusionDays: 30, defaultPostcards: 2, spacingWeeks: 2 },
  new_mover:           { includePastCustomers: false, frequencyExclusionDays: 30, defaultPostcards: 3, spacingWeeks: 2 },
  other:               { includePastCustomers: false, frequencyExclusionDays: 30, defaultPostcards: 3, spacingWeeks: 2 },
}

// ============================================================
// STEP 1: GOAL SELECTION
// ============================================================

export interface GoalSelection {
  goalType: CampaignGoalType
  goalLabel: string                    // display name
  serviceType: string | null           // which service (for seasonal, cross-service)
  sequenceLength: number               // 1-5 cards
  sequenceSpacingDays: number          // days between cards
  otherGoalText: string | null         // free text for "other"
}

// ============================================================
// STEP 2: TARGETING (Terminal 1 owns)
// ============================================================

export interface TargetingArea {
  type: 'circle' | 'rectangle' | 'polygon' | 'zip' | 'job_radius'
  coordinates: number[][]              // lat/lng pairs defining shape
  radiusMiles?: number                 // for circle/job_radius
  zipCode?: string                     // for zip type
}

export interface JobReference {
  id: string
  address: string
  lat: number
  lng: number
  serviceType: string | null
  jobDate: string                      // ISO date
  selected: boolean                    // can be unchecked
}

export interface TargetingFilters {
  homeowner: 'homeowner' | 'all' | 'investor' | null  // null = any
  homeValueMin: number | null
  homeValueMax: number | null
  yearBuiltMin: number | null
  yearBuiltMax: number | null
  propertyTypes: string[]              // empty = all
}

export interface RecipientBreakdown {
  newProspects: number
  pastCustomers: number
  pastCustomersIncluded: boolean
}

export interface TargetingSelection {
  // Context from Step 1
  campaignGoal: CampaignGoalType
  serviceType: string | null
  sequenceLength: number
  sequenceSpacingDays: number

  // Targeting
  areas: TargetingArea[]
  method: 'draw' | 'zip' | 'around_jobs' | 'combined'
  filters: TargetingFilters
  jobsUsed: JobReference[] | null
  jobRadiusMiles: number | null

  // Exclusions
  excludePastCustomers: boolean
  excludeMailedWithinDays: number | null
  doNotMailCount: number

  // Counts (computed)
  totalHouseholds: number
  excludedPastCustomers: number
  excludedRecentlyMailed: number
  excludedDoNotMail: number
  finalHouseholdCount: number
  pastCustomersInArea: number
  recipientBreakdown: RecipientBreakdown

  // Cost (computed)
  estimatedCostSingle: number          // cost for one card
  estimatedCostSequence: number        // cost for full sequence

  // Data source
  countSource: 'melissa' | 'mock'

  // Save
  savedAudienceName: string | null
}

// ============================================================
// STEP 3: DESIGN (Terminal 2 owns)
// ============================================================

export type TemplateLayoutType =
  | 'full-bleed'
  | 'side-split'
  | 'photo-top'
  | 'bold-graphic'
  | 'before-after'
  | 'review-forward'

export type CardPurpose = 'offer' | 'proof' | 'last_chance'

export interface CardDesign {
  cardNumber: number                   // 1, 2, or 3
  cardPurpose: CardPurpose
  templateId: string
  previewImageUrl: string              // generated preview for Step 4
  overrides: {                         // only what customer CHANGED from auto-generated
    headline?: string
    offerText?: string
    offerTeaser?: string               // NEW 2026-04-09: short (≤4 word) front-of-card teaser
    reviewQuote?: string
    reviewerName?: string
    urgencyText?: string
    riskReversal?: string
    photoUrl?: string
  }
  resolvedContent: {                   // template defaults + overrides merged
    headline: string
    offerText: string                  // full stacked offer (back)
    offerTeaser: string                // short front-of-card teaser, e.g. "$79 TUNE-UP"
    photoUrl: string
    reviewQuote: string
    reviewerName: string
    phoneNumber: string                // always from brand kit
    urgencyText: string
    riskReversal: string
    trustSignals: string[]
  }
  backContent: {
    guarantee: string
    certifications: string[]
    licenseNumber: string
    companyAddress: string
    websiteUrl: string
    qrCodeUrl: string
  }
  // AI generation metadata (populated when using server AI, empty for local fallback)
  headlineCandidates: Array<{ text: string; formula: string; reason: string }>  // 3 options from AI
  offerReason: string                  // why this offer was generated
  reviewReason: string                 // why this review was selected
  templateReason: string               // why this layout was recommended for this card position
}

export interface DesignSelection {
  templateId: string
  templateLayoutType: TemplateLayoutType
  isCustomUpload: boolean
  customUploadUrl: string | null
  sequenceCards: CardDesign[]
}

// ============================================================
// STEP 4: REVIEW & SEND (Terminal 3 owns)
// ============================================================

export interface CardSchedule {
  cardNumber: number
  scheduledDate: string                // ISO date
  estimatedDeliveryDate: string        // ISO date
}

export interface ReviewSelection {
  campaignName: string                 // auto-generated, editable
  schedules: CardSchedule[]
  sendSeedCopy: boolean                // default true (free)
  seedAddress: string                  // from profile
  additionalSeeds: string[]            // charged at per-card rate
  paymentMethodId: string | null       // Stripe PM
  paymentMethodLabel: string | null    // "Visa ending 4242"
  totalCost: number
  perCardCosts: number[]
  agreedToTerms: boolean
}

// ============================================================
// CAMPAIGN DRAFT (full wizard state)
// ============================================================

export type WizardStep = 1 | 2 | 3 | 4

export interface CampaignDraft {
  id: string                           // UUID
  orgId: string
  currentStep: WizardStep
  completedSteps: WizardStep[]         // steps that have valid data
  needsReviewSteps: WizardStep[]       // steps flagged for re-review after goal change

  goal: GoalSelection | null
  targeting: TargetingSelection | null
  design: DesignSelection | null
  review: ReviewSelection | null

  createdAt: string                    // ISO datetime
  updatedAt: string                    // ISO datetime
  schemaVersion: number                // for future migration of stale drafts
}

// ============================================================
// BRAND KIT
// ============================================================

// Confidence tier for an extracted field.
// HIGH = structured source (Google Places API, explicit HTML)
// MEDIUM = inferred from page content (Firecrawl LLM extraction)
// LOW = not found, ambiguous, or sourced from mock fallback
export type ExtractionConfidence = 'high' | 'medium' | 'low'

// Which source contributed to the merged brand kit.
export type ExtractionSource = 'firecrawl' | 'google_places' | 'manual'

// Trust badge surfaced from brand extraction (BBB, Angi, HomeAdvisor, etc.)
export interface TrustBadge {
  type: 'bbb' | 'angi' | 'homeadvisor' | 'yelp' | 'google' | 'nextdoor' | 'thumbtack' | 'porch' | 'custom'
  label: string                        // "BBB A+" or "Angi Certified"
  confidence: ExtractionConfidence
}

export interface BrandKitPhoto {
  url: string                          // web-accessible URL (e.g., /api/media/brand-photos/{org}/{uuid}.jpg)
  qualityScore: number                 // 0-100
  source: 'website' | 'upload' | 'stock' | 'google_places'
  alt: string
  // --- Extraction R2 additions (all optional for backwards compat) ---
  path?: string                        // server filesystem path (for cleanup + re-scrape)
  originalUrl?: string                 // where the photo was sourced from
  width?: number
  height?: number
  printReady?: boolean                 // width >= 1200
}

export interface BrandKitReview {
  quote: string                        // excerpted to <=35 words
  fullText: string
  reviewerName: string                 // first name + last initial only
  rating: number                       // 1-5
  source: string                       // "Google"
  reason: string                       // why this review was selected
  // --- Extraction R2 additions ---
  specificityScore?: number            // 0-50, used by AI to pick the strongest review
}

export interface BrandKit {
  id: string
  orgId: string
  businessName: string
  location: string                     // city, state
  address: string | null
  phone: string | null
  websiteUrl: string | null            // cleaned: no https://, no www., no trailing slash
  logoUrl: string | null
  logoQualityScore: number | null
  brandColors: string[]                // hex codes extracted from website (2-3)
  photos: BrandKitPhoto[]
  googleRating: number | null          // 1.0-5.0 (sourced from Google Places in R2)
  reviews: BrandKitReview[]
  certifications: string[]             // ["Licensed & Insured", "BBB A+", "NATE Certified"]
  currentOffers: string[]              // scraped from website
  guarantees: string[]                 // scraped from website
  yearsInBusiness: number | null
  industry: string | null
  serviceTypes: string[]               // ["AC Repair", "Heating", "Duct Cleaning"]
  scrapeStatus: 'pending' | 'scraping' | 'complete' | 'partial' | 'failed' | 'skipped'
  scrapeProgress: {
    step: 'connecting' | 'reading' | 'analyzing' | 'downloading' | 'done' | 'failed'
    message: string         // user-friendly: "Reading your website...", "Finding your photos..."
    estimatedSecondsLeft: number | null
    startedAt: string | null   // ISO datetime for stale detection
    // --- Extraction R2 additions (optional for backwards compat) ---
    completedSteps?: number    // 0-5, for progress bar
    totalSteps?: number        // typically 5
  } | null
  completenessPercent: number          // 0-100
  updatedAt: string
  // --- Extraction R2 additions (all optional for backwards compat) ---
  reviewCount?: number | null          // total Google review count
  trustBadges?: TrustBadge[]           // detected and confidence-scored
  bbbDetected?: boolean                // explicit BBB badge presence
  partnerBadges?: string[]             // normalized list: ["Angi", "HomeAdvisor", ...]
  confidenceScores?: Partial<Record<keyof BrandKit, ExtractionConfidence>>
  extractionSources?: ExtractionSource[]   // which sources contributed
  // --- Brief #6 P0 #3: server-generated QR code image ---
  // Populated by brand_kit._scrape_job / update_brand_kit / mock_scrape
  // whenever websiteUrl or phone is present. Null when neither yields a
  // usable QR target (very rare — phone is a required brand kit field).
  // Filename is content-hashed (qr-<sha256[:12]>.png) so prior QRs remain
  // on disk when the brand kit changes.
  qrCodeImageUrl?: string | null           // e.g. "/media/brand-photos/{orgId}/qr-<hash>.png"
}

// ============================================================
// TEMPLATE SYSTEM
// ============================================================

export interface TemplateDefinition {
  id: string
  layoutType: TemplateLayoutType
  name: string                         // "Full-Bleed Photo"
  description: string
  cardPosition: CardPurpose            // which card in sequence this template is for
  bestFor: CampaignGoalType[]          // which goals this template works best with
  contentSlots: {
    headline: { maxChars: number; placeholder: string }
    offerText: { maxChars: number; placeholder: string }
    reviewQuote: { maxChars: number; placeholder: string }
    urgencyText: { maxChars: number; placeholder: string }
    riskReversal: { maxChars: number; placeholder: string }
  }
  previewImageUrl: string              // static preview for template browser
}

// ============================================================
// MAIL CAMPAIGN (approved, in-flight or completed)
// ============================================================
// NAMING: The existing codebase has a `Campaign` model for analytics
// batch grouping (src/api/campaigns.ts, app/models.py). These direct
// mail campaign types are named `MailCampaign` to avoid collision.
// Server model: `MailCampaign` (tablename: `mail_campaigns`).
// UI labels still say "Campaign" — customers don't see type names.
// The existing Campaign/useCampaignStore stays UNTOUCHED.

export type MailCampaignStatus =
  | 'draft'
  | 'approved'
  | 'printing'
  | 'in_transit'
  | 'delivered'
  | 'results_ready'
  | 'completed'
  | 'paused'

export interface MailCampaign {
  id: string
  orgId: string
  name: string
  status: MailCampaignStatus
  goalType: CampaignGoalType
  serviceType: string | null
  sequenceLength: number
  householdCount: number
  totalCost: number
  totalSpent: number
  cards: MailCampaignCard[]
  createdAt: string
  updatedAt: string
}

export interface MailCampaignCard {
  cardNumber: number
  status: 'pending' | 'printing' | 'in_transit' | 'delivered'
  scheduledDate: string
  estimatedDeliveryDate: string | null
  actualSentDate: string | null
  cost: number
  previewImageUrl: string
}

// ============================================================
// PER-CARD PRICING
// Keys match PlanCode from @/api/billing (INSIGHT/PERFORMANCE/PRECISION/ELITE)
// Display names are in @/config/plans.ts (Starter/Basic/Pro/Ultimate)
// ============================================================

export const PRICING = {
  payPerSend: 0.69,       // no subscription
  INSIGHT: 0.59,          // Starter ($99/mo)
  PERFORMANCE: 0.52,      // Basic ($249/mo)
  PRECISION: 0.45,        // Pro ($499/mo)
  ELITE: 0.42,            // Ultimate ($999/mo)
} as const

export type PricingTier = keyof typeof PRICING

# Coding Brief #0: Prerequisites (Shared Infrastructure)

> **Owner:** Any Claude terminal (build before terminals start)
> **Branch from:** `main` (multi-user merged)
> **Branch name:** `feat/campaign-prerequisites`
> **Estimated scope:** ~15 new files, ~5 modified files
> **Round 1 rule:** Frontend with mock data. No real Melissa Data, print shops, or per-card billing.

---

## What This Brief Builds

Shared infrastructure that all 3 terminals depend on. After this brief is complete, a working wizard shell exists with stub steps that you can click through end-to-end. Each terminal brief then replaces stubs with real implementations.

**Produces:**
1. Shared TypeScript interfaces (data contracts for all terminals)
2. Campaign draft Pinia store (wizard state management)
3. Brand kit Pinia store + server model/endpoints
4. AI generation service interface (server, mocked for Round 1)
5. Wizard shell component + layout + routing
6. Step stub components (4 stubs, one per wizard step)
7. Smart onboarding modal update (4 questions)
8. "+ Send Postcards" button in navbar
9. Server: draft persistence endpoints
10. Template type definitions (JSON schemas for 6 layouts)

---

## Codebase Patterns (MUST follow — non-negotiable)

### Client (Vue 3)
- **TypeScript strict mode:** `tsconfig.app.json` has `noUnusedLocals: true`. Every import must be used. Type-only imports use `import type { X }`. Stub components must not import types they don't reference.
- `<script setup lang="ts">` with Composition API
- Pinia stores: `defineStore("name", { state, getters, actions })`
- API calls: use helpers from `src/api/http.ts` (`get`, `postJson`, `putJson`, `del_`)
- Auth API uses native `fetch()` in `src/api/auth.ts` (separate from axios)
- Components: `<style scoped>`, feature-grouped folders under `src/components/`
- Pages: `src/pages/`
- Types: inline in API files OR `src/types/` for shared interfaces
- Modals: store-driven open/close, `<Teleport to="body">`, Escape to close
- Org context: `auth.orgId` for current org, all API calls scoped by org via session cookie
- Naive UI: minimally used (only `useMessage`). Build custom components.
- CSS: Tailwind 4.1 classes + CSS variables from `src/styles/index.css`
- Font: "Instrument Sans" (already loaded)

### Server (Flask)
- Blueprints in `app/blueprints/` — `bp = Blueprint("name", __name__, url_prefix="/prefix")`
- Services in `app/services/` — module-level functions (not classes)
- DAOs in `app/dao/` — thin data access functions, return `dict` not ORM objects
- Models in `app/models.py` — UUID PK, `created_at`/`updated_at` timestamps, `org_id` FK
- Auth: `_uid()` gets `user_id` from session, `_org_id()` gets `org_id` from session
- **WARNING: `_oid()` fallback.** In edge cases, `_oid()` falls back to `session['org_id'] = user_id`. This is a user UUID, not an org UUID. New blueprints should validate that `_oid()` returns a valid org by checking `Organization.query.get(org_id)` is not None before using it in FK-constrained inserts.
- Every new table: `org_id` FK to `organizations.id` with CASCADE + index
- Every query: filter by `org_id` — no exceptions
- Errors: raise `APIError` subclasses from `app/errors.py`
- Background jobs: `ThreadPoolExecutor(max_workers=1)` with `app.app_context()`
- Config: env vars in `app/config.py`
- Migrations: Alembic, date-based naming, include upgrade + downgrade

### CI Pipeline (added 2026-03-25 — PRs to main MUST pass)
- `ruff check app/ tests/` — linting
- `black --check app/ tests/` — formatting
- `mypy app/ --ignore-missing-imports` — type checking
- `pytest tests/ -v --tb=short` — tests (against Postgres 16)
- Run `black app/ tests/ && ruff check app/ tests/ --fix` locally before committing server code
- All new Python files must have type hints on function signatures

### Existing Config to Import (not redefine)
- `PlanCode` type: import from `@/api/billing` (`"INSIGHT" | "PERFORMANCE" | "PRECISION" | "ELITE"`)
- `PLAN_DISPLAY_DETAILS`: import from `@/config/plans.ts` for plan names, prices, and limits
- `getUsageSnapshot()`: import from `@/api/billing` for current usage vs tier limit

---

## File List

### New Files — Client

| File | Purpose |
|------|---------|
| `src/types/campaign.ts` | ALL shared TypeScript interfaces (data contracts) |
| `src/stores/useCampaignDraftStore.ts` | Wizard state: goal, targeting, design, review, auto-save |
| `src/stores/useBrandKitStore.ts` | Brand elements: logo, colors, photos, phone, reviews |
| `src/api/campaignDrafts.ts` | API calls for draft CRUD |
| `src/api/brandKit.ts` | API calls for brand kit CRUD |
| `src/layouts/WizardLayout.vue` | Full-page wizard layout (no sidebar, just progress bar + exit) |
| `src/components/wizard/WizardShell.vue` | 4-step wizard container with navigation |
| `src/components/wizard/WizardProgress.vue` | Progress bar with clickable completed steps |
| `src/components/wizard/StepGoalStub.vue` | Stub for Step 1 (Terminal 3 replaces) |
| `src/components/wizard/StepTargetingStub.vue` | Stub for Step 2 (Terminal 1 replaces) |
| `src/components/wizard/StepDesignStub.vue` | Stub for Step 3 (Terminal 2 replaces) |
| `src/components/wizard/StepReviewStub.vue` | Stub for Step 4 (Terminal 3 replaces) |
| `src/pages/SendWizard.vue` | Page wrapper for wizard route |
| `src/components/postcard/PostcardPreview.vue` | SHARED: renders a single postcard front or back (used by Terminal 2 + Terminal 3) |
| `src/components/postcard/PostcardFrontStub.vue` | Stub front renderer (colored rectangle + text). Terminal 2 replaces with real layout. |
| `src/components/postcard/PostcardBackStub.vue` | Stub back renderer. Terminal 2 replaces with real layout. |
| `src/pages/CampaignsStub.vue` | Stub campaigns list page ("Campaigns coming soon" + link to start new wizard). Terminal 3 replaces. |
| `src/pages/CampaignDetailStub.vue` | Stub campaign detail page ("Campaign details coming soon" + back link). Terminal 3 replaces. |

### New Files — Server

| File | Purpose |
|------|---------|
| `app/blueprints/campaign_drafts.py` | Draft CRUD endpoints |
| `app/services/campaign_drafts.py` | Draft business logic |
| `app/dao/campaign_drafts_dao.py` | Draft data access |
| `app/services/brand_kit.py` | Brand kit logic (scrape mock for Round 1) |
| `app/dao/brand_kit_dao.py` | Brand kit data access |
| `migrations/versions/20260325_add_campaign_drafts.py` | Draft + BrandKit tables + Organization field additions (business_name, location, service_types) |

> **NOTE (DHH override):** `ai_generation.py` removed from prerequisites. Terminal 2 creates it when
> they build the postcard generator — no point building an abstraction before we need it.

### Modified Files

| File | Change |
|------|--------|
| `src/router.ts` | Add wizard route, campaigns page route |
| `src/components/layout/Navbar.vue` | Add "+ Send Postcards" button |
| `src/components/OnboardingModal.vue` | Update to 4-question flow (name, location, services, website) |
| `app/__init__.py` | Register `campaign_drafts` and `brand_kit` blueprints |
| `app/models.py` | Add `CampaignDraft` and `BrandKit` models + add business_name/location/service_types to Organization |

---

## Data Contracts (`src/types/campaign.ts`)

This is the MOST IMPORTANT file. All 3 terminals import from here. Every interface must match the spec in `postcanary-v1-build-decisions.md`.

```typescript
// ============================================================
// API CONVENTION: The codebase uses snake_case directly in TypeScript
// (no camelCase transformation). New API files should follow this same
// pattern — use snake_case field names to match the server response.
// NOTE: The TypeScript interfaces in this file use camelCase for
// readability, but the API layer does NOT transform keys.
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
  homeowner: boolean | null            // null = any
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
    reviewQuote?: string
    reviewerName?: string
    urgencyText?: string
    riskReversal?: string
    photoUrl?: string
  }
  resolvedContent: {                   // template defaults + overrides merged
    headline: string
    offerText: string
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

export interface BrandKitPhoto {
  url: string
  qualityScore: number                 // 0-100
  source: 'website' | 'upload' | 'stock'
  alt: string
}

export interface BrandKitReview {
  quote: string                        // excerpted to <=35 words
  fullText: string
  reviewerName: string                 // first name + last initial only
  rating: number                       // 1-5
  source: string                       // "Google"
  reason: string                       // why this review was selected (Kennedy/Halbert)
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
  googleRating: number | null          // 1.0-5.0
  reviews: BrandKitReview[]
  certifications: string[]             // ["Licensed & Insured", "BBB A+", "NATE Certified"]
  currentOffers: string[]              // scraped from website
  guarantees: string[]                 // scraped from website
  yearsInBusiness: number | null
  industry: string | null
  serviceTypes: string[]               // ["AC Repair", "Heating", "Duct Cleaning"]
  scrapeStatus: 'pending' | 'complete' | 'partial' | 'failed' | 'skipped'
  completenessPercent: number          // 0-100
  updatedAt: string
}

// ============================================================
// INDUSTRY NORMALIZATION
// ============================================================
// Existing users have free-text `industry` values (e.g., 'plumbing',
// 'HVAC', 'carpet cleaning'). The brand kit's `getPhotosForIndustry()`
// and targeting smart defaults expect enum values. Add a
// `normalizeIndustry(raw: string): Industry | null` helper that maps
// common free-text values to the enum. Fallback to null (use generic
// defaults) for unrecognized values.

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
```

---

## Campaign Draft Store (`src/stores/useCampaignDraftStore.ts`)

Central wizard state. ALL wizard steps read from and write to this store.

```typescript
// Key behaviors:
// - Auto-save strategy: save on STEP COMPLETION + EXIT + 5-second idle debounce
//   (not on every keystroke — reduces server load, still prevents data loss)
// - Step completion: track which steps have valid data
// - Goal change handling: flag later steps as "needs review", don't wipe
// - Draft resume: load from server by draftId on wizard mount
// - New draft: create on first wizard entry, get back UUID

import { defineStore } from 'pinia'
import type {
  CampaignDraft, WizardStep, GoalSelection,
  TargetingSelection, DesignSelection, ReviewSelection,
  CampaignGoalType
} from '@/types/campaign'
import { GOAL_DEFAULTS } from '@/types/campaign'  // runtime value, NOT type-only import
import { saveDraft, loadDraft, createDraft, deleteDraft } from '@/api/campaignDrafts'

// Module-level — NOT in Pinia state (avoids HMR/serialization issues)
let _saveTimer: ReturnType<typeof setTimeout> | null = null
let _pendingSave = false
let _retryCount = 0
const MAX_RETRIES = 3

export const useCampaignDraftStore = defineStore('campaignDraft', {
  state: () => ({
    draft: null as CampaignDraft | null,
    saving: false,
    loading: false,
    error: null as string | null,           // error state for failed API calls
    lastSavedAt: null as string | null,
  }),

  getters: {
    currentStep: (state) => state.draft?.currentStep ?? 1,
    isStepComplete: (state) => (step: WizardStep) =>
      state.draft?.completedSteps.includes(step) ?? false,
    needsReview: (state) => (step: WizardStep) =>
      state.draft?.needsReviewSteps.includes(step) ?? false,
    canProceed: (state) => (step: WizardStep) => {
      // Can proceed if current step is complete
      if (!state.draft) return false
      return state.draft.completedSteps.includes(step)
    },
    progressPercent: (state) => {
      if (!state.draft) return 0
      return (state.draft.completedSteps.length / 4) * 100
    },
  },

  actions: {
    // --- Lifecycle ---
    async startNew() {
      // Creates a new draft on server, returns UUID
      this.loading = true
      this.error = null
      try {
        const draft = await createDraft()
        this.draft = draft
      } catch (e: any) {
        this.error = 'Failed to start campaign. Please try again.'
        throw e  // let SendWizard.vue catch and show error UI
      } finally {
        this.loading = false
      }
    },

    async resume(draftId: string) {
      // Loads existing draft from server
      this.loading = true
      this.error = null
      try {
        this.draft = await loadDraft(draftId)
      } catch (e: any) {
        this.error = 'Failed to load draft. Please try again.'
        throw e
      } finally {
        this.loading = false
      }
    },

    async discard() {
      if (this.draft) {
        await deleteDraft(this.draft.id)
        this.draft = null
      }
    },

    // --- Step Updates ---
    setGoal(goal: GoalSelection) {
      if (!this.draft) return
      const goalChanged = this.draft.goal?.goalType !== goal.goalType
      this.draft.goal = goal
      this._markComplete(1)

      if (goalChanged && this.draft.completedSteps.length > 1) {
        // Flag later steps for review but DON'T wipe data
        this.draft.needsReviewSteps = [2, 3].filter(
          s => this.draft!.completedSteps.includes(s as WizardStep)
        ) as WizardStep[]
      }
      this._debounceSave()
    },

    setTargeting(targeting: TargetingSelection) {
      if (!this.draft) return
      this.draft.targeting = targeting
      this._markComplete(2)
      this._clearReview(2)
      // Flag Step 3 for review if it's already complete (recipient breakdown may have changed → messaging tone)
      if (this.draft.completedSteps.includes(3 as WizardStep)) {
        if (!this.draft.needsReviewSteps.includes(3 as WizardStep)) {
          this.draft.needsReviewSteps.push(3 as WizardStep)
        }
      }
      this._debounceSave()
    },

    setDesign(design: DesignSelection) {
      if (!this.draft) return
      this.draft.design = design
      this._markComplete(3)
      this._clearReview(3)
      this._debounceSave()
    },

    setReview(review: ReviewSelection) {
      if (!this.draft) return
      this.draft.review = review
      this._markComplete(4)
      this._debounceSave()
    },

    goToStep(step: WizardStep) {
      if (!this.draft) return
      // Can go to any completed step or the next incomplete one
      const maxStep = Math.min(
        Math.max(...this.draft.completedSteps, 0) + 1, 4
      ) as WizardStep
      if (step <= maxStep) {
        this.draft.currentStep = step
      }
    },

    // --- Internal ---
    _markComplete(step: WizardStep) {
      if (!this.draft) return
      if (!this.draft.completedSteps.includes(step)) {
        this.draft.completedSteps.push(step)
        this.draft.completedSteps.sort()
      }
    },

    _clearReview(step: WizardStep) {
      if (!this.draft) return
      this.draft.needsReviewSteps = this.draft.needsReviewSteps
        .filter(s => s !== step)
    },

    _debounceSave() {
      if (_saveTimer) clearTimeout(_saveTimer)
      _saveTimer = setTimeout(() => this._save(), 5000)
    },

    async _save() {
      if (!this.draft) return
      if (this.saving) {
        // Save already in-flight — queue another after it finishes
        _pendingSave = true
        return
      }
      this.saving = true
      try {
        await saveDraft(this.draft)
        this.lastSavedAt = new Date().toISOString()
        this.error = null  // clear any previous save error
        _retryCount = 0    // reset retry counter on success
      } catch (e: any) {
        this.error = 'Save failed — retrying...'
        // Retry with exponential backoff, max 3 attempts
        if (_retryCount < MAX_RETRIES) {
          _retryCount++
          setTimeout(() => this._save(), 10000 * _retryCount) // exponential backoff
        } else {
          this.error = 'Unable to save. Your work may be lost if you leave this page.'
          // Do NOT trigger _pendingSave chain after max retries exhausted
          _pendingSave = false
        }
      } finally {
        this.saving = false
        // If another save was queued while this one was running, fire it now
        // (only if we didn't exhaust retries)
        if (_pendingSave) {
          _pendingSave = false
          await this._save()
        }
      }
    },

    // Force immediate save (on step completion, exit, beforeunload)
    async saveNow() {
      if (_saveTimer) clearTimeout(_saveTimer)
      await this._save()
    },
  },
})
```

---

## Execution Protocol (non-negotiable during build)

1. **Before each task:** Re-read the task description from this brief. Don't work from memory.
2. **During each task:** Follow the brief exactly. If something in the brief seems wrong or needs changing, STOP and note it — don't silently deviate.
3. **After each task:** Verify the output matches the brief. Check: correct file path? Correct field names? Correct types? All edge cases from the brief handled?
4. **After each phase:** Run code-reviewer agent against the phase's new files.
5. **After the full brief:** Run verification-before-completion skill. Then checkpoint with Drake.
6. **If context compresses mid-build:** Re-read this brief and the task list to restore context. Don't guess.

---

## Build Strategy Note

**Build order: server first, then client.** Tasks 5-9 (server models, DAOs, services, endpoints)
should be built BEFORE Tasks 2-4 (client API layer and stores). This way the client talks to real
endpoints from the start — no temporary mocks needed. Run the server locally with Docker before
starting client work.

If Docker is unavailable, the client CAN be built first using the Vite dev server (`npm run dev`),
but API calls will 404. In that case, add temporary mock responses in the API files and remove them
once the server is ready.

---

## Build Order (implement in this sequence)

### Phase 1: Types (no dependencies)

**Task 1: Create shared types**
- Create `src/types/campaign.ts` with ALL interfaces above
- Verify every field matches `postcanary-v1-build-decisions.md`

**Task 2: Create campaign draft API layer**
- Create `src/api/campaignDrafts.ts`:
  - `createDraft(): Promise<CampaignDraft>` — POST `/api/campaign-drafts`
  - `loadDraft(id: string): Promise<CampaignDraft>` — GET `/api/campaign-drafts/:id`
  - `saveDraft(draft: CampaignDraft): Promise<void>` — PUT `/api/campaign-drafts/:id`
  - `deleteDraft(id: string): Promise<void>` — DELETE `/api/campaign-drafts/:id`
  - `listDrafts(): Promise<CampaignDraft[]>` — GET `/api/campaign-drafts`

**Task 3: Create brand kit API layer**
- Create `src/api/brandKit.ts`:
  - `getBrandKit(): Promise<BrandKit>` — GET `/api/brand-kit`
  - `updateBrandKit(data: Partial<BrandKit>): Promise<BrandKit>` — PUT `/api/brand-kit`
  - `triggerScrape(url: string): Promise<void>` — POST `/api/brand-kit/scrape`

**Task 4: Create Pinia stores**
- `src/stores/useCampaignDraftStore.ts` (full implementation above)
- `src/stores/useBrandKitStore.ts`:
  - State: `brandKit: BrandKit | null`, `loading`, `hydrated`, `error: string | null`
  - Actions: `fetch()`, `update(partial)`, `triggerScrape(url)` — all with try/catch setting error state
  - Getter: `isComplete` (completenessPercent >= 80)
  - Error handling: if fetch fails, set error message. UI shows "Couldn't load your brand info — try again" with retry button.

### Phase 2: Server — Models + Endpoints

**Task 5: Add models and extend Organization model**

**5a. Add new columns to the existing `Organization` model** (for onboarding data):
```python
# ADD to existing Organization model in app/models.py:
# These are org-level fields, NOT user-level — one user can belong to multiple orgs.
business_name = db.Column(db.String, nullable=True)        # "Martinez Plumbing"
location = db.Column(db.String, nullable=True)              # "Scottsdale, AZ"
service_types = db.Column(ARRAY(sa.Text), nullable=True)   # ["AC Repair", "Heating"]
```
These are nullable so existing orgs aren't broken. The onboarding modal populates them on the current org.
Also update `app/services/organizations.py` and relevant API endpoints to include these fields
in the org read/write. The onboarding modal saves these to `auth.orgId`'s organization, not the user.

**5b. Add new models:**
```python
class CampaignDraft(Model):
    __tablename__ = "campaign_drafts"

    id = db.Column(UUID(as_uuid=True), primary_key=True,
                   server_default=text("gen_random_uuid()"), nullable=False)
    org_id = db.Column(UUID(as_uuid=True),
                       ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    # SET NULL not CASCADE — drafts are shared org resources. Deleting a user should NOT delete their drafts.
    created_by = db.Column(UUID(as_uuid=True),
                           ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    current_step = db.Column(db.Integer, nullable=False, default=1)
    completed_steps = db.Column(ARRAY(db.Integer), nullable=False,
                                server_default=text("'{}'::integer[]"))
    needs_review_steps = db.Column(ARRAY(db.Integer), nullable=False,
                                   server_default=text("'{}'::integer[]"))
    data = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    schema_version = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime(timezone=True),
                           server_default=func.now(), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True),
                           server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_campaign_drafts_org", "org_id"),
        Index("idx_campaign_drafts_creator", "created_by"),
    )


class BrandKit(Model):
    __tablename__ = "brand_kits"

    id = db.Column(UUID(as_uuid=True), primary_key=True,
                   server_default=text("gen_random_uuid()"), nullable=False)
    org_id = db.Column(UUID(as_uuid=True),
                       ForeignKey("organizations.id", ondelete="CASCADE"),
                       nullable=False, unique=True)  # one brand kit per org
    data = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    scrape_status = db.Column(db.String, nullable=False, default="pending")
    created_at = db.Column(db.DateTime(timezone=True),
                           server_default=func.now(), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True),
                           server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_brand_kits_org", "org_id"),
    )
```

**Task 6: Create migration**
- `migrations/versions/20260325_add_campaign_drafts.py`
- Creates `campaign_drafts` and `brand_kits` tables

**Task 7: Create DAOs**
- `app/dao/campaign_drafts_dao.py`: `create()`, `get_by_id()`, `list_for_org()`, `update()`, `delete()`
- `app/dao/brand_kit_dao.py`: `get_for_org()`, `upsert()`, `update_scrape_status()`
- All functions take `org_id` parameter and filter by it

**Task 8: Create services**
- `app/services/campaign_drafts.py`: Thin wrappers calling DAOs + validation
- `app/services/brand_kit.py`:
  - `get_or_create(org_id)` — returns existing or creates empty brand kit
  - `populate_from_profile(org_id)` — reads from the Organization, not the User:
    ```python
    def populate_from_profile(org_id):
        org = Organization.query.get(org_id)
        # Read from org, not user
        brand_kit.business_name = org.business_name
        brand_kit.location = org.location
        brand_kit.service_types = org.service_types
        # industry comes from the user who completed onboarding
        # (passed separately or read from session)
    ```
    Called AFTER onboarding completion.
  - `update_from_scrape(org_id, scraped_data)` — merges scraped data INTO existing brand kit (doesn't overwrite profile data)
  - `mock_scrape(url)` — Round 1 mock: returns hardcoded extras (logo, photos, reviews, certifications). Merged with profile data by `update_from_scrape`.
  - **Data flow: onboarding completion → `populate_from_profile()` → `mock_scrape(url)` (background) → brand kit has both profile data and scraped data**
- ~~`app/services/ai_generation.py`~~ — **REMOVED (DHH override).** Terminal 2 creates this when they need it.

**Task 9: Create blueprint**
- `app/blueprints/campaign_drafts.py`:
  - `POST /api/campaign-drafts` — create new draft
  - `GET /api/campaign-drafts` — list drafts for org
  - `GET /api/campaign-drafts/<id>` — get single draft
  - `PUT /api/campaign-drafts/<id>` — update draft (JSONB merge)
  - `DELETE /api/campaign-drafts/<id>` — delete draft
- `app/blueprints/brand_kit.py`:
  ```python
  # In app/blueprints/brand_kit.py:
  brand_kit_bp = Blueprint("brand_kit", __name__, url_prefix="/api/brand-kit")
  ```
  - `GET /api/brand-kit` — get org's brand kit
  - `PUT /api/brand-kit` — update brand kit (using PUT, not PATCH — no patchJson helper in http.ts)
  - `POST /api/brand-kit/scrape` — trigger website scrape (mock for Round 1)
- Register both in `app/__init__.py`:
  ```python
  # In app/__init__.py, add:
  from .blueprints.brand_kit import brand_kit_bp
  app.register_blueprint(brand_kit_bp)
  ```

### Phase 3: Wizard UI

**Task 10: Create WizardLayout**
- `src/layouts/WizardLayout.vue`:
  - Full viewport, no sidebar, white background
  - Top bar: PostCanary logo (left), progress indicator (center), X close button (right)
  - Close button saves draft and navigates to `/app/campaigns` (or back to previous page)
  - `<router-view />` for wizard content

**Task 11: Create WizardProgress**
- `src/components/wizard/WizardProgress.vue`:
  - 4 steps with labels: "Choose Your Goal" | "Pick Your Neighborhood" | "Your Postcard" | "Review & Send"
  - Clickable completed steps (jump back without losing data)
  - Current step highlighted (teal)
  - Completed steps show checkmark
  - "Almost there — 75% done" text after Step 3
  - Time estimates on each step for first-timers: "30 sec" | "1 min" | "2 min" | "1 min" (Cialdini: removes "how long is this?" anxiety)
  - Reads from `useCampaignDraftStore`

**Task 12: Create Step Stubs (BEFORE WizardShell — it imports these)**
Each stub is a simple form that sets mock data in the draft store, allowing other steps to work.

- `StepGoalStub.vue`: Radio buttons for goal types, sequence length dropdown. Sets `draft.goal`.
- `StepTargetingStub.vue`: Text input for household count, cost auto-calculates. Sets `draft.targeting` with mock data. **MUST populate `recipientBreakdown`** (Terminal 2 depends on it): `{ newProspects: count * 0.93, pastCustomers: count * 0.07, pastCustomersIncluded: false }`.
- `StepDesignStub.vue`: Shows placeholder postcard image, "approve" button. Sets `draft.design` with mock data.
- `StepReviewStub.vue`: Shows summary of all steps, "Approve & Send" button. Sets `draft.review`.

**Task 13: Create WizardShell**
- `src/components/wizard/WizardShell.vue`:
  - Renders current step component based on `draft.currentStep`
  - Uses `v-if` for each step (not dynamic components — keeps it simple):
    ```vue
    <StepGoal v-if="currentStep === 1" />
    <StepTargeting v-if="currentStep === 2" />
    <StepDesign v-if="currentStep === 3" />
    <StepReview v-if="currentStep === 4" />
    ```
  - Initially imports STUB components. Terminals replace with real ones.
  - "Back" and "Next" buttons at bottom
  - "Next" validates current step data before proceeding
  - "Back" goes to previous step
  - Loading overlay between steps (show previous step underneath)

  **Exit behavior (Cialdini — loss aversion):**
  - X button force-saves draft, then shows brief toast: "Your progress is saved — pick up where you left off anytime"
  - Navigates to `/app/campaigns` (where they can see their draft)
  - No "are you sure?" modal — auto-save makes it unnecessary

  **Browser edge cases (Hendrickson QA):**
  - `beforeunload` handler: force-save draft if there are unsaved changes
  - Browser back button: `popstate` handler goes to previous wizard step (not out of wizard)
  - Auto-save failure: show subtle inline indicator "Save failed — retrying..." with exponential backoff (10s, 20s, 30s), max 3 retries. After 3 failures, show "Unable to save. Your work may be lost if you leave this page." Never lose work silently.
  - Two tabs on same draft: `schemaVersion` field prevents stale overwrites (warn on conflict)

**Task 14: Mobile gate for wizard**
- In `WizardLayout.vue` or `SendWizard.vue`: if viewport width < 768px, show a centered message instead of the wizard:
  - "The postcard designer works best on a computer."
  - "Open PostCanary on your laptop to create and send postcards."
  - [Go Back] button → navigates to previous page
- Use `window.innerWidth` check on mount (or Tailwind `md:` breakpoint)
- Don't load the wizard components at all on mobile — just the message

**Task 15: Create SendWizard page + routing**
- `src/pages/SendWizard.vue`:
  - On mount: check `auth.profileComplete`. If false, redirect to `/app/dashboard` (MainLayout will show the onboarding modal):
    ```typescript
    // On mount: check profile is complete
    if (!auth.profileComplete) {
      router.replace('/app/dashboard') // MainLayout will show onboarding modal
      return
    }
    ```
    Note: WizardLayout does NOT render OnboardingModal. Must redirect to MainLayout if onboarding is incomplete.
  - Then check `auth.orgId` exists. If null, show error: "Please complete setup first." (edge case: user without org)
  - Check route params for `draftId`
  - If `draftId`: call `draftStore.resume(draftId)`
  - If no `draftId`: call `draftStore.startNew()`, then **`router.replace('/app/send/' + draft.id)`** to update the URL with the new draft ID. This prevents duplicate drafts on page refresh.
  - Wrap in try/catch: if API fails, show error state with "Try Again" button (not infinite spinner)
  - While loading: show centered spinner with "Setting up your campaign..."
  - Renders `<WizardShell />` only when `draftStore.draft` is loaded
- Add to `src/router.ts` as a **TOP-LEVEL route** (NOT inside the `/app` children array):
  ```typescript
  // Add this OUTSIDE the MainLayout route group, as a sibling:
  {
    path: '/app/send/:draftId?',
    component: () => import('@/layouts/WizardLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('@/pages/SendWizard.vue'),
        meta: { title: 'Send Postcards' },
      },
    ],
  },
  ```
- This goes at the SAME level as the MainLayout and MarketingLayout route groups
- Add BEFORE the catch-all `/:pathMatch(.*)*` redirect. Place as a TOP-LEVEL route (peer of `/app`, not inside its children), using WizardLayout.
- NOT inside the existing `/app` children — the wizard uses WizardLayout (no sidebar)
- The existing `/app` routes with MainLayout stay untouched

  **Also add campaign routes inside the existing `/app` children (MainLayout):**
  ```typescript
  { path: 'campaigns', component: () => import('@/pages/CampaignsStub.vue'), meta: { title: 'Campaigns' } },
  { path: 'campaigns/:id', component: () => import('@/pages/CampaignDetailStub.vue'), meta: { title: 'Campaign Detail' } },
  ```
  These use STUB page components since the actual `Campaigns.vue` and `CampaignDetail.vue` pages
  aren't built until Terminal 3. Terminal 3 replaces these stubs with real implementations.

### Phase 4: Nav Entry Point + Onboarding

**Task 15: Add "+ Send Postcards" button to Navbar**
- Modify `src/components/layout/Navbar.vue`:
  - Add teal button: "+ Send Postcards"
  - Style: `bg-[#47bfa9] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#3aa893]`
  - `@click` navigates to `/app/send` (starts new wizard)
  - Position: prominent, near top of nav actions

**Task 16: Update OnboardingModal**
- Modify `src/components/OnboardingModal.vue`:
  - Step 1: Your name (full_name, text input, pre-fill from User profile) + Business name (text input, saves to Organization, pre-fill from org if available)
  - Step 2: Location (city/state or ZIP, auto-detect from browser geolocation if allowed)
  - Step 3: Services offered — industry selector (HVAC, Plumbing, Roofing, Cleaning, Electrical, Pest Control, Landscaping, Other) + sub-category checkboxes
  - Step 4: Website URL (optional, "skip if no website" link)
  - On completion: save business_name/location/service_types to Organization (via `auth.orgId`), save industry to User profile, then trigger brand kit scrape in background
  - If dismissed: returns next login until completed (existing pattern)
  - Progress dots: 4 dots at bottom
  - Copy (Wiebe voice): "Let's get you set up — 60 seconds"

---

## Mock Data (Round 1)

### Mock Brand Kit (returned by `/api/brand-kit` before real scraping exists)
```json
{
  "businessName": "Martinez Plumbing",
  "location": "Scottsdale, AZ",
  "address": "7420 E Camelback Rd, Scottsdale, AZ 85251",
  "phone": "(480) 555-0123",
  "websiteUrl": "martinezplumbing.com",
  "logoUrl": null,
  "brandColors": ["#1e3a5f", "#e8491d", "#f5f5f5"],
  "photos": [],
  "googleRating": 4.8,
  "reviews": [{
    "quote": "Carlos fixed our emergency leak in 45 minutes. Professional, clean, and fair price.",
    "reviewerName": "Sarah M.",
    "rating": 5,
    "source": "Google",
    "reason": "Specific details (emergency, 45 minutes, professional) build trust for cold prospects"
  }],
  "certifications": ["Licensed & Insured", "BBB A+"],
  "currentOffers": ["$49 Drain Clearing"],
  "guarantees": ["Free estimates", "No trip charge", "Satisfaction guaranteed"],
  "yearsInBusiness": 12,
  "industry": "plumbing",
  "serviceTypes": ["Emergency Repair", "Drain Clearing", "Water Heater", "Repiping"],
  "scrapeStatus": "complete",
  "completenessPercent": 85
}
```

### Mock Household Count Logic (no Melissa Data)
- Estimate ~500 households per square mile (suburban)
- Circle: `π × r² × 500`
- Rectangle: `width × height × 500`
- ZIP code: use rough estimates (15,000-25,000 per ZIP)
- Apply filter reductions: homeowner filter reduces by ~30%, property type reduces by ~20%

### Mock AI Generation (no real API calls in Round 1)
Return pre-written options. Example headlines for plumber + neighbor marketing:
1. "Your Neighbor at [Street] Just Called Us"
2. "Attention Scottsdale Homeowners:"
3. "Is Your Water Heater Ready for Summer?"

---

## Expert Checkpoints

| After Task | Expert | Check |
|-----------|--------|-------|
| Task 1 (types) | Beck | Are interfaces minimal but complete? Can each terminal work against them independently? |
| Task 5 (models) | Kerstiens | Indexes correct? org_id on everything? JSONB for draft data (flexible)? |
| Task 5 (models) | Hunt | org_id isolation enforced? Draft data can't leak across orgs? |
| Task 9 (endpoints) | Ronacher | Follow existing blueprint patterns? Error handling consistent? |
| Task 12 (wizard shell) | Krug | Is the flow obvious? Can Bob figure out Back/Next without help? |
| Task 12 (wizard shell) | Norman | What happens if they close the tab? (Auto-save.) What if they hit Back in browser? (Goes to previous step.) |
| Task 16 (onboarding) | Hulick | Is it genuinely 60 seconds? Does every question feel necessary? |
| Task 16 (onboarding) | DHH | Are we asking the MINIMUM needed? Could we ask fewer questions? |

---

## Done Criteria

- [ ] All TypeScript interfaces compile with no errors
- [ ] Campaign draft store creates, saves, loads, and deletes drafts via API
- [ ] Brand kit store loads and displays brand data
- [ ] Wizard opens from "+ Send Postcards" button
- [ ] Wizard shows 4 steps with stubs — can click through all 4
- [ ] Progress bar updates as steps complete
- [ ] Back button works, clicking completed steps jumps back
- [ ] Closing wizard saves draft and returns to app
- [ ] Draft appears in API response for `GET /api/campaign-drafts`
- [ ] Onboarding modal asks 4 questions and saves answers
- [ ] Server endpoints return correct data with org_id scoping
- [ ] No TypeScript errors, no console errors
- [ ] A fresh terminal can open the wizard and click through to Step 4 with stub data

---

## Important Notes

### Draft Permissions (Hunt review)
- All org members can see and edit any draft (shared workspace resource)
- Only the draft creator, org owners, and admins can DELETE a draft
- Draft endpoints must check `org_id` — a member of org A cannot see org B's drafts
- The `created_by` field on the server model tracks who made the draft

### Onboarding Modal — Existing Users (FINAL DECISION)
- **Existing users: NO re-onboarding modal.** The `compute_profile_complete()` logic uses an OR strategy so old completions remain valid.
- Missing fields (location, services) are collected **in-context inside the campaign wizard** when they first click "+ Send Postcards." Terminal 3's `StepGoal.vue` handles this: if `brandKit.location` is null, show inline prompt before goal cards.
- **New users only:** Full 4-screen onboarding modal on first login.
- On completion: save org-level fields (business_name, location, service_types) to Organization, save industry to User → call `brand_kit.populate_from_profile(org_id)` → trigger mock scrape in background

### profile_complete Logic (CRITICAL — do not break existing users)
```python
def compute_profile_complete(user, org=None):
    # Old formula: existing users who completed old onboarding stay complete
    old_complete = bool(user.industry and user.crm and user.mail_provider and user.website_url)
    # New formula: new users complete via simplified onboarding
    new_complete = bool(user.industry and org and org.location) if org else False
    return old_complete or new_complete
```
**CRITICAL: existing users must NOT see the onboarding modal again. The OR strategy ensures old completions remain valid.** Never change this to only use the new formula — that would lock out every existing user.

### PostcardPreview Is a Shared Component
- Lives in `src/components/postcard/` — NOT inside Terminal 2's `design/` folder
- Terminal 2 replaces the stub renderers (PostcardFrontStub → PostcardFront, PostcardBackStub → PostcardBack)
- Terminal 3 imports PostcardPreview for Step 4 review — no dependency on Terminal 2 being done first
- The Preview wrapper handles size modes (thumbnail vs large) and front/back flip

---

## Codebase Guardian Rules (follow during EVERY task)

Before modifying an existing file, ALWAYS:
1. Read the entire file first
2. `grep -r "import.*from.*filename"` to find all consumers
3. Verify the change won't break any consumer

Before creating a new file, ALWAYS:
1. `grep -r "NewModelName\|new_table_name"` to check for name collisions
2. Verify no existing file uses the same component/store/model name

After every task:
1. Verify the app compiles (`npm run build` or TypeScript check)
2. Emma test: "Did this break anything for existing users?"

---

## What This Brief Does NOT Build

- Real targeting map (Terminal 1)
- Real postcard designer (Terminal 2)
- Real goal selection UI with recommendations (Terminal 3)
- Real review & send with scheduling (Terminal 3)
- Campaigns list page (Terminal 3)
- Campaign detail page (Terminal 3)
- Home page (Round 2)
- Sidebar redesign (Round 2)
- Real Melissa Data integration
- Real print shop integration
- Real per-card billing
- Real website scraping (Playwright)
- Real AI generation calls
- Notification system
- Churn prevention flow

---

## Terminal Merge Order (prevents shared file conflicts)

When all terminals are built, merge in this order:
1. **Prerequisites** → main (first, establishes the foundation)
2. **Terminal 3** (Campaign Builder) → main (adds Step 1 + Step 4, rebase on main first)
3. **Terminal 1** (Map & Targeting) → main (adds Step 2, rebase on main first)
4. **Terminal 2** (Design Studio) → main (adds Step 3, rebase on main first)

Each merge updates `WizardShell.vue` imports (one stub → real component). By merging
one at a time and rebasing before each merge, WizardShell conflicts are minimal (only
the import line for that terminal's component changes).

**Shared files touched by multiple terminals:**
- `WizardShell.vue` — each terminal changes ONE import line. Merge one at a time.
- `src/types/campaign.ts` — terminals may add helper types. Keep additions at the bottom.
- `src/router.ts` — Prerequisites adds ALL routes. Terminals don't touch it.

**Merge conflict plan:** All 3 terminals modify WizardShell.vue import lines when replacing stubs. Merge order: Prerequisites → Terminal 3 → Terminal 1 → Terminal 2. Each terminal's PR will need manual conflict resolution on the import lines in WizardShell.vue.

---

## How Terminals Replace Stubs

When a terminal is ready to build its step:

1. Create the real step component (e.g., `src/components/wizard/StepTargeting.vue`)
2. In `WizardShell.vue`, change the import from `StepTargetingStub` to `StepTargeting`
3. The real component reads from and writes to the same `useCampaignDraftStore`
4. Data contracts don't change — the store interface is stable

Each terminal should create its step component in `src/components/wizard/` using the exact name:
- Terminal 1: `StepTargeting.vue`
- Terminal 2: `StepDesign.vue`
- Terminal 3: `StepGoal.vue` and `StepReview.vue`

# Coding Brief #3: Terminal 3 — Campaign Builder (Wizard Steps 1 + 4, Campaigns Page, Campaign Detail)

> **IMPORTANT:** For build order, follow the EXECUTION PLAN (`03-terminal-campaign-builder-execution-plan.md`)
> and the STRESS TEST FIXES (`03-terminal-campaign-builder-stress-test-fixes.md`).
> This brief provides component specs; the execution plan provides the correct build sequence.
> Where they conflict, the execution plan + stress test fixes win.
>
> **Owner:** Claude Terminal 3
> **Branch from:** `main` (after prerequisites merged) or `feat/campaign-prerequisites`
> **Branch name:** `feat/campaign-builder`
> **Depends on:** Brief #0 (Prerequisites) — shared types, draft store, wizard shell
> **Estimated scope:** ~20 new files, ~4 modified files
> **Round 1 rule:** Frontend with mock data. No real print shop API, no real USPS tracking, no real per-card billing. Campaign approval creates mock status progression.
> **CI requirement:** All server Python must pass `ruff check`, `black --check`, `mypy --ignore-missing-imports`, and `pytest`. Run `black app/ tests/ && ruff check app/ tests/ --fix` before committing. See Brief #0 for full CI details.
> **Import existing config:** Use `PlanCode` from `@/api/billing` and `PLAN_DISPLAY_DETAILS` from `@/config/plans.ts` — do NOT redefine plan names or pricing tiers.

---

## What This Terminal Builds

1. **Wizard Step 1: "Choose Your Goal"** — goal selection with campaign presets
2. **Wizard Step 4: "Review & Send"** — summary, scheduling, cost, approval
3. **Campaigns page** — list/manage all campaigns (active, drafts, completed, paused)
4. **Campaign Detail page** — KPIs, sequence progress, per-card status

This terminal owns the campaign LIFECYCLE — from goal selection through approval, tracking, and completion.

---

## DO NOT BUILD (belongs to other terminals or rounds)

- Wizard shell, progress bar, navigation (Brief #0)
- Step 2 targeting map (Terminal 1)
- Step 3 design studio (Terminal 2)
- Home page with recommendations (Round 2)
- Sidebar redesign (Round 2)
- Notification system — bell icon + emails (Round 2)
- Churn prevention / pause flow UI (Round 2)
- Billing / Stripe per-card charging (Round 2)
- Campaign strategy engine / recommendations (Round 2)
- Budget intelligence engine (Round 2)
- Analytics auto-integration — campaign → mail staging records (Round 2)
- PDF proof download (Round 2)
- Campaign comparison view (Round 2)

---

## File List

### New Files — Client

| File | Purpose |
|------|---------|
| `src/components/wizard/StepGoal.vue` | **Step 1** — goal selection, sequence config. Replaces StepGoalStub. |
| `src/components/wizard/StepReview.vue` | **Step 4** — summary, scheduling, cost, approve. Replaces StepReviewStub. |
| `src/components/goal/GoalCard.vue` | Single goal option card (icon, name, description, recommended badge) |
| `src/components/goal/SequenceConfig.vue` | Sequence length + spacing selectors (shown after goal pick) |
| `src/components/review/ReviewSummary.vue` | Left column: postcard previews (front/back, swipe through sequence) |
| `src/components/review/ReviewDetails.vue` | Right column: campaign name, schedule, cost, payment, approve button |
| `src/components/review/ScheduleEditor.vue` | Per-card date pickers, pre-filled from Step 1 spacing |
| `src/components/review/CostBreakdown.vue` | Per-card cost breakdown + total |
| `src/pages/Campaigns.vue` | Campaign list page (tabs: Active / Drafts / Completed / Paused) |
| `src/pages/CampaignDetail.vue` | Campaign detail page (KPIs, sequence progress, status timeline) |
| `src/components/campaigns/CampaignListCard.vue` | Single campaign card in list view |
| `src/components/campaigns/CampaignFilters.vue` | Search + sort + filter controls |
| `src/components/campaigns/CampaignStatusBadge.vue` | Status badge with colored indicator |
| `src/components/campaigns/CampaignKPICards.vue` | KPI cards for campaign detail page |
| `src/components/campaigns/SequenceTimeline.vue` | Visual per-card status timeline |
| `src/components/campaigns/CampaignActions.vue` | Action buttons: Pause/Resume, Run Again, Edit |
| `src/api/mailCampaigns.ts` | NEW file — MailCampaign API (list, get, approve, pause, resume, run-again). Do NOT touch existing `campaigns.ts`. |
| `src/data/campaignGoals.ts` | Goal definitions with metadata, defaults, icons |
| `src/composables/useCampaignList.ts` | Campaign list fetching, filtering, sorting |
| `src/composables/useCampaignDetail.ts` | Single campaign detail loading |

### Modified Files

| File | Change |
|------|--------|
| `src/components/wizard/WizardShell.vue` | Import `StepGoal` and `StepReview` instead of stubs |
| `src/router.ts` | Add `/app/campaigns` and `/app/campaigns/:id` routes |
| `src/components/layout/Navbar.vue` | Add "Postcards" link to nav (NOT "Campaigns" — avoids confusion with existing analytics campaign selector) |

### New Files — Server (Round 1 scope)

| File | Purpose |
|------|---------|
| `app/services/mail_campaign_lifecycle.py` | MailCampaign approval, status transitions, mock progression |
| `app/dao/mail_campaign_dao.py` | MailCampaign data access |
| `migrations/versions/20260325_add_mail_campaigns.py` | NEW `mail_campaigns` table (separate from existing `campaigns` table) |

> **NAMING (from stress test):** The existing `Campaign` model/table is for analytics batch grouping.
> The new direct mail campaign model is `MailCampaign` (tablename: `mail_campaigns`).
> The existing `Campaign`, `useCampaignStore`, and `/api/campaigns/` stay UNTOUCHED.
> New endpoints: `/api/mail-campaigns/`. New store: `useMailCampaignList` composable.
> UI still says "Campaign" to customers — this is purely a code naming distinction.

---

## Component Tree

### Step 1: Goal Selection
```
StepGoal.vue
├── GoalCard.vue (× 7 goals)
│   └── (icon, name, one-liner WHY, recommended badge)
└── SequenceConfig.vue (appears after goal selected)
    ├── Sequence length selector (1-5 cards)
    └── Spacing selector (1-4 weeks)
```

### Step 4: Review & Send
```
StepReview.vue
├── ReviewSummary.vue (left column)
│   └── PostcardPreview.vue (from src/components/postcard/ — shared, built by Prerequisites)
│       └── (front/back, swipe through sequence cards)
├── ReviewDetails.vue (right column)
│   ├── Campaign name (editable)
│   ├── ScheduleEditor.vue
│   │   └── (per-card date pickers)
│   ├── CostBreakdown.vue
│   │   └── (per-card cost + total)
│   ├── Campaign seeding toggle
│   ├── Payment method display
│   └── "Approve & Send Card 1" button
└── (reads all data from useCampaignDraftStore)
```

### Campaigns Page
```
Campaigns.vue
├── CampaignFilters.vue
│   ├── Search input
│   ├── Sort dropdown
│   └── Filter dropdowns (goal type, area, date range)
├── Tab bar (Active / Drafts / Completed / Paused — with counts)
└── CampaignListCard.vue (× N)
    ├── CampaignStatusBadge.vue
    ├── Campaign name, goal, household count, dates
    ├── Per-card progress indicator
    └── Action buttons (View / Resume / Pause / Run Again)
```

### Campaign Detail Page
```
CampaignDetail.vue
├── CampaignKPICards.vue
│   └── (households mailed, calls, revenue, spent — mock for Round 1)
├── SequenceTimeline.vue
│   └── (per-card visual: Approved → Printing → In Mail → Delivered)
│       └── PostcardPreview.vue (thumbnails per card)
├── Targeting summary (small map showing targeted area)
├── CampaignActions.vue
│   └── (Pause/Resume, Run Again, Edit unprinted cards)
└── Campaign timeline visual
```

---

## Build Order

### Phase 1: Goal Selection (Step 1)

**Task 1: Create goal definitions (`src/data/campaignGoals.ts`)**

```typescript
import type { CampaignGoalType, CampaignGoalDefaults, GOAL_DEFAULTS } from '@/types/campaign'

export interface GoalDefinition {
  type: CampaignGoalType
  label: string
  shortDescription: string
  icon: string   // icon name from vicons/ionicons5
  recommended: boolean   // changes based on user context
  seasonal: boolean      // only show in spring/fall
  displayPriority: 'primary' | 'more'  // top 3 vs under "More options"
  defaults: CampaignGoalDefaults
}

export const CAMPAIGN_GOALS: GoalDefinition[] = [
  {
    type: 'neighbor_marketing',
    label: 'Neighbor Marketing',
    shortDescription: 'Target neighbors of your recent jobs. They already see your truck in the driveway.',
    icon: 'PeopleOutline',
    recommended: true,
    seasonal: false,
    displayPriority: 'primary',
    defaults: GOAL_DEFAULTS.neighbor_marketing,
  },
  {
    type: 'target_area',
    label: 'Target an Area',
    shortDescription: 'Pick any neighborhood on the map. Great for expanding into new areas.',
    icon: 'MapOutline',
    recommended: false,
    seasonal: false,
    displayPriority: 'primary',
  },
  {
    type: 'seasonal_tuneup',
    label: 'Seasonal Tune-Up',
    shortDescription: 'Remind last year\'s customers it\'s time again — plus reach their neighbors.',
    icon: 'CalendarOutline',
    recommended: false, // set true in spring/fall
    seasonal: true,
    displayPriority: 'more', // promoted to 'primary' when in season by getGoalsForDisplay()
  },
  {
    type: 'storm_response',
    label: 'Storm Response',
    shortDescription: 'Reach affected homeowners fast. No frequency cap — this is urgent.',
    icon: 'ThunderstormOutline',
    recommended: false,
    seasonal: false,
    displayPriority: 'more',
  },
  {
    type: 'win_back',
    label: 'Win Back',
    shortDescription: 'Re-engage customers who haven\'t called in 12+ months.',
    icon: 'HeartOutline',
    recommended: false,
    seasonal: false,
    displayPriority: 'more',
  },
  {
    type: 'cross_service_promo',
    label: 'Cross-Service Promotion',
    shortDescription: 'Your heating customers might need AC too. Promote a different service.',
    icon: 'SwapHorizontalOutline',
    recommended: false,
    seasonal: false,
    displayPriority: 'more',
  },
  {
    type: 'new_mover',
    label: 'New Mover Welcome',
    shortDescription: 'Reach recent homebuyers in your area — they spend heavily in their first 2 years.',
    icon: 'HomeOutline',
    recommended: false,
    seasonal: false,
    displayPriority: 'more',
    // V1 PLACEHOLDER: show in list but mark "Coming Soon" — needs NCOA/Melissa new mover data
    comingSoon: true,
  },
  {
    type: 'other',
    label: 'Something Else',
    shortDescription: 'Tell us what you want to accomplish and we\'ll help set it up.',
    icon: 'CreateOutline',
    recommended: false,
    seasonal: false,
    displayPriority: 'more',
  },
]

// Seasonal logic: promote seasonal_tuneup to primary in March-May and Sept-Nov
export function getGoalsForDisplay(): { primary: GoalDefinition[]; more: GoalDefinition[] } {
  const month = new Date().getMonth() + 1 // 1-12
  const isInSeason = (month >= 3 && month <= 5) || (month >= 9 && month <= 11)

  const all = CAMPAIGN_GOALS.map(g => ({
    ...g,
    // Promote seasonal goals to primary when in season
    displayPriority: g.seasonal && isInSeason ? 'primary' as const : g.displayPriority,
  }))

  return {
    primary: all.filter(g => g.displayPriority === 'primary' && !g.comingSoon).slice(0, 3),
    more: all.filter(g => g.displayPriority === 'more' || g.comingSoon),
  }
}

// NOTE: "New Mover Welcome" shows in the "More options" section with a "Coming Soon" badge.
// It's visible but not selectable until NCOA/Melissa data is connected.
```

**Task 2: Create `GoalCard.vue`**

```vue
<template>
  <button
    @click="$emit('select', goal.type)"
    :class="[
      'relative text-left p-5 rounded-xl border-2 transition-all',
      isSelected
        ? 'border-[#47bfa9] bg-[#f0faf8] shadow-md'
        : 'border-[#e2e8f0] hover:border-[#b6c0dc] bg-white',
      isPrimary ? 'min-h-[120px]' : 'min-h-[80px]'
    ]"
  >
    <div class="flex items-start gap-3">
      <component :is="iconComponent" class="w-6 h-6 text-[#47bfa9] flex-shrink-0 mt-0.5" />
      <div>
        <div class="flex items-center gap-2">
          <h3 class="font-semibold text-[#0b2d50]">{{ goal.label }}</h3>
          <span v-if="goal.recommended" class="text-xs bg-[#47bfa9] text-white px-2 py-0.5 rounded-full">
            Recommended
          </span>
        </div>
        <p class="text-sm text-[#64748b] mt-1">{{ goal.shortDescription }}</p>
      </div>
    </div>

    <!-- Checkmark when selected -->
    <div v-if="isSelected" class="absolute top-3 right-3 w-6 h-6 bg-[#47bfa9] rounded-full flex items-center justify-center">
      <CheckmarkIcon class="w-4 h-4 text-white" />
    </div>
  </button>
</template>
```

**Design notes (Schoger review):**
- Primary goals: larger cards, distinct visual weight (slightly different bg, bigger)
- "More options": visually recessed, smaller
- Recommended goal: teal accent, badge, slightly elevated
- Selected state: teal border, checkmark, subtle background

**Task 3: Create `SequenceConfig.vue`**

Appears below goal cards after a goal is selected:

```vue
<template>
  <div class="mt-6 p-5 bg-[#f8f9fb] rounded-xl border border-[#e2e8f0]">
    <h4 class="text-sm font-semibold text-[#0b2d50] mb-4">Campaign Setup</h4>

    <!-- Service type (for seasonal, cross-service) -->
    <div v-if="needsServiceType" class="mb-4">
      <label class="text-sm text-[#64748b]">Which service?</label>
      <select v-model="serviceType" class="mt-1 w-full ...">
        <option v-for="service in services" :key="service">{{ service }}</option>
      </select>
    </div>

    <!-- Sequence length -->
    <div class="mb-4">
      <label class="text-sm text-[#64748b]">How many postcards?</label>
      <div class="flex gap-2 mt-2">
        <button
          v-for="n in [1, 2, 3, 4, 5]" :key="n"
          @click="sequenceLength = n"
          :class="[
            'w-12 h-12 rounded-lg border-2 font-semibold transition-all',
            sequenceLength === n
              ? 'border-[#47bfa9] bg-[#f0faf8] text-[#47bfa9]'
              : 'border-[#e2e8f0] text-[#64748b] hover:border-[#b6c0dc]'
          ]"
        >{{ n }}</button>
      </div>
      <p class="text-xs text-[#94a3b8] mt-1">
        {{ sequenceLength === 1 ? 'Single card' : `${sequenceLength} cards sent over ${totalWeeks} weeks` }}
        — most businesses see best results with 3
      </p>
    </div>

    <!-- Spacing -->
    <div v-if="sequenceLength > 1">
      <label class="text-sm text-[#64748b]">Spacing between cards</label>
      <select v-model="spacingWeeks" class="mt-1 w-full ...">
        <option :value="1">1 week</option>
        <option :value="2">2 weeks</option>
        <option :value="3">3 weeks</option>
        <option :value="4">4 weeks</option>
      </select>
    </div>

    <!-- "Something Else" free text -->
    <div v-if="goalType === 'other'" class="mt-4">
      <label class="text-sm text-[#64748b]">What are you trying to accomplish?</label>
      <textarea v-model="otherGoalText" class="mt-1 w-full ..." rows="2"
        placeholder="e.g., 'Promote our new water heater installation service'"
      />
    </div>
  </div>
</template>
```

**Task 4: Create `StepGoal.vue` (main orchestrator)**

```vue
<script setup lang="ts">
import { useCampaignDraftStore } from '@/stores/useCampaignDraftStore'
import { useBrandKitStore } from '@/stores/useBrandKitStore'
import { getGoalsForDisplay, type GoalDefinition } from '@/data/campaignGoals'
import { GOAL_DEFAULTS } from '@/types/campaign'

const draftStore = useCampaignDraftStore()
const brandKit = useBrandKitStore()

const { primary, more } = getGoalsForDisplay()
const showMore = ref(false)
const selectedGoal = ref<CampaignGoalType | null>(draftStore.draft?.goal?.goalType ?? null)
const sequenceLength = ref(draftStore.draft?.goal?.sequenceLength ?? 3)
const spacingWeeks = ref(Math.round((draftStore.draft?.goal?.sequenceSpacingDays ?? 14) / 7))
const serviceType = ref(draftStore.draft?.goal?.serviceType ?? null)
const otherGoalText = ref(draftStore.draft?.goal?.otherGoalText ?? null)

function selectGoal(type: CampaignGoalType) {
  selectedGoal.value = type
  const defaults = GOAL_DEFAULTS[type]
  sequenceLength.value = defaults.defaultPostcards
  spacingWeeks.value = defaults.spacingWeeks ?? 2
  commitGoal()
}

function commitGoal() {
  if (!selectedGoal.value) return
  draftStore.setGoal({
    goalType: selectedGoal.value,
    goalLabel: CAMPAIGN_GOALS.find(g => g.type === selectedGoal.value)!.label,
    serviceType: serviceType.value,
    sequenceLength: sequenceLength.value,
    sequenceSpacingDays: spacingWeeks.value * 7,
    otherGoalText: otherGoalText.value,
  })
}

// Re-commit when sequence/spacing changes
watch([sequenceLength, spacingWeeks, serviceType, otherGoalText], commitGoal)
</script>

<template>
  <div class="max-w-2xl mx-auto py-8 px-4">
    <h2 class="text-2xl font-bold text-[#0b2d50] mb-2">What's the goal of this campaign?</h2>
    <p class="text-[#64748b] mb-6">Pick a goal and we'll set up smart defaults for you.</p>

    <!-- Primary goals (top 3, prominent) -->
    <div class="grid gap-3 mb-4">
      <GoalCard
        v-for="goal in primary" :key="goal.type"
        :goal="goal"
        :is-selected="selectedGoal === goal.type"
        is-primary
        @select="selectGoal"
      />
    </div>

    <!-- More options (collapsed, one click to expand) -->
    <button @click="showMore = !showMore" class="text-sm text-[#47bfa9] mb-3">
      {{ showMore ? 'Show fewer options' : `More options (${more.length})` }}
    </button>
    <div v-if="showMore" class="grid gap-3 mb-4">
      <GoalCard
        v-for="goal in more" :key="goal.type"
        :goal="goal"
        :is-selected="selectedGoal === goal.type"
        @select="selectGoal"
      />
    </div>

    <!-- Sequence config (appears after goal selected) -->
    <SequenceConfig
      v-if="selectedGoal"
      :goal-type="selectedGoal"
      v-model:sequence-length="sequenceLength"
      v-model:spacing-weeks="spacingWeeks"
      v-model:service-type="serviceType"
      v-model:other-goal-text="otherGoalText"
      :services="brandKit.brandKit?.serviceTypes ?? []"
    />
  </div>
</template>
```

### Phase 2: Review & Send (Step 4)

**Task 5: Create `ScheduleEditor.vue`**

Per-card date pickers, pre-filled from Step 1 spacing:

```vue
<template>
  <div class="space-y-3">
    <h4 class="text-sm font-semibold text-[#0b2d50]">Send schedule</h4>
    <div v-for="card in schedules" :key="card.cardNumber" class="flex items-center gap-3">
      <span class="text-sm text-[#64748b] w-16">Card {{ card.cardNumber }}:</span>
      <input
        type="date"
        :value="card.scheduledDate"
        @input="updateDate(card.cardNumber, ($event.target as HTMLInputElement).value)"
        :min="minDate(card.cardNumber)"
        class="border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
      />
      <span class="text-xs text-[#94a3b8]">
        Est. delivery: {{ card.estimatedDeliveryDate }}
      </span>
    </div>
    <!-- Warning for unusual gaps -->
    <p v-if="hasGapWarning" class="text-xs text-amber-600">
      There's an unusual gap between cards. Cards typically work best with consistent spacing.
    </p>
    <!-- Min 5 days between cards -->
  </div>
</template>
```

- Pre-fill dates: Card 1 = 5 days from now (production time), subsequent cards = spacing from Step 1
- Each date independently adjustable
- Min 5 business days between cards (production time)
- Warning for unusual gaps (>6 weeks between cards)
- Holiday warnings: flag Thanksgiving week, Christmas-New Year, July 4th week

**Task 6: Create `CostBreakdown.vue`**

```vue
<template>
  <div class="bg-[#f8f9fb] rounded-xl p-5">
    <h4 class="text-sm font-semibold text-[#0b2d50] mb-3">Cost</h4>
    <div class="space-y-2">
      <div v-for="card in cards" :key="card.cardNumber" class="flex justify-between text-sm">
        <span class="text-[#64748b]">Card {{ card.cardNumber }}: {{ householdCount }} × ${{ perCardRate }}</span>
        <span class="font-medium text-[#0b2d50]">${{ card.cost.toFixed(2) }}</span>
      </div>
      <hr class="border-[#e2e8f0]" />
      <div class="flex justify-between text-sm font-semibold">
        <span class="text-[#0b2d50]">Total</span>
        <span class="text-[#0b2d50]">${{ totalCost.toFixed(2) }}</span>
      </div>
    </div>
    <p class="text-xs text-[#94a3b8] mt-2">
      Charged per card when it goes to print — not all upfront.
    </p>
  </div>
</template>
```

**Task 7: Create `StepReview.vue` (main orchestrator)**

```vue
<template>
  <div class="flex h-full">
    <!-- Left: Postcard previews -->
    <div class="flex-1 flex items-center justify-center p-8 bg-[#f8f9fb]">
      <ReviewSummary
        :cards="designCards"
        :brand-kit="brandKit"
      />
    </div>

    <!-- Right: Details -->
    <div class="w-96 border-l border-[#e2e8f0] p-6 overflow-y-auto">
      <!-- Campaign name (editable) -->
      <div class="mb-5">
        <label class="text-xs text-[#94a3b8] uppercase tracking-wider">Campaign Name</label>
        <input
          v-model="campaignName"
          class="w-full text-lg font-semibold text-[#0b2d50] border-b border-[#e2e8f0] pb-1 focus:border-[#47bfa9] outline-none"
        />
      </div>

      <!-- Targeting summary -->
      <div class="mb-5 p-3 bg-white rounded-lg border border-[#e2e8f0]">
        <div class="text-sm text-[#64748b]">Sending to</div>
        <div class="text-lg font-semibold text-[#0b2d50]">
          {{ householdCount.toLocaleString() }} households
        </div>
        <div class="text-xs text-[#94a3b8]">{{ targetingMethodLabel }}</div>
      </div>

      <!-- Schedule -->
      <ScheduleEditor
        :schedules="schedules"
        :sequence-spacing-days="goal.sequenceSpacingDays"
        @update="updateSchedule"
      />

      <!-- Cost -->
      <CostBreakdown
        :cards="costCards"
        :household-count="householdCount"
        :per-card-rate="perCardRate"
        :total-cost="totalCost"
        class="mt-5"
      />

      <!-- Campaign seeding -->
      <div class="mt-5 flex items-center gap-2">
        <input type="checkbox" v-model="sendSeedCopy" id="seed" />
        <label for="seed" class="text-sm text-[#64748b]">
          Send a copy to yourself (free)
        </label>
      </div>
      <p v-if="sendSeedCopy" class="text-xs text-[#94a3b8] ml-6">
        Mailing to: {{ seedAddress }}
      </p>

      <!-- Payment method (mock for Round 1) -->
      <div class="mt-5 p-3 bg-white rounded-lg border border-[#e2e8f0]">
        <div class="text-xs text-[#94a3b8]">Payment method</div>
        <div class="text-sm text-[#0b2d50]">💳 Visa ending in 4242</div>
        <button class="text-xs text-[#47bfa9] mt-1">Change</button>
      </div>

      <!-- Approve button -->
      <button
        @click="approve"
        :disabled="!canApprove"
        class="mt-6 w-full py-3 bg-[#47bfa9] text-white font-semibold rounded-xl hover:bg-[#3aa893] disabled:opacity-50 disabled:cursor-not-allowed text-lg"
      >
        Approve &amp; Send Card 1
      </button>
      <p class="text-xs text-[#94a3b8] text-center mt-2">
        Cards 2{{ goal.sequenceLength > 2 ? '-' + goal.sequenceLength : '' }} send on schedule unless you pause.
        You can cancel within 1 hour.
      </p>
    </div>
  </div>
</template>
```

**Campaign auto-naming format:** `[Goal] — [Primary Area] — [Date]`
Example: "Neighbor Marketing — Scottsdale 85281 — Mar 25"

**Approve flow:**
1. Double-click protection: disable button on click + loading state
2. POST to server (mock for Round 1 — creates campaign with "approved" status)
3. Show confirmation screen with "View Campaign" and "Send More Mail" CTAs
4. 1-hour cancellation window message shown

### Phase 3: Campaigns Page

**Task 8: Create `useCampaignList` composable**

```typescript
export function useCampaignList() {
  const campaigns = ref<Campaign[]>([])
  const drafts = ref<CampaignDraft[]>([])
  const loading = ref(false)
  const activeTab = ref<'active' | 'drafts' | 'completed' | 'paused'>('active')
  const searchQuery = ref('')
  const sortBy = ref<'newest' | 'oldest' | 'best_performing' | 'most_revenue'>('newest')

  async function fetch() { /* ... */ }

  const filtered = computed(() => {
    let list = campaigns.value
    // Filter by tab
    if (activeTab.value === 'active') list = list.filter(c => ['approved', 'printing', 'in_transit', 'delivered'].includes(c.status))
    if (activeTab.value === 'completed') list = list.filter(c => c.status === 'completed')
    if (activeTab.value === 'paused') list = list.filter(c => c.status === 'paused')
    // Search
    if (searchQuery.value) list = list.filter(c => c.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
    // Sort
    // ... sort logic
    return list
  })

  const tabCounts = computed(() => ({
    active: campaigns.value.filter(c => ['approved', 'printing', 'in_transit', 'delivered'].includes(c.status)).length,
    drafts: drafts.value.length,
    completed: campaigns.value.filter(c => c.status === 'completed').length,
    paused: campaigns.value.filter(c => c.status === 'paused').length,
  }))

  return { campaigns, drafts, loading, activeTab, searchQuery, sortBy, filtered, tabCounts, fetch }
}
```

**Task 9: Create `CampaignListCard.vue`**

```vue
<template>
  <div class="bg-white rounded-xl border border-[#e2e8f0] p-5 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <!-- Status colored left border -->
        <div class="flex items-center gap-3 mb-2">
          <CampaignStatusBadge :status="campaign.status" />
          <h3 class="font-semibold text-[#0b2d50]">{{ campaign.name }}</h3>
        </div>

        <div class="flex gap-4 text-sm text-[#64748b]">
          <span>{{ campaign.householdCount.toLocaleString() }} households</span>
          <span>{{ campaign.sequenceLength }} card{{ campaign.sequenceLength > 1 ? 's' : '' }}</span>
          <span>${{ campaign.totalCost.toFixed(0) }}</span>
        </div>

        <!-- Per-card progress (mini visual) -->
        <div v-if="campaign.cards.length > 1" class="flex gap-1 mt-3">
          <div
            v-for="card in campaign.cards" :key="card.cardNumber"
            :class="[
              'h-2 flex-1 rounded-full',
              statusColor(card.status)
            ]"
            :title="`Card ${card.cardNumber}: ${card.status}`"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <router-link :to="`/app/campaigns/${campaign.id}`" class="text-sm text-[#47bfa9]">
          View
        </router-link>
        <button v-if="campaign.status !== 'completed'" @click="$emit('pause', campaign.id)" class="text-sm text-[#64748b]">
          {{ campaign.status === 'paused' ? 'Resume' : 'Pause' }}
        </button>
        <button v-if="campaign.status === 'completed'" @click="$emit('run-again', campaign.id)" class="text-sm text-[#47bfa9]">
          Run Again
        </button>
      </div>
    </div>
  </div>
</template>
```

**Status colors (Schoger — readable from border color alone):**
- Teal: on track (approved, printing, in_transit, delivered)
- Yellow/amber: needs attention (draft with stale data)
- Gray: completed
- Orange: paused

**Draft cards** show: campaign name, wizard step, Resume/Delete buttons
"Spring HVAC — Draft (Step 2 of 4)"

**Task 10: Create `Campaigns.vue` page**

```vue
<template>
  <div class="max-w-5xl mx-auto py-6 px-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-[#0b2d50]">Campaigns</h1>
      <router-link to="/app/send" class="bg-[#47bfa9] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#3aa893]">
        + Send Postcards
      </router-link>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 bg-[#f0f2f5] rounded-lg p-1">
      <button v-for="tab in tabs" :key="tab.key"
        @click="list.activeTab.value = tab.key"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          list.activeTab.value === tab.key
            ? 'bg-white text-[#0b2d50] shadow-sm'
            : 'text-[#64748b] hover:text-[#0b2d50]'
        ]"
      >
        {{ tab.label }}
        <span class="ml-1 text-xs text-[#94a3b8]">({{ list.tabCounts.value[tab.key] }})</span>
      </button>
    </div>

    <!-- Filters -->
    <CampaignFilters v-model:search="list.searchQuery.value" v-model:sort="list.sortBy.value" />

    <!-- Campaign list -->
    <div class="space-y-3 mt-4">
      <!-- Drafts tab shows draft cards -->
      <template v-if="list.activeTab.value === 'drafts'">
        <div v-for="draft in list.drafts.value" :key="draft.id" class="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="font-semibold text-[#0b2d50]">{{ draftName(draft) }}</h3>
              <p class="text-sm text-[#94a3b8]">Draft — Step {{ draft.currentStep }} of 4</p>
            </div>
            <div class="flex gap-3">
              <router-link :to="`/app/send/${draft.id}`" class="text-sm text-[#47bfa9] font-medium">
                Resume
              </router-link>
              <button @click="deleteDraft(draft.id)" class="text-sm text-[#94a3b8]">Delete</button>
            </div>
          </div>
        </div>
      </template>

      <!-- Other tabs show campaign cards -->
      <template v-else>
        <CampaignListCard
          v-for="campaign in list.filtered.value"
          :key="campaign.id"
          :campaign="campaign"
          @pause="pauseCampaign"
          @run-again="runAgain"
        />
      </template>

      <!-- Empty state -->
      <div v-if="isEmpty" class="text-center py-12">
        <p class="text-[#64748b]">{{ emptyMessage }}</p>
        <router-link to="/app/send" class="text-[#47bfa9] font-medium mt-2 inline-block">
          Send your first postcards →
        </router-link>
      </div>
    </div>

    <!-- Pagination (20 per page) -->
    <!-- ... pagination controls ... -->
  </div>
</template>
```

Add route to `router.ts`:
```typescript
{ path: '/app/campaigns', component: () => import('@/pages/Campaigns.vue'), meta: { title: 'Campaigns' } }
```

### Phase 4: Campaign Detail Page

**Task 11: Create `CampaignDetail.vue`**

```vue
<template>
  <div class="max-w-5xl mx-auto py-6 px-4">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <router-link to="/app/campaigns" class="text-sm text-[#47bfa9] mb-1 block">← All Campaigns</router-link>
        <h1 class="text-2xl font-bold text-[#0b2d50]">{{ campaign.name }}</h1>
        <CampaignStatusBadge :status="campaign.status" class="mt-1" />
      </div>
      <CampaignActions :campaign="campaign" @pause="pause" @resume="resume" @run-again="runAgain" />
    </div>

    <!-- KPI Cards (mock data for Round 1) -->
    <CampaignKPICards :campaign="campaign" class="mb-8" />

    <!-- Sequence Progress -->
    <SequenceTimeline :cards="campaign.cards" class="mb-8" />

    <!-- Targeting summary with small map -->
    <div class="bg-white rounded-xl border border-[#e2e8f0] p-5 mb-8">
      <h3 class="font-semibold text-[#0b2d50] mb-3">Targeting</h3>
      <div class="flex gap-6">
        <div class="w-48 h-32 bg-[#f0f2f5] rounded-lg">
          <!-- Small static map showing targeted area -->
        </div>
        <div class="text-sm text-[#64748b] space-y-1">
          <p>{{ campaign.householdCount.toLocaleString() }} households</p>
          <p>{{ campaign.goalType }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
```

**Task 12: Create `CampaignKPICards.vue`**
4 cards in a row:
- Households Mailed: `1,116` (from targeting)
- Calls Received: `0` (mock — "Results come in after delivery")
- Revenue: `$0` (mock — "Connect CRM for revenue tracking")
- Total Spent: `$770.04`

**Task 13: Create `SequenceTimeline.vue`**
Visual per-card status:
```
Card 1                    Card 2                    Card 3
┌──────┐                  ┌──────┐                  ┌──────┐
│ prev │  Approved →      │ prev │  Scheduled        │ prev │  Scheduled
│ img  │  Printing →      │ img  │  Mar 25            │ img  │  Apr 8
│      │  In Mail →       │      │                    │      │
└──────┘  ✓ Delivered     └──────┘                    └──────┘
          Mar 18
```

- Each card: postcard thumbnail + status progression
- Upcoming cards: show scheduled date
- Completed cards: show actual dates
- Edit button on unprinted cards: "Change design" or "Change date"

Add route to `router.ts`:
```typescript
{ path: '/app/campaigns/:id', component: () => import('@/pages/CampaignDetail.vue'), meta: { title: 'Campaign Detail' } }
```

### Phase 5: Server + Mock Data

**Task 14: Extend Campaign model for lifecycle**

Add columns to Campaign model (or new migration):
```python
# Add to Campaign model in app/models.py:
status = db.Column(db.String, nullable=False, default='draft')  # draft/approved/printing/in_transit/delivered/completed/paused
goal_type = db.Column(db.String, nullable=True)
service_type = db.Column(db.String, nullable=True)
sequence_length = db.Column(db.Integer, nullable=True, default=1)
household_count = db.Column(db.Integer, nullable=True)
total_cost = db.Column(db.Numeric(10, 2), nullable=True)
targeting_data = db.Column(JSONB, nullable=True)
design_data = db.Column(JSONB, nullable=True)
schedule_data = db.Column(JSONB, nullable=True)
approved_at = db.Column(db.DateTime(timezone=True), nullable=True)
draft_id = db.Column(UUID(as_uuid=True), nullable=True)  # link back to draft
```

**Task 15: Create campaign lifecycle service**

```python
# app/services/campaign_lifecycle.py

def approve_campaign(org_id, draft_id):
    """Convert draft to approved campaign. Mock status for Round 1."""
    draft = campaign_drafts_dao.get_by_id(org_id, draft_id)
    if not draft:
        raise APIError("Draft not found")

    campaign = campaigns_dao.create(
        org_id=org_id,
        name=draft['data'].get('review', {}).get('campaignName', 'Untitled Campaign'),
        status='approved',
        goal_type=draft['data'].get('goal', {}).get('goalType'),
        # ... map all fields
    )

    # Delete the draft
    campaign_drafts_dao.delete(org_id, draft_id)

    return campaign


def get_campaign_detail(org_id, campaign_id):
    """Get full campaign detail with mock progression."""
    campaign = campaigns_dao.get_by_id(org_id, campaign_id)
    if not campaign:
        raise APIError("Campaign not found", status_code=404)

    # Mock card statuses based on time since approval
    # ... simulate printing → in_transit → delivered progression
    return campaign
```

**Task 16: Mock status progression (for demo/testing)**

After campaign approval, simulate real-world status changes so the team can see the full experience:
- On approval: status = `approved`
- After 30 seconds: status advances to `printing`
- After 60 seconds: `in_transit`
- After 90 seconds: `delivered`
- Use `setTimeout` in the client (not server) for Round 1 — easy to remove when real tracking connects
- Store progression timers in the campaign detail composable
- Campaign detail page auto-refreshes status from these timers
- This gives Drake and the team a realistic feel when demoing

**Task 17: Create mock campaign data**

For the Campaigns page to be useful during development, seed with mock campaigns:

```python
MOCK_CAMPAIGNS = [
    {
        "name": "Neighbor Marketing — Scottsdale 85281 — Mar 15",
        "status": "completed",
        "goal_type": "neighbor_marketing",
        "sequence_length": 3,
        "household_count": 412,
        "total_cost": 852.84,
    },
    {
        "name": "Spring AC Tune-Up — Paradise Valley — Mar 20",
        "status": "in_transit",
        "goal_type": "seasonal_tuneup",
        "sequence_length": 3,
        "household_count": 683,
        "total_cost": 1413.81,
    },
    # ... 3-5 more in various statuses
]
```

Return from campaigns list endpoint when no real campaigns exist yet.

---

## Multiple Entry Points (from spec)

| Entry | Route | Behavior |
|-------|-------|----------|
| "+ Send Postcards" (nav) | `/app/send` | Full wizard Step 1 |
| Map page "Send Postcards" | `/app/send` | Full wizard Step 1 |
| Campaigns "Resume" draft | `/app/send/:draftId` | Opens at saved step |
| Campaigns "Run Again" | `/app/send?runAgain=:campaignId` | Pre-fill from completed campaign, open Step 4 |

"Run Again" creates a new draft pre-filled with same goal/targeting/design from the completed campaign.

---

## Expert Checkpoints

| After Task | Expert | Check |
|-----------|--------|-------|
| Task 1-4 (goal selection) | Krug | Can Bob pick a goal without reading any docs? Is the primary/more split obvious? |
| Task 1-4 (goal selection) | Norman | What if they pick wrong? (Can go back. Goal change flags later steps for review, doesn't wipe.) |
| Task 3 (sequence config) | DHH | Is sequence length necessary in Step 1? (Yes — affects targeting cost and design template count.) |
| Task 5-7 (review) | Wiebe | "Approve & Send Card 1" — is that the right CTA? Not "Submit" or "Confirm"? |
| Task 7 (review) | Hendrickson | Double-click protection? What if payment fails? What about stale drafts? |
| Task 9-10 (campaigns page) | Patil | Can Jake sort by any metric and export? |
| Task 11-13 (detail page) | Knaflic | Does Bob know in 3 seconds if the campaign is going well? |
| Task 14-15 (server) | Hunt | Campaign data scoped by org_id? Can org A see org B's campaigns? |
| Task 14-15 (server) | Kerstiens | Indexes on (org_id, status)? Pagination query efficient? |

---

## Done Criteria

- [ ] Step 1 shows goal cards — top 3 prominent, rest under "More options"
- [ ] Selecting a goal shows sequence config (length + spacing)
- [ ] Seasonal goals only appear in spring/fall
- [ ] "Something Else" shows free text input
- [ ] Goal data writes to draft store correctly
- [ ] Step 4 shows postcard preview on left, details on right
- [ ] Campaign name auto-generated and editable
- [ ] Schedule shows per-card dates, each independently adjustable
- [ ] Cost breakdown shows per-card and total
- [ ] Campaign seeding checkbox works (default ON)
- [ ] "Approve & Send Card 1" creates campaign and shows confirmation
- [ ] Campaigns page shows tabs with counts (Active / Drafts / Completed / Paused)
- [ ] Campaign cards show name, status, household count, per-card progress
- [ ] Drafts show step progress and Resume/Delete buttons
- [ ] Search and sort work on campaigns list
- [ ] Campaign detail page shows KPIs, sequence timeline, targeting summary
- [ ] "Run Again" pre-fills a new draft from completed campaign
- [ ] Empty states for all tabs with helpful CTA
- [ ] Routes added: `/app/campaigns`, `/app/campaigns/:id`
- [ ] No console errors, no TypeScript errors

---

## Data Flow Summary

```
Step 1 (This Terminal)          Step 2 (Targeting)           Step 3 (Design)
────────────────────           ──────────────────           ────────────────
GoalSelection ──────────►     reads goal for              reads goal for
  goalType                     auto-set exclusions          template selection
  serviceType                  auto-set filters             messaging tone
  sequenceLength               cost calculation
  spacingDays

                               TargetingSelection ─────►   DesignSelection ─────►

Step 4 (This Terminal)
────────────────────
reads ALL three steps
shows summary of everything
ReviewSelection
  campaignName (auto-generated)
  schedules (per-card dates)
  cost breakdown
  seedCopy toggle
  approval → creates Campaign

Campaign approved → Campaigns page → Campaign Detail page
```

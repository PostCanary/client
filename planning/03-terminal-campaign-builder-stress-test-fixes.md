# Terminal 3 (Campaign Builder) — Stress Test Results + Fixes

## 4 Blockers Found — All Fixed

### BLOCKER FIX 1: Brief still references `campaigns.ts (extend existing)` — WOULD BREAK ANALYTICS

The brief's file list says to extend the existing `src/api/campaigns.ts`. This is the analytics campaign API. Terminal 3 must NOT touch it.

**Fix applied to brief:** Remove `src/api/campaigns.ts (extend existing)` from file list. It's replaced by `src/api/mailCampaigns.ts` (new file). The modified files entry for `campaigns.ts` is also removed.

### BLOCKER FIX 2: Brief Tasks 14-15 modify existing Campaign model — WOULD BREAK ANALYTICS

The brief says "Extend Campaign model for lifecycle" and adds columns to the existing `Campaign` table. This is the analytics campaign model.

**Fix applied to brief:** Tasks rewritten to create NEW `MailCampaign` model (tablename `mail_campaigns`). New DAO file `mail_campaign_dao.py`. New service file `mail_campaign_lifecycle.py`. Existing Campaign model untouched.

### BLOCKER FIX 3: Brief and execution plan have different task numbering

The brief has 17 tasks with server work at the END (Phase 5). The execution plan has 17 tasks with server work in the MIDDLE (after Step 4 review, before Campaigns page). Codex following the brief would build client components calling endpoints that don't exist.

**Fix:** The execution plan is the DEFINITIVE task reference. The brief should state: "For build order, follow the execution plan. The brief provides component specs; the execution plan provides build sequence."

### BLOCKER FIX 4: Server tasks after client tasks in brief

Brief Phase 5 puts all server work last. But client Campaigns page needs server endpoints to exist first.

**Fix:** Execution plan's ordering is correct. Server work (model + endpoints) comes BEFORE the Campaigns page and Campaign Detail page. Brief updated to match.

---

## Important Fixes

### composable uses `Campaign[]` instead of `MailCampaign[]`

In `useCampaignList` composable, change:
```typescript
// WRONG
const campaigns = ref<Campaign[]>([])

// RIGHT
const campaigns = ref<MailCampaign[]>([])
import type { MailCampaign } from '@/types/campaign'
```

### Missing ReviewSummary.vue task

Add ReviewSummary.vue as a task BEFORE StepReview.vue:
- Shows PostcardPreview component for each card in the sequence
- Click/swipe through cards, front/back flip
- Reads cards from draft store's design selection
- If design is the stub (Terminal 2 not merged): shows stub previews — still works

### Naming note inconsistency: `useMailCampaignList` vs `useCampaignList`

The naming note says `useMailCampaignList` but all code uses `useCampaignList`. Fix: update the naming note to `useCampaignList`. There's no collision with the existing `useCampaignStore` (different name, different purpose).

### Service file naming inconsistency

Brief Task 15 uses `campaign_lifecycle.py`. Should be `mail_campaign_lifecycle.py`. Brief Task 15 calls `campaigns_dao.create()`. Should be `mail_campaign_dao.create()`.

### Nav link "Campaigns" conflicts with existing campaign selector dropdown

The existing Navbar has a campaign selector dropdown for analytics batch grouping. Adding a "Campaigns" nav link for direct mail creates confusion — same word, different meaning.

**Fix options (product decision for Drake):**
- Option A: Label the nav link "Postcards" instead of "Campaigns" — different word, clear distinction
- Option B: Label it "Sent Mail" — describes what it is
- Option C: Keep "Campaigns" and rename the analytics dropdown to "Data Sources" or "Batches"

**Recommendation:** Option A — "Postcards" is the customer's word. They're sending postcards, not "managing campaigns."

### Mock status progression should use server timestamp, not client setTimeout

Client-side `setTimeout` is lost on page reload. Fix: use `approved_at` timestamp from server, calculate mock status based on elapsed time:

```typescript
function getMockStatus(approvedAt: string): MailCampaignStatus {
  const elapsed = Date.now() - new Date(approvedAt).getTime()
  const minutes = elapsed / 60000
  if (minutes < 0.5) return 'approved'
  if (minutes < 1) return 'printing'
  if (minutes < 1.5) return 'in_transit'
  if (minutes < 2) return 'delivered'
  if (minutes < 2.5) return 'results_ready'
  return 'completed'
}
```

Persists across page reloads. No client-side timers needed.

### Campaign auto-naming "Primary Area" fallback

When targeting hasn't been completed or has no named area:
```typescript
function getAreaLabel(targeting: TargetingSelection | null): string {
  if (!targeting) return 'Your Area'
  // Use first ZIP if available
  const firstZip = targeting.areas.find(a => a.zipCode)?.zipCode
  if (firstZip) return firstZip
  // Use method as label
  if (targeting.method === 'around_jobs') return 'My Jobs Area'
  if (targeting.method === 'draw') return 'Selected Area'
  return 'Your Area'
}
```

### Seed address comes from brand kit, not user profile

`BrandKit.address` is the business mailing address. If null, show an input field for the user to enter their address. Not blocking but needs explicit handling.

### GoalCard.vue doesn't render `comingSoon` state

Add to GoalCard template:
```vue
<span v-if="goal.comingSoon" class="text-xs bg-[#94a3b8] text-white px-2 py-0.5 rounded-full">
  Coming Soon
</span>
```
And disable the button: `:disabled="goal.comingSoon"` with reduced opacity.

### `results_ready` missing from mock progression

Add to the status flow: approved (30s) → printing (60s) → in_transit (90s) → delivered (120s) → results_ready (150s) → completed (180s). Or use the timestamp-based calculation above.

### "Run Again" needs a server endpoint

POST `/api/mail-campaigns/:id/run-again` that:
1. Reads the old campaign's goal, targeting, and design data
2. Creates a new draft pre-filled with that data
3. Returns the new draft ID
4. Client navigates to `/app/send/:newDraftId`

This endpoint doesn't exist in the brief or execution plan. Add it to the server tasks.

### Payment validation skipped in Round 1

The approval endpoint should NOT validate payment. Add a note: `paymentMethodId` can be `"mock_pm_4242"` or `null`. No Stripe calls in Round 1.

---

## Corrected Task Order (matching execution plan)

**Phase 1: Goal Selection (Tasks 1-4)** — same as before

**Phase 2: Review & Send (Tasks 5-7)**
5. ScheduleEditor.vue + CostBreakdown.vue
6. ReviewSummary.vue (NEW — was missing)
7. StepReview.vue (main orchestrator)

**Phase 3: Server — MailCampaign (Task 8)** — MOVED UP from Phase 5
8. MailCampaign model + migration + DAO + service + blueprint + "Run Again" endpoint

**Phase 4: Campaigns Page (Tasks 9-11)**
9. useCampaignList composable + mailCampaigns API layer (uses `MailCampaign[]` type)
10. CampaignListCard + CampaignStatusBadge + CampaignFilters
11. Campaigns.vue page

**Phase 5: Campaign Detail (Tasks 12-14)**
12. CampaignKPICards + SequenceTimeline + CampaignActions
13. CampaignDetail.vue page + useCampaignDetail composable
14. Mock status progression (timestamp-based, not setTimeout)

**Phase 6: Integration (Tasks 15-17)**
15. Wire up entry points (nav, resume, run again)
16. Update WizardShell (change 2 imports: StepGoalStub → StepGoal, StepReviewStub → StepReview)
17. Mock campaign seed data

---

## Expert Product Fixes

### Wiebe (Copy)
- Tab "Active" → **"In Progress"**
- Add `STATUS_LABELS` map: `in_transit` → "In the Mail", `results_ready` → "Results Coming In"
- Per-tab empty states with different messaging
- Single-card: hide "Cards 2-3 send on schedule" sub-text when sequenceLength === 1
- "Run Again" → **"Send Again"** everywhere

### Tommy Mello (Home Services)
- Add estimated call range in Step 4 review: "Typical response: X-Y calls" (0.5%-1.5% × households)
- Goal descriptions in plumber language: "Re-engage customers" → **"Get past customers calling again"**
- Hide sort options that don't work yet (best_performing, most_revenue)

### Cialdini (Psychology)
- Social proof on approval screen: "PostCanary users have sent over 50,000 postcards this year"
- "What happens next" on confirmation: prints within 24 hours, notified when mailed, calls 5-7 days after delivery

### Hulick (Onboarding)
- First-time banner in Step 1: "You're about to send real postcards to real homes. Takes about 5 minutes."
- Sequence explanation: "Sending multiple postcards gets more calls — each card reminds them you're nearby."

### Norman (Non-technical)
- Yellow "needs review" banner when entering a flagged step after goal change
- Coming Soon explanation: "Coming Q2 2026 — we're connecting the data source"

### Knaflic (Data Viz)
- KPI cards: 2 active (Households, Spent) + 2 grayed-out preview ("Available after delivery")
- Timeline: micro-labels not color-only progress bars

### Emma (Existing User)
- Nav "Postcards" link placed after existing items with `|` divider
- Missing-fields prompt: "Quick setup (30 seconds)" — natural, not blocking

### Campbell (Retention)
- Delete draft needs `confirm()` dialog
- Round 2: draft abandonment nudge on Dashboard

---

## Codex Readiness: Missing Props/Code for 13 Tasks

Only tasks 1, 2, 4, 16 are Codex-ready as-is. Below is the critical missing code for each struggling task. Codex MUST have this information.

### Task 3 (SequenceConfig.vue):
```typescript
defineProps<{ goalType: CampaignGoalType; sequenceLength: number; spacingWeeks: number; serviceType: string | null; otherGoalText: string | null; services: string[] }>()
defineEmits<{ (e: 'update:sequenceLength', v: number): void; (e: 'update:spacingWeeks', v: number): void; (e: 'update:serviceType', v: string | null): void; (e: 'update:otherGoalText', v: string | null): void }>()
const needsServiceType = computed(() => ['seasonal_tuneup', 'cross_service_promo'].includes(props.goalType))
```

### Task 5 (ScheduleEditor.vue):
```typescript
defineProps<{ schedules: CardSchedule[]; sequenceSpacingDays: number }>()
defineEmits<{ (e: 'update', schedules: CardSchedule[]): void }>()
// addBusinessDays(date, days) — skip weekends
// minDate(cardNumber) — 5 business days after prev card
// HOLIDAYS array: ['11-27','11-28','12-24','12-25','12-31','01-01','07-04']
// hasGapWarning: computed — true if >42 days between any two cards
```

### Task 6 (ReviewSummary.vue) — MISSING COMPONENT:
```typescript
// src/components/review/ReviewSummary.vue
defineProps<{ cards: CardDesign[]; brandKit: BrandKit | null }>()
// activeCard ref, showBack ref, prev/next navigation, PostcardPreview import
```

### Task 7 (StepReview.vue) — needs complete script:
- All imports (stores, API, types, sub-components)
- `buildInitialSchedules()` — generates CardSchedule[] from goal spacing
- `getAreaLabel()` — area name from targeting (ZIP, job area, or "Your Area")
- `goalLabel` computed — lookup from CAMPAIGN_GOALS
- `approve()` async — commit review to store → call approveMailCampaign API → show confirmation
- Double-click protection: `approving` ref disables button
- Confirmation screen: "Your campaign is live!" with View Campaign / Send More Mail
- `canApprove` computed: not approving AND household count > 0 AND name not empty

### Task 8 (Server model + endpoints):
- `MailCampaign` model with 18 columns (all provided in agent output)
- `mail_campaign_dao.py`: create, list_for_org, get_by_id, update_status, `_to_dict()`
- `mail_campaign_lifecycle.py`: approve_campaign (reads draft, creates MailCampaign, deletes draft), create_run_again_draft
- `mail_campaigns.py` blueprint: 5 routes (list, get, approve, patch status, run-again)
- Migration file
- Register in `__init__.py`
- **Follow exact patterns from:** `campaigns_dao.py`, `campaigns.py` blueprint

### Task 9 (API layer):
```typescript
// src/api/mailCampaigns.ts — NEW file, do NOT touch campaigns.ts
// transformCampaign(raw) — snake_case to camelCase
// listMailCampaigns(), getMailCampaign(id), approveMailCampaign(draftId)
// pauseMailCampaign(id), resumeMailCampaign(id), runAgainMailCampaign(id)
// Use MailCampaign[] type, NOT Campaign[]
```

### Task 10 (3 list components):
```typescript
// CampaignStatusBadge: STATUS_LABELS map + STATUS_COLORS map
// CampaignFilters: search + sort v-model props
// CampaignListCard: campaign: MailCampaign prop, pause/run-again emits, statusColor() for per-card bars
```

### Task 11 (Campaigns.vue):
- Remove `.value` from all template refs (Vue auto-unwraps — 6 occurrences to fix)

### Task 12 (3 detail components):
```typescript
// CampaignKPICards: 2 real cards + 2 grayed preview
// SequenceTimeline: isStepComplete(cardStatus, step) logic
// CampaignActions: conditional buttons based on campaign.status
```

### Task 13 (CampaignDetail.vue + composable):
```typescript
// useCampaignDetail.ts: fetch by route.params.id, loading/error states, onMounted fetch
```

### Task 14 (Mock status):
```typescript
// getMockStatus(approvedAt) — timestamp-based, NOT setTimeout
// 10-second auto-refresh interval with onUnmounted cleanup
```

### Task 17 (Mock seed data):
- Server-side in DAO: return MOCK_CAMPAIGNS when org has no real campaigns
- Include full cards_data JSONB structure per campaign

### Global fixes:
- `goalLabel` computed everywhere campaign.goalType is displayed (never show raw enum)
- `getAreaLabel()` for campaign auto-naming with fallbacks (ZIP → "My Jobs Area" → "Selected Area" → "Your Area")

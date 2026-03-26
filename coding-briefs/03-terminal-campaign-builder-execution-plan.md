# Execution Plan: Terminal 3 — Campaign Builder (Wizard Steps 1 + 4, Campaigns Page, Campaign Detail)

## Context

This builds the campaign lifecycle — from goal selection (Step 1) through approval (Step 4) to campaign management (Campaigns page + detail page). This terminal owns the beginning and end of the wizard plus everything that happens after approval.

**Branch:** `feat/campaign-builder` from `main` (after prerequisites merged)
**Brief:** `C:\Users\drake\postcanary\coding-briefs\03-terminal-campaign-builder.md` (definitive reference)
**Depends on:** Prerequisites build complete and merged (shared types, draft store, wizard shell, brand kit store, PostcardPreview, MailCampaign types)

## Pre-Flight Checklist

1. Verify prerequisites branch is merged to main
2. Verify wizard works with stubs: navigate to `/app/send`, click through all 4 stubs
3. Verify PostcardPreview renders (even if stubs — it's used in Step 4 review)
4. Create branch in BOTH repos:
   - `cd "C:/Users/drake/postcanary/client" && git checkout -b feat/campaign-builder`
   - `cd "C:/Users/drake/postcanary/server" && git checkout -b feat/campaign-builder`
5. Verify `npm run build` passes before making changes
6. Read existing `src/api/campaigns.ts` and `src/stores/useCampaignStore.ts` — understand what exists so we DON'T touch it. New mail campaign code goes in NEW files.

## Build Order (17 tasks, 5 phases)

### Phase 1: Goal Selection — Step 1 (Tasks 1-4)

**Task 1: Create goal definitions**
- File: `src/data/campaignGoals.ts`
- 8 goals: neighbor_marketing, target_area, seasonal_tuneup, storm_response, win_back, cross_service_promo, new_mover (Coming Soon), other
- Each: type, label, shortDescription, icon (from @vicons/ionicons5), recommended flag, seasonal flag, displayPriority, comingSoon flag, defaults (from GOAL_DEFAULTS)
- `getGoalsForDisplay()`: returns { primary (max 3), more }. Seasonal promoted to primary in March-May and Sep-Nov. Coming Soon items always in "more" section.
- Seasonal default displayPriority is `'more'` — promoted to `'primary'` only when in season
- **Verify:** Call `getGoalsForDisplay()` in March → seasonal_tuneup is in primary. Call in July → it's in more.

**Task 2: Create `GoalCard.vue`**
- File: `src/components/goal/GoalCard.vue`
- Button-style card: icon + label + description + recommended badge
- Selected state: teal border, checkmark, light teal background
- Primary cards: min-h-120px (larger). More cards: min-h-80px (smaller).
- "Coming Soon" badge for new_mover (disabled, non-clickable)
- **Verify:** Renders with all props, selected/unselected states look distinct

**Task 3: Create `SequenceConfig.vue`**
- File: `src/components/goal/SequenceConfig.vue`
- Appears below goal cards after selection
- Sequence length: 1-5 number buttons (3 highlighted as default, most recommended)
- Spacing: dropdown (1-4 weeks), defaults from GOAL_DEFAULTS
- Service type selector (for seasonal, cross-service): reads from brand kit serviceTypes
- "Something Else" free text textarea
- "Most businesses see best results with 3" helper text
- **Verify:** Selecting a goal auto-fills defaults. Changing values works. Something Else shows textarea.

**Task 4: Create `StepGoal.vue` (main orchestrator)**
- File: `src/components/wizard/StepGoal.vue`
- Replaces StepGoalStub
- Layout: centered content (max-w-2xl), heading "What's the goal of this campaign?", primary goals grid, "More options" expandable, SequenceConfig below
- Reads existing goal from draft store (if resuming)
- On goal selection: auto-fill sequence defaults, commit to `draftStore.setGoal()`
- Goal change after initial selection: re-commit with new defaults (downstream steps flagged for review by draft store automatically)
- **Existing user missing fields check:** If `brandKit.location` is null or `brandKit.industry` is null, show inline prompt BEFORE the goal cards: "To send postcards, we need a couple things first:" — location input + industry selector. Save to profile on completion, then show goal cards. This handles existing users who skipped the new onboarding.
- **Verify:** Goals display correctly. Selecting one shows SequenceConfig. Changing goal re-applies defaults. Data writes to draft store. Existing user without location sees inline prompt.

### Phase 2: Review & Send — Step 4 (Tasks 5-7)

**Task 5: Create review sub-components**
- Files: `src/components/review/ScheduleEditor.vue`, `CostBreakdown.vue`
- **ScheduleEditor:** Per-card date pickers. Card 1 = 5 business days from now (production time). Subsequent cards spaced by Step 1 spacing. Each independently adjustable. Min 5 days between cards. Warning for unusual gaps (>6 weeks). Holiday warnings (Thanksgiving, Christmas, July 4th).
- **CostBreakdown:** Per-card breakdown: "Card 1: 1,116 × $0.69 = $770". Total at bottom. "Charged per card when it goes to print — not all upfront." Reads pricing from `PRICING` constant (keys: `payPerSend`, `INSIGHT`, `PERFORMANCE`, `PRECISION`, `ELITE`) + user's subscription tier via `PlanCode` from `@/api/billing` (default: payPerSend for Round 1).
- **Verify:** Dates auto-fill correctly. Cost math is accurate. Holiday warnings trigger for known dates.

**Task 6: Create `ReviewSummary.vue`**
- File: `src/components/review/ReviewSummary.vue`
- Left column of Step 4
- Postcard preview using shared PostcardPreview component (from `src/components/postcard/`)
- Swipe/click through sequence cards (Card 1 / Card 2 / Card 3)
- Front/back flip for each card
- If PostcardPreview is still stubs (Terminal 2 not merged yet): shows stub previews — that's fine
- **Verify:** Preview renders (stub or real). Can flip front/back. Can switch between cards.

**Task 7: Create `StepReview.vue` (main orchestrator)**
- File: `src/components/wizard/StepReview.vue`
- Replaces StepReviewStub
- Layout: ReviewSummary (left, centered on gray bg) + details panel (right, w-96, scrollable)
- Campaign name: auto-generated "[Goal] — [Primary Area] — [Date]", editable input
- Targeting summary: household count + targeting method label
- ScheduleEditor
- CostBreakdown
- Campaign seeding checkbox: "Send a copy to yourself (free)" — default ON, shows seed address from profile
- Payment method: mock display "Visa ending in 4242" with Change link (non-functional Round 1)
- "Approve & Send Card 1" button: big teal, full-width, with loading state
- Sub-text: "Cards 2-3 send on schedule unless you pause. You can cancel within 1 hour."
- Double-click protection: disable button on click, loading spinner
- Approve action: calls server to create MailCampaign from draft, deletes draft, shows confirmation
- Confirmation screen: "Your campaign is live!" with [View Campaign] and [Send More Mail] buttons
- **Verify:** All data from Steps 1-3 displays correctly. Approve creates campaign. Confirmation shows.

### Phase 3: Campaigns Page (Tasks 8-11)

**Task 8: Create server model + endpoints for MailCampaign**
- `app/models.py`: Add `MailCampaign` model (tablename `mail_campaigns`):
  - id, org_id, created_by, name, status, goal_type, service_type, sequence_length, household_count, total_cost, total_spent, targeting_data (JSONB), design_data (JSONB), schedule_data (JSONB), cards_data (JSONB), approved_at, draft_id, timestamps
  - Status: draft/approved/printing/in_transit/delivered/results_ready/completed/paused
  - org_id FK + CASCADE + index
- `app/dao/mail_campaign_dao.py`: create, get_by_id, list_for_org, update_status
- `app/services/mail_campaign_lifecycle.py`: approve_campaign (converts draft → MailCampaign), get_detail, list_campaigns
- `app/blueprints/mail_campaigns.py`: POST `/api/mail-campaigns` (approve), GET list, GET detail, PATCH (pause/resume)
- Migration: `20260326_add_mail_campaigns.py`
- Register blueprint in `app/__init__.py`
- **IMPORTANT:** Do NOT touch existing `campaigns` table/model/blueprint. MailCampaign is completely separate.
- **Verify:** curl POST to create a MailCampaign → returns correct data. curl GET list → returns campaigns for org only.

**Task 9: Create `useCampaignList` composable + API layer**
- Files: `src/composables/useCampaignList.ts`, `src/api/mailCampaigns.ts`
- API: `listMailCampaigns()`, `getMailCampaign(id)`, `approveMailCampaign(draftId)`, `pauseMailCampaign(id)`, `resumeMailCampaign(id)`
- Composable: campaigns list, drafts list (from existing drafts API), active tab (active/drafts/completed/paused), search, sort, filtered computed, tab counts
- **IMPORTANT:** This is `mailCampaigns.ts` — NEW file. Do NOT modify existing `campaigns.ts`.
- **Verify:** Composable loads data from both endpoints (mail campaigns + drafts).

**Task 10: Create campaign list components**
- Files: `src/components/campaigns/CampaignListCard.vue`, `CampaignStatusBadge.vue`, `CampaignFilters.vue`
- **CampaignListCard:** Name, status badge, household count, sequence length, cost, per-card progress bars. Actions: View (router-link), Pause/Resume, Run Again.
- **CampaignStatusBadge:** Colored dot/pill by status. Teal = on track, amber = needs attention, gray = completed, orange = paused.
- **CampaignFilters:** Search input, sort dropdown (newest/oldest/best performing), filter dropdowns (goal type, date range).
- Draft cards: show wizard step progress "Draft (Step 2 of 4)" with Resume/Delete buttons.
- **Verify:** Cards render with all data. Status badges show correct colors. Filters work.

**Task 11: Create `Campaigns.vue` page**
- File: `src/pages/Campaigns.vue`
- Tab bar: Active / Drafts / Completed / Paused (with counts in parentheses)
- Tabs styled as segmented control (bg gray, active tab white with shadow)
- "+ Send Postcards" button top-right (routes to `/app/send`)
- CampaignFilters below tabs
- CampaignListCard for each campaign/draft
- Empty states per tab with helpful CTA: "No active campaigns yet. Send your first postcards →"
- Pagination: 20 per page
- Route already added by Prerequisites: `/app/campaigns`. Prerequisites adds these routes with stub page components. Terminal 3 replaces the stubs with real `Campaigns.vue` and `CampaignDetail.vue` pages.
- **Verify:** Page renders with mock campaigns. Tabs switch. Search and sort work. Empty states display correctly.

### Phase 4: Campaign Detail Page (Tasks 12-14)

**Task 12: Create campaign detail components**
- Files: `src/components/campaigns/CampaignKPICards.vue`, `SequenceTimeline.vue`, `CampaignActions.vue`
- **KPICards:** 4 cards in a row — Households Mailed (from campaign data), Calls Received (0 + "Results come in after delivery"), Revenue ($0 + "Connect CRM for revenue tracking"), Total Spent (from campaign). Style: match existing Dashboard KPI cards.
- **SequenceTimeline:** Visual per-card status progression. Each card: PostcardPreview thumbnail + status steps (Approved → Printing → In Mail → Delivered). Upcoming cards show scheduled date. Completed show actual dates. Edit button on unprinted cards.
- **CampaignActions:** Pause/Resume button, "Run Again" button (creates new draft pre-filled from this campaign), Edit unprinted cards link.
- **Verify:** Components render with mock campaign data. Timeline shows correct statuses.

**Task 13: Create `CampaignDetail.vue` page**
- File: `src/pages/CampaignDetail.vue`
- Back link: "← All Campaigns" → `/app/campaigns`
- Header: campaign name + status badge
- KPICards row
- SequenceTimeline
- Targeting summary with small static map image (placeholder rectangle for Round 1)
- CampaignActions
- `useCampaignDetail` composable: loads single campaign from API by route param `id`
- Route already added by Prerequisites: `/app/campaigns/:id`. Prerequisites adds this route with a stub component. Terminal 3 replaces it with the real `CampaignDetail.vue` page.
- **Verify:** Page loads campaign by ID. All sections render. Back link works.

**Task 14: Mock status progression (for demo/testing)**
- After campaign approval, simulate status changes in the client:
  - On approval: status = `approved`
  - After 30 seconds: `printing`
  - After 60 seconds: `in_transit`
  - After 90 seconds: `delivered`
- Use `setTimeout` in the campaign detail composable
- Status changes update the SequenceTimeline in real-time
- Easy to remove when real tracking connects (just delete the setTimeout block)
- **Verify:** Approve a campaign → watch status advance through stages on the detail page

### Phase 5: Integration (Tasks 15-17)

**Task 15: Wire up multiple entry points**
- `+ Send Postcards` (nav button) → `/app/send` → new wizard (already works from Prerequisites)
- Campaigns page "Resume" draft → `/app/send/:draftId` (already works)
- Campaigns page "Run Again" → create new draft pre-filled from completed campaign, navigate to `/app/send/:newDraftId?step=4` (open at Step 4 review)
- **Verify:** All 3 entry points work correctly

**Task 16: Update WizardShell**
- File: `src/components/wizard/WizardShell.vue` (MODIFY)
- Change imports: `StepGoalStub` → `StepGoal`, `StepReviewStub` → `StepReview`
- **Blast radius:** Only change import lines. Read file fully first.
- **Verify:** Full wizard flow with real Step 1 + real Step 4. Steps 2-3 use stubs (or real components if those terminals are merged).

**Task 17: Create mock campaign seed data**
- For the Campaigns page to be useful during development, seed 5-7 mock campaigns:
  - 1 completed (neighbor marketing, good results)
  - 1 in_transit (seasonal tune-up, Card 2 of 3 in mail)
  - 1 approved (target area, just approved)
  - 1 paused
  - 2 drafts at different wizard steps
- Return from list endpoint when no real campaigns exist yet
- **Verify:** Campaigns page shows all mock campaigns in correct tabs

## Codebase Guardian Rules

- Do NOT modify `src/api/campaigns.ts` or `src/stores/useCampaignStore.ts` — those are for analytics campaigns
- New files: `src/api/mailCampaigns.ts`, `src/composables/useCampaignList.ts` — completely separate
- Server: `MailCampaign` model in new table `mail_campaigns` — do NOT modify existing `campaigns` table
- Before modifying WizardShell.vue: read fully, only change import lines
- After every task: `npm run build` must pass
- After Task 17: run existing e2e Playwright tests

## Merge Order Note

This terminal merges SECOND (after Prerequisites, before Terminal 1 and Terminal 2). The merge order is:
1. Prerequisites → main
2. **Terminal 3 (this)** → main (rebase first)
3. Terminal 1 → main (rebase first)
4. Terminal 2 → main (rebase first)

Terminal 3 merges before 1 and 2 because Steps 1 and 4 bookend the wizard — they need to be in place for other terminals to test the full flow.

## Verification (after all 17 tasks)

1. `npm run build` passes with zero errors
2. Navigate to `/app/send` → Step 1 shows goal cards
3. Top 3 goals prominent, rest under "More options"
4. Seasonal goal appears in primary only during spring/fall
5. "New Mover Welcome" shows with "Coming Soon" badge, not selectable
6. Select a goal → SequenceConfig appears with defaults
7. Click Next → Step 2 (stub or real) → Step 3 (stub or real) → Step 4 (real review)
8. Step 4 shows postcard preview + campaign name + schedule + cost
9. Campaign name auto-generated: "[Goal] — [Area] — [Date]", editable
10. Per-card dates spaced correctly from Step 1 spacing
11. Cost breakdown shows correct per-card and total math
12. Campaign seeding checkbox works (default ON)
13. "Approve & Send Card 1" creates campaign, shows confirmation
14. Navigate to `/app/campaigns` → see the new campaign in Active tab
15. Campaign detail page: KPI cards, sequence timeline, targeting summary
16. Mock status progression: approved → printing → delivered over 90 seconds
17. Drafts tab shows in-progress drafts with Resume/Delete
18. "Run Again" on completed campaign creates new pre-filled draft
19. Existing analytics pages (Dashboard, AI Insights, etc.) still work unchanged
20. Run existing e2e tests → all pass
21. Drake checkpoint: "Go through the whole wizard. Pick a goal, see the postcard, approve it. Then check your campaigns page. Does this feel like a real product?"

---
name: PostCanary V1 Build Decisions
description: All UX, architecture, and product decisions for the V1 direct mail platform build. Agreed upon 2026-03-23 with expert panel input.
type: project
---

## Build Strategy
- Build frontend first with realistic mock data ("model home" approach)
- Connect real services (Melissa Data, print shops, USPS) later
- 3 parallel terminals: Map & Targeting, Design Studio, Campaign Builder
- Plan in order (Map → Campaign → Design), code all 3 simultaneously
- Branch off Dustin's multi-user branch once it merges to main
- Each terminal gets its own feature branch — no file overlap

## Navigation & App Shell
- **Collapsible sidebar** (replacing current top nav)
  - Auto-collapses to icons on Map and Design pages for max canvas space
  - Section grouping by intent: "Send Mail" / "Results" / "Account"
- **"+ Send Postcards" button** — top of sidebar, big teal, always visible
- **Campaign filter stays in top bar** — global filter across results pages (NOT redundant with Campaigns page — different purpose)
- **Top bar:** Page title | Campaign filter dropdown | ROI stat | Notification bell | Avatar

## Sidebar Structure (FINAL — Round 2)
```
+ Send Postcards          (big teal button)

SEND MAIL
  Campaigns
  Designs

RESULTS
  Dashboard               (unchanged)
  Map                     (viewing tool, evolved from Heatmap)
  Analysis                (was "AI Insights")
  Audience                (was "Demographics")
  History                 (unchanged)

ACCOUNT
  Settings                (+ team management from Dustin's work)
```
Note: Map is under RESULTS (not Send Mail) because it's a viewing tool. Targeting happens inside the wizard.

## Page Renaming
- "AI Insights" → "Analysis"
- "Demographics" → "Audience"
- "Heatmap" → "Map"

## Existing Pages
- Dashboard, Analysis, Audience, History, Settings — ALL STAY AS-IS
- No features lost, no consolidation, no merging
- Just renamed and repositioned in sidebar

## New Pages
- **Home** — command center with campaign overview, recommendations, autopilot progress
- **Campaigns** — list/manage all campaigns (active, drafts, completed)
- **Map** — evolved Heatmap with targeting tools added on top
- **Designs** — postcard library + templates + design studio

## Terminal Assignments (Round 1 only)
- Terminal 1: Map & Targeting (wizard Step 2 targeting map)
- Terminal 2: Design Studio (wizard Step 3 postcard designer)
- Terminal 3: Campaign Builder (wizard Steps 1+4 + Campaigns page + Campaign detail + drafts)
- NOTE: Home page, sidebar redesign, analytics integration, billing = Round 2+. NOT Terminal 3 Round 1.
- Round 1 entry point: add "+ Send Postcards" button to existing top nav (minimal change)

### Nudge-to-Send Detection (from Drake insight)
The product should detect when someone is ACTIVE but not SENDING and gently push them forward:

**In the Design Studio (Step 3):**
- If they've been editing for 5+ minutes without clicking Next:
  "Your postcard looks great! Remember — done is better than perfect. Your first campaign teaches you more than another hour of tweaking."
- If they've swapped templates 3+ times:
  "Can't decide? Our recommended template (★) is based on what works best for [their industry]. Trust the data!"

**On the Campaigns page:**
- If they have a draft sitting for 3+ days:
  "Your [Campaign Name] draft is ready to go. Every day you wait is a day your competitors are mailing."
- If they've created multiple drafts but approved zero:
  "You've designed 3 campaigns but haven't sent one yet. Your first send is the hardest — it only gets easier from here."

**In the chatbot (NEPQ-style, not pushy):**
- "I noticed you've been working on your postcard design. What's holding you back from sending?"
- If they say "I'm not sure it's good enough": "The data says your template has a 2.4% response rate across similar businesses. That's solid. What would make you feel ready?"

**Voice:** encouraging, never shaming. "Your competitors are mailing" creates urgency. "Done is better than perfect" gives permission. Always frame sending as the smart move, not editing more.

### Brand Kit UX Flow
1. Onboarding: 4 questions → brand kit auto-created (customer never sees "brand kit" as concept)
2. Website scrape runs in background during onboarding (10-20 sec)
3. First campaign Step 3: postcard appears auto-populated → "We found this on your website. Confirm."
4. Settings page: "Your Brand" section — manage all brand elements, see completeness %, rescrape website
5. Website URL auto-cleaned for postcard: strip https://, www., trailing slash → "martinezplumbing.com"
6. Brand kit completeness nudge shown in Settings AND subtly in Step 3 when elements are missing

### Smart Onboarding = Modal After First Login
- Same pattern as existing OnboardingModal in codebase
- Pops up on first login: "Let's get you set up — 60 seconds"
- 4 questions (name, location, services, website URL)
- If dismissed: returns next login until completed
- On completion: triggers website scrape in background, closes modal, Home page visible
- Progressive questions (service area radius, budget, etc.) come later in context — NOT in this modal

### Mock Data Strategy (Round 1 — no Melissa Data yet)
- Drawing an area shows realistic household COUNT based on area size (~500/sq mile suburban)
- Shaded area overlay on map — no individual household dots or addresses
- Filters adjust the count (homeowner filter reduces by ~30%, etc.)
- Cost calculation works against the mock count
- Feels real without needing any external data source
- When Melissa Data connects later: swap mock count for real household data, everything else stays the same

### Testing Approach (Round 1)
- Get it working first, full test coverage is Round 2
- Test CRITICAL PATHS only: wizard state management, data contract validation, draft save/resume
- Beck: "make it work, make it right, make it fast — in that order"

### Round 1 Prerequisites (build as shared infrastructure BEFORE terminals start)
These aren't terminal work but the wizard DOESN'T WORK without them:
- **Smart onboarding** (4 questions + trigger website scrape)
- **Brand kit service** (scrape website → store → serve to Design Studio)
- **AI generation service** (headlines, review selection, offer text — model-agnostic interface)
- **Template designs** (6 layouts × 5 campaign presets — design files, not code)
- **"+ Send Postcards" button** on existing top nav

### What Waits for Round 2+
- Sidebar redesign + Home page
- Campaign strategy engine (recommendations)
- Budget intelligence engine
- Analytics integration (campaign → mail records)
- Leads vs completed jobs analytics
- AI Insights prompt redesign
- Chatbot redesign (NEPQ)
- Notification system (bell + emails)
- Churn prevention / pause flow
- Conversion timeline bell curves
- Cross-client benchmarking
- Content moderation (manual review initially)
- GBP integration (postcards work without reviews)
- Monthly health reports (Business Hub)

## Campaign Wizard
- **Full-page takeover** (sidebar disappears, focused 4-step flow)
- Steps: Goal → Target → Design → Review & Send
- Back button between steps, X to exit with "save as draft" prompt
- **Auto-save every step** — drafts resume from Campaigns page
- "Spring HVAC — Draft (Step 2 of 4)" on Campaigns page

## Home Page
- Different for new users vs returning users vs dormant users
- Returning: quick stats, recommended next mailing (with WHY), campaign cards, autopilot progress
- New: welcome + guided 4-step path to first mailing
- Dormant: re-engagement nudge with recommendation
- Recommended Next Mailing card — AI-generated, explains reasoning

## Mobile Strategy
- Mobile-friendly: Home, Campaigns list, results, notifications, Settings
- Desktop-only: Map & Targeting, Design Studio, Campaign Wizard
- Desktop-only pages show friendly message on mobile: "This works best on a computer"

## Voice & Tone
- **One voice for everyone** (adaptive depth by role deferred to later)
- Persona: "Your marketing-savvy operations manager"
- Plain English, their words (calls/jobs/customers, not leads/conversions)
- Numbers always mean something ($14K from $247, not ROI: 56.7x)
- Every recommendation has a plain-English WHY
- Celebrate wins, diagnose misses honestly
- If it sounds like a software manual, rewrite it
- Test: read it out loud — if it sounds like a text to a business partner, it's right

## CORE PRINCIPLE: Messaging Must Match Context
- Postcard messaging MUST align with campaign goal, recipient type, season, and service
- Same campaign can have different messaging for past customers vs neighbors
- Design Studio templates are CONTEXT-AWARE — pre-loaded with the right messaging based on Steps 1 and 2 of the wizard
- This is NOT a V2 feature. Template recommendations in V1 must be goal-aware and recipient-aware
- Examples:
  - Seasonal tune-up to past customer: "Time for your annual AC tune-up"
  - Seasonal tune-up to neighbor: "Your neighbors trust us — spring special"
  - Neighbor marketing to neighbor: "Your neighbor at [street] just chose us"
  - Win-back to past customer: "We miss you! Here's $75 off"
  - Storm response: "Hail damage in your area? We're already helping neighbors"
- The campaign goal flows from Step 1 → Step 2 (targeting) → Step 3 (design) → Step 4 (review)
- At every step, the system's recommendations and messaging reflect the full context

## Campaign Strategies / Playbooks
- **Neighbor Marketing** — target neighbors of recent jobs. Exclude past customers by default.
- **Seasonal Tune-Up** — target past customers who got the SAME service last year + their neighbors. Include past customers. Different messaging for customers vs neighbors. System recommends based on industry + season. (e.g., spring = remind AC tune-up customers from last spring + their neighbors)
- **Cross-Service Promotion** — target past customers of one service to promote a different service (heating customers → AC offer). Include past customers. Separate from seasonal.
- **Storm Response** — target addresses in weather-affected area. Include past customers. No frequency cap (urgent). Fast turnaround.
- **Win Back** — target past customers who haven't called in 12+ months. Include past customers (they ARE the target).
- **Target an Area** — manual area selection on map. No automatic customer targeting.
- **New Mover Welcome** — target recent homebuyers in service area. Highest-value audience (new homeowners spend heavily in first 2 years). Needs NCOA/Melissa new mover data — placeholder in V1, functional when data source connected.
- **Other** — free-text goal, AI interprets and recommends setup.
- Each strategy auto-sets: inclusion/exclusion defaults, messaging templates, design recommendations, frequency rules

## Targeting Defaults
- **Job recency for "Around My Jobs"**: 60 days first time, 30 days after that
- **Past customer inclusion**: OFF by default for neighbor marketing, ON for seasonal/storm/win-back
- **Cross-campaign frequency exclusion**: 30 days default, OFF for storm response
- **Filters**: Smart defaults by industry, always adjustable
- **Address fatigue display**: Show transparent math (total - excluded = final count)

## Map & Targeting (Wizard Step 2) — LOCKED

### Architecture
- Sidebar Map page stays as-is (viewing data, toggle layers, existing Heatmap enhanced slightly)
- Sidebar Map moves to "Results" section (it's a viewing tool, not sending tool)
- Campaign wizard Step 2 has its OWN targeting map (full-page, purpose-built)
- Shared base Leaflet map component, wizard adds targeting tools on top

### Sidebar Map Page (small upgrades to existing Heatmap)
- Toggle layers: Customers, Mail Sent, Matched Jobs (currently only "matched")
- Marker display toggle: Clustered / Markers / Hidden
- Campaign filter via top bar (already exists)
- "Send Postcards" button → launches wizard
- That's it. Minimal changes.

### Wizard Step 2 — Targeting Map
**Layout:** Full-width map (left) + collapsible right panel (layers, targeting method, filters, selection/cost)

**First-time guided prompt:** Overlay on first visit with 3 clear buttons: Around My Jobs / I'll Draw / Enter ZIP Codes. Disappears after first use.

**Three targeting methods (can combine all three):**
1. **Around My Jobs** — pulls recent jobs, draws radius around each
   - Job recency: 60 days default (first time), 30 days after
   - Radius: 0.5 miles default, adjustable (0.25 - 2.0 miles)
   - Individual jobs can be unchecked
   - Jobs shown as pins, radii shown as teal circles, overlapping merges
2. **Draw on Map** — circle, rectangle, or polygon
   - Drawing tools require EXPLICIT activation (no accidental draws)
   - Click tool → draw → release. Handles for resize, drag to move, X to delete.
   - Multiple shapes allowed (combine two neighborhoods)
   - Clear all button
3. **Enter ZIP Codes** — type or paste, areas highlight on map

All methods combine. Deduplicated union for household count.

**Area display:** Teal semi-transparent shading (NOT individual household dots). Clean and readable.

**Layers (toggleable):** Past customers, mail sent, matched jobs. Marker display: clustered/markers/hidden.

**Filters panel (collapsed by default, "X applied" indicator):**
- Homeowner/renter toggle
- Home value range (slider)
- Year built range (slider)
- Property type checkboxes (single family, condo, apartment, etc.)
- Smart defaults by industry (e.g., roofing = homeowners, single family, 15+ year homes)
- Always adjustable

**Exclusions (Smart Mailing section):**
- Past customer toggle: ON/OFF based on campaign goal (auto-set from Step 1)
- Cross-campaign frequency: exclude addresses mailed within [30 days] from other campaigns
  - OFF for storm response (urgent)
- Do Not Mail list: auto-excluded (managed in Settings)
- Transparent math showing all exclusions and final count

**Household count + cost:**
- Real-time updates as area/filters change
- Shows: total in area, excluded (past customers, recently mailed, do-not-mail), final count
- Cost = final count × per-postcard rate × sequence length (from Step 1)
- Card-by-card cost breakdown for sequences
- First-time users: cost only, no estimated return (we don't have their data)
- Returning users: cost + estimated return based on THEIR actual response rate and job value

**Save audience:** Name and save targeting setup for reuse. Saved audiences appear as a fourth targeting method.

**Encouraging small campaigns:** If <100 households, show positive messaging. Never shame small campaigns.

### Data Contract (TargetingSelection interface)
```typescript
interface TargetingSelection {
  campaignGoal: string         // from Step 1 — needed for analytics segmentation
  serviceType: string | null   // from Step 1 — needed for benchmarking
  sequenceLength: number       // from Step 1 — affects cost + design
  sequenceSpacingDays: number  // from Step 1
  areas: TargetingArea[]
  method: 'draw' | 'zip' | 'around_jobs' | 'combined'
  filters: {
    homeowner: boolean | null
    homeValueMin: number | null
    homeValueMax: number | null
    yearBuiltMin: number | null
    yearBuiltMax: number | null
    propertyTypes: string[]
  }
  excludePastCustomers: boolean
  excludeMailedWithinDays: number | null
  totalHouseholds: number
  excludedPastCustomers: number
  excludedRecentlyMailed: number
  excludedDoNotMail: number
  finalHouseholdCount: number
  estimatedCostSingle: number
  estimatedCostSequence: number
  savedAudienceName: string | null
  jobsUsed: JobReference[] | null
  jobRadiusMiles: number | null
}
```

### Campaign Goal Defaults (from Step 1, auto-applied in Step 2)
| Goal | Include Past Customers | Frequency Exclusion | Default Postcards | Spacing |
|------|----------------------|--------------------|--------------------|---------|
| Neighbor Marketing | OFF | 30 days | 3 | 2 weeks |
| Seasonal Tune-Up | ON | 30 days | 3 | 2 weeks |
| Storm Response | ON | OFF | 2 | 1 week |
| Win Back | ON (they ARE the target) | 30 days | 3 | 3 weeks |
| Target an Area | N/A | 30 days | 3 | 2 weeks |
| Cross-Service Promo | ON | 30 days | 2 | 2 weeks |

### Timing Warnings
- Flag bad send timing: Thanksgiving week, Christmas-New Year, July 4th week
- Show warning with option to adjust or send anyway
- Scheduling details handled in Step 4 (Campaign Builder territory)

### ROI Display
- First-time users: cost only + "After your first campaign, we'll show estimated returns based on your actual results"
- Returning users: cost + estimated return using THEIR response rate and avg job value

### Do Not Mail List
- Managed in Settings
- Auto-excluded from every campaign
- Shows in targeting math as separate line item

## Campaign Builder — LOCKED

### Wizard Flow (full-page takeover)
- 4 steps with customer-friendly names (Wiebe check):
  Step 1: "Choose Your Goal" | Step 2: "Pick Your Neighborhood" | Step 3: "Your Postcard" | Step 4: "Review & Send"
  (Step 3 renamed from "Design Your Postcard" — Wiebe review 2026-03-25: "Design" implies they build from scratch, but V1 auto-generates the postcard. "Your Postcard" implies ownership without promising effort.)
- Progress bar shows completion % (Hulick check): "Almost there — 75% done" after Step 3
- Progress bar with clickable completed steps (jump back without losing data)
- Running summary of completed steps at top of each screen
- Auto-save every interaction (drafts resume from Campaigns page)
- Exit (X) just closes — auto-save means no "are you sure?" needed
- Loading overlay between steps (keep previous step visible)

### Visual Design Notes (Schoger review)
- Goal cards: recommended option needs distinct visual weight (different bg color, larger, border highlight). "More options" visually recessed.
- Targeting map right panel: break into TABS within panel — "Target" (method + area), "Refine" (filters + exclusions), "Summary" (count + cost). One concern at a time.
- Campaign cards: colored left border for status (teal = on track, yellow = needs attention, red = problem). Drafts slightly grayed. Completed = clean results. Status readable from border color alone.

### Step 1: Goal Selection
- Goals: Neighbor Marketing, Seasonal Tune-Up, Target an Area, Storm Response, Win Back, Cross-Service Promo, Something Else
- **Display organization (Don Norman check):** Show top 3 prominently (Neighbor Marketing, Target an Area, Seasonal if in season). Others under "More options" — available with one click, never locked. Reduces choice paralysis for first-timers.
- Seasonal Tune-Up only appears in spring/fall, asks which service to promote
- Each goal has one-liner WHY explanation
- "Recommended" tag based on user's situation
- Sequence length selector after goal pick (1-5 cards, defaults by goal)
- Spacing selector (1 week to 4 weeks, defaults by goal)
- "Something Else" = free text field, uses Target an Area defaults for V1

### Step 4: Review & Send
- Left: Postcard preview (front/back, swipe through sequence cards)
- Right: Campaign summary, schedule, cost
- Schedule: per-card date pickers, pre-filled from Step 1 spacing, each independently adjustable
- Min 5 days between cards (production time)
- Warning for unusual gaps
- Cost: per-card breakdown (Card 1: $183, Card 2: $183, Card 3: $183)
- Payment: per-card (Option B) — charges when each card prints, not all upfront
- Payment method shown (Visa ending 4242)
- "Approve & Send Card 1" button — Cards 2 and 3 send on schedule unless paused
- 1-hour cancellation window after approval
- Confirmation screen with "View Campaign" and "Send More Mail" CTAs

### Campaign Auto-Naming
Format: [Goal] — [Primary Area] — [Date]
Example: "Neighbor Marketing — Scottsdale 85281 — Mar 23"
Always editable.

### Campaigns Page
- Tabs: Active / Drafts / Completed / Paused (with counts)
- Search campaigns by name, area, date
- Sort: newest, oldest, best performing, most revenue, lowest cost per call
- Filter: by goal type, by area/ZIP, by date range
- Pagination: 20 per page
- Campaign cards show: name, status, per-card progress, spend vs total, results
- Actions: View Details, Pause/Resume, Run Again, Edit (unprinted cards)
- Drafts show which wizard step + Resume/Delete buttons
- "Run Again" on completed = new campaign with same goal/targeting/design, opens at Step 4

### Campaign Detail Page
- KPI cards: households mailed, calls, revenue, spent
- Sequence progress: per-card status with postcard thumbnails
- Editable: can change design for unprinted cards, change dates for unprinted cards
- Targeting summary with small map
- Visual timeline
- Pause/Resume/Run Again actions

### Home Page
- Returning user: greeting, 3 KPI cards, active campaigns, recommended next mailing, autopilot progress, recent results
- Social proof element (Cialdini check): "PostCanary users sent X postcards this month" — community momentum indicator. Shows they're not alone. Grows more powerful at scale.
- New user: welcome, 4-step overview with time estimates, "Send Your First Postcards" CTA, link to upload for analytics
- Dormant user: re-engagement nudge with recommendation
- Time estimates on steps for new users ("30 seconds," "1 minute," "2 minutes")

### Campaign Statuses
Draft → Printing → In Transit → Delivered → Results Ready → Completed
Also: Paused (can resume)

**Status reliability (Charity Majors check):**
- Each status depends on external services (print shop API, USPS tracking)
- If external service doesn't respond within expected window, show "Checking status..." not stale state
- Fallback estimated timelines if real-time tracking unavailable
- Never show a status we're not confident about — honest uncertainty beats false confidence
- Log all status transitions for debugging

### Notifications
- Campaign approved → in-app + email receipt
- Card printing → in-app only
- Card in the mail → in-app + email
- Estimated delivery → in-app + email
- First result detected → in-app + email
- 2 days before next card → in-app + email (last chance to edit)
- Sequence complete → in-app + email summary

### Budget Management
- Monthly budget cap in Settings (optional)
- Warning in Step 4 if campaign would exceed budget
- Not blocking — they can approve anyway

### Content Moderation
- AI scan of postcard text before printing
- Clean campaigns go straight through
- Flagged campaigns held for manual review (within 1 business day)

### Zero Result Handling
- Encouragement + specific suggestions for next campaign
- Prompt to check CRM data is up to date
- Easy path to try again

### Job Type Filtering (Around My Jobs)
- Filter by service type
- Auto-exclude emergency and warranty jobs from neighbor marketing
- Smart defaults by industry

### Member Approval Flow (multi-user)
- Members can create campaigns but need owner/admin approval
- Notification to owner: "Sarah created a campaign. Approve?"

### Billing
- Per-card charges (not all upfront)
- Monthly statements downloadable as PDF
- Itemized per campaign per card
- Email receipt per charge

### PostHog Analytics Events
- wizard_started, wizard_step_completed, wizard_abandoned
- targeting_method_used, filter_changed, sequence_length_changed
- campaign_approved, campaign_paused, campaign_resumed
- draft_resumed, draft_deleted

### Multiple Entry Points
| Entry | Flow |
|-------|------|
| + Send Postcards (sidebar) | Full wizard Step 1 |
| Map page "Send Postcards" | Wizard Step 1 |
| Home "Set It Up" recommendation | Pre-filled, opens Step 3 |
| Campaigns "Resume" draft | Opens at saved step |
| Campaigns "Run Again" completed | Pre-filled, opens Step 4 |

## CRITICAL: Campaign → Analytics Auto-Integration

### The Problem
Currently analytics requires manual CSV upload of mail + CRM data. If customers send mail through PostCanary, the mail data should flow into analytics AUTOMATICALLY.

### The Solution
When a campaign is approved and postcards go out:
1. Auto-create mail staging records for every address × every card in sequence
2. Tag with campaign_id, org_id, sent_date per card
3. Records feed into existing matching engine
4. When CRM data arrives (upload or API sync), matching runs automatically
5. Campaign results update in real-time as matches are detected

### What Users See
- PostCanary-sent campaigns: "Automatically tracked — no upload needed"
- They only need to provide CRM data (upload or connect CRM)
- With CRM API connected: FULLY automatic, zero manual work
- Can still upload mail CSVs for campaigns sent through OTHER providers

### Server Needs
- New service: campaign_mail_service — converts targeting selection → mail staging records
- Auto-trigger matching when new CRM data arrives
- Deduplication if someone also uploads a mail CSV for the same campaign

### Subscription Cancellation with Active Campaigns
- Complete the sequence at standard rate (no subscription discount)
- Notify: "Reactivate to keep your discounted rate"
- Options: reactivate, continue at standard rate, cancel remaining cards
- Retention opportunity

### PDF Proof Download (Step 4)
- Print-quality PDF of front and back at actual postcard size
- For review, sharing with partners, keeping records

### Security Notes (Troy Hunt check)
- Address sample preview: verify Melissa Data license allows displaying household addresses to end users before building
- Saved audiences must be org_id scoped — cannot be enumerated across orgs
- All targeting queries must filter by org_id — no exceptions
- Household data from Melissa: confirm caching/storage rights vs query-only rights

### Address Sample Preview (Step 4)
- Show 10 random sample addresses from targeting selection
- Spot-check that targeting makes sense before committing

### Existing Customer Transition
- One-time "What's New" announcement when campaign features launch
- Not blocking — explains changes, offers path to try it, "Maybe Later" option
- All existing analytics features still work unchanged

### Conversion Timeline Bell Curve
- Per-campaign chart showing when responses typically come in (days since mailing)
- Segments: by industry, campaign goal, service type, season, their own data
- No data yet → "We'll build your timeline after your first campaign"
- 1-2 campaigns → data points plotted, too early for curve
- 3-5 campaigns → basic curve with honest confidence level
- 10+ campaigns → solid curve segmented by type
- Shows "response window" status: "You're on day 12 — right in the peak window"
- Tells them when campaign is "done": "95% of responses come within 25 days. You're at day 31."

### Campaign Status Timeline (Visual)
- Shows every step: Approved → Printing → In Mail → Delivered → Response Window → Complete
- Customer always knows exactly where things are
- Proactive — no need to ask or call support

### Zero Customer Service Calls Philosophy
- EVERY screen answers questions before they're asked
- Inline explanatory text (fades after familiarity)
- Proactive status updates at every step
- Contextual help per wizard step ("Need help?" with step-specific guidance)
- Failed payment: self-service resolution options
- Print delays: proactive communication, no action needed
- Post-delivery check-in email: "here's what to expect" with timeline
- Chatbot as fallback for anything that falls through

## Churn Prevention / Cancellation Flow
- NEVER just let them cancel — start a conversation
- Step 1: Ask why (too expensive, no results, taking a break, switching, other)
- Step 2: Offer alternatives based on reason (downgrade tier, pause account)
- Step 3: Warn about active campaigns (complete at current rate vs cancel remaining)
- Step 4: Loss aversion — show what they lose (optimization data, saved audiences, autopilot progress)
- PAUSE OPTION: 1-3 months, subscription stops, data stays intact
- Pause notification sequence: 7 days, 3 days, 1 day before end, then day-of, day 15, day 30
- Archive data after 30 days post-pause-end (not immediate delete)
- Reactivate within 30 days = keep everything. After 30 days = start fresh.
- **Track pause/cancel reasons internally (Patrick Campbell check):** Log why they're leaving. If 40% say "too expensive" that's a pricing problem. If 30% say "not seeing results" that's a product problem. Internal dashboard, not customer-facing.

## Leads vs Completed Jobs — Two-Layer Analytics
### The Problem
Current analytics only tracks completed jobs from CRM. But the customer journey is: postcard → CALL (lead) → quote → job → CRM update. We're missing the first signal.

### Two Layers
1. **Leads** (phone calls, QR scans, form fills, manual entry) — when the phone rings
2. **Completed Jobs** (CRM match) — when the job closes and revenue is earned
- Both shown separately in campaign results
- Lead-to-close rate tracked (what % of leads become jobs)
- Two separate bell curves: lead response timeline + job completion timeline

### V1 Lead Sources
1. QR code scans — automatic (PostCanary-hosted landing page, unique QR per postcard)
2. Manual lead logging — "Log a Lead" button on campaign detail page (address or phone, source, notes)
3. Call tracking — V1.5, needs CallRail or similar integration

### Timeline Accuracy
- Lead timeline: "Your phone starts ringing around day 6-14" (what customers care about)
- Job timeline: "Jobs close in your CRM around day 18-30" (what ROI calculations need)
- Before lead data exists: show job timeline with honest note "actual calls come 1-2 weeks earlier"
- After lead data: show both curves
- Always nudge toward lead logging and QR tracking for better data

## Lead Upload Rule
- Manual upload = FORCED to pick one: "leads" or "completed jobs" — never both in same file
- API connections pull both automatically and categorize them
- Two separate uploads if they want both

## Design Studio — LOCKED

### Core Philosophy
- **Template-first (Option A)** — customer sees a near-perfect postcard and just clicks approve
- Goal: as little editing as possible. The auto-generated postcard should be so good they don't WANT to change it
- Blank canvas available but buried as secondary option
- Templates are context-aware: pre-populated based on campaign goal, recipient type, service, industry, season
- "Damn near perfect" means: right messaging for the goal, right photos for the industry, right offer structure, right layout proven to convert
- Editing is available but the UX steers them toward approval, not customization
- This means the template engine + auto-populate logic is the HARD part — more important than the design editor itself

### What's Known
- Fabric.js for the editor (free, full control)
- 6x9 postcards only for V1
- Templates organized by campaign goal + industry
- AI auto-populate from website (scrape logo, photos, phone, offers, certifications)
- Back of postcard: address block, QR code, return address in LOCKED zones
- Each card in a sequence has different purpose AND escalates (Kennedy review):
  - Card 1 "Irresistible Offer": Full value stack, introduce company + offer. Goal: get them thinking.
  - Card 2 "Social Proof + Deadline": NEW testimonial + real deadline + "X spots left." Goal: create urgency.
  - Card 3 "Last Chance + Sweetener": Final notice + NEW bonus not on Cards 1-2. Goal: push over the edge.
  - Each card is structurally DIFFERENT, not same design with different photo.
- Risk reversal levels vary by recipient type (Kennedy review):
  - Past customers: light ("Same satisfaction guarantee as always")
  - Cold prospects/neighbors: HEAVY ("Free estimate. No trip charge. No obligation. Licensed & insured. 4.9 stars. Guaranteed.")
  - Win-back: acknowledge the gap + special come-back offer
- Messaging must align with campaign goal and recipient type (core principle)

### Printer Spec Handling
- Design to most conservative spec (largest bleed, smallest safe zone)
- V1 standard: USPS 6x9, 0.125" bleed, 0.25" safe zone, 300 DPI, CMYK
- Each printer gets a profile stored in system (bleed, safe zone, resolution, color profile, format)
- Export auto-adapts per printer from master design
- One campaign can go to multiple printers — each gets correctly formatted output

### Effective Postcard Design (Research-Validated — Fishkin + Berger rigor check)

**Expert-Designed Postcard Layout (Halbert + Gendusa + Kennedy collaboration):**

**FRONT (the billboard — earns the flip):**
- ONE large high-quality photo: dominates 50-60% of card (result, not process)
- Headline + offer teaser: bold, contrasting color bar or bubble
- Logo: small, top left (branding, not dominant)
- "Licensed & Insured": top right (instant legitimacy — Gendusa insists)
- Company name: bottom left
- Phone number: bottom right, readable but not huge (catches impulse callers)
- NO QR code, NO reviews, NO certifications beyond Licensed & Insured on front
- Halbert: "The front has ONE job — stop them from throwing it away. 2 seconds."

**BACK (the closer — everything needed to act):**
LEFT HALF (editable):
1. VALUE-STACKED offer with dollar values per item ($277 value for $79)
2. Customer review + star rating (auto-pull from Google)
3. BIG phone number + "Call or text anytime"
4. QR code + "Scan for your special offer"
5. RISK REVERSAL: "Free estimate · No trip charge · Satisfaction guaranteed"
6. Customer's business address (proves they're local)
7. Years in business ("Serving Phoenix since 2014")
8. Urgency/deadline at bottom ("Offer expires Apr 30")

RIGHT HALF (locked — USPS compliance):
9. Recipient address block
10. IMb barcode (tracking + discounts)

TOP (locked — compliance):
11. Return address: CUSTOMER'S business address (e.g., "Martinez Plumbing, 123 Main St, Phoenix AZ 85032") — NOT PostCanary's address. PostCanary is invisible to the recipient.
12. Permit indicia: top right corner (PRESORTED STD / U.S. POSTAGE PAID / city, state / permit number — no PostCanary branding, just compliance text)

**CRITICAL: PostCanary branding is INVISIBLE on all postcards.** The homeowner sees only the customer's business. PostCanary is the platform, not the brand on the card. Same as Shopify — the buyer never sees Shopify.

8½. **Website URL** — martinezplumbing.com (so they can look you up before calling. No website = skip this, QR code still works)

Kennedy's test: "Cover the back — does the front alone make you flip? Cover the back alone give you everything to call? Both must work independently."

**Color by industry (company brand colors first, these are accent recommendations):**
- HVAC: Blue (trust) + red/orange accent (urgency/warmth)
- Plumbing: Blue (trust/clean) + green or red accent
- Roofing: Dark blue/gray (strength) + red/yellow accent (storm urgency)
- Cleaning: Green/light blue (fresh) + white space
- Electrical: Yellow/orange (energy) + dark blue accent
- Pest Control: Green (safe) + red accent (urgency)
- Landscaping: Green (nature) + earth tones

**Top offers by service — VALUE STACKS not flat discounts (Kennedy review):**
- AC Tune-Up: "$79 AC Tune-Up includes: 21-point inspection ($49 value) + filter replacement ($29 value) + 1-year warranty ($199 value)"
- Heating: "$89 Furnace Safety Check includes: CO detector test ($39 value) + efficiency report ($29 value) + priority scheduling"
- Plumbing: "Free Diagnostic ($89 value) + no trip charge + $50 off any repair over $250"
- Roofing (storm): "Free Roof Inspection + we handle your entire insurance claim + no money out of pocket"
- Roofing (retail): "$500 Off Full Replacement includes: free gutter cleaning ($299 value) + 10-year workmanship warranty"
- Cleaning: "First Clean 50% Off + free fridge clean ($35 value) + satisfaction guaranteed or re-clean free"
Note: these are TEMPLATES. The system pulls the customer's actual offers/guarantees from their website when possible.

**Behavioral science backing (HIGH confidence — Berger check):**
- Specific dollar offers → Anchoring effect (Tversky & Kahneman). $50 off beats 10% off — no mental math.
- Reviews on postcards → Social proof (Cialdini). Third-party validation reduces risk.
- Urgency/deadlines → Scarcity principle (Cialdini). Limited time creates FOMO.
- Bold headline + one image → Processing fluency. Easier to process = more persuasive.
- Sequences (3 cards) → Mere exposure effect (Zajonc). Repetition builds trust.
- The 40/40/20 rule: 40% targeting, 40% offer, 20% design. Targeting matters as much as the postcard itself.

**What we DON'T know (honest gaps):**
- No reliable home-services-specific response rates exist from independent sources
- PostCanary's own data will be the best source once we have it
- Exact ROI multipliers are unknowable in advance — show actual data, not projections
- Industry-specific color effectiveness is unverified — brand colors first, industry accents are educated guesses

**Source quality notes (Fishkin check):**
- ANA/DMA Response Rate Report = gold standard (independent, annual)
- USPS Household Diary Study = government research (rigorous, since 1987)
- Vendor blogs (PostcardMania, Mail Shark, etc.) = directionally useful but self-serving
- The 8 design elements appear across ALL sources — high confidence in the elements themselves
- Specific percentage improvements (73% magnet boost, etc.) are vendor-sourced — approximate, not precise

### Photo/Image Strategy (fallback chain)
1. Website scrape (Playwright + Claude extraction) — first choice
2. Customer uploads from phone/computer
3. Industry-specific stock photos (curated library, commercially licensed)
4. AI-generated images — V2 enhancement (DALL-E 3 or Flux API, commercial license verified)
- Stock photos for V1. Simpler, commercially safe, professional.
- AI generation adds complexity — save for later.

### Website Scraping Approach (Willison + Kennedy additions)
- Playwright (headless browser) fetches the page — handles JS-rendered sites
- Claude extracts structured data:
  - Business name, phone number, address
  - Logo URL (quality scored)
  - Top 3-5 photos (quality scored)
  - Google review rating + top review quotes
  - Certifications/badges (GAF, BBB, NATE, licensed & insured, etc.)
  - **Current offers/promotions** (Kennedy: use THEIR offer, don't invent a different one)
  - **Guarantees/warranties** (Kennedy: goes directly into risk reversal on postcard)
  - Services offered
  - Years in business
- Fallback: if website is terrible → ask for manual upload
- Don't build a custom scraper — Playwright + Claude is more reliable and adaptable

### Must Include (flagged by experts during review)
- **Google reviews on postcards (Tommy Mello):** Auto-pull Google rating + top review quote. If 4.5+ stars, feature prominently. Below 4.0, don't feature. "See why we have 4.9 stars" with actual review quote is the most powerful trust element on a home services postcard.
- **Certifications/badges (from vision doc):** Auto-scrape from website — GAF certified, BBB, licensed & insured, EPA, NATE. Place on postcards for credibility.

### Design Studio — Expert & Persona Review (complete)

**DHH OVERRIDE: No Fabric.js in V1.**
V1 = pre-built templates with editable TEXT FIELDS (headline, offer, phone, review, guarantee). Swap photo from selector. Swap template style. NO drag-and-drop canvas. NO moving elements. Fill-in-the-blanks on proven templates. Fabric.js is V2 if customers actually request more control. This dramatically reduces build complexity.

**Upload Custom Design (escape hatch for power users):**
- Jake/agencies can upload a PDF or image for front and back
- PostCanary overlays QR code + address block in locked zones
- Everything else is their custom design
- Simple file upload, not a complex feature
- Downloadable template files available: .ai, .psd, PDF with correct dimensions, bleed, safe zones, locked zones marked, CMYK color space, crop marks

### Google Business Profile Integration
- Recommended for all users during onboarding or first Design Studio visit
- Editable from Settings page
- System pulls ALL reviews
- **AI selects review using Kennedy + Halbert frameworks (not generic AI):**
  - Kennedy: "Which review addresses the biggest OBJECTION for this campaign type?" (cold prospect = trust, emergency = speed, tune-up = thoroughness)
  - Halbert: "Is this review SPECIFIC with real details, or generic praise?" Specific always wins.
  - Prioritize reviews mentioning the specific service being promoted
  - Deprioritize generic "Great service!" reviews
- **Review length constraint:** excerpt must be under 35 words. AI extracts the most powerful 1-2 sentences from longer reviews, keeps specific details, connects with "..." if needed.
- **Reviewer name:** First name + last initial ONLY ("Sarah M." never "Sarah Martinez"). Privacy protection. If Google review only has a username or first name, use what's available. Never display full names.
- **Accountability:** AI must return a `reason` field explaining WHY this review was selected using Kennedy/Halbert frameworks. "Why this review" shown to customer — educates them on effective marketing.
- Customer can swap to any other review from a dropdown (all excerpted to fit)
- Reviews refresh periodically (or on demand)
- "97% of homeowners check reviews before calling" — educational nudge to connect

### Campaign Seeding (toggle on Step 4, default ON, free)
- Checkbox on Step 4 Review: "☑ Send a copy to yourself (free)" with their address shown
- Pre-checked by default — customer can uncheck if they don't want it
- Free (PostCanary absorbs ~$0.40 cost)
- Same print run, arrives same time as customer postcards
- Additional seeds (partner, office) charged at per-card rate
- Customer naturally stops checking the box once they trust print quality
- No auto-toggling by the system — let them decide

### Typography Rules (baked into templates — not user-configurable)
FRONT: Headline 24-36pt sans-serif bold, offer 16-20pt, company name 12-14pt, phone 14-18pt
BACK: Offer headline 18-24pt bold, value stack 11-13pt, review 11-12pt italic, phone 16-20pt, risk reversal 10-12pt, address 9-10pt, urgency 12-14pt bold
RULES: Max ~100-120 words on back left half. Min 10pt for any text. Character limits on text fields enforce fit. Warning if text won't fit at readable size. Sans-serif headlines, serif or sans-serif body.

### Color Matching (Screen vs Print)
- Extract brand colors from website (HEX → CMYK conversion)
- Show customer which colors were extracted + any accent colors added
- "Edit colors" option — but limited to brand-appropriate palette (Schoger)
- Disclaimer: screen colors differ from print. Normal and expected.
- CMYK values used for professional printing
- ~~"Send a test to myself"~~ REPLACED by automatic campaign seeding — their address included in every campaign for free. No separate test, no delay. See "Campaign Seeding" section.

**QA (Hendrickson) edge cases:**
- Scraped photos: confirmation checkbox "Confirm you have rights to use this image in print"
- Google reviews: confirmation "Confirm this is a real customer review"
- Upload limits: max 10MB, validate file type/dimensions, error for corrupted files
- Text fields: character limits with visible counter, template enforces max length
- Preview: show actual print dimensions, not screen-responsive

**Security (Hunt):**
- Strip all metadata (EXIF) from uploaded images server-side
- Sanitize all text inputs to prevent stored XSS
- Validate uploaded file types server-side, not just client-side

**Privacy (Hartzog + Hunt — full Design Studio review):**
- Scraped photos might be stock photos licensed for web only, not print — confirmation step required
- Photos of identifiable people (workers, team) ARE allowed and PREFERRED — builds trust. Customer's workers on the postcard is a feature, not a bug. Customer confirms they have permission to use all photos via the approval checkbox.
- Photos showing specific customer HOME ADDRESSES should still be avoided (privacy of the homeowner in the photo)
- Google reviews: if reviewer deletes their review, stop using it. Reviews must refresh, not cache forever.
- Reviewer names: first name + last initial ONLY. Never full names.
- Recipient address list (from Melissa Data): customer NEVER gets the full list. They see count + 10-address sample. Full list goes directly to printer, never through browser.
- Seed postcard address: stored separately from targeting list. Never appears in analytics as a "mailed household." Prevents data skew.

### Template Library (Perkins + Skok)
- **V1 minimum: 9 base template layouts** (3 visual styles × 3 card positions)
- Each base template has 5+ copy presets per campaign goal (neighbor, seasonal, storm, win-back, target area)
- Visual styles: Bold/Dark, Clean/Light, Photo-Forward
- Card positions: Card 1 (offer), Card 2 (proof + deadline), Card 3 (closer + sweetener)
- Templates use 100% CUSTOMER'S brand colors. PostCanary branding NEVER appears on postcards. PostCanary's navy/teal is for the app interface only.
- Template creation: design in-house for V1 (Claude + design tools), improve based on performance data
- Store template_id with every campaign for future performance tracking

### Headlines vs Offers — TWO SEPARATE ELEMENTS
**Headline** = the HOOK. Grabs attention in 2 seconds. NOT the offer.
- "Is Your AC Ready for 115° This Summer?"
- "Your Neighbor Just Called Us"
- "Attention Scottsdale Homeowners:"

**Offer** = the DEAL. What they get. Separate element below the headline.
- "$79 AC Tune-Up includes 21-point inspection..."
- "Free Estimate + No Trip Charge"

### Headlines — AI-Generated Using Caples + Gendusa + Halbert
- Headlines are GENERATED per business, not pre-written templates everyone shares
- **Caples** (35 proven formulas): which TYPE of headline to write — news, question, curiosity, how-to, command, testimonial-lead, specific person/audience call-out
- **Gendusa**: which headline TYPES work best for home services postcards specifically (tested across millions of mailings)
- **Halbert**: make it grab — specific > clever, local > generic, short (8 words max)
- **Kennedy**: tie headline to campaign goal (neighbor = social proof headline, seasonal = urgency headline, storm = news headline)
- System generates 3 headline options, customer picks one or edits
- No two businesses get identical headlines
- Different name + different service + different city + different campaign goal = completely different headline

### Photo Selection (Whitman + Gendusa — AI-guided)
- **Priority 1:** Customer's OWN photos from website (especially workers/team — builds trust)
- **Priority 2:** Customer uploads (photos of their work, truck, team)
- **Priority 3:** Industry-specific stock photos (curated library, commercially licensed)
- **Priority 4 (V2):** AI-generated images
- Whitman: photo must trigger emotion (trust, desire, proof) — not just show a thing
- Gendusa: people > equipment > abstract. Real-looking > staged. Workers on postcard = trust builder.
- Photo selection is campaign-goal-aware:
  - Neighbor: friendly technician at door or happy homeowner
  - Seasonal: comfortable home scene matching season
  - Storm: professional team ready to work
  - Win-back: before/after of completed work
- If no photos available: AI searches stock by industry + emotion + setting, avoids generic clichés

### Template LAYOUTS — Multiple Distinct Structures (not one layout for everyone)

**6 base layouts for V1:**
1. **Full-Bleed Photo** — photo edge-to-edge, headline in color bar overlay. Best for: emotional, finished work.
2. **Side Split** — photo left, headline + offer right (50/50 or 60/40). Best for: offer-heavy, value stacks.
3. **Photo Top / Text Bottom** — large photo top 2/3, text band bottom. Best for: seasonal, neighborhood scenes.
4. **Bold Graphic** — big bold headline dominates, small photo, strong typography. Best for: storm response, urgency.
5. **Before/After Split** — two photos side by side. Best for: roofing, remodel, cleaning, landscaping.
6. **Review Forward** — large review quote with stars dominates, photo small. Best for: win-back, trust-building.

**AI recommends the best layout based on (Gendusa + Whitman + Draplin + Heath):**
- **Full-Bleed Photo is the #1 default** — biggest visual impact, best half-second grab, tested best across millions of home services postcards (Gendusa)
- Campaign goal overrides: Storm Response → Bold Graphic (urgency), Win-Back → Review Forward (trust), Before/After work → Before/After Split (proof)
- Available photos affect recommendation: no good photo → Bold Graphic text-forward layout
- Customer can pick any layout regardless of recommendation

**Default by campaign type:**
| Campaign | Default | Why |
|----------|---------|-----|
| Neighbor Marketing | Full-Bleed Photo | Emotional, friendly face grabs attention |
| Seasonal Tune-Up | Full-Bleed Photo | Seasonal imagery needs to dominate |
| Storm Response | Bold Graphic | Urgency, text-led, speed > beauty |
| Win-Back | Review Forward | Trust rebuilding, lead with proof |
| Target an Area | Full-Bleed Photo | Cold audience, photo builds connection |
| Before/After | Before/After Split | Transformation IS the selling point |

**Template design rules (Gendusa + Whitman + research):**
- ONE dominant visual element per side (photo OR headline, not both competing)
- Maximum 3 fonts (headline, body, accent)
- Maximum 3 colors plus white/black (from customer's brand palette)
- White space is mandatory — it's not empty, it's breathing room
- Nothing within 0.25" of edge (safe zone)
- Phone number readable from arm's length (14pt minimum)
- 300 DPI minimum for all images
- CMYK color space
- Templates defined as JSON schemas — layout positions, font sizes, color zones, content slots

### Brand Kit System (consistency across everything)
**Created once during onboarding/first campaign, applied to ALL postcards:**
- Brand colors: extracted from website (2-3 colors)
- Font pairing: selected from curated options that work with their brand
- Logo: extracted/uploaded, consistent placement
- Photo style: their photos or consistent stock category

**Within a sequence:** Same layout, same colors, same fonts, same logo placement. ONLY the content changes (Kennedy's escalation — different headline, different offer, different photo). Homeowner recognizes Card 2 and 3 as the same company.

**Across campaigns over time:** Brand kit stays consistent. Layout CAN change per campaign type. But the overall LOOK — colors, fonts, logo treatment — is always recognizable as the same company.

**The system enforces this.** Customer can't accidentally create a Card 2 that looks nothing like Card 1. The template system locks brand elements and only varies the content.

### Z-Pattern and F-Pattern (Whitman — enforced on all layouts)
**Front (Z-pattern):** Eye goes top-left (logo) → top-right (credibility) → diagonal down → bottom-left (headline/offer) → bottom-right (phone/CTA). Every layout follows this.

**Back (F-pattern):** Eye scans down left side: offer headline → value stack items → review → phone → QR → risk reversal → urgency.

### Template Aesthetic (Draplin)
- Bold, confident, American — not trendy, not corporate, not minimalist
- Thick confident borders and color blocks, not thin delicate lines
- Strong typography readable from arm's length
- High contrast in any lighting
- Photo given ROOM, not crammed
- One visual center of gravity — eye goes ONE place first
- "Looks like a business your neighbors have relied on for 15 years"

### "Why This Design Works" — Reasoning Shown to Customer
- Collapsed by default under the postcard preview in Step 3
- Explains WHY each element was chosen: photo, headline, offer, review, layout, reading path
- Builds trust → customer doesn't feel the need to edit
- Skeptical customers (Dave persona) open it and see evidence-based reasoning
- Kennedy: "If you can explain WHY your sales piece works, the prospect trusts you more"

### The Half-Second Grab (Heath Brothers SUCCESs + Neuroscience)
Every template must pass the SUCCESs check:
- **Simple:** one headline, one photo, one offer — nothing competing
- **Unexpected:** break the junk mail pattern — bold color, face, unusual headline
- **Concrete:** specific numbers ("$79") not vague ("affordable")
- **Credible:** stars, review, "Licensed & Insured"
- **Emotional:** photo of a PERSON (face), not equipment
- **Stories:** "Your neighbor just chose us" = micro-story in 8 words

Neuroscience priority (what the brain processes first):
1. FACES (~100ms — before any text is read)
2. CONTRAST (high contrast areas)
3. COLOR (bold colors stand out from white envelope pile)
4. SIZE (large elements before small)

Optimal half-second postcard: face + bold accent color + large "$79" visible from 3 feet + high contrast between photo and text.

### Website Scraping Reliability (Willison + Fishkin honest assessment)
- Works well ~60-70% of home services websites (WordPress, Wix, Squarespace)
- Partial results ~15-20% (got some data but not everything)
- Fails ~10-20% (bot protection, Facebook-only, no website, broken sites)
- **DON'T promise auto-build. OFFER it as a convenience.** "We'll try to pull your info — anything we miss, you fill in."
- Show customer exactly what was found vs what's missing: checkmarks and X marks
- Manual 5-question flow is the FALLBACK, always smooth and fast
- Website scrape is a shortcut, not a requirement

### AI Cost Per Customer (Skok — negligible)
- Onboarding (one-time): ~$0.05 (Playwright + Claude + Google Places API)
- Per campaign: ~$0.02 (headline generation + review selection + offer text)
- At 200 postcards × $0.69 = $138 revenue, AI cost is 0.03% of revenue
- At scale (10K campaigns/month): ~$200/month AI cost vs $520K margin
- Google reviews: cache monthly, not per campaign. $17 per 1,000 API calls. Manual refresh available in Settings.

### Technical Performance — Instant Postcard Loading (Ronacher + Beck + Majors)

**Website scrape: ONE TIME during onboarding, cached forever.**
- Playwright + Claude extracts brand kit during onboarding (10-20 sec, customer doesn't notice)
- Cached in database: logo, photos, colors, reviews, offers, certs, guarantees
- Never re-scraped during campaign wizard. Customer can refresh from Settings.

**AI postcard generation: PRE-GENERATED during Step 2.**
- Step 1 complete → fires background Celery tasks: generate headlines, select review, build offer, pick template
- All API calls run IN PARALLEL (2-5 sec total)
- Customer is in Step 2 (targeting) for 1-3 minutes — plenty of time
- By Step 2 → Step 3 click, postcard is ALREADY BUILT and cached in Redis
- Step 3 loads INSTANTLY

**Failsafe if AI is slow:**
- Template loads immediately with cached data (logo, colors, photo, phone)
- Default headline/offer text shown first
- AI-generated text swaps in seamlessly within 1-2 seconds
- Customer NEVER sees a loading spinner for the full postcard

**Every AI call has:**
- 10-second timeout
- Fallback default text
- Cache (don't regenerate if inputs unchanged)
- Going back to Step 1 with same goal → serve cached version

**Stack:** Flask + Celery (background tasks) + Redis (caching) + AI API for text generation
**Current AI providers in codebase:** Anthropic Claude (chatbot) + Google Gemini Flash (AI insights)
**AI Model Strategy: MODEL-AGNOSTIC INTERFACE (Ronacher recommendation)**
- Build a single `call_model()` function with a config switch between Gemini/Claude/GPT
- One config variable swaps the model — no code changes needed
- BEFORE launch: blind-test 20 real PostCanary prompts across all three models. Drake + Dustin rate outputs without knowing which model produced them. Pick winner based on quality, not cost.
- Cost difference is cents per campaign against $52+ margin — pick the BEST output, not the cheapest
- Currently in codebase: Gemini Flash for insights, Claude for chatbot
- May end up using different models for different tasks (e.g., Claude for complex headlines, Gemini for simple extraction)

### Templates Are NOT Copied (legal/ethical note)
- Templates are PostCanary ORIGINALS based on universal design principles
- NOT copied from PostcardMania, Modern Postcard, or any competitor
- Principles are universal (Z-pattern, visual hierarchy, typography rules)
- Specific designs, layouts, and aesthetic are PostCanary's own

### Every Postcard Is Unique (even from same template)
- Same layout, different content: different logo, colors, photo, headline, offer, phone, review
- Headlines are AI-generated per business context, not shared
- Photos are from their website or contextually selected
- Brand colors extracted from their website
- Like Shopify themes — same structure, completely different look per business

### Template Performance Tracking (Hiten Shah)
- V1: store which template was used per campaign (data collection only)
- V2: cross-client template performance → "Best Match" star based on actual response rate data
- Individual A/B testing not viable (Silver: need 1,000+ per variant, most campaigns are 200-500)
- Cross-client data IS statistically meaningful at scale

### Liability (Goldman)
- Auto-populated info could contain stale/false claims (expired license, changed rating, wrong price)
- Mandatory confirmation checkboxes before approval: accuracy of info, image rights, PostCanary not responsible for accuracy
- Auto-refresh Google rating periodically — flag if drops below 4.0, remove star rating from template
- Customer takes responsibility for accuracy. Standard for all print/mail platforms.

### Educational "Why This Works" (Sierra)
- Optional expandable on key postcard elements explaining WHY the element is effective
- Collapsed by default — not pushy, there for the curious
- Over time, customers absorb marketing lessons and become smarter marketers
- "PostCanary makes you better at marketing" — Sierra's core principle
- Berger validates: Default Effect means 80-90% approve without editing. Default quality is everything.

### Design Studio QA — Final Expert Pass

**Data quality checks (prevent bad postcards):**
- ALWAYS confirm scraped data before using (logo, phone, colors — show extraction results, customer confirms)
- Value stack math: system CALCULATES totals programmatically. Never let AI do arithmetic.
- Image resolution: min 600px logos, 1200px photos. Warning if below threshold: "Will appear blurry in print."
- Business name overflow: dynamic font sizing with 10pt minimum. Suggest shorter version if still too long.
- Review excerpts: cut at SENTENCE BOUNDARIES only, never mid-sentence
- QR code minimum: 0.75" × 0.75" on printed card. Enforced by template.
- Typo protection: Step 4 Review highlights business name, phone, address for explicit proofing

**Content safety:**
- AI headline tone: ENCOURAGE one playful/humorous option among the 3 choices. Humor is a competitive advantage — memorable beats safe. Mild puns, playful urgency, personality = GOOD. Genuinely offensive, discriminatory, sexually explicit, mocking victims = BLOCK. Customer picks their comfort level.
- Competitor name detection — warn if customer types competitor brand names in text fields
- Certification freshness — note that scraped certifications should be verified as current

**UX clarity (Krug):**
- "Change the words" vs "Try a different look" — clear labels explaining the difference
- Sequence explanation above the 3-card view — why 3 cards, what each one does
- Locked zones (address block, postal elements) — gray overlay + lock icon + "Required by USPS" label
- Save indicator visible after every auto-save. Failure notification if save fails.
- Conflict detection if multiple users edit same design

**Alex (no-website) personalization:**
- Even without website data, make it feel personal: use their city, their name, their personal guarantee
- Where review would go, use: "Owned and operated by [Name] — I personally guarantee every clean"
- Celebrate first postcard: "Here's your first professional postcard. Looking good!"

**Preview accuracy (Dave test):**
- Render at actual print resolution (300 DPI)
- Size indicator so they know actual dimensions
- PDF proof in CMYK with crop marks (what the printer sees)
- Seed postcard (free with every campaign) is the ultimate accuracy check

**Scale (Majors):**
- AI calls queued via Celery, not simultaneous
- Rate limiter on API calls
- Pre-generation during Step 2 spreads load over time
- Default text shown while AI generates — never blocks the customer

**Template maintenance (Skok):**
- Quarterly template review based on cross-client performance data
- Deprecate underperformers, double down on winners
- Ongoing ops cost — not a one-time build
- Add new industries and sub-categories as customer base grows

### Auto-Populate Failure Handling (Hendrickson)
- Website scrape timeout → "Try again or fill in manually"
- Google API down → show "Connect GBP" instead of blank
- No stock photos for industry → generic professional photos + upload prompt
- No offer found → industry default value stack with placeholder prices
- Logo extraction failed → text logo in clean font
- NO failure blocks Step 3. Every element has a fallback.

### Design Library as Retention Tool (Campbell)
- Saved designs are FULL editable templates, not flat images
- After 6 months: 10+ proven designs = real switching cost
- Leaving PostCanary means recreating everything from scratch

**Minimum viable postcard (for Alex — no website, no reviews, no certs):**
- Stock photo from industry library
- Text-based logo (business name)
- Default risk reversal ("Satisfaction guaranteed")
- Default urgency ("Limited spots this month")
- Template + value stack makes even a bare-minimum postcard professional
- System nudges: "Add your Google Business Profile to get reviews on future postcards"

**Multi-location (Kuzoyan — V2):**
- One design, variable data per location (phone, address, service area)
- location_id already planned in data model

### Design Studio UX Flow — LOCKED

**Step 3 opens with a FINISHED postcard, not a template picker or blank canvas.**
System auto-generates using: website scrape data + campaign goal + recipient type + industry templates + Kennedy's 9 elements. Customer sees "Here's your postcard — want to change anything?"

**Two options from the preview:**
1. "Edit This Card" → opens Fabric.js guided editor
2. "Try Different Template" → opens curated, context-aware template browser (3-6 options, not 200)

**Editing experience (guided, not blank canvas):**
- Right panel shows labeled buttons: Change Photo, Edit Headline, Edit Offer, Change Review, Edit Phone, Change Colors, Change Logo
- Colors limited to brand palette + 3-4 recommended accents (Schoger: no full spectrum picker)
- Click elements on canvas to select and edit
- Drag to reposition, handles to resize
- Undo/Redo/Reset to Original
- Locked elements: QR code, address block, return address (can't move or cover)
- "Preview Actual Size" button (Norman check)
- If they change colors on Card 1: prompt "Apply to all 3 cards?" (Whittaker check)

**Template browser:**
- Filtered by campaign goal + industry (not a generic gallery)
- 3-6 templates per context, "Best Match" starred
- Templates come as SEQUENCE SETS (3 coordinated cards)
- Every template auto-populates with THEIR data the moment they click it
- "More styles" expandable for additional options

**3-card sequence design:**
- Templates are sequence sets — 3 cards designed together
- Card 1 "The Offer": value stack, introduce company
- Card 2 "The Proof": new testimonial + deadline + spots left
- Card 3 "Last Chance": final notice + new sweetener
- All visible side by side — same branding, different messaging
- Each card individually editable

**No-website fallback flow:**
- 5 questions (logo, photo, phone, offer, review) — 30 seconds
- Industry stock photos available
- System still generates near-perfect postcard from manual inputs
- Suggestion text guides each input ("💡 Suggestion: $79 tune-up includes...")

**Element fallback chain:**
| Element | Auto | Fallback 1 | Fallback 2 |
|---------|------|-----------|-----------|
| Logo | Website | Upload | Text business name |
| Photo | Website | Stock by industry | Upload |
| Phone | Website | Ask (required) | — |
| Offer | Website | Industry default value stack | Ask |
| Review | Google Business Profile | Ask to paste | Skip |
| Certs | Website | Select from list | Skip |
| Guarantee | Website | Industry default | "Free estimate, no obligation" |

**Postcard back layout (USPS-compliant):**
- RIGHT HALF: address block (locked) + IMb barcode zone (locked, auto-generated for tracking + discounts)
- TOP LEFT: return address — CUSTOMER'S business address. Small, required with permit imprint. PostCanary does NOT appear anywhere on the postcard.
- TOP RIGHT: permit indicia / postage mark (locked, required for Marketing Mail)
- LEFT HALF: available for customer content — QR code, guarantee, certifications, phone number
- All locked zones enforced by the Design Studio — customers literally cannot create non-compliant postcards
- Specific dimensions and placement per USPS Domestic Mail Manual (DMM)
- NOTE: Final layout specs must be validated with print shop partners AND tested with USPS before launch. Peter's territory.

**USPS compliance built into Design Studio as hard constraints:**
- Address block dimensions and position = locked
- IMb barcode zone = locked, auto-generated
- Permit indicia position = locked
- Return address = auto-populated, locked
- Safe zones around postal elements = enforced
- Non-compliant designs physically impossible to create

**Design library:**
- Designs auto-saved after campaign approval
- Designs page in sidebar shows all saved designs
- Actions: Duplicate, Edit, Archive
- "Use a saved design" option when creating new campaigns
- Designs saved as sequence sets (3 cards together)

### Design Studio Data Contract
```typescript
interface DesignSelection {
  templateId: string
  sequenceCards: CardDesign[]
}

interface CardDesign {
  cardNumber: number
  cardPurpose: 'offer' | 'proof' | 'last_chance'
  fabricJson: string           // Fabric.js serialized canvas
  previewImageUrl: string      // Generated preview for Step 4
  frontElements: {
    headline: string
    offerText: string
    photoUrl: string
    reviewQuote: string
    reviewRating: number
    phoneNumber: string
    urgencyText: string
    riskReversal: string
    trustSignals: string[]
  }
  backElements: {
    guarantee: string
    certifications: string[]
    licenseNumber: string
    companyAddress: string
    qrCodeUrl: string
  }
  savedToLibrary: boolean
  libraryName: string | null
}
```

## Cross-Client Analytics Architecture (Kleppmann)

### The Problem
"HVAC companies see 2.3% response rate" is meaningless without context. Results vary wildly by location, season, campaign type, and service type.

### Multi-Dimensional Benchmarking
Aggregation dimensions: industry × location × season × campaign_type × service_type × home_demographics
- Real benchmark: "HVAC + AC Tune-Up + Phoenix metro + April + Neighbor Marketing = 3.1%"
- NOT: "HVAC = 2.3%"

### Cascading Fallback (when not enough data in a segment)
1. Try: industry + metro + month + campaign type (most specific)
2. Fall back: industry + region + season + campaign type
3. Fall back: industry + national + season
4. Fall back: industry + national average
- Always show data source: "Based on 47 HVAC campaigns in the Southwest this spring"
- Never show a benchmark without attribution

### Location-Aware Seasonality
- Seasonal campaign recommendations must be location-aware
- Phoenix AC = recommend March. Chicago AC = recommend May. Seattle = maybe skip AC.
- Same industry, different region = different timing
- Build season calendars per climate zone, not one national calendar

### Industry Sub-Categories (Critical Distinction)
- "Roofing" is too broad. Storm repair vs retail sales behave completely differently.
- Applies to ALL industries: plumbing (emergency vs remodel), HVAC (repair vs tune-up vs install), etc.
- Onboarding asks: "What type of work do you focus on?" with checkboxes per industry
- This becomes another aggregation dimension: industry + sub-category
- Affects: campaign recommendations, templates, messaging, benchmarks, seasonality, bell curves
- Sub-category is a FIRST-CLASS dimension alongside industry and location

### Progressive Complexity (Don Norman check — CORRECTED per Drake)
- NOTHING is locked or gated. All tools available from day one.
- Organization by simplicity — most effective option is most prominent
- WITH CRM data: "Around My Jobs" is primary, Draw/ZIP under "More options" (collapsed, one click)
- WITHOUT CRM data: Draw/ZIP are primary, "Around My Jobs" not available, CRM upload nudge shown
- First-time user without data: Draw area or enter ZIPs → industry filters auto-apply → send. No CRM required.
- Same principle everywhere: simple surface, depth one click away, never locked

### Power User Data Access (DJ Patil check)
- Campaign Detail page: expandable "View Raw Data" section at bottom
- Sortable, filterable table of all addresses mailed + match status + lead status + revenue
- Export to CSV from any data table
- Campaigns page: sortable by any metric (response rate, cost per lead, revenue, etc.)
- Simple surface for Bob, depth available for Jake

### Future-Proofing Fields (Kuzoyan check)
- Add nullable `location_id` to campaign, targeting, and design tables in V1
- Not used yet, but prevents migration nightmare when multi-location launches
- Same principle as org_id — design for it now, build features later

### Tech Stack Additions (Ronacher check — validated 2026-03-24)
Core stack is CORRECT — don't change Flask, Vue, PostgreSQL, Leaflet, Fabric.js.
ADD these tools (don't replace anything):
- **Celery + Redis:** Background jobs (matching, print orders, scheduled card sends, geocoding). Required before campaign sequences go live. Celery Beat for scheduling "send Card 2 on April 7."
- **PostGIS:** PostgreSQL extension for geographic queries. Required before Melissa Data connects. "Find all households within this polygon" at scale.
- **S3 or equivalent:** File storage for uploaded CSVs, postcard designs, generated PDFs, campaign proofs. Required before Design Studio saves files.
- **Redis (double duty):** Caching layer for household data lookups, session data. Already needed for Celery broker.
- **Matching engine redesign:** Currently single-threaded for-loop. Design interface now so matching can move to Celery tasks for parallelization at 100K+ records. Don't rewrite yet — just make the interface swappable.

### Growth Monitoring & Scale Triggers (Majors monitors, panel responds)
**Majors watches metrics. When thresholds are hit, the right specialist gets activated.**

Milestone triggers:
- 100 users: quick check, keep building
- 500 users: first optimization pass (Kerstiens queries, Majors monitoring, Skok economics)
- 1,000 users: architecture review (full scale panel)
- 5,000 users: scale infrastructure (renegotiate costs, ML pipeline, dedicated perf engineer?)
- 10,000+ users: enterprise readiness (security audit, multi-location, agency features, roster overhaul)

Performance triggers (continuous):
- DB queries > 500ms avg → Kerstiens
- API response > 2 sec → Ronacher
- Celery queue > 200 pending → Majors
- AI API errors > 5% → switch models or add fallback
- Storage > 80% capacity → Majors

McCord reviews expert roster at every milestone: "Do we need new expertise for this growth stage?"

**How Drake gets notified (plain English, not dashboards):**
- Monthly health report email: users, campaigns, performance, storage — all green/yellow/red
- Threshold alerts: immediate email when a metric crosses yellow or red with plain English explanation + specific action
- Built with n8n automation: pulls PostHog (user metrics) + Railway (infrastructure metrics), checks thresholds, sends email
- PostHog = product metrics (what users do). Railway = infrastructure metrics (how server performs). Different tools for different things.
- Also add: Sentry (error tracking — alerts when things crash) + uptime monitor (alerts when site goes down)

**Monitoring stack:**
| Tool | What | Cost |
|------|------|------|
| PostHog | User behavior, funnel, growth | Already integrated |
| Railway metrics | Server CPU, memory, response times | Free with hosting |
| Sentry | Error tracking, crash alerts | Free tier available |
| BetterUptime or similar | Site up/down monitoring | ~$20/month |
| n8n automation | Monthly report + threshold alerts to Drake | Already planned |

### Schema Design (V1)
- Aggregation tables designed for multi-dimensional queries from day one
- Even if V1 only has 10 clients, the schema supports segmented rollups
- Pre-compute: avg response rate, avg revenue, avg lead-to-close time per segment
- Minimum data threshold before showing benchmarks (e.g., 20+ campaigns in segment)

## V2 Backlog Items
- Adaptive voice depth by user role (toggle in Settings)
- Full autopilot engine (ML-driven targeting optimization)
- Recurring campaigns (autopilot lite — repeat same campaign monthly)
- Campaign templates (save setup for one-click reuse)
- Campaign comparison view (select 2-3 and compare side-by-side) — DJ Patil recommends Round 2 not V2
- "Farm an Area" campaign goal (for real estate — mail same area repeatedly)
- Agency multi-client dashboard and deployment
- LTV framing for low-ticket industries (cleaning, pest control)
- Priority/rush printing option
- Return mail handling (track undeliverables, auto-suppress, credit)
- Campaign timeline visualization
- Past campaign performance overlay on map (heat by response rate)
- Budget mode with auto-prioritization (enter budget → system picks best households)
- AI interpretation of "Something Else" goals
- CRM API integrations (Jobber first, then HCP, then ServiceTitan)

## AI Insights Prompt Redesign (Round 2 — switch to Claude + expert frameworks)

### Current State
- Uses Gemini (gemini-3-flash-preview)
- Prompt: generic "You are an expert direct mail marketing analyst"
- No expert frameworks, no PostCanary voice, no customer-awareness
- Output: JSON with sections, recommendations (structured but generic tone)
- Located: `app/services/insights.py` line 192, `build_prompt()`

### What Needs to Change
**Switch to Claude** (tested better on insights — tighter, more specific, better voice)

**Bake in expert frameworks:**
- **Kennedy:** Frame every insight around "what should they DO next?" not just "here's what happened"
- **Gendusa:** Industry-specific benchmarks and recommendations when available
- **Skok:** Frame costs as investments, show ROI in plain terms ($14,400 from $549, not "ROI: 26.2x")
- **Knaflic:** Data should tell a STORY, not just report numbers. "So what?" for every metric.
- **Sierra:** Does this insight make them BETTER at marketing? Teach, don't just report.

**Bake in PostCanary voice:**
- Friendly operations manager, not corporate analyst
- Plain English (calls/jobs, not leads/conversions)
- Celebrate wins genuinely, diagnose misses honestly
- Every number means something in business terms
- "Your postcards brought in $14,400 from $549" not "Campaign ROI was 26.2x"

**Context-aware insights:**
- Know the campaign goal (neighbor marketing insights differ from storm response)
- Know the industry + sub-category (HVAC tune-up vs emergency plumbing)
- Know whether this is their 1st campaign or 20th (adjust confidence and depth)
- Know their location + season (regional benchmarks when available)
- Reference their specific data, not generic advice

### Voice Definition (EXPLICIT — must be written into every prompt, not referenced by name)
Never write "use PostCanary voice" in a prompt — the AI doesn't know what that means. Include these rules DIRECTLY:

```
VOICE RULES (include in every customer-facing AI prompt):
- You're a sharp, friendly marketing advisor who knows direct mail
  and the home services industry inside out.
- Talk like a trusted business partner texting advice, not a software
  generating a report.
- Use THEIR words: calls, jobs, customers, postcards, neighborhoods.
  NEVER: leads, conversions, acquisitions, touchpoints, KPIs.
- Numbers always mean something: "$14,400 from $549 in postcards"
  NOT "ROI: 26.2x"
- When things go well: celebrate genuinely. "Your postcards crushed it —
  8 calls from 412 postcards."
- When things don't go well: be honest and constructive. "This one
  underperformed. Here's why and what to change."
- Every insight ends with a specific action: "Here's what to do next."
- Short sentences. If it sounds like a report, rewrite it.
- NEVER mention PostCanary's internal systems, matching algorithms,
  data sources, or how the technology works.
```

### Chatbot Redesign (Round 2 — deep dive needed)
**Current:** Uses Claude in `app/blueprints/chat.py`. Generic helpful chatbot.

**What it needs to become — experts to bake in:**

**Jeremy Miner (NEPQ — Neuro-Emotional Persuasion Questions):**
- Already in Drake's framework (`reference_nepq.md`)
- Chatbot should ASK questions that lead customers to their own conclusions
- NOT "You should send more postcards" → instead "How are you currently getting new customers? And how's that working for you? What would happen if you could reach 400 homeowners near your recent jobs?"
- The customer convinces THEMSELVES to send campaigns
- Soft, consultative, never pushy
- Questions surface pain → customer realizes the gap → chatbot shows the path

**Kennedy (direct response):**
- When giving campaign advice, use Kennedy's frameworks
- Recommend specific campaign types based on their situation

**Gendusa (direct mail):**
- Industry-specific recommendations
- "Most HVAC companies see best results mailing 4-6 weeks before peak season"

**CRITICAL — what the chatbot must NEVER reveal:**
- Matching algorithm details (fuzzy matching logic, scoring thresholds)
- Data source specifics (Melissa Data, how household data is obtained)
- Internal pricing formulas or margin information
- Analytics methodology (how benchmarks are calculated)
- System architecture or technology stack
- How cross-client anonymized data works
- Be helpful about WHAT PostCanary does, never HOW it works internally

**What the chatbot SHOULD do:**
- **Page-aware at all times** — knows what page/step the customer is on, tailors help to that context. On Step 2? Answers targeting questions. On Campaign Detail? Helps interpret results. Never gives generic help when it can give contextual help.
- Answer questions about using the product
- Give direct mail strategy advice (channeling Kennedy + Gendusa)
- Help them understand their campaign results
- Softly guide towards sending more campaigns (NEPQ — questions, not statements)
- Educate about direct mail best practices
- Be the "zero customer service calls" fallback

### CRM Integration Assistant (V2 — when API integrations are built)
- Dedicated chatbot mode for CRM setup (Jobber, HCP, ServiceTitan)
- **MUST have deep knowledge of each CRM's exact layout, field names, data structure, terminology**
- Uses Context7 MCP or similar to pull live CRM documentation
- Walks them through connection step by step, answering questions in real-time
- **Auto-populate field mapping** — AI looks at their CRM fields and PostCanary's expected fields, auto-matches them (like the current column mapper but for API fields)
- "Your Jobber 'Work Order' field maps to our 'Completed Job.' Your 'Request' field maps to our 'Lead.' We've auto-matched 8 of 10 fields — confirm these 2 manually."
- This is a MAJOR feature that dramatically reduces CRM setup friction
- Tackle when we build CRM integrations — needs its own planning session with CRM-specific expertise

### AI Insights Deep Dive (Round 2 — separate planning session needed)
- Current insights are functional but generic
- Needs full expert panel review like we did for Map & Targeting, Campaign Builder, Design Studio
- Experts to involve: Kennedy, Gendusa, Skok, Knaflic, Sierra, Miner
- Goal: "platinum" insights that are genuinely valuable and actionable, not just data restated
- Every insight should teach them something AND tell them what to do
- Insights should adapt to: campaign goal, industry, sub-category, location, campaign number (1st vs 20th)
- This deserves its own planning session — flag for Round 2

### AI Model Strategy (tested 2026-03-24)
- **Claude for all customer-facing AI** (insights, headlines, reviews, offers, chatbot) — better quality, voice, instruction-following
- **Gemini for internal/backend tasks** (website extraction, data categorization) — cheaper, faster, customer never sees
- Model-agnostic interface: `call_model()` with config switch, easy to swap
- Blind test results: Claude won quality on 4/4 categories. Gemini won speed (2.8x faster) and cost (~60% cheaper). Quality > cost for customer-facing output.
- Test saved at: `server/ai_model_comparison.json` and `server/ai_model_comparison.md`

## Smart Onboarding — Minimum Questions, Maximum Pre-Fill

### Minimum Onboarding (4 inputs, 60 seconds)
1. Business name
2. Location (city/state or ZIP — auto-detect from browser if allowed)
3. Services offered (industry + sub-categories checkboxes)
4. Website URL (optional — "skip if no website")

### What the System Auto-Fills From Those 4 Inputs

**From location:**
- Map centers on their area
- Climate zone → seasonal calendar template
- Regional benchmarks (when data exists)
- Print shop routing (closest facility)
- Time zone

**From industry + services:**
- Filter defaults (homeowner/renter, property types)
- Campaign calendar template (industry + climate specific)
- Template selection (industry-specific designs)
- Offer templates (industry-specific value stacks)
- Risk reversal defaults
- Recommended frequency
- Recommended first campaign type

**From website scrape (Playwright + Claude):**
- Logo + quality score
- Photos + quality score
- Phone number
- Google rating + top review
- Certifications/badges
- Current offers/promotions (use THEIR offer, not invented ones)
- Guarantees/warranties (becomes risk reversal on postcard)
- Years in business
- Services listed (cross-reference with what they selected)

### Progressive Questions (asked in context, not upfront)
| Question | When Asked | Why Then |
|----------|-----------|----------|
| Service area radius | First map view | Looking at map — makes sense |
| Monthly budget | First cost estimate | Just saw a price — relevant |
| Busy/slow months | First calendar view | Looking at timing — relevant |
| Connect CRM | After first campaign | Want results — CRM is the answer |
| Average job value | After first match | ROI needs this number |
| Team size/capacity | Budget sophistication | Capacity affects allocation |
| Monthly goal (calls) | After first campaign | Commitment/consistency trigger |

### The "Damn Near Perfect" First Postcard
With just 4 onboarding inputs + website scrape, the first postcard template should be FILLED with:
- Their logo, their best photo, their phone number
- Their actual offer from their website
- Their actual guarantee as risk reversal
- Their Google rating + real review quote
- Their certifications
- Industry-appropriate headline and layout
- QR code to PostCanary landing page

The customer sees a FINISHED postcard. Professional quality. They didn't design anything. They click approve.

## Upload Flow
- Dashboard keeps upload for analytics (unchanged)
- Campaign wizard gets optional upload: "Have a customer list? Upload it for smarter targeting"
- Frame as benefit, not requirement
- New users can skip upload entirely — send postcards with just a map selection

## Educational Philosophy
- Every recommendation shows WHY in plain English
- Map shows why areas are highlighted
- Campaign review shows estimated ROI with reasoning
- After campaign, results explain what worked and what to change
- Progressive autopilot education (progress bar, celebration at threshold)

## Autopilot Progress (deferred to later, but designed in)
- Progress bar on Home page: "3/5 campaigns until Autopilot"
- Each completion = small celebration
- Threshold hit = big celebration + one-button activation
- Gamified progression to drive engagement

## QA Edge Cases (Whittaker review)
- **Double-click approve:** Disable button on click + server-side idempotency key. No duplicate charges.
- **Two browser tabs:** Draft versioning. Approve checks version matches. Stale tab gets "updated in another window" message.
- **Self-intersecting polygon:** Validate geometry. Show "your shape crosses itself" error. Don't crash.
- **Invalid ZIP codes:** Validate against known list. Clear error message.
- **Card 2 payment fails:** Card 3 auto-pauses too. Don't send Card 3 if Card 2 never sent.
- **Stale draft after code update:** Schema versioning on drafts. Migrate or prompt re-confirmation. Never crash.
- **Saved audience stale data:** Store CRITERIA not household list. Recalculate count on load.
- **1,000+ jobs in Around My Jobs:** Cap at 50 most recent by default. Aggregate overlapping radii. "Show all" option with performance warning.
- **Goal change invalidating later steps:** Flag as "needs review," don't wipe. Re-apply goal-specific defaults (exclusions, etc.).

## Campaign Strategy Engine (Kennedy + Gendusa)

### Recommendation Priority
Storm Response (urgent) > Seasonal (if in window) > Neighbor Marketing (always good) > Win Back > Area Targeting

### Recommendation Logic
1. Recent jobs without neighbor marketing? → Recommend neighbor marketing
2. Pre-season window for industry + region? → Recommend seasonal (4-6 weeks before season)
3. Haven't mailed in 30+ days? → Re-engagement nudge
4. Recent weather event? → Storm response (URGENT, overrides everything)
5. Lapsed customers (12+ months)? → Win back as secondary
6. Same campaign type 3x in a row? → Suggest variety

### Frequency by Business Size
- Solo/small: 1 campaign/month, 200-500 cards
- Growing: 2 campaigns/month, 500-1000 cards
- Established: 3-4 campaigns/month, 1000-3000 cards
- Multi-location: per-location calendars

### Ascension Strategy (Kennedy)
- Stage 1 (cold): Low barrier — free estimate, $29 diagnostic, zero risk
- Stage 2 (warm): Mid-level — $79 tune-up value stack
- Stage 3 (customer): High-ticket — full replacement with financing
- System recognizes where each household is in the ascension

### Angle Rotation
Don't repeat the same message type. Rotate: offer-led → social proof → fear/problem → neighbor → seasonal urgency. System tracks which angles have been used.

### First Year Customer Program
Month 1: Neighbor marketing (prove it works)
Month 2: Seasonal or area targeting
Month 3: Repeat neighbor marketing with new jobs
Month 4: Win-back lapsed customers
Month 5: Autopilot eligible → celebrate + activate
Month 6-12: Autopilot, customer reviews monthly

### Budget Intelligence Engine (Kennedy + Gendusa + Skok)

**Annual budget setup (onboarding/Settings):**
- Total yearly budget
- Operating months (deselect off-months)
- Busy months vs slow months
- Priority: fill slow months vs maximize ROI vs balanced (default)

**System generates monthly allocation with:**
- Pre-season months get higher allocation (highest ROI window)
- Slow months get moderate allocation (need to fill schedule)
- Peak busy months get REDUCED allocation if historically booked solid
- 5-10% held as storm/opportunity reserve
- Visual bar chart shows each month's budget + why
- Customer can adjust any month manually

**Smart budget adjustments (with CRM schedule data):**
- Schedule 90%+ full → recommend reducing this month, shift to upcoming slow month
- Schedule < 50% full → recommend boosting this month's spend
- Without CRM: periodic one-click check-in ("How's your schedule? Packed / Steady / Slow")

**Budget by business situation:**
- New (needs customers): 50% slow months, 30% pre-season, 20% peak
- Growing (scaling): 30% slow, 40% pre-season, 30% peak
- Established (maintaining): 20% slow, 50% pre-season, 30% peak
- Booked solid: minimal spend, high-ticket targeting only

**Budget conflict resolution:**
When campaign exceeds monthly budget, offer: reduce campaign size, borrow from next month, add to annual budget, or override. Always with a recommendation and WHY.

**Real-time budget tracker on Home page:**
Bar showing spent vs remaining, campaigns sent this month, what's affordable, recommended next action.

**Slow month specific campaigns:**
Pre-season early bird, maintenance plan push, win-back blitz, off-season discounts, referral push. Different campaign TYPES for slow months, not same campaigns with lower expectations.

### Annual Calendar Templates
- Industry + region + climate zone specific
- Pre-built calendars for: HVAC (warm), HVAC (cold), Plumbing, Roofing, Cleaning, Electrical, Pest Control, Landscaping
- 4-6 week lead time before each season
- Storm response always ready (triggered, not scheduled)
- December: thank-you + referral cards for ALL industries
- The system suggests the calendar during onboarding: "Here's your recommended year. Adjust anything."

### Campaign Variety
The system should never let a customer send the same type of campaign more than 3x in a row without suggesting an alternative. Variety = better results + prevents audience fatigue.

## Final Review Findings (Pass 5)

### Cross-Campaign Bulk Export (Jake/Patil)
- Campaigns page: "Export All (CSV)" button
- Downloads every campaign with key metrics in one spreadsheet
- For marketing managers doing quarterly reporting

### First Campaign Email (Cialdini — most important email PostCanary sends)
- Special email after first campaign results come in (not generic sequence-complete)
- Shows: results, what the data tells them, specific recommendation for campaign #2
- Includes autopilot progress (1 of 5)
- This email is the bridge between one-time user and retained customer

### Campaigns Never Stop Matching (Kleppmann)
- No hard cutoff on campaign result attribution
- Every CRM update matches against ALL historical campaign addresses
- A campaign from 6 months ago can still get new attributed results (roofing leads take months)
- Bell curve "response window" is expected timing, not a hard stop
- UI: "Most responses come within 25 days, but we keep tracking as your CRM updates"

### Customer Goal Setting During Onboarding (Cialdini — commitment/consistency)
- During onboarding: "What would success look like this month? 5 calls? 10? 20+?"
- Home page shows progress toward THEIR stated goal
- "Your goal: 10 calls. Progress: 6/10. One more campaign should get you there."
- Psychological investment — once they state a goal, they want to hit it

### Multi-Channel Follow-Up (Competitor Gap — V2+)
- PostcardMania retargets postcard recipients with Facebook/Google ads
- "Surround sound" effect — postcard + digital ads to same household
- Not V1. Requires ad platform integrations. Note for V2 backlog.

## DECIDED: Pay-Per-Send Trial Model (Drake decision 2026-03-24)

### The Model
- **Free:** Sign up, onboard, browse, go through wizard, see cost estimates. No payment needed.
- **Pay-Per-Send (no subscription):** Send postcards at highest rate ($0.59/card). Full functionality. No monthly commitment. PostCanary makes margin on every piece.
- **Subscription (optional upgrade):** Lower per-card rates + included postcards + premium features. Pitched AFTER they've experienced value, never as a gate.

### Why This Works (all experts agree)
- No subscription gate = eliminates biggest objection ("I don't want $99/mo before I know it works")
- PostCanary makes money from day 1 (no free giveaway)
- Customers who try before subscribing have lower churn (Campbell)
- Subscription becomes a reward/discount, not a toll booth (Kennedy)
- Product-led growth — aha moment happens before commitment (Hulick)

### Subscription Tiers (REVISED — includes postcards to guarantee value)
NOTE: these are proposals, not final. Drake + team should validate pricing before launch.
- Pay-Per-Send: $0.69/card, basic features (limited templates, basic targeting, manual everything), no commitment
- Starter ($99/mo + $0.59/card): smart recommendations, full templates, saved audiences, QR tracking, budget tools, campaign analytics
- Growth ($249/mo + $0.52/card): everything in Starter + budget intelligence, conversion timelines, cross-campaign comparison
- Pro ($499/mo + $0.45/card): everything in Growth + autopilot eligibility, API access, dedicated support
- NO included postcards — subscription = platform intelligence, per-card = actual postcards. Clean separation.
- Subscription value comes from FEATURES that make every postcard work harder, not from free cards
- Final pricing TBD — these are starting points to refine before launch

### Subscription Nudge Strategy
- Nudge 1 (after first campaign approval): subtle — "This would have cost less with Starter"
- Nudge 2 (after first results): stronger — show savings with data
- Nudge 3 (ongoing): HONEST — if pay-per-send is cheaper for their volume, tell them. Don't push subscription when it doesn't make sense. Trust builds loyalty.
- Never block, never pressure. "Keep Pay-Per-Send" always available.

## Wizard State Management (Beck)
- One Pinia campaign draft store holds full wizard state
- Each step reads/writes to specific sections
- Changing goal in Step 1 flags Steps 2+3 as "needs review" but doesn't wipe them
- Auto-save debounce: save on step completion, explicit user action, and 5-second idle. Not on every mouse move.
- Terminal integration: each terminal builds with stubs of other terminals' components. Swap stubs for real components when ready.

## Integration Test — All 3 Systems Connected (final pass 2026-03-24)

### Brand Kit = Single Source of Truth
- Separate data object per org (not duplicated across systems)
- Design Studio reads from brand kit at generation time, never caches a copy
- Saved designs store REFERENCE to brand kit + only their OVERRIDES
- If customer updates phone in Settings → next postcard auto-uses new number
- Prevents: phone number in profile says X, postcard says Y

**Brand kit elements:**
- Business name (required)
- Location / address (required)
- Services + sub-categories (required)
- Phone number (required)
- **Website URL / domain** (from onboarding Q4 — displayed on postcard back, helps homeowners verify the company online. No website = skip this element, QR code still works)
- Logo + quality score
- Brand colors (2-3 extracted from website)
- Photos + quality scores
- Google review rating + excerpted reviews
- Certifications / badges
- Current offers / promotions (from website)
- Guarantees / warranties (for risk reversal)
- Years in business

### Step 1 → Step 2 Goal Change Handling
- If goal changes: keep drawn areas intact, reset exclusion toggles to new goal's defaults
- Recalculate household count with new exclusions
- Flag Step 2 for review but don't wipe data

### Recipient Type for AI Pre-Generation
- Pre-generate during Step 2 using goal's DEFAULT recipient assumption
- Neighbor Marketing → cold prospect messaging
- Seasonal → mixed messaging
- Win-Back → past customer messaging
- If customer changes exclusion settings in Step 2, quick text refresh (~2 sec) on Step 3 load

### Recipient Breakdown Added to TargetingSelection
```typescript
// ADD to TargetingSelection interface:
pastCustomersInArea: number
recipientBreakdown: {
  newProspects: number
  pastCustomers: number
  pastCustomersIncluded: boolean
}
```
Design Studio uses this for messaging tone: 90%+ new → cold messaging, 50%+ past → past customer messaging.

### DesignSelection Interface UPDATED for V1 (no Fabric.js)
```typescript
interface DesignSelection {
  templateId: string
  templateLayoutType: 'full-bleed' | 'side-split' | 'photo-top' |
                      'bold-graphic' | 'before-after' | 'review-forward'
  isCustomUpload: boolean
  customUploadUrl: string | null
  sequenceCards: CardDesign[]
}

interface CardDesign {
  cardNumber: number
  cardPurpose: 'offer' | 'proof' | 'last_chance'
  templateId: string
  previewImageUrl: string
  overrides: {           // only what customer CHANGED
    headline?: string
    offerText?: string
    reviewQuote?: string
    reviewerName?: string
    urgencyText?: string
    riskReversal?: string
    photoUrl?: string
  }
  resolvedContent: {     // template defaults + overrides merged
    headline: string
    offerText: string
    photoUrl: string
    reviewQuote: string
    reviewerName: string
    phoneNumber: string  // always from brand kit
    urgencyText: string
    riskReversal: string
    trustSignals: string[]
  }
  backContent: {
    guarantee: string
    certifications: string[]
    licenseNumber: string
    companyAddress: string
    qrCodeUrl: string
  }
}
```

### Seed Address Source
- Comes from business address in profile (same as postcard return address)
- Updates when they update Settings
- Past campaigns keep old address (already printed)
- Seed address stored separately from targeting list (Hunt check — doesn't appear in analytics)

### Campaign Mail Records at Scale
- 374 addresses × 3 cards = 1,122 records per campaign
- Same staging tables as CSV uploads (unified analytics)
- Add `source` field: 'campaign' vs 'csv_upload'
- Index on campaign_id for fast filtering
- At 1,000 campaigns: ~1M records. Kerstiens confirms PostgreSQL handles this with proper indexing.

### Home Page Recommendation Engine
- Server-side Claude call analyzing their data
- Runs: on login (if last recommendation >24h old) + after campaign completes
- Cached until new data arrives
- Prompt includes: Kennedy's priority (storm > seasonal > neighbor > win-back) + campaign history + industry + location + season + budget remaining

### Saved Audience Reload
- Recalculates count on every load (stored CRITERIA, not household list)
- If count changed: "412 households (was 374 last time — 38 new matches)" — transparent

### Saved Design Reload
- Stores overrides only, reads brand kit live
- If brand kit changed: auto-updates phone/logo/etc + shows: "Updated phone number to match your profile"

## Key Decisions Log
1. Sidebar, not top nav (all experts agreed)
2. "+ Send Postcards" not "+ New Campaign" (customer's words, not marketing jargon)
3. Full-page wizard, not modal or multi-page
4. One voice for all users, depth toggle deferred
5. Keep campaign selector in top bar (corrected — not redundant)
6. Don't reorganize existing pages — add alongside
7. Plan in order, code in parallel

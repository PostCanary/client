# Final Plan: PostCanary V1 Prerequisites Build

## Context

PostCanary is evolving from an analytics-only platform (upload mail/CRM CSVs, see matchback results) into a full direct mail platform where customers can send postcards directly. The V1 build adds a 4-step campaign wizard: Choose Goal → Pick Neighborhood → Your Postcard → Review & Send.

This Prerequisites build creates the shared foundation all 3 terminal builds depend on. After this is complete, a working wizard shell exists with stub steps that can be clicked through end-to-end. Each terminal then replaces its stub with the real implementation.

**Branch:** `feat/campaign-prerequisites` from `main` (multi-user merged)
**Brief:** `C:\Users\drake\postcanary\coding-briefs\00-prerequisites.md` (definitive reference)
**Spec:** `postcanary-v1-build-decisions.md` (source of truth for product decisions)

## Pre-Flight Checklist (before writing any code)

1. Verify Docker dev environment works: `cd "C:/Users/drake/postcanary/server" && docker compose -f docker-compose.dev.yml --env-file .env.dev up -d`
2. Verify client builds: `cd "C:/Users/drake/postcanary/client" && npm run build`
3. Run existing e2e tests to establish baseline: `npx playwright test` (if configured)
4. Create branch in BOTH repos (they're separate GitHub repos):
   - `cd "C:/Users/drake/postcanary/client" && git checkout -b feat/campaign-prerequisites`
   - `cd "C:/Users/drake/postcanary/server" && git checkout -b feat/campaign-prerequisites`
5. Confirm Alembic head is clean: `flask db heads` (should show single head)

## Build Order (16 tasks, 4 phases)

### Phase 1: Types (Task 1)

**Task 1: Create `src/types/campaign.ts`**
- All shared TypeScript interfaces from the brief
- Includes: `Industry` enum, `CampaignGoalType`, `GoalSelection`, `TargetingSelection`, `DesignSelection`, `ReviewSelection`, `CampaignDraft`, `BrandKit`, `TemplateDefinition`, `MailCampaign`, `MailCampaignCard`, `GOAL_DEFAULTS`, `PRICING`
- API convention note: server returns snake_case, client uses camelCase
- **Verify:** `npm run build` passes with new types file (no consumers yet, just definitions)

### Phase 2: Server (Tasks 2-6)

**Task 2: Extend Organization model + profile logic**
- `app/models.py`: Add nullable columns to **Organization** (NOT User — org-level data in multi-org system): `business_name` (String), `location` (String), `service_types` (ARRAY of String)
- `app/services/users.py` — ONE change:
  1. **CRITICAL — `compute_profile_complete()`**: Current logic (line 122) requires `industry AND crm AND mail_provider AND website_url`. Change to OR strategy:
     - KEEP invited user fast-path: `if invited_user: return bool((user.full_name or "").strip())`
     - Old formula (existing users): `industry AND crm AND mail_provider AND website_url`
     - New formula (new users): `industry AND org.location`
     - Combined: `old_formula OR new_formula`
     - **New function signature:** `compute_profile_complete(user, org=None, invited_user=None)`
     - **CRITICAL: existing users must NOT be re-triggered for onboarding.**
  2. **CRITICAL — `serialize_user()` must fetch org and pass it:**
     - Add `org = Organization.query.get(user.default_org_id) if user.default_org_id else None`
     - Pass `org=org` to `compute_profile_complete()`. Without this, org is always None and new users stay stuck in onboarding.
     - Also update `update_user_profile()` the same way.
- `app/services/orgs.py` (EXISTING file — NOT `organizations.py`):
  - Extend `update_org()` to accept optional `business_name`, `location`, `service_types` parameters
  - Extend `get_org_details()` to include these fields in the returned dict
- `src/api/orgs.ts` (EXISTING file — NOT `organizations.ts`):
  - Add `business_name`, `location`, `service_types` to the `Org` type
  - Extend `updateOrg()` payload to accept these fields
- Onboarding modal and wizard should call the org update endpoint (not user profile endpoint) for business_name, location, service_types.
- **Verify:** PATCH to `/api/orgs/<org_id>` (NOT PUT, NOT `/api/organizations/`) with `{ business_name: "Drake's Plumbing", location: "Scottsdale, AZ", service_types: ["plumbing"] }` → org updates. PATCH to `/api/users/me` with `{ industry: "plumbing" }` + org has location → `profile_complete` returns true

**Task 3: Add CampaignDraft and BrandKit models (`app/models.py`)**
- `CampaignDraft`: id, org_id, created_by, current_step, completed_steps, needs_review_steps, data (JSONB), schema_version, timestamps
- `BrandKit`: id, org_id (unique), data (JSONB), scrape_status, timestamps
- Both with org_id FK + CASCADE + index
- **Verify:** Models compile, no naming conflicts with existing models

**Task 4: Create Alembic migration**
- `migrations/versions/20260326_add_campaign_prerequisites.py`
- Creates `campaign_drafts` table, `brand_kits` table, adds Organization columns (`business_name`, `location`, `service_types`)
- Include both upgrade and downgrade
- Run `flask db upgrade` to verify
- **Verify:** Tables exist in database, rollback works

**Task 5: Create DAOs + Services**
- `app/dao/campaign_drafts_dao.py`: create, get_by_id, list_for_org, update, delete — all filter by org_id
- `app/dao/brand_kit_dao.py`: get_for_org, upsert
- `app/services/campaign_drafts.py`: thin wrappers + validation
- `app/services/brand_kit.py`: get_or_create, `populate_from_profile(org_id)` (reads from Organization model, NOT User), update_from_scrape, mock_scrape
- DAOs return dicts, not ORM objects (existing pattern)
- **Verify:** Can call services from Flask shell

**Task 6: Create Blueprints**
- `app/blueprints/campaign_drafts.py`: POST/GET/GET:id/PUT/DELETE at `/api/campaign-drafts`
- `app/blueprints/brand_kit.py`: GET/PUT at `/api/brand-kit`, POST at `/api/brand-kit/scrape`
- Both use `_uid()` and `_oid()` from session (existing auth pattern)
- Delete endpoint: check created_by matches current user, OR user is owner/admin
- Register both in `app/__init__.py`:
  ```python
  from .blueprints.campaign_drafts import campaign_drafts_bp
  from .blueprints.brand_kit import brand_kit_bp
  app.register_blueprint(campaign_drafts_bp)
  app.register_blueprint(brand_kit_bp)
  ```
- **Verify:** curl endpoints, check responses match expected shapes, check org_id scoping

### Phase 3: Client API + Stores (Tasks 7-9)

**Task 7: Create client API layers**
- `src/api/campaignDrafts.ts`: createDraft, loadDraft, saveDraft, deleteDraft, listDrafts
- `src/api/brandKit.ts`: getBrandKit, updateBrandKit, triggerScrape
- Use existing helpers: `get`, `postJson`, `putJson`, `del_` from `src/api/http.ts`
- **snake_case handling:** The existing codebase uses snake_case directly in TypeScript (e.g., `profile.full_name`, `profile.profile_complete`). Follow the same pattern: the API functions return server-shaped data (snake_case for top-level fields like `org_id`, `current_step`). The JSONB `data` blob uses camelCase since only the client reads/writes it. The API functions transform the top-level wrapper but pass through the data blob as-is.
- **Verify:** API calls return data in correct shape (test against running server)

**Task 8: Create Pinia stores**
- `src/stores/useCampaignDraftStore.ts`: full implementation from brief — state (draft, saving, loading, error), getters (currentStep, isStepComplete, canProceed, progressPercent), actions (startNew, resume, discard, setGoal, setTargeting, setDesign, setReview, goToStep, saveNow, _debounceSave, _save with queued save handling)
- `src/stores/useBrandKitStore.ts`: state (brandKit, loading, hydrated, error), actions (fetch, update, triggerScrape), getter (isComplete)
- `GOAL_DEFAULTS` imported as runtime value (NOT `import type`)
- **Verify:** Stores compile, can be instantiated in a test component

**Task 9: Create PostcardPreview shared components**
- `src/components/postcard/PostcardPreview.vue`: wrapper with size modes (thumbnail/large), front/back flip
- `src/components/postcard/PostcardFrontStub.vue`: colored rectangle with "Front Preview" text, brand colors from props
- `src/components/postcard/PostcardBackStub.vue`: colored rectangle with "Back Preview" text
- Terminal 2 later replaces stubs with real PostcardFront/PostcardBack
- **Verify:** Components render without errors when given mock CardDesign data

### Phase 4: Wizard UI + Nav + Onboarding (Tasks 10-16)

**Task 10: Create WizardLayout**
- `src/layouts/WizardLayout.vue`: full viewport, white bg, top bar with logo (left) + WizardProgress (center) + X close button (right), `<router-view />` below
- Close button: calls `draftStore.saveNow()`, shows toast "Your progress is saved", navigates to `/app/campaigns`
- **Verify:** Layout renders with empty content

**Task 11: Create WizardProgress**
- `src/components/wizard/WizardProgress.vue`: 4 labeled steps, clickable completed steps, current step highlighted teal, checkmarks on completed, time estimates for first-timers, "Almost there — 75% done" after Step 3
- Step labels: "Choose Your Goal" | "Pick Your Neighborhood" | "Your Postcard" | "Review & Send"
- **Verify:** Progress bar renders correctly for each step state

**Task 12: Create Step Stubs (before WizardShell)**
- `StepGoalStub.vue`: radio buttons for goal types, sequence length dropdown, writes to `draftStore.setGoal()`
- `StepTargetingStub.vue`: text input for household count, cost auto-calculates, populates `recipientBreakdown` with mock values, writes to `draftStore.setTargeting()`
- `StepDesignStub.vue`: placeholder PostcardPreview, "Approve Design" button, writes to `draftStore.setDesign()`
- `StepReviewStub.vue`: summary text, "Approve & Send" button, writes to `draftStore.setReview()`
- **Verify:** Each stub sets data in the draft store correctly

**Task 13: Create WizardShell**
- `src/components/wizard/WizardShell.vue`: renders current step via v-if, Back/Next buttons, beforeunload handler for force-save, popstate handler for browser back, save failure indicator
- Imports stubs (terminals replace later)
- **Verify:** Can click through all 4 steps, data persists in store

**Task 14: Mobile gate**
- In SendWizard.vue or WizardLayout.vue: if viewport < 768px, show "works best on a computer" message with Go Back button (navigates to `/app/dashboard`)
- **Verify:** Resize browser below 768px, see gate message

**Task 15: Create SendWizard page + routing**
- `src/pages/SendWizard.vue`: checks auth.orgId, loads or creates draft, `router.replace` with draft ID after creation, error state with Try Again button, loading spinner
- Add wizard route to `src/router.ts` as TOP-LEVEL sibling (not inside /app children): `/app/send/:draftId?` using WizardLayout
- Add campaign routes INSIDE existing /app children: `/app/campaigns`, `/app/campaigns/:id`
- **Also create stub pages:** `src/pages/CampaignsStub.vue` and `src/pages/CampaignDetailStub.vue` as placeholder pages (following the existing stub pattern). The real campaign list/detail pages aren't created until Terminal 3 — these stubs prevent 404s and give users a "Coming soon" landing.
- **Onboarding gate:** On SendWizard mount, check `auth.profileComplete`. If false, redirect to `/app/dashboard` (WizardLayout does not render OnboardingModal — the user must complete onboarding on the dashboard first).
- **Verify:** Navigate to /app/send, wizard opens, URL updates with draft ID, refresh resumes same draft. Navigate to /app/campaigns, see stub page. Incomplete profile redirects to dashboard.

**Task 16: Update Navbar + OnboardingModal**
- `Navbar.vue`: add teal "+ Send Postcards" button between nav links and campaign selector. Style: `bg-[#47bfa9] text-white font-semibold px-4 py-2 rounded-lg`. Routes to `/app/send`.
- `OnboardingModal.vue`: rebuild with 4 screens (new users only — existing users never see this again):
  - **Screen 1:** "Your name" (pre-fill if set) + "Business name" (new field) — two fields, one screen
  - **Screen 2:** "Where's your business?" — city/state or ZIP, auto-detect from browser geolocation if allowed
  - **Screen 3:** "What services do you offer?" — industry selector (HVAC, Plumbing, Roofing, etc.) + sub-category checkboxes
  - **Screen 4:** "What's your website?" — optional with skip nudge: "Without your website, we can't auto-pull your logo, photos, and reviews onto your postcards. You'll add them manually instead." [Skip anyway] [Enter website]
  - Phone number is NOT asked here — collected in wizard Step 3 when the postcard needs it and phone is missing
  - Progress dots at bottom (4 dots)
  - On completion:
    1. Save `full_name` to User profile (via existing user profile endpoint)
    2. Save `business_name`, `location`, `service_types` to Organization (via org update endpoint — NOT the user profile endpoint)
    3. Call `populate_from_profile(org_id)` to seed brand kit from org data
    4. Trigger mock scrape background
  - Use existing `useUserProfile` composable for user fields (full_name, industry). Use new org update API for org fields (business_name, location, service_types).
  - **Existing users:** NO re-onboarding modal. Missing fields (location, services) collected in-context inside the campaign wizard before Step 1 when they first use it.
- `auth.ts`: onboarding trigger stays as `!profile_complete` (no change needed — existing users keep `profile_complete = true` and never see the modal again). Missing fields for existing users are collected in-context when they first open the campaign wizard.
- **Verify:** New button visible in nav, clicking it opens wizard. New user sees onboarding modal. Existing user does NOT see modal — wizard handles missing fields.

## Critical Files

| File | Action | Blast Radius Check |
|------|--------|-------------------|
| `src/router.ts` | Add 3 routes | Grep: nothing imports router config |
| `src/components/layout/Navbar.vue` | Add button | Check MobileNavbar.vue too |
| `src/components/OnboardingModal.vue` | Rebuild | Check MainLayout.vue trigger |
| `src/stores/auth.ts` | NO change needed — trigger stays as `!profile_complete` | Existing users never see modal again. Missing fields collected in wizard. |
| `app/models.py` | Add 2 models + 3 Organization columns (`business_name`, `location`, `service_types`) | Check existing Organization serialization, update `services/orgs.py` |
| `app/__init__.py` | Register 2 blueprints | No blast radius |

## Codebase Guardian Rules (during every task)

- Before modifying an existing file: read it fully, grep for all imports/consumers
- Before creating a new file: grep for name collisions
- After every task: `npm run build` (client) to verify TypeScript compiles
- After server changes: verify existing endpoints still work

## Verification (after all 16 tasks)

1. `npm run build` passes with zero errors
2. Navigate to app → see "+ Send Postcards" button in navbar
3. Click button → wizard opens at `/app/send/[uuid]`
4. Click through all 4 stub steps → progress bar updates
5. Close wizard → toast shows "progress saved"
6. Reopen `/app/send/[uuid]` → resumes at last step
7. Refresh page → same draft loads (no duplicate)
8. Resize to mobile → see "works best on a computer" message
9. New user login → sees 4-question onboarding modal
10. Existing user → does NOT see onboarding modal (profile_complete already true). Missing fields collected in wizard when they first click "+ Send Postcards".
11. `GET /api/campaign-drafts` returns draft list for org
12. `GET /api/brand-kit` returns brand kit for org
13. Run existing e2e tests → all pass (no regressions)
14. Drake checkpoint: "Click through the wizard. Does it feel right?"

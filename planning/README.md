# PostCanary V1 — Coding Plans

These are the detailed coding plans for the V1 direct mail platform build. They've been through 4 rounds of review: expert product review, codebase stress testing, pre-mortem analysis, and Codex readiness audit.

## How to Read

Each terminal has 3 files:
1. **Brief** (`XX-terminal-name.md`) — WHAT to build. Component specs, data contracts, interfaces, code snippets.
2. **Execution Plan** (`XX-...-execution-plan.md`) — HOW to build it. Task-by-task order, verification steps, pre-flight checklist.
3. **Stress Test Fixes** (`XX-...-stress-test-fixes.md`) — Issues found during review + exact fixes. Read this LAST — it overrides the brief/plan where they conflict.

Prerequisites has no separate stress test file — fixes were applied directly to the brief.

## Build Order

1. **Prerequisites** (shared foundation) — types, stores, wizard shell, brand kit, onboarding
2. **Terminal 3: Campaign Builder** (Steps 1 + 4) — goal selection, review & send, campaigns page
3. **Terminal 1: Map & Targeting** (Step 2) — targeting map, drawing tools, filters, household count
4. **Terminal 2: Design Studio** (Step 3) — postcard preview, template system, editing

Each merges to main before the next starts. Each gets its own feature branch.

## Key Architecture Decisions

- **MailCampaign** (not Campaign) — new `mail_campaigns` table. Existing analytics `Campaign` model/store/API untouched.
- **Wizard route** at `/app/send/:draftId?` uses its own layout (no sidebar). Separate from `/app` MainLayout routes.
- **Round 1 = frontend with mock data.** No real Melissa Data, print shops, or billing. Mock household counts, mock AI content, mock status progression.
- **Existing users:** No re-onboarding modal. Missing fields collected in-context inside the wizard.
- **PostcardPreview** is a shared component (in `src/components/postcard/`). Prerequisites creates stubs, Terminal 2 replaces with real renderers.

## What I Need From You (Dustin)

1. **Review the schema changes** — new tables (`campaign_drafts`, `brand_kits`, `mail_campaigns`) + 3 new columns on `users` (`business_name`, `location`, `service_types`). See Prerequisites brief Task 5.
2. **Flag any conflicts** with work you're actively doing — especially if you're touching `models.py`, `router.ts`, `Navbar.vue`, or `OnboardingModal.vue`.
3. **Review the `profile_complete` logic change** — dropping `crm` and `mail_provider` as requirements, changing to `industry AND location`. See Prerequisites brief Task 2.
4. **Anything that looks wrong** — these plans were stress-tested but you know the codebase better than anyone.

## Files

| # | File | Size | Description |
|---|------|------|-------------|
| 0 | `00-prerequisites.md` | 46KB | Shared types, stores, wizard shell, brand kit, onboarding |
| 0 | `00-prerequisites-execution-plan.md` | 13KB | 16 tasks, pre-flight checklist, verification |
| 1 | `01-terminal-map-targeting.md` | 24KB | Leaflet map, drawing tools, filters, cost estimate |
| 1 | `01-terminal-map-targeting-execution-plan.md` | 11KB | 15 tasks, leaflet-draw fallback plan |
| 1 | `01-terminal-map-targeting-stress-test-fixes.md` | 17KB | 11 issues + expert product fixes |
| 2 | `02-terminal-design-studio.md` | 37KB | Postcard preview, templates, editing, sequence view |
| 2 | `02-terminal-design-studio-execution-plan.md` | 13KB | 18 tasks, template system |
| 2 | `02-terminal-design-studio-stress-test-fixes.md` | 19KB | 5 blockers + data flow fixes + all 18 templates defined |
| 3 | `03-terminal-campaign-builder.md` | 40KB | Steps 1+4, campaigns page, campaign detail |
| 3 | `03-terminal-campaign-builder-execution-plan.md` | 16KB | 17 tasks, server model + endpoints |
| 3 | `03-terminal-campaign-builder-stress-test-fixes.md` | 13KB | 4 blockers + expert fixes + Codex readiness for all 17 tasks |

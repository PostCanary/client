---
phase: 01-ai-generation-website-scraping-google-reviews
plan: 02
subsystem: api
tags: [ai-generation, anthropic, claude, direct-mail, copywriting, manual-reviews, pinia]

# Dependency graph
requires: [01-01-PLAN]
provides:
  - "AI content generation service (ONE Claude call per card, synchronous)"
  - "Headline generation with 3 candidates per card (Caples/Halbert/Gendusa frameworks)"
  - "Offer text generation (50 words max, value-stacked)"
  - "Review selection with plain-English reasoning"
  - "Card-position-aware template recommendations (different layout per card)"
  - "Local fallback content when Claude is unavailable"
  - "Manual review entry (paste text, replaces Google OAuth for now)"
  - "Review CRUD: add, remove, reorder (select) reviews"
  - "Client async composable with server API + local fallback"
affects: [design-studio, wizard-step-3, brand-kit-ui, postcard-preview]

# Tech tracking
tech-stack:
  added: []
  patterns: [single-call-per-card, sync-ai-generation, local-fallback, xml-tag-injection-defense]

key-files:
  created:
    - server/app/services/ai_generator.py
  modified:
    - server/app/services/brand_kit.py
    - server/app/blueprints/brand_kit.py
    - server/tests/unit/test_ai_generator.py
    - client/src/api/brandKit.ts
    - client/src/composables/usePostcardGenerator.ts
    - client/src/stores/useBrandKitStore.ts
    - client/src/types/campaign.ts
    - client/src/components/wizard/StepDesign.vue

key-decisions:
  - "ONE Claude call per card (not 3 separate calls) -- addresses DHH simplicity concern"
  - "Synchronous generation (no pre-generation, no cache) -- addresses DHH YAGNI concern"
  - "10-second timeout with local fallback -- customer never blocked by AI failure"
  - "XML tags wrap interpolated values in prompt -- reduces prompt injection risk (T-02-03)"
  - "Manual review paste replaces Google OAuth -- deferred to Phase 2 (DHH, Shah, Krug)"
  - "Plain-English reason fields (no marketing jargon) -- addresses Shah, Krug concern"

patterns-established:
  - "Single-call-per-card: ONE Claude call generates headlines, offer, review, template recommendation"
  - "Local fallback: Python-side and client-side template content when AI unavailable"
  - "Async composable with fallback: server API call wrapped in try/catch with local generation"
  - "Review reorder pattern: selectReview(index) moves review to position 0 for swap UI"

requirements-completed: [AIGEN-01, AIGEN-02, AIGEN-03, AIGEN-04, AIGEN-05, AIGEN-06, AIGEN-07, GREV-03, GREV-04, GREV-05]

# Metrics
duration: 8min
completed: 2026-04-06
---

# Phase 01 Plan 02: AI Content Generation Summary

**Single-call-per-card Claude AI generation with 3 headline candidates, value-stacked offers, card-position-aware templates, manual review paste, and local fallback**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-06T19:22:16Z
- **Completed:** 2026-04-06T19:30:47Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Production AI content generation: ONE Claude call per card generates headlines (3 candidates), offer text (50 words max), review selection, and template recommendation
- Every AI response includes plain-English reason fields explaining WHY each element works
- Card-position-aware template recommendations (card 1 != card 2 != card 3)
- Local fallback content on Claude failure/timeout (customer never blocked)
- Manual review entry via text field (POST /reviews) replaces Google Reviews OAuth
- Review CRUD: add, remove, and reorder reviews in brand kit store
- Client composable calls server API with graceful fallback to local generation
- 18 unit tests passing for all AI generation and review management functions

## Task Commits

Each task was committed atomically:

1. **Task 1: Build AI generator service + manual review entry (TDD)**
   - `ba54499` (test, server) -- 18 failing tests for AI generator (RED)
   - `4ff159a` (feat, server) -- ai_generator.py + brand_kit.py + blueprint endpoints (GREEN)
   - `1a2261f` (feat, client) -- CardDesign type gains headlineCandidates + reason fields

2. **Task 2: Wire /generate endpoint + update client composable + manual review API**
   - `7be20aa` (feat, client) -- async composable + brandKit API + store actions + StepDesign async

_Note: Server and client are separate git repos. Server commits in `C:/Users/drake/postcanary/server/`, client commits in the worktree._

## Files Created/Modified

### Server (C:/Users/drake/postcanary/server/)
- `app/services/ai_generator.py` -- Core AI generation: generate_card_content (single Claude call), generate_all_cards (orchestrator), select_review, fallback content, response validation
- `app/services/brand_kit.py` -- add_manual_review (sanitize name, excerpt text, store in JSONB), remove_review (bounds check)
- `app/blueprints/brand_kit.py` -- POST /generate (goal_type validation, sync response), POST /reviews (manual entry), DELETE /reviews/<index>
- `tests/unit/test_ai_generator.py` -- 18 tests: headline count/format, word limits, plain-English reasons, goal variation, template variation, fallback, review CRUD

### Client (worktree)
- `src/types/campaign.ts` -- CardDesign gains headlineCandidates, offerReason, reviewReason, templateReason
- `src/api/brandKit.ts` -- generateContent(), addManualReview(), removeReview() API functions
- `src/composables/usePostcardGenerator.ts` -- async generateCards() with server API call + local fallback
- `src/stores/useBrandKitStore.ts` -- addReview, removeReview, selectReview actions
- `src/components/wizard/StepDesign.vue` -- generateNewCards() now async

## Decisions Made

- ONE Claude call per card (not 3 separate calls for headlines/offer/review) -- simplicity per DHH review
- Synchronous generation with no pre-generation or cache -- YAGNI per DHH review
- 10-second timeout per Claude call with local fallback -- customer never sees an error
- XML tags wrap all interpolated business data in the prompt -- reduces prompt injection risk
- Manual review paste via text field replaces Google Reviews OAuth (deferred to Phase 2)
- Plain-English reason fields ("This headline works because...") not marketing jargon ("Caples curiosity formula")
- selectReview(index) is local state reorder only -- position 0 is what gets used for generation

## Deviations from Plan

None -- plan executed exactly as written.

## Threat Model Compliance

All mitigations from the threat register were implemented:
- **T-02-01** (Spoofing): Session auth + org membership check on all endpoints
- **T-02-02** (Tampering): goal_type validated against allowed enum (400 on invalid)
- **T-02-03** (Prompt injection): XML tags wrap all interpolated values in Claude prompt
- **T-02-04** (XSS): HTML tags stripped from review text, max 500 chars, reviewer name sanitized
- **T-02-06** (DoS): 10-second timeout, no pre-generation, max 3 calls per request
- **T-02-07** (Malformed JSON): JSON validated with fallback to local templates on parse failure

## Known Stubs

None -- all data paths are wired to real or fallback content.

## Next Phase Readiness

- AI generation pipeline ready for Design Studio Step 3 to display real AI-generated content
- Manual review entry ready for onboarding/brand kit UI
- headlineCandidates array enables headline swap dropdown in edit panel
- Reason fields ready for "Why This Design Works" reasoning panel
- selectReview(index) enables review swap dropdown (GREV-05)

---
*Phase: 01-ai-generation-website-scraping-google-reviews*
*Completed: 2026-04-06*

## Self-Check: PASSED

- All 9 files verified present (5 client, 4 server)
- All 4 commits verified (2 client: 1a2261f, 7be20aa; 2 server: ba54499, 4ff159a)
- TypeScript compiles cleanly (npx tsc --noEmit)
- 18/18 unit tests passing

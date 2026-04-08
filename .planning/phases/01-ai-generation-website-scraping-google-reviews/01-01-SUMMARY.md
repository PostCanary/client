---
phase: 01-ai-generation-website-scraping-google-reviews
plan: 01
subsystem: api
tags: [playwright, pillow, scraping, claude, exif, security, circuit-breaker, pinia]

# Dependency graph
requires: []
provides:
  - "Hardened website scraper service (Playwright sync + Claude extraction)"
  - "EXIF stripping with decompression bomb protection"
  - "Photo quality scoring (workers > results > equipment > stock)"
  - "Privacy-safe reviewer name sanitization"
  - "SSRF + DNS rebinding URL validation"
  - "Circuit breaker for Claude API calls"
  - "Background scrape orchestration with progress polling"
  - "Stale scrape reaper (>5 min auto-fail)"
  - "Client-side scrape progress polling with typed scrapeProgress"
affects: [01-02-PLAN, ai-generation, design-studio, brand-kit-ui]

# Tech tracking
tech-stack:
  added: [playwright, Pillow]
  patterns: [circuit-breaker, background-thread-executor, poll-based-progress, merge-rules]

key-files:
  created:
    - server/app/services/scraper.py
    - server/tests/unit/test_scraper.py
  modified:
    - server/requirements.txt
    - server/app/services/brand_kit.py
    - server/app/blueprints/brand_kit.py
    - client/src/types/campaign.ts
    - client/src/api/brandKit.ts
    - client/src/stores/useBrandKitStore.ts

key-decisions:
  - "Playwright sync_api (not async) — avoids fragile asyncio.run() in Flask threads"
  - "Lazy-initialized Anthropic client — prevents crash if ANTHROPIC_API_KEY not set at import"
  - "Circuit breaker threshold at 3 failures — balances resilience vs. retry opportunity"
  - "Stale scrape reaper at 5 minutes — opportunistic (called at kickoff_scrape start)"
  - "Merge rules: photos append, colors/certs replace, names don't overwrite existing"
  - "Server changes committed to server repo (separate from client worktree)"

patterns-established:
  - "Circuit breaker: global failure counter + boolean flag, resets on success"
  - "Background scrape: ThreadPoolExecutor(max_workers=2) + flask_app context capture"
  - "Progress polling: client polls GET /api/brand-kit every 2s until scrapeStatus != 'scraping'"
  - "Merge rules: explicit field-by-field merge semantics for scraped data"

requirements-completed: [SCRAPE-01, SCRAPE-02, SCRAPE-03, SCRAPE-04, SCRAPE-05, SCRAPE-06]

# Metrics
duration: 7min
completed: 2026-04-06
---

# Phase 01 Plan 01: Website Scraping Summary

**Hardened Playwright sync scraper with Claude extraction, EXIF stripping, circuit breaker, DNS rebinding defense, and client progress polling**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-06T19:10:52Z
- **Completed:** 2026-04-06T19:18:33Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Production-grade website scraping pipeline replacing mock_scrape stub
- 23 unit tests covering all security defenses (EXIF, SSRF, DNS rebinding, decompression bombs, circuit breaker)
- Background thread orchestration with progress polling and stale scrape reaper
- Explicit merge rules for scraped data integration with existing brand kit

## Task Commits

Each task was committed atomically:

1. **Task 1: Build hardened scraper service (TDD)**
   - `8459528` (test) — 23 failing tests for scraper service (RED)
   - `585212f` (feat) — scraper.py implementation + requirements.txt (GREEN)
2. **Task 2: Wire scraper into brand_kit service + blueprint + client progress polling**
   - `0ef5273` (feat, server repo) — brand_kit.py + blueprint wiring
   - `b262d52` (feat, client repo) — campaign.ts + brandKit.ts + useBrandKitStore.ts

_Note: Server and client are separate git repos. Server commits are in `C:/Users/drake/postcanary/server/`, client commits in the worktree._

## Files Created/Modified

### Server (C:/Users/drake/postcanary/server/)
- `app/services/scraper.py` — Core scraping pipeline: Playwright sync, Claude extraction, EXIF stripping, photo scoring, URL validation, circuit breaker
- `app/services/brand_kit.py` — kickoff_scrape, reap_stale_scrapes, _merge_scraped_data, _scrape_job, _update_progress
- `app/blueprints/brand_kit.py` — /scrape POST endpoint calling real kickoff_scrape, 409 on already-scraping
- `requirements.txt` — Added playwright>=1.40.0, Pillow>=10.0.0
- `tests/unit/test_scraper.py` — 23 unit tests for all scraper functions

### Client (worktree)
- `src/types/campaign.ts` — scrapeProgress type, 'scraping' added to scrapeStatus union
- `src/api/brandKit.ts` — Map scrapeProgress from API response
- `src/stores/useBrandKitStore.ts` — Poll-based scrape tracking, isScraping getter, 409 handling

## Decisions Made
- Used Playwright sync_api per expert review (Majors + Ronacher) — async-inside-sync via asyncio.run() is fragile in Flask threads
- Lazy-initialized Anthropic client per Ronacher review — module-level client crashes Flask if ANTHROPIC_API_KEY not set
- Circuit breaker threshold at 3 consecutive failures per Majors review — returns partial result with whatever Playwright scraped
- Stale scrape reaper at 5-minute cutoff per Majors review — called opportunistically at kickoff_scrape start
- Explicit merge rules per Codex review — photos append (don't remove uploads), colors/certs replace (website is authoritative), names/phone don't overwrite existing
- Server changes committed to separate server repo since PostCanary has separate client + server repos

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Multi-repo structure not in plan**
- **Found during:** Task 1 (initial file discovery)
- **Issue:** Plan assumes monorepo structure with `server/` and `client/` in same repo. Actual setup has separate repos.
- **Fix:** Server files created/committed in the server repo (`C:/Users/drake/postcanary/server/`), client files in the worktree. Both sets tracked in SUMMARY.
- **Files modified:** N/A (structural adjustment)
- **Verification:** Both repos have clean git status, all tests pass

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Structural adjustment only. No functionality or scope changes.

## Issues Encountered
- Root conftest.py in server tests requires PostgreSQL DATABASE_URL — unit tests ran with `--noconftest` flag to bypass integration test fixtures. Unit tests are self-contained with mocks.

## User Setup Required

The following must be done before the scraper will work in production:
- `ANTHROPIC_API_KEY` environment variable must be set on the server
- Playwright browser binaries must be installed: `playwright install chromium`
- No new database migrations needed (scrapeProgress stored in existing JSONB `data` column)

## Next Phase Readiness
- Scraper pipeline is ready for Plan 02 (AI Generation) to consume brand kit data
- `_sanitize_reviewer_name` exported and ready for reuse in Plan 02 review handling
- `score_photos` scoring algorithm ready for photo selection in template rendering
- Client poll UI infrastructure ready for any component to display scrapeProgress steps

---
*Phase: 01-ai-generation-website-scraping-google-reviews*
*Completed: 2026-04-06*

## Self-Check: PASSED

- All 8 files verified present (4 client, 4 server)
- All 4 commits verified (1 client: b262d52, 3 server: 8459528, 585212f, 0ef5273)
- TypeScript compiles cleanly (npx tsc --noEmit)
- 23/23 unit tests passing

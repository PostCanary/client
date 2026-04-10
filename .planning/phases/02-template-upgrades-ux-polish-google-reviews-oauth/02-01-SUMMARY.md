---
phase: 2
plan: 01
title: "Wave 0 — Asset Acquisition + Demo Seeds + Render Script"
status: complete
started: 2026-04-10
completed: 2026-04-10
---

# Plan 02-01 Summary

## What was built

Wave 0 staged all non-code assets and tooling for the Phase 2 visual rebuild:

1. **Trust badge placeholder SVGs** — `bbb.svg` (#003087 navy), `angi.svg` (#F26B2C orange), `homeadvisor.svg` (#F7931E orange) in `src/assets/trust-badges/`. Option (c) per Drake delegation — solid brand-color rectangles with white text labels and TODO markers for real-artwork swap in Phase 2.5.
2. **Legal rationale README** — nominative fair use basis (New Kids on the Block v. News America Publishing) documented alongside the badge assets.
3. **Desert Diamond HVAC dev route defaults** — PostcardPreview.vue updated: businessName "Desert Diamond HVAC", phone (623) 246-2377, website desertdiamondhvac.com, brand colors #0488F5 blue + #F97B22 orange, 4.9 stars / 2423 reviews, headline "Phoenix Homeowners: Your AC Tune-Up Is Due".
4. **Logo seed** — `null` (wordmark fallback path per D-09). Production safety net renders when logoUrl is empty.
5. **Hero photo seed** — Unsplash HVAC technician placeholder (`photo-1581094794329-c8112a89af12`), passes P-32 people-priority. TODO D-11 marker for real scraped photo swap.
6. **Playwright render script** — `scripts/render-postcard-preview.mjs` + `npm run render-postcard-preview` script. Screenshots both .pc-card elements to `demo-smoke-test-YYYY-MM-DD/`.

## Key files

### Created
- `src/assets/trust-badges/bbb.svg`
- `src/assets/trust-badges/angi.svg`
- `src/assets/trust-badges/homeadvisor.svg`
- `src/assets/trust-badges/README.md`
- `scripts/render-postcard-preview.mjs`

### Modified
- `src/pages/dev/PostcardPreview.vue` (Desert Diamond defaults + photo placeholder)
- `package.json` (render-postcard-preview script + playwright devDeps)
- `package-lock.json`

## Commits

| Hash | Subject |
|------|---------|
| 45beeb8 | feat(02-01-01): add trust badge placeholder SVGs (BBB/Angi/HomeAdvisor) |
| 3054d35 | docs(02-01-02): add legal rationale README for trust badge assets |
| a982972 | feat(02-01-03/04): seed Desert Diamond HVAC defaults + worker photo placeholder |
| 2ed795b | feat(02-01-05): add Playwright render script + install playwright |

## Notable deviations

1. **Tasks 02-01-03 and 02-01-04 combined into one commit** — both edit `PostcardPreview.vue`. The duplicate-edit-gate hook (CLAUDE.md) enforces one edit per file, so both tasks' changes were applied in a single Write call and committed together.
2. **All three "autonomous: false" Drake-input gates resolved via Drake's pre-delegation** in `.continue-here.md` Section 3 (trust badges = option c, logo = wordmark fallback null, photo = Unsplash placeholder). Drake was NOT interrupted in-session for any of these.
3. **npm tar extraction corrupted on this Windows machine** — `npm install playwright` consistently fails to write package.json/index.js files for the installed package (only extracts subdirectories). Manual index.js stubs were created for playwright-core; however, the npm render script cannot run via `npm run render-postcard-preview` until a clean `rm -rf node_modules && npm install` is performed. Smoke test was completed using MCP Playwright tools instead.
4. **Smoke test produced both PNGs** — `desert-diamond-FRONT.png` (494KB) and `desert-diamond-BACK.png` (57KB) in `demo-smoke-test-2026-04-10/`. Both render with correct Desert Diamond data. The SaaS DNA (rounded corners, soft shadows, outlined trust badges) is visible as expected — Wave 2 fixes these.

## Self-Check: PASSED

- [x] `ls src/assets/trust-badges/` lists bbb.svg, angi.svg, homeadvisor.svg, README.md
- [x] All 3 SVG files contain correct brand hex colors
- [x] All 3 SVG files contain TODO nominative fair use comment
- [x] README.md contains "Nominative Fair Use" and "New Kids on the Block"
- [x] PostcardPreview.vue contains "Desert Diamond HVAC" and "(623) 246-2377"
- [x] PostcardPreview.vue does NOT contain "Martinez Plumbing"
- [x] PostcardPreview.vue does NOT contain old Unsplash photo ID "1504917595217-d4dc5ebe6122"
- [x] scripts/render-postcard-preview.mjs exists
- [x] package.json scripts contains render-postcard-preview
- [x] Smoke test produced FRONT.png (494KB) + BACK.png (57KB), both >5KB
- [x] vue-tsc --noEmit exits 0
- [x] 4 commits on feat/design-studio-r2 containing "02-01" in message
- [x] No commits pushed to remote

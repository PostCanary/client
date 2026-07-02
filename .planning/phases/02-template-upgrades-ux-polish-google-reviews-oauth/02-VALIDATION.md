---
phase: 2
slug: template-upgrades-ux-polish-google-reviews-oauth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 2 — Validation Strategy

> Per-phase validation contract. **This is a visual rebuild phase — most validation is manual rendering + pattern matching, not unit tests.**

See `02-RESEARCH.md` § "Validation Architecture" for the full architecture rationale. This file is the operational sampling contract.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `vue-tsc --noEmit` (TypeScript) + Playwright screenshot rendering (visual) |
| **Config file** | `tsconfig.json` (TS), `playwright.config.ts` (rendering — to be wired in this phase OR re-used from existing dev usage) |
| **Quick run command** | `cd ~/postcanary/client && npx vue-tsc --noEmit` |
| **Full suite command** | `npx vue-tsc --noEmit && npm run render-postcard-preview` (Playwright script that loads `/dev/postcard-preview`, sets Desert Diamond data, and writes a PNG) |
| **Estimated runtime** | ~30 seconds for vue-tsc, ~15 seconds per Playwright render |

**Critical:** No client-side unit test runner exists in the project (Vitest is NOT wired). Wiring it is OUT OF SCOPE for Phase 2 — see RESEARCH.md technical risks.

---

## Sampling Rate

- **After every task commit:** Run `npx vue-tsc --noEmit` (must exit 0)
- **After every visual task commit:** Re-render Desert Diamond through `/dev/postcard-preview` and produce a fresh PNG
- **After every wave:** Walk through the 44 patterns in `02-RESEARCH.md` § "Universal Patterns" and mark each as ✅ / ⏳ / ❌ against the latest render
- **Before `/gsd-verify-work`:** Drake-eye signoff on the final Desert Diamond render. No exceptions.
- **Max feedback latency:** ~45 seconds (vue-tsc + render + visual review)

---

## Per-Task Verification Map

This map will be populated by the planner. Each task in `02-PLAN.md` should produce 1-3 rows here:

| Task ID | Plan | Wave | Requirement | Pattern Refs | Acceptance | Test Type | Command | Status |
|---------|------|------|-------------|--------------|------------|-----------|---------|--------|
| 02-01-01 | 01 | 1 | TMPL-04, TMPL-05 | P-01, P-02, P-04 | (per task) | manual visual | `npx vue-tsc --noEmit && playwright render` | ⬜ pending |

**Status legend:** ⬜ pending · ✅ green · ❌ red · ⚠️ flaky

**Visual tasks** (Draplin gate work, color block treatment, logo wordmark, trust badges) use **manual visual** verification — render the result, eyeball against pattern list, mark pass/fail. Drake's eye is the final gate.

**Type-check tasks** (TypeScript, prop threading) use `vue-tsc --noEmit` with `exit_code: 0` as the acceptance.

---

## Wave 0 Requirements

- [ ] **Reference assets:** Download real BBB / Angi / HomeAdvisor SVG or PNG logos to `~/postcanary/client/src/assets/trust-badges/` (per CONTEXT.md D-13). Without these, the trust badge rebuild can't happen.
- [ ] **Manual logo seed:** Manually grab desertdiamondhvac.com's actual logo image, store in dev DB brand kit JSONB for org `549e9d08-c287-420f-b191-e879ee08e23b` (per CONTEXT.md D-10). Without this, the demo render shows the wordmark fallback instead of the real logo.
- [ ] **Hero photo selection:** From the 13 already-scraped Desert Diamond photos, identify which one (worker / technician / homeowner — per CONTEXT.md D-11) becomes the demo hero. Update brand kit JSONB to point to it.
- [ ] **Playwright dev render command:** Wire a one-shot `npm run render-postcard-preview` script that boots Vite dev server, opens `/dev/postcard-preview`, injects Desert Diamond form values, and writes PNG to `~/postcanary/client/demo-smoke-test-2026-04-DD/desert-diamond-FRONT.png` and `-BACK.png`. (Reuse existing Playwright + injection script from session handoff §6.4.)

*If existing infrastructure is already sufficient: planner notes which Wave 0 items are no-ops and why.*

---

## Manual-Only Verifications

For this phase, the bulk of verification is manual visual review. This is honest about the nature of visual work.

| Behavior | Pattern Refs | Why Manual | Test Instructions |
|----------|--------------|------------|-------------------|
| Postcard "looks like real pro direct mail" | All 44 patterns | Visual taste cannot be unit-tested. Drake's eye is the only signoff that matters per CONTEXT.md (Drake's stated criterion). | After all tasks complete: render final Desert Diamond card via Playwright, open in Drake's Explorer alongside `ref-postcardmania-hvac-gallery-row1.png` and `ref-mailshark-oversized-2.png`. Drake confirms or rejects. |
| Draplin aesthetic (border-radius: 0, no soft shadows, color blocks > whitespace) | P-01, P-04, P-05, P-09 | These rules are CSS-grep-able BUT the result needs visual confirmation that the rule reads as intended | After each visual task: `grep -c "rounded\|shadow-soft\|whitespace-" src/components/postcard/PostcardFront.vue` (target: 0 violations) AND visually verify the render |
| Z-pattern enforcement (logo top-left → credibility top-right → headline bottom-left → phone bottom-right) | P-12 | Eye-flow can't be unit-tested. Position can be grep-checked but reading-flow can't. | Visual: render the front, verify each element is in its Z-pattern slot. Use a printed thumbnail held at arm's length if possible. |
| Logo wordmark fallback renders correctly when scrape returns empty | P-25, P-26 | Requires actually triggering the empty-logo case in the dev route | Set `brandKit.logoUrl = ''` in dev route form, render, verify wordmark pill appears with business name in brand-color background |
| Real BBB / Angi / HomeAdvisor trust badges render with correct brand colors | P-30, P-31, P-32 | Visual identification of brand colors | Render back, visually confirm BBB navy + Angi orange + HomeAdvisor green. Compare against a Google Image Search of "BBB logo" / "Angi logo" / "HomeAdvisor logo" to ensure the colors are correct. |

---

## Validation Sign-Off

- [ ] All tasks in `02-PLAN.md` have either: (a) automated `vue-tsc --noEmit` verification, or (b) manual visual verification step in their acceptance criteria
- [ ] Sampling continuity: no 3 consecutive tasks without at least a `vue-tsc` check (TS regressions caught fast)
- [ ] Wave 0 reference assets (BBB/Angi/HA logos) downloaded BEFORE Wave 1 starts
- [ ] Wave 0 manual seeds (Desert Diamond logo + hero photo) populated in dev DB BEFORE final render
- [ ] No watch-mode flags in any test command
- [ ] Feedback latency < 60 seconds per task
- [ ] Drake-eye signoff on the final render is the gate before phase declared complete (REQUIRED — no automation can substitute)
- [ ] `nyquist_compliant: true` set in frontmatter ONLY after the planner has produced a per-task verification map and the orchestrator has reviewed it

**Approval:** pending

---

## Note on Nyquist compliance for visual phases

Standard Nyquist validation assumes unit-test-driven sampling. Visual work doesn't fit cleanly. We mark this phase `nyquist_compliant: false` honestly rather than fake it. The validation IS rigorous — it's just manual + pattern-driven instead of unit-test-driven. Future phases that touch business logic (Phase 3 Designs Library, etc.) should return to standard Nyquist compliance.

The 44 patterns in `02-RESEARCH.md` ARE the test fixtures for this phase. Each one is grep-able or visually-verifiable. The pattern checklist takes the place of a unit test suite for visual quality.

---

*Validation strategy authored: 2026-04-09*
*Per Phase 2 GSD discuss + research workflow*

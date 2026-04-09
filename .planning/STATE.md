# PostCanary — GSD Project State

> 🛑 **READ THIS FIRST:** Before running any tool, read `.planning/phases/02-template-upgrades-ux-polish-google-reviews-oauth/.continue-here.md` **in full**. It contains BLOCKING anti-patterns from Session 33 that you MUST acknowledge before proceeding. Drake's main concern at the end of Session 33 was that things would fall through the cracks on session handoff. The `.continue-here.md` file is the structural defense against that.

**Project:** PostCanary Design Studio Round 2
**Last Activity:** 2026-04-09 (Session 33)
**Current Phase:** 2 — Template Upgrades + UX Polish + Google Reviews OAuth
**Next Command:** `/gsd-execute-phase 2` — BUT read `.continue-here.md` first

---

## Status

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | AI Generation + Website Scraping | Complete (executed in Sessions 28-29 outside GSD) | — |
| **2** | **Template Upgrades + UX Polish + Google Reviews OAuth** | **Ready to execute** | **4** |
| 3 | Designs Library + Custom Upload | Pending | 0 |

---

## Phase 2 — Ready to Execute

**Branch:** `feat/design-studio-r2`

**Scope (narrowed during discuss-phase from original Phase 2):**
- IN: Visual rebuild of 1 layout (Full-Bleed Photo) for Desert Diamond HVAC demo
- OUT (deferred to Phase 2.5 post-demo): UXP-01-04, GREV-01/02/06, the other 5 layouts

**Demo deadline:** 2026-04-20 (~11 days from this state write)

**Plans:**
- `02-01-PLAN.md` — Wave 0 (asset acquisition + demo seeds + Playwright render script) — 5 tasks, ~2 hrs, autonomous: false
- `02-02-PLAN.md` — Wave 1 (Draplin tokens + template filter + wordmark normalizer) — 4 tasks, ~2 hrs
- `02-03-PLAN.md` — Wave 2 (component rewrites, references CLOSED) — 8 tasks, ~8 hrs
- `02-04-PLAN.md` — Wave 3 (pattern validation + lawyer test + Drake signoff) — 4 tasks, ~2 hrs

**Total:** 4 plans, 21 tasks, 14 estimated hours

**Plan-checker verdict:** PASSED (10/10 dimensions, 0 critical/major issues, 4 minor warnings noted in checker output)

**Next command:** `/gsd-execute-phase 2`

---

## Session 33 Activity (2026-04-09)

**What happened:**
1. Drake caught visual quality failure on existing templates — they look like SaaS components, not direct mail
2. Three near-miss IP/scope failures caught by Drake's pushback (almost copied competitor templates, almost created duplicate phase, almost shipped without reading docs)
3. Phase 2 discuss-phase ran — narrowed scope to visual rebuild only, locked 31 decisions (D-01 to D-31)
4. Phase 2 research ran — produced 02-RESEARCH.md with 44 universal patterns + 13-file codebase map + 19-item gap table
5. Phase 2 planning ran — produced 4 plans across 4 waves with IP firewall enforcement
6. Phase 2 plan-checker ran — VERIFICATION PASSED on all 10 dimensions

**Drake-memory corrections stored this session:**
- ID 130 — Logo missing was P0 not P1
- ID 131 — Expert activation protocol mandatory
- ID 132 — Rebuild not patch when visual gap is fundamental
- ID 133 — IP/copyright dividing line (pattern extraction legal, layout cloning not)
- ID 134 — Always check existing GSD planning state first
- ID 135 — Banned acknowledgment openers in responses

**Commits this session (on `feat/design-studio-r2`):**
- `b6cdbe9` feat(06-audit-P0-v2): visual loop close-out + §202.5.3 partial + content density hooks (pre-discuss)
- `06568d3` fix(06-audit-P0-v2): fit PostcardBack inside 6" card height (pre-discuss)
- `c5aed16` docs(02): capture phase context (discuss mode)
- `431c340` docs(state): record phase 2 context session (incidentally cleaned stale STATE.md)
- `d16071a` docs(02): research with universal patterns + codebase map
- `4f56f71` docs(02): add validation strategy
- `9714ebb` feat(02): plans for visual rebuild — 4 plans, 4 waves, IP firewall enforced

---

## Open Items

- **Wave 0 Drake input needed:** Trust badge artwork acquisition (BBB / Angi / HomeAdvisor SVG/PNG download), Desert Diamond logo manual seed, hero photo selection. These all require Drake to either provide assets or confirm pick from the 13 scraped photos.
- **VALIDATION.md per-task table is sparse** (cosmetic) — every task has inline acceptance criteria, the central table is supplementary
- **No Vitest wired** — visual validation is `vue-tsc --noEmit` + manual Playwright render comparison + Drake-eye signoff
- **`nyquist_compliant: false`** in VALIDATION.md (honest — visual work doesn't fit unit-test-driven Nyquist sampling)

---

*State authored: 2026-04-09 (Session 33, post plan-phase complete)*

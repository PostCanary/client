# Phase 2: Template Upgrades + UX Polish + Google Reviews OAuth — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in `02-CONTEXT.md` — this log preserves the discussion path.

**Date:** 2026-04-09 (Session 33)
**Phase:** 02-template-upgrades-ux-polish-google-reviews-oauth
**Mode:** Standard interactive discuss-phase
**Areas analyzed:** Layout scope, Aesthetic non-negotiables, Logo & photo treatment, Trust badge style

---

## Session Context

This discuss-phase ran inside a multi-hour Session 33 that spent the first ~2 hours uncovering and storing critical corrections about visual quality (drake-memory IDs 130, 131, 132, 133, 134, 135). The phase context was loaded from:
- `~/.claude/projects/C--Users-drake/memory/postcanary-v1-build-decisions.md` (lines 574-1147 — Design Studio spec)
- `~/.claude/projects/C--Users-drake/memory/postcanary.md` (expert roster)
- `~/postcanary/client/visual-taste-audit-2026-04-09.md` (12-item gap list)
- `~/postcanary/client/visual-gap-list-2026-04-10.md` (post-Session 32 v2)
- `~/postcanary/client/research-usps-dmm-201-clear-zones-2026-04-09.md`
- `~/postcanary/coding-briefs/06-design-studio-r2-extraction-templates.md`
- `~/postcanary/planning/06-design-studio-r2-expert-review.md`
- `~/postcanary/sessions/handoff-2026-04-09-to-2026-04-10-evening.md`

## Triggering Event

Drake looked at the current 6 templates side-by-side with Mail Shark / PostcardMania references and said: "gross, our templates look nothing like the good ones on mail companies websites. looks like youve never seen a postcard before." This forced a corrected Phase 2 framing — not "patch existing templates" (Claude's first proposal), not "copy a Mail Shark layout" (Claude's second proposal, blocked by IP law and V1 spec lines 968-973), but "build PostCanary-original templates that exhibit universal direct-mail patterns extracted from reference study."

## Pre-Discussion Scope Decision (Option B)

Before the formal discuss-phase ran, Drake was given three Phase 2 scope options:
- (A) Tackle all three Phase 2 components (visual rebuild + UXP-01-04 + GREV-01/02/06)
- (B) Visual rebuild only for demo, defer UXP + OAuth to Phase 2.5 post-demo *(Drake selected this)*
- (C) Visual rebuild scoped to 1-2 layouts + UXP + OAuth

Drake selected (B). This narrowed Phase 2's effective scope before any gray areas were analyzed.

## Gray Areas Presented (4)

| # | Area | Selected for deep discussion? | Disposition |
|---|---|---|---|
| 1 | Layout scope | **Yes** (Drake selected) | Discussed in detail (3 sub-questions) |
| 2 | Aesthetic non-negotiables | No | Locked via recommendation |
| 3 | Desert Diamond logo & photo | No | Locked via recommendation |
| 4 | Trust badge style | No | Locked via recommendation |

## Questions Presented & Answers Given

### Area: Layout scope (deep discussion)

**Q1: How many of the 6 postcard layouts should we rebuild to demo quality?**
- Options:
  - 1 layout, perfect (Recommended) — Just Full-Bleed Photo, ~6-9 hrs, lowest risk
  - 2 layouts, both excellent — Full-Bleed Photo + alternate, ~10-14 hrs
  - All 6 layouts to demo quality — original Phase 2 scope, ~18-24 hrs, high risk of underdelivery
- **Drake selected:** 1 layout, perfect (Recommended)

**Q2: What happens to the layouts we don't rebuild for the demo?**
- Options:
  - Hide from template browser (Recommended) — filtered out of customer picker, code stays
  - Show with 'Coming Soon' badge — visible but disabled, shows roadmap visually
  - Leave them as-is — risk of demo viewers seeing unfinished layouts
- **Drake selected:** Hide from template browser (Recommended)

**Q3: For the demo render, do we need to show range (multiple businesses or layouts)?**
- Options:
  - One perfect render: Desert Diamond (Recommended) — single artifact, DHH-aligned
  - Desert Diamond + 1 other business — show non-HVAC range, ~2 extra hrs
  - Desert Diamond rendered in 2-3 different layouts — shows visual range from one business
- **Drake selected:** One perfect render: Desert Diamond (Recommended)

### Areas Locked via Recommendation (no deep discussion)

**Aesthetic non-negotiables — Recommendation locked:**
- Full Draplin gate: `border-radius: 0px` everywhere, no soft drop shadows, color blocks > whitespace, SUCCESs check 5/6 minimum, Z-pattern enforced on every front layout
- Reasoning: Drake's "looks SaaS not direct-mail" verdict requires hard enforcement, not soft suggestions. Draplin's "not minimalist" line was the philosophy I missed when shipping the original templates.

**Desert Diamond logo & photo — Recommendation locked:**
- Logo: text wordmark in solid brand-color filled pill (universal fallback) + manually-grabbed real logo from desertdiamondhvac.com (demo seed)
- Photo: select a worker/technician/homeowner photo from the 13 already-scraped Desert Diamond photos (NOT the loyalty graphic that's currently rendered)
- Photo priority: people > completed work > equipment > abstract brand graphics
- Reasoning: V1 spec element fallback chain table (lines 1112-1120) explicitly names text wordmark as fallback 2. Real photo is a Drake correction (current loyalty graphic = no emotional pull).

**Trust badge style — Recommendation locked:**
- Use real BBB / Angi / HomeAdvisor brand artwork — filled, real brand colors (BBB navy, Angi orange #F26B2C, HomeAdvisor green)
- Legal basis: nominative fair use — they identify the business's actual third-party certifications, which is the textbook nominative use case
- Document the legal rationale in TrustBadges.vue source comments for auditability
- Reasoning: Outlined boxes don't match the references; filled facsimiles are weaker than real logos; real logos are legally OK as nominative reference. Drake recommendation accepted.

## Scope Creep Avoided

- Drake at one point asked "can we just copy the templates from mail company websites" — caught by IP awareness (drake-memory ID 133) and the V1 spec's "Templates Are NOT Copied" rule. Reframed as pattern extraction with 3-phase legal-firewall (Phase A study → Phase B build with references closed → Phase C category check).
- Several specific UI features (Why This Design Works panel, photo confirmation checkbox, Google OAuth) were explicitly deferred to Phase 2.5, not silently dropped.

## Deferred Ideas Captured

See `<deferred>` section of `02-CONTEXT.md` — full list with reasoning.

## Decisions Auto-Resolved

None — Drake explicitly answered all 3 layout scope questions and all 3 recommendation-locked areas were presented for affirmative or override choice (not auto-applied without his knowledge).

## Discussion Mode Notes

- Standard interactive discuss-phase, NO `--auto`, NO `--batch`, NO `--analyze`
- Single AskUserQuestion call for area selection (multiSelect with 4 options)
- Single AskUserQuestion call for layout scope deep-dive (3 questions in one call)
- Total Drake interactions: 2 AskUserQuestion turns
- Drake-memory corrections stored DURING discuss-phase: ID 134 (check planning state first), ID 135 (banned acknowledgment openers)

---

*Discussion log written: 2026-04-09*
*Session: 33*

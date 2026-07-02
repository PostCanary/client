---
phase: 2
plan: 03
title: "Wave 2 — Full-Bleed Front + Back Component Rewrites (References CLOSED)"
status: complete
started: 2026-04-10
completed: 2026-04-10
---

# Plan 02-03 Summary

## What was built

Wave 2 rewrote every component that renders on the Desert Diamond Full-Bleed Photo card, applying the 44 universal patterns from 02-RESEARCH.md. **IP firewall Phase B held: zero reference PNGs were opened during this wave.** All work was built against the pattern rules and the exact CSS values in 02-03-PLAN.md.

### Component changes

1. **TrustBadges.vue** — full rewrite. Outlined text pills → filled brand-color blocks (BBB #003087, Angi #F26B2C, HomeAdvisor #F7931E). Imports SVG assets from trust-badges/. borderRadius: var(--pc-radius) = 0. No borders. (P-14, P-30, P-36)
2. **OfferBadge.vue** — shadow fix. Soft grey rgba shadows → var(--pc-shadow-brand) hard 3pt offset on both burst and ribbon variants. Circular 50% radius preserved on burst (intentional exception). (D-05, P-38)
3. **OfferBox.vue** — deadline urgency bar. Dashed separator + plain body text → full-width bold accent-color bar with uppercase 12pt 800-weight inside the Johnson Box. Added accentColor prop. Explicit borderRadius: var(--pc-radius) on outer container. (P-13, P-43, D-04)
4. **CTABox.vue** — CTA label-phone integration. "CALL NOW" label: opacity 0.85 + 0.04in gap → opacity 1, underlined, zero gap with phone. QR pad radius 2pt → var(--pc-radius). Outer container explicit var(--pc-radius). (P-28, D-04)
5. **RatingBadge.vue** — audit only. Zero violations found. Audit note added. No code changes.
6. **PostcardFront.vue** — full-bleed branch rewrite + wordmark fallback. Removed rounded-lg from .pc-card wrapper (all 6 layouts). Full-bleed: gradient overlay → solid dark bottom bar + 0.4in gradient blend above. Phone: small rounded pill → full-width brand-primary bar. Logo fallback: raw text span → solid brand-color filled rectangle with 14pt 900-weight uppercase. showWordmarkFallback computed added. (G-F1 through G-F6, P-01 through P-10, P-27, P-29, D-08, D-09)
7. **PostcardBack.vue** — wrapper fix. Removed rounded-lg + border-gray-200 from wrapper. Removed border-gray-100 hairline under return address. Permit indicia: 0.5pt #999 → 1pt brand-primary. Wired :accent-color="accent" to OfferBox for deadline bar. (G-B1, P-36, P-37, P-18)
8. **Draplin sweep** — grep sweep across all 7 card-surface files. Zero remaining Tailwind `rounded` classes on card surface (present only in the 5 untouched layout branches per D-01 scope). Zero soft grey shadows. Fresh render captured.

## Key files

### Modified
- `src/components/design/TrustBadges.vue` (full rewrite)
- `src/components/design/OfferBadge.vue` (2-line shadow fix)
- `src/components/design/OfferBox.vue` (deadline rewrite + accentColor prop)
- `src/components/design/CTABox.vue` (label integration + border-radius)
- `src/components/design/RatingBadge.vue` (audit comment only)
- `src/components/postcard/PostcardFront.vue` (full-bleed branch rewrite + wordmark)
- `src/components/postcard/PostcardBack.vue` (wrapper + indicia + accent-color wiring)

## Commits

| Hash | Subject |
|------|---------|
| 69af746 | feat(02-03-01): rewrite TrustBadges.vue — filled brand-color blocks |
| c404da5 | fix(02-03-02): replace soft grey shadows on OfferBadge with brand shadow |
| 06c365c | feat(02-03-03): rewrite OfferBox deadline as urgency bar (P-13/P-43) |
| cd37d50 | feat(02-03-04): integrate CTA label with phone + zero border-radius |
| e320848 | docs(02-03-05): audit RatingBadge.vue — Draplin compliant, no changes needed |
| 2c262d8 | feat(02-03-06): rewrite PostcardFront full-bleed branch + wordmark fallback |
| d1e126f | feat(02-03-07): apply Draplin wrapper fix to PostcardBack.vue |

## Notable deviations

1. **Task 02-03-08 produced no commit** — it is a verification-only sweep. The grep checks passed (zero violations). Fresh render captured via MCP Playwright.
2. **5 other layout branches in PostcardFront.vue still have Tailwind `rounded` classes** — this is expected and correct per D-01 (only full-bleed rebuilt) and D-02 (other layouts hidden from customer browser). They are NOT card-surface violations for Phase 2 scope.
3. **npm node_modules corruption required tailwindcss reinstall** during render capture. The `--force` install resolved it. This is a machine-level issue, not a code issue.

## IP Firewall Compliance

**Phase B (BUILD) — references CLOSED: CONFIRMED.**

Zero files from `~/postcanary/client/visual-audit-2026-04-09/` were opened via Read tool, Bash cat, or any other mechanism during Wave 2 execution. All CSS values, dimensions, and patterns were sourced exclusively from:
- 02-RESEARCH.md §Universal Patterns (P-01 through P-44)
- 02-03-PLAN.md task action blocks (exact inline style values)
- 02-CONTEXT.md decisions D-04 through D-09
- print-scale.css Draplin tokens (added in Wave 1)

## Self-Check: PASSED

- [x] TrustBadges.vue: zero `1pt solid` outlines, all borderRadius = var(--pc-radius), 3 SVG asset imports
- [x] OfferBadge.vue: zero rgba soft shadows, 2 var(--pc-shadow-brand) refs, 50% burst radius preserved
- [x] OfferBox.vue: zero `1pt dashed`, accentColor prop, 2 var(--pc-radius) refs
- [x] CTABox.vue: zero `borderRadius: '2pt'`, zero `opacity: 0.85`, 3 var(--pc-radius) refs
- [x] RatingBadge.vue: zero rounded/shadow violations
- [x] PostcardFront.vue: zero `rounded-lg`, showWordmarkFallback computed, 3+ var(--pc-overlay-bar-h) refs, all 5 other layouts still present
- [x] PostcardBack.vue: zero `rounded-lg`, zero `border-gray-200`, zero `border-gray-100`, zero `0.5pt solid #999`, accent-color wired
- [x] vue-tsc --noEmit exits 0
- [x] Fresh render PNGs captured (desert-diamond-FRONT-wave2.png + BACK-wave2.png)
- [x] Zero reference PNGs opened during Wave 2 (IP firewall held)

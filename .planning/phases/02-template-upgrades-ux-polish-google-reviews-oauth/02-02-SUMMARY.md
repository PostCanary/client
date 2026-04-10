---
phase: 2
plan: 02
title: "Wave 1 — Draplin Tokens + Layout Filter + Wordmark Normalizer"
status: complete
started: 2026-04-10
completed: 2026-04-10
---

# Plan 02-02 Summary

## What was built

Wave 1 laid the foundation tokens and infrastructure that every Wave 2 component rewrite depends on:

1. **Draplin aesthetic tokens in print-scale.css** — `--pc-radius: 0`, `--pc-shadow-soft: none`, `--pc-shadow-brand: 3pt 3pt 0 rgba(0,0,0,0.4)`, `--pc-overlay-bar-h: 36%`, trust badge fill tokens (BBB navy, Angi orange, HomeAdvisor orange, generic brand-primary). USPS columns untouched at 5.5in/3.0in (RISK-01 deferred).
2. **DEMO_VISIBLE_LAYOUTS filter** — `templates.ts` exports `DEMO_VISIBLE_LAYOUTS: ["full-bleed"]` and `getTemplateSetsForGoal()` now filters through it. Customer template browser shows only Full-Bleed Photo; other 5 layouts stay in ALL_TEMPLATES for code/dev-route compatibility.
3. **TemplateBrowser.vue verification** — confirmed the filter propagates automatically via the existing `getTemplateSetsForGoal()` call. No code change needed in the component.
4. **normalizeLogoUrl export** — `usePostcardGenerator.ts` now exports a `normalizeLogoUrl(raw: unknown): string | null` function that normalizes empty strings and undefined to null, ensuring consistent wordmark fallback triggering in PostcardFront.vue.

## Key files

### Modified
- `src/styles/print-scale.css` (63 lines added — Draplin tokens block)
- `src/data/templates.ts` (DEMO_VISIBLE_LAYOUTS + filter in getTemplateSetsForGoal)
- `src/composables/usePostcardGenerator.ts` (normalizeLogoUrl export)

## Commits

| Hash | Subject |
|------|---------|
| d62e016 | feat(02-02-01): extend print-scale.css with Draplin aesthetic tokens |
| 909cc3e | feat(02-02-02): add DEMO_VISIBLE_LAYOUTS filter to templates.ts |
| cb353ca | feat(02-02-04): export normalizeLogoUrl from usePostcardGenerator |

## Notable deviations

1. **Task 02-02-03 produced no commit** — it is a verification-only task confirming TemplateBrowser.vue picks up the D-02 filter without code changes. Verified: the component calls `getTemplateSetsForGoal()` at line 16, which now internally filters to DEMO_VISIBLE_LAYOUTS.

## Self-Check: PASSED

- [x] `--pc-radius: 0` exists in print-scale.css
- [x] `--pc-shadow-soft: none` exists in print-scale.css
- [x] `--pc-shadow-brand` exists in print-scale.css
- [x] Trust badge fill tokens (bbb/angi/ha/generic) exist in print-scale.css
- [x] USPS columns unchanged (5.5in / 3.0in)
- [x] DEMO_VISIBLE_LAYOUTS declared and used in templates.ts (3 references)
- [x] normalizeLogoUrl exported from usePostcardGenerator.ts
- [x] vue-tsc --noEmit exits 0
- [x] 3 commits on feat/design-studio-r2 containing "02-02" in message
